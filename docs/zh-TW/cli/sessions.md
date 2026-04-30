---
read_when:
    - 您想列出已儲存的工作階段並查看近期活動
summary: CLI 參考：`openclaw sessions`（列出已儲存的工作階段 + 使用方式）
title: 工作階段
x-i18n:
    generated_at: "2026-04-30T02:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

範圍選擇：

- 預設：已設定的預設代理程式儲存區
- `--verbose`：詳細記錄
- `--agent <id>`：一個已設定的代理程式儲存區
- `--all-agents`：彙總所有已設定的代理程式儲存區
- `--store <path>`：明確的儲存區路徑（不能與 `--agent` 或 `--all-agents` 搭配使用）

為已儲存的工作階段匯出軌跡套件：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是 `/export-trajectory` 斜線命令在擁有者核准 exec 請求後使用的命令路徑。輸出目錄一律會在所選工作區底下的 `.openclaw/trajectory-exports/` 內解析。

`openclaw sessions --all-agents` 會讀取已設定的代理程式儲存區。Gateway 和 ACP 工作階段探索範圍更廣：它們也會包含在預設 `agents/` 根目錄或範本化 `session.store` 根目錄下找到的僅磁碟儲存區。這些探索到的儲存區必須解析為代理程式根目錄內的一般 `sessions.json` 檔案；符號連結與根目錄外路徑會被略過。

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

- 範圍注意事項：`openclaw sessions cleanup` 會維護工作階段儲存區、逐字稿與軌跡伴隨檔。它不會修剪 Cron 執行記錄（`cron/runs/<jobId>.jsonl`），這些記錄由 [Cron 設定](/zh-TW/automation/cron-jobs#configuration) 中的 `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 管理，並在 [Cron 維護](/zh-TW/automation/cron-jobs#maintenance) 中說明。

- `--dry-run`：預覽在不寫入的情況下會修剪/限制多少項目。
  - 在文字模式中，dry-run 會列印每個工作階段的動作表（`Action`、`Key`、`Age`、`Model`、`Flags`），讓你查看哪些會保留、哪些會移除。
- `--enforce`：即使 `session.maintenance.mode` 是 `warn`，也套用維護。
- `--fix-missing`：移除逐字稿檔案遺失的項目，即使它們通常尚未因存留時間/數量而淘汰。
- `--active-key <key>`：保護特定作用中鍵不受磁碟預算逐出。
- `--agent <id>`：為一個已設定的代理程式儲存區執行清理。
- `--all-agents`：為所有已設定的代理程式儲存區執行清理。
- `--store <path>`：針對特定 `sessions.json` 檔案執行。
- `--json`：列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個儲存區的一份摘要。

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
