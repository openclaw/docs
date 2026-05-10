---
read_when:
    - 你使用 voice-call Plugin，並且想要每個 CLI 進入點
    - 需要提供 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 和 start 的旗標表和預設值
summary: '`openclaw voicecall` 的 CLI 參考（語音通話 Plugin 命令介面）'
title: 語音通話
x-i18n:
    generated_at: "2026-05-10T19:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由 Plugin 提供的命令。只有在已安裝並啟用語音通話 Plugin 時才會出現。

當 Gateway 正在執行時，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）會路由到該 Gateway 的語音通話執行階段。如果無法連線到 Gateway，則會退回到獨立的 CLI 執行階段。

## 子命令

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| 子命令 | 說明                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | 顯示提供者和 Webhook 就緒檢查。                     |
| `smoke`    | 執行就緒檢查；只有使用 `--yes` 時才會撥打即時測試電話。 |
| `call`     | 發起撥出的語音通話。                                |
| `start`    | `call` 的別名，需要 `--to`，`--message` 則為選用。 |
| `continue` | 說出訊息並等待下一個回應。                 |
| `speak`    | 說出訊息，不等待回應。                 |
| `dtmf`     | 將 DTMF 數字傳送到進行中的通話。                             |
| `end`      | 掛斷進行中的通話。                                         |
| `status`   | 檢查進行中的通話（或透過 `--call-id` 檢查單一通話）。                   |
| `tail`     | 追蹤 `calls.jsonl`（在提供者測試期間很有用）。              |
| `latency`  | 彙總 `calls.jsonl` 中的回合延遲指標。              |
| `expose`   | 切換 Webhook 端點的 Tailscale serve/funnel。         |

## 設定與冒煙測試

### `setup`

預設會列印人類可讀的就緒檢查。傳入 `--json` 可供指令稿使用。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

執行相同的就緒檢查。除非同時提供 `--to` 和 `--yes`，否則不會撥打真正的電話。

| 旗標               | 預設值                           | 說明                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | （無）                            | 即時冒煙測試要撥打的電話號碼。  |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒煙測試通話期間要說出的訊息。 |
| `--mode <mode>`    | `notify`                          | 通話模式：`notify` 或 `conversation`。  |
| `--yes`            | `false`                           | 實際發起即時撥出通話。  |
| `--json`           | `false`                           | 列印機器可讀的 JSON。            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
對於外部提供者（`twilio`、`telnyx`、`plivo`），`setup` 和 `smoke` 需要來自 `publicUrl`、通道或 Tailscale 公開存取的公開 Webhook URL。local loopback 或私有 serve 後援會被拒絕，因為電信業者無法連到它。
</Note>

## 通話生命週期

### `call`

發起撥出的語音通話。

| 旗標                   | 必填 | 預設值           | 說明                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | 是      | （無）            | 通話接通時要說出的訊息。                                   |
| `-t, --to <phone>`     | 否       | 設定 `toNumber` | 要撥打的 E.164 電話號碼。                                                |
| `--mode <mode>`        | 否       | `conversation`    | 通話模式：`notify`（訊息結束後掛斷）或 `conversation`（保持通話）。 |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的別名，使用不同的預設旗標形式。

| 旗標               | 必填 | 預設值        | 說明                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | 是      | （無）         | 要撥打的電話號碼。                    |
| `--message <text>` | 否       | （無）         | 通話接通時要說出的訊息。 |
| `--mode <mode>`    | 否       | `conversation` | 通話模式：`notify` 或 `conversation`。   |

### `continue`

說出訊息並等待回應。

| 旗標               | 必填 | 說明       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通話 ID。          |
| `--message <text>` | 是      | 要說出的訊息。 |

### `speak`

說出訊息，不等待回應。

| 旗標               | 必填 | 說明       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通話 ID。          |
| `--message <text>` | 是      | 要說出的訊息。 |

### `dtmf`

將 DTMF 數字傳送到進行中的通話。

| 旗標                | 必填 | 說明                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | 是      | 通話 ID。                                  |
| `--digits <digits>` | 是      | DTMF 數字（例如用於等待的 `ww123456#`）。 |

### `end`

掛斷進行中的通話。

| 旗標             | 必填 | 說明 |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | 是      | 通話 ID。    |

### `status`

檢查進行中的通話。

| 旗標             | 預設值 | 說明                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | （無）  | 將輸出限制為單一通話。 |
| `--json`         | `false` | 列印機器可讀的 JSON。 |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 記錄與指標

### `tail`

追蹤語音通話 JSONL 記錄。啟動時列印最後 `--since` 行，接著串流新寫入的行。

| 旗標            | 預設值                    | 說明                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | 從 Plugin 儲存區解析 | `calls.jsonl` 的路徑。         |
| `--since <n>`   | `25`                       | 追蹤前要列印的行數。 |
| `--poll <ms>`   | `250`（最低 50）         | 輪詢間隔，單位為毫秒。 |

### `latency`

從 `calls.jsonl` 彙總回合延遲和聆聽等待指標。輸出是包含 `recordsScanned`、`turnLatency` 和 `listenWait` 摘要的 JSON。

| 旗標            | 預設值                    | 說明                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | 從 Plugin 儲存區解析 | `calls.jsonl` 的路徑。               |
| `--last <n>`    | `200`（最低 1）          | 要分析的最近記錄數量。 |

## 公開 Webhook

### `expose`

啟用、停用或變更語音 Webhook 的 Tailscale serve/funnel 設定。

| 旗標                  | 預設值                                   | 說明                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）或 `funnel`（公開）。 |
| `--path <path>`       | 設定 `tailscale.path` 或 `--serve-path` | 要公開的 Tailscale 路徑。                       |
| `--port <port>`       | 設定 `serve.port` 或 `3334`             | 本機 Webhook 連接埠。                             |
| `--serve-path <path>` | 設定 `serve.path` 或 `/voice/webhook`   | 本機 Webhook 路徑。                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
只將 Webhook 端點公開給你信任的網路。可行時，優先使用 Tailscale Serve，而不是 Funnel。
</Warning>

## 相關

- [CLI 參考](/zh-TW/cli)
- [語音通話 Plugin](/zh-TW/plugins/voice-call)
