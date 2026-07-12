---
read_when:
    - 你想要從終端機檢視或建立 Workboard 卡片
    - 您想從命令列介面派送 Workboard 工作程式執行作業
    - 你正在偵錯 Workboard 命令列介面或斜線指令的行為
summary: '`openclaw workboard` 卡片、分派與工作程序執行的命令列介面參考資料'
title: Workboard 命令列介面
x-i18n:
    generated_at: "2026-07-11T21:13:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是內建 [Workboard 外掛](/zh-TW/plugins/workboard)的終端介面。操作員可用它列出卡片、建立卡片、檢視單一卡片，以及要求執行中的閘道將就緒工作分派至子代理工作執行。

使用此命令前，請先啟用外掛：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 用法

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

此命令讀寫儀表板和 Workboard 代理工具所使用的同一個外掛自有 SQLite 資料庫。卡片 ID 為 UUID；接受卡片 ID 的命令也接受無歧義的 ID 前綴（精簡文字輸出會顯示前 8 個字元）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文字輸出採用精簡格式：

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

各欄依序為 ID 前綴、狀態、優先順序、看板 ID、選用的代理 ID，以及標題。

| 旗標                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 將結果限制在單一看板命名空間          |
| `--status <status>`  | 將結果限制在單一 Workboard 狀態         |
| `--include-archived` | 在精簡文字輸出中包含已封存的卡片 |
| `--json`             | 以機器可讀 JSON 輸出完整卡片清單      |

精簡文字輸出預設隱藏已封存的卡片，以使命令列介面與 `/workboard list` 保持一致。傳入 `--include-archived` 即可顯示它們。為了支援現有自動化流程，JSON 輸出一律保留完整卡片清單，包括已封存的卡片。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 旗標                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 初始卡片備註                      |
| `--status <status>`     | 初始狀態，預設為 `todo`          |
| `--priority <priority>` | 優先順序，預設為 `normal`              |
| `--agent <id>`          | 將卡片指派給代理或擁有者 ID |
| `--board <id>`          | 將卡片儲存在看板命名空間中     |
| `--labels <items>`      | 以逗號分隔的標籤                  |
| `--json`                | 以機器可讀 JSON 輸出建立的卡片  |

`create` 會直接寫入 Workboard 的 SQLite 狀態。卡片會立即顯示在 Control UI 的 Workboard 分頁中，也可供 Workboard 工具使用。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文字輸出會顯示精簡卡片列和備註。JSON 輸出會傳回完整卡片記錄，包括執行中繼資料、嘗試次數、留言、連結、證明、成品、工作程序日誌、協定狀態、診斷資訊，以及自動化中繼資料。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 會先呼叫執行中閘道的 RPC 方法 `workboard.cards.dispatch`，此方法使用與儀表板分派動作相同的子代理執行階段，因此就緒卡片會成為附有連結工作階段金鑰且受任務追蹤的工作程序執行。已指派代理的卡片會使用代理範圍的子代理工作階段金鑰；未指派的卡片則保留無範圍的子代理金鑰，以維持閘道設定的預設代理。

分派迴圈會：

1. 將相依項目已就緒的子卡片提升為 `ready`。
2. 封鎖宣告已過期或工作程序執行已逾時的卡片。
3. 在就緒卡片上記錄分派中繼資料。
4. 選取一小批尚未宣告的就緒卡片。
5. 由分派器或指定代理宣告每張選定的卡片。
6. 使用受限的卡片上下文和卡片宣告權杖啟動子代理工作程序執行。
7. 在卡片上儲存工作程序執行 ID、工作階段金鑰、閘道任務台帳回報的任務連結、執行狀態，以及工作程序日誌。

選取方式較為保守：每次分派預設最多啟動三個工作程序、略過已封存或已宣告的卡片，且單次處理中每位擁有者或代理只會啟動一張卡片。若卡片的擁有者已有執行中或審查中的工作，該卡片會留待後續分派。

若卡片被宣告後工作程序啟動失敗，Workboard 會封鎖該卡片、清除宣告，並將失敗記錄於卡片執行與工作程序日誌中繼資料中，讓啟動失敗保持可見，而不是默默將卡片退回佇列。

若未指定明確的閘道目標，且本機閘道無法使用或尚未公開 Workboard 分派方法，命令列介面會改用本機 Workboard 狀態進行僅資料分派。僅資料分派仍可提升相依項目、清理過期宣告，以及封鎖逾時的執行，但不會啟動工作程序。驗證、權限與有效性檢查失敗，以及明確指定 `--url` 或 `--token` 目標時發生的失敗，都會直接回報，而不會觸發備援。

文字輸出會回報工作程序的啟動結果：

```text
dispatch complete: started=2 failures=0
```

備援輸出會明確指出：

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 輸出會包含分派結果。由閘道支援的分派可能包含 `started` 和 `startFailures`；僅資料備援則包含 `gatewayUnavailable: true`。卡片 JSON 輸出中的宣告權杖會經過遮蔽。

在儀表板中，相同的分派結果會以簡短摘要顯示，讓操作員無須開啟卡片詳細資料，即可查看已啟動、提升、封鎖、重新宣告或失敗的卡片數量。

## 斜線命令對等功能

支援命令的頻道可使用對應的斜線命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

斜線命令分派同樣使用閘道的子代理執行階段，因此其宣告、工作程序啟動及失敗行為與儀表板和命令列介面的閘道路徑相同。

`/workboard list` 和 `/workboard show` 是供已授權命令傳送者使用的讀取命令。`/workboard create` 和 `/workboard dispatch` 會修改看板狀態，在聊天介面上需要擁有者身分，或需要具備 `operator.write` 或 `operator.admin` 的閘道用戶端。

## 權限

命令列介面的分派路徑會使用 `operator.read` 和 `operator.write` 範圍呼叫閘道 RPC。唯讀閘道權杖可透過讀取方法檢視 Workboard 資料，但無法建立卡片或分派工作程序。

本機 `list`、`create` 和 `show` 命令會操作目前設定檔所使用的本機 OpenClaw 狀態目錄。需要使用不同的狀態根目錄時，請在頂層 `openclaw` 命令上使用 `--dev` 或 `--profile <name>`。

## 疑難排解

### 未顯示任何卡片

確認外掛已針對相同的設定檔和狀態根目錄啟用：

```bash
openclaw plugins inspect workboard --runtime --json
```

若儀表板有顯示卡片，但命令列介面沒有，請檢查兩個命令是否使用相同的 `--dev` 或 `--profile` 設定。

### 分派顯示僅資料模式

啟動或重新啟動閘道：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

接著重試 `openclaw workboard dispatch`。僅資料備援適合清理本機狀態，但工作程序執行需要可用的閘道。

### 分派未啟動任何工作

檢查是否至少有一張沒有有效宣告的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

若同一擁有者已有執行中或審查中的工作，卡片也可能被略過。請將已完成的工作移至 `done`、透過 Workboard 工具釋放過期宣告，或在目前工作程序完成後再次執行分派。

## 相關內容

- [Workboard 外掛](/zh-TW/plugins/workboard)
- [命令列介面參考](/zh-TW/cli)
- [斜線命令](/zh-TW/tools/slash-commands)
- [Control UI](/zh-TW/web/control-ui)
