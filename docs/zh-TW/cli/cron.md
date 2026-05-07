---
read_when:
    - 你想要排程作業和喚醒
    - 你正在偵錯 Cron 執行與日誌
summary: '`openclaw cron` 的 CLI 參考（排程並執行背景工作）'
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
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
    - `main` 綁定到 agent 的主要工作階段。
    - `isolated` 會為每次執行建立新的 transcript 和工作階段 ID。
    - `current` 綁定到建立時的作用中工作階段。
    - `session:<id>` 固定到明確的持久工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話內容。Channel 與群組路由、傳送/佇列政策、提權、來源，以及 ACP 執行階段繫結，都會為新的執行重設。安全偏好設定和使用者明確選取的模型或驗證覆寫可在執行之間沿用。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析，或將以失敗關閉。

帶有 provider 前綴的目標可以消除未解析 announce channel 的歧義。例如，當省略 `delivery.channel` 或其為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入 plugin 所宣告的前綴才是 provider 選擇器。如果 `delivery.channel` 是明確的，前綴必須符合該 channel；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。`imessage:` 和 `sms:` 這類服務前綴仍然是 channel 所擁有的目標語法。

<Note>
隔離的 `cron add` 作業預設使用 `--announce` 傳遞。使用 `--no-deliver` 可將輸出保留在內部。`--deliver` 仍作為 `--announce` 的已淘汰別名。
</Note>

### 傳遞所有權

隔離 Cron 聊天傳遞由 agent 和 runner 共同負責：

- 當聊天路由可用時，agent 可以使用 `message` 工具直接傳送。
- 只有在 agent 未直接傳送到解析後目標時，`announce` 才會以 fallback 方式傳遞最終回覆。
- `webhook` 會將完成的 payload 發布到 URL。
- `none` 會停用 runner fallback 傳遞。

`--announce` 是最終回覆的 runner fallback 傳遞。`--no-deliver` 會停用該 fallback，但在聊天路由可用時不會移除 agent 的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，以用於 fallback announce 傳遞。內部工作階段鍵可能是小寫；請勿將其作為區分大小寫 provider ID（例如 Matrix room ID）的真實來源。

### 失敗傳遞

失敗通知會依以下順序解析：

1. 作業上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 作業的主要 announce 目標（未設定明確失敗目的地時）。

<Note>
主要工作階段作業只有在主要傳遞模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離作業則在所有模式下都接受它。
</Note>

注意：隔離 Cron 執行會將執行層級的 agent 失敗視為作業錯誤，即使未產生回覆 payload 也是如此，因此模型/provider 失敗仍會遞增錯誤計數器並觸發失敗通知。

## 排程

### 一次性作業

`--at <datetime>` 會排程一次性執行。沒有偏移量的日期時間會被視為 UTC，除非你同時傳入 `--tz <iana>`，這會以指定時區解讀 wall-clock time。

<Note>
一次性作業預設會在成功後刪除。使用 `--keep-after-run` 可保留它們。
</Note>

### 重複作業

重複作業在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可讓失敗警示包含重複的略過執行通知。

對於以本機已設定模型 provider 為目標的隔離作業，Cron 會在開始 agent turn 前執行輕量 provider 預檢。Loopback、私有網路和 `.local` 的 `api: "ollama"` provider 會在 `/api/tags` 探測；本機 OpenAI 相容 provider（例如 vLLM、SGLang 和 LM Studio）會在 `/models` 探測。如果端點無法連線，該次執行會記錄為 `skipped`，並在之後的排程中重試；符合條件的失效端點會快取 5 分鐘，以避免大量作業反覆撞擊同一本機伺服器。

注意：Cron 作業定義位於 `jobs.json`，而待處理的執行階段狀態位於 `jobs-state.json`。如果 `jobs.json` 由外部編輯，Gateway 會重新載入變更的排程並清除陳舊的待處理槽位；僅格式化的重寫不會清除待處理槽位。

### 手動執行

`openclaw cron run` 會在手動執行加入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 追蹤最終結果。

<Note>
`openclaw cron run <job-id>` 預設會強制執行。使用 `--due` 可保留較舊的「只有到期才執行」行為。
</Note>

## 模型

`cron add|edit --model <ref>` 會為作業選取允許的模型。

<Warning>
如果模型不被允許或無法解析，Cron 會以明確的驗證錯誤使該次執行失敗，而不是 fallback 到作業的 agent 或預設模型選取。
</Warning>

Cron `--model` 是**作業主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的作業模型失敗時，仍會套用已設定的模型 fallback。
- 當存在每作業 payload `fallbacks` 時，它會取代已設定的 fallback 清單。
- 空的每作業 fallback 清單（作業 payload/API 中的 `fallbacks: []`）會讓 Cron 執行採用嚴格模式。
- 當作業有 `--model` 但未設定 fallback 清單時，OpenClaw 會傳入明確的空 fallback 覆寫，讓 agent 主要模型不會被附加為隱藏的重試目標。

### 隔離 Cron 模型優先順序

隔離 Cron 會依以下順序解析作用中模型：

1. Gmail-hook 覆寫。
2. 每作業 `--model`。
3. 已儲存的 Cron 工作階段模型覆寫（當使用者已選取時）。
4. Agent 或預設模型選取。

### 快速模式

隔離 Cron 快速模式會遵循解析後的即時模型選取。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍優先於設定。

### 即時模型切換重試

如果隔離執行拋出 `LiveSessionModelSwitchError`，Cron 會在重試前，為作用中的執行保存切換後的 provider 和模型（以及存在時的切換後驗證設定檔覆寫）。外層重試迴圈限制為初次嘗試後再進行兩次切換重試，之後會中止而不是無限循環。

## 執行輸出與拒絕

### 陳舊確認抑制

隔離 Cron turn 會抑制陳舊的純確認回覆。如果第一個結果只是臨時狀態更新，且沒有 descendant subagent run 負責最終答案，Cron 會在傳遞前重新提示一次以取得真正結果。

### 靜默 token 抑制

如果隔離 Cron 執行只返回靜默 token（`NO_REPLY` 或 `no_reply`），Cron 會同時抑制直接對外傳遞和 fallback 佇列摘要路徑，因此不會有任何內容發回聊天。

### 結構化拒絕

隔離 Cron 執行會優先使用嵌入式執行提供的結構化執行拒絕中繼資料，然後 fallback 到最終輸出中的已知拒絕標記，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST`，以及 approval-binding 拒絕片語。

`cron list` 和執行歷史會顯示拒絕原因，而不是將被封鎖的命令回報為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 遷移較舊作業

<Note>
如果你有目前傳遞與儲存格式之前的 Cron 作業，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版 Cron 欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、payload `provider` 傳遞別名），並在已設定 `cron.webhook` 時，將簡單的 `notify: true` webhook fallback 作業遷移為明確的 webhook 傳遞。
</Note>

## 常見編輯

在不變更訊息的情況下更新傳遞設定：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

停用隔離作業的傳遞：

```bash
openclaw cron edit <job-id> --no-deliver
```

為隔離作業啟用輕量 bootstrap context：

```bash
openclaw cron edit <job-id> --light-context
```

Announce 到特定 channel：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Announce 到 Telegram forum topic：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

建立帶有輕量 bootstrap context 的隔離作業：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 僅套用於隔離 agent-turn 作業。對於 Cron 執行，輕量模式會讓 bootstrap context 保持空白，而不是注入完整工作區 bootstrap 集合。

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

`openclaw cron list` 預設會顯示所有符合的作業。傳入 `--agent <id>` 只顯示有效正規化 agent ID 相符的作業；沒有儲存 agent ID 的作業會算作已設定的預設 agent。

`cron list --json` 和 `cron show <job-id> --json` 會在每個作業上包含頂層 `status` 欄位，該欄位由 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 計算而來。值為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。這會對應人類可讀的狀態欄，讓外部工具無需重新推導即可讀取作業狀態。

`cron runs` 項目包含傳遞診斷資訊，其中有預期的 Cron 目標、解析後目標、message-tool 傳送、fallback 使用情況，以及已傳遞狀態。

Agent 與工作階段重新指定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 會在 agent-turn 作業省略 `--agent` 時發出警告，並 fallback 到預設 agent（`main`）。在建立時傳入 `--agent <id>` 可固定特定 agent。

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
