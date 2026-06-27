---
summary: 重定向到 /plugins/sdk-channel-outbound
title: 频道消息 API
x-i18n:
    generated_at: "2026-06-27T02:53:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此页面已迁移到 [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是面向旧插件的已弃用兼容性
子路径。新的渠道插件应使用
`openclaw/plugin-sdk/channel-outbound` 来获取消息生命周期、回执、持久化
发送和实时预览辅助能力。已弃用的子路径只是共享渠道消息核心以及聚焦的入站/出站 SDK 表面的轻量别名；
不要在那里添加新的辅助函数。

移除计划：在外部插件迁移窗口期间保留这些别名，
然后在调用方迁移到 `channel-outbound` 后的下一个主要 SDK 清理中移除它们。
