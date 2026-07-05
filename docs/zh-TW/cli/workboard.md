---
read_when:
    - 你想從終端機檢查或建立 Workboard 卡片
    - 你想從命令列介面派送 Workboard worker 執行
    - 你正在偵錯 Workboard 命令列介面或斜線命令行為
summary: '`openclaw workboard` 卡片、派送與工作程式執行的命令列介面參考'
title: 工作板命令列介面
x-i18n:
    generated_at: "2026-07-05T11:14:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是 bundled [Workboard 外掛](/zh-TW/plugins/workboard) 的終端介面。它讓操作者列出卡片、建立卡片、檢查單一卡片，並要求執行中的閘道將已就緒的工作分派到 subagent worker runs。

使用命令前請啟用外掛：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 使用方式

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

此命令會讀寫與儀表板和 Workboard agent tools 相同、由外掛擁有的 SQLite 資料庫。卡片 ID 是 UUID；接受卡片 ID 的命令也接受不含歧義的 ID 前綴（精簡文字輸出會顯示前 8 個字元）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文字輸出很精簡：

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

欄位依序為 ID 前綴、狀態、優先級、看板 ID、選用的 agent ID，以及標題。

| 旗標                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 將結果限制為單一看板命名空間          |
| `--status <status>`  | 將結果限制為單一 Workboard 狀態         |
| `--include-archived` | 在精簡文字輸出中包含已封存卡片 |
| `--json`             | 以機器 JSON 列印完整卡片清單      |

精簡文字輸出預設會隱藏已封存卡片，讓命令列介面與 `/workboard list` 一致。傳入 `--include-archived` 可顯示它們。JSON 輸出一律保留完整卡片清單，包括已封存卡片，以支援既有自動化。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 旗標                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片備註                      |
| `--status <status>`     | 初始狀態，預設為 `todo`          |
| `--priority <priority>` | 優先級，預設為 `normal`              |
| `--agent <id>`          | 將卡片指派給 agent 或擁有者 ID |
| `--board <id>`          | 將卡片儲存在看板命名空間     |
| `--labels <items>`      | 以逗號分隔的標籤                  |
| `--json`                | 以機器 JSON 列印已建立的卡片  |

`create` 會直接寫入 Workboard SQLite 狀態。卡片會立即出現在 Control UI Workboard 分頁和 Workboard 工具中。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文字輸出會列印精簡卡片列與備註。JSON 輸出會回傳完整卡片記錄，包括執行中繼資料、嘗試次數、留言、連結、證明、成品、worker 記錄、協定狀態、診斷資訊，以及自動化中繼資料。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 會先呼叫執行中閘道的 RPC 方法 `workboard.cards.dispatch`，該方法使用與儀表板分派動作相同的 subagent runtime，因此已就緒卡片會成為具有連結 session keys 的 task-tracked worker runs。已指派 agent 的卡片會使用 agent-scoped subagent session keys；未指派卡片會保留 unscoped subagent key，因此會保留閘道設定的預設 agent。

分派迴圈：

1. 將依賴已就緒的子項目提升為 `ready`。
2. 封鎖過期 claim 或逾時的 worker runs。
3. 在已就緒卡片上記錄分派中繼資料。
4. 選取一小批未 claim 的已就緒卡片。
5. 為 dispatcher 或已指派 agent claim 每張選取的卡片。
6. 使用受限的卡片情境與卡片 claim token 啟動 subagent worker run。
7. 在卡片上儲存 worker run ID、session key、閘道 task ledger 回報時的 task linkage、執行狀態，以及 worker log。

選取方式很保守：一次分派預設最多啟動三個 worker，會略過已封存或已 claim 的卡片，並且在單次流程中每個擁有者或 agent 只啟動一張卡片。已由作用中的 running 或 review 工作擁有的卡片，會留待之後的分派處理。

如果卡片被 claim 後 worker 啟動失敗，Workboard 會封鎖該卡片、清除 claim，並在卡片執行與 worker-log 中繼資料中記錄失敗，讓啟動失敗保持可見，而不是靜默地將卡片放回佇列。

如果未提供明確的閘道目標，且本機閘道無法使用或尚未公開 Workboard 分派方法，命令列介面會退回到針對本機 Workboard 狀態的僅資料分派。僅資料分派仍可提升依賴、清理過期 claim，並封鎖逾時 runs，但不會啟動 worker。驗證、權限與校驗失敗，以及針對明確 `--url` 或 `--token` 目標的失敗，會直接回報，而不會觸發 fallback。

文字輸出會回報 worker 啟動：

```text
dispatch complete: started=2 failures=0
```

Fallback 輸出會明確標示：

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 輸出會包含分派結果。由閘道支援的分派可包含 `started` 與 `startFailures`；僅資料 fallback 會包含 `gatewayUnavailable: true`。Claim tokens 會從卡片 JSON 輸出中遮蔽。

在儀表板中，相同的分派結果會顯示為簡短摘要，讓操作者不必開啟卡片詳細資料，就能看到有多少卡片已啟動、提升、封鎖、回收或失敗。

## 斜線命令一致性

支援命令的頻道可以使用對應的斜線命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

斜線命令分派也會使用閘道 subagent runtime，因此會遵循與儀表板和命令列介面閘道路徑相同的 claim、worker-start 與失敗行為。

`/workboard list` 和 `/workboard show` 是授權命令傳送者可用的讀取命令。`/workboard create` 和 `/workboard dispatch` 會變更看板狀態，並且在聊天介面上需要擁有者身分，或需要具有 `operator.write` 或 `operator.admin` 的閘道用戶端。

## 權限

命令列介面分派路徑會以 `operator.read` 與 `operator.write` scopes 呼叫閘道 RPC。唯讀閘道 token 可以透過讀取方法檢查 Workboard 資料，但不能建立卡片或分派 worker。

本機 `list`、`create` 和 `show` 命令會操作目前設定檔使用的本機 OpenClaw 狀態目錄。需要不同狀態根目錄時，請在最上層 `openclaw` 命令使用 `--dev` 或 `--profile <name>`。

## 疑難排解

### 沒有顯示卡片

確認同一個設定檔與狀態根目錄已啟用外掛：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果儀表板有顯示卡片，但命令列介面沒有，請檢查兩個命令是否使用相同的 `--dev` 或 `--profile` 設定。

### Dispatch says data-only

啟動或重新啟動閘道：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

接著重試 `openclaw workboard dispatch`。僅資料 fallback 適合用於本機狀態清理，但 worker runs 需要即時閘道。

### Dispatch starts nothing

檢查是否至少有一張沒有作用中 claim 的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

當同一個擁有者已有 running 或 review 工作時，卡片也可能被略過。將完成的工作移至 `done`、透過 Workboard 工具釋放過期 claim，或在作用中 worker 完成後再次執行分派。

## 相關

- [Workboard 外掛](/zh-TW/plugins/workboard)
- [命令列介面參考](/zh-TW/cli)
- [斜線命令](/zh-TW/tools/slash-commands)
- [Control UI](/zh-TW/web/control-ui)
