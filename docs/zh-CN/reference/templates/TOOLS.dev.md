---
read_when:
    - 使用开发 Gateway 网关模板
    - 更新默认开发智能体身份
summary: 开发智能体工具说明（C-3PO）
title: TOOLS.dev 模板
x-i18n:
    generated_at: "2026-07-05T11:41:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3259107a9252ff3d01b98608e6005387cb54a75da5db64f833c945056abd4173
    source_path: reference/templates/TOOLS.dev.md
    workflow: 16
---

# TOOLS.md - 用户工具说明（可编辑）

此文件用于记录关于外部工具和约定的_你的_说明。它不定义哪些工具存在；OpenClaw 会在内部提供内置工具，Skills 会添加其余工具。

## 示例

### imsg

- 发送 iMessage/SMS：描述收件人和内容，发送前确认。
- 优先使用短消息；避免发送机密信息。

### sag

- 文本转语音：指定语音、目标扬声器/房间，以及是否流式传输。

添加你希望助手了解的任何其他本地工具链信息。

## 相关

- [TOOLS.md 模板](/zh-CN/reference/templates/TOOLS)
