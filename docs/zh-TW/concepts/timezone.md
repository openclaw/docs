---
read_when:
    - 你想快速掌握時區處理的概念模型
    - 您正在決定要在哪裡設定或覆寫時區
summary: 時區在 OpenClaw 中的出現位置——信封、工具酬載、系統提示詞
title: 時區
x-i18n:
    generated_at: "2026-07-11T21:18:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 會將時間戳記標準化，讓模型看到**單一參照時間**，而不是混合各提供者的本地時鐘。共有三個介面會顯示時區，各有不同用途：

## 三種時區介面

| 介面 | 顯示內容 | 預設值 | 設定方式 |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| 訊息封裝 | 包裝傳入的頻道訊息：`[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello` | 主機本地時區 | `agents.defaults.envelopeTimezone` |
| 工具承載資料 | 頻道的 `readMessages` 類型工具會傳回原始提供者時間，以及標準化的 `timestampMs` / `timestampUtc` | 一律提供 UTC 欄位 | 無法設定；保留提供者原生時間戳記 |
| 系統提示詞 | 一個簡短的 `Current Date & Time` 區塊，**僅包含時區**（不含時鐘值，以維持快取穩定性） | 若未設定 `userTimezone`，則使用主機時區 | `agents.defaults.userTimezone` |

系統提示詞刻意省略即時時鐘，以維持各輪對話間的提示詞快取穩定。當代理程式需要目前時間時，會呼叫 `session_status`。

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

若未設定 `userTimezone`，OpenClaw 會在執行階段透過 `Intl.DateTimeFormat().resolvedOptions().timeZone` 解析主機時區（不寫入設定）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制訊息封裝及下游介面的 12 小時制／24 小時制顯示方式，但不影響系統提示詞區段。

## 訊息封裝時區值

`agents.defaults.envelopeTimezone` 接受：

- `"local"`（預設）或 `"host"`：主機的時區。
- `"utc"` 或 `"gmt"`：UTC。
- `"user"`：解析後的 `agents.defaults.userTimezone`（若未設定，則回退至主機時區）。
- 任何明確的 IANA 時區字串，例如 `"Europe/Vienna"`。

## 何時需要覆寫

- **使用 `"utc"`**：在不同地區的主機間保持時間戳記一致，或配合採用 UTC 的診斷／日誌輸出。
- **使用 `"user"`**：無論閘道主機在哪個時區執行，都讓訊息封裝與設定的使用者時區保持一致。
- **使用固定的 IANA 時區**：當閘道主機位於某個時區，但無論主機如何遷移，訊息封裝都應固定顯示另一個時區時。
- **設定 `envelopeTimestamp: "off"`**：當時間戳記脈絡對對話沒有幫助時。這會從訊息封裝、直接代理程式提示詞前綴，以及嵌入的模型輸入前綴中移除絕對時間戳記。

如需完整的行為參考、各提供者的範例，以及經過時間的格式設定，請參閱[日期與時間](/zh-TW/date-time)。

## 相關內容

- [日期與時間](/zh-TW/date-time)：完整的訊息封裝／工具／提示詞行為與範例。
- [心跳偵測](/zh-TW/gateway/heartbeat)：活動時段會使用時區進行排程。
- [排程工作](/zh-TW/automation/cron-jobs)：排程運算式會使用時區進行排程。
