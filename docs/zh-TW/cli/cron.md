---
read_when:
    - 你想要排程作業與喚醒
    - 你正在偵錯排程執行與日誌
summary: '`openclaw cron` 的命令列介面參考（排程並執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-05T11:07:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c759d15a6abac04ccb5de852a14a4a985895886b6dbc29717ede7e83f9dcb75a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程作業。

<Tip>
執行 `openclaw cron --help` 查看完整命令介面。概念指南請參閱[排程作業](/zh-TW/automation/cron-jobs)。
</Tip>

<Note>
所有排程變更（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令承載執行會直接在閘道程序中執行，而不是作為代理的 `tools.exec` 工具呼叫；`tools.exec.*` 和 exec 核准仍會控管模型可見的 exec 工具。
</Note>

## 快速建立作業

`openclaw cron create` 是 `openclaw cron add` 的別名。對於新作業，請先放排程，再放提示：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

當作業應該 POST 完成的承載，而不是傳送到聊天目標時，使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

使用 `--command` 建立確定性的 shell 風格作業，這類作業會在 OpenClaw 排程中執行，而不會啟動隔離的代理/模型執行：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可進行精確的 argv 執行。命令作業會擷取 stdout/stderr、記錄一般排程歷史，並透過與隔離作業相同的 `announce`、`webhook` 或 `none` 傳送模式路由輸出。只列印 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段鍵">
    - `main` 綁定到代理的主要工作階段。
    - `isolated` 會為每次執行建立新的記錄和工作階段 ID。
    - `current` 綁定到建立時的作用中工作階段。
    - `session:<id>` 釘選到明確的持久工作階段鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話情境。通道和群組路由、傳送/佇列政策、提權、來源，以及 ACP 執行階段綁定都會為新執行重設。安全偏好和明確由使用者選取的模型或驗證覆寫可以跨執行沿用。
  </Accordion>
</AccordionGroup>

## 傳送

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳送路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析，或會封閉失敗。

帶有提供者前綴的目標可以釐清未解析的 announce 通道。例如，當省略 `delivery.channel` 或其為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，前綴必須符合該通道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕。`imessage:` 和 `sms:` 等服務前綴仍保留為通道擁有的目標語法。

<Note>
隔離的 `cron add` 作業預設使用 `--announce` 傳送。使用 `--no-deliver` 可讓輸出保留在內部。`--deliver` 仍保留為 `--announce` 的已棄用別名。
</Note>

### 傳送所有權

隔離排程聊天傳送由代理和執行器共同負責：

- 當聊天路由可用時，代理可以使用 `message` 工具直接傳送。
- 只有在代理未直接傳送到解析後的目標時，`announce` 才會後備傳送最終回覆。
- `webhook` 會將完成的承載發布到 URL。
- `none` 會停用執行器後備傳送。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子傳送。請勿將 `--webhook` 與聊天傳送旗標結合使用，例如 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account`。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消設定個別傳送路由欄位（各自與其對應的設定旗標結合時會被拒絕）。不同於只會停用執行器後備傳送的 `--no-deliver`，這些旗標會移除已儲存欄位，讓作業再次從預設值解析該部分路由。

`--announce` 是最終回覆的執行器後備傳送。`--no-deliver` 會停用該後備，但當聊天路由可用時，不會移除代理的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳送目標，以供後備 announce 傳送使用。內部工作階段鍵可能是小寫；請勿將它們作為大小寫敏感提供者 ID（例如 Matrix 房間 ID）的真實來源。

### 失敗傳送

失敗通知會依此順序解析：

1. 作業上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 作業的主要 announce 目標（當上述兩者都未解析為具體目的地時）。

<Note>
主要工作階段作業只有在主要傳送模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離作業在所有模式中都接受它。
</Note>

隔離排程執行會將執行層級的代理失敗視為作業錯誤，即使未產生回覆承載也一樣，因此模型/提供者失敗仍會增加錯誤計數器並觸發失敗通知。

命令排程作業不會啟動隔離代理回合。零結束碼會記錄 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄 `error`，並可觸發相同的失敗通知路徑。

如果隔離執行在第一個模型請求之前逾時，`openclaw cron show` 和 `openclaw cron runs` 會包含階段特定錯誤，例如 `setup timed out before runner start`，或命名最後已知啟動階段的停滯訊息（例如 `context-engine`）。對於命令列介面支援的提供者，模型前監看器會保持作用中，直到外部命令列介面回合開始，因此工作階段查詢、鉤子、驗證、提示和命令列介面設定停滯都會回報為模型前排程失敗。

## 排程

### 一次性作業

`--at <datetime>` 會排定一次性執行。沒有偏移量的日期時間會視為 UTC，除非你也傳入 `--tz <iana>`，這會以指定時區解讀牆上時鐘時間。

<Note>
一次性作業預設會在成功後刪除。使用 `--keep-after-run` 可保留它們。
</Note>

### 重複作業

重複作業在連續錯誤後使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以選擇讓失敗警示包含重複略過執行通知。

對於以本機已設定模型提供者為目標的隔離作業（base URL 位於 loopback、私有網路或 `.local`），排程會在啟動代理回合前執行輕量提供者預檢：`api: "ollama"` 提供者會在 `/api/tags` 探測；其他本機 OpenAI 相容提供者（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）會在 `/models` 探測。如果端點無法連線，執行會記錄為 `skipped`，並在稍後排程重試；可達性結果會按端點快取 5 分鐘，因此針對同一本機伺服器的大量作業不會以重複探測轟炸它。

排程作業、待處理執行階段狀態和執行歷史都位於共享 SQLite 狀態資料庫中。舊版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 檔案會匯入一次，並以 `.migrated` 後綴重新命名。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不是編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 檢查稍後的結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

當腳本應該封鎖直到該確切佇列執行記錄終端狀態時，加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，然後針對返回的 `runId` 輪詢 `cron.runs`。只有當執行以 `ok` 狀態完成時，命令才會以 `0` 結束。當執行以 `error` 或 `skipped` 完成、閘道回應不包含 `runId`，或 `--wait-timeout` 到期時（預設 `10m`，預設每 `2s` 輪詢一次），命令會以非零結束。`--poll-interval` 必須大於零。

<Note>
當你希望手動命令只有在作業目前到期時才執行，請使用 `--due`。如果 `--due --wait` 未排入執行，命令會返回一般非執行回應，而不是進行輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為作業選取允許的模型。`cron add|edit --fallbacks <list>` 會設定每個作業的後備模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可執行沒有後備的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除每個作業的後備覆寫。`cron edit <job-id> --clear-model` 會移除每個作業的模型覆寫，讓作業遵循一般排程模型選取優先順序（若存在，則為已儲存的排程工作階段覆寫，否則為代理/預設模型）；它不能與 `--model` 結合使用。`cron add|edit --thinking <level>` 會設定每個作業的思考覆寫；`cron edit <job-id> --clear-thinking` 會移除它，讓作業遵循一般排程思考優先順序，且它不能與 `--thinking` 結合使用。

<Warning>
如果模型不被允許或無法解析，排程會以明確的驗證錯誤讓執行失敗，而不是後備到作業的代理或預設模型選取。
</Warning>

排程 `--model` 是**作業主要模型**，不是聊天工作階段 `/model` 覆寫。這表示：

- 當選取的作業模型失敗時，已設定的模型後備仍會套用。
- 當存在每個作業承載 `fallbacks` 時，它會取代已設定的後備清單。
- 空的每個作業後備清單（作業承載/API 中的 `--fallbacks ""` 或 `fallbacks: []`）會讓排程執行變成嚴格模式。
- 當作業有 `--model` 但未設定後備清單時，OpenClaw 會傳入明確的空後備覆寫，讓代理主要模型不會被附加為隱藏的重試目標。
- 本機提供者預檢會先巡覽已設定的後備，再將排程執行標記為 `skipped`。

`openclaw doctor` 會回報已設定 `payload.model` 的作業，包括提供者命名空間計數，以及與 `agents.defaults.model` 的不一致。當驗證、提供者或計費行為在即時聊天和排程作業之間看起來不同時，請使用該檢查。

### 隔離排程模型優先順序

隔離排程會依此順序解析作用中模型：

1. Gmail 鉤子覆寫。
2. 每個作業 `--model`。
3. 已儲存的排程工作階段模型覆寫（當使用者選取了一個時）。
4. 代理或預設模型選取。

### 快速模式

隔離排程快速模式會遵循解析後的即時模型選取。模型設定 `params.fastMode` 預設會套用，但已儲存的工作階段 `fastMode` 覆寫仍優先於設定。當解析後的模式為 `auto` 時，截止值會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行拋出 `LiveSessionModelSwitchError`，排程會在重試前為作用中執行持久化切換後的提供者和模型（以及存在時的切換後驗證設定檔覆寫）。外部重試迴圈限制為初始嘗試後兩次切換重試，然後中止，而不是永遠迴圈。

## 執行輸出與拒絕

### 過期確認抑制

隔離排程回合會抑制過期的僅確認回覆。如果第一個結果只是暫時狀態更新，且沒有後代子代理執行負責最終答案，排程會在傳送前重新提示一次，以取得真正結果。

### 靜默權杖抑制

如果隔離的排程執行只回傳靜默權杖（`NO_REPLY` 或 `no_reply`），排程會同時抑制直接的對外傳遞與備援的佇列摘要路徑，因此不會有任何內容貼回聊天。

### 結構化拒絕

隔離的排程執行會使用來自嵌入式執行的結構化執行拒絕中繼資料（編碼為 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命 exec-tool 錯誤）作為權威拒絕訊號。它們也會遵循節點主機 `UNAVAILABLE` 包裝器，其內包住帶有這些代碼之一的巢狀結構化錯誤。

除非嵌入式執行也提供結構化拒絕中繼資料，否則排程不會將最終輸出文字或看似核准拒絕的片語分類為拒絕，因此一般助理文字不會被視為遭封鎖的命令。

`cron list` 與執行歷史會顯示拒絕原因，而不是將遭封鎖的命令回報為 `ok`。

## 保留

保留與剪除由設定控制：

- `cron.sessionRetention`（預設 `24h`，或設為 `false` 以停用）會剪除已完成的隔離執行工作階段。
- `cron.runLog.keepLines`（預設 `2000`）會依每個工作剪除保留的 SQLite 執行歷史資料列。`cron.runLog.maxBytes`（預設 `2000000`）仍為相容較舊檔案式執行記錄而接受；SQLite 剪除以資料列數為基準。

## 遷移較舊工作

<Note>
如果你有早於目前傳遞與儲存格式的排程工作，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、頂層傳遞欄位，包括舊版 `threadId`、payload `provider` 傳遞別名），並將 `notify: true` 網路鉤子備援工作從 `cron.webhook` 遷移到明確的網路鉤子傳遞。已經公告到聊天的工作會保留該傳遞，並取得完成網路鉤子目的地。當 `cron.webhook` 未設定時，沒有遷移目標的工作會移除無作用的頂層 `notify` 標記（既有傳遞會原樣保留），因此 `doctor --fix` 不再持續對它們重新警告。
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

為隔離工作啟用輕量啟動內容：

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

建立具有輕量啟動內容的隔離工作：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 只適用於隔離的代理程式回合工作。對於排程執行，輕量模式會讓啟動內容保持空白，而不是注入完整的工作區啟動集合。

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

## 常見管理員命令

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

`openclaw cron list` 預設會顯示所有相符工作。傳入 `--agent <id>` 可只顯示有效正規化代理程式 ID 相符的工作；沒有儲存代理程式 ID 的工作會計為設定的預設代理程式。

`openclaw cron get <job-id>` 會直接回傳儲存的工作 JSON。當你需要含有傳遞路由預覽的人類可讀檢視時，請使用 `cron show <job-id>`。

`cron list --json` 與 `cron show <job-id> --json` 會在每個工作上包含頂層 `status` 欄位，該欄位由 `enabled`、`state.runningAtMs` 與 `state.lastRunStatus` 計算而來。值為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。這會鏡像人類可讀狀態欄，讓外部工具可讀取工作狀態，而不必重新推導。

`cron runs` 項目包含傳遞診斷，內含預期的排程目標、解析後的目標、訊息工具傳送、備援使用情況與已傳遞狀態。

代理程式與工作階段重定目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 會在代理程式回合工作省略 `--agent` 時發出警告，並退回使用預設代理程式（`main`）。建立時傳入 `--agent <id>` 可釘選特定代理程式。

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
- [排程任務](/zh-TW/automation/cron-jobs)
