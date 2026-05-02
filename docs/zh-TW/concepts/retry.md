---
read_when:
    - 更新提供者的重試行為或預設值
    - 偵錯提供者傳送錯誤或速率限制
summary: 對外供應商呼叫的重試政策
title: 重試政策
x-i18n:
    generated_at: "2026-05-02T02:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 依每個 HTTP 請求重試，而不是依多步驟流程重試。
- 只重試目前步驟，以保留順序。
- 避免重複執行非冪等操作。

## 預設值

- 嘗試次數：3
- 最大延遲上限：30000 ms
- 抖動：0.1（10 percent）
- 供應商預設值：
  - Telegram 最小延遲：400 ms
  - Discord 最小延遲：500 ms

## 行為

### 模型供應商

- OpenClaw 讓供應商 SDK 處理一般的短暫重試。
- 對於以 Stainless 為基礎的 SDK，例如 Anthropic 和 OpenAI，可重試的回應
  (`408`, `409`, `429`, and `5xx`) 可以包含 `retry-after-ms` 或
  `retry-after`。當該等待時間超過 60 秒時，OpenClaw 會注入
  `x-should-retry: false`，讓 SDK 立即呈現錯誤，且模型
  容錯移轉可以輪替到另一個驗證設定檔或備援模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆寫上限。
  將其設為 `0`, `false`, `off`, `none`, 或 `disabled`，即可讓 SDK 在內部遵循較長的
  `Retry-After` 休眠。

### Discord

- 會針對速率限制錯誤（HTTP 429）、請求逾時、HTTP 5xx 回應，
  以及暫時性傳輸失敗（例如 DNS 查詢失敗、連線
  重設、socket 關閉和 fetch 失敗）重試。
- 有 Discord `retry_after` 時使用它，否則使用指數退避。

### Telegram

- 會針對暫時性錯誤（429、逾時、connect/reset/closed、暫時無法使用）重試。
- 有 `retry_after` 時使用它，否則使用指數退避。
- Markdown 剖析錯誤不會重試；它們會回退為純文字。

## 設定

在 `~/.openclaw/openclaw.json` 中依供應商設定重試政策：

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

## 注意事項

- 重試適用於每個請求（訊息傳送、媒體上傳、反應、投票、貼圖）。
- 複合流程不會重試已完成的步驟。

## 相關

- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [命令佇列](/zh-TW/concepts/queue)
