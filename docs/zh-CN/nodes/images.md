---
read_when:
    - 修改媒体流水线或附件
summary: 发送、Gateway 网关和智能体回复的图像与媒体处理规则
title: 图像和媒体支持
x-i18n:
    generated_at: "2026-06-27T02:22:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录当前针对发送、Gateway 网关和智能体回复的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送带可选说明文字的媒体。
- 允许来自 Web 收件箱的自动回复在文本旁包含媒体。
- 让各类型限制保持合理且可预测。

## CLI 表面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 可选；说明文字可以为空，用于仅发送媒体。
  - `--dry-run` 会打印解析后的载荷；`--json` 会输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载到 Buffer，检测媒体类型，并构建正确的载荷：
  - **图片：** 调整尺寸并重新压缩为 JPEG（最大边 2048px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 16 MB 以内直接透传；音频会作为语音消息发送（`ptt: true`）。
  - **文档：** 其他任何内容，最高 100 MB，并在可用时保留文件名。
- WhatsApp GIF 风格播放：发送带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），让移动客户端内联循环播放。
- MIME 检测优先使用魔数字节，其次使用标头，再使用文件扩展名。
- 说明文字来自 `--message` 或 `reply.text`；允许空说明文字。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式包含大小和来源路径/URL。

## 自动回复流水线

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 存在媒体时，Web 发送器会使用与 `openclaw message send` 相同的流水线解析本地路径或 URL。
- 如果提供多个媒体条目，会按顺序逐个发送。

## 入站媒体到命令

- 当入站 Web 消息包含媒体时，OpenClaw 会下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}` 入站媒体的伪 URL。
  - `{{MediaPath}}` 运行命令前写入的本地临时路径。
- 启用每会话 Docker 沙箱时，入站媒体会复制到沙箱工作区，并且 `MediaPath`/`MediaUrl` 会重写为类似 `media/inbound/<filename>` 的相对路径。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板渲染前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 块插入 `Body`。
  - 音频会设置 `{{Transcript}}`，并将转录文本用于命令解析，因此斜杠命令仍然可用。
  - 视频和图片描述会保留任何说明文字，用于命令解析。
  - 如果当前主图片模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，改为将原始图片传给模型。
- 默认只处理第一个匹配的图片/音频/视频附件；设置 `tools.media.<cap>.attachments` 可处理多个附件。

## 限制和错误

**出站发送上限（WhatsApp Web 发送）**

- 图片：重新压缩后最高为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：16 MB 上限；文档：100 MB 上限。
- 过大或不可读的媒体 → 日志中给出明确错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图片默认值：10 MB（`tools.media.image.maxBytes`）。
- 音频默认值：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认值：50 MB（`tools.media.video.maxBytes`）。
- 过大的媒体会跳过理解，但回复仍会带原始正文继续发送。

## 测试说明

- 覆盖图片/音频/文档场景的发送和回复流程。
- 验证图片重新压缩（大小边界）和音频的语音消息标志。
- 确保多媒体回复会展开为顺序发送。

## 相关

- [相机捕获](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频和语音消息](/zh-CN/nodes/audio)
