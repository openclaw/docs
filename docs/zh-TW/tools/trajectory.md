---
read_when:
    - 偵錯代理程式為何以特定方式回答、失敗或呼叫工具
    - 匯出 OpenClaw 工作階段的支援套件
    - 調查提示詞上下文、工具呼叫、執行階段錯誤或用量中繼資料
    - 停用軌跡擷取
summary: 匯出經過遮蔽處理的軌跡套件，以偵錯 OpenClaw 代理工作階段
title: 軌跡套件組合
x-i18n:
    generated_at: "2026-07-12T14:55:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

軌跡擷取是 OpenClaw 的個別工作階段飛行記錄器。它會記錄每次代理程式執行的
結構化時間軸，接著 `/export-trajectory` 會將目前工作階段封裝成經過遮蔽的支援套件，其中包括：

- 傳送給模型的提示詞、系統提示詞與工具
- 哪些逐字稿訊息與工具呼叫促成了回答
- 執行是否逾時、中止、經過壓縮，或遇到供應商錯誤
- 當時啟用的模型、外掛、Skills 與執行階段設定
- 供應商傳回的用量與提示詞快取中繼資料

如需廣泛的閘道支援報告，請改從
[`/diagnostics`](/zh-TW/gateway/diagnostics#chat-command) 開始；它會收集經過清理的
閘道套件，並且針對 OpenAI Codex 控制框架工作階段，可在核准後將 Codex
意見回饋傳送給 OpenAI。需要詳細的個別工作階段提示詞、工具與逐字稿時間軸時，請使用 `/export-trajectory`。

## 快速開始

在作用中的工作階段傳送（別名為 `/trajectory`）：

```text
/export-trajectory
```

OpenClaw 會將套件寫入工作區下方：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

傳入相對輸出目錄名稱即可覆寫預設值：

```text
/export-trajectory bug-1234
```

該名稱會在 `.openclaw/trajectory-exports/` 內解析。系統會拒絕絕對路徑與
`~` 路徑。

軌跡套件可能包含提示詞、模型訊息、工具結構描述、工具
結果、執行階段事件與本機路徑，因此聊天命令一律會經過 exec 核准流程。
當你確實要建立套件時，核准該匯出一次即可；請勿使用全部允許。在群組聊天中，OpenClaw 會將核准
提示與匯出結果私下傳送給擁有者，而不是將軌跡
詳細資料發回共享聊天室。

若要在本機檢查或用於支援工作流程，請直接執行底層命令列介面命令：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

其他旗標：`--output <path>`（`.openclaw/trajectory-exports`
內的目錄名稱）、`--store <path>`（覆寫工作階段儲存區）、
`--agent <id>`（用於解析儲存區的代理程式 ID）、`--json`（結構化輸出）。

## 存取權

軌跡匯出是擁有者命令。傳送者必須通過一般命令
授權檢查，以及該頻道的擁有者檢查。

## 記錄內容

OpenClaw 代理程式執行預設會啟用軌跡擷取。

執行階段事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括來源模型、下一個模型、失敗原因／詳細資料、鏈中位置，以及鏈是否推進、成功或已耗盡
- `model.completed`
- `trace.artifacts`
- `session.ended`

逐字稿事件會從作用中的工作階段分支重建：使用者
訊息、助理訊息、工具呼叫、工具結果、壓縮、模型
變更、標籤與自訂工作階段項目。

事件會以 JSON Lines 寫入，並帶有此結構描述標記：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 套件檔案

| 檔案                  | 內容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 套件結構描述、來源檔案、事件計數與產生的檔案清單                             |
| `events.jsonl`        | 依序排列的執行階段與逐字稿時間軸                                                        |
| `session-branch.json` | 經過遮蔽的作用中逐字稿分支與工作階段標頭                                           |
| `metadata.json`       | OpenClaw 版本、作業系統／執行階段、模型、設定快照、外掛、Skills 與提示詞中繼資料     |
| `artifacts.json`      | 最終狀態、錯誤、用量、提示詞快取、壓縮次數、助理文字與工具中繼資料 |
| `prompts.json`        | 已提交的提示詞與選取的提示詞建構詳細資料                                         |
| `system-prompt.txt`   | 最新編譯的系統提示詞（若已擷取）                                                   |
| `tools.json`          | 傳送給模型的工具定義（若已擷取）                                              |

`manifest.json` 會列出指定套件中存在的檔案；若工作階段未擷取
對應的執行階段資料，部分檔案將會省略。

## 擷取儲存空間

執行階段軌跡事件會與工作階段一起儲存在個別代理程式的 SQLite
資料庫中。匯出軌跡會具體產生經過遮蔽的 JSONL 支援套件；
即時執行階段擷取並不是工作階段旁的 JSONL 附屬檔案。

較舊版本或明確的舊版檔案匯出仍可能產生
`.trajectory.jsonl` 與 `.trajectory-path.json` 檔案。工作階段維護會將
這些檔案視為清理目標；作用中的擷取會寫入資料庫資料列。

## 停用擷取

```bash
export OPENCLAW_TRAJECTORY=0
```

這會在啟動 OpenClaw 前停用執行階段軌跡擷取。
`/export-trajectory` 仍可匯出逐字稿分支，但僅存在於執行階段的
資料（例如已編譯的內容、供應商成品與提示詞中繼資料）可能會
遺失。

## 調整排清逾時

OpenClaw 會在代理程式清理期間排清執行階段軌跡資料列。預設
清理逾時為 10,000 ms。在速度較慢的磁碟或大型儲存區上，請在啟動 OpenClaw 前設定
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

這會控制 OpenClaw 何時記錄 `openclaw-trajectory-flush` 逾時並
繼續執行；它不會變更軌跡大小上限。若要調整所有未傳入明確逾時值的代理程式
清理步驟，請設定
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隱私與限制

軌跡套件用於支援與偵錯，不應公開發布。OpenClaw
會在寫入匯出檔案前遮蔽敏感值：

- 認證資訊與已知類似祕密的承載資料欄位
- 圖片資料
- 本機狀態路徑
- 工作區路徑，會取代為 `$WORKSPACE_DIR`
- 偵測到的主目錄路徑

匯出工具也會限制輸入大小：

- 執行階段擷取：即時擷取是上限為 10 MiB 的滾動視窗，會捨棄最舊的事件以騰出空間給新事件；匯出可接受最大 50 MiB 的現有舊版執行階段附屬檔案
- 工作階段檔案：50 MiB
- 每次匯出的執行階段事件：200,000
- 匯出事件總數：250,000
- 個別執行階段事件行超過 256 KiB 時會遭到截斷

在團隊外分享套件前，請先檢閱其內容。遮蔽採取盡力而為，
無法辨識每個應用程式特有的祕密。

## 疑難排解

如果匯出內容中沒有執行階段事件：

- 確認 OpenClaw 啟動時未設定 `OPENCLAW_TRAJECTORY=0`
- 在工作階段中再執行一則訊息，然後重新匯出
- 檢查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒絕輸出路徑：

- 使用 `bug-1234` 之類的相對名稱
- 請勿傳入 `/tmp/...` 或 `~/...`
- 將匯出內容保留在 `.openclaw/trajectory-exports/` 內

如果匯出因大小錯誤而失敗，代表工作階段或附屬檔案超過上述
匯出安全限制。請啟動新的工作階段，或匯出較小的
重現案例。

## 相關內容

- [差異](/zh-TW/tools/diffs)
- [工作階段管理](/zh-TW/concepts/session)
- [Exec 工具](/zh-TW/tools/exec)
