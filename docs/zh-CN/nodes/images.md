---
read_when:
    - 修改媒体管线或附件
summary: send、Gateway 网关和智能体回复的图像与媒体处理规则
title: 图像和媒体支持
x-i18n:
    generated_at: "2026-07-05T11:26:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 渠道运行在 Baileys Web 上。本页介绍发送、Gateway 网关和智能体回复中的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送带可选说明文字的媒体。
- 允许来自 Web 收件箱的自动回复在文本旁包含媒体。
- 保持各类型限制合理且可预测。

## CLI Surface

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 附加媒体（图片/音频/视频/文档）；接受本地路径或 URL。可选；纯媒体发送时说明文字可以为空。
- `--gif-playback` — 将视频媒体作为 GIF 播放处理（仅 WhatsApp）。
- `--force-document` — 将媒体作为文档发送，以避免渠道压缩（Telegram、WhatsApp）；适用于图片、GIF 和视频。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — 与纯文本发送共享的投递/线程选项。
- `--dry-run` — 打印解析后的载荷并跳过发送。
- `--json` — 将结果打印为 JSON：`{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` 携带特定渠道的发送结果，包括任何媒体引用）。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载到缓冲区，检测媒体类型，然后按类型构建出站载荷：
  - **图片：** 优化到低于 `channels.whatsapp.mediaMaxMb`（默认 50MB）。不透明图片会重新压缩为 JPEG（默认边长阶梯从 2048px 开始，反复超出大小时逐级下降）；带透明度的图片保留为 PNG。如果源文件已经是可接受的 JPEG/PNG/WebP，并且处于大小和边长预算内，则会原样保留原始字节，而不是重新压缩。动态 GIF 永不重新编码，只检查大小。
  - **音频/语音：** 除非已经是原生语音音频（`.ogg`/`.opus`，或 `audio/ogg`/`audio/opus`），否则出站音频会通过 `ffmpeg` 转码为 Opus/OGG（48kHz 单声道，64kbps，最长 20 分钟），然后作为语音消息（`ptt: true`）发送。
  - **视频：** 最高 16MB 直传。
  - **文档：** 其他任何内容，最高 100MB；可用时保留文件名。
- WhatsApp GIF 风格播放：发送带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），让移动客户端以内联方式循环播放。
- MIME 检测优先使用嗅探到的魔数字节，其次是文件扩展名，再其次是响应头；通用嗅探容器（`application/octet-stream`、`zip`）绝不会覆盖更具体的扩展名映射（例如 XLSX 与 ZIP）。
- 说明文字来自 `--message` 或 `reply.text`；允许空说明文字。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式包含大小和源路径/URL。

<Note>
上面的 16MB 音频/视频和 100MB 文档数值，是未传入显式字节上限时使用的共享按类型媒体默认值。WhatsApp 发送会从 `channels.whatsapp.mediaMaxMb`（默认 50MB）设置显式上限，该上限会统一应用于该账号的所有类型。
</Note>

## 自动回复流水线

- `getReplyFromConfig` 返回一个回复载荷（或载荷数组），其中包含 `text?`、`mediaUrl?` 和 `mediaUrls?` 等字段。
- 存在媒体时，Web 发送器会使用与 `openclaw message send` 相同的流水线解析本地路径或 URL。
- 如果提供了多个媒体条目，会按顺序依次发送。

## 入站媒体到命令

- 当入站 Web 消息包含媒体时，OpenClaw 会将其下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}` — 入站媒体的伪 URL。
  - `{{MediaPath}}` — 运行命令前写入的本地临时路径。
- 启用按会话 Docker 沙箱时，入站媒体会复制到沙箱工作区，并且 `MediaPath`/`MediaUrl` 会重写为类似 `media/inbound/<filename>` 的沙箱相对路径。
- 媒体理解（通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板渲染前运行，并且可以向 `Body` 插入 `[Image]`、`[Audio]` 和 `[Video]` 块。
  - 音频会设置 `{{Transcript}}`，并使用转录文本进行命令解析，因此斜杠命令仍可正常工作。
  - 视频和图片描述会保留任何说明文字，用于命令解析。
  - 如果当前活动的主模型已经原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，改为将原始图片传递给模型。
- 默认只处理第一个匹配的图片/音频/视频附件；设置 `tools.media.<capability>.attachments` 可处理多个附件。

## 限制和错误

**出站发送上限（WhatsApp Web 发送）**

- 图片：优化后最高 `channels.whatsapp.mediaMaxMb`（默认 50MB）。
- 音频/视频：16MB 上限（共享默认值；通过 WhatsApp 发送时会被 `mediaMaxMb` 覆盖）。
- 文档：100MB 上限（共享默认值；通过 WhatsApp 发送时会被 `mediaMaxMb` 覆盖）。
- 超大或不可读媒体会在日志中产生清晰错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图片默认值：10MB（`tools.media.image.maxBytes`）。
- 音频默认值：20MB（`tools.media.audio.maxBytes`）。
- 视频默认值：50MB（`tools.media.video.maxBytes`）。
- 超大媒体会跳过理解，但回复仍会携带原始正文继续发送。

## 测试说明

- 覆盖图片/音频/文档场景的发送和回复流程。
- 验证图片优化后的大小边界，以及音频的语音消息标志。
- 确保多媒体回复会按顺序展开为依次发送。

## 相关

- [Camera capture](/zh-CN/nodes/camera)
- [Media understanding](/zh-CN/nodes/media-understanding)
- [Audio and voice notes](/zh-CN/nodes/audio)
