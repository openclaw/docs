---
read_when:
    - 您正在變更時間戳記顯示給模型或使用者的方式
    - 你正在偵錯訊息或系統提示輸出中的時間格式。
summary: 跨信封、提示、工具與連接器的日期與時間處理
title: 日期與時間
x-i18n:
    generated_at: "2026-07-05T11:17:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw 使用**主機本機時間作為傳輸時間戳記**，並且只在系統提示中放入**時區**。
提供者時間戳記會保留下來，讓工具維持其原生語意。當代理需要目前
時間時，會執行 `session_status` 工具。

## 訊息信封（預設為本機）

傳入訊息會以星期加上精確到秒的時間戳記包裝：

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

無論提供者時區為何，信封時間戳記**預設為主機本機時間**。
可在 `agents.defaults` 下覆寫：

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

| 鍵                  | 值                                                   | 行為                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local`（預設）、`utc`、`user`、明確的 IANA 名稱     | `user` 使用 `agents.defaults.userTimezone`（未設定時為主機時區）。明確的 IANA 名稱（例如 `"America/Chicago"`）會固定到指定時區；無法辨識的名稱會退回 UTC。 |
| `envelopeTimestamp` | `on`（預設）、`off`                                  | `off` 會移除信封標頭、直接代理提示前綴，以及嵌入式模型輸入前綴中的絕對時間戳記。                                                       |
| `envelopeElapsed`   | `on`（預設）、`off`                                  | `off` 會移除工作階段中自上一則訊息以來顯示的經過時間尾碼（`+30s` / `+2m` 樣式）。                                                               |

### 範例

**本機（預設）：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**使用者時區：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**搭配 `envelopeTimezone: "utc"` 的經過時間：**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 系統提示：目前日期與時間

系統提示包含 **Current Date & Time** 區段，其中**只包含時區**
（不包含時鐘或時間格式），讓提示快取保持穩定：

```
Time zone: America/Chicago
```

設定時，時區會使用 `agents.defaults.userTimezone`，否則使用主機時區。
提示也會指示代理在需要目前日期、時間或星期幾時，執行
`session_status` 工具。

## 系統事件行（預設為本機）

插入代理上下文的佇列系統事件，會使用與訊息信封相同的
`envelopeTimezone` 選擇作為時間戳記前綴（預設：主機本機）。

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

- `userTimezone` 會設定提示上下文的**使用者本機時區**（也用於 `envelopeTimezone: "user"`）。
- `timeFormat` 會控制面向提示的時間中的 **12 小時制/24 小時制顯示**。`auto` 會遵循作業系統偏好設定。

## 時間格式偵測（自動）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查作業系統偏好設定（macOS 和 Windows）
並退回使用地區設定格式。偵測到的值會**按程序快取**，
以避免重複的系統呼叫。

## 工具承載資料 + 連接器（原始提供者時間 + 正規化欄位）

頻道工具會傳回**提供者原生時間戳記**，並加入正規化欄位以保持一致：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

原始提供者欄位會保留下來，因此不會遺失任何內容。

- Discord：UTC ISO 時間戳記
- Slack：來自 API 的類 epoch 字串
- Telegram/WhatsApp：提供者特定的數值/ISO 時間戳記

如果需要本機時間，請使用已知時區在下游轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
