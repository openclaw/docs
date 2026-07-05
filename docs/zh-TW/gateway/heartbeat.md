---
read_when:
    - 調整心跳偵測節奏或訊息
    - 為排程任務選擇心跳偵測或排程
sidebarTitle: Heartbeat
summary: 心跳偵測輪詢訊息與通知規則
title: 心跳偵測
x-i18n:
    generated_at: "2026-07-05T11:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**心跳偵測與排程？** 請參閱[自動化](/zh-TW/automation)，了解何時使用各自功能的指引。
</Note>

心跳偵測會在主要工作階段中執行**週期性代理程式回合**，讓模型可以提示任何需要注意的事項，而不會用大量訊息打擾你。

心跳偵測是排定的主要工作階段回合 - 它**不會**建立[背景任務](/zh-TW/automation/tasks)記錄。任務記錄用於分離式工作（ACP 執行、子代理程式、隔離的排程工作）。

疑難排解：[排定任務](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速開始（初學者）

<Steps>
  <Step title="選擇頻率">
    保持心跳偵測啟用（預設為 `30m`，或在設定 Anthropic OAuth/token 驗證時為 `1h`，包括 Claude CLI 重複使用），或設定你自己的頻率。
  </Step>
  <Step title="新增 HEARTBEAT.md（選用）">
    在代理程式工作區中建立一個小型 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="決定心跳偵測訊息應傳送到哪裡">
    `target: "none"` 是預設值；設定 `target: "last"` 可路由到最後一個聯絡對象。
  </Step>
  <Step title="選用調整">
    - 啟用心跳偵測推理傳送以提升透明度。
    - 如果心跳偵測執行只需要 `HEARTBEAT.md`，請使用輕量啟動情境。
    - 啟用隔離工作階段，以避免每次心跳偵測都傳送完整對話歷史。
    - 將心跳偵測限制在活動時段（本地時間）。

  </Step>
</Steps>

範例設定：

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

- 間隔：`30m`。套用 Anthropic 提供者預設值時，如果解析後的驗證模式為 OAuth/token（包括 Claude CLI 重複使用），會將此提升為 `1h`，但僅在 `heartbeat.every` 未設定時。設定 `agents.defaults.heartbeat.every` 或每個代理程式的 `agents.list[].heartbeat.every`；使用 `0m` 停用。
- 提示本文（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 逾時：未設定的心跳偵測回合會在已設定時使用 `agents.defaults.timeoutSeconds`。否則，它們會使用心跳偵測頻率，上限為 600 秒。若心跳偵測工作需要更長時間，請設定 `agents.defaults.heartbeat.timeoutSeconds` 或每個代理程式的 `agents.list[].heartbeat.timeoutSeconds`。
- 心跳偵測提示會作為使用者訊息**逐字**傳送。只有在預設代理程式啟用心跳偵測（且 `includeSystemPromptSection` 不是 `false`）時，系統提示才會包含「Heartbeats」區段，並且執行會在內部標記。
- 使用 `0m` 停用心跳偵測時，正常執行也會從啟動情境中省略 `HEARTBEAT.md`，讓模型不會看到僅供心跳偵測使用的指示。
- 活動時段（`heartbeat.activeHours`）會在設定的時區中檢查。在時間範圍外，心跳偵測會跳過，直到下一個位於時間範圍內的刻度。
- 當排程工作正在進行或佇列中時，心跳偵測會自動延後。設定 `heartbeat.skipWhenBusy: true` 也會在代理程式自己的工作階段鍵控子代理程式或巢狀命令通道忙碌時延後該代理程式；同層代理程式不再只是因為另一個代理程式有子代理程式工作正在進行就暫停。

## 心跳偵測提示的用途

預設提示刻意保持廣泛：

- **背景任務**：「Consider outstanding tasks」會推動代理程式檢視後續事項（收件匣、行事曆、提醒、佇列工作），並提示任何緊急事項。
- **人類關懷確認**：「Checkup sometimes on your human during day time」會推動偶爾傳送輕量的「有什麼需要嗎？」訊息，但會使用你設定的本地時區（請參閱[時區](/zh-TW/concepts/timezone)）避免夜間垃圾訊息。

心跳偵測可以對已完成的[背景任務](/zh-TW/automation/tasks)做出反應，但心跳偵測執行本身不會建立任務記錄。

如果你希望心跳偵測執行非常具體的事項（例如「檢查 Gmail PubSub 統計」或「驗證閘道健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設定為自訂本文（逐字傳送）。

## 回應合約

- 如果沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 心跳偵測執行也可以改為呼叫 `heartbeat_respond`，搭配 `notify: false` 表示沒有可見更新，或 `notify: true` 加上 `notificationText` 表示警示。存在時，結構化工具回應優先於文字備援。
- 在心跳偵測執行期間，當 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**時，OpenClaw 會將其視為確認。該權杖會被移除，而且如果剩餘內容 **≤ `ackMaxChars`**（預設：300），回覆會被捨棄。
- 如果 `HEARTBEAT_OK` 出現在回覆的**中間**，不會受到特殊處理。
- 對於警示，**不要**包含 `HEARTBEAT_OK`；只傳回警示文字。

在心跳偵測之外，訊息開頭/結尾零散的 `HEARTBEAT_OK` 會被移除並記錄；只有 `HEARTBEAT_OK` 的訊息會被捨棄。

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
- `agents.list[].heartbeat` 會合併在其上；如果任何代理程式有 `heartbeat` 區塊，**只有那些代理程式**會執行心跳偵測。
- `channels.defaults.heartbeat` 設定所有通道的可見性預設值。
- `channels.<channel>.heartbeat` 覆寫通道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳號通道）覆寫每個通道的設定。

### 每個代理程式的心跳偵測

如果任何 `agents.list[]` 項目包含 `heartbeat` 區塊，**只有那些代理程式**會執行心跳偵測。每個代理程式的區塊會合併在 `agents.defaults.heartbeat` 之上（因此你可以先設定一次共用預設值，再依代理程式覆寫）。

範例：兩個代理程式，只有第二個代理程式執行心跳偵測。

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

### 活動時段範例

將心跳偵測限制在特定時區的營業時間：

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

在此時間範圍外（美東時間上午 9 點前或晚上 10 點後），心跳偵測會被跳過。下一個位於時間範圍內的排定刻度會正常執行。

### 24/7 設定

如果你希望心跳偵測全天執行，請使用以下其中一種模式：

- 完全省略 `activeHours`（沒有時間範圍限制；這是預設行為）。
- 設定整日時間範圍：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要將相同的 `start` 和 `end` 時間設為一樣（例如 `08:00` 到 `08:00`）。這會被視為零寬度時間範圍，因此心跳偵測永遠會被跳過。
</Warning>

### 多帳號範例

使用 `accountId` 來指定多帳號通道（例如 Telegram）上的特定帳號：

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

### 欄位備註

<ParamField path="every" type="string">
  心跳偵測間隔（持續時間字串；預設單位 = 分鐘）。
</ParamField>
<ParamField path="model" type="string">
  心跳偵測執行的選用模型覆寫（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用時，也會在可用時傳送獨立的 `Thinking` 訊息（與 `/reasoning on` 相同形狀）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  為 true 時，心跳偵測執行會使用輕量啟動情境，並且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  為 true 時，每次心跳偵測都會在沒有先前對話歷史的全新工作階段中執行。使用與排程 `sessionTarget: "isolated"` 相同的隔離模式。大幅降低每次心跳偵測的權杖成本。搭配 `lightContext: true` 可獲得最大節省。傳送路由仍使用主要工作階段情境。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  為 true 時，心跳偵測執行會因該代理程式的額外忙碌通道而延後：其自己的工作階段鍵控子代理程式或巢狀命令工作。排程通道一律會延後心跳偵測，即使沒有此旗標也是如此，因此本地模型主機不會同時執行排程和心跳偵測提示。
</ParamField>
<ParamField path="session" type="string">
  心跳偵測執行的選用工作階段鍵。

- `main`（預設）：代理程式主要工作階段。
- 明確工作階段鍵（從 `openclaw sessions --json` 或[工作階段命令列介面](/zh-TW/cli/sessions)複製）。
- 工作階段鍵格式：請參閱[工作階段](/zh-TW/concepts/session)和[群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳送到最後使用的外部通道。
- 明確通道：任何已設定的通道或外掛 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行心跳偵測但**不會傳送**到外部。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/DM 傳送行為。`allow`：允許直接/DM 心跳偵測傳送。`block`：抑制直接/DM 傳送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  選用的收件者覆寫（通道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。對於 Telegram 主題/討論串，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳號通道的選用帳號 ID。當 `target: "last"` 時，如果解析出的最後通道支援帳號，帳號 ID 會套用到該通道；否則會被忽略。如果帳號 ID 與解析通道中已設定的帳號不相符，將略過傳送。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示本文（不合併）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  是否注入預設代理的 `## Heartbeats` 系統提示章節。設為 `false` 可保留心跳偵測執行階段行為（節奏、傳送、HEARTBEAT.md），同時從代理系統提示中省略心跳偵測指示。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  傳送前，`HEARTBEAT_OK` 後允許的最大字元數。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  為 true 時，會在心跳偵測執行期間抑制工具錯誤警告酬載。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  心跳偵測代理回合中止前允許的最大秒數。保持未設定時，若已設定 `agents.defaults.timeoutSeconds` 則使用該值，否則使用心跳偵測節奏並上限為 600 秒。

</ParamField>
<ParamField path="activeHours" type="object">
  將心跳偵測執行限制在時間視窗內。物件包含 `start`（HH:MM，含起始；使用 `00:00` 表示一天開始）、`end`（HH:MM，不含結束；允許 `24:00` 表示一天結束），以及選用的 `timezone`。

- 省略或 `"user"`：若已設定 `agents.defaults.userTimezone` 則使用該值，否則退回主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；若無效，則退回上述 `"user"` 行為。
- 對於有效視窗，`start` 和 `end` 不得相等；相等值會被視為零寬度（一律在視窗外）。
- 在有效視窗外，心跳偵測會被略過，直到視窗內的下一個 tick。

</ParamField>

## 傳送行為

<AccordionGroup>
  <Accordion title="Session and target routing">
    - 心跳偵測預設會在代理的主要工作階段中執行（`agent:<id>:<mainKey>`），或在 `session.scope = "global"` 時使用 `global`。設定 `session` 可覆寫為特定通道工作階段（Discord/WhatsApp 等）。
    - `session` 只會影響執行內容；傳送由 `target` 和 `to` 控制。
    - 若要傳送到特定通道/收件者，請設定 `target` + `to`。使用 `target: "last"` 時，傳送會使用該工作階段的最後外部通道。
    - 心跳偵測傳送預設允許直接/DM 目標。設定 `directPolicy: "block"` 可在仍執行心跳偵測回合的同時，抑制直接目標傳送。
    - 如果主佇列、目標工作階段 lane、排程 lane 或作用中的排程作業忙碌中，心跳偵測會被略過並稍後重試。
    - 如果 `skipWhenBusy: true`，此代理以工作階段鍵控的子代理和巢狀 lane 也會延後心跳偵測執行。其他代理的忙碌 lane 不會延後此代理。
    - 如果 `target` 未解析到外部目的地，執行仍會發生，但不會傳送外送訊息。

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，執行會一開始就以 `reason=alerts-disabled` 略過。
    - 如果只停用警示傳送，OpenClaw 仍可執行心跳偵測、更新到期任務時間戳、還原工作階段閒置時間戳，並抑制對外警示酬載。
    - 如果解析出的心跳偵測目標支援輸入中狀態，OpenClaw 會在心跳偵測執行期間顯示輸入中。這會使用心跳偵測原本要傳送聊天輸出的同一個目標，並可透過 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - 僅心跳偵測的回覆**不會**讓工作階段保持存活。心跳偵測中繼資料可能會更新工作階段列，但閒置到期會使用最後一則真實使用者/通道訊息的 `lastInteractionAt`，每日到期則使用 `sessionStartedAt`。
    - Control UI 和 WebChat 歷史記錄會隱藏心跳偵測提示和僅 OK 的確認。底層工作階段逐字稿仍可能包含這些回合，以供稽核/重播。
    - 分離的[背景任務](/zh-TW/automation/tasks)可以將系統事件加入佇列，並在主要工作階段應快速注意到某件事時喚醒心跳偵測。該喚醒不會讓心跳偵測執行成為背景任務。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設會抑制 `HEARTBEAT_OK` 確認，同時傳送警示內容。你可以依通道或依帳號調整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

優先順序：每帳號 → 每通道 → 通道預設值 → 內建預設值。

### 每個旗標的作用

- `showOk`：當模型傳回僅 OK 的回覆時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型傳回非 OK 回覆時，傳送警示內容。
- `useIndicator`：為 UI 狀態介面發出指示器事件。

如果**三者全部**為 false，OpenClaw 會完全略過心跳偵測執行（不呼叫模型）。

### 每通道與每帳號範例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### 常見模式

| 目標                                     | 設定                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 預設行為（靜默 OK，開啟警示）           | _(不需要設定)_                                                                           |
| 完全靜默（無訊息、無指示器）            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（無訊息）                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 僅在一個通道中顯示 OK                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（選用）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示會要求代理讀取它。請把它視為你的「心跳偵測檢查清單」：簡短、穩定，且適合每 30 分鐘考量一次。

在一般執行中，只有在預設代理啟用心跳偵測指引時，才會注入 `HEARTBEAT.md`。使用 `0m` 停用心跳偵測節奏，或設定 `includeSystemPromptSection: false`，會從一般啟動內容中省略它。

在原生 Codex harness 上，`HEARTBEAT.md` 內容不會像其他啟動檔一樣注入回合。如果檔案存在且包含非空白內容，心跳偵測協作模式註記會將 Codex 指向該檔案，並告知它在繼續前先讀取檔案。

如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行、Markdown/HTML 註解、像 `# Heading` 這樣的 Markdown 標題、fence 標記，或空的檢查清單 stub），OpenClaw 會略過心跳偵測執行以節省 API 呼叫。該略過會回報為 `reason=empty-heartbeat-file`。如果檔案遺失，心跳偵測仍會執行，並由模型決定要做什麼。

請保持精簡（短檢查清單或提醒），以避免提示膨脹。

`HEARTBEAT.md` 範例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援一個小型結構化 `tasks:` 區塊，用於心跳偵測內部以間隔為基礎的檢查。

範例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Behavior">
    - OpenClaw 會剖析 `tasks:` 區塊，並依每個任務自己的 `interval` 檢查。
    - 只有**到期**的任務會包含在該 tick 的心跳偵測提示中。
    - 如果沒有任務到期，心跳偵測會完全略過（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中的非任務內容會保留，並作為額外內容附加在到期任務清單之後。
    - 任務上次執行時間戳會儲存在工作階段狀態（`heartbeatTaskState`）中，因此間隔可在一般重新啟動後保留。
    - 任務時間戳只會在心跳偵測執行完成其一般回覆路徑後推進。略過的 `empty-heartbeat-file` / `no-tasks-due` 執行不會將任務標記為已完成。

  </Accordion>
</AccordionGroup>

當你希望一個心跳偵測檔案保留多個週期性檢查，但不想每個 tick 都為所有檢查付出成本時，任務模式很有用。

### 代理可以更新 HEARTBEAT.md 嗎？

可以 - 如果你要求它這麼做。

`HEARTBEAT.md` 只是代理工作區中的一般檔案，因此你可以在一般聊天中告訴代理，例如：

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

如果你希望主動發生，也可以在心跳偵測提示中包含明確的一行，例如：「如果檢查清單過時，請用更好的版本更新 HEARTBEAT.md。」

<Warning>
不要把秘密（API 金鑰、電話號碼、私人權杖）放進 `HEARTBEAT.md` - 它會成為提示內容的一部分。
</Warning>

## 手動喚醒（隨需）

使用 `openclaw system event` 將系統事件加入佇列，並可選擇觸發立即心跳偵測：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| 旗標                         | 說明                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | 系統事件文字（必填）。                                                                           |
| `--mode <mode>`              | `now` 會執行立即心跳偵測；`next-heartbeat`（預設）會等待下一個排程 tick。                       |
| `--session-key <sessionKey>` | 將事件目標設為特定工作階段；預設為代理的主要工作階段。                                          |
| `--json`                     | 輸出 JSON。                                                                                      |

如果未提供 `--session-key`，且有多個代理設定了 `heartbeat`，`--mode now` 會立即執行每個這類代理的心跳偵測。

同一個命令列介面群組中的相關心跳偵測控制：

```bash
openclaw system heartbeat last     # show the last heartbeat event
openclaw system heartbeat enable   # enable heartbeats
openclaw system heartbeat disable  # disable heartbeats
```

## 推理傳送（選用）

根據預設，心跳偵測只會傳送最終的「答案」承載內容。

如果你想要透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，心跳偵測也會傳送一則以 `Thinking` 為前綴的獨立訊息（形狀與 `/reasoning on` 相同）。當代理程式正在管理多個工作階段/Codex，且你想知道它為何決定 ping 你時，這會很有用，但它也可能洩漏比你想要更多的內部細節。在群組聊天中建議保持關閉。

## 成本意識

心跳偵測會執行完整的代理程式回合。間隔越短會消耗越多 token。若要降低成本：

- 使用 `isolatedSession: true`，避免傳送完整對話歷史記錄（每次執行約從 100K token 降到約 2-5K）。
- 使用 `lightContext: true`，將啟動載入檔案限制為只有 `HEARTBEAT.md`。
- 設定較便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 精簡。
- 如果你只想要內部狀態更新，請使用 `target: "none"`。

## 心跳偵測後的情境溢位

心跳偵測會在執行完成後保留共享工作階段既有的執行階段模型，因此將工作階段切換到較小本機模型（例如具備 32k 視窗的 Ollama 模型）的心跳偵測，可能會讓該模型保留到下一個主工作階段回合。如果下一個回合接著回報情境溢位，且工作階段的上一個執行階段模型符合設定的 `heartbeat.model`，OpenClaw 的復原訊息會指出心跳偵測模型滲漏是可能原因，並建議修正方式。

若要避免這種情況：使用 `isolatedSession: true` 在全新工作階段中執行心跳偵測（可選擇搭配 `lightContext: true` 以取得最小提示），或選擇具備足夠大情境視窗、可支援共享工作階段的心跳偵測模型。

## 相關

- [自動化](/zh-TW/automation) - 一覽所有自動化機制
- [背景任務](/zh-TW/automation/tasks) - 分離式工作如何被追蹤
- [時區](/zh-TW/concepts/timezone) - 時區如何影響心跳偵測排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) - 偵錯自動化問題
