---
read_when:
    - 調整心跳偵測頻率或訊息內容
    - 為排程任務選擇心跳偵測或排程
sidebarTitle: Heartbeat
summary: 心跳偵測輪詢訊息與通知規則
title: 心跳偵測
x-i18n:
    generated_at: "2026-07-11T21:20:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**心跳偵測還是排程？** 請參閱[自動化](/zh-TW/automation)，瞭解何時應使用哪一種方式。
</Note>

心跳偵測會在主要工作階段中執行**週期性的代理程式回合**，讓模型能提示任何需要注意的事項，同時避免傳送過多訊息打擾你。

心跳偵測是排定的主要工作階段回合，它**不會**建立[背景任務](/zh-TW/automation/tasks)記錄。任務記錄用於分離執行的工作（ACP 執行、子代理程式、隔離的排程工作）。

疑難排解：[排定任務](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速開始（初學者）

<Steps>
  <Step title="選擇執行頻率">
    保持啟用心跳偵測（預設為 `30m`；若設定了 Anthropic OAuth／權杖驗證，包括重用 Claude 命令列介面，則為 `1h`），或設定自己的執行頻率。
  </Step>
  <Step title="新增 HEARTBEAT.md（選用）">
    在代理程式工作區中建立簡短的 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="決定心跳偵測訊息的傳送位置">
    預設值為 `target: "none"`；設定 `target: "last"` 可路由至最近一次聯絡的對象。
  </Step>
  <Step title="選用調整">
    - 啟用心跳偵測的推理內容傳送，以提高透明度。
    - 如果心跳偵測執行只需要 `HEARTBEAT.md`，請使用輕量化啟動內容。
    - 啟用隔離工作階段，避免每次心跳偵測都傳送完整對話記錄。
    - 將心跳偵測限制在活躍時段（本地時間）。

  </Step>
</Steps>

設定範例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## 預設值

- 間隔：`30m`。套用 Anthropic 提供者預設值時，若解析後的驗證模式為 OAuth／權杖（包括重用 Claude 命令列介面），間隔會增加至 `1h`，但僅限於尚未設定 `heartbeat.every` 時。設定 `agents.defaults.heartbeat.every` 或各代理程式的 `agents.list[].heartbeat.every`；使用 `0m` 可停用。
- 提示詞本文（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 逾時：未設定心跳偵測逾時的回合會在已設定時使用 `agents.defaults.timeoutSeconds`。否則會使用心跳偵測頻率，最長限制為 600 秒。若心跳偵測工作需要更長時間，請設定 `agents.defaults.heartbeat.timeoutSeconds` 或各代理程式的 `agents.list[].heartbeat.timeoutSeconds`。
- 心跳偵測提示詞會**逐字不變地**作為使用者訊息傳送。只有在預設代理程式已啟用心跳偵測（且 `includeSystemPromptSection` 不為 `false`）時，系統提示詞才會包含「心跳偵測」區段，並且該次執行會在內部加上標記。
- 使用 `0m` 停用心跳偵測時，一般執行也會從啟動內容中省略 `HEARTBEAT.md`，使模型不會看到僅供心跳偵測使用的指示。
- 活躍時段（`heartbeat.activeHours`）會依照設定的時區檢查。在時段之外，心跳偵測會跳過，直到時段內的下一個觸發時間。
- 排程工作正在執行或排隊時，心跳偵測會自動延後。設定 `heartbeat.skipWhenBusy: true`，也可在代理程式自身以工作階段鍵識別的子代理程式或巢狀命令執行通道忙碌時延後；不再僅因另一個代理程式有子代理程式工作正在執行，就暫停同層代理程式。

## 心跳偵測提示詞的用途

預設提示詞刻意保持廣泛：

- **背景任務**：「考量尚未完成的任務」會促使代理程式檢視後續事項（收件匣、行事曆、提醒、排隊中的工作），並提示任何緊急事項。
- **關心使用者**：「偶爾在白天關心你的使用者」會促使代理程式偶爾傳送簡短的「有什麼需要嗎？」訊息，同時透過你設定的本地時區避免在夜間傳送過多訊息（請參閱[時區](/zh-TW/concepts/timezone)）。

心跳偵測可以回應已完成的[背景任務](/zh-TW/automation/tasks)，但心跳偵測執行本身不會建立任務記錄。

如果你希望心跳偵測執行非常具體的工作（例如「檢查 Gmail PubSub 統計資料」或「驗證閘道健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設定為自訂本文（會逐字不變地傳送）。

## 回應契約

- 如果沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 心跳偵測執行也可以改為呼叫 `heartbeat_respond`：使用 `notify: false` 表示不提供可見更新，或使用 `notify: true` 並搭配 `notificationText` 傳送警示。若存在結構化工具回應，它會優先於文字備援回應。
- 在心跳偵測執行期間，若 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**，OpenClaw 會將其視為確認訊號。系統會移除該權杖；如果剩餘內容的長度**≤ `ackMaxChars`**（預設值：300），便會捨棄該回覆。
- 如果 `HEARTBEAT_OK` 出現在回覆的**中間**，則不會受到特殊處理。
- 對於警示，**不要**包含 `HEARTBEAT_OK`；只傳回警示文字。

在心跳偵測以外的執行中，訊息開頭或結尾意外出現的 `HEARTBEAT_OK` 會被移除並記錄；僅包含 `HEARTBEAT_OK` 的訊息會被捨棄。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### 範圍與優先順序

- `agents.defaults.heartbeat` 設定全域心跳偵測行為。
- `agents.list[].heartbeat` 會合併並覆寫其上層設定；如果任何代理程式具有 `heartbeat` 區塊，則**只有這些代理程式**會執行心跳偵測。
- `channels.defaults.heartbeat` 設定所有頻道的可見性預設值。
- `channels.<channel>.heartbeat` 會覆寫頻道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳號頻道）會覆寫各頻道設定。

### 各代理程式的心跳偵測

如果任何 `agents.list[]` 項目包含 `heartbeat` 區塊，則**只有這些代理程式**會執行心跳偵測。各代理程式的區塊會合併並覆寫 `agents.defaults.heartbeat`（因此你可以只設定一次共用預設值，再針對各代理程式覆寫）。

範例：兩個代理程式中，只有第二個代理程式會執行心跳偵測。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 活躍時段範例

將心跳偵測限制在特定時區的工作時段：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

在此時段之外（美東時間上午 9 點之前或晚上 10 點之後），心跳偵測會被跳過。時段內的下一個排定觸發時間會正常執行。

### 全天候設定

如果你希望心跳偵測全天執行，請使用以下任一方式：

- 完全省略 `activeHours`（不限制時段；這是預設行為）。
- 設定全天時段：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
請勿將 `start` 和 `end` 設為相同時間（例如從 `08:00` 到 `08:00`）。這會被視為寬度為零的時段，因此心跳偵測一律會被跳過。
</Warning>

### 多帳號範例

使用 `accountId` 指定 Telegram 等多帳號頻道上的特定帳號：

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### 欄位說明

<ParamField path="every" type="string">
  心跳偵測間隔（持續時間字串；預設單位為分鐘）。
</ParamField>
<ParamField path="model" type="string">
  心跳偵測執行的選用模型覆寫值（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用後，若有可用內容，也會傳送獨立的 `Thinking` 訊息（格式與 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  設為 true 時，心跳偵測執行會使用輕量化啟動內容，且僅保留工作區啟動檔案中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  設為 true 時，每次心跳偵測都會在沒有先前對話記錄的全新工作階段中執行。使用與排程 `sessionTarget: "isolated"` 相同的隔離模式。這會大幅降低每次心跳偵測的權杖成本。搭配 `lightContext: true` 可達到最大節省效果。傳送路由仍會使用主要工作階段內容。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  設為 true 時，若該代理程式的其他忙碌執行通道正在工作，心跳偵測執行會延後，包括其自身以工作階段鍵識別的子代理程式或巢狀命令工作。即使未設定此旗標，排程執行通道也一律會延後心跳偵測，因此本地模型主機不會同時執行排程與心跳偵測提示詞。
</ParamField>
<ParamField path="session" type="string">
  心跳偵測執行的選用工作階段鍵。

- `main`（預設）：代理程式主要工作階段。
- 明確的工作階段鍵（從 `openclaw sessions --json` 或[工作階段命令列介面](/zh-TW/cli/sessions)複製）。
- 工作階段鍵格式：請參閱[工作階段](/zh-TW/concepts/session)與[群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳送至最近使用的外部頻道。
- 明確頻道：任何已設定的頻道或外掛 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行心跳偵測，但**不對外傳送**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接訊息／私人訊息的傳送行為。`allow`：允許直接訊息／私人訊息形式的心跳偵測傳送。`block`：禁止直接訊息／私人訊息形式的傳送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  選用的收件者覆寫值（頻道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。對於 Telegram 主題／討論串，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳號頻道的選用帳號 ID。當 `target: "last"` 時，如果解析出的最後使用頻道支援帳號，帳號 ID 會套用至該頻道；否則會被忽略。如果帳號 ID 與解析出的頻道中任何已設定帳號不符，則會略過傳送。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示詞本文（不會合併）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  是否注入預設代理程式系統提示詞中的 `## 心跳偵測` 區段。設為 `false` 可保留心跳偵測的執行階段行為（頻率、傳送、HEARTBEAT.md），同時從代理程式系統提示詞中省略心跳偵測指示。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  傳送前允許出現在 `HEARTBEAT_OK` 之後的最大字元數。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  設為 true 時，會在心跳偵測執行期間抑制工具錯誤警告承載資料。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  心跳偵測代理程式單次執行在中止前允許的最長秒數。若未設定，則在 `agents.defaults.timeoutSeconds` 已設定時使用該值，否則使用心跳偵測頻率，且上限為 600 秒。

</ParamField>
<ParamField path="activeHours" type="object">
  將心跳偵測執行限制在特定時間範圍內。此物件包含 `start`（HH:MM，包含該時刻；一天開始請使用 `00:00`）、`end`（HH:MM，不包含該時刻；一天結束可使用 `24:00`），以及選用的 `timezone`。

- 省略或設為 `"user"`：若已設定 `agents.defaults.userTimezone`，則使用該值，否則退回使用主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；若無效，則退回使用上述 `"user"` 行為。
- 有效時間範圍的 `start` 與 `end` 不得相同；相同值會視為零寬度（永遠位於範圍之外）。
- 在有效時間範圍之外，會略過心跳偵測，直到下一個落在範圍內的排程時點。

</ParamField>

## 傳送行為

<AccordionGroup>
  <Accordion title="工作階段與目標路由">
    - 心跳偵測預設在代理程式的主要工作階段中執行（`agent:<id>:<mainKey>`）；當 `session.scope = "global"` 時則在 `global` 中執行。設定 `session` 可覆寫為特定頻道工作階段（Discord／WhatsApp／其他）。
    - `session` 僅影響執行情境；傳送由 `target` 與 `to` 控制。
    - 若要傳送至特定頻道／收件者，請設定 `target` + `to`。使用 `target: "last"` 時，會傳送至該工作階段最後使用的外部頻道。
    - 心跳偵測傳送預設允許直接／私訊目標。設定 `directPolicy: "block"` 可抑制向直接目標傳送訊息，同時仍執行心跳偵測回合。
    - 如果主要佇列、目標工作階段通道、排程通道或執行中的排程工作忙碌，會略過心跳偵測並稍後重試。
    - 如果設定 `skipWhenBusy: true`，此代理程式依工作階段鍵區分的子代理程式與巢狀通道也會延後心跳偵測執行。其他代理程式的忙碌通道不會延後此代理程式。
    - 如果 `target` 未解析出任何外部目的地，仍會執行，但不會傳送對外訊息。

  </Accordion>
  <Accordion title="可見性與略過行為">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，會預先略過執行，原因為 `reason=alerts-disabled`。
    - 如果只有警示傳送遭停用，OpenClaw 仍可執行心跳偵測、更新到期工作的時間戳記、還原工作階段閒置時間戳記，並抑制對外警示承載資料。
    - 如果解析出的心跳偵測目標支援輸入中狀態，OpenClaw 會在心跳偵測執行期間顯示輸入中狀態。這會使用心跳偵測原本要傳送聊天輸出的同一目標，並可透過 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="工作階段生命週期與稽核">
    - 僅含心跳偵測的回覆**不會**讓工作階段保持存續。心跳偵測中繼資料可能會更新工作階段資料列，但閒置到期時間使用最後一則真實使用者／頻道訊息的 `lastInteractionAt`，每日到期時間則使用 `sessionStartedAt`。
    - 控制介面與 WebChat 歷程會隱藏心跳偵測提示詞及僅含 OK 的確認。底層工作階段逐字記錄仍可保留這些回合，以供稽核／重播。
    - 分離的[背景工作](/zh-TW/automation/tasks)可將系統事件加入佇列，並在主要工作階段需要快速得知某件事時喚醒心跳偵測。此喚醒不會使心跳偵測執行變成背景工作。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設會抑制 `HEARTBEAT_OK` 確認，同時傳送警示內容。你可以依頻道或依帳號調整此行為：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隱藏 HEARTBEAT_OK（預設）
      showAlerts: true # 顯示警示訊息（預設）
      useIndicator: true # 發出指示器事件（預設）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 顯示 OK 確認
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 抑制此帳號的警示傳送
```

優先順序：各帳號 → 各頻道 → 頻道預設值 → 內建預設值。

### 各旗標的作用

- `showOk`：當模型只回覆 OK 時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型回覆非 OK 內容時，傳送警示內容。
- `useIndicator`：為介面狀態畫面發出指示器事件。

如果**三者全部**為 false，OpenClaw 會完全略過心跳偵測執行（不呼叫模型）。

### 各頻道與各帳號範例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 所有 Slack 帳號
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 僅抑制 ops 帳號的警示
  telegram:
    heartbeat:
      showOk: true
```

### 常見模式

| 目標                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 預設行為（靜默處理 OK，啟用警示）       | _（不需要設定）_                                                                         |
| 完全靜默（無訊息、無指示器）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（無訊息）                       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 僅在一個頻道顯示 OK                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（選用）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示詞會要求代理程式讀取它。可將它視為你的「心跳偵測檢查清單」：簡短、穩定，且適合每 30 分鐘檢查一次。

在一般執行中，只有為預設代理程式啟用心跳偵測指引時，才會注入 `HEARTBEAT.md`。以 `0m` 停用心跳偵測頻率，或設定 `includeSystemPromptSection: false`，會將其從一般啟動情境中省略。

在原生 Codex 執行環境中，`HEARTBEAT.md` 內容不會像其他啟動檔案一樣注入回合。如果檔案存在且包含非空白內容，心跳偵測協作模式附註會將 Codex 導向該檔案，並要求它在繼續前先讀取檔案。

如果 `HEARTBEAT.md` 存在但實際上為空（僅包含空白行、Markdown／HTML 註解、如 `# Heading` 的 Markdown 標題、圍欄標記或空白檢查清單項目），OpenClaw 會略過心跳偵測執行以節省 API 呼叫。此略過會回報為 `reason=empty-heartbeat-file`。如果檔案不存在，心跳偵測仍會執行，並由模型決定要做什麼。

請保持精簡（簡短的檢查清單或提醒），以避免提示詞膨脹。

`HEARTBEAT.md` 範例：

```md
# 心跳偵測檢查清單

- 快速掃描：收件匣中是否有任何緊急事項？
- 如果是白天且沒有其他待辦事項，進行一次簡單的主動確認。
- 如果工作受阻，記下_缺少什麼_，並在下次詢問 Peter。
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援小型結構化 `tasks:` 區塊，用於在心跳偵測內進行以間隔為基礎的檢查。

範例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "檢查是否有緊急的未讀電子郵件，並標記任何有時效性的事項。"
- name: calendar-scan
  interval: 2h
  prompt: "檢查即將到來且需要準備或後續處理的會議。"

# 其他指示

- 警示請保持簡短。
- 如果所有到期工作完成後沒有任何事項需要注意，請回覆 HEARTBEAT_OK。
```

<AccordionGroup>
  <Accordion title="行為">
    - OpenClaw 會解析 `tasks:` 區塊，並依各工作的 `interval` 進行檢查。
    - 只有**到期**工作會包含在該排程時點的心跳偵測提示詞中。
    - 如果沒有任何工作到期，會完全略過心跳偵測（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中非工作的內容會保留，並附加在到期工作清單之後作為額外情境。
    - 工作上次執行的時間戳記會儲存在工作階段狀態（`heartbeatTaskState`）中，因此間隔設定可在一般重新啟動後繼續保留。
    - 只有在心跳偵測完成其一般回覆流程後，才會推進工作時間戳記。略過的 `empty-heartbeat-file`／`no-tasks-due` 執行不會將工作標記為已完成。

  </Accordion>
</AccordionGroup>

當你希望在單一心跳偵測檔案中放入多項定期檢查，又不想在每個排程時點為所有檢查付出成本時，工作模式非常實用。

### 代理程式可以更新 HEARTBEAT.md 嗎？

可以，只要你要求它這麼做。

`HEARTBEAT.md` 只是代理程式工作區中的一般檔案，因此你可以在一般聊天中告訴代理程式，例如：

- 「更新 `HEARTBEAT.md`，加入每日行事曆檢查。」
- 「重寫 `HEARTBEAT.md`，使其更簡短並專注於收件匣後續處理。」

如果你希望主動進行此操作，也可以在心跳偵測提示詞中加入明確的一行，例如：「如果檢查清單已過時，請以更好的版本更新 HEARTBEAT.md。」

<Warning>
請勿將機密資訊（API 金鑰、電話號碼、私人權杖）放入 `HEARTBEAT.md`，因為它會成為提示詞情境的一部分。
</Warning>

## 手動喚醒（隨選）

使用 `openclaw system event` 將系統事件加入佇列，並可選擇立即觸發心跳偵測：

```bash
openclaw system event --text "檢查緊急的後續事項" --mode now
```

| 旗標                         | 說明                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | 系統事件文字（必填）。                                                                           |
| `--mode <mode>`              | `now` 會立即執行心跳偵測；`next-heartbeat`（預設）會等待下一個排定的執行時點。                    |
| `--session-key <sessionKey>` | 將事件指定給特定工作階段；預設為代理程式的主要工作階段。                                         |
| `--json`                     | 輸出 JSON。                                                                                      |

如果未提供 `--session-key`，且有多個代理程式已設定 `heartbeat`，`--mode now` 會立即執行其中每個代理程式的心跳偵測。

同一命令列介面群組中的相關心跳偵測控制：

```bash
openclaw system heartbeat last     # 顯示上次心跳偵測事件
openclaw system heartbeat enable   # 啟用心跳偵測
openclaw system heartbeat disable  # 停用心跳偵測
```

## 推理內容傳送（選用）

依預設，心跳偵測只會傳送最終的「答案」承載內容。

如果您希望提高透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，心跳偵測也會另外傳送一則以 `Thinking` 為前綴的訊息（格式與 `/reasoning on` 相同）。當代理程式正在管理多個工作階段／Codex，且您想了解它為何決定通知您時，這會很有用；但它也可能洩漏超出您預期的內部細節。建議在群組聊天中保持關閉。

## 成本考量

心跳偵測會執行完整的代理程式回合。間隔越短，消耗的權杖越多。若要降低成本：

- 使用 `isolatedSession: true`，以避免傳送完整的對話記錄（每次執行可從約 10 萬個權杖降至約 2,000～5,000 個）。
- 使用 `lightContext: true`，將啟動檔案限制為只有 `HEARTBEAT.md`。
- 設定成本較低的 `model`（例如 `ollama/llama3.2:1b`）。
- 讓 `HEARTBEAT.md` 保持精簡。
- 如果您只需要更新內部狀態，請使用 `target: "none"`。

## 心跳偵測後的上下文溢位

心跳偵測執行完成後，會保留共用工作階段中現有的執行階段模型，因此，若心跳偵測將工作階段切換到較小的本機模型（例如具有 32k 上下文視窗的 Ollama 模型），下一個主要工作階段回合仍可能繼續使用該模型。如果下一個回合接著回報上下文溢位，而且該工作階段上次使用的執行階段模型與設定的 `heartbeat.model` 相符，OpenClaw 的復原訊息會指出心跳偵測模型殘留可能是原因，並建議修正方式。

若要避免此問題：使用 `isolatedSession: true`，在全新的工作階段中執行心跳偵測（也可搭配 `lightContext: true`，讓提示內容最精簡），或選擇上下文視窗足以容納共用工作階段的心跳偵測模型。

## 相關內容

- [自動化](/zh-TW/automation) - 快速瀏覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) - 如何追蹤分離執行的工作
- [時區](/zh-TW/concepts/timezone) - 時區如何影響心跳偵測的排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) - 偵錯自動化問題
