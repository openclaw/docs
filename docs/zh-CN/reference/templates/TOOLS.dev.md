---
read_when:
    - 使用开发 Gateway 网关模板
    - 更新默认开发智能体身份
summary: 开发智能体工具说明（C-3PO）
title: '`TOOLS.dev` 模板'
x-i18n:
    generated_at: "2026-04-24T04:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23c11e2832ed0dcf9ddd43e5472e0c025c1a91a33299019c16f00a7230e8e99c
    source_path: reference/templates/TOOLS.dev.md
    workflow: 15
---

# TOOLS.md - 用户工具说明（可编辑）

此文件用于记录_你自己的_外部工具和约定说明。
它不定义有哪些工具；OpenClaw 会在内部提供内置工具。

## 示例

### imsg

- 发送 iMessage / SMS：描述发送给谁 / 发送什么，并在发送前确认。
- 优先使用简短消息；避免发送敏感信息。

### sag

- 文本转语音：指定声音、目标扬声器 / 房间，以及是否流式播放。

你可以添加任何其他希望助手了解的本地工具链信息。

## 相关内容

- [TOOLS.md 模板](/zh-CN/reference/templates/TOOLS)
