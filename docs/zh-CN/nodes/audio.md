---
read_when:
    - 更改音频转写或媒体处理
summary: 入站音频/语音留言如何下载、转录并注入回复
title: 音频和语音留言
x-i18n:
    generated_at: "2026-07-05T11:25:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8203660ec2a09e69d5e1369a62d88170a9226dc8c9bb609964addfd4822419fc
    source_path: nodes/audio.md
    workflow: 16
---

## 作用

启用（或自动检测到）音频理解时，OpenClaw 会：

1. 定位第一个音频附件（本地路径或 URL），并在需要时下载它。
2. 在发送到每个模型条目前强制执行 `maxBytes`。
3. 按顺序运行第一个符合条件的模型条目（提供商或 CLI）；如果某个条目失败或跳过（大小/超时），则尝试下一个条目。
4. 成功后，用 `[Audio]` 块替换 `Body`，并设置 `{{Transcript}}`。

转录成功时，`CommandBody`/`RawBody` 也会设置为转录文本，因此斜杠命令仍然可用。使用 `--verbose` 时，日志会显示转录何时运行以及何时替换正文。

## 自动检测（默认）

如果你尚未配置模型，且 `tools.media.audio.enabled` 不是 `false`，OpenClaw 会按以下顺序自动检测，并在第一个可用选项处停止：

1. **当前回复模型**，当其提供商支持音频理解时。
2. **已配置的提供商凭证** — 任何 `models.providers.*` 条目，只要它为支持音频转录的提供商提供可用凭证。此项会在本地 CLI 之前检查，因此已配置的 API key 总是优先于 `PATH` 上的本地二进制文件。
   配置多个提供商时的优先级：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本地 CLI**（仅当未解析到提供商凭证时），按以下顺序检查：
   - `sherpa-onnx-offline`（需要带有 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 和 `joiner.onnx` 的 `SHERPA_ONNX_MODEL_DIR`）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置的 tiny 模型）
   - `whisper`（Python CLI；自动下载模型）

用于媒体理解的 Gemini CLI 自动检测已替换为沙箱隔离的 Antigravity CLI（`agy`）回退，用于图像/视频；除上述本地二进制文件外，音频不使用 CLI 回退。

要禁用自动检测，请设置 `tools.media.audio.enabled: false`。要自定义，请设置 `tools.media.audio.models`。

<Note>
二进制检测在 macOS/Linux/Windows 上是尽力而为。请确保 CLI 位于 `PATH` 上（会展开 `~`），或使用完整命令路径设置显式 CLI 模型。
</Note>

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
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### 仅提供商并使用作用域门控

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### 将转录回显到聊天（选择启用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## 说明和限制

- 提供商凭证遵循标准模型凭证顺序（凭证配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情：[Groq](/zh-CN/providers/groq)。
- 使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。设置详情：[Deepgram](/zh-CN/providers/deepgram)。
- Mistral 设置详情：[Mistral](/zh-CN/providers/mistral)。
- 使用 `provider: "senseaudio"` 时，SenseAudio 会读取 `SENSEAUDIO_API_KEY`。设置详情：[SenseAudio](/zh-CN/providers/senseaudio)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20MB（`tools.media.audio.maxBytes`）。超大音频会为该模型跳过，并尝试下一个条目。
- 小于 1024 字节的音频文件会在提供商/CLI 转录前跳过。
- 音频的默认 `maxChars` 为**未设置**（完整转录）。设置 `tools.media.audio.maxChars` 或每条目的 `maxChars` 以裁剪输出。
- OpenAI 自动检测默认值为 `gpt-4o-transcribe`；设置 `model: "gpt-4o-mini-transcribe"` 可使用更便宜/更快的选项。
- 使用 `tools.media.audio.attachments` 处理多条语音消息（`mode: "all"` 加 `maxAttachments`，默认 1）。
- 转录文本可作为 `{{Transcript}}` 提供给模板。
- `tools.media.audio.echoTranscript` 默认关闭；启用它可在智能体处理前向来源聊天发送转录确认。
- `tools.media.audio.echoFormat` 可自定义回显文本（占位符：`{transcript}`；默认 `📝 "{transcript}"`）。
- CLI stdout 上限为 5MB；请保持 CLI 输出简洁。
- CLI `args` 应使用 `{{MediaPath}}` 表示本地音频文件路径。运行 `openclaw doctor --fix` 可从较旧的 `audio.transcription.command` 配置迁移已弃用的 `{input}` 占位符（已停用键：`audio.transcription`，替换为 `tools.media.audio.models`）。

### 代理环境支持

基于提供商的音频转录会遵循标准出站代理环境变量，与 undici 的 `EnvHttpProxyAgent` 语义一致：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小写变量优先于大写变量；`NO_PROXY`/`no_proxy` 条目（主机名、`*.suffix` 或 `host:port`）会绕过代理。如果未设置代理环境变量，则使用直接出站连接。如果代理设置失败（URL 格式错误），OpenClaw 会记录警告并回退到直接 fetch。

## 群组中的提及检测

为群聊设置 `requireMention: true` 时，OpenClaw 会在检查提及**之前**转录音频。这样即使消息没有文本正文，语音消息也能通过提及门控。

**工作方式：**

1. 如果语音消息没有文本正文且群组要求提及，OpenClaw 会对第一个音频附件执行预检转录。
2. 会检查转录文本中的提及模式（例如 `@BotName`、emoji 触发器）。
3. 如果找到提及，消息会继续进入完整回复流水线。

**回退行为：**如果预检转录失败（超时、API 错误等），消息会回退到仅文本提及检测，因此混合消息（文本 + 音频）绝不会被丢弃。

**按 Telegram 群组/话题选择退出：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true` 可跳过该群组的预检转录提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` 可按话题覆盖（`true` 表示跳过，`false` 表示强制启用）。
- 默认值为 `false`（当匹配提及门控条件时启用预检）。

**示例：**用户在设置了 `requireMention: true` 的 Telegram 群组中发送一条语音消息，说 “Hey @Claude, what's the weather?”。该语音消息会被转录，提及会被检测到，智能体会回复。

## 注意事项

- 作用域规则采用首次匹配优先；`chatType` 会规范化为 `direct`、`group` 或 `channel`。
- 确保你的 CLI 以 0 退出并打印纯文本；JSON 输出需要通过 `jq -r .text` 处理。
- 对于 `parakeet-mlx`，如果你传入 `--output-dir`，当 `--output-format` 为 `txt`（或省略）时，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 输出格式会回退到 stdout 解析。
- 保持超时合理（`timeoutSeconds`，默认 60s），避免阻塞回复队列。
- 预检转录仅处理用于提及检测的**第一个**音频附件。其他音频附件会在主媒体理解阶段处理。

## 相关

- [媒体理解](/zh-CN/nodes/media-understanding)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
