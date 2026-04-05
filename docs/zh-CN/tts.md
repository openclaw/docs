---
read_when:
    - 启用回复文本转语音
    - 配置 TTS 提供商或限制
    - 使用 `/tts` 命令
summary: 用于出站回复的文本转语音（TTS）
title: 文本转语音（TTS）（旧版路径）
x-i18n:
    generated_at: "2026-04-05T10:13:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# 文本转语音（TTS）

OpenClaw 可以使用 ElevenLabs、Microsoft、MiniMax 或 OpenAI 将出站回复转换为音频。
凡是 OpenClaw 能发送音频的地方，它都可以工作。

## 支持的服务

- **ElevenLabs**（主提供商或回退提供商）
- **Microsoft**（主提供商或回退提供商；当前内置实现使用 `node-edge-tts`）
- **MiniMax**（主提供商或回退提供商；使用 T2A v2 API）
- **OpenAI**（主提供商或回退提供商；也用于摘要）

### Microsoft speech 说明

当前内置的 Microsoft speech 提供商通过 `node-edge-tts` 库使用 Microsoft Edge 的在线
神经 TTS 服务。这是一项托管服务（不是本地服务），使用 Microsoft 端点，并且不需要 API 密钥。
`node-edge-tts` 暴露了语音配置选项和输出格式，但并非所有选项都受到该服务支持。使用 `edge` 的旧版配置和指令输入
仍然有效，并会被规范化为 `microsoft`。

由于这一路径是公开 Web 服务，没有已发布的 SLA 或配额，
请将其视为尽力而为。如果你需要有保障的限制和支持，请使用 OpenAI
或 ElevenLabs。

## 可选密钥

如果你想使用 OpenAI、ElevenLabs 或 MiniMax：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft speech **不**需要 API 密钥。

如果配置了多个提供商，则会先使用已选提供商，其他提供商会作为回退选项。
自动摘要会使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），
因此如果你启用了摘要，该提供商也必须已完成认证。

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 参考](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 认证](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 默认启用吗？

不是。自动 TTS 默认**关闭**。可在配置中通过
`messages.tts.auto` 启用，或按会话使用 `/tts always`（别名：`/tts on`）启用。

当未设置 `messages.tts.provider` 时，OpenClaw 会按照注册表自动选择顺序选取第一个已配置的
speech 提供商。

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

### 禁用 Microsoft speech

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

### 自定义限制 + prefs 路径

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
  - `tagged` 仅在回复包含 `[[tts]]` 标签时发送音频。
- `enabled`：旧版开关（Doctor 会将其迁移到 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包括工具/块回复）。
- `provider`：speech 提供商 id，例如 `"elevenlabs"`、`"microsoft"`、`"minimax"` 或 `"openai"`（回退自动处理）。
- 如果**未设置** `provider`，OpenClaw 会按注册表自动选择顺序使用第一个已配置的 speech 提供商。
- 旧版 `provider: "edge"` 仍然有效，并会被规范化为 `microsoft`。
- `summaryModel`：用于自动摘要的可选低成本模型；默认使用 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`：允许模型发出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（提供商切换需显式启用）。
- `providers.<id>`：由提供商拥有的设置，以 speech 提供商 id 作为键。
- 旧版直接提供商块（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）会在加载时自动迁移到 `messages.tts.providers.<id>`。
- `maxTextLength`：TTS 输入的硬上限（字符数）。超出时 `/tts audio` 会失败。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地 prefs JSON 路径（提供商/限制/摘要）。
- `apiKey` 值会回退到环境变量（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API base URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS 端点。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值会被视为 OpenAI-compatible TTS 端点，因此接受自定义模型名和语音名。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：双字母 ISO 639-1（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力保证确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API base URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：语音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：音高偏移 `-12..12`（默认 0）。
- `providers.microsoft.enabled`：允许使用 Microsoft speech（默认 `true`；无 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有效值请参见 Microsoft Speech 输出格式；并非所有格式都受内置的 Edge 支持传输支持。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁边写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft speech 请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖（毫秒）。
- `edge.*`：同一组 Microsoft 设置的旧版别名。

## 模型驱动覆盖（默认开启）

默认情况下，模型**可以**为单条回复发出 TTS 指令。
当 `messages.tts.auto` 为 `tagged` 时，这些指令是触发音频所必需的。

启用后，模型可以发出 `[[tts:...]]` 指令来覆盖单条回复的语音，
还可以附加一个可选的 `[[tts:text]]...[[/tts:text]]` 块，
用于提供表达性标签（笑声、歌唱提示等），这些内容应仅出现在
音频中。

除非设置 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

回复载荷示例：

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

可用指令键（启用时）：

- `provider`（已注册的 speech 提供商 id，例如 `openai`、`elevenlabs`、`minimax` 或 `microsoft`；需要 `allowProvider: true`）
- `voice`（OpenAI 语音）或 `voiceId`（ElevenLabs / MiniMax）
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

可选允许列表（启用提供商切换，同时保持其他参数可配置）：

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

Slash Commands 会将本地覆盖写入 `prefsPath`（默认：
`~/.openclaw/settings/tts.json`，可通过 `OPENCLAW_TTS_PREFS` 或
`messages.tts.prefsPath` 覆盖）。

存储字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 字符）
- `summarize`（默认 `true`）

这些值会覆盖该主机上的 `messages.tts.*`。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：Opus 语音消息（ElevenLabs 使用 `opus_48000_64`，OpenAI 使用 `opus`）。
  - 48 kHz / 64 kbps 是语音消息的良好折中。
- **其他渠道**：MP3（ElevenLabs 使用 `mp3_44100_128`，OpenAI 使用 `mp3`）。
  - 44.1 kHz / 128 kbps 是语音清晰度的默认平衡点。
- **MiniMax**：MP3（`speech-2.8-hd` 模型，32 kHz 采样率）。原生不支持语音便笺格式；如果你需要有保障的 Opus 语音消息，请使用 OpenAI 或 ElevenLabs。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 内置传输接受 `outputFormat`，但该服务并不提供所有格式。
  - 输出格式值遵循 Microsoft Speech 输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果你需要
    有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果已配置的 Microsoft 输出格式失败，OpenClaw 会重试 MP3。

OpenAI/ElevenLabs 的输出格式按渠道固定（见上文）。

## 自动 TTS 行为

启用后，OpenClaw 会：

- 如果回复已经包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过过短回复（少于 10 个字符）。
- 在启用时使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复进行摘要。
- 将生成的音频附加到回复上。

如果回复超过 `maxLength` 且摘要已关闭（或摘要模型没有 API 密钥），则会跳过音频，
发送普通文本回复。

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

## Slash Commands 用法

只有一个命令：`/tts`。
启用细节见 [Slash Commands](/zh-CN/tools/slash-commands)。

Discord 说明：`/tts` 是 Discord 内置命令，因此 OpenClaw 会在那里注册
`/voice` 作为原生命令。文本形式的 `/tts ...` 仍然有效。

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

说明：

- 这些命令需要授权发送者（允许列表/所有者规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- `off|always|inbound|tagged` 是按会话切换（`/tts on` 是 `/tts always` 的别名）。
- `limit` 和 `summary` 存储在本地 prefs 中，而不是主配置中。
- `/tts audio` 会生成一次性音频回复（不会开启 TTS）。
- `/tts status` 包含最近一次尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加 `Attempts: ...`
  - 失败：`Error: ...` 加 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 和 ElevenLabs API 失败现在会包含已解析的提供商错误详情和请求 id（当提供商返回时），这些信息会体现在 TTS 错误/日志中。

## 智能体工具

`tts` 工具会将文本转换为语音，并返回一个用于
回复投递的音频附件。当渠道为 Feishu、Matrix、Telegram 或 WhatsApp 时，
音频会作为语音消息而不是文件附件进行投递。

## Gateway 网关 RPC

Gateway 网关方法：

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
