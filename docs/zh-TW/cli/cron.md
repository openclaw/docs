---
read_when:
    - 你想要排程工作和喚醒功能
    - 你正在偵錯排程執行與記錄
summary: '`openclaw cron` 的命令列介面參考（排程並執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-01T02:57:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程工作。

<Tip>
執行 `openclaw cron --help` 查看完整命令介面。概念指南請參閱[排程工作](/zh-TW/automation/cron-jobs)。
</Tip>

## 快速建立工作

`openclaw cron create` 是 `openclaw cron add` 的別名。建立新工作時，先放排程，再放提示詞：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

當工作應該 POST 完成後的承載資料，而不是傳送到聊天目標時，請使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

對於應在 OpenClaw 排程內執行、且不啟動隔離代理程式/模型執行的決定性 shell 風格工作，請使用 `--command`：

<Note>
命令排程工作是由管理員撰寫的閘道自動化。建立、編輯、
移除或手動執行它們需要 `operator.admin`；之後的排程執行
會在閘道程序中執行，而不是作為代理程式的 `tools.exec` 工具呼叫。
`tools.exec.*` 和 exec 核准仍會控管模型可見的 exec 工具。
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可精確執行 argv。命令工作會擷取 stdout/stderr、記錄一般排程歷史，並透過與隔離工作相同的 `announce`、`webhook` 或 `none` 傳遞模式路由輸出。只印出 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段金鑰">
    - `main` 綁定到代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的文字記錄和工作階段 ID。
    - `current` 綁定到建立時的作用中工作階段。
    - `session:<id>` 釘選到明確的持久工作階段金鑰。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話脈絡。頻道和群組路由、傳送/佇列政策、提升權限、來源，以及 ACP 執行階段綁定都會為新執行重設。安全偏好設定和使用者明確選取的模型或驗證覆寫可以跨執行保留。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要工作階段或目前工作階段解析，或會封閉失敗。

帶有供應商前綴的目標可以消除未解析公告頻道的歧義。例如，當省略 `delivery.channel` 或其值為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛公告的前綴才是供應商選擇器。如果 `delivery.channel` 已明確指定，前綴必須符合該頻道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。`imessage:` 和 `sms:` 等服務前綴仍是由頻道擁有的目標語法。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 傳遞。使用 `--no-deliver` 可讓輸出保留在內部。`--deliver` 仍作為 `--announce` 的已棄用別名。
</Note>

### 傳遞擁有權

隔離排程聊天傳遞由代理程式和執行器共同負責：

- 當聊天路由可用時，代理程式可以使用 `message` 工具直接傳送。
- `announce` 只有在代理程式未直接傳送到解析後目標時，才會後援傳遞最終回覆。
- `webhook` 會將完成後的承載資料張貼到 URL。
- `none` 會停用執行器後援傳遞。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子傳遞。不要將 `--webhook` 與 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天傳遞旗標合併使用。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消設定個別傳遞路由欄位（每個都不可與其對應的設定旗標合併使用）。不同於只停用執行器後援傳遞的 `--no-deliver`，這些選項會移除已儲存欄位，讓工作再次從預設值解析該部分路由。

`--announce` 是最終回覆的執行器後援傳遞。`--no-deliver` 會停用該後援，但當聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，以供後援公告傳遞使用。內部工作階段金鑰可能是小寫；不要將它們作為 Matrix 房間 ID 等區分大小寫供應商 ID 的真實來源。

### 失敗傳遞

失敗通知會依下列順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（未設定明確失敗目的地時）。

<Note>
主要工作階段工作只有在主要傳遞模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離工作則接受所有模式。
</Note>

注意：隔離排程執行會將執行層級的代理程式失敗視為工作錯誤，即使
未產生回覆承載資料亦然，因此模型/供應商失敗仍會增加錯誤
計數器並觸發失敗通知。

命令排程工作不會啟動隔離代理程式回合。結束碼為零會記錄為
`ok`；非零結束、訊號、逾時或無輸出逾時會記錄為 `error`，並且
可以觸發相同的失敗通知路徑。

如果隔離執行在第一個模型請求前逾時，`openclaw cron show`
和 `openclaw cron runs` 會包含階段特定錯誤，例如
`setup timed out before runner start` 或
`stalled before first model call (last phase: context-engine)`。
對於由命令列介面支援的供應商，模型前看門狗會保持作用中，直到外部
命令列介面回合開始，因此工作階段查詢、hook、驗證、提示詞和命令列介面設定停滯
都會回報為模型前排程失敗。

## 排程

### 一次性工作

`--at <datetime>` 會排程一次性執行。沒有偏移量的日期時間會視為 UTC，除非你同時傳入 `--tz <iana>`，這會以指定時區解讀牆鐘時間。

<Note>
一次性工作預設會在成功後刪除。使用 `--keep-after-run` 可保留它們。
</Note>

### 週期性工作

週期性工作會在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以讓失敗警示選擇加入重複略過執行通知。

對於以本機設定模型供應商為目標的隔離工作，排程會在啟動代理程式回合前執行輕量供應商預檢。Loopback、私人網路和 `.local` 的 `api: "ollama"` 供應商會在 `/api/tags` 探測；本機 OpenAI 相容供應商，例如 vLLM、SGLang 和 LM Studio，會在 `/models` 探測。如果端點無法連線，該執行會記錄為 `skipped`，並在之後的排程重試；相符的無回應端點會快取 5 分鐘，以避免許多工作大量撞擊同一個本機伺服器。

注意：排程工作、待處理執行階段狀態和執行歷史位於共用 SQLite 狀態資料庫中。舊版 `jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案會匯入一次，並重新命名加上 `.migrated` 後綴。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不是編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用傳回的 `runId` 檢查之後的結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

當腳本應封鎖直到該確切排入佇列的執行記錄終端狀態時，加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，接著輪詢 `cron.runs` 以取得傳回的 `runId`。只有當執行以 `ok` 狀態完成時，命令才會以 `0` 結束。當執行以 `error` 或 `skipped` 完成、閘道回應不包含 `runId`，或 `--wait-timeout` 到期時，會以非零結束。`--poll-interval` 必須大於零。

<Note>
當你希望手動命令只在工作目前到期時才執行，請使用 `--due`。如果 `--due --wait` 未排入執行，命令會返回一般非執行回應，而不是輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許的模型。`cron add|edit --fallbacks <list>` 會設定每個工作的後援模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可進行沒有後援的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除每個工作的後援覆寫。`cron edit <job-id> --clear-model` 會移除每個工作的模型覆寫，讓工作遵循一般排程模型選取優先順序（如果存在已儲存的排程工作階段覆寫則使用它，否則使用代理程式/預設模型）；它不可與 `--model` 合併使用。`cron add|edit --thinking <level>` 會設定每個工作的思考覆寫；`cron edit <job-id> --clear-thinking` 會移除它，讓工作遵循一般排程思考優先順序，且它不可與 `--thinking` 合併使用。

<Warning>
如果模型不被允許或無法解析，排程會以明確的驗證錯誤讓執行失敗，而不是後援到工作的代理程式或預設模型選取。
</Warning>

排程 `--model` 是**工作主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的工作模型失敗時，已設定的模型後援仍會套用。
- 存在每個工作的承載資料 `fallbacks` 時，會取代已設定的後援清單。
- 空的每工作後援清單（工作承載資料/API 中的 `--fallbacks ""` 或 `fallbacks: []`）會讓排程執行變為嚴格模式。
- 當工作有 `--model` 但未設定後援清單時，OpenClaw 會傳入明確的空後援覆寫，因此代理程式主要模型不會作為隱藏重試目標附加。
- 本機供應商預檢會遍歷已設定的後援，然後才將排程執行標記為 `skipped`。

`openclaw doctor` 會回報已設定 `payload.model` 的工作，包括供應商命名空間計數，以及與 `agents.defaults.model` 的不一致。當驗證、供應商或計費行為在即時聊天與排程工作之間看起來不同時，請使用該檢查。

### 隔離排程模型優先順序

隔離排程會依下列順序解析作用中模型：

1. Gmail-hook 覆寫。
2. 每工作 `--model`。
3. 已儲存的排程工作階段模型覆寫（當使用者已選取一個時）。
4. 代理程式或預設模型選取。

### 快速模式

隔離排程快速模式會遵循解析後的即時模型選取。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍會優先於設定。當解析後模式為 `auto` 時，截止時間會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，排程會在重試前，為作用中執行持久化切換後的供應商和模型（以及存在時切換後的驗證設定檔覆寫）。外層重試迴圈限制為初始嘗試後兩次切換重試，之後會中止而不是永遠循環。

## 執行輸出和拒絕

### 過時確認抑制

隔離排程回合會抑制過時的僅確認回覆。如果第一個結果只是中途狀態更新，且沒有後代子代理程式執行負責最終答案，排程會在傳遞前重新提示一次以取得真實結果。

### 靜默權杖抑制

如果隔離的排程執行只回傳靜默權杖（`NO_REPLY` 或 `no_reply`），排程會同時抑制直接對外傳遞和後援佇列摘要路徑，因此不會有任何內容發回聊天。

### 結構化拒絕

隔離的排程執行會使用嵌入式執行的結構化執行拒絕中繼資料，作為權威的拒絕訊號。當巢狀結構化錯誤訊息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭時，它們也會遵循節點主機的 `UNAVAILABLE` 包裝。

除非嵌入式執行也提供結構化拒絕中繼資料，否則排程不會把最終輸出文字或看似核准拒絕的片語分類為拒絕，因此一般助理文字不會被視為遭封鎖的命令。

`cron list` 和執行歷史會顯示拒絕原因，而不是將遭封鎖的命令回報為 `ok`。

## 保留

保留和修剪由設定控制：

- `cron.sessionRetention`（預設 `24h`）會修剪已完成的隔離執行工作階段。
- `cron.runLog.keepLines` 會依工作修剪保留的 SQLite 執行歷史列。`cron.runLog.maxBytes` 仍會被接受，以相容較舊的檔案式執行記錄。

## 遷移較舊的工作

<Note>
如果你有目前傳遞與儲存格式之前的排程工作，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、承載資料 `provider` 傳遞別名），並將 `notify: true` 網路鉤子後援工作從 `cron.webhook` 遷移為明確的網路鉤子傳遞。已經公告到聊天的工作會保留該傳遞，並取得完成網路鉤子目的地。當 `cron.webhook` 未設定時，對於沒有遷移目標的工作，惰性的頂層 `notify` 標記會被移除（現有傳遞會保持不變），因此 `doctor --fix` 不會再持續對它們重新警告。
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
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 只套用於隔離的代理程式回合工作。對於排程執行，輕量模式會讓啟動上下文保持空白，而不是注入完整的工作區啟動集合。

建立具有精確 argv、cwd、env、stdin 和輸出限制的命令工作：

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

`openclaw cron list` 預設會顯示所有符合條件的工作。傳入 `--agent <id>` 只顯示有效正規化代理程式 ID 相符的工作；沒有儲存代理程式 ID 的工作會被視為已設定的預設代理程式。

`openclaw cron get <job-id>` 會直接回傳已儲存的工作 JSON。當你想要包含傳遞路由預覽的人類可讀檢視時，請使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 會在每個工作上包含頂層 `status` 欄位，該欄位由 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 計算而來。值為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。這會對應人類可讀狀態欄，讓外部工具不必重新推導即可讀取工作狀態。

`cron runs` 項目包含傳遞診斷資訊，包括預期的排程目標、解析後的目標、訊息工具傳送、後援使用情形，以及已傳遞狀態。

代理程式與工作階段重新指定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

當代理程式回合工作省略 `--agent` 時，`openclaw cron add` 會發出警告，並退回到預設代理程式（`main`）。在建立時傳入 `--agent <id>` 可固定到特定代理程式。

傳遞微調：

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
