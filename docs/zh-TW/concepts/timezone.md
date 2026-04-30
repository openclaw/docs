---
read_when:
    - 你需要了解時間戳記如何正規化供模型使用
    - 設定系統提示的使用者時區
summary: 代理、信封與提示詞的時區處理
title: 時區
x-i18n:
    generated_at: "2026-04-30T03:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 會將時間戳標準化，讓模型看到**單一參考時間**。

## 訊息封套（預設為本機）

傳入訊息會包在像這樣的封套中：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

封套中的時間戳**預設為主機本機時間**，精確到分鐘。

你可以用以下設定覆寫：

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
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（會退回使用主機時區）。
- 使用明確的 IANA 時區（例如 `"Europe/Vienna"`）來取得固定偏移。
- `envelopeTimestamp: "off"` 會從封套標頭移除絕對時間戳。
- `envelopeElapsed: "off"` 會移除經過時間後綴（`+2m` 樣式）。

### 範例

**本機（預設）：**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定時區：**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**經過時間：**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## 工具酬載（原始提供者資料 + 正規化欄位）

工具呼叫（`channels.discord.readMessages`、`channels.slack.readMessages` 等）會回傳**原始提供者時間戳**。
我們也會附加正規化欄位以保持一致：

- `timestampMs`（UTC epoch 毫秒）
- `timestampUtc`（ISO 8601 UTC 字串）

原始提供者欄位會被保留。

## 系統提示詞的使用者時區

設定 `agents.defaults.userTimezone` 來告訴模型使用者的本機時區。如果未設定，
OpenClaw 會在執行階段解析**主機時區**（不寫入設定）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

系統提示詞包含：

- `Current Date & Time` 區段，內含本機時間與時區
- `Time format: 12-hour` 或 `24-hour`

你可以使用 `agents.defaults.timeFormat`（`auto` | `12` | `24`）控制提示詞格式。

完整行為與範例請參閱[日期與時間](/zh-TW/date-time)。

## 相關

- [Heartbeat](/zh-TW/gateway/heartbeat) — 活躍時段會使用時區進行排程
- [Cron 作業](/zh-TW/automation/cron-jobs) — cron 表達式會使用時區進行排程
- [日期與時間](/zh-TW/date-time) — 完整日期/時間行為與範例
