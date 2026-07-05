---
read_when:
    - 你想从 OpenClaw 发起出站语音通话
    - 你正在配置或开发语音通话插件
    - 你需要在电话系统中使用实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 发起出站语音通话并接收入站语音通话，可选支持实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-07-05T11:33:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6691a5764bd537a3782a2236e3f5744d411576c0f864b20a01f12096d8f7068
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw 通过插件实现语音通话：出站通知、多轮
对话、全双工实时语音、流式转录，以及
带允许列表策略的入站通话。

**提供商：** `mock`（开发用，无网络）、`plivo`（Voice API + XML 转接 +
GetInput 语音）、`telnyx`（Call Control v2）、`twilio`（Programmable Voice +
Media Streams）。

<Note>
Voice Call 插件运行在 **Gateway 网关进程内部**。如果你使用
远程 Gateway 网关，请在运行 Gateway 网关的机器上安装并配置该插件，
然后重启 Gateway 网关以加载它。
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

    使用不带版本号的包名以跟随当前发布标签。只有在需要可复现安装时，
    才固定精确版本。之后重启 Gateway 网关，让插件加载。

  </Step>
  <Step title="配置提供商和 webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（参见下方
    [配置](#configuration)）。至少需要：`provider`、提供商
    凭证、`fromNumber`，以及一个可公开访问的 webhook URL。
  </Step>
  <Step title="验证设置">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    检查插件是否启用、提供商凭证、webhook 暴露情况，
    以及是否只有一种音频模式（`streaming` 或 `realtime`）处于启用状态。

  </Step>
  <Step title="冒烟测试">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是试运行。添加 `--yes` 可发起一次简短的出站
    通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析到一个**公开 webhook URL**。
如果 `publicUrl`、隧道 URL、Tailscale URL 或服务回退
解析到 loopback 或私有网络空间，设置会失败，而不是
启动一个无法接收运营商 webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true` 但所选提供商缺少凭证，Gateway 网关
启动时会记录一条设置未完成警告，包含缺失键名，并跳过
启动运行时。命令、RPC 调用和智能体工具在使用时仍会返回
精确缺失的配置。

<Note>
语音通话凭证接受 SecretRefs。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 会通过标准 SecretRef surface 解析；参见 [SecretRef 凭证 surface](/zh-CN/reference/secretref-credential-surface)。
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
                  openai: { speakerVoice: "alloy" },
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### 配置参考

上面未展示的 `plugins.entries.voice-call.config` 下的顶层键：

| 键                              | 默认值       | 说明                                                                                   |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 总开关。                                                                               |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`。参见 [入站通话](#inbound-calls)。 |
| `allowFrom`                     | `[]`         | 用于 `inboundPolicy: "allowlist"` 的 E.164 允许列表。                                  |
| `maxDurationSeconds`            | `300`        | 每通电话的硬性时长上限，无论是否已接听都会强制执行。                                  |
| `staleCallReaperSeconds`        | `120`        | 参见 [过期通话清理器](#stale-call-reaper)。`0` 会禁用它。                             |
| `silenceTimeoutMs`              | `800`        | 经典（非实时）流程的语音结束静音检测。                                                |
| `transcriptTimeoutMs`           | `180000`     | 在放弃一个轮次前，等待来电者转录文本的最长时间。                                      |
| `ringTimeoutMs`                 | `30000`      | 出站通话的响铃超时。                                                                  |
| `maxConcurrentCalls`            | `1`          | 超过此限制的出站通话会被拒绝。                                                        |
| `outbound.notifyHangupDelaySec` | `3`          | 通知模式下，TTS 后等待自动挂断的秒数。                                                |
| `skipSignatureVerification`     | `false`      | 仅用于本地测试；切勿在生产环境启用。                                                  |
| `store`                         | 未设置       | 覆盖默认的 `~/.openclaw/voice-calls` 通话日志路径。                                   |
| `agentId`                       | `"main"`     | 用于生成响应和会话存储的智能体。                                                      |
| `responseModel`                 | 未设置       | 覆盖经典（非实时）响应的默认模型。                                                    |
| `responseSystemPrompt`          | 已生成       | 用于经典响应的自定义系统提示词。                                                      |
| `responseTimeoutMs`             | `30000`      | 经典响应生成的超时时间（毫秒）。                                                      |

<AccordionGroup>
  <Accordion title="提供商暴露和安全说明">
    - Twilio、Telnyx 和 Plivo 都需要一个**可公开访问**的 webhook URL。
    - `mock` 是本地开发提供商（不发起网络调用）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费层上，将 `publicUrl` 设置为精确的 ngrok URL；签名验证始终会强制执行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地代理）时，允许带无效签名的 Twilio webhook。仅限本地开发。
    - Ngrok 免费层 URL 可能变化，或添加中间页行为；如果 `publicUrl` 漂移，Twilio 签名会失败。生产环境：优先使用稳定域名或 Tailscale funnel。

  </Accordion>
  <Accordion title="流式连接上限">
    - `streaming.preStartTimeoutMs`（默认 `5000`）会关闭从未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections`（默认 `32`）限制未认证的预启动套接字总数。
    - `streaming.maxPendingConnectionsPerIp`（默认 `4`）限制每个源 IP 的未认证预启动套接字数。
    - `streaming.maxConnections`（默认 `128`）限制所有打开的媒体流套接字（待处理 + 活跃）。

  </Accordion>
  <Accordion title="旧版配置迁移">
    配置解析会自动规范化这些旧版键，并记录一条
    指明替代路径的警告；该兼容层会在未来版本
    （`2026.6.0`）中移除，因此请运行 `openclaw doctor --fix` 将已提交的
    配置重写为规范形态：

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

默认情况下，Voice Call 使用 `sessionScope: "per-phone"`，因此来自
同一来电者的重复通话会保留对话记忆。当每个运营商通话都应以
全新上下文开始时，请设置 `sessionScope: "per-call"`，例如前台接待、
预约、IVR，或 Google Meet 桥接流程，其中同一电话号码可能
代表不同会议。

Voice Call 会将生成的会话键存储在配置的智能体命名空间下
（`agent:<agentId>:voice:*`）。原始显式集成键会解析到同一
命名空间：规范的 `agent:<configuredAgentId>:*` 键会保留该
所有者，并遵循核心 `session.mainKey`/全局范围别名；外部或
格式错误的 `agent:*` 输入会作为不透明键限定在配置的
智能体下；`global` 和 `unknown` 会保留为全局哨兵值。

## 实时语音对话

`realtime` 为实时通话音频选择全双工实时语音提供商。
它独立于 `streaming`，后者只会将音频转发到实时
转录提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 组合使用。每通电话
请选择一种音频模式。
</Warning>

当前运行时行为：

- Twilio 和 Telnyx 支持 `realtime.enabled`。
- `realtime.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由各自的提供商插件注册。
- 提供商拥有的原始配置位于 `realtime.providers.<providerId>` 下。
- Voice Call 默认公开共享的 `openclaw_agent_consult` 实时工具。当来电者要求更深入的推理、当前信息或常规 OpenClaw 工具时，实时模型可以调用它。
- `realtime.consultPolicy` 可选择性地添加指导，说明实时模型应在何时调用 `openclaw_agent_consult`。
- `realtime.agentContext.enabled` 默认关闭。启用后，Voice Call 会在会话设置时将有界的智能体身份和选定的工作区文件胶囊注入实时提供商指令。
- `realtime.fastContext.enabled` 默认关闭。启用后，Voice Call 会先为 consult 问题搜索已索引的记忆/会话上下文，并在 `realtime.fastContext.timeoutMs` 内将这些片段返回给实时模型；只有当 `realtime.fastContext.fallbackToConsult` 为 true 时，才会回退到完整的 consult 智能体。
- 如果 `realtime.provider` 指向未注册的提供商，或根本没有注册任何实时语音提供商，Voice Call 会记录警告并跳过实时媒体，而不是让整个插件失败。
- 当 `realtime.enabled` 为 true 时，`inboundPolicy` 不得为 `"disabled"`；`validateProviderConfig` 会拒绝这种组合。
- consult 会话键会在可用时复用已存储的呼叫会话，然后回退到配置的 `sessionScope`（默认 `per-phone`，隔离呼叫为 `per-call`）。

### 工具策略

`realtime.toolPolicy` 控制 consult 运行：

| 策略 | 行为 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公开 consult 工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner` | 公开 consult 工具，并允许常规智能体使用正常的智能体工具策略。 |
| `none` | 不公开 consult 工具。自定义 `realtime.tools` 仍会透传给实时提供商。 |

`realtime.consultPolicy` 仅控制实时模型指令：

| 策略 | 指导 |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto` | 保留默认提示词，并让提供商决定何时调用 consult 工具。 |
| `substantive` | 直接回答简单的对话衔接内容，并在涉及事实、记忆、工具或上下文之前进行 consult。 |
| `always` | 在每个实质性回答前进行 consult。 |

### 智能体语音上下文

当语音桥接应听起来像已配置的 OpenClaw 智能体，但又不想在普通轮次中支付完整智能体 consult 往返成本时，启用 `realtime.agentContext`。上下文胶囊会在创建实时会话时添加一次，因此不会增加每轮延迟。对 `openclaw_agent_consult` 的调用仍会运行完整的 OpenClaw 智能体，并应当用于工具工作、当前信息、记忆查找或工作区状态。

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
    或 `GOOGLE_API_KEY`；模型为 `gemini-2.5-flash-native-audio-preview-12-2025`；
    语音为 `Kore`。`sessionResumption` 和 `contextWindowCompression` 默认开启，
    以支持更长且可重连的呼叫。使用 `silenceDurationMs`、
    `startSensitivity` 和 `endSensitivity` 调整电话音频上更快的轮次切换。

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

有关提供商特定的实时语音选项，请参阅 [Google 提供商](/zh-CN/providers/google) 和
[OpenAI provider](/zh-CN/providers/openai)。

## 流式转录

`streaming` 为实时呼叫音频选择实时转录提供商。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，Voice Call 会使用第一个已注册的实时转录提供商。
- 内置实时转录提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由各自的提供商插件注册。
- 提供商拥有的原始配置位于 `streaming.providers.<providerId>` 下。
- Twilio 发送已接受的流 `start` 消息后，Voice Call 会立即注册该流，在提供商连接期间通过转录提供商排队入站媒体，并且只在实时转录就绪后开始初始问候语。
- 如果 `streaming.provider` 指向未注册的提供商，或没有注册任何提供商，Voice Call 会记录警告并跳过媒体流式传输，而不是让整个插件失败。

### 流式提供商示例

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
    则回退到 xAI OAuth 凭证配置）；端点为
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

Voice Call 使用核心 `messages.tts` 配置为呼叫提供流式语音。
你可以在插件配置下用**相同形状**覆盖它，它会与 `messages.tts` 深度合并。

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
**语音呼叫会忽略 Microsoft speech。** 电话合成需要实现电话目标输出的提供商；Microsoft speech
提供商未实现，因此会在呼叫中跳过它，并改为尝试回退链中的其他提供商。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流式传输时，会使用核心 TTS；否则呼叫会回退到提供商原生语音。
- 如果 Twilio 媒体流已处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果在该状态下电话 TTS 不可用，播放请求会失败，而不是混合两条播放路径。
- 当电话 TTS 回退到次要提供商时，Voice Call 会记录一条包含提供商链（`from`、`to`、`attempts`）的警告以便调试。
- 当 Twilio 插话或流拆除清空待处理 TTS 队列时，已排队的播放请求会完成结算，而不是让等待播放完成的呼叫者一直挂起。

### TTS 示例

<Tabs>
  <Tab title="Core TTS only">
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
`inboundPolicy: "allowlist"` 是一种低保障的主叫号码筛选。该插件会规范化提供商给出的 `From` 值，并将其与 `allowFrom` 比较。Webhook 验证会认证提供商投递和载荷完整性，但它**不能**证明 PSTN/VoIP 主叫号码所有权。请将 `allowFrom` 视为主叫号码过滤，而不是强主叫身份。
</Warning>

自动响应使用智能体系统。可通过 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 调优。

### 按号码路由

当一个 Voice Call 插件接收多个电话号码的来电，并且每个号码都应像不同线路一样工作时，使用 `numbers`。例如，一个号码可以使用随和的个人助手，而另一个号码使用商务人设、不同的响应智能体和不同的 TTS 语音。

路由根据提供商给出的被叫 `To` 号码选择。键必须是 E.164 号码。来电到达时，Voice Call 会解析一次匹配路由，将匹配到的路由存储到通话记录中，并在问候语、经典自动响应路径、实时咨询路径和 TTS 播放中复用该有效配置。如果没有匹配的路由，则使用全局 Voice Call 配置。外呼不使用 `numbers`；发起通话时请显式传入外呼目标、消息和会话。

路由覆盖目前支持：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值会深度合并到全局 Voice Call `tts` 配置之上，因此通常只需覆盖提供商语音：

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

对于自动响应，Voice Call 会向系统提示追加严格的语音输出契约，要求返回 `{"spoken":"..."}` JSON 回复。Voice Call 会以防御方式提取语音文本：

- 忽略标记为推理/错误内容的载荷。
- 解析直接 JSON、围栏 JSON，或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能是规划/元信息开头的段落。

这会让语音播放聚焦于面向来电者的文本，并避免将规划文本泄漏到音频中。

### 对话启动行为

对于外呼 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 仅当初始问候语正在主动播放时，才会抑制插话队列清空和自动响应。
- 如果初始播放失败，通话会回到 `listening`，并且初始消息会保留在队列中以便重试。
- Twilio 流式传输的初始播放会在流连接时开始，不增加额外延迟。
- 插话会中止活动播放，并清除已排队但尚未播放的 Twilio TTS 条目。被清除的条目会解析为已跳过，因此后续响应逻辑可以继续，而无需等待永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。Voice Call **不会**为该初始消息发布旧版 `<Say>` TwiML 更新，因此外呼 `<Connect><Stream>` 会话会保持附加状态。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 **2000 ms** 后再自动结束通话：

- 如果流在该窗口内重新连接，则取消自动结束。
- 如果宽限期后没有流重新注册，则结束通话，防止活动通话卡住。

## 过期通话清理器

使用 `staleCallReaperSeconds`（默认 **120**）结束从未接听且从未进入实时对话状态的通话，例如提供商从不投递终止 Webhook 的通知模式通话。将其设为 `0` 可禁用。

清理器每 30 秒运行一次，并且只会结束没有 `answeredAt` 时间戳、且尚未处于终止或实时（`speaking`/`listening`）状态的通话，因此已接听的对话永远不会被该定时器清理；`maxDurationSeconds`（默认 300）是单独的上限，用于结束运行过久的已接听通话。

对于运营商可能较慢投递振铃/接听 Webhook 的通知式流程，请将 `staleCallReaperSeconds` 提高到默认值以上，避免缓慢但正常的通话被过早清理；`120`-`300` 秒是合理的生产范围。

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

当代理或隧道位于 Gateway 网关前面时，该插件会重建用于签名验证的公共 URL。这些选项控制信任哪些转发头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允许列表中的转发头主机。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有允许列表的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求远端 IP 与列表匹配时才信任转发头。
</ParamField>

其他保护：

- Twilio、Telnyx 和 Plivo 已启用 Webhook **重放保护**。被重放的有效 Webhook 请求会被确认，但会跳过副作用。
- Twilio 对话轮次在 `<Gather>` 回调中包含逐轮令牌，因此过期/重放的语音回调不能满足较新的待处理转录轮次。
- 当缺少提供商要求的签名头时，未经认证的 Webhook 请求会在读取正文之前被拒绝。
- voice-call Webhook 使用共享的认证前正文读取配置（最大 64 KB 正文、5 秒读取超时），并在签名验证前应用按键的在途上限（默认每个键 8 个并发请求）。

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

当 Gateway 网关已在运行时，操作型 `voicecall` 命令会委托给 Gateway 网关拥有的 voice-call 运行时，因此 CLI 不会绑定第二个 Webhook 服务器。如果无法访问 Gateway 网关，这些命令会回退到独立 CLI 运行时。

`latency` 会从默认 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同日志，并使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 min/max/avg、p50 和 p95。

## 智能体工具

工具名称：`voice_call`。

| 操作          | 参数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call 插件随附一个匹配的智能体技能。

## Gateway 网关 RPC

| 方法                      | 参数                                                             | 说明                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | 省略 `to` 时回退到 `toNumber` 配置。                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | 与 `initiate` 相同，但也接受连接前 `dtmfSequence`。           |
| `voicecall.continue`        | `callId`, `message`                                              | 阻塞直到该轮次解析完成；返回转录。                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | 异步变体：立即返回 `operationId`。                      |
| `voicecall.continue.result` | `operationId`                                                    | 轮询待处理的 `voicecall.continue.start` 操作以获取其结果。      |
| `voicecall.speak`           | `callId`, `message`                                              | 不等待即说话；当 `realtime.enabled` 时使用实时桥接。 |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | 省略 `callId` 可列出所有活动通话。                                   |

`dtmfSequence` 仅在 `mode: "conversation"` 下有效；如果通知模式通话在连接后需要数字，应在通话存在后使用 `voicecall.dtmf`。

## 故障排查

### 设置无法暴露 Webhook

从运行 Gateway 网关的同一环境中运行设置：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

对于 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必须为绿色。已配置的 `publicUrl` 如果指向本地或私有网络空间，仍会失败，因为运营商无法回拨这些地址。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7`、`fd00::/8` 或其他运营商级 NAT 范围用作 `publicUrl`。

Twilio 通知模式外呼会在创建通话请求中直接发送初始 `<Say>` TwiML，因此第一条语音消息不依赖 Twilio 获取 Webhook TwiML。状态回调、对话通话、连接前 DTMF、实时流和连接后通话控制仍然需要公共 Webhook。

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

除非传入 `--yes`，否则 `voicecall smoke` 是一次空运行。

### 提供商凭证失败

检查所选提供商和必需的凭证字段：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或
  `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和
  `fromNumber`，或 `TELNYX_API_KEY`、`TELNYX_CONNECTION_ID` 和
  `TELNYX_PUBLIC_KEY`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`，或
  `PLIVO_AUTH_ID` 和 `PLIVO_AUTH_TOKEN`。

凭证必须存在于 Gateway 网关主机上。编辑本地 shell 配置文件
不会影响已经运行的 Gateway 网关，直到它重启或重新加载其
环境。

### 呼叫开始，但提供商 Webhook 未到达

确认提供商控制台指向准确的公共 Webhook URL：

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
- 隧道 URL 在 Gateway 网关启动后发生了变化。
- 代理转发了请求，但剥离或重写了 host/proto 标头。
- 防火墙或 DNS 将公共主机名路由到了 Gateway 网关以外的位置。
- Gateway 网关重启时未启用 Voice Call 插件。

当 Gateway 网关前面有反向代理或隧道时，将
`webhookSecurity.allowedHosts` 设置为公共主机名，或对已知代理地址使用
`webhookSecurity.trustedProxyIPs`。仅当代理边界
在你的控制之下时，才使用 `webhookSecurity.trustForwardingHeaders`。

### 签名验证失败

提供商签名会根据 OpenClaw 从传入请求重构出的公共 URL 进行检查。如果签名失败：

- 确认提供商 Webhook URL 与 `publicUrl` 完全匹配，包括方案、主机和路径。
- 对于 ngrok 免费层级 URL，当隧道主机名变化时更新 `publicUrl`。
- 确保代理保留原始 host 和 proto 标头，或配置 `webhookSecurity.allowedHosts`。
- 不要在本地测试以外启用 `skipSignatureVerification`。

### Google Meet Twilio 加入失败

Google Meet 使用此插件进行 Twilio 拨入加入。首先验证 Voice
Call：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

然后显式验证 Google Meet 传输协议：

```bash
openclaw googlemeet setup --transport twilio
```

如果 Voice Call 正常但 Meet 参与者从未加入，请检查 Meet
拨入号码、PIN 和 `--dtmf-sequence`。电话呼叫可能正常，
但会议会拒绝或忽略不正确的 DTMF 序列。

Google Meet 通过 `voicecall.start` 使用
预连接 DTMF 序列启动 Twilio 电话分支。由 PIN 派生的序列包含 Google Meet
插件的 `voiceCall.dtmfDelayMs`（默认 **12000 ms**）作为前置 Twilio
等待数字，因为 Meet 拨入提示可能会延迟到达。然后 Voice Call
会在请求开场问候之前重定向回实时处理。

使用 `openclaw logs --follow` 查看实时阶段跟踪。正常的 Twilio Meet
加入会按此顺序记录日志：

- Google Meet 将 Twilio 加入委托给 Voice Call。
- Voice Call 存储预连接 DTMF TwiML。
- Twilio 初始 TwiML 在实时处理之前被使用并提供。
- Voice Call 为 Twilio 呼叫提供实时 TwiML。
- Google Meet 在 DTMF 后延迟之后通过 `voicecall.speak` 请求开场语音。

`openclaw voicecall tail` 仍会显示持久化的呼叫记录；它对
呼叫状态和转录很有用，但并非每个 Webhook/实时转换
都会出现在那里。

### 实时呼叫没有语音

确认只启用了一种音频模式：`realtime.enabled` 和
`streaming.enabled` 不能同时为 true。

对于实时 Twilio/Telnyx 呼叫，还要验证：

- 已加载并注册一个实时提供商插件。
- `realtime.provider` 未设置，或命名了一个已注册的提供商。
- 提供商 API key 对 Gateway 网关进程可用。
- `openclaw logs --follow` 显示已提供实时 TwiML、实时桥已启动，并且初始问候已入队。

## 相关

- [Talk 模式](/zh-CN/nodes/talk)
- [文本转语音](/zh-CN/tools/tts)
- [语音唤醒](/zh-CN/nodes/voicewake)
