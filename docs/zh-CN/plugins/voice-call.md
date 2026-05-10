---
read_when:
    - 你想从 OpenClaw 发起外拨语音通话
    - 你正在配置或开发 voice-call 插件
    - 你需要用于电话通信的实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 发起出站语音通话并接听入站语音通话，可选支持实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-05-10T19:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

通过插件为 OpenClaw 提供语音通话。支持出站通知、
多轮对话、全双工实时语音、流式
转录，以及带允许列表策略的入站通话。

**当前提供商：** `twilio`（Programmable Voice + Media Streams）、
`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput
speech）、`mock`（开发/无网络）。

<Note>
语音通话插件运行在 **Gateway 网关进程内**。如果你使用
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

    使用裸包名以跟随当前官方发布标签。仅在需要可复现安装时，
    才固定到精确版本。

    之后重启 Gateway 网关，以便插件加载。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整结构见下方
    [配置](#configuration)）。至少需要：
    `provider`、提供商凭证、`fromNumber`，以及可公开访问的
    webhook URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    默认输出适合在聊天日志和终端中阅读。它会检查
    插件启用状态、提供商凭证、webhook 暴露情况，以及
    是否只有一个音频模式（`streaming` 或 `realtime`）处于启用状态。
    脚本请使用 `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是试运行。添加 `--yes` 才会实际发起一次简短的
    出站通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析为 **公共 webhook URL**。
如果 `publicUrl`、隧道 URL、Tailscale URL 或服务回退
解析为 loopback 或私有网络空间，设置会失败，而不是
启动一个无法接收运营商 webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true`，但所选提供商缺少凭证，
Gateway 网关启动会记录一条 setup-incomplete 警告，其中包含缺失键名，
并跳过启动运行时。命令、RPC 调用和智能体工具在使用时仍会
返回准确缺失的提供商配置。

<Note>
语音通话凭证接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 会通过标准 SecretRef 表面解析；见 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)。
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
    - `mock` 是本地开发提供商（不进行网络调用）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费层上，将 `publicUrl` 设置为确切的 ngrok URL；签名验证始终强制执行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带无效签名的 Twilio webhook。仅限本地开发。
    - Ngrok 免费层 URL 可能会变化或添加插页行为；如果 `publicUrl` 漂移，Twilio 签名会失败。生产环境：优先使用稳定域名或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 会关闭从未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections` 限制未认证的预启动套接字总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个来源 IP 的未认证预启动套接字数量。
    - `streaming.maxConnections` 限制打开的媒体流套接字总数（待处理 + 活跃）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或旧版
    `streaming.*` OpenAI 键的旧配置会由 `openclaw doctor --fix`
    重写。目前运行时回退仍会接受旧的语音通话键，但
    重写路径是 `openclaw doctor --fix`，兼容填隙层是
    临时的。

    自动迁移的流式传输键：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 会话作用域

默认情况下，语音通话使用 `sessionScope: "per-phone"`，这样来自
同一来电者的重复通话会保留对话记忆。当每个运营商通话都应从
全新上下文开始时，请设置 `sessionScope: "per-call"`，例如接待、
预约、IVR，或同一个电话号码可能代表不同会议的 Google Meet 桥接流程。

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。
它独立于 `streaming`，后者只会将音频转发给
实时转录提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 组合使用。每次通话请选择一个
音频模式。
</Warning>

当前运行时行为：

- Twilio Media Streams 支持 `realtime.enabled`。
- `realtime.provider` 是可选的。如果未设置，语音通话会使用第一个已注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供商插件注册。
- 提供商自有原始配置位于 `realtime.providers.<providerId>` 下。
- 语音通话默认公开共享的 `openclaw_agent_consult` 实时工具。当来电者请求更深入的推理、当前信息或普通 OpenClaw 工具时，实时模型可以调用它。
- `realtime.consultPolicy` 可选地添加指导，用于说明实时模型何时应调用 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 默认关闭。启用后，语音通话会在会话设置时向实时提供商指令中注入有界智能体身份、系统提示覆盖，以及选定的工作区文件胶囊。
- `realtime.fastContext.enabled` 默认关闭。启用后，语音通话会先针对咨询问题搜索已索引的记忆/会话上下文，并在 `realtime.fastContext.timeoutMs` 内将这些片段返回给实时模型；只有当 `realtime.fastContext.fallbackToConsult` 为 true 时，才会回退到完整咨询智能体。
- 如果 `realtime.provider` 指向未注册的提供商，或根本没有注册任何实时语音提供商，语音通话会记录警告并跳过实时媒体，而不是让整个插件失败。
- 咨询会话键会在可用时复用已存储的通话会话，然后回退到配置的 `sessionScope`（默认为 `per-phone`，隔离通话为 `per-call`）。

### 工具策略

`realtime.toolPolicy` 控制咨询运行：

| 策略             | 行为                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露咨询工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露咨询工具，并让常规智能体使用正常的智能体工具策略。                                                      |
| `none`           | 不暴露咨询工具。自定义 `realtime.tools` 仍会传递给实时提供商。                               |

`realtime.consultPolicy` 仅控制实时模型指令：

| 策略          | 指导                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 保留默认提示，并让提供商决定何时调用咨询工具。              |
| `substantive` | 直接回答简单的对话衔接内容，并在事实、记忆、工具或上下文之前进行咨询。 |
| `always`      | 在每个实质性回答之前进行咨询。                                                        |

### 智能体语音上下文

当语音桥接应听起来像配置的 OpenClaw 智能体，同时又不想为
普通轮次支付完整智能体咨询往返开销时，启用 `realtime.agentContext`。
上下文胶囊会在创建实时会话时添加一次，因此不会增加每轮延迟。
对 `openclaw_agent_consult` 的调用仍会运行完整的 OpenClaw 智能体，
并且应被用于工具工作、当前信息、记忆查找或工作区状态。

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
              includeSystemPrompt: true,
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
    默认值：API 密钥来自 `realtime.providers.google.apiKey`、
    `GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型为
    `gemini-2.5-flash-native-audio-preview-12-2025`；语音为 `Kore`。
    `sessionResumption` 和 `contextWindowCompression` 默认开启，适用于更长且
    可重连的通话。使用 `silenceDurationMs`、`startSensitivity` 和
    `endSensitivity` 来调优电话音频上更快的轮次交替。

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
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

请参阅 [Google 提供商](/zh-CN/providers/google) 和
[OpenAI provider](/zh-CN/providers/openai)，了解提供商特定的实时语音
选项。

## 流式转录

`streaming` 为实时通话音频选择实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选项。如果未设置，Voice Call 会使用第一个已注册的实时转录提供商。
- 内置实时转录提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），它们由各自的提供商插件注册。
- 提供商拥有的原始配置位于 `streaming.providers.<providerId>` 下。
- Twilio 发送已接受流的 `start` 消息后，Voice Call 会立即注册该流，在提供商连接期间通过转录提供商排队入站媒体，并且只有在实时转录就绪后才开始初始问候。
- 如果 `streaming.provider` 指向未注册的提供商，或者没有注册任何提供商，Voice Call 会记录一条警告并跳过媒体流式传输，而不是让整个插件失败。

### 流式传输提供商示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API 密钥 `streaming.providers.openai.apiKey` 或
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
    默认值：API 密钥 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；
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

## 通话 TTS

Voice Call 使用核心 `messages.tts` 配置为通话提供流式
语音。你可以在插件配置下以
**相同结构**覆盖它，它会与 `messages.tts` 深度合并。

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
**Microsoft 语音在语音通话中会被忽略。** 电话音频需要 PCM；
当前 Microsoft 传输不暴露电话 PCM 输出。
</Warning>

行为说明：

- 插件配置中旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；已提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流式传输时会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已经处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，播放请求会失败，而不是混合两条播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条包含提供商链（`from`、`to`、`attempts`）的警告，以便调试。
- 当 Twilio 插话或流拆除清空待处理 TTS 队列时，排队的播放请求会完成结算，而不是让等待播放完成的来电者一直挂起。

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

## 入站通话

入站策略默认为 `disabled`。要启用入站通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保证级别的来电显示筛选。该
插件会规范化提供商提供的 `From` 值，并将其与
`allowFrom` 比较。Webhook 验证会认证提供商投递和
载荷完整性，但它**不能**证明 PSTN/VoIP 来电号码
所有权。请将 `allowFrom` 视为来电显示过滤，而不是强来电者
身份。
</Warning>

自动响应使用智能体系统。通过 `responseModel`、
`responseSystemPrompt` 和 `responseTimeoutMs` 进行调优。

### 按号码路由

当一个 Voice Call 插件接收多个电话号码的通话，并且每个号码都应像不同线路一样运行时，请使用 `numbers`。例如，一个
号码可以使用随意的个人助理，而另一个号码使用商务
人设、不同的响应智能体以及不同的 TTS 语音。

路由会根据提供商提供的被叫 `To` 号码选择。键必须是
E.164 号码。通话到达时，Voice Call 会解析一次匹配路由，
将匹配的路由存储到通话记录中，并为问候、经典自动响应路径、实时咨询路径以及 TTS
播放复用该生效配置。如果没有路由匹配，则使用全局 Voice Call 配置。
出站通话不使用 `numbers`；发起通话时请显式传入出站目标、消息和
会话。

路由覆盖目前支持：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值会深度合并到全局 Voice Call `tts` 配置之上，因此
你通常只需要覆盖提供商语音：

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### 口语输出契约

对于自动响应，Voice Call 会向系统提示追加严格的口语输出契约：

```text
{"spoken":"..."}
```

Voice Call 会防御性地提取语音文本：

- 忽略标记为推理/错误内容的载荷。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能的规划/元信息开头段落。

这会让语音播放聚焦于面向来电者的文本，并避免
将规划文本泄露到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首条消息处理会绑定到实时
播放状态：

- 只有在初始问候正在主动播报时，才会抑制插话队列清空和自动响应。
- 如果初始播放失败，通话会返回 `listening`，并且初始消息会保留在队列中以便重试。
- Twilio 流式传输的初始播放会在流连接时启动，没有额外延迟。
- 插话会中止活动播放，并清除已排队但尚未播放的 Twilio TTS 条目。被清除的条目会解析为已跳过，因此后续响应逻辑可以继续，而不必等待永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。Voice Call **不会**为该初始消息发布旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` 会话会保持附加状态。

### Twilio 流断开宽限期

当 Twilio 媒体流断开连接时，Voice Call 会等待 **2000 ms**，然后
自动结束通话：

- 如果流在该窗口内重新连接，则会取消自动结束。
- 如果宽限期后没有流重新注册，则会结束通话，以防止活动通话卡住。

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 来结束从未收到终止
webhook 的通话（例如，从未完成的通知模式通话）。默认值
为 `0`（禁用）。

建议范围：

- **生产环境：** 对于通知式流程，使用 `120`–`300` 秒。
- 保持此值**高于 `maxDurationSeconds`**，这样正常调用才能完成。一个好的起点是 `maxDurationSeconds + 30–60` 秒。

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

当代理或隧道位于 Gateway 网关 前面时，插件会重建用于签名验证的公共 URL。这些选项控制信任哪些转发头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允许来自转发头的主机。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有允许列表的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求远端 IP 匹配列表时才信任转发头。
</ParamField>

其他保护措施：

- 已为 Twilio 和 Plivo 启用 Webhook **重放保护**。重放的有效 Webhook 请求会被确认，但会跳过副作用。
- Twilio 对话轮次在 `<Gather>` 回调中包含每轮 token，因此过期或重放的语音回调无法满足更新的待处理转录轮次。
- 当提供商所需的签名头缺失时，未认证的 Webhook 请求会在读取正文之前被拒绝。
- voice-call Webhook 使用共享的预认证正文配置（64 KB / 5 秒），并在签名验证前加上每 IP 的进行中请求上限。

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

当 Gateway 网关 已在运行时，操作性 `voicecall` 命令会委托给 Gateway 网关 所属的 voice-call 运行时，因此 CLI 不会绑定第二个 Webhook 服务器。如果无法访问 Gateway 网关，这些命令会回退到独立的 CLI 运行时。

`latency` 会从默认的 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向其他日志，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包含轮次延迟和监听等待时间的 p50/p90/p99。

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

此仓库在 `skills/voice-call/SKILL.md` 中附带了匹配的 skill 文档。

## Gateway 网关 RPC

| 方法                 | 参数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 仅在 `mode: "conversation"` 下有效。通知模式调用如果需要连接后的数字，应在调用存在后使用 `voicecall.dtmf`。

## 故障排除

### 设置无法通过 Webhook 暴露检查

从运行 Gateway 网关 的同一环境运行设置：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

对于 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必须为绿色。已配置的 `publicUrl` 如果指向本地或专用网络空间，仍会失败，因为运营商无法回拨这些地址。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`。

Twilio 通知模式外呼会在创建调用请求中直接发送初始 `<Say>` TwiML，因此第一条语音消息不依赖 Twilio 获取 Webhook TwiML。状态回调、对话调用、连接前 DTMF、实时流和连接后调用控制仍然需要公共 Webhook。

使用一个公共暴露路径：

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

除非传入 `--yes`，否则 `voicecall smoke` 是一次演练。

### 提供商凭证失败

检查所选提供商和必需的凭证字段：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和 `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

凭证必须存在于 Gateway 网关 主机上。编辑本地 shell profile 不会影响已经运行的 Gateway 网关，直到它重启或重新加载其环境。

### 调用已开始但提供商 Webhook 未到达

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
- 隧道 URL 在 Gateway 网关 启动后发生变化。
- 代理转发请求但剥离或重写了 host/proto 头。
- 防火墙或 DNS 将公共主机名路由到了 Gateway 网关 之外的位置。
- Gateway 网关 重启时未启用 Voice Call 插件。

当反向代理或隧道位于 Gateway 网关 前面时，将 `webhookSecurity.allowedHosts` 设置为公共主机名，或对已知代理地址使用 `webhookSecurity.trustedProxyIPs`。仅当代理边界在你的控制之下时，才使用 `webhookSecurity.trustForwardingHeaders`。

### 签名验证失败

提供商签名会根据 OpenClaw 从传入请求中重建的公共 URL 进行检查。如果签名失败：

- 确认提供商 Webhook URL 与 `publicUrl` 完全匹配，包括协议、主机和路径。
- 对于 ngrok 免费层 URL，当隧道主机名变化时更新 `publicUrl`。
- 确保代理保留原始 host 和 proto 头，或配置 `webhookSecurity.allowedHosts`。
- 不要在本地测试之外启用 `skipSignatureVerification`。

### Google Meet Twilio 加入失败

Google Meet 使用此插件进行 Twilio 拨入加入。首先验证 Voice Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

然后显式验证 Google Meet 传输：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 为绿色但 Meet 参与者始终未加入，请检查 Meet 拨入号码、PIN 和 `--dtmf-sequence`。电话呼叫可能是健康的，但会议可能会拒绝或忽略错误的 DTMF 序列。

Google Meet 通过 `voicecall.start` 使用连接前 DTMF 序列启动 Twilio 电话腿。基于 PIN 生成的序列会包含 Google Meet 插件的 `voiceCall.dtmfDelayMs`，作为前置 Twilio 等待数字。默认值为 12 秒，因为 Meet 拨入提示可能较晚出现。Voice Call 随后会在请求介绍问候语之前重定向回实时处理。

使用 `openclaw logs --follow` 查看实时阶段跟踪。健康的 Twilio Meet 加入会按以下顺序记录日志：

- Google Meet 将 Twilio 加入委托给 Voice Call。
- Voice Call 存储连接前 DTMF TwiML。
- Twilio 初始 TwiML 在实时处理前被消费并提供。
- Voice Call 为 Twilio 调用提供实时 TwiML。
- Google Meet 在 DTMF 后延迟之后使用 `voicecall.speak` 请求介绍语音。

`openclaw voicecall tail` 仍会显示持久化的调用记录；它对调用状态和转录很有用，但并非每个 Webhook/实时转换都会出现在其中。

### 实时调用没有语音

确认仅启用一种音频模式。`realtime.enabled` 和 `streaming.enabled` 不能同时为 true。

对于实时 Twilio 调用，还要验证：

- 已加载并注册实时提供商插件。
- `realtime.provider` 未设置或命名了已注册的提供商。
- 提供商 API key 可供 Gateway 网关 进程使用。
- `openclaw logs --follow` 显示实时 TwiML 已提供、实时桥接已启动，并且初始问候语已排队。

## 相关

- [Talk 模式](/zh-CN/nodes/talk)
- [文本转语音](/zh-CN/tools/tts)
- [语音唤醒](/zh-CN/nodes/voicewake)
