---
read_when:
    - 你想从 OpenClaw 发起外呼语音通话
    - 你正在配置或开发语音通话插件
    - 你需要电话场景下的实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 拨打外呼语音电话并接听呼入语音电话，并可选择启用实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-05-01T05:39:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08690f9f27de8a3d4d2c6056cd08edcc42f60f0592272a464c07cb1dc7fee26e
    source_path: plugins/voice-call.md
    workflow: 16
---

通过插件为 OpenClaw 提供语音通话。支持出站通知、
多轮对话、全双工实时语音、流式转写，
以及带 allowlist 策略的入站通话。

**当前提供商：** `twilio`（Programmable Voice + Media Streams），
`telnyx`（Call Control v2），`plivo`（Voice API + XML transfer + GetInput
speech），`mock`（开发/无网络）。

<Note>
Voice Call 插件在 **Gateway 网关进程内** 运行。如果你使用
远程 Gateway 网关，请在运行 Gateway 网关的机器上安装并配置该插件，
然后重启 Gateway 网关以加载它。
</Note>

## 快速开始

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    如果 npm 报告 OpenClaw 拥有的软件包已弃用，该软件包版本
    来自较旧的外部软件包发布线；请使用当前打包的 OpenClaw
    构建，或在较新的 npm 软件包发布前使用本地文件夹路径。

    之后重启 Gateway 网关，以便插件加载。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整结构见下方
    [配置](#configuration)）。至少需要：
    `provider`、提供商凭证、`fromNumber`，以及可公开访问的 webhook URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    默认输出适合在聊天日志和终端中阅读。它会检查
    插件启用状态、提供商凭证、webhook 暴露情况，以及是否
    只有一种音频模式（`streaming` 或 `realtime`）处于活动状态。脚本可使用
    `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是 dry run。添加 `--yes` 才会实际发起一次简短的
    出站通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析为 **公共 webhook URL**。
如果 `publicUrl`、隧道 URL、Tailscale URL 或 serve fallback
解析为 loopback 或专用网络空间，设置会失败，而不是
启动无法接收运营商 webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true` 但所选提供商缺少凭证，
Gateway 网关启动时会记录一条设置未完成警告，其中包含缺失键名，
并跳过启动运行时。命令、RPC 调用和智能体工具在使用时仍会
返回确切缺失的提供商配置。

<Note>
语音通话凭证支持 SecretRef。`plugins.entries.voice-call.config.twilio.authToken` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 会通过标准 SecretRef 界面解析；见 [SecretRef 凭证界面](/zh-CN/reference/secretref-credential-surface)。
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
  <Accordion title="Provider exposure and security notes">
    - Twilio、Telnyx 和 Plivo 都需要一个 **可公开访问** 的 webhook URL。
    - `mock` 是本地开发提供商（不发起网络调用）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费层上，将 `publicUrl` 设置为确切的 ngrok URL；始终会强制执行签名验证。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅当 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，才允许签名无效的 Twilio webhook。仅限本地开发。
    - Ngrok 免费层 URL 可能变化或添加插页行为；如果 `publicUrl` 偏移，Twilio 签名会失败。生产环境：优先使用稳定域名或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 会关闭从未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections` 限制未认证 pre-start 套接字总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证 pre-start 套接字数。
    - `streaming.maxConnections` 限制打开的媒体流套接字总数（pending + active）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或旧版
    `streaming.*` OpenAI 键的旧配置会由 `openclaw doctor --fix` 重写。
    运行时 fallback 目前仍接受旧的 voice-call 键，但
    重写路径是 `openclaw doctor --fix`，兼容 shim 是
    临时的。

    自动迁移的 streaming 键：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。
它与 `streaming` 分开，后者只会将音频转发给
实时转写提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 组合使用。每次通话请选择一种
音频模式。
</Warning>

当前运行时行为：

- Twilio Media Streams 支持 `realtime.enabled`。
- `realtime.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由它们的提供商插件注册。
- 提供商拥有的原始配置位于 `realtime.providers.<providerId>` 下。
- Voice Call 默认暴露共享的 `openclaw_agent_consult` 实时工具。当来电者请求更深入的推理、当前信息或普通 OpenClaw 工具时，实时模型可以调用它。
- 如果 `realtime.provider` 指向未注册的提供商，或根本没有注册任何实时语音提供商，Voice Call 会记录警告并跳过实时媒体，而不是让整个插件失败。
- consult 会话键会在可用时复用现有语音会话，然后回退到主叫/被叫电话号码，以便后续 consult 调用在通话期间保持上下文。

### 工具策略

`realtime.toolPolicy` 控制 consult 运行：

| 策略             | 行为                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露 consult 工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露 consult 工具，并允许常规智能体使用普通智能体工具策略。                                                      |
| `none`           | 不暴露 consult 工具。自定义 `realtime.tools` 仍会传递给实时提供商。                               |

### 实时提供商示例

<Tabs>
  <Tab title="Google Gemini Live">
    默认值：API key 来自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型
    `gemini-2.5-flash-native-audio-preview-12-2025`；语音 `Kore`。

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

有关提供商专用的实时语音选项，请参阅 [Google 提供商](/zh-CN/providers/google) 和
[OpenAI provider](/zh-CN/providers/openai)。

## 流式转写

`streaming` 为实时通话音频选择一个实时转写提供商。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时转写提供商。
- 内置实时转写提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由它们的提供商插件注册。
- 提供商拥有的原始配置位于 `streaming.providers.<providerId>` 下。
- Twilio 发送已接受的流 `start` 消息后，Voice Call 会立即注册该流，在提供商连接期间通过转写提供商排队入站媒体，并且仅在实时转写准备就绪后开始初始问候。
- 如果 `streaming.provider` 指向未注册的提供商，或没有任何提供商注册，Voice Call 会记录警告并跳过媒体流式传输，而不是让整个插件失败。

### 流式提供商示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API key `streaming.providers.openai.apiKey` 或
    `OPENAI_API_KEY`；模型 `gpt-4o-transcribe`；`silenceDurationMs: 800`；
    `vadThreshold: 0.5`。

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
    默认值：API key `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；
    端点 `wss://api.x.ai/v1/stt`；编码 `mulaw`；采样率 `8000`；
    `endpointingMs: 800`；`interimResults: true`。

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

## 通话的 TTS

Voice Call 使用核心 `messages.tts` 配置来处理通话中的流式语音。你可以在插件配置下用**相同结构**覆盖它 — 它会与 `messages.tts` 深度合并。

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
**语音通话会忽略 Microsoft speech。** 电话音频需要 PCM；当前 Microsoft 传输不公开电话 PCM 输出。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流式传输时会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果在该状态下电话 TTS 不可用，播放请求会失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条带有提供商链（`from`、`to`、`attempts`）的警告，便于调试。
- 当 Twilio 插话或流拆除清空待处理 TTS 队列时，排队的播放请求会完成结算，而不是让调用方在等待播放完成时挂起。

### TTS 示例

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

来电策略默认值为 `disabled`。要启用来电，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保障的来电号码筛选。该插件会规范化提供商提供的 `From` 值，并将其与 `allowFrom` 比较。Webhook 验证会认证提供商投递和负载完整性，但它**不能**证明 PSTN/VoIP 主叫号码所有权。应将 `allowFrom` 视为来电号码过滤，而不是强主叫身份验证。
</Warning>

自动响应使用智能体系统。使用 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 调整。

### 语音输出契约

对于自动响应，Voice Call 会将严格的语音输出契约附加到系统提示词：

```text
{"spoken":"..."}
```

Voice Call 会防御性地提取语音文本：

- 忽略标记为推理/错误内容的负载。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能的规划/元信息开头段落。

这会让语音播放聚焦于面向调用方的文本，并避免将规划文本泄漏到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 仅当初始问候正在主动播放时，才会抑制插话队列清空和自动响应。
- 如果初始播放失败，通话会返回 `listening`，且初始消息仍保留在队列中以便重试。
- Twilio 流式传输的初始播放会在流连接时开始，不会额外延迟。
- 插话会中止活动播放，并清除已排队但尚未播放的 Twilio TTS 条目。清除的条目会解析为已跳过，因此后续响应逻辑可以继续，而无需等待永远不会播放的音频。
- 实时语音对话使用实时流自己的开场回合。Voice Call **不会**为该初始消息发布旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` 会话会保持连接。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 **2000 ms** 后再自动结束通话：

- 如果流在该窗口内重新连接，则取消自动结束。
- 如果宽限期后没有流重新注册，则结束通话，防止活动通话卡住。

## 过期通话清理器

使用 `staleCallReaperSeconds` 结束从未收到终止 webhook 的通话（例如从未完成的 notify 模式通话）。默认值为 `0`（禁用）。

建议范围：

- **生产环境：** 对于通知式流程，使用 `120`–`300` 秒。
- 保持该值**高于 `maxDurationSeconds`**，以便正常通话能够完成。一个良好的起点是 `maxDurationSeconds + 30–60` 秒。

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

当代理或隧道位于 Gateway 网关前面时，该插件会重建用于签名验证的公开 URL。这些选项控制信任哪些转发标头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允许列表中的转发标头主机。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有允许列表的情况下信任转发标头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求远程 IP 与列表匹配时，才信任转发标头。
</ParamField>

额外保护：

- Twilio 和 Plivo 已启用 webhook **重放保护**。重放的有效 webhook 请求会被确认，但会跳过副作用。
- Twilio 对话回合在 `<Gather>` 回调中包含每回合 token，因此过期/重放的语音回调无法满足较新的待处理转录回合。
- 当缺少提供商所需的签名标头时，未认证的 webhook 请求会在读取正文前被拒绝。
- voice-call webhook 使用共享的预认证正文配置（64 KB / 5 秒），并在签名验证前施加按 IP 统计的进行中请求上限。

使用稳定公开主机的示例：

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

当 Gateway 网关已在运行时，操作性 `voicecall` 命令会委托给 Gateway 网关拥有的 voice-call 运行时，因此 CLI 不会绑定第二个 webhook 服务器。如果无法访问 Gateway 网关，这些命令会回退到独立 CLI 运行时。

`latency` 从默认 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同日志，并使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括回合延迟和听取等待时间的 p50/p90/p99。

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

此仓库在 `skills/voice-call/SKILL.md` 提供匹配的 skill 文档。

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

- [Talk 模式](/zh-CN/nodes/talk)
- [文本转语音](/zh-CN/tools/tts)
- [语音唤醒](/zh-CN/nodes/voicewake)
