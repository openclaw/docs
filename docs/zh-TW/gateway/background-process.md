---
read_when:
    - 新增或修改背景執行行為
    - 偵錯長時間執行的 exec 工作
summary: 背景執行與程序管理
title: 背景執行與程序工具
x-i18n:
    generated_at: "2026-07-11T21:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 透過 `exec` 工具執行 shell 命令，並將長時間執行的工作保留在記憶體中。`process` 工具用於管理這些背景工作階段。

## exec 工具

參數：

| 參數         | 說明                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | 必填。要執行的 shell 命令。                                                                                                                                            |
| `workdir`    | 工作目錄；省略時使用預設的目前工作目錄。                                                                                                                               |
| `env`        | 命令使用的額外環境變數。                                                                                                                                               |
| `yieldMs`    | 等待多少毫秒後轉入背景執行（預設為 10000）。                                                                                                                           |
| `background` | 立即在背景執行。                                                                                                                                                       |
| `timeout`    | 逾時秒數（預設為 `tools.exec.timeoutSec`）；到期時終止程序。設定 `timeout: 0` 可停用該次呼叫的 exec 程序逾時。                                                          |
| `pty`        | 可用時在虛擬終端機中執行（適用於需要 TTY 的命令列介面、程式設計代理程式）。                                                                                            |
| `elevated`   | 若已啟用／允許提升模式，則在沙箱外執行（預設為 `gateway`；當 exec 目標為 `node` 時則為 `node`）。                                                                       |
| `host`       | Exec 目標：`auto`、`sandbox`、`gateway` 或 `node`。                                                                                                                     |
| `node`       | 節點 ID／名稱，搭配 `host: "node"` 使用。                                                                                                                              |

行為：

- 前景執行會直接傳回輸出。
- 轉入背景執行時（明確指定或因 `yieldMs` 逾時），工具會傳回 `status: "running"`、`sessionId` 及一小段輸出尾端內容。
- 背景執行及透過 `yieldMs` 轉入背景的工作會沿用 `tools.exec.timeoutSec`，除非呼叫明確傳入 `timeout`。
- 輸出會保留在記憶體中，直到輪詢或清除該工作階段。
- 若不允許使用 `process` 工具，`exec` 會同步執行並忽略 `yieldMs`／`background`。
- 產生的 exec 命令會收到 `OPENCLAW_SHELL=exec`，以套用可感知情境的 shell／設定檔規則。
- 對於現在開始的長時間工作：只啟動一次，並在命令產生輸出或失敗時，依賴自動完成喚醒功能（若已啟用）。
- 若無法使用自動完成喚醒，或需要確認命令無輸出但正常結束的靜默成功狀態，請使用 `process` 輪詢。
- 請勿使用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲的後續工作——未來的工作請使用排程。

### 環境變數覆寫

| 變數                                     | 效果                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 轉入背景執行前的預設等待時間（毫秒）。預設為 10000，限制於 10–120000。                                    |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 記憶體內輸出的字元上限。                                                                                  |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 每個資料流待處理 stdout／stderr 的字元上限。                                                              |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 已完成工作階段的存留時間（毫秒），限制於 1 分鐘至 3 小時。                                                |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 可寫入的背景工作階段被標記為可能正在等待輸入前，無輸出的閒置時間門檻。預設為 15000。                       |

### 設定（優先於環境變數覆寫）

| 鍵                                    | 預設值  | 效果                                                                                 |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `tools.exec.backgroundMs`             | 10000   | 與 `OPENCLAW_BASH_YIELD_MS` 相同。                                                   |
| `tools.exec.timeoutSec`               | 1800    | 每次呼叫的預設逾時時間。                                                             |
| `tools.exec.cleanupMs`                | 1800000 | 與 `OPENCLAW_BASH_JOB_TTL_MS` 相同。                                                 |
| `tools.exec.notifyOnExit`             | true    | 背景 exec 結束時，將系統事件加入佇列並要求心跳偵測。                                 |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 對成功但沒有輸出的背景執行，也將完成事件加入佇列。                                   |

## 子程序橋接

透過 exec／process 工具以外的方式產生長時間執行的子程序時（命令列介面重新產生程序、閘道輔助程式），請連接子程序橋接輔助程式，使終止訊號得以轉送，並在結束／錯誤時移除監聽器。這可避免 systemd 上出現孤立程序，並使各平台的關閉行為保持一致。

## process 工具

動作：

| 動作        | 效果                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| `list`      | 列出執行中及已完成的工作階段。                                                         |
| `poll`      | 取得工作階段的新輸出（也會回報結束狀態）。                                             |
| `log`       | 讀取彙總輸出與輸入復原提示。支援 `offset` + `limit`。                                  |
| `write`     | 傳送標準輸入（`data`，可選用 `eof`）。                                                 |
| `send-keys` | 將明確的按鍵符記或位元組傳送至由 PTY 支援的工作階段。                                  |
| `submit`    | 將 Enter／歸位字元傳送至由 PTY 支援的工作階段。                                        |
| `paste`     | 傳送原樣文字，可選擇以括號貼上模式包裝。                                               |
| `kill`      | 終止背景工作階段。                                                                     |
| `clear`     | 從記憶體移除已完成的工作階段。                                                         |
| `remove`    | 若正在執行則終止，否則在已完成時清除。                                                 |

注意事項：

- 只有背景工作階段會被列出／保留——僅保留在記憶體中，不會寫入磁碟。程序重新啟動時，工作階段會遺失。
- 即時背景工作階段會阻止協同式主機暫停與安全的閘道重新啟動，直到程序擁有者確認其確實已結束。
- `process remove` 可在要求終止後立即隱藏執行中的工作階段；在確認結束前，暫停與重新啟動仍會被阻止。
- 只有在執行 `process poll`／`log` 且工具結果被記錄時，工作階段日誌才會儲存至聊天記錄。
- `process` 的範圍限定於每個代理程式；它只能看到由該代理程式啟動的工作階段。
- 無法使用自動完成喚醒時，請使用 `poll`／`log` 查看狀態、日誌或確認完成。
- 復原互動式命令列介面前，請使用 `log`，以便同時查看目前的內容記錄、標準輸入狀態及輸入等待提示。
- 需要輸入或介入時，請使用 `write`／`send-keys`／`submit`／`paste`／`kill`。
- `process list` 包含衍生的 `name`（命令動詞 + 目標），方便快速瀏覽。
- 只有在工作階段仍具有可寫入的標準輸入，且閒置時間超過輸入等待門檻時（預設為 15000 毫秒，`OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`），`process list`、`poll` 和 `log` 才會回報 `waitingForInput`。
- `process log` 使用以行為單位的 `offset`／`limit`。兩者皆省略時，會傳回最後 200 行並附上分頁提示。設定 `offset` 而未設定 `limit` 時，會傳回從 `offset` 到結尾的內容（不受 200 行上限限制）。
- `poll` 的 `timeout` 會在傳回前等待最多指定的毫秒數；超過 30000 的值會被限制為 30000。
- 輪詢用於隨需取得狀態，而非安排等待迴圈。若工作應於稍後執行，請使用排程。

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

傳送標準輸入：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

傳送 PTY 按鍵：

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

送出目前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上原樣文字：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關內容

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
