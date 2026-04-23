---
read_when:
    - 你想从 OpenClaw 发起一个呼出语音通话
    - 你正在配置或开发 voice-call 插件
summary: Voice Call 插件：通过 Twilio/Telnyx/Plivo 进行呼出 + 呼入通话（插件安装 + 配置 + CLI）
title: Voice Call 插件
x-i18n:
    generated_at: "2026-04-23T03:31:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call（插件）

通过插件为 OpenClaw 提供语音通话。支持呼出通知，以及带有呼入策略的多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发用 / 无网络）

快速心智模型：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

Voice Call 插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装 / 配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发用，不复制文件）

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
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal 中的 Telnyx webhook 公钥
            // （Base64 字符串；也可通过 TELNYX_PUBLIC_KEY 设置）。
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

          // Webhook 安全性（建议用于隧道 / 代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 对外暴露方式（任选一种）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 可选；未设置时使用首个已注册的实时转录提供商
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // 如果已设置 OPENAI_API_KEY，则可选
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

- Twilio / Telnyx 需要一个**可从公网访问**的 webhook URL。
- Plivo 需要一个**可从公网访问**的 webhook URL。
- `mock` 是本地开发提供商（不发起网络调用）。
- 如果旧配置仍使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 进行重写。
- 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费套餐，请将 `publicUrl` 设置为精确的 ngrok URL；签名校验始终会强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许 Twilio webhook 使用无效签名。仅用于本地开发。
- Ngrok 免费套餐 URL 可能变化，或增加中间页行为；如果 `publicUrl` 漂移，Twilio 签名将会校验失败。生产环境中，建议优先使用稳定域名或 Tailscale funnel。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些始终未发送有效 `start` 帧的 socket。
- `streaming.maxPendingConnections` 限制总的未认证、启动前 socket 数量。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证、启动前 socket 数量。
- `streaming.maxConnections` 限制总的已打开媒体流 socket 数量（待启动 + 活跃）。
- 运行时目前仍会接受这些旧版 voice-call 键作为回退，但推荐的重写方式是 `openclaw doctor --fix`，且该兼容层只是临时方案。

## 流式转录

`streaming` 用于为实时通话音频选择一个实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选项。未设置时，Voice Call 会使用首个已注册的实时转录提供商。
- 内置的实时转录提供商包括 Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的提供商插件注册。
- 提供商自有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向一个未注册的提供商，或根本没有注册任何实时转录提供商，Voice Call 会记录一条警告，并跳过媒体流式传输，而不是让整个插件失败。

OpenAI 流式转录默认值：

- API 密钥：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- model：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI 流式转录默认值：

- API 密钥：`streaming.providers.xai.apiKey` 或 `XAI_API_KEY`
- endpoint：`wss://api.x.ai/v1/stt`
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

改用 xAI：

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

旧版键仍可通过 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 来结束那些始终未收到终态 webhook 的通话（例如永远未完成的 notify 模式通话）。默认值为 `0`（禁用）。

建议范围：

- **生产环境：** 对于 notify 风格流程，建议设为 `120`–`300` 秒。
- 保持该值**高于 `maxDurationSeconds`**，这样正常通话才能完成。一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

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

## Webhook 安全性

当 Gateway 网关前面有代理或隧道时，插件会重建公开 URL 以进行签名校验。这些选项用于控制信任哪些转发头。

`webhookSecurity.allowedHosts` 用于将转发头中的主机名加入允许列表。

`webhookSecurity.trustForwardingHeaders` 表示在没有允许列表的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 表示只有当请求的远端 IP 与列表匹配时，才信任转发头。

Twilio 和 Plivo 已启用 webhook 重放保护。对于被重放但签名有效的 webhook 请求，系统会确认接收，但跳过副作用处理。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮唯一 token，因此陈旧 / 重放的语音回调无法满足较新的待处理转录轮次。

对于缺少提供商所需签名头的未认证 webhook 请求，系统会在读取请求体之前直接拒绝。

voice-call webhook 使用共享的预认证请求体配置（64 KB / 5 秒），并在签名校验前施加每 IP 的进行中请求上限。

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

## 通话的 TTS

Voice Call 会使用核心 `messages.tts` 配置，在通话中进行语音流式播放。你可以在插件配置下使用**相同的结构**覆盖它——它会与 `messages.tts` 进行深度合并。

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

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会在加载时自动迁移到 `tts.providers.<provider>`。提交到配置文件时，优先使用 `providers` 结构。
- **Microsoft speech 会被忽略用于语音通话**（电话音频需要 PCM；当前 Microsoft 传输不提供电话场景所需的 PCM 输出）。
- 启用 Twilio 媒体流式传输时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于激活状态，Voice Call 不会回退到 TwiML `<Say>`。在该状态下如果电话 TTS 不可用，则播放请求会失败，而不是混用两种播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条包含提供商链（`from`、`to`、`attempts`）的警告日志，以便调试。

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

仅对通话覆盖为 ElevenLabs（其他地方保留核心默认值）：

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

仅覆盖通话的 OpenAI model（深度合并示例）：

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
  inboundGreeting: "你好！我能帮你什么？",
}
```

`inboundPolicy: "allowlist"` 是一种低保证级别的来电号码筛选。插件会对提供商提供的 `From` 值进行规范化，并将其与 `allowFrom` 比较。Webhook 校验可以验证提供商投递来源和负载完整性，但**不能**证明 PSTN/VoIP 来电号码的实际归属权。请将 `allowFrom` 视为来电显示过滤，而不是强来电身份验证。

自动响应使用智能体系统。可通过以下项调整：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 口语化输出约定

对于自动响应，Voice Call 会在系统提示词后追加一个严格的口语化输出约定：

- `{"spoken":"..."}`

随后 Voice Call 会以防御性方式提取语音文本：

- 忽略被标记为推理 / 错误内容的负载。
- 解析直接 JSON、带围栏的 JSON，或内联 `"spoken"` 键。
- 回退到纯文本，并移除看起来像计划 / 元信息引导段落的内容。

这样可以让语音播放聚焦于面向来电者的文本，并避免将规划性文字泄露到音频中。

### 对话启动行为

对于呼出的 `conversation` 通话，首条消息的处理与实时播放状态绑定：

- 只有在初始问候语正在主动播放时，才会抑制打断清队列和自动响应。
- 如果初始播放失败，通话会返回 `listening`，并且初始消息会继续保留在队列中以供重试。
- 对于 Twilio 流式传输，初始播放会在流连接建立时立即开始，不会有额外延迟。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 `2000ms` 后才自动结束通话：

- 如果流在该时间窗口内重新连接，则会取消自动结束。
- 如果宽限期后仍未重新注册流，则会结束通话，以防止通话卡在活跃状态。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # `call` 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用
`--file <path>` 可指向其他日志文件，使用 `--last <n>` 可将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 p50 / p90 / p99。

## 智能体工具

工具名称：`voice_call`

操作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `end_call`（callId）
- `get_status`（callId）

此仓库附带对应的 skill 文档：`skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
