---
read_when:
    - 你正在變更時間戳記顯示給模型或使用者的方式
    - 您正在偵錯訊息或系統提示輸出中的時間格式化
summary: 封套、提示、工具與連接器中的日期與時間處理
title: 日期和時間
x-i18n:
    generated_at: "2026-05-06T09:08:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw 預設對**傳輸時間戳記使用主機本地時間**，並且**僅在系統提示中使用使用者時區**。
系統會保留提供者時間戳記，讓工具維持其原生語意（目前時間可透過 `session_status` 取得）。

## 訊息封套（預設為本地）

傳入訊息會以時間戳記包裝（精確到分鐘）：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

無論提供者時區為何，這個封套時間戳記**預設為主機本地時間**。

你可以覆寫此行為：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "local"` 使用主機時區。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（退回使用主機時區）。
- 使用明確的 IANA 時區（例如 `"America/Chicago"`）來指定固定時區。
- `envelopeTimestamp: "off"` 會從封套標頭移除絕對時間戳記。
- `envelopeElapsed: "off"` 會移除經過時間後綴（`+2m` 樣式）。

### 範例

**本地（預設）：**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**使用者時區：**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**已啟用經過時間：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系統提示：目前日期與時間

如果已知使用者時區，系統提示會包含專用的
**目前日期與時間**區段，且**僅包含時區**（不包含時鐘/時間格式），
以保持提示快取穩定：

```
Time zone: America/Chicago
```

當代理需要目前時間時，請使用 `session_status` 工具；狀態
卡片會包含一行時間戳記。

## 系統事件行（預設為本地）

插入代理內容中的佇列系統事件會加上時間戳記前綴，並使用與訊息封套
相同的時區選擇（預設：主機本地）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 設定使用者時區 + 格式

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` 會設定提示內容中的**使用者本地時區**。
- `timeFormat` 控制提示中的 **12 小時/24 小時顯示**。`auto` 會遵循作業系統偏好設定。

## 時間格式偵測（auto）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查作業系統偏好設定（macOS/Windows），
並退回使用地區格式。偵測到的值會**依處理程序快取**，
以避免重複系統呼叫。

## 工具酬載 + 連接器（原始提供者時間 + 正規化欄位）

通道工具會傳回**提供者原生時間戳記**，並加入正規化欄位以保持一致性：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

系統會保留原始提供者欄位，因此不會遺失任何內容。

- Slack：來自 API 的類 epoch 字串
- Discord：UTC ISO 時間戳記
- Telegram/WhatsApp：提供者特定的數值/ISO 時間戳記

如果你需要本地時間，請使用已知時區在下游進行轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
