---
read_when:
    - 更改 Control UI 中的智能体输出渲染
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频展示指令
summary: 用于嵌入、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-27T11:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

智能体输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频展示提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

远程 `MEDIA:` 附件必须是公开的 `https:` URL。普通 `http:`、
loopback、链路本地、私有和内部主机名会被忽略，不会作为附件
指令处理；服务端媒体抓取器仍会执行各自的网络保护措施。

普通 Markdown 图片语法默认仍作为文本处理。只有那些明确选择将 Markdown 图片回复映射为媒体附件的渠道，才会在其出站适配器中启用该行为；Telegram 就是这样，因此 `![alt](url)` 仍然可以变成媒体回复。

这些指令彼此独立。`MEDIA:` 和 reply/voice 标签仍然属于投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。
受信任的工具结果媒体在投递前也使用同一套 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此文本工具输出仍可将音频附件标记为语音消息。

启用分块流式传输后，`MEDIA:` 仍然是单轮次的单次投递元数据。
如果同一个媒体 URL 已在流式块中发送，随后又在最终智能体负载中重复出现，
OpenClaw 只会投递一次该附件，并从最终负载中移除重复项。

## `[embed ...]`

`[embed ...]` 是唯一面向智能体的 Control UI 富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再是新输出的有效语法。
- Embed 短代码只会在智能体消息区域中渲染。
- 仅渲染基于 URL 的 embed。请使用 `ref="..."` 或 `url="..."`。
- 块形式的内联 HTML embed 短代码不会被渲染。
- Web UI 会从可见文本中去掉该短代码，并以内联方式渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

## 存储后的渲染结构

规范化/存储后的智能体内容块是结构化的 `canvas` 项：

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
