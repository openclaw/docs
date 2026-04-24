---
read_when:
    - 你想从 OpenClaw 发起一通外呼语音电话
    - 你正在配置或开发 voice-call 插件
summary: Voice Call 插件：通过 Twilio/Telnyx/Plivo 进行呼出和呼入通话（插件安装 + 配置 + CLI）
title: Voice call 插件
x-i18n:
    generated_at: "2026-04-24T00:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（插件）

通过插件为 OpenClaw 提供语音通话功能。支持外呼通知，以及带有呼入策略的多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发用/无网络）

快速理解：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

Voice Call 插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装/配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发用，不复制）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway 网关。

## 配置

在 `plugins.entries.voice-call.config` 下设置配置：

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
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

说明：

- Twilio/Telnyx 需要一个**可被公网访问**的 webhook URL。
- Plivo 需要一个**可被公网访问**的 webhook URL。
- `mock` 是本地开发用提供商（不发起网络调用）。
- 如果旧配置仍在使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 进行重写。
- Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费层，请将 `publicUrl` 设置为精确的 ngrok URL；签名校验始终会强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带有无效签名的 Twilio webhook。仅用于本地开发。
- Ngrok 免费层 URL 可能会变化或增加中间页行为；如果 `publicUrl` 发生漂移，Twilio 签名将校验失败。生产环境中，优先使用稳定域名或 Tailscale funnel。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些从未发送有效 `start` 帧的套接字。
- `streaming.maxPendingConnections` 限制未认证 pre-start 套接字的总数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证 pre-start 套接字数量。
- `streaming.maxConnections` 限制打开的媒体流套接字总数（待启动 + 活跃）。
- 运行时回退目前仍会接受这些旧的 voice-call 键，但推荐的重写路径是 `openclaw doctor --fix`，而这个兼容层只是临时的。

## 流式转写

`streaming` 用于为实时通话音频选择一个实时转写提供商。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时转写提供商。
- 内置的实时转写提供商包括 Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）以及 xAI（`xai`），它们由各自的提供商插件注册。
- 提供商自有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向了未注册的提供商，或者根本没有注册任何实时转写提供商，Voice Call 会记录一条警告，并跳过媒体流处理，而不是让整个插件失败。

OpenAI 流式转写默认值：

- API 密钥：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- 模型：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI 流式转写默认值：

- API 密钥：`streaming.providers.xai.apiKey` 或 `XAI_API_KEY`
- 端点：`wss://api.x.ai/v1/stt`
- `encoding`：`mulaw`
- `sampleRate`：`8000`
- `endpointingMs`：`800`
- `interimResults`：`true`

示例：

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

改为使用 xAI：

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

旧键仍然会由 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 过期通话清理器

使用 `staleCallReaperSeconds` 可结束那些始终没有收到终态 webhook 的通话
（例如，始终未完成的 notify 模式通话）。默认值为 `0`
（禁用）。

推荐范围：

- **生产环境：** 对于 notify 风格流程，使用 `120`–`300` 秒。
- 保持该值**高于 `maxDurationSeconds`**，以便正常通话能够完成。
  一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

示例：

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

当 Gateway 网关前面有代理或隧道时，插件会重建用于签名校验的公网 URL。
这些选项用于控制信任哪些转发头。

`webhookSecurity.allowedHosts` 用于允许来自转发头的主机名。

`webhookSecurity.trustForwardingHeaders` 会在没有允许列表的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 仅在请求的远端 IP 与列表匹配时，
才信任转发头。

Twilio 和 Plivo 默认启用 webhook 重放保护。被重放的有效 webhook
请求会被确认接收，但会跳过副作用处理。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮专属 token，因此
过期/重放的语音回调无法满足更新的待处理转写轮次。

如果缺少提供商所要求的签名头，未认证的 webhook 请求会在读取请求体之前被拒绝。

voice-call webhook 使用共享的预认证请求体配置文件（64 KB / 5 秒），
并且在签名校验前还会施加每个 IP 的进行中请求数量上限。

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

## 通话 TTS

Voice Call 会使用核心 `messages.tts` 配置来为通话提供
流式语音。你也可以在插件配置下用**相同的结构**
进行覆盖——它会与 `messages.tts` 做深度合并。

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

说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会在加载时自动迁移到 `tts.providers.<provider>`。在已提交的配置中，请优先使用 `providers` 结构。
- **Microsoft speech 会被语音通话忽略**（电话音频需要 PCM；当前 Microsoft 传输层不提供电话场景所需的 PCM 输出）。
- 启用 Twilio 媒体流时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于活跃状态，Voice Call 不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，则播放请求会失败，而不是混用两种播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条带有提供商链（`from`、`to`、`attempts`）的警告，便于调试。

### 更多示例

仅使用核心 TTS（不覆盖）：

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

仅对通话覆盖为 ElevenLabs（其他地方仍保留核心默认值）：

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

仅对通话覆盖 OpenAI 模型（深度合并示例）：

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

## 呼入通话

呼入策略默认是 `disabled`。要启用呼入通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是一种低保障的来电号码筛选机制。插件会对提供商提供的 `From` 值进行标准化，并将其与 `allowFrom` 进行比较。
Webhook 校验可以验证提供商投递与载荷完整性，但
不能证明 PSTN/VoIP 来电号码的实际归属权。请将 `allowFrom` 视为
来电显示筛选，而不是强身份验证。

自动响应使用智能体系统。可通过以下项进行调优：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出约定

对于自动响应，Voice Call 会向系统提示词追加一个严格的语音输出约定：

- `{"spoken":"..."}`

随后 Voice Call 会以防御性方式提取语音文本：

- 忽略被标记为推理/错误内容的载荷。
- 解析直接 JSON、带围栏的 JSON，或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能属于规划/元信息的前导段落。

这样可以让语音播放聚焦于面向来电者的文本，并避免将规划文本泄露到音频中。

### 对话启动行为

对于外呼 `conversation` 通话，首条消息的处理与实时播放状态绑定：

- 仅当初始问候语正在主动播放时，打断清队列和自动响应才会被抑制。
- 如果初始播放失败，通话会返回 `listening` 状态，且初始消息会保留在队列中以供重试。
- 对于 Twilio 流式传输，初始播放会在流连接建立后立即开始，不会额外延迟。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 `2000ms`，然后才自动结束通话：

- 如果流在这段时间内重新连接，自动结束会被取消。
- 如果宽限期结束后仍未重新注册流，为防止通话卡在活跃状态，系统会结束该通话。

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
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用
`--file <path>` 可指向其他日志文件，使用 `--last <n>` 可将分析范围限制为
最后 N 条记录（默认 200）。输出包括轮次延迟与监听等待时间的
p50/p90/p99 摘要。

## 智能体工具

工具名称：`voice_call`

操作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `send_dtmf`（callId、digits）
- `end_call`（callId）
- `get_status`（callId）

此仓库提供了对应的 Skills 文档：`skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.dtmf`（`callId`、`digits`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
