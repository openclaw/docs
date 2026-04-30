---
read_when:
    - 您需要排程工作與喚醒
    - 您正在偵錯 Cron 執行與日誌
summary: CLI 參考：`openclaw cron`（排程並執行背景作業）
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 排程器的 Cron 作業。

<Tip>
執行 `openclaw cron --help` 查看完整命令介面。概念指南請參閱 [Cron 作業](/zh-TW/automation/cron-jobs)。
</Tip>

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段金鑰">
    - `main` 綁定到代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的轉錄和工作階段 ID。
    - `current` 綁定到建立時的作用中工作階段。
    - `session:<id>` 釘選到明確的持久工作階段金鑰。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設周遭對話脈絡。新執行會重設頻道與群組路由、傳送/佇列政策、提升、來源，以及 ACP 執行階段繫結。安全偏好設定和明確由使用者選取的模型或驗證覆寫可以跨執行保留。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要工作階段或目前工作階段解析，或將會以關閉方式失敗。

<Note>
隔離的 `cron add` 作業預設為 `--announce` 傳遞。使用 `--no-deliver` 將輸出保留在內部。`--deliver` 仍作為 `--announce` 的已棄用別名。
</Note>

### 傳遞擁有權

隔離 Cron 聊天傳遞由代理程式與執行器共用：

- 當聊天路由可用時，代理程式可以使用 `message` 工具直接傳送。
- 只有當代理程式未直接傳送到解析後目標時，`announce` 才會備援傳遞最終回覆。
- `webhook` 會將完成的酬載張貼到 URL。
- `none` 會停用執行器備援傳遞。

`--announce` 是執行器對最終回覆的備援傳遞。`--no-deliver` 會停用該備援，但當聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，用於備援 announce 傳遞。內部工作階段金鑰可能是小寫；請勿將它們作為大小寫敏感提供者 ID 的真實來源，例如 Matrix 房間 ID。

### 失敗傳遞

失敗通知會依下列順序解析：

1. 作業上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 作業的主要 announce 目標（未設定明確失敗目的地時）。

<Note>
主要工作階段作業只有在主要傳遞模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離作業在所有模式都接受它。
</Note>

注意：隔離 Cron 執行會將執行層級的代理程式失敗視為作業錯誤，即使
未產生回覆酬載也一樣，因此模型/提供者失敗仍會增加錯誤
計數器並觸發失敗通知。

## 排程

### 一次性作業

`--at <datetime>` 會排程一次性執行。不含時區偏移的日期時間會被視為 UTC，除非你同時傳入 `--tz <iana>`，這會在指定時區中解讀該本地時間。

<Note>
一次性作業預設會在成功後刪除。使用 `--keep-after-run` 保留它們。
</Note>

### 重複作業

重複作業在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可選擇讓失敗警示包含重複略過執行通知。

對於以本機設定模型提供者為目標的隔離作業，Cron 會在開始代理程式回合前執行輕量提供者預檢。Loopback、私人網路和 `.local` 的 `api: "ollama"` 提供者會在 `/api/tags` 探測；本機 OpenAI 相容提供者（例如 vLLM、SGLang 和 LM Studio）會在 `/models` 探測。如果端點無法連線，該次執行會記錄為 `skipped`，並在稍後排程重試；相符的無回應端點會快取 5 分鐘，以避免大量作業反覆衝擊同一本機伺服器。

注意：Cron 作業定義位於 `jobs.json`，待處理執行階段狀態則位於 `jobs-state.json`。如果 `jobs.json` 從外部被編輯，Gateway 會重新載入變更的排程並清除過時的待處理時段；僅格式化的重寫不會清除待處理時段。

### 手動執行

`openclaw cron run` 會在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 追蹤最終結果。

<Note>
`openclaw cron run <job-id>` 預設會強制執行。使用 `--due` 保留較舊的「只有到期才執行」行為。
</Note>

## 模型

`cron add|edit --model <ref>` 會為作業選取允許的模型。

<Warning>
如果模型不被允許或無法解析，Cron 會以明確的驗證錯誤使執行失敗，而不是退回到作業的代理程式或預設模型選擇。
</Warning>

Cron `--model` 是**作業主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的作業模型失敗時，仍會套用已設定的模型備援。
- 當存在逐作業酬載 `fallbacks` 時，會取代已設定的備援清單。
- 空的逐作業備援清單（作業酬載/API 中的 `fallbacks: []`）會讓 Cron 執行變成嚴格模式。
- 當作業有 `--model` 但未設定備援清單時，OpenClaw 會傳入明確的空備援覆寫，讓代理程式主要模型不會被附加為隱藏的重試目標。

### 隔離 Cron 模型優先順序

隔離 Cron 會依下列順序解析作用中模型：

1. Gmail-hook 覆寫。
2. 逐作業 `--model`。
3. 已儲存的 Cron 工作階段模型覆寫（使用者選取時）。
4. 代理程式或預設模型選擇。

### 快速模式

隔離 Cron 快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但已儲存工作階段的 `fastMode` 覆寫仍優先於設定。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，Cron 會在重試前，為作用中執行保存已切換的提供者與模型（以及存在時的已切換驗證設定檔覆寫）。外層重試迴圈在初始嘗試後限制為兩次切換重試，之後會中止而不是無限循環。

## 執行輸出與拒絕

### 過時確認抑制

隔離 Cron 回合會抑制僅含過時確認的回覆。如果第一個結果只是暫時狀態更新，且沒有後代子代理程式執行負責最終答案，Cron 會在傳遞前重新提示一次以取得真正結果。

### 靜默權杖抑制

如果隔離 Cron 執行只返回靜默權杖（`NO_REPLY` 或 `no_reply`），Cron 會同時抑制直接對外傳遞與備援佇列摘要路徑，因此不會有任何內容張貼回聊天。

### 結構化拒絕

隔離 Cron 執行會優先使用內嵌執行中的結構化執行拒絕中繼資料，然後才退回到最終輸出中的已知拒絕標記，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST`，以及核准繫結拒絕片語。

`cron list` 和執行歷史會顯示拒絕原因，而不是將遭封鎖的命令回報為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 遷移較舊作業

<Note>
如果你有來自目前傳遞與儲存格式之前的 Cron 作業，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版 Cron 欄位（`jobId`、`schedule.cron`、包含舊版 `threadId` 的頂層傳遞欄位、酬載 `provider` 傳遞別名），並在已設定 `cron.webhook` 時，將簡單的 `notify: true` Webhook 備援作業遷移為明確的 Webhook 傳遞。
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

`--light-context` 只套用於隔離代理程式回合作業。對於 Cron 執行，輕量模式會讓啟動脈絡保持空白，而不是注入完整的工作區啟動集合。

## 常見管理命令

手動執行與檢查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 項目包含傳遞診斷資訊，包括預期的 Cron 目標、解析後目標、message 工具傳送、備援使用情況，以及已傳遞狀態。

代理程式與工作階段重新指定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

當代理程式回合作業省略 `--agent` 時，`openclaw cron add` 會發出警告並退回到預設代理程式（`main`）。在建立時傳入 `--agent <id>` 以釘選特定代理程式。

傳遞微調：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [排程任務](/zh-TW/automation/cron-jobs)
