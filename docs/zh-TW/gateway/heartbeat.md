---
read_when:
    - 調整心跳偵測頻率或訊息傳送
    - 為排程任務選擇心跳偵測或排程
sidebarTitle: Heartbeat
summary: 心跳偵測輪詢訊息與通知規則
title: 心跳偵測
x-i18n:
    generated_at: "2026-07-19T13:43:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84129f3660ca730698dcda2e8ddf04dce909d3e3a4a9823e886eab53be52f61a
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**心跳偵測還是排程？** 請參閱[自動化](/zh-TW/automation)，瞭解何時該使用哪一種。
</Note>

心跳偵測會在主要工作階段中執行**定期的代理程式回合**，讓模型能主動提出任何需要注意的事項，同時避免以大量訊息打擾你。

心跳偵測是排定的主要工作階段回合——它**不會**建立[背景任務](/zh-TW/automation/tasks)記錄。任務記錄適用於分離式工作（ACP 執行、子代理程式、隔離的排程工作）。

疑難排解：[排定的任務](/zh-TW/automation/cron-jobs#troubleshooting)

## 快速入門（初學者）

<Steps>
  <Step title="選擇執行頻率">
    保持啟用心跳偵測（預設為 `30m`；若已設定 Anthropic OAuth/權杖驗證，包括重複使用 Claude 命令列介面，則為 `1h`），或自行設定執行頻率。
  </Step>
  <Step title="新增 HEARTBEAT.md（選用）">
    在代理程式工作區中建立簡短的 `HEARTBEAT.md` 檢查清單或 `tasks:` 區塊。
  </Step>
  <Step title="決定心跳偵測訊息的傳送位置">
    預設為 `target: "none"`；設定 `target: "last"` 可路由至最近的聯絡對象。
  </Step>
  <Step title="選用調整">
    - 啟用心跳偵測推理傳送，以提升透明度。
    - 若心跳偵測執行僅需要 `HEARTBEAT.md`，請使用輕量啟動內容。
    - 啟用隔離工作階段，避免每次心跳偵測都傳送完整對話記錄。
    - 將心跳偵測限制在活躍時段（當地時間）。

  </Step>
</Steps>

設定範例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明確傳送至最近的聯絡對象（預設為 "none"）
        directPolicy: "allow", // 預設：允許直接訊息/私訊目標；設為 "block" 可停用
        lightContext: true, // 選用：僅從啟動檔案注入 HEARTBEAT.md
        isolatedSession: true, // 選用：每次執行皆使用全新工作階段（無對話記錄）
        skipWhenBusy: true, // 選用：此代理程式的子代理程式或巢狀通道忙碌時也延後
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 選用：另外傳送 `Thinking` 訊息
      },
    },
  },
}
```

## 預設值

- 間隔：`30m`。套用 Anthropic 提供者預設值時，若解析出的驗證模式為 OAuth/權杖（包括重複使用 Claude 命令列介面），會將其提高為 `1h`，但僅限未設定 `heartbeat.every` 時。設定 `agents.defaults.heartbeat.every` 或各代理程式的 `agents.list[].heartbeat.every`；使用 `0m` 可停用。
- 提示詞本文（可透過 `agents.defaults.heartbeat.prompt` 設定）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 逾時：未設定的心跳偵測回合會在已設定 `agents.defaults.timeoutSeconds` 時使用該值。否則會使用心跳偵測執行頻率，且上限為 600 秒。若心跳偵測工作需要更長時間，請設定 `agents.defaults.heartbeat.timeoutSeconds` 或各代理程式的 `agents.list[].heartbeat.timeoutSeconds`。
- 心跳偵測提示詞會**原封不動**地當作使用者訊息傳送。只有預設代理程式已啟用心跳偵測（且 `includeSystemPromptSection` 不是 `false`）時，系統提示詞才會包含「心跳偵測」區段，且該次執行會在內部加上標記。
- 使用 `0m` 停用心跳偵測時，一般執行也會從啟動內容中省略 `HEARTBEAT.md`，使模型不會看到僅適用於心跳偵測的指示。
- 系統會依照設定的時區檢查活躍時段（`heartbeat.activeHours`）。在時段之外，會略過心跳偵測，直到時段內的下一個排程點。
- 當排程工作正在執行或排隊等候時，心跳偵測會自動延後。設定 `heartbeat.skipWhenBusy: true`，也可在代理程式自身以工作階段鍵識別的子代理程式或巢狀命令通道執行時延後該代理程式；同層代理程式不會再因其他代理程式有子代理程式工作正在執行而暫停。

## 心跳偵測提示詞的用途

預設提示詞刻意保持廣泛：

- **背景任務**：「考量未完成的任務」會促使代理程式檢查待追蹤項目（收件匣、行事曆、提醒事項、排隊中的工作），並提出任何緊急事項。
- **關心使用者**：「白天偶爾關心你的使用者」會促使系統偶爾傳送簡短的「有什麼需要嗎？」訊息，但會使用你設定的當地時區來避免夜間傳送大量訊息（請參閱[時區](/zh-TW/concepts/timezone)）。

心跳偵測可以回應已完成的[背景任務](/zh-TW/automation/tasks)，但心跳偵測執行本身不會建立任務記錄。

若要讓心跳偵測執行非常特定的工作（例如「檢查 Gmail PubSub 統計資料」或「驗證閘道健康狀態」），請將 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）設為自訂本文（會原封不動地傳送）。

## 回應合約

- 若沒有需要注意的事項，請回覆 **`HEARTBEAT_OK`**。
- 心跳偵測執行也可以改為呼叫 `heartbeat_respond` 並搭配 `notify: false`，表示沒有可見的更新；或呼叫 `notify: true` 並搭配 `notificationText`，表示警示。若存在結構化工具回應，該回應的優先順序高於文字備援。
- 有意義且含有 `notify: false` 的 `heartbeat_respond` 結果會保持靜默，但會記錄為有界限的內部內容，以供該工作階段中的下一個使用者回合使用。`no_change` 確認與可見通知不會以這種方式儲存。
- 在心跳偵測執行期間，若 `HEARTBEAT_OK` 出現在回覆的**開頭或結尾**，OpenClaw 會將其視為確認。系統會移除該權杖；若剩餘內容為 **≤ `ackMaxChars`**（預設：300），則捨棄該回覆。
- 若 `HEARTBEAT_OK` 出現在回覆**中間**，則不會受到特殊處理。
- 針對警示，**請勿**包含 `HEARTBEAT_OK`；僅回傳警示文字。

在心跳偵測以外，訊息開頭或結尾多餘的 `HEARTBEAT_OK` 會被移除並記錄；若訊息只有 `HEARTBEAT_OK`，則會被捨棄。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 預設：30m（0m 會停用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 預設：false（可用時傳送獨立的 Thinking 訊息）
        lightContext: false, // 預設：false；true 會只保留工作區啟動檔案中的 HEARTBEAT.md
        isolatedSession: false, // 預設：false；true 會在全新工作階段中執行每次心跳偵測（無對話記錄）
        skipWhenBusy: false, // 預設：false；true 也會等待此代理程式的子代理程式/巢狀通道
        target: "last", // 預設：none | 選項：last | none | <channel id>（核心或外掛，例如 "imessage"）
        to: "+15551234567", // 選用的頻道特定覆寫
        accountId: "ops-bot", // 選用的多帳號頻道 ID
        prompt: "若 HEARTBEAT.md 存在（工作區內容），請讀取。嚴格遵循其中指示。請勿推斷或重複先前聊天中的舊任務。若沒有需要注意的事項，請回覆 HEARTBEAT_OK。",
        includeSystemPromptSection: true, // 預設：true；false 會省略預設代理程式的 ## Heartbeats 系統提示詞區段
        ackMaxChars: 300, // HEARTBEAT_OK 後允許的最大字元數
      },
    },
  },
}
```

### 範圍與優先順序

- `agents.defaults.heartbeat` 設定全域心跳偵測行為。
- `agents.list[].heartbeat` 會合併在其上；若任何代理程式具有 `heartbeat` 區塊，則**只有這些代理程式**會執行心跳偵測。
- `channels.defaults.heartbeat` 設定所有頻道的可見性預設值。
- `channels.<channel>.heartbeat` 會覆寫頻道預設值。
- `channels.<channel>.accounts.<id>.heartbeat`（多帳號頻道）會覆寫各頻道設定。

### 各代理程式的心跳偵測

若任何 `agents.list[]` 項目包含 `heartbeat` 區塊，則**只有這些代理程式**會執行心跳偵測。各代理程式的區塊會合併在 `agents.defaults.heartbeat` 之上（因此你可以只設定一次共用預設值，再依代理程式覆寫）。

範例：兩個代理程式中，只有第二個代理程式執行心跳偵測。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明確傳送至最近的聯絡對象（預設為 "none"）
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
          prompt: "若 HEARTBEAT.md 存在（工作區內容），請讀取。嚴格遵循其中指示。請勿推斷或重複先前聊天中的舊任務。若沒有需要注意的事項，請回覆 HEARTBEAT_OK。",
        },
      },
    ],
  },
}
```

### 活躍時段範例

將心跳偵測限制於特定時區的營業時間：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 明確傳送至最近的聯絡對象（預設為 "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 選用；若已設定 userTimezone 則使用該值，否則使用主機時區
        },
      },
    },
  },
}
```

在此時段以外（美東時間上午 9 點之前或晚上 10 點之後），會略過心跳偵測。時段內的下一個排程點將正常執行。

### 24/7 設定

若要讓心跳偵測全天執行，請使用下列其中一種模式：

- 完全省略 `activeHours`（無時段限制；這是預設行為）。
- 設定全天時段：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
請勿將 `start` 與 `end` 設為相同時間（例如從 `08:00` 到 `08:00`）。系統會將其視為寬度為零的時段，因此一律略過心跳偵測。
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
          to: "12345678:topic:42", // 選用：路由至特定主題/討論串
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
  心跳偵測間隔（持續時間字串；預設單位 = 分鐘）。
</ParamField>
<ParamField path="model" type="string">
  心跳偵測執行的選用模型覆寫（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  啟用時，若有可用內容，也會傳送獨立的 `Thinking` 訊息（格式與 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  設為 true 時，心跳偵測執行會使用輕量啟動內容，且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  設為 true 時，每次心跳偵測都會在全新工作階段中執行，不包含先前的對話記錄。使用與排程 `sessionTarget: "isolated"` 相同的隔離模式。可大幅降低每次心跳偵測的權杖成本。與 `lightContext: true` 搭配可節省最多成本。傳送路由仍會使用主要工作階段內容。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  設為 true 時，該代理程式的額外忙碌通道也會使心跳偵測執行延後：包括自身以工作階段鍵識別的子代理程式或巢狀命令工作。即使未設定此旗標，排程通道一律會延後心跳偵測，因此本機模型主機不會同時執行排程與心跳偵測提示詞。
</ParamField>
<ParamField path="session" type="string">
  心跳偵測執行的選用工作階段鍵。

- `main`（預設）：代理程式的主要工作階段。
- 明確的工作階段鍵（從 `openclaw sessions --json` 或[工作階段命令列介面](/zh-TW/cli/sessions)複製）。
- 工作階段鍵格式：請參閱[工作階段](/zh-TW/concepts/session)與[群組](/zh-TW/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：傳送至上次使用的外部頻道。
- 明確指定頻道：任何已設定的頻道或外掛 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（預設）：執行心跳偵測，但**不傳送**至外部。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接訊息／私訊的傳送行為。`allow`：允許傳送直接訊息／私訊心跳偵測。`block`：抑制直接訊息／私訊傳送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  選用的收件者覆寫值（頻道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。若為 Telegram 主題／討論串，請使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多帳號頻道的選用帳號 ID。當 `target: "last"` 時，如果解析出的上次使用頻道支援帳號，帳號 ID 會套用至該頻道；否則會忽略。如果帳號 ID 與解析出之頻道的任何已設定帳號皆不相符，則會略過傳送。

</ParamField>
<ParamField path="prompt" type="string">
  覆寫預設提示詞本文（不合併）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  是否注入預設代理程式的 `## Heartbeats` 系統提示詞區段。設為 `false` 可保留心跳偵測執行階段行為（頻率、傳送、HEARTBEAT.md），同時從代理程式系統提示詞中省略心跳偵測指示。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  傳送前，`HEARTBEAT_OK` 之後允許的字元數上限。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  設為 true 時，會在心跳偵測執行期間抑制工具錯誤警告承載內容。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  心跳偵測代理程式回合在中止前允許執行的最長秒數。若未設定，則在已設定 `agents.defaults.timeoutSeconds` 時使用該值，否則使用心跳偵測頻率，且上限為 600 秒。

</ParamField>
<ParamField path="activeHours" type="object">
  將心跳偵測執行限制在一個時間範圍內。此物件包含 `start`（HH:MM，含該時間；使用 `00:00` 表示一天開始）、`end`（HH:MM，不含該時間；允許使用 `24:00` 表示一天結束），以及選用的 `timezone`。

- 省略或 `"user"`：若已設定你的 `agents.defaults.userTimezone`，則使用該值，否則回退至主機系統時區。
- `"local"`：一律使用主機系統時區。
- 任何 IANA 識別碼（例如 `America/New_York`）：直接使用；若無效，則回退至上述 `"user"` 行為。
- 對於有效時間範圍，`start` 與 `end` 不得相等；相等的值會視為寬度為零（一律位於範圍之外）。
- 在有效時間範圍之外，會略過心跳偵測，直到下一次位於範圍內的週期點。

</ParamField>

## 傳送行為

<AccordionGroup>
  <Accordion title="工作階段與目標路由">
    - 心跳偵測預設在代理程式的主要工作階段中執行（`agent:<id>:<mainKey>`），或在 `session.scope = "global"` 時使用 `global`。設定 `session` 可覆寫為特定頻道工作階段（Discord／WhatsApp／等等）。
    - `session` 只影響執行內容；傳送則由 `target` 和 `to` 控制。
    - 若要傳送至特定頻道／收件者，請設定 `target` + `to`。使用 `target: "last"` 時，會傳送至該工作階段上次使用的外部頻道。
    - 心跳偵測傳送預設允許直接訊息／私訊目標。設定 `directPolicy: "block"` 可抑制傳送至直接目標，同時仍會執行心跳偵測回合。
    - 如果主要佇列、目標工作階段通道、排程通道或執行中的排程工作忙碌，則會略過心跳偵測並於稍後重試。
    - 如果 `skipWhenBusy: true`，此代理程式以工作階段為鍵的子代理程式及巢狀通道也會延後心跳偵測執行。其他代理程式的忙碌通道不會延後此代理程式。
    - 如果 `target` 未解析出任何外部目的地，仍會執行該回合，但不會傳送任何外寄訊息。

  </Accordion>
  <Accordion title="可見性與略過行為">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部停用，則一開始便會以 `reason=alerts-disabled` 略過該回合。
    - 如果只有警示傳送遭到停用，OpenClaw 仍可執行心跳偵測、更新到期工作的時間戳記、還原工作階段閒置時間戳記，並抑制對外警示承載內容。
    - 如果解析出的心跳偵測目標支援輸入狀態，OpenClaw 會在心跳偵測執行期間顯示輸入中。這會使用心跳偵測原本要傳送聊天輸出的相同目標，並可由 `typingMode: "never"` 停用。

  </Accordion>
  <Accordion title="工作階段生命週期與稽核">
    - 僅含心跳偵測的回覆**不會**讓工作階段保持作用中。心跳偵測中繼資料可能會更新工作階段資料列，但閒置到期時間使用上次真實使用者／頻道訊息的 `lastInteractionAt`，每日到期時間則使用 `sessionStartedAt`。
    - 控制介面和 WebChat 歷程會隱藏心跳偵測提示詞及僅含 OK 的確認。底層工作階段逐字記錄仍可保留這些回合，以供稽核／重播。
    - 分離的[背景工作](/zh-TW/automation/tasks)可將系統事件加入佇列，並在主要工作階段需要快速注意某件事時喚醒心跳偵測。該次喚醒不會使心跳偵測執行成為背景工作。

  </Accordion>
</AccordionGroup>

## 可見性控制

預設會抑制 `HEARTBEAT_OK` 確認，同時傳送警示內容。你可以依頻道或帳號調整此行為：

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

- `showOk`：當模型傳回僅含 OK 的回覆時，傳送 `HEARTBEAT_OK` 確認。
- `showAlerts`：當模型傳回非 OK 回覆時，傳送警示內容。
- `useIndicator`：為介面狀態表面發出指示器事件。

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

| 目標                                     | 設定                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 預設行為（靜默處理 OK、開啟警示） | _（不需要設定）_                                                                     |
| 完全靜默（無訊息、無指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 僅指示器（無訊息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 僅在一個頻道中顯示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（選用）

如果工作區中存在 `HEARTBEAT.md` 檔案，預設提示詞會要求代理程式讀取該檔案。可將它視為你的「心跳偵測檢查清單」：內容簡短、穩定，且適合每 30 分鐘考量一次。

在一般執行中，只有為預設代理程式啟用心跳偵測指引時，才會注入 `HEARTBEAT.md`。使用 `0m` 停用心跳偵測頻率，或設定 `includeSystemPromptSection: false`，會從一般啟動內容中省略該檔案。

在原生 Codex 控制框架中，`HEARTBEAT.md` 的內容不會像其他啟動檔案一樣注入回合。如果檔案存在且包含非空白內容，心跳偵測協作模式附註會將 Codex 指向該檔案，並要求它在繼續之前讀取檔案。

如果 `HEARTBEAT.md` 存在但實際上為空（只包含空白行、Markdown／HTML 註解、如 `# Heading` 的 Markdown 標題、程式碼圍欄標記或空白檢查清單項目），OpenClaw 會略過心跳偵測執行以節省 API 呼叫。該次略過會回報為 `reason=empty-heartbeat-file`。如果檔案不存在，心跳偵測仍會執行，並由模型決定要做什麼。

請保持內容精簡（簡短的檢查清單或提醒），以避免提示詞膨脹。

`HEARTBEAT.md` 範例：

```md
# 心跳偵測檢查清單

- 快速掃描：收件匣中有任何緊急事項嗎？
- 如果是白天，且沒有其他待處理事項，進行簡短的狀態確認。
- 如果工作受阻，記下_缺少的項目_，並在下次詢問 Peter。
```

### `tasks:` 區塊

`HEARTBEAT.md` 也支援小型結構化 `tasks:` 區塊，用於心跳偵測本身內依間隔執行的檢查。

範例：

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "檢查是否有緊急的未讀電子郵件，並標記任何有時效性的項目。"
- name: calendar-scan
  interval: 2h
  prompt: "檢查即將到來且需要準備或後續追蹤的會議。"

# 其他指示

- 保持警示簡短。
- 如果所有到期工作完成後沒有任何事項需要注意，請回覆 HEARTBEAT_OK。
```

<AccordionGroup>
  <Accordion title="行為">
    - OpenClaw 會剖析 `tasks:` 區塊，並依各工作的 `interval` 進行檢查。
    - 該週期點的心跳偵測提示詞只會包含**到期**工作。
    - 如果沒有工作到期，會完全略過心跳偵測（`reason=no-tasks-due`），以避免浪費模型呼叫。
    - `HEARTBEAT.md` 中的非工作內容會保留，並在到期工作清單之後附加為額外內容。
    - 工作上次執行時間戳記會儲存在工作階段狀態中（`heartbeatTaskState`），因此間隔設定可在一般重新啟動後保留。
    - 只有在心跳偵測執行完成一般回覆路徑後，才會推進工作時間戳記。略過的 `empty-heartbeat-file`／`no-tasks-due` 執行不會將工作標記為完成。

  </Accordion>
</AccordionGroup>

當你希望由一個心跳偵測檔案容納多個週期性檢查，又不想在每個週期點都為所有檢查付出成本時，工作模式很實用。

### 代理程式可以更新 HEARTBEAT.md 嗎？

可以，只要你要求它這麼做。

`HEARTBEAT.md` 只是代理程式工作區中的一般檔案，因此你可以在一般聊天中告訴代理程式，例如：

- 「更新 `HEARTBEAT.md`，加入每日行事曆檢查。」
- 「重寫 `HEARTBEAT.md`，使其更簡短並聚焦於收件匣後續追蹤。」

如果你希望主動進行此動作，也可以在心跳偵測提示詞中明確加入一行，例如：「如果檢查清單已過時，請更新 HEARTBEAT.md，改成更好的版本。」

<Warning>
請勿將祕密（API 金鑰、電話號碼、私人權杖）放入 `HEARTBEAT.md`，因為它會成為提示詞內容的一部分。
</Warning>

## 手動喚醒（隨選）

使用 `openclaw system event` 將系統事件加入佇列，並可選擇立即觸發心跳偵測：

```bash
openclaw system event --text "檢查是否有緊急的後續追蹤事項" --mode now
```

| 旗標                         | 說明                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | 系統事件文字（必填）。                                                                    |
| `--mode <mode>`              | `now` 會立即執行一次心跳偵測；`next-heartbeat`（預設值）會等待下一個排定的執行時點。 |
| `--session-key <sessionKey>` | 將事件指定給特定工作階段；預設為代理程式的主要工作階段。                   |
| `--json`                     | 輸出 JSON。                                                                                     |

如果未提供 `--session-key`，且有多個代理程式設定了 `heartbeat`，`--mode now` 會立即執行其中每個代理程式的心跳偵測。

同一命令列介面群組中的相關心跳偵測控制項：

```bash
openclaw system heartbeat last     # 顯示上一次心跳偵測事件
openclaw system heartbeat enable   # 啟用心跳偵測
openclaw system heartbeat disable  # 停用心跳偵測
```

## 推理傳送（選用）

依預設，心跳偵測只會傳送最終的「答案」承載內容。

若要提高透明度，請啟用：

- `agents.defaults.heartbeat.includeReasoning: true`

啟用後，心跳偵測也會傳送一則以 `Thinking` 為前綴的獨立訊息（格式與 `/reasoning on` 相同）。當代理程式管理多個工作階段／codex，且你想瞭解它為何決定通知你時，這項功能可能很有用，但也可能洩漏超出你預期的內部細節。在群組聊天中，建議維持停用。

## 成本考量

心跳偵測會執行完整的代理程式回合。間隔越短，消耗的權杖越多。若要降低成本：

- 使用 `isolatedSession: true`，避免傳送完整的對話歷程（每次執行約可從 100K 個權杖降至 2-5K 個）。
- 使用 `lightContext: true`，將啟動載入檔案限制為僅 `HEARTBEAT.md`。
- 設定成本較低的 `model`（例如 `ollama/llama3.2:1b`）。
- 讓 `HEARTBEAT.md` 保持精簡。
- 如果只需要更新內部狀態，請使用 `target: "none"`。

## 心跳偵測後的內容超出上限

心跳偵測執行完成後，會保留共用工作階段現有的執行階段模型，因此，如果心跳偵測將工作階段切換為較小的本機模型（例如內容視窗為 32k 的 Ollama 模型），下一個主要工作階段回合仍可能繼續使用該模型。如果該回合接著回報內容超出上限，且工作階段最近使用的執行階段模型與已設定的 `heartbeat.model` 相符，OpenClaw 的復原訊息會指出心跳偵測模型滲漏是可能的原因，並建議修正方式。

若要避免此問題：使用 `isolatedSession: true` 在新的工作階段中執行心跳偵測（也可搭配 `lightContext: true`，以使用最精簡的提示詞），或選擇內容視窗足以容納共用工作階段的心跳偵測模型。

## 相關內容

- [自動化](/zh-TW/automation) - 快速總覽所有自動化機制
- [背景工作](/zh-TW/automation/tasks) - 如何追蹤分離執行的工作
- [時區](/zh-TW/concepts/timezone) - 時區如何影響心跳偵測排程
- [疑難排解](/zh-TW/automation/cron-jobs#troubleshooting) - 偵錯自動化問題
