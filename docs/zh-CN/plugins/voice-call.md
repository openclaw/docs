---
read_when:
    - 你想通过 OpenClaw 拨打外呼语音电话
    - 你正在配置或开发语音通话插件
    - 你需要在电话通信中使用实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 拨打出站语音电话并接听入站语音电话，还可选择使用实时语音和流式转录功能
title: 语音通话插件
x-i18n:
    generated_at: "2026-07-11T20:51:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

通过插件为 OpenClaw 提供语音通话：出站通知、多轮对话、全双工实时语音、流式转写，以及采用允许列表策略的入站通话。

**提供商：**`mock`（开发，无网络）、`plivo`（Voice API + XML 转接 + GetInput 语音）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice + Media Streams）。

<Note>
Voice Call 插件在 **Gateway 网关进程内部**运行。如果你使用远程 Gateway 网关，请在运行 Gateway 网关的机器上安装并配置插件，然后重启 Gateway 网关以加载插件。
</Note>

## 快速开始

<Steps>
  <Step title="安装插件">
    <Tabs>
      <Tab title="从 npm 安装">
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

    使用不带版本号的软件包以跟随当前发布标签。仅在需要可复现安装时固定确切版本。之后重启 Gateway 网关以加载插件。

  </Step>
  <Step title="配置提供商和 Webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（参见下文的[配置](#configuration)）。至少需要配置：`provider`、提供商凭据、`fromNumber` 和可公开访问的 Webhook URL。
  </Step>
  <Step title="验证设置">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    检查插件是否启用、提供商凭据、Webhook 是否公开，以及是否仅启用一种音频模式（`streaming` 或 `realtime`）。

  </Step>
  <Step title="冒烟测试">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都只进行演练。添加 `--yes` 以发起一通简短的出站通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置过程必须解析出一个**公共 Webhook URL**。如果 `publicUrl`、隧道 URL、Tailscale URL 或服务回退地址解析到环回地址或私有网络空间，设置将失败，而不会启动无法接收运营商 Webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true`，但所选提供商缺少凭据，Gateway 网关启动时会记录一条设置未完成警告，其中包含缺失的键，并跳过启动运行时。命令、RPC 调用和智能体工具在使用时仍会返回确切缺失的配置。

<Note>
语音通话凭据接受 SecretRef。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 通过标准 SecretRef 接口解析；请参阅 [SecretRef 凭据接口](/zh-CN/reference/secretref-credential-surface)。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 对于 Twilio，也可使用 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "银狐卡牌，请问有什么可以帮你？",
              responseSystemPrompt: "你是一名言简意赅的棒球卡专家。",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // 可选：us1 | ie1 | au1；默认为 us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Mission Control Portal 的 Telnyx Webhook 公钥
            //（Base64；也可通过 TELNYX_PUBLIC_KEY 设置）。
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

          // Webhook 安全性（建议用于隧道/代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公开访问方式（选择一种）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 参阅“流式转写” */ },
          realtime: { enabled: false /* 参阅“实时语音对话” */ },
        },
      },
    },
  },
}
```

### 配置参考

上方未列出的 `plugins.entries.voice-call.config` 顶层键：

| 键                              | 默认值       | 说明                                                                                   |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 总开关。                                                                               |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。参阅[入站通话](#inbound-calls)。     |
| `allowFrom`                     | `[]`         | 用于 `inboundPolicy: "allowlist"` 的 E.164 允许列表。                                  |
| `maxDurationSeconds`            | `300`        | 每通电话的硬性时长上限，无论是否已接听都会强制执行。                                   |
| `staleCallReaperSeconds`        | `120`        | 参阅[过期通话清理器](#stale-call-reaper)。设为 `0` 可将其禁用。                        |
| `silenceTimeoutMs`              | `800`        | 用于经典（非实时）流程的语音结束静音检测。                                             |
| `transcriptTimeoutMs`           | `180000`     | 放弃当前轮次前，等待来电者转写文本的最长时间。                                         |
| `ringTimeoutMs`                 | `30000`      | 出站通话的振铃超时时间。                                                               |
| `maxConcurrentCalls`            | `1`          | 超出此限制的出站通话将被拒绝。                                                         |
| `outbound.notifyHangupDelaySec` | `3`          | 通知模式下，TTS 完成后等待自动挂断的秒数。                                             |
| `skipSignatureVerification`     | `false`      | 仅用于本地测试；切勿在生产环境中启用。                                                 |
| `store`                         | 未设置       | 覆盖默认的 `~/.openclaw/voice-calls` 通话日志路径。                                    |
| `agentId`                       | `"main"`     | 用于生成响应和存储会话的智能体。                                                       |
| `responseModel`                 | 未设置       | 覆盖经典（非实时）响应所使用的默认模型。                                               |
| `responseSystemPrompt`          | 自动生成     | 用于经典响应的自定义系统提示词。                                                       |
| `responseTimeoutMs`             | `30000`      | 生成经典响应的超时时间（毫秒）。                                                       |

Twilio 默认使用其 US1 REST 端点。若要在受支持的非美国区域处理通话，请将 `twilio.region` 设置为 `ie1` 或 `au1`，并使用该区域的凭据。请参阅 [Twilio 的非美国 REST API 指南](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)。

<AccordionGroup>
  <Accordion title="提供商公开访问和安全说明">
    - Twilio、Telnyx 和 Plivo 都需要一个**可公开访问的** Webhook URL。
    - `mock` 是用于本地开发的提供商（不会发起网络调用）。
    - 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
    - `skipSignatureVerification` 仅用于本地测试。
    - 使用 ngrok 免费套餐时，请将 `publicUrl` 设置为确切的 ngrok URL；始终会强制执行签名验证。
    - 仅当 `tunnel.provider="ngrok"` 且 `serve.bind` 为环回地址（ngrok 本地智能体）时，`tunnel.allowNgrokFreeTierLoopbackBypass: true` 才允许签名无效的 Twilio Webhook。仅限本地开发。
    - ngrok 免费套餐 URL 可能会变化或增加插页行为；如果 `publicUrl` 发生偏移，Twilio 签名验证将失败。生产环境中，请优先使用稳定域名或 Tailscale Funnel。

  </Accordion>
  <Accordion title="流式连接上限">
    - `streaming.preStartTimeoutMs`（默认值为 `5000`）会关闭始终未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections`（默认值为 `32`）限制未经身份验证的启动前套接字总数。
    - `streaming.maxPendingConnectionsPerIp`（默认值为 `4`）限制每个来源 IP 未经身份验证的启动前套接字数量。
    - `streaming.maxConnections`（默认值为 `128`）限制所有打开的媒体流套接字数量（待处理 + 活跃）。

  </Accordion>
  <Accordion title="旧版配置迁移">
    配置解析会自动规范化以下旧版键，并记录一条注明替代路径的警告；此兼容层将在未来版本（`2026.6.0`）中移除，因此请运行 `openclaw doctor --fix`，将已提交的配置重写为规范形式：

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` 已移除（实时上下文现在使用生成的智能体提示词）

  </Accordion>
</AccordionGroup>

## 会话范围

默认情况下，Voice Call 使用 `sessionScope: "per-phone"`，因此同一来电者重复来电时会保留对话记忆。当每次运营商通话都应从全新上下文开始时，请设置 `sessionScope: "per-call"`，例如前台接待、预约、IVR 或 Google Meet 桥接流程，因为在这些场景中，同一个电话号码可能代表不同的会议。

Voice Call 将生成的会话键存储在配置的智能体命名空间下（`agent:<agentId>:voice:*`）。原始显式集成键会解析到同一命名空间：规范的 `agent:<configuredAgentId>:*` 键保留其所有者，并遵循核心 `session.mainKey`/全局范围别名规则；外部或格式错误的 `agent:*` 输入会作为不透明键限定在配置的智能体下；`global` 和 `unknown` 仍作为全局哨兵值。

## 实时语音对话

`realtime` 为实时通话音频选择全双工实时语音提供商。它与 `streaming` 相互独立，后者仅将音频转发给实时转写提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 结合使用。每通电话只能选择一种音频模式。
</Warning>

当前运行时行为：

- Twilio 和 Telnyx 支持 `realtime.enabled`。
- `realtime.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供商插件注册。
- 提供商自有的原始配置位于 `realtime.providers.<providerId>` 下。
- 默认情况下，Voice Call 会公开共享的 `openclaw_agent_consult` 实时工具。当呼叫者要求进行更深入的推理、获取当前信息或使用常规 OpenClaw 工具时，实时模型可以调用它。
- `realtime.consultPolicy` 可选择性地添加指导，说明实时模型应在何时调用 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 默认关闭。启用后，Voice Call 会在设置会话时，将受限长度的智能体身份信息和选定的工作区文件摘要注入实时提供商的指令中。
- `realtime.fastContext.enabled` 默认关闭。启用后，Voice Call 会先在已索引的记忆/会话上下文中搜索咨询问题，并在 `realtime.fastContext.timeoutMs` 时间内将这些片段返回给实时模型；仅当 `realtime.fastContext.fallbackToConsult` 为 true 时，才会回退到完整的咨询智能体。
- 如果 `realtime.provider` 指向未注册的提供商，或者根本没有注册实时语音提供商，Voice Call 会记录警告并跳过实时媒体，而不是让整个插件失败。
- 当 `realtime.enabled` 为 true 时，`inboundPolicy` 不得为 `"disabled"`；`validateProviderConfig` 会拒绝这种组合。
- 如果存在已存储的呼叫会话，咨询会话键会复用该会话；否则会回退到配置的 `sessionScope`（默认为 `per-phone`，隔离呼叫可使用 `per-call`）。

### 工具策略

`realtime.toolPolicy` 控制咨询运行：

| 策略             | 行为                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公开咨询工具，并将常规智能体限制为只能使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 公开咨询工具，并允许常规智能体使用正常的智能体工具策略。                                                      |
| `none`           | 不公开咨询工具。自定义 `realtime.tools` 仍会传递给实时提供商。                               |

`realtime.consultPolicy` 仅控制实时模型的指令：

| 策略          | 指导                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留默认提示词，由提供商决定何时调用咨询工具。              |
| `substantive` | 直接回答简单的对话衔接内容；涉及事实、记忆、工具或上下文前先进行咨询。 |
| `always`      | 在每个实质性回答之前进行咨询。                                                        |

### 智能体语音上下文

如果希望语音桥接听起来像配置的 OpenClaw 智能体，同时避免普通轮次承担一次完整智能体咨询的往返开销，请启用 `realtime.agentContext`。上下文摘要只会在创建实时会话时添加一次，因此不会增加每轮延迟。对 `openclaw_agent_consult` 的调用仍会运行完整的 OpenClaw 智能体，并应当用于工具操作、当前信息、记忆查询或工作区状态。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### 实时提供商示例

<Tabs>
  <Tab title="Google Gemini Live">
    默认值：API key 来自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY`
    或 `GOOGLE_API_KEY`；模型为 `gemini-3.1-flash-live-preview`；
    语音为 `Kore`。`sessionResumption` 和 `contextWindowCompression` 默认启用，
    适用于时间更长、可重新连接的呼叫。使用 `silenceDurationMs`、
    `startSensitivity` 和 `endSensitivity` 可针对电话音频调整更快的轮次切换。

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

有关提供商特定的实时语音选项，请参阅 [Google 提供商](/zh-CN/providers/google)和
[OpenAI provider](/zh-CN/providers/openai)。

## 流式转录

`streaming` 为实时呼叫音频选择实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时转录提供商。
- 内置实时转录提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的提供商插件注册。
- 提供商自有的原始配置位于 `streaming.providers.<providerId>` 下。
- Twilio 发送已接受的流 `start` 消息后，Voice Call 会立即注册该流，在提供商连接期间将入站媒体排队传递给转录提供商，并且仅在实时转录准备就绪后才开始初始问候。
- 如果 `streaming.provider` 指向未注册的提供商，或者没有注册任何提供商，Voice Call 会记录警告并跳过媒体流式传输，而不是让整个插件失败。

### 流式传输提供商示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API key 为 `streaming.providers.openai.apiKey` 或
    `OPENAI_API_KEY`；模型为 `gpt-4o-transcribe`；`silenceDurationMs: 800`；
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
    默认值：API key 为 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`（如果两者均未设置，
    则回退到 xAI OAuth 身份验证配置文件）；端点为
    `wss://api.x.ai/v1/stt`；编码为 `mulaw`；采样率为 `8000`；
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

## 呼叫 TTS

Voice Call 使用核心 `messages.tts` 配置为呼叫提供流式语音。你可以在插件配置中使用**相同结构**覆盖它——该配置会与 `messages.tts` 进行深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**语音呼叫会忽略 Microsoft 语音。** 电话语音合成要求提供商实现面向电话的输出；Microsoft 语音提供商未实现该输出，因此呼叫会跳过它，并改为尝试回退链中的其他提供商。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流式传输时使用核心 TTS；否则呼叫会回退到提供商原生语音。
- 如果 Twilio 媒体流已处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果此时电话 TTS 不可用，播放请求会失败，而不是混合两条播放路径。
- 当电话 TTS 回退到次要提供商时，Voice Call 会记录包含提供商链（`from`、`to`、`attempts`）的警告，以便调试。
- 当 Twilio 插话或流拆除操作清除待处理的 TTS 队列时，已排队的播放请求会正常结束，而不会让等待播放完成的呼叫者一直挂起。

### TTS 示例

<Tabs>
  <Tab title="仅使用核心 TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="覆盖为 ElevenLabs（仅限呼叫）">
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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

## 入站呼叫

入站策略默认为 `disabled`。要启用入站呼叫，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是一种低可信度的来电显示筛选机制。该插件会规范化提供商提供的 `From` 值，并将其与 `allowFrom` 进行比较。
Webhook 验证可确认消息确由提供商投递并保证有效载荷完整性，
但它**无法**证明 PSTN/VoIP 主叫号码的所有权。应将
`allowFrom` 视为来电显示过滤，而非强主叫身份验证。
</Warning>

自动响应使用智能体系统。可通过 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 进行调整。

### 按号码路由

当一个 Voice Call 插件接收多个电话号码的来电，并且每个号码都应表现得像不同线路时，请使用 `numbers`。例如，
一个号码可以使用随和的个人助理，另一个号码则可以使用商务
角色、不同的响应智能体以及不同的 TTS 语音。

路由依据提供商提供的被叫 `To` 号码进行选择。键必须是
E.164 号码。来电时，Voice Call 会解析一次匹配的
路由，将匹配路由存储在通话记录中，并在问候语、经典自动响应
路径、实时协商路径和 TTS 播放中复用该有效配置。如果没有匹配的路由，则使用全局 Voice Call
配置。出站通话不使用 `numbers`；发起通话时应显式传入出站
目标、消息和会话。

路由覆盖目前支持：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

路由中的 `tts` 值会深度合并到全局 Voice Call `tts` 配置上，因此
通常只需覆盖提供商语音：

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### 语音输出契约

对于自动响应，Voice Call 会在系统提示词后追加严格的语音输出契约，
要求返回 `{"spoken":"..."}` JSON 响应。Voice Call
会以防御性方式提取语音文本：

- 忽略标记为推理或错误内容的有效载荷。
- 解析直接 JSON、围栏中的 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能属于规划或元信息引言的段落。

这能让语音播放聚焦于面向来电者的文本，并避免将
规划文本泄漏到音频中。

### 会话启动行为

对于出站 `conversation` 通话，首条消息的处理与实时
播放状态绑定：

- 仅当初始问候语正在播放时，才会抑制插话队列清除和自动响应。
- 如果初始播放失败，通话会返回 `listening` 状态，初始消息仍保留在队列中以供重试。
- Twilio 流式传输的初始播放会在流连接时立即开始，不会额外延迟。
- 插话会中止正在进行的播放，并清除已排队但尚未播放的 Twilio TTS 条目。被清除的条目会以“已跳过”状态完成，因此后续响应逻辑无需等待永远不会播放的音频即可继续。
- 实时语音会话使用实时流自身的开场轮次。Voice Call **不会**为该初始消息发送旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` 会话会保持连接。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 **2000 毫秒**，然后
自动结束通话：

- 如果流在此时间窗口内重新连接，则取消自动结束。
- 如果宽限期过后没有流重新注册，则结束通话，以防通话一直停留在活动状态。

## 过期通话清理器

使用 `staleCallReaperSeconds`（默认值为 **120**）结束始终
无人接听且从未进入实时会话状态的通话，例如提供商始终未投递
终止 Webhook 的通知模式通话。将其设置为 `0` 可
禁用此功能。

清理器每 30 秒运行一次，并且只结束没有
`answeredAt` 时间戳，且尚未处于终止状态或实时
（`speaking`/`listening`）状态的通话，因此已接听的会话绝不会被
此定时器清理；`maxDurationSeconds`（默认值为 300）是另一个独立上限，
用于结束持续时间过长的已接听通话。

对于运营商可能需要较长时间才能投递响铃/接听
Webhook 的通知类流程，应将 `staleCallReaperSeconds` 提高到默认值以上，
避免过早清理虽然较慢但正常的通话；`120`-`300` 秒是合理的生产环境
范围。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook 安全

当 Gateway 网关前方存在代理或隧道时，插件会重建
用于签名验证的公共 URL。以下选项控制信任哪些
转发标头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允许列表中的转发标头主机。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  无需允许列表即可信任转发标头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求的远程 IP 与列表匹配时才信任转发标头。
</ParamField>

其他保护措施：

- Twilio、Telnyx 和 Plivo 已启用 Webhook **重放保护**。对于重放的有效 Webhook 请求，系统会确认接收，但跳过其副作用。
- Twilio 会话轮次的 `<Gather>` 回调中包含每轮令牌，因此过期或重放的语音回调无法满足更新的待处理转录轮次。
- 如果缺少提供商要求的签名标头，未经身份验证的 Webhook 请求会在读取请求正文前被拒绝。
- voice-call Webhook 在签名验证前使用共享的身份验证前正文读取配置（正文最大 64 KB、读取超时 5 秒），并对每个键设置进行中请求上限（默认每个键最多 8 个并发请求）。

使用稳定公共主机的示例：

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

当 Gateway 网关已在运行时，操作类 `voicecall` 命令会
委托给 Gateway 网关拥有的 voice-call 运行时，因此 CLI 不会绑定
第二个 Webhook 服务器。如果无法访问 Gateway 网关，这些命令会回退到
独立 CLI 运行时。

`latency` 从默认 voice-call 存储路径读取 `calls.jsonl`。使用
`--file <path>` 指向不同的日志，使用 `--last <n>` 将
分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的最小值、最大值、平均值、
p50 和 p95。

## 智能体工具

工具名称：`voice_call`。

| 操作            | 参数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call 插件附带一个对应的智能体 Skills。

## Gateway RPC

| 方法                        | 参数                                                             | 说明                                                                                         |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | 省略 `to` 时回退到 `toNumber` 配置。                                                         |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | 与 `initiate` 相同，但也接受连接前 `dtmfSequence`。                                          |
| `voicecall.continue`        | `callId`, `message`                                              | 阻塞直到该轮次完成；返回转录文本。                                                           |
| `voicecall.continue.start`  | `callId`, `message`                                              | 异步变体：立即返回 `operationId`。                                                           |
| `voicecall.continue.result` | `operationId`                                                    | 轮询待处理的 `voicecall.continue.start` 操作以获取其结果。                                   |
| `voicecall.speak`           | `callId`, `message`                                              | 无需等待即可播放语音；当 `realtime.enabled` 时使用实时桥接。                                 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                              |
| `voicecall.end`             | `callId`                                                         |                                                                                              |
| `voicecall.status`          | `callId?`                                                        | 省略 `callId` 可列出所有活动通话。                                                           |

`dtmfSequence` 仅在 `mode: "conversation"` 下有效；如果通知模式通话
需要在连接后发送数字，应在通话创建后使用 `voicecall.dtmf`。

## 故障排除

### 设置 Webhook 暴露失败

请在运行 Gateway 网关的同一环境中运行设置：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

对于 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必须为绿色。即使已
配置 `publicUrl`，如果它指向本地或私有
网络空间，仍会失败，因为运营商无法回调这些地址。
不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` 或其他运营商级 NAT
范围用作 `publicUrl`。

Twilio 通知模式出站通话会在创建通话请求中直接发送初始 `<Say>` TwiML，
因此第一条语音消息不依赖 Twilio 获取 Webhook TwiML。状态
回调、会话通话、连接前 DTMF、实时流以及
连接后通话控制仍然需要公共 Webhook。

请选择一种公共暴露路径：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

更改配置后，重启或重新加载 Gateway 网关，然后运行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

除非传入 `--yes`，否则 `voicecall smoke` 仅执行试运行。

### 提供商凭据失败

检查所选提供商和必需的凭据字段：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`，或 `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID` 和
  `TELNYX_PUBLIC_KEY`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`，或
  `PLIVO_AUTH_ID` 和 `PLIVO_AUTH_TOKEN`。

凭据必须存在于 Gateway 网关主机上。编辑本地 shell 配置文件不会影响已在运行的 Gateway 网关，除非它重启或重新加载其环境。

### 通话已开始，但提供商 Webhook 未到达

确认提供商控制台指向确切的公共 Webhook URL：

```text
https://voice.example.com/voice/webhook
```

然后检查运行时状态：

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

常见原因：

- `publicUrl` 指向的路径与 `serve.path` 不同。
- Gateway 网关启动后，隧道 URL 发生了变化。
- 代理转发了请求，但删除或重写了主机或协议标头。
- 防火墙或 DNS 将公共主机名路由到了 Gateway 网关以外的位置。
- Gateway 网关重启时未启用 Voice Call 插件。

当 Gateway 网关前方有反向代理或隧道时，将 `webhookSecurity.allowedHosts` 设置为公共主机名，或对已知代理地址使用 `webhookSecurity.trustedProxyIPs`。仅当代理边界由你控制时，才使用 `webhookSecurity.trustForwardingHeaders`。

### 签名验证失败

提供商签名会依据 OpenClaw 从传入请求中重建的公共 URL 进行检查。如果签名验证失败：

- 确认提供商 Webhook URL 与 `publicUrl` 完全匹配，包括协议、主机和路径。
- 对于 ngrok 免费套餐 URL，请在隧道主机名发生变化时更新 `publicUrl`。
- 确保代理保留原始主机和协议标头，或配置 `webhookSecurity.allowedHosts`。
- 除本地测试外，不要启用 `skipSignatureVerification`。

### Google Meet 的 Twilio 加入失败

Google Meet 使用此插件通过 Twilio 拨号加入。首先验证 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

然后明确验证 Google Meet 传输方式：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 状态正常，但 Meet 参与者始终未加入，请检查 Meet 拨入号码、PIN 和 `--dtmf-sequence`。电话通话可能正常，但会议会拒绝或忽略错误的 DTMF 序列。

Google Meet 通过 `voicecall.start` 启动 Twilio 电话链路，并附带连接前 DTMF 序列。由 PIN 派生的序列会将 Google Meet 插件的 `voiceCall.dtmfDelayMs`（默认值为 **12000 毫秒**）作为前置 Twilio 等待数字，因为 Meet 拨入提示可能较晚出现。随后，Voice Call 会在请求开场问候语音前重定向回实时处理。

使用 `openclaw logs --follow` 查看实时阶段追踪。正常的 Twilio Meet 加入会按以下顺序记录日志：

- Google Meet 将 Twilio 加入委托给 Voice Call。
- Voice Call 存储连接前 DTMF TwiML。
- 在实时处理前使用并提供 Twilio 初始 TwiML。
- Voice Call 为 Twilio 通话提供实时 TwiML。
- Google Meet 在 DTMF 后延迟结束后，通过 `voicecall.speak` 请求开场语音。

`openclaw voicecall tail` 仍会显示持久化的通话记录；它适用于查看通话状态和转录文本，但并非所有 Webhook 或实时转换都会显示在其中。

### 实时通话没有语音

确认仅启用一种音频模式：`realtime.enabled` 和 `streaming.enabled` 不能同时为 `true`。

对于实时 Twilio/Telnyx 通话，还需验证：

- 已加载并注册实时提供商插件。
- `realtime.provider` 未设置，或其值为已注册的提供商名称。
- Gateway 网关进程可以访问提供商 API key。
- `openclaw logs --follow` 显示已提供实时 TwiML、实时桥接已启动，并且初始问候语已加入队列。

## 相关内容

- [Talk 模式](/zh-CN/nodes/talk)
- [文本转语音](/zh-CN/tools/tts)
- [语音唤醒](/zh-CN/nodes/voicewake)
