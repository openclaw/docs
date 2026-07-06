---
read_when:
    - 你需要回答誰執行了代理程式或工具、執行時間，以及它如何結束
    - 你需要有界限且可安全遮蔽敏感資訊的活動匯出
summary: 僅中繼資料代理執行與工具動作稽核記錄的命令列介面參考
title: 稽核記錄
x-i18n:
    generated_at: "2026-07-06T21:47:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f3163f5fe4d1e15c2364d71927299caad4fd8a2b0101347cecab5d4d97f11c0
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

查詢閘道中僅含中繼資料的稽核帳本，以檢視代理程式執行與工具動作。

記錄預設為啟用；設定 [`audit.enabled: false`](/zh-TW/gateway/configuration-reference#audit)
即可停止新的寫入。既有記錄在到期前（30 天）仍可查詢。
此帳本與對話逐字稿分開：它會記錄身分、
排序、來源、動作、狀態與正規化錯誤碼，但絕不
儲存提示、訊息、工具引數、工具結果、命令輸出或原始
錯誤文字。

閘道會透過有界背景寫入器，將記錄寫入共用的 OpenClaw 狀態資料庫。
查詢絕不會回傳超過 30 天的記錄，
且帳本上限為 100,000 列。到期列會在
閘道啟動、每小時維護以及後續寫入時刪除。

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
```

## 篩選器

- `--agent <id>`：精確的代理程式 id
- `--session <key>`：精確的工作階段鍵
- `--run <id>`：精確的執行 id
- `--kind <kind>`：`agent_run` 或 `tool_action`
- `--status <status>`：`started`、`succeeded`、`failed`、`cancelled`、
  `timed_out`、`blocked` 或 `unknown`
- `--after <timestamp>` / `--before <timestamp>`：包含邊界的 ISO 時間戳記或
  Unix 毫秒
- `--limit <count>`：頁面大小為 1 到 500；預設為 `100`
- `--cursor <sequence>`：接續先前由新到舊的查詢
- `--json`：將有界頁面列印為 JSON

文字輸出會顯示時間、種類、狀態、代理程式、執行與動作。工具動作也會
顯示工具名稱。JSON 輸出是相同中繼資料的安全有界匯出，
並在存在下一頁時包含 `nextCursor`。將該值傳給
`--cursor`，即可在不重新排序分頁期間抵達的記錄下繼續查詢。

## 已記錄事件

閘道會將既有代理程式事件串流投影為四種動作：

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`

每筆記錄都有穩定的事件 id、單調遞增的帳本序列、
原始執行事件序列、執行階段提供時的生命週期時間戳記
（否則為觀測時間）、代理程式/執行來源、操作者，以及
`redaction: "metadata_only"` 標記。終端記錄會使用封閉狀態與錯誤
碼來區分成功、失敗、取消、逾時與政策封鎖。當上游執行階段
未公開權威的終端結果時，`unknown` 是明確的非成功結果。工具呼叫 id 僅會以
穩定的單向指紋匯出。工具名稱必須符合精簡的
模型面向名稱契約；其他值會變成 `unknown`。工作階段 id、工作階段
鍵、執行 id 與保留的工具名稱屬於操作員中繼資料；請將匯出內容
作為作業記錄保護。

稽核帳本不會取代逐字稿、任務歷史、排程執行歷史
或記錄檔。它提供小型跨執行索引，讓操作員能在不將
對話內容複製到另一個儲存區的情況下提出查詢。

## 閘道 RPC

`audit.list` 需要 `operator.read`，並接受相同的篩選器。範例：

```bash
openclaw gateway call audit.list --params '{"agentId":"main","status":"failed","limit":50}'
```

結果為 `{ "events": AuditEvent[], "nextCursor"?: string }`。結果會
由新到舊排序，且每次請求最多限制為 500 筆記錄。

## 相關

- [閘道協定](/zh-TW/gateway/protocol#audit-ledger-rpc)
- [工作階段](/zh-TW/cli/sessions)
- [任務](/zh-TW/cli/tasks)
- [排程工作](/zh-TW/automation/cron-jobs)
