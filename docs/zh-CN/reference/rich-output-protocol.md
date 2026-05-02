---
read_when:
    - 在控制 UI 中更改助手输出渲染
    - 调试 `[embed ...]`、`MEDIA:`、回复或音频呈现指令
summary: 富输出短代码协议，用于嵌入、媒体、音频提示和回复
title: 富输出协议
x-i18n:
    generated_at: "2026-05-02T21:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助手输出可以携带一小组交付/渲染指令：

- `MEDIA:` 用于附件交付
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

远程 `MEDIA:` 附件必须是公开的 `https:` URL。纯 `http:`、
回环、链路本地、私有和内部主机名会被忽略为附件指令；服务端媒体获取器仍会执行自己的网络防护。

本地 `MEDIA:` 附件可以使用绝对路径、工作区相对路径，或
home 相对 `~/` 路径。在交付前，它们仍会经过智能体文件读取策略和
媒体类型检查。

普通 Markdown 图片语法默认仍保留为文本。有意将 Markdown 图片回复映射为媒体附件的渠道会在其出站
适配器中选择启用；Telegram 会这样做，因此 `![alt](url)` 仍可变成媒体回复。

这些指令彼此独立。`MEDIA:` 和回复/语音标签仍是交付元数据；`[embed ...]` 是仅用于 Web 的富渲染路径。
受信任工具结果媒体在交付前使用同一个 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此文本工具输出仍可将音频附件标记为语音便签。

启用分块流式传输时，`MEDIA:` 仍是一个轮次中的单次交付元数据。如果同一个媒体 URL 在流式块中发送，并在最终
助手负载中重复，OpenClaw 会交付附件一次，并从最终负载中剥离重复项。

## `[embed ...]`

`[embed ...]` 是面向智能体的唯一 Control UI 富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 对新输出不再有效。
- 嵌入短代码只会在助手消息表面渲染。
- 只渲染由 URL 支持的嵌入。使用 `ref="..."` 或 `url="..."`。
- 不渲染块形式的内联 HTML 嵌入短代码。
- Web UI 会从可见文本中剥离短代码，并以内联方式渲染嵌入。
- `MEDIA:` 不是嵌入别名，不应用于富嵌入渲染。

## 存储的渲染形态

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

存储/渲染的富块直接使用这个 `canvas` 形态。不识别 `present_view`。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
