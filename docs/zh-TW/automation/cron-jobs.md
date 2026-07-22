---
read_when:
    - 排程背景工作或喚醒作業
    - 將外部觸發條件（網路鉤子、Gmail）連接至 OpenClaw
    - 在心跳偵測與排程之間選擇以執行排定的任務
sidebarTitle: Scheduled tasks
summary: 閘道排程器的排程工作、網路鉤子和 Gmail PubSub 觸發條件
title: 排程任務
x-i18n:
    generated_at: "2026-07-22T10:25:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c7556be1cd253fefc1844cb76fcef292dc5d8e9d082e8bda1fcc004ecfa0b49
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是閘道的內建排程器。它會持久保存工作、在正確時間喚醒代理程式，並可將輸出傳送到聊天頻道、網路鉤子，或不傳送到任何地方。

## 快速開始

<Steps>
  <Step title="新增一次性提醒">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "提醒" \
      --session main \
      --system-event "提醒：檢查 Cron 文件草稿" \
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
  <Step title="查看執行記錄">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 的運作方式

- Cron 在**閘道程序內**執行，而非在模型內。閘道必須持續執行，排程才會觸發。
- 工作定義、執行階段狀態和執行記錄會持久保存在 OpenClaw 的共用 SQLite 狀態資料庫中，因此重新啟動不會遺失排程。
- 每次 Cron 執行都會建立一筆[背景任務](/zh-TW/automation/tasks)記錄。
- 一次性工作（`--at`）預設會在成功後自動刪除；傳入 `--keep-after-run` 可保留工作。
- 每次執行的實際經過時間預算：設定時使用 `--timeout-seconds`。否則，隔離／分離式代理程式回合工作會由 Cron 自身的 60 分鐘監控機制限制，早於底層代理程式回合逾時（`agents.defaults.timeoutSeconds`，預設 48 小時）生效；命令工作預設為 10 分鐘，指令碼承載內容預設為 5 分鐘。
- 閘道啟動時，逾期的隔離代理程式回合工作會重新排程，而不會立即重播，避免模型／工具的啟動工作進入頻道連線時段。
- 如果你透過系統 Cron 或其他外部排程器驅動 `openclaw agent`，即使命令列介面已處理 `SIGTERM`/`SIGINT`，仍應以強制終止升級機制包裝。由閘道支援的執行會要求閘道中止已接受的執行；`--local` 執行也會收到相同的中止訊號。對於 GNU `timeout`，建議使用 `timeout -k 60 600 openclaw agent ...`，而非單純使用 `timeout 600 ...`——如果程序無法及時結束，`-k` 值就是最後的保障。對於 systemd 單元，請使用 `SIGTERM` 停止訊號並保留寬限期（`TimeoutStopSec`），之後才執行最終強制終止。在原始閘道執行仍處於作用中時重複使用 `--run-id`，會將重複項目回報為執行中，而不會啟動第二次執行。

<AccordionGroup>
  <Accordion title="隔離執行強化">
    - 隔離執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段中受追蹤的瀏覽器分頁／程序，並透過主工作階段和自訂工作階段執行所使用的相同共用拆卸路徑，處置為工作建立的任何內建 MCP 執行階段執行個體。清理失敗會被忽略，確保 Cron 結果仍具有優先權。
    - 具有有限 Cron 自我清理權限的隔離執行，可以讀取排程器狀態、僅包含自身工作的自我篩選清單，以及該工作的執行記錄，並且只能移除自己的工作。
    - 隔離執行會防止過時的確認回覆：如果第一個結果僅為暫時狀態更新（`on it`、`pulling everything together` 和類似提示），且沒有任何後代子代理程式仍負責最終答案，OpenClaw 會再提示一次以取得實際結果，然後才進行傳送。
    - 系統會辨識結構化的執行拒絕中繼資料（包括巢狀錯誤以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的節點主機 `UNAVAILABLE` 包裝器），因此受阻的命令不會被回報為成功執行，同時也不會將一般助理文字誤認為拒絕。
    - 即使沒有回覆承載內容，執行層級的代理程式失敗仍會計為工作錯誤，因此模型／提供者失敗會增加錯誤計數器並觸發失敗通知，而不會將工作清除為成功。
    - 當工作達到 `timeoutSeconds` 時，Cron 會中止執行並提供短暫的清理時段。如果執行未能結束，閘道所擁有的清理程序會在 Cron 記錄逾時前強制清除該次執行的工作階段擁有權，避免佇列中的聊天工作被卡在過時的處理中工作階段之後。
    - 設定／啟動停滯會套用階段專屬逾時（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。這些監控機制即使在外部命令列介面程序啟動前，也會涵蓋內嵌和由命令列介面支援的提供者，並且獨立於較長的 `timeoutSeconds` 值設定上限，使冷啟動／驗證／情境失敗能快速浮現。

  </Accordion>
  <Accordion title="任務協調">
    Cron 任務協調首先以執行階段擁有權為準，其次才以持久記錄為依據：只要 Cron 執行階段仍將該工作追蹤為執行中，作用中的 Cron 任務就會保持作用中，即使舊的子工作階段資料列仍然存在。當執行階段不再擁有該工作，且 5 分鐘寬限期到期後，維護檢查會針對相符的 `cron:<jobId>:<startedAt>` 執行，檢查持久保存的執行記錄和工作狀態。若其中有終止結果，就會完成任務帳本；否則，由閘道擁有的維護程序可將任務標記為 `lost`。離線命令列介面稽核可以從持久記錄復原，但其自身空白的程序內作用中工作集合，並不能證明由閘道擁有的執行已不存在。
  </Accordion>
</AccordionGroup>

## 排程類型

| 類型      | 命令列介面旗標           | 說明                                                                                              |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`             | 一次性時間戳記（ISO 8601，或如 `20m` 的相對時間）                                                     |
| `every`   | `--every`          | 固定間隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`           | 5 欄位或 6 欄位的 Cron 運算式，可選用 `--tz`                                                  |
| `on-exit` | `--on-exit`        | 受監看命令結束時觸發一次（事件觸發器；回合拆卸後仍保留；可選用 `--on-exit-cwd`） |
| `stream`  | `--stream-command` | 由受監督的長時間執行命令所產生的批次行觸發                                      |

不含時區的時間戳記會視為 UTC。加入 `--tz America/New_York`，即可在該 IANA 時區中解讀不含時差的 `--at` 日期時間，或評估 Cron 運算式。不含 `--tz` 的 Cron 運算式會使用閘道主機的時區。`--tz` 不可與 `--every` 或 `--on-exit` 搭配使用。

每小時整點重複執行的運算式（分鐘為 `0`，且小時欄位為萬用字元）會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 可強制精確計時，或使用 `--stagger 30s` 指定明確時段（僅限 Cron 排程）。

### 串流來源

串流排程會在閘道下持續執行由操作人員編寫的 argv 命令，並根據其 stdout 和 stderr 行觸發工作。串流排程由事件驅動，絕不會因時間到期而執行，且需要 `cron.triggers.enabled: true`，因為長時間執行的命令與觸發器指令碼具有相同的無人值守信任等級。停用或移除工作會停止程序；閘道關閉時會等待程序樹完成拆卸。快速失敗會使用 Cron 內建的錯誤退避重新啟動。若連續五次執行皆短於 60 秒，工作會維持錯誤狀態並使用一般失敗警示路徑；請手動重新啟用工作以清除重新啟動上限。

```bash
openclaw cron add \
  --name "建置事件串流" \
  --stream-command '["node","scripts/build-events.mjs"]' \
  --stream-mode match \
  --stream-match '^(failed|recovered):' \
  --stream-batch-ms 250 \
  --session isolated \
  --message "調查這些建置事件。"
```

`mode: "line"`（預設值）接受每一行。`mode: "match"` 僅接受符合已編譯 `match` 規則運算式的行。批次會在靜默 `batchMs` 後關閉（預設 250 ms，限制為 50–5000），或在達到 `maxBatchBytes` 時關閉（預設 16384，限制為 1024–65536）。達到位元組上限時，批次會以 `[truncated]` 結尾。比對模式一律以完整文字評估完整行，即使超過 `maxBatchBytes` 也是如此（只有傳送的批次會被截斷）；在有界原始輸入上限處被切斷的行僅為前綴，因此會被視為不相符，避免以結尾錨定的模式在截斷處觸發。批次會附加到系統事件文字或代理程式回合訊息。串流排程會拒絕命令承載內容，因為來源命令和承載內容命令的程序擁有權會產生歧義。

每個工作僅保留一次承載內容觸發和一個有界待處理批次。承載內容執行期間，或內建 30 秒觸發間隔尚未經過前到達的行，會合併至該待處理批次，而不會形成無界佇列。單一序列化擁有者會在 `streamDroppedBatches` 中記錄閘門捨棄、承載內容錯誤，以及未執行時的分派；有界合併會遞增 `streamCoalescedBatches`。失敗的承載內容不會重試，因為它們可能不具冪等性。邏輯來源身分會在受監督子程序重新啟動時保持穩定，但會在來源遭停用、移除或取代時輪替，因此已淘汰來源的佇列批次即使經過 A 到 B 再到 A 的編輯，也無法觸發。停止完成後，舊子程序的延遲回呼不會產生作用。V1 不包含原生 WebSocket 來源；請使用 argv 命令（例如 `websocat wss://example.invalid/events`）進行橋接。

當串流工作也具有 `trigger.script` 時，閘門會針對每個關閉的批次執行一次。目前批次可作為深度凍結的 `trigger.streamBatch` 字串使用，並與 `trigger.state` 並存。`fire: false` 會在持久保存閘門狀態後捨棄該批次。`fire: true` 會保留現有的觸發訊息語意，再將批次附加到產生的承載內容。串流工作也可以改用不含條件閘門的指令碼承載內容；該指令碼會透過相同的 `trigger.streamBatch` 值接收批次。系統會拒絕將指令碼承載內容與條件閘門合併使用，因為兩者都會擁有持久保存的 `trigger.state` 欄位。

### 動態頻率（節奏控制）

重複工作可以將 `pacing.min` 和／或 `pacing.max` 設為 `15m` 或 `4h` 等持續時間字串；至少需要一個界限。將 `--pacing-min` 和 `--pacing-max` 與 `cron add|edit` 搭配使用（`--clear-pacing` 會移除兩個界限）。

在隔離執行期間，具有節奏控制的工作可以使用 `action: "next_check"` 和 `in: "30m"` 呼叫 `cron` 工具。提議僅適用於目前正在執行的工作，並從成功執行完成時計算。OpenClaw 會自動將其限制在設定的界限內。

未提出提議的節奏控制不會變更一般排程。失敗、逾時和略過的執行會捨棄提議，因此現有的重試和錯誤退避行為具有優先權。手動強制執行重複工作屬於頻帶外操作，並會保留其待處理的自然或節奏控制時段。對於條件觸發的工作，即使提議要求更早檢查，內建最小間隔仍是下限。

### 每月日期與每週日期使用 OR 邏輯

Cron 運算式由 [croner](https://github.com/Hexagon/croner) 剖析。當每月日期和每週日期欄位都不是萬用字元時，只要**任一**欄位相符，croner 就會視為相符，而非要求兩者皆相符。這是標準 Vixie Cron 行為。

```bash
# 預期：「每月 15 日上午 9 點，但僅限星期一」
# 實際：「每月 15 日上午 9 點，以及每個星期一上午 9 點」
0 9 15 * 1
```

這大約每月會觸發 5-6 次，而不是每月 0-1 次。若要同時要求兩個條件，請使用 croner 的 `+` 星期修飾符（`0 9 15 * +1`），或依其中一個欄位排程，並在工作的提示詞或命令中檢查另一個欄位。

## 事件觸發器（條件監看器）

事件觸發器會將無介面的條件指令碼加入 `every`、`cron` 或 `stream` 排程。時間排程會在到期時評估它；串流排程則會針對每個已關閉的批次評估它。只有當指令碼傳回 `fire: true` 時，排程才會執行一般酬載：

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 僅在觀察到的狀態與上次評估不同時觸發。
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI：${trigger.state?.status ?? '未知'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "調查 CI 狀態變更。" },
}
```

指令碼必須傳回 `{ fire, message?, state? }`。先前的 JSON 狀態可透過深度凍結的 `trigger.state` 取得；串流閘門也會透過 `trigger.streamBatch` 接收目前批次。傳回新的 `state` 值以保存它。狀態上限為 16 KB。當觸發結果包含 `message` 時，排程會在執行前將其附加至系統事件文字或代理程式回合訊息。`once: true` 會在工作第一次成功執行已觸發的酬載後停用該工作。

`fire: false` 會保存評估狀態與計數器，然後重新排程，而不建立執行歷程記錄。如果已觸發的酬載執行失敗，傳回的 `state` **不會**保存——下一次評估會看到先前的狀態，且可能再次觸發，因此應將指令碼撰寫為唯讀檢查，並將動作保留在酬載中。觸發器排程內建的最短間隔為 30 秒。每次評估有 30 秒的實際經過時間預算，最多可呼叫工具 5 次。

監看器應以**可採取行動的狀態**為核心，而不只是成功狀態：如果檢查失敗或逾時後監看器便停止發出訊息，它在故障時仍會看似正常。請將觀察結果與 `trigger.state` 比較，並傳回新狀態以去除重複；不要依賴模型或程序記憶體。觸發時，請確保 `message` 本身資訊完整，因為它會成為已觸發執行的完整事件情境。

<Warning>
啟用 `cron.triggers.enabled` 後，條件觸發器指令碼與 `script` 酬載都可以使用所屬代理程式的**完整工具政策（包括 `exec`）**進行無介面執行。請將此視為使用該代理程式權限的無人值守程式碼執行；除非所有獲准建立排程工作的代理程式都具有相應的可信度，否則請保持停用。
</Warning>

從本機指令碼檔案建立監看器（`-` 會從標準輸入讀取指令碼）：

```bash
openclaw cron add \
  --name "PR CI 監看器" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "回應 CI 狀態變更" \
  --session isolated
```

## 酬載

每項工作都只會攜帶一種由旗標選擇的酬載類型：

| 酬載          | 旗標                                           | 執行內容                                                   |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| 系統事件      | `--system-event <text>`                        | 加入主工作階段的佇列，本身不呼叫模型                       |
| 代理程式訊息  | `--message <text>`                             | 由模型支援的代理程式回合                                   |
| 命令          | `--command <shell>` 或 `--command-argv <json>` | 閘道主機上的殼層／程序，不呼叫模型                         |
| 指令碼        | `--script <file\|->`                           | 使用所屬代理程式工具的無介面程式碼模式指令碼               |

### 代理程式回合選項

<ParamField path="--message" type="string" required>
  提示詞文字（隔離／目前／自訂工作階段工作必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；必須解析為允許的模型，否則執行會因驗證錯誤而失敗。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每項工作的備援模型清單，例如 `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`。傳入 `--fallbacks ""` 可進行沒有備援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 上，移除每項工作的備援覆寫，使工作遵循已設定的備援優先順序。不能與 `--fallbacks` 結合使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 上，移除每項工作的模型覆寫，使工作遵循一般排程模型優先順序（已儲存的排程工作階段覆寫，否則為代理程式／預設模型）。不能與 `--model` 結合使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。可用層級仍取決於所選模型和代理程式執行階段。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 上，移除每項工作的思考覆寫。不能與 `--thinking` 結合使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用的工具，例如 `--tools exec,read`。
</ParamField>

可執行工具的新工作一律會儲存明確的工具政策。由代理程式建立的工作，
其工具上限為建立該工作之回合可用的工具，且代理程式無法擴大
已儲存的清單。經驗證的操作員在未使用 `--tools` 時建立的工作，會儲存
不受限制的 `*` 政策；`cron edit --clear-tools` 會還原該明確的不受限制
政策。在明確工具政策推出前建立的現有工作會保留目前行為，
直到明確編輯其工具政策或重新建立工作為止。

`--model` 會設定工作的主要模型；它不會取代工作階段的 `/model` 覆寫，因此已設定的備援鏈仍會套用於其上。無法解析或不允許的模型會使執行因明確的驗證錯誤而失敗，而不會無聲地備援至預設值。如果工作具有 `--model`，但沒有明確或已設定的備援清單，OpenClaw 會傳遞空的備援覆寫，而不會無聲地將代理程式主要模型附加為隱藏的重試目標。

隔離工作的模型選擇優先順序如下，由高至低：

1. 每項工作酬載的 `model`（明確設定；不允許的模型會使執行失敗）
2. Gmail 鉤子的模型覆寫（僅限執行來自 Gmail 且允許該覆寫時）
3. 使用者選取且已儲存的排程工作階段模型覆寫
4. 代理程式／預設模型選擇

快速模式會遵循已解析的即時選擇。如果所選模型設定具有 `params.fastMode`，隔離排程預設會使用它；已儲存的工作階段 `fastMode` 覆寫（其次為代理程式 `fastModeDefault`）在任一方向上仍優先於模型設定。自動模式使用模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果執行遇到即時模型切換交接，排程會使用切換後的供應商／模型重試，並為目前執行保存該選擇（以及任何新的驗證設定檔）。重試次數有限：初次嘗試加上 2 次切換重試後，排程會中止，而不會持續循環。

隔離執行開始前，OpenClaw 會檢查已設定之 `api: "ollama"` 和 `api: "openai-completions"` 供應商的可連線本機端點，其 `baseUrl` 為迴路位址、私人網路或 `.local`。此前置檢查會走訪工作的已設定備援鏈，且只有在每個候選項目皆無法連線時，才會將執行標記為 `skipped`；`--fallbacks ""` 會將走訪嚴格限制為主要模型。端點停機時，會以明確錯誤將執行記錄為 `skipped`，而不會開始模型呼叫。結果會依端點快取 5 分鐘（不是依工作或模型），因此許多共用同一個已停機本機 Ollama/vLLM/SGLang/LM Studio 伺服器的到期工作只需一次探測，而不會造成請求風暴。略過的前置檢查執行不會增加執行錯誤的退避計數；設定 `failureAlert.includeSkipped` 可選擇接收重複的略過警示。

### 命令酬載

命令酬載會在閘道排程器內執行確定性指令碼，而不會啟動由模型支援的回合。它們會在閘道主機上執行、擷取標準輸出／標準錯誤、將執行記錄在排程歷程中，並重複使用與代理程式回合工作相同的 `announce`、`webhook` 和 `none` 傳遞模式。

<Note>
命令排程是操作員管理的閘道自動化介面，而不是代理程式的 `tools.exec` 呼叫。建立、更新、移除或手動執行排程工作需要 `operator.admin`；排定的命令之後會在閘道程序內，作為該管理員撰寫的自動化來執行。代理程式執行政策（`tools.exec.mode`、核准提示、每個代理程式的工具允許清單）管理模型可見的執行工具，而不是命令排程酬載。
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "佇列深度探測" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不經殼層剖析的情況下精確執行 argv。選用的 `--command-env KEY=VALUE`（可重複）、`--command-input`、`--timeout-seconds`（預設 10 分鐘）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 可控制程序環境、標準輸入和輸出界限。

傳遞的文字取自程序輸出：非空白的標準輸出優先；如果標準輸出為空白而標準錯誤非空白，則傳遞標準錯誤；如果兩者皆有，排程會傳送一小段 `stdout:`／`stderr:` 區塊。結束代碼 `0` 會將執行記錄為 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄為 `error`，並可能觸發失敗警示。只輸出 `NO_REPLY` 的命令會使用一般排程靜默權杖抑制機制，不會將任何內容回傳至聊天。

### 指令碼酬載

指令碼酬載會在與觸發器指令碼相同的程式碼模式執行器中以無介面方式執行，而不會啟動對話式代理程式回合。建立或執行前請先啟用 `cron.triggers.enabled`；這個危險自動化閘門同時涵蓋觸發器指令碼與指令碼酬載。指令碼工作僅支援 `main` 和 `isolated` 工作階段目標。

```bash
openclaw cron create "0 * * * *" \
  --name "每小時佇列檢查" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

使用 `--script <file|->` 可從檔案或標準輸入讀取 JavaScript。逾時預設為 300 秒，上限為 900 秒；工具預算預設為 50 次呼叫，上限為 200 次。這些酬載預算與較小的觸發閘門評估預算分開計算。

指令碼可以傳回包含下列選用欄位的物件：

- `notify`：透過工作的 `announce`、`webhook` 或 `none` 傳遞模式傳送的文字。若省略，則不會傳遞任何內容。對於 `main` 工作，文字會成為系統事件。
- `wake`：`"now"` 會要求在將 `notify` 加入佇列後立即執行心跳偵測（或精簡的完成事件）；`"next-heartbeat"` 會將事件加入佇列，供下一次心跳偵測處理。
- `state`：JSON 狀態，上限為 16 KB，且僅在成功執行後持久保存。下一次執行會以 `trigger.state` 接收其凍結副本，與觸發指令碼一致。由於該命名空間只有一個持久保存擁有者，因此同一工作無法同時結合指令碼承載資料與條件觸發器。
- `nextCheck`：如 `"15m"` 的持續時間。僅適用於已啟用節奏控制的工作，並使用與代理回合提案相同的節奏限制。

擲出例外、逾時、工具預算耗盡、無效結果，以及未啟用節奏控制時的 `nextCheck`，皆屬正常的排程執行錯誤：它們會進入執行歷程、退避與失敗警示處理流程，而不會持久保存傳回的狀態。

## 執行方式

| 方式           | `--session` 值   | 執行位置                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 專用排程喚醒通道 | 提醒、系統事件        |
| 隔離            | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時綁定   | 能感知情境的週期性工作    |
| 自訂工作階段  | `session:custom-id` | 持久命名工作階段 | 以歷程為基礎持續進行的工作流程 |

<AccordionGroup>
  <Accordion title="主要工作階段、隔離工作階段與自訂工作階段的比較">
    **主要工作階段**工作會將系統事件加入排程所擁有的執行通道，並選擇性喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主要工作階段的最新傳遞情境來回覆，但不會將例行排程回合附加至真人聊天通道，也不會延長目標工作階段的每日／閒置重設有效期。**隔離**工作會使用全新的工作階段執行專用的代理回合。**自訂工作階段**（`session:xxx`）會跨執行持續保留情境，從而支援每日站立會議等以先前摘要為基礎持續進行的工作流程。

    主要工作階段的排程事件是自成一體的系統事件提醒。它們不會自動包含預設心跳偵測提示中的「讀取 HEARTBEAT.md」指示；如果提醒應查閱 `HEARTBEAT.md`，請在排程事件文字中明確說明。

  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」代表什麼">
    每次執行都使用新的逐字稿／工作階段 ID。OpenClaw 會保留安全偏好設定（思考／快速／詳細程度設定、標籤、使用者明確選取的模型／驗證覆寫），但不會從較舊的排程資料列繼承周遭對話情境：頻道／群組路由、傳送或佇列政策、權限提升、來源或 ACP 執行階段綁定。當週期性工作應刻意以相同對話情境為基礎持續進行時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="無人值守執行契約">
    隔離排程與鉤子代理回合明確採無人值守方式執行：沒有人可以提供釐清或核准。最終回覆必須是可交付成果，而不是計畫、確認訊息或輸入請求。若無需執行任何操作，代理會傳回 `HEARTBEAT_OK`，並明確陳述失敗情況；排程負責重試與失敗警示政策。

    對於受信任的排程工作，若工作本身的指示刻意要求提出問題或提供計畫，則以該指示為準；代理也可以移除不再需要的工作。外部鉤子回合只會收到通用的無人值守契約；跨越外部內容邊界時，它們不會收到該覆寫或自行移除指引。

  </Accordion>
  <Accordion title="子代理與 Discord 傳遞">
    當隔離排程執行協調子代理時，傳遞會優先採用最終子代輸出，而非過時的父層暫時文字。如果子代仍在執行，OpenClaw 會抑制該部分父層更新，而不予公告。

    對於純文字 Discord 公告目標，OpenClaw 只會傳送一次標準最終助理文字，而不會同時重播串流／中間文字與最終答案。媒體和結構化 Discord 承載資料仍會分別傳遞，以免遺漏附件與元件。

  </Accordion>
</AccordionGroup>

## 傳遞與輸出

| 模式       | 結果                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 若代理未傳送，則將最終文字以備援方式傳遞至目標 |
| `webhook`  | 將完成事件承載資料以 POST 傳送至 URL                                |
| `none`     | 不由執行器進行備援傳遞                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳遞。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 所擁有的 `-1001234567890:123` 簡寫。直接 RPC／設定呼叫端可以字串或數字形式傳入 `delivery.threadId`。Slack／Discord／Mattermost 目標使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 聊天室 ID 區分大小寫；請使用確切的聊天室 ID，或 Matrix 提供的 `room:!room:server` 格式。

當公告傳遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這樣帶有提供者前綴的目標，可以在排程回退至工作階段歷程或單一已設定頻道之前選取頻道。只有已載入外掛宣告的前綴才是提供者選擇器。若明確指定 `delivery.channel`，目標前綴必須指向相同的提供者；使用 `channel: "whatsapp"` 搭配 `to: "telegram:123"` 會遭拒絕，而不會讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍屬頻道所擁有的目標語法，而非提供者選擇器。

對於隔離工作，聊天傳遞是共用的：若有可用的聊天路由，即使使用 `--no-deliver`，代理仍可使用 `message` 工具。若代理傳送至已設定／目前目標，OpenClaw 會略過備援公告。否則，`announce`、`webhook` 與 `none` 只會控制代理回合結束後，執行器如何處理最終回覆。

當代理從進行中的聊天建立隔離提醒時，OpenClaw 會保存保留的即時傳遞目標，以供備援公告路由使用。內部工作階段索引鍵可能為小寫；若目前聊天情境可用，則不會從這些索引鍵重新建構提供者傳遞目標。

隱含公告傳遞會使用已設定的頻道允許清單來驗證過時目標並重新路由。私訊配對儲存區中的核准項目不是備援自動化收件者；當排程工作應主動傳送至私訊時，請設定 `delivery.to`，或設定頻道的 `allowFrom` 項目。

### 失敗通知

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 針對個別工作覆寫該設定。
- 若兩者皆未設定，且工作已透過 `announce` 傳遞，失敗通知會回退至該主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非主要傳遞模式為 `webhook`。
- `failureAlert.includeSkipped: true` 讓個別工作或全域排程警示政策選擇啟用重複的略過執行警示。略過的執行會保有獨立的連續略過計數器，因此不會影響執行錯誤的退避處理。
- `openclaw cron edit` 提供個別工作的警示調整設定：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 與 `--failure-alert-account-id`。

### 輸出語言

排程工作不會從頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放入排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "摘要更新內容。以中文回覆；URL、程式碼及產品名稱保持不變。"
```

對於範本檔案，請將語言指示保留在算繪後的提示中，並在工作執行前確認 `{{language}}` 等預留位置已填入內容。如果輸出混合多種語言，請明確指定規則，例如：「敘述文字使用中文，技術術語保留英文。」

## 命令列介面範例

<Tabs>
  <Tab title="單次提醒">
    ```bash
    openclaw cron add \
      --name "檢查行事曆" \
      --at "20m" \
      --session main \
      --system-event "下一次心跳偵測：檢查行事曆。" \
      --wake now
    ```
  </Tab>
  <Tab title="週期性隔離工作">
    ```bash
    openclaw cron create "0 7 * * *" \
      "摘要隔夜更新。" \
      --name "晨間簡報" \
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
# 列出已啟用的工作
openclaw cron list

# 包含已停用的工作
openclaw cron list --all

# 以 JSON 取得一個已儲存的工作
openclaw cron get <jobId>

# 顯示一個工作，包括解析後的傳遞路由
openclaw cron show <jobId>

# 啟用／停用而不刪除
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# 編輯工作
openclaw cron edit <jobId> --message "更新後的提示" --model "opus"

# 立即強制執行工作
openclaw cron run <jobId>

# 立即強制執行工作，並等待其終止狀態
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 僅在到期時執行
openclaw cron run <jobId> --due

# 檢視執行歷程
openclaw cron runs --id <jobId> --limit 50

# 檢視一筆確切的執行
openclaw cron runs --id <jobId> --run-id <runId>

# 刪除工作
openclaw cron remove <jobId>

# 選取代理（多代理設定）
openclaw cron create "0 6 * * *" "檢查營運佇列" --name "營運巡查" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

封存工作階段（透過控制介面，或由操作員管理員呼叫端使用 `sessions.patch { archived: true }`）會停用綁定至該工作階段的所有已啟用排程工作：其隔離的 `cron:<jobId>` 工作階段、`session:<key>` 目標，或傳遞／喚醒 `sessionKey` 通道。還原工作階段不會重新啟用這些工作；請使用 `openclaw cron enable <jobId>`。具有已啟用綁定工作的工作階段會在控制介面側邊欄顯示時鐘徽章。

`openclaw cron run <jobId>` 會在將手動執行排入佇列後返回。對於關機掛鉤、維護指令碼，或其他必須封鎖直到排入佇列的執行完成為止的自動化，請使用 `--wait`；它會輪詢返回的 `runId`（預設逾時 `10m`、輪詢間隔 `2s`），狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時則以非零值結束。

代理程式的 `cron` 工具會從 `cron(action: "list")` 返回精簡的工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；若要取得一份完整的工作定義，請使用 `cron(action: "get", jobId: "...")`。直接呼叫閘道的用戶端可將 `compact: true` 傳給 `cron.list`；省略此項會保留包含傳遞預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名。新工作可使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後接位置式代理程式提示詞。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，可將完成後的執行承載資料以 POST 傳送到 HTTP 端點；網路鉤子傳遞不能與聊天傳遞旗標（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）併用。在 `cron edit`、`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 上，這些路由欄位會個別取消設定（每一項若與對應的設定旗標同時使用都會遭拒）——這與 `--no-deliver` 不同，後者只會停用執行器的備援傳遞。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作選取的模型。
- 如果模型在允許範圍內，該確切的供應商／模型會用於隔離的代理程式執行。
- 如果模型不在允許範圍內或無法解析，排程會以明確的驗證錯誤讓執行失敗。
- API `cron.update` 承載資料修補可將 `model: null` 設為清除已儲存的工作模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 併用。
- 設定的備援鏈仍然適用，因為排程的 `--model` 是工作的主要模型，而不是工作階段的 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定承載資料的 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援，使執行採用嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除每項工作的覆寫。
- 若單獨使用 `--model`，且沒有明確或已設定的備援清單，就不會悄悄轉而將代理程式的主要模型作為額外重試目標。

</Note>

## 網路鉤子

閘道可公開 HTTP 網路鉤子端點，供外部觸發器使用。在設定中啟用：

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

每個請求都必須透過標頭包含掛鉤權杖：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

查詢字串權杖會遭拒。

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

    欄位：`message`（必填）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應掛鉤（POST /hooks/<name>）">
    自訂掛鉤名稱會透過設定中的 `hooks.mappings` 解析。對應項目可使用範本或程式碼轉換，將任意承載資料轉換成 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將掛鉤端點置於回送介面、tailnet 或受信任的反向 Proxy 後方。

- 請使用專用的掛鉤權杖；不要重複使用閘道驗證權杖。
- 請將 `hooks.path` 保持在專用子路徑上；`/` 會遭拒。
- 設定 `hooks.allowedAgentIds`，以限制掛鉤可指定的有效代理程式，包括省略 `agentId` 時的預設代理程式。
- 除非需要由呼叫端選取工作階段，否則請保留 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制允許的工作階段金鑰格式。
- 掛鉤承載資料預設會以安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接到 OpenClaw。

<Note>
**先決條件：**`gcloud` 命令列介面、`gog`（gogcli）、已啟用 OpenClaw 掛鉤，以及供公開 HTTPS 端點使用的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並預設使用 Tailscale Funnel 作為推送端點（`--tailscale funnel|serve|off`）。

<Warning>
Gmail 預設集的每封郵件工作階段會分隔對話脈絡；它不會限制目標代理程式的工具或工作區。如果沒有設定 `agentId` 的自訂對應，Gmail 掛鉤會以預設代理程式執行。

對於不受信任的收件匣，請將掛鉤路由到專用的讀取代理程式，僅授予該代理程式唯讀工作區存取權或完全不授予工作區存取權，並拒絕檔案系統寫入、Shell、瀏覽器及其他不必要的工具。如果它需要通知主要代理程式，只允許必要的代理程式間交接。請參閱[提示詞注入](/zh-TW/gateway/security#prompt-injection)、[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)和 [`tools.agentToAgent`](/zh-TW/gateway/config-tools#toolsagenttoagent)。
</Warning>

### 閘道自動啟動

設定 `hooks.enabled=true` 和 `hooks.gmail.account` 後，閘道會在啟動時啟動 `gog gmail watch serve`，並自動續期監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇停用。

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

對於不受信任的收件匣，請使用供應商所提供最新一代、最高等級的模型。上述值僅為範例；該模型必須存在於你設定的目錄和允許清單中。

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

`webhookToken` 會在排程網路鉤子的 POST 中作為 `Authorization: Bearer <token>` 傳送。

`cron.store` 是邏輯儲存區金鑰和 doctor 遷移路徑，而不是可手動編輯的即時 JSON 檔案。工作資料存放於 SQLite；請使用命令列介面或閘道 API 進行變更。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **單次工作重試**：暫時性錯誤（速率限制、過載、網路、逾時、伺服器錯誤）會使用內建的重試排程。永久性錯誤會立即停用工作。

    **週期性工作重試**：連續執行錯誤會依延長的排程進行指數退避（30s、60s、5m、15m、60m）。下次成功執行後，退避會重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`，`false` 會停用）會修剪隔離的執行工作階段項目。執行歷程會為每項工作保留最新的 2000 筆終止狀態資料列；遺失的資料列仍保留其 24 小時清理時間窗。
  </Accordion>
  <Accordion title="舊版儲存區遷移">
    升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的工作資料列會從執行階段略過，並複製到 `jobs-quarantine.json`，以供日後修復或審查。
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
    - 確認閘道持續執行。
    - 對於 `cron` 排程，請確認時區（`--tz`）是否與主機時區相符。
    - 執行輸出中的 `reason: not-due` 表示以 `openclaw cron run <jobId> --due` 檢查手動執行時，該工作尚未到期。

  </Accordion>
  <Accordion title="排程已觸發但未傳遞">
    - 傳遞模式 `none` 表示不應有執行器備援傳送。當有可用的聊天路由時，代理程式仍可使用 `message` 工具直接傳送。
    - 傳遞目標缺失／無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版工作若使用小寫的 `delivery.to` 聊天室 ID，可能會失敗，因為 Matrix 聊天室 ID 區分大小寫。請將工作編輯為 Matrix 中確切的 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞遭認證資訊封鎖。
    - 如果隔離執行只返回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳遞和備援的佇列摘要路徑，因此不會將任何內容傳回聊天。
    - 如果代理程式應自行傳訊息給使用者，請檢查工作是否具有可用路由（具有先前聊天的 `channel: "last"`，或明確的頻道／目標）。

  </Accordion>
  <Accordion title="排程或心跳偵測似乎會阻止 /new 樣式的輪替">
    - 每日與閒置重設的新鮮度並非以 `updatedAt` 為依據；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知與閘道簿記可能會更新用於路由／狀態的工作階段資料列，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版資料列，如果檔案仍然可用，OpenClaw 可以從逐字稿 JSONL 的工作階段標頭中復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未指定 `--tz` 的排程會使用閘道主機的時區。
    - 未指定時區的 `at` 排程會視為 UTC。
    - 心跳偵測 `activeHours` 會使用已設定的時區解析方式。

  </Accordion>
</AccordionGroup>

## 相關內容

- [自動化](/zh-TW/automation) — 一覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作帳本
- [心跳偵測](/zh-TW/gateway/heartbeat) — 定期執行的主要工作階段輪次
- [時區](/zh-TW/concepts/timezone) — 時區設定
