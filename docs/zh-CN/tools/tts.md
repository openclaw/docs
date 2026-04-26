---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于对外回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
    generated_at: "2026-04-26T03:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18c3792576941f0dab8fede280f837302510ff91df7772809b544d8f00baddbb
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以使用 Azure Speech、ElevenLabs、Google Gemini、Gradium、Inworld、Local CLI、Microsoft、MiniMax、OpenAI、Volcengine、Vydra、xAI 或 Xiaomi MiMo 将对外回复转换为音频。
只要 OpenClaw 能发送音频的地方，它都可以工作。

## 支持的服务

- **Azure Speech**（主提供商或回退提供商；使用 Azure AI Speech REST API）
- **ElevenLabs**（主提供商或回退提供商）
- **Google Gemini**（主提供商或回退提供商；使用 Gemini API TTS）
- **Gradium**（主提供商或回退提供商；支持语音便笺和电话输出）
- **Inworld**（主提供商或回退提供商；使用 Inworld 流式 TTS API）
- **Local CLI**（主提供商或回退提供商；运行已配置的本地 TTS 命令）
- **Microsoft**（主提供商或回退提供商；当前内置实现使用 `node-edge-tts`）
- **MiniMax**（主提供商或回退提供商；使用 T2A v2 API）
- **OpenAI**（主提供商或回退提供商；也用于摘要）
- **Volcengine**（主提供商或回退提供商；使用 BytePlus Seed Speech HTTP API）
- **Vydra**（主提供商或回退提供商；共享图像、视频和语音提供商）
- **xAI**（主提供商或回退提供商；使用 xAI TTS API）
- **Xiaomi MiMo**（主提供商或回退提供商；通过 Xiaomi chat completions 使用 MiMo TTS）

### Microsoft 语音说明

当前内置的 Microsoft 语音提供商通过 `node-edge-tts` 库使用 Microsoft Edge 的在线神经 TTS 服务。它是托管服务（不是本地服务），使用 Microsoft 端点，并且不需要 API 密钥。
`node-edge-tts` 提供语音配置选项和输出格式，但并非所有选项都受到该服务支持。使用 `edge` 的旧版配置和指令输入仍然可用，并会标准化为 `microsoft`。

由于这一路径是公共 Web 服务，且没有公开的 SLA 或配额，请将其视为尽力而为的服务。如果你需要有保障的限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选密钥

如果你要使用 Azure Speech、ElevenLabs、Google Gemini、Gradium、Inworld、MiniMax、OpenAI、Volcengine、Vydra、xAI 或 Xiaomi MiMo：

- `AZURE_SPEECH_KEY` 加上 `AZURE_SPEECH_REGION`（也接受
  `AZURE_SPEECH_API_KEY`、`SPEECH_KEY` 和 `SPEECH_REGION`）
- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `GEMINI_API_KEY`（或 `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `INWORLD_API_KEY`
- `MINIMAX_API_KEY`；MiniMax TTS 也接受 Token Plan 认证，通过
  `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VOLCENGINE_TTS_API_KEY`（或 `BYTEPLUS_SEED_SPEECH_API_KEY`）；
  旧版 AppID/token 认证也接受 `VOLCENGINE_TTS_APPID` 和
  `VOLCENGINE_TTS_TOKEN`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI 和 Microsoft 语音**不**需要 API 密钥。

如果配置了多个提供商，将优先使用所选提供商，其他提供商作为回退选项。
自动摘要使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你启用了摘要，也必须为该提供商完成认证。

## 服务链接

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/zh-CN/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/zh-CN/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/zh-CN/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/zh-CN/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 默认启用吗？

不是。自动 TTS 默认**关闭**。可在配置中通过
`messages.tts.auto` 启用，或在本地通过 `/tts on` 启用。

当未设置 `messages.tts.provider` 时，OpenClaw 会按注册表自动选择顺序选取第一个已配置的语音提供商。

## 配置

TTS 配置位于 `openclaw.json` 的 `messages.tts` 下。
完整 schema 请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration)。

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

### 每个智能体的语音覆盖

当某个智能体需要使用不同的提供商、voice、model、style 或自动 TTS 模式时，请使用 `agents.list[].tts`。该智能体块会在 `messages.tts` 之上执行深度合并，因此提供商凭证可以保留在全局提供商配置中。

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
        },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: {
              voiceId: "EXAVITQu4vr4xnSDxMaL",
            },
          },
        },
      },
    ],
  },
}
```

自动回复、`/tts audio`、`/tts status` 和 `tts`
智能体工具的优先级为：

1. `messages.tts`
2. 当前活动的 `agents.list[].tts`
3. 此主机的本地 `/tts` 偏好设置
4. 启用模型覆盖时的内联 `[[tts:...]]` 指令

### OpenAI 作为主提供商，ElevenLabs 作为回退

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

### Azure Speech 作为主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          // apiKey 默认回退到 AZURE_SPEECH_KEY。
          // region 默认回退到 AZURE_SPEECH_REGION。
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

Azure Speech 使用 Speech 资源密钥，而不是 Azure OpenAI 密钥。解析顺序为 `messages.tts.providers.azure-speech.apiKey` ->
`AZURE_SPEECH_KEY` -> `AZURE_SPEECH_API_KEY` -> `SPEECH_KEY`，区域则为
`messages.tts.providers.azure-speech.region` -> `AZURE_SPEECH_REGION` ->
`SPEECH_REGION`。新配置应使用 `azure-speech`；`azure`
可作为提供商别名使用。

### Microsoft 作为主提供商（无 API 密钥）

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

### MiniMax 作为主提供商

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

MiniMax TTS 的认证解析顺序是 `messages.tts.providers.minimax.apiKey`，然后是已存储的 `minimax-portal` OAuth/token 配置文件，再然后是 Token Plan 环境变量密钥
（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、
`MINIMAX_CODING_API_KEY`），最后才是 `MINIMAX_API_KEY`。当未显式设置 TTS
`baseUrl` 时，OpenClaw 可以复用已配置的 `minimax-portal` OAuth
主机用于 Token Plan 语音。

### Google Gemini 作为主提供商

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

Google Gemini TTS 使用 Gemini API 密钥路径。这里可以使用限制为 Gemini API 的 Google Cloud Console API 密钥，这也是内置 Google 图像生成提供商所使用的同类密钥。解析顺序为
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`。

### Inworld 作为主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "inworld_api_key",
          baseUrl: "https://api.inworld.ai",
          voiceId: "Sarah",
          modelId: "inworld-tts-1.5-max",
          temperature: 0.8,
        },
      },
    },
  },
}
```

`apiKey` 的值必须是从 Inworld 控制台原样复制的 Base64 编码凭证字符串（Workspace > API Keys）。该提供商会直接将其作为 `Authorization: Basic <apiKey>` 发送，不会再做任何额外编码，因此不要传入原始 bearer token，也不要自行再次进行 Base64 编码。该密钥默认回退到 `INWORLD_API_KEY` 环境变量。完整设置请参阅
[Inworld provider](/zh-CN/providers/inworld)。

### Volcengine 作为主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Volcengine TTS 使用来自 Speech Console 的 BytePlus Seed Speech API 密钥，而不是 Doubao 模型提供商使用的 OpenAI 兼容 `VOLCANO_ENGINE_API_KEY`。解析顺序为 `messages.tts.providers.volcengine.apiKey` ->
`VOLCENGINE_TTS_API_KEY` -> `BYTEPLUS_SEED_SPEECH_API_KEY`。旧版 AppID/token
认证仍然可通过 `messages.tts.providers.volcengine.appId` / `token` 或
`VOLCENGINE_TTS_APPID` / `VOLCENGINE_TTS_TOKEN` 使用。语音便笺目标会请求提供商原生的 `ogg_opus`；普通音频文件目标会请求 `mp3`。

### xAI 作为主提供商

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

xAI TTS 与内置的 Grok 模型提供商使用相同的 `XAI_API_KEY` 路径。解析顺序为 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`。当前可用的 live voices 为 `ara`、`eve`、`leo`、`rex`、`sal` 和 `una`；默认值为 `eve`。`language` 接受 BCP-47 标签或 `auto`。

### Xiaomi MiMo 作为主提供商

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
          style: "明亮、自然、对话式的语气。",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS 与内置 Xiaomi 模型提供商使用相同的 `XIAOMI_API_KEY` 路径。语音提供商 id 为 `xiaomi`；`mimo` 也可作为别名使用。目标文本会作为 assistant message 发送，这与 Xiaomi 的 TTS 协议保持一致。可选的 `style` 会作为 user instruction 发送，不会被朗读出来。

### OpenRouter 作为主提供商

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

### Local CLI 作为主提供商

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
`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符会在 `args` 中展开；如果不存在 `{{Text}}` 占位符，OpenClaw 会将要朗读的文本写入 stdin。`outputFormat` 接受 `mp3`、`opus` 或 `wav`。
语音便笺目标会转码为 Ogg/Opus，电话输出会通过 `ffmpeg` 转码为原始 16 kHz 单声道 PCM。旧版提供商别名 `cli` 仍然可用，但新配置应使用 `tts-local-cli`。

### Gradium 作为主提供商

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

### 仅在收到入站语音消息后用音频回复

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
  - `tagged` 仅在回复包含 `[[tts:key=value]]` 指令或 `[[tts:text]]...[[/tts:text]]` 块时发送音频。
- `enabled`：旧版开关（Doctor 会将其迁移到 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包含工具/分块回复）。
- `provider`：语音提供商 id，例如 `"elevenlabs"`、`"google"`、`"gradium"`、`"inworld"`、`"microsoft"`、`"minimax"`、`"openai"`、`"volcengine"`、`"vydra"`、`"xai"` 或 `"xiaomi"`（回退会自动处理）。
- 如果 `provider` **未设置**，OpenClaw 会按注册表自动选择顺序使用第一个已配置的语音提供商。
- 旧版 `provider: "edge"` 配置可通过 `openclaw doctor --fix` 修复，并重写为 `provider: "microsoft"`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型输出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（切换提供商需要显式启用）。
- `providers.<id>`：由提供商拥有的设置，按语音提供商 id 分组。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）可通过 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.<id>`。
- 旧版 `messages.tts.providers.edge` 也可通过 `openclaw doctor --fix` 修复；提交的配置应使用 `messages.tts.providers.microsoft`。
- `maxTextLength`：TTS 输入的硬限制（字符数）。如果超出，`/tts audio` 会失败。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地偏好设置 JSON 路径（提供商/限制/摘要）。
- `apiKey` 值会回退到环境变量（`AZURE_SPEECH_KEY`/`AZURE_SPEECH_API_KEY`/`SPEECH_KEY`、`ELEVENLABS_API_KEY`/`XI_API_KEY`、`GEMINI_API_KEY`/`GOOGLE_API_KEY`、`GRADIUM_API_KEY`、`INWORLD_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`、`VYDRA_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`）。Volcengine 则使用 `appId`/`token`。
- `providers.azure-speech.apiKey`：Azure Speech 资源密钥（环境变量：
  `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`）。
- `providers.azure-speech.region`：Azure Speech 区域，例如 `eastus`（环境变量：
  `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`）。
- `providers.azure-speech.endpoint` / `providers.azure-speech.baseUrl`：可选的 Azure Speech endpoint/base URL 覆盖。
- `providers.azure-speech.voice`：Azure voice ShortName（默认
  `en-US-JennyNeural`）。
- `providers.azure-speech.lang`：SSML 语言代码（默认 `en-US`）。
- `providers.azure-speech.outputFormat`：标准音频输出的 Azure `X-Microsoft-OutputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
- `providers.azure-speech.voiceNoteOutputFormat`：语音便笺输出的 Azure
  `X-Microsoft-OutputFormat`（默认
  `ogg-24khz-16bit-mono-opus`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API base URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS endpoint。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值会被视为 OpenAI 兼容 TTS endpoint，因此接受自定义 model 和 voice 名称。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：2 位 ISO 639-1 代码（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力提供确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API base URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：voice 标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：整数音高偏移 `-12..12`（默认 0）。小数值在调用 MiniMax T2A 前会被截断，因为该 API 拒绝非整数音高值。
- `providers.tts-local-cli.command`：用于 CLI TTS 的本地可执行文件或命令字符串。
- `providers.tts-local-cli.args`：命令参数；支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符。
- `providers.tts-local-cli.outputFormat`：预期的 CLI 输出格式（`mp3`、`opus` 或 `wav`；音频附件默认 `mp3`）。
- `providers.tts-local-cli.timeoutMs`：命令超时（毫秒，默认 `120000`）。
- `providers.tts-local-cli.cwd`：可选的命令工作目录。
- `providers.tts-local-cli.env`：可选的命令字符串环境变量覆盖。
- `providers.inworld.baseUrl`：覆盖 Inworld API base URL（默认 `https://api.inworld.ai`）。
- `providers.inworld.voiceId`：Inworld voice 标识符（默认 `Sarah`）。
- `providers.inworld.modelId`：Inworld TTS 模型（默认 `inworld-tts-1.5-max`；也支持 `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`）。
- `providers.inworld.temperature`：采样 temperature `0..2`（可选）。
- `providers.google.model`：Gemini TTS 模型（默认 `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`：Gemini 预置 voice 名称（默认 `Kore`；也接受 `voice`）。
- `providers.google.audioProfile`：会在朗读文本前附加的自然语言风格提示。
- `providers.google.speakerName`：当你的 TTS 提示使用命名说话人时，会在朗读文本前附加的可选说话人标签。
- `providers.google.baseUrl`：覆盖 Gemini API base URL。仅接受 `https://generativelanguage.googleapis.com`。
  - 如果省略 `messages.tts.providers.google.apiKey`，TTS 可以在环境变量回退前复用 `models.providers.google.apiKey`。
- `providers.gradium.baseUrl`：覆盖 Gradium API base URL（默认 `https://api.gradium.ai`）。
- `providers.gradium.voiceId`：Gradium voice 标识符（默认 Emma，`YTpq7expH9539ERJ`）。
- `providers.volcengine.apiKey`：BytePlus Seed Speech API 密钥（环境变量：
  `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`）。
- `providers.volcengine.resourceId`：BytePlus Seed Speech 资源 id（默认
  `seed-tts-1.0`，环境变量：`VOLCENGINE_TTS_RESOURCE_ID`；当你的 BytePlus 项目拥有 TTS 2.0 权限时，请使用 `seed-tts-2.0`）。
- `providers.volcengine.appKey`：BytePlus Seed Speech app key header（默认
  `aGjiRDfUWi`，环境变量：`VOLCENGINE_TTS_APP_KEY`）。
- `providers.volcengine.baseUrl`：覆盖 Seed Speech TTS HTTP endpoint
  （环境变量：`VOLCENGINE_TTS_BASE_URL`）。
- `providers.volcengine.appId`：旧版 Volcengine Speech Console application id（环境变量：`VOLCENGINE_TTS_APPID`）。
- `providers.volcengine.token`：旧版 Volcengine Speech Console access token（环境变量：`VOLCENGINE_TTS_TOKEN`）。
- `providers.volcengine.cluster`：旧版 Volcengine TTS cluster（默认 `volcano_tts`，环境变量：`VOLCENGINE_TTS_CLUSTER`）。
- `providers.volcengine.voice`：voice 类型（默认 `en_female_anna_mars_bigtts`，环境变量：`VOLCENGINE_TTS_VOICE`）。
- `providers.volcengine.speedRatio`：提供商原生速度比率。
- `providers.volcengine.emotion`：提供商原生情感标签。
- `providers.xai.apiKey`：xAI TTS API 密钥（环境变量：`XAI_API_KEY`）。
- `providers.xai.baseUrl`：覆盖 xAI TTS base URL（默认 `https://api.x.ai/v1`，环境变量：`XAI_BASE_URL`）。
- `providers.xai.voiceId`：xAI voice id（默认 `eve`；当前 live voices：`ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`：BCP-47 语言代码或 `auto`（默认 `en`）。
- `providers.xai.responseFormat`：`mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`（默认 `mp3`）。
- `providers.xai.speed`：提供商原生速度覆盖。
- `providers.xiaomi.apiKey`：Xiaomi MiMo API 密钥（环境变量：`XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`：覆盖 Xiaomi MiMo API base URL（默认 `https://api.xiaomimimo.com/v1`，环境变量：`XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`：TTS 模型（默认 `mimo-v2.5-tts`，环境变量：`XIAOMI_TTS_MODEL`；也支持 `mimo-v2-tts`）。
- `providers.xiaomi.voice`：MiMo voice id（默认 `mimo_default`，环境变量：`XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`：`mp3` 或 `wav`（默认 `mp3`，环境变量：`XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`：可选的自然语言风格指令，会作为 user message 发送；不会被朗读出来。
- `providers.openrouter.apiKey`：OpenRouter API 密钥（环境变量：`OPENROUTER_API_KEY`；可复用 `models.providers.openrouter.apiKey`）。
- `providers.openrouter.baseUrl`：覆盖 OpenRouter TTS base URL（默认 `https://openrouter.ai/api/v1`；旧版 `https://openrouter.ai/v1` 会被标准化）。
- `providers.openrouter.model`：OpenRouter TTS model id（默认 `hexgrad/kokoro-82m`；也接受 `modelId`）。
- `providers.openrouter.voice`：提供商特定的 voice id（默认 `af_alloy`；也接受 `voiceId`）。
- `providers.openrouter.responseFormat`：`mp3` 或 `pcm`（默认 `mp3`）。
- `providers.openrouter.speed`：提供商原生速度覆盖。
- `providers.microsoft.enabled`：允许使用 Microsoft 语音（默认 `true`；无需 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经 voice 名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参阅 Microsoft Speech 输出格式；并非所有格式都受内置的 Edge 支持传输方式支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft 语音请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖（毫秒）。
- `edge.*`：相同 Microsoft 设置的旧版别名。运行
  `openclaw doctor --fix` 将持久化配置重写为 `providers.microsoft`。

## 模型驱动的覆盖（默认开启）

默认情况下，模型**可以**为单条回复输出 TTS 指令。
当 `messages.tts.auto` 为 `tagged` 时，必须使用这些指令才能触发音频。

启用后，模型可以输出 `[[tts:...]]` 指令以覆盖单条回复的 voice，还可以附带可选的 `[[tts:text]]...[[/tts:text]]` 块，用于提供只应出现在音频中的表现性标签（笑声、歌唱提示等）。

除非设置 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

回复载荷示例：

```
给你。

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]]（笑）再把这首歌读一遍。[[/tts:text]]
```

可用的指令键（启用时）：

- `provider`（已注册的语音提供商 id，例如 `openai`、`elevenlabs`、`google`、`gradium`、`minimax`、`microsoft`、`volcengine`、`vydra`、`xai` 或 `xiaomi`；需要 `allowProvider: true`）
- `voice`（OpenAI、Gradium、Volcengine 或 Xiaomi 的 voice）、`voiceName` / `voice_name` / `google_voice`（Google voice）或 `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS model、ElevenLabs model id、MiniMax model 或 Xiaomi MiMo TTS model）或 `google_model`（Google TTS model）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 整数音高，-12 到 12；小数值在发送 MiniMax 请求前会被截断）
- `emotion`（Volcengine 情感标签）
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

可选的 allowlist（启用提供商切换，同时保留其他参数可配置）：

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

斜杠命令会将本地覆盖写入 `prefsPath`（默认：
`~/.openclaw/settings/tts.json`，可通过 `OPENCLAW_TTS_PREFS` 或
`messages.tts.prefsPath` 覆盖）。

存储字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 个字符）
- `summarize`（默认 `true`）

这些设置会覆盖该主机上来自 `messages.tts` 加上当前活动
`agents.list[].tts` 块的生效配置。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：语音便笺回复优先使用 Opus（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是适合语音消息的折中选择。
- **Feishu / WhatsApp**：当语音便笺回复生成为 MP3/WebM/WAV/M4A
  或其他常见音频文件格式时，渠道插件会在发送原生语音消息前使用 `ffmpeg` 将其转码为 48 kHz
  Ogg/Opus。WhatsApp 通过 Baileys 的 `audio` 载荷配合 `ptt: true` 和
  `audio/ogg; codecs=opus` 发送结果。如果转换失败，Feishu 会收到原始文件作为附件；WhatsApp 发送将失败，而不会发布不兼容的 PTT 载荷。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于 Feishu、Telegram 和 WhatsApp 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 MiniMax MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，或在配置时使用 WAV。对于 Feishu、Telegram 和 WhatsApp 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48 kHz Opus。
- **Local CLI**：使用已配置的 `outputFormat`。语音便笺目标会转换为 Ogg/Opus，电话输出会通过 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于音频附件，将其转码为 48 kHz Opus 用于语音便笺目标，并将 PCM 直接用于 Talk/电话。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：普通音频附件使用 MP3，语音便笺目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI**：默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS endpoint，并返回完整的音频附件；此提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输方式接受 `outputFormat`，但该服务并非所有格式都可用。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果已配置的 Microsoft 输出格式失败，OpenClaw 会回退重试 MP3。

OpenAI/ElevenLabs 的输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过过短回复（少于 10 个字符）。
- 启用时，使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复进行摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength` 且摘要关闭（或摘要模型没有 API 密钥），则会跳过音频，仅发送普通文本回复。

## 流程图

```
回复 -> 已启用 TTS？
  否  -> 发送文本
  是  -> 是否包含媒体 / MEDIA: / 过短？
          是 -> 发送文本
          否 -> 长度 > 限制？
                   否 -> TTS -> 附加音频
                   是 -> 已启用摘要？
                            否 -> 发送文本
                            是 -> 摘要（summaryModel 或 agents.defaults.model.primary）
                                      -> TTS -> 附加音频
```

## 斜杠命令用法

只有一个命令：`/tts`。
启用详情请参阅 [斜杠命令](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 内置命令，因此 OpenClaw 会在该平台注册
`/voice` 作为原生命令。但文本形式的 `/tts ...` 仍然可用。

```
/tts off
/tts on
/tts status
/tts chat on
/tts chat off
/tts chat default
/tts latest
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
- `/tts chat on|off|default` 会为当前聊天写入会话范围的自动 TTS 覆盖。
- 当你希望默认使用 `inbound` 或 `tagged` 时，请使用配置。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 会生成一次性音频回复（不会切换 TTS 为开启）。
- `/tts latest` 会读取当前会话转录中的最新 assistant 回复，并将其作为音频发送一次。它只会在会话条目中存储该回复的哈希值，以抑制重复的语音发送。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加上 `Attempts: ...`
  - 失败：`Error: ...` 加上 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- `/status` 会在启用 TTS 时显示当前活动的 TTS 模式，以及已配置的提供商、model、voice 和已净化的自定义 endpoint 元数据。
- OpenAI 和 ElevenLabs 的 API 故障现在会包含已解析的提供商错误详情和请求 id（如果提供商返回），这些信息会显示在 TTS 错误/日志中。

## 智能体工具

`tts` 工具会将文本转换为语音，并返回用于回复投递的音频附件。当渠道为 Feishu、Matrix、Telegram 或 WhatsApp 时，音频会作为语音消息而不是文件附件投递。
当 `ffmpeg` 可用时，Feishu 和 WhatsApp 可在此路径上转码非 Opus 的 TTS 输出。
WhatsApp 通过 Baileys 将音频作为 PTT 语音便笺发送（`audio` 搭配
`ptt: true`），并将可见文本与 PTT 音频分开发送，因为客户端对语音便笺字幕的渲染并不一致。
它接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是每次调用的提供商请求超时，单位为毫秒。

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
