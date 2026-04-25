---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于外发回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
    generated_at: "2026-04-25T08:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14a2d014850395add532faef86659acae7fd6a8a5757f9dd7dac606c0780d278
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以使用 ElevenLabs、Google Gemini、Gradium、Microsoft、MiniMax、OpenAI、Vydra、xAI 或 Xiaomi MiMo，将外发回复转换为音频。  
它适用于 OpenClaw 能够发送音频的任何场景。

## 支持的服务

- **ElevenLabs**（主要或回退提供商）
- **Google Gemini**（主要或回退提供商；使用 Gemini API TTS）
- **Gradium**（主要或回退提供商；支持语音便笺和电话输出）
- **Microsoft**（主要或回退提供商；当前内置实现使用 `node-edge-tts`）
- **MiniMax**（主要或回退提供商；使用 T2A v2 API）
- **OpenAI**（主要或回退提供商；也用于摘要）
- **Vydra**（主要或回退提供商；共享图像、视频和语音提供商）
- **xAI**（主要或回退提供商；使用 xAI TTS API）
- **Xiaomi MiMo**（主要或回退提供商；通过 Xiaomi chat completions 使用 MiMo TTS）

### Microsoft 语音说明

当前内置的 Microsoft 语音提供商通过 `node-edge-tts` 库，使用 Microsoft Edge 的在线神经 TTS 服务。它是托管服务（不是本地服务），使用 Microsoft 的端点，并且不需要 API 密钥。  
`node-edge-tts` 提供语音配置选项和输出格式，但并非所有选项都受到该服务支持。使用 `edge` 的旧版配置和指令输入仍然有效，并会被规范化为 `microsoft`。

由于这一路径是公共 Web 服务，没有公开发布的 SLA 或配额，请将其视为“尽力而为”服务。如果你需要有保证的限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选密钥

如果你想使用 OpenAI、ElevenLabs、Google Gemini、Gradium、MiniMax、Vydra、xAI 或 Xiaomi MiMo：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `GEMINI_API_KEY`（或 `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Microsoft 语音**不**需要 API 密钥。

如果配置了多个提供商，将优先使用所选提供商，其他提供商作为回退选项。  
自动摘要使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你启用了摘要，该提供商也必须完成认证。

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 认证](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-CN/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo 语音合成](/zh-CN/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI 文本转语音](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 默认启用吗？

不是。自动 TTS 默认是**关闭**的。可在配置中使用 `messages.tts.auto` 启用，或在本地使用 `/tts on` 启用。

当 `messages.tts.provider` 未设置时，OpenClaw 会按注册表自动选择顺序，选择第一个已配置的语音提供商。

## 配置

TTS 配置位于 `openclaw.json` 的 `messages.tts` 下。  
完整 schema 位于 [Gateway 网关配置](/zh-CN/gateway/configuration)。

### 最小配置（启用 + 提供商）

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

### OpenAI 主提供商 + ElevenLabs 回退

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft 主提供商（无 API 密钥）

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS 使用 Gemini API 密钥路径。这里可以使用限定为 Gemini API 的 Google Cloud Console API 密钥，其形式与内置 Google 图像生成提供商使用的密钥相同。解析顺序为：  
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` -> `GEMINI_API_KEY` -> `GOOGLE_API_KEY`。

### xAI 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS 与内置 Grok 模型提供商使用相同的 `XAI_API_KEY` 路径。解析顺序为 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`。  
当前可用的实时语音有 `ara`、`eve`、`leo`、`rex`、`sal` 和 `una`；默认值为 `eve`。`language` 接受 BCP-47 标签或 `auto`。

### Xiaomi MiMo 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS 与内置 Xiaomi 模型提供商使用相同的 `XIAOMI_API_KEY` 路径。语音提供商 ID 是 `xiaomi`；`mimo` 可作为别名使用。目标文本会作为 assistant message 发送，以匹配 Xiaomi 的 TTS 协议。可选的 `style` 会作为 user instruction 发送，不会被朗读。

### OpenRouter 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS 与内置 OpenRouter 模型提供商使用相同的 `OPENROUTER_API_KEY` 路径。解析顺序为  
`messages.tts.providers.openrouter.apiKey` ->  
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`。

### Gradium 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### 禁用 Microsoft 语音

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### 自定义限制 + 偏好设置路径

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 仅在收到入站语音消息后以音频回复

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 为长回复禁用自动摘要

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

然后运行：

```
/tts summary off
```

### 字段说明

- `auto`：自动 TTS 模式（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` 仅在收到入站语音消息后发送音频。
  - `tagged` 仅当回复包含 `[[tts:key=value]]` 指令或 `[[tts:text]]...[[/tts:text]]` 块时发送音频。
- `enabled`：旧版开关（`doctor` 会将其迁移到 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包括工具/分块回复）。
- `provider`：语音提供商 ID，例如 `"elevenlabs"`、`"google"`、`"gradium"`、`"microsoft"`、`"minimax"`、`"openai"`、`"vydra"`、`"xai"` 或 `"xiaomi"`（回退会自动处理）。
- 如果 `provider` **未设置**，OpenClaw 会按注册表自动选择顺序使用第一个已配置的语音提供商。
- 旧版 `provider: "edge"` 配置可通过 `openclaw doctor --fix` 修复，并重写为 `provider: "microsoft"`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型发出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（切换提供商需要显式启用）。
- `providers.<id>`：由提供商自行管理、以语音提供商 ID 为键的设置。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）可通过 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.<id>`。
- 旧版 `messages.tts.providers.edge` 也可通过 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.microsoft`。
- `maxTextLength`：TTS 输入的硬上限（字符数）。如果超过此限制，`/tts audio` 会失败。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地偏好设置 JSON 路径（提供商/限制/摘要）。
- `apiKey` 值可回退到环境变量（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`GEMINI_API_KEY`/`GOOGLE_API_KEY`、`GRADIUM_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`、`VYDRA_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API 基础 URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS 端点。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值会被视为兼容 OpenAI 的 TTS 端点，因此接受自定义模型名和语音名。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：2 位 ISO 639-1 代码（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力保证确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API 基础 URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：语音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：整数音高偏移 `-12..12`（默认 0）。调用 MiniMax T2A 前会截断小数值，因为该 API 拒绝非整数音高值。
- `providers.google.model`：Gemini TTS 模型（默认 `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`：Gemini 预设语音名称（默认 `Kore`；也接受 `voice`）。
- `providers.google.audioProfile`：在朗读文本前附加的自然语言风格提示。
- `providers.google.speakerName`：可选说话人标签；当你的 TTS 提示使用命名说话人时，会在朗读文本前附加。
- `providers.google.baseUrl`：覆盖 Gemini API 基础 URL。只接受 `https://generativelanguage.googleapis.com`。
  - 如果省略 `messages.tts.providers.google.apiKey`，TTS 可以在回退到环境变量之前复用 `models.providers.google.apiKey`。
- `providers.gradium.baseUrl`：覆盖 Gradium API 基础 URL（默认 `https://api.gradium.ai`）。
- `providers.gradium.voiceId`：Gradium 语音标识符（默认 Emma，`YTpq7expH9539ERJ`）。
- `providers.xai.apiKey`：xAI TTS API 密钥（环境变量：`XAI_API_KEY`）。
- `providers.xai.baseUrl`：覆盖 xAI TTS 基础 URL（默认 `https://api.x.ai/v1`，环境变量：`XAI_BASE_URL`）。
- `providers.xai.voiceId`：xAI 语音 ID（默认 `eve`；当前可用实时语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`：BCP-47 语言代码或 `auto`（默认 `en`）。
- `providers.xai.responseFormat`：`mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`（默认 `mp3`）。
- `providers.xai.speed`：提供商原生速度覆盖值。
- `providers.xiaomi.apiKey`：Xiaomi MiMo API 密钥（环境变量：`XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`：覆盖 Xiaomi MiMo API 基础 URL（默认 `https://api.xiaomimimo.com/v1`，环境变量：`XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`：TTS 模型（默认 `mimo-v2.5-tts`，环境变量：`XIAOMI_TTS_MODEL`；也支持 `mimo-v2-tts`）。
- `providers.xiaomi.voice`：MiMo 语音 ID（默认 `mimo_default`，环境变量：`XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`：`mp3` 或 `wav`（默认 `mp3`，环境变量：`XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`：可选的自然语言风格指令，作为 user message 发送；不会被朗读。
- `providers.openrouter.apiKey`：OpenRouter API 密钥（环境变量：`OPENROUTER_API_KEY`；可复用 `models.providers.openrouter.apiKey`）。
- `providers.openrouter.baseUrl`：覆盖 OpenRouter TTS 基础 URL（默认 `https://openrouter.ai/api/v1`；旧版 `https://openrouter.ai/v1` 会被规范化）。
- `providers.openrouter.model`：OpenRouter TTS 模型 ID（默认 `hexgrad/kokoro-82m`；也接受 `modelId`）。
- `providers.openrouter.voice`：提供商特定语音 ID（默认 `af_alloy`；也接受 `voiceId`）。
- `providers.openrouter.responseFormat`：`mp3` 或 `pcm`（默认 `mp3`）。
- `providers.openrouter.speed`：提供商原生速度覆盖值。
- `providers.microsoft.enabled`：允许使用 Microsoft 语音（默认 `true`；不需要 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参见 Microsoft Speech 输出格式；并非所有格式都受内置的 Edge 后端传输支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft 语音请求使用的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖值（毫秒）。
- `edge.*`：同一组 Microsoft 设置的旧版别名。运行
  `openclaw doctor --fix` 可将持久化配置重写为 `providers.microsoft`。

## 模型驱动的覆盖项（默认开启）

默认情况下，模型**可以**为单条回复发出 TTS 指令。  
当 `messages.tts.auto` 为 `tagged` 时，必须使用这些指令才能触发音频。

启用后，模型可以发出 `[[tts:...]]` 指令来覆盖单条回复的语音设置，还可以附加一个可选的 `[[tts:text]]...[[/tts:text]]` 块，以提供只应出现在音频中的表现性标记（笑声、唱歌提示等）。

除非设置 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

示例回复负载：

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

可用的指令键（启用时）：

- `provider`（已注册的语音提供商 ID，例如 `openai`、`elevenlabs`、`google`、`gradium`、`minimax`、`microsoft`、`vydra`、`xai` 或 `xiaomi`；需要 `allowProvider: true`）
- `voice`（OpenAI、Gradium 或 Xiaomi 语音）、`voiceName` / `voice_name` / `google_voice`（Google 语音），或 `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS 模型、ElevenLabs 模型 ID、MiniMax 模型或 Xiaomi MiMo TTS 模型）或 `google_model`（Google TTS 模型）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 整数音高，-12 到 12；在发起 MiniMax 请求前会截断小数值）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

禁用所有模型覆盖：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

可选允许列表（启用提供商切换，同时保留其他参数可配置）：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## 每用户偏好设置

斜杠命令会将本地覆盖项写入 `prefsPath`（默认：
`~/.openclaw/settings/tts.json`，可通过 `OPENCLAW_TTS_PREFS` 或
`messages.tts.prefsPath` 覆盖）。

存储的字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 个字符）
- `summarize`（默认 `true`）

这些字段会在该主机上覆盖 `messages.tts.*`。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：语音便笺回复优先使用 Opus（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是语音消息的良好折中方案。
- **Feishu**：当语音便笺回复生成为 MP3/WAV/M4A 或其他可能的音频文件时，Feishu 插件会在发送原生 `audio` 气泡前，使用 `ffmpeg` 将其转码为 48 kHz Ogg/Opus。如果转换失败，Feishu 会收到原始文件作为附件。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于 Feishu 和 Telegram 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 MiniMax 的 MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，或在配置时使用 WAV。对于 Feishu 和 Telegram 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 的输出转码为 48 kHz Opus。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于音频附件，并为 Talk/电话场景直接返回 PCM。此路径不支持原生 Opus 语音便笺格式。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话场景使用 8 kHz 的 `ulaw_8000`。
- **xAI**：默认使用 MP3；`responseFormat` 可为 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批处理 REST TTS 端点，并返回完整的音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输支持 `outputFormat`，但并非所有格式都可从该服务获得。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保证的 Opus 语音消息，请使用 OpenAI 或 ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会回退并重试使用 MP3。

OpenAI/ElevenLabs 的输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过过短的回复（少于 10 个字符）。
- 在启用时使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复生成摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength`，且摘要已关闭（或摘要模型没有 API 密钥），则会跳过音频，并发送普通文本回复。

## 流程图

```
回复 -> 已启用 TTS？
  否  -> 发送文本
  是  -> 是否包含媒体 / `MEDIA:` / 过短？
          是  -> 发送文本
          否  -> 长度 > 限制？
                   否  -> TTS -> 附加音频
                   是  -> 已启用摘要？
                            否  -> 发送文本
                            是  -> 生成摘要（`summaryModel` 或 `agents.defaults.model.primary`）
                                      -> TTS -> 附加音频
```

## 斜杠命令用法

只有一个命令：`/tts`。  
启用详情请参见 [斜杠命令](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 的内置命令，因此 OpenClaw 会在那里将原生命令注册为 `/voice`。文本形式的 `/tts ...` 仍然可用。

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

说明：

- 命令要求发送者已获授权（允许列表/所有者规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- 配置 `messages.tts.auto` 接受 `off|always|inbound|tagged`。
- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会将其写为 `off`。
- 当你希望默认使用 `inbound` 或 `tagged` 时，请使用配置。
- `limit` 和 `summary` 存储在本地偏好设置中，而不是主配置中。
- `/tts audio` 会生成一次性的音频回复（不会将 TTS 切换为开启）。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加 `Attempts: ...`
  - 失败：`Error: ...` 加 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 和 ElevenLabs API 失败现在会包含已解析的提供商错误详情和请求 ID（当提供商返回时），这些信息会显示在 TTS 错误/日志中。

## 智能体工具

`tts` 工具可将文本转换为语音，并返回用于回复投递的音频附件。当渠道为 Feishu、Matrix、Telegram 或 WhatsApp 时，音频会以语音消息而不是文件附件的形式投递。  
当 `ffmpeg` 可用时，Feishu 可以在此路径中对非 Opus 的 TTS 输出进行转码。  
它接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是按调用设置的提供商请求超时时间，单位为毫秒。

## Gateway 网关 RPC

Gateway 网关方法：

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 相关内容

- [媒体概览](/zh-CN/tools/media-overview)
- [音乐生成](/zh-CN/tools/music-generation)
- [视频生成](/zh-CN/tools/video-generation)
