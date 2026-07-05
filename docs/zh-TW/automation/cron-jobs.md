---
read_when:
    - 排程背景作業或喚醒
    - 將外部觸發器（網路鉤子、Gmail）串接至 OpenClaw
    - 在排程任務中決定使用心跳偵測或排程
sidebarTitle: Scheduled tasks
summary: 排程作業、網路鉤子與 Gmail PubSub 觸發器，用於閘道排程器
title: 排程工作
x-i18n:
    generated_at: "2026-07-05T11:00:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa2b15d205cfb9914b4dc25ba5c446ecc8460e322e99bb784495ef7802d94f1e
    source_path: automation/cron-jobs.md
    workflow: 16
---

排程是閘道內建的排程器。它會持久保存工作、在正確時間喚醒代理，並可將輸出傳送到聊天頻道、網路鉤子，或不傳送到任何地方。

## 快速開始

<Steps>
  <Step title="新增一次性提醒">
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
  <Step title="查看執行歷史">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## 排程如何運作

- 排程在**閘道程序內部**執行，而不是在模型內部。閘道必須正在執行，排程才會觸發。
- 工作定義、執行階段狀態和執行歷史會持久保存到 OpenClaw 的共用 SQLite 狀態資料庫，因此重新啟動不會遺失排程。
- 每次排程執行都會建立一筆[背景任務](/zh-TW/automation/tasks)記錄。
- 一次性工作 (`--at`) 預設會在成功後自動刪除；傳入 `--keep-after-run` 可保留它們。
- 每次執行的實際時間預算：設定時使用 `--timeout-seconds`。否則，隔離/分離的代理回合工作會先受排程自身的 60 分鐘看門狗限制，之後底層代理回合逾時 (`agents.defaults.timeoutSeconds`，預設 48 小時) 才可能適用；命令工作預設為 10 分鐘。
- 閘道啟動時，逾期的隔離代理回合工作會重新排程，而不是立即重播，避免模型/工具啟動工作進入頻道連線視窗。
- 如果你從系統排程或其他外部排程器驅動 `openclaw agent`，即使命令列介面已處理 `SIGTERM`/`SIGINT`，也請用硬性終止升級機制包裝它。閘道支援的執行會要求閘道中止已接受的執行；本機和嵌入式後援執行會收到相同的中止訊號。對 GNU `timeout`，建議使用 `timeout -k 60 600 openclaw agent ...`，而不是單純的 `timeout 600 ...`；如果程序無法及時排空，`-k` 值就是最後防線。對 systemd 單元，請使用 `SIGTERM` 停止訊號，並在最終終止前設定寬限視窗 (`TimeoutStopSec`)。當原始閘道執行仍在作用中時重複使用 `--run-id`，會將重複執行回報為進行中，而不是啟動第二次執行。

<AccordionGroup>
  <Accordion title="隔離執行強化">
    - 隔離執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段追蹤的瀏覽器分頁/程序，並透過與主要工作階段和自訂工作階段執行相同的共用拆除路徑，處置為該工作建立的任何 bundled MCP 執行階段執行個體。清理失敗會被忽略，因此排程結果仍然優先。
    - 具備狹窄排程自我清理授權的隔離執行，可以讀取排程器狀態、只包含自身工作的自我篩選清單，以及該工作的執行歷史，且只能移除自身工作。
    - 隔離執行會防範過期的確認回覆：如果第一個結果只是臨時狀態更新（`on it`、`pulling everything together` 和類似提示），且沒有後代子代理仍負責最終答案，OpenClaw 會在交付前重新提示一次，以取得實際結果。
    - 結構化的執行拒絕中繼資料（包括巢狀錯誤以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的 node-host `UNAVAILABLE` 包裝器）會被辨識，因此遭封鎖的命令不會被回報為綠燈執行，而一般助理文字也不會被誤認為拒絕。
    - 即使沒有回覆 payload，執行層級的代理失敗也會計為工作錯誤，因此模型/供應商失敗會遞增錯誤計數器並觸發失敗通知，而不是將工作清除為成功。
    - 當工作達到 `timeoutSeconds` 時，排程會中止執行並給它一段短暫清理視窗。如果它未能排空，閘道擁有的清理會在排程記錄逾時前，強制清除該執行的工作階段所有權，因此排隊的聊天工作不會卡在過期的處理中工作階段後面。
    - 設定/啟動停滯會取得階段特定逾時（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。這些看門狗會涵蓋嵌入式和命令列介面支援的供應商，即使在其外部命令列介面程序啟動前也會生效，並且會獨立於較長的 `timeoutSeconds` 值加上上限，讓冷啟動/驗證/內容失敗能快速浮現。

  </Accordion>
  <Accordion title="任務調和">
    排程任務調和首先由執行階段擁有，其次由持久歷史支援：只要排程執行階段仍將該工作追蹤為執行中，作用中的排程任務就會保持存活，即使仍存在舊的子工作階段資料列也一樣。一旦執行階段停止擁有該工作且 5 分鐘寬限視窗到期，維護會檢查持久保存的執行記錄和工作狀態，尋找相符的 `cron:<jobId>:<startedAt>` 執行。若其中有終端結果，會完成任務帳本；否則閘道擁有的維護可將任務標記為 `lost`。離線命令列介面稽核可從持久歷史復原，但它自身空的程序內作用中工作集合，不能證明閘道擁有的執行已消失。
  </Accordion>
</AccordionGroup>

## 排程類型

| 種類      | 命令列介面旗標    | 說明                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 一次性時間戳記（ISO 8601 或像 `20m` 這樣的相對時間）                                                     |
| `every`   | `--every`   | 固定間隔 (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | 5 欄位或 6 欄位排程運算式，搭配選用的 `--tz`                                                  |
| `on-exit` | `--on-exit` | 受監看命令結束時觸發一次（事件觸發器；可在回合拆除後存續；選用 `--on-exit-cwd`） |

沒有時區的時間戳記會視為 UTC。加入 `--tz America/New_York`，可在該 IANA 時區解讀沒有偏移的 `--at` 日期時間，或評估排程運算式。沒有 `--tz` 的排程運算式會使用閘道主機時區。`--tz` 不能與 `--every` 或 `--on-exit` 搭配使用。

每小時整點重複的運算式（分鐘 `0` 且小時欄位為萬用字元）會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 可強制精準計時，或使用 `--stagger 30s` 設定明確視窗（僅限排程排程）。

### 日期與星期使用 OR 邏輯

排程運算式由 [croner](https://github.com/Hexagon/croner) 剖析。當日期與星期欄位都不是萬用字元時，croner 會在**任一**欄位相符時匹配，而不是兩者都要相符。這是標準 Vixie cron 行為。

```bash
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會大約每月觸發 5-6 次，而不是每月 0-1 次。若要要求兩個條件都成立，請使用 croner 的 `+` 星期修飾符 (`0 9 15 * +1`)，或在其中一個欄位上排程，並在工作提示或命令中防護另一個條件。

## Payload

每個工作都剛好攜帶一種 payload 類型，由旗標選擇：

| Payload       | 旗標                                           | 執行                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 系統事件  | `--system-event <text>`                        | 加入主要工作階段佇列，本身不呼叫模型 |
| 代理訊息 | `--message <text>`                             | 模型支援的代理回合                               |
| 命令       | `--command <shell>` 或 `--command-argv <json>` | 閘道主機上的 shell/程序，不呼叫模型      |

### 代理回合選項

<ParamField path="--message" type="string" required>
  提示文字（隔離/目前/自訂工作階段工作必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；必須解析為允許的模型，否則執行會因驗證錯誤而失敗。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個工作的後援模型清單，例如 `--fallbacks openai/gpt-5.5,openrouter/meta-llama/llama-3.3-70b-instruct:free`。傳入 `--fallbacks ""` 可進行沒有後援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 上，移除每個工作的後援覆寫，讓工作遵循已設定的後援優先順序。不能與 `--fallbacks` 合併使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 上，移除每個工作的模型覆寫，讓工作遵循一般排程模型優先順序（已儲存的排程工作階段覆寫，否則為代理/預設模型）。不能與 `--model` 合併使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫 (`off|minimal|low|medium|high|xhigh|adaptive|max`)。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 上，移除每個工作的思考覆寫。不能與 `--thinking` 合併使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用哪些工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會設定工作的主要模型；它不會取代工作階段 `/model` 覆寫，因此已設定的後援鏈仍會套用在它之上。無法解析或不允許的模型會使執行因明確驗證錯誤而失敗，而不是默默後援到預設值。如果工作有 `--model`，但沒有明確或已設定的後援清單，OpenClaw 會傳入空的後援覆寫，而不是默默將代理主要模型附加為隱藏的重試目標。

隔離工作的模型選擇優先順序，由高到低：

1. 每個工作 payload `model`（明確設定；不允許的模型會使執行失敗）
2. Gmail 鉤子模型覆寫（僅當執行來自 Gmail 且該覆寫被允許時）
3. 使用者選取並儲存的排程工作階段模型覆寫
4. 代理/預設模型選擇

快速模式會遵循解析後的即時選擇。如果選取的模型設定有 `params.fastMode`，隔離排程預設會使用它；已儲存的工作階段 `fastMode` 覆寫（接著是代理 `fastModeDefault`）仍會在任一方向上優先於模型設定。自動模式使用模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果執行遇到即時模型切換交接，排程會使用切換後的供應商/模型重試，並為作用中執行持久保存該選擇（以及任何新的驗證設定檔）。重試有界限：初始嘗試加上 2 次切換重試後，排程會中止而不是迴圈。

在隔離執行開始前，OpenClaw 會檢查已設定 `api: "ollama"` 和 `api: "openai-completions"` 供應商的可到達本機端點，前提是其 `baseUrl` 是 loopback、private-network 或 `.local`。此前置檢查會走訪工作的已設定後援鏈，並且只有在每個候選項都無法到達時，才將執行標記為 `skipped`；`--fallbacks ""` 會讓該走訪嚴格限制於主要模型。停機的端點會將執行記錄為 `skipped` 並附上清楚錯誤，而不是啟動模型呼叫。結果會依端點快取 5 分鐘（不是依工作或模型），因此許多到期工作共用已失效的本機 Ollama/vLLM/SGLang/LM Studio 伺服器時，只需一次探測，而不會造成請求風暴。略過的前置檢查執行不會遞增執行錯誤退避；設定 `failureAlert.includeSkipped` 可選擇接收重複略過警示。

### 命令 payload

命令 payload 會在閘道排程器內執行確定性的指令碼，而不啟動模型支援的回合。它們在閘道主機上執行、擷取 stdout/stderr、將執行記錄到排程歷史，並重用與代理回合工作相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
Command cron 是操作員管理員的閘道自動化介面，不是代理程式的 `tools.exec` 呼叫。建立、更新、移除或手動執行 cron 工作需要 `operator.admin`；排程命令稍後會在閘道程序內，以該管理員撰寫的自動化身分執行。代理程式 exec 政策（`tools.exec.mode`、核准提示、各代理程式工具允許清單）管控模型可見的 exec 工具，而不是 command cron 承載內容。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不經 shell 解析的情況下精確執行 argv。選用的 `--command-env KEY=VALUE`（可重複）、`--command-input`、`--timeout-seconds`（預設 10 分鐘）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 會控制程序環境、stdin 與輸出界限。

送出的文字會從程序輸出衍生：非空的 stdout 優先；如果 stdout 為空且 stderr 非空，則送出 stderr；如果兩者都有內容，cron 會傳送一個小型的 `stdout:` / `stderr:` 區塊。離開碼 `0` 會將執行記錄為 `ok`；非零離開、signal、timeout 或 no-output timeout 會記錄為 `error`，並可觸發失敗警示。只列印 `NO_REPLY` 的命令會使用一般 cron 靜默 token 抑制機制，不會回貼任何內容到聊天。

## 執行樣式

| 樣式 | `--session` 值 | 執行於 | 最適合 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段 | `main` | 專用 cron 喚醒通道 | 提醒、系統事件 |
| 隔離 | `isolated` | 專用 `cron:<jobId>` | 報告、背景雜務 |
| 目前工作階段 | `current` | 建立時綁定 | 具備情境感知的週期性工作 |
| 自訂工作階段 | `session:custom-id` | 持久化具名工作階段 | 建立於歷史之上的工作流程 |

<AccordionGroup>
  <Accordion title="主要工作階段、隔離與自訂的差異">
    **主要工作階段**工作會將系統事件排入 cron 擁有的執行通道，並可選擇喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主要工作階段的上一個投遞情境來回覆，但不會把例行 cron 回合附加到人類聊天通道，也不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**工作會以全新的工作階段執行專用代理程式回合。**自訂工作階段**（`session:xxx`）會跨執行保留情境，啟用像是每日站會這類建立於先前摘要之上的工作流程。

    主要工作階段 cron 事件是自含式的系統事件提醒。它們不會自動包含預設心跳偵測提示中的「讀取 HEARTBEAT.md」指示；如果提醒應查閱 `HEARTBEAT.md`，請在 cron 事件文字中明確說明。

  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」代表什麼">
    每次執行都會有新的 transcript/session id。OpenClaw 會帶入安全偏好（thinking/fast/verbose 設定、標籤、明確由使用者選取的模型/驗證覆寫），但不會從較舊的 cron 列繼承周遭對話情境：頻道/群組路由、傳送或佇列政策、提權、來源或 ACP runtime 綁定。當週期性工作應刻意建立在同一個對話情境之上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="子代理程式與 Discord 投遞">
    當隔離 cron 執行協調子代理程式時，投遞會偏好最終後代輸出，而不是過時的父層中途文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是公布它。

    對於純文字 Discord 公布目標，OpenClaw 只會傳送一次標準最終 assistant 文字，而不是同時重播串流/中間文字與最終答案。媒體與結構化 Discord 承載內容仍會分開投遞，因此附件與元件不會被捨棄。

  </Accordion>
</AccordionGroup>

## 投遞與輸出

| 模式 | 會發生什麼 |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理程式沒有傳送，則將最終文字後援投遞到目標 |
| `webhook` | 將完成事件承載內容 POST 到 URL |
| `none` | 沒有 runner 後援投遞 |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道投遞。對於 Telegram 論壇主題，使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 擁有的 `-1001234567890:123` 簡寫。直接 RPC/config 呼叫端可以以字串或數字傳入 `delivery.threadId`。Slack/Discord/Mattermost 目標使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用精確房間 ID 或來自 Matrix 的 `room:!room:server` 形式。

當公布投遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這樣帶有提供者前綴的目標可以在 cron 回退到工作階段歷史或單一已設定頻道之前選取頻道。只有已載入外掛公告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同提供者；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會遭拒，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）會保持為頻道擁有的目標語法，而不是提供者選擇器。

對於隔離工作，聊天投遞是共享的：如果有可用的聊天路由，代理程式即使搭配 `--no-deliver` 也可以使用 `message` 工具。如果代理程式傳送到已設定/目前目標，OpenClaw 會略過後援公布。否則 `announce`、`webhook` 和 `none` 只控制 runner 在代理程式回合後如何處理最終回覆。

當代理程式從作用中的聊天建立隔離提醒時，OpenClaw 會儲存保留的即時投遞目標，以供後援公布路由使用。內部工作階段鍵可能是小寫；當目前聊天情境可用時，不會從這些鍵重建提供者投遞目標。

隱含公布投遞會使用已設定的頻道允許清單驗證並重新路由過時目標。DM 配對儲存核准不是後援自動化收件者；當排程工作應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道 `allowFrom` 項目。

### 失敗通知

失敗通知會遵循獨立目的地路徑：

- `cron.failureDestination` 會為失敗通知設定全域預設。
- `job.delivery.failureDestination` 會為每個工作覆寫該值。
- 如果兩者都未設定，且工作已經透過 `announce` 投遞，失敗通知會回退到該主要公布目標。
- 除非主要投遞模式是 `webhook`，否則 `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作。
- `failureAlert.includeSkipped: true` 會讓工作或全域 cron 警示政策選擇加入重複的 skipped-run 警示。Skipped 執行會保留獨立的連續 skip 計數器，因此不會影響執行錯誤退避。
- `openclaw cron edit` 會公開每個工作的警示調整：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 和 `--failure-alert-account-id`。

### 輸出語言

Cron 工作不會從頻道、locale 或先前訊息推斷回覆語言。請把語言規則放入排程訊息或範本：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

對於範本檔案，請將語言指示保留在渲染後的提示中，並在工作執行前確認像 `{{language}}` 這樣的 placeholder 已填入。如果輸出混用多種語言，請明確指定規則，例如：「敘述文字使用中文，技術術語保留英文。」

## 命令列介面範例

<Tabs>
  <Tab title="一次性提醒">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="週期性隔離工作">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="模型與 thinking 覆寫">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook 輸出">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="命令輸出">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
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
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Enable/disable without deleting
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` 會在排入手動執行後返回。對於 shutdown hook、維護指令碼，或其他必須阻塞直到佇列執行完成的自動化，請使用 `--wait`；它會輪詢回傳的 `runId`（預設 timeout `10m`、輪詢間隔 `2s`），狀態為 `ok` 時以 `0` 離開，`error`、`skipped` 或等待 timeout 時以非零值離開。

代理程式 `cron` 工具會從 `cron(action: "list")` 回傳精簡工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；對單一完整工作定義，請使用 `cron(action: "get", jobId: "...")`。直接閘道呼叫端可以將 `compact: true` 傳給 `cron.list`；省略它會保留含投遞預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名。新工作可以使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"`，或 ISO 時間戳記），後面接位置式代理程式提示。請在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的執行酬載 POST 到 HTTP 端點；網路鉤子傳遞不能與聊天傳遞旗標（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）合併使用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 會分別清除這些路由欄位（每個都會在與其對應的設定旗標一起使用時被拒絕）— 這不同於 `--no-deliver`，後者只會停用執行器備援傳遞。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作所選的模型。
- 如果模型被允許，該確切的提供者/模型會到達獨立代理程式執行。
- 如果模型未被允許或無法解析，排程會以明確的驗證錯誤讓該次執行失敗。
- API `cron.update` 酬載修補可以設定 `model: null` 來清除已儲存的工作模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 合併使用。
- 已設定的備援鏈仍會套用，因為排程 `--model` 是工作主要模型，而不是工作階段 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定酬載 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援並使執行採用嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除每個工作的覆寫。
- 沒有明確或已設定備援清單的單純 `--model`，不會靜默落到代理程式主要模型作為額外重試目標。

</Note>

## 網路鉤子

閘道可以公開 HTTP 網路鉤子端點以供外部觸發。在設定中啟用：

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

每個請求都必須透過標頭包含鉤子權杖：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

查詢字串權杖會被拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將系統事件排入主要工作階段：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件描述。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 或 `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    執行獨立代理程式回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.5"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自訂鉤子名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意酬載轉換成 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將鉤子端點放在 loopback、tailnet 或受信任的反向代理後方。

- 使用專用鉤子權杖；不要重用閘道驗證權杖。
- 將 `hooks.path` 保持在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds`，限制鉤子可指定的有效代理程式，包括省略 `agentId` 時的預設代理程式。
- 除非你需要呼叫端選擇工作階段，否則請維持 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 來限制允許的工作階段金鑰形狀。
- 鉤子酬載預設會以安全邊界包裹。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接到 OpenClaw。

<Note>
**先決條件：** `gcloud` 命令列介面、`gog`（gogcli）、已啟用的 OpenClaw 鉤子、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並預設使用 Tailscale Funnel 作為推送端點（`--tailscale funnel|serve|off`）。

### 閘道自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，閘道會在啟動時啟動 `gog gmail watch serve`，並自動續訂監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

### 手動一次性設定

<Steps>
  <Step title="Select the GCP project">
    選取擁有 `gog` 所用 OAuth 用戶端的 GCP 專案：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

上方的 `retry` 值是預設值：最多重試 3 次，使用 `30s/60s/5m` 退避，並重試全部五種暫時性類別。`webhookToken` 會在排程網路鉤子 POST 中以 `Authorization: Bearer <token>` 傳送。

`maxConcurrentRuns` 同時限制排定的排程派送與獨立代理程式回合執行，預設為 8。獨立排程代理程式回合會在內部使用佇列的專用 `cron-nested` 執行通道，因此提高此值可讓獨立的排程 LLM 執行平行推進，而不是只啟動它們的外層排程包裝器。共用的非排程 `nested` 通道不會由此設定擴寬。

`cron.store` 是邏輯儲存鍵與 doctor 遷移路徑，不是可手動編輯的即時 JSON 檔案。工作資料存放在 SQLite 中；請使用命令列介面或閘道 API 進行變更。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重試**：暫時性錯誤（速率限制、過載、網路、逾時、伺服器錯誤）會最多重試 `retry.maxAttempts` 次（預設 3），並使用 `retry.backoffMs`（預設 30s、60s、5m）。永久性錯誤會立即停用工作。

    **週期性重試**：連續執行錯誤會依延伸排程退避（30s、60s、5m、15m、60m）。退避會在下一次成功執行後重設。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（預設 `24h`，`false` 會停用）會清除獨立執行工作階段項目。`cron.runLog.keepLines` 會限制每個工作保留的 SQLite 執行歷史列數；`maxBytes` 會保留，以維持與較舊檔案式執行記錄的設定相容性。
  </Accordion>
  <Accordion title="Legacy store migration">
    升級時，執行 `openclaw doctor --fix` 以將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並使用 `.migrated` 後綴重新命名它們。格式錯誤的工作列會從執行階段略過，並複製到 `jobs-quarantine.json` 供之後修復或檢閱。
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
  <Accordion title="Cron not firing">
    - 檢查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 環境變數。
    - 確認閘道持續執行中。
    - 對於 `cron` 排程，請確認時區（`--tz`）與主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是使用 `openclaw cron run <jobId> --due` 檢查，而工作尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 傳遞模式 `none` 表示不預期有執行器備援傳送。當有可用的聊天路由時，代理程式仍可使用 `message` 工具直接傳送。
    - 傳遞目標遺失/無效（`channel`/`to`）表示已略過對外傳送。
    - 對 Matrix 而言，複製或舊版工作若含有小寫的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將工作編輯為來自 Matrix 的確切 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞遭認證資料阻擋。
    - 如果獨立執行只回傳靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳遞與備援佇列摘要路徑，因此不會有任何內容張貼回聊天。
    - 如果代理程式應自行傳訊給使用者，請檢查工作是否有可用路由（`channel: "last"` 且先前有聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日與閒置重設的新鮮度不是以 `updatedAt` 為基礎；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知和閘道簿記可能會為了路由/狀態更新工作階段列，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版列，當檔案仍可用時，OpenClaw 可以從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 沒有 `--tz` 的排程會使用閘道主機時區。
    - 沒有時區的 `at` 排程會被視為 UTC。
    - 心跳偵測 `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化](/zh-TW/automation) — 所有自動化機制一覽
- [背景任務](/zh-TW/automation/tasks) — 排程執行的任務分類帳
- [心跳偵測](/zh-TW/gateway/heartbeat) — 週期性主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
