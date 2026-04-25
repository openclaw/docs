---
read_when:
    - 更改 Control UI 中的助手输出渲染
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频呈现指令
summary: 用于嵌入、媒体、音频提示和回复的富输出 shortcode 协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-25T17:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

助手输出可以携带一小组传递/渲染指令：

- `MEDIA:` 用于附件传递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 以及回复/语音标签仍然是传递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。
受信任的工具结果媒体在传递前使用相同的 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此文本工具输出仍然可以将音频附件标记为语音便笺。

启用分块流式传输时，`MEDIA:` 仍然是单轮消息的单次传递元数据。如果同一个媒体 URL 已在流式块中发送，又在最终助手负载中重复出现，OpenClaw 只会传递一次附件，并从最终负载中移除重复项。

## `[embed ...]`

`[embed ...]` 是面向智能体的、用于 Control UI 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 对于新输出已不再有效。
- Embed shortcode 仅在助手消息表面中渲染。
- 仅渲染有 URL 支撑的 embed。使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed shortcode 不会渲染。
- Web UI 会从可见文本中剥离该 shortcode，并以内联方式渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

## 存储的渲染形状

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

已存储/已渲染的富块直接使用这个 `canvas` 形状。`present_view` 不会被识别。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
