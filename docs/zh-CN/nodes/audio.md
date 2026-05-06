---
read_when:
    - 更改音频转录或媒体处理
summary: 传入的音频/语音留言如何下载、转写并注入回复
title: 音频和语音消息
x-i18n:
    generated_at: "2026-05-06T06:16:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# 音频 / 语音消息 (2026-01-17)

## 已支持的功能

- **媒体理解（音频）**：如果启用了音频理解（或自动检测到），OpenClaw 会：
  1. 定位第一个音频附件（本地路径或 URL），并在需要时下载它。
  2. 在发送到每个模型条目前执行 `maxBytes` 限制。
  3. 按顺序运行第一个符合条件的模型条目（提供商或 CLI）。
  4. 如果失败或跳过（大小/超时），它会尝试下一个条目。
  5. 成功后，它会将 `Body` 替换为 `[Audio]` 块，并设置 `{{Transcript}}`。
- **命令解析**：转写成功后，`CommandBody`/`RawBody` 会设置为转写文本，因此斜杠命令仍可工作。
- **详细日志**：在 `--verbose` 模式下，我们会在转写运行以及替换正文时记录日志。

## 自动检测（默认）

如果你**未配置模型**，并且 `tools.media.audio.enabled` **未**设置为 `false`，
OpenClaw 会按以下顺序自动检测，并在找到第一个可用选项时停止：

1. 当其提供商支持音频理解时，使用**当前回复模型**。
2. **本地 CLI**（如果已安装）
   - `sherpa-onnx-offline`（需要带有 encoder/decoder/joiner/tokens 的 `SHERPA_ONNX_MODEL_DIR`）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置 tiny 模型）
   - `whisper`（Python CLI；自动下载模型）
3. 使用 `read_many_files` 的 **Gemini CLI**（`gemini`）
4. **提供商认证**
   - 会优先尝试已配置且支持音频的 `models.providers.*` 条目
   - 内置回退顺序：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

要禁用自动检测，请设置 `tools.media.audio.enabled: false`。
要自定义，请设置 `tools.media.audio.models`。
注意：二进制检测在 macOS/Linux/Windows 上是尽力而为；请确保 CLI 位于 `PATH` 中（我们会展开 `~`），或设置带完整命令路径的显式 CLI 模型。

## 配置示例

### 提供商 + CLI 回退（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 仅提供商并带作用域门控

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### 仅提供商（Deepgram）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### 仅提供商（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### 仅提供商（SenseAudio）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### 将转写文本回显到聊天（选择启用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注意事项和限制

- 提供商认证遵循标准模型认证顺序（认证配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情：[Groq](/zh-CN/providers/groq)。
- 使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情：[Deepgram（音频转写）](/zh-CN/providers/deepgram)。
- Mistral 设置详情：[Mistral](/zh-CN/providers/mistral)。
- 使用 `provider: "senseaudio"` 时，SenseAudio 会读取 `SENSEAUDIO_API_KEY`。
- SenseAudio 设置详情：[SenseAudio](/zh-CN/providers/senseaudio)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限是 20MB（`tools.media.audio.maxBytes`）。超大音频会被该模型跳过，并尝试下一个条目。
- 小于 1024 字节的极小/空音频文件会在提供商/CLI 转写前被跳过。
- 音频的默认 `maxChars` **未设置**（完整转写文本）。设置 `tools.media.audio.maxChars` 或每个条目的 `maxChars` 可截断输出。
- OpenAI 自动默认值是 `gpt-4o-mini-transcribe`；设置 `model: "gpt-4o-transcribe"` 可获得更高准确率。
- 使用 `tools.media.audio.attachments` 处理多个语音消息（`mode: "all"` + `maxAttachments`）。
- 转写文本可作为 `{{Transcript}}` 提供给模板。
- `tools.media.audio.echoTranscript` 默认关闭；启用后会在智能体处理前，将转写确认发送回来源聊天。
- `tools.media.audio.echoFormat` 可自定义回显文本（占位符：`{transcript}`）。
- CLI stdout 有上限（5MB）；请保持 CLI 输出简洁。
- CLI `args` 应使用 `{{MediaPath}}` 表示本地音频文件路径。运行 `openclaw doctor --fix` 可从较旧的 `audio.transcription.command` 配置迁移已弃用的 `{input}` 占位符。

### 代理环境支持

基于提供商的音频转写遵循标准出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未设置代理环境变量，则使用直接出口。如果代理配置格式错误，OpenClaw 会记录警告并回退到直接获取。

## 群组中的提及检测

当为群聊设置 `requireMention: true` 时，OpenClaw 现在会在检查提及**之前**转写音频。这样即使语音消息中包含提及，也可以被处理。

**工作方式：**

1. 如果语音消息没有文本正文，并且群组要求提及，OpenClaw 会执行一次“预检”转写。
2. 转写文本会被检查是否包含提及模式（例如 `@BotName`、表情触发器）。
3. 如果发现提及，消息会进入完整回复流水线。
4. 转写文本用于提及检测，因此语音消息可以通过提及门控。

**回退行为：**

- 如果预检期间转写失败（超时、API 错误等），消息会基于纯文本提及检测进行处理。
- 这可确保混合消息（文本 + 音频）永远不会被错误丢弃。

**按 Telegram 群组/话题选择退出：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true` 可跳过该群组的预检转写提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` 可按话题覆盖（`true` 表示跳过，`false` 表示强制启用）。
- 默认值是 `false`（当提及门控条件匹配时启用预检）。

**示例：** 用户在设置了 `requireMention: true` 的 Telegram 群组中发送一条语音消息，说 “Hey @Claude, what's the weather?”。语音消息会被转写，提及会被检测到，然后智能体会回复。

## 注意事项

- 作用域规则使用第一个匹配项胜出。`chatType` 会规范化为 `direct`、`group` 或 `room`。
- 确保你的 CLI 以 0 退出并打印纯文本；JSON 需要通过 `jq -r .text` 处理。
- 对于 `parakeet-mlx`，如果你传入 `--output-dir`，当 `--output-format` 为 `txt`（或省略）时，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 输出格式会回退到 stdout 解析。
- 保持合理的超时（`timeoutSeconds`，默认 60s），避免阻塞回复队列。
- 预检转写只会处理**第一个**音频附件来进行提及检测。其他音频会在主媒体理解阶段处理。

## 相关内容

- [媒体理解](/zh-CN/nodes/media-understanding)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
