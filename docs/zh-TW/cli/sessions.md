---
read_when:
    - 你想列出已儲存的工作階段並查看最近的活動
summary: '`openclaw sessions` 的命令列介面參考（列出已儲存的工作階段與用量）'
title: 工作階段
x-i18n:
    generated_at: "2026-07-12T14:24:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

列出已儲存的對話工作階段。

工作階段清單不是頻道／提供者的存活狀態檢查。它們顯示工作階段儲存區中持久保存的
對話資料列。即使沒有建立新的工作階段資料列，安靜的 Discord、Slack、Telegram 或
其他頻道仍可成功重新連線，直到處理訊息時才會建立。需要確認即時
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
| `--agent <id>`       | 一個已設定的代理程式儲存區（預設：已設定的預設代理程式）。        |
| `--all-agents`       | 彙總所有已設定的代理程式儲存區。                                 |
| `--store <path>`     | 明確指定儲存區路徑（不能與 `--agent` 或 `--all-agents` 合併使用）。 |
| `--active <minutes>` | 僅顯示過去 N 分鐘內更新的工作階段。                  |
| `--limit <n\|all>`   | 輸出的資料列上限（預設為 `100`；`all` 會恢復完整輸出）。        |
| `--json`             | 機器可讀的輸出。                                               |
| `--verbose`          | 詳細記錄。                                                       |

`openclaw sessions` 和閘道的 `sessions.list` RPC 預設都有數量限制，
因此大型且長期存續的儲存區不會獨占命令列介面程序或閘道事件
迴圈。命令列介面預設傳回最新的 100 個工作階段；若要縮小或擴大範圍，
請傳入 `--limit <n>`；若你確實需要完整儲存區，則傳入 `--limit all`。
當呼叫端需要顯示還有更多資料列時，JSON 回應會包含 `totalCount`、
`limitApplied` 和 `hasMore`。

RPC 用戶端可以傳入 `configuredAgentsOnly: true`，以保留廣泛的合併
探索來源，但只傳回目前仍存在於設定中的代理程式資料列。
Control UI 預設使用此模式，因此已刪除或僅存在於磁碟上的代理程式儲存區
不會重新出現在 Sessions 檢視中。

`--all-agents` 會讀取已設定的代理程式儲存區。閘道和 ACP 工作階段的
探索範圍更廣：它們也會納入從已設定代理程式根目錄或範本化
`session.store` 根目錄解析出的 SQLite 儲存區。舊版選擇器
路徑必須解析至代理程式根目錄內；符號連結及根目錄外的路徑會被
略過。

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
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

`openclaw sessions tail` 會將近期執行階段軌跡事件呈現為精簡的
進度行。未指定 `--session-key` 時，它會先追蹤執行中的工作階段，再追蹤
最近儲存的工作階段。`--tail <count>` 控制進入追蹤模式前要
列印多少個既有事件；預設為 `80`，而 `0` 會從目前結尾開始。
`--follow` 會持續監看所選的 SQLite 後端工作階段，或明確指定的
舊版軌跡檔案。

此進度檢視刻意採取保守設計：不會列印提示文字、工具引數
及工具結果本文。工具呼叫會顯示工具名稱與
`{...redacted...}`；工具結果會顯示 `ok`、`error` 或 `done` 等狀態；
模型完成行會顯示提供者／模型及終止狀態。

## 匯出軌跡套件

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

這是擁有者核准執行要求後，`/export-trajectory` 斜線命令所使用的
命令路徑。輸出目錄一律解析至所選工作區下的
`.openclaw/trajectory-exports/` 內。

## 清理維護

立即執行維護，而不必等待下一個寫入週期：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 使用設定中的 `session.maintenance` 設定
（[設定參考](/zh-TW/gateway/config-agents#session)）：

- 範圍注意事項：`openclaw sessions cleanup` 會維護工作階段儲存區、
  逐字稿、軌跡資料列及舊版軌跡附屬檔案。它不會
  修剪排程執行記錄，該記錄由 `cron.runLog.keepLines` 管理
  （[排程設定](/zh-TW/automation/cron-jobs#configuration)）。
- 清理作業也會修剪早於 `session.maintenance.pruneAfter` 且未被參照的
  舊版／封存逐字稿成品、壓縮檢查點及軌跡附屬檔案；SQLite
  工作階段資料列仍有參照的成品會予以保留。
- 清理報告會將短期存續的閘道模型執行探查清理分別記為
  `modelRunPruned`。這只會比對形如
  `agent:*:explicit:model-run-<uuid>` 的嚴格明確索引鍵。保留期間固定為 `24h`，
  且受壓力條件限制：只有達到工作階段項目維護／容量上限壓力時，
  才會移除過期的探查資料列。執行時，模型執行清理會先於
  全域過期清理及容量限制。

旗標：

| 旗標                 | 說明                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | 預覽在不寫入的情況下會修剪／限制多少個項目。在文字模式中，會列印每個工作階段的動作表格（`Action`、`Key`、`Age`、`Model`、`Flags`），以及依工作階段標籤分組的摘要。                                                                                                       |
| `--enforce`          | 即使 `session.maintenance.mode` 為 `warn`，仍套用維護。                                                                                                                                                                                                                                          |
| `--fix-missing`      | 移除封存逐字稿成品遺失或只有標頭／為空的舊版項目，即使它們通常尚未因時間／數量條件而遭到移除。                                                                                                                                                             |
| `--fix-dm-scope`     | 當 `session.dmScope` 為 `main` 時，停用較早的 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 路由所遺留、以對等端為索引鍵的過期直接訊息資料列。請先使用 `--dry-run`；套用後會從 SQLite 移除這些資料列，並將其舊版逐字稿成品保留為已刪除的封存檔。 |
| `--active-key <key>` | 保護特定作用中索引鍵，避免因磁碟預算而遭到逐出。持久的外部對話指標（例如群組工作階段及限定於討論串範圍的聊天工作階段）也會在依時間／數量／磁碟預算進行維護時予以保留。                                                                                               |
| `--agent <id>`       | 對一個已設定的代理程式儲存區執行清理。                                                                                                                                                                                                                                                                |
| `--all-agents`       | 對所有已設定的代理程式儲存區執行清理。                                                                                                                                                                                                                                                               |
| `--store <path>`     | 對特定舊版儲存區選擇器路徑執行。                                                                                                                                                                                                                                                         |
| `--json`             | 列印 JSON 摘要。搭配 `--all-agents` 時，輸出會包含每個儲存區各自的摘要。                                                                                                                                                                                                                          |

當閘道可連線時，對已設定代理程式儲存區執行的非試執行清理會
透過閘道送出，以便與執行階段流量共用相同的工作階段儲存區寫入器。
若要明確離線修復舊版儲存區選擇器，請使用 `--store <path>`。

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

為卡住或過大的工作階段回收內容預算。`openclaw sessions
compact <key>` 是 `sessions.compact` 閘道 RPC 的第一級包裝命令，
且需要執行中的閘道。

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- 未指定 `--max-lines` 時，閘道會使用 LLM 摘要逐字稿。命令列介面
  預設不施加用戶端截止時間；閘道負責已設定的
  壓縮生命週期。
- 指定 `--max-lines <n>` 時，會截斷成最後 `n` 行逐字稿，並將
  先前的逐字稿封存為 `.bak` 附屬檔案。
- `--agent <id>`：擁有該工作階段的代理程式；`global` 索引鍵必須指定。
- `--url` / `--token` / `--password`：閘道連線覆寫值。
- `--timeout <ms>`：選用的用戶端 RPC 逾時，單位為毫秒。
- `--json`：列印原始 RPC 承載資料。

當閘道回報壓縮失敗或無法連線時，命令會以非零狀態結束，
因此排程和指令碼絕不會將無聲的空操作誤認為成功。

<Note>
`openclaw agent --message '/compact ...'` **不是**壓縮途徑。來自命令列介面的斜線
命令會遭授權傳送者檢查拒絕；該呼叫會以非零狀態結束，並提供指向此處的指引，
而不是無聲地不執行任何操作。
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` 接受以下參數：

| 欄位       | 類型        | 必填 | 說明                                                    |
| ---------- | ----------- | ---- | ------------------------------------------------------- |
| `key`      | string      | 是   | 要壓縮的工作階段鍵（例如 `agent:main:main`）。          |
| `agentId`  | string      | 否   | 擁有該工作階段的代理程式 ID（用於 `global` 鍵）。       |
| `maxLines` | integer ≥ 1 | 否   | 截斷為最後 N 行，而不使用 LLM 摘要。                    |

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

## 相關內容

- [工作階段設定](/zh-TW/gateway/config-agents#session)
- [工作階段管理](/zh-TW/concepts/session)
- [壓縮](/zh-TW/concepts/compaction)
- [命令列介面參考](/zh-TW/cli)
