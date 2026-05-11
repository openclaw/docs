---
read_when:
    - 排程背景作業或喚醒
    - 將外部觸發器（Webhook、Gmail）接入 OpenClaw
    - 為排程工作決定使用 Heartbeat 或 Cron
sidebarTitle: Scheduled tasks
summary: Gateway 排程器的排程工作、Webhook 和 Gmail PubSub 觸發器
title: 排程任務
x-i18n:
    generated_at: "2026-05-11T20:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 內建的排程器。它會持久保存工作、在正確時間喚醒代理程式，並可將輸出傳回聊天頻道或 Webhook 端點。

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
- 工作定義會持久保存在 `~/.openclaw/cron/jobs.json`，因此重新啟動不會遺失排程。
- 執行時執行狀態會持久保存在旁邊的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中追蹤 cron 定義，請追蹤 `jobs.json`，並將 `jobs-state.json` 加入 gitignore。
- 分拆後，較舊的 OpenClaw 版本可以讀取 `jobs.json`，但可能會將工作視為新的，因為執行時欄位現在位於 `jobs-state.json`。
- 當 Gateway 執行中或停止時編輯 `jobs.json`，OpenClaw 會將變更的排程欄位與待處理的執行時時段中繼資料比較，並清除過期的 `nextRunAtMs` 值。純格式或僅鍵順序的重寫會保留待處理時段。
- 所有 cron 執行都會建立[背景任務](/zh-TW/automation/tasks)記錄。
- Gateway 啟動時，逾期的隔離代理程式回合工作會被重新排程到頻道連線視窗之外，而不是立即重放，因此 Discord/Telegram 啟動和原生命令設定在重新啟動後仍能保持回應。
- 一次性工作（`--at`）預設會在成功後自動刪除。
- 隔離 cron 執行完成時，會盡力關閉其 `cron:<jobId>` 工作階段所追蹤的瀏覽器分頁/程序，因此分離的瀏覽器自動化不會留下孤立程序。
- 收到狹義 cron 自我清理授權的隔離 cron 執行，仍可讀取排程器狀態、經自我篩選的目前工作清單，以及該工作的執行歷史，因此狀態/Heartbeat 檢查可以檢視自己的排程，而不會取得更廣泛的 cron 變更存取權。
- 隔離 cron 執行也會防範過期的確認回覆。如果第一個結果只是臨時狀態更新（`on it`、`pulling everything together` 和類似提示），且沒有後代子代理程式執行仍負責最終答案，OpenClaw 會在交付前重新提示一次以取得實際結果。
- 隔離 cron 執行會優先使用嵌入式執行中的結構化執行拒絕中繼資料，接著退回到已知的最終摘要/輸出標記，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被封鎖的命令不會被報告為成功執行。
- 隔離 cron 執行也會將執行層級的代理程式失敗視為工作錯誤，即使沒有產生回覆承載也一樣，因此模型/提供者失敗會增加錯誤計數器並觸發失敗通知，而不是將工作清除為成功。
- 當隔離代理程式回合工作達到 `timeoutSeconds` 時，cron 會中止底層代理程式執行，並給它短暫的清理視窗。如果執行未能排空，Gateway 所擁有的清理會在 cron 記錄逾時前強制清除該執行的工作階段所有權，因此排隊的聊天工作不會被留在過期的處理中工作階段後面。
- 如果隔離代理程式回合在執行器啟動前或第一次模型呼叫前停滯，cron 會記錄階段特定逾時，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。這些看門狗會涵蓋嵌入式提供者和 CLI 後端提供者，在其外部 CLI 程序實際啟動前即生效，並且會獨立於較長的 `timeoutSeconds` 值設上限，因此冷啟動/驗證/內容失敗會快速浮現，而不是等待完整工作預算。

<a id="maintenance"></a>

<Note>
cron 的任務調和首先由執行時擁有，其次由持久歷史支援：只要 cron 執行時仍追蹤該工作為執行中，作用中的 cron 任務就會保持存活，即使舊的子工作階段列仍存在。一旦執行時停止擁有該工作，且 5 分鐘寬限視窗到期，維護檢查就會查詢持久化的執行記錄和工作狀態，以尋找相符的 `cron:<jobId>:<startedAt>` 執行。如果該持久歷史顯示終止結果，任務帳本會依據它完成；否則 Gateway 所擁有的維護可以將任務標記為 `lost`。離線 CLI 稽核可以從持久歷史復原，但不會將它自己空的處理程序內作用中工作集合視為 Gateway 所擁有的 cron 執行已消失的證明。
</Note>

## 排程類型

| 種類    | CLI 旗標  | 說明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性時間戳記（ISO 8601 或像 `20m` 這樣的相對時間）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 5 欄位或 6 欄位 cron 表達式，可選擇搭配 `--tz` |

沒有時區的時間戳記會被視為 UTC。加入 `--tz America/New_York` 以進行本地牆鐘時間排程。

整點重複表達式會自動錯開最多 5 分鐘，以減少負載尖峰。使用 `--exact` 強制精確時間，或使用 `--stagger 30s` 指定明確視窗。

### 月日期與週日期使用 OR 邏輯

Cron 表達式由 [croner](https://github.com/Hexagon/croner) 解析。當月日期與週日期欄位都不是萬用字元時，croner 會在**任一**欄位符合時匹配，而不是兩者都符合。這是標準 Vixie cron 行為。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

這會每月觸發約 5–6 次，而不是每月 0–1 次。OpenClaw 在此使用 Croner 預設的 OR 行為。若要要求兩個條件都符合，請使用 Croner 的 `+` 週日期修飾符（`0 9 15 * +1`），或在一個欄位上排程，並在工作的提示或命令中防護另一個條件。

## 執行樣式

| 樣式           | `--session` 值   | 執行於                  | 最適合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主要工作階段    | `main`              | 下一個 Heartbeat 回合      | 提醒、系統事件        |
| 隔離        | `isolated`          | 專用 `cron:<jobId>` | 報告、背景雜務      |
| 目前工作階段 | `current`           | 建立時綁定   | 具內容感知的重複工作    |
| 自訂工作階段  | `session:custom-id` | 持久命名工作階段 | 建立在歷史上的工作流程 |

<AccordionGroup>
  <Accordion title="主要工作階段與隔離與自訂">
    **主要工作階段**工作會將系統事件排入佇列，並可選擇喚醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。這些系統事件不會延長目標工作階段每日/閒置重設的新鮮度。**隔離**工作會以全新工作階段執行專用代理程式回合。**自訂工作階段**（`session:xxx`）會在多次執行之間保留內容，啟用像每日站會這類建立在先前摘要上的工作流程。
  </Accordion>
  <Accordion title="隔離工作的「全新工作階段」意思">
    對於隔離工作，「全新工作階段」表示每次執行都有新的逐字稿/工作階段 ID。OpenClaw 可能會攜帶安全偏好，例如 thinking/fast/verbose 設定、標籤，以及明確由使用者選取的模型/驗證覆寫，但不會從較舊 cron 列繼承周遭對話內容：頻道/群組路由、傳送或佇列政策、提升權限、來源，或 ACP 執行時綁定。當重複工作應刻意建立在相同對話內容上時，請使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="執行時清理">
    對於隔離工作，執行時拆除現在包含該 cron 工作階段的盡力瀏覽器清理。清理失敗會被忽略，因此實際 cron 結果仍會優先。

    隔離 cron 執行也會透過共用的執行時清理路徑，處置為工作建立的任何隨附 MCP 執行時執行個體。這與主要工作階段和自訂工作階段 MCP 用戶端的拆除方式一致，因此隔離 cron 工作不會在多次執行之間洩漏 stdio 子程序或長生命週期 MCP 連線。

  </Accordion>
  <Accordion title="子代理程式與 Discord 交付">
    當隔離 cron 執行協調子代理程式時，交付也會優先使用最終後代輸出，而不是過期的父層臨時文字。如果後代仍在執行，OpenClaw 會抑制該部分父層更新，而不是宣布它。

    對於純文字 Discord announce 目標，OpenClaw 只傳送一次標準最終助理文字，而不是同時重放串流/中間文字承載和最終答案。媒體和結構化 Discord 承載仍會作為個別承載交付，因此附件和元件不會被丟棄。

  </Accordion>
</AccordionGroup>

### 隔離工作的承載選項

<ParamField path="--message" type="string" required>
  提示文字（隔離時必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆寫；使用為工作選取的允許模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 等級覆寫。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳過工作區 bootstrap 檔案注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制工作可以使用哪些工具，例如 `--tools exec,read`。
</ParamField>

`--model` 會將選取的允許模型用作該工作的主要模型。這不同於聊天工作階段的 `/model` 覆寫：當工作主要模型失敗時，仍會套用已設定的後援鏈。如果要求的模型不被允許或無法解析，cron 會以明確驗證錯誤使執行失敗，而不是靜默退回到工作的代理程式/預設模型選擇。

Cron 工作也可以攜帶承載層級的 `fallbacks`。存在時，該清單會取代工作的已設定後援鏈。當你想要嚴格的 cron 執行，只嘗試選取的模型時，請在工作承載/API 中使用 `fallbacks: []`。如果工作有 `--model`，但既沒有承載後援也沒有已設定後援，OpenClaw 會傳遞明確的空後援覆寫，因此代理程式主要模型不會被附加為隱藏的額外重試目標。

隔離工作的模型選擇優先順序為：

1. Gmail hook 模型覆寫（當執行來自 Gmail 且該覆寫被允許時）
2. 每個工作承載的 `model`
3. 使用者選取並儲存的 cron 工作階段模型覆寫
4. 代理程式/預設模型選擇

快速模式也遵循已解析的即時選擇。如果選取的模型設定具有 `params.fastMode`，隔離 cron 預設會使用它。儲存的工作階段 `fastMode` 覆寫仍會在任一方向上優先於設定。

如果隔離執行遇到即時模型切換交接，cron 會使用切換後的提供者/模型重試，並在重試前為作用中執行持久保存該即時選擇。當切換也攜帶新的驗證設定檔時，cron 也會為作用中執行持久保存該驗證設定檔覆寫。重試是有界限的：初始嘗試加上 2 次切換重試後，cron 會中止，而不是永遠循環。

在獨立的 Cron 執行進入代理執行器之前，OpenClaw 會檢查已設定的 `api: "ollama"` 與 `api: "openai-completions"` 提供者中，`baseUrl` 為 loopback、私有網路或 `.local` 的可到達本機提供者端點。如果該端點已停用，該次執行會記錄為 `skipped`，並附上清楚的提供者/模型錯誤，而不是開始模型呼叫。端點結果會快取 5 分鐘，因此許多使用同一個已停用本機 Ollama、vLLM、SGLang 或 LM Studio 伺服器的到期作業，會共用一次小型探測，而不是造成請求風暴。略過的提供者預檢執行不會增加執行錯誤退避；如果你想要重複收到略過通知，請啟用 `failureAlert.includeSkipped`。

## 傳遞與輸出

| 模式       | 發生的事情                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果代理未傳送，則將最終文字備援傳遞到目標 |
| `webhook`  | 將完成事件酬載 POST 到 URL                                |
| `none`     | 沒有執行器備援傳遞                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 進行頻道傳遞。對於 Telegram 論壇主題，請使用 `-1001234567890:topic:123`；直接 RPC/設定呼叫者也可以傳入字串或數字形式的 `delivery.threadId`。Slack/Discord/Mattermost 目標應使用明確前綴（`channel:<id>`、`user:<id>`）。Matrix 房間 ID 區分大小寫；請使用精確的房間 ID，或來自 Matrix 的 `room:!room:server` 形式。

當宣告傳遞使用 `channel: "last"` 或省略 `channel` 時，像 `telegram:123` 這類帶有提供者前綴的目標，可以在 Cron 回退到工作階段歷史記錄或單一已設定頻道之前選取頻道。只有已載入 Plugin 所宣告的前綴才是提供者選擇器。如果 `delivery.channel` 是明確的，目標前綴必須命名相同提供者；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 會被拒絕，而不是讓 WhatsApp 將 Telegram ID 解讀為電話號碼。目標種類與服務前綴，例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`，仍然是頻道擁有的目標語法，而不是提供者選擇器。

對於獨立作業，聊天傳遞是共用的。如果有可用的聊天路由，即使作業使用 `--no-deliver`，代理也可以使用 `message` 工具。如果代理傳送到已設定/目前的目標，OpenClaw 會略過備援宣告。否則，`announce`、`webhook` 和 `none` 只會控制執行器在代理回合之後如何處理最終回覆。

當代理從作用中的聊天建立獨立提醒時，OpenClaw 會儲存保留的即時傳遞目標，以供備援宣告路由使用。內部工作階段鍵可能是小寫；當目前聊天情境可用時，不會從這些鍵重建提供者傳遞目標。

隱含宣告傳遞會使用已設定的頻道允許清單來驗證並重新路由過期目標。DM 配對儲存核准不是備援自動化收件者；當排程作業應主動傳送到 DM 時，請設定 `delivery.to` 或設定頻道 `allowFrom` 項目。

失敗通知遵循獨立的目的地路徑：

- `cron.failureDestination` 設定失敗通知的全域預設值。
- `job.delivery.failureDestination` 會針對每個作業覆寫該值。
- 如果兩者皆未設定，而且作業已透過 `announce` 傳遞，失敗通知現在會回退到該主要宣告目標。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 作業，除非主要傳遞模式是 `webhook`。
- `failureAlert.includeSkipped: true` 會讓作業或全域 Cron 警示政策加入重複略過執行警示。略過的執行會保留獨立的連續略過計數器，因此不會影響執行錯誤退避。

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
  <Tab title="週期性獨立作業">
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

Gateway 可以公開 HTTP Webhook 端點以供外部觸發。在設定中啟用：

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

查詢字串權杖會被拒絕。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    將系統事件加入主要工作階段佇列：

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
    執行一個獨立代理回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    欄位：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="對應掛鉤（POST /hooks/<name>）">
    自訂掛鉤名稱會透過設定中的 `hooks.mappings` 解析。對應可以使用範本或程式碼轉換，將任意酬載轉換為 `wake` 或 `agent` 動作。
  </Accordion>
</AccordionGroup>

<Warning>
請將掛鉤端點置於 loopback、tailnet 或受信任的反向 Proxy 後方。

- 使用專用掛鉤權杖；不要重複使用 Gateway 驗證權杖。
- 將 `hooks.path` 保持在專用子路徑；`/` 會被拒絕。
- 設定 `hooks.allowedAgentIds` 以限制明確的 `agentId` 路由。
- 除非你需要由呼叫者選取工作階段，否則請保持 `hooks.allowRequestSessionKey=false`。
- 如果你啟用 `hooks.allowRequestSessionKey`，也請設定 `hooks.allowedSessionKeyPrefixes` 以限制允許的工作階段鍵形狀。
- 掛鉤酬載預設會以安全邊界包裝。

</Warning>

## Gmail PubSub 整合

透過 Google PubSub 將 Gmail 收件匣觸發器接到 OpenClaw。

<Note>
**先決條件：**`gcloud` CLI、`gog`（gogcli）、已啟用 OpenClaw 掛鉤、用於公用 HTTPS 端點的 Tailscale。
</Note>

### 精靈設定（建議）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

這會寫入 `hooks.gmail` 設定、啟用 Gmail 預設集，並使用 Tailscale Funnel 作為推送端點。

### Gateway 自動啟動

當 `hooks.enabled=true` 且已設定 `hooks.gmail.account` 時，Gateway 會在開機時啟動 `gog gmail watch serve` 並自動續期監看。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可選擇退出。

### 手動一次性設定

<Steps>
  <Step title="選取 GCP 專案">
    選取擁有 `gog` 所使用 OAuth 用戶端的 GCP 專案：

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

- `openclaw cron add|edit --model ...` 會變更作業所選模型。
- 如果模型被允許，該精確的提供者/模型會抵達獨立代理執行。
- 如果不被允許或無法解析，Cron 會讓該次執行失敗，並附上明確的驗證錯誤。
- 已設定的備援鏈仍然適用，因為 Cron `--model` 是作業主要模型，而不是工作階段 `/model` 覆寫。
- 酬載 `fallbacks` 會取代該作業已設定的備援；`fallbacks: []` 會停用備援，並讓執行變為嚴格模式。
- 沒有明確或已設定備援清單的單純 `--model`，不會悄悄落回代理主要模型作為額外重試目標。

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

`maxConcurrentRuns` 會限制排程 Cron 分派與獨立代理回合執行。獨立 Cron 代理回合會在內部使用佇列的專用 `cron-nested` 執行通道，因此提高此值可讓獨立 Cron LLM 執行並行推進，而不是只啟動其外層 Cron 包裝器。共用的非 Cron `nested` 通道不會因這項設定而加寬。

執行階段狀態 sidecar 會從 `cron.store` 衍生：像 `~/clawd/cron/jobs.json` 這樣的 `.json` 儲存會使用 `~/clawd/cron/jobs-state.json`，而沒有 `.json` 後綴的儲存路徑會附加 `-state.json`。

如果你手動編輯 `jobs.json`，請不要將 `jobs-state.json` 納入原始碼控制。OpenClaw 會使用該 sidecar 存放待處理槽位、作用中標記、上次執行中繼資料，以及告訴排程器外部編輯的作業何時需要新的 `nextRunAtMs` 的排程身分。

停用 Cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重試行為">
    **一次性重試**：暫時性錯誤（速率限制、過載、網路、伺服器錯誤）最多重試 3 次，並使用指數退避。永久性錯誤會立即停用。

    **週期性重試**：重試之間使用指數退避（30 秒到 60 分鐘）。退避會在下一次成功執行後重設。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（預設為 `24h`）會清除隔離執行工作階段項目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 會自動清除執行記錄檔案。
  </Accordion>
</AccordionGroup>

## 疑難排解

### 指令階梯

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
    - 對於 `cron` 排程，請確認時區（`--tz`）與主機時區。
    - 執行輸出中的 `reason: not-due` 表示手動執行是用 `openclaw cron run <jobId> --due` 檢查，而該工作尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 傳遞模式 `none` 表示不預期 runner 後援傳送。當聊天路由可用時，代理仍可使用 `message` 工具直接傳送。
    - 傳遞目標遺失/無效（`channel`/`to`）表示已略過外送。
    - 對於 Matrix，複製或舊版工作的 `delivery.to` 房間 ID 若為小寫，可能會失敗，因為 Matrix 房間 ID 區分大小寫。將工作編輯為 Matrix 中精確的 `!room:server` 或 `room:!room:server` 值。
    - 頻道驗證錯誤（`unauthorized`、`Forbidden`）表示傳遞遭憑證封鎖。
    - 如果隔離執行只回傳靜默權杖（`NO_REPLY` / `no_reply`），OpenClaw 會抑制直接外送傳遞，也會抑制後援佇列摘要路徑，因此不會有任何內容回發到聊天。
    - 如果代理應自行傳訊給使用者，請檢查該工作是否有可用路由（`channel: "last"` 且有先前聊天，或明確的頻道/目標）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日與閒置重設的新鮮度不是以 `updatedAt` 為基準；請參閱[工作階段管理](/zh-TW/concepts/session#session-lifecycle)。
    - Cron 喚醒、Heartbeat 執行、exec 通知，以及 Gateway 簿記可能會為了路由/狀態更新工作階段列，但不會延長 `sessionStartedAt` 或 `lastInteractionAt`。
    - 對於在這些欄位存在之前建立的舊版列，只要檔案仍可用，OpenClaw 就能從 transcript JSONL 工作階段標頭復原 `sessionStartedAt`。沒有 `lastInteractionAt` 的舊版閒置列會使用該復原的開始時間作為其閒置基準。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 未使用 `--tz` 的 Cron 會使用 gateway 主機時區。
    - 沒有時區的 `at` 排程會被視為 UTC。
    - Heartbeat `activeHours` 會使用已設定的時區解析。

  </Accordion>
</AccordionGroup>

## 相關

- [自動化與工作](/zh-TW/automation) — 所有自動化機制一覽
- [背景工作](/zh-TW/automation/tasks) — cron 執行的工作分類帳
- [Heartbeat](/zh-TW/gateway/heartbeat) — 週期性的主要工作階段回合
- [時區](/zh-TW/concepts/timezone) — 時區設定
