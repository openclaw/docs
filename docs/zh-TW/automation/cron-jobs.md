---
read_when:
    - 排程背景工作或喚醒
    - 將外部觸發器（網路鉤子、Gmail）接入 OpenClaw
    - 為排程任務在心跳偵測與排程之間做出選擇
sidebarTitle: Scheduled tasks
summary: 排程作業、網路鉤子與用於閘道排程器的 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-07-02T07:55:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

排程是閘道內建的排程器。它會持久保存作業、在正確時間喚醒代理，並且可以將輸出傳回聊天頻道或網路鉤子端點。

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

- 排程在**閘道**程序內執行（不是在模型內）。
- 作業定義、執行階段狀態和執行歷程會持久保存在 OpenClaw 的共享 SQLite 狀態資料庫中，因此重新啟動不會遺失排程。
- 升級時，執行 `openclaw doctor --fix`，將舊版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案匯入 SQLite，並以 `.migrated` 後綴重新命名。格式錯誤的作業列會在執行階段被略過，並複製到 `jobs-quarantine.json` 以便日後修復或審閱。
- `cron.store` 仍然命名邏輯排程儲存鍵和 doctor 匯入路徑。匯入後，編輯該 JSON 檔案不再變更作用中的排程作業；請改用 `openclaw cron add|edit|remove` 或閘道排程 RPC 方法。
- 所有排程執行都會建立[背景工作](/zh-TW/automation/tasks)記錄。
- 閘道啟動時，逾期的隔離代理回合作業會被重新排程到頻道連線視窗之外，而不是立即重播，因此 Discord/Telegram 啟動和原生命令設定在重新啟動後仍能保持回應。
- 一次性作業（`--at`）預設會在成功後自動刪除。
- 隔離排程執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 收到狹義排程自我清理授權的隔離排程執行，仍可讀取排程器狀態、經自我篩選的目前作業清單，以及該作業的執行歷程，因此狀態/心跳偵測檢查可以檢查自己的排程，而不會取得更廣泛的排程變更存取權。
- 隔離排程執行也會防止陳舊的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 和類似提示），且沒有後代子代理執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離排程執行會使用嵌入式執行的結構化執行拒絕中繼資料，包括 node-host `UNAVAILABLE` 包裝，其巢狀錯誤訊息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 開頭，因此被阻擋的命令不會被回報為成功執行，而一般助理文字也不會被視為拒絕。
- 隔離排程執行也會將執行層級的代理失敗視為作業錯誤，即使沒有產生回覆承載也一樣，因此模型/供應商失敗會遞增錯誤計數器並觸發失敗通知，而不是將作業清除為成功。
- 當隔離代理回合作業達到 `timeoutSeconds` 時，排程會中止底層代理執行，並給它一小段清理視窗。如果執行未清空，閘道擁有的清理會在排程記錄逾時之前強制清除該執行的工作階段所有權，因此排隊中的聊天工作不會卡在陳舊的處理中工作階段後面。
- 如果隔離代理回合在執行器啟動前或第一次模型呼叫前停滯，排程會記錄階段特定的逾時，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。這些看門狗會涵蓋嵌入式供應商和命令列介面支援的供應商，在其外部命令列介面程序實際啟動之前就生效，且會獨立於較長的 `timeoutSeconds` 值封頂，因此冷啟動/驗證/內容失敗會快速浮現，而不是等待完整作業預算。
- 如果你使用系統排程或另一個外部排程器執行 `openclaw agent`，即使命令列介面會處理 `SIGTERM`/`SIGINT`，也要用硬式終止升級包裝它。閘道支援的執行會要求閘道中止已接受的執行；本機和嵌入式備援執行會收到相同的中止訊號。對 GNU `timeout`，建議使用 `timeout -k 60 600 openclaw agent ...`，而不是純 `timeout 600 ...`；如果程序無法清空，`-k` 值就是監督程式的後備保護。對 systemd 單元，使用 `SIGTERM` 停止訊號加上像 `TimeoutStopSec` 這樣的寬限視窗，再進行任何最終終止，以維持相同形式。如果重試在原始閘道執行仍作用中時重用 `--run-id`，該重複執行會被回報為進行中，而不是啟動第二個執行。

<a id="maintenance"></a>

<Note>
排程的工作協調首先由執行階段擁有，其次由持久歷程支援：只要排程執行階段仍追蹤該作業為執行中，作用中的排程工作就會保持存活，即使舊的子工作階段列仍存在也一樣。當執行階段停止擁有該作業且 5 分鐘寬限視窗到期後，維護會檢查持久化執行日誌和作業狀態，以尋找相符的 `cron:<jobId>:<startedAt>` 執行。如果該持久歷程顯示終端結果，工作帳本會據此完成；否則閘道擁有的維護可以將工作標記為 `lost`。離線命令列介面稽核可以從持久歷程復原，但不會把自己空的程序內作用中作業集合視為閘道擁有的排程執行已消失的證據。
</Note>

## 排程類型

| 類型    | 命令列介面旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位 cron 表達式，可選用 `--tz` |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 以進行本地牆上時鐘排程。

每小時整點的週期性表達式會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 強制精確時間，或使用 `--stagger 30s` 指定明確視窗。

### 月份日期和星期幾使用 OR 邏輯

cron 表達式由 [croner](https://github.com/Hexagon/croner) 解析。當月份日期和星期幾欄位都不是萬用字元時，croner 會在**任一**欄位相符時匹配，而不是兩者都相符。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5–6 次，而不是每月 0–1 次。OpenClaw 在此使用 Croner 的預設 OR 行為。若要要求兩個條件都成立，請使用 Croner 的 `+` 星期幾修飾符（`0 9 15 * +1`），或在一個欄位上排程，並在作業的提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行於                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主工作階段    | `main`              | 專用排程喚醒通道 | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時綁定   | 感知內容的週期性工作    |
| 自訂工作階段  | `session:custom-id` | 持久命名工作階段 | 以歷程為基礎的工作流程 |

<AccordionGroup>
  <Accordion title="主工作階段、隔離與自訂">
    **主工作階段**作業會將系統事件排入排程擁有的執行通道，並可選擇喚醒心跳偵測（`--wake now` 或 `--wake next-heartbeat`）。它們可以使用目標主工作階段最後的交付內容來回覆，但不會將例行排程回合附加到人工聊天通道，也不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**作業會以新工作階段執行專用代理回合。**自訂工作階段**（`session:xxx`）會跨執行保留內容，啟用像每日站會這類建立在先前摘要之上的工作流程。

    主工作階段排程事件是自含式系統事件提醒。它們不會
    自動包含預設心跳偵測提示的「Read
    HEARTBEAT.md」指示。如果週期性提醒應查閱
    `HEARTBEAT.md`，請在排程事件文字或代理自己的指示中
    明確說明。

  </Accordion>
  <Accordion title="隔離作業的「新工作階段」意義">
    對隔離作業而言，「新工作階段」表示每次執行都有新的逐字稿/工作階段 ID。OpenClaw 可能會攜帶安全偏好，例如思考/快速/詳細設定、標籤，以及明確由使用者選取的模型/驗證覆寫，但它不會從較舊的排程列繼承環境對話內容：頻道/群組路由、傳送或佇列政策、提升權限、來源或 ACP 執行階段綁定。當週期性作業應刻意以相同對話內容為基礎時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對隔離作業而言，執行階段拆除現在包含該排程工作階段的盡力瀏覽器清理。清理失敗會被忽略，因此實際排程結果仍然優先。

    隔離排程執行也會透過共享的執行階段清理路徑，處置為該作業建立的任何隨附 MCP 執行階段執行個體。這與主工作階段和自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離排程作業不會在執行之間洩漏 stdio 子程序或長期存在的 MCP 連線。

  </Accordion>
  <Accordion title="子代理與 Discord 交付">
    當隔離排程執行協調子代理時，交付也會偏好最終後代輸出，而不是陳舊的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是公告它。

    對純文字 Discord 公告目標，OpenClaw 只會傳送一次標準最終助理文字，而不是同時重播串流/中間文字承載和最終答案。媒體和結構化 Discord 承載仍會以獨立承載交付，因此附件和元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 命令承載

對應在閘道排程器內執行、且不應啟動模型支援隔離代理回合的確定性指令碼，請使用命令承載。命令作業會在閘道主機上執行、擷取 stdout/stderr、在排程歷程中記錄該執行，並重用與隔離作業相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
命令排程是操作員管理員的閘道自動化表面，不是代理
`tools.exec` 呼叫。建立、更新、移除或手動執行排程作業
需要 `operator.admin`；之後排定的命令執行會在
閘道程序內作為該管理員撰寫的自動化執行。代理 exec 政策，例如
`tools.exec.mode`、核准提示和每代理工具允許清單，管理的是
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

`--command <shell>` 會儲存 `argv: ["sh", "-lc", <shell>]`。當你想要不經 shell 解析、精確執行 argv 時，使用 `--command-argv '["node","scripts/report.mjs"]'`。選用的 `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds` 和 `--output-max-bytes` 欄位會控制程序環境、stdin 和輸出界限。

如果 stdout 非空，該文字就是已交付的結果。如果 stdout 為空且 stderr 非空，則交付 stderr。如果兩個串流都存在，排程會交付一小段 `stdout:` / `stderr:` 區塊。零退出碼會將執行記錄為 `ok`；非零退出、訊號、逾時或無輸出逾時會記錄為 `error`，並可能觸發失敗警示。只印出 `NO_REPLY` 的命令會使用一般排程靜默權杖抑制，且不會將任何內容發回聊天。

### 隔離工作負載的酬載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用為該工作選取的允許模型。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每個工作的備援模型清單，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。傳入 `--fallbacks ""` 可執行沒有備援的嚴格執行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 時，移除每個工作的備援覆寫，讓工作遵循已設定的備援優先順序。不能與 `--fallbacks` 合併使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 時，移除每個工作的模型覆寫，讓工作遵循一般排程模型選取優先順序（若已設定則使用儲存的排程工作階段覆寫，否則使用代理程式/預設模型）。不能與 `--model` 合併使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 時，移除每個工作的思考覆寫，讓工作遵循一般排程思考優先順序。不能與 `--thinking` 合併使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會使用選取的允許模型作為該工作的主要模型。這與聊天工作階段的 `/model` 覆寫不同：當工作主要模型失敗時，已設定的備援鏈仍會套用。如果請求的模型不被允許或無法解析，排程會以明確的驗證錯誤讓該次執行失敗，而不是靜默退回該工作的代理程式/預設模型選取。

排程工作也可以攜帶酬載層級的 `fallbacks`。存在時，該清單會取代該工作的已設定備援鏈。當你想要只嘗試選取模型的嚴格排程執行時，請在工作酬載/API 中使用 `fallbacks: []`。如果工作有 `--model`，但沒有酬載或已設定的備援，OpenClaw 會傳遞明確的空備援覆寫，避免將代理程式主要模型附加為隱藏的額外重試目標。

本機提供者預檢會先逐一檢查已設定的備援，才將排程執行標記為 `skipped`；`fallbacks: []` 會讓該預檢路徑保持嚴格。

隔離工作的模型選取優先順序如下：

1. Gmail 鉤子模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個工作酬載的 `model`
3. 使用者選取並儲存的排程工作階段模型覆寫
4. 代理程式/預設模型選取

快速模式也會遵循已解析的即時選取。如果選取的模型設定有 `params.fastMode`，隔離排程預設會使用該設定。儲存的工作階段 `fastMode` 覆寫仍會在任一方向上優先於設定。自動模式會在存在時使用所選模型的 `params.fastAutoOnSeconds` 截止值，預設為 60 秒。

如果隔離執行遇到即時模型切換交接，排程會使用切換後的提供者/模型重試，並在重試前為作用中執行保留該即時選取。當切換同時攜帶新的驗證設定檔時，排程也會為作用中執行保留該驗證設定檔覆寫。重試有界限：在初始嘗試加上 2 次切換重試後，排程會中止，而不是無限循環。

在隔離排程執行進入代理程式執行器之前，OpenClaw 會檢查已設定的 `api: "ollama"` 和 `api: "openai-completions"` 提供者中，`baseUrl` 為 loopback、私人網路或 `.local` 的可連線本機提供者端點。如果該端點關閉，執行會被記錄為 `skipped`，並附上清楚的提供者/模型錯誤，而不是啟動模型呼叫。端點結果會快取 5 分鐘，因此許多到期工作若使用同一個已失效的本機 Ollama、vLLM、SGLang 或 LM Studio 伺服器，會共用一次小型探測，而不是造成請求風暴。略過的提供者預檢執行不會增加執行錯誤退避；若你想收到重複略過通知，請啟用 `failureAlert.includeSkipped`。

## 交付與輸出

| 模式       | 發生的行為                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理程式未傳送，則將最終文字備援交付到目標 |
| `webhook`  | 將完成事件酬載 POST 到 URL                                |
| `none`     | 沒有執行器備援交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道交付。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 擁有的 `-1001234567890:123` 簡寫。直接 RPC/設定呼叫者可以以字串或數字傳入 `delivery.threadId`。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用精確的房間 ID，或使用來自 Matrix 的 `room:!room:server` 形式。

當宣告交付使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶提供者前綴的目標，可以在排程退回工作階段歷史或單一已設定頻道之前選取頻道。只有載入的外掛所公告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同提供者；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴，例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`，仍是頻道擁有的目標語法，而不是提供者選擇器。

對於隔離工作，聊天交付是共用的。如果有可用的聊天路由，即使工作使用 `--no-deliver`，代理程式仍可使用 `message` 工具。如果代理程式傳送到已設定/目前的目標，OpenClaw 會略過備援宣告。否則，`announce`、`webhook` 和 `none` 只會控制執行器在代理程式回合後如何處理最終回覆。

當代理程式從作用中聊天建立隔離提醒時，OpenClaw 會儲存保留的即時交付目標，用於備援宣告路由。內部工作階段鍵可能是小寫；當目前聊天內容可用時，不會從這些鍵重建提供者交付目標。

隱含宣告交付會使用已設定的頻道允許清單來驗證並重新路由過期目標。DM 配對儲存核准不是備援自動化接收者；當排程工作應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道 `allowFrom` 項目。

## 輸出語言

排程工作不會從頻道、地區設定或先前訊息推斷回覆語言。請將語言規則放入排程訊息或範本中：

```bash
openclaw cron edit <jobId> \
  --message "彙總更新。以中文回覆；保持 URL、程式碼和產品名稱不變。"
```

對於範本檔案，請在轉譯後的提示中保留語言指示，並在工作執行前
確認 `{{language}}` 等佔位符已填入。如果
輸出混用多種語言，請明確寫出規則，例如：「敘述文字使用中文，
技術術語保持英文。」

失敗通知會走另一條目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個工作覆寫該設定。
- 如果兩者都未設定，且該工作已透過 `announce` 傳送，失敗通知現在會退回到該主要公告目標。
- 只有 `sessionTarget="isolated"` 工作支援 `delivery.failureDestination`，除非主要傳送模式是 `webhook`。
- `failureAlert.includeSkipped: true` 會讓工作或全域排程警示政策啟用重複的略過執行警示。略過的執行會保留獨立的連續略過計數器，因此不會影響執行錯誤的退避。

## 命令列介面範例

<Tabs>
  <Tab title="一次性提醒">
    ```bash
    openclaw cron add \
      --name "行事曆檢查" \
      --at "20m" \
      --session main \
      --system-event "下一次心跳偵測：檢查行事曆。" \
      --wake now
    ```
  </Tab>
  <Tab title="定期隔離工作">
    ```bash
    openclaw cron create "0 7 * * *" \
      "彙總隔夜更新。" \
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
      "將今天的部署彙總為 JSON。" \
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

## 網路鉤子

閘道可以公開 HTTP 網路鉤子端點，以供外部觸發。請在設定中啟用：

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
    為主要工作階段將系統事件加入佇列：

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
  <Accordion title="對應的鉤子 (POST /hooks/<name>)">
    自訂鉤子名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意酬載轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將鉤子端點置於 loopback、tailnet 或受信任的反向代理後方。

- 使用專用的鉤子權杖；不要重複使用閘道驗證權杖。
- 將 `hooks.path` 保持在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds`，以限制鉤子可鎖定的有效代理程式，包括省略 `agentId` 時的預設代理程式。
- 除非你需要由呼叫端選擇工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes`，以限制允許的工作階段金鑰形狀。
- 鉤子酬載預設會以安全邊界包裹。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器接到 OpenClaw。

<Note>
**先決條件：** `gcloud` 命令列介面、`gog` (gogcli)、已啟用 OpenClaw 鉤子、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並使用 Tailscale Funnel 作為推送端點。

### 閘道自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，閘道會在啟動時啟動 `gog gmail watch serve`，並自動續期監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

### 手動一次性設定

<Steps>
  <Step title="Select the GCP project">
    選取擁有 `gog` 使用之 OAuth 用戶端的 GCP 專案：

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

## 管理作業

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

`openclaw cron run <jobId>` 會在手動執行入列後返回。對於關機鉤子、維護指令碼，或其他必須封鎖直到已排入佇列的執行完成的自動化，請使用 `--wait`。等待模式會輪詢確切返回的 `runId`；狀態為 `ok` 時以 `0` 結束，狀態為 `error`、`skipped` 或等待逾時時以非零值結束。

代理程式 `cron` 工具會從 `cron(action: "list")` 返回精簡作業摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；若要取得單一完整作業定義，請使用 `cron(action: "get", jobId: "...")`。直接呼叫閘道的呼叫端可以將 `compact: true` 傳給 `cron.list`；省略它會保留既有含交付預覽的完整回應。

`openclaw cron create` 是 `openclaw cron add` 的別名，新的作業可以使用位置式排程（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 時間戳記），後接位置式代理程式提示。請在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，將完成的執行酬載 POST 到 HTTP 端點。網路鉤子交付不能與聊天交付旗標（例如 `--announce`、`--channel`、`--to`、`--thread-id` 或 `--account`）合併使用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 會個別取消設定這些路由欄位（每個都會在與其對應的設定旗標一起使用時被拒絕），這不同於 `--no-deliver` 停用執行器後援交付。

<Note>
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更作業所選模型。
- 如果模型被允許，該確切的提供者/模型會到達隔離的代理程式執行。
- 如果不被允許或無法解析，排程會讓該次執行失敗，並提供明確的驗證錯誤。
- API `cron.update` 酬載修補可以設定 `model: null`，以清除已儲存作業的模型覆寫。
- `openclaw cron edit <job-id> --clear-model` 會從命令列介面清除該覆寫（效果與 `model: null` 修補相同），且不能與 `--model` 合併使用。
- 已設定的後援鏈仍會套用，因為排程 `--model` 是作業主要模型，而不是工作階段 `/model` 覆寫。
- `openclaw cron add|edit --fallbacks ...` 會設定酬載 `fallbacks`，取代該作業已設定的後援；`--fallbacks ""` 會停用後援並讓執行變為嚴格模式。`openclaw cron edit <job-id> --clear-fallbacks` 會清除每個作業的覆寫。
- 沒有明確或已設定後援清單的單純 `--model`，不會靜默落回代理程式主要模型作為額外重試目標。

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

`maxConcurrentRuns` 會同時限制已排程的排程分派與隔離代理程式回合執行，預設為 8。隔離的排程代理程式回合會在內部使用佇列專用的 `cron-nested` 執行通道，因此提高此值可讓獨立的排程 LLM 執行並行推進，而不是只啟動其外層排程包裝器。共享的非排程 `nested` 通道不會因這項設定而擴寬。

`cron.store` 是邏輯儲存鍵與舊版 doctor 匯入路徑。執行 `openclaw doctor --fix` 可將既有 JSON 儲存匯入 SQLite 並封存；未來的排程變更應透過命令列介面或閘道 API 進行。

停用排程：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重試**：暫時性錯誤（速率限制、過載、網路、伺服器錯誤）最多會以指數退避重試 3 次。永久性錯誤會立即停用。

    **週期性重試**：重試之間使用指數退避（30 秒到 60 分鐘）。下一次成功執行後會重設退避。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（預設 `24h`）會修剪隔離執行工作階段項目。`cron.runLog.keepLines` 會限制每個作業保留的 SQLite 執行歷史資料列；`maxBytes` 保留用於與較舊檔案式執行記錄的設定相容性。
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
    - 確認閘道正在持續執行。
    - 對於 `cron` 排程，請確認時區（`--tz`）相對於主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是使用 `openclaw cron run <jobId> --due` 檢查，而作業尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 交付模式 `none` 表示不預期傳送執行器後援。當聊天路由可用時，代理程式仍可使用 `message` 工具直接傳送。
    - 交付目標遺失/無效（`channel`/`to`）表示已略過輸出。
    - 對於 Matrix，複製或舊版作業若有小寫的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將作業編輯為來自 Matrix 的確切 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示交付遭憑證封鎖。
    - 如果隔離執行只返回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接輸出交付，也會抑制後援佇列摘要路徑，因此不會有任何內容貼回聊天。
    - 如果代理程式應自行傳訊給使用者，請檢查該作業是否有可用路由（`channel: "last"` 且先前有聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日與閒置重設的新鮮度不是基於 `updatedAt`；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - 排程喚醒、心跳偵測執行、exec 通知和閘道簿記可能會為了路由/狀態更新工作階段資料列，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在前建立的舊版資料列，當檔案仍可用時，OpenClaw 可以從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 沒有 `--tz` 的排程會使用閘道主機時區。
    - 沒有時區的 `at` 排程會視為 UTC。
    - 心跳偵測 `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化](/zh-TW/automation) — 所有自動化機制一覽
- [背景工作](/zh-TW/automation/tasks) — 排程執行的工作分類帳
- [心跳偵測](/zh-TW/gateway/heartbeat) — 週期性主工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
