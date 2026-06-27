---
read_when:
    - 更改 Control UI 中的助手输出渲染
    - 调试 `[embed ...]`、结构化媒体、回复或音频呈现指令
summary: 用于结构化媒体、嵌入内容、音频提示和回复的富输出协议
title: 富输出协议
x-i18n:
    generated_at: "2026-06-27T03:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助手输出可以携带一小组交付/渲染指令：

- 用于附件交付的结构化 `mediaUrl` / `mediaUrls` 字段
- 用于音频呈现提示的 `[[audio_as_voice]]`
- 用于回复元数据的 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- 用于 Control UI 富渲染的 `[embed ...]`

远程媒体附件必须是公开的 `https:` URL。普通 `http:`、
loopback、本地链路、私有和内部主机名会作为附件指令被忽略；
服务端媒体获取器仍会执行自己的网络防护。

本地媒体附件可以使用绝对路径、工作区相对路径或
home-relative `~/` 路径。它们在交付前仍会经过智能体文件读取策略和
媒体类型检查。

<Warning>
不要从工具、插件、流式传输块、浏览器输出或消息动作中发出附件文本命令。请改用结构化媒体字段。

有效的 message-tool 载荷：

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

旧版最终助手回复文本仍可能为了兼容性进行规范化，但
它不是通用的插件/工具协议。
</Warning>

普通 Markdown 图片语法默认保持为文本。有意将 Markdown 图片回复映射为媒体附件的渠道会在其出站适配器中选择启用；Telegram 会这样做，因此 `![alt](url)` 仍可变成媒体回复。

这些指令彼此独立。结构化媒体字段和回复/语音标签是
交付元数据；`[embed ...]` 是仅限 Web 的富渲染路径。

启用分块流式传输时，媒体必须通过结构化载荷字段携带。
如果同一个媒体 URL 在流式传输块中发送，并在最终助手载荷中重复出现，OpenClaw 会只交付一次附件，并从最终载荷中移除重复项。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向智能体的富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 对新输出不再有效。
- Embed shortcodes 仅在助手消息表面中渲染。
- 仅渲染由 URL 支持的 embed。使用 `ref="..."` 或 `url="..."`。
- 不渲染块形式的内联 HTML embed shortcodes。
- Web UI 会从可见文本中剥离 shortcode，并内联渲染 embed。
- 结构化媒体不是 embed 别名，不应用于富 embed 渲染。

## 存储的渲染形态

规范化/存储后的助手内容块是一个结构化 `canvas` 项：

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

存储/渲染的富内容块会直接使用此 `canvas` 形态。`present_view` 不会被识别。

## 相关

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
