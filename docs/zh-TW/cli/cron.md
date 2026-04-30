---
read_when:
    - 你想要排程工作和喚醒
    - 您正在偵錯 Cron 執行與日誌
summary: '`openclaw cron` 的 CLI 參考（排程並執行背景作業）'
title: Cron
x-i18n:
    generated_at: "2026-04-30T02:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
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
    - `main` 繫結到代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的轉錄記錄與工作階段 ID。
    - `current` 會繫結到建立時的作用中工作階段。
    - `session:<id>` 會固定到明確的持久工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話脈絡。通道與群組路由、傳送/佇列政策、提權、來源，以及 ACP 執行階段繫結都會為新的執行重設。安全偏好設定與使用者明確選取的模型或驗證覆寫可以跨執行保留。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析而來，或會以關閉方式失敗。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 傳遞。使用 `--no-deliver` 可讓輸出維持內部。`--deliver` 仍作為 `--announce` 的已棄用別名保留。
</Note>

### 傳遞擁有權

隔離 Cron 聊天傳遞由代理程式與執行器共同處理：

- 當聊天路由可用時，代理程式可以使用 `message` 工具直接傳送。
- `announce` 只有在代理程式未直接傳送到解析後目標時，才會後備傳遞最終回覆。
- `webhook` 會將完成的承載內容發布到 URL。
- `none` 會停用執行器後備傳遞。

`--announce` 是最終回覆的執行器後備傳遞。`--no-deliver` 會停用該後備，但當聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，以供後備公告傳遞使用。內部工作階段鍵可能是小寫；不要將它們作為區分大小寫的提供者 ID 的真實來源，例如 Matrix 房間 ID。

### 失敗傳遞

失敗通知會依此順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（未設定明確失敗目的地時）。

<Note>
主要工作階段工作只有在主要傳遞模式為 `webhook` 時，才可以使用 `delivery.failureDestination`。隔離工作在所有模式中都接受它。
</Note>

注意：隔離 Cron 執行會將執行層級的代理程式失敗視為工作錯誤，即使沒有產生回覆承載內容也一樣，因此模型/提供者失敗仍會增加錯誤計數器並觸發失敗通知。

## 排程

### 一次性工作

`--at <datetime>` 會排程一次性執行。沒有偏移量的日期時間會視為 UTC，除非你也傳入 `--tz <iana>`，它會以指定時區解讀牆鐘時間。

<Note>
一次性工作預設在成功後刪除。使用 `--keep-after-run` 可保留它們。
</Note>

### 週期性工作

週期性工作在連續錯誤後使用指數重試退避：30 秒、1 分鐘、5 分鐘、15 分鐘、60 分鐘。排程會在下一次成功執行後恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以選擇讓失敗警示包含重複的略過執行通知。

對於以本機設定模型提供者為目標的隔離工作，Cron 會在啟動代理程式回合前執行輕量提供者預檢。Loopback、私人網路和 `.local` `api: "ollama"` 提供者會在 `/api/tags` 探測；本機 OpenAI 相容提供者（例如 vLLM、SGLang 和 LM Studio）會在 `/models` 探測。如果端點無法連線，該執行會記錄為 `skipped`，並在之後的排程重試；符合的失效端點會快取 5 分鐘，以避免許多工作持續重擊同一本機伺服器。

注意：Cron 工作定義存放在 `jobs.json`，而待處理的執行階段狀態存放在 `jobs-state.json`。如果 `jobs.json` 從外部被編輯，Gateway 會重新載入已變更的排程並清除過期的待處理時段；僅格式化的重寫不會清除待處理時段。

### 手動執行

`openclaw cron run` 會在手動執行排入佇列後立即返回。成功回應會包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 追蹤最終結果。

<Note>
`openclaw cron run <job-id>` 預設會強制執行。使用 `--due` 可保留較舊的「只有到期時才執行」行為。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許的模型。

<Warning>
如果模型不被允許或無法解析，Cron 會以明確的驗證錯誤讓執行失敗，而不是退回到工作的代理程式或預設模型選擇。
</Warning>

Cron `--model` 是**工作主要模型**，不是聊天工作階段的 `/model` 覆寫。這表示：

- 當選取的工作模型失敗時，設定的模型後備仍會套用。
- 存在時，每個工作的承載 `fallbacks` 會取代設定的後備清單。
- 空的每工作後備清單（工作承載/API 中的 `fallbacks: []`）會使 Cron 執行變得嚴格。
- 當工作有 `--model` 但未設定後備清單時，OpenClaw 會傳入明確的空後備覆寫，因此代理程式主要模型不會作為隱藏重試目標附加。

### 隔離 Cron 模型優先順序

隔離 Cron 依此順序解析作用中模型：

1. Gmail-hook 覆寫。
2. 每工作 `--model`。
3. 已儲存的 Cron 工作階段模型覆寫（當使用者已選取一個時）。
4. 代理程式或預設模型選擇。

### 快速模式

隔離 Cron 快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍優先於設定。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，Cron 會在重試前，為作用中執行保留已切換的提供者與模型（以及存在時的已切換驗證設定檔覆寫）。外層重試迴圈在初次嘗試後限制為兩次切換重試，然後中止而不是永久迴圈。

## 執行輸出與拒絕

### 過期確認抑制

隔離 Cron 回合會抑制過期的僅確認回覆。如果第一個結果只是中間狀態更新，且沒有後代子代理程式執行負責最終答案，Cron 會在傳遞前重新提示一次以取得真正結果。

### 靜默權杖抑制

如果隔離 Cron 執行只返回靜默權杖（`NO_REPLY` 或 `no_reply`），Cron 會同時抑制直接對外傳遞與後備佇列摘要路徑，因此不會有任何內容發布回聊天。

### 結構化拒絕

隔離 Cron 執行會優先使用嵌入式執行中的結構化執行拒絕中繼資料，然後退回到最終輸出中的已知拒絕標記，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和核准繫結拒絕片語。

`cron list` 和執行歷史會顯示拒絕原因，而不是將被封鎖的命令報告為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 遷移較舊的工作

<Note>
如果你有目前傳遞與儲存格式之前的 Cron 工作，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版 Cron 欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、承載 `provider` 傳遞別名），並在已設定 `cron.webhook` 時，將簡單的 `notify: true` Webhook 後備工作遷移為明確的 Webhook 傳遞。
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

為隔離工作啟用輕量啟動脈絡：

```bash
openclaw cron edit <job-id> --light-context
```

公告到特定通道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

公告到 Telegram 論壇主題：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

建立具有輕量啟動脈絡的隔離工作：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 只適用於隔離代理程式回合工作。對於 Cron 執行，輕量模式會讓啟動脈絡保持空白，而不是注入完整工作區啟動集。

## 常見管理命令

手動執行與檢查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 項目包含傳遞診斷，提供預期的 Cron 目標、解析後目標、訊息工具傳送、後備使用情況，以及已傳遞狀態。

代理程式與工作階段重新指向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

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
