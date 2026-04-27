---
read_when:
    - 修改媒体管道或附件
summary: 发送、Gateway 网关和智能体回复的图像与媒体处理规则
title: 图像与媒体支持
x-i18n:
    generated_at: "2026-04-27T07:11:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 15
---

# 图像与媒体支持（2025-12-05）

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录了当前针对发送、Gateway 网关和智能体回复的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送媒体，并可选附带说明文字。
- 允许来自 Web 收件箱的自动回复在文本之外附带媒体。
- 让按类型划分的限制保持合理且可预测。

## CLI 界面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 为可选项；说明文字可以为空，以便仅发送媒体。
  - `--dry-run` 会打印解析后的载荷；`--json` 会输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径 **或** HTTP(S) URL。
- 流程：加载到 Buffer 中，检测媒体类型，并构建正确的载荷：
  - **图像：** 调整大小并重新压缩为 JPEG（最长边 2048 px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 直接透传，最大 16 MB；音频会作为语音便笺发送（`ptt: true`）。
  - **文档：** 其他所有类型，最大 100 MB，并在可用时保留文件名。
- WhatsApp GIF 式播放：发送一个带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），这样移动客户端会内联循环播放。
- MIME 检测优先使用魔数字节，其次是头部，最后是文件扩展名。
- 说明文字来自 `--message` 或 `reply.text`；允许空说明文字。
- 日志记录：非详细模式显示 `↩️`/`✅`；详细模式包含大小和源路径/URL。

## 自动回复管道

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，Web 发送器会使用与 `openclaw message send` 相同的管道解析本地路径或 URL。
- 如果提供了多个媒体条目，它们会按顺序逐个发送。

## 传入媒体到命令（Pi）

- 当传入的 Web 消息包含媒体时，OpenClaw 会下载到临时文件，并公开模板变量：
  - 传入媒体的伪 URL：`{{MediaUrl}}`。
  - 在运行命令前写入的本地临时路径：`{{MediaPath}}`。
- 当启用了按会话划分的 Docker 沙箱时，传入媒体会被复制到沙箱工作区中，`MediaPath`/`MediaUrl` 会被改写为相对路径，例如 `media/inbound/<filename>`。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 进行配置）会在模板处理之前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 代码块插入到 `Body` 中。
  - 音频会设置 `{{Transcript}}`，并使用转录内容进行命令解析，这样斜杠命令仍可工作。
  - 视频和图像描述会保留任何说明文字，以便用于命令解析。
  - 如果当前激活的主图像模型已经原生支持视觉能力，OpenClaw 会跳过 `[Image]` 摘要代码块，改为直接将原始图像传给模型。
- 默认情况下，只会处理第一个匹配的图像/音频/视频附件；设置 `tools.media.<cap>.attachments` 可处理多个附件。

## 限制与错误

**出站发送上限（WhatsApp Web 发送）**

- 图像：重新压缩后最多为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：上限 16 MB；文档：上限 100 MB。
- 媒体过大或无法读取 → 日志中会显示清晰错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图像默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 过大的媒体会跳过理解，但回复仍会使用原始正文继续处理。

## 测试说明

- 覆盖图像/音频/文档场景下的发送 + 回复流程。
- 验证图像的重新压缩（大小上限）以及音频的语音便笺标志。
- 确保多媒体回复会扇出为顺序发送。

## 相关内容

- [相机采集](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频与语音便笺](/zh-CN/nodes/audio)
