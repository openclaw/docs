---
read_when:
    - 你想要排程工作與喚醒
    - 您正在偵錯 Cron 執行與日誌
summary: '`openclaw cron` 的 CLI 參考資料（排程並執行背景作業）'
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 排程器的 Cron 作業。

<Tip>
執行 `openclaw cron --help` 以查看完整命令介面。概念指南請參閱 [Cron 作業](/zh-TW/automation/cron-jobs)。
</Tip>

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段鍵">
    - `main` 會繫結到代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的文字記錄和工作階段 ID。
    - `current` 會繫結到建立時的作用中工作階段。
    - `session:<id>` 會固定到明確的持久工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設周遭對話脈絡。頻道與群組路由、傳送/佇列政策、提升權限、來源，以及 ACP 執行階段繫結，都會為新的執行重設。安全偏好設定以及使用者明確選取的模型或驗證覆寫可跨執行保留。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是否從主要或目前工作階段解析，或是否會封閉失敗。

帶有提供者前綴的目標可用來消除未解析公告頻道的歧義。例如，當省略 `delivery.channel` 或其值為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入 Plugin 宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確指定，前綴必須符合該頻道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。`imessage:` 和 `sms:` 等服務前綴仍是由頻道擁有的目標語法。

<Note>
隔離的 `cron add` 作業預設使用 `--announce` 傳遞。使用 `--no-deliver` 可讓輸出保留在內部。`--deliver` 仍作為 `--announce` 的已棄用別名保留。
</Note>

### 傳遞所有權

隔離 Cron 聊天傳遞由代理程式與執行器共同負責：

- 代理程式可在聊天路由可用時，使用 `message` 工具直接傳送。
- 只有當代理程式未直接傳送到解析後的目標時，`announce` 才會備援傳遞最終回覆。
- `webhook` 會將完成的酬載張貼到 URL。
- `none` 會停用執行器備援傳遞。

`--announce` 是執行器對最終回覆的備援傳遞。`--no-deliver` 會停用該備援，但在聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒事項，會保留即時聊天傳遞目標以供備援 announce 傳遞使用。內部工作階段鍵可能是小寫；請勿將它們作為區分大小寫之提供者 ID 的事實來源，例如 Matrix 房間 ID。

### 失敗傳遞

失敗通知會依此順序解析：

1. 作業上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 作業的主要 announce 目標（未設定明確失敗目的地時）。

<Note>
主要工作階段作業只有在主要傳遞模式為 `webhook` 時，才可使用 `delivery.failureDestination`。隔離作業則在所有模式都接受它。
</Note>

注意：隔離 Cron 執行會將執行層級的代理程式失敗視為作業錯誤，即使未產生回覆酬載也是如此，因此模型/提供者失敗仍會遞增錯誤計數器並觸發失敗通知。

## 排程

### 一次性作業

`--at <datetime>` 會排程一次性執行。沒有偏移量的日期時間會視為 UTC，除非你也傳入 `--tz <iana>`，該選項會以指定時區解讀牆鐘時間。

<Note>
一次性作業預設會在成功後刪除。使用 `--keep-after-run` 可保留它們。
</Note>

### 週期性作業

週期性作業在連續錯誤後會使用指數重試退避：30 秒、1 分鐘、5 分鐘、15 分鐘、60 分鐘。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可讓失敗警示納入重複的略過執行通知。

對於目標為本機已設定模型提供者的隔離作業，Cron 會在開始代理程式回合前執行輕量提供者預檢。local loopback、私人網路和 `.local` 的 `api: "ollama"` 提供者會在 `/api/tags` 探測；本機 OpenAI 相容提供者（例如 vLLM、SGLang 和 LM Studio）會在 `/models` 探測。如果端點無法連線，該執行會記錄為 `skipped`，並在稍後的排程重試；相符的失效端點會快取 5 分鐘，以避免大量作業不斷敲擊同一個本機伺服器。

注意：Cron 作業定義位於 `jobs.json`，而待處理執行階段狀態位於 `jobs-state.json`。如果 `jobs.json` 由外部編輯，Gateway 會重新載入變更的排程並清除過期的待處理時段；僅格式化的重寫不會清除待處理時段。

### 手動執行

`openclaw cron run` 會在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 追蹤最終結果。

<Note>
`openclaw cron run <job-id>` 預設會強制執行。使用 `--due` 可保留較舊的「只有到期才執行」行為。
</Note>

## 模型

`cron add|edit --model <ref>` 會為作業選取允許的模型。

<Warning>
如果模型不被允許或無法解析，Cron 會以明確的驗證錯誤讓執行失敗，而不是退回到作業的代理程式或預設模型選擇。
</Warning>

Cron `--model` 是**作業主要模型**，不是聊天工作階段的 `/model` 覆寫。這表示：

- 當選取的作業模型失敗時，已設定的模型備援仍會套用。
- 存在每個作業的酬載 `fallbacks` 時，它會取代已設定的備援清單。
- 空的每個作業備援清單（作業酬載/API 中的 `fallbacks: []`）會讓 Cron 執行變成嚴格模式。
- 當作業有 `--model` 但未設定備援清單時，OpenClaw 會傳入明確的空備援覆寫，避免代理程式主要模型被附加為隱藏重試目標。

### 隔離 Cron 模型優先順序

隔離 Cron 會依此順序解析作用中模型：

1. Gmail-hook 覆寫。
2. 每個作業的 `--model`。
3. 已儲存的 Cron 工作階段模型覆寫（使用者已選取時）。
4. 代理程式或預設模型選擇。

### 快速模式

隔離 Cron 快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍優先於設定。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，Cron 會先為作用中執行持久化已切換的提供者與模型（以及存在時已切換的驗證設定檔覆寫），再進行重試。外層重試迴圈在初始嘗試後限制為兩次切換重試，接著會中止而不是無限迴圈。

## 執行輸出與拒絕

### 過期確認抑制

隔離 Cron 回合會抑制過期且僅為確認的回覆。如果第一個結果只是暫時狀態更新，且沒有後代子代理程式執行負責最終答案，Cron 會在傳遞前重新提示一次以取得真正結果。

### 靜默權杖抑制

如果隔離 Cron 執行只返回靜默權杖（`NO_REPLY` 或 `no_reply`），Cron 會同時抑制直接對外傳遞和備援佇列摘要路徑，因此不會有任何內容張貼回聊天。

### 結構化拒絕

隔離 Cron 執行會優先使用嵌入式執行中的結構化執行拒絕中繼資料，接著才退回到最終輸出中的已知拒絕標記，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和核准繫結拒絕片語。

`cron list` 和執行歷史會顯示拒絕原因，而不是將被封鎖的命令回報為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 遷移較舊的作業

<Note>
如果你有目前傳遞和儲存格式之前的 Cron 作業，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版 Cron 欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、酬載 `provider` 傳遞別名），並在已設定 `cron.webhook` 時，將簡單的 `notify: true` Webhook 備援作業遷移為明確的 Webhook 傳遞。

Doctor 也會移除已持久化的 Cron `payload.model` 哨兵值，例如 `"default"`、`"null"`、空白字串和 JSON `null`。Cron 執行階段仍會將任何非空的 `payload.model` 字串視為明確模型覆寫，並對照 `agents.defaults.models` 驗證；當作業應使用代理程式/預設模型選擇時，請省略模型鍵。
</Note>

## 常見編輯

更新傳遞設定但不變更訊息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

停用隔離作業的傳遞：

```bash
openclaw cron edit <job-id> --no-deliver
```

為隔離作業啟用輕量啟動脈絡：

```bash
openclaw cron edit <job-id> --light-context
```

公告到特定頻道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

公告到 Telegram 論壇主題：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

建立具有輕量啟動脈絡的隔離作業：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 只套用於隔離代理程式回合作業。對於 Cron 執行，輕量模式會讓啟動脈絡保持空白，而不是注入完整工作區啟動集合。

## 常見管理命令

手動執行與檢查：

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` 預設會顯示所有相符作業。傳入 `--agent <id>` 可只顯示有效正規化代理程式 ID 相符的作業；沒有已儲存代理程式 ID 的作業會算作已設定的預設代理程式。

`cron runs` 項目包含傳遞診斷，涵蓋預期的 Cron 目標、解析後的目標、message 工具傳送、備援使用情形，以及已傳遞狀態。

代理程式與工作階段重新指定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 會在代理程式回合作業省略 `--agent` 時發出警告，並退回到預設代理程式（`main`）。在建立時傳入 `--agent <id>` 可固定到特定代理程式。

傳遞微調：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [排程工作](/zh-TW/automation/cron-jobs)
