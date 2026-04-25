---
read_when:
    - 你想从 OpenClaw 发起一个出站语音通话
    - 你正在配置或开发语音通话插件
summary: 语音通话插件：通过 Twilio/Telnyx/Plivo 进行出站 + 入站通话（插件安装 + 配置 + CLI）
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-25T05:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw 的语音通话通过插件实现。支持出站通知以及带入站策略的
多轮对话。

当前提供商：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发/无网络）

快速心智模型：

- 安装插件
- 重启 Gateway 网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

Voice Call 插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装/配置该插件，然后重启 Gateway 网关以加载它。

## 安装

### 方案 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway 网关。

### 方案 B：从本地文件夹安装（开发，无需复制）

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
          fromNumber: "+15550001234", // 或 Twilio 的 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Telnyx Mission Control Portal 的 Telnyx webhook 公钥
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

          // Webhook 安全性（推荐用于隧道/代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公开暴露方式（选择一种）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 可选；未设置时使用第一个已注册的实时转写提供商
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
            toolPolicy: "safe-read-only",
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

在使用真实提供商测试之前，先检查设置：

```bash
openclaw voicecall setup
```

默认输出在聊天日志和终端会话中都易于阅读。它会检查
插件是否已启用、提供商和凭证是否存在、webhook
暴露是否已配置，以及是否只启用了一个音频模式。脚本请使用
`openclaw voicecall setup --json`。

对于 Twilio、Telnyx 和 Plivo，设置必须能解析为公开可访问的 webhook URL。如果
已配置的 `publicUrl`、隧道 URL、Tailscale URL 或 serve 回退地址解析为
loopback 或私有网络空间，设置会失败，而不是启动一个无法接收真实运营商 webhook 的
提供商。

如需进行一次无意外的冒烟测试，请运行：

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

第二个命令仍然是演练模式。添加 `--yes` 以发起一次简短的出站
通知呼叫：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

说明：

- Twilio/Telnyx 需要一个**可公开访问**的 webhook URL。
- Plivo 需要一个**可公开访问**的 webhook URL。
- `mock` 是本地开发提供商（不发起网络调用）。
- 如果旧配置仍使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 进行重写。
- Telnyx 要求设置 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
- `skipSignatureVerification` 仅用于本地测试。
- 如果你使用 ngrok 免费层，请将 `publicUrl` 设置为精确的 ngrok URL；签名验证始终会强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带无效签名的 Twilio webhook。仅用于本地开发。
- Ngrok 免费层 URL 可能会变化或添加中间页行为；如果 `publicUrl` 漂移，Twilio 签名将会失败。生产环境中，优先使用稳定域名或 Tailscale funnel。
- `realtime.enabled` 会启动完整的语音到语音对话；不要与 `streaming.enabled` 同时启用。
- 分块流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 会关闭那些始终未发送有效 `start` 帧的 socket。
- `streaming.maxPendingConnections` 限制未认证、启动前 socket 的总数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证、启动前 socket 数量。
- `streaming.maxConnections` 限制打开的媒体流 socket 总数（待启动 + 活动）。
- 运行时回退目前仍接受这些旧的 voice-call 键，但重写路径是 `openclaw doctor --fix`，兼容垫片只是临时的。

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。
它与 `streaming` 分开，后者仅将音频转发给实时
转写提供商。

当前运行时行为：

- `realtime.enabled` 支持用于 Twilio Media Streams。
- `realtime.enabled` 不能与 `streaming.enabled` 组合使用。
- `realtime.provider` 是可选的。若未设置，Voice Call 会使用第一个
  已注册的实时语音提供商。
- 内置的实时语音提供商包括 Google Gemini Live（`google`）和
  OpenAI（`openai`），由各自的 provider 插件注册。
- 提供商自有的原始配置位于 `realtime.providers.<providerId>` 下。
- Voice Call 默认暴露共享的 `openclaw_agent_consult` 实时工具。
  当来电者请求更深层次的推理、最新信息或普通 OpenClaw 工具时，实时模型可以调用它。
- `realtime.toolPolicy` 控制 consult 运行：
  - `safe-read-only`：暴露 consult 工具，并将常规智能体限制为
    `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
    `memory_get`。
  - `owner`：暴露 consult 工具，并让常规智能体使用正常的
    智能体工具策略。
  - `none`：不暴露 consult 工具。自定义 `realtime.tools` 仍会
    透传给实时提供商。
- Consult 会话键会在可用时复用现有语音会话，然后
  回退到来电方/被叫方电话号码，以便后续 consult 调用在通话期间保持
  上下文。
- 如果 `realtime.provider` 指向未注册的提供商，或者根本没有注册任何实时
  语音提供商，Voice Call 会记录警告并跳过
  实时媒体，而不是让整个插件失败。

Google Gemini Live 实时默认值：

- API 密钥：`realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或
  `GOOGLE_GENERATIVE_AI_API_KEY`
- 模型：`gemini-2.5-flash-native-audio-preview-12-2025`
- 声音：`Kore`

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

## 实时分块流式转写

`streaming` 为实时通话音频选择一个实时转写提供商。

当前运行时行为：

- `streaming.provider` 是可选的。若未设置，Voice Call 会使用第一个
  已注册的实时转写提供商。
- 内置的实时转写提供商包括 Deepgram（`deepgram`）、
  ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI
  （`xai`），由各自的 provider 插件注册。
- 提供商自有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向未注册的提供商，或根本没有注册任何实时
  转写提供商，Voice Call 会记录警告，并
  跳过媒体流，而不是让整个插件失败。

OpenAI 分块流式转写默认值：

- API 密钥：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- 模型：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

xAI 分块流式转写默认值：

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

旧键仍会被 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 结束那些从未收到终态 webhook 的通话
（例如始终未完成的 notify 模式通话）。默认值为 `0`
（禁用）。

推荐范围：

- **生产环境：** 对于 notify 风格流程，使用 `120`–`300` 秒。
- 将此值保持为**高于 `maxDurationSeconds`**，以便正常通话能够
  完成。一个不错的起始值是 `maxDurationSeconds + 30–60` 秒。

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

当 Gateway 网关前面有代理或隧道时，插件会重建
用于签名验证的公开 URL。这些选项控制哪些转发
标头会被信任。

`webhookSecurity.allowedHosts` 会将转发标头中的主机加入允许名单。

`webhookSecurity.trustForwardingHeaders` 会在没有允许名单的情况下信任转发标头。

仅当请求远程 IP 与列表匹配时，`webhookSecurity.trustedProxyIPs` 才会信任转发标头。

Twilio 和 Plivo 启用了 webhook 重放保护。被重放的有效 webhook
请求会被确认，但不会执行副作用。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮令牌，因此
陈旧/重放的语音回调无法满足较新的待处理转录轮次。

如果缺少提供商要求的签名标头，未认证的 webhook 请求会在读取请求体之前被拒绝。

voice-call webhook 使用共享的预认证请求体配置（64 KB / 5 秒），
并在签名验证前对每个 IP 设置进行中的请求数量上限。

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

## 用于通话的 TTS

Voice Call 对通话中的
流式语音使用核心 `messages.tts` 配置。你可以在插件配置下使用
**相同结构**进行覆盖——它会与 `messages.tts` 进行深度合并。

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

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；已提交的配置应使用 `tts.providers.<provider>`。
- **Microsoft speech 会被语音通话忽略**（电话音频需要 PCM；当前 Microsoft 传输不暴露电话 PCM 输出）。
- 当启用 Twilio 媒体流时，会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。在这种状态下，如果电话 TTS 不可用，播放请求会失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条包含提供商链（`from`、`to`、`attempts`）的警告，便于调试。
- 当 Twilio 插话或流拆除清除待处理 TTS 队列时，排队中的
  播放请求会正常结束，而不会让等待播放完成的来电者一直挂起。

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

仅为通话覆盖为 ElevenLabs（其他地方保持核心默认值）：

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

仅为通话覆盖 OpenAI 模型（深度合并示例）：

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

## 入站通话

入站策略默认是 `disabled`。要启用入站通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是一种低保障的来电显示筛选机制。插件
会对提供商提供的 `From` 值进行标准化，并将其与 `allowFrom` 进行比较。
webhook 验证可以认证提供商投递和负载完整性，但
不能证明 PSTN/VoIP 来电号码的所有权。请将 `allowFrom` 视为
来电显示过滤，而不是强来电者身份验证。

自动响应使用智能体系统。可通过以下项进行调优：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出约定

对于自动响应，Voice Call 会向系统提示词追加一个严格的语音输出约定：

- `{"spoken":"..."}`

随后 Voice Call 会以防御性方式提取语音文本：

- 忽略被标记为推理/错误内容的负载。
- 解析直接 JSON、带围栏的 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能属于规划/元信息的开头段落。

这样可以让语音播放聚焦于面向来电者的文本，并避免将规划文本泄露到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 只有在初始问候语正在实际播放时，才会抑制插话队列清理和自动响应。
- 如果初始播放失败，通话会回到 `listening`，初始消息仍保留在队列中以供重试。
- Twilio 流式传输的初始播放会在流连接时启动，无需额外延迟。
- 插话会中止当前播放，并清除那些已排队但尚未开始播放的 Twilio
  TTS 条目。被清除的条目会以已跳过状态结束，因此后续响应逻辑
  可以继续，而不必等待那些永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。Voice Call 不会为该初始消息发送旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` 会话会保持连接。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 `2000ms`，然后才自动结束通话：

- 如果流在该时间窗口内重新连接，则会取消自动结束。
- 如果宽限期后仍未重新注册流，则会结束该通话，以防出现卡住的活动通话。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用
`--file <path>` 指向其他日志，并使用 `--last <n>` 将分析限制
为最后 N 条记录（默认 200）。输出包括轮次
延迟和监听等待时间的 p50/p90/p99。

## 智能体工具

工具名称：`voice_call`

动作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `send_dtmf`（callId、digits）
- `end_call`（callId）
- `get_status`（callId）

此仓库在 `skills/voice-call/SKILL.md` 中附带了匹配的 Skills 文档。

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
