---
summary: 重新導向至 /plugins/sdk-channel-outbound
title: 頻道訊息 API
x-i18n:
    generated_at: "2026-07-11T21:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此頁面已移至[頻道傳出 API](/zh-TW/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是供舊版外掛使用的已棄用相容
子路徑；兩者都是共用頻道訊息核心的輕量別名。新的頻道外掛應使用
`openclaw/plugin-sdk/channel-outbound` 提供的訊息生命週期、收執、
持久化傳送與即時預覽輔助功能，而非在已棄用的子路徑中新增輔助功能。

移除計畫：在外部外掛遷移期間保留這些別名，待呼叫端皆已遷移至
`channel-outbound` 後，於下一次主要 SDK 清理時將其移除。
