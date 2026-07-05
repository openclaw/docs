---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商、回退链或人设
    - 使用 /tts 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 出站回复的文本转语音——提供商、人设、斜杠命令和按渠道输出
title: 文本转语音
x-i18n:
    generated_at: "2026-07-05T11:47:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ab060f7782bba69cd890749b74f061870d895a85f9c2688bba6d4a5faeb442c
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw 会通过 **14 个语音提供商** 将出站回复转换为音频：
Feishu、Matrix、Telegram 和 WhatsApp 上的原生语音消息；其他位置的音频
附件；以及面向电话和 Talk 的 PCM/Ulaw 流。

TTS 是 Talk 的 `stt-tts` 模式中语音输出的一半（`talk.speak` 会调用同一条
合成路径）。提供商原生的 `realtime` Talk 会话会改为在实时提供商内部合成
语音；`transcription` 会话从不合成助手语音回复。

## 快速开始

<Steps>
  <Step title="选择提供商">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和
    Local CLI 无需 API key 即可工作。完整列表见[提供商矩阵](#supported-providers)。
  </Step>
  <Step title="设置 API key">
    导出你的提供商对应的环境变量（例如 `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 不需要 key。
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
    `/tts status` 会显示当前状态。`/tts audio Hello from OpenClaw`
    会发送一条一次性的音频回复。
  </Step>
</Steps>

<Note>
Auto-TTS 默认**关闭**。未设置 `messages.tts.provider` 时，
OpenClaw 会按注册表自动选择顺序选取第一个已配置的提供商。
内置的 `tts` 智能体工具仅用于显式意图：普通聊天会保持
文本，除非用户要求音频、使用 `/tts`，或启用 Auto-TTS/指令式
语音。
</Note>

## 支持的提供商

| 提供商          | 凭证                                                                                                             | 说明                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）          | 原生 Ogg/Opus 语音便笺输出和电话。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 兼容 TTS。默认使用 `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 语音克隆、多语言，通过 `seed` 实现确定性；用于 Discord 语音播放时支持流式传输。 |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API 批量 TTS；通过 `promptTemplate: "audio-profile-v1"` 感知 persona。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 语音便笺和电话输出。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 流式 TTS API。原生 Opus 语音便笺和 PCM 电话音频。                                |
| **Local CLI**     | 无                                                                                                             | 运行已配置的本地 TTS 命令。                                                        |
| **Microsoft**     | 无                                                                                                             | 通过 `node-edge-tts` 使用公共 Edge 神经 TTS。尽力而为，无 SLA。                            |
| **MiniMax**       | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）      | T2A v2 API。默认使用 `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用于自动摘要；支持 persona `instructions`。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`）                                            | 默认模型 `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共享的图像、视频和语音提供商。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批量 TTS。**不**支持原生 Opus 语音便笺。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 通过 Xiaomi 聊天补全使用 MiMo TTS。                                                   |

如果配置了多个提供商，会优先使用选中的提供商，其他提供商作为备用选项。
自动摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），因此如果
你保持启用摘要，该提供商也必须完成身份验证。

<Warning>
内置的 **Microsoft** 提供商通过 `node-edge-tts` 使用 Microsoft Edge 的在线神经 TTS
服务。这是一个公共 Web 服务，没有已发布的 SLA 或配额，请将其视为尽力而为。
旧版提供商 ID `edge` 会被规范化为 `microsoft`，并且 `openclaw doctor --fix`
会重写已持久化的配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 中的 `messages.tts` 下。选择一个
预设并调整提供商块。下面展示的 `speakerVoice`/`speakerVoiceId`
字段是规范字段；每个提供商自己的 `voice`/`voiceId`/
`voiceName` 字段名仍可作为旧版别名使用。

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
  <Tab title="Microsoft (no key)">
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

对于 Xiaomi `mimo-v2.5-tts-voicedesign`，省略 `speakerVoice`，并将 `style` 设置为
语音设计提示词。OpenClaw 会将该提示词作为 TTS `user` 消息发送，
并且不会为 voicedesign 模型发送 `audio.voice`。

### 按智能体设置语音覆盖

当某个智能体需要使用不同的提供商、语音、模型、角色或自动 TTS 模式时，请使用 `agents.list[].tts`。智能体块会深度合并覆盖 `messages.tts`，因此提供商凭证可以保留在全局提供商配置中：

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

若要固定每个智能体的角色，请在提供商配置旁设置 `agents.list[].tts.persona`，它只会覆盖该智能体的全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 和 `tts` 智能体工具的优先级顺序：

1. `messages.tts`
2. 活跃的 `agents.list[].tts`
3. 渠道覆盖项，当渠道支持 `channels.<channel>.tts` 时
4. 账号覆盖项，当渠道传入 `channels.<channel>.accounts.<id>.tts` 时
5. 此主机的本地 `/tts` 偏好
6. 启用[模型覆盖](#model-driven-directives)时的内联 `[[tts:...]]` 指令

渠道和账号覆盖项使用与 `messages.tts` 相同的形状，并会深度合并覆盖前面的层，因此共享提供商凭证可以保留在 `messages.tts` 中，而某个渠道或 Bot 账号只更改说话语音、模型、角色或自动模式：

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

## 角色

**角色**是一种稳定的语音身份，可以跨提供商确定性地应用。它可以偏好一个提供商，定义提供商无关的提示意图，并携带用于语音、模型、提示模板、种子和语音设置的提供商特定绑定。

### 最小角色

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

### 完整角色（提供商无关提示）

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

### 角色解析

活跃角色会确定性地选择：

1. `/tts persona <id>` 本地偏好（如果已设置）。
2. `messages.tts.persona`（如果已设置）。
3. 无角色。

提供商选择遵循显式优先：

1. 直接覆盖项（CLI、Gateway 网关、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本地偏好。
3. 活跃角色的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

对于每次提供商尝试，OpenClaw 会按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任的请求覆盖项
4. 允许的模型发出 TTS 指令覆盖项

### 提供商如何使用角色提示

角色提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）是**提供商无关**的。每个提供商决定如何使用它们：

<AccordionGroup>
  <Accordion title="Google Gemini">
    只有当有效的 Google 提供商配置设置了 `promptTemplate: "audio-profile-v1"` 或 `personaPrompt` 时，才会将角色提示字段包装进 Gemini TTS 提示结构。较旧的 `audioProfile` 和 `speakerName` 字段仍会作为 Google 特定的提示文本前置。`[[tts:text]]` 块内的 `[whispers]` 或 `[laughs]` 等内联音频标签会保留在 Gemini 转写中；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    只有当没有配置显式的 OpenAI `instructions` 时，才会将角色提示字段映射到请求的 `instructions` 字段。显式的 `instructions` 始终优先。
  </Accordion>
  <Accordion title="Other providers">
    仅使用 `personas.<id>.providers.<provider>` 下的提供商特定角色绑定。角色提示字段会被忽略，除非该提供商实现了自己的角色提示映射。
  </Accordion>
</AccordionGroup>

### 回退策略

当某个角色对尝试的提供商**没有绑定**时，`fallbackPolicy` 控制行为：

| 策略                | 行为                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **默认。** 提供商无关的提示字段仍可用；提供商可以使用它们，也可以忽略它们。                                                             |
| `provider-defaults` | 该次尝试的提示准备会省略角色；提供商使用其中性默认值，同时继续回退到其他提供商。                                                       |
| `fail`              | 跳过该提供商尝试，并带上 `reasonCode: "not_configured"` 和 `personaBinding: "missing"`。仍会尝试回退提供商。                            |

只有当**每个**尝试的提供商都被跳过或失败时，整个 TTS 请求才会失败。

Talk 会话提供商选择是会话范围的。Talk 客户端应从 `talk.catalog` 中选择提供商 ID、模型 ID、语音 ID 和区域设置，并通过 Talk 会话或交接请求传递它们。打开语音会话不应改变 `messages.tts` 或全局 Talk 提供商默认值。

## 模型驱动指令

默认情况下，助手**可以**发出 `[[tts:...]]` 指令，为单条回复覆盖语音、模型或速度，并可附加一个可选的 `[[tts:text]]...[[/tts:text]]` 块，用于只应出现在音频中的表现提示：

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，**必须有指令**才会触发音频。分块流式传输投递会在渠道看到之前从可见文本中剥离指令，即使它们被拆分到相邻块中也是如此。

除非 `modelOverrides.allowProvider: true`，否则 `provider=...` 会被忽略。当回复声明 `provider=...` 时，该指令中的其他键只由该提供商解析；不支持的键会被剥离，并报告为 TTS 指令警告。

**可用指令键：**

- `provider`（已注册的提供商 ID；需要 `allowProvider: true`）
- `speakerVoice` / `speakerVoiceId`（旧别名：`voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
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

单个命令 `/tts`。在 Discord 上，OpenClaw 还会注册 `/voice`，因为 `/tts` 是 Discord 内置命令，但文本形式的 `/tts ...` 仍可使用。

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
命令需要授权发送者（适用 allowlist/owner 规则），并且必须启用 `commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 将本地 TTS 偏好写为 `always`；`/tts off` 将其写为 `off`。
- `/tts chat on|off|default` 会为当前聊天写入会话范围的自动 TTS 覆盖项。
- `/tts persona <id>` 写入本地角色偏好；`/tts persona off` 会清除它。
- `/tts latest` 从当前会话转写中读取最新的助手回复，并将其作为音频发送一次。它只会在会话条目上存储该回复的哈希，用于抑制重复语音发送。
- `/tts audio` 生成一次性音频回复（**不会**开启 TTS）。
- `/tts limit <chars>` 接受 **100–4096**（4096 是 Telegram caption/message 最大值）；超出该范围的值会被拒绝。
- `limit` 和 `summary` 存储在**本地偏好**中，而不是主配置中。
- `/tts status` 包含最新尝试的回退诊断信息：`Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次尝试的详情（`provider:outcome(reasonCode) latency`）。
- 当 TTS 启用时，`/status` 会显示活跃 TTS 模式，以及已配置的提供商、模型、语音和经过脱敏的自定义端点元数据。

## 每用户偏好

斜杠命令会将本地覆盖项写入 `prefsPath`。默认值为 `~/.openclaw/settings/tts.json`；可用 `OPENCLAW_TTS_PREFS` 环境变量或 `messages.tts.prefsPath` 覆盖。

| 存储字段    | 效果                                                                           |
| ----------- | ------------------------------------------------------------------------------ |
| `auto`      | 本地自动 TTS 覆盖项（`always`、`off`、……）                                     |
| `provider`  | 本地主提供商覆盖项                                                             |
| `persona`   | 本地角色覆盖项                                                                 |
| `maxLength` | 摘要/截断阈值（默认 `1500` 字符，`/tts limit` 范围为 100–4096）                |
| `summarize` | 摘要开关（默认 `true`）                                                        |

这些设置会覆盖来自 `messages.tts` 加上该主机活跃 `agents.list[].tts` 块的有效配置。

## 输出格式

TTS 语音交付由渠道能力驱动。渠道插件会声明语音风格的 TTS 是否应要求提供商生成原生 `voice-note` 目标，还是保留普通的 `audio-file` 合成，以及渠道是否会在发送前转码非原生输出。

| 目标                                  | 格式                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 语音消息回复优先使用 **Opus**（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。48 kHz / 64 kbps 在清晰度和大小之间取得平衡。      |
| 其他渠道                              | **MP3**（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是语音的默认平衡配置。                                 |
| Talk / 电话                           | 提供商原生 **PCM**（Inworld 22050 Hz、Google 24 kHz），或用于电话场景的 Gradium `ulaw_8000`。                                         |

各提供商说明：

- **Feishu / WhatsApp 转码：**当语音消息回复以 MP3/WebM/WAV/M4A 或其他可能的音频文件形式到达时，渠道插件会在发送原生语音消息前，使用 `ffmpeg`（`libopus`，64 kbps）将其转码为 48 kHz Ogg/Opus。WhatsApp 会通过 Baileys `audio` 载荷发送结果，并设置 `ptt: true` 和 `audio/ogg; codecs=opus`。转码失败时：Feishu 会捕获错误并回退为将原始文件作为普通附件发送；WhatsApp 没有回退，因此发送本身会失败，而不是发布不兼容的 PTT 载荷。
- **MiniMax：**普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）；针对渠道声明的语音消息目标，会使用 `ffmpeg` 转码为 48 kHz Opus。
- **Xiaomi MiMo：**默认使用 MP3，配置后可使用 WAV；针对渠道声明的语音消息目标，会使用 `ffmpeg` 转码为 48 kHz Opus。
- **本地 CLI：**使用已配置的 `outputFormat`。语音消息目标会转换为 Ogg/Opus，电话输出会使用 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini：**返回原始 24 kHz PCM。OpenClaw 会将其包装为 WAV 用于音频附件，针对语音消息目标转码为 48 kHz Opus，并为 Talk/电话直接返回 PCM。
- **Gradium：**音频附件使用 WAV，语音消息目标使用 Opus，电话场景使用 8 kHz 的 `ulaw_8000`。
- **Inworld：**普通音频附件使用 MP3，语音消息目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI：**默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。使用 xAI 的批量 REST TTS 端点，并返回完整音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。不支持原生 Opus 语音消息格式。
- **Microsoft：**使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但服务并不提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会使用 MP3 重试。
  - 当未设置显式语音覆盖，并且使用默认英语语音时，如果回复文本以 CJK 为主，OpenClaw 会自动切换到中文神经网络语音（`zh-CN-XiaoxiaoNeural`，`zh-CN` 区域设置）。

OpenAI 和 ElevenLabs 的输出格式按上表按渠道固定。

## 自动 TTS 行为

启用 `messages.tts.auto` 时，OpenClaw 会：

- 如果回复已包含结构化媒体，则跳过 TTS。
- 跳过很短的回复（少于 10 个字符）。
- 启用摘要时，使用 `summaryModel`（或 `agents.defaults.model.primary`）摘要长回复。
- 将生成的音频附加到回复。
- 在 `mode: "final"` 中，对于流式最终回复，仍会在文本流完成后发送仅音频的 TTS；生成的媒体会经过与普通回复附件相同的渠道媒体规范化流程。

如果回复超过 `maxLength`，OpenClaw 绝不会直接跳过音频：

- **启用摘要**（默认）且摘要模型可用：将文本摘要到大约 `maxLength` 个字符，然后合成摘要。
- **关闭摘要**、摘要失败，或摘要模型没有可用 API key：将文本截断到 `maxLength` 个字符，并合成截断后的文本。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled and available?
                            no  -> truncate -> TTS -> attach audio
                            yes -> summarize -> TTS -> attach audio
```

## 字段参考

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 仅在收到入站语音消息后发送音频；`tagged` 仅在回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 会将其迁移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除最终回复外，还包括工具/分块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音提供商 id。未设置时，OpenClaw 会按注册表自动选择顺序使用第一个已配置的提供商。旧版 `provider: "edge"` 会由 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的当前 persona id。规范化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。参见 [Personas](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认值为 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认值为 `true`；`allowProvider` 默认值为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      由语音提供商 id 作为键的提供商自有设置。旧版直接块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）会由 `openclaw doctor --fix` 重写；只提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS 输入字符数硬上限。超过时，`/tts audio` 和 `tts.convert` 会失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      请求超时时间，单位为毫秒。设置后，单次调用的 `timeoutMs`（Agent 工具、Gateway 网关）优先；否则，显式配置的 `messages.tts.timeoutMs` 优先于任何插件声明的提供商默认值。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地偏好 JSON 路径（提供商/限制/摘要）。默认值为 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 区域（例如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖（别名 `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure voice ShortName。默认值 `en-US-JennyNeural`。旧版别名：`voice`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认值 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">标准音频使用的 Azure `X-Microsoft-OutputFormat`。默认值 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">语音消息输出使用的 Azure `X-Microsoft-OutputFormat`。默认值 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 id。默认值 `eleven_multilingual_v2`。旧版 id `eleven_turbo_v2_5`/`eleven_turbo_v2` 会规范化为匹配的 `flash` 模型。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs voice id。默认值 `pMsXgVXv3BLzUgSXRplE`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（均为 `0..1`，默认值 `0.5`/`0.75`/`0`）、`useSpeakerBoost`（`true|false`，默认值 `true`）、`speed`（`0.5..2.0`，默认值 `1.0`）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本规范化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">用于尽力实现确定性的整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API 基础 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如果省略，TTS 可在环境变量回退前复用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认值 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini 预置语音名称。默认值 `Kore`。旧版别名：`voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本前添加的自然语言风格提示词。</ParamField>
    <ParamField path="speakerName" type="string">当你的提示词使用具名说话人时，在朗读文本前添加的可选说话人标签。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1`，以将当前 persona 提示词字段包装在确定性的 Gemini TTS 提示词结构中。</ParamField>
    <ParamField path="personaPrompt" type="string">追加到模板 Director's Notes 的 Google 专用额外 persona 提示词文本。</ParamField>
    <ParamField path="baseUrl" type="string">仅接受 `https://generativelanguage.googleapis.com`。</ParamField>
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
    <ParamField path="temperature" type="number">采样温度 `0..2`（不含 0）。</ParamField>

  </Accordion>

  <Accordion title="本地 CLI (tts-local-cli)">
    <ParamField path="command" type="string">用于 CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期的 CLI 输出格式。音频附件默认使用 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时时间，单位为毫秒。默认 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选的命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可选环境覆盖。</ParamField>
  </Accordion>

  <Accordion title="Microsoft（无 API 密钥）">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft 神经语音名称（例如 `en-US-MichelleNeural`）。旧版别名：`voice`。如果默认英语语音生效且回复文本以 CJK 为主，OpenClaw 会自动切换到 `zh-CN-XiaoxiaoNeural`。</ParamField>
    <ParamField path="lang" type="string">语言代码（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认 `audio-24khz-48kbitrate-mono-mp3`。并非所有格式都受内置 Edge 支持的传输方式支持。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音频文件旁写入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix` 将持久化配置重写为 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退到 `MINIMAX_API_KEY`。Token Plan 凭证通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY` 提供。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认 `0`。小数值会在请求前被截断。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退到 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 ID。默认 `gpt-4o-mini-tts`。</ParamField>
    <ParamField path="speakerVoice" type="string">语音名称（例如 `alloy`、`cedar`）。默认 `coral`。旧版别名：`voice`。</ParamField>
    <ParamField path="instructions" type="string">显式 OpenAI `instructions` 字段。设置后，角色提示字段**不会**自动映射。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">在生成的 OpenAI TTS 字段之后合并到 `/audio/speech` 请求体中的额外 JSON 字段。可用于 Kokoro 等 OpenAI 兼容端点，这类端点需要 `lang` 等提供商特定键；不安全的原型键会被忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值会被视为 OpenAI 兼容的 TTS 端点，因此可接受自定义模型和语音名称，并且 `speed` 会失去其 `0.25..4.0` 范围检查。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 会被规范化。</ParamField>
    <ParamField path="model" type="string">默认 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">默认 `af_alloy`。旧版别名：`voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖。</ParamField>
  </Accordion>

  <Accordion title="Volcengine（BytePlus Seed Speech）">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当你的项目具有 TTS 2.0 权益时，使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 标头。默认 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">语音类型。默认 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。旧版别名：`voice`。</ParamField>
    <ParamField path="speedRatio" type="number">提供商原生速度比例，`0.2..3`。</ParamField>
    <ParamField path="emotion" type="string">提供商原生情感标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认 `eve`。实时语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖，`0.7..1.5`。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。还支持 `mimo-v2-tts` 和 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="speakerVoice" type="string">预设语音模型默认 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。旧版别名：`voice`。不会发送给 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格指令，会作为用户消息发送；不会被朗读。对于 `mimo-v2.5-tts-voicedesign`，这是语音设计提示；省略时 OpenClaw 会提供默认值。</ParamField>
  </Accordion>
</AccordionGroup>

## 智能体工具

`tts` 工具将文本转换为语音，并返回用于回复投递的音频附件。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频会作为语音消息投递，而不是文件附件。当 `ffmpeg` 可用时，Feishu 和 WhatsApp 可以在此路径上转码非 Opus 的 TTS 输出。

WhatsApp 会通过 Baileys 将音频作为 PTT 语音便笺（带有 `ptt: true` 的 `audio`）发送，并且会将可见文本与 PTT 音频**分开发送**，因为客户端并不总能一致地在语音便笺上呈现说明文字。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是每次调用的提供商请求超时时间，单位为毫秒。每次调用的值会覆盖 `messages.tts.timeoutMs`；配置的 TTS 超时时间会覆盖任何插件提供的提供商默认值。

## Gateway 网关 RPC

| 方法              | 用途                                         |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 读取当前 TTS 状态和上次尝试。               |
| `tts.enable`      | 将本地自动偏好设置为 `always`。             |
| `tts.disable`     | 将本地自动偏好设置为 `off`。                |
| `tts.convert`     | 一次性文本 → 音频。                         |
| `tts.setProvider` | 设置本地提供商偏好。                        |
| `tts.personas`    | 列出已配置的角色和当前活跃角色。            |
| `tts.setPersona`  | 设置本地角色偏好。                          |
| `tts.providers`   | 列出已配置的提供商及状态。                  |

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 文本转语音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/zh-CN/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
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
