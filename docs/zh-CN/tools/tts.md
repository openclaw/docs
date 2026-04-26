---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于出站回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
    generated_at: "2026-04-26T03:26:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56df1e6193e07224fca9252f5f21d6feaee016b26216be63c27b35defba84444
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw 可以使用 Azure Speech、ElevenLabs、Google Gemini、Gradium、Inworld、Local CLI、Microsoft、MiniMax、OpenAI、Volcengine、Vydra、xAI 或 Xiaomi MiMo 将出站回复转换为音频。  
它适用于 OpenClaw 可以发送音频的任何地方。

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

当前内置的 Microsoft 语音提供商通过 `node-edge-tts` 库使用 Microsoft Edge 的在线神经 TTS 服务。它是托管服务（不是本地服务），使用 Microsoft 端点，并且不需要 API key。  
`node-edge-tts` 提供语音配置选项和输出格式，但并非所有选项都受该服务支持。使用 `edge` 的旧版配置和指令输入仍然可用，并会被标准化为 `microsoft`。

由于这一路径是没有公开 SLA 或配额说明的公共网络服务，请将其视为尽力而为的服务。如果你需要有保障的限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选键

如果你想使用 Azure Speech、ElevenLabs、Google Gemini、Gradium、Inworld、MiniMax、OpenAI、Volcengine、Vydra、xAI 或 Xiaomi MiMo：

- `AZURE_SPEECH_KEY` 加上 `AZURE_SPEECH_REGION`（也接受 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY` 和 `SPEECH_REGION`）
- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `GEMINI_API_KEY`（或 `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `INWORLD_API_KEY`
- `MINIMAX_API_KEY`；MiniMax TTS 也接受通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY` 提供的 Token Plan 认证
- `OPENAI_API_KEY`
- `VOLCENGINE_TTS_API_KEY`（或 `BYTEPLUS_SEED_SPEECH_API_KEY`）；旧版 AppID/token 认证也接受 `VOLCENGINE_TTS_APPID` 和 `VOLCENGINE_TTS_TOKEN`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI 和 Microsoft 语音 **不** 需要 API key。

如果配置了多个提供商，会先使用所选提供商，其他提供商则作为回退选项。  
自动摘要使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你启用了摘要，对应提供商也必须完成认证。

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

## 默认启用吗？

不是。自动 TTS 默认 **关闭**。请在配置中使用 `messages.tts.auto` 启用，或在本地使用 `/tts on` 启用。

当未设置 `messages.tts.provider` 时，OpenClaw 会按注册表自动选择顺序挑选第一个已配置的语音提供商。

## 配置

TTS 配置位于 `openclaw.json` 的 `messages.tts` 下。  
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

### 按智能体覆盖语音设置

当某个智能体需要使用不同的提供商、语音、模型、风格或自动 TTS 模式时，请使用 `agents.list[].tts`。智能体配置块会在 `messages.tts` 之上执行深度合并，因此提供商凭证可以保留在全局提供商配置中。

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

自动回复、`/tts audio`、`/tts status` 以及 `tts` 智能体工具的优先级顺序为：

1. `messages.tts`
2. 当前激活的 `agents.list[].tts`
3. 当前主机的本地 `/tts` 偏好设置
4. 启用模型覆盖时的内联 `[[tts:...]]` 指令

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

### Azure Speech 主提供商

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          // apiKey falls back to AZURE_SPEECH_KEY.
          // region falls back to AZURE_SPEECH_REGION.
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

Azure Speech 使用的是 Speech 资源 key，而不是 Azure OpenAI key。解析顺序为 `messages.tts.providers.azure-speech.apiKey` -> `AZURE_SPEECH_KEY` -> `AZURE_SPEECH_API_KEY` -> `SPEECH_KEY`，区域则是 `messages.tts.providers.azure-speech.region` -> `AZURE_SPEECH_REGION` -> `SPEECH_REGION`。新配置应使用 `azure-speech`；`azure` 可作为提供商别名接受。

### Microsoft 主提供商（无需 API key）

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

MiniMax TTS 的认证解析顺序为 `messages.tts.providers.minimax.apiKey`，然后是已存储的 `minimax-portal` OAuth/token 配置文件，再然后是 Token Plan 环境变量键（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`。如果没有显式设置 TTS `baseUrl`，OpenClaw 可以复用已配置的 `minimax-portal` OAuth 主机用于 Token Plan 语音。

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

Google Gemini TTS 使用 Gemini API key 路径。限制为 Gemini API 的 Google Cloud Console API key 在这里可用，并且它与内置的 Google 图像生成提供商使用的是同一类 key。解析顺序为 `messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` -> `GEMINI_API_KEY` -> `GOOGLE_API_KEY`。

### Inworld 主提供商

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

`apiKey` 的值必须是从 Inworld 控制台原样复制的 Base64 编码凭证字符串（Workspace > API Keys）。提供商会将其作为 `Authorization: Basic <apiKey>` 发送，不会做任何额外编码，因此不要传入原始 bearer token，也不要自行再次进行 Base64 编码。该 key 会回退到 `INWORLD_API_KEY` 环境变量。完整设置请参见 [Inworld provider](/zh-CN/providers/inworld)。

### Volcengine 主提供商

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

Volcengine TTS 使用的是来自 Speech Console 的 BytePlus Seed Speech API key，而不是 Doubao 模型提供商所用的 OpenAI 兼容 `VOLCANO_ENGINE_API_KEY`。解析顺序为 `messages.tts.providers.volcengine.apiKey` -> `VOLCENGINE_TTS_API_KEY` -> `BYTEPLUS_SEED_SPEECH_API_KEY`。旧版 AppID/token 认证仍可通过 `messages.tts.providers.volcengine.appId` / `token` 或 `VOLCENGINE_TTS_APPID` / `VOLCENGINE_TTS_TOKEN` 使用。语音便笺目标会请求提供商原生的 `ogg_opus`；普通音频文件目标会请求 `mp3`。

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

xAI TTS 与内置的 Grok 模型提供商共用同一条 `XAI_API_KEY` 路径。解析顺序为 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`。当前可用的语音包括 `ara`、`eve`、`leo`、`rex`、`sal` 和 `una`；默认值为 `eve`。`language` 接受 BCP-47 标签或 `auto`。

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

Xiaomi MiMo TTS 与内置的 Xiaomi 模型提供商共用同一条 `XIAOMI_API_KEY` 路径。语音提供商 id 是 `xiaomi`；`mimo` 也可作为别名使用。目标文本会作为 assistant 消息发送，以匹配 Xiaomi 的 TTS 契约。可选的 `style` 会作为用户指令发送，不会被朗读出来。

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

OpenRouter TTS 与内置的 OpenRouter 模型提供商共用同一条 `OPENROUTER_API_KEY` 路径。解析顺序为 `messages.tts.providers.openrouter.apiKey` -> `models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`。

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

Local CLI TTS 会在 Gateway 网关主机上运行已配置的命令。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符会在 `args` 中展开；如果不存在 `{{Text}}` 占位符，OpenClaw 会将要朗读的文本写入 stdin。`outputFormat` 接受 `mp3`、`opus` 或 `wav`。语音便笺目标会被转码为 Ogg/Opus，电话输出会使用 `ffmpeg` 转码为原始的 16 kHz 单声道 PCM。旧版提供商别名 `cli` 仍然可用，但新配置应使用 `tts-local-cli`。

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

### 自定义限制 + 偏好路径

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
- `enabled`：旧版开关（`doctor` 会将其迁移到 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包含工具/分块回复）。
- `provider`：语音提供商 id，例如 `"elevenlabs"`、`"google"`、`"gradium"`、`"inworld"`、`"microsoft"`、`"minimax"`、`"openai"`、`"volcengine"`、`"vydra"`、`"xai"` 或 `"xiaomi"`（回退会自动处理）。
- 如果 `provider` **未设置**，OpenClaw 会按注册表自动选择顺序使用第一个已配置的语音提供商。
- 旧版 `provider: "edge"` 配置可由 `openclaw doctor --fix` 修复，并重写为 `provider: "microsoft"`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认值为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型输出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（切换提供商需要显式启用）。
- `providers.<id>`：由提供商自行拥有的设置，以语音提供商 id 为键。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）可由 `openclaw doctor --fix` 修复；提交到仓库的配置应使用 `messages.tts.providers.<id>`。
- 旧版 `messages.tts.providers.edge` 也可由 `openclaw doctor --fix` 修复；提交到仓库的配置应使用 `messages.tts.providers.microsoft`。
- `maxTextLength`：TTS 输入的硬上限（字符数）。超过时，`/tts audio` 会失败。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地偏好 JSON 路径（提供商/限制/摘要）。
- `apiKey` 值会回退到环境变量（`AZURE_SPEECH_KEY` / `AZURE_SPEECH_API_KEY` / `SPEECH_KEY`、`ELEVENLABS_API_KEY` / `XI_API_KEY`、`GEMINI_API_KEY` / `GOOGLE_API_KEY`、`GRADIUM_API_KEY`、`INWORLD_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`、`VYDRA_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`）。Volcengine 改用 `appId` / `token`。
- `providers.azure-speech.apiKey`：Azure Speech 资源 key（环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`）。
- `providers.azure-speech.region`：Azure Speech 区域，例如 `eastus`（环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`）。
- `providers.azure-speech.endpoint` / `providers.azure-speech.baseUrl`：可选的 Azure Speech endpoint/base URL 覆盖。
- `providers.azure-speech.voice`：Azure 语音 ShortName（默认 `en-US-JennyNeural`）。
- `providers.azure-speech.lang`：SSML 语言代码（默认 `en-US`）。
- `providers.azure-speech.outputFormat`：标准音频输出的 Azure `X-Microsoft-OutputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
- `providers.azure-speech.voiceNoteOutputFormat`：语音便笺输出的 Azure `X-Microsoft-OutputFormat`（默认 `ogg-24khz-16bit-mono-opus`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API base URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS endpoint。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值会被视为 OpenAI 兼容的 TTS endpoint，因此接受自定义模型名和语音名。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：2 字母 ISO 639-1 代码（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力保证确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API base URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：语音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：整数音高偏移 `-12..12`（默认 0）。在调用 MiniMax T2A 之前，小数值会被截断，因为 API 拒绝非整数的音高值。
- `providers.tts-local-cli.command`：用于 CLI TTS 的本地可执行文件或命令字符串。
- `providers.tts-local-cli.args`：命令参数；支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}` 和 `{{OutputBase}}` 占位符。
- `providers.tts-local-cli.outputFormat`：预期的 CLI 输出格式（`mp3`、`opus` 或 `wav`；音频附件默认值为 `mp3`）。
- `providers.tts-local-cli.timeoutMs`：命令超时时间（毫秒，默认 `120000`）。
- `providers.tts-local-cli.cwd`：可选的命令工作目录。
- `providers.tts-local-cli.env`：命令的可选字符串环境变量覆盖。
- `providers.inworld.baseUrl`：覆盖 Inworld API base URL（默认 `https://api.inworld.ai`）。
- `providers.inworld.voiceId`：Inworld 语音标识符（默认 `Sarah`）。
- `providers.inworld.modelId`：Inworld TTS 模型（默认 `inworld-tts-1.5-max`；也支持 `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`）。
- `providers.inworld.temperature`：采样温度 `0..2`（可选）。
- `providers.google.model`：Gemini TTS 模型（默认 `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`：Gemini 预置语音名称（默认 `Kore`；也接受 `voice`）。
- `providers.google.audioProfile`：在朗读文本前添加的自然语言风格提示。
- `providers.google.speakerName`：当你的 TTS 提示使用命名说话人时，在朗读文本前添加的可选说话人标签。
- `providers.google.baseUrl`：覆盖 Gemini API base URL。仅接受 `https://generativelanguage.googleapis.com`。
  - 如果省略 `messages.tts.providers.google.apiKey`，TTS 可以先复用 `models.providers.google.apiKey`，再回退到环境变量。
- `providers.gradium.baseUrl`：覆盖 Gradium API base URL（默认 `https://api.gradium.ai`）。
- `providers.gradium.voiceId`：Gradium 语音标识符（默认 Emma，`YTpq7expH9539ERJ`）。
- `providers.volcengine.apiKey`：BytePlus Seed Speech API key（环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`）。
- `providers.volcengine.resourceId`：BytePlus Seed Speech 资源 id（默认 `seed-tts-1.0`，环境变量：`VOLCENGINE_TTS_RESOURCE_ID`；如果你的 BytePlus 项目具备 TTS 2.0 权限，请使用 `seed-tts-2.0`）。
- `providers.volcengine.appKey`：BytePlus Seed Speech app key 请求头（默认 `aGjiRDfUWi`，环境变量：`VOLCENGINE_TTS_APP_KEY`）。
- `providers.volcengine.baseUrl`：覆盖 Seed Speech TTS HTTP endpoint（环境变量：`VOLCENGINE_TTS_BASE_URL`）。
- `providers.volcengine.appId`：旧版 Volcengine Speech Console 应用 id（环境变量：`VOLCENGINE_TTS_APPID`）。
- `providers.volcengine.token`：旧版 Volcengine Speech Console 访问令牌（环境变量：`VOLCENGINE_TTS_TOKEN`）。
- `providers.volcengine.cluster`：旧版 Volcengine TTS 集群（默认 `volcano_tts`，环境变量：`VOLCENGINE_TTS_CLUSTER`）。
- `providers.volcengine.voice`：语音类型（默认 `en_female_anna_mars_bigtts`，环境变量：`VOLCENGINE_TTS_VOICE`）。
- `providers.volcengine.speedRatio`：提供商原生速度比例。
- `providers.volcengine.emotion`：提供商原生情感标签。
- `providers.xai.apiKey`：xAI TTS API key（环境变量：`XAI_API_KEY`）。
- `providers.xai.baseUrl`：覆盖 xAI TTS base URL（默认 `https://api.x.ai/v1`，环境变量：`XAI_BASE_URL`）。
- `providers.xai.voiceId`：xAI 语音 id（默认 `eve`；当前在线语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`：BCP-47 语言代码或 `auto`（默认 `en`）。
- `providers.xai.responseFormat`：`mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`（默认 `mp3`）。
- `providers.xai.speed`：提供商原生速度覆盖值。
- `providers.xiaomi.apiKey`：Xiaomi MiMo API key（环境变量：`XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`：覆盖 Xiaomi MiMo API base URL（默认 `https://api.xiaomimimo.com/v1`，环境变量：`XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`：TTS 模型（默认 `mimo-v2.5-tts`，环境变量：`XIAOMI_TTS_MODEL`；也支持 `mimo-v2-tts`）。
- `providers.xiaomi.voice`：MiMo 语音 id（默认 `mimo_default`，环境变量：`XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`：`mp3` 或 `wav`（默认 `mp3`，环境变量：`XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`：可选的自然语言风格指令，会作为 user 消息发送；不会被朗读。
- `providers.openrouter.apiKey`：OpenRouter API key（环境变量：`OPENROUTER_API_KEY`；也可复用 `models.providers.openrouter.apiKey`）。
- `providers.openrouter.baseUrl`：覆盖 OpenRouter TTS base URL（默认 `https://openrouter.ai/api/v1`；旧版 `https://openrouter.ai/v1` 会被标准化）。
- `providers.openrouter.model`：OpenRouter TTS 模型 id（默认 `hexgrad/kokoro-82m`；也接受 `modelId`）。
- `providers.openrouter.voice`：提供商专用语音 id（默认 `af_alloy`；也接受 `voiceId`）。
- `providers.openrouter.responseFormat`：`mp3` 或 `pcm`（默认 `mp3`）。
- `providers.openrouter.speed`：提供商原生速度覆盖值。
- `providers.microsoft.enabled`：允许使用 Microsoft 语音（默认 `true`；无需 API key）。
- `providers.microsoft.voice`：Microsoft 神经语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参见 Microsoft Speech 输出格式；并非所有格式都受内置的 Edge 后端传输支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁边写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft 语音请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖值（毫秒）。
- `edge.*`：同一组 Microsoft 设置的旧版别名。运行 `openclaw doctor --fix` 可将持久化配置重写为 `providers.microsoft`。

## 模型驱动的覆盖（默认开启）

默认情况下，模型**可以**为单条回复输出 TTS 指令。  
当 `messages.tts.auto` 为 `tagged` 时，这些指令是触发音频所必需的。

启用后，模型可以输出 `[[tts:...]]` 指令来为单条回复覆盖语音设置，还可以选择使用 `[[tts:text]]...[[/tts:text]]` 块提供仅应出现在音频中的表现性标签（笑声、歌唱提示等）。

分块流式传输会在渠道看到文本之前，从可见文本中移除这些指令，即使某条指令被拆分到相邻的多个块中也是如此。最终模式仍会解析累积后的原始回复，以进行 TTS 合成。

除非设置 `modelOverrides.allowProvider: true`，否则会忽略 `provider=...` 指令。  
当回复声明 `provider=...` 时，该指令中的其他键只会由该提供商解析。不受支持的键会从可见文本中移除，并作为 TTS 指令警告报告，而不会被路由到其他提供商。

回复负载示例：

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

可用的指令键（启用时）：

- `provider`（已注册的语音提供商 id，例如 `openai`、`elevenlabs`、`google`、`gradium`、`minimax`、`microsoft`、`volcengine`、`vydra`、`xai` 或 `xiaomi`；需要 `allowProvider: true`）
- `voice`（OpenAI、Gradium、Volcengine 或 Xiaomi 语音）、`voiceName` / `voice_name` / `google_voice`（Google 语音），或 `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS 模型、ElevenLabs 模型 id、MiniMax 模型或 Xiaomi MiMo TTS 模型）或 `google_model`（Google TTS 模型）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 整数音高，-12 到 12；在发起 MiniMax 请求前，小数值会被截断）
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

## 按用户的偏好设置

斜杠命令会将本地覆盖写入 `prefsPath`（默认：`~/.openclaw/settings/tts.json`，可用 `OPENCLAW_TTS_PREFS` 或 `messages.tts.prefsPath` 覆盖）。

存储字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 个字符）
- `summarize`（默认 `true`）

这些字段会覆盖该主机上 `messages.tts` 加上当前激活的 `agents.list[].tts` 配置块形成的最终配置。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：语音便笺回复优先使用 Opus（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是语音消息中较好的折中方案。
- **Feishu / WhatsApp**：当语音便笺回复被生成为 MP3/WebM/WAV/M4A 或其他可能的音频文件时，渠道插件会在发送原生语音消息前，使用 `ffmpeg` 将其转码为 48 kHz 的 Ogg/Opus。WhatsApp 通过 Baileys 的 `audio` 负载，配合 `ptt: true` 和 `audio/ogg; codecs=opus` 发送结果。如果转换失败，Feishu 会收到原始文件作为附件；WhatsApp 发送会失败，而不是发布不兼容的 PTT 负载。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：普通音频附件使用 MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。对于 Feishu、Telegram 和 WhatsApp 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 MiniMax MP3 转码为 48 kHz Opus。
- **Xiaomi MiMo**：默认使用 MP3，配置时也可使用 WAV。对于 Feishu、Telegram 和 WhatsApp 等语音便笺目标，OpenClaw 会在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48 kHz Opus。
- **Local CLI**：使用配置的 `outputFormat`。语音便笺目标会被转换为 Ogg/Opus，电话输出会使用 `ffmpeg` 转换为原始 16 kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24 kHz PCM。OpenClaw 会将其封装为 WAV 用于音频附件，为语音便笺目标转码为 48 kHz Opus，并直接为 Talk/电话返回 PCM。
- **Gradium**：音频附件使用 WAV，语音便笺目标使用 Opus，电话使用 8 kHz 的 `ulaw_8000`。
- **Inworld**：普通音频附件使用 MP3，语音便笺目标使用原生 `OGG_OPUS`，Talk/电话使用 22050 Hz 的原始 `PCM`。
- **xAI**：默认使用 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS endpoint，并返回完整音频附件；该提供商路径不使用 xAI 的流式 TTS WebSocket。此路径不支持原生 Opus 语音便笺格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但并非所有格式都能从该服务获得。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会回退并重试为 MP3。

OpenAI/ElevenLabs 的输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过过短的回复（少于 10 个字符）。
- 当启用时，使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复生成摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength` 且摘要功能关闭（或摘要模型没有 API key），则会跳过音频，仅发送普通文本回复。

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
启用细节请参见 [斜杠命令](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 的内置命令，因此 OpenClaw 会在那里注册 `/voice` 作为原生命令。文本形式的 `/tts ...` 仍然可用。

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

- 命令需要已授权的发送者（仍然适用 allowlist/owner 规则）。
- 必须启用 `commands.text` 或原生命令注册。
- 配置 `messages.tts.auto` 接受 `off|always|inbound|tagged`。
- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会写为 `off`。
- `/tts chat on|off|default` 会为当前聊天写入会话范围的自动 TTS 覆盖。
- 如果你想使用 `inbound` 或 `tagged` 作为默认值，请使用配置。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 会生成一次性音频回复（不会切换 TTS 开关为开启）。
- `/tts latest` 会从当前会话记录中读取最新的 assistant 回复，并将其作为音频发送一次。它只会在会话条目上存储该回复的哈希值，以抑制重复发送语音。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加上 `Attempts: ...`
  - 失败：`Error: ...` 加上 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- 当启用 TTS 时，`/status` 会显示当前激活的 TTS 模式，以及已配置的提供商、模型、语音和已脱敏的自定义 endpoint 元数据。
- OpenAI 和 ElevenLabs API 失败现在会包含已解析的提供商错误细节和请求 id（当提供商返回时），并会在 TTS 错误/日志中显示。

## 智能体工具

`tts` 工具会将文本转换为语音，并返回用于回复投递的音频附件。当渠道是 Feishu、Matrix、Telegram 或 WhatsApp 时，音频会作为语音消息而不是文件附件投递。  
在这一路径中，如果可用 `ffmpeg`，Feishu 和 WhatsApp 可以对非 Opus 的 TTS 输出进行转码。  
WhatsApp 通过 Baileys 以 PTT 语音便笺形式发送音频（带有 `ptt: true` 的 `audio`），并将可见文本与 PTT 音频分开发送，因为客户端对语音便笺标题的显示并不总是一致。  
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
