---
read_when:
    - 你想列出已儲存的工作階段並查看近期活動
summary: '`openclaw sessions` 的 CLI 參考（列出已儲存的工作階段與用法）'
title: 工作階段
x-i18n:
    generated_at: "2026-05-07T13:15:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是通道/提供者的存活性檢查。它們會顯示來自工作階段儲存區的持久化對話資料列。安靜的 Discord、Slack、Telegram 或其他通道可以成功重新連線，而不會建立新的工作階段資料列，直到有訊息被處理為止。需要即時通道連線能力時，請使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和 Gateway `sessions.list` 回應預設都有界限，避免大型長期儲存區獨占 CLI 程序或 Gateway 事件迴圈。CLI 預設會回傳最新的 100 個工作階段；傳入 `--limit <n>` 可取得較小/較大的視窗，或在你確實需要完整儲存區時使用 `--limit all`。JSON 回應包含 `totalCount`、`limitApplied` 和 `hasMore`，讓呼叫端可顯示還有更多資料列存在。

RPC 用戶端可以傳入 `configuredAgentsOnly: true`，以保留廣泛的合併探索來源，但只回傳目前存在於設定中的代理資料列。Control UI 預設使用該模式，因此已刪除或僅存在於磁碟上的代理儲存區不會重新出現在 Sessions 檢視中。

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

- 預設：已設定的預設代理儲存區
- `--verbose`：詳細記錄
- `--agent <id>`：一個已設定的代理儲存區
- `--all-agents`：彙總所有已設定的代理儲存區
- `--store <path>`：明確的儲存區路徑（不能與 `--agent` 或 `--all-agents` 合併使用）
- `--limit <n|all>`：輸出的最大資料列數（預設 `100`；`all` 會恢復完整輸出）

為已儲存的工作階段匯出軌跡套件：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是 `/export-trajectory` 斜線命令在擁有者核准 exec 要求後使用的命令路徑。輸出目錄一律會解析到所選工作區底下的 `.openclaw/trajectory-exports/` 內。

`openclaw sessions --all-agents` 會讀取已設定的代理儲存區。Gateway 和 ACP 工作階段探索範圍更廣：它們也會包含在預設 `agents/` 根目錄或樣板化 `session.store` 根目錄底下找到的僅磁碟儲存區。這些探索到的儲存區必須解析為代理根目錄內的一般 `sessions.json` 檔案；符號連結和根目錄外路徑會被略過。

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

`openclaw sessions cleanup` 會使用設定中的 `session.maintenance` 設定：

- 範圍備註：`openclaw sessions cleanup` 會維護工作階段儲存區、轉錄和軌跡 sidecar。它不會修剪 cron 執行記錄檔（`cron/runs/<jobId>.jsonl`），這些檔案由 [Cron 設定](/zh-TW/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，並在 [Cron 維護](/zh-TW/automation/cron-jobs#maintenance) 中說明。
- 清理也會修剪早於 `session.maintenance.pruneAfter` 且未被參照的主要轉錄、Compaction 檢查點和軌跡 sidecar；仍被 `sessions.json` 參照的檔案會保留。

- `--dry-run`：預覽有多少項目會在不寫入的情況下被修剪/封頂。
  - 在文字模式中，dry-run 會列印每個工作階段的動作表（`Action`、`Key`、`Age`、`Model`、`Flags`），讓你可以看到哪些會保留、哪些會移除。
- `--enforce`：即使 `session.maintenance.mode` 是 `warn`，也套用維護。
- `--fix-missing`：移除轉錄檔案遺失的項目，即使它們通常還不會因年齡/數量而被移除。
- `--fix-dm-scope`：當 `session.dmScope` 為 `main` 時，淘汰先前由 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由留下的過時同儕鍵 direct-DM 資料列。請先使用 `--dry-run`；套用清理會從 `sessions.json` 移除這些資料列，並將其轉錄保留為已刪除封存。
- `--active-key <key>`：保護特定作用中鍵不受磁碟預算淘汰。耐久的外部對話指標，例如群組工作階段和執行緒範圍的聊天工作階段，也會在年齡/數量/磁碟預算維護中保留。
- `--agent <id>`：對一個已設定的代理儲存區執行清理。
- `--all-agents`：對所有已設定的代理儲存區執行清理。
- `--store <path>`：針對特定 `sessions.json` 檔案執行。
- `--json`：列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個儲存區的一份摘要。

當 Gateway 可連線時，已設定代理儲存區的非 dry-run 清理會透過 Gateway 傳送，因此它會與執行階段流量共用相同的工作階段儲存區寫入器。使用 `--store <path>` 可對儲存區檔案進行明確的離線修復。

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

相關：

- 工作階段設定：[設定參考](/zh-TW/gateway/config-agents#session)

## 相關

- [CLI 參考](/zh-TW/cli)
- [工作階段管理](/zh-TW/concepts/session)
