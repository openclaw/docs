---
read_when:
    - 你想列出已儲存的工作階段並查看近期活動
summary: '`openclaw sessions` 的命令列介面參考（列出已儲存的工作階段 + 用法）'
title: 工作階段
x-i18n:
    generated_at: "2026-06-27T19:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是頻道/提供者存活檢查。它們會顯示來自工作階段儲存區的持久化對話列。安靜的 Discord、Slack、Telegram 或其他頻道可以成功重新連線，但在處理訊息之前不會建立新的工作階段列。當你需要即時頻道連線能力時，請使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和閘道 `sessions.list` 回應預設都有界限，因此大型長期存在的儲存區無法獨占命令列介面程序或閘道事件迴圈。命令列介面預設會傳回最新的 100 個工作階段；傳入 `--limit <n>` 可取得較小/較大的視窗，或在你確實需要完整儲存區時使用 `--limit all`。當呼叫端需要顯示還有更多列存在時，JSON 回應會包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 用戶端可以傳入 `configuredAgentsOnly: true`，以保留廣泛的合併探索來源，但只傳回目前存在於設定中的代理列。Control UI 預設使用該模式，因此已刪除或僅存在於磁碟上的代理儲存區不會重新出現在 Sessions 檢視中。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

範圍選擇：

- 預設值：已設定的預設代理儲存區
- `--verbose`：詳細記錄
- `--agent <id>`：一個已設定的代理儲存區
- `--all-agents`：彙總所有已設定的代理儲存區
- `--store <path>`：明確的儲存區路徑（不能與 `--agent` 或 `--all-agents` 合併使用）
- `--limit <n|all>`：要輸出的最大列數（預設 `100`；`all` 會還原完整輸出）

追蹤已儲存工作階段的人類可讀軌跡進度：

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` 會將最近的軌跡 JSONL 事件呈現為精簡的進度行。若沒有 `--session-key`，它會先追蹤執行中的工作階段，然後追蹤最新儲存的工作階段。`--tail <count>` 控制在跟隨模式之前要列印多少既有事件；預設值為 `80`，而 `0` 會從目前結尾開始。`--follow` 會持續監看所選的軌跡檔案，包括由 `<session>.trajectory-path.json` 參照的已重新定位檔案。

進度檢視刻意保持保守：不會列印提示文字、工具引數和工具結果本文。工具呼叫會顯示工具名稱與 `{...redacted...}`；工具結果會顯示 `ok`、`error` 或 `done` 等狀態；模型完成行會顯示提供者/模型與終端狀態。

為已儲存的工作階段匯出軌跡套件：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是擁有者核准執行要求後，`/export-trajectory` 斜線命令所使用的命令路徑。輸出目錄一律會解析到所選工作區下的 `.openclaw/trajectory-exports/` 內。

`openclaw sessions --all-agents` 會讀取已設定的代理儲存區。閘道和 ACP 工作階段探索範圍更廣：它們也會包含在預設 `agents/` 根目錄或樣板化 `session.store` 根目錄下找到的僅磁碟儲存區。這些探索到的儲存區必須解析為代理根目錄內的一般 `sessions.json` 檔案；符號連結和根目錄外路徑會被略過。

JSON 範例：

`openclaw sessions --all-agents --json`：

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## 清理維護

立即執行維護（而不是等待下一個寫入週期）：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用設定中的 `session.maintenance` 設定：

- 範圍註記：`openclaw sessions cleanup` 會維護工作階段儲存區、逐字稿和軌跡 sidecar。它不會修剪排程執行歷史，該歷史由 [排程設定](/zh-TW/automation/cron-jobs#configuration) 中的 `cron.runLog.keepLines` 管理，並在 [排程維護](/zh-TW/automation/cron-jobs#maintenance) 中說明。
- 清理也會修剪早於 `session.maintenance.pruneAfter` 的未參照主要逐字稿、壓縮檢查點和軌跡 sidecar；仍由 `sessions.json` 參照的檔案會被保留。
- 清理會將短生命週期閘道模型執行探測清理另行回報為 `modelRunPruned`。這只會符合形狀像 `agent:*:explicit:model-run-<uuid>` 的嚴格明確金鑰。固定保留期為 `24h`，但它受壓力閘控：只有在達到工作階段項目維護/容量壓力時，才會移除過時的探測列。執行時，模型執行清理會在全域過時清理和容量限制之前發生。

- `--dry-run`：預覽將修剪/限制多少項目，而不寫入。
  - 在文字模式中，dry-run 會列印每個工作階段的動作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及按工作階段標籤分組的摘要，讓你可以看到哪些會保留、哪些會移除。
- `--enforce`：即使 `session.maintenance.mode` 為 `warn`，也套用維護。
- `--fix-missing`：移除逐字稿檔案遺失或只有標頭/空白的項目，即使它們通常尚未因年齡/數量而被移出。
- `--fix-dm-scope`：當 `session.dmScope` 為 `main` 時，汰除早期 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由留下的過時同儕鍵直接 DM 列。請先使用 `--dry-run`；套用清理會從 `sessions.json` 移除這些列，並將其逐字稿保留為已刪除封存。
- `--active-key <key>`：保護特定作用中金鑰不被磁碟預算淘汰。耐久的外部對話指標，例如群組工作階段和執行緒範圍聊天工作階段，也會由年齡/數量/磁碟預算維護保留。
- `--agent <id>`：針對一個已設定的代理儲存區執行清理。
- `--all-agents`：針對所有已設定的代理儲存區執行清理。
- `--store <path>`：針對特定 `sessions.json` 檔案執行。
- `--json`：列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個儲存區的一份摘要。

當閘道可連線時，已設定代理儲存區的非 dry-run 清理會透過閘道送出，因此它會與執行階段流量共用相同的工作階段儲存區寫入器。使用 `--store <path>` 可對儲存區檔案進行明確的離線修復。

`openclaw sessions cleanup --all-agents --dry-run --json`：

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## 壓縮工作階段

為卡住或過大的工作階段回收上下文預算。`openclaw sessions compact <key>` 是圍繞 `sessions.compact` 閘道 RPC 的一級包裝器，並且需要正在執行的閘道。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 沒有 `--max-lines` 時，閘道會使用 LLM 摘要逐字稿。這可能很慢，因此預設 `--timeout` 為 `180000` 毫秒。
- 使用 `--max-lines <n>` 時，它會截斷為最後 `n` 行逐字稿，並將先前的逐字稿封存為 `.bak` sidecar。
- `--agent <id>`：擁有該工作階段的代理；`global` 金鑰需要此項。
- `--url` / `--token` / `--password`：閘道連線覆寫。
- `--timeout <ms>`：RPC 逾時，單位為毫秒。
- `--json`：列印原始 RPC 酬載。

當閘道回報壓縮失敗或無法連線時，命令會以非零狀態結束，因此排程和指令碼永遠不會把靜默的無操作誤認為成功。

> 注意：`openclaw agent --message '/compact ...'` **不是**壓縮路徑。來自命令列介面的斜線命令會被已授權寄件者檢查拒絕；該叫用會以非零狀態結束，並提供指向此處的指引，而不是靜默地不執行任何操作。

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受：

| 欄位       | 類型        | 必填 | 說明                                                       |
| ---------- | ----------- | ---- | ---------------------------------------------------------- |
| `key`      | 字串        | 是   | 要壓縮的工作階段金鑰（例如 `agent:main:main`）。           |
| `agentId`  | 字串        | 否   | 擁有該工作階段的代理 ID（用於 `global` 金鑰）。            |
| `maxLines` | 整數 ≥ 1    | 否   | 截斷為最後 N 行，而不是使用 LLM 摘要。                     |

LLM 摘要回應範例：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

截斷回應範例（`--max-lines 200`）：

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## 相關

- 工作階段設定：[設定參考](/zh-TW/gateway/config-agents#session)
- [命令列介面參考](/zh-TW/cli)
- [工作階段管理](/zh-TW/concepts/session)
