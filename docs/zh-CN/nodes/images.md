---
read_when:
    - 修改媒体管线或附件时
summary: 用于发送、gateway 和智能体回复的图片与媒体处理规则
title: 图片与媒体支持
x-i18n:
    generated_at: "2026-04-05T08:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# 图片与媒体支持（2025-12-05）

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录了当前用于发送、gateway 和智能体回复的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送媒体，并可附带可选说明文字。
- 允许来自 web 收件箱的自动回复在文本之外同时包含媒体。
- 让按类型划分的限制保持合理且可预测。

## CLI 界面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 为可选；对于仅发送媒体的情况，说明文字可以为空。
  - `--dry-run` 会打印解析后的负载；`--json` 会输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载为 Buffer，检测媒体类型，并构建正确的负载：
  - **图片：** 调整大小并重新压缩为 JPEG（最长边 2048 px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 16 MB 以内直接透传；音频会作为语音便笺发送（`ptt: true`）。
  - **文档：** 其他任意内容，最大 100 MB，并在可用时保留文件名。
- WhatsApp GIF 式播放：发送带有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），这样移动端客户端会在行内循环播放。
- MIME 检测优先级：magic bytes，其次是头部，最后是文件扩展名。
- 说明文字来自 `--message` 或 `reply.text`；允许空说明文字。
- 日志：非 verbose 模式显示 `↩️`/`✅`；verbose 模式还会包含大小以及源路径/URL。

## 自动回复管线

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，web 发送器会使用与 `openclaw message send` 相同的管线解析本地路径或 URL。
- 如果提供了多个媒体条目，它们会按顺序依次发送。

## 传入命令的入站媒体（Pi）

- 当传入的 web 消息包含媒体时，OpenClaw 会下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}`：指向入站媒体的伪 URL。
  - `{{MediaPath}}`：在运行命令前写入的本地临时路径。
- 当启用了按会话划分的 Docker 沙箱时，入站媒体会被复制到沙箱工作区中，并且 `MediaPath`/`MediaUrl` 会被重写为类似 `media/inbound/<filename>` 的相对路径。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板处理前运行，并且可以将 `[Image]`、`[Audio]` 和 `[Video]` 块插入到 `Body` 中。
  - 音频会设置 `{{Transcript}}`，并使用转录文本进行命令解析，以便斜杠命令仍然可用。
  - 视频和图片描述会保留所有说明文字文本，用于命令解析。
  - 如果当前活动的主图片模型本身已经原生支持视觉能力，OpenClaw 会跳过 `[Image]` 摘要块，并改为直接将原始图片传递给模型。
- 默认情况下，只处理第一个匹配的图片/音频/视频附件；设置 `tools.media.<cap>.attachments` 可处理多个附件。

## 限制与错误

**出站发送上限（WhatsApp web 发送）**

- 图片：重压缩后最大为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：上限为 16 MB；文档：上限为 100 MB。
- 媒体过大或无法读取 → 日志中会显示清晰错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图片默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 媒体过大时会跳过理解阶段，但回复仍会使用原始正文继续发送。

## 测试说明

- 覆盖图片/音频/文档场景下的发送 + 回复流程。
- 验证图片重压缩（大小受限）以及音频的语音便笺标志。
- 确保多媒体回复会按顺序扇出发送。
