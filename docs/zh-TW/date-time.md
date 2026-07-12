---
read_when:
    - 你正在變更時間戳記向模型或使用者顯示的方式
    - 你正在偵錯訊息或系統提示詞輸出中的時間格式
summary: 跨封裝、提示詞、工具與連接器的日期和時間處理
title: 日期與時間
x-i18n:
    generated_at: "2026-07-11T21:17:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw 對傳輸時間戳記使用**主機本機時間**，並且在系統提示中**只放入時區**。
系統會保留供應商的時間戳記，讓工具維持其原生語意。當代理程式需要目前
時間時，會執行 `session_status` 工具。

## 訊息封套（預設使用本機時間）

傳入訊息會加上包含星期與精確到秒之時間戳記的封套：

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

無論供應商採用哪個時區，封套時間戳記**預設使用主機本機時間**。
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

| 鍵                  | 值                                                   | 行為                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local`（預設）、`utc`、`user`、明確的 IANA 名稱     | `user` 使用 `agents.defaults.userTimezone`（未設定時使用主機時區）。明確的 IANA 名稱（例如 `"America/Chicago"`）會固定使用指定時區；無法識別的名稱則回退至 UTC。                     |
| `envelopeTimestamp` | `on`（預設）、`off`                                  | `off` 會移除封套標頭、直接代理程式提示前綴，以及內嵌模型輸入前綴中的絕對時間戳記。                                                                                                  |
| `envelopeElapsed`   | `on`（預設）、`off`                                  | `off` 會移除工作階段中自上一則訊息以來所顯示的經過時間後綴（例如 `+30s` / `+2m` 格式）。                                                                                           |

### 範例

**本機時間（預設）：**

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

系統提示包含**目前日期與時間**區段，其中**只包含時區**
（不包含時鐘時間或時間格式），以維持提示快取穩定：

```
Time zone: America/Chicago
```

已設定時，該時區為 `agents.defaults.userTimezone`；否則使用主機時區。
提示也會指示代理程式，每當需要目前日期、時間或星期幾時，
執行 `session_status` 工具。

## 系統事件行（預設使用本機時間）

插入代理程式上下文的佇列系統事件會加上時間戳記前綴，並使用與訊息封套
相同的 `envelopeTimezone` 選項（預設：主機本機時間）。

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

- `userTimezone` 設定提示上下文的**使用者本機時區**（也用於 `envelopeTimezone: "user"`）。
- `timeFormat` 控制提示所顯示時間的 **12 小時制／24 小時制格式**。`auto` 會遵循作業系統偏好設定。

## 時間格式偵測（自動）

當 `timeFormat: "auto"` 時，OpenClaw 會檢查作業系統偏好設定（macOS 與 Windows），
並在無法取得時回退至地區設定格式。偵測結果會**按處理程序快取**，
以避免重複呼叫系統。

## 工具承載資料與連接器（原始供應商時間與正規化欄位）

頻道工具會傳回**供應商原生時間戳記**，並加入正規化欄位以確保一致性：

- `timestampMs`：自 Epoch 起算的毫秒數（UTC）
- `timestampUtc`：ISO 8601 UTC 字串

系統會保留供應商的原始欄位，確保不遺失任何資料。

- Discord：UTC ISO 時間戳記
- Slack：來自 API、類似 Epoch 的字串
- Telegram/WhatsApp：供應商特定的數值或 ISO 時間戳記

若需要本機時間，請在下游使用已知時區進行轉換。

## 相關文件

- [系統提示](/zh-TW/concepts/system-prompt)
- [時區](/zh-TW/concepts/timezone)
- [訊息](/zh-TW/concepts/messages)
