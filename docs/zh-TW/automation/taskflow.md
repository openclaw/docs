---
read_when:
    - 你想了解任務流程與背景任務的關係
    - 你會在版本資訊或文件中遇到任務流程或 `openclaw tasks flow`
    - 你想要檢查或管理持久流程狀態
summary: 背景工作之上的工作流程編排層
title: 任務流程
x-i18n:
    generated_at: "2026-07-02T07:58:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是位於[背景工作](/zh-TW/automation/tasks)之上的流程編排基礎層。它管理具備自身狀態、修訂追蹤與同步語意的持久多步驟流程，而個別工作仍然是分離工作的單位。

## 何時使用 Task Flow

當工作橫跨多個循序或分支步驟，且你需要在閘道重新啟動後仍能持久追蹤進度時，請使用 Task Flow。對於單一背景操作，普通的[工作](/zh-TW/automation/tasks)就足夠。

| 情境                                  | 使用方式             |
| ------------------------------------- | -------------------- |
| 單一背景作業                          | 普通工作             |
| 多步驟管線（A 接著 B 接著 C）         | Task Flow（受管理）  |
| 觀察外部建立的工作                    | Task Flow（鏡像）    |
| 一次性提醒                            | 排程工作             |

## 可靠的排程工作流程模式

對於市場情報簡報等週期性工作流程，請將排程、編排與可靠性檢查視為不同層級：

1. 使用[排程工作](/zh-TW/automation/cron-jobs)處理時間安排。
2. 當工作流程需要建立在先前脈絡上時，使用持久排程工作階段。
3. 使用 [Lobster](/zh-TW/tools/lobster) 處理確定性步驟、核准閘門與續行權杖。
4. 使用 Task Flow 跨子工作、等待、重試與閘道重新啟動追蹤多步驟執行。

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

當週期性工作流程需要刻意保留歷史、先前執行摘要或常駐脈絡時，請使用 `session:<id>` 而不是 `isolated`。當每次執行都應該從全新狀態開始，且所有必要狀態都已在工作流程中明確指定時，請使用 `isolated`。

在工作流程內，請將可靠性檢查放在大型語言模型摘要步驟之前：

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

- 瀏覽器可用性與設定檔選擇，例如使用 `openclaw` 進行受管理狀態，或在需要已登入 Chrome 工作階段時使用 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 每個來源的 API 憑證與配額。
- 必要端點的網路可達性。
- 為代理啟用的必要工具，例如 `lobster`、`browser` 與 `llm-task`。
- 已為排程設定失敗目的地，讓預檢失敗可見。請參閱[排程工作](/zh-TW/automation/cron-jobs#delivery-and-output)。

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

讓工作流程在摘要前拒絕或標記過期項目。大型語言模型步驟應該只接收結構化 JSON，並應要求它在輸出中保留 `sourceUrl`、`retrievedAt` 與 `asOf`。當你需要在工作流程內使用經結構描述驗證的模型步驟時，請使用 [LLM Task](/zh-TW/tools/llm-task)。

對於可重複使用的團隊或社群工作流程，請將命令列介面、`.lobster` 檔案與任何設定說明封裝為 skill 或外掛，並透過 [ClawHub](/clawhub) 發布。除非外掛 API 缺少必要的通用能力，否則請將工作流程專屬的防護措施保留在該套件中。

## 同步模式

### 受管理模式

Task Flow 端到端擁有生命週期。它會將工作建立為流程步驟、驅動它們完成，並自動推進流程狀態。

範例：每週報告流程會 (1) 收集資料、(2) 產生報告，並 (3) 交付報告。Task Flow 會將每個步驟建立為背景工作、等待完成，然後移至下一個步驟。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 鏡像模式

Task Flow 會觀察外部建立的工作，並在不取得工作建立所有權的情況下，讓流程狀態保持同步。當工作源自排程工作、命令列介面命令或其他來源，而你想要以流程形式統一檢視其進度時，這會很有用。

範例：三個獨立排程工作共同形成「晨間維運」例行程序。鏡像流程會追蹤它們的整體進度，但不控制它們何時或如何執行。

## 持久狀態與修訂追蹤

每個流程都會持久保存自己的狀態並追蹤修訂，因此進度可在閘道重新啟動後保留下來。當多個來源嘗試同時推進同一個流程時，修訂追蹤可啟用衝突偵測。
流程登錄使用 SQLite 搭配有界限的預寫式記錄維護，包括
週期性與關機檢查點，因此長時間執行的閘道不會保留
無界限的 `registry.sqlite-wal` 附屬檔案。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定黏性的取消意圖。流程中的作用中工作會被取消，且不會啟動新的步驟。取消意圖會在重新啟動後持續存在，因此即使閘道在所有子工作終止前重新啟動，已取消的流程仍會保持取消狀態。

## 命令列介面命令

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
| `openclaw tasks flow list`        | 顯示包含狀態與同步模式的已追蹤流程            |
| `openclaw tasks flow show <id>`   | 依流程 ID 或查找鍵檢查單一流程                |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其作用中工作                |

## 流程與工作的關係

流程會協調工作，而不是取代工作。單一流程在其生命週期中可能會驅動多個背景工作。使用 `openclaw tasks` 檢查個別工作記錄，並使用 `openclaw tasks flow` 檢查進行編排的流程。

## 相關內容

- [背景工作](/zh-TW/automation/tasks) — 流程所協調的分離工作帳本
- [命令列介面：tasks](/zh-TW/cli/tasks) — `openclaw tasks flow` 的命令列介面命令參考
- [自動化概覽](/zh-TW/automation) — 所有自動化機制一覽
- [排程工作](/zh-TW/automation/cron-jobs) — 可能饋入流程的排程工作
