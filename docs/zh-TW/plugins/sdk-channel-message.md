---
summary: 重新導向至 /plugins/sdk-channel-outbound
title: 頻道訊息 API
x-i18n:
    generated_at: "2026-06-27T19:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此頁面已移至 [Channel 傳出 API](/zh-TW/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是供舊版外掛使用的已棄用相容性子路徑。新的頻道外掛應使用
`openclaw/plugin-sdk/channel-outbound` 取得訊息生命週期、回執、持久化傳送和即時預覽輔助工具。已棄用的子路徑只是共享頻道訊息核心以及聚焦的傳入/傳出 SDK 介面的輕量別名；請勿在其中新增輔助工具。

移除計畫：在外部外掛遷移期間保留這些別名，等呼叫端移至
`channel-outbound` 後，再於下一次主要 SDK 清理中移除。
