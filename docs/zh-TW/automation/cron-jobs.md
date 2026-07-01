---
read_when:
    - 排程背景工作或喚醒
    - 將外部觸發器（網路鉤子、Gmail）接入 OpenClaw
    - 在排程任務中決定使用心跳偵測或排程
sidebarTitle: Scheduled tasks
summary: 用於閘道排程器的排程作業、網路鉤子與 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-07-01T02:57:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

排程是閘道內建的排程器。它會持久保存作業、在正確時間喚醒代理程式，並可將輸出傳回聊天頻道或網路鉤子端點。

## 快速開始

<Steps>
  <Step title="新增一次性提醒">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="檢查你的作業">
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

## 排程如何運作

- 排程會在**閘道內部**程序中執行（不是在模型內部）。
- 作業定義、執行階段狀態和執行歷程會持久保存在 OpenClaw 的共用 SQLite 狀態資料庫中，因此重新啟動不會遺失排程。
- 升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的作業列會從執行階段略過，並複製到 `jobs-quarantine.json` 供日後修復或檢閱。
- `cron.store` 仍會命名邏輯排程儲存鍵與 doctor 匯入路徑。匯入後，編輯該 JSON 檔案不再會變更作用中的排程作業；請改用 `openclaw cron add|edit|remove` 或閘道排程 RPC 方法。
- 所有排程執行都會建立[背景任務](/zh-TW/automation/tasks)記錄。
- 閘道啟動時，逾期的隔離代理程式回合作業會被重新排程到頻道連線時段之外，而不是立即重播，因此 Discord/Telegram 啟動與原生命令設定在重新啟動後仍保持回應。
- 一次性作業（`--at`）預設會在成功後自動刪除。
- 隔離排程執行完成時，會以盡力而為的方式關閉其 `cron:<jobId>` 工作階段追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 收到狹義排程自我清理授權的隔離排程執行，仍可讀取排程器狀態、自我篩選後的目前作業清單，以及該作業的執行歷程，因此狀態/心跳偵測檢查可以檢視自己的排程，而不會取得更廣泛的排程變更權限。
- 隔離排程執行也會防止過期的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 及類似提示），且沒有任何後代子代理程式執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離排程執行會使用嵌入式執行的結構化執行拒絕中繼資料，包括巢狀錯誤訊息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭的節點主機 `UNAVAILABLE` 包裝，因此被阻擋的命令不會被回報為成功執行，而一般助理文字也不會被視為拒絕。
- 隔離排程執行也會將執行層級的代理程式失敗視為作業錯誤，即使沒有產生回覆酬載也一樣，因此模型/提供者失敗會增加錯誤計數器並觸發失敗通知，而不是將作業清除為成功。
- 當隔離代理程式回合作業達到 `timeoutSeconds` 時，排程會中止底層代理程式執行，並給它一小段清理時間。如果執行未能排空，閘道擁有的清理會在排程記錄逾時前強制清除該執行的工作階段擁有權，因此佇列中的聊天工作不會被留在過期的處理工作階段後方。
- 如果隔離代理程式回合在執行器啟動前或第一次模型呼叫前停滯，排程會記錄階段特定逾時，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。這些監視器會在嵌入式提供者與 CLI 支援提供者的外部 CLI 程序實際啟動前涵蓋它們，並且會獨立於較長的 `timeoutSeconds` 值設定上限，讓冷啟動/驗證/內容失敗能快速浮現，而不是等待完整作業預算。
- 如果你使用系統排程或其他外部排程器來執行 `openclaw agent`，即使命令列介面會處理 `SIGTERM`/`SIGINT`，也請用硬性終止升級機制包住它。閘道支援的執行會要求閘道中止已接受的執行；本機與嵌入式備援執行會收到相同的中止訊號。對 GNU `timeout`，請優先使用 `timeout -k 60 600 openclaw agent ...`，而不是單純的 `timeout 600 ...`；如果程序無法排空，`-k` 值就是監督器的後備終止機制。對 systemd 單元，請使用 `SIGTERM` 停止訊號加上寬限時間（例如 `TimeoutStopSec`）後再進行最終終止，以保持相同形狀。如果重試在原始閘道執行仍作用中時重用 `--run-id`，重複項會被回報為執行中，而不是啟動第二個執行。

<a id="maintenance"></a>

<Note>
排程的任務協調首先由執行階段擁有，其次由持久歷程支援：只要排程執行階段仍追蹤該作業為執行中，作用中的排程任務就會保持即時狀態，即使舊的子工作階段列仍存在也一樣。一旦執行階段停止擁有該作業且 5 分鐘寬限期過期，維護檢查會針對相符的 `cron:<jobId>:<startedAt>` 執行檢查持久保存的執行記錄與作業狀態。如果該持久歷程顯示終止結果，任務帳本會由它完成；否則閘道擁有的維護可以將任務標記為 `lost`。離線命令列介面稽核可以從持久歷程復原，但它不會把自己程序內空的作用中作業集視為閘道擁有的排程執行已消失的證明。
</Note>

## 排程類型

| 種類    | 命令列介面旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位的 cron 表達式，可搭配選用的 `--tz` |

沒有時區的時間戳記會視為 UTC。加入 `--tz America/New_York` 可使用本地牆上時鐘排程。

整點重複表達式會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 強制精準時間，或使用 `--stagger 30s` 指定明確時間窗口。

### 月份日期與星期日期使用 OR 邏輯

Cron 表達式由 [croner](https://github.com/Hexagon/croner) 解析。當月份日期與星期日期欄位都不是萬用字元時，croner 會在**任一**欄位符合時比對成功，而不是兩者都必須符合。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5 到 6 次，而不是每月 0 到 1 次。OpenClaw 在此使用 Croner 的預設 OR 行為。若要要求兩個條件都符合，請使用 Croner 的 `+` 星期日期修飾符（`0 9 15 * +1`），或在其中一個欄位上排程，並在作業提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行位置                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 專用排程喚醒通道 | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景例行工作      |
| 目前工作階段 | `current`           | 建立時綁定   | 具情境感知的重複工作    |
| 自訂工作階段  | `session:custom-id` | 持久命名工作階段 | 建立於歷程之上的工作流程 |

<AccordionGroup>
  <Accordion title="主要工作階段與隔離及自訂的比較">
    **主要工作階段**作業會將系統事件排入排程擁有的執行通道，並可選擇喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主要工作階段的最後交付情境進行回覆，但不會將例行排程回合附加到人類聊天通道，也不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**作業會以全新的工作階段執行專用代理程式回合。**自訂工作階段**（`session:xxx`）會跨執行持久保存情境，支援像每日站會這類建立在先前摘要之上的工作流程。

    主要工作階段排程事件是自含式系統事件提醒。它們不會自動包含預設心跳偵測提示的「Read HEARTBEAT.md」指示。如果重複提醒應該查閱 `HEARTBEAT.md`，請在排程事件文字或代理程式自己的指示中明確說明。

  </Accordion>
  <Accordion title="隔離作業的「全新工作階段」代表什麼">
    對隔離作業而言，「全新工作階段」代表每次執行都有新的轉錄/工作階段 ID。OpenClaw 可能會帶入安全偏好，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫，但不會從較舊的排程列繼承周遭對話情境：頻道/群組路由、傳送或佇列政策、提升、來源或 ACP 執行階段繫結。當重複作業應刻意建立在相同對話情境上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對隔離作業而言，執行階段拆除現在包含對該排程工作階段的盡力而為瀏覽器清理。清理失敗會被忽略，因此實際排程結果仍會優先。

    隔離排程執行也會透過共用執行階段清理路徑，釋放為該作業建立的任何內建 MCP 執行階段執行個體。這與主要工作階段和自訂工作階段 MCP 用戶端的拆除方式相符，因此隔離排程作業不會跨執行洩漏 stdio 子程序或長生命週期 MCP 連線。

  </Accordion>
  <Accordion title="子代理程式與 Discord 交付">
    當隔離排程執行協調子代理程式時，交付也會優先採用最終後代輸出，而不是過期的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是公告它。

    對純文字 Discord 公告目標，OpenClaw 只會傳送一次標準最終助理文字，而不是同時重播串流/中繼文字酬載與最終答案。媒體與結構化 Discord 酬載仍會作為個別酬載交付，因此附件和元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 命令酬載

針對應在閘道排程器內執行、而不啟動模型支援的隔離代理程式回合的確定性指令碼，請使用命令酬載。命令作業會在閘道主機上執行、擷取 stdout/stderr、將執行記錄到排程歷程，並重用與隔離作業相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
命令排程是操作員管理員閘道自動化介面，不是代理程式 `tools.exec` 呼叫。建立、更新、移除或手動執行排程作業需要 `operator.admin`；稍後排定的命令執行會在閘道程序內作為該管理員撰寫的自動化執行。代理程式 exec 政策（例如 `tools.exec.mode`、核准提示與各代理程式工具允許清單）管理模型可見的 exec 工具，而不是命令排程酬載。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。當你想要在不經 shell 解析的情況下精確執行 argv 時，請使用 `--command-argv '["node","scripts/report.mjs"]'`。選用的 `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds` 和 `--output-max-bytes` 欄位會控制程序環境、stdin 與輸出界限。

如果 stdout 非空，該文字就是已傳送的結果。如果 stdout 為空且 stderr 非空，則會傳送 stderr。如果兩個串流都存在，cron 會傳送一個小型 `stdout:` / `stderr:` 區塊。零結束代碼會將執行記錄為 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄為 `error`，並且可觸發失敗警示。只列印 `NO_REPLY` 的命令會使用一般 cron 靜默權杖抑制機制，不會回傳任何內容到聊天。

### 隔離作業的承載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離時必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用為該作業選取的允許模型。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個作業的備援模型清單，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。傳入 `--fallbacks ""` 可進行沒有備援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 上，移除每個作業的備援覆寫，讓作業遵循已設定的備援優先順序。不能與 `--fallbacks` 合併使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 上，移除每個作業的模型覆寫，讓作業遵循一般 cron 模型選取優先順序（若已設定則使用儲存的 cron 工作階段覆寫，否則使用代理程式/預設模型）。不能與 `--model` 合併使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 上，移除每個作業的思考覆寫，讓作業遵循一般 cron 思考優先順序。不能與 `--thinking` 合併使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作業可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會使用選取的允許模型作為該作業的主要模型。這與聊天工作階段的 `/model` 覆寫不同：當作業主要模型失敗時，已設定的備援鏈仍會套用。如果要求的模型不被允許或無法解析，cron 會以明確的驗證錯誤讓該次執行失敗，而不是靜默退回到作業的代理程式/預設模型選取。

Cron 作業也可以攜帶承載層級的 `fallbacks`。當存在時，該清單會取代作業已設定的備援鏈。若你想要嚴格的 cron 執行，只嘗試選取的模型，請在作業承載/API 中使用 `fallbacks: []`。如果作業有 `--model` 但既沒有承載備援也沒有已設定的備援，OpenClaw 會傳入明確的空備援覆寫，因此代理程式主要模型不會作為隱藏的額外重試目標附加進來。

本機提供者預檢會先走訪已設定的備援，然後才將 cron 執行標記為 `skipped`；`fallbacks: []` 會讓該預檢路徑保持嚴格。

隔離作業的模型選取優先順序如下：

1. Gmail 鉤子模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個作業承載的 `model`
3. 使用者選取並儲存的 cron 工作階段模型覆寫
4. 代理程式/預設模型選取

快速模式也會遵循解析後的即時選取。如果選取的模型設定具有 `params.fastMode`，隔離 cron 預設會使用它。儲存的工作階段 `fastMode` 覆寫仍會在任一方向上優先於設定。自動模式會在存在時使用所選模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果隔離執行遇到即時模型切換交接，cron 會使用切換後的提供者/模型重試，並在重試前為目前執行保存該即時選取。當切換也攜帶新的驗證設定檔時，cron 也會為目前執行保存該驗證設定檔覆寫。重試有界限：在初始嘗試加上 2 次切換重試後，cron 會中止，而不是永遠循環。

在隔離 cron 執行進入代理程式 runner 之前，OpenClaw 會檢查已設定 `api: "ollama"` 和 `api: "openai-completions"` 的提供者是否有可連線的本機提供者端點，且其 `baseUrl` 為 local loopback、私人網路或 `.local`。如果該端點已關閉，執行會記錄為 `skipped`，並附上清楚的提供者/模型錯誤，而不是開始模型呼叫。端點結果會快取 5 分鐘，因此許多到期作業若使用同一個故障的本機 Ollama、vLLM、SGLang 或 LM Studio 伺服器，會共用一次小型探測，而不是造成請求風暴。被提供者預檢略過的執行不會增加執行錯誤退避；當你想要重複略過通知時，請啟用 `failureAlert.includeSkipped`。

## 傳送與輸出

| 模式       | 會發生什麼                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 若代理程式未傳送，則以備援方式將最終文字傳送到目標 |
| `webhook`  | 將完成事件承載 POST 到 URL                                |
| `none`     | 沒有 runner 備援傳送                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳送。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 擁有的 `-1001234567890:123` 簡寫。直接 RPC/設定呼叫者可以將 `delivery.threadId` 傳入為字串或數字。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用確切的房間 ID，或來自 Matrix 的 `room:!room:server` 形式。

當公告傳送使用 `channel: "last"` 或省略 `channel` 時，帶有提供者前綴的目標（例如 `telegram:123`）可以在 cron 退回到工作階段歷史或單一已設定頻道之前選取頻道。只有已載入外掛所宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同提供者；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴（例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`）仍然是頻道擁有的目標語法，而不是提供者選擇器。

對於隔離作業，聊天傳送是共用的。如果有可用的聊天路由，即使作業使用 `--no-deliver`，代理程式也可以使用 `message` 工具。如果代理程式傳送到已設定/目前的目標，OpenClaw 會略過備援公告。否則，`announce`、`webhook` 和 `none` 只會控制 runner 在代理程式回合後如何處理最終回覆。

當代理程式從作用中的聊天建立隔離提醒時，OpenClaw 會儲存保留下來的即時傳送目標，供備援公告路由使用。內部工作階段鍵可能是小寫；當目前聊天上下文可用時，不會從這些鍵重新建構提供者傳送目標。

隱含公告傳送會使用已設定的頻道允許清單來驗證並重新路由過期目標。DM 配對儲存核准不是備援自動化收件者；當排程作業應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道的 `allowFrom` 項目。

## 輸出語言

Cron 作業不會從頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放在排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

對於範本檔案，請在呈現後的提示中保留語言指示，並在工作執行前確認 `{{language}}` 等預留位置已填入。如果輸出混用多種語言，請明確訂定規則，例如：「敘述文字使用中文，技術術語保留英文。」

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個工作覆寫該設定。
- 如果兩者都未設定，且工作已透過 `announce` 傳送，失敗通知現在會退回使用該主要 announce 目標。
- 除非主要傳送模式是 `webhook`，否則 `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 工作。
- `failureAlert.includeSkipped: true` 會讓工作或全域排程警示政策啟用重複的已略過執行警示。已略過執行會保留獨立的連續略過計數器，因此不會影響執行錯誤的退避。

## 命令列介面範例

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

## 網路鉤子

閘道可以公開 HTTP 網路鉤子端點供外部觸發使用。在設定中啟用：

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

每個請求都必須透過標頭包含 hook token：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

查詢字串 token 會被拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將系統事件加入主工作階段佇列：

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
    執行隔離的 agent 回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自訂 hook 名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意酬載轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將 hook 端點置於 loopback、tailnet 或受信任的反向代理後方。

- 使用專用的 hook 權杖；不要重複使用閘道驗證權杖。
- 將 `hooks.path` 保持在專用子路徑上；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制 hook 可以指定的有效 agent，包括省略 `agentId` 時的預設 agent。
- 除非你需要由呼叫端選擇 session，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果你啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的 session key 形狀。
- Hook payload 預設會以安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器接到 OpenClaw。

<Note>
**先決條件：** `gcloud` 命令列介面、`gog` (gogcli)、已啟用 OpenClaw hooks、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail preset，並使用 Tailscale Funnel 作為推送端點。

### 閘道自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，閘道會在啟動時啟動 `gog gmail watch serve`，並自動續訂 watch。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇停用。

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
  <Step title="建立 topic 並授予 Gmail 推送存取權">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="啟動 watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model 覆寫

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

## 管理 jobs

```bash
# 列出所有 jobs
openclaw cron list

# 以 JSON 取得一個已儲存的 job
openclaw cron get <jobId>

# 顯示一個 job，包括解析後的 delivery route
openclaw cron show <jobId>

# 編輯 job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即強制執行 job
openclaw cron run <jobId>

# 立即強制執行 job 並等待其 terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 僅在到期時執行
openclaw cron run <jobId> --due

# 檢視執行歷史
openclaw cron runs --id <jobId> --limit 50

# 檢視一個精確的 run
openclaw cron runs --id <jobId> --run-id <runId>

# 刪除 job
openclaw cron remove <jobId>

# Agent 選擇（multi-agent 設定）
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` 會在將手動 run 排入佇列後返回。對於 shutdown hooks、維護 scripts，或其他必須阻塞直到佇列 run 完成的自動化，請使用 `--wait`。等待模式會輪詢精確返回的 `runId`；狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時以非零值結束。

Agent `cron` tool 會從 `cron(action: "list")` 返回精簡 job 摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；使用 `cron(action: "get", jobId: "...")` 取得一個完整 job 定義。直接的閘道呼叫端可將 `compact: true` 傳給 `cron.list`；省略它則保留既有完整回應與 delivery previews。

`openclaw cron create` 是 `openclaw cron add` 的 alias，而新 jobs 可以使用位置式 schedule（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO timestamp），後面接位置式 agent prompt。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的 run payload 以 POST 傳送到 HTTP 端點。網路鉤子 delivery 不能與 `--announce`、`--channel`、`--to`、`--thread-id` 或 `--account` 等 chat delivery flags 合併使用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 會個別取消設定這些 routing fields（每個都會在與其相對應的 set flag 一起使用時被拒絕），這與 `--no-deliver` 停用 runner fallback delivery 不同。

<Note>
Model 覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更 job 選取的 model。
- 如果該 model 被允許，該精確的 provider/model 會抵達 isolated agent run。
- 如果未被允許或無法解析，cron 會以明確的 validation error 使該 run 失敗。
- API `cron.update` payload patches 可以設定 `model: null` 來清除已儲存的 job model 覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` patch 相同），且不能與 `--model` 合併使用。
- 已設定的 fallback chains 仍會套用，因為 cron `--model` 是 job primary，而不是 session `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定 payload `fallbacks`，取代該 job 的已設定 fallbacks；`--fallbacks ""` 會停用 fallback 並使 run 採嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除 per-job 覆寫。
- 沒有明確或已設定 fallback list 的單純 `--model`，不會靜默地落回 agent primary 作為額外 retry target。

</Note>

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` 會限制 scheduled cron dispatch 與 isolated agent-turn execution，預設為 8。Isolated cron agent turns 會在內部使用佇列專用的 `cron-nested` execution lane，因此提高此值可讓獨立的 cron LLM runs 平行推進，而不是只啟動其外層 cron wrappers。共享的非 cron `nested` lane 不會因這項設定而擴寬。

`cron.store` 是 logical store key 與 legacy doctor import path。執行 `openclaw doctor --fix` 將既有 JSON stores 匯入 SQLite 並封存；未來 cron 變更應透過命令列介面或閘道 API 進行。

停用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry 行為">
    **One-shot retry**：暫時性錯誤（rate limit、overload、network、server error）最多重試 3 次，並使用 exponential backoff。永久性錯誤會立即停用。

    **Recurring retry**：重試之間使用 exponential backoff（30s 到 60m）。下次成功執行後會重設 backoff。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`）會修剪 isolated run-session entries。`cron.runLog.keepLines` 會限制每個 job 保留的 SQLite run-history rows；`maxBytes` 為了與較舊的 file-backed run logs 的設定相容性而保留。
  </Accordion>
</AccordionGroup>

## 疑難排解

### Command ladder

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
  <Accordion title="Cron 未觸發">
    - 檢查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` env var。
    - 確認閘道持續執行中。
    - 對於 `cron` schedules，驗證 timezone（`--tz`）與 host timezone。
    - run output 中的 `reason: not-due` 表示手動 run 是以 `openclaw cron run <jobId> --due` 檢查，而該 job 尚未到期。

  </Accordion>
  <Accordion title="Cron 已觸發但沒有 delivery">
    - Delivery mode `none` 表示不預期有 runner fallback send。當 chat route 可用時，agent 仍可使用 `message` tool 直接傳送。
    - Delivery target 遺失/無效（`channel`/`to`）表示 outbound 已被略過。
    - 對於 Matrix，複製或 legacy jobs 若有小寫的 `delivery.to` room IDs，可能會失敗，因為 Matrix room IDs 區分大小寫。將 job 編輯為來自 Matrix 的精確 `!room:server` 或 `room:!room:server` 值。
    - Channel auth errors（`unauthorized`、`Forbidden`）表示 delivery 被 credentials 阻擋。
    - 如果 isolated run 只返回 silent token（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接 outbound delivery，也會抑制 fallback queued summary path，因此不會有任何內容張貼回 chat。
    - 如果 agent 應該自行傳訊給 user，請檢查 job 是否有可用 route（`channel: "last"` 搭配先前 chat，或明確 channel/target）。

  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止 /new-style rollover">
    - Daily 和 idle reset freshness 不是基於 `updatedAt`；請參閱 [Session management](/zh-TW/concepts/session#session-lifecycle)。
    - Cron wakeups、heartbeat runs、exec notifications 和 gateway bookkeeping 可能會為 routing/status 更新 session row，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在前建立的 legacy rows，OpenClaw 可以在檔案仍可用時，從 transcript JSONL session header 還原 `sessionStartedAt`。沒有 `lastInteractionAt` 的 legacy idle rows 會使用該還原的 start time 作為其 idle baseline。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 沒有 `--tz` 的 Cron 會使用 gateway host timezone。
    - 沒有 timezone 的 `at` schedules 會被視為 UTC。
    - 心跳偵測 `activeHours` 使用已設定的 timezone resolution。

  </Accordion>
</AccordionGroup>

## 相關

- [Automation](/zh-TW/automation) — 所有自動化機制一覽
- [Background Tasks](/zh-TW/automation/tasks) — cron executions 的 task ledger
- [心跳偵測](/zh-TW/gateway/heartbeat) — 定期的 main-session turns
- [Timezone](/zh-TW/concepts/timezone) — timezone 設定
