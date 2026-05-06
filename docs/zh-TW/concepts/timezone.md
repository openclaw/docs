---
read_when:
    - 你需要一個快速掌握時區處理的心智模型
    - 您正在決定要在哪裡設定或覆寫時區
summary: OpenClaw 中出現時區的位置 — 封套、工具酬載、系統提示
title: 時區
x-i18n:
    generated_at: "2026-05-06T02:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 會標準化時間戳記，讓模型看到的是**單一參考時間**，而不是混雜各提供者本地時鐘。時區會出現在三個介面，各自有不同用途：

## 三個時區介面

| 介面              | 顯示內容                                                                                                | 預設值                                | 設定方式                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| 訊息封套          | 包裝傳入的頻道訊息：`[Signal +1555 2026-01-18 00:19 PST] hello`                                        | 主機本機                              | `agents.defaults.envelopeTimezone`                      |
| 工具承載資料      | 頻道 `readMessages` 類型工具會回傳原始提供者時間 + 正規化的 `timestampMs` / `timestampUtc`             | UTC 欄位一律存在                      | 不可設定 — 保留提供者原生時間戳記                      |
| 系統提示          | 一小段含有**僅時區**的 `Current Date & Time` 區塊（不含時鐘值，以維持快取穩定性）                      | 若未設定 `userTimezone`，使用主機時區 | `agents.defaults.userTimezone`                          |

系統提示會刻意省略即時時鐘，以保持各回合之間的提示快取穩定。當代理需要目前時間時，會呼叫 `session_status`。

## 設定使用者時區

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

如果未設定 `userTimezone`，OpenClaw 會在執行階段解析主機時區（不寫入設定）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）會控制封套和下游介面的 12 小時制/24 小時制呈現方式，不影響系統提示區段。

## 何時覆寫

- 當你想在不同地區的主機之間取得穩定時間戳記，或想讓 UTC 對齊的日誌符合診斷輸出時，請**使用 UTC 封套**（`envelopeTimezone: "utc"`）。
- 當 Gateway 主機位於某個時區，但使用者位於另一個時區，且你希望封套無論主機如何遷移都以使用者的時區閱讀時，請**使用固定 IANA 時區**（例如 `"Europe/Vienna"`）。
- 當時間戳記脈絡對對話沒有幫助，且你想使用低 Token 封套時，請**設定 `envelopeTimestamp: "off"`**。

如需完整行為參考、各提供者範例，以及經過時間格式化，請參閱[日期與時間](/zh-TW/date-time)。

## 相關內容

- [日期與時間](/zh-TW/date-time) — 完整的封套/工具/提示行為與範例。
- [Heartbeat](/zh-TW/gateway/heartbeat) — 啟用時段會使用時區進行排程。
- [Cron 作業](/zh-TW/automation/cron-jobs) — Cron 運算式會使用時區進行排程。
