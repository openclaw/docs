---
read_when:
    - 你想要從終端機檢查或建立 Workboard 卡片
    - 你想要從命令列介面分派 Workboard 工作執行程序
    - 你正在偵錯 Workboard 命令列介面或斜線指令的行為
summary: '`openclaw workboard` 卡片、分派與工作程序執行的命令列介面參考資料'
title: 工作看板命令列介面
x-i18n:
    generated_at: "2026-07-19T13:45:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 640260ea6f5959b3aee1cdce76f2501097bff79e9bf1741bdd9ff7a8b43e1a7f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` 是隨附 [Workboard 外掛](/zh-TW/plugins/workboard)的終端操作介面。它可讓操作員列出卡片、建立卡片、檢視單張卡片，並要求執行中的閘道將已就緒工作分派至子代理工作執行。

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
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

此命令讀寫儀表板與 Workboard 代理工具所使用的同一個外掛自有 SQLite 資料庫。卡片 ID 為 UUID；接受卡片 ID 的命令也接受明確無歧義的 ID 前綴（精簡文字輸出會顯示前 8 個字元）。

有效的 `status` 值：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有效的 `priority` 值：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

文字輸出採精簡格式：

```text
7f4a2c10  ready     high    default agent-a  修正過期的工作程序心跳偵測
```

各欄依序為 ID 前綴、狀態、優先順序、看板 ID、選用的代理 ID，以及標題。

| 旗標                 | 用途                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 將結果限制在單一看板命名空間          |
| `--status <status>`  | 將結果限制在單一 Workboard 狀態         |
| `--include-archived` | 在精簡文字輸出中包含已封存卡片 |
| `--json`             | 將完整卡片清單輸出為機器可讀的 JSON      |

精簡文字輸出預設會隱藏已封存卡片，使命令列介面與 `/workboard list` 保持一致。傳入 `--include-archived` 即可顯示這些卡片。為了支援既有自動化，JSON 輸出一律保留完整卡片清單，包括已封存卡片。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 旗標                    | 用途                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 卡片的初始備註                      |
| `--status <status>`     | 初始狀態，預設為 `todo`          |
| `--priority <priority>` | 優先順序，預設為 `normal`              |
| `--agent <id>`          | 將卡片指派給代理或擁有者 ID |
| `--board <id>`          | 將卡片儲存在看板命名空間中     |
| `--labels <items>`      | 以逗號分隔的標籤                  |
| `--json`                | 將建立的卡片輸出為機器可讀的 JSON  |

`create` 會直接寫入 Workboard SQLite 狀態。卡片會立即顯示在 Control UI 的 Workboard 分頁中，Workboard 工具也能立即存取。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

文字輸出會顯示精簡卡片列與備註。JSON 輸出會傳回完整卡片記錄，包括執行中繼資料、嘗試次數、留言、連結、證明、成品、工作程序日誌、通訊協定狀態、診斷資訊及自動化中繼資料。

JSON 中的證明狀態是工作程序回報的結果。`passed` 記錄工作程序對所附命令或檢查的
自我評估；它不是獨立驗證
結果。

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` 會透過與在儀表板中拖曳卡片相同的手動操作員路徑，變更卡片狀態。它接受完整卡片 ID 或明確無歧義的前綴。有效的相依性與排程暫停仍會套用。操作員可以在沒有代理認領權杖的情況下移動已認領卡片；認領權杖仍僅限代理工具變更使用，且會從 JSON 輸出中遮蔽。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` 會先呼叫執行中閘道的 RPC 方法 `workboard.cards.dispatch`，此方法使用與儀表板分派動作相同的子代理執行環境，因此已就緒卡片會成為具備連結工作階段金鑰且受到任務追蹤的工作程序執行。`--max-starts` 使用新增的 `workboard.cards.dispatchWithOptions` 方法，讓較舊的閘道在啟動任何工作程序前拒絕此選項；升級後請先重新啟動閘道，再使用此旗標。已指派代理的卡片使用代理範圍的子代理工作階段金鑰；未指派的卡片則保留無範圍的子代理金鑰，以保留閘道所設定的預設代理。

分派迴圈：

1. 將相依性已就緒的子項提升至 `ready`。
2. 封鎖已到期的認領或逾時的工作程序執行。
3. 在已就緒卡片上記錄分派中繼資料。
4. 選取一小批尚未認領的已就緒卡片。
5. 由分派器或獲指派的代理認領每張選定的卡片。
6. 使用受限的卡片內容與卡片認領權杖啟動子代理工作程序執行。
7. 將工作程序執行 ID、工作階段金鑰、閘道任務總帳回報的任務連結、執行狀態及工作程序日誌儲存在卡片上。

選取方式較為保守：單次分派預設最多啟動三個工作程序、略過已封存或已認領的卡片，且每輪只為每位擁有者或代理啟動一張卡片。已有進行中或審查中工作的擁有者，其卡片會留待後續分派。傳入帶正整數的 `--max-starts <count>` 可變更每輪上限；每位擁有者一張卡片的規則仍然適用，因此實際啟動數可能較低。

若卡片認領後無法啟動工作程序，Workboard 會封鎖該卡片、清除認領，並將失敗記錄於卡片執行與工作程序日誌中繼資料中，讓失敗的啟動保持可見，而非無聲地將卡片送回佇列。

若未明確指定閘道目標，且本機閘道無法使用或尚未公開 Workboard 分派方法，命令列介面會改用本機 Workboard 狀態進行僅資料分派。僅資料分派仍可提升相依項目、清理過期認領及封鎖逾時執行，但不會啟動工作程序。驗證、權限與資料驗證失敗，以及明確 `--url` 或 `--token` 目標的失敗，都會直接回報，而不會觸發後援機制。

文字輸出會回報工作程序啟動數：

```text
分派完成：已啟動=2 失敗=0
```

後援輸出會明確標示：

```text
閘道無法使用；僅執行資料分派：已提升=1 已封鎖=0
```

JSON 輸出包含分派結果。由閘道支援的分派可能包含 `started` 與 `startFailures`；僅資料後援則包含 `gatewayUnavailable: true`。卡片 JSON 輸出會遮蔽認領權杖。

在儀表板中，相同的分派結果會顯示為簡短摘要，讓操作員不必開啟卡片詳細資料，即可查看有多少卡片已啟動、提升、封鎖、重新認領或失敗。

## 斜線命令功能對等

支援命令的頻道可以使用對應的斜線命令：

```text
/workboard list
/workboard show 7f4a2c10
/workboard create 修正過期的工作程序心跳偵測
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

斜線命令分派也使用閘道子代理執行環境，因此其認領、工作程序啟動及失敗行為與儀表板和命令列介面的閘道路徑相同。

`/workboard list` 與 `/workboard show` 是供獲授權命令傳送者使用的讀取命令。`/workboard create`、`/workboard move` 與 `/workboard dispatch` 會變更看板狀態，並要求在聊天介面上具備擁有者身分，或使用具備 `operator.write` 或 `operator.admin` 的閘道用戶端。

## 權限

命令列介面分派路徑通常會要求閘道 `operator.write` 與 `operator.read` 範圍。繫結至工作區的卡片會直接在精確設定的代理工作區中執行；工作樹要求會限縮至該目錄，而不是讓主機具現化由儲存庫控制的程式碼。選定的工作程序必須具有對該確切工作區可寫入、非共用的 Docker 沙箱存取權，容器雜湊必須仍然有效並符合要求的掛載與政策，且不得具備逃逸至主機的能力。傳入 `--admin` 可明確要求 `operator.admin`、允許另一個主機簽出，並使用一般的受管理工作樹設定；若用戶端未獲准使用該範圍，連線將會失敗。唯讀閘道權杖可以透過讀取方法檢視 Workboard 資料，但無法建立卡片或分派工作程序。對具備 Workboard 變更權限的呼叫端而言，工作區限制不會以其他方式改變手動卡片移動。

本機 `list`、`create`、`show` 與 `move` 命令會操作目前設定檔所使用的本機 OpenClaw 狀態目錄。需要使用不同的狀態根目錄時，請在頂層 `openclaw` 命令上使用 `--dev` 或 `--profile <name>`。

## 疑難排解

### 未顯示任何卡片

確認已針對相同的設定檔與狀態根目錄啟用此外掛：

```bash
openclaw plugins inspect workboard --runtime --json
```

若儀表板顯示卡片，但命令列介面沒有顯示，請確認兩個命令使用相同的 `--dev` 或 `--profile` 設定。

### 分派顯示僅資料模式

啟動或重新啟動閘道：

```bash
openclaw gateway restart
openclaw gateway status --deep
```

接著重試 `openclaw workboard dispatch`。僅資料後援適合清理本機狀態，但工作程序執行需要可用的閘道。

### 分派未啟動任何項目

檢查是否至少有一張沒有有效認領的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

若同一位擁有者已有進行中或審查中的工作，卡片也可能會被略過。請將已完成工作移至 `done`、透過 Workboard 工具釋放過期認領，或在有效工作程序完成後再次執行分派。

## 相關內容

- [Workboard 外掛](/zh-TW/plugins/workboard)
- [命令列介面參考](/zh-TW/cli)
- [斜線命令](/zh-TW/tools/slash-commands)
- [Control UI](/zh-TW/web/control-ui)
