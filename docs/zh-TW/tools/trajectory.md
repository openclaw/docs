---
read_when:
    - 偵錯代理為何以特定方式回覆、失敗或呼叫工具
    - 匯出 OpenClaw 工作階段的支援套件
    - 調查提示詞上下文、工具呼叫、執行階段錯誤或使用量中繼資料
    - 停用或重新定位軌跡擷取
summary: 匯出已遮罩的軌跡套件，用於偵錯 OpenClaw 代理工作階段
title: 軌跡套件包
x-i18n:
    generated_at: "2026-06-27T20:11:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

軌跡擷取是 OpenClaw 的每工作階段飛行記錄器。它會為每次代理執行記錄結構化時間軸，然後 `/export-trajectory` 會將目前工作階段打包成已遮蔽的支援套件。

當你需要回答以下問題時使用它：

- 哪些提示、系統提示和工具被送到模型？
- 哪些對話紀錄訊息和工具呼叫導致了這個答案？
- 執行是否逾時、中止、壓縮，或遇到提供者錯誤？
- 哪些模型、外掛、Skills 和執行階段設定處於啟用狀態？
- 提供者回傳了哪些用量和提示快取中繼資料？

如果你要針對即時閘道問題提交廣泛的支援報告，請從
[`/diagnostics`](/zh-TW/gateway/diagnostics#chat-command) 開始。診斷會收集已清理的閘道套件，並且對於 OpenAI Codex harness 工作階段，也可以在核准後將 Codex 回饋傳送到 OpenAI 伺服器。當你特別需要詳細的每工作階段提示、工具和對話紀錄時間軸時，請使用 `/export-trajectory`。

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

自訂路徑會在 `.openclaw/trajectory-exports/` 內解析。絕對路徑和 `~` 路徑會被拒絕。

軌跡套件可能包含提示、模型訊息、工具結構描述、工具結果、執行階段事件和本機路徑。因此聊天斜線命令每次都會經過 exec 核准。當你確定要建立套件時，核准該匯出一次；不要使用 allow-all。在群組聊天中，OpenClaw 會私下將核准提示和匯出結果傳送給擁有者，而不是將軌跡詳細資料貼回共享聊天室。

對於本機檢查或支援工作流程，你也可以直接執行已核准的命令路徑：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 存取權限

軌跡匯出是擁有者命令。傳送者必須通過該通道的一般命令授權檢查和擁有者檢查。

## 會記錄哪些內容

OpenClaw 代理執行預設會啟用軌跡擷取。

執行階段事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括來源模型、下一個模型、失敗原因/詳細資料、鏈位置，以及備援是否前進、成功或耗盡鏈
- `model.completed`
- `trace.artifacts`
- `session.ended`

也會從作用中的工作階段分支重建對話紀錄事件：

- 使用者訊息
- 助理訊息
- 工具呼叫
- 工具結果
- 壓縮
- 模型變更
- 標籤和自訂工作階段項目

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
| `events.jsonl`        | 已排序的執行階段和對話紀錄時間軸                                                        |
| `session-branch.json` | 已遮蔽的作用中對話紀錄分支和工作階段標頭                                           |
| `metadata.json`       | OpenClaw 版本、OS/執行階段、模型、設定快照、外掛、Skills 和提示中繼資料     |
| `artifacts.json`      | 最終狀態、錯誤、用量、提示快取、壓縮計數、助理文字和工具中繼資料 |
| `prompts.json`        | 已提交的提示和選定的提示建構詳細資料                                         |
| `system-prompt.txt`   | 最新編譯的系統提示，若已擷取                                                   |
| `tools.json`          | 傳送到模型的工具定義，若已擷取                                              |

`manifest.json` 會列出該套件中存在的檔案。當工作階段未擷取對應的執行階段資料時，某些檔案會省略。

## 擷取位置

依預設，執行階段軌跡事件會寫在工作階段檔案旁：

```text
<session>.trajectory.jsonl
```

OpenClaw 也會在工作階段旁寫入盡力而為的指標檔案：

```text
<session>.trajectory-path.json
```

設定 `OPENCLAW_TRAJECTORY_DIR` 可將執行階段軌跡 sidecar 儲存在專用目錄中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

設定此變數時，OpenClaw 會在該目錄中為每個工作階段 id 寫入一個 JSONL 檔案。

工作階段維護會在其所屬的工作階段項目因工作階段磁碟預算而被修剪、限制或逐出時，移除軌跡 sidecar。工作階段目錄外的執行階段檔案只會在指標目標仍可證明其屬於該工作階段時才會移除。

## 停用擷取

在啟動 OpenClaw 前設定 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

這會停用執行階段軌跡擷取。`/export-trajectory` 仍可匯出對話紀錄分支，但可能缺少僅限執行階段的檔案，例如已編譯內容、提供者成品和提示中繼資料。

## 調整排清逾時

OpenClaw 會在代理清理期間排清執行階段軌跡 sidecar。預設清理逾時為 10,000 ms。在慢速磁碟或大型儲存中，請在啟動 OpenClaw 前設定 `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

這會控制 OpenClaw 何時記錄 `openclaw-trajectory-flush` 逾時並繼續。
它不會變更軌跡大小上限。若要調整所有未傳入明確逾時的代理清理步驟，請設定 `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隱私與限制

軌跡套件是為支援和除錯而設計，不適合公開張貼。OpenClaw 會在寫入匯出檔案前遮蔽敏感值：

- 認證資料和已知類似密鑰的 payload 欄位
- 圖片資料
- 本機狀態路徑
- 工作區路徑，替換為 `$WORKSPACE_DIR`
- 偵測到的家目錄路徑

匯出器也會限制輸入大小：

- 執行階段 sidecar 檔案：即時擷取會在 10 MiB 停止，並在仍有空間時記錄截斷事件；匯出接受最高 50 MiB 的既有執行階段 sidecar
- 工作階段檔案：50 MiB
- 執行階段事件：200,000
- 匯出事件總數：250,000
- 單一執行階段事件行在超過 256 KiB 時會被截斷

在團隊外分享套件前，請先檢閱。遮蔽是盡力而為，無法知道每個應用程式特定的密鑰。

## 疑難排解

如果匯出沒有執行階段事件：

- 確認 OpenClaw 啟動時未設定 `OPENCLAW_TRAJECTORY=0`
- 檢查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可寫入的目錄
- 在工作階段中再執行一則訊息，然後再次匯出
- 檢查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒絕輸出路徑：

- 使用像 `bug-1234` 這樣的相對名稱
- 不要傳入 `/tmp/...` 或 `~/...`
- 將匯出保持在 `.openclaw/trajectory-exports/` 內

如果匯出因大小錯誤而失敗，表示工作階段或 sidecar 超過了匯出安全限制。請啟動新的工作階段，或匯出較小的重現案例。

## 相關

- [差異](/zh-TW/tools/diffs)
- [工作階段管理](/zh-TW/concepts/session)
- [Exec 工具](/zh-TW/tools/exec)
