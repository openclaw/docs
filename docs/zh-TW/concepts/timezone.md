---
read_when:
    - 你想要一個快速理解時區處理的心智模型
    - 您正在決定要在哪裡設定或覆寫時區
summary: OpenClaw 中時區出現的位置 — 信封、工具承載資料、系統提示
title: 時區
x-i18n:
    generated_at: "2026-07-05T11:15:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 會標準化時間戳記，讓模型看到的是**單一參考時間**，而不是混雜的提供者本地時鐘。三個介面會顯示時區，各自有不同用途：

## 三個時區介面

| 介面              | 顯示內容                                                                                                   | 預設值                                | 設定方式                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| 訊息封套          | 包裝傳入的通道訊息：`[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                     | 主機本地                              | `agents.defaults.envelopeTimezone`                     |
| 工具承載資料      | 通道的 `readMessages` 類工具會回傳原始提供者時間，以及正規化的 `timestampMs` / `timestampUtc`              | UTC 欄位一律存在                      | 無法設定；保留提供者原生時間戳記                       |
| 系統提示詞        | 一小段 `Current Date & Time` 區塊，只包含**時區**（沒有時鐘值，以維持快取穩定）                            | 若未設定 `userTimezone`，則使用主機時區 | `agents.defaults.userTimezone`                         |

系統提示詞會刻意省略即時時鐘，以維持各輪之間的提示詞快取穩定。當代理需要目前時間時，會呼叫 `session_status`。

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

如果未設定 `userTimezone`，OpenClaw 會在執行階段透過 `Intl.DateTimeFormat().resolvedOptions().timeZone` 解析主機時區（不寫入設定）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制封套與下游介面的 12 小時制/24 小時制呈現方式，不影響系統提示詞區段。

## 封套時區值

`agents.defaults.envelopeTimezone` 接受：

- `"local"`（預設）或 `"host"` - 主機的時區。
- `"utc"` 或 `"gmt"` - UTC。
- `"user"` - 已解析的 `agents.defaults.userTimezone`（若未設定，則退回主機時區）。
- 任何明確的 IANA 時區字串，例如 `"Europe/Vienna"`。

## 何時覆寫

- **使用 `"utc"`**，讓不同地區主機之間的時間戳記保持穩定，或符合 UTC 對齊的診斷/記錄輸出。
- **使用 `"user"`**，讓封套無論閘道主機在哪個時區執行，都與設定的使用者時區保持一致。
- **使用固定的 IANA 時區**，當閘道主機位於某個時區，但封套無論主機遷移與否都應一律以另一個時區顯示時。
- **設定 `envelopeTimestamp: "off"`**，當時間戳記脈絡對對話沒有幫助時使用。這會從封套、直接代理提示詞前綴，以及內嵌模型輸入前綴中移除絕對時間戳記。

如需完整行為參考、各提供者範例，以及經過時間格式，請參閱[日期與時間](/zh-TW/date-time)。

## 相關

- [日期與時間](/zh-TW/date-time) - 完整的封套/工具/提示詞行為與範例。
- [心跳偵測](/zh-TW/gateway/heartbeat) - 活動時段會使用時區進行排程。
- [排程作業](/zh-TW/automation/cron-jobs) - cron 表達式會使用時區進行排程。
