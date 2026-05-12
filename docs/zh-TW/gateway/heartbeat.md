---
read_when:
    - 調整 Heartbeat 頻率或訊息內容
    - 針對排程任務在 Heartbeat 與 Cron 之間做選擇
sidebarTitle: Heartbeat
summary: Heartbeat 輪詢訊息與通知規則
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 與 Cron？** 請參閱[自動化](/zh-TW/automation)，了解何時使用各自功能的指引。
</Note>

Heartbeat 會在主要工作階段中執行**週期性的代理回合**，讓模型能浮現需要注意的事項，而不會對你造成訊息轟炸。

Heartbeat 是排程的主要工作階段回合，不會建立[背景工作](/zh-TW/automation/tasks)記錄。工作記錄是給分離式工作的（ACP 執行、子代理、隔離的 Cron 作業）。

疑難排解：[排程工作](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速開始（初學者）

<Steps>
  <Step title="選擇節奏">
    保持啟用 Heartbeat（預設為 `30m`，若為 Anthropic OAuth/token 驗證，包括 Claude CLI 重用，則為 `1h`），或設定你自己的節奏。
  </Step>
  <Step title="新增 HEARTBEAT.md（選用）">
    在代理工作區中建立一個很小的 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="決定 Heartbeat 訊息應送往何處">
    `target: "none"` 是預設值；設定 `target: "last"` 可路由到最後一個聯絡對象。
  </Step>
  <Step title="選用調整">
    - 啟用 Heartbeat 推理傳送，以提升透明度。
    - 如果 Heartbeat 執行只需要 `HEARTBEAT.md`，請使用輕量啟動內容。
    - 啟用隔離工作階段，避免每次 Heartbeat 都傳送完整對話歷史。
    - 將 Heartbeat 限制在有效時段（本地時間）。

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## 預設值

- 間隔：`30m`（偵測到的驗證模式為 Anthropic OAuth/token 驗證時為 `1h`，包括 Claude CLI 重用）。設定 `agents.defaults.heartbeat.every` 或各代理的 `agents.list[].heartbeat.every`；使用 `0m` 停用。
- 提示本文（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示會作為使用者訊息**逐字**傳送。只有在預設代理啟用 Heartbeat 時，系統提示才會包含「Heartbeat」區段，且該次執行會在內部標記。
- 使用 `0m` 停用 Heartbeat 時，正常執行也會從啟動內容中省略 `HEARTBEAT.md`，讓模型不會看到僅供 Heartbeat 使用的指示。
- 有效時段（`heartbeat.activeHours`）會依設定的時區檢查。在時段之外，Heartbeat 會略過，直到下一個落在時段內的 tick。
- 當 Cron 工作正在進行或排隊時，Heartbeat 會自動延後。設定 `heartbeat.skipWhenBusy: true` 可在額外忙碌的通道（子代理或巢狀命令工作）也延後；這對本機 Ollama 和其他受限的單一執行環境主機很有用。

## Heartbeat 提示的用途

預設提示刻意保持寬泛：

- **背景工作**：「Consider outstanding tasks」會促使代理檢視後續事項（收件匣、行事曆、提醒事項、排隊工作），並浮現任何緊急事項。
- **人員關照**：「Checkup sometimes on your human during day time」會促使偶爾發送輕量的「有什麼需要嗎？」訊息，但會使用你設定的本地時區以避免夜間訊息轟炸（請參閱[時區](/zh-TW/concepts/timezone)）。

Heartbeat 可以對已完成的[背景工作](/zh-TW/automation/tasks)作出反應，但 Heartbeat 執行本身不會建立工作記錄。

如果你希望 Heartbeat 做非常特定的事（例如「檢查 Gmail PubSub 統計」或「驗證 Gateway 健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設定為自訂本文（逐字傳送）。

## 回應契約

- 如果沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 具備工具能力的 Heartbeat 執行可以改為呼叫 `heartbeat_respond`，以 `notify: false` 表示沒有可見更新，或以 `notify: true` 加上 `notificationText` 表示警示。若存在結構化工具回應，它會優先於文字備援。
- 在 Heartbeat 執行期間，當 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**時，OpenClaw 會將其視為 ack。該 token 會被移除；若剩餘內容 **≤ `ackMaxChars`**（預設：300），則會丟棄該回覆。
- 如果 `HEARTBEAT_OK` 出現在回覆**中間**，不會被特殊處理。
- 對於警示，**不要**包含 `HEARTBEAT_OK`；只回傳警示文字。

在 Heartbeat 之外，訊息開頭/結尾的游離 `HEARTBEAT_OK` 會被移除並記錄；只有 `HEARTBEAT_OK` 的訊息會被丟棄。

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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
- `agents.list[].heartbeat` 會合併在其上；如果任何代理有 `heartbeat` 區塊，**只有那些代理**會執行 Heartbeat。
- `channels.defaults.heartbeat` 設定所有頻道的可見性預設值。
- `channels.<channel>.heartbeat` 會覆寫頻道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳號頻道）會覆寫各頻道設定。

### 各代理 Heartbeat

如果任何 `agents.list[]` 項目包含 `heartbeat` 區塊，**只有那些代理**會執行 Heartbeat。各代理區塊會合併在 `agents.defaults.heartbeat` 之上（因此你可以先設定共用預設值，再針對各代理覆寫）。

範例：兩個代理，只有第二個代理執行 Heartbeat。

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

將 Heartbeat 限制在特定時區的營業時間：

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

在此時段之外（美東時間上午 9 點前或晚上 10 點後），Heartbeat 會被略過。下一個落在時段內的排程 tick 會正常執行。

### 24/7 設定

如果你希望 Heartbeat 全天執行，請使用以下其中一種模式：

- 完全省略 `activeHours`（沒有時間視窗限制；這是預設行為）。
- 設定全天視窗：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要將 `start` 和 `end` 設為相同時間（例如 `08:00` 到 `08:00`）。這會被視為寬度為零的視窗，因此 Heartbeat 會永遠被略過。
</Warning>

### 多帳號範例

使用 `accountId` 在 Telegram 等多帳號頻道上指定特定帳號：

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
  Heartbeat 間隔（duration 字串；預設單位 = 分鐘）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 執行的選用模型覆寫（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用後，也會在可用時傳送獨立的 `Reasoning:` 訊息（形狀與 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  為 true 時，Heartbeat 執行會使用輕量啟動內容，並且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  為 true 時，每次 Heartbeat 都會在沒有先前對話歷史的新工作階段中執行。使用與 Cron `sessionTarget: "isolated"` 相同的隔離模式。大幅降低每次 Heartbeat 的 token 成本。搭配 `lightContext: true` 可獲得最大節省。傳送路由仍使用主要工作階段內容。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  為 true 時，Heartbeat 執行會在額外忙碌的通道延後：子代理或巢狀命令工作。Cron 通道一律會延後 Heartbeat，即使沒有此旗標，因此本機模型主機不會同時執行 Cron 與 Heartbeat 提示。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 執行的選用工作階段鍵。

- `main`（預設）：代理主要工作階段。
- 明確的工作階段鍵（從 `openclaw sessions --json` 或[工作階段 CLI](/zh-TW/cli/sessions) 複製）。
- 工作階段鍵格式：請參閱[工作階段](/zh-TW/concepts/session)與[群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳送到最後使用的外部頻道。
- 明確頻道：任何已設定的頻道或 Plugin ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行 Heartbeat，但**不會對外傳送**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/DM 傳送行為。`allow`：允許直接/DM Heartbeat 傳送。`block`：抑制直接/DM 傳送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  選用收件者覆寫（頻道特定 ID，例如 WhatsApp 的 E.164 或 Telegram chat id）。對於 Telegram 主題/討論串，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳號頻道的選用帳號 ID。當 `target: "last"` 時，若解析出的最後頻道支援帳號，帳號 ID 會套用到該頻道；否則會被忽略。如果帳號 ID 不符合解析頻道中已設定的帳號，傳送會被略過。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示本文（不合併）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  在傳遞前，`HEARTBEAT_OK` 之後允許的最大字元數。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  為 true 時，會在 Heartbeat 執行期間抑制工具錯誤警告酬載。

</ParamField>
<ParamField path="activeHours" type="object">
  將 Heartbeat 執行限制在時間範圍內。物件包含 `start`（HH:MM，含起始時間；使用 `00:00` 表示一天開始）、`end`（HH:MM，不含結束時間；允許 `24:00` 表示一天結束），以及可選的 `timezone`。

- 省略或 `"user"`：如果已設定，會使用你的 `agents.defaults.userTimezone`，否則退回使用主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；若無效，則退回使用上述 `"user"` 行為。
- 對於有效時段，`start` 和 `end` 不得相等；相等值會被視為零寬度（一律在時段之外）。
- 在有效時段之外，Heartbeat 會被略過，直到下一個落在時段內的 tick。

</ParamField>

## 傳遞行為

<AccordionGroup>
  <Accordion title="工作階段與目標路由">
    - Heartbeat 預設在代理的主要工作階段中執行（`agent:<id>:<mainKey>`），或在 `session.scope = "global"` 時使用 `global`。設定 `session` 可覆寫到特定通道工作階段（Discord/WhatsApp 等）。
    - `session` 只影響執行上下文；傳遞由 `target` 和 `to` 控制。
    - 若要傳遞到特定通道/收件者，請設定 `target` + `to`。使用 `target: "last"` 時，傳遞會使用該工作階段最後一個外部通道。
    - Heartbeat 傳遞預設允許直接/DM 目標。設定 `directPolicy: "block"` 可在仍然執行 Heartbeat 回合的同時，抑制傳送到直接目標。
    - 如果主要佇列、目標工作階段 lane、cron lane，或作用中的 cron 工作忙碌中，Heartbeat 會被略過並稍後重試。
    - 如果 `skipWhenBusy: true`，子代理和巢狀 lane 也會延後 Heartbeat 執行。
    - 如果 `target` 解析不到外部目的地，執行仍會發生，但不會傳送任何外送訊息。

  </Accordion>
  <Accordion title="可見性與略過行為">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，執行會一開始就以 `reason=alerts-disabled` 略過。
    - 如果只有警示傳遞被停用，OpenClaw 仍可執行 Heartbeat、更新到期工作的時間戳記、還原工作階段閒置時間戳記，並抑制對外的警示酬載。
    - 如果解析出的 Heartbeat 目標支援正在輸入狀態，OpenClaw 會在 Heartbeat 執行期間顯示正在輸入。這會使用 Heartbeat 原本要傳送聊天輸出到的相同目標，且會由 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="工作階段生命週期與稽核">
    - 僅 Heartbeat 的回覆**不會**讓工作階段保持作用中。Heartbeat 中繼資料可能會更新工作階段列，但閒置到期使用的是最後一則真實使用者/通道訊息的 `lastInteractionAt`，每日到期則使用 `sessionStartedAt`。
    - 控制 UI 和 WebChat 歷程會隱藏 Heartbeat 提示與僅 OK 的確認。底層工作階段逐字稿仍可包含這些回合，以供稽核/重播。
    - 分離的[背景工作](/zh-TW/automation/tasks)可以排入系統事件，並在主要工作階段應該快速注意到某件事時喚醒 Heartbeat。該喚醒不會讓 Heartbeat 執行背景工作。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設情況下，`HEARTBEAT_OK` 確認會被抑制，而警示內容會被傳遞。你可以依通道或帳戶調整：

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

優先順序：每個帳戶 → 每個通道 → 通道預設值 → 內建預設值。

### 每個旗標的作用

- `showOk`：當模型傳回僅 OK 的回覆時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型傳回非 OK 回覆時，傳送警示內容。
- `useIndicator`：為 UI 狀態表面發出指示器事件。

如果**三者**皆為 false，OpenClaw 會完全略過 Heartbeat 執行（不呼叫模型）。

### 每通道與每帳戶範例

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
| 預設行為（靜默 OK、開啟警示）           | _(不需要設定)_                                                                           |
| 完全靜默（沒有訊息、沒有指示器）        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（沒有訊息）                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 只在一個通道顯示 OK                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可選）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示會要求代理讀取它。可把它視為你的「Heartbeat 檢查清單」：小型、穩定，且可安全地每 30 分鐘納入一次。

在一般執行中，只有在預設代理啟用 Heartbeat 指引時，才會注入 `HEARTBEAT.md`。使用 `0m` 停用 Heartbeat 節奏，或設定 `includeSystemPromptSection: false`，會將它從一般啟動上下文中省略。

如果 `HEARTBEAT.md` 存在但實際上為空（只有空白行和像 `# Heading` 這類 markdown 標題），OpenClaw 會略過 Heartbeat 執行以節省 API 呼叫。該略過會回報為 `reason=empty-heartbeat-file`。如果檔案遺失，Heartbeat 仍會執行，並由模型決定要做什麼。

保持精簡（簡短檢查清單或提醒），以避免提示膨脹。

`HEARTBEAT.md` 範例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援小型結構化的 `tasks:` 區塊，用於 Heartbeat 內部依間隔執行的檢查。

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
    - OpenClaw 會剖析 `tasks:` 區塊，並依每個工作的自身 `interval` 檢查。
    - 只有**到期**的工作會被包含在該 tick 的 Heartbeat 提示中。
    - 如果沒有工作到期，Heartbeat 會被完全略過（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中的非工作內容會被保留，並在到期工作清單後附加為額外上下文。
    - 工作的上次執行時間戳記會儲存在工作階段狀態中（`heartbeatTaskState`），因此間隔可在一般重新啟動後保留。
    - 工作時間戳記只會在 Heartbeat 執行完成其一般回覆路徑後推進。被略過的 `empty-heartbeat-file` / `no-tasks-due` 執行不會將工作標記為已完成。

  </Accordion>
</AccordionGroup>

當你想讓一個 Heartbeat 檔案容納多個週期性檢查，而不必每個 tick 都為全部檢查付費時，工作模式很有用。

### 代理可以更新 HEARTBEAT.md 嗎？

可以，只要你要求它這麼做。

`HEARTBEAT.md` 只是代理工作區中的一般檔案，因此你可以在一般聊天中告訴代理，例如：

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

如果你希望主動發生這件事，也可以在 Heartbeat 提示中加入明確的一行，例如："If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
不要把秘密（API 金鑰、電話號碼、私人權杖）放進 `HEARTBEAT.md`，它會成為提示上下文的一部分。
</Warning>

## 手動喚醒（隨需）

你可以使用以下命令排入系統事件並觸發立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多個代理已設定 `heartbeat`，手動喚醒會立即執行每個代理的 Heartbeat。

使用 `--mode next-heartbeat` 可等待下一個排程 tick。

## Reasoning 傳遞（可選）

預設情況下，Heartbeat 只會傳遞最終「答案」酬載。

如果你想要透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，Heartbeat 也會傳遞另一則以 `Reasoning:` 為前綴的訊息（形狀與 `/reasoning on` 相同）。當代理管理多個工作階段/codex 時，這有助於了解它為什麼決定提示你，但也可能洩露比你想要更多的內部細節。建議在群組聊天中保持關閉。

## 成本意識

Heartbeat 會執行完整的代理回合。較短的間隔會消耗更多 token。若要降低成本：

- 使用 `isolatedSession: true` 以避免傳送完整對話歷程（每次執行約從 ~100K token 降到 ~2-5K）。
- 使用 `lightContext: true` 將啟動檔案限制為只有 `HEARTBEAT.md`。
- 設定較便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 讓 `HEARTBEAT.md` 保持小型。
- 如果你只想要內部狀態更新，請使用 `target: "none"`。

## Heartbeat 之後的上下文溢位

如果 Heartbeat 先前讓現有工作階段留在較小的本機模型上，例如具有 32k 視窗的 Ollama 模型，而下一個主要工作階段回合回報上下文溢位，請將工作階段執行階段模型重設回已設定的主要模型。當最後的執行階段模型符合已設定的 `heartbeat.model` 時，OpenClaw 的重設訊息會指出這一點。

目前的 Heartbeat 會在執行完成後保留共享工作階段既有的執行階段模型。你仍然可以使用 `isolatedSession: true` 在新的工作階段中執行 Heartbeat，搭配 `lightContext: true` 取得最小提示，或選擇上下文視窗足以容納共享工作階段的 Heartbeat 模型。

## 相關

- [自動化](/zh-TW/automation) — 一覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) — 分離式工作的追蹤方式
- [時區](/zh-TW/concepts/timezone) — 時區如何影響 Heartbeat 排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) — 偵錯自動化問題
