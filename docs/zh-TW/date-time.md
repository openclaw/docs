---
read_when:
    - 你正在變更時間戳記呈現給模型或使用者的方式
    - 你正在偵錯訊息或系統提示輸出中的時間格式
summary: 跨封套、提示詞、工具與連接器的日期和時間處理
title: 日期與時間
x-i18n:
    generated_at: "2026-05-06T02:47:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2d273da97a4dfc4218cfa945eeea8a9bae1b046b1c0d4eba5e279bff5d2eba0
    source_path: date-time.md
    workflow: 16
---

# 日期與時間

OpenClaw 預設對**傳輸時間戳使用主機本地時間**，並且**只在系統提示中使用使用者時區**。
供應商時間戳會被保留，因此工具會維持其原生語意（目前時間可透過 `session_status` 取得）。

## 訊息封套（預設為本地）

傳入訊息會以時間戳包裝（精確到分鐘）：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

無論供應商時區為何，這個封套時間戳**預設為主機本地時間**。

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
- `envelopeTimestamp: "off"` 會從封套標頭移除絕對時間戳。
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

**啟用經過時間：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系統提示：目前日期與時間

如果使用者時區已知，系統提示會包含專用的
**目前日期與時間**區段，且**只包含時區**（不含時鐘/時間格式），
以保持提示快取穩定：

```
Time zone: America/Chicago
```

當代理程式需要目前時間時，請使用 `session_status` 工具；狀態卡
會包含一行時間戳。

## 系統事件行（預設為本地）

插入代理程式內容中的佇列系統事件，會加上使用與訊息封套相同時區選擇的時間戳前綴（預設：主機本地）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 設定使用者時區與格式

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

- `userTimezone` 會設定提示內容使用的**使用者本地時區**。
- `timeFormat` 控制提示中的 **12 小時制/24 小時制顯示**。`auto` 會遵循作業系統偏好設定。

## 時間格式偵測（auto）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查作業系統偏好設定（macOS/Windows），
並退回使用地區格式。偵測到的值會**按程序快取**，
以避免重複系統呼叫。

## 工具承載資料與連接器（原始供應商時間與正規化欄位）

通道工具會回傳**供應商原生時間戳**，並加入正規化欄位以保持一致性：

- `timestampMs`：紀元毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

原始供應商欄位會被保留，因此不會遺失任何內容。

- Slack：來自 API 的類紀元字串
- Discord：UTC ISO 時間戳
- Telegram/WhatsApp：供應商特定的數值/ISO 時間戳

如果你需要本地時間，請使用已知時區在下游轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
