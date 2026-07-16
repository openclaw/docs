---
read_when:
    - 排程背景工作或喚醒作業
    - 將外部觸發條件（網路鉤子、Gmail）串接至 OpenClaw
    - 為排程任務選擇心跳偵測或排程
sidebarTitle: Scheduled tasks
summary: 閘道排程器的排程工作、網路鉤子與 Gmail PubSub 觸發條件
title: 排程工作
x-i18n:
    generated_at: "2026-07-16T11:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

排程是閘道內建的排程器。它會持久保存工作、在正確的時間喚醒代理程式，並可將輸出傳送至聊天頻道、網路鉤子，或不傳送至任何地方。

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
  <Step title="查看執行記錄">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## 排程的運作方式

- 排程在**閘道程序內**執行，而非在模型內。閘道必須保持執行，排程才會觸發。
- 工作定義、執行階段狀態及執行記錄會持久保存於 OpenClaw 的共用 SQLite 狀態資料庫，因此重新啟動不會遺失排程。
- 每次排程執行都會建立一筆[背景任務](/zh-TW/automation/tasks)記錄。
- 單次工作（`--at`）預設會在成功後自動刪除；傳入 `--keep-after-run` 可予以保留。
- 每次執行的實際經過時間預算：若有設定，則使用 `--timeout-seconds`。否則，隔離／分離的代理程式回合工作會受排程本身的 60 分鐘監控逾時限制，在底層代理程式回合逾時（`agents.defaults.timeoutSeconds`，預設 48 小時）可能套用之前就會終止；命令工作預設為 10 分鐘。
- 閘道啟動時，逾期的隔離代理程式回合工作會重新排程，而不會立即重播，避免模型／工具啟動工作進入頻道連線時段。
- 若你透過系統排程或其他外部排程器驅動 `openclaw agent`，即使命令列介面已處理 `SIGTERM`/`SIGINT`，仍應使用強制終止升級機制包裝它。由閘道支援的執行會要求閘道中止已接受的執行；本機與嵌入式備援執行也會收到相同的中止訊號。使用 GNU `timeout` 時，請優先使用 `timeout -k 60 600 openclaw agent ...`，而非單獨使用 `timeout 600 ...`——若程序無法及時結束，`-k` 值就是最後的保障。對於 systemd 單元，請使用 `SIGTERM` 停止訊號，並在最終終止前保留寬限時段（`TimeoutStopSec`）。若原始閘道執行仍在進行時重複使用 `--run-id`，系統會將重複項目回報為執行中，而不會啟動第二次執行。

<AccordionGroup>
  <Accordion title="隔離執行強化">
    - 隔離執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁／程序，並透過主工作階段與自訂工作階段執行所使用的同一共用拆卸路徑，處置為工作建立的任何隨附 MCP 執行階段執行個體。清理失敗會被忽略，因此排程結果仍具優先效力。
    - 具有限縮排程自行清理授權的隔離執行，可以讀取排程器狀態、僅包含自身工作的自我篩選清單，以及該工作的執行記錄，且只能移除自身工作。
    - 隔離執行會防範過時的確認回覆：如果第一個結果只是暫時性狀態更新（`on it`、`pulling everything together` 及類似提示），且沒有任何子孫子代理程式仍負責最終答案，OpenClaw 會再提示一次以取得實際結果，然後再傳送。
    - 系統會辨識結構化的執行拒絕中繼資料（包括巢狀錯誤以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的節點主機 `UNAVAILABLE` 包裝器），因此受阻的命令不會被回報為成功執行，同時也不會將一般的助理文字誤認為拒絕。
    - 即使沒有回覆承載資料，執行層級的代理程式失敗仍會計為工作錯誤，因此模型／提供者失敗會增加錯誤計數器並觸發失敗通知，而不會將工作清除為成功。
    - 當工作達到 `timeoutSeconds` 時，排程會中止執行並給予短暫的清理時段。若執行未能結束，閘道所擁有的清理作業會在排程記錄逾時前，強制清除該次執行的工作階段所有權，避免佇列中的聊天工作卡在過時的處理中工作階段後方。
    - 設定／啟動停滯會套用階段特定的逾時（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。即使外部命令列介面程序尚未啟動，這些監控逾時仍會涵蓋嵌入式及由命令列介面支援的提供者，且其上限獨立於較長的 `timeoutSeconds` 值，因此冷啟動／驗證／內容失敗能迅速浮現。

  </Accordion>
  <Accordion title="任務協調">
    排程任務協調會先以執行階段擁有權為依據，再以持久記錄為後盾：只要排程執行階段仍將該工作追蹤為執行中，作用中的排程任務就會保持作用中，即使舊的子工作階段資料列仍然存在。當執行階段不再擁有該工作，且 5 分鐘寬限時段到期後，維護檢查會查閱相符 `cron:<jobId>:<startedAt>` 執行的持久化執行記錄與工作狀態。若其中有終止結果，就會完成任務帳冊；否則，由閘道擁有的維護作業可將任務標記為 `lost`。離線命令列介面稽核可從持久記錄復原，但其自身空白的程序內作用中工作集合，並不足以證明閘道所擁有的執行已經消失。
  </Accordion>
</AccordionGroup>

## 排程類型

| 類型      | 命令列介面旗標    | 說明                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 單次時間戳記（ISO 8601 或 `20m` 之類的相對時間）                                                     |
| `every`   | `--every`   | 固定間隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`    | 5 欄位或 6 欄位的排程運算式，可選擇搭配 `--tz`                                                  |
| `on-exit` | `--on-exit` | 受監看命令結束時觸發一次（事件觸發器；回合拆卸後仍會保留；可選擇搭配 `--on-exit-cwd`） |

不含時區的時間戳記會視為 UTC。加入 `--tz America/New_York`，即可在該 IANA 時區中解讀不含時差的 `--at` 日期時間，或計算排程運算式。不含 `--tz` 的排程運算式會使用閘道主機時區。`--tz` 不能與 `--every` 或 `--on-exit` 搭配使用。

每小時整點重複的運算式（分鐘欄位為 `0`，小時欄位為萬用字元）會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 可強制精確時間，或使用 `--stagger 30s` 設定明確的時間範圍（僅限排程）。

### 月中日期與星期使用 OR 邏輯

排程運算式由 [croner](https://github.com/Hexagon/croner) 解析。當月中日期與星期欄位都不是萬用字元時，只要**任一**欄位相符，croner 就會判定相符，而非要求兩者皆相符。這是標準的 Vixie cron 行為。

```bash
# 預期：「僅當 15 日是星期一時，在上午 9 點執行」
# 實際：「每月 15 日上午 9 點，以及每個星期一上午 9 點」
0 9 15 * 1
```

如此每月大約會觸發 5-6 次，而非 0-1 次。若要同時要求兩個條件，請使用 croner 的 `+` 星期修飾詞（`0 9 15 * +1`），或依其中一個欄位排程，並在工作的提示或命令中檢查另一個條件。

## 事件觸發器（條件監看器）

事件觸發器會將無介面的條件指令碼新增至 `every` 或 `cron` 排程。工作到期時，排程會評估指令碼，而且僅在指令碼傳回 `fire: true` 時執行一般承載資料：

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 僅當觀察到的狀態與上次評估不同時觸發。
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "調查 CI 狀態變更。" },
}
```

指令碼必須傳回 `{ fire, message?, state? }`。先前的 JSON 狀態可透過深度凍結的 `trigger.state` 取得；傳回新的 `state` 值即可持久保存。狀態上限為 16 KB。當觸發結果包含 `message` 時，排程會在執行前將其附加至系統事件文字或代理程式回合訊息。`once: true` 會在第一次成功執行已觸發的承載資料後停用工作。

`fire: false` 會持久保存評估狀態與計數器，然後重新排程，而不建立執行記錄。若已觸發的承載資料執行失敗，傳回的 `state` **不會**持久保存——下一次評估會看到先前狀態，並可再次觸發，因此請將指令碼撰寫為唯讀檢查，並將動作保留在承載資料中。觸發器排程具有可設定的最短間隔（預設為 30 秒）。每次評估的實際經過時間預算為 30 秒，最多可呼叫 5 次工具。

<Warning>
啟用 `cron.triggers.enabled` 會允許代理程式撰寫的指令碼，在無介面模式下以擁有者代理程式的**完整工具政策（包括 `exec`）**執行。請將此視為以該代理程式權限進行的無人值守程式碼執行；除非所有獲准建立排程工作的代理程式都已受到相應信任，否則請保持停用。
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

每個工作都恰好包含一種承載資料類型，由旗標選擇：

| 承載資料       | 旗標                                           | 執行內容                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 系統事件  | `--system-event <text>`                        | 排入主工作階段，本身不呼叫模型 |
| 代理程式訊息 | `--message <text>`                             | 由模型支援的代理程式回合                               |
| 命令       | `--command <shell>` 或 `--command-argv <json>` | 在閘道主機上執行 shell／程序，不呼叫模型      |

### 代理程式回合選項

<ParamField path="--message" type="string" required>
  提示文字（隔離／目前／自訂工作階段工作必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；必須解析為允許的模型，否則執行會因驗證錯誤而失敗。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個工作的備援模型清單，例如 `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`。傳入 `--fallbacks ""` 可進行不使用備援模型的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 時，移除每個工作的備援覆寫，使工作遵循已設定的備援優先順序。無法與 `--fallbacks` 合併使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 時，移除每個工作的模型覆寫，使工作遵循一般排程模型優先順序（已儲存的排程工作階段覆寫，否則為代理程式／預設模型）。無法與 `--model` 合併使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。可用層級仍取決於所選模型與代理程式執行階段。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 時，移除每個工作的思考覆寫。無法與 `--thinking` 合併使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會設定工作的主要模型；它不會取代工作階段的 `/model` 覆寫，因此已設定的備援鏈仍會套用在其上。無法解析或不允許的模型會使執行因明確的驗證錯誤而失敗，而不是無聲地退回預設值。如果工作有 `--model`，但沒有明確或已設定的備援清單，OpenClaw 會傳入空的備援覆寫，而不是無聲地附加代理程式主要模型作為隱藏的重試目標。

隔離工作的模型選擇優先順序，由高至低：

1. 每個工作的承載資料 `model`（明確設定；不允許的模型會使執行失敗）
2. Gmail 鉤子的模型覆寫（僅限執行來自 Gmail 且該覆寫獲允許時）
3. 使用者選取且已儲存的排程工作階段模型覆寫
4. 代理程式／預設模型選擇

快速模式會遵循解析後的即時選擇。如果所選模型設定包含 `params.fastMode`，隔離排程預設會使用它；已儲存的工作階段 `fastMode` 覆寫（其次是代理程式 `fastModeDefault`）在任一方向仍優先於模型設定。自動模式使用模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果執行遇到即時模型切換交接，排程會使用切換後的提供者／模型重試，並為目前執行保留該選擇（以及任何新的驗證設定檔）。重試次數有上限：初次嘗試加上 2 次切換重試後，排程會中止而不會持續循環。

隔離執行開始前，OpenClaw 會檢查已設定 `api: "ollama"` 和 `api: "openai-completions"` 提供者的可連線本機端點，其 `baseUrl` 為迴路、私人網路或 `.local`。此前置檢查會走訪工作的已設定備援鏈，僅在每個候選項目都無法連線時，才將執行標記為 `skipped`；`--fallbacks ""` 會將走訪嚴格限制為僅主要模型。端點停機時，會以清楚的錯誤將執行記錄為 `skipped`，而不是開始模型呼叫。每個端點的結果會快取 5 分鐘（不是每個工作或模型），因此許多到期工作共用已停機的本機 Ollama/vLLM/SGLang/LM Studio 伺服器時，只需一次探查，而不會形成請求風暴。略過的前置檢查執行不會增加執行錯誤退避；設定 `failureAlert.includeSkipped` 可選擇接收重複的略過警示。

### 命令承載資料

命令承載資料會在閘道排程器內執行確定性指令碼，而不會啟動由模型支援的回合。它們在閘道主機上執行、擷取 stdout/stderr、將執行記錄於排程歷程，並重複使用與代理程式回合工作相同的 `announce`、`webhook` 和 `none` 傳遞模式。

<Note>
命令排程是由操作員管理的閘道自動化介面，不是代理程式的 `tools.exec` 呼叫。建立、更新、移除或手動執行排程工作需要 `operator.admin`；之後排定的命令會在閘道程序內，以該管理員撰寫的自動化方式執行。代理程式執行政策（`tools.exec.mode`、核准提示、每個代理程式的工具允許清單）管控模型可見的執行工具，而非命令排程承載資料。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不進行 shell 剖析的情況下精確執行 argv。選用的 `--command-env KEY=VALUE`（可重複）、`--command-input`、`--timeout-seconds`（預設 10 分鐘）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 可控制程序環境、stdin 與輸出限制。

傳遞的文字衍生自程序輸出：非空的 stdout 優先；如果 stdout 為空且 stderr 非空，則傳遞 stderr；如果兩者皆有，排程會傳送一個小型 `stdout:`／`stderr:` 區塊。結束代碼 `0` 會將執行記錄為 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄為 `error`，並可能觸發失敗警示。只列印 `NO_REPLY` 的命令會使用一般排程靜默權杖抑制，不會將任何內容回傳至聊天。

## 執行方式

| 方式            | `--session` 值 | 執行位置                 | 最適合                         |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 專用排程喚醒通道         | 提醒、系統事件                  |
| 隔離            | `isolated`          | 專用 `cron:<jobId>` | 報告、背景例行工作              |
| 目前工作階段    | `current`           | 建立時繫結               | 感知情境的週期性工作            |
| 自訂工作階段    | `session:custom-id` | 持續存在的具名工作階段   | 建立於歷程之上的工作流程        |

<AccordionGroup>
  <Accordion title="主要工作階段、隔離與自訂工作階段的比較">
    **主要工作階段**工作會將系統事件排入排程擁有的執行通道，並選擇性喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主要工作階段的最後傳遞情境來回覆，但不會將例行排程回合附加至人類聊天通道，也不會延長目標工作階段的每日／閒置重設新鮮度。**隔離**工作會以全新工作階段執行專用代理程式回合。**自訂工作階段**（`session:xxx`）會在各次執行間保留情境，支援每日站立會議等以先前摘要為基礎的工作流程。

    主要工作階段的排程事件是獨立完整的系統事件提醒。它們不會自動包含預設心跳偵測提示中的「Read HEARTBEAT.md」指示；如果提醒應查閱 `HEARTBEAT.md`，請在排程事件文字中明確說明。

  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」含義">
    每次執行都會建立新的逐字稿／工作階段 ID。OpenClaw 會保留安全偏好設定（思考／快速／詳細程度設定、標籤、使用者明確選取的模型／驗證覆寫），但不會從較舊的排程資料列繼承周遭對話情境：頻道／群組路由、傳送或佇列政策、權限提升、來源或 ACP 執行階段繫結。當週期性工作應刻意建立於相同對話情境之上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="子代理程式與 Discord 傳遞">
    當隔離排程執行協調子代理程式時，傳遞會優先採用最後一個後代的輸出，而非過時的父項中間文字。如果後代仍在執行，OpenClaw 會抑制該部分父項更新，而不會發布它。

    對於純文字 Discord 公告目標，OpenClaw 只會傳送一次標準最終助理文字，而不會同時重播串流／中間文字與最終答案。媒體與結構化 Discord 承載資料仍會分別傳遞，以免遺漏附件與元件。

  </Accordion>
</AccordionGroup>

## 傳遞與輸出

| 模式       | 發生的情況                                                          |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理程式未傳送，則將最終文字備援傳遞至目標                     |
| `webhook`  | 將完成事件承載資料 POST 至 URL                                      |
| `none`     | 不進行執行器備援傳遞                                                |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳遞。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 所擁有的 `-1001234567890:123` 簡寫。直接 RPC／設定呼叫端可將 `delivery.threadId` 傳入為字串或數字。Slack／Discord／Mattermost 目標使用明確前置字串（`channel:<id>`、`user:<id>`）。Matrix 聊天室 ID 區分大小寫；請使用 Matrix 提供的確切聊天室 ID 或 `room:!room:server` 格式。

當公告傳遞使用 `channel: "last"` 或省略 `channel` 時，具有提供者前置字串的目標（例如 `telegram:123`）可在排程退回工作階段歷程或單一已設定頻道前選取頻道。只有已載入外掛公告的前置字串才是提供者選取器。如果明確指定 `delivery.channel`，目標前置字串必須指名相同提供者；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會遭拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前置字串（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍是頻道擁有的目標語法，而非提供者選取器。

對於隔離工作，聊天傳遞為共用：如果有可用的聊天路由，即使使用 `--no-deliver`，代理程式仍可使用 `message` 工具。如果代理程式傳送至已設定／目前目標，OpenClaw 會略過備援公告。否則 `announce`、`webhook` 和 `none` 只會控制代理程式回合後，執行器如何處理最終回覆。

當代理程式從作用中聊天建立隔離提醒時，OpenClaw 會儲存保留的即時傳遞目標，作為備援公告路由。內部工作階段索引鍵可能為小寫；當目前聊天情境可用時，不會從這些索引鍵重建提供者傳遞目標。

隱含公告傳遞會使用已設定的頻道允許清單來驗證並重新路由過時目標。DM 配對儲存區核准項目不是備援自動化收件者；當排定的工作應主動傳送至 DM 時，請設定 `delivery.to` 或設定頻道的 `allowFrom` 項目。

### 失敗通知

失敗通知會遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對個別工作覆寫該設定。
- 如果兩者皆未設定，且工作已透過 `announce` 傳送，失敗通知會改用該主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非主要傳送模式為 `webhook`。
- `failureAlert.includeSkipped: true` 讓個別工作或全域排程警示原則選擇啟用重複的略過執行警示。略過的執行會保有獨立的連續略過計數器，因此不會影響執行錯誤的退避機制。
- `openclaw cron edit` 提供個別工作的警示調整設定：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 和 `--failure-alert-account-id`。

### 輸出語言

排程工作不會根據頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放入排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "摘要更新內容。請使用中文回覆；網址、程式碼和產品名稱保持不變。"
```

使用範本檔案時，請將語言指示保留在算繪後的提示中，並在工作執行前確認 `{{language}}` 等預留位置已填入內容。如果輸出混用多種語言，請明確指定規則，例如：“敘述文字使用中文，技術術語保留英文。”

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
      "摘要夜間更新。" \
      --name "晨間摘要" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="覆寫模型與思考層級">
    ```bash
    openclaw cron add \
      --name "深度分析" \
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
openclaw cron edit <jobId> --message "更新後的提示" --model "opus"

# 立即強制執行工作
openclaw cron run <jobId>

# 立即強制執行工作，並等待其終止狀態
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 僅在到期時執行
openclaw cron run <jobId> --due

# 檢視執行歷程
openclaw cron runs --id <jobId> --limit 50

# 檢視一次確切的執行
openclaw cron runs --id <jobId> --run-id <runId>

# 刪除工作
openclaw cron remove <jobId>

# 代理程式選擇（多代理程式設定）
openclaw cron create "0 6 * * *" "檢查維運佇列" --name "維運巡查" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

封存工作階段（透過 Control UI，或由操作員管理員呼叫端使用 `sessions.patch { archived: true }`）會停用綁定至該工作階段的所有已啟用排程工作：其隔離的 `cron:<jobId>` 工作階段、`session:<key>` 目標，或傳送／喚醒 `sessionKey` 路徑。還原工作階段不會重新啟用這些工作；請使用 `openclaw cron enable <jobId>`。具有已啟用綁定工作的工作階段會在 Control UI 側邊欄顯示時鐘徽章。

`openclaw cron run <jobId>` 會在手動執行加入佇列後返回。對於關閉掛鉤、維護指令碼或其他必須阻塞到佇列執行完成為止的自動化，請使用 `--wait`；它會輪詢返回的 `runId`（預設逾時 `10m`、輪詢間隔 `2s`），狀態為 `ok` 時以 `0` 結束，而 `error`、`skipped` 或等待逾時則以非零值結束。

代理程式 `cron` 工具會從 `cron(action: "list")` 返回精簡的工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；請使用 `cron(action: "get", jobId: "...")` 取得一個工作的完整定義。直接呼叫閘道的呼叫端可將 `compact: true` 傳給 `cron.list`；省略此項會保留包含傳送預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名。新工作可使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後接位置式代理程式提示。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的執行承載資料 POST 至 HTTP 端點；網路鉤子傳送不能與聊天傳送旗標（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）併用。在 `cron edit`、`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 上，可分別取消設定這些路由欄位（每個都不能與對應的設定旗標併用）——這與 `--no-deliver` 不同，後者只會停用執行器的備援傳送。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作選取的模型。
- 如果允許該模型，該確切的提供者／模型會傳入隔離的代理程式執行。
- 如果不允許該模型或無法解析，排程會以明確的驗證錯誤讓該次執行失敗。
- API `cron.update` 承載資料修補可設定 `model: null`，以清除已儲存工作的模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 併用。
- 已設定的備援鏈仍會套用，因為排程 `--model` 是工作的主要模型，而不是工作階段的 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定承載資料 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援並使執行採用嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除個別工作的覆寫。
- 未提供明確或已設定備援清單的普通 `--model`，不會以代理程式主要模型作為未明示的額外重試目標。

</Note>

## 網路鉤子

閘道可公開 HTTP 網路鉤子端點，供外部觸發。請在設定中啟用：

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

查詢字串中的權杖會遭到拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將系統事件加入主要工作階段的佇列：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"收到新電子郵件","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件說明。
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
  <Accordion title="對應掛鉤（POST /hooks/<name>）">
    自訂掛鉤名稱會透過設定中的 `hooks.mappings` 解析。對應可使用範本或程式碼轉換，將任意承載資料轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將掛鉤端點置於回送介面、tailnet 或受信任的反向 Proxy 後方。

- 請使用專用的掛鉤權杖；不要重複使用閘道驗證權杖。
- 請將 `hooks.path` 保留在專用子路徑；`/` 會遭到拒絕。
- 設定 `hooks.allowedAgentIds`，以限制掛鉤可指定的實際代理程式；當省略 `agentId` 時，此限制也包括預設代理程式。
- 除非需要由呼叫端選擇工作階段，否則請保留 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制允許的工作階段索引鍵格式。
- 掛鉤承載資料預設會包覆安全界線。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接至 OpenClaw。

<Note>
**必要條件：**`gcloud` 命令列介面、`gog`（gogcli）、已啟用 OpenClaw 掛鉤，以及用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並預設使用 Tailscale Funnel 作為推送端點（`--tailscale funnel|serve|off`）。

<Warning>
Gmail 預設集的每封郵件獨立工作階段會分隔對話脈絡；它不會限制目標代理程式的工具或工作區。如果沒有設定 `agentId` 的自訂對應，Gmail 掛鉤會以預設代理程式執行。

對於不受信任的收件匣，請將掛鉤路由至專用的讀取代理程式，僅授予該代理程式唯讀或不授予工作區存取權，並拒絕檔案系統寫入、Shell、瀏覽器及其他非必要工具。如果它需要通知主要代理程式，請僅允許必要的代理程式間交接。請參閱[提示注入](/zh-TW/gateway/security#prompt-injection)、[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)和 [`tools.agentToAgent`](/zh-TW/gateway/config-tools#toolsagenttoagent)。
</Warning>

### 閘道自動啟動

設定 `hooks.enabled=true` 和 `hooks.gmail.account` 後，閘道會在啟動時啟動 `gog gmail watch serve`，並自動續訂監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用此行為。

### 手動單次設定

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

對於不受信任的收件匣，請使用你的供應商所提供最新一代、最高等級的模型。以上值僅為範例；該模型必須存在於你設定的目錄與允許清單中。

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
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

以上 `retry` 值為預設值：最多重試 3 次，使用 `30s/60s/5m` 退避，並重試全部五種暫時性類別。`webhookToken` 會在排程網路鉤子 POST 中以 `Authorization: Bearer <token>` 傳送。

`maxConcurrentRuns` 同時限制排程的排程分派與隔離的代理回合執行，預設為 8。隔離的排程代理回合會在內部使用佇列專用的 `cron-nested` 執行通道，因此提高此值可讓彼此獨立的排程 LLM 執行平行推進，而非只啟動其外層排程包裝器。此設定不會擴大共用的非排程 `nested` 通道。

`cron.store` 是邏輯儲存區索引鍵與 doctor 遷移路徑，而非可手動編輯的即時 JSON 檔案。工作資料儲存在 SQLite 中；請使用命令列介面或閘道 API 進行變更。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **單次工作重試**：暫時性錯誤（速率限制、過載、網路、逾時、伺服器錯誤）會使用 `retry.backoffMs`（預設為 30s、60s、5m），最多重試 `retry.maxAttempts` 次（預設為 3）。永久性錯誤會立即停用工作。

    **週期性工作重試**：連續執行錯誤會依延伸排程退避（30s、60s、5m、15m、60m）。下一次成功執行後，退避會重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設為 `24h`，`false` 會停用）會清除隔離的執行工作階段項目。執行歷程會為每項工作保留最新的 2000 筆終止狀態資料列；遺失的資料列仍保有其 24 小時清理期間。
  </Accordion>
  <Accordion title="舊版儲存區遷移">
    升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的工作資料列會從執行階段略過，並複製至 `jobs-quarantine.json`，以供稍後修復或檢閱。
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
    - 檢查 `cron.enabled` 與 `OPENCLAW_SKIP_CRON` 環境變數。
    - 確認閘道持續執行。
    - 對於 `cron` 排程，請確認時區（`--tz`）與主機時區是否相符。
    - 執行輸出中的 `reason: not-due` 表示手動執行使用 `openclaw cron run <jobId> --due` 進行檢查，而工作尚未到期。

  </Accordion>
  <Accordion title="排程已觸發但未傳遞">
    - 傳遞模式 `none` 表示不預期執行器進行備援傳送。當有可用的聊天路由時，代理仍可使用 `message` 工具直接傳送。
    - 傳遞目標遺失或無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版工作中小寫的 `delivery.to` 聊天室 ID 可能會失敗，因為 Matrix 聊天室 ID 區分大小寫。請將工作編輯為 Matrix 中完全一致的 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞因認證資訊而遭封鎖。
    - 如果隔離執行只傳回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳遞與備援的佇列摘要路徑，因此不會有任何內容回傳至聊天。
    - 如果代理應自行傳訊息給使用者，請檢查工作是否具有可用路由（`channel: "last"` 搭配先前的聊天，或明確指定的頻道／目標）。

  </Accordion>
  <Accordion title="排程或心跳偵測似乎會阻止 /new 形式的輪替">
    - 每日與閒置重設的新鮮度並非以 `updatedAt` 為依據；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知與閘道簿記可能會更新工作階段資料列，以供路由／狀態使用，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版資料列，只要檔案仍可用，OpenClaw 就能從對話記錄 JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為閒置基準。

  </Accordion>
  <Accordion title="時區陷阱">
    - 未設定 `--tz` 的排程會使用閘道主機時區。
    - 未設定時區的 `at` 排程會視為 UTC。
    - 心跳偵測 `activeHours` 使用設定的時區解析方式。

  </Accordion>
</AccordionGroup>

## 相關內容

- [自動化](/zh-TW/automation) — 快速瀏覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作帳本
- [心跳偵測](/zh-TW/gateway/heartbeat) — 定期的主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
