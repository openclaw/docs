---
summary: 重定向到 /plugins/sdk-channel-outbound
title: 频道消息 API
x-i18n:
    generated_at: "2026-07-11T20:50:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此页面已移至[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是供旧版插件使用的已弃用兼容
子路径；二者都是共享频道消息核心的轻量别名。新的渠道插件应使用
`openclaw/plugin-sdk/channel-outbound` 提供的消息生命周期、回执、
持久发送和实时预览辅助函数，而不是向已弃用的子路径添加新的辅助函数。

移除计划：在外部插件迁移窗口期间保留这些别名，待调用方迁移至
`channel-outbound` 后，在下一次 SDK 重大清理中将其移除。
