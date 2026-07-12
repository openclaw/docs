---
read_when:
    - 排程背景工作或喚醒作業
    - 將外部觸發來源（網路鉤子、Gmail）連接至 OpenClaw
    - 在心跳偵測與排程之間選擇執行排定的任務
sidebarTitle: Scheduled tasks
summary: 閘道排程器的排程工作、網路鉤子與 Gmail PubSub 觸發條件
title: 排程任務
x-i18n:
    generated_at: "2026-07-12T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dc6ac442b03f892b916cf04695b770bc86ee6b00978b95ffaeb8e6480f5b8af6
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是閘道內建的排程器。它會持久保存工作、在正確時間喚醒代理，並可將輸出傳送至聊天頻道、網路鉤子，或不傳送至任何地方。

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

- Cron 在**閘道程序內部**執行，而非在模型內部。閘道必須處於執行狀態，排程才會觸發。
- 工作定義、執行階段狀態及執行歷程會持久保存於 OpenClaw 的共用 SQLite 狀態資料庫，因此重新啟動不會遺失排程。
- 每次 Cron 執行都會建立一筆[背景任務](/zh-TW/automation/tasks)記錄。
- 單次工作（`--at`）預設會在成功後自動刪除；傳入 `--keep-after-run` 可保留工作。
- 每次執行的實際經過時間預算：設定時使用 `--timeout-seconds`。否則，隔離／分離式代理回合工作會受到 Cron 自身 60 分鐘監控機制的限制，早於底層代理回合逾時（`agents.defaults.timeoutSeconds`，預設 48 小時）生效；命令工作預設為 10 分鐘。
- 閘道啟動時，逾期的隔離式代理回合工作會重新排程，而不會立即重播，以免模型／工具啟動工作進入頻道連線時段。
- 如果你透過系統 Cron 或其他外部排程器驅動 `openclaw agent`，即使命令列介面已處理 `SIGTERM`／`SIGINT`，仍應以強制終止升級機制包裝它。由閘道支援的執行會要求閘道中止已接受的執行；本機與嵌入式備援執行則會收到相同的中止訊號。若使用 GNU `timeout`，請優先使用 `timeout -k 60 600 openclaw agent ...`，而不是單純的 `timeout 600 ...`——如果程序無法及時完成收尾，`-k` 值就是最後的保障。若使用 systemd 單元，請使用 `SIGTERM` 停止訊號並保留寬限時間（`TimeoutStopSec`），之後才進行最終強制終止。若原始閘道執行仍在進行中時重複使用 `--run-id`，系統會將重複項目回報為執行中，而非啟動第二次執行。

<AccordionGroup>
  <Accordion title="隔離式執行強化">
    - 隔離式執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁／程序，並透過主要工作階段和自訂工作階段執行所使用的相同共用拆卸路徑，處置為該工作建立的任何內建 MCP 執行階段執行個體。系統會忽略清理失敗，確保 Cron 結果仍具有優先權。
    - 具有狹義 Cron 自我清理授權的隔離式執行，可以讀取排程器狀態、僅包含其自身工作的自我篩選清單，以及該工作的執行歷程，且只能移除其自身工作。
    - 隔離式執行會防範過時的確認回覆：如果第一個結果只是暫時性狀態更新（`on it`、`pulling everything together` 及類似提示），且沒有任何後代子代理仍負責最終答案，OpenClaw 會再次提示一次以取得實際結果，再進行傳送。
    - 系統會辨識結構化的執行拒絕中繼資料（包括巢狀錯誤以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的節點主機 `UNAVAILABLE` 包裝），使遭封鎖的命令不會被回報為成功執行，同時也不會將一般助理文字誤認為拒絕。
    - 即使沒有回覆承載資料，執行層級的代理失敗仍會計為工作錯誤，因此模型／提供者失敗會增加錯誤計數器並觸發失敗通知，而非將工作清除為成功。
    - 當工作達到 `timeoutSeconds` 時，Cron 會中止執行並給予短暫的清理時段。如果執行未能完成收尾，閘道所擁有的清理程序會在 Cron 記錄逾時之前，強制清除該執行的工作階段擁有權，以免佇列中的聊天工作卡在過時的處理中工作階段之後。
    - 設定／啟動停滯會套用階段專屬逾時（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。即使外部命令列介面程序尚未啟動，這些監控機制仍會涵蓋嵌入式及命令列介面支援的提供者，且其上限獨立於較長的 `timeoutSeconds` 值，因此冷啟動／驗證／情境失敗可迅速浮現。

  </Accordion>
  <Accordion title="任務協調">
    Cron 任務協調會先以執行階段為依據，其次才以持久歷程為依據：只要 Cron 執行階段仍將該工作追蹤為執行中，即使舊的子工作階段資料列仍然存在，作用中的 Cron 任務仍會保持有效。執行階段停止擁有該工作且 5 分鐘寬限期屆滿後，維護檢查會針對相符的 `cron:<jobId>:<startedAt>` 執行，檢查持久保存的執行記錄及工作狀態。其中的終止結果會完成任務帳本；否則，由閘道擁有的維護程序可將任務標記為 `lost`。離線命令列介面稽核可以從持久歷程復原，但它在自身程序內的作用中工作集合為空，並不足以證明閘道擁有的執行已消失。
  </Accordion>
</AccordionGroup>

## 排程類型

| 類型      | 命令列介面旗標 | 說明                                                                                                     |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 單次時間戳記（ISO 8601 或如 `20m` 的相對時間）                                                           |
| `every`   | `--every`   | 固定間隔（`10m`、`1h`、`1d`）                                                                           |
| `cron`    | `--cron`    | 5 欄位或 6 欄位的 Cron 運算式，可選用 `--tz`                                                             |
| `on-exit` | `--on-exit` | 受監看命令結束時觸發一次（事件觸發器；回合拆卸後仍會保留；可選用 `--on-exit-cwd`）                        |

沒有時區的時間戳記會視為 UTC。加入 `--tz America/New_York`，即可使用該 IANA 時區解讀不含時差的 `--at` 日期時間，或評估 Cron 運算式。未使用 `--tz` 的 Cron 運算式會採用閘道主機的時區。`--tz` 不適用於 `--every` 或 `--on-exit`。

每小時整點重複執行的運算式（分鐘為 `0`，小時欄位為萬用字元）會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 可強制精確時間，或使用 `--stagger 30s` 設定明確的時段（僅限 Cron 排程）。

### 月中日期與星期採用 OR 邏輯

Cron 運算式由 [croner](https://github.com/Hexagon/croner) 剖析。當月中日期與星期欄位都不是萬用字元時，只要**任一**欄位相符，croner 即視為相符，而非要求兩者皆相符。這是標準的 Vixie Cron 行為。

```bash
# 預期：「15 日上午 9 點，且僅限星期一」
# 實際：「每月 15 日上午 9 點，以及每個星期一上午 9 點」
0 9 15 * 1
```

這會導致每月觸發約 5–6 次，而非每月 0–1 次。若要同時符合兩個條件，請使用 croner 的 `+` 星期修飾符（`0 9 15 * +1`），或依其中一個欄位排程，再於工作的提示或命令中檢查另一個欄位。

## 事件觸發器（條件監看器）

事件觸發器會將無頭條件指令碼加入 `every` 或 `cron` 排程。工作到期時，Cron 會評估指令碼，並且只在指令碼傳回 `fire: true` 時執行一般承載資料：

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

指令碼必須傳回 `{ fire, message?, state? }`。先前的 JSON 狀態可透過深度凍結的 `trigger.state` 取得；傳回新的 `state` 值即可持久保存。狀態上限為 16 KB。當觸發結果包含 `message` 時，Cron 會在執行前將其附加至系統事件文字或代理回合訊息。`once: true` 會在首次成功執行已觸發的承載資料後停用工作。

`fire: false` 會持久保存評估狀態與計數器，接著重新排程，而不建立執行歷程。如果已觸發的承載資料執行失敗，傳回的 `state` **不會**持久保存——下次評估會看到先前的狀態，且可再次觸發，因此請將指令碼撰寫為唯讀檢查，並將動作保留在承載資料中。觸發器排程具有可設定的最小間隔（預設為 30 秒）。每次評估的實際經過時間預算為 30 秒，最多可呼叫工具 5 次。

<Warning>
啟用 `cron.triggers.enabled` 後，代理撰寫的指令碼可使用所屬代理的**完整工具政策（包括 `exec`）**以無頭方式執行。請將此視為使用該代理權限執行的無人值守程式碼；除非所有獲准建立 Cron 工作的代理都受到相應程度的信任，否則請保持停用。
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

## 承載資料

每個工作恰好包含一種承載資料類型，由旗標選擇：

| 承載資料     | 旗標                                           | 執行內容                                                   |
| ------------ | ---------------------------------------------- | ---------------------------------------------------------- |
| 系統事件     | `--system-event <text>`                        | 排入主要工作階段，本身不會呼叫模型                         |
| 代理訊息     | `--message <text>`                             | 由模型支援的代理回合                                       |
| 命令         | `--command <shell>` 或 `--command-argv <json>` | 閘道主機上的殼層／程序，不會呼叫模型                       |

### 代理回合選項

<ParamField path="--message" type="string" required>
  提示文字（隔離式／目前／自訂工作階段工作必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；必須解析為允許的模型，否則執行會因驗證錯誤而失敗。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個工作的備援模型清單，例如 `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`。傳入 `--fallbacks ""` 可進行不含備援模型的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 中，移除每個工作的備援覆寫，使工作遵循已設定的備援優先順序。不可與 `--fallbacks` 同時使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 中，移除每個工作的模型覆寫，使工作遵循一般 Cron 模型優先順序（已儲存的 Cron 工作階段覆寫，否則為代理／預設模型）。不可與 `--model` 同時使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。可用層級仍取決於所選模型與代理執行階段。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 中，移除每個工作的思考覆寫。不可與 `--thinking` 同時使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會設定工作的主要模型；它不會取代工作階段的 `/model` 覆寫，因此已設定的備援鏈仍會套用在其上。無法解析或不允許的模型會讓執行失敗並顯示明確的驗證錯誤，而不會無聲地回退至預設值。如果工作有 `--model`，但沒有明確或已設定的備援清單，OpenClaw 會傳遞空的備援覆寫，而不會無聲地附加代理程式主要模型作為隱藏的重試目標。

隔離工作的模型選擇優先順序如下，由高至低：

1. 每個工作的承載資料 `model`（明確設定；不允許的模型會讓執行失敗）
2. Gmail 鉤子的模型覆寫（僅限執行來自 Gmail 且允許該覆寫時）
3. 使用者選取並儲存的排程工作階段模型覆寫
4. 代理程式／預設模型選擇

快速模式會遵循解析後的即時選擇。如果所選模型設定含有 `params.fastMode`，隔離排程預設會使用該值；已儲存的工作階段 `fastMode` 覆寫（其次為代理程式的 `fastModeDefault`）仍會優先於模型設定，無論設定為開啟或關閉。自動模式會使用模型的 `params.fastAutoOnSeconds` 臨界值，預設為 60 秒。

如果執行期間發生即時模型切換的交接，排程會使用切換後的供應商／模型重試，並在目前執行期間保存該選擇（以及任何新的驗證設定檔）。重試次數有上限：初始嘗試加上 2 次切換重試後，排程會中止，而不會持續循環。

隔離執行開始前，OpenClaw 會檢查已設定的 `api: "ollama"` 與 `api: "openai-completions"` 供應商中，`baseUrl` 為回送位址、私人網路或 `.local` 的本機端點是否可連線。此預先檢查會遍歷工作的已設定備援鏈，只有在所有候選端點都無法連線後，才會將執行標記為 `skipped`；`--fallbacks ""` 會讓遍歷嚴格限定於主要模型。端點無法使用時，系統會將執行記錄為 `skipped` 並附上清楚的錯誤，而不會開始模型呼叫。結果會依端點快取 5 分鐘（不是依工作或模型），因此許多到期工作共用失效的本機 Ollama/vLLM/SGLang/LM Studio 伺服器時，只需進行一次探測，而不會引發大量請求。預先檢查時略過的執行不會增加執行錯誤的退避時間；設定 `failureAlert.includeSkipped` 可選擇接收重複的略過警示。

### 命令承載資料

命令承載資料會在閘道排程器內執行確定性的指令碼，而不會啟動由模型支援的輪次。命令會在閘道主機上執行、擷取 stdout/stderr、將執行記錄於排程歷程中，並重複使用與代理程式輪次工作相同的 `announce`、`webhook` 和 `none` 傳遞模式。

<Note>
命令排程是供操作員管理員使用的閘道自動化介面，不是代理程式的 `tools.exec` 呼叫。建立、更新、移除或手動執行排程工作需要 `operator.admin`；之後的排程命令執行會在閘道程序內，以該管理員建立的自動化形式執行。代理程式執行原則（`tools.exec.mode`、核准提示、各代理程式工具允許清單）管控模型可見的執行工具，而非命令排程承載資料。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。若要不經殼層剖析而精確執行 argv，請使用 `--command-argv '["node","scripts/report.mjs"]'`。選用的 `--command-env KEY=VALUE`（可重複指定）、`--command-input`、`--timeout-seconds`（預設 10 分鐘）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 可控制程序環境、stdin 與輸出限制。

傳遞的文字取自程序輸出：非空白的 stdout 優先；如果 stdout 為空白而 stderr 非空白，則傳遞 stderr；如果兩者都有內容，排程會傳送一小段 `stdout:` / `stderr:` 區塊。結束代碼 `0` 會將執行記錄為 `ok`；非零結束代碼、訊號、逾時或無輸出逾時會記錄為 `error`，並可能觸發失敗警示。僅輸出 `NO_REPLY` 的命令會使用一般排程的靜默權杖抑制機制，不會將任何內容傳回聊天。

## 執行方式

| 方式            | `--session` 值      | 執行位置                 | 最適合用途                      |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 專用排程喚醒通道         | 提醒、系統事件                  |
| 隔離            | `isolated`          | 專用 `cron:<jobId>`      | 報告、背景例行工作              |
| 目前工作階段    | `current`           | 建立時綁定               | 可感知情境的週期性工作          |
| 自訂工作階段    | `session:custom-id` | 持久具名工作階段         | 以歷程為基礎延續的工作流程      |

<AccordionGroup>
  <Accordion title="主要工作階段、隔離與自訂的比較">
    **主要工作階段**工作會將系統事件加入排程擁有的執行通道，並可選擇喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主要工作階段的最近傳遞情境來回覆，但不會將例行排程輪次附加至人類聊天通道，也不會延長目標工作階段每日／閒置重設的有效期。**隔離**工作會使用全新的工作階段執行專用的代理程式輪次。**自訂工作階段**（`session:xxx`）會跨執行保存情境，讓每日站立會議等工作流程能以先前摘要為基礎延續。

    主要工作階段的排程事件是自給自足的系統事件提醒。它們不會自動包含預設心跳偵測提示中的 “讀取 HEARTBEAT.md” 指示；如果提醒應查閱 `HEARTBEAT.md`，請在排程事件文字中明確說明。

  </Accordion>
  <Accordion title="隔離工作中的「全新工作階段」是什麼意思">
    每次執行都會使用新的逐字記錄／工作階段 ID。OpenClaw 會保留安全的偏好設定（思考／快速／詳細程度設定、標籤、使用者明確選取的模型／驗證覆寫），但不會從較舊的排程資料列繼承周遭對話情境：頻道／群組路由、傳送或佇列原則、權限提升、來源或 ACP 執行階段綁定。當週期性工作應刻意以相同對話情境為基礎延續時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="子代理程式與 Discord 傳遞">
    當隔離排程執行協調子代理程式時，傳遞會優先採用最終後代的輸出，而非過時的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該父層的部分更新，而不會將其公告出去。

    對於純文字的 Discord 公告目標，OpenClaw 只會傳送一次標準的最終助理文字，而不會同時重播串流／中間文字與最終答案。媒體和結構化 Discord 承載資料仍會分開傳送，確保附件和元件不會遺失。

  </Accordion>
</AccordionGroup>

## 傳送與輸出

| 模式       | 行為                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理未傳送，則將最終文字備援傳送至目標 |
| `webhook`  | 將完成事件承載資料以 POST 傳送至 URL                                |
| `none`     | 執行器不進行備援傳送                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 傳送至頻道。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受由 Telegram 定義的 `-1001234567890:123` 簡寫。直接使用 RPC／設定的呼叫端可將 `delivery.threadId` 傳入為字串或數字。Slack／Discord／Mattermost 目標使用明確的前綴（`channel:<id>`、`user:<id>`）。Matrix 聊天室 ID 區分大小寫；請使用確切的聊天室 ID，或使用來自 Matrix 的 `room:!room:server` 格式。

當公告傳送使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶有提供者前綴的目標，可以在排程退回使用工作階段歷程或單一已設定頻道之前選取頻道。只有載入之外掛所公告的前綴才是提供者選擇器。如果明確指定 `delivery.channel`，目標前綴必須指向相同的提供者；若使用 `channel: "whatsapp"` 搭配 `to: "telegram:123"`，系統會拒絕該組合，而不會讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍是由頻道擁有的目標語法，而非提供者選擇器。

對於隔離工作，聊天傳送功能是共用的：如果有可用的聊天路由，即使使用 `--no-deliver`，代理仍可使用 `message` 工具。如果代理傳送至已設定／目前的目標，OpenClaw 會略過備援公告。否則，`announce`、`webhook` 和 `none` 只控制代理回合結束後，執行器如何處理最終回覆。

當代理從進行中的聊天建立隔離提醒時，OpenClaw 會儲存保留的即時傳送目標，供備援公告路由使用。內部工作階段金鑰可能為小寫；當目前聊天情境可用時，不會從這些金鑰重建提供者傳送目標。

隱含的公告傳送會使用已設定的頻道允許清單來驗證過時目標並重新路由。DM 配對儲存區的核准對象不會成為備援自動化的收件者；當排程工作應主動傳送至 DM 時，請設定 `delivery.to`，或設定頻道的 `allowFrom` 項目。

### 失敗通知

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對個別工作覆寫該值。
- 如果兩者都未設定，且工作已透過 `announce` 傳送，失敗通知會退回使用該主要公告目標。
- 除非主要傳送模式為 `webhook`，否則僅有 `sessionTarget="isolated"` 工作支援 `delivery.failureDestination`。
- `failureAlert.includeSkipped: true` 讓個別工作或全域排程警示原則納入重複略過執行的警示。略過的執行會保有獨立的連續略過計數器，因此不會影響執行錯誤的退避機制。
- `openclaw cron edit` 提供個別工作的警示調整選項：`--failure-alert`／`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`／`--failure-alert-exclude-skipped`、`--failure-alert-mode` 和 `--failure-alert-account-id`。

### 輸出語言

排程工作不會根據頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放入排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "摘要更新內容。請以中文回覆；URL、程式碼和產品名稱保持不變。"
```

對於範本檔案，請在算繪後的提示詞中保留語言指示，並在工作執行前確認 `{{language}}` 等預留位置已填入。如果輸出混合多種語言，請明確指定規則，例如：“敘述文字使用中文，技術術語保留英文。”

## 命令列介面範例

<Tabs>
  <Tab title="單次提醒">
    ```bash
    openclaw cron add \
      --name "行事曆檢查" \
      --at "20m" \
      --session main \
      --system-event "下次心跳偵測：檢查行事曆。" \
      --wake now
    ```
  </Tab>
  <Tab title="週期性隔離工作">
    ```bash
    openclaw cron create "0 7 * * *" \
      "摘要整理夜間更新。" \
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
      "以 JSON 摘要整理今天的部署。" \
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

# 以 JSON 取得一項已儲存的工作
openclaw cron get <jobId>

# 顯示一項工作，包括解析後的傳遞路由
openclaw cron show <jobId>

# 啟用／停用而不刪除
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# 編輯工作
openclaw cron edit <jobId> --message "更新後的提示詞" --model "opus"

# 立即強制執行工作
openclaw cron run <jobId>

# 立即強制執行工作，並等待其終止狀態
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 僅在到期時執行
openclaw cron run <jobId> --due

# 檢視執行歷程
openclaw cron runs --id <jobId> --limit 50

# 檢視某次確切的執行
openclaw cron runs --id <jobId> --run-id <runId>

# 刪除工作
openclaw cron remove <jobId>

# 選擇代理程式（多代理程式設定）
openclaw cron create "0 6 * * *" "檢查維運佇列" --name "維運巡查" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

封存工作階段（透過控制介面，或由操作員管理員呼叫者執行 `sessions.patch { archived: true }`）會停用綁定至該工作階段的所有已啟用排程工作：其隔離的 `cron:<jobId>` 工作階段、`session:<key>` 目標，或傳遞／喚醒的 `sessionKey` 通道。還原工作階段不會重新啟用這些工作；請使用 `openclaw cron enable <jobId>`。具有已啟用綁定工作的工作階段會在控制介面側邊欄顯示時鐘徽章。

`openclaw cron run <jobId>` 會在手動執行排入佇列後返回。對於關閉掛鉤、維護指令碼，或其他必須封鎖至佇列中的執行完成為止的自動化，請使用 `--wait`；它會輪詢返回的 `runId`（預設逾時 `10m`，輪詢間隔 `2s`），狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時則以非零值結束。

代理程式的 `cron` 工具透過 `cron(action: "list")` 返回精簡的工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；若要取得單一工作的完整定義，請使用 `cron(action: "get", jobId: "...")`。直接呼叫閘道的呼叫者可將 `compact: true` 傳給 `cron.list`；省略此項則會保留包含傳遞預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名。新工作可以使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後接位置式代理程式提示詞。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，可將已完成執行的承載資料以 POST 傳送至 HTTP 端點；網路鉤子傳遞不能與聊天傳遞旗標（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）併用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 會個別取消設定對應的路由欄位（每個旗標皆不能與其對應的設定旗標併用）——這與 `--no-deliver` 不同，後者只會停用執行器的備援傳遞。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作所選的模型。
- 如果模型受到允許，該確切的提供者／模型會傳遞至隔離的代理程式執行。
- 如果模型不受允許或無法解析，排程會以明確的驗證錯誤讓該次執行失敗。
- API `cron.update` 承載資料修補可以設定 `model: null`，以清除已儲存工作的模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 併用。
- 已設定的備援鏈仍然適用，因為排程的 `--model` 是工作的主要模型，而非工作階段的 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定承載資料的 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援並使執行採取嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除各工作層級的覆寫。
- 單獨使用 `--model`，且沒有明確或已設定的備援清單時，不會默默將代理程式主要模型當成額外的重試目標。

</Note>

## 網路鉤子

閘道可以公開 HTTP 網路鉤子端點，供外部觸發。請在設定中啟用：

```json5
{
  hooks: {
    enabled: true,
    token: "共用密鑰",
    path: "/hooks",
  },
}
```

### 驗證

每個請求都必須透過標頭包含掛鉤權杖：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

查詢字串權杖會遭到拒絕。

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
      -d '{"message":"摘要整理收件匣","name":"電子郵件","model":"openai/gpt-5.6-sol"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應掛鉤（POST /hooks/<name>）">
    自訂掛鉤名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意承載資料轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將掛鉤端點置於回送介面、tailnet 或受信任的反向代理之後。

- 使用專用的掛鉤權杖；不要重複使用閘道驗證權杖。
- 將 `hooks.path` 保留在專用子路徑；`/` 會遭到拒絕。
- 設定 `hooks.allowedAgentIds`，以限制掛鉤可指定的實際代理程式，包括省略 `agentId` 時的預設代理程式。
- 除非你需要由呼叫者選擇工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制允許的工作階段金鑰格式。
- 掛鉤承載資料預設會由安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接至 OpenClaw。

<Note>
**先決條件：**`gcloud` 命令列介面、`gog`（gogcli）、已啟用 OpenClaw 掛鉤，以及用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並預設使用 Tailscale Funnel 作為推送端點（`--tailscale funnel|serve|off`）。

### 閘道自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，閘道會在啟動時執行 `gog gmail watch serve`，並自動續期監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇停用。

### 手動一次性設定

<Steps>
  <Step title="選擇 GCP 專案">
    選擇擁有 `gog` 所用 OAuth 用戶端的 GCP 專案：

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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "替換為專用網路鉤子權杖",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

上述 `retry` 值為預設值：最多重試 3 次，退避時間為 `30s/60s/5m`，並對全部五種暫時性錯誤類別進行重試。排程網路鉤子的 POST 請求會將 `webhookToken` 作為 `Authorization: Bearer <token>` 傳送。

`maxConcurrentRuns` 同時限制排程分派和隔離代理程式回合的執行，預設值為 8。隔離的排程代理程式回合會在內部使用佇列專用的 `cron-nested` 執行通道，因此提高此值可讓彼此獨立的排程 LLM 執行並行推進，而不是只能啟動其外層排程包裝器。此設定不會擴大共用的非排程 `nested` 通道。

`cron.store` 是邏輯儲存區金鑰和 doctor 遷移路徑，不是可手動編輯的即時 JSON 檔案。工作資料存放於 SQLite；請使用命令列介面或閘道 API 進行變更。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **單次重試**：暫時性錯誤（速率限制、過載、網路、逾時、伺服器錯誤）最多重試 `retry.maxAttempts` 次（預設 3），並使用 `retry.backoffMs`（預設 30s、60s、5m）。永久性錯誤會立即停用工作。

    **週期性重試**：連續執行錯誤會依延長的排程進行退避（30s、60s、5m、15m、60m）。下一次成功執行後，退避會重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`，`false` 表示停用）會清除隔離的執行工作階段項目。`cron.runLog.keepLines` 會限制每項工作所保留的 SQLite 執行歷程資料列數；`maxBytes` 則為了與較舊的檔案式執行記錄設定相容而保留。
  </Accordion>
  <Accordion title="舊版儲存區遷移">
    升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的工作資料列會從執行階段略過，並複製到 `jobs-quarantine.json`，以供日後修復或檢閱。
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
    - 對於 `cron` 排程，請確認時區（`--tz`）是否與主機時區一致。
    - 執行輸出中的 `reason: not-due` 表示手動執行是以 `openclaw cron run <jobId> --due` 檢查，而該工作尚未到期。

  </Accordion>
  <Accordion title="排程已觸發但未傳送">
    - 傳送模式 `none` 表示不會執行執行器的備援傳送。若有可用的聊天路由，代理程式仍可使用 `message` 工具直接傳送。
    - 傳送目標缺失或無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版工作若其 `delivery.to` 聊天室 ID 為小寫，可能會失敗，因為 Matrix 聊天室 ID 區分大小寫。請將工作編輯為 Matrix 中確切的 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳送遭認證資訊阻擋。
    - 如果隔離執行只傳回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳送和備援的佇列摘要路徑，因此不會將任何內容傳回聊天。
    - 如果代理程式應自行傳訊息給使用者，請檢查該工作是否有可用的路由（先前有聊天時使用 `channel: "last"`，或明確指定頻道／目標）。

  </Accordion>
  <Accordion title="排程或心跳偵測似乎阻止 /new 樣式的輪替">
    - 每日及閒置重設的新鮮度並非以 `updatedAt` 為依據；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知和閘道簿記作業可能會更新用於路由／狀態的工作階段資料列，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在前建立的舊版資料列，若對話記錄 JSONL 檔案仍可用，OpenClaw 可從其工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未指定 `--tz` 的排程會使用閘道主機的時區。
    - 未指定時區的 `at` 排程會視為 UTC。
    - 心跳偵測的 `activeHours` 會使用設定的時區解析方式。

  </Accordion>
</AccordionGroup>

## 相關內容

- [自動化](/zh-TW/automation) — 一覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作帳本
- [心跳偵測](/zh-TW/gateway/heartbeat) — 定期執行主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
