---
read_when:
    - 您想了解任務流程與背景任務的關係
    - 您會在版本資訊或文件中遇到 TaskFlow 或 openclaw tasks flow
    - 你想檢查或管理持久化流程狀態
summary: TaskFlow 位於背景任務之上的流程編排層
title: 任務流程
x-i18n:
    generated_at: "2026-05-10T19:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是位於[背景任務](/zh-TW/automation/tasks)之上的流程編排基底。它會管理具備自身狀態、修訂追蹤與同步語義的持久多步驟流程，而個別任務仍然是分離工作的單位。

## 何時使用 Task Flow

當工作跨越多個循序或分支步驟，而且你需要在 Gateway 重新啟動後仍能持久追蹤進度時，請使用 Task Flow。對於單一背景操作，普通[任務](/zh-TW/automation/tasks)就已足夠。

| 情境                                  | 使用方式               |
| ------------------------------------- | -------------------- |
| 單一背景工作                          | 普通任務             |
| 多步驟管線（A 接著 B 接著 C）          | Task Flow（受管理）  |
| 觀察外部建立的任務                    | Task Flow（鏡像）    |
| 一次性提醒                            | Cron 作業            |

## 可靠的排程工作流程模式

對於市場情報簡報等週期性工作流程，請將排程、編排與可靠性檢查視為不同層級：

1. 使用[排程任務](/zh-TW/automation/cron-jobs)處理時間安排。
2. 當工作流程應建立在先前脈絡之上時，使用持久的 cron 工作階段。
3. 使用 [Lobster](/zh-TW/tools/lobster) 處理確定性步驟、核准閘門與繼續權杖。
4. 使用 Task Flow 追蹤跨越子任務、等待、重試與 Gateway 重新啟動的多步驟執行。

範例 cron 形態：

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

當週期性工作流程需要刻意保留歷史、先前執行摘要或常駐脈絡時，請使用 `session:<id>` 而不是 `isolated`。當每次執行都應從全新狀態開始，而且所有必要狀態都已明確寫在工作流程中時，請使用 `isolated`。

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

建議的預檢項目：

- 瀏覽器可用性與設定檔選擇，例如使用 `openclaw` 取得受管理狀態，或在需要已登入的 Chrome 工作階段時使用 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 每個來源的 API 憑證與配額。
- 必要端點的網路可達性。
- 已為代理啟用必要工具，例如 `lobster`、`browser` 與 `llm-task`。
- 已為 cron 設定失敗目的地，讓預檢失敗可見。請參閱[排程任務](/zh-TW/automation/cron-jobs#delivery-and-output)。

每個收集項目建議包含的資料來源欄位：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

讓工作流程在摘要之前拒絕或標記過期項目。LLM 步驟應只接收結構化 JSON，並應要求它在輸出中保留 `sourceUrl`、`retrievedAt` 與 `asOf`。當你需要在工作流程中加入經結構描述驗證的模型步驟時，請使用 [LLM Task](/zh-TW/tools/llm-task)。

對於可重複使用的團隊或社群工作流程，請將 CLI、`.lobster` 檔案與任何設定說明封裝為 skill 或 plugin，並透過 [ClawHub](/zh-TW/clawhub) 發佈。除非 Plugin API 缺少所需的通用能力，否則請將工作流程專屬的防護規則保留在該套件中。

## 同步模式

### 受管理模式

Task Flow 擁有端到端生命週期。它會建立作為流程步驟的任務、推動它們完成，並自動推進流程狀態。

範例：每週報告流程會 (1) 收集資料、(2) 產生報告，並 (3) 交付報告。Task Flow 會將每個步驟建立為背景任務，等待完成，然後移至下一個步驟。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 鏡像模式

Task Flow 會觀察外部建立的任務，並在不接管任務建立權的情況下保持流程狀態同步。當任務來自 cron 作業、CLI 命令或其他來源，而你想以流程形式統一查看其進度時，這會很有用。

範例：三個彼此獨立的 cron 作業共同組成「早晨營運」例行工作。鏡像流程會追蹤它們的整體進度，但不控制它們何時或如何執行。

## 持久狀態與修訂追蹤

每個流程都會持久保存自己的狀態並追蹤修訂，因此進度可在 Gateway 重新啟動後保留。當多個來源嘗試同時推進同一個流程時，修訂追蹤可啟用衝突偵測。
流程登錄使用 SQLite，並具備有界限的預寫式日誌維護，包括
定期與關機檢查點，因此長時間執行的 Gateway 不會保留
無界限的 `registry.sqlite-wal` sidecar 檔案。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定黏性的取消意圖。流程中的作用中任務會被取消，且不會啟動新步驟。取消意圖會在重新啟動後保留，因此即使 Gateway 在所有子任務終止前重新啟動，已取消的流程仍會保持取消狀態。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 說明                                          |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 顯示含有狀態與同步模式的已追蹤流程            |
| `openclaw tasks flow show <id>`   | 依流程 ID 或查找鍵檢查單一流程                |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其作用中任務                |

## 流程與任務的關係

流程會協調任務，而不是取代任務。單一流程在其生命週期中可能驅動多個背景任務。使用 `openclaw tasks` 檢查個別任務記錄，並使用 `openclaw tasks flow` 檢查負責編排的流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 流程所協調的分離工作帳本
- [CLI：tasks](/zh-TW/cli/tasks) — `openclaw tasks flow` 的 CLI 命令參考
- [自動化概觀](/zh-TW/automation) — 所有自動化機制一覽
- [Cron 作業](/zh-TW/automation/cron-jobs) — 可能匯入流程的排程作業
