---
read_when:
    - 排程背景工作或喚醒
    - 將外部觸發器（Webhook、Gmail）接入 OpenClaw
    - 為排程任務選擇 Heartbeat 或 Cron
sidebarTitle: Scheduled tasks
summary: 用於 Gateway 排程器的排程工作、Webhook 與 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-05-07T13:13:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 內建的排程器。它會持久化作業、在正確時間喚醒代理，並可將輸出傳回聊天頻道或 Webhook 端點。

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
  <Step title="檢查你的作業">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看執行歷史">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 如何運作

- Cron 在 **Gateway** 程序內執行（不是在模型內）。
- 作業定義會持久化於 `~/.openclaw/cron/jobs.json`，因此重新啟動不會遺失排程。
- 執行階段狀態會持久化在旁邊的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中追蹤 cron 定義，請追蹤 `jobs.json` 並將 `jobs-state.json` 加入 gitignore。
- 分拆之後，較舊的 OpenClaw 版本可以讀取 `jobs.json`，但可能會將作業視為全新作業，因為執行階段欄位現在位於 `jobs-state.json`。
- 當 Gateway 執行中或停止時編輯 `jobs.json`，OpenClaw 會比較變更後的排程欄位與待執行階段時段中繼資料，並清除過期的 `nextRunAtMs` 值。純格式化或僅鍵順序改寫會保留待執行時段。
- 所有 cron 執行都會建立[背景任務](/zh-TW/automation/tasks)記錄。
- Gateway 啟動時，逾期的隔離代理回合作業會被重新排程到頻道連線視窗之外，而不是立即重播，因此 Discord/Telegram 啟動與原生命令設定在重新啟動後仍能保持回應。
- 一次性作業（`--at`）預設會在成功後自動刪除。
- 隔離的 cron 執行在完成時，會盡力關閉其 `cron:<jobId>` 工作階段追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 獲得狹義 cron 自我清理授權的隔離 cron 執行，仍可讀取排程器狀態以及經自我篩選的目前作業清單，因此狀態/Heartbeat 檢查可檢視自己的排程，而不會取得更廣泛的 cron 變更存取權。
- 隔離 cron 執行也會防範過期的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 與類似提示），且沒有任何子代理後代執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離 cron 執行會優先使用內嵌執行提供的結構化執行拒絕中繼資料，接著才回退到已知的最終摘要/輸出標記，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被阻擋的命令不會被回報為成功執行。
- 隔離 cron 執行也會將執行層級的代理失敗視為作業錯誤，即使沒有產生回覆 payload 也是如此，因此模型/供應商失敗會增加錯誤計數器並觸發失敗通知，而不是將作業清除為成功。
- 當隔離代理回合作業達到 `timeoutSeconds`，cron 會中止底層代理執行並給予短暫清理視窗。如果執行未能排空，Gateway 擁有的清理會在 cron 記錄逾時之前強制清除該執行的工作階段所有權，因此佇列中的聊天工作不會被留在過期的處理工作階段後面。

<a id="maintenance"></a>

<Note>
cron 的任務協調首先由執行階段擁有，其次由持久歷史支援：只要 cron 執行階段仍追蹤該作業為執行中，作用中的 cron 任務就會保持存活，即使舊的子工作階段列仍存在。當執行階段不再擁有該作業且 5 分鐘寬限視窗到期後，維護會檢查持久化執行記錄與作業狀態，尋找相符的 `cron:<jobId>:<startedAt>` 執行。如果該持久歷史顯示終止結果，任務帳本會依此完成；否則 Gateway 擁有的維護可將任務標記為 `lost`。離線 CLI 稽核可以從持久歷史復原，但不會將自己在程序內的空作用中作業集合視為 Gateway 擁有的 cron 執行已消失的證明。
</Note>

## 排程類型

| 種類    | CLI 旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 這樣的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位 cron 運算式，可選用 `--tz` |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 可使用本地牆鐘時間排程。

整點的週期性運算式會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 可強制精確時間，或使用 `--stagger 30s` 指定明確視窗。

### 月中日與週中日使用 OR 邏輯

Cron 運算式由 [croner](https://github.com/Hexagon/croner) 解析。當月中日與週中日欄位都不是萬用字元時，croner 會在**任一**欄位相符時匹配，而不是兩者都相符。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5 到 6 次，而不是每月 0 到 1 次。OpenClaw 在此使用 Croner 的預設 OR 行為。若要要求兩個條件都成立，請使用 Croner 的 `+` 週中日修飾符（`0 9 15 * +1`），或在其中一個欄位上排程，並在作業的提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行於                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主工作階段    | `main`              | 下一個 Heartbeat 回合      | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時綁定   | 具情境感知的週期性工作    |
| 自訂工作階段  | `session:custom-id` | 持久命名工作階段 | 建立於歷史之上的工作流程 |

<AccordionGroup>
  <Accordion title="主工作階段、隔離與自訂">
    **主工作階段**作業會將系統事件加入佇列，並可選擇性喚醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。這些系統事件不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**作業會使用全新的工作階段執行專用代理回合。**自訂工作階段**（`session:xxx`）會跨執行保留情境，支援像每日站會這類建立於先前摘要之上的工作流程。
  </Accordion>
  <Accordion title="隔離作業的「全新工作階段」含義">
    對隔離作業而言，「全新工作階段」表示每次執行都有新的逐字稿/工作階段 id。OpenClaw 可能會攜帶安全偏好，例如 thinking/fast/verbose 設定、標籤，以及明確由使用者選擇的模型/驗證覆寫，但不會從較舊的 cron 列繼承環境對話情境：頻道/群組路由、傳送或佇列政策、提升權限、來源或 ACP 執行階段繫結。當週期性作業應刻意建立在相同對話情境上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對隔離作業而言，執行階段拆除現在包含對該 cron 工作階段的最佳努力瀏覽器清理。清理失敗會被忽略，因此實際 cron 結果仍是最終依據。

    隔離 cron 執行也會透過共用的執行階段清理路徑，處置為該作業建立的任何 bundled MCP 執行階段實例。這與主工作階段與自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離 cron 作業不會在多次執行之間洩漏 stdio 子程序或長時間存活的 MCP 連線。

  </Accordion>
  <Accordion title="子代理與 Discord 交付">
    當隔離 cron 執行編排子代理時，交付也會優先使用最終後代輸出，而不是過期的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是宣布它。

    對純文字 Discord announce 目標，OpenClaw 只會傳送一次標準最終助理文字，而不是同時重播串流/中間文字 payload 與最終答案。媒體與結構化 Discord payload 仍會作為獨立 payload 交付，因此附件與元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 隔離作業的 payload 選項

<ParamField path="--message" type="string" required>
  提示文字（隔離作業必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用該作業所選的允許模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 層級覆寫。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制該作業可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會將所選的允許模型用作該作業的主要模型。這不同於聊天工作階段 `/model` 覆寫：當作業主要模型失敗時，已設定的回退鏈仍會套用。如果請求的模型不被允許或無法解析，cron 會以明確的驗證錯誤使該執行失敗，而不是默默回退到作業的代理/預設模型選擇。

Cron 作業也可以攜帶 payload 層級的 `fallbacks`。存在時，該清單會取代該作業已設定的回退鏈。當你想要嚴格的 cron 執行，只嘗試所選模型時，請在作業 payload/API 中使用 `fallbacks: []`。如果作業有 `--model`，但沒有 payload 或已設定的回退，OpenClaw 會傳遞明確的空回退覆寫，因此代理主要模型不會被附加為隱藏的額外重試目標。

隔離作業的模型選擇優先順序為：

1. Gmail hook 模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個作業 payload 的 `model`
3. 使用者選擇並儲存的 cron 工作階段模型覆寫
4. 代理/預設模型選擇

快速模式也會跟隨已解析的即時選擇。如果所選模型設定具有 `params.fastMode`，隔離 cron 預設會使用它。儲存的工作階段 `fastMode` 覆寫仍會在任一方向上優先於設定。

如果隔離執行遇到即時模型切換交接，cron 會使用切換後的供應商/模型重試，並在重試前為作用中執行持久化該即時選擇。當切換也攜帶新的驗證設定檔時，cron 也會為作用中執行持久化該驗證設定檔覆寫。重試有界限：在初始嘗試加上 2 次切換重試之後，cron 會中止而不是無限循環。

在隔離 cron 執行進入代理執行器之前，OpenClaw 會檢查已設定且可連線的本機供應商端點，包括 `api: "ollama"` 與 `api: "openai-completions"`，其 `baseUrl` 為 loopback、私人網路或 `.local`。如果該端點已關閉，該執行會被記錄為 `skipped`，並帶有清楚的供應商/模型錯誤，而不是開始模型呼叫。端點結果會快取 5 分鐘，因此許多到期作業若使用相同已故障的本機 Ollama、vLLM、SGLang 或 LM Studio 伺服器，會共用一次小型探測，而不是形成請求風暴。略過的供應商預檢執行不會增加執行錯誤退避；當你希望重複收到略過通知時，請啟用 `failureAlert.includeSkipped`。

## 交付與輸出

| 模式       | 發生的事                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理沒有傳送，則將最終文字回退交付給目標 |
| `webhook`  | 將完成事件 payload POST 到 URL                                |
| `none`     | 沒有執行器回退交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳遞。對於 Telegram 論壇主題，使用 `-1001234567890:topic:123`；直接 RPC/config 呼叫端也可以將 `delivery.threadId` 以字串或數字傳入。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix room ID 區分大小寫；請使用來自 Matrix 的確切 room ID 或 `room:!room:server` 形式。

當 announce 傳遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶有供應方前綴的目標，可以在 cron 回退到工作階段歷史記錄或單一已設定頻道之前選取頻道。只有載入的 Plugin 所宣告的前綴才是供應方選取器。如果 `delivery.channel` 已明確指定，目標前綴必須命名相同的供應方；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴，例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`，仍然是頻道擁有的目標語法，而不是供應方選取器。

對於隔離工作，聊天傳遞是共用的。如果有可用的聊天路由，即使工作使用 `--no-deliver`，代理程式也可以使用 `message` 工具。如果代理程式傳送至已設定/目前的目標，OpenClaw 會略過回退 announce。否則，`announce`、`webhook` 和 `none` 只會控制執行器在代理程式回合後如何處理最終回覆。

當代理程式從作用中的聊天建立隔離提醒時，OpenClaw 會儲存保留下來的即時傳遞目標，用於回退 announce 路由。內部工作階段金鑰可能是小寫；當目前聊天內容可用時，不會從這些金鑰重建供應方傳遞目標。

隱含 announce 傳遞會使用已設定的頻道 allowlist 驗證並重新路由過期目標。DM pairing-store 核准不是回退自動化收件者；當排程工作應主動傳送至 DM 時，請設定 `delivery.to` 或設定頻道 `allowFrom` 項目。

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 會設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個工作覆寫該值。
- 如果兩者都未設定，且工作已透過 `announce` 傳遞，失敗通知現在會回退到該主要 announce 目標。
- 除非主要傳遞模式是 `webhook`，否則 `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 工作。
- `failureAlert.includeSkipped: true` 會讓工作或全域 cron 警示政策選擇加入重複 skipped-run 警示。略過的執行會保留獨立的連續略過計數器，因此不會影響執行錯誤的退避。

## CLI 範例

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
</Tabs>

## Webhook

Gateway 可以公開 HTTP webhook 端點以供外部觸發。在 config 中啟用：

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
    執行隔離的代理程式回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應的 hook（POST /hooks/<name>）">
    自訂 hook 名稱會透過 config 中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意 payload 轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將 hook 端點置於 loopback、tailnet 或受信任的反向代理後方。

- 使用專用的 hook token；不要重複使用 gateway auth token。
- 將 `hooks.path` 保持在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制明確的 `agentId` 路由。
- 除非你需要由呼叫端選取工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的工作階段金鑰形狀。
- Hook payload 預設會以安全邊界包裹。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器接到 OpenClaw。

<Note>
**先決條件：** `gcloud` CLI、`gog`（gogcli）、已啟用 OpenClaw hooks、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` config、啟用 Gmail preset，並將 Tailscale Funnel 用於推送端點。

### Gateway 自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，Gateway 會在開機時啟動 `gog gmail watch serve`，並自動續訂 watch。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

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
  <Step title="啟動 watch">
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
模型覆寫注意事項：

- `openclaw cron add|edit --model ...` 會變更工作選取的模型。
- 如果該模型被允許，該確切的供應方/模型會傳到隔離代理程式執行。
- 如果不被允許或無法解析，cron 會以明確的驗證錯誤讓該次執行失敗。
- 已設定的回退鏈仍會套用，因為 cron `--model` 是工作的主要模型，而不是工作階段 `/model` 覆寫。
- Payload `fallbacks` 會取代該工作的已設定回退；`fallbacks: []` 會停用回退，並讓執行成為嚴格模式。
- 沒有明確或已設定回退清單的單純 `--model`，不會靜默落到代理程式主要模型作為額外重試目標。

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

`maxConcurrentRuns` 會限制排程 cron 派送與隔離代理程式回合執行。隔離 cron 代理程式回合會在內部使用佇列的專用 `cron-nested` 執行通道，因此提高此值可讓獨立的 cron LLM 執行平行推進，而不是只啟動其外層 cron 包裝器。共用的非 cron `nested` 通道不會因為此設定而加寬。

執行階段狀態 sidecar 會從 `cron.store` 衍生：像 `~/clawd/cron/jobs.json` 這類 `.json` 儲存會使用 `~/clawd/cron/jobs-state.json`，而沒有 `.json` 後綴的儲存路徑會附加 `-state.json`。

如果你手動編輯 `jobs.json`，請不要將 `jobs-state.json` 納入原始碼控制。OpenClaw 會使用該 sidecar 來保存待處理 slot、作用中標記、上次執行中繼資料，以及告訴排程器外部編輯的工作何時需要新的 `nextRunAtMs` 的排程身分。

停用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **一次性重試**：暫時性錯誤（rate limit、overload、network、server error）最多重試 3 次，並使用指數退避。永久性錯誤會立即停用。

    **週期性重試**：在重試之間使用指數退避（30s 到 60m）。退避會在下一次成功執行後重設。

  </Accordion>
  <Accordion title="維護">
    `cron.sessionRetention`（預設 `24h`）會清除隔離執行工作階段項目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 會自動清除 run-log 檔案。
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
    - 執行輸出中的 `reason: not-due` 表示手動執行是用 `openclaw cron run <jobId> --due` 檢查，而工作尚未到期。

  </Accordion>
  <Accordion title="Cron 已觸發但未送達">
    - 傳遞模式 `none` 表示不會預期有 runner 後援傳送。當有可用的聊天路由時，代理仍可使用 `message` 工具直接傳送。
    - 傳遞目標缺失或無效（`channel`/`to`）表示已略過外送。
    - 對於 Matrix，複製或舊版工作若使用小寫的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將工作編輯為 Matrix 中的確切 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞遭憑證封鎖。
    - 如果隔離執行只回傳靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接外送傳遞，也會抑制後援佇列摘要路徑，因此不會有任何內容貼回聊天。
    - 如果代理應自行傳訊給使用者，請檢查工作是否有可用路由（`channel: "last"` 搭配先前聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止 /new-style 輪替">
    - 每日與閒置重設的新鮮度不是基於 `updatedAt`；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - Cron 喚醒、Heartbeat 執行、exec 通知與 Gateway 簿記可能會為了路由/狀態而更新工作階段資料列，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在前建立的舊版資料列，只要檔案仍可用，OpenClaw 可以從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未指定 `--tz` 的 Cron 會使用 gateway 主機時區。
    - 未指定時區的 `at` 排程會視為 UTC。
    - Heartbeat `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化與工作](/zh-TW/automation) — 所有自動化機制一覽
- [背景工作](/zh-TW/automation/tasks) — Cron 執行的工作帳本
- [Heartbeat](/zh-TW/gateway/heartbeat) — 週期性的主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
