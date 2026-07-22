---
read_when:
    - 新增或修改背景執行行為
    - 偵錯長時間執行的 exec 任務
summary: 背景執行與程序管理
title: 背景執行與程序工具
x-i18n:
    generated_at: "2026-07-22T10:33:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 37cb65ddf67227e32be972e77d16b9835d592120ecd12e041d05c48536fd2204
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 透過 `exec` 工具執行 shell 命令，並將長時間執行的工作保留在記憶體中。`process` 工具會管理這些背景工作階段。

## exec 工具

參數：

| 參數    | 說明                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | 必填。要執行的 shell 命令。                                                                                                                            |
| `workdir`    | 工作目錄；省略時使用預設 cwd。                                                                                                            |
| `env`        | 命令的額外環境變數。                                                                                                               |
| `yieldMs`    | 轉入背景執行前等待的毫秒數（預設為 10000）。                                                                                                 |
| `background` | 立即在背景執行。                                                                                                                             |
| `timeout`    | 逾時秒數（預設為 `tools.exec.timeoutSeconds`）；逾時時終止程序。設為 `timeout: 0` 可停用該次呼叫的 exec 程序逾時。 |
| `pty`        | 可用時在虛擬終端機中執行（需要 TTY 的命令列介面、程式設計代理程式）。                                                                                |
| `elevated`   | 若已啟用／允許提升權限模式，則在沙箱外執行（預設為 `gateway`；若 exec 目標為 `node`，則為 `node`）。                              |
| `host`       | Exec 目標：`auto`、`sandbox`、`gateway` 或 `node`。                                                                                                      |
| `node`       | 節點 ID／名稱，搭配 `host: "node"` 使用。                                                                                                                    |

行為：

- 前景執行會直接傳回輸出。
- 轉入背景執行時（明確指定或因 `yieldMs` 逾時），工具會傳回 `status: "running"` + `sessionId`，以及一小段輸出尾端內容。
- 背景執行和 `yieldMs` 執行會繼承 `tools.exec.timeoutSeconds`，除非呼叫時明確傳入 `timeout`。
- 輸出會保留在記憶體中，直到輪詢或清除工作階段。
- 若不允許使用 `process` 工具，`exec` 會同步執行，並忽略 `yieldMs`/`background`。
- 產生的 exec 命令會接收 `OPENCLAW_SHELL=exec`，以套用能感知情境的 shell／設定檔規則。
- 對於現在開始的長時間工作：只啟動一次，並在命令產生輸出或失敗後，依賴自動完成喚醒功能（若已啟用）。
- 若無法使用自動完成喚醒，或需要確認一個無輸出且正常結束的命令是否安靜成功，請使用 `process` 輪詢。
- 請勿使用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲後續操作——未來工作請使用排程。

### 環境變數覆寫

| 變數                                 | 效果                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 轉入背景執行前的預設讓出時間（毫秒）。預設為 10000，限制在 10-120000。                                       |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 記憶體內輸出上限（字元數）。                                                                                    |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 每個串流待處理的 stdout/stderr 上限（字元數）。                                                                    |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 已完成工作階段的 TTL（毫秒），限制在 1m-3h。                                                                |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 可寫入的背景工作階段在被標記為可能正等待輸入前，必須達到的輸出閒置門檻。預設為 15000。 |

### 設定（優先於環境變數覆寫）

| 鍵                                   | 預設值 | 效果                                                                          |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | 與 `OPENCLAW_BASH_YIELD_MS` 相同。                                               |
| `tools.exec.timeoutSeconds`           | 1800    | 每次呼叫的預設逾時時間。                                                       |
| `tools.exec.cleanupMs`                | 1800000 | 與 `OPENCLAW_BASH_JOB_TTL_MS` 相同。                                             |
| `tools.exec.notifyOnExit`             | true    | 背景 exec 結束時，將系統事件加入佇列並要求心跳偵測。      |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 對於無輸出但成功完成的背景執行，也將完成事件加入佇列。 |

## 子程序橋接

在 exec/process 工具之外產生長時間執行的子程序時（命令列介面重新產生程序、閘道輔助程式），請附加子程序橋接輔助工具，讓終止訊號能夠轉送，並在結束／發生錯誤時卸離監聽器。如此可避免 systemd 上出現孤立程序，並確保各平台的關閉行為一致。

## process 工具

動作：

| 動作      | 效果                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `list`      | 執行中 + 已完成的工作階段。                                                  |
| `poll`      | 取出工作階段的新輸出（也會回報結束狀態）。                    |
| `log`       | 讀取彙整輸出和輸入復原提示。支援 `offset` + `limit`。 |
| `write`     | 傳送 stdin（`data`，可選的 `eof`）。                                          |
| `send-keys` | 將明確的按鍵符記或位元組傳送至由 PTY 支援的工作階段。                    |
| `submit`    | 將 Enter／歸位字元傳送至由 PTY 支援的工作階段。                           |
| `paste`     | 傳送常值文字，可選擇以括號貼上模式包裝。                |
| `kill`      | 終止背景工作階段。                                               |
| `clear`     | 從記憶體中移除已完成的工作階段。                                        |
| `remove`    | 若正在執行則終止，否則在已完成時清除。                                 |

注意事項：

- 只會列出／保留背景工作階段——僅存於記憶體，不會寫入磁碟。程序重新啟動後，工作階段會遺失。
- 在程序擁有者確認背景工作階段確實結束前，仍在執行的背景工作階段會阻止協作式主機暫停與安全的閘道重新啟動。
- `process remove` 可在要求終止後立即隱藏仍在執行的工作階段；在確認程序結束前，暫停與重新啟動仍會遭到阻止。
- 只有在你執行 `process poll`/`log` 且工具結果有被記錄時，工作階段記錄才會儲存至聊天記錄。
- `process` 的範圍以各代理程式為單位；它只能看到該代理程式啟動的工作階段。
- 無法使用自動完成喚醒時，請使用 `poll`/`log` 取得狀態、記錄或完成確認。
- 復原互動式命令列介面前，請使用 `log`，以便同時查看目前的文字記錄、stdin 狀態和輸入等待提示。
- 需要輸入或介入時，請使用 `write`/`send-keys`/`submit`/`paste`/`kill`。
- `process list` 包含衍生的 `name`（命令動詞 + 目標），方便快速瀏覽。
- 僅當工作階段仍有可寫入的 stdin，且閒置時間超過輸入等待門檻（預設為 15000 ms，`OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`）時，`process list`、`poll` 和 `log` 才會回報 `waitingForInput`。
- `process log` 使用以行為基礎的 `offset`/`limit`。兩者皆省略時，會傳回最後 200 行及分頁提示。設定 `offset` 而未設定 `limit` 時，會傳回從 `offset` 到結尾的內容（不受 200 行上限限制）。
- `poll` 的 `timeout` 會在傳回前最多等待指定的毫秒數；超過 30000 的值會限制為 30000。
- 輪詢是用於隨選取得狀態，而非安排等待迴圈。若工作應於稍後執行，請使用排程。

## 範例

執行長時間工作並於稍後輪詢：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

傳送輸入前檢查互動式工作階段：

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

立即在背景啟動：

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

傳送 stdin：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

傳送 PTY 按鍵：

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

提交目前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上常值文字：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關內容

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
