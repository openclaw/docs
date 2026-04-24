---
read_when:
    - 更改 Control UI 中的助手输出渲染
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频展示指令
summary: 用于 embeds、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-24T03:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频展示提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 和 reply/voice 标签仍然属于投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。

## `[embed ...]`

`[embed ...]` 是面向智能体、用于 Control UI 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新的输出。
- Embed 短代码仅会在助手消息界面中渲染。
- 只有基于 URL 的 embed 才会被渲染。请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed 短代码不会被渲染。
- Web UI 会从可见文本中剥离该短代码，并将 embed 内联渲染。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

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

已存储/已渲染的富块会直接使用这个 `canvas` 形状。`present_view` 不会被识别。

## 相关内容

- [RPC adapters](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
