---
read_when:
    - 你需要一個快速理解時區處理方式的心智模型
    - 你正在決定要在哪裡設定或覆寫時區
summary: OpenClaw 中出現時區的位置 — 封包、工具酬載、系統提示詞
title: 時區
x-i18n:
    generated_at: "2026-06-27T19:15:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 會標準化時間戳記，讓模型看到的是**單一參考時間**，而不是混雜各提供者本機時鐘的時間。時區會出現在三個表面，各有其用途：

## 三個時區表面

| 表面              | 顯示內容                                                                                                | 預設值                                | 設定方式                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| 訊息信封          | 包裝傳入的頻道訊息：`[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                  | 主機本機                              | `agents.defaults.envelopeTimezone`                      |
| 工具酬載          | 頻道 `readMessages` 風格的工具會回傳原始提供者時間 + 正規化的 `timestampMs` / `timestampUtc`            | UTC 欄位一律存在                      | 不可設定 — 保留提供者原生時間戳記                       |
| 系統提示詞        | 一小段 `Current Date & Time` 區塊，且**只有時區**（沒有時鐘值，以維持快取穩定性）                       | 若未設定 `userTimezone` 則使用主機時區 | `agents.defaults.userTimezone`                          |

系統提示詞刻意省略即時時鐘，以讓提示詞快取在各輪對話間保持穩定。當代理需要目前時間時，會呼叫 `session_status`。

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

如果未設定 `userTimezone`，OpenClaw 會在執行階段解析主機時區（不寫入設定）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制信封與下游表面的 12 小時制/24 小時制呈現方式，不影響系統提示詞區段。

## 何時覆寫

- **使用 UTC 信封**（`envelopeTimezone: "utc"`）：當你希望不同地區的主機之間有穩定時間戳記，或希望與 UTC 對齊的記錄能符合診斷輸出時使用。
- **使用固定 IANA 時區**（例如 `"Europe/Vienna"`）：當閘道主機位於某個時區、但使用者位於另一個時區，且你希望信封不受主機遷移影響、一律以使用者時區顯示時使用。
- **設定 `envelopeTimestamp: "off"`**：當時間戳記脈絡對對話沒有幫助時使用。這會從信封、直接代理提示詞前綴，以及嵌入式模型輸入前綴中移除絕對時間戳記。

如需完整行為參考、各提供者範例，以及經過時間格式化方式，請參閱 [日期與時間](/zh-TW/date-time)。

## 相關

- [日期與時間](/zh-TW/date-time) — 完整的信封/工具/提示詞行為與範例。
- [心跳偵測](/zh-TW/gateway/heartbeat) — 活動時段會使用時區進行排程。
- [排程工作](/zh-TW/automation/cron-jobs) — cron 表達式會使用時區進行排程。
