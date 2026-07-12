---
read_when:
    - 你需要排程工作與喚醒功能
    - 你正在偵錯排程執行與日誌
summary: '`openclaw cron` 的命令列介面參考（排程並執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-11T21:11:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程工作。

<Tip>
執行 `openclaw cron --help` 以查看完整命令介面。概念指南請參閱[排程工作](/zh-TW/automation/cron-jobs)。
</Tip>

<Note>
所有排程異動（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令酬載的執行會直接在閘道程序中進行，而不是作為代理程式的 `tools.exec` 工具呼叫；模型可見的執行工具仍受 `tools.exec.*` 與執行核准機制管控。
</Note>

## 快速建立工作

`openclaw cron create` 是 `openclaw cron add` 的別名。建立新工作時，請先指定排程，再指定提示詞：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

當工作應以 POST 傳送完成的酬載，而非傳送至聊天目標時，請使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

對於在 OpenClaw 排程內執行、且不啟動隔離代理程式／模型執行的確定性 shell 風格工作，請使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。若要精確執行 argv，請使用 `--command-argv '["node","scripts/report.mjs"]'`。命令工作會擷取 stdout/stderr、記錄一般排程歷程，並透過與隔離工作相同的 `announce`、`webhook` 或 `none` 傳遞模式轉送輸出。只輸出 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段索引鍵">
    - `main` 綁定至代理程式的主要工作階段。
    - `isolated` 為每次執行建立全新的對話記錄與工作階段 ID。
    - `current` 綁定至建立時的作用中工作階段。
    - `session:<id>` 固定使用明確的持久工作階段索引鍵。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設周遭的對話情境。新執行會重設頻道與群組路由、傳送／佇列政策、權限提升、來源，以及 ACP 執行階段綁定。安全偏好設定，以及使用者明確選取的模型或驗證覆寫，可以延續至後續執行。
  </Accordion>
</AccordionGroup>

## 傳遞

`openclaw cron list` 與 `openclaw cron show <job-id>` 會預覽解析後的傳遞路由。對於 `channel: "last"`，預覽會顯示路由是從主要工作階段或目前工作階段解析而來，或將以封閉方式失敗。

帶有提供者前綴的目標可釐清尚未解析的公告頻道。例如，當省略 `delivery.channel` 或其值為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛所公布的前綴才是提供者選擇器。如果明確指定 `delivery.channel`，前綴就必須符合該頻道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會遭拒絕。`imessage:` 與 `sms:` 等服務前綴仍屬於頻道所擁有的目標語法。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 傳遞。使用 `--no-deliver` 可將輸出保留在內部。`--deliver` 仍作為 `--announce` 的已棄用別名。
</Note>

### 傳遞責任歸屬

隔離排程的聊天傳遞由代理程式與執行器共同負責：

- 有可用的聊天路由時，代理程式可以使用 `message` 工具直接傳送。
- 只有當代理程式未直接傳送至解析後的目標時，`announce` 才會以備援方式傳遞最終回覆。
- `webhook` 會將完成的酬載以 POST 傳送至 URL。
- `none` 會停用執行器的備援傳遞。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子傳遞。請勿將 `--webhook` 與 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天傳遞旗標併用。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 與 `--clear-account` 取消設定個別傳遞路由欄位（每個旗標與其對應的設定旗標併用時都會遭拒絕）。`--no-deliver` 只會停用執行器的備援傳遞；與其不同的是，這些旗標會移除已儲存的欄位，讓工作重新依預設值解析該部分路由。

`--announce` 是執行器對最終回覆的備援傳遞。`--no-deliver` 會停用該備援，但在有可用聊天路由時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天傳遞目標，以供備援公告傳遞使用。內部工作階段索引鍵可能使用小寫；請勿將其作為 Matrix 房間 ID 等區分大小寫之提供者 ID 的真實依據。

### 失敗傳遞

失敗通知會依下列順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（當上述兩者皆無法解析為具體目的地時）。

<Note>
主要工作階段的工作只有在主要傳遞模式為 `webhook` 時，才能使用 `delivery.failureDestination`。隔離工作在所有模式下都可使用。
</Note>

即使未產生回覆酬載，隔離排程執行仍會將執行層級的代理程式失敗視為工作錯誤，因此模型／提供者失敗仍會增加錯誤計數器並觸發失敗通知。

命令排程工作不會啟動隔離代理程式回合。結束碼為零時記錄為 `ok`；非零結束碼、訊號、逾時或無輸出逾時則記錄為 `error`，並可觸發相同的失敗通知路徑。

如果隔離執行在第一次模型請求之前逾時，`openclaw cron show` 與 `openclaw cron runs` 會包含特定階段的錯誤，例如 `setup timed out before runner start`，或指出最後已知啟動階段的停滯訊息（例如 `context-engine`）。對於以命令列介面為後端的提供者，模型前監控計時器會持續運作，直到外部命令列介面回合開始，因此工作階段查詢、掛鉤、驗證、提示詞與命令列介面設定的停滯，都會回報為模型前的排程失敗。

## 排程

### 單次工作

`--at <datetime>` 會安排單次執行。沒有時區偏移量的日期時間會視為 UTC，除非您同時傳入 `--tz <iana>`，此時會依指定時區解讀當地鐘面時間。

<Note>
單次工作預設會在成功後刪除。使用 `--keep-after-run` 可保留工作。
</Note>

### 週期性工作

週期性工作在連續發生錯誤後，會採用指數重試退避：30 秒、1 分鐘、5 分鐘、15 分鐘、60 分鐘。下次執行成功後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但可使用 `openclaw cron edit <job-id> --failure-alert-include-skipped`，讓失敗警示也包含重複的略過執行通知。

對於以本機已設定模型提供者為目標的隔離工作（基底 URL 位於 local loopback、私人網路或 `.local`），排程會在啟動代理程式回合之前執行輕量的提供者預檢：對 `api: "ollama"` 提供者探測 `/api/tags`；對其他與 OpenAI 相容的本機提供者（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）探測 `/models`。如果端點無法連線，該次執行會記錄為 `skipped`，並在後續排程中重試；每個端點的連線結果會快取 5 分鐘，避免多個使用相同本機伺服器的工作以重複探測造成負荷。

排程工作、待處理的執行階段狀態與執行歷程均存放在共用 SQLite 狀態資料庫中。舊版 `jobs.json`、`<name>-state.json` 與 `runs/*.jsonl` 檔案會匯入一次，並重新命名加上 `.migrated` 後綴。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不要編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即返回。成功回應包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 查詢後續結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

當指令碼應阻塞至該筆確切的佇列執行記錄終止狀態時，請加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，再以返回的 `runId` 輪詢 `cron.runs`。只有當執行以 `ok` 狀態完成時，命令才會以 `0` 結束。當執行以 `error` 或 `skipped` 完成、閘道回應不含 `runId`，或 `--wait-timeout` 到期時，命令會以非零值結束（預設為 `10m`，預設每 `2s` 輪詢一次）。`--poll-interval` 必須大於零。

<Note>
當您只想在工作目前已到期時才透過手動命令執行，請使用 `--due`。如果 `--due --wait` 未將執行排入佇列，命令會返回一般的未執行回應，而不會進行輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許使用的模型。`cron add|edit --fallbacks <list>` 會設定每個工作的備援模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可進行沒有備援的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除每個工作的備援覆寫。`cron edit <job-id> --clear-model` 會移除每個工作的模型覆寫，使工作遵循一般排程模型選擇優先順序（若有已儲存的排程工作階段覆寫則使用它，否則使用代理程式／預設模型）；此旗標不能與 `--model` 併用。`cron add|edit --thinking <level>` 會設定每個工作的思考覆寫；`cron edit <job-id> --clear-thinking` 會將其移除，使工作遵循一般排程思考優先順序，且不能與 `--thinking` 併用。

<Warning>
如果模型不受允許或無法解析，排程會以明確的驗證錯誤讓該次執行失敗，而不會退回使用工作的代理程式或預設模型選擇。
</Warning>

排程的 `--model` 是**工作主要模型**，不是聊天工作階段的 `/model` 覆寫。這表示：

- 選取的工作模型失敗時，已設定的模型備援仍會套用。
- 當每個工作的酬載存在 `fallbacks` 時，它會取代已設定的備援清單。
- 空的每個工作備援清單（`--fallbacks ""`，或工作酬載／API 中的 `fallbacks: []`）會使排程執行採用嚴格模式。
- 當工作有 `--model` 但未設定備援清單時，OpenClaw 會傳入明確的空白備援覆寫，以避免將代理程式主要模型附加為隱藏的重試目標。
- 在將排程執行標記為 `skipped` 之前，本機提供者預檢會依序檢查已設定的備援模型。

`openclaw doctor` 會回報已設定 `payload.model` 的工作，包括提供者命名空間計數，以及與 `agents.defaults.model` 不相符的項目。當即時聊天與排程工作的驗證、提供者或計費行為似乎不同時，請使用此檢查。

### 隔離排程模型優先順序

隔離排程會依下列順序解析作用中模型：

1. Gmail 掛鉤覆寫。
2. 每個工作的 `--model`。
3. 已儲存的排程工作階段模型覆寫（使用者選取時）。
4. 代理程式或預設模型選擇。

### 快速模式

隔離排程的快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但已儲存工作階段的 `fastMode` 覆寫仍優先於設定。當解析後的模式為 `auto` 時，臨界值會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，排程會在重試前，為作用中的執行保存切換後的提供者與模型（若存在，也會保存切換後的驗證設定檔覆寫）。外層重試迴圈最多只允許在初次嘗試後進行兩次切換重試，之後便會中止，而不會無限循環。

## 執行輸出與拒絕

### 過期確認回覆抑制

隔離排程回合會抑制過期且僅含確認的回覆。如果第一個結果只是暫時的狀態更新，且沒有任何後代子代理程式執行負責最終答案，排程會重新提示一次以取得實際結果，再進行傳遞。

### 靜默權杖抑制

如果隔離的排程執行只傳回靜默權杖（`NO_REPLY` 或 `no_reply`），排程會同時抑制直接對外傳送與備援的佇列摘要路徑，因此不會有任何內容回傳至聊天。

### 結構化拒絕

隔離的排程執行會使用內嵌執行所提供的結構化執行拒絕中繼資料（代碼為 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命執行工具錯誤）作為權威拒絕訊號。它們也會辨識節點主機的 `UNAVAILABLE` 包裝錯誤，前提是其中巢狀的結構化錯誤帶有上述任一代碼。

除非內嵌執行也提供結構化拒絕中繼資料，否則排程不會將最終輸出的文字或看似要求核准的拒絕措辭分類為拒絕，因此一般的助理文字不會被視為遭封鎖的命令。

`cron list` 和執行歷史記錄會顯示拒絕原因，而不會將遭封鎖的命令回報為 `ok`。

## 保留

保留與修剪由設定控制：

- `cron.sessionRetention`（預設為 `24h`，設為 `false` 可停用）會修剪已完成之隔離執行的工作階段。
- `cron.runLog.keepLines`（預設為 `2000`）會依各工作修剪保留在 SQLite 中的執行歷史記錄列。為了與舊版檔案式執行記錄相容，仍接受 `cron.runLog.maxBytes`（預設為 `2000000`）；SQLite 修剪以列數為基準。

## 遷移舊版工作

<Note>
如果你的排程工作建立於目前的傳送與儲存格式推出之前，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、頂層傳送欄位，包括舊版 `threadId`，以及承載資料中的 `provider` 傳送別名），並將使用 `notify: true` 的網路鉤子備援工作從 `cron.webhook` 遷移為明確的網路鉤子傳送。已向聊天發布通知的工作會保留該傳送方式，並新增完成時的網路鉤子目的地。當未設定 `cron.webhook` 時，對於沒有遷移目標的工作，系統會移除無作用的頂層 `notify` 標記（既有傳送設定會原封不動地保留），因此 `doctor --fix` 不會再持續對它們發出警告。
</Note>

## 常見編輯

在不變更訊息的情況下更新傳送設定：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

停用隔離工作的傳送：

```bash
openclaw cron edit <job-id> --no-deliver
```

為隔離工作啟用輕量啟動內容：

```bash
openclaw cron edit <job-id> --light-context
```

向特定頻道發布通知：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

向 Telegram 論壇主題發布通知：

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

`--light-context` 僅適用於隔離的代理程式回合工作。對於排程執行，輕量模式會讓啟動內容保持空白，而不會注入完整的工作區啟動集合。

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

`openclaw cron list` 預設會顯示所有相符的工作。傳入 `--agent <id>` 可只顯示有效正規化代理程式 ID 相符的工作；未儲存代理程式 ID 的工作會視為屬於已設定的預設代理程式。

`openclaw cron get <job-id>` 會直接傳回已儲存的工作 JSON。若要查看包含傳送路由預覽的易讀檢視，請使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 會在每個工作的頂層包含一個 `status` 欄位，此欄位根據 `enabled`、`state.runningAtMs` 與 `state.lastRunStatus` 計算。值可為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 狀態會保持標準且不加修飾，讓外部工具無須重新推導即可讀取工作狀態；易讀輸出則可能以失敗次數修飾重複出現的 `error` 狀態。

`cron runs` 項目包含傳送診斷資訊，其中有預定的排程目標、解析後的目標、訊息工具傳送、備援使用情況與已傳送狀態。

重新指定代理程式與工作階段：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

若代理程式回合工作未指定 `--agent`，`openclaw cron add` 會發出警告，並改用預設代理程式（`main`）。建立時傳入 `--agent <id>`，即可固定使用特定代理程式。

傳送微調：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [排程任務](/zh-TW/automation/cron-jobs)
