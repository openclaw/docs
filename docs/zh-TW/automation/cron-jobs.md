---
read_when:
    - 排程背景工作或喚醒作業
    - 將外部觸發條件（網路鉤子、Gmail）串接至 OpenClaw
    - 在心跳偵測與排程之間選擇以執行定時任務
sidebarTitle: Scheduled tasks
summary: 閘道排程器的排程工作、網路鉤子與 Gmail PubSub 觸發條件
title: 排程工作
x-i18n:
    generated_at: "2026-07-20T00:45:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3365e59e06517169306425b639d45082e3331616c4c62b5f05e5e2b8181fc212
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是閘道內建的排程器。它會持久保存工作、在正確時間喚醒代理程式，並可將輸出傳送至聊天頻道、網路鉤子，或不傳送至任何位置。

## 快速開始

<Steps>
  <Step title="新增單次提醒">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="檢查你的工作">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看執行歷程">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 的運作方式

- Cron 在**閘道程序內部**執行，而非在模型內部。閘道必須持續執行，排程才會觸發。
- 工作定義、執行階段狀態與執行歷程會持久保存在 OpenClaw 的共用 SQLite 狀態資料庫中，因此重新啟動不會遺失排程。
- 每次 Cron 執行都會建立一筆[背景任務](/zh-TW/automation/tasks)記錄。
- 單次工作（`--at`）預設會在成功後自動刪除；傳入 `--keep-after-run` 可保留工作。
- 每次執行的實際時間預算：設定時使用 `--timeout-seconds`。否則，隔離／分離的代理程式回合工作會受到 Cron 自身的 60 分鐘監看程式限制，早於底層代理程式回合逾時（`agents.defaults.timeoutSeconds`，預設 48 小時）生效；命令工作預設為 10 分鐘，指令碼酬載預設為 5 分鐘。
- 閘道啟動時，逾期的隔離代理程式回合工作會重新排程，而不會立即重播，以避免模型／工具啟動工作進入頻道連線期間。
- 如果你使用系統 Cron 或其他外部排程器驅動 `openclaw agent`，即使命令列介面已處理 `SIGTERM`/`SIGINT`，仍應以強制終止升級機制包裝它。由閘道支援的執行會要求閘道中止已接受的執行；本機與嵌入式備援執行也會收到相同的中止訊號。若使用 GNU `timeout`，請優先使用 `timeout -k 60 600 openclaw agent ...`，而非單獨使用 `timeout 600 ...` — 如果程序無法及時完成收尾，`-k` 值就是最後保障。若使用 systemd 單元，請使用 `SIGTERM` 停止訊號，並在最終終止前保留寬限期間（`TimeoutStopSec`）。當原始閘道執行仍在進行中時重複使用 `--run-id`，系統會將重複執行回報為進行中，而不會啟動第二次執行。

<AccordionGroup>
  <Accordion title="隔離執行強化">
    - 隔離執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁／程序，並透過主工作階段與自訂工作階段執行所使用的相同共用拆卸路徑，處置為工作建立的任何隨附 MCP 執行階段執行個體。清理失敗會被忽略，以確保 Cron 結果仍具優先權。
    - 具有限定 Cron 自我清理授權的隔離執行，可以讀取排程器狀態、僅包含自身工作的自我篩選清單，以及該工作的執行歷程，且只能移除自身工作。
    - 隔離執行會防範過時的確認回覆：如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 與類似提示），且沒有任何下層子代理程式仍負責最終答案，OpenClaw 會再提示一次以取得實際結果，然後才進行傳送。
    - 系統可辨識結構化的執行拒絕中繼資料（包括巢狀錯誤以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的節點主機 `UNAVAILABLE` 包裝器），因此遭封鎖的命令不會被回報為成功執行，同時也不會將一般助理文字誤認為拒絕。
    - 即使沒有回覆酬載，執行層級的代理程式失敗仍會計為工作錯誤，因此模型／提供者失敗會增加錯誤計數並觸發失敗通知，而不會將工作視為成功並清除。
    - 當工作達到 `timeoutSeconds` 時，Cron 會中止執行，並提供短暫的清理期間。如果未能完成收尾，閘道擁有的清理機制會在 Cron 記錄逾時前，強制清除該次執行的工作階段擁有權，避免佇列中的聊天工作卡在過時的處理中工作階段之後。
    - 設定／啟動停滯會套用階段專屬逾時（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。即使外部命令列介面程序尚未啟動，這些監看程式也涵蓋嵌入式與命令列介面支援的提供者，並且會獨立於較長的 `timeoutSeconds` 值受到上限限制，讓冷啟動／驗證／上下文失敗能快速浮現。

  </Accordion>
  <Accordion title="任務協調">
    Cron 任務協調首先由執行階段負責，其次由持久歷程支援：只要 Cron 執行階段仍將該工作追蹤為執行中，作用中的 Cron 任務就會保持作用中，即使舊的子工作階段資料列仍存在也一樣。執行階段不再擁有該工作且 5 分鐘寬限期間到期後，維護檢查會針對相符的 `cron:<jobId>:<startedAt>` 執行，檢查持久保存的執行記錄與工作狀態。其中的終止結果會完成任務帳本；否則，閘道擁有的維護機制可將任務標記為 `lost`。離線命令列介面稽核可以從持久歷程復原，但其自身程序內的作用中工作集合為空，並不能證明閘道擁有的執行已消失。
  </Accordion>
</AccordionGroup>

## 排程類型

| 種類      | 命令列介面旗標    | 說明                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 單次時間戳記（ISO 8601 或如 `20m` 的相對時間）                                                     |
| `every`   | `--every`   | 固定間隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`    | 5 欄或 6 欄 Cron 運算式，可選用 `--tz`                                                  |
| `on-exit` | `--on-exit` | 監看的命令結束時觸發一次（事件觸發器；回合拆卸後仍保留；可選用 `--on-exit-cwd`） |

沒有時區的時間戳記會視為 UTC。新增 `--tz America/New_York`，即可使用該 IANA 時區解讀沒有時差的 `--at` 日期時間，或計算 Cron 運算式。未使用 `--tz` 的 Cron 運算式會採用閘道主機的時區。`--tz` 不適用於 `--every` 或 `--on-exit`。

每小時整點重複的運算式（分鐘為 `0`，小時欄位為萬用字元）會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 可強制精確計時，或使用 `--stagger 30s` 設定明確的時間範圍（僅限 Cron 排程）。

### 動態頻率（步調調整）

重複工作可將 `pacing.min` 和／或 `pacing.max` 設為 `15m` 或 `4h` 等期間字串；至少需要一個界限。搭配 `cron add|edit` 使用 `--pacing-min` 與 `--pacing-max`（`--clear-pacing` 會移除兩個界限）。

在隔離執行期間，已調整步調的工作可以呼叫 `cron` 工具，並傳入 `action: "next_check"` 與 `in: "30m"`。提案只會套用至目前正在執行的工作，並從成功執行完成時起算。OpenClaw 會在不發出提示的情況下，將其限制在設定的界限內。

沒有提案的步調調整不會變更一般排程。失敗、逾時及略過的執行會捨棄提案，因此現有的重試與錯誤退避行為具有優先權。手動強制執行重複工作屬於頻帶外操作，會保留其待執行的自然或步調調整時段。對於條件觸發的工作，即使提案要求更早檢查，內建的最短間隔仍是下限。

### 每月日期與每週日期使用 OR 邏輯

Cron 運算式由 [croner](https://github.com/Hexagon/croner) 剖析。當每月日期與每週日期欄位都不是萬用字元時，只要**任一**欄位相符，croner 就會判定相符，而非要求兩者皆相符。這是標準的 Vixie Cron 行為。

```bash
# 預期：「每月 15 日上午 9 點，但僅限星期一」
# 實際：「每月 15 日上午 9 點，以及每個星期一上午 9 點」
0 9 15 * 1
```

因此每月大約會觸發 5-6 次，而不是每月 0-1 次。若要同時要求兩個條件，請使用 croner 的 `+` 每週日期修飾詞（`0 9 15 * +1`），或依其中一個欄位排程，並在工作的提示或命令中檢查另一個欄位。

## 事件觸發器（條件監看器）

事件觸發器會將無介面條件指令碼新增至 `every` 或 `cron` 排程。工作到期時，Cron 會評估指令碼，且僅在指令碼傳回 `fire: true` 時執行一般酬載：

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 僅在觀察到的狀態與上次評估不同時觸發。
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigate the CI status change." },
}
```

指令碼必須傳回 `{ fire, message?, state? }`。先前的 JSON 狀態會以深度凍結的 `trigger.state` 提供；傳回新的 `state` 值即可持久保存。狀態上限為 16 KB。當觸發結果包含 `message` 時，Cron 會在執行前將其附加至系統事件文字或代理程式回合訊息。`once: true` 會在首次成功執行已觸發的酬載後停用工作。

`fire: false` 會持久保存評估狀態與計數器，然後重新排程，而不會建立執行歷程。如果已觸發的酬載執行失敗，傳回的 `state` **不會**持久保存 — 下一次評估會看到先前狀態，並可再次觸發，因此請將指令碼撰寫為唯讀檢查，並將動作放在酬載中。觸發器排程有可設定的最短間隔（預設為 30 秒）。每次評估有 30 秒的實際時間預算，且最多可呼叫 5 次工具。

監看器應以**可採取行動的狀態**為中心設計，而不能只關注成功：檢查失敗或逾時時停止回報的監看器，在損壞時看起來仍然正常。將觀察結果與 `trigger.state` 比較，並傳回新狀態以刪除重複項目；請勿依賴模型或程序記憶體。觸發時，請讓 `message` 自給自足，因為它會成為已觸發執行的完整事件上下文。

<Warning>
啟用 `cron.triggers.enabled` 後，條件觸發指令碼與 `script` 酬載都可使用擁有者代理程式的**完整工具原則（包括 `exec`）**以無介面方式執行。請將此視為使用該代理程式權限的無人值守程式碼執行；除非所有獲准建立 Cron 工作的代理程式都具備相應的信任程度，否則請保持停用。
</Warning>

從本機指令碼檔案建立監看器（`-` 會從標準輸入讀取指令碼）：

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## 酬載

每個工作都恰好攜帶一種由旗標選擇的酬載類型：

| 承載內容      | 旗標                                           | 執行方式                                                     |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| 系統事件      | `--system-event <text>`                        | 排入主工作階段，本身不會呼叫模型                             |
| 代理程式訊息  | `--message <text>`                             | 由模型支援的代理程式回合                                     |
| 命令          | `--command <shell>` 或 `--command-argv <json>` | 在閘道主機上執行 shell／程序，不會呼叫模型                   |
| 指令碼        | `--script <file\|->`                           | 使用所屬代理程式工具的無頭程式碼模式指令碼                   |

### 代理程式回合選項

<ParamField path="--message" type="string" required>
  提示文字（隔離／目前／自訂工作階段作業的必要項目）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；必須解析為允許的模型，否則執行會因驗證錯誤而失敗。
</ParamField>
<ParamField path="--fallbacks" type="string">
  個別作業的備援模型清單，例如 `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`。傳入 `--fallbacks ""` 可進行不含備援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  搭配 `cron edit` 時，移除個別作業的備援覆寫，讓作業遵循已設定的備援優先順序。不能與 `--fallbacks` 同時使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  搭配 `cron edit` 時，移除個別作業的模型覆寫，讓作業遵循一般排程模型優先順序（已儲存的排程工作階段覆寫，否則使用代理程式／預設模型）。不能與 `--model` 同時使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。可用層級仍取決於所選模型與代理程式執行環境。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  搭配 `cron edit` 時，移除個別作業的思考覆寫。不能與 `--thinking` 同時使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作業可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會設定作業的主要模型；它不會取代工作階段的 `/model` 覆寫，因此已設定的備援鏈仍會套用於其上。無法解析或不允許的模型會使執行失敗並產生明確的驗證錯誤，而不會無聲地退回預設模型。如果作業有 `--model`，但沒有明確或已設定的備援清單，OpenClaw 會傳入空的備援覆寫，而不會無聲地將代理程式主要模型附加為隱藏的重試目標。

隔離作業的模型選擇優先順序如下，由高至低：

1. 個別作業承載內容的 `model`（明確設定；不允許的模型會使執行失敗）
2. Gmail 鉤子的模型覆寫（僅限執行來自 Gmail，且允許該覆寫時）
3. 使用者選取並儲存的排程工作階段模型覆寫
4. 代理程式／預設模型選擇

快速模式會遵循解析後的即時選擇。如果所選模型設定有 `params.fastMode`，隔離排程預設會使用它；已儲存的工作階段 `fastMode` 覆寫（其次為代理程式的 `fastModeDefault`）在任一方向上仍優先於模型設定。自動模式使用模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果執行遇到即時模型切換交接，排程會使用切換後的供應商／模型重試，並為作用中的執行保留該選擇（以及任何新的驗證設定檔）。重試次數有限：初始嘗試加上 2 次切換重試後，排程會中止，而不會持續循環。

在隔離執行開始前，OpenClaw 會檢查已設定之 `api: "ollama"` 與 `api: "openai-completions"` 供應商的可連線本機端點，其中 `baseUrl` 為迴路、私人網路或 `.local`。此前置檢查會遍歷作業已設定的備援鏈，只有在所有候選項目都無法連線後，才會將執行標記為 `skipped`；`--fallbacks ""` 會讓遍歷嚴格限制為僅使用主要模型。端點停機時，會以清楚的錯誤將執行記錄為 `skipped`，而不會開始模型呼叫。結果會依每個端點快取 5 分鐘（不是依每個作業或模型），因此許多到期作業共用停機的本機 Ollama／vLLM／SGLang／LM Studio 伺服器時，只需一次探測，而不會引發請求風暴。略過的前置檢查執行不會增加執行錯誤退避；設定 `failureAlert.includeSkipped` 可選擇接收重複的略過警示。

### 命令承載內容

命令承載內容會在閘道排程器內執行確定性指令碼，而不會啟動由模型支援的回合。它們在閘道主機上執行、擷取 stdout／stderr、將執行記錄於排程歷程記錄，並重複使用與代理程式回合作業相同的 `announce`、`webhook` 和 `none` 傳遞模式。

<Note>
命令排程是供操作員管理的閘道自動化介面，不是代理程式的 `tools.exec` 呼叫。建立、更新、移除或手動執行排程作業需要 `operator.admin`；排定的命令執行之後會在閘道程序內，作為該管理員撰寫的自動化來執行。代理程式執行原則（`tools.exec.mode`、核准提示、個別代理程式工具允許清單）控管模型可見的執行工具，而不是命令排程承載內容。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不經 shell 剖析的情況下精確執行 argv。選用的 `--command-env KEY=VALUE`（可重複）、`--command-input`、`--timeout-seconds`（預設 10 分鐘）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 可控制程序環境、stdin 與輸出界限。

傳遞的文字衍生自程序輸出：非空的 stdout 優先；如果 stdout 為空而 stderr 非空，則傳遞 stderr；如果兩者都有內容，排程會傳送一個小型 `stdout:`／`stderr:` 區塊。結束代碼 `0` 會將執行記錄為 `ok`；非零結束代碼、訊號、逾時或無輸出逾時會記錄為 `error`，並可能觸發失敗警示。只印出 `NO_REPLY` 的命令會使用一般排程靜默權杖抑制機制，不會將任何內容發回聊天。

### 指令碼承載內容

指令碼承載內容會在與觸發器指令碼相同的程式碼模式執行器中以無頭方式執行，而不會啟動對話式代理程式回合。建立或執行前請啟用 `cron.triggers.enabled`；此危險自動化閘門同時涵蓋觸發器指令碼與指令碼承載內容。指令碼作業僅支援 `main` 與 `isolated` 工作階段目標。

```bash
openclaw cron create "0 * * * *" \
  --name "Hourly queue check" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

使用 `--script <file|->` 可從檔案或 stdin 讀取 JavaScript。逾時預設為 300 秒，上限為 900；工具預算預設為 50 次呼叫，上限為 200。這些承載內容預算與較小的觸發器閘門評估預算分開計算。

指令碼可以傳回包含下列選用欄位的物件：

- `notify`：透過作業的 `announce`、`webhook` 或 `none` 傳遞模式傳遞的文字。若省略，則不會傳遞任何內容。對於 `main` 作業，該文字會成為系統事件。
- `wake`：`"now"` 會要求在排入 `notify`（或精簡的完成事件）後立即執行心跳偵測；`"next-heartbeat"` 會將事件排入下一次心跳偵測。
- `state`：JSON 狀態，上限為 16 KB，且只會在成功執行後保存。下一次執行會以 `trigger.state` 接收凍結的副本，與觸發器指令碼一致。由於該命名空間只有一個保存擁有者，因此指令碼承載內容不能與同一作業上的條件觸發器合併使用。
- `nextCheck`：例如 `"15m"` 的持續時間。它只適用於已啟用節奏控制的作業，並使用與代理程式回合提案相同的節奏限制。

擲出例外、逾時、工具預算耗盡、無效結果，以及未啟用節奏控制時使用 `nextCheck`，都屬於一般排程執行錯誤：它們會進入執行歷程記錄、退避與失敗警示處理，且不會保存傳回的狀態。

## 執行樣式

| 樣式            | `--session` 值 | 執行位置                   | 最適合                         |
| --------------- | ------------------- | -------------------------- | ------------------------------ |
| 主工作階段      | `main`              | 專用排程喚醒通道           | 提醒、系統事件                 |
| 隔離            | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務                 |
| 目前工作階段    | `current`           | 建立時繫結                 | 可感知情境的週期性工作         |
| 自訂工作階段    | `session:custom-id` | 持久具名工作階段           | 以歷程記錄為基礎的工作流程     |

<AccordionGroup>
  <Accordion title="主工作階段、隔離與自訂之間的差異">
    **主工作階段**作業會將系統事件排入排程擁有的執行通道，並可選擇喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主工作階段最近的傳遞情境進行回覆，但不會將例行排程回合附加至人類聊天通道，也不會延長目標工作階段的每日／閒置重設有效期。**隔離**作業會使用全新工作階段執行專用的代理程式回合。**自訂工作階段**（`session:xxx`）會跨執行保留情境，從而支援以先前摘要為基礎的每日站立會議等工作流程。

    主工作階段排程事件是內容完備的系統事件提醒。它們不會自動包含預設心跳偵測提示中的「讀取 HEARTBEAT.md」指示；如果提醒應查閱 `HEARTBEAT.md`，請在排程事件文字中明確說明。

  </Accordion>
  <Accordion title="隔離作業的「全新工作階段」代表什麼">
    每次執行都會使用新的文字記錄／工作階段 ID。OpenClaw 會保留安全的偏好設定（思考／快速／詳細設定、標籤、使用者明確選取的模型／驗證覆寫），但不會從較舊的排程資料列繼承周遭對話情境：頻道／群組路由、傳送或佇列原則、權限提升、來源或 ACP 執行環境繫結。當週期性作業應刻意以相同的對話情境為基礎時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="無人值守執行契約">
    隔離排程與鉤子代理程式回合明確採無人值守模式：沒有人可以提供釐清或核准。最終回覆必須是交付成果，而不是計畫、確認訊息或輸入要求。不需要執行任何事項時，代理程式會傳回 `HEARTBEAT_OK`，並清楚說明失敗；排程負責重試與失敗警示原則。

    對於受信任的排定作業，當作業本身的指示刻意要求提問或計畫時，該指示優先，且代理程式可以移除不再需要的作業。外部鉤子回合只會收到共同的無人值守契約；跨越外部內容邊界時，它們不會收到該覆寫或自行移除指引。

  </Accordion>
  <Accordion title="子代理程式與 Discord 傳遞">
    當隔離排程執行協調子代理程式時，傳遞會優先採用最終後代輸出，而不是過時的父代理程式中間文字。如果後代仍在執行，OpenClaw 會抑制該部分父代理程式更新，而不會發出公告。

    對於純文字的 Discord 公告目標，OpenClaw 只會傳送一次標準的最終助理文字，不會同時重播串流／中間文字與最終答案。媒體與結構化 Discord 承載資料仍會分開傳送，因此不會遺漏附件與元件。

  </Accordion>
</AccordionGroup>

## 傳送與輸出

| 模式       | 行為                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 若代理程式未傳送，則將最終文字備援傳送至目標 |
| `webhook`  | 將完成事件承載資料以 POST 傳送至 URL                                |
| `none`     | 不由執行器進行備援傳送                                         |

請使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳送。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受由 Telegram 定義的 `-1001234567890:123` 簡寫。直接 RPC／設定呼叫端可將 `delivery.threadId` 作為字串或數字傳入。Slack／Discord／Mattermost 目標使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用確切的房間 ID，或 Matrix 提供的 `room:!room:server` 格式。

當公告傳送使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶有供應商前綴的目標，可在排程退回工作階段歷史記錄或單一已設定頻道之前選取頻道。只有已載入外掛宣告的前綴才是供應商選擇器。若明確指定 `delivery.channel`，目標前綴必須指向相同供應商；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 時會遭拒絕，而不會讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍是由頻道擁有的目標語法，而不是供應商選擇器。

對於隔離工作，聊天傳送是共用的：若有可用的聊天路由，即使使用 `--no-deliver`，代理程式仍可使用 `message` 工具。若代理程式傳送至已設定／目前的目標，OpenClaw 會略過備援公告。否則，`announce`、`webhook` 與 `none` 只控制代理程式回合結束後，執行器如何處理最終回覆。

當代理程式從進行中的聊天建立隔離提醒時，OpenClaw 會保留即時傳送目標，供備援公告路由使用。內部工作階段金鑰可能為小寫；若目前聊天內容可用，就不會從這些金鑰重建供應商傳送目標。

隱含公告傳送會使用已設定的頻道允許清單來驗證過期目標並重新路由。私訊配對儲存區的核准對象不是備援自動化收件者；若排程工作應主動傳送至私訊，請設定 `delivery.to`，或設定頻道的 `allowFrom` 項目。

### 失敗通知

失敗通知使用獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對個別工作覆寫該值。
- 若兩者皆未設定，且工作已透過 `announce` 傳送，失敗通知會退回該主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非主要傳送模式為 `webhook`。
- `failureAlert.includeSkipped: true` 可讓個別工作或全域排程警示原則選擇接收重複的略過執行警示。略過的執行會保留獨立的連續略過計數器，因此不會影響執行錯誤的退避。
- `openclaw cron edit` 提供個別工作的警示調整項目：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 與 `--failure-alert-account-id`。

### 輸出語言

排程工作不會根據頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放入排程訊息或範本：

```bash
openclaw cron edit <jobId> \
  --message "摘要更新內容。請以中文回覆；URL、程式碼與產品名稱維持不變。"
```

對於範本檔案，請在轉譯後的提示中保留語言指示，並在工作執行前確認 `{{language}}` 等預留位置已填入。若輸出混用多種語言，請明確指定規則，例如：“敘述文字使用中文，技術術語保留英文。”

## 命令列介面範例

<Tabs>
  <Tab title="單次提醒">
    ```bash
    openclaw cron add \
      --name "行事曆檢查" \
      --at "20m" \
      --session main \
      --system-event "下一次心跳偵測：檢查行事曆。" \
      --wake now
    ```
  </Tab>
  <Tab title="週期性隔離工作">
    ```bash
    openclaw cron create "0 7 * * *" \
      "摘要夜間更新。" \
      --name "晨間摘要" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="模型與思考覆寫">
    ```bash
    openclaw cron add \
      --name "深入分析" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "每週深入分析專案進度。" \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="網路鉤子輸出">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "以 JSON 摘要今天的部署。" \
      --name "部署摘要" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="命令輸出">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "佇列深度探測" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## 管理工作

```bash
# 列出所有工作
openclaw cron list

# 以 JSON 取得一個已儲存的工作
openclaw cron get <jobId>

# 顯示一個工作，包括解析後的傳送路由
openclaw cron show <jobId>

# 啟用／停用而不刪除
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# 編輯工作
openclaw cron edit <jobId> --message "已更新的提示" --model "opus"

# 立即強制執行工作
openclaw cron run <jobId>

# 立即強制執行工作並等待其終止狀態
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 僅在到期時執行
openclaw cron run <jobId> --due

# 檢視執行記錄
openclaw cron runs --id <jobId> --limit 50

# 檢視一次確切的執行
openclaw cron runs --id <jobId> --run-id <runId>

# 刪除工作
openclaw cron remove <jobId>

# 選取代理程式（多代理程式設定）
openclaw cron create "0 6 * * *" "檢查維運佇列" --name "維運巡查" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

封存工作階段（透過 Control UI，或由操作員管理員呼叫端使用 `sessions.patch { archived: true }`）會停用繫結至該工作階段的所有已啟用排程工作：其隔離的 `cron:<jobId>` 工作階段、`session:<key>` 目標，或傳送／喚醒 `sessionKey` 通道。還原工作階段不會重新啟用這些工作；請使用 `openclaw cron enable <jobId>`。具有已啟用繫結工作的工作階段，會在 Control UI 側邊欄顯示時鐘徽章。

`openclaw cron run <jobId>` 會在手動執行排入佇列後返回。對於關機掛鉤、維護指令碼，或其他必須封鎖直到佇列中的執行完成為止的自動化，請使用 `--wait`；它會輪詢傳回的 `runId`（預設逾時 `10m`、輪詢間隔 `2s`），狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時則以非零值結束。

代理程式的 `cron` 工具會從 `cron(action: "list")` 傳回精簡工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；若要取得一份完整的工作定義，請使用 `cron(action: "get", jobId: "...")`。直接呼叫閘道的呼叫端可將 `compact: true` 傳給 `cron.list`；省略它會保留包含傳送預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名。新工作可以使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後接位置式代理程式提示。請在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的執行承載資料以 POST 傳送至 HTTP 端點；網路鉤子傳送不能與聊天傳送旗標（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）併用。在 `cron edit`、`--clear-channel`、`--clear-to`、`--clear-thread-id` 與 `--clear-account` 上，可個別清除這些路由欄位（每個旗標與其對應的設定旗標同時使用時都會遭拒絕）——這不同於 `--no-deliver`，後者只會停用執行器的備援傳送。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作所選取的模型。
- 若允許使用該模型，該確切的供應商／模型會傳遞至隔離的代理程式執行。
- 若不允許使用或無法解析，排程會以明確的驗證錯誤讓該次執行失敗。
- API `cron.update` 承載資料修補可將 `model: null` 設為清除已儲存工作的模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 併用。
- 已設定的備援鏈仍會套用，因為排程 `--model` 是工作的主要模型，而不是工作階段的 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定承載資料的 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援並使執行採用嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除個別工作的覆寫。
- 若未提供明確或已設定的備援清單，單獨的 `--model` 不會無聲地退回代理程式主要模型，將其作為額外的重試目標。

</Note>

## 網路鉤子

閘道可以公開 HTTP 網路鉤子端點供外部觸發。請在設定中啟用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 驗證

每個要求都必須透過標頭包含掛鉤權杖：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

查詢字串權杖會遭拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將系統事件排入主要工作階段的佇列：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"收到新電子郵件","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件描述。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 或 `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    執行一次隔離的代理程式回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"摘要收件匣","name":"電子郵件","model":"openai/gpt-5.6-sol"}'
    ```

    欄位：`message`（必要）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應的網路鉤子（POST /hooks/<name>）">
    自訂網路鉤子名稱會透過設定中的 `hooks.mappings` 解析。對應可使用範本或程式碼轉換，將任意承載資料轉換成 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將網路鉤子端點置於迴路介面、tailnet 或受信任的反向代理後方。

- 請使用專用的網路鉤子權杖；請勿重複使用閘道驗證權杖。
- 請將 `hooks.path` 保持在專用子路徑上；`/` 會遭拒絕。
- 請設定 `hooks.allowedAgentIds`，以限制網路鉤子可指定的實際代理，包括省略 `agentId` 時的預設代理。
- 除非需要讓呼叫端選擇工作階段，否則請保留 `hooks.allowRequestSessionKey=false`。
- 若啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制允許的工作階段金鑰格式。
- 網路鉤子承載資料預設會以安全界線包覆。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發條件連接至 OpenClaw。

<Note>
**必要條件：**`gcloud` 命令列介面、`gog`（gogcli）、已啟用 OpenClaw 網路鉤子，以及用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

此命令會寫入 `hooks.gmail` 設定、啟用 Gmail 預設組態，並將推送端點預設為 Tailscale Funnel（`--tailscale funnel|serve|off`）。

<Warning>
Gmail 預設組態的每封郵件工作階段會分隔對話脈絡；但不會限制目標代理的工具或工作區。若沒有設定 `agentId` 的自訂對應，Gmail 網路鉤子會以預設代理執行。

對於不受信任的收件匣，請將網路鉤子路由至專用的讀取代理，僅授予該代理唯讀工作區存取權，或完全不授予工作區存取權，並禁止檔案系統寫入、shell、瀏覽器及其他不必要的工具。若該代理需要通知主要代理，請只允許必要的代理間轉交。請參閱[提示詞注入](/zh-TW/gateway/security#prompt-injection)、[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)及 [`tools.agentToAgent`](/zh-TW/gateway/config-tools#toolsagenttoagent)。
</Warning>

### 閘道自動啟動

設定 `hooks.enabled=true` 和 `hooks.gmail.account` 後，閘道會在啟動時執行 `gog gmail watch serve`，並自動續訂監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇停用。

### 手動一次性設定

<Steps>
  <Step title="選取 GCP 專案">
    選取擁有 `gog` 所用 OAuth 用戶端的 GCP 專案：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="建立主題並授予 Gmail 推送存取權">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="啟動監看">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail 模型覆寫

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

對於不受信任的收件匣，請使用供應商提供的最新世代、最高等級模型。上述值僅為範例；該模型必須存在於你已設定的目錄與允許清單中。

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    triggers: {
      enabled: false,
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

在排程網路鉤子的 POST 中，`webhookToken` 會以 `Authorization: Bearer <token>` 傳送。

`cron.store` 是邏輯儲存區金鑰與 doctor 遷移路徑，並非可手動編輯的即時 JSON 檔案。工作資料儲存在 SQLite 中；請使用命令列介面或閘道 API 進行變更。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **單次重試**：暫時性錯誤（速率限制、過載、網路、逾時、伺服器錯誤）會使用內建的重試排程。永久性錯誤會立即停用工作。

    **週期性重試**：連續執行錯誤會依延長的排程進行退避（30s、60s、5m、15m、60m）。下一次成功執行後，退避會重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設為 `24h`，`false` 會停用）會清除隔離的執行工作階段項目。每個工作會在執行歷程中保留最新的 2000 筆終止狀態資料列；遺失的資料列仍保留其 24 小時清理期限。
  </Accordion>
  <Accordion title="舊版儲存區遷移">
    升級時，請執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並使用 `.migrated` 後綴重新命名。格式錯誤的工作資料列會從執行階段中略過，並複製到 `jobs-quarantine.json`，供日後修復或檢閱。
  </Accordion>
</AccordionGroup>

## 疑難排解

### 命令階梯

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="排程未觸發">
    - 檢查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 環境變數。
    - 確認閘道持續執行中。
    - 對於 `cron` 排程，請確認時區（`--tz`）是否與主機時區相符。
    - 執行輸出中的 `reason: not-due` 表示手動執行是使用 `openclaw cron run <jobId> --due` 檢查，而工作尚未到期。

  </Accordion>
  <Accordion title="排程已觸發但未傳送">
    - 傳送模式 `none` 表示不會有執行器的備援傳送。若有可用的聊天路由，代理仍可使用 `message` 工具直接傳送。
    - 傳送目標缺失或無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版工作中的 `delivery.to` 房間 ID 若為小寫，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將工作編輯為來自 Matrix 的確切 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳送遭認證資訊阻擋。
    - 若隔離執行只傳回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳送及備援佇列摘要路徑，因此不會有任何內容傳回聊天。
    - 若代理應自行傳訊息給使用者，請檢查工作是否有可用的路由（具有先前聊天的 `channel: "last"`，或明確的頻道／目標）。

  </Accordion>
  <Accordion title="排程或心跳偵測似乎阻止 /new 樣式的輪替">
    - 每日與閒置重設的新鮮度並非以 `updatedAt` 為基礎；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知及閘道簿記可能會更新工作階段資料列以供路由／狀態使用，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版資料列，若檔案仍可用，OpenClaw 可從逐字稿 JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未設定 `--tz` 的排程會使用閘道主機時區。
    - 未設定時區的 `at` 排程會視為 UTC。
    - 心跳偵測 `activeHours` 會使用已設定的時區解析方式。

  </Accordion>
</AccordionGroup>

## 相關內容

- [自動化](/zh-TW/automation) — 一覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作台帳
- [心跳偵測](/zh-TW/gateway/heartbeat) — 主要工作階段的週期性輪次
- [時區](/zh-TW/concepts/timezone) — 時區設定
