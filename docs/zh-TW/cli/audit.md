---
read_when:
    - 你需要回答是誰執行了代理程式或工具、何時執行，以及最後如何結束
    - 你需要不含內容的傳入或傳出訊息生命週期中繼資料
    - 你需要一份範圍明確且可安全遮蔽敏感資訊的活動匯出資料
summary: 僅含中繼資料的執行、工具與訊息生命週期稽核記錄命令列介面參考資料
title: 稽核記錄
x-i18n:
    generated_at: "2026-07-12T14:22:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

查詢閘道僅含中繼資料的稽核記錄，以取得代理執行、工具動作及選擇啟用的訊息生命週期記錄。

記錄預設會記錄執行與工具事件。設定
[`audit.enabled: false`](/zh-TW/gateway/configuration-reference#audit) 並重新啟動
閘道，即可停止記錄所有新事件。訊息記錄預設另外停用；將 `audit.messages`
設為 `direct` 或 `all`，並重新啟動閘道即可記錄訊息。現有記錄在到期前
（30 天）仍可查詢。

此記錄與對話逐字稿分開：它會記錄身分、順序、來源、動作、狀態及標準化的
結果代碼，但絕不儲存內容；訊息識別碼也只會以安裝環境本機的金鑰化假名
顯示。[稽核歷程](/gateway/audit) 說明完整的資料模型、隱私語意、儲存與保留
界限，以及涵蓋範圍限制；本頁則介紹命令介面。

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## 篩選條件

- `--agent <id>`：完全相符的代理 ID
- `--session <key>`：完全相符的工作階段金鑰
- `--run <id>`：完全相符的執行 ID
- `--kind <kind>`：`agent_run`、`tool_action` 或 `message`
- `--status <status>`：`started`、`succeeded`、`failed`、`cancelled`、
  `timed_out`、`blocked` 或 `unknown`
- `--direction <direction>`：訊息方向，`inbound` 或 `outbound`
- `--channel <channel>`：完全相符的訊息頻道
- `--after <timestamp>` / `--before <timestamp>`：包含邊界的 ISO 時間戳記或
  Unix 毫秒
- `--limit <count>`：頁面大小，範圍為 1 到 500；預設為 `100`
- `--cursor <sequence>`：接續先前以最新記錄優先的查詢
- `--json`：以 JSON 輸出有界頁面

命令列介面會查詢具版本的活動 RPC，因此單一命令即可顯示完整的已設定記錄。
文字輸出會顯示時間、種類、方向、頻道、狀態、代理、執行及動作。缺少訊息
來源資訊時會顯示為 `-`；OpenClaw 不會虛構代理或執行 ID。工具動作也會顯示
工具名稱。若還有下一頁，JSON 輸出會包含 `nextCursor`。將該值傳給
`--cursor`，即可繼續查詢，而不會重新排序分頁期間新抵達的記錄。

即使不含訊息本文與原始訊息身分欄位，這些匯出資料仍屬敏感的操作中繼資料。
代理、工作階段及執行 ID、時間資訊、頻道、結果與穩定的 HMAC 參照都可能用於
關聯活動。請採用與其他操作員記錄相同的存取控制與保留措施來保護它們。

## 記錄的事件

閘道會將受信任的生命週期事件流投影為六種動作：

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

每筆傳回的記錄都有穩定的事件 ID、單調遞增的記錄序號、生命週期時間戳記、
執行者、動作、狀態、`schemaVersion: 1` 標記、來源序號，以及
`redaction: "metadata_only"`。僅在受信任來源提供時，才會包含代理、工作階段、
執行來源資訊及事件特有欄位。訊息記錄刻意省略 `sessionKey` 和 `sessionId`，
因此 `--session` 只會篩選執行與工具記錄。

終止的執行與工具記錄會以封閉狀態和錯誤代碼區分成功、失敗、取消、逾時及
政策封鎖。當上游執行階段未公開具權威性的終止結果時，`unknown` 是明確的
非成功結果。工具呼叫 ID 僅會匯出為穩定指紋。工具名稱必須符合精簡的
模型導向名稱契約；其他值會變成 `unknown`。

訊息記錄會加入方向、頻道、對話種類、結果，以及選用的傳遞種類、失敗階段、
持續時間、結果數量、標準化原因代碼，和以金鑰化處理的帳號、對話、訊息及
目標假名。目前的傳入邊界涵蓋抵達核心分派的已接受訊息，包括核心重複訊息
及終止處理結果。傳出邊界會針對每個抵達共用持久傳遞流程的原始邏輯回覆
承載內容寫入一筆終止記錄；分塊與轉接器扇出會彙總至 `resultCount`。
已排入佇列、可重試或結果不明確的傳送，只有在確認、無法投遞或協調程序使
結果成為終止狀態後才會記錄。繞過這些共用邊界的外掛本機路徑與直接傳送
路徑目前尚未涵蓋；沒有記錄並不能證明訊息不存在。

稽核記錄不會取代逐字稿、任務歷程、排程執行歷程或日誌。它提供一個精簡的
跨執行索引，供操作員查詢使用，而不必將對話內容複製到另一個儲存區。

對於傳入記錄，`durationMs` 會測量核心分派時間，而 `resultCount` 會計算已
完成的佇列工具、封鎖及回覆承載內容。對於傳出記錄，`durationMs` 包含傳遞
所有權直到其終止狀態的時間（因此也包含佇列等待時間），而 `resultCount`
會計算可識別的實體平台傳送次數。若存在 `deliveryKind`，它會描述經過
鉤子後與轉譯後的實際承載內容；遭抑制及當機結果不明確的記錄會省略此欄位。

## 閘道 RPC

`audit.activity.list` 需要 `operator.read`，並接受相同的篩選條件。它會傳回具名的
V1 活動事件聯集，包括執行、工具、傳入訊息及傳出訊息記錄。

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

結果為 `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。
結果會以最新記錄優先排序，且每次要求最多 500 筆記錄。

已發布的 `audit.list` RPC 對舊版執行／工具用戶端維持不變。若舊版閘道不提供
`audit.activity.list`，只有在舊方法支援所有要求的篩選條件時，命令列介面才會
重試 `audit.list`。在舊版閘道上使用 `--kind message`、`--direction` 和
`--channel` 時，會顯示升級訊息並失敗，而不會默默捨棄這些條件。

## 相關內容

- [稽核歷程](/gateway/audit)
- [閘道通訊協定](/zh-TW/gateway/protocol#audit-ledger-rpc)
- [工作階段](/zh-TW/cli/sessions)
- [任務](/zh-TW/cli/tasks)
- [排程工作](/zh-TW/automation/cron-jobs)
