---
read_when:
    - 你想列出已儲存的工作階段並查看近期活動
summary: '`openclaw sessions` 的命令列介面參考（列出已儲存的工作階段 + 使用方式）'
title: 工作階段
x-i18n:
    generated_at: "2026-07-05T11:10:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 849a7576557574cf1a48b17e1d4f444605afed09c675177cf12cf18f91a355b3
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是頻道/提供者存活狀態檢查。它們顯示來自工作階段存放區的持久化
對話列。沒有動靜的 Discord、Slack、Telegram 或其他頻道，可以在沒有建立新的工作階段列的情況下成功重新連線，
直到處理訊息為止。當你需要即時
頻道連線能力時，請使用 `openclaw channels status --probe`、
`openclaw status --deep` 或 `openclaw health --verbose`。

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

旗標：

| 旗標                 | 說明                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | 一個已設定的代理存放區（預設：已設定的預設代理）。        |
| `--all-agents`       | 彙總所有已設定的代理存放區。                                 |
| `--store <path>`     | 明確的存放區路徑（不能與 `--agent` 或 `--all-agents` 搭配使用）。 |
| `--active <minutes>` | 只顯示過去 N 分鐘內更新的工作階段。                  |
| `--limit <n\|all>`   | 輸出的最大列數（預設 `100`；`all` 會恢復完整輸出）。        |
| `--json`             | 機器可讀輸出。                                               |
| `--verbose`          | 詳細記錄。                                                       |

`openclaw sessions` 與閘道 `sessions.list` RPC 預設都有界限，
因此大型長期存活的存放區不會獨占命令列介面程序或閘道事件
迴圈。命令列介面預設回傳最新的 100 個工作階段；傳入 `--limit <n>`
可取得較小/較大的視窗，或在你有意需要完整
存放區時使用 `--limit all`。當呼叫端需要顯示還有更多列存在時，
JSON 回應會包含 `totalCount`、`limitApplied` 和 `hasMore`。

RPC 用戶端可以傳入 `configuredAgentsOnly: true`，以保留廣泛的合併
探索來源，但只回傳目前存在於設定中的代理列。
Control UI 預設使用該模式，因此已刪除或僅存在於磁碟上的代理存放區
不會重新出現在 Sessions 檢視中。

`--all-agents` 會讀取已設定的代理存放區。閘道與 ACP 工作階段
探索更廣泛：它們也會包含在預設 `agents/` 根目錄或範本化
`session.store` 根目錄下找到的僅存在於磁碟上的存放區。這些探索到的
存放區必須解析為代理根目錄內一般的 `sessions.json` 檔案；
符號連結和根目錄外路徑會被略過。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.5" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## 追蹤軌跡進度

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` 會將最近的軌跡 JSONL 事件呈現為精簡的
進度列。沒有 `--session-key` 時，它會先追蹤執行中的工作階段，接著
追蹤最新儲存的工作階段。`--tail <count>` 控制在跟隨模式前列印多少個既有事件；
預設為 `80`，而 `0` 會從目前結尾開始。
`--follow` 會持續監看選取的軌跡檔案，包括
`<session>.trajectory-path.json` 參照的已搬移檔案。

進度檢視刻意保持保守：不會列印提示文字、工具引數
和工具結果本文。工具呼叫會顯示工具名稱並搭配
`{...redacted...}`；工具結果會顯示 `ok`、`error` 或 `done` 等狀態；
模型完成列會顯示提供者/模型與終端狀態。

## 匯出軌跡套件

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是在擁有者核准執行要求後，由 `/export-trajectory` 斜線命令使用的
命令路徑。輸出目錄一律會解析到所選工作區下的
`.openclaw/trajectory-exports/` 內。

## 清理維護

立即執行維護，而不是等待下一個寫入週期：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 會使用設定中的 `session.maintenance` 設定
（[設定參考](/zh-TW/gateway/config-agents#session)）：

- 範圍注意事項：`openclaw sessions cleanup` 會維護工作階段存放區、
  轉錄和軌跡附屬檔。它不會修剪排程執行歷史，
  該歷史由 `cron.runLog.keepLines` 管理
  （[排程設定](/zh-TW/automation/cron-jobs#configuration)）。
- 清理也會修剪早於 `session.maintenance.pruneAfter` 且未被參照的主要轉錄、壓縮
  檢查點和軌跡附屬檔；
  仍由 `sessions.json` 參照的檔案會被保留。
- 清理會將短暫的閘道模型執行探測清理另行回報為
  `modelRunPruned`。這只會比對形狀為
  `agent:*:explicit:model-run-<uuid>` 的嚴格明確鍵。保留期限固定為 `24h`，且
  受壓力門檻控管：只有在達到工作階段項目
  維護/上限壓力時，才會移除過期的探測列。執行時，模型執行清理
  會在全域過期清理與上限處理之前發生。

旗標：

| 旗標                 | 說明                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 預覽在不寫入的情況下會修剪/套用上限多少項目。在文字模式中，列印每個工作階段的動作表（`Action`、`Key`、`Age`、`Model`、`Flags`），以及依工作階段標籤分組的摘要。                                                                                                |
| `--enforce`          | 即使 `session.maintenance.mode` 為 `warn`，也套用維護。                                                                                                                                                                                                                                   |
| `--fix-missing`      | 移除轉錄檔案遺失或只有標頭/空白的項目，即使它們通常尚未因年齡/數量而出局。                                                                                                                                                                          |
| `--fix-dm-scope`     | 當 `session.dmScope` 為 `main` 時，淘汰早期 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由留下的過期同儕鍵直接 DM 列。請先使用 `--dry-run`；套用後會從 `sessions.json` 移除這些列，並將其轉錄保留為已刪除封存。 |
| `--active-key <key>` | 保護特定作用中鍵不受磁碟預算逐出。耐久的外部對話指標，例如群組工作階段和執行緒範圍聊天工作階段，也會由年齡/數量/磁碟預算維護保留。                                                                                        |
| `--agent <id>`       | 對一個已設定的代理存放區執行清理。                                                                                                                                                                                                                                                         |
| `--all-agents`       | 對所有已設定的代理存放區執行清理。                                                                                                                                                                                                                                                        |
| `--store <path>`     | 對特定 `sessions.json` 檔案執行。                                                                                                                                                                                                                                                        |
| `--json`             | 列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個存放區的一份摘要。                                                                                                                                                                                                                   |

當閘道可連線時，針對已設定代理存放區的非 dry-run 清理會
透過閘道送出，因此它會與執行期流量共用相同的工作階段存放區寫入器。
使用 `--store <path>` 可對存放區檔案進行明確的離線修復。

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

為卡住或過大的工作階段回收上下文預算。`openclaw sessions
compact <key>` 是 `sessions.compact`
閘道 RPC 的一級包裝器，且需要執行中的閘道。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 沒有 `--max-lines` 時，閘道會使用 LLM 摘要轉錄。命令列介面
  預設不會施加用戶端期限；閘道擁有
  已設定的壓縮生命週期。
- 搭配 `--max-lines <n>` 時，它會截斷為最後 `n` 行轉錄，並
  將先前轉錄封存為 `.bak` 附屬檔。
- `--agent <id>`：擁有該工作階段的代理；`global` 鍵需要此項。
- `--url` / `--token` / `--password`：閘道連線覆寫。
- `--timeout <ms>`：可選的用戶端 RPC 逾時，單位為毫秒。
- `--json`：列印原始 RPC 酬載。

當閘道回報壓縮失敗或無法連線時，命令會以非零狀態結束，
因此排程和指令碼永遠不會把無聲無操作誤認為成功。

<Note>
`openclaw agent --message '/compact ...'` **不是**壓縮路徑。來自命令列介面的斜線
命令會被授權寄件者檢查拒絕；該
呼叫會以非零狀態結束，並提供指向此處的指引，而不是無聲地
不執行任何操作。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受：

| 欄位       | 類型        | 必填 | 說明                                                       |
| ---------- | ----------- | ---- | ---------------------------------------------------------- |
| `key`      | string      | 是   | 要壓縮的工作階段鍵（例如 `agent:main:main`）。             |
| `agentId`  | string      | 否   | 擁有該工作階段的代理程式 ID（用於 `global` 鍵）。          |
| `maxLines` | integer ≥ 1 | 否   | 截斷為最後 N 行，而不是使用 LLM 摘要。                     |

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

- [工作階段設定](/zh-TW/gateway/config-agents#session)
- [工作階段管理](/zh-TW/concepts/session)
- [壓縮](/zh-TW/concepts/compaction)
- [命令列介面參考](/zh-TW/cli)
