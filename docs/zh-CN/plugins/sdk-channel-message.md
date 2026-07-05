---
summary: 重定向到 /plugins/sdk-channel-outbound
title: 频道消息 API
x-i18n:
    generated_at: "2026-07-05T11:32:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此页面已移至 [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是面向旧版插件的已弃用兼容性
子路径；两者都是共享渠道消息核心之上的轻量别名。新的渠道插件应使用
`openclaw/plugin-sdk/channel-outbound` 来获取消息生命周期、回执、
持久发送和实时预览辅助工具，而不是向已弃用的子路径添加新的辅助工具。

移除计划：在外部插件迁移窗口期间保留这些别名，然后在调用方迁移到
`channel-outbound` 后的下一次 SDK 重大清理中移除它们。
