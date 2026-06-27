---
read_when:
    - 排程背景工作或喚醒
    - 將外部觸發器（網路鉤子、Gmail）接入 OpenClaw
    - 為排程任務決定使用心跳偵測或排程
sidebarTitle: Scheduled tasks
summary: 已排程工作、網路鉤子，以及用於閘道排程器的 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-06-27T18:53:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

排程是閘道的內建排程器。它會持久保存工作、在正確時間喚醒代理，並可將輸出傳回聊天頻道或網路鉤子端點。

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

- 排程會在**閘道**程序內執行（不是在模型內）。
- 工作定義、執行階段狀態和執行歷史會持久保存在 OpenClaw 的共用 SQLite 狀態資料庫中，因此重新啟動不會遺失排程。
- 升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的工作資料列會在執行階段被略過，並複製到 `jobs-quarantine.json` 供之後修復或審查。
- `cron.store` 仍用來命名邏輯排程儲存鍵和 doctor 匯入路徑。匯入後，編輯該 JSON 檔案不再會變更作用中的排程工作；請改用 `openclaw cron add|edit|remove` 或閘道排程 RPC 方法。
- 所有排程執行都會建立[背景任務](/zh-TW/automation/tasks)記錄。
- 閘道啟動時，逾期的隔離代理回合工作會被重新排程到頻道連線視窗之外，而不是立即重播，因此 Discord/Telegram 啟動和原生命令設定在重新啟動後仍能保持回應。
- 一次性工作（`--at`）預設在成功後自動刪除。
- 隔離排程執行在完成時，會盡力關閉其 `cron:<jobId>` 工作階段追蹤到的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 收到狹義排程自我清理授權的隔離排程執行，仍可讀取排程器狀態、只包含自身目前工作的自我篩選清單，以及該工作的執行歷史，因此狀態/心跳偵測檢查可以檢視自己的排程，而不會取得更廣泛的排程變更存取權。
- 隔離排程執行也會防範過時的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 及類似提示），且沒有仍負責最終答案的後代子代理執行，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離排程執行會使用嵌入式執行中的結構化執行拒絕中繼資料，包括節點主機 `UNAVAILABLE` 包裝器，其巢狀錯誤訊息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭，因此被封鎖的命令不會被回報為成功執行，而一般助理文字也不會被視為拒絕。
- 隔離排程執行也會將執行層級的代理失敗視為工作錯誤，即使沒有產生回覆承載也一樣，因此模型/供應商失敗會增加錯誤計數並觸發失敗通知，而不是將工作清除為成功。
- 當隔離代理回合工作達到 `timeoutSeconds` 時，排程會中止底層代理執行，並給它一小段清理時間。如果執行未能排空，閘道擁有的清理會在排程記錄逾時前強制清除該執行的工作階段所有權，因此佇列中的聊天工作不會卡在過時的處理工作階段後面。
- 如果隔離代理回合在執行器啟動前或第一次模型呼叫前停滯，排程會記錄階段特定逾時，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。這些看門狗會涵蓋嵌入式供應商和命令列介面支援的供應商，在其外部命令列介面程序真正啟動前生效，且會獨立於較長的 `timeoutSeconds` 值設定上限，因此冷啟動/驗證/內容失敗會快速浮現，而不是等待完整工作預算。
- 如果你使用系統排程或其他外部排程器來執行 `openclaw agent`，即使命令列介面會處理 `SIGTERM`/`SIGINT`，也請用強制終止升級包住它。閘道支援的執行會要求閘道中止已接受的執行；本機和嵌入式後援執行會收到相同的中止訊號。對 GNU `timeout`，優先使用 `timeout -k 60 600 openclaw agent ...`，而不是純粹的 `timeout 600 ...`；如果程序無法排空，`-k` 值就是監督器的後備保護。對 systemd 單元，請使用 `SIGTERM` 停止訊號加上一段寬限時間（例如 `TimeoutStopSec`）後才進行最終終止，以保持相同形態。如果重試在原始閘道執行仍作用中時重用 `--run-id`，重複項會被回報為執行中，而不是啟動第二個執行。

<a id="maintenance"></a>

<Note>
排程的任務調和首先由執行階段擁有，其次由持久歷史支援：只要排程執行階段仍追蹤該工作為執行中，即使舊的子工作階段資料列仍存在，作用中的排程任務也會保持即時狀態。一旦執行階段停止擁有該工作且 5 分鐘寬限視窗到期，維護檢查會查看持久保存的執行記錄和工作狀態，尋找相符的 `cron:<jobId>:<startedAt>` 執行。如果該持久歷史顯示終端結果，任務分類帳會依此完成；否則閘道擁有的維護可將任務標記為 `lost`。離線命令列介面稽核可從持久歷史復原，但它不會把自己程序內空的作用中工作集合視為閘道擁有的排程執行已消失的證明。
</Note>

## 排程類型

| 種類    | 命令列介面旗標 | 說明                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 這樣的相對時間）    |
| `every` | `--every` | 固定間隔                                                |
| `cron`  | `--cron`  | 5 欄位或 6 欄位排程表示式，可搭配選用的 `--tz`          |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 以使用本地牆鐘時間排程。

每小時整點的週期表示式會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 強制精準時間，或使用 `--stagger 30s` 指定明確視窗。

### 日期和星期使用 OR 邏輯

排程表示式由 [croner](https://github.com/Hexagon/croner) 解析。當日期和星期欄位都不是萬用字元時，croner 會在**任一**欄位符合時匹配，而不是兩者都要符合。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5 到 6 次，而不是每月 0 到 1 次。OpenClaw 在這裡使用 Croner 的預設 OR 行為。若要要求兩個條件都符合，請使用 Croner 的 `+` 星期修飾符（`0 9 15 * +1`），或在一個欄位上排程，並在工作的提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值     | 執行位置                 | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 專用排程喚醒通道         | 提醒、系統事件                |
| 隔離            | `isolated`          | 專用 `cron:<jobId>`      | 報告、背景雜務                |
| 目前工作階段    | `current`           | 建立時繫結               | 具內容感知的週期工作          |
| 自訂工作階段    | `session:custom-id` | 持久命名工作階段         | 建立在歷史之上的工作流程      |

<AccordionGroup>
  <Accordion title="主要工作階段、隔離與自訂的比較">
    **主要工作階段**工作會將系統事件排入排程擁有的執行通道，並可選擇性喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可使用目標主要工作階段的最後交付內容來回覆，但不會將例行排程回合附加到人類聊天通道，也不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**工作會以全新工作階段執行專用代理回合。**自訂工作階段**（`session:xxx`）會跨執行持久保存內容，支援像每日站會這類建立在先前摘要之上的工作流程。

    主要工作階段排程事件是自含的系統事件提醒。它們不會
    自動包含預設心跳偵測提示中的「Read
    HEARTBEAT.md」指示。如果週期提醒應查閱
    `HEARTBEAT.md`，請在排程事件文字或代理自己的指示中明確說明。

  </Accordion>
  <Accordion title="隔離工作中「全新工作階段」的意義">
    對隔離工作而言，「全新工作階段」表示每次執行都有新的逐字稿/工作階段 ID。OpenClaw 可能會帶入安全偏好，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫，但不會從較舊的排程資料列繼承環境對話內容：頻道/群組路由、傳送或佇列策略、提升、來源，或 ACP 執行階段繫結。當週期工作應刻意建立在相同對話內容之上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對隔離工作而言，執行階段拆除現在包含對該排程工作階段的盡力瀏覽器清理。清理失敗會被忽略，因此實際排程結果仍優先。

    隔離排程執行也會透過共用的執行階段清理路徑，釋放為該工作建立的任何 bundled MCP 執行階段執行個體。這與主要工作階段和自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離排程工作不會在執行之間洩漏 stdio 子程序或長生命週期 MCP 連線。

  </Accordion>
  <Accordion title="子代理與 Discord 交付">
    當隔離排程執行協調子代理時，交付也會優先採用最終後代輸出，而不是過時的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是宣告它。

    對純文字 Discord 宣告目標，OpenClaw 會只傳送一次標準最終助理文字，而不是同時重播串流/中繼文字承載和最終答案。媒體和結構化 Discord 承載仍會作為個別承載交付，因此附件和元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 命令承載

對於應在閘道排程器內執行、且不需啟動模型支援隔離代理回合的確定性腳本，請使用命令承載。命令工作會在閘道主機上執行、擷取 stdout/stderr、在排程歷史中記錄執行，並重用與隔離工作相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
命令排程是操作員管理員閘道自動化介面，不是代理
`tools.exec` 呼叫。建立、更新、移除或手動執行排程工作
需要 `operator.admin`；已排定的命令執行稍後會在
閘道程序內以該管理員建立的自動化身分執行。代理 exec 策略，例如
`tools.exec.mode`、核准提示和每代理工具允許清單，管控的是
模型可見的 exec 工具，而不是命令排程承載。
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。當你想要不經 shell 解析、以精確 argv 執行時，請使用 `--command-argv '["node","scripts/report.mjs"]'`。選用的 `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds` 和 `--output-max-bytes` 欄位會控制程序環境、stdin 和輸出界限。

如果 stdout 非空，該文字就是送達結果。如果 stdout 為空且 stderr 非空，則送達 stderr。如果兩個串流都存在，cron 會送達一個小型 `stdout:` / `stderr:` 區塊。零結束碼會將該次執行記錄為 `ok`；非零結束、訊號、逾時或無輸出逾時會記錄為 `error`，並可觸發失敗警示。只列印 `NO_REPLY` 的命令會使用一般 cron 靜默權杖抑制機制，不會回傳任何內容到聊天。

### 隔離作業的酬載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用該作業所選的允許模型。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個作業的備援模型清單，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。傳入 `--fallbacks ""` 可進行沒有備援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 時，移除每個作業的備援覆寫，讓作業遵循已設定的備援優先順序。不可與 `--fallbacks` 合併使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 時，移除每個作業的模型覆寫，讓作業遵循一般 cron 模型選擇優先順序（若已設定則使用已儲存的 cron 工作階段覆寫，否則使用代理/default 模型）。不可與 `--model` 合併使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作業可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會將所選的允許模型用作該作業的主要模型。這與聊天工作階段的 `/model` 覆寫不同：當作業主要模型失敗時，已設定的備援鏈仍會套用。如果要求的模型不被允許或無法解析，cron 會以明確的驗證錯誤讓該次執行失敗，而不是靜默退回到該作業的代理/default 模型選擇。

Cron 作業也可以攜帶酬載層級的 `fallbacks`。存在時，該清單會取代作業已設定的備援鏈。當你想要嚴格的 cron 執行且只嘗試所選模型時，請在作業酬載/API 中使用 `fallbacks: []`。如果作業有 `--model`，但沒有酬載或已設定的備援，OpenClaw 會傳入明確的空備援覆寫，因此代理主要模型不會作為隱藏的額外重試目標被附加。

本機提供者預檢會先走訪已設定的備援，才將 cron 執行標記為 `skipped`；`fallbacks: []` 會讓該預檢路徑保持嚴格。

隔離作業的模型選擇優先順序如下：

1. Gmail 鉤子模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個作業酬載的 `model`
3. 使用者選取且已儲存的 cron 工作階段模型覆寫
4. 代理/default 模型選擇

快速模式也會遵循解析後的即時選擇。如果所選模型設定有 `params.fastMode`，隔離 cron 預設會使用它。已儲存的工作階段 `fastMode` 覆寫仍會在任一方向優先於設定。自動模式會在存在時使用所選模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果隔離執行遇到即時模型切換交接，cron 會使用切換後的提供者/模型重試，並在重試前保存該作用中執行的即時選擇。當切換也攜帶新的驗證設定檔時，cron 也會保存該作用中執行的驗證設定檔覆寫。重試有界限：在初次嘗試加上 2 次切換重試後，cron 會中止，而不是無限循環。

在隔離 cron 執行進入代理執行器之前，OpenClaw 會檢查已設定 `api: "ollama"` 和 `api: "openai-completions"` 提供者中可連線的本機提供者端點，其 `baseUrl` 為 local loopback、私人網路或 `.local`。如果該端點停止運作，該次執行會被記錄為 `skipped`，並帶有清楚的提供者/模型錯誤，而不是開始模型呼叫。端點結果會快取 5 分鐘，因此許多到期作業若使用同一個停止運作的本機 Ollama、vLLM、SGLang 或 LM Studio 伺服器，會共用一次小型探測，而不是造成請求風暴。略過的提供者預檢執行不會增加執行錯誤退避；當你想要重複的略過通知時，啟用 `failureAlert.includeSkipped`。

## 傳送與輸出

| 模式       | 會發生什麼                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理未傳送，則以備援方式將最終文字傳送到目標 |
| `webhook`  | 將完成事件酬載 POST 到 URL                                |
| `none`     | 沒有執行器備援傳送                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳送。對於 Telegram 論壇主題，使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 擁有的 `-1001234567890:123` 簡寫。直接 RPC/設定呼叫者可以將 `delivery.threadId` 作為字串或數字傳入。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用確切的房間 ID 或 Matrix 的 `room:!room:server` 格式。

當宣告傳送使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這樣帶有提供者前綴的目標，可以在 cron 退回到工作階段歷史或單一已設定頻道之前選取頻道。只有已載入外掛宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同的提供者；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標類型與服務前綴，例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`，仍是頻道擁有的目標語法，而不是提供者選擇器。

對於隔離作業，聊天傳送是共用的。如果聊天路由可用，即使作業使用 `--no-deliver`，代理也可以使用 `message` 工具。如果代理傳送到已設定/目前的目標，OpenClaw 會略過備援宣告。否則 `announce`、`webhook` 和 `none` 只會控制執行器在代理回合後如何處理最終回覆。

當代理從作用中聊天建立隔離提醒時，OpenClaw 會為備援宣告路由儲存保留的即時傳送目標。內部工作階段鍵可能是小寫；當目前聊天內容可用時，提供者傳送目標不會從這些鍵重建。

隱含宣告傳送會使用已設定的頻道允許清單來驗證並重新路由過期目標。DM 配對儲存核准不是備援自動化收件者；當排程作業應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道的 `allowFrom` 項目。

## 輸出語言

Cron 作業不會從頻道、地區設定或先前
訊息推斷回覆語言。請將語言規則放入排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

對於範本檔案，請將語言指示保留在轉譯後的提示中，並
在作業執行前確認 `{{language}}` 等預留位置已填入。如果
輸出混用多種語言，請讓規則明確，例如："Use Chinese
for narrative text and keep technical terms in English."

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個作業覆寫該值。
- 如果兩者都未設定，且作業已透過 `announce` 傳送，失敗通知現在會退回到該主要宣告目標。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 作業，除非主要傳送模式是 `webhook`。
- `failureAlert.includeSkipped: true` 會讓作業或全域 cron 警示政策選擇接收重複的略過執行警示。略過的執行會保留獨立的連續略過計數器，因此不會影響執行錯誤退避。

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
  <Tab title="週期性隔離作業">
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
  <Tab title="模型與思考覆寫">
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
  <Tab title="網路鉤子輸出">
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
    執行隔離的代理回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應鉤子 (POST /hooks/<name>)">
    自訂鉤子名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意酬載轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將鉤子端點置於 local loopback、tailnet 或受信任的反向代理後方。

- 使用專用的鉤子權杖；不要重複使用閘道驗證權杖。
- 將 `hooks.path` 保留在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制鉤子可指定的有效代理，包括省略 `agentId` 時的預設代理。
- 除非需要由呼叫者選取工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的工作階段鍵形狀。
- 鉤子酬載預設會以安全邊界包裹。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接到 OpenClaw。

<Note>
**必要條件：** `gcloud` 命令列介面、`gog` (gogcli)、已啟用 OpenClaw hooks、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設組態，並使用 Tailscale Funnel 作為推送端點。

### 閘道自動啟動

當設定 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，閘道會在開機時啟動 `gog gmail watch serve`，並自動續期監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可退出。

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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 管理工作

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

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

`openclaw cron run <jobId>` 會在將手動執行加入佇列後返回。對於必須封鎖直到佇列執行完成的關閉 hooks、維護腳本或其他自動化，請使用 `--wait`。等待模式會輪詢確切返回的 `runId`；狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時以非零值結束。

代理程式 `cron` 工具會從 `cron(action: "list")` 返回精簡工作摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；若要取得單一完整工作定義，請使用 `cron(action: "get", jobId: "...")`。直接呼叫閘道的呼叫端可以將 `compact: true` 傳給 `cron.list`；省略它會保留既有包含傳遞預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名，而新工作可以使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後面接著位置式代理程式提示。可在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的執行酬載 POST 到 HTTP 端點。網路鉤子傳遞不能與聊天傳遞旗標（例如 `--announce`、`--channel`、`--to`、`--thread-id` 或 `--account`）合併使用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 會分別取消設定這些路由欄位（每個都會在與其對應的設定旗標一起使用時被拒絕），這與 `--no-deliver` 停用執行器備援傳遞不同。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作選取的模型。
- 如果模型被允許，該確切的供應商/模型會到達隔離代理程式執行。
- 如果不被允許或無法解析，排程會以明確的驗證錯誤使該次執行失敗。
- API `cron.update` 酬載修補可以設定 `model: null`，以清除已儲存的工作模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 合併使用。
- 已設定的備援鏈仍會套用，因為排程 `--model` 是工作主要模型，而不是工作階段 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定酬載 `fallbacks`，取代該工作的已設定備援；`--fallbacks ""` 會停用備援，並使執行變為嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除每個工作的覆寫。
- 沒有明確或已設定備援清單的純 `--model`，不會以靜默額外重試目標的形式退回到代理程式主要模型。

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

`maxConcurrentRuns` 會同時限制排程分派與隔離代理程式回合執行，預設值為 8。隔離排程代理程式回合在內部使用佇列專用的 `cron-nested` 執行通道，因此提高此值可讓彼此獨立的排程 LLM 執行平行推進，而不是只啟動其外層排程包裝器。共享的非排程 `nested` 通道不會因這項設定而擴大。

`cron.store` 是邏輯儲存鍵與舊版 doctor 匯入路徑。執行 `openclaw doctor --fix` 將現有 JSON 儲存匯入 SQLite 並封存；未來排程變更應透過命令列介面或閘道 API 進行。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **單次重試**：暫時性錯誤（速率限制、過載、網路、伺服器錯誤）會以指數退避最多重試 3 次。永久性錯誤會立即停用。

    **週期性重試**：重試之間採用指數退避（30 秒到 60 分鐘）。下一次成功執行後會重設退避。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`）會修剪隔離執行工作階段項目。`cron.runLog.keepLines` 會限制每個工作保留的 SQLite 執行歷史列數；`maxBytes` 會保留，以便與較舊的檔案支援執行記錄設定相容。
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
    - 對於 `cron` 排程，請驗證時區（`--tz`）與主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是以 `openclaw cron run <jobId> --due` 檢查，且該工作尚未到期。

  </Accordion>
  <Accordion title="排程已觸發但未傳遞">
    - 傳遞模式 `none` 表示預期不會有執行器備援傳送。當有可用聊天路由時，代理程式仍可使用 `message` 工具直接傳送。
    - 傳遞目標遺失/無效（`channel`/`to`）表示已略過外送。
    - 對於 Matrix，複製或舊版工作若含有小寫的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將工作編輯為來自 Matrix 的確切 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞已被憑證阻擋。
    - 如果隔離執行只返回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接外送傳遞，也會抑制備援佇列摘要路徑，因此不會有任何內容回傳到聊天。
    - 如果代理程式應自行傳訊給使用者，請檢查工作是否有可用路由（`channel: "last"` 且先前有聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="排程或心跳偵測似乎會阻止 /new-style 輪替">
    - 每日與閒置重設的新鮮度不是以 `updatedAt` 為基礎；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知與閘道記帳可能會更新用於路由/狀態的工作階段列，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在前建立的舊版列，當檔案仍可用時，OpenClaw 可從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 沒有 `--tz` 的排程會使用閘道主機時區。
    - 沒有時區的 `at` 排程會被視為 UTC。
    - 心跳偵測 `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化](/zh-TW/automation) — 所有自動化機制一覽
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作台帳
- [心跳偵測](/zh-TW/gateway/heartbeat) — 週期性主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
