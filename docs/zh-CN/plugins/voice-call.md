---
read_when:
    - 你想从 OpenClaw 发起一通呼出语音电话
    - 你正在配置或开发语音通话插件
summary: 语音通话插件：通过 Twilio/Telnyx/Plivo 进行呼出 + 呼入通话（插件安装 + 配置 + CLI）
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-24T21:43:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6d03153cf6ba1b4cd7cf2e4c0ffcdf96595363473b172b2d4b21b4100c20e3c
    source_path: plugins/voice-call.md
    workflow: 15
---

# 语音通话（插件）

通过插件为 OpenClaw 提供语音通话。支持呼出通知，以及带有呼入策略的多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发用 / 无网络）

快速理解模型：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

语音通话插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装 / 配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发，无需复制）

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
          fromNumber: "+15550001234", // 或者 Twilio 的 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Telnyx Mission Control Portal 的 Telnyx webhook 公钥
            // （Base64 字符串；也可以通过 TELNYX_PUBLIC_KEY 设置）。
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

          // 公开暴露方式（任选其一）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 可选；未设置时使用第一个已注册的实时转录提供商
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

          realtime: {
            enabled: false,
            provider: "google", // 可选；未设置时使用第一个已注册的实时语音提供商
            providers: {
              google: {
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

说明：

- Twilio / Telnyx 需要一个**可从公网访问**的 webhook URL。
- Plivo 需要一个**可从公网访问**的 webhook URL。
- `mock` 是本地开发提供商（不发起网络调用）。
- 如果旧配置仍在使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 进行重写。
- 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费层，请将 `publicUrl` 设置为精确的 ngrok URL；签名验证始终会被强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带有无效签名的 Twilio webhook。仅用于本地开发。
- Ngrok 免费层 URL 可能会变化，或插入中间页行为；如果 `publicUrl` 漂移，Twilio 签名将会验证失败。生产环境中，优先使用稳定域名或 Tailscale funnel。
- `realtime.enabled` 会启动完整的语音到语音对话；不要与 `streaming.enabled` 同时启用。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些从未发送有效 `start` 帧的 socket。
- `streaming.maxPendingConnections` 限制未认证、启动前 socket 的总数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证、启动前 socket 数量。
- `streaming.maxConnections` 限制媒体流 socket 的总打开数（待启动 + 活动）。
- 运行时回退目前仍接受这些旧的 voice-call 键，但推荐的重写路径是 `openclaw doctor --fix`，兼容性垫片只是临时方案。

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。
它与 `streaming` 分离，后者仅将音频转发给实时转录提供商。

当前运行时行为：

- `realtime.enabled` 支持用于 Twilio Media Streams。
- `realtime.enabled` 不能与 `streaming.enabled` 组合使用。
- `realtime.provider` 是可选的。未设置时，语音通话会使用第一个已注册的实时语音提供商。
- 内置的实时语音提供商包括 Google Gemini Live（`google`）和 OpenAI（`openai`），由它们各自的提供商插件注册。
- 提供商自有的原始配置位于 `realtime.providers.<providerId>` 下。
- 如果 `realtime.provider` 指向一个未注册的提供商，或者根本没有注册任何实时语音提供商，语音通话会记录一条警告，并跳过实时媒体，而不是让整个插件失败。

Google Gemini Live 实时默认值：

- API 密钥：`realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`
- model：`gemini-2.5-flash-native-audio-preview-12-2025`
- voice：`Kore`

示例：

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
            instructions: "Speak briefly and ask before using tools.",
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

改用 OpenAI：

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
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

有关提供商特定的实时语音选项，请参见 [Google provider](/zh-CN/providers/google) 和 [OpenAI provider](/zh-CN/providers/openai)。

## 流式转录

`streaming` 为实时通话音频选择一个实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选的。未设置时，语音通话会使用第一个已注册的实时转录提供商。
- 内置的实时转录提供商包括 Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由它们各自的提供商插件注册。
- 提供商自有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向一个未注册的提供商，或者根本没有注册任何实时转录提供商，语音通话会记录一条警告，并跳过媒体流式传输，而不是让整个插件失败。

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

旧版键仍可由 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 来结束那些始终未收到终止 webhook 的通话
（例如，始终未完成的 notify 模式通话）。默认值为 `0`
（禁用）。

建议范围：

- **生产环境：** 对于 notify 风格流程，使用 `120`–`300` 秒。
- 保持该值**高于 `maxDurationSeconds`**，以便正常通话可以完成。一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

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

当前方有代理或隧道位于 Gateway 网关前面时，插件会重建
用于签名验证的公网 URL。这些选项控制哪些转发头
会被信任。

`webhookSecurity.allowedHosts` 会将来自转发头的主机加入允许列表。

`webhookSecurity.trustForwardingHeaders` 会在没有允许列表的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 仅在请求的远程 IP
匹配列表时才信任转发头。

Twilio 和 Plivo 启用了 webhook 重放保护。被重放的有效 webhook
请求会被确认，但会跳过副作用处理。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮唯一 token，因此
陈旧 / 重放的语音回调无法满足较新的待处理转录轮次。

未认证的 webhook 请求会在读取 body 之前被拒绝，前提是缺少
该提供商所要求的签名头。

voice-call webhook 使用共享的预认证 body 配置文件（64 KB / 5 秒），
并且在签名验证之前会施加每 IP 的进行中请求上限。

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

## 通话用 TTS

语音通话会使用核心 `messages.tts` 配置来进行
通话中的流式语音播放。你也可以在插件配置下使用**相同结构**
来覆盖它——它会与 `messages.tts` 进行深度合并。

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

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会在加载时自动迁移到 `tts.providers.<provider>`。已提交的配置中请优先使用 `providers` 结构。
- **Microsoft speech 会被语音通话忽略**（电话音频需要 PCM；当前的 Microsoft 传输方式不暴露电话用 PCM 输出）。
- 当启用 Twilio 媒体流时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于活动状态，语音通话不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，播放请求会直接失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，语音通话会记录一条包含提供商链（`from`、`to`、`attempts`）的警告日志，以便调试。

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

仅为通话覆盖为 ElevenLabs（在其他地方保留核心默认值）：

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

仅为通话覆盖 OpenAI model（深度合并示例）：

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

`inboundPolicy: "allowlist"` 是一种低保障的来电号码筛选机制。插件会
标准化提供商给出的 `From` 值，并将其与 `allowFrom` 进行比较。
Webhook 验证可以认证提供商投递及载荷完整性，但
它并不能证明 PSTN / VoIP 来电号码的归属权。因此应将 `allowFrom` 视为
来电显示过滤，而不是强身份验证。

自动响应使用智能体系统。可通过以下项进行调优：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 口语输出约定

对于自动响应，语音通话会在系统提示词后附加一个严格的口语输出约定：

- `{"spoken":"..."}`

随后，语音通话会以防御式方式提取语音文本：

- 忽略被标记为推理 / 错误内容的载荷。
- 解析直接 JSON、带围栏的 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能的规划 / 元信息引导段落。

这样可以让语音播放聚焦于面向来电者的文本，并避免将规划文本泄露到音频中。

### 对话启动行为

对于呼出 `conversation` 通话，首条消息的处理与实时播放状态绑定：

- 仅在初始问候语正在主动播放时，才会抑制打断时的队列清空和自动响应。
- 如果初始播放失败，通话会返回 `listening`，并将初始消息保留在队列中以供重试。
- 对于 Twilio 流式传输，初始播放会在流连接时立即开始，无额外延迟。
- 实时语音对话使用实时流自身的开场轮次。语音通话不会为该初始消息发送旧版 `<Say>` TwiML 更新，因此呼出 `<Connect><Stream>` 会话会保持附着状态。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，语音通话会等待 `2000ms`，然后才自动结束通话：

- 如果流在此时间窗内重新连接，则会取消自动结束。
- 如果宽限期后仍未重新注册任何流，则会结束通话，以防出现卡住的活动通话。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # `call` 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志中汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用
`--file <path>` 可指向其他日志，使用 `--last <n>` 可将分析范围限制为
最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 p50 / p90 / p99。

## 智能体工具

工具名称：`voice_call`

操作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `send_dtmf`（callId、digits）
- `end_call`（callId）
- `get_status`（callId）

该仓库附带了对应的技能文档，位于 `skills/voice-call/SKILL.md`。

## Gateway 网关 RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.dtmf`（`callId`、`digits`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [对话模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
