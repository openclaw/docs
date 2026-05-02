---
read_when:
    - 你需要排程作業和喚醒
    - 你正在偵錯 Cron 執行和日誌
summary: '`openclaw cron` 的 CLI 參考（排程並執行背景作業）'
title: Cron
x-i18n:
    generated_at: "2026-05-02T20:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 排程器的 Cron 工作。

<Tip>
執行 `openclaw cron --help` 查看完整命令介面。概念指南請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。
</Tip>

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段鍵">
    - `main` 綁定到代理程式的主要工作階段。
    - `isolated` 會為每次執行建立全新的轉錄稿與工作階段 id。
    - `current` 綁定到建立時的作用中工作階段。
    - `session:<id>` 固定到明確的持久性工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話上下文。頻道與群組路由、傳送/佇列政策、提升權限、來源，以及 ACP 執行階段綁定都會為新執行重設。安全偏好設定與使用者明確選取的模型或驗證覆寫可跨執行沿用。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析而來，或將會封閉失敗。

帶有提供者前綴的目標可消除未解析公告頻道的歧義。例如，當省略 `delivery.channel` 或其為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入 Plugin 公告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，前綴必須符合該頻道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。服務前綴如 `imessage:` 和 `sms:` 仍是頻道所擁有的目標語法。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 傳遞。使用 `--no-deliver` 讓輸出保持內部使用。`--deliver` 仍作為 `--announce` 的已棄用別名。
</Note>

### 傳遞所有權

隔離 Cron 聊天傳遞由代理程式和執行器共享：

- 當聊天路由可用時，代理程式可使用 `message` 工具直接傳送。
- `announce` 只會在代理程式未直接傳送到解析後目標時，後援傳遞最終回覆。
- `webhook` 會將完成的承載發布到 URL。
- `none` 停用執行器後援傳遞。

`--announce` 是最終回覆的執行器後援傳遞。`--no-deliver` 會停用該後援，但當聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，用於後援公告傳遞。內部工作階段鍵可能是小寫；請勿將其作為大小寫敏感提供者 ID 的事實來源，例如 Matrix 房間 ID。

### 失敗傳遞

失敗通知會依此順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（未設定明確失敗目的地時）。

<Note>
主要工作階段工作只有在主要傳遞模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離工作在所有模式中都接受它。
</Note>

注意：即使未產生回覆承載，隔離 Cron 執行也會將執行層級的代理程式失敗視為工作錯誤，因此模型/提供者失敗仍會增加錯誤計數器並觸發失敗通知。

## 排程

### 單次工作

`--at <datetime>` 會排程單次執行。沒有時差的日期時間會視為 UTC，除非你也傳入 `--tz <iana>`，這會用指定時區解讀牆鐘時間。

<Note>
單次工作預設會在成功後刪除。使用 `--keep-after-run` 保留它們。
</Note>

### 週期性工作

週期性工作在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可讓失敗警示包含重複略過執行通知。

對於目標為本機已設定模型提供者的隔離工作，Cron 會在開始代理程式回合前執行輕量提供者預檢。Loopback、私人網路與 `.local` 的 `api: "ollama"` 提供者會在 `/api/tags` 探測；本機 OpenAI 相容提供者如 vLLM、SGLang 和 LM Studio 會在 `/models` 探測。如果端點無法連線，該次執行會記錄為 `skipped`，並在稍後排程重試；符合的無效端點會快取 5 分鐘，以避免許多工作反覆敲擊同一本機伺服器。

注意：Cron 工作定義存在於 `jobs.json`，而待處理的執行階段狀態存在於 `jobs-state.json`。如果從外部編輯 `jobs.json`，Gateway 會重新載入已變更的排程並清除過時的待處理時段；僅格式化的重寫不會清除待處理時段。

### 手動執行

`openclaw cron run` 會在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 追蹤最終結果。

<Note>
`openclaw cron run <job-id>` 預設會強制執行。使用 `--due` 保留較舊的「只有到期才執行」行為。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許的模型。

<Warning>
如果模型不被允許或無法解析，Cron 會以明確驗證錯誤使執行失敗，而不是回退到工作的代理程式或預設模型選取。
</Warning>

Cron `--model` 是**工作主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的工作模型失敗時，已設定的模型後援仍會套用。
- 存在每工作承載 `fallbacks` 時，會取代已設定的後援清單。
- 空的每工作後援清單（工作承載/API 中的 `fallbacks: []`）會讓 Cron 執行變嚴格。
- 當工作有 `--model` 但未設定後援清單時，OpenClaw 會傳入明確的空後援覆寫，因此代理程式主要模型不會被附加為隱藏的重試目標。

### 隔離 Cron 模型優先順序

隔離 Cron 依此順序解析作用中模型：

1. Gmail 鉤子覆寫。
2. 每工作 `--model`。
3. 已儲存的 Cron 工作階段模型覆寫（使用者選取過時）。
4. 代理程式或預設模型選取。

### 快速模式

隔離 Cron 快速模式會遵循解析後的即時模型選取。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍優先於設定。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，Cron 會在重試前，為作用中執行持久化已切換的提供者和模型（以及存在時的已切換驗證設定檔覆寫）。外層重試迴圈在初始嘗試後最多允許兩次切換重試，然後會中止而非無限迴圈。

## 執行輸出與拒絕

### 過時確認抑制

隔離 Cron 回合會抑制過時的僅確認回覆。如果第一個結果只是暫時狀態更新，且沒有子代理程式後代執行負責最終答案，Cron 會重新提示一次以取得真正結果，再進行傳遞。

### 靜默權杖抑制

如果隔離 Cron 執行只返回靜默權杖（`NO_REPLY` 或 `no_reply`），Cron 會同時抑制直接對外傳遞與後援佇列摘要路徑，因此不會有任何內容發布回聊天。

### 結構化拒絕

隔離 Cron 執行會優先使用內嵌執行的結構化執行拒絕中繼資料，然後回退到最終輸出中的已知拒絕標記，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和核准綁定拒絕片語。

`cron list` 和執行歷史會呈現拒絕原因，而不是將被封鎖的命令回報為 `ok`。

## 保留

保留與修剪在設定中控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 遷移較舊工作

<Note>
如果你有目前傳遞與儲存格式之前的 Cron 工作，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版 Cron 欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、承載 `provider` 傳遞別名），並在已設定 `cron.webhook` 時，將簡單的 `notify: true` Webhook 後援工作遷移為明確的 Webhook 傳遞。
</Note>

## 常見編輯

更新傳遞設定而不變更訊息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

停用隔離工作的傳遞：

```bash
openclaw cron edit <job-id> --no-deliver
```

為隔離工作啟用輕量啟動上下文：

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

建立具有輕量啟動上下文的隔離工作：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 僅套用到隔離代理程式回合工作。對於 Cron 執行，輕量模式會讓啟動上下文保持空白，而不是注入完整工作區啟動集合。

## 常見管理命令

手動執行與檢查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 項目包含傳遞診斷，其中有預期的 Cron 目標、解析後目標、訊息工具傳送、後援使用，以及已傳遞狀態。

代理程式與工作階段重新定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

當代理程式回合工作省略 `--agent` 時，`openclaw cron add` 會警告並回退到預設代理程式（`main`）。在建立時傳入 `--agent <id>` 可固定特定代理程式。

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
