---
read_when:
    - 調整 Heartbeat 頻率或訊息
    - 決定排程任務要使用 Heartbeat 還是 Cron
sidebarTitle: Heartbeat
summary: Heartbeat 輪詢訊息與通知規則
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 與 cron？**請參閱[Automation](/zh-TW/automation)，了解何時使用各自功能的指引。
</Note>

Heartbeat 會在主要工作階段中執行**定期代理程式輪次**，讓模型能提出需要注意的事項，而不會大量打擾你。

Heartbeat 是排程的主要工作階段輪次，**不會**建立[背景任務](/zh-TW/automation/tasks)記錄。任務記錄用於分離的工作（ACP 執行、子代理程式、隔離的 Cron 作業）。

疑難排解：[排程任務](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速開始（初學者）

<Steps>
  <Step title="選擇頻率">
    保持 Heartbeat 啟用（預設為 `30m`，若使用 Anthropic OAuth/權杖驗證，包括重用 Claude CLI，則為 `1h`），或設定你自己的頻率。
  </Step>
  <Step title="新增 HEARTBEAT.md（選用）">
    在代理程式工作區中建立一個精簡的 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="決定 Heartbeat 訊息應送往何處">
    `target: "none"` 是預設值；設定 `target: "last"` 可路由到最後一位聯絡人。
  </Step>
  <Step title="選用調校">
    - 啟用 Heartbeat 推理傳送以提高透明度。
    - 如果 Heartbeat 執行只需要 `HEARTBEAT.md`，請使用輕量級啟動內容。
    - 啟用隔離工作階段，避免每次 Heartbeat 都傳送完整對話歷史。
    - 將 Heartbeat 限制在活動時段內（本地時間）。

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
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## 預設值

- 間隔：`30m`（偵測到 Anthropic OAuth/權杖驗證模式時，包括重用 Claude CLI，則為 `1h`）。設定 `agents.defaults.heartbeat.every` 或每個代理程式的 `agents.list[].heartbeat.every`；使用 `0m` 停用。
- 提示內容（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示會作為使用者訊息**逐字**送出。只有在預設代理程式啟用 Heartbeat 時，系統提示才會包含「Heartbeat」區段，且該次執行會在內部標記。
- 使用 `0m` 停用 Heartbeat 時，正常執行也會從啟動內容中省略 `HEARTBEAT.md`，讓模型不會看到僅供 Heartbeat 使用的指示。
- 活動時段（`heartbeat.activeHours`）會在設定的時區中檢查。視窗之外會略過 Heartbeat，直到視窗內的下一個 tick。
- Heartbeat 會在 Cron 工作進行中或佇列中時自動延後。設定 `heartbeat.skipWhenBusy: true`，也可在代理程式自己的工作階段鍵控子代理程式或巢狀命令通道忙碌時延後該代理程式；兄弟代理程式不再只是因為另一個代理程式有子代理程式工作進行中而暫停。

## Heartbeat 提示的用途

預設提示刻意保持寬泛：

- **背景任務**：「Consider outstanding tasks」會提醒代理程式檢視後續事項（收件匣、行事曆、提醒、佇列工作），並提出任何緊急事項。
- **人類確認**：「Checkup sometimes on your human during day time」會提醒偶爾傳送輕量級的「你有需要什麼嗎？」訊息，但會使用你設定的本地時區（請參閱[時區](/zh-TW/concepts/timezone)）避免夜間打擾。

Heartbeat 可以回應已完成的[背景任務](/zh-TW/automation/tasks)，但 Heartbeat 執行本身不會建立任務記錄。

如果你希望 Heartbeat 執行非常特定的工作（例如「檢查 Gmail PubSub 統計資料」或「驗證 Gateway 健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設定為自訂內容（逐字送出）。

## 回應合約

- 如果沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 具備工具能力的 Heartbeat 執行可以改為呼叫 `heartbeat_respond`，以 `notify: false` 表示沒有可見更新，或以 `notify: true` 加上 `notificationText` 發出提醒。若存在結構化工具回應，會優先於文字備援。
- 在 Heartbeat 執行期間，當 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**時，OpenClaw 會將其視為確認。該權杖會被移除；如果剩餘內容 **≤ `ackMaxChars`**（預設：300），則會丟棄該回覆。
- 如果 `HEARTBEAT_OK` 出現在回覆的**中間**，不會做特殊處理。
- 對於提醒，**不要**包含 `HEARTBEAT_OK`；只回傳提醒文字。

在 Heartbeat 之外，訊息開頭/結尾的零散 `HEARTBEAT_OK` 會被移除並記錄；只有 `HEARTBEAT_OK` 的訊息會被丟棄。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### 範圍與優先順序

- `agents.defaults.heartbeat` 設定全域 Heartbeat 行為。
- `agents.list[].heartbeat` 會在其上合併；如果任何代理程式有 `heartbeat` 區塊，**只有那些代理程式**會執行 Heartbeat。
- `channels.defaults.heartbeat` 設定所有通道的可見性預設值。
- `channels.<channel>.heartbeat` 覆寫通道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳號通道）會覆寫各通道設定。

### 每個代理程式的 Heartbeat

如果任何 `agents.list[]` 項目包含 `heartbeat` 區塊，**只有那些代理程式**會執行 Heartbeat。每個代理程式的區塊會合併在 `agents.defaults.heartbeat` 之上（因此你可以設定一次共用預設值，並按代理程式覆寫）。

範例：兩個代理程式，只有第二個代理程式會執行 Heartbeat。

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

### 有效時段範例

將 Heartbeat 限制在特定時區的營業時間內：

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

在此時段之外（美東時間上午 9 點前或晚上 10 點後），會略過 Heartbeat。時段內的下一個排程 tick 會照常執行。

### 24/7 設定

如果你想讓 Heartbeat 全天執行，請使用以下其中一種模式：

- 完全省略 `activeHours`（沒有時間範圍限制；這是預設行為）。
- 設定全天範圍：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
請勿將 `start` 和 `end` 設為相同時間（例如從 `08:00` 到 `08:00`）。這會被視為零寬度時間範圍，因此一律會略過 Heartbeat。
</Warning>

### 多帳號範例

使用 `accountId` 指定 Telegram 等多帳號渠道上的特定帳號：

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

### 欄位註記

<ParamField path="every" type="string">
  Heartbeat 間隔（持續時間字串；預設單位 = 分鐘）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 執行的選用模型覆寫 (`provider/model`)。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用時，若可用，也會傳遞單獨的 `Reasoning:` 訊息（格式與 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  為 true 時，Heartbeat 執行會使用輕量啟動脈絡，並且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  為 true 時，每次 Heartbeat 都會在沒有先前對話歷史的新工作階段中執行。使用與 cron `sessionTarget: "isolated"` 相同的隔離模式。大幅降低每次 Heartbeat 的權杖成本。與 `lightContext: true` 搭配使用可獲得最大節省。傳遞路由仍會使用主工作階段脈絡。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  為 true 時，Heartbeat 執行會在該代理程式的額外忙碌通道上延後：它自己的工作階段鍵控子代理程式或巢狀命令工作。Cron 通道一律會延後 Heartbeat，即使沒有此旗標也一樣，因此本機模型主機不會同時執行 Cron 和 Heartbeat 提示。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 執行的選用工作階段鍵。

- `main`（預設）：代理程式主工作階段。
- 明確工作階段鍵（從 `openclaw sessions --json` 或 [工作階段 CLI](/zh-TW/cli/sessions) 複製）。
- 工作階段鍵格式：請參閱 [工作階段](/zh-TW/concepts/session) 和 [群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳遞至上次使用的外部頻道。
- 明確頻道：任何已設定的頻道或 Plugin id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行 Heartbeat，但**不要傳遞**至外部。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/DM 傳遞行為。`allow`：允許直接/DM Heartbeat 傳遞。`block`：抑制直接/DM 傳遞 (`reason=dm-blocked`)。

</ParamField>
<ParamField path="to" type="string">
  選用的收件者覆寫（頻道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。對於 Telegram 主題/執行緒，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳戶頻道的選用帳戶 id。當 `target: "last"` 時，如果解析出的上一個頻道支援帳戶，帳戶 id 會套用至該頻道；否則會被忽略。如果帳戶 id 與解析出的頻道中已設定的帳戶不相符，將略過傳遞。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示本文（不合併）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  傳遞前，`HEARTBEAT_OK` 之後允許的最大字元數。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  為 true 時，在 Heartbeat 執行期間隱藏工具錯誤警告 payload。

</ParamField>
<ParamField path="activeHours" type="object">
  將 Heartbeat 執行限制在一個時間視窗內。物件包含 `start`（HH:MM，含起點；使用 `00:00` 表示一天開始）、`end`（HH:MM，不含終點；允許 `24:00` 表示一天結束），以及選用的 `timezone`。

- 省略或 `"user"`：如果已設定，使用你的 `agents.defaults.userTimezone`，否則退回使用主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；如果無效，則退回使用上述 `"user"` 行為。
- 對於有效視窗，`start` 和 `end` 不得相等；相等值會被視為零寬度（永遠在視窗外）。
- 在有效視窗外，Heartbeat 會被略過，直到視窗內的下一個 tick。

</ParamField>

## 傳遞行為

<AccordionGroup>
  <Accordion title="工作階段與目標路由">
    - Heartbeat 預設在代理的主要工作階段中執行（`agent:<id>:<mainKey>`），或當 `session.scope = "global"` 時在 `global` 中執行。設定 `session` 可覆寫為特定頻道工作階段（Discord/WhatsApp 等）。
    - `session` 只影響執行脈絡；傳遞由 `target` 和 `to` 控制。
    - 若要傳遞到特定頻道/收件者，請設定 `target` + `to`。使用 `target: "last"` 時，傳遞會使用該工作階段的最後一個外部頻道。
    - Heartbeat 傳遞預設允許直接/DM 目標。設定 `directPolicy: "block"` 可在仍然執行 Heartbeat 回合的同時，抑制直接目標傳送。
    - 如果主要佇列、目標工作階段通道、Cron 通道或作用中的 Cron 作業忙碌，Heartbeat 會被略過並稍後重試。
    - 如果 `skipWhenBusy: true`，此代理以工作階段鍵控的子代理與巢狀通道也會延後 Heartbeat 執行。其他代理的忙碌通道不會延後此代理。
    - 如果 `target` 解析不到外部目的地，執行仍會發生，但不會傳送外送訊息。

  </Accordion>
  <Accordion title="可見性與略過行為">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，執行會在一開始就以 `reason=alerts-disabled` 被略過。
    - 如果只停用警示傳遞，OpenClaw 仍可執行 Heartbeat、更新到期任務時間戳、還原工作階段閒置時間戳，並抑制對外警示 payload。
    - 如果解析出的 Heartbeat 目標支援正在輸入，OpenClaw 會在 Heartbeat 執行期間顯示正在輸入。這會使用 Heartbeat 原本會傳送聊天輸出的同一個目標，並可由 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="工作階段生命週期與稽核">
    - 僅 Heartbeat 的回覆**不會**讓工作階段保持存活。Heartbeat 中繼資料可能會更新工作階段列，但閒置到期使用最後一則真實使用者/頻道訊息的 `lastInteractionAt`，每日到期則使用 `sessionStartedAt`。
    - 控制 UI 和 WebChat 歷程會隱藏 Heartbeat 提示與僅 OK 的確認。底層工作階段 transcript 仍可包含這些回合以供稽核/重播。
    - 分離的[背景任務](/zh-TW/automation/tasks)可以將系統事件加入佇列，並在主要工作階段應該快速注意到某件事時喚醒 Heartbeat。該喚醒不會讓 Heartbeat 執行背景任務。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設情況下，會隱藏 `HEARTBEAT_OK` 確認，同時傳遞警示內容。你可以依頻道或依帳號調整：

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

優先順序：每帳號 → 每頻道 → 頻道預設值 → 內建預設值。

### 每個旗標的作用

- `showOk`：當模型回傳僅 OK 的回覆時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型回傳非 OK 回覆時，傳送警示內容。
- `useIndicator`：為 UI 狀態介面發出指示器事件。

如果**三者全部**為 false，OpenClaw 會完全略過 Heartbeat 執行（不呼叫模型）。

### 每頻道與每帳號範例

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

| 目標                                     | 設定                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 預設行為（靜默 OK，開啟警示） | _(不需要設定)_                                                                     |
| 完全靜默（無訊息、無指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（無訊息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 只在一個頻道顯示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（選用）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示會告訴代理讀取它。可以把它想成你的「Heartbeat 檢查清單」：小型、穩定，且可安全地每 30 分鐘納入一次。

在一般執行中，只有在預設代理啟用 Heartbeat 指引時，才會注入 `HEARTBEAT.md`。以 `0m` 停用 Heartbeat 節奏，或設定 `includeSystemPromptSection: false`，會將它從一般啟動脈絡中省略。

如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行和像 `# Heading` 這類 Markdown 標題），OpenClaw 會略過 Heartbeat 執行以節省 API 呼叫。該略過會回報為 `reason=empty-heartbeat-file`。如果檔案缺失，Heartbeat 仍會執行，模型會決定要做什麼。

保持精簡（短檢查清單或提醒）以避免提示膨脹。

範例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援一個小型結構化 `tasks:` 區塊，用於 Heartbeat 本身內的間隔式檢查。

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
  <Accordion title="行為">
    - OpenClaw 會解析 `tasks:` 區塊，並依每個任務自己的 `interval` 檢查它。
    - 只有**到期**任務會包含在該 tick 的 Heartbeat 提示中。
    - 如果沒有任務到期，Heartbeat 會完全略過（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中的非任務內容會被保留，並在到期任務清單後作為額外脈絡附加。
    - 任務上次執行時間戳會儲存在工作階段狀態（`heartbeatTaskState`）中，因此間隔可在一般重新啟動後延續。
    - 任務時間戳只會在 Heartbeat 執行完成其一般回覆路徑後前進。被略過的 `empty-heartbeat-file` / `no-tasks-due` 執行不會將任務標記為完成。

  </Accordion>
</AccordionGroup>

當你希望一個 Heartbeat 檔案保存多個週期性檢查，而不必每個 tick 都為全部檢查付費時，任務模式很有用。

### 代理可以更新 HEARTBEAT.md 嗎？

可以，只要你要求它。

`HEARTBEAT.md` 只是代理工作區中的一般檔案，因此你可以在一般聊天中告訴代理，例如：

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

如果你希望這件事主動發生，也可以在 Heartbeat 提示中包含明確的一行，例如："If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
不要把祕密（API 金鑰、電話號碼、私人 token）放進 `HEARTBEAT.md`，因為它會成為提示脈絡的一部分。
</Warning>

## 手動喚醒（隨需）

你可以加入一個系統事件並用以下方式觸發立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多個代理設定了 `heartbeat`，手動喚醒會立即執行每一個這類代理的 Heartbeat。

使用 `--mode next-heartbeat` 可等待下一個排程 tick。

## 推理傳遞（選用）

預設情況下，Heartbeat 只會傳遞最終「答案」payload。

如果你想要透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，Heartbeat 也會傳遞一則以 `Reasoning:` 為前綴的獨立訊息（形狀與 `/reasoning on` 相同）。當代理管理多個工作階段/codexes，而你想看到它為何決定 ping 你時，這可能很有用，但它也可能洩漏比你想要更多的內部細節。建議在群組聊天中保持關閉。

## 成本意識

Heartbeat 會執行完整代理回合。較短的間隔會消耗更多 token。若要降低成本：

- 使用 `isolatedSession: true` 以避免傳送完整對話歷程（每次執行約從 100K token 降至約 2-5K）。
- 使用 `lightContext: true` 將啟動檔案限制為只有 `HEARTBEAT.md`。
- 設定較便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 精簡。
- 如果你只想更新內部狀態，請使用 `target: "none"`。

## Heartbeat 後的脈絡溢位

如果 Heartbeat 先前讓現有工作階段停留在較小的本機模型上，例如具備 32k 視窗的 Ollama 模型，而下一個主要工作階段回合回報脈絡溢位，請將工作階段執行階段模型重設回設定的主要模型。當最後的執行階段模型符合設定的 `heartbeat.model` 時，OpenClaw 的重設訊息會指出這一點。

目前的 Heartbeat 會在執行完成後保留共享工作階段既有的執行階段模型。你仍可使用 `isolatedSession: true` 在新的工作階段中執行 Heartbeat，搭配 `lightContext: true` 取得最小提示，或選擇具備足夠大脈絡視窗、可容納共享工作階段的 Heartbeat 模型。

## 相關

- [自動化](/zh-TW/automation) — 所有自動化機制一覽
- [背景任務](/zh-TW/automation/tasks) — 分離工作如何被追蹤
- [時區](/zh-TW/concepts/timezone) — 時區如何影響 Heartbeat 排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) — 偵錯自動化問題
