---
read_when:
    - 你想要排程工作和喚醒功能
    - 你正在偵錯排程執行與日誌
summary: '`openclaw cron` 的命令列介面參考（排程及執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-19T13:41:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0e6e56a465700eb42c1f0c0c7d5af9dddb390cd48c1f44c471d08b6a8c2c4c6a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程工作。

<Tip>
執行 `openclaw cron --help` 以查看完整的命令介面。概念指南請參閱[排程工作](/zh-TW/automation/cron-jobs)。
</Tip>

<Note>
所有排程變更（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令酬載執行會直接在閘道程序中進行，而不是作為代理程式的 `tools.exec` 工具呼叫；`tools.exec.*` 和執行核准仍會管控模型可見的執行工具。
</Note>

## 快速建立工作

`openclaw cron create` 是 `openclaw cron add` 的別名。建立新工作時，先放排程，再放提示詞：

```bash
openclaw cron create "0 7 * * *" \
  "摘要整理夜間更新。" \
  --name "晨間簡報" \
  --agent ops
```

若工作應以 POST 傳送完成的酬載，而不是遞送至聊天目標，請使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "以 JSON 摘要整理今天的部署。" \
  --name "部署摘要" \
  --webhook "https://example.invalid/openclaw/cron"
```

對於在 OpenClaw 排程中執行、但不啟動隔離代理程式／模型執行的確定性 Shell 風格工作，請使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "佇列深度探測" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。若要精確執行 argv，請使用 `--command-argv '["node","scripts/report.mjs"]'`。命令工作會擷取 stdout/stderr、記錄一般排程歷程，並透過與隔離工作相同的 `announce`、`webhook` 或 `none` 遞送模式路由輸出。僅輸出 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段金鑰">
    - `main` 會繫結至代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的逐字記錄和工作階段 ID。
    - `current` 會繫結至建立時的作用中工作階段。
    - `session:<id>` 會固定至明確的持久工作階段金鑰。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設環境對話內容。新執行會重設頻道和群組路由、傳送／佇列原則、權限提升、來源及 ACP 執行階段繫結。安全的偏好設定，以及使用者明確選取的模型或驗證覆寫可跨執行保留。
  </Accordion>
</AccordionGroup>

## 遞送

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的遞送路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前的工作階段解析，或將以關閉方式失敗。

帶有提供者前綴的目標可消除未解析公告頻道的歧義。例如，當省略 `delivery.channel` 或其為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛公告的前綴才是提供者選擇器。若明確指定 `delivery.channel`，前綴必須與該頻道相符；搭配 `to: "telegram:123"` 的 `channel: "whatsapp"` 會遭拒絕。`imessage:` 和 `sms:` 等服務前綴仍是頻道所擁有的目標語法。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 遞送。使用 `--no-deliver` 可將輸出保留在內部。`--deliver` 仍保留作為 `--announce` 的已淘汰別名。
</Note>

### 遞送所有權

隔離排程的聊天遞送由代理程式與執行器共同負責：

- 當聊天路由可用時，代理程式可以使用 `message` 工具直接傳送。
- 只有當代理程式未直接傳送至解析後的目標時，`announce` 才會以備援方式遞送最終回覆。
- `webhook` 會將完成的酬載傳送至 URL。
- `none` 會停用執行器備援遞送。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子遞送。請勿將 `--webhook` 與 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天遞送旗標合併使用。

`cron edit <job-id>` 可使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消設定個別的遞送路由欄位（每個選項與對應的設定旗標合併使用時都會遭拒絕）。這些選項與僅停用執行器備援遞送的 `--no-deliver` 不同；它們會移除已儲存的欄位，讓工作重新從預設值解析路由的該部分。

`--announce` 是最終回覆的執行器備援遞送。`--no-deliver` 會停用該備援，但當聊天路由可用時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒會保留即時聊天遞送目標，以供備援公告遞送使用。內部工作階段金鑰可能是小寫；請勿將其作為區分大小寫之提供者 ID（例如 Matrix 房間 ID）的正確依據。

### 失敗遞送

失敗通知會依下列順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（上述兩者都無法解析為具體目的地時）。

<Note>
只有當主要遞送模式為 `webhook` 時，主要工作階段工作才能使用 `delivery.failureDestination`。隔離工作在所有模式下都接受該設定。
</Note>

即使未產生回覆酬載，隔離排程執行仍會將執行層級的代理程式失敗視為工作錯誤，因此模型／提供者失敗仍會增加錯誤計數器並觸發失敗通知。

命令排程工作不會啟動隔離代理程式回合。結束代碼為零時會記錄 `ok`；非零結束代碼、訊號、逾時或無輸出逾時會記錄 `error`，並可觸發相同的失敗通知路徑。

若隔離執行在第一次模型請求前逾時，`openclaw cron show` 和 `openclaw cron runs` 會包含特定階段的錯誤，例如 `setup timed out before runner start`，或指出最後已知啟動階段的停滯訊息（例如 `context-engine`）。對於命令列介面支援的提供者，模型前監看程式會持續運作，直到外部命令列介面回合開始，因此工作階段查詢、掛鉤、驗證、提示詞和命令列介面設定停滯都會回報為模型前排程失敗。

## 排程

### 單次工作

`--at <datetime>` 會排程單次執行。除非同時傳入 `--tz <iana>`，否則不含偏移量的日期時間會視為 UTC；傳入後，會使用指定時區解讀當地時鐘時間。

<Note>
單次工作預設會在成功後刪除。使用 `--keep-after-run` 可予以保留。
</Note>

### 週期性工作

週期性工作在連續發生錯誤後會採用指數重試退避：30 秒、1 分鐘、5 分鐘、15 分鐘、60 分鐘。下一次執行成功後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可讓失敗警示包含重複的略過執行通知。

對於以本機已設定模型提供者為目標的隔離工作（基底 URL 位於回送介面、私人網路或 `.local`），排程會在啟動代理程式回合前執行輕量的提供者預檢：在 `/api/tags` 探測 `api: "ollama"` 提供者；在 `/models` 探測其他本機 OpenAI 相容提供者（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）。若端點無法連線，該次執行會記錄為 `skipped`，並在之後的排程重試；每個端點的連線結果會快取 5 分鐘，避免許多使用相同本機伺服器的工作以重複探測對其造成負擔。

排程工作、待處理的執行階段狀態和執行歷程都位於共用 SQLite 狀態資料庫中。舊版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 檔案會匯入一次，並加上 `.migrated` 後綴重新命名。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不要編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即傳回。成功的回應會包含 `{ ok: true, enqueued: true, runId }`。使用傳回的 `runId` 檢查後續結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

若指令碼應阻塞至該次特定佇列執行記錄終止狀態，請加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，再針對傳回的 `runId` 輪詢 `cron.runs`。只有當執行以 `ok` 狀態完成時，命令才會以 `0` 結束。當執行以 `error` 或 `skipped` 完成、閘道回應未包含 `runId`，或 `--wait-timeout` 到期（預設為 `10m`，預設每 `2s` 輪詢一次）時，命令會以非零代碼結束。`--poll-interval` 必須大於零。

<Note>
若只想在工作目前已到期時執行手動命令，請使用 `--due`。如果 `--due --wait` 未將執行排入佇列，命令會傳回一般的未執行回應，而不進行輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許的模型。`cron add|edit --fallbacks <list>` 會設定每項工作的備援模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可進行沒有備援的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除每項工作的備援覆寫。`cron edit <job-id> --clear-model` 會移除每項工作的模型覆寫，讓工作遵循一般排程模型選取優先順序（若存在已儲存的排程工作階段覆寫，則使用該覆寫；否則使用代理程式／預設模型）；它不能與 `--model` 合併使用。`cron add|edit --thinking <level>` 會設定每項工作的思考覆寫；`cron edit <job-id> --clear-thinking` 會將其移除，讓工作遵循一般排程思考優先順序，且不能與 `--thinking` 合併使用。

<Warning>
如果模型不被允許或無法解析，排程會以明確的驗證錯誤使執行失敗，而不會退回工作的代理程式或預設模型選取。
</Warning>

排程 `--model` 是**工作主要模型**，不是聊天工作階段的 `/model` 覆寫。這表示：

- 選取的工作模型失敗時，已設定的模型備援仍會套用。
- 若存在每項工作的酬載 `fallbacks`，它會取代已設定的備援清單。
- 空白的每項工作備援清單（工作酬載／API 中的 `--fallbacks ""` 或 `fallbacks: []`）會使排程執行採用嚴格模式。
- 當工作具有 `--model` 但未設定備援清單時，OpenClaw 會傳入明確的空白備援覆寫，避免將代理程式主要模型附加為隱藏的重試目標。
- 本機提供者預檢會逐一檢查已設定的備援，之後才將排程執行標記為 `skipped`。

`openclaw doctor` 會回報已設定 `payload.model` 的工作，包括提供者命名空間計數，以及與 `agents.defaults.model` 的不相符情況。當即時聊天與排程工作之間的驗證、提供者或計費行為看起來不同時，請使用該檢查。

### 隔離排程模型優先順序

隔離排程會依下列順序解析作用中模型：

1. Gmail 掛鉤覆寫。
2. 每項工作的 `--model`。
3. 已儲存的排程工作階段模型覆寫（使用者已選取時）。
4. 代理程式或預設模型選取。

### 快速模式

隔離排程快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但儲存的工作階段 `fastMode` 覆寫仍優先於設定。當解析後的模式為 `auto` 時，截止時間會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，排程會在重試前，針對目前執行保存已切換的提供者與模型（若有，也會保存已切換的驗證設定檔覆寫）。外層重試迴圈在初次嘗試後最多允許兩次切換重試，之後便會中止，而不會無限循環。

## 執行輸出與拒絕

### 過時確認回覆抑制

隔離排程回合會抑制僅含過時確認內容的回覆。如果第一個結果只是暫時狀態更新，且最終答案不由任何後代子代理程式執行負責，排程會在傳送前重新提示一次，以取得實際結果。

### 靜默權杖抑制

如果隔離排程執行僅傳回靜默權杖（`NO_REPLY` 或 `no_reply`），排程會同時抑制直接向外傳送與備援佇列摘要路徑，因此不會將任何內容發回聊天。

### 結構化拒絕

隔離排程執行會使用內嵌執行中的結構化執行拒絕中繼資料（代碼為 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命執行工具錯誤）作為具權威性的拒絕訊號。它們也會接受節點主機的 `UNAVAILABLE` 包裝，其中包覆帶有其中一個代碼的巢狀結構化錯誤。

除非內嵌執行也提供結構化拒絕中繼資料，否則排程不會將最終輸出文字或看似要求核准的拒絕語句分類為拒絕，因此一般助理文字不會被視為遭封鎖的命令。

`cron list` 與執行歷程會顯示拒絕原因，而不會將遭封鎖的命令回報為 `ok`。

## 保留

保留行為：

- `cron.sessionRetention`（預設為 `24h`，或設為 `false` 以停用）會清除已完成的隔離執行工作階段。
- 執行歷程會為每個排程工作保留最新的 2000 筆終止狀態資料列。遺失的資料列仍採用標準的 24 小時遺失工作清理時限。

## 遷移舊版工作

<Note>
如果你的排程工作建立於目前的傳送與儲存格式推出之前，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、頂層傳送欄位，包括舊版 `threadId`，以及承載資料的 `provider` 傳送別名），並在移除該設定鍵之前，將 `notify: true` 網路鉤子備援工作從已淘汰的原始 `cron.webhook` 值遷移為明確的網路鉤子傳送。已向聊天公告的工作會保留該傳送方式，並取得完成時使用的網路鉤子目的地。如果沒有舊版網路鉤子，對於沒有遷移目標的工作，將移除無作用的頂層 `notify` 標記（現有傳送方式會原樣保留），因此 `doctor --fix` 不再持續對這些工作發出警告。
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

公告至特定頻道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

公告至 Telegram 論壇主題：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

建立使用輕量啟動內容的隔離工作：

```bash
openclaw cron create "0 7 * * *" \
  "摘要整理夜間更新。" \
  --name "輕量晨間簡報" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 僅適用於隔離的代理程式回合工作。對於排程執行，輕量模式會讓啟動內容保持空白，而不會注入完整的工作區啟動集合。

建立包含確切 argv、cwd、env、stdin 與輸出限制的命令工作：

```bash
openclaw cron create "*/30 * * * *" \
  --name "部位匯出" \
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

`openclaw cron list` 預設會顯示所有相符的工作。傳入 `--agent <id>`，即可只顯示有效正規化代理程式 ID 相符的工作；未儲存代理程式 ID 的工作會視為使用已設定的預設代理程式。

`openclaw cron get <job-id>` 會直接傳回已儲存工作的 JSON。若要取得包含傳送路由預覽的易讀檢視，請使用 `cron show <job-id>`。

`cron list --json` 與 `cron show <job-id> --json` 會在每個工作中包含頂層 `status` 欄位，此欄位根據 `enabled`、`state.runningAtMs` 與 `state.lastRunStatus` 計算。值可為：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 狀態會維持標準格式且不加修飾，讓外部工具無須重新推導即可讀取工作狀態；人類可讀輸出則可能為重複的 `error` 狀態加上失敗次數。

`cron runs` 項目會包含傳送診斷資訊，其中包括預定的排程目標、解析後的目標、訊息工具傳送、是否使用備援，以及已傳送狀態。

重新指定代理程式與工作階段：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

在代理程式回合工作中省略 `--agent` 時，`openclaw cron add` 會發出警告，並改用預設代理程式（`main`）。建立時傳入 `--agent <id>`，即可固定使用特定代理程式。

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
- [排程工作](/zh-TW/automation/cron-jobs)
