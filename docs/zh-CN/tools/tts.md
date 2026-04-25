---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于发出回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
    generated_at: "2026-04-25T11:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以使用 ElevenLabs、Google Gemini、Gradium、Local CLI、Microsoft、MiniMax、OpenAI、Vydra、xAI 或 Xiaomi MiMo，将发出的回复转换为音频。
它适用于 OpenClaw 能发送音频的任何地方。

## 支持的服务

- **ElevenLabs**（主要或回退提供商）
- **Google Gemini**（主要或回退提供商；使用 Gemini API TTS）
- **Gradium**（主要或回退提供商；支持语音便笺和电话输出）
- **Local CLI**（主要或回退提供商；运行已配置的本地 TTS 命令）
- **Microsoft**（主要或回退提供商；当前内置实现使用 `node-edge-tts`）
- **MiniMax**（主要或回退提供商；使用 T2A v2 API）
- **OpenAI**（主要或回退提供商；也用于摘要）
- **Vydra**（主要或回退提供商；共享图像、视频和语音提供商）
- **xAI**（主要或回退提供商；使用 xAI TTS API）
- **Xiaomi MiMo**（主要或回退提供商；通过 Xiaomi chat completions 使用 MiMo TTS）

### Microsoft 语音说明

当前内置的 Microsoft 语音提供商通过 `node-edge-tts` 库，使用 Microsoft Edge 的在线神经网络 TTS 服务。它是托管服务（不是
本地服务），使用 Microsoft 端点，并且不需要 API 密钥。
`node-edge-tts` 提供了语音配置选项和输出格式，但
并非所有选项都受该服务支持。使用 `edge` 的旧版配置和指令输入
仍然有效，并会标准化为 `microsoft`。

由于这一路径是公共 Web 服务，没有公开的 SLA 或配额，
请将其视为尽力而为。如果你需要有保证的限制和支持，请使用 OpenAI
或 ElevenLabs。

## 可选密钥

如果你想使用 OpenAI、ElevenLabs、Google Gemini、Gradium、MiniMax、Vydra、xAI 或 Xiaomi MiMo：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `GEMINI_API_KEY`（或 `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`；MiniMax TTS 也接受 Token Plan 身份验证，可通过
  `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI 和 Microsoft 语音 **不** 需要 API 密钥。

如果配置了多个提供商，将优先使用所选提供商，其他提供商作为回退选项。
自动摘要使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），
因此如果你启用摘要，该提供商也必须完成身份验证。

## 服务链接

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-CN/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/zh-CN/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 默认启用吗？

不是。自动 TTS 默认**关闭**。可在配置中使用
`messages.tts.auto` 启用，或在本地使用 `/tts on` 启用。

当未设置 `messages.tts.provider` 时，OpenClaw 会按注册表自动选择顺序，
选择第一个已配置的语音提供商。

## 配置

TTS 配置位于 `openclaw.json` 中的 `messages.tts` 下。
完整 schema 见 [Gateway 网关配置](/zh-CN/gateway/configuration)。

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

### OpenAI 主提供商，ElevenLabs 回退

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

MiniMax TTS 身份验证解析顺序为 `messages.tts.providers.minimax.apiKey`，然后是
已存储的 `minimax-portal` OAuth/token 配置文件，然后是 Token Plan 环境变量密钥
（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、
`MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`。当未显式设置 TTS
`baseUrl` 时，OpenClaw 可以复用已配置的 `minimax-portal` OAuth
主机用于 Token Plan 语音。

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

Google Gemini TTS 使用 Gemini API 密钥路径。一个限制为 Gemini API 的
Google Cloud Console API 密钥在这里也可用，并且它与内置 Google 图像生成提供商
使用的是同一种密钥形式。解析顺序为
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`。

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

xAI TTS 使用与内置 Grok 模型提供商相同的 `XAI_API_KEY` 路径。
解析顺序为 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`。
当前可用语音为 `ara`、`eve`、`leo`、`rex`、`sal` 和 `una`；默认值是 `eve`。
`language` 接受一个 BCP-47 标签或 `auto`。

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

Xiaomi MiMo TTS 使用与内置 Xiaomi 模型
提供商相同的 `XIAOMI_API_KEY` 路径。语音提供商 id 是 `xiaomi`；`mimo`
也可作为别名使用。目标文本会作为 assistant 消息发送，这与 Xiaomi 的 TTS
契约一致。可选的 `style` 会作为用户指令发送，而不会被读出。

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

OpenRouter TTS 使用与内置
OpenRouter 模型提供商相同的 `OPENROUTER_API_KEY` 路径。解析顺序为
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`。

### Local CLI 主提供商

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

Local CLI TTS 会在 Gateway 网关主机上运行已配置的命令。`{{Text}}`、
`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符会在 `args` 中展开；如果不存在
`{{Text}}` 占位符，OpenClaw 会将要朗读的文本写入 stdin。
`outputFormat` 接受 `mp3`、`opus` 或 `wav`。
语音便笺目标会被转码为 Ogg/Opus，电话输出会被转码为原始 16 kHz 单声道 PCM，使用 `ffmpeg`。
旧版提供商别名 `cli` 仍然可用，但新配置应使用 `tts-local-cli`。

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

### 仅在收到语音消息后用音频回复

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
  - `inbound` 仅在收到语音消息后发送音频。
  - `tagged` 仅在回复包含 `[[tts:key=value]]` 指令或 `[[tts:text]]...[[/tts:text]]` 块时发送音频。
- `enabled`：旧版开关（`doctor` 会将其迁移为 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包含工具/分块回复）。
- `provider`：语音提供商 id，例如 `"elevenlabs"`、`"google"`、`"gradium"`、`"microsoft"`、`"minimax"`、`"openai"`、`"vydra"`、`"xai"` 或 `"xiaomi"`（回退会自动处理）。
- 如果 `provider` **未设置**，OpenClaw 会按注册表自动选择顺序使用第一个已配置的语音提供商。
- 旧版 `provider: "edge"` 配置可通过 `openclaw doctor --fix` 修复，并
  重写为 `provider: "microsoft"`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认值为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型发出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（切换提供商需要显式启用）。
- `providers.<id>`：由提供商拥有的设置，以语音提供商 id 为键。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）可通过 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.<id>`。
- 旧版 `messages.tts.providers.edge` 也会由 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.microsoft`。
- `maxTextLength`：TTS 输入的硬性上限（字符数）。超过时，`/tts audio` 会失败。
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
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力提供确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API 基础 URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：语音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：整数音高偏移 `-12..12`（默认 0）。在调用 MiniMax T2A 前，小数值会被截断，因为 API 不接受非整数音高值。
- `providers.tts-local-cli.command`：用于 CLI TTS 的本地可执行文件或命令字符串。
- `providers.tts-local-cli.args`：命令参数；支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符。
- `providers.tts-local-cli.outputFormat`：预期的 CLI 输出格式（`mp3`、`opus` 或 `wav`；音频附件默认值为 `mp3`）。
- `providers.tts-local-cli.timeoutMs`：命令超时时间（毫秒，默认 `120000`）。
- `providers.tts-local-cli.cwd`：可选的命令工作目录。
- `providers.tts-local-cli.env`：命令的可选字符串环境变量覆盖项。
- `providers.google.model`：Gemini TTS 模型（默认 `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`：Gemini 预置语音名称（默认 `Kore`；也接受 `voice`）。
- `providers.google.audioProfile`：在朗读文本前附加的自然语言风格提示。
- `providers.google.speakerName`：当你的 TTS 提示使用具名说话者时，在朗读文本前附加的可选说话者标签。
- `providers.google.baseUrl`：覆盖 Gemini API 基础 URL。仅接受 `https://generativelanguage.googleapis.com`。
  - 如果省略 `messages.tts.providers.google.apiKey`，TTS 可以先复用 `models.providers.google.apiKey`，再回退到环境变量。
- `providers.gradium.baseUrl`：覆盖 Gradium API 基础 URL（默认 `https://api.gradium.ai`）。
- `providers.gradium.voiceId`：Gradium 语音标识符（默认 Emma，`YTpq7expH9539ERJ`）。
- `providers.xai.apiKey`：xAI TTS API 密钥（环境变量：`XAI_API_KEY`）。
- `providers.xai.baseUrl`：覆盖 xAI TTS 基础 URL（默认 `https://api.x.ai/v1`，环境变量：`XAI_BASE_URL`）。
- `providers.xai.voiceId`：xAI 语音 id（默认 `eve`；当前在线语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`：BCP-47 语言代码或 `auto`（默认 `en`）。
- `providers.xai.responseFormat`：`mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`（默认 `mp3`）。
- `providers.xai.speed`：提供商原生速度覆盖值。
- `providers.xiaomi.apiKey`：Xiaomi MiMo API 密钥（环境变量：`XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`：覆盖 Xiaomi MiMo API 基础 URL（默认 `https://api.xiaomimimo.com/v1`，环境变量：`XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`：TTS 模型（默认 `mimo-v2.5-tts`，环境变量：`XIAOMI_TTS_MODEL`；也支持 `mimo-v2-tts`）。
- `providers.xiaomi.voice`：MiMo 语音 id（默认 `mimo_default`，环境变量：`XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`：`mp3` 或 `wav`（默认 `mp3`，环境变量：`XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`：可选的自然语言风格指令，作为用户消息发送；不会被读出。
- `providers.openrouter.apiKey`：OpenRouter API 密钥（环境变量：`OPENROUTER_API_KEY`；也可复用 `models.providers.openrouter.apiKey`）。
- `providers.openrouter.baseUrl`：覆盖 OpenRouter TTS 基础 URL（默认 `https://openrouter.ai/api/v1`；旧版 `https://openrouter.ai/v1` 会被标准化）。
- `providers.openrouter.model`：OpenRouter TTS 模型 id（默认 `hexgrad/kokoro-82m`；也接受 `modelId`）。
- `providers.openrouter.voice`：提供商特定语音 id（默认 `af_alloy`；也接受 `voiceId`）。
- `providers.openrouter.responseFormat`：`mp3` 或 `pcm`（默认 `mp3`）。
- `providers.openrouter.speed`：提供商原生速度覆盖值。
- `providers.microsoft.enabled`：允许使用 Microsoft 语音（默认 `true`；无需 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经网络语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参见 Microsoft Speech output formats；并非所有格式都受内置的 Edge 后端传输支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁边写入 JSON 字幕。
- `providers.microsoft.proxy`：用于 Microsoft 语音请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖值（毫秒）。
- `edge.*`：同一组 Microsoft 设置的旧版别名。运行
  `openclaw doctor --fix` 可将持久化配置重写为 `providers.microsoft`。

## 模型驱动的覆盖项（默认开启）

默认情况下，模型**可以**为单条回复发出 TTS 指令。
当 `messages.tts.auto` 为 `tagged` 时，这些指令是触发音频所必需的。

启用后，模型可以发出 `[[tts:...]]` 指令，为单条回复覆盖语音
设置，并可选附带一个 `[[tts:text]]...[[/tts:text]]` 块，用于提供仅应出现在
音频中的表现性标签（笑声、歌唱提示等）。

除非设置 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

示例回复负载：

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

可用指令键（启用时）：

- `provider`（已注册的语音提供商 id，例如 `openai`、`elevenlabs`、`google`、`gradium`、`minimax`、`microsoft`、`vydra`、`xai` 或 `xiaomi`；需要 `allowProvider: true`）
- `voice`（OpenAI、Gradium 或 Xiaomi 语音）、`voiceName` / `voice_name` / `google_voice`（Google 语音），或 `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS 模型、ElevenLabs model id、MiniMax 模型或 Xiaomi MiMo TTS 模型）或 `google_model`（Google TTS 模型）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 整数音高，-12 到 12；在 MiniMax 请求前会截断小数值）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

禁用所有模型覆盖项：

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

可选允许列表（启用提供商切换，同时保持其他参数仍可配置）：

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

## 按用户偏好

斜杠命令会将本地覆盖项写入 `prefsPath`（默认：
`~/.openclaw/settings/tts.json`，也可用 `OPENCLAW_TTS_PREFS` 或
`messages.tts.prefsPath` 覆盖）。

存储字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 个字符）
- `summarize`（默认 `true`）

这些字段会在该主机上覆盖 `messages.tts.*`。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：语音便笺回复优先使用 Opus（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是语音消息的良好折中。
- **Feishu**：当语音便笺回复生成结果为 MP3/WAV/M4A 或其他
  很可能属于音频文件的格式时，Feishu 插件会在发送原生 `audio` 气泡前，使用
  `ffmpeg` 将其转码为 48 kHz Ogg/Opus。如果转换失败，Feishu
  会收到原始文件作为附件。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡值。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于 Feishu 和 Telegram 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 MiniMax MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，配置后也可使用 WAV。对于 Feishu 和 Telegram 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48 kHz Opus。
- **Local CLI**：使用已配置的 `outputFormat`。语音便笺目标会
  转换为 Ogg/Opus，电话输出会使用 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于音频附件，并为 Talk/电话直接返回 PCM。此路径不支持原生 Opus 语音便笺格式。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **xAI**：默认使用 MP3；`responseFormat` 可为 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS 端点，并返回完整音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输支持 `outputFormat`，但服务并不提供所有格式。
  - 输出格式值遵循 Microsoft Speech output formats（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要
    有保证的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会回退重试 MP3。

OpenAI/ElevenLabs 输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（少于 10 个字符）。
- 启用时，使用 `agents.defaults.model.primary`（或 `summaryModel`）为长回复生成摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength`，且摘要已关闭（或摘要模型没有 API 密钥），则会跳过音频，
并发送普通文本回复。

## 流程图

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## 斜杠命令用法

只有一个命令：`/tts`。
启用详情请参见 [斜杠命令](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 的内置命令，因此 OpenClaw 在该平台上注册
`/voice` 作为原生命令。文本形式的 `/tts ...` 仍然可用。

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

- 命令需要已授权的发送者（allowlist/owner 规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- 配置 `messages.tts.auto` 接受 `off|always|inbound|tagged`。
- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会将其写为 `off`。
- 如果你希望默认使用 `inbound` 或 `tagged`，请使用配置。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 会生成一次性的音频回复（不会开启 TTS）。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加 `Attempts: ...`
  - 失败：`Error: ...` 加 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 和 ElevenLabs API 失败现在会包含已解析的提供商错误详情和请求 id（如果提供商返回），这些信息会显示在 TTS 错误/日志中。

## 智能体工具

`tts` 工具可将文本转换为语音，并返回一个用于
回复投递的音频附件。当渠道为 Feishu、Matrix、Telegram 或 WhatsApp 时，
音频会作为语音消息而不是文件附件投递。
在此路径下，如果 `ffmpeg` 可用，Feishu 可以对非 Opus 的 TTS 输出进行转码。
它接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是
单次调用的提供商请求超时时间（毫秒）。

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
