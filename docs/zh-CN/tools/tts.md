---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商、回退链或角色设定
    - 使用 /tts 命令或指令
sidebarTitle: Text to speech (TTS)
summary: 出站回复的文本转语音——提供商、角色、斜杠命令和按渠道输出
title: 文本转语音
x-i18n:
    generated_at: "2026-07-12T14:50:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 908679a0386da75577a2445dfcafecc746d124ffe04816c6f2d6eb74af232edd
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw 可通过 **14 个语音提供商**将出站回复转换为音频：
在 Feishu、Matrix、Telegram 和 WhatsApp 上发送原生语音消息；在其他平台上发送音频
附件；并为电话和 Talk 提供 PCM/Ulaw 流。

TTS 是 Talk 的 `stt-tts` 模式中的语音输出部分（`talk.speak` 调用相同的
合成路径）。使用提供商原生 `realtime` 的 Talk 会话则在实时提供商内部合成
语音；`transcription` 会话绝不会合成智能体语音回复。

## 快速开始

<Steps>
  <Step title="选择提供商">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和
    Local CLI 无需 API key 即可工作。完整列表请参阅[提供商矩阵](#supported-providers)。
  </Step>
  <Step title="设置 API key">
    导出你的提供商所需的环境变量（例如 `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 无需密钥。
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
    `/tts status` 显示当前状态。`/tts audio Hello from OpenClaw`
    会发送一条一次性音频回复。
  </Step>
</Steps>

<Note>
默认情况下，自动 TTS **处于关闭状态**。如果未设置 `messages.tts.provider`，
OpenClaw 会按注册表自动选择顺序选取第一个已配置的提供商。
内置的 `tts` 智能体工具仅在明确表达意图时使用：普通聊天仍为
文本，除非用户请求音频、使用 `/tts`，或启用自动 TTS/指令
语音。
</Note>

## 支持的提供商

| 提供商            | 身份验证                                                                                                         | 说明                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）        | 原生 Ogg/Opus 语音留言输出和电话输出。                                                      |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | 与 OpenAI 兼容的 TTS。默认为 `hexgrad/Kokoro-82M`。                                         |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 支持语音克隆、多语言和通过 `seed` 实现确定性；为 Discord 语音播放提供流式传输。              |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API 批量 TTS；通过 `promptTemplate: "audio-profile-v1"` 感知角色设定。                |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 语音留言和电话输出。                                                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 流式 TTS API。支持原生 Opus 语音留言和 PCM 电话音频。                                       |
| **Local CLI**     | 无                                                                                                               | 运行已配置的本地 TTS 命令。                                                                 |
| **Microsoft**     | 无                                                                                                               | 通过 `node-edge-tts` 使用公开的 Edge 神经网络 TTS。尽力而为，不提供 SLA。                    |
| **MiniMax**       | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）     | T2A v2 API。默认为 `speech-2.8-hd`。                                                        |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用于自动摘要；支持角色 `instructions`。                                                   |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`）                                              | 默认模型为 `hexgrad/kokoro-82m`。                                                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                             |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共享的图像、视频和语音提供商。                                                              |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批量 TTS。**不**支持原生 Opus 语音留言。                                                |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 通过 Xiaomi 聊天补全使用 MiMo TTS。                                                         |

如果配置了多个提供商，会优先使用选定的提供商，其他提供商则作为后备选项。
自动摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你
保持摘要功能启用，该提供商也必须完成身份验证。

<Warning>
内置的 **Microsoft** 提供商通过 `node-edge-tts` 使用 Microsoft Edge 的在线神经网络 TTS
服务。它是一个未公布 SLA 或配额的公共 Web 服务，因此应将其视为尽力而为的服务。
旧版提供商 ID `edge` 会规范化为 `microsoft`，且 `openclaw doctor --fix` 会重写持久化的
配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 的 `messages.tts` 下。选择一个
预设并调整提供商配置块。下面所示的 `speakerVoice`/`speakerVoiceId`
字段是规范字段；每个提供商自身的 `voice`/`voiceId`/
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
          // 可选的自然语言风格提示：
          // audioProfile: "使用平静的播客主持人口吻说话。",
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
  <Tab title="Microsoft（无需密钥）">
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

对于 Xiaomi `mimo-v2.5-tts-voicedesign`，请省略 `speakerVoice`，并将 `style` 设置为
语音设计提示词。OpenClaw 会将该提示词作为 TTS `user` 消息发送，并且不会为
voicedesign 模型发送 `audio.voice`。

### 按智能体覆盖语音设置

使用 `agents.list[].tts`，可让某个智能体使用不同的提供商、语音、模型、角色设定或自动 TTS 模式进行语音输出。智能体配置块会深度合并并覆盖 `messages.tts`，因此提供商凭据可以保留在全局提供商配置中：

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

要为每个智能体固定角色设定，请在提供商配置旁设置 `agents.list[].tts.persona`——它仅为该智能体覆盖全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 和 `tts` 智能体工具的优先级顺序如下：

1. `messages.tts`
2. 当前的 `agents.list[].tts`
3. 渠道覆盖配置（当渠道支持 `channels.<channel>.tts` 时）
4. 账号覆盖配置（当渠道传递 `channels.<channel>.accounts.<id>.tts` 时）
5. 此主机的本地 `/tts` 偏好设置
6. 启用[模型覆盖](#model-driven-directives)时的内联 `[[tts:...]]` 指令

渠道和账号覆盖配置使用与 `messages.tts` 相同的结构，并深度合并覆盖之前的层级，因此共享的提供商凭据可以保留在 `messages.tts` 中，而渠道或 Bot 账号仅更改说话人语音、模型、角色设定或自动模式：

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

## 角色设定

**角色设定**是一种稳定的语音身份，可在不同提供商之间以确定性方式应用。它可以指定首选提供商、定义与提供商无关的提示意图，并携带针对特定提供商的语音、模型、提示模板、种子和语音设置绑定。

### 最小角色设定

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "旁白",
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

### 完整角色设定（与提供商无关的提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "冷幽默、温和的英式管家旁白。",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "一位才华横溢的英国管家。冷幽默、机智、温和、迷人、情感丰富，绝不千篇一律。",
            scene: "深夜安静的书房。为可信任的操作员进行近距离收音旁白。",
            sampleContext: "说话人正以简洁的自信和冷幽默式的温和语气回答一项私密的技术请求。",
            style: "优雅、克制，略带笑意。",
            accent: "英式英语。",
            pacing: "节奏从容，带有短暂的戏剧性停顿。",
            constraints: ["不要大声读出配置值。", "不要解释角色设定。"],
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

### 角色设定解析

当前角色设定按以下确定性顺序选择：

1. `/tts persona <id>` 本地偏好设置（如果已设置）。
2. `messages.tts.persona`（如果已设置）。
3. 不使用角色设定。

提供商选择采用显式优先原则：

1. 直接覆盖配置（CLI、Gateway 网关、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本地偏好设置。
3. 当前角色设定的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

每次尝试提供商时，OpenClaw 按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 可信请求覆盖配置
4. 允许的模型生成 TTS 指令覆盖配置

### 提供商如何使用角色设定提示

角色设定提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）**与提供商无关**。每个提供商自行决定如何使用这些字段：

<AccordionGroup>
  <Accordion title="Google Gemini">
    仅当有效的 Google 提供商配置设置了 `promptTemplate: "audio-profile-v1"` 或 `personaPrompt` 时，才会将角色设定提示字段封装到 Gemini TTS 提示结构中。较旧的 `audioProfile` 和 `speakerName` 字段仍会作为 Google 特有的提示文本添加到开头。`[[tts:text]]` 块中的 `[whispers]` 或 `[laughs]` 等内联音频标签会保留在 Gemini 文本中；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    仅当未配置显式的 OpenAI `instructions` 时，才会将角色设定提示字段映射到请求的 `instructions` 字段。显式的 `instructions` 始终优先。
  </Accordion>
  <Accordion title="其他提供商">
    仅使用 `personas.<id>.providers.<provider>` 下特定于提供商的角色设定绑定。除非提供商实现了自己的角色设定提示映射，否则会忽略角色设定提示字段。
  </Accordion>
</AccordionGroup>

### 回退策略

当角色设定对尝试的提供商**没有绑定**时，`fallbackPolicy` 控制其行为：

| 策略                | 行为                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **默认值。**与提供商无关的提示字段仍然可用；提供商可以使用或忽略它们。                                                                           |
| `provider-defaults` | 本次尝试的提示准备过程会忽略角色设定；提供商使用其中性默认值，同时继续回退到其他提供商。                                                         |
| `fail`              | 跳过本次提供商尝试，并设置 `reasonCode: "not_configured"` 和 `personaBinding: "missing"`。仍会尝试回退提供商。                                    |

只有当尝试的**所有**提供商都被跳过或失败时，整个 TTS 请求才会失败。

Talk 会话的提供商选择仅限当前会话。Talk 客户端应从 `talk.catalog` 中选择提供商 ID、模型 ID、语音 ID 和区域设置，并通过 Talk 会话或移交请求传递这些值。打开语音会话不应修改 `messages.tts` 或全局 Talk 提供商默认值。

## 模型驱动指令

默认情况下，助手**可以**生成 `[[tts:...]]` 指令，为单次回复覆盖语音、模型或速度，还可使用可选的 `[[tts:text]]...[[/tts:text]]` 块添加仅应出现在音频中的表现力提示：

```text
给你。

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]]（笑）再读一遍这首歌。[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，必须存在**指令**才能触发音频。分块流式传输会在渠道看到可见文本之前移除指令，即使指令被拆分到相邻的块中也是如此。

除非设置 `modelOverrides.allowProvider: true`，否则会忽略 `provider=...`。当回复声明 `provider=...` 时，该指令中的其他键仅由该提供商解析；不支持的键会被移除，并报告为 TTS 指令警告。

**可用的指令键：**

- `provider`（已注册的提供商 ID；需要 `allowProvider: true`）
- `speakerVoice` / `speakerVoiceId`（旧版别名：`voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，`(0, 10]`）
- `pitch`（MiniMax 整数音高，−12 到 12；小数值会被截断）
- `emotion`（Volcengine 情绪标签）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全禁用模型覆盖：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允许切换提供商，同时保持其他选项可配置：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 斜杠命令

使用单一命令 `/tts`。在 Discord 上，OpenClaw 还会注册 `/voice`，因为 `/tts` 是 Discord 内置命令——文本形式的 `/tts ...` 仍然有效。

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
命令要求发送者已获授权（适用允许列表/所有者规则），并且必须启用 `commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 将本地 TTS 偏好设置写为 `always`；`/tts off` 将其写为 `off`。
- `/tts chat on|off|default` 为当前聊天写入会话范围的自动 TTS 覆盖设置。
- `/tts persona <id>` 写入本地角色设定偏好；`/tts persona off` 将其清除。
- `/tts latest` 从当前会话记录中读取最新的助手回复，并将其作为音频发送一次。它仅在会话条目中存储该回复的哈希值，以避免重复发送语音。
- `/tts audio` 生成一次性音频回复（**不会**开启 TTS）。
- `/tts limit <chars>` 接受 **100–4096**（4096 是 Telegram 字幕/消息的最大长度）；超出该范围的值会被拒绝。
- `limit` 和 `summary` 存储在**本地偏好设置**中，而不是主配置中。
- `/tts status` 包含最新一次尝试的回退诊断信息——`Fallback: <primary> -> <used>`、`Attempts: ...`，以及每次尝试的详细信息（`provider:outcome(reasonCode) latency`）。
- 启用 TTS 后，`/status` 会显示当前 TTS 模式，以及已配置的提供商、模型、语音和经过清理的自定义端点元数据。

## 每用户偏好设置

斜杠命令会将本地覆盖配置写入 `prefsPath`。默认路径为 `~/.openclaw/settings/tts.json`；可使用 `OPENCLAW_TTS_PREFS` 环境变量或 `messages.tts.prefsPath` 覆盖。

| 存储字段     | 作用                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | 本地自动 TTS 覆盖设置（`always`、`off` 等）                                      |
| `provider`   | 本地主提供商覆盖设置                                                             |
| `persona`    | 本地角色设定覆盖设置                                                             |
| `maxLength`  | 摘要/截断阈值（默认 `1500` 个字符，`/tts limit` 范围为 100–4096）                |
| `summarize`  | 摘要开关（默认为 `true`）                                                        |

这些设置会覆盖此主机上由 `messages.tts` 与当前 `agents.list[].tts` 配置块共同产生的有效配置。

## 输出格式

TTS 语音发送由渠道能力驱动。渠道插件会声明：
语音风格的 TTS 是否应要求提供商使用原生 `voice-note` 目标，还是
保持常规 `audio-file` 合成；以及渠道是否会在发送前对
非原生输出进行转码。

| 目标                                  | 格式                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 语音消息回复优先使用 **Opus**（ElevenLabs 的 `opus_48000_64`、OpenAI 的 `opus`）。48 kHz / 64 kbps 在清晰度和大小之间取得平衡。       |
| 其他渠道                              | **MP3**（ElevenLabs 的 `mp3_44100_128`、OpenAI 的 `mp3`）。44.1 kHz / 128 kbps 是语音的默认平衡方案。                               |
| Talk / 电话                           | 提供商原生 **PCM**（Inworld 为 22050 Hz，Google 为 24 kHz），或用于电话的 Gradium `ulaw_8000`。                                    |

各提供商说明：

- **Feishu / WhatsApp 转码：**当语音消息回复以 MP3/WebM/WAV/M4A 或其他可能的音频文件形式生成时，渠道插件会在发送原生语音消息前，使用 `ffmpeg`（`libopus`，64 kbps）将其转码为 48 kHz Ogg/Opus。WhatsApp 通过 Baileys `audio` 载荷发送结果，并设置 `ptt: true` 和 `audio/ogg; codecs=opus`。转码失败时：Feishu 会捕获错误，并回退为将原始文件作为普通附件发送；WhatsApp 没有回退机制，因此发送操作本身会失败，而不会发布不兼容的 PTT 载荷。
- **MiniMax：**常规音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）；对于渠道声明的语音消息目标，使用 `ffmpeg` 转码为 48 kHz Opus。
- **Xiaomi MiMo：**默认使用 MP3，配置后也可使用 WAV；对于渠道声明的语音消息目标，使用 `ffmpeg` 转码为 48 kHz Opus。
- **本地 CLI：**使用配置的 `outputFormat`。语音消息目标会转换为 Ogg/Opus，电话输出会使用 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini：**返回原始 24 kHz PCM。OpenClaw 将其封装为 WAV 以用作音频附件，针对语音消息目标转码为 48 kHz Opus，并针对 Talk/电话直接返回 PCM。
- **Gradium：**音频附件使用 WAV，语音消息目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld：**常规音频附件使用 MP3，语音消息目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI：**默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。使用 xAI 的批量 REST TTS 端点并返回完整的音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。不支持原生 Opus 语音消息格式。
- **Microsoft：**使用 `microsoft.outputFormat`（默认值为 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输层接受 `outputFormat`，但服务不一定提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果需要有保证的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会使用 MP3 重试。
  - 如果未设置显式语音覆盖并使用默认英语语音，当回复文本以 CJK 字符为主时，OpenClaw 会自动切换到中文神经网络语音（`zh-CN-XiaoxiaoNeural`，`zh-CN` 区域设置）。

OpenAI 和 ElevenLabs 的输出格式按上表针对各渠道固定。

## 自动 TTS 行为

启用 `messages.tts.auto` 后，OpenClaw 会：

- 如果回复已包含结构化媒体，则跳过 TTS。
- 跳过非常短的回复（少于 10 个字符）。
- 启用摘要时，对长回复进行摘要，使用
  `summaryModel`（或 `agents.defaults.model.primary`）。
- 将生成的音频附加到回复中。
- 在 `mode: "final"` 中，文本流完成后，仍会为流式最终回复发送纯音频 TTS；
  生成的媒体会经过与常规回复附件相同的
  渠道媒体规范化处理。

如果回复超过 `maxLength`，OpenClaw 绝不会直接跳过音频：

- **开启摘要**（默认）且摘要模型可用：将
  文本摘要为大约 `maxLength` 个字符，然后合成摘要。
- **关闭摘要**、摘要失败或摘要模型没有可用的 API 密钥：
  将文本截断为 `maxLength` 个字符，并合成
  截断后的文本。

```text
回复 -> 是否启用 TTS？
  否  -> 发送文本
  是 -> 有媒体 / 内容很短？
          是 -> 发送文本
          否  -> 长度 > 限制？
                   否  -> TTS -> 附加音频
                   是 -> 摘要已启用且可用？
                            否  -> 截断 -> TTS -> 附加音频
                            是 -> 摘要 -> TTS -> 附加音频
```

## 字段参考

<AccordionGroup>
  <Accordion title="顶层 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 仅在收到语音消息后发送音频；`tagged` 仅在回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 会将其迁移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      除最终回复外，`"all"` 还包括工具/分块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音提供商 ID。未设置时，OpenClaw 使用注册表自动选择顺序中第一个已配置的提供商。旧版 `provider: "edge"` 会由 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的活动角色 ID。规范化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。请参阅[角色](#personas)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认为 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认为 `true`；`allowProvider` 默认为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      按语音提供商 ID 设置键名的提供商自有设置。旧版直接配置块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）会由 `openclaw doctor --fix` 重写；仅提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS 输入字符数的硬性上限。超过此限制时，`/tts audio`、`tts.convert` 和 `tts.speak` 会失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      请求超时时间（毫秒）。设置后，单次调用的 `timeoutMs`（智能体工具、Gateway 网关）优先；否则，显式配置的 `messages.tts.timeoutMs` 优先于插件定义的任何提供商默认值。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地偏好设置 JSON 路径（提供商/限制/摘要）。默认值为 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 区域（例如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖（别名 `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure 语音 ShortName。默认值为 `en-US-JennyNeural`。旧版别名：`voice`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认值为 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">用于标准音频的 Azure `X-Microsoft-OutputFormat`。默认值为 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">用于语音消息输出的 Azure `X-Microsoft-OutputFormat`。默认值为 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 ID。默认值为 `eleven_multilingual_v2`。旧版 ID `eleven_turbo_v2_5`/`eleven_turbo_v2` 会规范化为对应的 `flash` 模型。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs 语音 ID。默认值为 `pMsXgVXv3BLzUgSXRplE`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（每项为 `0..1`，默认值分别为 `0.5`/`0.75`/`0`）、`useSpeakerBoost`（`true|false`，默认值为 `true`）、`speed`（`0.5..2.0`，默认值为 `1.0`）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本规范化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 字母 ISO 639-1 代码（例如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">用于尽力实现确定性的整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API 基础 URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如果省略，TTS 可以先复用 `models.providers.google.apiKey`，再回退到环境变量。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认值为 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini 预置语音名称。默认值为 `Kore`。旧版别名：`voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本前添加的自然语言风格提示词。</ParamField>
    <ParamField path="speakerName" type="string">当提示词使用具名说话者时，在朗读文本前添加的可选说话者标签。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1`，以便将活动角色提示词字段包装在确定性的 Gemini TTS 提示词结构中。</ParamField>
    <ParamField path="personaPrompt" type="string">附加到模板 Director's Notes 的 Google 专用额外角色提示文本。</ParamField>
    <ParamField path="baseUrl" type="string">仅接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">环境变量：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">位于 `api.gradium.ai` 的 HTTPS Gradium API URL。默认值为 `https://api.gradium.ai`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认为 Emma（`YTpq7expH9539ERJ`）。旧版别名：`voiceId`。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld 主要配置

    <ParamField path="apiKey" type="string">环境变量：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">默认值为 `inworld-tts-1.5-max`。另有：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值为 `Sarah`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="temperature" type="number">采样温度为 `0..2`（不含 0）。</ParamField>

  </Accordion>

  <Accordion title="本地 CLI（tts-local-cli）">
    <ParamField path="command" type="string">用于 CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期的 CLI 输出格式。音频附件的默认值为 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时时间（毫秒）。默认值为 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选的命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">可选的命令环境变量覆盖值。</ParamField>

    命令标准输出以及生成或转换后的音频上限为 50 MiB。诊断标准错误输出上限为 1 MiB。任一限制被超过时，OpenClaw 都会终止命令并使合成失败。

  </Accordion>

  <Accordion title="Microsoft（无需 API key）">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft 神经网络语音名称（例如 `en-US-MichelleNeural`）。旧版别名：`voice`。如果正在使用默认英语语音，且回复文本以 CJK 字符为主，OpenClaw 会自动切换到 `zh-CN-XiaoxiaoNeural`。</ParamField>
    <ParamField path="lang" type="string">语言代码（例如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认值为 `audio-24khz-48kbitrate-mono-mp3`。内置的 Edge 后端传输并不支持所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（例如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">在音频文件旁写入 JSON 字幕。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求使用的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖值（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix`，将持久化配置重写为 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退使用 `MINIMAX_API_KEY`。通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY` 进行 Token Plan 身份验证。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认值为 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值为 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。旧版别名：`voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认值为 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认值为 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认值为 `0`。请求前会截断小数部分。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退使用 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 ID。默认值为 `gpt-4o-mini-tts`。</ParamField>
    <ParamField path="speakerVoice" type="string">语音名称（例如 `alloy`、`cedar`）。默认值为 `coral`。旧版别名：`voice`。</ParamField>
    <ParamField path="instructions" type="string">显式 OpenAI `instructions` 字段。设置后，角色提示词字段**不会**自动映射。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">额外的 JSON 字段，会在生成的 OpenAI TTS 字段之后合并到 `/audio/speech` 请求正文中。可将其用于 Kokoro 等 OpenAI 兼容端点，这些端点需要 `lang` 等提供商专用键；不安全的原型键会被忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值会被视为 OpenAI 兼容 TTS 端点，因此接受自定义模型和语音名称，并且不再对 `speed` 执行 `0.25..4.0` 范围检查。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 会被规范化。</ParamField>
    <ParamField path="model" type="string">默认值为 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">默认值为 `af_alloy`。旧版别名：`voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认值为 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖值。</ParamField>
  </Accordion>

  <Accordion title="Volcengine（BytePlus Seed Speech）">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认值为 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当你的项目拥有 TTS 2.0 权限时，请使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 请求头。默认值为 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">语音类型。默认值为 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。旧版别名：`voice`。</ParamField>
    <ParamField path="speedRatio" type="number">提供商原生速度比率，`0.2..3`。</ParamField>
    <ParamField path="emotion" type="string">提供商原生情感标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认值为 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">默认值为 `eve`。提供身份验证后，`openclaw infer tts voices --provider xai` 会获取当前内置目录；未提供身份验证时，会列出离线回退项 `ara`、`eve`、`leo`、`rex` 和 `sal`。即使账户自定义语音 ID 不在内置列表中，也会继续转发。旧版别名：`voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认值为 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认值为 `mp3`。</ParamField>
    <ParamField path="speed" type="number">提供商原生速度覆盖值，`0.7..1.5`。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认值为 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认值为 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。还支持 `mimo-v2-tts` 和 `mimo-v2.5-tts-voicedesign`。</ParamField>
    <ParamField path="speakerVoice" type="string">预设语音模型的默认值为 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。旧版别名：`voice`。对于 `mimo-v2.5-tts-voicedesign`，不会发送此字段。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认值为 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格指令，将作为用户消息发送，但不会被朗读。对于 `mimo-v2.5-tts-voicedesign`，这是语音设计提示词；省略时，OpenClaw 会提供默认值。</ParamField>
  </Accordion>
</AccordionGroup>

## Agent 工具

`tts` 工具将文本转换为语音，并返回音频附件用于发送回复。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频会作为语音消息而不是文件附件发送。如果 `ffmpeg` 可用，Feishu 和 WhatsApp 可以在此路径上转码非 Opus 格式的 TTS 输出。

WhatsApp 通过 Baileys 将音频作为 PTT 语音消息发送（`audio` 配合 `ptt: true`），并将可见文本与 PTT 音频**分开发送**，因为客户端无法一致地在语音消息上呈现说明文字。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是每次调用的提供商请求超时时间（毫秒）。每次调用的值会覆盖 `messages.tts.timeoutMs`；配置的 TTS 超时时间会覆盖插件指定的任何提供商默认值。

## Gateway RPC

| 方法              | 用途                                         |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 读取当前 TTS 状态和上次尝试。                |
| `tts.enable`      | 将本地自动偏好设置为 `always`。              |
| `tts.disable`     | 将本地自动偏好设置为 `off`。                 |
| `tts.convert`     | 一次性将文本转换为音频。                     |
| `tts.setProvider` | 设置本地提供商偏好。                         |
| `tts.personas`    | 列出已配置的角色和当前启用的角色。           |
| `tts.setPersona`  | 设置本地角色偏好。                           |
| `tts.providers`   | 列出已配置的提供商及其状态。                 |

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
