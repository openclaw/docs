---
read_when:
    - 偵錯為何代理以特定方式回答、失敗或呼叫工具
    - 匯出 OpenClaw 工作階段的支援套件
    - 調查提示詞上下文、工具呼叫、執行階段錯誤或使用量中繼資料
    - 停用或重新定位軌跡擷取
summary: 匯出經遮蔽的軌跡套件，以偵錯 OpenClaw 代理程式工作階段
title: 軌跡套件
x-i18n:
    generated_at: "2026-07-05T11:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08cd5d28c203d5b50212be917507fe9b5a1f5eefd31d6a84dbdc9dfd8d9ed0e1
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture 是 OpenClaw 的每個工作階段飛行記錄器。它會為每次代理程式執行記錄
結構化時間軸，接著 `/export-trajectory` 會將目前工作階段封裝成經過遮蔽的支援套件，涵蓋：

- 傳送給模型的提示、系統提示和工具
- 哪些逐字稿訊息和工具呼叫導致了答案
- 執行是否逾時、中止、壓縮，或遇到供應商錯誤
- 哪個模型、外掛、Skills 和執行階段設定處於作用中
- 供應商傳回的用量與提示快取中繼資料

若要產生廣泛的閘道支援報告，請改從
[`/diagnostics`](/zh-TW/gateway/diagnostics#chat-command) 開始；它會收集經過清理的
閘道套件，並且對於 OpenAI Codex harness 工作階段，可在核准後將 Codex
意見回饋傳送給 OpenAI。當你需要詳細的每個工作階段提示、工具和逐字稿時間軸時，請使用 `/export-trajectory`。

## 快速開始

在作用中的工作階段中傳送（別名 `/trajectory`）：

```text
/export-trajectory
```

OpenClaw 會將套件寫入工作區下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

傳入相對輸出目錄名稱以覆寫它：

```text
/export-trajectory bug-1234
```

該名稱會在 `.openclaw/trajectory-exports/` 內解析。絕對路徑和
`~` 路徑會被拒絕。

Trajectory 套件可能包含提示、模型訊息、工具結構描述、工具結果、執行階段事件和本機路徑，因此聊天命令一律會經過 exec 核准。當你打算建立套件時，核准該匯出一次；不要使用 allow-all。在群組聊天中，OpenClaw 會私下將核准提示和匯出結果傳送給擁有者，而不是將 trajectory 詳細資訊貼回共享聊天室。

若要用於本機檢查或支援工作流程，請直接執行底層命令列介面命令：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

其他旗標：`--output <path>`（位於
`.openclaw/trajectory-exports` 內的目錄名稱）、`--store <path>`（工作階段儲存覆寫）、
`--agent <id>`（用於儲存解析的代理程式 id）、`--json`（結構化輸出）。

## 存取

Trajectory 匯出是擁有者命令。傳送者必須通過一般命令授權檢查，以及該頻道的擁有者檢查。

## 記錄內容

OpenClaw 代理程式執行預設會開啟 trajectory capture。

執行階段事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括來源模型、下一個模型、失敗原因/詳細資訊、鏈結位置，以及鏈結是否前進、成功或耗盡
- `model.completed`
- `trace.artifacts`
- `session.ended`

逐字稿事件會從作用中的工作階段分支重建：使用者訊息、助理訊息、工具呼叫、工具結果、壓縮、模型變更、標籤和自訂工作階段項目。

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
| `manifest.json`       | 套件結構描述、來源檔案、事件計數和產生的檔案清單                             |
| `events.jsonl`        | 已排序的執行階段與逐字稿時間軸                                                        |
| `session-branch.json` | 經過遮蔽的作用中逐字稿分支和工作階段標頭                                           |
| `metadata.json`       | OpenClaw 版本、作業系統/執行階段、模型、設定快照、外掛、Skills 和提示中繼資料     |
| `artifacts.json`      | 最終狀態、錯誤、用量、提示快取、壓縮計數、助理文字和工具中繼資料 |
| `prompts.json`        | 已提交的提示和選定的提示建構詳細資訊                                         |
| `system-prompt.txt`   | 最新編譯的系統提示（如有擷取）                                                   |
| `tools.json`          | 傳送給模型的工具定義（如有擷取）                                              |

`manifest.json` 會列出指定套件中存在的檔案；當工作階段未擷取對應的執行階段資料時，某些檔案會省略。

## 擷取位置

預設情況下，執行階段 trajectory 事件會寫在工作階段檔案旁：

```text
<session>.trajectory.jsonl
```

OpenClaw 也會在工作階段旁寫入 best-effort 指標檔：

```text
<session>.trajectory-path.json
```

設定 `OPENCLAW_TRAJECTORY_DIR` 可改將執行階段 trajectory sidecar 儲存在專用目錄中，每個工作階段 id 一個 JSONL 檔案：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

當所屬工作階段項目因工作階段磁碟預算而被修剪、限制或逐出時，工作階段維護會移除 trajectory sidecar。只有在指標目標仍能證明它屬於該工作階段時，才會移除工作階段目錄外的執行階段檔案。

## 停用擷取

```bash
export OPENCLAW_TRAJECTORY=0
```

這會在啟動 OpenClaw 前停用執行階段 trajectory capture。
`/export-trajectory` 仍可匯出逐字稿分支，但可能會缺少僅限執行階段的檔案，例如已編譯的內容、供應商成品和提示中繼資料。

## 調整 flush 逾時

OpenClaw 會在代理程式清理期間 flush 執行階段 trajectory sidecar。預設清理逾時為 10,000 ms。在慢速磁碟或大型儲存上，請在啟動 OpenClaw 前設定
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

這會控制 OpenClaw 何時記錄 `openclaw-trajectory-flush` 逾時並繼續；它不會變更 trajectory 大小上限。若要調整所有未傳入明確逾時的代理程式清理步驟，請設定
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隱私與限制

Trajectory 套件用於支援和偵錯，不適合公開張貼。OpenClaw
會在寫入匯出檔案前遮蔽敏感值：

- 憑證和已知類似秘密的 payload 欄位
- 圖像資料
- 本機狀態路徑
- 工作區路徑，替換為 `$WORKSPACE_DIR`
- 主目錄路徑（如偵測到）

匯出工具也會限制輸入大小：

- 執行階段 sidecar 檔案：即時擷取檔案是上限為 10 MiB 的滾動視窗，會捨棄最舊事件以騰出空間給新事件；匯出接受最高 50 MiB 的既有執行階段 sidecar 檔案
- 工作階段檔案：50 MiB
- 每次匯出的執行階段事件：200,000
- 匯出的事件總數：250,000
- 單一執行階段事件行超過 256 KiB 時會被截斷

在與團隊外部分享前，請先審閱套件。遮蔽是 best-effort，
無法知道每個應用程式特定的秘密。

## 疑難排解

如果匯出沒有執行階段事件：

- 確認 OpenClaw 啟動時未設定 `OPENCLAW_TRAJECTORY=0`
- 檢查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可寫入目錄
- 在該工作階段中再執行一則訊息，然後再次匯出
- 檢查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒絕輸出路徑：

- 使用像 `bug-1234` 這樣的相對名稱
- 不要傳入 `/tmp/...` 或 `~/...`
- 將匯出保留在 `.openclaw/trajectory-exports/` 內

如果匯出因大小錯誤而失敗，代表工作階段或 sidecar 超過上述匯出安全限制。請開始新的工作階段或匯出較小的重現案例。

## 相關

- [Diffs](/zh-TW/tools/diffs)
- [工作階段管理](/zh-TW/concepts/session)
- [Exec tool](/zh-TW/tools/exec)
