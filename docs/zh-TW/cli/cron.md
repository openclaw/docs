---
read_when:
    - 你想要排程工作與喚醒
    - 你正在偵錯排程執行與記錄
summary: '`openclaw cron` 的命令列介面參考（排程並執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-06T10:47:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程作業。

<Tip>
執行 `openclaw cron --help` 查看完整命令介面。概念指南請參閱[排程作業](/zh-TW/automation/cron-jobs)。
</Tip>

<Note>
所有排程異動（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令酬載執行會直接在閘道程序中執行，而不是作為代理的 `tools.exec` 工具呼叫；`tools.exec.*` 和 exec 核准仍會控管模型可見的 exec 工具。
</Note>

## 快速建立作業

`openclaw cron create` 是 `openclaw cron add` 的別名。對於新作業，請先放排程，再放提示：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

當作業應該 POST 完成的酬載，而不是傳送到聊天目標時，請使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

對於在 OpenClaw 排程內執行、且不啟動隔離代理/模型執行的確定性 shell 風格作業，請使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 以精確 argv 執行。命令作業會擷取 stdout/stderr、記錄一般排程歷史，並透過與隔離作業相同的 `announce`、`webhook` 或 `none` 傳送模式路由輸出。只印出 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段鍵">
    - `main` 綁定到代理的主要工作階段。
    - `isolated` 會為每次執行建立新的逐字稿和工作階段 ID。
    - `current` 綁定到建立當下的作用中工作階段。
    - `session:<id>` 釘選到明確的持久工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設周遭對話脈絡。新執行會重設頻道和群組路由、傳送/佇列策略、權限提升、來源，以及 ACP 執行階段綁定。安全偏好設定與使用者明確選取的模型或驗證覆寫可跨執行保留。
  </Accordion>
</AccordionGroup>

## 傳送

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳送路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析，或會以封閉失敗處理。

供應商前綴目標可釐清未解析的 announce 頻道。例如，當 `delivery.channel` 省略或為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛宣告的前綴才是供應商選擇器。如果 `delivery.channel` 是明確的，前綴必須符合該頻道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。像 `imessage:` 和 `sms:` 這類服務前綴仍是頻道所擁有的目標語法。

<Note>
隔離的 `cron add` 作業預設使用 `--announce` 傳送。使用 `--no-deliver` 將輸出保留在內部。`--deliver` 仍作為 `--announce` 的已棄用別名。
</Note>

### 傳送所有權

隔離排程聊天傳送由代理和執行器共享：

- 當聊天路由可用時，代理可以使用 `message` 工具直接傳送。
- 只有當代理未直接傳送到解析後的目標時，`announce` 才會後備傳送最終回覆。
- `webhook` 會將完成的酬載發佈到 URL。
- `none` 會停用執行器後備傳送。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子傳送。請勿將 `--webhook` 與聊天傳送旗標（例如 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account`）合併使用。

`cron edit <job-id>` 可使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消設定個別傳送路由欄位（每個旗標在與相對應的設定旗標合併時都會被拒絕）。不同於只停用執行器後備傳送的 `--no-deliver`，這些旗標會移除已儲存欄位，讓作業再次從預設值解析該部分路由。

`--announce` 是最終回覆的執行器後備傳送。`--no-deliver` 會停用該後備，但在聊天路由可用時，不會移除代理的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳送目標，用於後備 announce 傳送。內部工作階段鍵可能是小寫；請勿將它們用作區分大小寫供應商 ID（例如 Matrix 房間 ID）的真實來源。

### 失敗傳送

失敗通知會依下列順序解析：

1. 作業上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 作業的主要 announce 目標（當上述兩者都未解析為具體目的地時）。

<Note>
主要工作階段作業只有在主要傳送模式為 `webhook` 時，才可使用 `delivery.failureDestination`。隔離作業在所有模式中都接受它。
</Note>

即使未產生回覆酬載，隔離排程執行也會將執行層級的代理失敗視為作業錯誤，因此模型/供應商失敗仍會增加錯誤計數器並觸發失敗通知。

命令排程作業不會啟動隔離代理回合。結束碼為零會記錄 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄 `error`，並可觸發相同的失敗通知路徑。

如果隔離執行在第一次模型請求前逾時，`openclaw cron show` 和 `openclaw cron runs` 會包含階段特定錯誤，例如 `setup timed out before runner start`，或命名最後已知啟動階段的停滯訊息（例如 `context-engine`）。對於命令列介面後端供應商，前模型 watchdog 會保持作用中，直到外部命令列介面回合開始，因此工作階段查詢、hook、驗證、提示和命令列介面設定停滯都會回報為前模型排程失敗。

## 排程

### 一次性作業

`--at <datetime>` 排程一次性執行。沒有偏移量的日期時間會視為 UTC，除非你也傳入 `--tz <iana>`，它會以指定時區解讀壁鐘時間。

<Note>
一次性作業預設會在成功後刪除。使用 `--keep-after-run` 保留它們。
</Note>

### 重複作業

重複作業會在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可選擇將失敗警示納入重複略過執行通知。

對於以本機已設定模型供應商為目標的隔離作業（基底 URL 在 loopback、私有網路或 `.local` 上），排程會在啟動代理回合前執行輕量供應商預檢：`api: "ollama"` 供應商會在 `/api/tags` 探測；其他本機 OpenAI 相容供應商（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）會在 `/models` 探測。如果端點無法連線，該執行會記錄為 `skipped`，並在稍後的排程重試；可達性結果會按端點快取 5 分鐘，因此針對同一本機伺服器的大量作業不會用重複探測轟炸它。

排程作業、待處理執行階段狀態和執行歷史都位於共享 SQLite 狀態資料庫。舊版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 檔案會匯入一次，並以 `.migrated` 後綴重新命名。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不是編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用傳回的 `runId` 檢查稍後結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

當腳本應封鎖直到該確切排入佇列的執行記錄終端狀態時，請加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，再輪詢 `cron.runs` 取得傳回的 `runId`。只有當執行以 `ok` 狀態完成時，命令才會以 `0` 結束。當執行以 `error` 或 `skipped` 完成、閘道回應未包含 `runId`，或 `--wait-timeout` 到期時（預設 `10m`，預設每 `2s` 輪詢一次），它會以非零結束。`--poll-interval` 必須大於零。

<Note>
當你希望手動命令只在作業目前到期時執行，請使用 `--due`。如果 `--due --wait` 未將執行排入佇列，命令會傳回一般非執行回應，而不是進行輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為作業選取允許的模型。`cron add|edit --fallbacks <list>` 會設定每個作業的後備模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可進行沒有後備的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除每個作業的後備覆寫。`cron edit <job-id> --clear-model` 會移除每個作業的模型覆寫，讓作業遵循一般排程模型選取優先順序（若存在則為已儲存的排程工作階段覆寫，否則為代理/預設模型）；它不能與 `--model` 合併使用。`cron add|edit --thinking <level>` 會設定每個作業的 thinking 覆寫；`cron edit <job-id> --clear-thinking` 會移除它，讓作業遵循一般排程 thinking 優先順序，且它不能與 `--thinking` 合併使用。

<Warning>
如果模型不被允許或無法解析，排程會以明確的驗證錯誤讓執行失敗，而不是後備到作業的代理或預設模型選取。
</Warning>

排程 `--model` 是**作業主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的作業模型失敗時，已設定的模型後備仍會套用。
- 存在時，每個作業酬載 `fallbacks` 會取代已設定的後備清單。
- 空的每作業後備清單（作業酬載/API 中的 `--fallbacks ""` 或 `fallbacks: []`）會讓排程執行成為嚴格模式。
- 當作業有 `--model` 但未設定後備清單時，OpenClaw 會傳入明確的空後備覆寫，因此代理主要模型不會作為隱藏重試目標附加。
- 本機供應商預檢會在將排程執行標記為 `skipped` 前遍歷已設定的後備。

`openclaw doctor` 會回報已設定 `payload.model` 的作業，包括供應商命名空間計數，以及與 `agents.defaults.model` 的不相符。當驗證、供應商或計費行為在即時聊天和排程作業之間看起來不同時，請使用該檢查。

### 隔離排程模型優先順序

隔離排程會依下列順序解析作用中模型：

1. Gmail hook 覆寫。
2. 每個作業的 `--model`。
3. 已儲存的排程工作階段模型覆寫（當使用者選取一個時）。
4. 代理或預設模型選取。

### 快速模式

隔離排程快速模式會遵循解析後的即時模型選取。模型設定 `params.fastMode` 預設會套用，但已儲存工作階段的 `fastMode` 覆寫仍優先於設定。當解析後模式為 `auto` 時，截止值會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，排程會在重試前，為作用中執行持久保存已切換的供應商和模型（以及存在時的已切換驗證設定檔覆寫）。外層重試迴圈在初次嘗試後限制為兩次切換重試，之後會中止而不是無限迴圈。

## 執行輸出和拒絕

### 抑制過期確認

隔離排程回合會抑制過期的僅確認回覆。如果第一個結果只是臨時狀態更新，且沒有子代理後代執行負責最終答案，排程會在傳送前重新提示一次以取得真正結果。

### 靜默權杖抑制

如果隔離排程執行只傳回靜默權杖（`NO_REPLY` 或 `no_reply`），排程會抑制直接對外傳送與備援佇列摘要路徑，因此不會有任何內容回傳到聊天。

### 結構化拒絕

隔離排程執行會使用內嵌執行中的結構化執行拒絕中繼資料（編碼為 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命 exec-tool 錯誤）作為權威拒絕訊號。它們也會遵循節點主機在巢狀結構化錯誤外包覆、且該錯誤帶有其中一個代碼的 `UNAVAILABLE` 包裝。

除非內嵌執行也提供結構化拒絕中繼資料，否則排程不會將最終輸出的散文或看似核准的拒絕片語分類為拒絕，因此一般助理文字不會被視為遭封鎖的命令。

`cron list` 和執行歷史會顯示拒絕原因，而不是將遭封鎖的命令回報為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`，或設為 `false` 以停用）會修剪已完成的隔離執行工作階段。
- `cron.runLog.keepLines`（預設 `2000`）會依每個工作的保留 SQLite 執行歷史列數進行修剪。`cron.runLog.maxBytes`（預設 `2000000`）仍會為了相容於較舊的檔案支援執行記錄而被接受；SQLite 修剪以列數為基準。

## 遷移較舊的工作

<Note>
如果你有目前傳送與儲存格式之前建立的排程工作，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、頂層傳送欄位，包括舊版 `threadId`、承載資料 `provider` 傳送別名），並將 `notify: true` 網路鉤子備援工作從 `cron.webhook` 遷移到明確的網路鉤子傳送。已經向聊天公告的工作會保留該傳送，並取得完成網路鉤子目的地。當 `cron.webhook` 未設定時，對於沒有遷移目標的工作，會移除無作用的頂層 `notify` 標記（既有傳送會原封不動保留），因此 `doctor --fix` 不會再持續對它們重新發出警告。
</Note>

## 常見編輯

更新傳送設定而不變更訊息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

停用隔離工作的傳送：

```bash
openclaw cron edit <job-id> --no-deliver
```

啟用隔離工作的輕量啟動內容：

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

建立具備輕量啟動內容的隔離工作：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 只適用於隔離的 agent-turn 工作。對於排程執行，輕量模式會讓啟動內容保持空白，而不是注入完整的工作區啟動集合。

建立具有精確 argv、cwd、env、stdin 與輸出限制的命令工作：

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## 常見管理命令

手動執行與檢查：

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` 預設會顯示所有符合的工作。傳入 `--agent <id>` 可只顯示有效正規化代理程式 ID 相符的工作；沒有儲存代理程式 ID 的工作會計為已設定的預設代理程式。

`openclaw cron get <job-id>` 會直接傳回儲存的工作 JSON。當你想要包含傳送路由預覽的人類可讀檢視時，請使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 會在每個工作上包含頂層 `status` 欄位，該欄位由 `enabled`、`state.runningAtMs` 與 `state.lastRunStatus` 計算而來。值為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 狀態會保持典範且不加裝飾，讓外部工具可讀取工作狀態而不必重新推導；人類輸出可能會以失敗次數裝飾重複的 `error` 狀態。

`cron runs` 項目包含傳送診斷，包括預期的排程目標、解析後的目標、訊息工具傳送、備援使用情況，以及已傳送狀態。

代理程式與工作階段重新指定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 會在 agent-turn 工作省略 `--agent` 時發出警告，並退回預設代理程式（`main`）。建立時傳入 `--agent <id>` 可釘選特定代理程式。

傳送微調：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [排定工作](/zh-TW/automation/cron-jobs)
