---
read_when:
    - 偵錯代理程式為何如此回答、失敗或以特定方式呼叫工具
    - 匯出 OpenClaw 工作階段的支援套件
    - 調查提示詞上下文、工具呼叫、執行階段錯誤或用量中繼資料
    - 停用或重新定位軌跡擷取
summary: 匯出經過遮蔽的軌跡套件，用於偵錯 OpenClaw 代理程式工作階段
title: 軌跡套件
x-i18n:
    generated_at: "2026-04-30T03:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture 是 OpenClaw 的每工作階段飛行記錄器。它會為每次 agent 執行記錄結構化時間軸，接著 `/export-trajectory` 會將目前工作階段封裝成已遮蔽的支援套件。

當你需要回答下列問題時，請使用它：

- 傳送給模型的是什麼提示、系統提示和工具？
- 哪些逐字稿訊息與工具呼叫導致了這個答案？
- 這次執行是否逾時、中止、進行 Compaction，或遇到供應商錯誤？
- 哪個模型、plugins、Skills 和執行階段設定處於作用中？
- 供應商回傳了哪些使用量與提示快取中繼資料？

如果你要針對即時 Gateway 問題提交廣泛的支援報告，請從 [`/diagnostics`](/zh-TW/gateway/diagnostics#chat-command) 開始。Diagnostics 會收集已清理的 Gateway 套件，並且對於 OpenAI Codex harness 工作階段，也可以在核准後將 Codex 意見回饋傳送到 OpenAI 伺服器。當你特別需要每個工作階段的詳細提示、工具和逐字稿時間軸時，請使用 `/export-trajectory`。

## 快速開始

在作用中的工作階段中傳送：

```text
/export-trajectory
```

別名：

```text
/trajectory
```

OpenClaw 會將套件寫入工作區下方：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你可以選擇相對輸出目錄名稱：

```text
/export-trajectory bug-1234
```

自訂路徑會在 `.openclaw/trajectory-exports/` 內解析。絕對路徑與 `~` 路徑會被拒絕。

Trajectory 套件可能包含提示、模型訊息、工具結構描述、工具結果、執行階段事件和本機路徑。因此，聊天斜線命令每次都會經過 exec 核准。當你打算建立套件時，只核准該次匯出；不要使用 allow-all。在群組聊天中，OpenClaw 會將核准提示與匯出結果私下傳送給擁有者，而不是把 trajectory 詳細資料發回共享聊天室。

若要進行本機檢查或支援工作流程，你也可以直接執行已核准的命令路徑：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 存取權

Trajectory 匯出是擁有者命令。傳送者必須通過該頻道的一般命令授權檢查和擁有者檢查。

## 記錄內容

OpenClaw agent 執行預設會啟用 Trajectory capture。

執行階段事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括來源模型、下一個模型、失敗原因/詳細資料、鏈結位置，以及 fallback 是否前進、成功或耗盡鏈結
- `model.completed`
- `trace.artifacts`
- `session.ended`

逐字稿事件也會從作用中的工作階段分支重建：

- 使用者訊息
- assistant 訊息
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
| `manifest.json`       | 套件結構描述、來源檔案、事件計數和產生的檔案清單                             |
| `events.jsonl`        | 已排序的執行階段與逐字稿時間軸                                                        |
| `session-branch.json` | 已遮蔽的作用中逐字稿分支和工作階段標頭                                           |
| `metadata.json`       | OpenClaw 版本、OS/執行階段、模型、設定快照、plugins、Skills 和提示中繼資料     |
| `artifacts.json`      | 最終狀態、錯誤、使用量、提示快取、Compaction 計數、assistant 文字和工具中繼資料 |
| `prompts.json`        | 已提交的提示和選定的提示建構詳細資料                                         |
| `system-prompt.txt`   | 已擷取時的最新已編譯系統提示                                                   |
| `tools.json`          | 已擷取時傳送給模型的工具定義                                              |

`manifest.json` 會列出該套件中存在的檔案。當工作階段未擷取對應的執行階段資料時，部分檔案會被省略。

## 擷取位置

預設情況下，執行階段 trajectory 事件會寫在工作階段檔案旁邊：

```text
<session>.trajectory.jsonl
```

OpenClaw 也會在工作階段旁邊寫入一個盡力而為的指標檔案：

```text
<session>.trajectory-path.json
```

設定 `OPENCLAW_TRAJECTORY_DIR`，將執行階段 trajectory sidecar 儲存在專用目錄：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

設定此變數時，OpenClaw 會在該目錄中為每個工作階段 ID 寫入一個 JSONL 檔案。

當擁有 trajectory sidecar 的工作階段項目因工作階段磁碟預算而遭到修剪、封頂或逐出時，工作階段維護會移除這些 sidecar。工作階段目錄外的執行階段檔案，只有在指標目標仍可證明它屬於該工作階段時才會被移除。

## 停用擷取

啟動 OpenClaw 前設定 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

這會停用執行階段 trajectory 擷取。`/export-trajectory` 仍然可以匯出逐字稿分支，但可能會缺少僅存在於執行階段的檔案，例如已編譯內容、供應商 artifacts 和提示中繼資料。

## 隱私與限制

Trajectory 套件是為支援與除錯而設計，不適合公開張貼。OpenClaw 在寫入匯出檔案前會遮蔽敏感值：

- 憑證與已知類似秘密的 payload 欄位
- 圖片資料
- 本機狀態路徑
- 工作區路徑，替換為 `$WORKSPACE_DIR`
- 偵測到的主目錄路徑

匯出器也會限制輸入大小：

- 執行階段 sidecar 檔案：50 MiB
- 工作階段檔案：50 MiB
- 執行階段事件：200,000
- 匯出的事件總數：250,000
- 個別執行階段事件行超過 256 KiB 時會被截斷

在團隊外分享套件前，請先檢閱內容。遮蔽是盡力而為，無法知道每個應用程式特定的秘密。

## 疑難排解

如果匯出沒有執行階段事件：

- 確認 OpenClaw 啟動時沒有設定 `OPENCLAW_TRAJECTORY=0`
- 檢查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可寫入的目錄
- 在工作階段中再執行一則訊息，然後重新匯出
- 檢查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒絕輸出路徑：

- 使用像 `bug-1234` 這樣的相對名稱
- 不要傳入 `/tmp/...` 或 `~/...`
- 將匯出保留在 `.openclaw/trajectory-exports/` 內

如果匯出因大小錯誤而失敗，表示工作階段或 sidecar 超過匯出安全限制。請開始新的工作階段，或匯出較小的重現案例。

## 相關

- [Diffs](/zh-TW/tools/diffs)
- [工作階段管理](/zh-TW/concepts/session)
- [Exec tool](/zh-TW/tools/exec)
