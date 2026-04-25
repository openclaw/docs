---
read_when:
    - 更改 Control UI 中的助手输出渲染方式
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频呈现指令
summary: 用于嵌入、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-25T05:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 和 reply/voice 标签仍然是投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。

启用分块流式传输时，`MEDIA:` 对于单个轮次仍然是单次投递元数据。如果同一个媒体 URL 已在流式块中发送，又在最终助手载荷中重复出现，OpenClaw 只会投递一次附件，并从最终载荷中移除重复项。

## `[embed ...]`

`[embed ...]` 是面向智能体的、用于 Control UI 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新的输出。
- embed 短代码仅在助手消息界面中渲染。
- 仅渲染基于 URL 的 embed。请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed 短代码不会被渲染。
- Web UI 会从可见文本中移除该短代码，并以内联方式渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

## 存储的渲染结构

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

已存储/已渲染的富块直接使用这种 `canvas` 结构。`present_view` 不会被识别。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
