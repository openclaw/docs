---
read_when:
    - 你想从 OpenClaw 发起外呼语音通话
    - 你正在配置或开发 voice-call 插件
    - 你需要在电话通信中使用实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 发起外呼并接听来电，可选启用实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-27T06:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd99495159acbf1d520eed9adca19801f012adcd902a5d826a3d5f6f7b5a26b1
    source_path: plugins/voice-call.md
    workflow: 15
---

适用于 OpenClaw 的语音通话插件，通过插件提供。支持外呼通知、多轮对话、全双工实时语音、流式转录，以及带 allowlist 策略的来电接听。

**当前提供商：** `twilio`（Programmable Voice + Media Streams）、`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput speech）、`mock`（开发/无网络）。

<Note>
Voice Call 插件**运行在 Gateway 网关进程内部**。如果你使用远程 Gateway 网关，请在运行 Gateway 网关的机器上安装并配置该插件，然后重启 Gateway 网关以加载它。
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

    之后重启 Gateway 网关，以便加载插件。

  </Step>
  <Step title="配置 provider 和 webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整结构见下方的 [配置](#configuration)）。至少需要设置：`provider`、provider 凭证、`fromNumber`，以及一个可从公网访问的 webhook URL。
  </Step>
  <Step title="验证设置">
    ```bash
    openclaw voicecall setup
    ```

    默认输出便于在聊天日志和终端中阅读。它会检查插件是否启用、provider 凭证、webhook 暴露情况，以及是否只启用了一个音频模式（`streaming` 或 `realtime`）。脚本使用时可加上 `--json`。

  </Step>
  <Step title="冒烟测试">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    这两条命令默认都是演练运行。添加 `--yes` 才会真正发起一次简短的外呼通知电话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析为一个**公网 webhook URL**。如果 `publicUrl`、隧道 URL、Tailscale URL 或 serve 回退地址解析到 loopback 或私有网络地址空间，则设置会失败，而不是启动一个无法接收运营商 webhook 的 provider。
</Warning>

## 配置

如果 `enabled: true`，但所选 provider 缺少凭证，Gateway 网关启动时会记录一条设置未完成警告，列出缺失的键名，并跳过启动运行时。命令、RPC 调用和智能体工具在使用时仍会返回确切缺失的 provider 配置。

<Note>
voice-call 凭证支持 SecretRef。`plugins.entries.voice-call.config.twilio.authToken` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 会通过标准 SecretRef 接口解析；参见 [SecretRef credential surface](/zh-CN/reference/secretref-credential-surface)。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="provider 暴露与安全说明">
    - Twilio、Telnyx 和 Plivo 都要求一个**可从公网访问**的 webhook URL。
    - `mock` 是本地开发 provider（无网络调用）。
    - 除非 `skipSignatureVerification` 为 true，否则 Telnyx 要求设置 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费套餐上，将 `publicUrl` 设置为精确的 ngrok URL；签名验证始终强制启用。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许 Twilio webhook 使用无效签名。仅限本地开发。
    - Ngrok 免费套餐 URL 可能变化或增加中间页行为；如果 `publicUrl` 漂移，Twilio 签名会验证失败。生产环境中：优先使用稳定域名或 Tailscale funnel。

  </Accordion>
  <Accordion title="流式连接上限">
    - `streaming.preStartTimeoutMs` 会关闭那些始终未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections` 限制未经认证、启动前套接字的总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未经认证、启动前套接字数量。
    - `streaming.maxConnections` 限制所有已打开媒体流套接字的总数（待启动 + 活跃）。

  </Accordion>
  <Accordion title="旧版配置迁移">
    使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键名的旧配置，会由 `openclaw doctor --fix` 重写。当前运行时暂时仍接受旧的 voice-call 键名，但推荐的重写路径是 `openclaw doctor --fix`，该兼容垫片只是临时措施。

    自动迁移的 streaming 键名：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音 provider。它与 `streaming` 分离，后者只会将音频转发给实时转录 provider。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 同时使用。每次通话只能选择一种音频模式。
</Warning>

当前运行时行为：

- `realtime.enabled` 支持用于 Twilio Media Streams。
- `realtime.provider` 是可选项。如果未设置，Voice Call 会使用第一个已注册的实时语音 provider。
- 内置实时语音 provider：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的 provider 插件注册。
- provider 自有的原始配置位于 `realtime.providers.<providerId>`。
- Voice Call 默认公开共享的 `openclaw_agent_consult` 实时工具。当来电者需要更深入的推理、当前信息或常规 OpenClaw 工具时，实时模型可以调用它。
- 如果 `realtime.provider` 指向未注册的 provider，或者根本没有注册任何实时语音 provider，Voice Call 会记录一条警告并跳过实时媒体处理，而不是让整个插件失败。
- consult 会话键会在可用时复用现有语音会话，否则回退为来电/被叫电话号码，以便后续 consult 调用在通话期间保持上下文。

### 工具策略

`realtime.toolPolicy` 控制 consult 运行：

| 策略             | 行为                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公开 consult 工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公开 consult 工具，并让常规智能体使用正常的智能体工具策略。                                                      |
| `none`           | 不公开 consult 工具。自定义 `realtime.tools` 仍会透传给实时 provider。                               |

### 实时 provider 示例

<Tabs>
  <Tab title="Google Gemini Live">
    默认值：API key 来自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型为 `gemini-2.5-flash-native-audio-preview-12-2025`；语音为 `Kore`。

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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
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

有关 provider 特定的实时语音选项，请参见 [Google provider](/zh-CN/providers/google) 和 [OpenAI provider](/zh-CN/providers/openai)。

## 流式转录

`streaming` 为实时通话音频选择一个实时转录 provider。

当前运行时行为：

- `streaming.provider` 是可选项。如果未设置，Voice Call 会使用第一个已注册的实时转录 provider。
- 内置实时转录 provider：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的 provider 插件注册。
- provider 自有的原始配置位于 `streaming.providers.<providerId>`。
- 如果 `streaming.provider` 指向未注册的 provider，或者没有注册任何 provider，Voice Call 会记录一条警告并跳过媒体流传输，而不是让整个插件失败。

### 流式 provider 示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API key 为 `streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`；模型为 `gpt-4o-transcribe`；`silenceDurationMs: 800`；`vadThreshold: 0.5`。

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
    默认值：API key 为 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；端点为 `wss://api.x.ai/v1/stt`；编码为 `mulaw`；采样率为 `8000`；`endpointingMs: 800`；`interimResults: true`。

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

## 通话 TTS

Voice Call 在通话中使用核心 `messages.tts` 配置进行流式语音输出。你可以在插件配置下使用**相同的结构**覆盖它——它会与 `messages.tts` 进行深度合并。

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
**Microsoft speech 会被忽略，不用于语音通话。** 电话音频需要 PCM；当前的 Microsoft 传输层不提供适用于电话通信的 PCM 输出。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键名（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；已提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流时会使用核心 TTS；否则通话会回退到 provider 原生语音。
- 如果 Twilio 媒体流已处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，播放请求会失败，而不是混用两种播放路径。
- 当电话 TTS 回退到次级 provider 时，Voice Call 会记录一条警告，并带上 provider 链路（`from`、`to`、`attempts`）以便调试。
- 当 Twilio 的 barge-in 或流关闭清除了待处理 TTS 队列时，队列中的播放请求会正常结束，而不会让等待播放完成的来电者一直卡住。

### TTS 示例

<Tabs>
  <Tab title="仅使用核心 TTS">
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
  <Tab title="覆盖为 ElevenLabs（仅用于通话）">
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

## 来电接听

来电策略默认是 `disabled`。要启用来电，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 只是一个低保证级别的来电号码筛选。插件会对 provider 提供的 `From` 值进行标准化，然后与 `allowFrom` 比较。webhook 验证可以验证 provider 投递和载荷完整性，但**不能**证明 PSTN/VoIP 来电号码的归属权。请将 `allowFrom` 视为来电显示过滤，而不是强身份认证。
</Warning>

自动回复使用智能体系统。可通过 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 进行调整。

### 语音输出契约

对于自动回复，Voice Call 会在系统提示词后附加一个严格的语音输出契约：

```text
{"spoken":"..."}
```

Voice Call 会以防御式方式提取语音文本：

- 忽略被标记为推理/错误内容的载荷。
- 解析直接 JSON、带围栏的 JSON 或内联 `"spoken"` 键。
- 回退为纯文本，并移除可能属于规划/元信息前导段落的内容。

这样可以让语音播放专注于面向来电者的文本，避免将规划内容泄露到音频中。

### 对话启动行为

对于外呼 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 只有在初始问候语正在主动播报时，才会抑制 barge-in 队列清理和自动回复。
- 如果初始播放失败，通话会返回 `listening` 状态，初始消息会保留在队列中以便重试。
- 对于 Twilio 流式传输，初始播放会在流连接建立后立即开始，没有额外延迟。
- Barge-in 会中止当前播放，并清除队列中已排队但尚未开始播放的 Twilio TTS 条目。被清除的条目会以“已跳过”状态结束，因此后续回复逻辑无需等待那些永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。Voice Call **不会**为该初始消息发送旧版 `<Say>` TwiML 更新，因此外呼 `<Connect><Stream>` 会话会保持附着状态。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 **2000 ms** 后再自动结束通话：

- 如果流在这段时间内重新连接，则取消自动结束。
- 如果宽限期结束后仍没有流重新注册，则会结束通话，以防止活跃通话卡住。

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 结束那些始终未收到终结 webhook 的通话（例如一直未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产环境：** 对于通知式流程，建议设为 `120`–`300` 秒。
- 请保持该值**高于 `maxDurationSeconds`**，以便正常通话能够完成。一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

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

## Webhook 安全

当 Gateway 网关前面有代理或隧道时，插件会重建用于签名验证的公网 URL。以下选项控制哪些转发头会被信任：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  来自转发头的 allowlist 主机名。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有 allowlist 的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求的远端 IP 与列表匹配时，才信任转发头。
</ParamField>

其他保护措施：

- Twilio 和 Plivo 已启用 webhook **重放保护**。被重放的有效 webhook 请求会被确认接收，但会跳过副作用处理。
- Twilio 对话轮次在 `<Gather>` 回调中包含每轮令牌，因此陈旧/重放的语音回调无法满足较新的待处理转录轮次。
- 对于缺少 provider 所需签名头的未认证 webhook 请求，会在读取请求体之前直接拒绝。
- voice-call webhook 使用共享的预认证请求体配置（64 KB / 5 秒），并在签名验证前按每个 IP 限制并发中的请求数。

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
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。
使用 `--file <path>` 指向不同日志，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包含轮次延迟和监听等待时间的 p50/p90/p99。

## 智能体工具

工具名称：`voice_call`。

| 操作            | 参数                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

该仓库还附带对应的 Skills 文档：`skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

| 方法                 | 参数                      |
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
