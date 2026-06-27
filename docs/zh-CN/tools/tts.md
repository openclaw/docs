---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商、回退链或角色人设
    - 使用 /tts 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 用于出站回复的文本转语音 — 提供商、角色、斜杠命令和按渠道输出
title: 文本转语音
x-i18n:
    generated_at: "2026-06-27T03:35:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw 可以将出站回复转换为音频，覆盖 **14 个语音提供商**，并在 Feishu、Matrix、Telegram 和 WhatsApp 上发送原生语音消息，在其他地方发送音频附件，并为电话和 Talk 提供 PCM/Ulaw 流。

TTS 是 Talk 的 `stt-tts` 模式中的语音输出部分。提供商原生的 `realtime` Talk 会话会在实时提供商内部合成语音，而不是调用此 TTS 路径；`transcription` 会话则不会合成助手语音响应。

## 快速开始

<Steps>
  <Step title="选择提供商">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和 Local CLI 无需 API key 即可工作。完整列表请参见[提供商矩阵](#supported-providers)。
  </Step>
  <Step title="设置 API key">
    导出你的提供商对应的环境变量（例如 `OPENAI_API_KEY`、`ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 不需要 key。
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
    `/tts status` 会显示当前状态。`/tts audio Hello from OpenClaw` 会发送一次性音频回复。
  </Step>
</Steps>

<Note>
Auto-TTS 默认**关闭**。当未设置 `messages.tts.provider` 时，OpenClaw 会按注册表自动选择顺序选取第一个已配置的提供商。内置的 `tts` 智能体工具仅用于显式意图：普通聊天会保持文本，除非用户要求音频、使用 `/tts`，或启用 Auto-TTS/指令式语音。
</Note>

## 支持的提供商

| 提供商          | 鉴权                                                                                                             | 说明                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）          | 原生 Ogg/Opus 语音便笺输出和电话。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 兼容 TTS。默认使用 `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 语音克隆、多语言，通过 `seed` 确定性生成；为 Discord 语音播放进行流式传输。 |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API 批量 TTS；通过 `promptTemplate: "audio-profile-v1"` 感知人格。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 语音便笺和电话输出。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 流式 TTS API。原生 Opus 语音便笺和 PCM 电话。                                |
| **Local CLI**     | 无                                                                                                             | 运行已配置的本地 TTS 命令。                                                        |
| **Microsoft**     | 无                                                                                                             | 通过 `node-edge-tts` 使用公共 Edge 神经 TTS。尽力而为，无 SLA。                            |
| **MiniMax**       | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）      | T2A v2 API。默认使用 `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用于自动摘要；支持人格 `instructions`。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`）                                            | 默认模型 `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共享的图像、视频和语音提供商。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批量 TTS。**不**支持原生 Opus 语音便笺。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 通过 Xiaomi chat completions 使用 MiMo TTS。                                                   |

如果配置了多个提供商，会优先使用选中的提供商，其他提供商作为回退选项。自动摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你保持摘要启用，该提供商也必须完成鉴权。

<Warning>
内置的 **Microsoft** 提供商通过 `node-edge-tts` 使用 Microsoft Edge 的在线神经 TTS 服务。这是一个未发布 SLA 或配额的公共 Web 服务，请将其视为尽力而为。旧版提供商 id `edge` 会规范化为 `microsoft`，并且 `openclaw doctor --fix` 会重写持久化配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 中的 `messages.tts` 下。选择一个预设并调整提供商块：

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Optional natural-language style prompts:
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
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
  <Tab title="Microsoft（无 key）">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

对于 Xiaomi `mimo-v2.5-tts-voicedesign`，省略 `speakerVoice`，并将 `style` 设置为语音设计提示词。OpenClaw 会将该提示词作为 TTS `user` 消息发送，并且不会为 voicedesign 模型发送 `audio.voice`。

### 按智能体覆盖语音

当某个智能体应使用不同的提供商、语音、模型、人设或自动 TTS 模式发声时，请使用 `agents.list[].tts`。智能体块会深度合并到 `messages.tts` 之上，因此提供商凭据可以保留在全局提供商配置中：

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

要固定每个智能体的人设，请将 `agents.list[].tts.persona` 与提供商配置一起设置，它只会覆盖该智能体的全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 和 `tts` 智能体工具的优先级顺序：

1. `messages.tts`
2. 活跃的 `agents.list[].tts`
3. 渠道覆盖项，当渠道支持 `channels.<channel>.tts` 时
4. 账号覆盖项，当渠道传递 `channels.<channel>.accounts.<id>.tts` 时
5. 此主机的本机 `/tts` 偏好
6. 启用[模型覆盖](#model-driven-directives)时的内联 `[[tts:...]]` 指令

渠道和账号覆盖项使用与 `messages.tts` 相同的形状，并深度合并到更早的层之上，因此共享提供商凭据可以保留在 `messages.tts` 中，而渠道或 Bot 账号只更改说话语音、模型、人设或自动模式：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## 人设

**人设**是一种稳定的语音身份，可跨提供商以确定性方式应用。它可以偏好某个提供商，定义与提供商无关的提示意图，并携带特定于提供商的语音、模型、提示模板、种子和语音设置绑定。

### 最小人设

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### 完整人设（提供商无关提示）

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
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### 人设解析

活跃人设会以确定性方式选择：

1. `/tts persona <id>` 本机偏好，如果已设置。
2. `messages.tts.persona`，如果已设置。
3. 无人设。

提供商选择采用显式优先：

1. 直接覆盖项（CLI、Gateway 网关、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本机偏好。
3. 活跃人设的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

对于每次提供商尝试，OpenClaw 会按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 可信请求覆盖项
4. 允许的模型发出的 TTS 指令覆盖项

### 提供商如何使用人设提示

人设提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）是**提供商无关**的。每个提供商会自行决定如何使用它们：

<AccordionGroup>
  <Accordion title="Google Gemini">
    只有当有效的 Google 提供商配置设置了 `promptTemplate: "audio-profile-v1"` 或 `personaPrompt` 时，才会将人设提示字段包装到 Gemini TTS 提示结构中。较旧的 `audioProfile` 和 `speakerName` 字段仍会作为 Google 特定的提示文本前置。`[[tts:text]]` 块内的 `[whispers]` 或 `[laughs]` 等内联音频标签会保留在 Gemini 转录文本中；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    只有在未配置显式 OpenAI `instructions` 时，才会将人设提示字段映射到请求的 `instructions` 字段。显式 `instructions` 始终优先。
  </Accordion>
  <Accordion title="Other providers">
    只使用 `personas.<id>.providers.<provider>` 下的提供商特定人设绑定。除非提供商实现了自己的人设提示映射，否则会忽略人设提示字段。
  </Accordion>
</AccordionGroup>

### 回退策略

当某个人设对尝试的提供商**没有绑定**时，`fallbackPolicy` 控制其行为：

| 策略                | 行为                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **默认值。** 提供商无关提示字段保持可用；提供商可以使用它们，也可以忽略它们。                                                               |
| `provider-defaults` | 此次尝试的人设会从提示准备中省略；提供商使用其中性默认值，同时继续回退到其他提供商。                                                       |
| `fail`              | 使用 `reasonCode: "not_configured"` 和 `personaBinding: "missing"` 跳过该提供商尝试。仍会尝试回退提供商。                                   |

只有当**每个**尝试的提供商都被跳过或失败时，整个 TTS 请求才会失败。

Talk 会话提供商选择是会话范围的。Talk 客户端应从 `talk.catalog` 中选择提供商 ID、模型 ID、语音 ID 和区域设置，并通过 Talk 会话或交接请求传递它们。打开语音会话不应改变 `messages.tts` 或全局 Talk 提供商默认值。

## 模型驱动指令

默认情况下，助手**可以**发出 `[[tts:...]]` 指令，为单次回复覆盖语音、模型或语速，并可附带一个可选的 `[[tts:text]]...[[/tts:text]]` 块，用于只应出现在音频中的表现性提示：

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，**必须使用指令**才会触发音频。分块流式传输会在渠道看到文本前，从可见文本中移除指令，即使这些指令被拆分到相邻块中也是如此。

除非 `modelOverrides.allowProvider: true`，否则会忽略 `provider=...`。当回复声明 `provider=...` 时，该指令中的其他键只由该提供商解析；不支持的键会被剥离，并作为 TTS 指令警告报告。

**可用指令键：**

- `provider`（已注册的提供商 ID；需要 `allowProvider: true`）
- `speakerVoice` / `speakerVoiceId`（旧版别名：`voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
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

**允许切换提供商，同时保持其他旋钮可配置：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 斜杠命令

单个命令 `/tts`。在 Discord 上，OpenClaw 还会注册 `/voice`，因为 `/tts` 是内置 Discord 命令，文本 `/tts ...` 仍然可用。

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
命令需要授权发送者（适用允许列表/所有者规则），并且必须启用 `commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 将本机 TTS 偏好写为 `always`；`/tts off` 将其写为 `off`。
- `/tts chat on|off|default` 为当前聊天写入会话范围的自动 TTS 覆盖项。
- `/tts persona <id>` 写入本机人设偏好；`/tts persona off` 会清除它。
- `/tts latest` 从当前会话转录中读取最新的助手回复，并将其作为音频发送一次。它只在会话条目上存储该回复的哈希，以抑制重复语音发送。
- `/tts audio` 生成一次性音频回复（**不会**开启 TTS）。
- `limit` 和 `summary` 存储在**本机偏好**中，而不是主配置中。
- `/tts status` 包含最新尝试的回退诊断：`Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次尝试的详细信息（`provider:outcome(reasonCode) latency`）。
- 启用 TTS 时，`/status` 会显示活跃的 TTS 模式，以及已配置的提供商、模型、语音和经过脱敏的自定义端点元数据。

## 每用户偏好

斜杠命令会将本机覆盖项写入 `prefsPath`。默认值为 `~/.openclaw/settings/tts.json`；可使用 `OPENCLAW_TTS_PREFS` 环境变量或 `messages.tts.prefsPath` 覆盖。

| 存储字段     | 效果                                         |
| ------------ | -------------------------------------------- |
| `auto`       | 本机自动 TTS 覆盖项（`always`、`off` 等）    |
| `provider`   | 本机主提供商覆盖项                           |
| `persona`    | 本机人设覆盖项                               |
| `maxLength`  | 摘要阈值（默认 `1500` 字符）                 |
| `summarize`  | 摘要开关（默认 `true`）                      |

这些会覆盖来自 `messages.tts` 以及该主机活跃 `agents.list[].tts` 块的有效配置。

## 输出格式（固定）

TTS 语音交付由渠道能力驱动。渠道插件会声明语音样式的 TTS 是否应要求提供商生成原生 `voice-note` 目标，或者保持普通 `audio-file` 合成并仅标记兼容输出用于语音交付。

- **支持语音留言的渠道**：语音留言回复优先使用 Opus（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。
  - 48kHz / 64kbps 是语音消息的良好折中。
- **Feishu / WhatsApp**：当语音留言回复生成的是 MP3/WebM/WAV/M4A
  或其他可能的音频文件时，渠道插件会先使用 `ffmpeg` 将其转码为 48kHz
  Ogg/Opus，再发送原生语音消息。WhatsApp 会通过 Baileys `audio` payload 发送
  结果，并设置 `ptt: true` 和
  `audio/ogg; codecs=opus`。如果转换失败，Feishu 会将原始
  文件作为附件接收；WhatsApp 发送会失败，而不是发布不兼容的
  PTT payload。
- **其他渠道**：MP3（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。
  - 44.1kHz / 128kbps 是语音清晰度的默认平衡。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32kHz 采样率）。对于渠道声明的语音留言目标，当渠道声明支持转码时，OpenClaw 会在交付前使用 `ffmpeg` 将 MiniMax MP3 转码为 48kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，配置后可使用 WAV。对于渠道声明的语音留言目标，当渠道声明支持转码时，OpenClaw 会在交付前使用 `ffmpeg` 将 Xiaomi 输出转码为 48kHz Opus。
- **本地 CLI**：使用配置的 `outputFormat`。语音留言目标会被转换为 Ogg/Opus，电话输出会使用 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24kHz PCM。OpenClaw 会将其包装为 WAV 作为音频附件，将其转码为 48kHz Opus 用于语音留言目标，并直接返回 PCM 用于 Talk/电话。
- **Gradium**：音频附件使用 WAV，语音留言目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：普通音频附件使用 MP3，语音留言目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI**：默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS 端点，并返回完整音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音留言格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但并非所有格式都可从服务获取。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要
    保证 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会使用 MP3 重试。

OpenAI/ElevenLabs 输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用 `messages.tts.auto` 后，OpenClaw 会：

- 如果回复已包含结构化媒体，则跳过 TTS。
- 跳过很短的回复（少于 10 个字符）。
- 在启用摘要时，使用
  `summaryModel`（或 `agents.defaults.model.primary`）摘要长回复。
- 将生成的音频附加到回复中。
- 在 `mode: "final"` 中，对于流式最终回复，仍会在
  文本流完成后发送仅音频 TTS；生成的媒体会经过与普通回复附件相同的
  渠道媒体规范化。

如果回复超过 `maxLength` 且摘要关闭（或摘要模型没有 API key），则跳过音频，并发送普通文本回复。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## 按渠道划分的输出格式

  | 目标                                  | 格式                                                                                                                             |
  | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | 语音备注回复优先使用 **Opus**（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。48 kHz / 64 kbps 在清晰度和大小之间取得平衡。 |
  | 其他渠道                              | **MP3**（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是语音默认值。                                  |
  | Talk / 电话                           | 提供商原生 **PCM**（Inworld 22050 Hz，Google 24 kHz），或用于电话的 Gradium `ulaw_8000`。                                      |

  各提供商说明：

  - **Feishu / WhatsApp 转码：** 当语音备注回复以 MP3/WebM/WAV/M4A 形式到达时，渠道插件会使用 `ffmpeg` 转码为 48 kHz Ogg/Opus。WhatsApp 通过 Baileys 发送，并设置 `ptt: true` 和 `audio/ogg; codecs=opus`。如果转换失败：Feishu 会回退为附加原始文件；WhatsApp 发送会失败，而不是发布不兼容的 PTT 载荷。
  - **MiniMax / Xiaomi MiMo：** 默认 MP3（MiniMax `speech-2.8-hd` 为 32 kHz）；通过 `ffmpeg` 为语音备注目标转码为 48 kHz Opus。
  - **本地 CLI：** 使用配置的 `outputFormat`。语音备注目标会转换为 Ogg/Opus，电话输出会转换为原始 16 kHz 单声道 PCM。
  - **Google Gemini：** 返回原始 24 kHz PCM。OpenClaw 会将其包装为 WAV 作为附件，为语音备注目标转码为 48 kHz Opus，并为 Talk/电话直接返回 PCM。
  - **Inworld：** MP3 附件，原生 `OGG_OPUS` 语音备注，Talk/电话使用原始 `PCM` 22050 Hz。
  - **xAI：** 默认 MP3；`responseFormat` 可以是 `mp3|wav|pcm|mulaw|alaw`。使用 xAI 的批量 REST 端点——**不**使用流式 WebSocket TTS。不支持原生 Opus 语音备注格式。
  - **Microsoft：** 使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保证的 Opus 语音消息，请使用 OpenAI/ElevenLabs。如果配置的 Microsoft 格式失败，OpenClaw 会用 MP3 重试。

  OpenAI 和 ElevenLabs 输出格式按上面列出的每个渠道固定。

  ## 字段参考

  <AccordionGroup>
  <Accordion title="顶层 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 只会在收到入站语音消息后发送音频；`tagged` 只会在回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 会将其迁移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除最终回复外，还包含工具/块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音提供商 id。未设置时，OpenClaw 会按注册表自动选择顺序使用第一个已配置的提供商。旧版 `provider: "edge"` 会由 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的活动 persona id。会规范化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。请参阅 [Personas](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认值为 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认值为 `true`；`allowProvider` 默认值为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      按语音提供商 id keyed 的提供商自有设置。旧版直接块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）会由 `openclaw doctor --fix` 重写；只提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 输入字符数硬上限。超过时 `/tts audio` 会失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      请求超时时间，单位为毫秒。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地 prefs JSON 路径（提供商/限制/摘要）。默认值 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 区域（例如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖（别名 `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure voice ShortName。默认值 `en-US-JennyNeural`。旧版别名：`voice`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认值 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">标准音频的 Azure `X-Microsoft-OutputFormat`。默认值 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">语音备注输出的 Azure `X-Microsoft-OutputFormat`。默认值 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 id（例如 `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs voice id。旧版别名：`voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（每个都是 `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`，`1.0` = 正常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本规范化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">用于尽力确定性的整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API 基础 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如果省略，TTS 可以在回退到环境变量之前复用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认值 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini 预构建 voice 名称。默认值 `Kore`。旧版别名：`voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本之前添加的自然语言风格提示。</ParamField>
    <ParamField path="speakerName" type="string">当你的提示使用具名说话人时，可选的说话人标签会添加在朗读文本之前。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1` 可将活动 persona 提示字段包装在确定性的 Gemini TTS 提示结构中。</ParamField>
    <ParamField path="personaPrompt" type="string">追加到模板 Director's Notes 的 Google 专用额外 persona 提示文本。</ParamField>
    <ParamField path="baseUrl" type="string">只接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">环境变量：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://api.gradium.ai`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认 Emma（`YTpq7expH9539ERJ`）。旧版别名：`voiceId`。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld 主配置

    <ParamField path="apiKey" type="string">环境变量：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">默认值 `inworld-tts-1.5-max`。另有：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值 `Sarah`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="temperature" type="number">采样温度 `0..2`。</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">用于 CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期 CLI 输出格式。音频附件默认 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时时间，单位为毫秒。默认值 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选的命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可选环境变量覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft 神经网络语音名称（例如 `en-US-MichelleNeural`）。旧版别名：`voice`。</ParamField>
    <ParamField path="lang" type="string">语言代码（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认值 `audio-24khz-48kbitrate-mono-mp3`。内置的 Edge 后端传输并不支持所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音频文件旁写入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖项（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix` 将持久化配置重写为 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退到 `MINIMAX_API_KEY`。Token Plan 认证通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认值 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认值 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认值 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认值 `0`。分数值会在请求前被截断。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退到 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 ID（例如 `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="speakerVoice" type="string">语音名称（例如 `alloy`、`cedar`）。旧版别名：`voice`。</ParamField>
    <ParamField path="instructions" type="string">显式 OpenAI `instructions` 字段。设置后，人设提示字段**不会**自动映射。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">在生成的 OpenAI TTS 字段之后合并到 `/audio/speech` 请求体中的额外 JSON 字段。对于需要 `lang` 等提供商专用键的 Kokoro 等 OpenAI 兼容端点，请使用此项；不安全的原型键会被忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值会被视为 OpenAI 兼容 TTS 端点，因此可接受自定义模型和语音名称。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 会被规范化。</ParamField>
    <ParamField path="model" type="string">默认值 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">默认值 `af_alloy`。旧版别名：`voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认值 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认值 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当你的项目拥有 TTS 2.0 权益时使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 请求头。默认值 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">语音类型。默认值 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。旧版别名：`voice`。</ParamField>
    <ParamField path="speedRatio" type="number">提供商原生语速比例。</ParamField>
    <ParamField path="emotion" type="string">提供商原生情绪标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值 `eve`。当前可用音色：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认值 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认值 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖项。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认值 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。还支持 `mimo-v2-tts` 和 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="speakerVoice" type="string">预设语音模型的默认值为 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。旧版别名：`voice`。不会发送给 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认值 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格指令，会作为用户消息发送；不会被朗读。对于 `mimo-v2.5-tts-voicedesign`，这是语音设计提示；省略时 OpenClaw 会提供默认值。</ParamField>
  </Accordion>
</AccordionGroup>

## 智能体工具

`tts` 工具会将文本转换为语音，并返回一个音频附件用于回复投递。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频会作为语音消息投递，而不是文件附件。当 `ffmpeg` 可用时，Feishu 和 WhatsApp 可在此路径上转码非 Opus 的 TTS 输出。

WhatsApp 通过 Baileys 将音频作为 PTT 语音便笺发送（带有 `ptt: true` 的 `audio`），并且会将可见文本与 PTT 音频**分开发送**，因为客户端不会一致地渲染语音便笺上的说明文字。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是按调用设置的提供商请求超时时间，单位为毫秒。按调用设置的值会覆盖 `messages.tts.timeoutMs`；配置的 TTS 超时时间会覆盖任何插件编写的提供商默认值。

## Gateway 网关 RPC

| 方法              | 用途                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 读取当前 TTS 状态和上次尝试。            |
| `tts.enable`      | 将本地自动偏好设置为 `always`。          |
| `tts.disable`     | 将本地自动偏好设置为 `off`。             |
| `tts.convert`     | 一次性文本 → 音频。                      |
| `tts.setProvider` | 设置本地提供商偏好。                     |
| `tts.setPersona`  | 设置本地人设偏好。                       |
| `tts.providers`   | 列出已配置的提供商和状态。               |

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 文本转语音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/zh-CN/providers/azure-speech)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 身份验证](https://elevenlabs.io/docs/api-reference/authentication)
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
