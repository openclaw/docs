---
read_when:
    - 更改 Control UI 中的智能体输出呈现方式
    - 调试 `[embed ...]`、结构化媒体、回复或音频呈现指令
summary: 用于结构化媒体、嵌入内容、音频提示和回复的富输出协议
title: 富输出协议
x-i18n:
    generated_at: "2026-07-11T20:55:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助手输出通过几个专用通道携带交付/渲染指令：

- 用于交付附件的结构化 `mediaUrl` / `mediaUrls` 字段。
- 用于音频呈现提示的 `[[audio_as_voice]]`。
- 用于回复元数据的 `[[reply_to_current]]` / `[[reply_to:<id>]]`。
- 用于 Control UI 富渲染的 `[embed ...]`。

结构化媒体字段和 `[[...]]` 标签是交付元数据。`[embed ...]` 是独立的仅限 Web 的富渲染路径；它不是媒体的别名。

## 媒体附件

远程附件必须使用公开的 `https:` URL。`http:`、环回地址、链路本地地址、私有地址和内部主机名会被拒绝用作附件指令；服务器端媒体获取器还会额外应用其自身的网络防护措施。

本地附件接受绝对路径、工作区相对路径或相对于主目录的 `~/` 路径。交付前，它们仍需通过智能体文件读取策略和媒体类型检查。

<Warning>
不要从工具、插件、流式传输块、浏览器输出或消息操作中发出附件文本命令。请改用结构化媒体字段：

```json
{ "message": "这是你的图片。", "mediaUrl": "/workspace/image.png" }
```

为保持兼容性，旧版最终回复文本仍可能被规范化，但这并不是通用的插件/工具协议。
</Warning>

默认情况下，普通 Markdown 图片语法（`![alt](url)`）仍作为文本处理。希望将 Markdown 图片视为媒体回复的渠道，可在其出站适配器中选择启用此行为；Telegram 已启用，因此 `![alt](url)` 会变成媒体附件。

启用分块流式传输后，媒体必须通过结构化载荷字段传递。如果同一媒体 URL 同时出现在流式传输块和最终助手载荷中，OpenClaw 只会交付一次，并从最终载荷中移除重复项。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向智能体的富渲染语法。自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新输出。
- 嵌入短代码仅在助手消息界面中渲染。
- 仅渲染由 URL 支持的嵌入；请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML 嵌入短代码不会渲染。
- Web UI 会从可见文本中移除短代码，并以内联方式渲染嵌入内容。

## 存储的渲染结构

规范化/存储后的助手内容块是结构化的 `canvas` 项：

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

无法识别 `present_view`；存储/渲染的富内容块始终使用此 `canvas` 结构。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
