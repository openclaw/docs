---
read_when:
    - 修改媒体处理管线或附件
summary: 发送、Gateway 网关和智能体回复的图像与媒体处理规则
title: 图像和媒体支持
x-i18n:
    generated_at: "2026-07-11T20:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 渠道基于 Baileys Web 运行。本页介绍发送、Gateway 网关和智能体回复的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送媒体，并可选择添加说明文字。
- 允许来自网页收件箱的自动回复同时包含媒体和文本。
- 保持各类型的限制合理且可预测。

## CLI 接口

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 附加媒体（图像/音频/视频/文档）；接受本地路径或 URL。可选；仅发送媒体时，说明文字可以为空。
- `--gif-playback` — 将视频媒体作为 GIF 播放（仅限 WhatsApp）。
- `--force-document` — 将媒体作为文档发送以避免渠道压缩（Telegram、WhatsApp）；适用于图像、GIF 和视频。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — 与纯文本发送共用的投递/线程选项。
- `--dry-run` — 打印解析后的载荷并跳过发送。
- `--json` — 以 JSON 格式打印结果：`{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` 包含渠道特定的发送结果，包括所有媒体引用）。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载到缓冲区，检测媒体种类，然后按种类构建出站载荷：
  - **图像：**优化至不超过 `channels.whatsapp.mediaMaxMb`（默认 50MB）。不透明图像会重新压缩为 JPEG（默认边长阶梯从 2048px 开始，在多次未达到大小要求时逐级降低）；含透明度的图像保留为 PNG。如果源文件已是符合大小和边长预算的 JPEG/PNG/WebP，则原始字节保持不变，不进行重新压缩。动画 GIF 绝不会重新编码，只检查大小。
  - **音频/语音：**除非已是原生语音音频（`.ogg`/`.opus` 或 `audio/ogg`/`audio/opus`），否则出站音频会在发送前通过 `ffmpeg` 转码为 Opus/OGG（48kHz 单声道、64kbps、最长 20 分钟），并作为语音消息发送（`ptt: true`）。
  - **视频：**不超过 16MB 时直接传递。
  - **文档：**其他所有内容，不超过 100MB；如果文件名可用，则予以保留。
- WhatsApp 的 GIF 风格播放：发送带有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），让移动客户端在消息中循环播放。
- MIME 检测依次优先采用嗅探到的魔数、文件扩展名和响应标头；嗅探到的通用容器类型（`application/octet-stream`、`zip`）绝不会覆盖更具体的扩展名映射（例如 XLSX 与 ZIP）。
- 说明文字来自 `--message` 或 `reply.text`；允许为空。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式包含大小和源路径/URL。

<Note>
上述 16MB 音频/视频和 100MB 文档数值，是未传入明确字节上限时使用的按类型共享媒体默认值。WhatsApp 发送会根据 `channels.whatsapp.mediaMaxMb` 设置明确上限（默认 50MB），该上限统一应用于相应账号的所有媒体类型。
</Note>

## 自动回复流水线

- `getReplyFromConfig` 返回一个回复载荷（或载荷数组），其中包含 `text?`、`mediaUrl?` 和 `mediaUrls?` 等字段。
- 存在媒体时，网页发送器使用与 `openclaw message send` 相同的流水线解析本地路径或 URL。
- 如果提供多个媒体条目，则依次发送。

## 将入站媒体传给命令

- 当入站网页消息包含媒体时，OpenClaw 会将其下载到临时文件，并公开以下模板变量：
  - `{{MediaUrl}}` — 入站媒体的伪 URL。
  - `{{MediaPath}}` — 运行命令前写入的本地临时路径。
- 启用按会话配置的 Docker 沙箱后，入站媒体会复制到沙箱工作区，`MediaPath`/`MediaUrl` 会改写为类似 `media/inbound/<filename>` 的沙箱相对路径。
- 媒体理解（通过 `tools.media.*` 或共享的 `tools.media.models` 配置）在模板处理前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 块插入 `Body`。
  - 音频会设置 `{{Transcript}}`，并使用转录文本解析命令，因此斜杠命令仍可正常工作。
  - 视频和图像描述会保留所有说明文字，用于命令解析。
  - 如果当前主要模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，改为将原始图像传给模型。
- 默认情况下，仅处理第一个匹配的图像/音频/视频附件；设置 `tools.media.<capability>.attachments` 可处理多个附件。

## 限制和错误

**出站发送上限（WhatsApp 网页发送）**

- 图像：优化后不超过 `channels.whatsapp.mediaMaxMb`（默认 50MB）。
- 音频/视频：上限为 16MB（共享默认值；通过 WhatsApp 发送时由 `mediaMaxMb` 覆盖）。
- 文档：上限为 100MB（共享默认值；通过 WhatsApp 发送时由 `mediaMaxMb` 覆盖）。
- 媒体过大或无法读取时，日志中会显示明确错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图像默认值：10MB（`tools.media.image.maxBytes`）。
- 音频默认值：20MB（`tools.media.audio.maxBytes`）。
- 视频默认值：50MB（`tools.media.video.maxBytes`）。
- 过大的媒体会跳过理解处理，但仍会使用原始正文继续发送回复。

## 测试说明

- 覆盖图像、音频和文档场景的发送与回复流程。
- 验证图像优化后的大小边界以及音频的语音消息标志。
- 确保包含多个媒体的回复会展开为依次发送。

## 相关内容

- [相机拍摄](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频和语音消息](/zh-CN/nodes/audio)
