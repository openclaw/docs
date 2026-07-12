---
read_when:
    - 你想了解 Task Flow 與背景任務之間的關係
    - 你在版本資訊或文件中看到 Task Flow 或 openclaw tasks flow
    - 您想要檢查或管理持久化流程狀態
summary: 位於背景任務之上的 TaskFlow 編排層
title: 任務流程
x-i18n:
    generated_at: "2026-07-11T21:07:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

任務流程是位於[背景任務](/zh-TW/automation/tasks)之上的協調層。流程是多步驟工作的持久記錄，具有自己的狀態、JSON 狀態資料、修訂計數器，以及連結的任務記錄。流程可在閘道重新啟動後繼續存在；個別任務仍是分離式工作的基本單位。

## 何時使用任務流程

| 情境                              | 使用方式                               |
| --------------------------------- | -------------------------------------- |
| 單一背景工作                      | 一般任務                               |
| 由外掛程式碼驅動的多步驟管線      | 任務流程（受管理）                     |
| 分離式 ACP 或子代理程式生成        | 任務流程（鏡像，自動建立）             |
| 一次性提醒                        | 排程工作                               |

## 同步模式

### 受管理模式

受管理流程具有控制器：外掛程式碼透過外掛執行階段的任務流程 API，以目標和必要的控制器 ID 建立流程，然後明確驅動該流程。

- 每個步驟都會以流程下建立的背景任務執行；流程的擁有者索引鍵和請求者來源會沿用至子任務。
- 控制器會推進流程，使其在 `running`、`waiting` 和終止狀態之間轉換，並在流程記錄中儲存任意 JSON 步驟狀態。
- 每次變更都會傳入流程的預期修訂版本。過時的寫入會因修訂衝突而遭拒絕，而不會覆蓋較新的狀態。
- 一旦提出取消要求，系統便會拒絕新的子任務；當沒有任何子任務仍在執行時，流程會以 `cancelled` 狀態結束。

範例：每週報告流程會依序：(1) 收集資料、(2) 產生報告，以及 (3) 傳送報告，每個步驟各使用一項背景任務：

```
流程：weekly-report
  步驟 1：gather-data     → 已建立任務 → succeeded
  步驟 2：generate-report → 已建立任務 → succeeded
  步驟 3：deliver         → 已建立任務 → running
```

### 鏡像模式

當分離式 ACP 或子代理程式執行開始時（工作階段範圍內且完成時可交付的任務），OpenClaw 會自動建立僅含一項任務的鏡像流程。流程記錄會鏡像其唯一的後端任務，包括狀態、目標和時間資訊，因此分離式生成無須控制器，即可獲得穩定的流程控制代碼，以供狀態查詢和重試介面使用。鏡像流程在命令列介面中顯示的同步模式為 `task_mirrored`。

## 流程狀態

| 狀態        | 意義                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已建立，尚未開始推進                                                       |
| `running`   | 流程正在積極推進                                                           |
| `waiting`   | 受管理流程暫停於等待中繼資料（計時器、外部事件）                           |
| `blocked`   | 某個步驟已完成，但沒有可用結果；`blockedTaskId`／摘要會指出是哪個步驟      |
| `succeeded` | 已成功完成                                                                 |
| `failed`    | 因發生錯誤而完成                                                           |
| `cancelled` | 已要求取消，且所有子任務均已結束                                           |
| `lost`      | 流程遺失其具權威性的後端狀態                                               |

## 持久狀態與修訂追蹤

流程記錄會與任務記錄一同保存在共用 SQLite 狀態資料庫（`~/.openclaw/state/openclaw.sqlite` 的 `flow_runs` 資料表）中，因此進度可在閘道重新啟動後繼續保留。每次寫入都會遞增流程的 `revision`；並行寫入者若傳入過時的預期修訂版本，便會收到衝突，且必須重新讀取。SQLite 自動檢查點及定期被動檢查點會限制 WAL 的增長，關閉時則會執行截斷檢查點。舊版安裝中的傳統 `flows/registry.sqlite` 附屬資料庫會由 `openclaw doctor` 匯入。

## 取消行為

`openclaw tasks flow cancel` 會在流程上設定持續有效的取消意圖、取消其執行中的子任務，並拒絕新的受管理子任務。當沒有任何子任務仍在執行時，流程會以 `cancelled` 狀態結束；可能立即結束，也可能在子任務需要較長時間才能終止時，由維護掃描完成。此意圖會持久保存，因此即使閘道在所有子任務終止前重新啟動，已取消的流程仍會保持取消狀態。

## 命令列介面指令

```bash
# 列出執行中和最近的流程
openclaw tasks flow list [--status <status>] [--json]

# 顯示特定流程的詳細資料
openclaw tasks flow show <lookup> [--json]

# 取消執行中的流程及其執行中任務
openclaw tasks flow cancel <lookup>
```

| 指令                              | 說明                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 顯示追蹤中的流程及其同步模式、狀態、修訂版本、控制器和任務數量       |
| `openclaw tasks flow show <id>`   | 依流程 ID 或擁有者索引鍵檢查單一流程，包括連結的任務                 |
| `openclaw tasks flow cancel <id>` | 取消執行中的流程及其執行中任務                                       |

`openclaw tasks audit`（過時或損壞的流程發現項目）和 `openclaw tasks maintenance`（完成卡住的取消作業，並在 7 天後清除已終止的流程）也涵蓋流程。

## 可靠的排程工作流程模式

對於市場情報簡報等週期性工作流程，請將排程、協調和可靠性檢查視為不同層級：

1. 使用[排程任務](/zh-TW/automation/cron-jobs)控制執行時間。
2. 當工作流程應建立在先前的上下文上時，使用持久的排程工作階段。
3. 使用 [Lobster](/zh-TW/tools/lobster)處理確定性步驟、核准閘門和繼續執行權杖。
4. 使用任務流程追蹤跨越子任務、等待、重試和閘道重新啟動的多步驟執行。

排程形式範例：

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

當週期性工作流程需要刻意保留歷程、先前執行摘要或持續性上下文時，請使用 `--session session:<id>`，而非 `isolated`。當每次執行都應從全新狀態開始，且所有必要狀態皆已在工作流程中明確指定時，請使用 `isolated`。

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

建議的前置檢查：

- 瀏覽器可用性和設定檔選擇，例如受管理狀態使用 `openclaw`，需要已登入的 Chrome 工作階段時則使用 `user`。請參閱[瀏覽器](/zh-TW/tools/browser)。
- 各資料來源的 API 認證資料和配額。
- 必要端點的網路連線能力。
- 已為代理程式啟用必要工具，例如 `lobster`、`browser` 和 `llm-task`。
- 已為排程設定失敗目的地，使前置檢查失敗可被看見。請參閱[排程任務](/zh-TW/automation/cron-jobs#delivery-and-output)。

建議為每個收集項目提供下列資料來源欄位：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

讓工作流程在摘要前拒絕過時項目或將其標記為過時。大型語言模型步驟應僅接收結構化 JSON，且應要求它在輸出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。當工作流程內需要經結構描述驗證的模型步驟時，請使用[大型語言模型任務](/zh-TW/tools/llm-task)。

對於可供團隊或社群重複使用的工作流程，請將命令列介面、`.lobster` 檔案和任何設定說明封裝為技能或外掛，並透過 [ClawHub](/clawhub) 發布。除非外掛 API 缺少必要的通用功能，否則請將工作流程專用的防護措施保留在該套件中。

## 流程與任務的關係

流程負責協調任務，而非取代任務。單一流程在其存續期間可能驅動多項背景任務。使用 `openclaw tasks` 檢查個別任務記錄，並使用 `openclaw tasks flow` 檢查負責協調的流程。

## 相關內容

- [背景任務](/zh-TW/automation/tasks)－流程所協調的分離式工作帳冊
- [命令列介面：任務](/zh-TW/cli/tasks)－`openclaw tasks flow` 的命令列介面指令參考
- [自動化概覽](/zh-TW/automation)－所有自動化機制一覽
- [排程工作](/zh-TW/automation/cron-jobs)－可提供輸入給流程的排程工作
