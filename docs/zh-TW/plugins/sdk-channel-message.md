---
summary: 重新導向至 /plugins/sdk-channel-outbound
title: 通道訊息 API
x-i18n:
    generated_at: "2026-07-05T11:32:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

此頁面已移至[通道外送 API](/zh-TW/plugins/sdk-channel-outbound)。

`openclaw/plugin-sdk/channel-message` 和
`openclaw/plugin-sdk/channel-message-runtime` 仍是為舊版外掛保留的已棄用相容性
子路徑；兩者都是共享通道
訊息核心上的薄別名。新的通道外掛應使用
`openclaw/plugin-sdk/channel-outbound` 來取得訊息生命週期、收據、
耐久傳送與即時預覽輔助工具，而不是向
已棄用的子路徑新增輔助工具。

移除計畫：在外部外掛遷移
期間保留這些別名，然後在呼叫端都
移至 `channel-outbound` 後，於下一次主要 SDK 清理中移除它們。
