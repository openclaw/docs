---
read_when:
    - 在 Control UI 中更改智能体输出渲染方式
    - 调试 `[embed ...]`、`MEDIA:`、回复或音频呈现指令
summary: 用于嵌入内容、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-25T17:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccafe827cf8b8ba47cca6e311b73135f38824addc989932bb4388ff7df51f3a0
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

智能体输出可以携带一小组传递/渲染指令：

- `MEDIA:` 用于附件传递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 和回复/语音标签仍然是传递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。
受信任的工具结果媒体在传递前也使用相同的 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此旧版工具输出仍然可以将音频附件标记为语音便笺。

启用分块流式传输时，`MEDIA:` 仍然是单轮中的单次传递元数据。如果同一个媒体 URL 已在流式分块中发送，并在最终智能体负载中重复出现，OpenClaw 会只传递一次该附件，并从最终负载中去除重复项。

## `[embed ...]`

`[embed ...]` 是面向智能体的、用于 Control UI 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新输出。
- Embed 短代码仅在智能体消息界面中渲染。
- 仅渲染基于 URL 的嵌入。请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed 短代码不会被渲染。
- Web UI 会从可见文本中移除该短代码，并以内联方式渲染嵌入内容。
- `MEDIA:` 不是 embed 的别名，不应用于富嵌入渲染。

## 存储的渲染形态

归一化/存储后的智能体内容块是一个结构化的 `canvas` 项：

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

已存储/已渲染的富内容块直接使用这种 `canvas` 形态。`present_view` 不被识别。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
