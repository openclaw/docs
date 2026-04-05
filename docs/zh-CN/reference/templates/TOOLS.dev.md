---
read_when:
    - 使用开发 Gateway 网关模板时
    - 更新默认开发智能体身份时
summary: 开发智能体工具备注（C-3PO）
title: TOOLS.dev 模板
x-i18n:
    generated_at: "2026-04-05T10:08:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a7fb38aad160335dec5a5ceb9d71ec542c21a06794ae3e861fa562db7abe69d
    source_path: reference/templates/TOOLS.dev.md
    workflow: 15
---

# TOOLS.md - 用户工具备注（可编辑）

此文件用于记录_你自己的_外部工具和约定备注。
它并不定义有哪些工具；OpenClaw 会在内部提供内置工具。

## 示例

### imsg

- 发送 iMessage/SMS：说明发给谁/发送什么，并在发送前确认。
- 优先发送简短消息；避免发送密钥。

### sag

- 文本转语音：请指定语音、目标扬声器/房间，以及是否流式播放。

你也可以添加任何其他希望助手了解的本地工具链信息。
