---
read_when:
    - 排程背景作業或喚醒
    - 將外部觸發器（Webhook、Gmail）接入 OpenClaw
    - 為排程任務決定使用 Heartbeat 還是 Cron
sidebarTitle: Scheduled tasks
summary: Gateway 排程器的排程作業、Webhook 和 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-05-06T17:52:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 內建的排程器。它會持久保存工作、在正確時間喚醒代理，並可將輸出傳回聊天頻道或 Webhook 端點。

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
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看執行歷程">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron 的運作方式

- Cron 在 **Gateway** 程序內執行（不是在模型內）。
- 工作定義會持久保存於 `~/.openclaw/cron/jobs.json`，因此重新啟動不會遺失排程。
- 執行階段狀態會在旁邊持久保存於 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中追蹤 cron 定義，請追蹤 `jobs.json`，並將 `jobs-state.json` 加入 gitignore。
- 拆分後，較舊的 OpenClaw 版本可以讀取 `jobs.json`，但可能會把工作視為全新，因為執行階段欄位現在位於 `jobs-state.json`。
- 當 Gateway 正在執行或停止時編輯 `jobs.json`，OpenClaw 會比較變更過的排程欄位與待處理的執行階段時段中繼資料，並清除過期的 `nextRunAtMs` 值。純格式化或僅鍵順序的重寫會保留待處理時段。
- 所有 cron 執行都會建立[背景工作](/zh-TW/automation/tasks)記錄。
- Gateway 啟動時，逾期的隔離代理回合工作會被重新排程到頻道連線視窗之外，而不是立即重播，因此 Discord/Telegram 啟動與原生命令設定在重新啟動後仍能保持回應。
- 一次性工作（`--at`）預設會在成功後自動刪除。
- 隔離 cron 執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 接收狹義 cron 自我清理授權的隔離 cron 執行仍可讀取排程器狀態，以及經自我篩選的目前工作清單，因此狀態/Heartbeat 檢查可以檢視自己的排程，而不會取得更廣泛的 cron 變更存取權。
- 隔離 cron 執行也會防範過期的確認回覆。如果第一個結果只是暫時狀態更新（`on it`、`pulling everything together` 與類似提示），且沒有任何後代子代理執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離 cron 執行會優先使用嵌入式執行的結構化執行拒絕中繼資料，然後才回退到已知的最終摘要/輸出標記，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被封鎖的命令不會被回報為綠燈執行。
- 隔離 cron 執行也會將執行層級的代理失敗視為工作錯誤，即使未產生回覆負載也是如此，因此模型/提供者失敗會增加錯誤計數器並觸發失敗通知，而不是將工作清除為成功。
- 當隔離代理回合工作達到 `timeoutSeconds` 時，cron 會中止底層代理執行，並給它一小段清理視窗。如果該執行未清空，Gateway 擁有的清理會在 cron 記錄逾時前強制清除該執行的工作階段擁有權，因此佇列中的聊天工作不會被留在過期的處理中工作階段後面。

<a id="maintenance"></a>

<Note>
cron 的工作調解首先由執行階段擁有，其次才由持久歷程支援：只要 cron 執行階段仍追蹤該工作為執行中，作用中的 cron 工作就會保持存活，即使舊的子工作階段資料列仍存在。一旦執行階段停止擁有該工作，且 5 分鐘寬限視窗到期，維護作業會檢查持久保存的執行記錄與工作狀態，以尋找相符的 `cron:<jobId>:<startedAt>` 執行。如果該持久歷程顯示終止結果，工作帳本會依此完成；否則 Gateway 擁有的維護作業可將工作標記為 `lost`。離線 CLI 稽核可以從持久歷程復原，但它不會把自己的空白程序內作用中工作集合視為 Gateway 擁有的 cron 執行已消失的證據。
</Note>

## 排程類型

| 種類    | CLI 旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或類似 `20m` 的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位 cron 表達式，可搭配選用的 `--tz` |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 以使用本地牆鐘時間排程。

每小時整點的週期性表達式會自動錯開最多 5 分鐘，以降低負載尖峰。使用 `--exact` 強制精準時間，或使用 `--stagger 30s` 指定明確視窗。

### 月份日期與星期日期使用 OR 邏輯

Cron 表達式由 [croner](https://github.com/Hexagon/croner) 剖析。當月份日期與星期日期欄位都不是萬用字元時，croner 會在**任一**欄位相符時匹配，而不是兩者都相符。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5–6 次，而不是每月 0–1 次。OpenClaw 在此使用 Croner 的預設 OR 行為。若要要求兩個條件都成立，請使用 Croner 的 `+` 星期日期修飾符（`0 9 15 * +1`），或在一個欄位上排程，並在工作的提示或命令中保護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行位置                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 下一個 Heartbeat 回合      | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時綁定   | 感知上下文的週期性工作    |
| 自訂工作階段  | `session:custom-id` | 持久具名工作階段 | 建立在歷程上的工作流程 |

<AccordionGroup>
  <Accordion title="主要工作階段與隔離與自訂">
    **主要工作階段**工作會將系統事件加入佇列，並可選擇喚醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。這些系統事件不會延長目標工作階段的每日/閒置重設新鮮度。**隔離**工作會使用全新的工作階段執行專用代理回合。**自訂工作階段**（`session:xxx`）會跨執行持久保存上下文，啟用像每日站會這類建立在先前摘要上的工作流程。
  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」是什麼意思">
    對於隔離工作，「全新工作階段」表示每次執行都會有新的逐字稿/工作階段 ID。OpenClaw 可能會帶入安全偏好設定，例如 thinking/fast/verbose 設定、標籤，以及明確由使用者選取的模型/驗證覆寫，但不會從較舊的 cron 資料列繼承周遭對話上下文：頻道/群組路由、傳送或佇列政策、提升、來源或 ACP 執行階段綁定。當週期性工作應刻意建立在相同對話上下文上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行階段清理">
    對於隔離工作，執行階段拆除現在包含該 cron 工作階段的盡力瀏覽器清理。清理失敗會被忽略，因此實際 cron 結果仍然優先。

    隔離 cron 執行也會透過共用的執行階段清理路徑，處置為該工作建立的任何 bundled MCP 執行階段執行個體。這與主要工作階段和自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離 cron 工作不會跨執行洩漏 stdio 子程序或長生命週期 MCP 連線。

  </Accordion>
  <Accordion title="子代理與 Discord 交付">
    當隔離 cron 執行協調子代理時，交付也會優先使用最終後代輸出，而不是過期的父層暫時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是宣告它。

    對於純文字 Discord announce 目標，OpenClaw 只會傳送一次正式的最終助理文字，而不是同時重播串流/中間文字負載與最終答案。媒體與結構化 Discord 負載仍會以獨立負載交付，因此附件與元件不會被捨棄。

  </Accordion>
</AccordionGroup>

### 隔離工作的負載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離時必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用該工作選取的允許模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 等級覆寫。
</ParamField>
<ParamField path="--light-context" type="boolean">
  略過工作區啟動檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制該工作可以使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會使用選取的允許模型作為該工作的主要模型。這與聊天工作階段 `/model` 覆寫不同：當工作主要模型失敗時，已設定的 fallback 鏈仍會套用。如果要求的模型未被允許或無法解析，cron 會以明確的驗證錯誤讓該執行失敗，而不是悄悄回退到工作的代理/預設模型選擇。

Cron 工作也可以攜帶負載層級的 `fallbacks`。存在時，該清單會取代該工作的已設定 fallback 鏈。當你想要嚴格的 cron 執行，只嘗試選取的模型時，請在工作負載/API 中使用 `fallbacks: []`。如果工作有 `--model`，但沒有負載或已設定的 fallback，OpenClaw 會傳遞明確的空 fallback 覆寫，因此代理主要模型不會被附加為隱藏的額外重試目標。

隔離工作的模型選擇優先順序為：

1. Gmail hook 模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個工作的負載 `model`
3. 使用者選取且已儲存的 cron 工作階段模型覆寫
4. 代理/預設模型選擇

快速模式也會跟隨解析後的即時選擇。如果選取的模型設定有 `params.fastMode`，隔離 cron 預設會使用該設定。已儲存的工作階段 `fastMode` 覆寫仍會在任一方向上優先於設定。

如果隔離執行遇到即時模型切換交接，cron 會使用切換後的提供者/模型重試，並在重試前為作用中執行持久保存該即時選擇。當切換也攜帶新的驗證設定檔時，cron 也會為作用中執行持久保存該驗證設定檔覆寫。重試有上限：初始嘗試加上 2 次切換重試後，cron 會中止，而不是永遠循環。

在隔離 cron 執行進入代理執行器之前，OpenClaw 會檢查可到達的本地提供者端點，對象是已設定 `api: "ollama"` 和 `api: "openai-completions"` 且 `baseUrl` 為 loopback、私人網路或 `.local` 的提供者。如果該端點關閉，該執行會被記錄為 `skipped`，並附上清楚的提供者/模型錯誤，而不是開始模型呼叫。端點結果會快取 5 分鐘，因此許多到期工作使用同一個已停用的本地 Ollama、vLLM、SGLang 或 LM Studio 伺服器時，會共用一次小型探測，而不是製造請求風暴。被提供者預檢略過的執行不會增加執行錯誤 backoff；當你想要重複略過通知時，請啟用 `failureAlert.includeSkipped`。

## 交付與輸出

| 模式       | 發生的事                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理未傳送，則將最終文字 fallback 交付給目標 |
| `webhook`  | 將完成事件負載 POST 到 URL                                |
| `none`     | 沒有執行器 fallback 交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳遞。對於 Telegram 論壇主題，使用 `-1001234567890:topic:123`；直接 RPC/config 呼叫端也可以傳入字串或數字形式的 `delivery.threadId`。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用精確的房間 ID，或 Matrix 提供的 `room:!room:server` 形式。

當 announce 傳遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類提供者前綴目標可在 Cron 回退到工作階段歷史或單一已設定頻道前選擇頻道。只有已載入 Plugin 宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同的提供者；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。像 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>` 這類目標類型與服務前綴，仍然是頻道擁有的目標語法，而不是提供者選擇器。

對於隔離作業，聊天傳遞是共用的。如果聊天路由可用，即使作業使用 `--no-deliver`，代理程式仍可使用 `message` 工具。如果代理程式傳送到已設定/目前目標，OpenClaw 會略過備援 announce。否則，`announce`、`webhook` 和 `none` 只控制執行器在代理程式回合結束後如何處理最終回覆。

當代理程式從作用中聊天建立隔離提醒時，OpenClaw 會儲存保留的即時傳遞目標，作為備援 announce 路由。內部工作階段鍵可能是小寫；當目前聊天內容可用時，不會從那些鍵重建提供者傳遞目標。

隱含 announce 傳遞會使用已設定的頻道允許清單來驗證並重新路由過期目標。DM 配對儲存區核准不是備援自動化收件者；當排程作業應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道 `allowFrom` 項目。

失敗通知會遵循獨立的目的地路徑：

- `cron.failureDestination` 會設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個作業覆寫該設定。
- 如果兩者都未設定，且作業已透過 `announce` 傳遞，失敗通知現在會回退到該主要 announce 目標。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 作業，除非主要傳遞模式是 `webhook`。
- `failureAlert.includeSkipped: true` 會讓作業或全域 Cron 警示政策納入重複的已略過執行警示。已略過執行會保留獨立的連續略過計數器，因此不會影響執行錯誤退避。

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

## Webhooks

Gateway 可公開 HTTP Webhook 端點供外部觸發。在設定中啟用：

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
    執行隔離代理程式回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自訂 hook 名稱會透過設定中的 `hooks.mappings` 解析。對應可使用範本或程式碼轉換，將任意酬載轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將 hook 端點放在 loopback、tailnet 或受信任的反向代理後方。

- 使用專用 hook token；不要重複使用 Gateway 驗證 token。
- 將 `hooks.path` 保持在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制明確的 `agentId` 路由。
- 除非你需要由呼叫端選擇工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果你啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的工作階段鍵形狀。
- Hook 酬載預設會以安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器連接到 OpenClaw。

<Note>
**先決條件：**`gcloud` CLI、`gog`（gogcli）、已啟用 OpenClaw hooks、用於公開 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設組，並使用 Tailscale Funnel 作為推送端點。

### Gateway 自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，Gateway 會在啟動時啟動 `gog gmail watch serve`，並自動續期 watch。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

### 手動一次性設定

<Steps>
  <Step title="Select the GCP project">
    選取擁有 `gog` 使用的 OAuth 用戶端的 GCP 專案：

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

- `openclaw cron add|edit --model ...` 會變更作業選取的模型。
- 如果模型被允許，該精確的提供者/模型會傳遞到隔離代理程式執行。
- 如果不被允許或無法解析，Cron 會以明確的驗證錯誤讓該執行失敗。
- 已設定的備援鏈仍會套用，因為 Cron `--model` 是作業主要模型，而不是工作階段 `/model` 覆寫。
- 酬載 `fallbacks` 會取代該作業已設定的備援；`fallbacks: []` 會停用備援並使執行嚴格化。
- 沒有明確或已設定備援清單的純 `--model`，不會靜默退回到代理程式主要模型作為額外重試目標。

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

`maxConcurrentRuns` 同時限制已排程的 Cron 派送與隔離代理程式回合執行。隔離 Cron 代理程式回合會在內部使用佇列專用的 `cron-nested` 執行通道，因此提高此值可讓獨立的 Cron LLM 執行並行推進，而不是只啟動其外層 Cron 包裝器。共用的非 Cron `nested` 通道不會因這項設定而擴寬。

執行階段狀態 sidecar 會從 `cron.store` 衍生：像 `~/clawd/cron/jobs.json` 這樣的 `.json` 儲存會使用 `~/clawd/cron/jobs-state.json`，而沒有 `.json` 後綴的儲存路徑會附加 `-state.json`。

如果你手動編輯 `jobs.json`，請不要將 `jobs-state.json` 納入原始碼控制。OpenClaw 會將該 sidecar 用於待處理 slots、作用中標記、上次執行中繼資料，以及讓排程器判斷外部編輯的作業何時需要新的 `nextRunAtMs` 的排程識別。

停用 Cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重試**：暫時性錯誤（速率限制、過載、網路、伺服器錯誤）最多重試 3 次，並使用指數退避。永久錯誤會立即停用。

    **週期性重試**：重試之間使用指數退避（30 秒到 60 分鐘）。退避會在下一次成功執行後重設。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（預設 `24h`）會修剪隔離執行工作階段項目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 會自動修剪執行記錄檔案。
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
    - 確認 Gateway 持續執行中。
    - 對於 `cron` 排程，請驗證時區（`--tz`）與主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是使用 `openclaw cron run <jobId> --due` 檢查，而作業尚未到期。

  </Accordion>
  <Accordion title="Cron 已觸發但沒有傳送">
    - 傳送模式 `none` 表示不預期會有 runner 備援傳送。當聊天路由可用時，代理仍可使用 `message` 工具直接傳送。
    - 傳送目標缺少/無效（`channel`/`to`）表示已略過對外傳送。
    - 對於 Matrix，複製或舊版作業若使用小寫化的 `delivery.to` 房間 ID，可能會失敗，因為 Matrix 房間 ID 區分大小寫。請將作業編輯為來自 Matrix 的精確 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳送遭憑證封鎖。
    - 如果隔離執行只傳回靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接對外傳送，也會抑制備援佇列摘要路徑，因此不會有任何內容貼回聊天。
    - 如果代理應自行向使用者傳送訊息，請檢查該作業是否有可用路由（`channel: "last"` 搭配先前聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止 /new-style 輪替">
    - 每日與閒置重設的新鮮度不是根據 `updatedAt`；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - Cron 喚醒、heartbeat 執行、exec 通知和 gateway 簿記可能會更新工作階段資料列以供路由/狀態使用，但它們不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版資料列，當檔案仍可用時，OpenClaw 可以從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置資料列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="時區注意事項">
    - 未使用 `--tz` 的 Cron 會使用 gateway 主機時區。
    - 沒有時區的 `at` 排程會視為 UTC。
    - Heartbeat `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化與任務](/zh-TW/automation) — 一覽所有自動化機制
- [背景任務](/zh-TW/automation/tasks) — Cron 執行的任務分類帳
- [Heartbeat](/zh-TW/gateway/heartbeat) — 週期性的主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
