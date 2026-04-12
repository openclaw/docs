---
read_when:
    - 为回复启用文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于出站回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
    generated_at: "2026-04-12T22:42:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad79a6be34879347dc73fdab1bd219823cd7c6aa8504e3e4c73e1a0554c837c5
    source_path: tools/tts.md
    workflow: 15
---

# 文本转语音（TTS）

OpenClaw 可以使用 ElevenLabs、Microsoft、MiniMax 或 OpenAI 将出站回复转换为音频。
它适用于 OpenClaw 能发送音频的任何地方。

## 支持的服务

- **ElevenLabs**（主要或回退提供商）
- **Microsoft**（主要或回退提供商；当前内置实现使用 `node-edge-tts`）
- **MiniMax**（主要或回退提供商；使用 T2A v2 API）
- **OpenAI**（主要或回退提供商；也用于摘要）

### Microsoft 语音说明

当前内置的 Microsoft 语音提供商通过 `node-edge-tts` 库使用 Microsoft Edge 的在线神经网络 TTS 服务。它是托管服务（不是本地服务），使用 Microsoft 的端点，并且不需要 API 密钥。
`node-edge-tts` 提供语音配置选项和输出格式，但并非所有选项都受该服务支持。使用 `edge` 的旧版配置和指令输入仍然有效，并会被规范化为 `microsoft`。

由于这一路径是一个未公布 SLA 或配额的公共 Web 服务，请将其视为尽力而为的服务。如果你需要有保障的限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选密钥

如果你想使用 OpenAI、ElevenLabs 或 MiniMax：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft 语音**不**需要 API 密钥。

如果配置了多个提供商，将优先使用所选提供商，其他提供商作为回退选项。
自动摘要使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果你启用摘要，该提供商也必须完成身份验证。

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 默认启用吗？

不是。自动 TTS 默认**关闭**。可通过配置中的 `messages.tts.auto` 启用，或使用 `/tts on` 在本地启用。

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

### OpenAI 作为主要提供商，ElevenLabs 作为回退提供商

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

### Microsoft 作为主要提供商（无需 API 密钥）

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

### MiniMax 作为主要提供商

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

### 自定义限制 + prefsPath 路径

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

### 仅在收到入站语音消息后才用音频回复

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
- `provider`：语音提供商 id，例如 `"elevenlabs"`、`"microsoft"`、`"minimax"` 或 `"openai"`（会自动回退）。
- 如果 `provider` **未设置**，OpenClaw 会按注册表自动选择顺序使用第一个已配置的语音提供商。
- 旧版 `provider: "edge"` 仍然可用，并会被规范化为 `microsoft`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型输出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（提供商切换需要主动启用）。
- `providers.<id>`：由提供商拥有的设置，按语音提供商 id 分组。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）会在加载时自动迁移到 `messages.tts.providers.<id>`。
- `maxTextLength`：TTS 输入的硬性上限（字符数）。如果超出，`/tts audio` 会失败。
- `timeoutMs`：请求超时时间（毫秒）。
- `prefsPath`：覆盖本地偏好设置 JSON 路径（提供商/限制/摘要）。
- `apiKey` 值会回退到环境变量（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API 基础 URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS 端点。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值会被视为与 OpenAI 兼容的 TTS 端点，因此接受自定义模型名和声音名。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：2 字母 ISO 639-1 代码（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力保证确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API 基础 URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：声音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：音高偏移 `-12..12`（默认 0）。
- `providers.microsoft.enabled`：允许使用 Microsoft 语音（默认 `true`；无需 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经网络语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参见 Microsoft Speech 输出格式；并非所有格式都受内置的 Edge 后端传输支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft 语音请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖值（毫秒）。
- `edge.*`：相同 Microsoft 设置的旧版别名。

## 模型驱动的覆盖（默认开启）

默认情况下，模型**可以**为单条回复输出 TTS 指令。
当 `messages.tts.auto` 为 `tagged` 时，必须有这些指令才会触发音频。

启用后，模型可以输出 `[[tts:...]]` 指令来覆盖单条回复的声音，
还可以选择附带一个 `[[tts:text]]...[[/tts:text]]` 块，用于提供仅应出现在
音频中的表现性标签（笑声、歌唱提示等）。

除非设置了 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

示例回复载荷：

```
给你。

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]]（笑）再把这首歌读一遍。[[/tts:text]]
```

可用的指令键（启用时）：

- `provider`（已注册的语音提供商 id，例如 `openai`、`elevenlabs`、`minimax` 或 `microsoft`；需要 `allowProvider: true`）
- `voice`（OpenAI 声音）或 `voiceId`（ElevenLabs / MiniMax）
- `model`（OpenAI TTS 模型、ElevenLabs model id 或 MiniMax 模型）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 音高，-12 到 12）
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

## 按用户偏好设置

Slash 命令会将本地覆盖写入 `prefsPath`（默认：
`~/.openclaw/settings/tts.json`，可通过 `OPENCLAW_TTS_PREFS` 或
`messages.tts.prefsPath` 覆盖）。

存储的字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 个字符）
- `summarize`（默认 `true`）

这些值会覆盖该主机上的 `messages.tts.*`。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：Opus 语音消息（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是语音消息的不错折中方案。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。原生不支持语音便签格式；如果你需要有保障的 Opus 语音消息，请使用 OpenAI 或 ElevenLabs。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但该服务并不提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 会使用 MP3 重试。

OpenAI/ElevenLabs 输出格式会按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过过短的回复（少于 10 个字符）。
- 在启用时，使用 `agents.defaults.model.primary`（或 `summaryModel`）为长回复生成摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength` 且摘要已关闭（或摘要模型没有 API 密钥），则会跳过音频，并发送普通文本回复。

## 流程图

```
回复 -> 是否启用 TTS？
  否  -> 发送文本
  是  -> 是否有媒体 / MEDIA: / 内容过短？
          是  -> 发送文本
          否  -> 长度 > 限制？
                   否  -> TTS -> 附加音频
                   是  -> 是否启用摘要？
                            否  -> 发送文本
                            是  -> 生成摘要（summaryModel 或 agents.defaults.model.primary）
                                      -> TTS -> 附加音频
```

## Slash 命令用法

只有一个命令：`/tts`。
启用详情请参见 [Slash 命令](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 的内置命令，因此 OpenClaw 会在那里注册 `/voice` 作为原生命令。文本形式的 `/tts ...` 仍然可用。

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

- 命令要求发送者已获授权（允许列表/owner 规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- 配置 `messages.tts.auto` 接受 `off|always|inbound|tagged`。
- `/tts on` 会将本地 TTS 偏好写为 `always`；`/tts off` 会将其写为 `off`。
- 如果你想使用 `inbound` 或 `tagged` 作为默认值，请使用配置。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 会生成一次性音频回复（不会将 TTS 切换为开启）。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加上 `Attempts: ...`
  - 失败：`Error: ...` 加上 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 和 ElevenLabs API 失败现在会包含已解析的提供商错误详情和请求 id（如果提供商返回），这些信息会显示在 TTS 错误/日志中。

## 智能体工具

`tts` 工具可将文本转换为语音，并返回一个用于回复投递的音频附件。当渠道是 Feishu、Matrix、Telegram 或 WhatsApp 时，音频会作为语音消息而不是文件附件发送。

## Gateway 网关 RPC

Gateway 网关方法：

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
