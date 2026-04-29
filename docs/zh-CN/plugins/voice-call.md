---
read_when:
    - 你想从 OpenClaw 发起外拨语音通话
    - 你正在配置或开发语音通话插件
    - 你需要在电话场景中使用实时语音或流式转录
sidebarTitle: Voice call
summary: 通过 Twilio、Telnyx 或 Plivo 拨打出站语音电话并接听入站语音电话，可选支持实时语音和流式转录
title: 语音通话插件
x-i18n:
    generated_at: "2026-04-29T05:41:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

通过插件为 OpenClaw 提供语音通话。支持出站通知、
多轮对话、全双工实时语音、流式转写，以及带允许列表策略的入站通话。

**当前提供商：** `twilio`（Programmable Voice + Media Streams）、
`telnyx`（Call Control v2）、`plivo`（Voice API + XML transfer + GetInput
speech）、`mock`（开发/无网络）。

<Note>
语音通话插件在 **Gateway 网关进程内部**运行。如果你使用远程
Gateway 网关，请在运行 Gateway 网关的机器上安装并配置该插件，
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

    如果 npm 将 OpenClaw 拥有的软件包报告为已弃用，则该软件包版本
    来自较旧的外部软件包发布线；请使用当前打包的 OpenClaw
    构建，或在发布更新的 npm 软件包之前使用本地文件夹路径。

    之后重启 Gateway 网关，以便加载插件。

  </Step>
  <Step title="Configure provider and webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整结构见下方
    [配置](#configuration)）。至少需要：
    `provider`、提供商凭据、`fromNumber`，以及一个公网可访问的
    webhook URL。
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    默认输出适合在聊天日志和终端中阅读。它会检查
    插件是否启用、提供商凭据、webhook 暴露情况，以及是否只有一个
    音频模式（`streaming` 或 `realtime`）处于激活状态。脚本请使用
    `--json`。

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是空运行。添加 `--yes` 会实际发起一个简短的
    出站通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析为一个**公共 webhook URL**。
如果 `publicUrl`、隧道 URL、Tailscale URL 或服务回退地址
解析为 loopback 或私有网络空间，设置会失败，而不是启动一个
无法接收运营商 webhook 的提供商。
</Warning>

## 配置

如果 `enabled: true` 但所选提供商缺少凭据，
Gateway 网关启动时会记录一条设置未完成警告，其中包含缺失的键名，并
跳过启动运行时。命令、RPC 调用和智能体工具在使用时仍会
返回确切缺失的提供商配置。

<Note>
语音通话凭据接受 SecretRef。`plugins.entries.voice-call.config.twilio.authToken` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 会通过标准 SecretRef 表面解析；请参阅 [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。
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
    - Twilio、Telnyx 和 Plivo 都需要一个**公网可访问**的 webhook URL。
    - `mock` 是本地开发提供商（不进行网络调用）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费层上，将 `publicUrl` 设置为确切的 ngrok URL；签名验证始终会强制执行。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地 agent）时，才允许签名无效的 Twilio webhook。仅限本地开发。
    - Ngrok 免费层 URL 可能会变化或添加插页行为；如果 `publicUrl` 漂移，Twilio 签名会失败。生产环境：优先使用稳定域名或 Tailscale funnel。

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` 会关闭从未发送有效 `start` 帧的 socket。
    - `streaming.maxPendingConnections` 限制未经认证的预启动 socket 总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个来源 IP 未经认证的预启动 socket 数量。
    - `streaming.maxConnections` 限制打开的媒体流 socket 总数（待处理 + 活跃）。

  </Accordion>
  <Accordion title="Legacy config migrations">
    使用 `provider: "log"`、`twilio.from` 或旧版
    `streaming.*` OpenAI 键的较旧配置会由 `openclaw doctor --fix` 重写。
    目前运行时回退仍接受旧的语音通话键，但
    重写路径是 `openclaw doctor --fix`，兼容 shim
    是临时的。

    自动迁移的流式键：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 实时语音对话

`realtime` 为实时通话音频选择一个全双工实时语音提供商。
它独立于 `streaming`，后者只会将音频转发给
实时转写提供商。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 组合使用。每次通话请选择一个
音频模式。
</Warning>

当前运行时行为：

- Twilio Media Streams 支持 `realtime.enabled`。
- `realtime.provider` 是可选的。如果未设置，语音通话会使用第一个注册的实时语音提供商。
- 内置实时语音提供商：Google Gemini Live（`google`）和 OpenAI（`openai`），由其提供商插件注册。
- 提供商拥有的原始配置位于 `realtime.providers.<providerId>` 下。
- 语音通话默认暴露共享的 `openclaw_agent_consult` 实时工具。当来电者请求更深入的推理、当前信息或普通 OpenClaw 工具时，实时模型可以调用它。
- 如果 `realtime.provider` 指向未注册的提供商，或者根本没有注册实时语音提供商，语音通话会记录警告并跳过实时媒体，而不是让整个插件失败。
- 咨询会话键会在可用时复用现有语音会话，然后回退到主叫/被叫电话号码，以便后续咨询调用在通话期间保留上下文。

### 工具策略

`realtime.toolPolicy` 控制咨询运行：

| 策略             | 行为                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露咨询工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露咨询工具，并让常规智能体使用普通智能体工具策略。                                                                                    |
| `none`           | 不暴露咨询工具。自定义 `realtime.tools` 仍会传递给实时提供商。                                                                          |

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

有关提供商特定的实时语音选项，请参阅 [Google 提供商](/zh-CN/providers/google) 和
[OpenAI provider](/zh-CN/providers/openai)。

## 流式转写

`streaming` 为实时通话音频选择一个实时转写提供商。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，语音通话会使用第一个注册的实时转写提供商。
- 内置实时转写提供商：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由其提供商插件注册。
- 提供商拥有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向未注册的提供商，或者没有注册任何提供商，语音通话会记录警告并跳过媒体流式传输，而不是让整个插件失败。

### 流式提供商示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API key 为 `streaming.providers.openai.apiKey` 或
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

## 通话的 TTS

Voice Call 使用核心 `messages.tts` 配置为通话提供流式语音。你可以在插件配置下用**相同结构**覆盖它，它会与 `messages.tts` 深度合并。

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
**Microsoft speech 会被语音通话忽略。** 电话音频需要 PCM；当前 Microsoft 传输不公开电话 PCM 输出。
</Warning>

行为说明：

- 插件配置中的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）会由 `openclaw doctor --fix` 修复；提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流式传输时会使用核心 TTS；否则通话会回退到提供商原生语音。
- 如果 Twilio 媒体流已处于活动状态，Voice Call 不会回退到 TwiML `<Say>`。如果该状态下电话 TTS 不可用，播放请求会失败，而不是混用两条播放路径。
- 当电话 TTS 回退到次级提供商时，Voice Call 会记录一条包含提供商链（`from`、`to`、`attempts`）的警告，便于调试。
- 当 Twilio 插话或流拆除清空待处理 TTS 队列时，排队的播放请求会完成结算，而不是让呼叫者一直等待播放完成。

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

## 呼入通话

呼入策略默认为 `disabled`。要启用呼入通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保证级别的来电显示筛选。该插件会规范化提供商提供的 `From` 值，并将其与 `allowFrom` 比较。Webhook 验证会认证提供商交付和载荷完整性，但它**不会**证明 PSTN/VoIP 主叫号码所有权。请将 `allowFrom` 视为来电显示过滤，而不是强主叫身份。
</Warning>

自动响应使用智能体系统。可通过 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 调整。

### 语音输出契约

对于自动响应，Voice Call 会在系统提示末尾追加严格的语音输出契约：

```text
{"spoken":"..."}
```

Voice Call 会以防御方式提取语音文本：

- 忽略标记为推理/错误内容的载荷。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退到纯文本，并移除可能的规划/元信息开头段落。

这会让语音播放聚焦于面向呼叫者的文本，并避免将规划文本泄漏到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首条消息处理与实时播放状态绑定：

- 仅当初始问候正在主动播放时，才会抑制插话队列清空和自动响应。
- 如果初始播放失败，通话会返回 `listening`，初始消息仍会排队等待重试。
- Twilio 流式传输的初始播放会在流连接时启动，无需额外延迟。
- 插话会中止活动播放，并清空已排队但尚未播放的 Twilio TTS 条目。被清空的条目会解析为已跳过，因此后续响应逻辑可以继续，而不必等待永远不会播放的音频。
- 实时语音对话使用实时流自身的开场轮次。Voice Call **不会**为该初始消息发布旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` 会话会保持附着。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 会等待 **2000 ms** 后再自动结束通话：

- 如果流在该窗口内重新连接，自动结束会被取消。
- 如果宽限期后没有流重新注册，通话会被结束，以防止活动通话卡住。

## 过期通话清理器

使用 `staleCallReaperSeconds` 结束从未收到终止 Webhook 的通话（例如从未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产：** 对通知式流程使用 `120`–`300` 秒。
- 保持此值**高于 `maxDurationSeconds`**，以便正常通话可以完成。一个较好的起点是 `maxDurationSeconds + 30–60` 秒。

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

当代理或隧道位于 Gateway 网关前面时，插件会重建用于签名验证的公共 URL。这些选项控制信任哪些转发头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  允许列表中的转发头主机。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有允许列表的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅当请求远端 IP 与列表匹配时信任转发头。
</ParamField>

额外保护：

- Twilio 和 Plivo 已启用 Webhook **重放保护**。重放的有效 Webhook 请求会被确认，但会跳过副作用。
- Twilio 对话轮次在 `<Gather>` 回调中包含每轮 token，因此过期/重放的语音回调无法满足更新的待处理转录轮次。
- 当缺少提供商所需的签名头时，未经认证的 Webhook 请求会在读取正文前被拒绝。
- voice-call Webhook 使用共享的预认证正文配置（64 KB / 5 秒），并在签名验证前应用按 IP 的进行中请求上限。

具有稳定公共主机的示例：

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

`latency` 从默认 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同日志，并使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包含轮次延迟和监听等待时间的 p50/p90/p99。

## Agent 工具

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

- [通话模式](/zh-CN/nodes/talk)
- [文本转语音](/zh-CN/tools/tts)
- [语音唤醒](/zh-CN/nodes/voicewake)
