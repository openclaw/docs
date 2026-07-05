---
read_when:
    - 更改 Control UI 中的助手输出渲染
    - 调试 `[embed ...]`、结构化媒体、回复或音频呈现指令
summary: 用于结构化媒体、嵌入、音频提示和回复的富输出协议
title: 富输出协议
x-i18n:
    generated_at: "2026-07-05T11:40:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助手输出通过几个专用渠道携带投递/渲染指令：

- 用于附件投递的结构化 `mediaUrl` / `mediaUrls` 字段。
- 用于音频呈现提示的 `[[audio_as_voice]]`。
- 用于回复元数据的 `[[reply_to_current]]` / `[[reply_to:<id>]]`。
- 用于 Control UI 富渲染的 `[embed ...]`。

结构化媒体字段和 `[[...]]` 标签是投递元数据。`[embed ...]` 是单独的仅 Web 富渲染路径；它不是媒体别名。

## 媒体附件

远程附件必须是公开的 `https:` URL。`http:`、loopback、link-local、私有和内部主机名会作为附件指令被拒绝；服务器端媒体获取器会在此基础上应用自己的网络防护。

本地附件接受绝对路径、工作区相对路径或 home 相对的 `~/` 路径。投递前，它们仍会通过智能体文件读取策略和媒体类型检查。

<Warning>
不要从工具、插件、流式传输块、浏览器输出或消息操作中发出用于附件的文本命令。请改用结构化媒体字段：

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

旧版最终回复文本仍可能为了兼容性被规范化，但这不是通用的插件/工具协议。
</Warning>

普通 Markdown 图片语法（`![alt](url)`）默认仍是文本。希望将 Markdown 图片视为媒体回复的渠道，需要在其出站适配器中选择启用；Telegram 会这样做，因此 `![alt](url)` 会变成媒体附件。

启用分块流式传输时，媒体必须通过结构化载荷字段承载。如果同一个媒体 URL 同时出现在流式传输块中，并再次出现在最终助手载荷中，OpenClaw 会只投递一次，并从最终载荷中移除重复项。

## `[embed ...]`

`[embed ...]` 是面向智能体、用于 Control UI 的唯一富渲染语法。自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新的输出。
- Embed 短代码仅在助手消息界面中渲染。
- 只渲染由 URL 支撑的 embed；请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed 短代码不会渲染。
- Web UI 会从可见文本中移除短代码，并在行内渲染 embed。

## 已存储的渲染形状

规范化/存储后的助手内容块是一个结构化的 `canvas` 项：

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

`present_view` 不会被识别；已存储/已渲染的富内容块始终使用这个 `canvas` 形状。

## 相关

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
