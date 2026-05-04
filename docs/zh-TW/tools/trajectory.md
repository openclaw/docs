---
read_when:
    - 偵錯代理為何以特定方式回答、失敗或呼叫工具
    - 匯出 OpenClaw 工作階段的支援套件
    - 調查提示詞上下文、工具呼叫、執行階段錯誤或使用量中繼資料
    - 停用或變更軌跡擷取位置
summary: 匯出已遮蔽敏感資訊的軌跡套件，以便偵錯 OpenClaw 代理程式工作階段
title: 軌跡套件
x-i18n:
    generated_at: "2026-05-04T09:37:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture 是 OpenClaw 針對每個工作階段的飛行記錄器。它會為每次代理程式執行記錄結構化時間軸，然後 `/export-trajectory` 會將目前工作階段封裝成已遮蔽敏感資訊的支援套件。

當你需要回答以下問題時使用它：

- 哪些提示、系統提示與工具已傳送給模型？
- 哪些逐字稿訊息與工具呼叫導致了這個答案？
- 這次執行是否逾時、中止、進行 Compaction，或遇到供應商錯誤？
- 哪個模型、plugins、Skills 與執行階段設定處於啟用狀態？
- 供應商傳回了哪些用量與提示快取中繼資料？

如果你要針對即時 Gateway 問題提交廣泛的支援報告，請從
[`/diagnostics`](/zh-TW/gateway/diagnostics#chat-command) 開始。Diagnostics 會收集
已清理的 Gateway 套件，而且對於 OpenAI Codex harness 工作階段，在核准後也可以將
Codex 回饋傳送到 OpenAI 伺服器。當你特別需要詳細的每個工作階段提示、工具與逐字稿
時間軸時，請使用 `/export-trajectory`。

## 快速開始

在作用中的工作階段傳送：

```text
/export-trajectory
```

別名：

```text
/trajectory
```

OpenClaw 會將套件寫入工作區底下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你可以選擇相對輸出目錄名稱：

```text
/export-trajectory bug-1234
```

自訂路徑會在 `.openclaw/trajectory-exports/` 內解析。絕對
路徑與 `~` 路徑會被拒絕。

Trajectory 套件可能包含提示、模型訊息、工具結構描述、工具
結果、執行階段事件與本機路徑。因此聊天斜線指令每次都會
經過 exec 核准。當你打算建立套件時，核准該匯出一次；不要使用 allow-all。在群組聊天中，OpenClaw 會將
核准提示與匯出結果私下傳送給擁有者，而不是將
Trajectory 詳細資訊貼回共享聊天室。

對於本機檢查或支援工作流程，你也可以直接執行已核准的指令
路徑：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 存取權限

Trajectory export 是擁有者指令。傳送者必須通過該頻道的正常指令
授權檢查與擁有者檢查。

## 會記錄的內容

OpenClaw 代理程式執行預設會啟用 Trajectory capture。

執行階段事件包含：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包含來源模型、下一個模型、失敗原因/詳細資訊、鏈中位置，以及 fallback 是否推進、成功或耗盡鏈
- `model.completed`
- `trace.artifacts`
- `session.ended`

逐字稿事件也會從作用中的工作階段分支重建：

- 使用者訊息
- 助理訊息
- 工具呼叫
- 工具結果
- Compaction
- 模型變更
- 標籤與自訂工作階段項目

事件會以 JSON Lines 寫入，並帶有此結構描述標記：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 套件檔案

匯出的套件可以包含：

| 檔案                  | 內容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 套件結構描述、來源檔案、事件計數與產生的檔案清單                             |
| `events.jsonl`        | 已排序的執行階段與逐字稿時間軸                                                        |
| `session-branch.json` | 已遮蔽敏感資訊的作用中逐字稿分支與工作階段標頭                                           |
| `metadata.json`       | OpenClaw 版本、作業系統/執行階段、模型、設定快照、plugins、Skills 與提示中繼資料     |
| `artifacts.json`      | 最終狀態、錯誤、用量、提示快取、Compaction 計數、助理文字與工具中繼資料 |
| `prompts.json`        | 已提交的提示與選定的提示建構詳細資訊                                         |
| `system-prompt.txt`   | 最新編譯的系統提示（若已擷取）                                                   |
| `tools.json`          | 傳送給模型的工具定義（若已擷取）                                              |

`manifest.json` 會列出該套件中存在的檔案。有些檔案會在
工作階段未擷取對應的執行階段資料時省略。

## 擷取位置

預設情況下，執行階段 Trajectory 事件會寫在工作階段檔案旁邊：

```text
<session>.trajectory.jsonl
```

OpenClaw 也會在工作階段旁邊寫入一個盡力而為的指標檔案：

```text
<session>.trajectory-path.json
```

設定 `OPENCLAW_TRAJECTORY_DIR`，即可將執行階段 Trajectory sidecar 儲存在
專用目錄中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

設定此變數時，OpenClaw 會針對該目錄中的每個工作階段 ID 寫入一個 JSONL 檔案。

工作階段維護會在其擁有的工作階段項目因工作階段磁碟預算而被
剪除、封頂或逐出時，移除 Trajectory sidecar。只有當指標目標仍能證明它
屬於該工作階段時，才會移除工作階段目錄外的執行階段檔案。

## 停用擷取

在啟動 OpenClaw 前設定 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

這會停用執行階段 Trajectory capture。`/export-trajectory` 仍然可以匯出
逐字稿分支，但僅限執行階段的檔案，例如已編譯的內容、
供應商成品與提示中繼資料，可能會遺失。

## 隱私與限制

Trajectory 套件是為支援與偵錯而設計，不適合公開張貼。
OpenClaw 會在寫入匯出檔案前遮蔽敏感值：

- 憑證與已知類似秘密的承載欄位
- 圖像資料
- 本機狀態路徑
- 工作區路徑，會取代為 `$WORKSPACE_DIR`
- 主目錄路徑（偵測到時）

匯出工具也會限制輸入大小：

- 執行階段 sidecar 檔案：即時擷取會在 10 MiB 停止，並在仍有空間時記錄截斷事件；匯出會接受最多 50 MiB 的既有執行階段 sidecar
- 工作階段檔案：50 MiB
- 執行階段事件：200,000
- 匯出事件總數：250,000
- 個別執行階段事件行超過 256 KiB 時會被截斷

在團隊外分享套件前，請先檢閱。遮蔽敏感資訊是盡力而為，
無法知道每一種應用程式特定的秘密。

## 疑難排解

如果匯出沒有執行階段事件：

- 確認 OpenClaw 啟動時未設定 `OPENCLAW_TRAJECTORY=0`
- 檢查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可寫入的目錄
- 在工作階段中再執行一則訊息，然後重新匯出
- 檢查 `manifest.json` 中的 `runtimeEventCount`

如果指令拒絕輸出路徑：

- 使用像 `bug-1234` 這樣的相對名稱
- 不要傳入 `/tmp/...` 或 `~/...`
- 將匯出保持在 `.openclaw/trajectory-exports/` 內

如果匯出因大小錯誤而失敗，代表工作階段或 sidecar 超過了
匯出安全限制。請開始新的工作階段，或匯出較小的重現案例。

## 相關

- [Diffs](/zh-TW/tools/diffs)
- [工作階段管理](/zh-TW/concepts/session)
- [Exec 工具](/zh-TW/tools/exec)
