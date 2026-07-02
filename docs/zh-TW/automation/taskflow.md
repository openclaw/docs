---
read_when:
    - 你想了解任務流程與背景工作的關係
    - 你會在版本說明或文件中遇到 TaskFlow 或 openclaw tasks flow
    - 你想要檢查或管理持久流程狀態
summary: 背景任務之上的任務流程編排層
title: 任務流程
x-i18n:
    generated_at: "2026-07-02T00:42:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是位於[背景任務](/zh-TW/automation/tasks)之上的流程編排基底。它管理具備自身狀態、修訂追蹤與同步語意的持久多步驟流程，而個別任務仍然是分離式工作的單位。

## 何時使用 Task Flow

當工作橫跨多個循序或分支步驟，且你需要在閘道重新啟動之間持久追蹤進度時，請使用 Task Flow。對於單一背景操作，普通的[任務](/zh-TW/automation/tasks)就足夠。

| 情境                                  | 使用                 |
| ------------------------------------- | -------------------- |
| 單一背景工作                          | 普通任務             |
| 多步驟管線（A 然後 B 然後 C）         | Task Flow（受管理）  |
| 觀察外部建立的任務                    | Task Flow（鏡像）    |
| 一次性提醒                            | 排程工作             |

## 可靠的排程工作流程模式

對於市場情報簡報這類週期性工作流程，請將排程、編排與可靠性檢查視為獨立層：

1. 使用[排程任務](/zh-TW/automation/cron-jobs)處理時機。
2. 將先前脈絡儲存在工作流程自己的檔案、資料庫或工具狀態中。
3. 使用 [Lobster](/zh-TW/tools/lobster) 處理確定性步驟、核准閘口與續傳權杖。
4. 使用 Task Flow 追蹤跨子任務、等待、重試與閘道重新啟動的多步驟執行。

範例排程形狀：

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

當工作應以已知聊天/工作階段作為傳遞脈絡或安全偏好設定種子時，使用 `session:<id>`。排程仍會在分離的工作階段中執行每次執行，因此請將前次執行摘要與常設工作流程狀態放在工作可讀取的明確儲存體中。

在工作流程內，將可靠性檢查放在 LLM 摘要步驟之前：

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

- 瀏覽器可用性與設定檔選擇，例如受管理狀態使用 `openclaw`，或需要已登入 Chrome 工作階段時使用 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 每個來源的 API 憑證與配額。
- 必要端點的網路可達性。
- 代理已啟用必要工具，例如 `lobster`、`browser` 與 `llm-task`。
- 已為排程設定失敗目的地，讓預檢失敗可見。請參閱[排程任務](/zh-TW/automation/cron-jobs#delivery-and-output)。

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

讓工作流程在摘要前拒絕或標記過期項目。LLM 步驟應只接收結構化 JSON，並應要求它在輸出中保留 `sourceUrl`、`retrievedAt` 與 `asOf`。當你需要在工作流程內使用經結構描述驗證的模型步驟時，請使用 [LLM Task](/zh-TW/tools/llm-task)。

對於可重用的團隊或社群工作流程，請將命令列介面、`.lobster` 檔案與任何設定說明封裝為 skill 或外掛，並透過 [ClawHub](/clawhub) 發布。除非外掛 API 缺少所需的通用能力，否則請將工作流程專屬防護規則保留在該套件中。

## 同步模式

### 受管理模式

Task Flow 擁有端到端生命週期。它將任務建立為流程步驟，推動它們完成，並自動推進流程狀態。

範例：每週報告流程會 (1) 收集資料、(2) 產生報告，並 (3) 傳遞報告。Task Flow 會將每個步驟建立為背景任務，等待完成後，再移至下一步。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 鏡像模式

Task Flow 會觀察外部建立的任務，並在不取得任務建立所有權的情況下，讓流程狀態保持同步。當任務來自排程工作、命令列介面命令或其他來源，而你想要以流程形式統一檢視其進度時，這很有用。

範例：三個獨立的排程工作共同形成「morning ops」例行程序。鏡像流程會追蹤它們的整體進度，而不控制它們何時或如何執行。

## 持久狀態與修訂追蹤

每個流程都會持久保存自己的狀態並追蹤修訂，因此進度可在閘道重新啟動後保留。修訂追蹤可在多個來源嘗試同時推進同一流程時啟用衝突偵測。
流程登錄使用 SQLite，並具備有界限的預寫記錄維護，包括
週期性與關機檢查點，因此長時間執行的閘道不會保留
無界限的 `registry.sqlite-wal` 側車檔案。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定黏著的取消意圖。流程內的作用中任務會被取消，且不會啟動新步驟。取消意圖會在重新啟動後保留，因此已取消的流程即使在所有子任務終止前閘道重新啟動，也會保持取消狀態。

## 命令列介面命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 說明                                     |
| --------------------------------- | ---------------------------------------- |
| `openclaw tasks flow list`        | 顯示已追蹤流程及其狀態與同步模式         |
| `openclaw tasks flow show <id>`   | 依流程 ID 或查詢鍵檢查單一流程           |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其作用中任務           |

## 流程如何與任務相關

流程會協調任務，而不是取代任務。單一流程在其生命週期內可能驅動多個背景任務。使用 `openclaw tasks` 檢查個別任務記錄，並使用 `openclaw tasks flow` 檢查負責編排的流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 流程所協調的分離式工作帳本
- [命令列介面：tasks](/zh-TW/cli/tasks) — `openclaw tasks flow` 的命令列介面命令參考
- [自動化概覽](/zh-TW/automation) — 所有自動化機制一覽
- [排程工作](/zh-TW/automation/cron-jobs) — 可能輸入流程的排程工作
