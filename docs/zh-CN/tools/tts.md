---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商、回退链或角色语音
    - 使用 `/tts` 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 用于外发回复的文本转语音——提供商、角色语音、斜杠命令，以及按渠道区分的输出
title: 文本转语音
x-i18n:
    generated_at: "2026-04-26T06:20:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9844f0efe139e4ea4dd8f15b2476c5b55aa0d97c89e7b54125b29580e3b8c78e
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以将外发回复转换为音频，覆盖 **13 个语音提供商**，并在 Feishu、Matrix、Telegram 和 WhatsApp 上发送原生语音消息，在其他所有地方发送音频附件，以及为电话和 Talk 提供 PCM/Ulaw 流。

## 快速开始

<Steps>
  <Step title="选择提供商">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和 Local CLI 无需 API 密钥即可使用。完整列表请参见 [提供商矩阵](#supported-providers)。
  </Step>
  <Step title="设置 API 密钥">
    导出你的提供商所需的环境变量（例如 `OPENAI_API_KEY`、`ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 不需要密钥。
  </Step>
  <Step title="在配置中启用">
    设置 `messages.tts.auto: "always"` 和 `messages.tts.provider`：

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="在聊天中试用">
    `/tts status` 会显示当前状态。`/tts audio Hello from OpenClaw` 会发送一次性的音频回复。
  </Step>
</Steps>

<Note>
默认情况下，自动 TTS **关闭**。当未设置 `messages.tts.provider` 时，OpenClaw 会按注册表自动选择顺序挑选第一个已配置的提供商。
</Note>

## 支持的提供商

| 提供商 | 认证 | 说明 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`） | 原生 Ogg/Opus 语音便笺输出和电话支持。 |
| **ElevenLabs** | `ELEVENLABS_API_KEY` 或 `XI_API_KEY` | 支持语音克隆、多语言，并可通过 `seed` 实现确定性输出。 |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` | Gemini API TTS；通过 `promptTemplate: "audio-profile-v1"` 支持角色语音感知。 |
| **Gradium** | `GRADIUM_API_KEY` | 支持语音便笺和电话输出。 |
| **Inworld** | `INWORLD_API_KEY` | 流式 TTS API。支持原生 Opus 语音便笺和 PCM 电话。 |
| **Local CLI** | 无 | 运行已配置的本地 TTS 命令。 |
| **Microsoft** | 无 | 通过 `node-edge-tts` 使用公开的 Edge 神经网络 TTS。尽力而为，不提供 SLA。 |
| **MiniMax** | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`） | T2A v2 API。默认使用 `speech-2.8-hd`。 |
| **OpenAI** | `OPENAI_API_KEY` | 也用于自动摘要；支持角色语音 `instructions`。 |
| **OpenRouter** | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`） | 默认模型为 `hexgrad/kokoro-82m`。 |
| **Volcengine** | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。 |
| **Vydra** | `VYDRA_API_KEY` | 共享的图像、视频和语音提供商。 |
| **xAI** | `XAI_API_KEY` | xAI 批量 TTS。不支持原生 Opus 语音便笺。 |
| **Xiaomi MiMo** | `XIAOMI_API_KEY` | 通过 Xiaomi 聊天补全实现的 MiMo TTS。 |

如果配置了多个提供商，则会优先使用选中的提供商，其他提供商作为回退选项。自动摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你保留摘要启用状态，对应提供商也必须完成认证。

<Warning>
内置的 **Microsoft** 提供商通过 `node-edge-tts` 使用 Microsoft Edge 的在线神经网络 TTS 服务。它是公开的 Web 服务，没有已发布的 SLA 或配额——请将其视为尽力而为的服务。旧版提供商 id `edge` 会被规范化为 `microsoft`，并且 `openclaw doctor --fix` 会重写持久化配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 的 `messages.tts` 下。选择一个预设，并调整对应的提供商配置块：

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // 可选的自然语言风格提示：
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft（无密钥）">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### 按智能体覆盖语音设置

当某个智能体需要使用不同的提供商、语音、模型、角色语音或自动 TTS 模式时，请使用 `agents.list[].tts`。该智能体配置块会在 `messages.tts` 之上进行深度合并，因此提供商凭证可以保留在全局提供商配置中：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

要固定某个智能体的角色语音，请在提供商配置旁设置 `agents.list[].tts.persona` —— 它只会覆盖该智能体的全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 以及 `tts` 智能体工具的优先级顺序如下：

1. `messages.tts`
2. 当前激活的 `agents.list[].tts`
3. 此主机上的本地 `/tts` 偏好设置
4. 启用[模型覆盖](#model-driven-directives)时的内联 `[[tts:...]]` 指令

## 角色语音

**persona** 是一种稳定的语音身份，可在不同提供商之间以确定性的方式应用。它可以优先选择某个提供商、定义与提供商无关的提示意图，并携带针对特定提供商的语音、模型、提示模板、种子和语音设置绑定。

### 最小角色语音

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 完整角色语音（与提供商无关的提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### 角色语音解析

当前激活的角色语音会按确定性顺序选择：

1. `/tts persona <id>` 本地偏好设置（如果已设置）。
2. `messages.tts.persona`（如果已设置）。
3. 不使用角色语音。

提供商选择按“显式优先”的顺序进行：

1. 直接覆盖项（CLI、Gateway 网关、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本地偏好设置。
3. 当前角色语音的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

对于每次提供商尝试，OpenClaw 会按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任的请求覆盖项
4. 允许的模型发出的 TTS 指令覆盖项

### 提供商如何使用角色语音提示

角色语音提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）是**与提供商无关的**。每个提供商会自行决定如何使用它们：

<AccordionGroup>
  <Accordion title="Google Gemini">
    仅当实际生效的 Google 提供商配置设置了 `promptTemplate: "audio-profile-v1"` 或 `personaPrompt` 时，才会将角色语音提示字段包装进 Gemini TTS 提示结构中。较旧的 `audioProfile` 和 `speakerName` 字段仍会作为 Google 特定的提示文本预置到前面。在 `[[tts:text]]` 块中的内联音频标签（例如 `[whispers]` 或 `[laughs]`）会保留在 Gemini 转录文本中；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    仅当未显式配置 OpenAI `instructions` 时，才会将角色语音提示字段映射到请求的 `instructions` 字段。显式的 `instructions` 始终优先。
  </Accordion>
  <Accordion title="其他提供商">
    仅使用 `personas.<id>.providers.<provider>` 下特定于提供商的角色语音绑定。除非该提供商自行实现了角色语音提示映射，否则角色语音提示字段会被忽略。
  </Accordion>
</AccordionGroup>

### 回退策略

当某个角色语音对正在尝试的提供商**没有绑定**时，`fallbackPolicy` 控制其行为：

| 策略 | 行为 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona` | **默认。** 与提供商无关的提示字段会继续可用；提供商可以使用它们，也可以忽略它们。 |
| `provider-defaults` | 在本次尝试的提示准备过程中省略角色语音；提供商使用其中性的默认值，同时继续回退到其他提供商。 |
| `fail` | 跳过该提供商尝试，并设置 `reasonCode: "not_configured"` 和 `personaBinding: "missing"`。仍会继续尝试回退提供商。 |

只有当**所有**尝试过的提供商都被跳过或失败时，整个 TTS 请求才会失败。

## 模型驱动指令

默认情况下，助手**可以**发出 `[[tts:...]]` 指令，以覆盖单条回复的语音、模型或速度，还可以附带一个可选的 `[[tts:text]]...[[/tts:text]]` 块，用于只应出现在音频中的表现性提示：

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，**必须使用指令**才能触发音频。即使这些指令拆分在相邻的多个块中，流式分块传输也会在渠道看到文本之前将指令从可见文本中剥离。

除非设置了 `modelOverrides.allowProvider: true`，否则 `provider=...` 会被忽略。当回复声明了 `provider=...` 时，该指令中的其他键只会由该提供商解析；不受支持的键会被剥离，并作为 TTS 指令警告报告。

**可用的指令键：**

- `provider`（已注册的提供商 id；需要 `allowProvider: true`）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0–10）
- `pitch`（MiniMax 整数音高，−12 到 12；小数值会被截断）
- `emotion`（Volcengine 情绪标签）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全禁用模型覆盖：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允许切换提供商，同时保持其他调节项可配置：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 斜杠命令

使用单一命令 `/tts`。在 Discord 上，OpenClaw 还会注册 `/voice`，因为 `/tts` 是 Discord 的内置命令——文本形式的 `/tts ...` 仍然可用。

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
这些命令要求发送者已获授权（适用 allowlist/owner 规则），并且必须启用 `commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会将其写为 `off`。
- `/tts chat on|off|default` 会为当前聊天写入一个作用域为会话的自动 TTS 覆盖项。
- `/tts persona <id>` 会写入本地角色语音偏好；`/tts persona off` 会清除此偏好。
- `/tts latest` 会从当前会话转录中读取最新的助手回复，并将其作为一次性音频发送。它只会在会话条目中存储该回复的哈希值，以防止重复发送语音。
- `/tts audio` 会生成一次性的音频回复（**不会**开启 TTS）。
- `limit` 和 `summary` 存储在**本地偏好设置**中，而不是主配置里。
- `/tts status` 包含最近一次尝试的回退诊断信息——`Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次尝试的详细信息（`provider:outcome(reasonCode) latency`）。
- `/status` 会在启用 TTS 时显示当前激活的 TTS 模式，以及已配置的提供商、模型、语音和已脱敏的自定义端点元数据。

## 按用户区分的偏好设置

斜杠命令会将本地覆盖项写入 `prefsPath`。默认值为 `~/.openclaw/settings/tts.json`；你也可以通过 `OPENCLAW_TTS_PREFS` 环境变量或 `messages.tts.prefsPath` 进行覆盖。

| 存储字段 | 作用 |
| ------------ | -------------------------------------------- |
| `auto` | 本地自动 TTS 覆盖项（`always`、`off`、…） |
| `provider` | 本地主提供商覆盖项 |
| `persona` | 本地角色语音覆盖项 |
| `maxLength` | 摘要阈值（默认 `1500` 个字符） |
| `summarize` | 摘要开关（默认 `true`） |

这些字段会覆盖该主机上由 `messages.tts` 加上当前激活的 `agents.list[].tts` 配置块所形成的实际配置。

## 输出格式（固定）

TTS 语音传递由渠道能力驱动。渠道插件会声明，语音样式的 TTS 是否应请求提供商生成原生 `voice-note` 目标，还是保持普通的 `audio-file` 合成路径，仅将兼容的输出标记为语音传递。

- **支持语音便笺的渠道**：语音便笺回复优先使用 Opus（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。
  - 48 kHz / 64 kbps 是语音消息的良好折中方案。
- **Feishu / WhatsApp**：当语音便笺回复以 MP3/WebM/WAV/M4A 或其他常见音频文件格式生成时，渠道插件会先通过 `ffmpeg` 将其转码为 48 kHz Ogg/Opus，再发送原生语音消息。WhatsApp 会通过带有 `ptt: true` 和 `audio/ogg; codecs=opus` 的 Baileys `audio` 负载发送结果。如果转换失败，Feishu 会收到原始文件作为附件；而 WhatsApp 发送会失败，而不是发布不兼容的 PTT 负载。
- **BlueBubbles**：保持提供商合成走普通音频文件路径；MP3 和 CAF 输出会被标记为用于 iMessage 语音备忘录投递。
- **其他渠道**：使用 MP3（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于渠道声明的语音便笺目标，当渠道声明支持转码时，OpenClaw 会在投递前通过 `ffmpeg` 将 MiniMax MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，或在配置时使用 WAV。对于渠道声明的语音便笺目标，当渠道声明支持转码时，OpenClaw 会在投递前通过 `ffmpeg` 将 Xiaomi 输出转码为 48 kHz Opus。
- **Local CLI**：使用已配置的 `outputFormat`。语音便笺目标会被转换为 Ogg/Opus，电话输出会通过 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 作为音频附件，将其转码为 48 kHz Opus 用于语音便笺目标，并为 Talk/电话直接返回 PCM。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：普通音频附件使用 MP3，语音便笺目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI**：默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批处理 REST TTS 端点并返回完整的音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认值为 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输层接受 `outputFormat`，但服务并不一定提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会回退重试 MP3。

OpenAI/ElevenLabs 的输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用 `messages.tts.auto` 后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（少于 10 个字符）。
- 当启用摘要时，使用 `summaryModel`（或 `agents.defaults.model.primary`）对长回复生成摘要。
- 将生成的音频附加到回复中。
- 在 `mode: "final"` 下，流式最终回复在文本流完成后，仍会发送仅音频的 TTS；生成的媒体会经过与普通回复附件相同的渠道媒体规范化流程。

如果回复超过 `maxLength`，且摘要关闭（或摘要模型没有 API 密钥），则会跳过音频，仅发送普通文本回复。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## 按渠道区分的输出格式

| 目标 | 格式 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 语音便笺回复优先使用 **Opus**（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。48 kHz / 64 kbps 在清晰度和体积之间取得平衡。 |
| 其他渠道 | **MP3**（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。44.1 kHz / 128 kbps 是语音的默认配置。 |
| Talk / 电话 | 提供商原生 **PCM**（Inworld 为 22050 Hz，Google 为 24 kHz），或电话场景使用 Gradium 的 `ulaw_8000`。 |

各提供商说明：

- **Feishu / WhatsApp 转码：** 当语音便笺回复以 MP3/WebM/WAV/M4A 形式生成时，渠道插件会使用 `ffmpeg` 将其转码为 48 kHz Ogg/Opus。WhatsApp 通过带有 `ptt: true` 和 `audio/ogg; codecs=opus` 的 Baileys 发送。如果转换失败：Feishu 会回退为附加原始文件；WhatsApp 发送会失败，而不会发布不兼容的 PTT 负载。
- **MiniMax / Xiaomi MiMo：** 默认使用 MP3（MiniMax `speech-2.8-hd` 为 32 kHz）；对于语音便笺目标，会通过 `ffmpeg` 转码为 48 kHz Opus。
- **Local CLI：** 使用已配置的 `outputFormat`。语音便笺目标会转换为 Ogg/Opus，电话输出会转换为原始 16 kHz 单声道 PCM。
- **Google Gemini：** 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 作为附件，对语音便笺目标转码为 48 kHz Opus，并为 Talk/电话直接返回 PCM。
- **Inworld：** MP3 附件、原生 `OGG_OPUS` 语音便笺、用于 Talk/电话的原始 `PCM` 22050 Hz。
- **xAI：** 默认使用 MP3；`responseFormat` 可以是 `mp3|wav|pcm|mulaw|alaw`。使用 xAI 的批处理 REST 端点——**不**使用流式 WebSocket TTS。**不**支持原生 Opus 语音便笺格式。
- **Microsoft：** 使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要可保证的 Opus 语音消息，请使用 OpenAI/ElevenLabs。如果配置的 Microsoft 格式失败，OpenClaw 会回退重试 MP3。

OpenAI 和 ElevenLabs 的输出格式按渠道固定，如上所列。

## 字段参考

<AccordionGroup>
  <Accordion title="顶层 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 仅在收到入站语音消息后发送音频；`tagged` 仅当回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 会将其迁移为 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除最终回复外，还包括工具/块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音提供商 id。未设置时，OpenClaw 会按注册表自动选择顺序使用第一个已配置的提供商。旧版 `provider: "edge"` 会被 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的当前激活角色语音 id。会规范化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段包括：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。参见 [角色语音](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认值为 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认为 `true`；`allowProvider` 默认为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      以语音提供商 id 为键的提供商自有设置。旧版直接配置块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）会由 `openclaw doctor --fix` 重写；提交时只应使用 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 输入字符数的硬上限。超出时，`/tts audio` 会失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      请求超时时间（毫秒）。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地偏好 JSON 路径（提供商/限制/摘要）。默认值为 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 区域（例如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖项（别名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure 语音 ShortName。默认值为 `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认值为 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">标准音频使用的 Azure `X-Microsoft-OutputFormat`。默认值为 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">语音便笺输出使用的 Azure `X-Microsoft-OutputFormat`。默认值为 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 id（例如 `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 语音 id。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（每个均为 `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`，`1.0` = 正常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本规范化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">整数 `0..4294967295`，用于尽力实现确定性输出。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API 基础 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如果省略，TTS 可在环境变量回退前复用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认值为 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini 预构建语音名称。默认值为 `Kore`。别名：`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本前预置的自然语言风格提示。</ParamField>
    <ParamField path="speakerName" type="string">当你的提示使用具名说话者时，在朗读文本前预置的可选说话者标签。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1` 时，会将当前激活角色语音的提示字段包装进确定性的 Gemini TTS 提示结构中。</ParamField>
    <ParamField path="personaPrompt" type="string">附加到模板 Director's Notes 中的 Google 特定额外角色语音提示文本。</ParamField>
    <ParamField path="baseUrl" type="string">仅接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">环境变量：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">默认值为 Emma（`YTpq7expH9539ERJ`）。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">环境变量：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">默认值为 `inworld-tts-1.5-max`。还支持：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">默认值为 `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">采样温度 `0..2`。</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">用于 CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期的 CLI 输出格式。音频附件默认值为 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时时间（毫秒）。默认值为 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选的命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可选环境变量覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Microsoft（无 API 密钥）">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="voice" type="string">Microsoft 神经网络语音名称（例如 `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">语言代码（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认值为 `audio-24khz-48kbitrate-mono-mp3`。内置的基于 Edge 的传输层并不支持所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">将 JSON 字幕写入音频文件旁边。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖项（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix` 可将持久化配置重写为 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退到 `MINIMAX_API_KEY`。Token Plan 认证通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认值为 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">默认值为 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认值为 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认值为 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认值为 `0`。小数值会在请求前被截断。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退到 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 id（例如 `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">语音名称（例如 `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">显式的 OpenAI `instructions` 字段。设置后，角色语音提示字段**不会**自动映射。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值会被视为与 OpenAI 兼容的 TTS 端点，因此接受自定义模型名称和语音名称。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 会被规范化。</ParamField>
    <ParamField path="model" type="string">默认值为 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="voice" type="string">默认值为 `af_alloy`。别名：`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认值为 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Volcengine（BytePlus Seed Speech）">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认值为 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当你的项目具有 TTS 2.0 权限时，请使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 请求头。默认值为 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">语音类型。默认值为 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">提供商原生速度比率。</ParamField>
    <ParamField path="emotion" type="string">提供商原生情绪标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认值为 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">默认值为 `eve`。可用实时语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认值为 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认值为 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认值为 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。还支持 `mimo-v2-tts`。</ParamField>
    <ParamField path="voice" type="string">默认值为 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认值为 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格指令，作为用户消息发送；不会被朗读。</ParamField>
  </Accordion>
</AccordionGroup>

## 智能体工具

`tts` 工具将文本转换为语音，并返回一个用于回复投递的音频附件。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频会作为语音消息投递，而不是文件附件。当 `ffmpeg` 可用时，Feishu 和 WhatsApp 在此路径上可以对非 Opus 的 TTS 输出进行转码。

WhatsApp 通过 Baileys 将音频作为 PTT 语音便笺发送（`audio` 配合 `ptt: true`），并将可见文本与 PTT 音频**分开发送**，因为客户端对语音便笺字幕的渲染并不一致。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是按次调用的提供商请求超时时间，单位为毫秒。

## Gateway 网关 RPC

| 方法 | 用途 |
| ----------------- | ---------------------------------------- |
| `tts.status` | 读取当前 TTS 状态和最近一次尝试。 |
| `tts.enable` | 将本地自动偏好设置为 `always`。 |
| `tts.disable` | 将本地自动偏好设置为 `off`。 |
| `tts.convert` | 一次性文本 → 音频。 |
| `tts.setProvider` | 设置本地提供商偏好。 |
| `tts.setPersona` | 设置本地角色语音偏好。 |
| `tts.providers` | 列出已配置的提供商及其状态。 |

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 文本转语音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/zh-CN/providers/azure-speech)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 认证](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-CN/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/zh-CN/providers/volcengine#text-to-speech)
- [Xiaomi MiMo 语音合成](/zh-CN/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI 文本转语音](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 相关内容

- [媒体概览](/zh-CN/tools/media-overview)
- [音乐生成](/zh-CN/tools/music-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [斜杠命令](/zh-CN/tools/slash-commands)
- [语音通话插件](/zh-CN/plugins/voice-call)
