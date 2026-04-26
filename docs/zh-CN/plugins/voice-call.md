---
read_when:
    - 你想从 OpenClaw 发起一个外呼语音通话
    - 你正在配置或开发语音通话插件
    - 你需要在电话通信中使用实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 发起外呼并接听来电，并可选择使用实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-26T05:46:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

通过插件为 OpenClaw 提供语音通话。支持外呼通知、多轮对话、全双工实时语音、流式转录，以及带 allowlist 策略的来电接听。

**当前提供商：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（开发 / 无网络）。

<Note>
语音通话插件运行**在 Gateway 网关进程内部**。如果你使用远程 Gateway 网关，请在运行 Gateway 网关的机器上安装并配置该插件，然后重启 Gateway 网关以加载它。
</Note>

## 快速开始

<Steps>
  <Step title="安装插件">
    <Tabs>
      <Tab title="从 npm 安装（推荐）">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="从本地文件夹安装（开发）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    之后重启 Gateway 网关，使插件被加载。

  </Step>
  <Step title="配置提供商和 webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整结构见下方的[配置](#configuration)）。至少需要设置：`provider`、提供商凭证、`fromNumber`，以及一个可从公网访问的 webhook URL。
  </Step>
  <Step title="验证设置">
    ```bash
    openclaw voicecall setup
    ```

    默认输出在聊天日志和终端中都易于阅读。它会检查插件是否已启用、提供商凭证、webhook 暴露情况，以及是否只启用了一个音频模式（`streaming` 或 `realtime`）。脚本场景可使用 `--json`。

  </Step>
  <Step title="冒烟测试">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是空跑。添加 `--yes` 可真正发起一次简短的外呼通知电话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析为一个**公网可访问的 webhook URL**。如果 `publicUrl`、隧道 URL、Tailscale URL 或 serve 回退地址解析为 loopback 或私有网络地址空间，设置将失败，而不是启动一个无法接收运营商 webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true`，但所选提供商缺少凭证，Gateway 网关启动日志会记录一条“设置未完成”警告，列出缺失的键，并跳过运行时启动。命令、RPC 调用和智能体工具在被使用时，仍会返回确切缺失的提供商配置。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 或者 Twilio 的 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Mission Control Portal 的 Telnyx webhook 公钥
            // （Base64；也可通过 TELNYX_PUBLIC_KEY 设置）。
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 服务器
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 安全性（推荐用于隧道 / 代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公网暴露方式（任选一种）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 参见“流式转录” */ },
          realtime: { enabled: false /* 参见“实时语音” */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="提供商暴露与安全说明">
    - Twilio、Telnyx 和 Plivo 都要求一个**公网可访问**的 webhook URL。
    - `mock` 是本地开发提供商（不发起网络调用）。
    - 除非 `skipSignatureVerification` 为 true，否则 Telnyx 要求设置 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费套餐上，请将 `publicUrl` 设置为精确的 ngrok URL；签名校验始终会强制执行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许 Twilio webhook 使用无效签名。仅用于本地开发。
    - Ngrok 免费套餐 URL 可能变化，或增加中间拦截行为；如果 `publicUrl` 漂移，Twilio 签名校验会失败。生产环境中，优先使用稳定域名或 Tailscale funnel。
  </Accordion>
  <Accordion title="流式连接上限">
    - `streaming.preStartTimeoutMs` 会关闭那些始终未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections` 限制未经认证、启动前套接字的总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 未经认证、启动前套接字的数量。
    - `streaming.maxConnections` 限制所有已打开媒体流套接字的总数（待启动 + 活跃）。
  </Accordion>
  <Accordion title="旧版配置迁移">
    旧配置中使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键名的情况，可通过 `openclaw doctor --fix` 重写。运行时回退当前仍接受旧的 voice-call 键，但推荐的重写路径是 `openclaw doctor --fix`，兼容垫片只是临时方案。

    自动迁移的流式键名：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 实时语音对话

`realtime` 选择一个用于实时通话音频的全双工实时语音提供商。它不同于 `streaming`，后者只会将音频转发给实时转录提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 同时使用。每个通话只能选择一种音频模式。
</Warning>

当前运行时行为：

- `realtime.enabled` 支持用于 Twilio Media Streams。
- `realtime.provider` 是可选项。如果未设置，语音通话将使用第一个已注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供商插件注册。
- 提供商原始配置位于 `realtime.providers.<providerId>` 下。
- 语音通话默认会暴露共享的 `openclaw_agent_consult` 实时工具。当来电者需要更深入的推理、当前信息或常规 OpenClaw 工具时，实时模型可以调用它。
- 如果 `realtime.provider` 指向一个未注册的提供商，或根本没有注册任何实时语音提供商，语音通话会记录一条警告，并跳过实时媒体，而不是让整个插件失败。
- consult 会话键会优先复用现有语音会话；如果不可用，则回退为来电 / 被叫电话号码，以便后续 consult 调用在通话期间保持上下文。

### 工具策略

`realtime.toolPolicy` 控制 consult 运行：

| 策略 | 行为 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露 consult 工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner` | 暴露 consult 工具，并允许常规智能体使用普通的智能体工具策略。 |
| `none` | 不暴露 consult 工具。自定义 `realtime.tools` 仍会透传给实时提供商。 |

### 实时提供商示例

<Tabs>
  <Tab title="Google Gemini Live">
    默认值：API 密钥来自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型为 `gemini-2.5-flash-native-audio-preview-12-2025`；语音为 `Kore`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "简短回答。使用更深入的工具前先调用 openclaw_agent_consult。",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

有关提供商特定的实时语音选项，请参见 [Google provider](/zh-CN/providers/google) 和 [OpenAI provider](/zh-CN/providers/openai)。

## 流式转录

`streaming` 选择一个用于实时通话音频的实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选项。如果未设置，语音通话将使用第一个已注册的实时转录提供商。
- 内置实时转录提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的提供商插件注册。
- 提供商原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向一个未注册的提供商，或根本没有注册任何提供商，语音通话会记录一条警告，并跳过媒体流传输，而不是让整个插件失败。

### 流式提供商示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API 密钥为 `streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`；模型为 `gpt-4o-transcribe`；`silenceDurationMs: 800`；`vadThreshold: 0.5`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // 如果已设置 OPENAI_API_KEY，则可选
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    默认值：API 密钥为 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；端点为 `wss://api.x.ai/v1/stt`；编码为 `mulaw`；采样率为 `8000`；`endpointingMs: 800`；`interimResults: true`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // 如果已设置 XAI_API_KEY，则可选
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## 通话的 TTS

语音通话在通话中使用核心 `messages.tts` 配置来进行流式语音播放。你可以在插件配置下用**相同的结构**覆盖它——它会与 `messages.tts` 深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**语音通话会忽略 Microsoft speech。** 电话音频需要 PCM；当前的 Microsoft 传输不提供电话所需的 PCM 输出。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- 当启用了 Twilio 媒体流时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已处于活动状态，语音通话不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，播放请求会失败，而不是混用两种播放路径。
- 当电话 TTS 回退到次级提供商时，语音通话会记录一条包含提供商链（`from`、`to`、`attempts`）的警告，便于调试。
- 当 Twilio barge-in 或流关闭清空待处理的 TTS 队列时，排队中的播放请求会结束，而不会让等待播放完成的来电者一直挂起。

### TTS 示例

<Tabs>
  <Tab title="仅核心 TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="覆盖为 ElevenLabs（仅通话）">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI 模型覆盖（深度合并）">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## 来电

来电策略默认是 `disabled`。要启用来电，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "你好！我能帮你什么？",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是一种低保障的主叫号码筛选。插件会对提供商给出的 `From` 值进行标准化，并将其与 `allowFrom` 进行比较。Webhook 验证能够认证提供商投递及负载完整性，但它**不能**证明 PSTN/VoIP 主叫号码的实际所有权。应将 `allowFrom` 视为主叫号码过滤，而不是强主叫身份认证。
</Warning>

自动回复使用智能体系统。可通过 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 进行调优。

### 口语化输出约定

对于自动回复，语音通话会向系统提示追加一个严格的口语化输出约定：

```text
{"spoken":"..."}
```

语音通话会以防御性方式提取语音文本：

- 忽略被标记为推理 / 错误内容的负载。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退为纯文本，并移除可能属于规划 / 元信息引导的前导段落。

这样可以让播放语音聚焦于面向来电者的文本，并避免将规划文本泄露到音频中。

### 对话启动行为

对于外呼 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 只有在初始问候语正在主动播放时，才会抑制 barge-in 队列清理和自动回复。
- 如果初始播放失败，通话会返回 `listening`，初始消息会保留在队列中以便重试。
- 对于 Twilio 流式传输，初始播放会在流连接建立时立即开始，无额外延迟。
- Barge-in 会中止当前播放，并清空已排队但尚未播放的 Twilio TTS 条目。被清空的条目会以已跳过状态结束，因此后续回复逻辑可以继续，而无需等待那些永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。语音通话**不会**为该初始消息发送旧版 `<Say>` TwiML 更新，因此外呼 `<Connect><Stream>` 会话会保持连接。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，语音通话会等待 **2000 ms** 后再自动结束通话：

- 如果流在该时间窗口内重新连接，将取消自动结束。
- 如果宽限期过后仍没有流重新注册，则会结束通话，以防出现卡住的活动通话。

## 过期通话清理器

使用 `staleCallReaperSeconds` 结束那些始终未收到终态 webhook 的通话（例如始终未完成的 notify 模式通话）。默认值是 `0`（禁用）。

推荐范围：

- **生产环境：** notify 风格流程建议设为 `120`–`300` 秒。
- 保持该值**高于 `maxDurationSeconds`**，以便正常通话可以完成。一个好的起始值是 `maxDurationSeconds + 30–60` 秒。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 安全性

当前面有代理或隧道位于 Gateway 网关之前时，插件会重建用于签名校验的公网 URL。以下选项控制信任哪些转发头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  来自转发头的 allowlist 主机名。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有 allowlist 的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求的远端 IP 匹配列表时，才信任转发头。
</ParamField>

附加保护：

- 针对 Twilio 和 Plivo，已启用 webhook **重放保护**。被重放的有效 webhook 请求会收到确认，但会跳过副作用处理。
- Twilio 对话轮次在 `<Gather>` 回调中包含每轮 token，因此过期 / 重放的语音回调无法满足较新的待处理转录轮次。
- 当缺少提供商要求的签名头时，未认证的 webhook 请求会在读取请求体之前被拒绝。
- voice-call webhook 在签名校验前使用共享的预认证请求体配置（64 KB / 5 秒），并施加每个 IP 的进行中请求上限。

使用稳定公网主机的示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "来自 OpenClaw 的问候"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "还有什么问题吗？"
openclaw voicecall speak --call-id <id> --message "请稍等"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。
使用 `--file <path>` 可指向其他日志文件，使用 `--last <n>` 可将分析限制为最近 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 p50/p90/p99。

## 智能体工具

工具名称：`voice_call`。

| 操作 | 参数 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

此仓库附带对应的技能文档：`skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

| 方法 | 参数 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## 相关内容

- [Talk mode](/zh-CN/nodes/talk)
- [Text-to-speech](/zh-CN/tools/tts)
- [Voice wake](/zh-CN/nodes/voicewake)
