---
read_when:
    - 您想列出已儲存的工作階段並查看近期活動
summary: '`openclaw sessions` 的 CLI 參考（列出已儲存的工作階段與使用方式）'
title: 工作階段
x-i18n:
    generated_at: "2026-05-05T08:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是通道/提供者存活檢查。它們會顯示來自工作階段儲存區的持久化對話資料列。安靜的 Discord、Slack、Telegram 或其他通道可以成功重新連線，而不會建立新的工作階段資料列，直到有訊息被處理為止。需要即時通道連線能力時，請使用 `openclaw channels status --probe`、`openclaw status --deep` 或 `openclaw health --verbose`。

`openclaw sessions` 和 Gateway `sessions.list` 回應預設都有界限，因此大型長期存在的儲存區不會獨占 CLI 行程或 Gateway 事件迴圈。CLI 預設會傳回最新的 100 個工作階段；傳入 `--limit <n>` 可取得較小/較大的視窗，或在你刻意需要完整儲存區時傳入 `--limit all`。當呼叫端需要顯示仍有更多資料列存在時，JSON 回應會包含 `totalCount`、`limitApplied` 和 `hasMore`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

範圍選取：

- 預設：已設定的預設代理儲存區
- `--verbose`：詳細記錄
- `--agent <id>`：一個已設定的代理儲存區
- `--all-agents`：彙總所有已設定的代理儲存區
- `--store <path>`：明確的儲存區路徑（不可與 `--agent` 或 `--all-agents` 合併使用）
- `--limit <n|all>`：要輸出的最大資料列數（預設 `100`；`all` 會還原完整輸出）

匯出已儲存工作階段的軌跡組合包：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是擁有者核准 exec 要求後，`/export-trajectory` 斜線命令所使用的命令路徑。輸出目錄一律會解析到所選工作區底下的 `.openclaw/trajectory-exports/` 內。

`openclaw sessions --all-agents` 會讀取已設定的代理儲存區。Gateway 和 ACP 工作階段探索範圍更廣：它們也會包含在預設 `agents/` 根目錄或範本化 `session.store` 根目錄底下找到的僅磁碟儲存區。這些已探索的儲存區必須解析為代理根目錄內一般的 `sessions.json` 檔案；符號連結和根目錄外路徑會被略過。

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 會使用設定中的 `session.maintenance` 設定：

- 範圍注意事項：`openclaw sessions cleanup` 會維護工作階段儲存區、轉錄，以及軌跡 sidecar。它不會修剪 cron 執行記錄（`cron/runs/<jobId>.jsonl`），那些記錄由 [Cron 設定](/zh-TW/automation/cron-jobs#configuration)中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，並在 [Cron 維護](/zh-TW/automation/cron-jobs#maintenance)中說明。
- 清理也會修剪早於 `session.maintenance.pruneAfter` 且未被參照的主要轉錄、Compaction 檢查點和軌跡 sidecar；仍由 `sessions.json` 參照的檔案會保留。

- `--dry-run`：預覽不寫入時會修剪/封頂多少項目。
  - 在文字模式中，dry-run 會列印每個工作階段的動作表（`Action`、`Key`、`Age`、`Model`、`Flags`），讓你可以看到哪些會保留、哪些會移除。
- `--enforce`：即使 `session.maintenance.mode` 為 `warn` 也套用維護。
- `--fix-missing`：移除轉錄檔案遺失的項目，即使它們通常尚未因時間/數量而淘汰。
- `--active-key <key>`：保護特定作用中鍵不受磁碟預算逐出影響。持久的外部對話指標，例如群組工作階段和執行緒範圍的聊天工作階段，也會依時間/數量/磁碟預算維護而保留。
- `--agent <id>`：為一個已設定的代理儲存區執行清理。
- `--all-agents`：為所有已設定的代理儲存區執行清理。
- `--store <path>`：針對特定的 `sessions.json` 檔案執行。
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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
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
