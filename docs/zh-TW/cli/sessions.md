---
read_when:
    - 你想列出已儲存的工作階段並查看最近活動
summary: '`openclaw sessions` 的 CLI 參考（列出已儲存的工作階段 + 用法）'
title: 工作階段
x-i18n:
    generated_at: "2026-05-02T20:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是頻道/提供者的存活檢查。它們顯示來自工作階段存放區的持久化
對話列。安靜的 Discord、Slack、Telegram 或
其他頻道可以成功重新連線，而不會建立新的工作階段列，
直到處理訊息為止。當你需要即時
頻道連線能力時，請使用 `openclaw channels status --probe`、
`openclaw status --deep` 或 `openclaw health --verbose`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

範圍選擇：

- 預設：已設定的預設代理程式存放區
- `--verbose`：詳細記錄
- `--agent <id>`：一個已設定的代理程式存放區
- `--all-agents`：彙整所有已設定的代理程式存放區
- `--store <path>`：明確的存放區路徑（不能與 `--agent` 或 `--all-agents` 合併使用）

為已儲存的工作階段匯出軌跡套件：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是擁有者核准執行要求後，`/export-trajectory` 斜線命令使用的命令路徑。輸出目錄一律會解析在所選工作區下的 `.openclaw/trajectory-exports/` 內。

`openclaw sessions --all-agents` 會讀取已設定的代理程式存放區。Gateway 和 ACP
工作階段探索範圍更廣：它們也會包含在
預設 `agents/` 根目錄或範本化 `session.store` 根目錄下找到的僅磁碟存放區。這些
探索到的存放區必須解析為代理程式根目錄內的一般 `sessions.json` 檔案；符號連結和根目錄外路徑會被略過。

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

- 範圍注意事項：`openclaw sessions cleanup` 會維護工作階段存放區、文字記錄和軌跡 sidecar。它不會修剪 cron 執行記錄（`cron/runs/<jobId>.jsonl`），這些記錄由 [Cron 設定](/zh-TW/automation/cron-jobs#configuration)中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，並在 [Cron 維護](/zh-TW/automation/cron-jobs#maintenance)中說明。

- `--dry-run`：預覽會修剪/限制多少項目，而不寫入。
  - 在文字模式中，dry-run 會列印每個工作階段的動作表格（`Action`、`Key`、`Age`、`Model`、`Flags`），讓你可以看到哪些會保留、哪些會移除。
- `--enforce`：即使 `session.maintenance.mode` 是 `warn`，也套用維護。
- `--fix-missing`：移除文字記錄檔案缺失的項目，即使它們通常尚未因年齡/數量而淘汰。
- `--active-key <key>`：保護特定作用中 key 免於因磁碟預算而被逐出。持久的外部對話指標，例如群組工作階段和執行緒範圍的聊天工作階段，也會由年齡/數量/磁碟預算維護保留。
- `--agent <id>`：為一個已設定的代理程式存放區執行清理。
- `--all-agents`：為所有已設定的代理程式存放區執行清理。
- `--store <path>`：針對特定 `sessions.json` 檔案執行。
- `--json`：列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個存放區的一份摘要。

當 Gateway 可連線時，已設定代理程式存放區的非 dry-run 清理會透過 Gateway 傳送，因此它會與執行階段流量共用相同的工作階段存放區寫入器。對存放區檔案進行明確的離線修復時，請使用 `--store <path>`。

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
