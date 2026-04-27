---
read_when:
    - 更改音频转录或媒体处理
summary: 入站音频/语音消息如何被下载、转录并注入到回复中
title: 音频和语音消息
x-i18n:
    generated_at: "2026-04-27T14:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 15
---

# 音频 / 语音消息（2026-01-17）

## 已支持的功能

- **媒体理解（音频）**：如果启用了音频理解（或自动检测到可用），OpenClaw 会：
  1. 定位第一个音频附件（本地路径或 URL），并在需要时下载它。
  2. 在发送给每个模型条目前强制执行 `maxBytes` 限制。
  3. 按顺序运行第一个符合条件的模型条目（provider 或 CLI）。
  4. 如果失败或跳过（大小 / 超时），则尝试下一个条目。
  5. 成功后，它会用一个 `[Audio]` 块替换 `Body`，并设置 `{{Transcript}}`。
- **命令解析**：当转录成功时，`CommandBody`/`RawBody` 会被设置为转录文本，因此斜杠命令仍然可用。
- **详细日志**：在 `--verbose` 模式下，我们会记录何时运行转录以及何时替换消息正文。

## 自动检测（默认）

如果你**未配置模型**，并且 `tools.media.audio.enabled` **未**设置为 `false`，
OpenClaw 会按以下顺序自动检测，并在第一个可用选项成功后停止：

1. **当前回复模型**，前提是其提供商支持音频理解。
2. **本地 CLI**（如果已安装）
   - `sherpa-onnx-offline`（需要设置 `SHERPA_ONNX_MODEL_DIR`，其中包含 encoder/decoder/joiner/tokens）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置的 tiny 模型）
   - `whisper`（Python CLI；会自动下载模型）
3. **Gemini CLI**（`gemini`），使用 `read_many_files`
4. **provider 凭证**
   - 优先尝试已配置且支持音频的 `models.providers.*` 条目
   - 内置回退顺序：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

要禁用自动检测，请设置 `tools.media.audio.enabled: false`。
要自定义，请设置 `tools.media.audio.models`。
注意：二进制检测在 macOS/Linux/Windows 上尽力而为；请确保 CLI 在 `PATH` 中（我们会展开 `~`），或者设置带有完整命令路径的显式 CLI 模型。

## 配置示例

### provider + CLI 回退（OpenAI + Whisper CLI）

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

### 仅 provider，并带作用域门控

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

### 仅 provider（Deepgram）

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

### 仅 provider（Mistral Voxtral）

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

### 仅 provider（SenseAudio）

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

### 将转录文本回显到聊天中（可选启用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // 默认是 false
        echoFormat: '📝 "{transcript}"', // 可选，支持 {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 说明与限制

- provider 凭证遵循标准的模型凭证顺序（认证配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情：[Groq](/zh-CN/providers/groq)。
- 当使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情：[Deepgram（音频转录）](/zh-CN/providers/deepgram)。
- Mistral 设置详情：[Mistral](/zh-CN/providers/mistral)。
- 当使用 `provider: "senseaudio"` 时，SenseAudio 会读取 `SENSEAUDIO_API_KEY`。
- SenseAudio 设置详情：[SenseAudio](/zh-CN/providers/senseaudio)。
- 音频 provider 可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20 MB（`tools.media.audio.maxBytes`）。超出大小限制的音频会对该模型跳过，并尝试下一个条目。
- 小于 1024 字节的超小 / 空音频文件会在 provider/CLI 转录之前被跳过。
- 音频的默认 `maxChars` **未设置**（完整转录）。可设置 `tools.media.audio.maxChars` 或按条目设置 `maxChars` 以截断输出。
- OpenAI 的自动默认模型是 `gpt-4o-mini-transcribe`；如需更高准确率，请设置 `model: "gpt-4o-transcribe"`。
- 使用 `tools.media.audio.attachments` 处理多个语音消息（`mode: "all"` + `maxAttachments`）。
- 转录文本可通过 `{{Transcript}}` 提供给模板使用。
- `tools.media.audio.echoTranscript` 默认关闭；启用后会在智能体处理前将转录确认消息发送回原始聊天。
- `tools.media.audio.echoFormat` 用于自定义回显文本（占位符：`{transcript}`）。
- CLI stdout 有上限（5 MB）；请保持 CLI 输出简洁。
- CLI `args` 应使用 `{{MediaPath}}` 表示本地音频文件路径。运行 `openclaw doctor --fix` 可迁移旧版 `audio.transcription.command` 配置中已弃用的 `{input}` 占位符。

### 代理环境支持

基于 provider 的音频转录遵循标准的出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未设置代理环境变量，则使用直连出口。如果代理配置格式错误，OpenClaw 会记录警告并回退到直连抓取。

## 群组中的提及检测

当群聊设置了 `requireMention: true` 时，OpenClaw 现在会在检查提及之前**先转录音频**。这样即使语音消息中包含提及，也能被处理。

**工作方式：**

1. 如果语音消息没有文本正文，且群组要求提及，OpenClaw 会执行一次“预检”转录。
2. 系统会检查转录文本中是否包含提及模式（例如 `@BotName`、表情符号触发词）。
3. 如果检测到提及，消息会进入完整回复流程。
4. 转录文本会用于提及检测，因此语音消息可以通过提及门槛。

**回退行为：**

- 如果预检阶段的转录失败（超时、API 错误等），消息将根据纯文本提及检测结果进行处理。
- 这样可以确保混合消息（文本 + 音频）永远不会被错误丢弃。

**按 Telegram 群组 / 话题选择退出：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true` 可为该群组跳过预检转录提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` 可按话题覆盖（`true` 为跳过，`false` 为强制启用）。
- 默认值为 `false`（当提及门控条件匹配时启用预检）。

**示例：** 用户在一个设置了 `requireMention: true` 的 Telegram 群组中发送一条语音消息，说：“Hey @Claude, what's the weather?”。该语音消息会被转录，系统会检测到提及，然后智能体作出回复。

## 注意事项

- 作用域规则采用首次匹配优先。`chatType` 会被规范化为 `direct`、`group` 或 `room`。
- 请确保你的 CLI 以 0 退出并输出纯文本；如果输出是 JSON，需要通过 `jq -r .text` 做处理。
- 对于 `parakeet-mlx`，如果你传入 `--output-dir`，当 `--output-format` 为 `txt`（或省略）时，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 输出格式会回退到解析 stdout。
- 请保持合理的超时时间（`timeoutSeconds`，默认 60 秒），以避免阻塞回复队列。
- 预检转录仅处理**第一个**音频附件用于提及检测。其他音频会在主媒体理解阶段处理。

## 相关内容

- [媒体理解](/zh-CN/nodes/media-understanding)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
