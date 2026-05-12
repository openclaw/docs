---
read_when:
    - 排程背景工作或喚醒
    - 將外部觸發器（Webhook、Gmail）接入 OpenClaw
    - 為排程任務在 Heartbeat 與 Cron 之間做選擇
sidebarTitle: Scheduled tasks
summary: Gateway 排程器的排程作業、Webhook 與 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-05-12T00:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 內建的排程器。它會持久化工作、在正確時間喚醒代理，並可將輸出傳回聊天頻道或 Webhook 端點。

## 快速開始

<Steps>
  <Step title="新增一次性提醒">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
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

## Cron 的運作方式

- Cron 在 **Gateway** 程序內執行（不是在模型內）。
- 工作定義會持久化於 `~/.openclaw/cron/jobs.json`，因此重新啟動不會遺失排程。
- 執行階段執行狀態會持久化在旁邊的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中追蹤 cron 定義，請追蹤 `jobs.json`，並將 `jobs-state.json` 加入 gitignore。
- 分拆之後，較舊的 OpenClaw 版本可以讀取 `jobs.json`，但可能會將工作視為全新工作，因為執行階段欄位現在位於 `jobs-state.json`。
- 當 Gateway 正在執行或停止時編輯 `jobs.json`，OpenClaw 會比較已變更的排程欄位與待處理的執行階段時段中繼資料，並清除過期的 `nextRunAtMs` 值。純格式化或僅金鑰順序重寫會保留待處理時段。
- 所有 cron 執行都會建立[背景任務](/zh-TW/automation/tasks)記錄。
- Gateway 啟動時，逾期的隔離代理回合工作會被重新排程到頻道連線視窗之外，而不是立即重播，因此 Discord/Telegram 啟動與原生命令設定在重新啟動後仍能保持回應。
- 一次性工作（`--at`）預設會在成功後自動刪除。
- 隔離 cron 執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 收到狹義 cron 自我清理授權的隔離 cron 執行，仍可讀取排程器狀態、自我篩選後的目前工作清單，以及該工作的執行歷史，因此狀態/Heartbeat 檢查可以檢查自己的排程，而不會取得更廣泛的 cron 變更存取權。
- 隔離 cron 執行也會防止過期的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 及類似提示），且沒有任何後代子代理執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離 cron 執行會優先使用嵌入式執行提供的結構化執行拒絕中繼資料，然後才退回使用已知的最終摘要/輸出標記，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被阻擋的命令不會被回報為成功執行。
- 隔離 cron 執行也會將執行層級的代理失敗視為工作錯誤，即使沒有產生回覆承載也一樣，因此模型/提供者失敗會增加錯誤計數器並觸發失敗通知，而不是將工作清除為成功。
- 當隔離代理回合工作達到 `timeoutSeconds` 時，cron 會中止底層代理執行，並給它一小段清理視窗。如果該執行未能排空，Gateway 擁有的清理會在 cron 記錄逾時前，強制清除該執行的工作階段所有權，因此佇列中的聊天工作不會被留在過期的處理中工作階段後方。
- 如果隔離代理回合在執行器啟動前或第一次模型呼叫前停滯，cron 會記錄階段特定逾時，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。這些看門狗涵蓋嵌入式提供者與 CLI 支援的提供者，在其外部 CLI 程序實際啟動之前就會生效，並且會獨立於較長的 `timeoutSeconds` 值設定上限，因此冷啟動/驗證/內容失敗會快速浮現，而不是等待完整工作預算。

<a id="maintenance"></a>

<Note>
Cron 的任務調解首先由執行階段擁有，其次由持久化歷史支援：只要 cron 執行階段仍追蹤該工作為執行中，即使舊的子工作階段資料列仍存在，作用中的 cron 任務也會保持即時狀態。一旦執行階段停止擁有該工作，且 5 分鐘寬限視窗到期，維護檢查會針對相符的 `cron:<jobId>:<startedAt>` 執行，檢查持久化執行記錄與工作狀態。如果該持久化歷史顯示終端結果，任務分類帳會依此完成；否則 Gateway 擁有的維護可將任務標記為 `lost`。離線 CLI 稽核可從持久化歷史復原，但不會將它自己的空白程序內作用中工作集視為 Gateway 擁有的 cron 執行已消失的證明。
</Note>

## 排程類型

| 類型    | CLI 旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 這樣的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位 cron 運算式，可選用 `--tz` |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 以進行本地牆鐘時間排程。

每小時整點的週期性運算式會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 強制精準時間，或使用 `--stagger 30s` 指定明確視窗。

### 日期與星期使用 OR 邏輯

Cron 運算式由 [croner](https://github.com/Hexagon/croner) 解析。當日期與星期欄位都不是萬用字元時，croner 會在**任一**欄位符合時比對成功，而不是兩者都要符合。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5–6 次，而不是每月 0–1 次。OpenClaw 在此使用 Croner 的預設 OR 行為。若要要求兩個條件都符合，請使用 Croner 的 `+` 星期修飾符（`0 9 15 * +1`），或在一個欄位上排程，並在工作提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行位置                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主工作階段    | `main`              | 下一個 Heartbeat 回合      | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時繫結   | 具內容感知的週期性工作    |
| 自訂工作階段  | `session:custom-id` | 持久化命名工作階段 | 以歷史為基礎的工作流程 |

<AccordionGroup>
  <Accordion title="主工作階段、隔離與自訂">
    **主工作階段**工作會將系統事件加入佇列，並可選擇喚醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。這些系統事件不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**工作會以全新工作階段執行專用代理回合。**自訂工作階段**（`session:xxx`）會在多次執行之間持久化內容，啟用像是每日站會這類基於先前摘要的工作流程。
  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」意思">
    對隔離工作而言，「全新工作階段」表示每次執行都有新的逐字稿/工作階段 ID。OpenClaw 可能會帶入安全偏好，例如思考/快速/詳細設定、標籤，以及明確由使用者選取的模型/驗證覆寫，但不會繼承較舊 cron 資料列的環境對話內容：頻道/群組路由、傳送或佇列政策、提升權限、來源，或 ACP 執行階段繫結。當週期性工作應刻意基於相同對話內容時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對隔離工作而言，執行階段拆除現在包含該 cron 工作階段的盡力瀏覽器清理。清理失敗會被忽略，因此實際 cron 結果仍會優先。

    隔離 cron 執行也會透過共用的執行階段清理路徑，處置為該工作建立的任何 bundled MCP 執行階段執行個體。這與主工作階段和自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離 cron 工作不會在多次執行之間洩漏 stdio 子程序或長時間存在的 MCP 連線。

  </Accordion>
  <Accordion title="子代理與 Discord 交付">
    當隔離 cron 執行協調子代理時，交付也會優先採用最終後代輸出，而不是過期的父層暫時文字。如果後代仍在執行中，OpenClaw 會抑制該部分父層更新，而不是宣布它。

    對於純文字 Discord announce 目標，OpenClaw 只會傳送一次標準最終助理文字，而不是同時重播串流/中介文字承載與最終答案。媒體與結構化 Discord 承載仍會作為個別承載交付，因此附件與元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 隔離工作的承載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離工作必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用為該工作選取且允許的模型。
</ParamField>
<ParamField path="--thinking" type="string">
  思考層級覆寫。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會使用選取且允許的模型作為該工作的主要模型。它不同於聊天工作階段 `/model` 覆寫：當工作主要模型失敗時，已設定的後援鏈仍會套用。如果要求的模型未被允許或無法解析，cron 會以明確驗證錯誤讓執行失敗，而不是靜默退回到工作的代理/預設模型選取。

Cron 工作也可以攜帶承載層級的 `fallbacks`。存在時，該清單會取代工作的已設定後援鏈。當你想要嚴格的 cron 執行，只嘗試選取的模型時，請在工作承載/API 中使用 `fallbacks: []`。如果工作有 `--model`，但既沒有承載也沒有已設定的後援，OpenClaw 會傳遞明確的空白後援覆寫，因此代理主要模型不會被附加為隱藏的額外重試目標。

隔離工作的模型選取優先順序如下：

1. Gmail hook 模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每工作承載 `model`
3. 使用者選取並儲存的 cron 工作階段模型覆寫
4. 代理/預設模型選取

快速模式也會跟隨已解析的即時選取。如果選取的模型設定有 `params.fastMode`，隔離 cron 預設會使用它。儲存的工作階段 `fastMode` 覆寫在任一方向仍會優先於設定。

如果隔離執行遇到即時模型切換交接，cron 會以切換後的提供者/模型重試，並在重試前為作用中執行持久化該即時選取。當切換也攜帶新的驗證設定檔時，cron 也會為作用中執行持久化該驗證設定檔覆寫。重試有界限：初始嘗試加上 2 次切換重試後，cron 會中止，而不是永遠循環。

在隔離的 cron 執行進入 agent runner 之前，OpenClaw 會檢查已設定的 `api: "ollama"` 與 `api: "openai-completions"` provider，其 `baseUrl` 為 loopback、私人網路或 `.local` 時，可連線的本機 provider endpoint。若該 endpoint 已關閉，該次執行會記錄為 `skipped`，並附上清楚的 provider/model 錯誤，而不是開始 model 呼叫。Endpoint 結果會快取 5 分鐘，因此許多到期工作若使用同一個無法連線的本機 Ollama、vLLM、SGLang 或 LM Studio server，會共用一次小型 probe，而不是造成請求風暴。被 provider-preflight 略過的執行不會增加 execution-error backoff；若你想收到重複的略過通知，請啟用 `failureAlert.includeSkipped`。

## 傳遞與輸出

| 模式       | 會發生什麼                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果 agent 未傳送，則將最終文字 fallback 傳遞到 target |
| `webhook`  | 將完成的事件 payload POST 到 URL                                |
| `none`     | 沒有 runner fallback 傳遞                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行 channel 傳遞。若是 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；直接 RPC/config 呼叫者也可以將 `delivery.threadId` 以字串或數字傳入。Slack/Discord/Mattermost target 應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix room ID 有大小寫之分；請使用確切的 room ID，或使用 Matrix 提供的 `room:!room:server` 形式。

當 announce 傳遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶有 provider 前綴的 target 可以在 cron fallback 到 session 歷史或單一已設定 channel 之前選取 channel。只有已載入 Plugin 公布的前綴才是 provider selector。若 `delivery.channel` 是明確指定，target 前綴必須命名相同的 provider；例如 `channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀成電話號碼。像 `channel:<id>`、`user:<id>`、`imessage:<handle>` 與 `sms:<number>` 這類 target-kind 與 service 前綴，仍然是 channel 擁有的 target 語法，不是 provider selector。

對隔離工作而言，聊天傳遞是共享的。若有可用的聊天路由，即使工作使用 `--no-deliver`，agent 仍可使用 `message` 工具。若 agent 傳送到已設定/目前的 target，OpenClaw 會略過 fallback announce。否則，`announce`、`webhook` 與 `none` 只控制 runner 在 agent turn 結束後如何處理最終回覆。

當 agent 從作用中的聊天建立隔離 reminder 時，OpenClaw 會儲存保留下來的即時傳遞 target，以供 fallback announce 路由使用。內部 session key 可能是小寫；當目前聊天 context 可用時，不會從這些 key 重建 provider 傳遞 target。

隱含的 announce 傳遞會使用已設定的 channel allowlist 來驗證並重新路由過期 target。DM pairing-store 核准不是 fallback 自動化接收者；當排程工作應主動傳送到 DM 時，請設定 `delivery.to` 或設定 channel `allowFrom` 項目。

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個工作覆寫該設定。
- 若兩者都未設定，且工作已經透過 `announce` 傳遞，失敗通知現在會 fallback 到該主要 announce target。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 工作，除非主要傳遞模式是 `webhook`。
- `failureAlert.includeSkipped: true` 會讓工作或全域 cron alert policy 加入重複 skipped-run alert。被略過的執行會保有獨立的連續略過計數器，因此不會影響 execution-error backoff。

## CLI 範例

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
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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
</Tabs>

## Webhook

Gateway 可以公開 HTTP webhook endpoint 供外部 trigger 使用。請在 config 中啟用：

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

每個 request 都必須透過 header 包含 hook token：

- `Authorization: Bearer <token>`（建議）
- `x-openclaw-token: <token>`

Query-string token 會被拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將 system event 加入 main session 佇列：

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
    執行一個隔離的 agent turn：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自訂 hook 名稱會透過 config 中的 `hooks.mappings` 解析。Mapping 可以使用 template 或 code transform，將任意 payload 轉換為 `wake` 或 `agent` action。
  </Accordion>
</AccordionGroup>

<Warning>
請將 hook endpoint 放在 loopback、tailnet 或受信任的 reverse proxy 之後。

- 使用專用的 hook token；不要重複使用 gateway auth token。
- 將 `hooks.path` 保持在專用 subpath；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制明確的 `agentId` routing。
- 除非你需要呼叫者選取 session，否則請保持 `hooks.allowRequestSessionKey=false`。
- 若你啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的 session key 形狀。
- Hook payload 預設會以安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail inbox trigger 接到 OpenClaw。

<Note>
**先決條件：**`gcloud` CLI、`gog` (gogcli)、已啟用 OpenClaw hook，以及用於公開 HTTPS endpoint 的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` config、啟用 Gmail preset，並使用 Tailscale Funnel 作為 push endpoint。

### Gateway 自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，Gateway 會在開機時啟動 `gog gmail watch serve`，並自動續訂 watch。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

### 手動一次性設定

<Steps>
  <Step title="Select the GCP project">
    選取擁有 `gog` 所用 OAuth client 的 GCP project：

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

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model 覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作選取的 model。
- 若允許該 model，該確切的 provider/model 會到達隔離的 agent run。
- 若不允許或無法解析，cron 會以明確的驗證錯誤使該次執行失敗。
- 已設定的 fallback chain 仍會套用，因為 cron `--model` 是工作 primary，而不是 session `/model` 覆寫。
- Payload `fallbacks` 會取代該工作的已設定 fallback；`fallbacks: []` 會停用 fallback，並讓執行變成 strict。
- 沒有明確或已設定 fallback list 的一般 `--model`，不會默默落到 agent primary 作為額外重試 target。

</Note>

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` 會限制排程 cron dispatch 與隔離 agent-turn execution。隔離的 cron agent turn 會在內部使用佇列專用的 `cron-nested` execution lane，因此提高此值可讓獨立的 cron LLM run 平行推進，而不只是啟動它們外層的 cron wrapper。共享的非 cron `nested` lane 不會因這項設定而擴大。

Runtime state sidecar 會從 `cron.store` 推導：像 `~/clawd/cron/jobs.json` 這類 `.json` store 會使用 `~/clawd/cron/jobs-state.json`，而沒有 `.json` 後綴的 store path 會附加 `-state.json`。

若你手動編輯 `jobs.json`，請讓 `jobs-state.json` 不納入 source control。OpenClaw 會將該 sidecar 用於 pending slot、active marker、last-run metadata，以及告訴 scheduler 外部編輯的工作何時需要新的 `nextRunAtMs` 的 schedule identity。

停用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重試**：暫時性錯誤（rate limit、overload、network、server error）會以 exponential backoff 最多重試 3 次。永久錯誤會立即停用。

    **週期性重試**：重試之間使用 exponential backoff（30s 到 60m）。Backoff 會在下一次成功執行後重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`）會修剪隔離的執行工作階段項目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 會自動修剪執行記錄檔。
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
  <Accordion title="Cron 未觸發">
    - 檢查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 環境變數。
    - 確認 Gateway 持續執行中。
    - 對於 `cron` 排程，請確認時區（`--tz`）與主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是用 `openclaw cron run <jobId> --due` 檢查，而該工作尚未到期。

  </Accordion>
  <Accordion title="Cron 已觸發但沒有遞送">
    - 遞送模式 `none` 表示不預期會有執行器後援傳送。當有可用的聊天路由時，代理仍可直接使用 `message` 工具傳送。
    - 遞送目標缺少/無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版工作若含有小寫的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將工作編輯為 Matrix 中的精確 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示遞送已被憑證封鎖。
    - 如果隔離執行只傳回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外遞送，也會抑制後援佇列摘要路徑，因此不會有任何內容發回聊天。
    - 如果代理應自行傳訊給使用者，請檢查工作是否有可用路由（`channel: "last"` 且先前有聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止 /new 樣式輪替">
    - 每日與閒置重設的新鮮度不是以 `updatedAt` 為基礎；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - Cron 喚醒、Heartbeat 執行、exec 通知，以及 Gateway 簿記可能會為了路由/狀態更新工作階段資料列，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版資料列，若檔案仍可用，OpenClaw 可以從逐行 JSONL 逐字稿的工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未指定 `--tz` 的 Cron 會使用 Gateway 主機時區。
    - 沒有時區的 `at` 排程會被視為 UTC。
    - Heartbeat `activeHours` 使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化](/zh-TW/automation) — 所有自動化機制一覽
- [背景任務](/zh-TW/automation/tasks) — Cron 執行的任務分類帳
- [Heartbeat](/zh-TW/gateway/heartbeat) — 定期的主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
