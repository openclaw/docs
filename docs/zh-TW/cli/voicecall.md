---
read_when:
    - 你使用語音通話外掛，並希望涵蓋每個命令列介面進入點
    - 你需要 setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose 與 start 的旗標表格及預設值
summary: '`openclaw voicecall` 的命令列介面參考（語音通話外掛命令介面）'
title: 語音通話
x-i18n:
    generated_at: "2026-07-11T21:13:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` 是由外掛提供的命令。只有在語音通話外掛已安裝並啟用時才會出現。

當閘道執行時，操作命令（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）會路由至該閘道的語音通話執行環境。若無法連線至任何閘道，則會回退至獨立的命令列介面執行環境。

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

| 子命令     | 說明                                                          |
| ---------- | ------------------------------------------------------------- |
| `setup`    | 顯示供應商與網路鉤子的就緒狀態檢查。                          |
| `smoke`    | 執行就緒狀態檢查；僅在使用 `--yes` 時撥打即時測試電話。        |
| `call`     | 發起撥出語音通話。                                            |
| `start`    | `call` 的別名，必須提供 `--to`，而 `--message` 為選填。        |
| `continue` | 播報訊息並等待下一個回應。                                    |
| `speak`    | 播報訊息但不等待回應。                                        |
| `dtmf`     | 將 DTMF 數字傳送至進行中的通話。                               |
| `end`      | 掛斷進行中的通話。                                            |
| `status`   | 檢查進行中的通話（或使用 `--call-id` 檢查單一通話）。         |
| `tail`     | 持續讀取 `calls.jsonl`（適合在供應商測試期間使用）。           |
| `latency`  | 彙整 `calls.jsonl` 中的輪次延遲指標。                          |
| `expose`   | 切換網路鉤子端點的 Tailscale Serve/Funnel。                    |

## 設定與冒煙測試

### `setup`

預設列印易於閱讀的就緒狀態檢查。若供指令碼使用，請傳入 `--json`。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

執行相同的就緒狀態檢查。只有在同時提供 `--to` 與 `--yes` 時，才會實際撥打電話。

| 旗標               | 預設值                            | 說明                                   |
| ------------------ | --------------------------------- | -------------------------------------- |
| `-t, --to <phone>` | （無）                            | 即時冒煙測試要撥打的電話號碼。         |
| `--message <text>` | `OpenClaw voice call smoke test.` | 冒煙測試通話期間要播報的訊息。         |
| `--mode <mode>`    | `notify`                          | 通話模式：`notify` 或 `conversation`。 |
| `--yes`            | `false`                           | 實際撥打即時外撥電話。                 |
| `--json`           | `false`                           | 列印機器可讀的 JSON。                  |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
對於外部供應商（`plivo`、`telnyx`、`twilio`），`setup` 和 `smoke` 需要來自 `publicUrl`、通道或 Tailscale 公開存取的公用網路鉤子 URL。系統會拒絕 local loopback 或私人 Serve 回退，因為電信業者無法連線至該位址。
</Note>

## 通話生命週期

### `call`

發起撥出語音通話。

| 旗標                   | 必要 | 預設值            | 說明                                                                    |
| ---------------------- | ---- | ----------------- | ----------------------------------------------------------------------- |
| `-m, --message <text>` | 是   | （無）            | 通話接通時要播報的訊息。                                                |
| `-t, --to <phone>`     | 否   | 設定 `toNumber`   | 要撥打的 E.164 電話號碼。                                               |
| `--mode <mode>`        | 否   | `conversation`    | 通話模式：`notify`（播報訊息後掛斷）或 `conversation`（保持通話）。     |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

`call` 的別名，具有不同的預設旗標形式。

| 旗標               | 必要 | 預設值         | 說明                                   |
| ------------------ | ---- | -------------- | -------------------------------------- |
| `--to <phone>`     | 是   | （無）         | 要撥打的電話號碼。                     |
| `--message <text>` | 否   | （無）         | 通話接通時要播報的訊息。               |
| `--mode <mode>`    | 否   | `conversation` | 通話模式：`notify` 或 `conversation`。 |

### `continue`

播報訊息並等待回應。

| 旗標               | 必要 | 說明         |
| ------------------ | ---- | ------------ |
| `--call-id <id>`   | 是   | 通話 ID。    |
| `--message <text>` | 是   | 要播報的訊息。 |

### `speak`

播報訊息但不等待回應。

| 旗標               | 必要 | 說明         |
| ------------------ | ---- | ------------ |
| `--call-id <id>`   | 是   | 通話 ID。    |
| `--message <text>` | 是   | 要播報的訊息。 |

### `dtmf`

將 DTMF 數字傳送至進行中的通話。

| 旗標                | 必要 | 說明                                               |
| ------------------- | ---- | -------------------------------------------------- |
| `--call-id <id>`    | 是   | 通話 ID。                                          |
| `--digits <digits>` | 是   | DTMF 數字（例如使用 `ww123456#` 表示等待）。       |

### `end`

掛斷進行中的通話。

| 旗標             | 必要 | 說明      |
| ---------------- | ---- | --------- |
| `--call-id <id>` | 是   | 通話 ID。 |

### `status`

檢查進行中的通話。

| 旗標             | 預設值  | 說明                     |
| ---------------- | ------- | ------------------------ |
| `--call-id <id>` | （無）  | 將輸出限制為單一通話。   |
| `--json`         | `false` | 列印機器可讀的 JSON。    |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 日誌與指標

### `tail`

持續讀取語音通話 JSONL 日誌。啟動時列印最後 `--since` 行，之後在寫入新行時持續串流輸出。

| 旗標            | 預設值               | 說明                           |
| --------------- | -------------------- | ------------------------------ |
| `--file <path>` | 從外掛儲存區解析     | `calls.jsonl` 的路徑。         |
| `--since <n>`   | `25`                 | 開始持續讀取前要列印的行數。   |
| `--poll <ms>`   | `250`（最小值 50）   | 輪詢間隔（毫秒）。             |

### `latency`

彙整 `calls.jsonl` 中的輪次延遲與聆聽等待指標。輸出為 JSON，包含 `recordsScanned`、`turnLatency` 與 `listenWait` 摘要。

| 旗標            | 預設值               | 說明                         |
| --------------- | -------------------- | ---------------------------- |
| `--file <path>` | 從外掛儲存區解析     | `calls.jsonl` 的路徑。       |
| `--last <n>`    | `200`（最小值 1）    | 要分析的近期記錄數量。       |

## 公開網路鉤子

### `expose`

啟用、停用或變更語音網路鉤子的 Tailscale Serve/Funnel 設定。

| 旗標                  | 預設值                                    | 說明                                         |
| --------------------- | ----------------------------------------- | -------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）或 `funnel`（公用）。 |
| `--path <path>`       | 設定 `tailscale.path` 或 `--serve-path`   | 要公開的 Tailscale 路徑。                    |
| `--port <port>`       | 設定 `serve.port` 或 `3334`               | 本機網路鉤子連接埠。                         |
| `--serve-path <path>` | 設定 `serve.path` 或 `/voice/webhook`     | 本機網路鉤子路徑。                           |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
僅將網路鉤子端點公開至您信任的網路。可行時，優先使用 Tailscale Serve，而非 Funnel。
</Warning>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [語音通話外掛](/zh-TW/plugins/voice-call)
