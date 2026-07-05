---
read_when:
    - 你使用語音通話外掛，並希望每個命令列介面進入點
    - 你需要 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 和 start 的旗標表與預設值
summary: 命令列介面參考：`openclaw voicecall`（語音通話外掛命令介面）
title: 語音通話
x-i18n:
    generated_at: "2026-07-05T11:14:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由外掛提供的命令。只有在已安裝並啟用語音通話外掛時才會出現。

當閘道正在執行時，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）會路由到該閘道的語音通話執行階段。如果無法連線到任何閘道，則會回退到獨立的命令列介面執行階段。

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
| `setup`    | 顯示供應商與網路鉤子就緒檢查。                     |
| `smoke`    | 執行就緒檢查；只有搭配 `--yes` 時才撥打即時測試電話。 |
| `call`     | 發起撥出語音通話。                                |
| `start`    | `call` 的別名，要求 `--to`，且 `--message` 為選填。 |
| `continue` | 播放訊息並等待下一個回應。                 |
| `speak`    | 播放訊息，但不等待回應。                 |
| `dtmf`     | 將 DTMF 數字傳送到作用中的通話。                             |
| `end`      | 掛斷作用中的通話。                                         |
| `status`   | 檢查作用中的通話（或透過 `--call-id` 檢查單一通話）。                   |
| `tail`     | 追蹤 `calls.jsonl`（在供應商測試期間很有用）。              |
| `latency`  | 彙總來自 `calls.jsonl` 的回合延遲指標。              |
| `expose`   | 為網路鉤子端點切換 Tailscale serve/funnel。         |

## 設定與冒煙測試

### `setup`

預設列印人類可讀的就緒檢查。傳入 `--json` 可供腳本使用。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

執行相同的就緒檢查。只有同時存在 `--to` 和 `--yes` 時，才會撥打真實電話。

| 旗標               | 預設值                           | 說明                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | （無）                            | 即時冒煙測試要撥打的電話號碼。  |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒煙測試通話期間要播放的訊息。 |
| `--mode <mode>`    | `notify`                          | 通話模式：`notify` 或 `conversation`。  |
| `--yes`            | `false`                           | 實際撥打即時撥出電話。  |
| `--json`           | `false`                           | 列印機器可讀的 JSON。            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
對於外部供應商（`plivo`、`telnyx`、`twilio`），`setup` 和 `smoke` 需要來自 `publicUrl`、通道或 Tailscale 暴露的公開網路鉤子 URL。回送或私有 serve 回退會被拒絕，因為電信業者無法連線到它。
</Note>

## 通話生命週期

### `call`

發起撥出語音通話。

| 旗標                   | 必填 | 預設值           | 說明                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | 是      | （無）            | 通話接通時要播放的訊息。                                   |
| `-t, --to <phone>`     | 否       | config `toNumber` | 要撥打的 E.164 電話號碼。                                                |
| `--mode <mode>`        | 否       | `conversation`    | 通話模式：`notify`（訊息播放後掛斷）或 `conversation`（保持開啟）。 |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的別名，具有不同的預設旗標形式。

| 旗標               | 必填 | 預設值        | 說明                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | 是      | （無）         | 要撥打的電話號碼。                    |
| `--message <text>` | 否       | （無）         | 通話接通時要播放的訊息。 |
| `--mode <mode>`    | 否       | `conversation` | 通話模式：`notify` 或 `conversation`。   |

### `continue`

播放訊息並等待回應。

| 旗標               | 必填 | 說明       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通話 ID。          |
| `--message <text>` | 是      | 要播放的訊息。 |

### `speak`

播放訊息，但不等待回應。

| 旗標               | 必填 | 說明       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | 是      | 通話 ID。          |
| `--message <text>` | 是      | 要播放的訊息。 |

### `dtmf`

將 DTMF 數字傳送到作用中的通話。

| 旗標                | 必填 | 說明                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | 是      | 通話 ID。                                         |
| `--digits <digits>` | 是      | DTMF 數字（例如用於等待的 `ww123456#`）。 |

### `end`

掛斷作用中的通話。

| 旗標             | 必填 | 說明 |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | 是      | 通話 ID。    |

### `status`

檢查作用中的通話。

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

追蹤語音通話 JSONL 記錄。啟動時列印最後 `--since` 行，然後串流列印新寫入的行。

| 旗標            | 預設值                    | 說明                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | 從外掛儲存區解析 | `calls.jsonl` 的路徑。         |
| `--since <n>`   | `25`                       | 追蹤前要列印的行數。 |
| `--poll <ms>`   | `250`（最低 50）         | 輪詢間隔，以毫秒為單位。 |

### `latency`

彙總來自 `calls.jsonl` 的回合延遲與聆聽等待指標。輸出為 JSON，包含 `recordsScanned`、`turnLatency` 和 `listenWait` 摘要。

| 旗標            | 預設值                    | 說明                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | 從外掛儲存區解析 | `calls.jsonl` 的路徑。               |
| `--last <n>`    | `200`（最低 1）          | 要分析的近期記錄數量。 |

## 暴露網路鉤子

### `expose`

啟用、停用或變更語音網路鉤子的 Tailscale serve/funnel 設定。

| 旗標                  | 預設值                                   | 說明                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）或 `funnel`（公開）。 |
| `--path <path>`       | config `tailscale.path` 或 `--serve-path` | 要暴露的 Tailscale 路徑。                       |
| `--port <port>`       | config `serve.port` 或 `3334`             | 本機網路鉤子連接埠。                             |
| `--serve-path <path>` | config `serve.path` 或 `/voice/webhook`   | 本機網路鉤子路徑。                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
只將網路鉤子端點暴露給你信任的網路。可行時，優先使用 Tailscale Serve，而不是 Funnel。
</Warning>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [語音通話外掛](/zh-TW/plugins/voice-call)
