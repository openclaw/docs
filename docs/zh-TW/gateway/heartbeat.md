---
read_when:
    - 調整 Heartbeat 頻率或訊息內容
    - 為排程工作選擇 Heartbeat 或 Cron
sidebarTitle: Heartbeat
summary: Heartbeat 輪詢訊息與通知規則
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:35:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 與 Cron？** 請參閱[自動化與任務](/zh-TW/automation)，了解何時使用各項功能的指引。
</Note>

Heartbeat 會在主要工作階段中執行**週期性代理回合**，讓模型可以浮現任何需要注意的事項，而不會一直打擾你。

Heartbeat 是排程的主要工作階段回合，不會建立[背景任務](/zh-TW/automation/tasks)記錄。任務記錄適用於分離式工作（ACP 執行、子代理、隔離的 Cron 作業）。

疑難排解：[排程任務](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速開始（初學者）

<Steps>
  <Step title="Pick a cadence">
    保持啟用 heartbeats（預設為 `30m`，若使用 Anthropic OAuth/token auth，包括 Claude CLI 重用，則為 `1h`），或設定自己的頻率。
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    在代理工作區中建立一個精簡的 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` 是預設值；設定 `target: "last"` 可路由到上一個聯絡對象。
  </Step>
  <Step title="Optional tuning">
    - 啟用 heartbeat reasoning 傳送以提升透明度。
    - 如果 heartbeat 執行只需要 `HEARTBEAT.md`，請使用輕量 bootstrap context。
    - 啟用隔離工作階段，避免每次 heartbeat 都傳送完整對話歷史。
    - 將 heartbeats 限制在活動時段（本地時間）內。

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

- 間隔：`30m`（或在偵測到 Anthropic OAuth/token auth 模式時為 `1h`，包括 Claude CLI 重用）。設定 `agents.defaults.heartbeat.every` 或每個代理的 `agents.list[].heartbeat.every`；使用 `0m` 可停用。
- 提示詞本文（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat 提示詞會以使用者訊息的形式**逐字**傳送。只有在預設代理啟用 heartbeats 時，系統提示詞才會包含「Heartbeat」區段，且該次執行會在內部標記。
- 使用 `0m` 停用 heartbeats 時，一般執行也會從 bootstrap context 中省略 `HEARTBEAT.md`，因此模型不會看到僅供 heartbeat 使用的指示。
- 活動時段（`heartbeat.activeHours`）會在已設定的時區中檢查。在時段外，heartbeats 會略過，直到該時段內的下一個 tick。
- 當 Cron 工作正在執行或排隊時，heartbeats 會自動延後。設定 `heartbeat.skipWhenBusy: true` 可在額外忙碌的通道（子代理或巢狀命令工作）中也延後；這對本機 Ollama 和其他受限的單一執行階段主機很有用。

## heartbeat 提示詞的用途

預設提示詞刻意保持寬泛：

- **背景任務**：「Consider outstanding tasks」會引導代理檢查後續事項（收件匣、行事曆、提醒、排隊工作），並浮現任何緊急事項。
- **與人類確認**：「Checkup sometimes on your human during day time」會引導偶爾傳送一則輕量的「有需要我做什麼嗎？」訊息，但會使用你設定的本地時區來避免夜間打擾（請參閱[時區](/zh-TW/concepts/timezone)）。

Heartbeat 可以對已完成的[背景任務](/zh-TW/automation/tasks)做出反應，但 heartbeat 執行本身不會建立任務記錄。

如果你希望 heartbeat 執行非常特定的事項（例如「檢查 Gmail PubSub 統計資料」或「驗證 Gateway 健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設定為自訂本文（逐字傳送）。

## 回應契約

- 如果沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 可使用工具的 heartbeat 執行也可以改為呼叫 `heartbeat_respond`，並使用 `notify: false` 表示沒有可見更新，或使用 `notify: true` 加上 `notificationText` 發出警示。若存在結構化工具回應，其優先順序高於文字備援。
- 在 heartbeat 執行期間，當 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**時，OpenClaw 會將其視為 ack。該 token 會被移除，且若剩餘內容 **≤ `ackMaxChars`**（預設：300），回覆會被捨棄。
- 如果 `HEARTBEAT_OK` 出現在回覆的**中間**，不會受到特殊處理。
- 對於警示，**不要**包含 `HEARTBEAT_OK`；只傳回警示文字。

在 heartbeats 之外，訊息開頭/結尾的多餘 `HEARTBEAT_OK` 會被移除並記錄；僅包含 `HEARTBEAT_OK` 的訊息會被捨棄。

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

- `agents.defaults.heartbeat` 設定全域 heartbeat 行為。
- `agents.list[].heartbeat` 會合併在其上；如果任何代理有 `heartbeat` 區塊，**只有那些代理**會執行 heartbeats。
- `channels.defaults.heartbeat` 設定所有頻道的可見性預設值。
- `channels.<channel>.heartbeat` 會覆寫頻道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳戶頻道）會覆寫每個頻道的設定。

### 每個代理的 heartbeats

如果任何 `agents.list[]` 項目包含 `heartbeat` 區塊，**只有那些代理**會執行 heartbeats。每個代理的區塊會合併在 `agents.defaults.heartbeat` 之上（因此你可以先設定一次共用預設值，再針對每個代理覆寫）。

範例：兩個代理，只有第二個代理執行 heartbeats。

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

將 heartbeats 限制在特定時區的營業時間內：

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

在此時段之外（美東時間上午 9 點前或晚上 10 點後），heartbeats 會被略過。時段內的下一個排程 tick 會正常執行。

### 24/7 設定

如果你希望 heartbeats 全天執行，請使用以下其中一種模式：

- 完全省略 `activeHours`（沒有時間範圍限制；這是預設行為）。
- 設定全天時段：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要將 `start` 與 `end` 設為相同時間（例如 `08:00` 到 `08:00`）。這會被視為零寬度時段，因此 heartbeats 一律會被略過。
</Warning>

### 多帳戶範例

使用 `accountId` 來指定多帳戶頻道上的特定帳戶，例如 Telegram：

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
  Heartbeat 間隔（duration string；預設單位 = 分鐘）。
</ParamField>
<ParamField path="model" type="string">
  heartbeat 執行的可選模型覆寫（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用時，也會在可用時傳送獨立的 `Reasoning:` 訊息（形狀與 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  為 true 時，heartbeat 執行會使用輕量 bootstrap context，並且只保留工作區 bootstrap files 中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  為 true 時，每個 heartbeat 都會在沒有先前對話歷史的新工作階段中執行。使用與 Cron `sessionTarget: "isolated"` 相同的隔離模式。大幅降低每次 heartbeat 的 token 成本。搭配 `lightContext: true` 可達到最大節省。傳送路由仍會使用主要工作階段 context。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  為 true 時，heartbeat 執行會在額外忙碌的通道上延後：子代理或巢狀命令工作。Cron 通道一律會延後 heartbeats，即使沒有此旗標也一樣，因此本機模型主機不會同時執行 Cron 與 heartbeat 提示詞。
</ParamField>
<ParamField path="session" type="string">
  heartbeat 執行的可選工作階段鍵。

- `main`（預設）：代理主要工作階段。
- 明確工作階段鍵（從 `openclaw sessions --json` 或 [sessions CLI](/zh-TW/cli/sessions) 複製）。
- 工作階段鍵格式：請參閱[工作階段](/zh-TW/concepts/session)和[群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳送到上一個使用的外部頻道。
- 明確頻道：任何已設定的頻道或 plugin id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行 heartbeat，但**不要對外傳送**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/DM 傳送行為。`allow`：允許直接/DM heartbeat 傳送。`block`：抑制直接/DM 傳送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可選的收件者覆寫（頻道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。對於 Telegram topics/threads，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳戶頻道的可選帳戶 id。當 `target: "last"` 時，如果解析出的上一個頻道支援帳戶，該帳戶 id 會套用於該頻道；否則會被忽略。如果帳戶 id 不符合解析出頻道的任何已設定帳戶，傳送會被略過。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示詞本文（不合併）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  `HEARTBEAT_OK` 後、傳送前允許的最大字元數。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  為 true 時，在 Heartbeat 執行期間抑制工具錯誤警告承載。

</ParamField>
<ParamField path="activeHours" type="object">
  將 Heartbeat 執行限制在某個時間範圍內。物件包含 `start`（HH:MM，含起始時間；使用 `00:00` 表示一天開始）、`end`（HH:MM，不含結束時間；允許 `24:00` 表示一天結束），以及選用的 `timezone`。

- 省略或 `"user"`：若已設定，使用你的 `agents.defaults.userTimezone`，否則退回使用主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；若無效，則退回上述 `"user"` 行為。
- 對於啟用時間範圍，`start` 和 `end` 不得相等；相等值會被視為零寬度（一律在範圍外）。
- 在啟用時間範圍外，Heartbeat 會被略過，直到範圍內的下一個 tick。

</ParamField>

## 傳送行為

<AccordionGroup>
  <Accordion title="工作階段與目標路由">
    - Heartbeat 預設在代理的主要工作階段中執行（`agent:<id>:<mainKey>`），或在 `session.scope = "global"` 時使用 `global`。設定 `session` 可覆寫為特定通道工作階段（Discord/WhatsApp 等）。
    - `session` 只影響執行情境；傳送由 `target` 和 `to` 控制。
    - 若要傳送到特定通道/收件者，請設定 `target` + `to`。使用 `target: "last"` 時，傳送會使用該工作階段最後的外部通道。
    - Heartbeat 傳送預設允許直接/DM 目標。設定 `directPolicy: "block"` 可抑制傳送至直接目標，同時仍執行 Heartbeat 回合。
    - 如果主佇列、目標工作階段 lane、Cron lane 或作用中的 Cron 工作忙碌，Heartbeat 會被略過並稍後重試。
    - 如果 `skipWhenBusy: true`，子代理和巢狀 lane 也會延後 Heartbeat 執行。
    - 如果 `target` 解析後沒有外部目的地，執行仍會發生，但不會傳送出站訊息。

  </Accordion>
  <Accordion title="可見性與略過行為">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，執行會在一開始就以 `reason=alerts-disabled` 略過。
    - 如果只有警示傳送被停用，OpenClaw 仍可執行 Heartbeat、更新到期任務時間戳記、還原工作階段閒置時間戳記，並抑制對外警示承載。
    - 如果解析出的 Heartbeat 目標支援輸入狀態，OpenClaw 會在 Heartbeat 執行期間顯示輸入中。這會使用 Heartbeat 原本會傳送聊天輸出的同一目標，並可透過 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="工作階段生命週期與稽核">
    - 僅 Heartbeat 的回覆**不會**讓工作階段保持作用中。Heartbeat 中繼資料可能會更新工作階段列，但閒置到期使用最後一則真實使用者/通道訊息的 `lastInteractionAt`，每日到期則使用 `sessionStartedAt`。
    - 控制 UI 和 WebChat 歷史記錄會隱藏 Heartbeat 提示和僅 OK 的確認。底層工作階段逐字稿仍可包含這些回合，以供稽核/重播。
    - 分離式[背景任務](/zh-TW/automation/tasks)可以將系統事件排入佇列，並在主工作階段需要快速注意某事時喚醒 Heartbeat。該喚醒不會讓 Heartbeat 執行背景任務。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設情況下，傳送警示內容時會抑制 `HEARTBEAT_OK` 確認。你可以依通道或依帳號調整：

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

優先順序：依帳號 → 依通道 → 通道預設值 → 內建預設值。

### 每個旗標的作用

- `showOk`：當模型回傳僅 OK 的回覆時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型回傳非 OK 回覆時，傳送警示內容。
- `useIndicator`：為 UI 狀態介面發出指示器事件。

如果**三者**皆為 false，OpenClaw 會完全略過 Heartbeat 執行（不呼叫模型）。

### 依通道與依帳號範例

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
| 預設行為（靜默 OK、啟用警示）           | _(不需要設定)_                                                                           |
| 完全靜默（無訊息、無指示器）            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（無訊息）                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 只在一個通道顯示 OK                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（選用）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示會告訴代理讀取它。可以把它想成你的「Heartbeat 檢查清單」：小型、穩定，且可安全地每 30 分鐘納入一次。

在一般執行中，只有在預設代理啟用 Heartbeat 指引時，才會注入 `HEARTBEAT.md`。用 `0m` 停用 Heartbeat 節奏，或設定 `includeSystemPromptSection: false`，會將它從一般啟動情境中省略。

如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行和像 `# Heading` 這樣的 Markdown 標題），OpenClaw 會略過 Heartbeat 執行以節省 API 呼叫。該略過會回報為 `reason=empty-heartbeat-file`。如果檔案不存在，Heartbeat 仍會執行，並由模型決定要做什麼。

保持它精簡（簡短檢查清單或提醒），以避免提示膨脹。

`HEARTBEAT.md` 範例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援小型結構化 `tasks:` 區塊，用於 Heartbeat 本身內以間隔為基礎的檢查。

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
    - OpenClaw 會解析 `tasks:` 區塊，並根據每個任務自己的 `interval` 檢查它。
    - 只有**到期**任務會被納入該 tick 的 Heartbeat 提示。
    - 如果沒有任務到期，Heartbeat 會完全略過（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中的非任務內容會被保留，並作為額外情境附加在到期任務清單之後。
    - 任務上次執行時間戳記會儲存在工作階段狀態（`heartbeatTaskState`）中，因此間隔可在一般重新啟動後保留。
    - 任務時間戳記只會在 Heartbeat 執行完成其一般回覆路徑後才推進。被略過的 `empty-heartbeat-file` / `no-tasks-due` 執行不會將任務標記為已完成。

  </Accordion>
</AccordionGroup>

當你希望一個 Heartbeat 檔案保存多個週期性檢查，而不想每個 tick 都為所有檢查付費時，任務模式很有用。

### 代理可以更新 HEARTBEAT.md 嗎？

可以，前提是你要求它這麼做。

`HEARTBEAT.md` 只是代理工作區中的一般檔案，因此你可以在一般聊天中告訴代理，例如：

- 「更新 `HEARTBEAT.md`，加入每日行事曆檢查。」
- 「重寫 `HEARTBEAT.md`，讓它更短並聚焦在收件匣後續追蹤。」

如果你希望這件事主動發生，也可以在 Heartbeat 提示中加入明確的一行，例如：「如果檢查清單變得過時，請用更好的版本更新 HEARTBEAT.md。」

<Warning>
不要把祕密（API 金鑰、電話號碼、私人權杖）放進 `HEARTBEAT.md`，它會成為提示情境的一部分。
</Warning>

## 手動喚醒（隨選）

你可以使用以下命令將系統事件排入佇列，並觸發立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多個代理已設定 `heartbeat`，手動喚醒會立即執行每個這類代理的 Heartbeat。

使用 `--mode next-heartbeat` 等待下一個排程 tick。

## 推理傳送（選用）

預設情況下，Heartbeat 只會傳送最終的「答案」承載。

如果你想要透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，Heartbeat 也會傳送一則前綴為 `Reasoning:` 的獨立訊息（形狀與 `/reasoning on` 相同）。當代理管理多個工作階段/codex 時，且你想看它為什麼決定 ping 你，這會很有用；但它也可能洩漏比你想要更多的內部細節。建議在群組聊天中保持關閉。

## 成本意識

Heartbeat 會執行完整代理回合。較短的間隔會消耗更多權杖。若要降低成本：

- 使用 `isolatedSession: true`，避免傳送完整對話歷史（每次執行約從 ~100K 權杖降至 ~2-5K）。
- 使用 `lightContext: true`，將啟動檔案限制為只有 `HEARTBEAT.md`。
- 設定較便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 精簡。
- 如果你只想要內部狀態更新，請使用 `target: "none"`。

## Heartbeat 後的情境溢位

如果先前的 Heartbeat 讓現有工作階段停留在較小的本機模型上，例如具有 32k 視窗的 Ollama 模型，而下一個主工作階段回合回報情境溢位，請將工作階段執行階段模型重設回已設定的主要模型。當最後的執行階段模型符合已設定的 `heartbeat.model` 時，OpenClaw 的重設訊息會指出這點。

目前的 Heartbeat 會在執行完成後保留共用工作階段現有的執行階段模型。你仍可使用 `isolatedSession: true` 在全新工作階段中執行 Heartbeat，搭配 `lightContext: true` 取得最小提示，或選擇情境視窗足以容納共用工作階段的 Heartbeat 模型。

## 相關

- [自動化與任務](/zh-TW/automation) — 所有自動化機制一覽
- [背景任務](/zh-TW/automation/tasks) — 分離式工作的追蹤方式
- [時區](/zh-TW/concepts/timezone) — 時區如何影響 Heartbeat 排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) — 偵錯自動化問題
