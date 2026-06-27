---
read_when:
    - 你正在變更時間戳記向模型或使用者顯示的方式
    - 您正在偵錯訊息或系統提示輸出中的時間格式
summary: 跨封套、提示、工具與連接器的日期和時間處理
title: 日期與時間
x-i18n:
    generated_at: "2026-06-27T19:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw 預設使用**主機本地時間作為傳輸時間戳**，且**僅在系統提示中使用使用者時區**。
供應商時間戳會被保留，讓工具維持其原生語意（目前時間可透過 `session_status` 取得）。

## 訊息封套（預設為本地）

傳入訊息會以時間戳包裝（秒精度）：

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

不論供應商時區為何，此封套時間戳**預設為主機本地時間**。

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
- 使用明確的 IANA 時區（例如 `"America/Chicago"`）作為固定時區。
- `envelopeTimestamp: "off"` 會從封套標頭、直接代理提示前綴，以及內嵌模型輸入前綴中移除絕對時間戳。
- `envelopeElapsed: "off"` 會移除經過時間後綴（`+2m` 樣式）。

### 範例

**本地（預設）：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**使用者時區：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**已啟用經過時間：**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 系統提示：目前日期與時間

如果已知使用者時區，系統提示會包含專用的
**目前日期與時間**區段，且**僅包含時區**（不包含時鐘/時間格式），
以維持提示快取穩定：

```
Time zone: America/Chicago
```

當代理需要目前時間時，請使用 `session_status` 工具；狀態卡
會包含時間戳列。

## 系統事件列（預設為本地）

插入代理上下文的佇列系統事件會加上時間戳前綴，使用與訊息封套
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

- `userTimezone` 設定提示上下文的**使用者本地時區**。
- `timeFormat` 控制提示中的 **12 小時制/24 小時制顯示**。`auto` 會遵循 OS 偏好設定。

## 時間格式偵測（自動）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查 OS 偏好設定（macOS/Windows），
並退回使用地區設定格式。偵測到的值會**依程序快取**，
以避免重複系統呼叫。

## 工具承載資料 + 連接器（原始供應商時間 + 正規化欄位）

通道工具會傳回**供應商原生時間戳**，並新增正規化欄位以維持一致性：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

原始供應商欄位會被保留，確保不會遺失任何內容。

- Slack：來自 API、類似 epoch 的字串
- Discord：UTC ISO 時間戳
- Telegram/WhatsApp：供應商特定的數值/ISO 時間戳

如果你需要本地時間，請在下游使用已知時區轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
