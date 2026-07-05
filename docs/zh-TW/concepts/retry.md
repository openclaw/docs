---
read_when:
    - 更新提供者重試行為或預設值
    - 偵錯提供者傳送錯誤或速率限制
summary: 對外提供者呼叫的重試政策
title: 重試政策
x-i18n:
    generated_at: "2026-07-05T11:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 依每個 HTTP 請求重試，而不是依每個多步驟流程重試。
- 只重試目前步驟，以保留順序。
- 避免重複非冪等操作。

## 預設值

| 設定               | 預設值    |
| ------------------ | --------- |
| 嘗試次數           | 3         |
| 最大延遲上限       | 30000 ms  |
| 抖動               | 0.1 (10%) |
| Telegram 最小延遲 | 400 ms    |
| Discord 最小延遲  | 500 ms    |

## 行為

### 模型供應商

- OpenClaw 讓供應商 SDK 處理一般短暫重試。
- 對於 Anthropic 和 OpenAI 等以 Stainless 為基礎的 SDK，可重試的回應（`408`、`409`、`429` 和 `5xx`）可以包含 `retry-after-ms` 或 `retry-after`。當該等待時間超過 60 秒時，OpenClaw 會注入 `x-should-retry: false`，讓 SDK 立即浮出錯誤，模型容錯移轉即可輪替到另一個驗證設定檔或備援模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆寫上限。將它設為 `0`、`false`、`off`、`none` 或 `disabled`，即可讓 SDK 在內部遵循較長的 `Retry-After` 休眠。

### Discord

- 對速率限制錯誤（HTTP 429）、請求逾時、HTTP 5xx 回應，以及 DNS 查詢失敗、連線重設、通訊端關閉和擷取失敗等暫時性傳輸失敗進行重試。
- 可用時使用 Discord `retry_after`，否則使用指數退避。

### Telegram

- 對暫時性錯誤（429、逾時、連線/重設/關閉、暫時無法使用）進行重試。
- 可用時使用 `retry_after`，否則使用指數退避。
- HTML/Markdown 剖析錯誤不會重試；它們會在第一次嘗試時退回純文字。

## 設定

在 `~/.openclaw/openclaw.json` 中依每個供應商設定重試政策：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 備註

- 重試會套用於每個請求（訊息傳送、媒體上傳、回應、投票、貼圖）。
- 複合流程不會重試已完成的步驟。

## 相關

- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [命令佇列](/zh-TW/concepts/queue)
