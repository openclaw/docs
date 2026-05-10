---
read_when:
    - 调整 Heartbeat 频率或消息传递
    - 为定时任务在 Heartbeat 和 cron 之间做选择
sidebarTitle: Heartbeat
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:34:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 与 cron？** 请参阅 [自动化与任务](/zh-CN/automation)，了解何时使用各项功能。
</Note>

Heartbeat 会在主会话中运行**周期性智能体轮次**，让模型能够呈现任何需要注意的事项，同时不会向你刷屏。

Heartbeat 是一个定时的主会话轮次，它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于脱离主流程的工作（ACP 运行、子智能体、隔离的 cron 任务）。

故障排除：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="Pick a cadence">
    保持 Heartbeat 启用（默认是 `30m`，Anthropic OAuth/token 凭证模式下为 `1h`，包括 Claude CLI 复用），或设置你自己的节奏。
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    在智能体工作区中创建一个很小的 `HEARTBEAT.md` 清单或 `tasks:` 块。
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` 是默认值；设置 `target: "last"` 可路由到上一个联系人。
  </Step>
  <Step title="Optional tuning">
    - 启用 Heartbeat 推理递送以提高透明度。
    - 如果 Heartbeat 运行只需要 `HEARTBEAT.md`，请使用轻量级引导上下文。
    - 启用隔离会话，避免每次 Heartbeat 都发送完整对话历史。
    - 将 Heartbeat 限制在活跃时段（本地时间）内。

  </Step>
</Steps>

配置示例：

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

## 默认值

- 间隔：`30m`（检测到的凭证模式为 Anthropic OAuth/token 凭证时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示词会作为用户消息**逐字**发送。只有默认智能体启用 Heartbeat 时，系统提示词才会包含 “Heartbeat” 小节，并且该运行会在内部标记。
- 使用 `0m` 禁用 Heartbeat 时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，因此模型不会看到仅用于 Heartbeat 的指令。
- 活跃时段（`heartbeat.activeHours`）会在配置的时区中检查。在窗口外，Heartbeat 会跳过，直到窗口内的下一个 tick。
- 当 cron 工作处于活跃或排队状态时，Heartbeat 会自动延后。设置 `heartbeat.skipWhenBusy: true` 后，也会在额外繁忙的通道（子智能体或嵌套命令工作）上延后；这对本地 Ollama 和其他受限的单运行时主机很有用。

## Heartbeat 提示词的用途

默认提示词刻意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会提示智能体查看后续事项（收件箱、日历、提醒、排队工作），并呈现任何紧急事项。
- **人工确认**：“Checkup sometimes on your human during day time” 会提示偶尔发送轻量级的“有什么需要吗？”消息，但会使用你配置的本地时区来避免夜间刷屏（请参阅[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 Heartbeat 运行本身不会创建任务记录。

如果你希望 Heartbeat 执行非常具体的操作（例如 “check Gmail PubSub stats” 或 “verify gateway health”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

## 响应契约

- 如果没有需要注意的事项，请回复 **`HEARTBEAT_OK`**。
- 支持工具的 Heartbeat 运行也可以改为调用 `heartbeat_respond`，使用 `notify: false` 表示没有可见更新，或使用 `notify: true` 加 `notificationText` 发出提醒。存在结构化工具响应时，它优先于文本回退。
- 在 Heartbeat 运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为确认。该令牌会被剥离；如果剩余内容 **≤ `ackMaxChars`**（默认：300），回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，不会进行特殊处理。
- 对于提醒，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在 Heartbeat 之外，消息开头/结尾的零散 `HEARTBEAT_OK` 会被剥离并记录日志；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

## 配置

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

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在其上合并；如果任何智能体有 `heartbeat` 块，**只有这些智能体**会运行 Heartbeat。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）覆盖按渠道设置。

### 按智能体设置 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些智能体**会运行 Heartbeat。按智能体的块会合并到 `agents.defaults.heartbeat` 之上（因此你可以只设置一次共享默认值，并按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行 Heartbeat。

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

### 活跃时段示例

将 Heartbeat 限制在特定时区的工作时段内：

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

在此窗口之外（美东时间上午 9 点前或晚上 10 点后），Heartbeat 会被跳过。窗口内的下一个定时 tick 会正常运行。

### 24/7 设置

如果你希望 Heartbeat 全天运行，请使用以下模式之一：

- 完全省略 `activeHours`（没有时间窗口限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 时间设置为相同（例如从 `08:00` 到 `08:00`）。这会被视为零宽度窗口，因此 Heartbeat 始终会被跳过。
</Warning>

### 多账号示例

使用 `accountId` 将目标指向 Telegram 等多账号渠道上的特定账号：

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

### 字段说明

<ParamField path="every" type="string">
  Heartbeat 间隔（时长字符串；默认单位 = 分钟）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 运行的可选模型覆盖（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  启用后，当可用时也会递送单独的 `Reasoning:` 消息（形状与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，Heartbeat 运行会使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每个 Heartbeat 都会在没有先前对话历史的新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可显著降低每次 Heartbeat 的 token 成本。与 `lightContext: true` 结合使用可获得最大节省。递送路由仍使用主会话上下文。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  为 true 时，Heartbeat 运行会在额外繁忙的通道上延后：子智能体或嵌套命令工作。即使没有此标志，cron 通道也始终会延后 Heartbeat，因此本地模型主机不会同时运行 cron 和 Heartbeat 提示词。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（从 `openclaw sessions --json` 或[会话 CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：递送到上次使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 Heartbeat 但**不向外部递送**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/私信递送行为。`allow`：允许直接/私信 Heartbeat 递送。`block`：抑制直接/私信递送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选收件人覆盖（渠道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。对于 Telegram 话题/线程，请使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账号渠道的可选账号 ID。当 `target: "last"` 时，如果解析出的上一个渠道支持账号，则会应用该账号 ID；否则会忽略它。如果账号 ID 与解析出的渠道中已配置的账号不匹配，递送会被跳过。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认提示词正文（不合并）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  在 `HEARTBEAT_OK` 后、送达前允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。

</ParamField>
<ParamField path="activeHours" type="object">
  将 Heartbeat 运行限制在某个时间窗口内。对象包含 `start`（HH:MM，包含；一天开始用 `00:00`）、`end`（HH:MM，不包含；一天结束允许 `24:00`），以及可选的 `timezone`。

- 省略或 `"user"`：如果设置了你的 `agents.defaults.userTimezone`，则使用它；否则回退到宿主系统时区。
- `"local"`：始终使用宿主系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活动窗口，`start` 和 `end` 不能相等；相等值会被视为零宽度（始终在窗口外）。
- 在活动窗口外，Heartbeat 会被跳过，直到窗口内的下一个 tick。

</ParamField>

## 投递行为

<AccordionGroup>
  <Accordion title="会话和目标路由">
    - Heartbeat 默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），或在 `session.scope = "global"` 时使用 `global`。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp 等）。
    - `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
    - 要投递到特定渠道/接收者，请设置 `target` + `to`。使用 `target: "last"` 时，投递会使用该会话的最后一个外部渠道。
    - Heartbeat 投递默认允许直接/私信目标。设置 `directPolicy: "block"` 可在仍然运行 Heartbeat 轮次的同时抑制向直接目标发送。
    - 如果主队列、目标会话 lane、cron lane 或活动 cron 作业繁忙，Heartbeat 会被跳过并稍后重试。
    - 如果 `skipWhenBusy: true`，子智能体和嵌套 lane 也会推迟 Heartbeat 运行。
    - 如果 `target` 解析不到外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="可见性和跳过行为">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，运行会预先以 `reason=alerts-disabled` 跳过。
    - 如果只禁用了告警投递，OpenClaw 仍可以运行 Heartbeat、更新到期任务时间戳、恢复会话空闲时间戳，并抑制向外的告警载荷。
    - 如果解析出的 Heartbeat 目标支持正在输入状态，OpenClaw 会在 Heartbeat 运行期间显示正在输入。这会使用 Heartbeat 原本要发送聊天输出的同一个目标，并且会被 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="会话生命周期和审计">
    - 仅 Heartbeat 回复**不会**保持会话存活。Heartbeat 元数据可能会更新会话行，但空闲过期使用最后一条真实用户/渠道消息的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - 控制 UI 和 WebChat 历史记录会隐藏 Heartbeat 提示和仅 OK 确认。底层会话转录仍可能包含这些轮次，用于审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以将系统事件入队，并在主会话需要快速注意某事时唤醒 Heartbeat。该唤醒不会让 Heartbeat 运行后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，会抑制 `HEARTBEAT_OK` 确认，同时投递告警内容。你可以按渠道或按账号调整：

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

优先级：按账号 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅 OK 回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI 状态表面发出指示器事件。

如果**全部三个**都是 false，OpenClaw 会完全跳过 Heartbeat 运行（不调用模型）。

### 按渠道与按账号示例

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

### 常见模式

| 目标                                     | 配置                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，启用告警） | _(无需配置)_                                                                     |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 只在一个渠道中显示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会告诉智能体读取它。可以把它看作你的 “Heartbeat 检查清单”：简短、稳定，并且每 30 分钟包含一次也是安全的。

在正常运行中，只有为默认智能体启用 Heartbeat 指导时才会注入 `HEARTBEAT.md`。用 `0m` 禁用 Heartbeat 节奏，或设置 `includeSystemPromptSection: false`，会将它从正常引导上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和像 `# Heading` 这样的 Markdown 标题），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件缺失，Heartbeat 仍会运行，由模型决定要做什么。

保持它很小（简短检查清单或提醒），以避免提示膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在 Heartbeat 内部进行基于间隔的检查。

示例：

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
  <Accordion title="行为">
    - OpenClaw 解析 `tasks:` 块，并根据每个任务自己的 `interval` 检查该任务。
    - 只有**到期**任务会被包含在该 tick 的 Heartbeat 提示中。
    - 如果没有任务到期，Heartbeat 会被完全跳过（`reason=no-tasks-due`），以避免浪费模型调用。
    - `HEARTBEAT.md` 中的非任务内容会被保留，并作为附加上下文追加到到期任务列表之后。
    - 任务上次运行时间戳存储在会话状态（`heartbeatTaskState`）中，因此间隔可以跨正常重启保留。
    - 任务时间戳只会在 Heartbeat 运行完成其正常回复路径后推进。跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望一个 Heartbeat 文件保存多个周期性检查，同时不想每个 tick 都为所有检查付费时，任务模式很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以，如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，所以你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短并专注于收件箱跟进。”

如果你希望它主动发生，也可以在 Heartbeat 提示中包含一行显式说明，例如：“如果检查清单变得过时，请用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把密钥（API 密钥、电话号码、私有令牌）放入 `HEARTBEAT.md`，它会成为提示上下文的一部分。
</Warning>

## 手动唤醒（按需）

你可以用以下命令将系统事件入队并触发立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行其中每个智能体的 Heartbeat。

使用 `--mode next-heartbeat` 可等待下一次计划 tick。

## 推理投递（可选）

默认情况下，Heartbeat 只投递最终“答案”载荷。

如果你想要透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，Heartbeat 还会投递一条单独消息，前缀为 `Reasoning:`（形状与 `/reasoning on` 相同）。当智能体管理多个会话/codex，并且你想了解它为什么决定 ping 你时，这可能很有用，但它也可能泄露比你想要更多的内部细节。建议在群聊中保持关闭。

## 成本意识

Heartbeat 会运行完整智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true` 以避免发送完整对话历史（从约 100K token 降到每次运行约 2-5K）。
- 使用 `lightContext: true` 将引导文件限制为只有 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 小巧。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## Heartbeat 后的上下文溢出

如果某次 Heartbeat 之前把现有会话留在较小的本地模型上，例如具有 32k 窗口的 Ollama 模型，而下一个主会话轮次报告上下文溢出，请将会话运行时模型重置回配置的主模型。当最后一个运行时模型与配置的 `heartbeat.model` 匹配时，OpenClaw 的重置消息会明确指出这一点。

当前 Heartbeat 会在运行完成后保留共享会话的现有运行时模型。你仍可以使用 `isolatedSession: true` 在全新会话中运行 Heartbeat，将它与 `lightContext: true` 结合以获得最小提示，或选择上下文窗口足够容纳共享会话的 Heartbeat 模型。

## 相关

- [自动化和任务](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — 分离工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) — 时区如何影响 Heartbeat 调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 调试自动化问题
