---
read_when:
    - 更改音频转写或媒体处理方式
summary: 入站音频/语音留言如何下载、转录并注入回复中
title: 音频和语音消息
x-i18n:
    generated_at: "2026-07-11T20:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 功能说明

启用音频理解（或自动检测到可用方式）后，OpenClaw 会：

1. 找到第一个音频附件（本地路径或 URL），并在需要时下载。
2. 在发送给每个模型条目之前执行 `maxBytes` 限制。
3. 按顺序运行第一个符合条件的模型条目（提供商或 CLI）；如果某个条目失败或被跳过（大小/超时），则尝试下一个条目。
4. 成功后，将 `Body` 替换为 `[Audio]` 块，并设置 `{{Transcript}}`。

转录成功后，`CommandBody`/`RawBody` 也会被设置为转录文本，以便斜杠命令仍可正常工作。使用 `--verbose` 时，日志会显示转录何时运行以及何时替换正文。

## 自动检测（默认）

如果你尚未配置模型，并且 `tools.media.audio.enabled` 不为 `false`，OpenClaw 会按以下顺序自动检测，并在找到第一个可用选项后停止：

1. **当前回复模型**，前提是其提供商支持音频理解。
2. **已配置的提供商身份验证** — 任何具有可用身份验证、且对应提供商支持音频转录的 `models.providers.*` 条目。此项会在本地 CLI 之前检查，因此配置的 API key 始终优先于 `PATH` 中的本地二进制文件。
   配置多个提供商时的优先级：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本地 CLI**（仅当未解析到提供商身份验证时）。OpenClaw 会构建一个有序的回退列表：
   - `whisper-cli`，仅当当前进程中较早的模型调用已检测到 Metal 或 CUDA 时，才排在 CPU 默认选项之前
   - 使用默认 CPU 提供商的 `sherpa-onnx-offline`（需要设置 `SHERPA_ONNX_MODEL_DIR`，其中包含 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 和 `joiner.onnx`）
   - `whisper-cli`，当 Metal/CUDA 仅具备构建能力，或选定后端尚未被实际检测到时
   - Apple Silicon 上的 `parakeet-mlx`（具备 MLX 能力；设备使用情况仍未实际检测）
   - `whisper`（Python CLI；自动下载模型）

安装/链接来源只能作为能力证据，不能作为执行证据。仅凭这一点，候选项绝不会排到 CPU sherpa 之前。OpenClaw 不会仅为探测后端而在设置或状态检查期间加载模型。
自动检测到的 whisper.cpp 会保留其正常的模型运行日志，以便 OpenClaw 记录上游的 `using … backend` 行。显式 CLI 条目则保留其配置的输出标志。

用于媒体理解的 Gemini CLI 自动检测已替换为沙箱隔离的 Antigravity CLI（`agy`）回退，用于图像/视频；除上述本地二进制文件外，音频不使用其他 CLI 回退。

若要禁用自动检测，请设置 `tools.media.audio.enabled: false`。若要自定义，请设置 `tools.media.audio.models`。

<Note>
在 macOS/Linux/Windows 上，二进制文件检测采用尽力而为的方式。请确保 CLI 位于 `PATH` 中（会展开 `~`），或者使用完整命令路径设置显式 CLI 模型。
</Note>

无需转录音频即可检查本地选择：

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

提供商清单会单独报告本地回退的胜出项以及全局提供商选择，并显示具备能力、请求使用和实际检测到的后端字段。转录运行后，`/status` 会在媒体行中报告请求使用或实际检测到的后端。显式 `tools.media.audio.models` CLI 条目仍会绕过自动选择；请使用其后端专用标志，例如 sherpa 的 `--provider=cuda` 或 whisper.cpp 的 `--no-gpu`/`--device`。

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

### 仅使用提供商，并通过作用域控制

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

### 仅使用提供商（Deepgram）

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

### 仅使用提供商（Mistral Voxtral）

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

### 仅使用提供商（SenseAudio）

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

### 将转录文本回显到聊天（选择启用）

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

## 注意事项和限制

- 提供商身份验证遵循标准模型身份验证顺序（身份验证配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情：[Groq](/zh-CN/providers/groq)。
- 使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。设置详情：[Deepgram](/zh-CN/providers/deepgram)。
- Mistral 设置详情：[Mistral](/zh-CN/providers/mistral)。
- 使用 `provider: "senseaudio"` 时，SenseAudio 会读取 `SENSEAUDIO_API_KEY`。设置详情：[SenseAudio](/zh-CN/providers/senseaudio)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20MB（`tools.media.audio.maxBytes`）。对于该模型，超出大小限制的音频会被跳过，并尝试下一个条目。
- 小于 1024 字节的音频文件会在提供商/CLI 转录之前被跳过。
- 音频的默认 `maxChars` **未设置**（保留完整转录文本）。设置 `tools.media.audio.maxChars` 或各条目的 `maxChars` 可截短输出。
- OpenAI 自动检测的默认模型为 `gpt-4o-transcribe`；设置 `model: "gpt-4o-mini-transcribe"` 可使用成本更低、速度更快的选项。
- 使用 `tools.media.audio.attachments` 处理多条语音消息（`mode: "all"` 加 `maxAttachments`，默认值为 1）。
- 模板可通过 `{{Transcript}}` 访问转录文本。
- `tools.media.audio.echoTranscript` 默认关闭；启用后，会在智能体处理之前将转录确认发送回原始聊天。
- `tools.media.audio.echoFormat` 用于自定义回显文本（占位符：`{transcript}`；默认值为 `📝 "{transcript}"`）。
- CLI 标准输出上限为 5MB；请保持 CLI 输出简洁。
- CLI `args` 应使用 `{{MediaPath}}` 表示本地音频文件路径。运行 `openclaw doctor --fix`，可迁移旧版 `audio.transcription.command` 配置中已弃用的 `{input}` 占位符（已停用的键：`audio.transcription`，由 `tools.media.audio.models` 取代）。
- `tools.media.concurrency` 限制媒体任务数量；它并非 GPU 调度器。

### 常驻本地 STT

自动检测的本地 STT 仍采用每个请求一个进程的方式。OpenClaw 目前不管理常驻 whisper.cpp 服务器，因为标准 Homebrew `whisper-cpp` 软件包禁用了该服务器，而上游示例未配置有界准入队列。要安全启用由插件所有的常驻生命周期，需要有一个持续维护的打包工作进程，支持健康检查/启动、模型常驻、有界队列、取消/超时、仅 local loopback 且无身份验证的运行方式，并且不能回退到云端。

### 代理环境支持

基于提供商的音频转录遵循标准出站代理环境变量，与 undici 的 `EnvHttpProxyAgent` 语义一致：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小写变量优先于大写变量；`NO_PROXY`/`no_proxy` 条目（主机名、`*.suffix` 或 `host:port`）会绕过代理。如果未设置代理环境变量，则使用直接出站连接。如果代理设置失败（URL 格式错误），OpenClaw 会记录警告并回退到直接获取。

## 群组中的提及检测

在支持音频预检的渠道上，如果群聊设置了 `requireMention: true`，OpenClaw 会在检查提及**之前**转录音频。这样，当无文字说明的语音消息转录文本包含已配置的提及模式时，它就能通过提及门控。对于必须使用文字提及的传输方式，请参阅对应渠道的文档。

**工作原理：**

1. 如果语音消息没有文本正文且群组要求提及，OpenClaw 会对第一个音频附件执行预检转录。
2. 检查转录文本中是否存在提及模式（例如 `@BotName`、表情符号触发器）。
3. 如果发现提及，消息会继续进入完整回复流水线。

**回退行为：**如果预检转录失败（超时、API 错误等），消息会回退到仅文本提及检测，因此混合消息（文本 + 音频）绝不会被丢弃。

**按 Telegram 群组/话题选择停用：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，可跳过该群组的预检转录提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，可按话题覆盖（`true` 表示跳过，`false` 表示强制启用）。
- 默认值为 `false`（当满足提及门控条件时启用预检）。

**示例：**用户在设置了 `requireMention: true` 的 Telegram 群组中发送一条语音消息，内容为“嘿，@Claude，天气怎么样？”。系统会转录该语音消息，检测到提及，然后智能体作出回复。

## 常见陷阱

- 作用域规则采用首次匹配即生效；`chatType` 会规范化为 `direct`、`group` 或 `channel`。
- 确保你的 CLI 以状态码 0 退出并输出纯文本；JSON 输出需要通过 `jq -r .text` 进行处理。
- 已知的文件输出模式具有最高判断权：如果推断出的转录文件为空或缺失，则不会生成转录文本，也不会回退到 CLI 进度输出。
- 对于 `parakeet-mlx`，请将 `--output-format txt`（或 `all`）与 `--output-dir` 及默认 `{filename}` 输出模板一起使用。上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 环境变量同样有效。OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；默认的 `srt` 格式、其他格式以及自定义输出模板仍使用标准输出。
- 请将超时设置在合理范围内（`timeoutSeconds`，默认 60 秒），以免阻塞回复队列。
- 预检转录仅处理用于提及检测的**第一个**音频附件。其他音频附件会在主要媒体理解阶段处理。

## 相关内容

- [媒体理解](/zh-CN/nodes/media-understanding)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
