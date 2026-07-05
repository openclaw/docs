---
read_when:
    - 你想了解 Task Flow 與背景工作之間的關係
    - 你會在發行說明或文件中遇到 TaskFlow 或 OpenClaw 任務流程
    - 你想要檢查或管理持久流程狀態
summary: 位於背景任務之上的任務流程編排層
title: TaskFlow
x-i18n:
    generated_at: "2026-07-05T11:01:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow 是 [背景工作](/zh-TW/automation/tasks) 之上的協調層。流程是多步驟工作的持久記錄，具有自己的狀態、JSON 狀態、修訂計數器，以及連結的工作記錄。流程可在閘道重新啟動後保留；個別工作仍是分離式工作的單位。

## 何時使用 Task Flow

| 情境                                      | 使用                                        |
| ----------------------------------------- | ------------------------------------------- |
| 單一背景工作                              | 一般工作                                    |
| 由外掛程式碼驅動的多步驟管線              | Task Flow（受管理）                         |
| 分離式 ACP 或子代理產生                   | Task Flow（鏡像，會自動建立）               |
| 一次性提醒                                | 排程工作                                    |

## 同步模式

### 受管理模式

受管理流程有一個控制器：外掛程式碼會透過外掛執行階段 Task Flow API，以目標和必要的控制器 ID 建立流程，然後明確驅動它。

- 每個步驟都會作為流程下建立的背景工作執行；流程的擁有者鍵和請求者來源會帶到子工作。
- 控制器會在 `running`、`waiting` 和終止狀態之間推進流程，並在流程記錄上儲存任意 JSON 步驟狀態。
- 每次變更都會傳入流程的預期修訂版。過期寫入會因修訂衝突而遭拒，而不是覆蓋較新的狀態。
- 一旦請求取消，就會拒絕新的子工作，並且當沒有子工作仍在作用中時，流程會以 `cancelled` 完成。

範例：每週報告流程會 (1) 收集資料、(2) 產生報告、(3) 交付報告，每個步驟各一個背景工作：

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 鏡像模式

當分離式 ACP 或子代理執行開始時（具有可交付完成結果的工作階段範圍工作），OpenClaw 會自動建立一個鏡像的單工作流程。流程記錄會鏡像其單一後端工作 - 狀態、目標和時間 - 讓分離式產生項目不需要控制器，也能取得穩定的流程控制代碼，用於狀態和重試介面。鏡像流程會在命令列介面中顯示同步模式 `task_mirrored`。

## 流程狀態

| 狀態        | 意義                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已建立，尚未推進                                                           |
| `running`   | 流程正在主動推進                                                           |
| `waiting`   | 受管理流程停駐在等待中繼資料上（計時器、外部事件）                         |
| `blocked`   | 某個步驟完成但沒有可用結果；`blockedTaskId`/摘要會說明是哪一個             |
| `succeeded` | 已成功完成                                                                 |
| `failed`    | 已完成但發生錯誤                                                           |
| `cancelled` | 已請求取消，且所有子工作都已結束                                           |
| `lost`      | 流程遺失其權威後端狀態                                                     |

## 持久狀態與修訂追蹤

流程記錄會與工作記錄一起持久保存在共用 SQLite 狀態資料庫（`~/.openclaw/state/openclaw.sqlite`，`flow_runs` 資料表）中，因此進度可在閘道重新啟動後保留。每次寫入都會遞增流程的 `revision`；傳入過期預期修訂版的並行寫入者會收到衝突，且必須重新讀取。WAL 成長會由 SQLite 自動檢查點加上週期性被動檢查點限制，並在關閉時執行截斷檢查點。舊版安裝中的傳統 `flows/registry.sqlite` 附屬資料庫會由 `openclaw doctor` 匯入。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定黏著的取消意圖、取消其作用中的子工作，並拒絕新的受管理子工作。一旦沒有子工作仍在作用中，流程會以 `cancelled` 完成 - 立即完成，或如果子工作需要更久才結束，則由維護掃描完成。此意圖會持久保存，因此即使閘道在所有子工作終止前重新啟動，已取消的流程仍會保持取消狀態。

## 命令列介面命令

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令                              | 說明                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 追蹤的流程，包含同步模式、狀態、修訂版、控制器、工作計數               |
| `openclaw tasks flow show <id>`   | 依流程 ID 或擁有者鍵檢查單一流程，包含連結的工作                       |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其作用中的工作                                       |

流程也涵蓋在 `openclaw tasks audit`（過期或損壞的流程發現項目）和 `openclaw tasks maintenance`（完成卡住的取消，並在 7 天後修剪終止流程）中。

## 可靠的排程工作流程模式

對於市場情報簡報等週期性工作流程，請將排程、協調和可靠性檢查視為獨立層：

1. 使用[排程工作](/zh-TW/automation/cron-jobs)處理時間安排。
2. 當工作流程應建立在先前脈絡上時，使用持久排程工作階段。
3. 使用 [Lobster](/zh-TW/tools/lobster) 處理確定性步驟、核准閘門和恢復權杖。
4. 使用 Task Flow 追蹤跨子工作、等待、重試和閘道重新啟動的多步驟執行。

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

當週期性工作流程需要刻意保留歷史、先前執行摘要或常駐脈絡時，請使用 `--session session:<id>`，而不是 `isolated`。當每次執行都應從全新狀態開始，且所有必要狀態都已在工作流程中明確指定時，請使用 `isolated`。

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

- 瀏覽器可用性和設定檔選擇，例如用於受管理狀態的 `openclaw`，或需要已登入 Chrome 工作階段時使用的 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 每個來源的 API 認證和配額。
- 必要端點的網路可達性。
- 代理已啟用必要工具，例如 `lobster`、`browser` 和 `llm-task`。
- 已為排程設定失敗目的地，讓預檢失敗可見。請參閱[排程工作](/zh-TW/automation/cron-jobs#delivery-and-output)。

每個已收集項目建議使用的資料來源欄位：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

讓工作流程在摘要之前拒絕或標記過期項目。LLM 步驟應只接收結構化 JSON，並應要求其在輸出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。當你需要在工作流程內使用經結構描述驗證的模型步驟時，請使用 [LLM Task](/zh-TW/tools/llm-task)。

對於可重複使用的團隊或社群工作流程，請將命令列介面、`.lobster` 檔案，以及任何設定注意事項封裝為 skill 或外掛，並透過 [ClawHub](/zh-TW/clawhub) 發布。除非外掛 API 缺少所需的通用能力，否則請將工作流程特定的防護措施保留在該套件中。

## 流程與工作的關係

流程會協調工作，而不是取代工作。單一流程在其生命週期中可能驅動多個背景工作。使用 `openclaw tasks` 檢查個別工作記錄，並使用 `openclaw tasks flow` 檢查協調流程。

## 相關

- [背景工作](/zh-TW/automation/tasks) - 流程所協調的分離式工作分類帳
- [命令列介面：tasks](/zh-TW/cli/tasks) - `openclaw tasks flow` 的命令列介面命令參考
- [自動化概覽](/zh-TW/automation) - 所有自動化機制一覽
- [排程工作](/zh-TW/automation/cron-jobs) - 可能匯入流程的排程工作
