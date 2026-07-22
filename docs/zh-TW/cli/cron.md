---
read_when:
    - 你需要排程工作與喚醒功能
    - 你正在偵錯排程執行與記錄檔
summary: '`openclaw cron` 的命令列介面參考（排程並執行背景工作）'
title: 排程
x-i18n:
    generated_at: "2026-07-21T22:38:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0368a02283b0a3e107e6f41b71110d571e097461877ed6aea494614feaa092ca
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理閘道排程器的排程工作。

<Tip>
執行 `openclaw cron --help` 以查看完整的命令介面。概念指南請參閱[排程工作](/zh-TW/automation/cron-jobs)。
</Tip>

<Note>
所有排程變更操作（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令酬載執行會直接在閘道處理程序中進行，而不是作為代理程式的 `tools.exec` 工具呼叫；`tools.exec.*` 和執行核准仍會控管模型可見的執行工具。
</Note>

## 快速建立工作

`openclaw cron create` 是 `openclaw cron add` 的別名。建立新工作時，請先放排程，再放提示詞：

```bash
openclaw cron create "0 7 * * *" \
  "摘要整理夜間更新。" \
  --name "晨間簡報" \
  --agent ops
```

當工作應以 POST 傳送完成的酬載，而不是傳送至聊天目標時，請使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "以 JSON 摘要整理今天的部署。" \
  --name "部署摘要" \
  --webhook "https://example.invalid/openclaw/cron"
```

對於在 OpenClaw 排程中執行，且不啟動隔離代理程式／模型執行的確定性 Shell 風格工作，請使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "佇列深度探測" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。請使用 `--command-argv '["node","scripts/report.mjs"]'` 進行精確的 argv 執行。命令工作會擷取 stdout/stderr、記錄一般排程歷程，並透過與隔離工作相同的 `announce`、`webhook` 或 `none` 傳送模式路由輸出。僅輸出 `NO_REPLY` 的命令會被抑制。

## 工作階段

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="工作階段金鑰">
    - `main` 會繫結至代理程式的主要工作階段。
    - `isolated` 會為每次執行建立新的逐字稿和工作階段 ID。
    - `current` 會繫結至建立時的作用中工作階段。
    - `session:<id>` 會固定至明確的持久工作階段金鑰。

  </Accordion>
  <Accordion title="隔離工作階段語意">
    隔離執行會重設周遭對話情境。頻道與群組路由、傳送／佇列政策、權限提升、來源及 ACP 執行階段繫結都會為新執行重設。安全的偏好設定，以及使用者明確選取的模型或驗證覆寫，可以跨執行沿用。
  </Accordion>
</AccordionGroup>

## 傳送

`openclaw cron list` 和 `openclaw cron show <job-id>` 會預覽解析後的傳送路由。對於 `channel: "last"`，預覽會顯示路由是從主要或目前工作階段解析而來，或將以封閉方式失敗。

帶有供應商前綴的目標可消除未解析公告頻道的歧義。例如，省略 `delivery.channel` 或其為 `last` 時，`to: "telegram:123"` 會選取 Telegram。只有已載入外掛公告的前綴才是供應商選擇器。如果明確指定 `delivery.channel`，前綴必須符合該頻道；搭配 `to: "telegram:123"` 的 `channel: "whatsapp"` 會遭拒絕。`imessage:` 和 `sms:` 等服務前綴仍是由頻道擁有的目標語法。

<Note>
隔離的 `cron add` 工作預設使用 `--announce` 傳送。請使用 `--no-deliver` 將輸出保留在內部。`--deliver` 仍保留為 `--announce` 的已棄用別名。
</Note>

### 傳送責任歸屬

隔離排程的聊天傳送由代理程式與執行器共同負責：

- 有可用的聊天路由時，代理程式可使用 `message` 工具直接傳送。
- 只有在代理程式未直接傳送至解析後的目標時，`announce` 才會備援傳送最終回覆。
- `webhook` 會將完成的酬載張貼至 URL。
- `none` 會停用執行器的備援傳送。

請使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 設定網路鉤子傳送。請勿將 `--webhook` 與 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天傳送旗標併用。

`cron edit <job-id>` 可使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消設定個別傳送路由欄位（每個選項與其對應的設定旗標併用時都會遭拒絕）。不同於僅停用執行器備援傳送的 `--no-deliver`，這些選項會移除儲存的欄位，讓工作再次從預設值解析該部分的路由。

`--announce` 是最終回覆的執行器備援傳送。`--no-deliver` 會停用該備援，但有可用的聊天路由時，不會移除代理程式的 `message` 工具。

從作用中聊天建立的提醒，會保留即時聊天傳送目標，以供備援公告傳送使用。內部工作階段金鑰可能是小寫；請勿將其作為 Matrix 房間 ID 等區分大小寫之供應商 ID 的事實來源。

### 失敗傳送

失敗通知會依下列順序解析：

1. 工作上的 `delivery.failureDestination`。
2. 全域 `cron.failureDestination`。
3. 工作的主要公告目標（上述兩者都無法解析為具體目的地時）。

<Note>
只有在主要傳送模式為 `webhook` 時，主要工作階段工作才能使用 `delivery.failureDestination`。隔離工作在所有模式下都接受此設定。
</Note>

隔離排程執行會將執行層級的代理程式失敗視為工作錯誤，即使未產生回覆酬載亦然，因此模型／供應商失敗仍會增加錯誤計數器並觸發失敗通知。

命令排程工作不會啟動隔離代理程式回合。結束代碼為零時會記錄 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄 `error`，並可能觸發相同的失敗通知路徑。

如果隔離執行在首次模型要求前逾時，`openclaw cron show` 和 `openclaw cron runs` 會包含階段專屬錯誤，例如 `setup timed out before runner start`，或指出最後已知啟動階段的停滯訊息（例如 `context-engine`）。對於以命令列介面為基礎的供應商，模型前監看程式會持續運作，直到外部命令列介面回合開始，因此工作階段查詢、掛鉤、驗證、提示詞和命令列介面設定停滯都會回報為模型前排程失敗。

## 排程

### 單次工作

`--at <datetime>` 會排定單次執行。未含時差的日期時間會視為 UTC，除非同時傳入 `--tz <iana>`，如此會以指定時區解讀牆上時間。

<Note>
單次工作預設會在成功後刪除。請使用 `--keep-after-run` 保留工作。
</Note>

### 週期性工作

週期性工作在連續發生錯誤後會使用指數重試退避：30s、1m、5m、15m、60m。下一次成功執行後，排程會恢復正常。

略過的執行會與執行錯誤分開追蹤。它們不會影響重試退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可讓失敗警示納入重複的略過執行通知。

對於以本機已設定模型供應商為目標的隔離工作（基礎 URL 位於回送位址、私人網路或 `.local`），排程會在啟動代理程式回合前執行輕量供應商預檢：`api: "ollama"` 供應商會在 `/api/tags` 接受探測；其他本機 OpenAI 相容供應商（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）會在 `/models` 接受探測。如果端點無法連線，執行會記錄為 `skipped`，並於之後的排程重試；每個端點的可連線性結果會快取 5 分鐘，避免許多針對同一本機伺服器的工作以重複探測造成大量負載。

排程工作、待處理執行階段狀態和執行歷程都位於共用 SQLite 狀態資料庫中。舊版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 檔案會匯入一次，並以 `.migrated` 後綴重新命名。匯入後，請使用 `openclaw cron add|edit|remove` 編輯排程，而不要編輯 JSON 檔案。

### 手動執行

`openclaw cron run <job-id>` 預設會強制執行，並在手動執行排入佇列後立即傳回。成功回應包含 `{ ok: true, enqueued: true, runId }`。請使用傳回的 `runId` 檢查稍後的結果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

當指令碼應阻塞，直到該筆確切的佇列執行記錄終止狀態時，請加入 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 時，命令列介面仍會先呼叫 `cron.run`，再針對傳回的 `runId` 輪詢 `cron.runs`。只有執行以 `ok` 狀態完成時，命令才會以 `0` 結束。執行以 `error` 或 `skipped` 完成、閘道回應未包含 `runId`，或 `--wait-timeout` 到期（預設為 `10m`，預設每 `2s` 輪詢一次）時，命令會以非零狀態結束。`--poll-interval` 必須大於零。

<Note>
若希望手動命令僅在工作目前到期時執行，請使用 `--due`。如果 `--due --wait` 未將執行排入佇列，命令會傳回一般未執行回應，而不會進行輪詢。
</Note>

## 模型

`cron add|edit --model <ref>` 會為工作選取允許的模型。`cron add|edit --fallbacks <list>` 會設定各工作專屬的備援模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；傳入 `--fallbacks ""` 可執行不含備援的嚴格執行。`cron edit <job-id> --clear-fallbacks` 會移除各工作專屬的備援覆寫。`cron edit <job-id> --clear-model` 會移除各工作專屬的模型覆寫，使工作遵循一般排程模型選擇優先順序（若有已儲存的排程工作階段覆寫，則使用該覆寫；否則使用代理程式／預設模型）；此選項無法與 `--model` 併用。`cron add|edit --thinking <level>` 會設定各工作專屬的思考覆寫；`cron edit <job-id> --clear-thinking` 會移除此覆寫，使工作遵循一般排程思考優先順序，且無法與 `--thinking` 併用。

<Warning>
如果模型不受允許或無法解析，排程會以明確的驗證錯誤讓執行失敗，而不是回復至工作的代理程式或預設模型選擇。
</Warning>

排程 `--model` 是**工作主要模型**，而非聊天工作階段的 `/model` 覆寫。這表示：

- 選定的工作模型失敗時，已設定的模型備援仍會套用。
- 存在各工作專屬酬載 `fallbacks` 時，會取代已設定的備援清單。
- 空的各工作專屬備援清單（工作酬載／API 中的 `--fallbacks ""` 或 `fallbacks: []`）會使排程執行採用嚴格模式。
- 當工作具有 `--model`，但未設定備援清單時，OpenClaw 會傳入明確的空白備援覆寫，使代理程式主要模型不會作為隱藏重試目標附加。
- 本機供應商預檢會逐一檢查已設定的備援，之後才將排程執行標記為 `skipped`。

`openclaw doctor` 會回報已設定 `payload.model` 的工作，包括供應商命名空間計數，以及與 `agents.defaults.model` 的不相符項目。即時聊天與排程工作之間的驗證、供應商或計費行為看似不同時，請使用此檢查。

### 隔離排程模型優先順序

隔離排程會依下列順序解析作用中的模型：

1. Gmail 掛鉤覆寫。
2. 各工作專屬的 `--model`。
3. 已儲存的排程工作階段模型覆寫（使用者選取模型時）。
4. 代理程式或預設模型選擇。

### 快速模式

隔離排程快速模式會遵循解析後的即時模型選擇。模型設定 `params.fastMode` 預設會套用，但已儲存工作階段中的 `fastMode` 覆寫仍優先於設定。當解析後的模式為 `auto` 時，截止時間會使用所選模型的 `params.fastAutoOnSeconds` 值，預設為 60 秒。

### 即時模型切換重試

如果隔離執行擲出 `LiveSessionModelSwitchError`，排程會在重試前，為目前執行保存切換後的供應商與模型（若有，也會保存切換後的驗證設定檔覆寫）。外層重試迴圈在初次嘗試後最多允許兩次切換重試，之後便會中止，而不會無限循環。

## 執行輸出與拒絕

### 抑制過期確認回覆

隔離排程回合會抑制僅包含過期確認的回覆。如果第一個結果只是一則暫時狀態更新，且沒有任何後代子代理程式執行負責提供最終答案，排程會再次提示一次以取得實際結果，然後才傳送。

### 抑制靜默權杖

如果隔離排程執行僅傳回靜默權杖（`NO_REPLY` 或 `no_reply`），排程會同時抑制直接對外傳送與備援的佇列摘要路徑，因此不會有任何內容回傳至聊天。

### 結構化拒絕

隔離排程執行會將內嵌執行提供的結構化執行拒絕中繼資料（代碼為 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命執行工具錯誤）視為權威拒絕訊號。它們也會辨識節點主機的 `UNAVAILABLE` 包裝，其中包含帶有上述任一代碼的巢狀結構化錯誤。

除非內嵌執行也提供結構化拒絕中繼資料，否則排程不會將最終輸出文字或看似要求核准的拒絕措辭分類為拒絕，因此一般的助理文字不會被視為受阻的命令。

`cron list` 與執行歷史會顯示拒絕原因，而不會將受阻的命令回報為 `ok`。

## 保留

保留行為：

- `cron.sessionRetention`（預設為 `24h`，或設為 `false` 以停用）會清除已完成的隔離執行工作階段。
- 執行歷史會為每個排程工作保留最新的 2000 筆終止資料列。遺失的資料列會保留標準的 24 小時遺失任務清理期間。

## 遷移較舊的工作

<Note>
如果你的排程工作是在目前的傳送與儲存格式之前建立，請執行 `openclaw doctor --fix`。Doctor 會正規化舊版排程欄位（`jobId`、`schedule.cron`、包含舊版 `threadId` 的頂層傳送欄位，以及承載資料 `provider` 的傳送別名），並將 `notify: true` 網路鉤子備援工作從已淘汰的原始 `cron.webhook` 值遷移至明確的網路鉤子傳送，之後再移除該設定鍵。已向聊天發布通知的工作會保留該傳送方式，並取得完成網路鉤子目的地。若沒有舊版網路鉤子，對於沒有遷移目標的工作，會移除無作用的頂層 `notify` 標記（現有傳送方式維持不變），因此 `doctor --fix` 不會再持續對其發出警告。
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

建立具有精確 argv、cwd、env、stdin 與輸出限制的命令工作：

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

`openclaw cron list` 預設會顯示已啟用的工作。傳入 `--all` 可包含已停用的工作，或傳入 `--agent <id>`，僅顯示有效正規化代理程式 ID 相符的工作；未儲存代理程式 ID 的工作會視為使用已設定的預設代理程式。

`openclaw cron get <job-id>` 會直接傳回已儲存工作的 JSON。需要包含傳送路由預覽的易讀檢視時，請使用 `cron show <job-id>`。

`cron list --json` 與 `cron show <job-id> --json` 會在每個工作的頂層包含 `status` 欄位，此欄位根據 `enabled`、`state.runningAtMs` 與 `state.lastRunStatus` 計算。值包括：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 狀態會維持標準且不加修飾，讓外部工具無須重新推導即可讀取工作狀態；易讀輸出則可能以失敗次數修飾重複的 `error` 狀態。

`cron runs` 項目包含傳送診斷，其中會列出預定的排程目標、解析後的目標、訊息工具傳送、備援使用情況與已傳送狀態。

重新指定代理程式與工作階段目標：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

在代理程式回合工作中省略 `--agent` 時，`openclaw cron add` 會發出警告，並改用預設代理程式（`main`）。建立時傳入 `--agent <id>` 可固定使用特定代理程式。

傳送調整：

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
