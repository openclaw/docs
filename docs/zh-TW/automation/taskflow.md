---
read_when:
    - 你想了解 Task Flow 與背景任務之間的關係
    - 你會在發行說明或文件中遇到 TaskFlow 或 OpenClaw 任務流程
    - 你想要檢視或管理持久化的流程狀態
summary: 位於背景任務之上的 TaskFlow 流程編排層
title: 任務流程
x-i18n:
    generated_at: "2026-04-30T02:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

TaskFlow 是位於[背景任務](/zh-TW/automation/tasks)之上的流程編排基底。它會管理具有自身狀態、修訂追蹤與同步語義的持久多步驟流程，而個別任務仍是分離工作的單位。

## 何時使用 TaskFlow

當工作橫跨多個循序或分支步驟，且需要在 gateway 重新啟動後仍能持久追蹤進度時，請使用 TaskFlow。對於單一背景作業，普通的[任務](/zh-TW/automation/tasks)就已足夠。

| 情境                                  | 使用方式             |
| ------------------------------------- | -------------------- |
| 單一背景工作                          | 普通任務             |
| 多步驟管線（A 接著 B 接著 C）         | TaskFlow（受管理）   |
| 觀察外部建立的任務                    | TaskFlow（鏡像）     |
| 一次性提醒                            | Cron 工作            |

## 可靠的排程工作流程模式

對於市場情報簡報等週期性工作流程，請將排程、編排與可靠性檢查視為不同層次：

1. 使用[排程任務](/zh-TW/automation/cron-jobs)處理時機。
2. 當工作流程應該基於先前脈絡延續時，使用持久 cron 工作階段。
3. 使用 [Lobster](/zh-TW/tools/lobster) 處理確定性步驟、核准關卡與續接權杖。
4. 使用 TaskFlow 在子任務、等待、重試與 gateway 重新啟動之間追蹤多步驟執行。

範例 cron 形狀：

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

當週期性工作流程需要刻意保留的歷史、前次執行摘要或常駐脈絡時，請使用 `session:<id>` 而不是 `isolated`。當每次執行都應該從全新狀態開始，且所有必要狀態都已在工作流程中明確指定時，請使用 `isolated`。

在工作流程內，請將可靠性檢查放在 LLM 摘要步驟之前：

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

建議的預檢檢查：

- 瀏覽器可用性與設定檔選擇，例如受管理狀態使用 `openclaw`，需要已登入的 Chrome 工作階段時使用 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 每個來源的 API 認證與配額。
- 必要端點的網路可連線性。
- 已為 agent 啟用必要工具，例如 `lobster`、`browser` 與 `llm-task`。
- 已為 cron 設定失敗目的地，讓預檢失敗可見。請參閱[排程任務](/zh-TW/automation/cron-jobs#delivery-and-output)。

每個收集項目的建議資料來源欄位：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

讓工作流程在摘要前拒絕或標記過期項目。LLM 步驟應該只接收結構化 JSON，並應要求它在輸出中保留 `sourceUrl`、`retrievedAt` 與 `asOf`。當你需要在工作流程內使用經 schema 驗證的模型步驟時，請使用 [LLM Task](/zh-TW/tools/llm-task)。

對於可重複使用的團隊或社群工作流程，請將 CLI、`.lobster` 檔案與任何設定說明封裝為 skill 或 plugin，並透過 [ClawHub](/zh-TW/tools/clawhub) 發布。除非 plugin API 缺少必要的通用能力，否則請將工作流程特定的防護規則保留在該套件中。

## 同步模式

### 受管理模式

TaskFlow 端到端擁有生命週期。它會建立任務作為流程步驟、驅動它們完成，並自動推進流程狀態。

範例：每週報告流程會 (1) 收集資料、(2) 產生報告，並 (3) 傳送報告。TaskFlow 會將每個步驟建立為背景任務，等待完成，然後移至下一個步驟。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 鏡像模式

TaskFlow 會觀察外部建立的任務，並在不取得任務建立所有權的情況下讓流程狀態保持同步。當任務來自 cron 工作、CLI 命令或其他來源，而你想要以流程形式統一檢視其進度時，這很有用。

範例：三個獨立的 cron 工作共同構成一個「早晨營運」例行流程。鏡像流程會追蹤它們的整體進度，而不控制它們何時或如何執行。

## 持久狀態與修訂追蹤

每個流程都會保留自身狀態並追蹤修訂，讓進度能在 gateway 重新啟動後延續。當多個來源嘗試同時推進同一個流程時，修訂追蹤可啟用衝突偵測。
流程登錄使用 SQLite，並搭配有界限的預寫日誌維護，包括
定期與關閉時的檢查點，因此長時間執行的 gateway 不會保留
無界限的 `registry.sqlite-wal` 附屬檔案。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定黏著的取消意圖。流程內的作用中任務會被取消，且不會啟動新的步驟。取消意圖會在重新啟動後持續存在，因此即使 gateway 在所有子任務終止前重新啟動，已取消的流程仍會保持取消狀態。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 說明                                         |
| --------------------------------- | -------------------------------------------- |
| `openclaw tasks flow list`        | 顯示受追蹤流程的狀態與同步模式               |
| `openclaw tasks flow show <id>`   | 依流程 ID 或查找鍵檢查單一流程               |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其作用中任務               |

## 流程與任務的關係

流程會協調任務，而不是取代任務。單一流程在其生命週期內可能驅動多個背景任務。使用 `openclaw tasks` 檢查個別任務記錄，並使用 `openclaw tasks flow` 檢查編排流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 流程所協調的分離工作帳本
- [CLI：任務](/zh-TW/cli/tasks) — `openclaw tasks flow` 的 CLI 命令參考
- [自動化概覽](/zh-TW/automation) — 所有自動化機制一覽
- [Cron 工作](/zh-TW/automation/cron-jobs) — 可能提供資料給流程的排程工作
