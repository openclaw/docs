---
read_when:
    - 修改媒体管线或附件
summary: 发送、Gateway 网关和智能体回复的图像与媒体处理规则
title: 图像和媒体支持
x-i18n:
    generated_at: "2026-05-06T16:11:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录当前针对发送、Gateway 网关和智能体回复的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送带可选说明文字的媒体。
- 允许来自 Web 收件箱的自动回复在文本旁包含媒体。
- 保持各类型限制合理且可预测。

## CLI 表面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 可选；仅发送媒体时，说明文字可以为空。
  - `--dry-run` 打印解析后的载荷；`--json` 输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载到 Buffer 中，检测媒体类型，并构建正确的载荷：
  - **图片：**调整大小并重新压缩为 JPEG（最大边长 2048px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：**最大 16 MB 透传；音频会作为语音便笺发送（`ptt: true`）。
  - **文档：**其他所有内容，最大 100 MB，可用时保留文件名。
- WhatsApp GIF 风格播放：发送带有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），让移动客户端以内联方式循环播放。
- MIME 检测优先使用魔数，然后是标头，最后是文件扩展名。
- 说明文字来自 `--message` 或 `reply.text`；允许空说明文字。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式包含大小和源路径/URL。

## 自动回复管线

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 存在媒体时，Web 发送器会使用与 `openclaw message send` 相同的管线解析本地路径或 URL。
- 如果提供了多个媒体条目，会按顺序逐个发送。

## 传入媒体到命令（Pi）

- 当传入的 Web 消息包含媒体时，OpenClaw 会下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}` 传入媒体的伪 URL。
  - `{{MediaPath}}` 运行命令前写入的本地临时路径。
- 启用按会话的 Docker 沙箱时，传入媒体会复制到沙箱工作区，并将 `MediaPath`/`MediaUrl` 重写为类似 `media/inbound/<filename>` 的相对路径。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板渲染前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 块插入到 `Body` 中。
  - 音频会设置 `{{Transcript}}`，并使用转录文本进行命令解析，因此斜杠命令仍可工作。
  - 视频和图片描述会保留任何说明文字以用于命令解析。
  - 如果当前主图片模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，改为将原始图片传递给模型。
- 默认仅处理第一个匹配的图片/音频/视频附件；设置 `tools.media.<cap>.attachments` 可处理多个附件。

## 限制和错误

**出站发送上限（WhatsApp Web 发送）**

- 图片：重新压缩后最大为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：16 MB 上限；文档：100 MB 上限。
- 超大或不可读媒体 → 日志中显示明确错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图片默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 超大媒体会跳过理解，但回复仍会带原始正文继续发送。

## 测试注意事项

- 覆盖图片/音频/文档场景的发送和回复流程。
- 验证图片重新压缩（大小边界）以及音频的语音便笺标志。
- 确保多媒体回复会展开为按顺序发送。

## 相关内容

- [相机捕获](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频和语音便笺](/zh-CN/nodes/audio)
