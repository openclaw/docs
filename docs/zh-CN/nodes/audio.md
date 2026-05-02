---
read_when:
    - 更改音频转写或媒体处理
summary: 如何下载和转写入站音频/语音消息，并将其注入回复
title: 音频和语音留言
x-i18n:
    generated_at: "2026-05-02T23:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# 音频 / 语音留言（2026-01-17）

## 可用功能

- **媒体理解（音频）**：如果启用了音频理解（或自动检测到），OpenClaw 会：
  1. 定位第一个音频附件（本地路径或 URL），并在需要时下载它。
  2. 在发送到每个模型条目前强制执行 `maxBytes`。
  3. 按顺序运行第一个符合条件的模型条目（提供商或 CLI）。
  4. 如果失败或跳过（大小/超时），会尝试下一个条目。
  5. 成功后，会将 `Body` 替换为 `[Audio]` 块并设置 `{{Transcript}}`。
- **命令解析**：转写成功后，`CommandBody`/`RawBody` 会被设置为转写文本，因此斜杠命令仍可工作。
- **详细日志**：在 `--verbose` 下，我们会记录转写运行以及替换正文的时机。
- **控制 UI 听写**：聊天撰写器可以将浏览器录制的麦克风片段发送到 `chat.transcribeAudio`。该 Gateway 网关 RPC 会将片段写入临时本地文件，运行同一个音频转写流水线，将草稿文本返回给浏览器，并删除临时文件。它本身不会创建智能体运行。

## 自动检测（默认）

如果你**没有配置模型**，并且 `tools.media.audio.enabled` **未**设置为 `false`，
OpenClaw 会按以下顺序自动检测，并在找到第一个可用选项时停止：

1. **当前回复模型**，当其提供商支持音频理解时。
2. **本地 CLI**（如果已安装）
   - `sherpa-onnx-offline`（需要带有 encoder/decoder/joiner/tokens 的 `SHERPA_ONNX_MODEL_DIR`）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置 tiny 模型）
   - `whisper`（Python CLI；自动下载模型）
3. **Gemini CLI**（`gemini`），使用 `read_many_files`
4. **提供商凭证**
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

### 仅提供商并带范围控制

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

### 将转写文本回显到聊天（可选启用）

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

## 注意事项与限制

- 提供商凭证遵循标准模型凭证顺序（凭证配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情：[Groq](/zh-CN/providers/groq)。
- 使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情：[Deepgram（音频转写）](/zh-CN/providers/deepgram)。
- Mistral 设置详情：[Mistral](/zh-CN/providers/mistral)。
- 使用 `provider: "senseaudio"` 时，SenseAudio 会读取 `SENSEAUDIO_API_KEY`。
- SenseAudio 设置详情：[SenseAudio](/zh-CN/providers/senseaudio)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20MB（`tools.media.audio.maxBytes`）。超大音频会针对该模型跳过，并尝试下一个条目。
- 小于 1024 字节的 tiny/空音频文件会在提供商/CLI 转写前跳过。
- 音频的默认 `maxChars` **未设置**（完整转写文本）。设置 `tools.media.audio.maxChars` 或每个条目的 `maxChars` 可裁剪输出。
- OpenAI 自动默认值为 `gpt-4o-mini-transcribe`；设置 `model: "gpt-4o-transcribe"` 可获得更高准确度。
- 使用 `tools.media.audio.attachments` 处理多条语音留言（`mode: "all"` + `maxAttachments`）。
- 转写文本可作为 `{{Transcript}}` 提供给模板。
- `tools.media.audio.echoTranscript` 默认关闭；启用后可在智能体处理前，将转写确认发送回来源聊天。
- `tools.media.audio.echoFormat` 用于自定义回显文本（占位符：`{transcript}`）。
- CLI stdout 有上限（5MB）；保持 CLI 输出简洁。
- CLI `args` 应使用 `{{MediaPath}}` 作为本地音频文件路径。运行 `openclaw doctor --fix` 可从旧版 `audio.transcription.command` 配置迁移已弃用的 `{input}` 占位符。

### 代理环境支持

基于提供商的音频转写遵循标准出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未设置代理环境变量，则使用直接出站连接。如果代理配置格式错误，OpenClaw 会记录警告并回退到直接获取。

## 群组中的提及检测

当群聊设置了 `requireMention: true` 时，OpenClaw 现在会在检查提及**之前**转写音频。这样即使语音留言中包含提及，也可以被处理。

**工作方式：**

1. 如果语音消息没有文本正文且群组要求提及，OpenClaw 会执行“预检”转写。
2. 检查转写文本中的提及模式（例如 `@BotName`、emoji 触发器）。
3. 如果找到提及，消息会继续进入完整回复流水线。
4. 转写文本会用于提及检测，因此语音留言可以通过提及门控。

**回退行为：**

- 如果预检期间转写失败（超时、API 错误等），消息会基于纯文本提及检测进行处理。
- 这确保混合消息（文本 + 音频）永远不会被错误丢弃。

**按 Telegram 群组/话题选择退出：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true` 可跳过该群组的预检转写提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` 可按话题覆盖（`true` 表示跳过，`false` 表示强制启用）。
- 默认值为 `false`（当提及门控条件匹配时启用预检）。

**示例：** 用户在设置了 `requireMention: true` 的 Telegram 群组中发送一条语音留言，说 “Hey @Claude, what's the weather?”。该语音留言会被转写、检测到提及，然后智能体回复。

## 注意点

- 范围规则使用首个匹配胜出。`chatType` 会规范化为 `direct`、`group` 或 `room`。
- 确保你的 CLI 以 0 退出并打印纯文本；JSON 需要通过 `jq -r .text` 处理。
- 对于 `parakeet-mlx`，如果传入 `--output-dir`，当 `--output-format` 为 `txt`（或省略）时，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 输出格式会回退到 stdout 解析。
- 保持合理的超时（`timeoutSeconds`，默认 60s），避免阻塞回复队列。
- 预检转写只处理**第一个**音频附件用于提及检测。其他音频会在主媒体理解阶段处理。

## 相关

- [媒体理解](/zh-CN/nodes/media-understanding)
- [对话模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
