---
read_when:
    - 你正在變更時間戳記向模型或使用者顯示的方式
    - 您正在偵錯訊息或系統提示輸出中的時間格式設定
summary: 跨封套、提示詞、工具與連接器的日期與時間處理
title: 日期與時間
x-i18n:
    generated_at: "2026-04-30T03:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 16
---

# 日期與時間

OpenClaw 預設使用**主機本地時間作為傳輸時間戳**，並且**只在系統提示中使用使用者時區**。
系統會保留提供者時間戳，讓工具維持其原生語義（目前時間可透過 `session_status` 取得）。

## 訊息信封（預設為本地）

傳入訊息會以時間戳（精確到分鐘）包裝：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

無論提供者時區為何，這個信封時間戳**預設為主機本地時間**。

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
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（若未設定則退回主機時區）。
- 使用明確的 IANA 時區（例如 `"America/Chicago"`）作為固定時區。
- `envelopeTimestamp: "off"` 會從信封標頭移除絕對時間戳。
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

如果使用者時區已知，系統提示會包含專用的
**目前日期與時間**區段，且只包含**時區**（不含時鐘/時間格式），
以保持提示快取穩定：

```
Time zone: America/Chicago
```

當代理需要目前時間時，請使用 `session_status` 工具；狀態
卡片會包含一行時間戳。

## 系統事件行（預設為本地）

插入代理內容中的佇列系統事件會加上時間戳前綴，使用與訊息信封相同的
時區選擇（預設：主機本地）。

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

- `userTimezone` 會為提示內容設定**使用者本地時區**。
- `timeFormat` 會控制提示中的 **12 小時/24 小時顯示**。`auto` 會遵循 OS 偏好設定。

## 時間格式偵測（自動）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查 OS 偏好設定（macOS/Windows）
並退回使用語言環境格式。偵測到的值會**依處理程序快取**，
以避免重複的系統呼叫。

## 工具酬載與連接器（原始提供者時間與標準化欄位）

頻道工具會回傳**提供者原生時間戳**，並加入標準化欄位以維持一致性：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

原始提供者欄位會保留，因此不會遺失任何資訊。

- Slack：來自 API 的類 epoch 字串
- Discord：UTC ISO 時間戳
- Telegram/WhatsApp：提供者特定的數字/ISO 時間戳

如果你需要本地時間，請使用已知時區在下游轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
