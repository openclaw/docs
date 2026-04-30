---
read_when:
    - 更新提供者重試行為或預設值
    - 偵錯提供者傳送錯誤或速率限制
summary: 對外部提供者呼叫的重試政策
title: 重試政策
x-i18n:
    generated_at: "2026-04-30T03:02:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 16
---

## 目標

- 依每個 HTTP 請求重試，而不是依多步驟流程重試。
- 僅重試目前步驟，以保留順序。
- 避免重複執行非冪等操作。

## 預設值

- 嘗試次數：3
- 最大延遲上限：30000 ms
- 抖動：0.1（10%）
- 提供者預設值：
  - Telegram 最小延遲：400 ms
  - Discord 最小延遲：500 ms

## 行為

### 模型提供者

- OpenClaw 讓提供者 SDK 處理一般的短暫重試。
- 對於 Anthropic 和 OpenAI 這類以 Stainless 為基礎的 SDK，可重試的回應
  （`408`、`409`、`429` 和 `5xx`）可以包含 `retry-after-ms` 或
  `retry-after`。當等待時間超過 60 秒時，OpenClaw 會注入
  `x-should-retry: false`，讓 SDK 立即拋出錯誤，並讓模型
  容錯移轉可以輪換到另一個驗證設定檔或備用模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆寫上限。
  將它設為 `0`、`false`、`off`、`none` 或 `disabled`，即可讓 SDK 在內部遵循較長的
  `Retry-After` 休眠。

### Discord

- 只在速率限制錯誤（HTTP 429）時重試。
- 有 Discord `retry_after` 時使用它，否則使用指數退避。

### Telegram

- 在暫時性錯誤（429、逾時、連線/重設/關閉、暫時無法使用）時重試。
- 有 `retry_after` 時使用它，否則使用指數退避。
- Markdown 剖析錯誤不會重試；它們會退回純文字。

## 設定

在 `~/.openclaw/openclaw.json` 中為每個提供者設定重試原則：

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

- 重試會依每個請求套用（傳送訊息、上傳媒體、反應、投票、貼圖）。
- 複合流程不會重試已完成的步驟。

## 相關

- [模型容錯移轉](/zh-TW/concepts/model-failover)
- [命令佇列](/zh-TW/concepts/queue)
