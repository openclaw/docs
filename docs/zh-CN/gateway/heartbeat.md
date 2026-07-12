---
read_when:
    - 调整 Heartbeat 频率或消息传递
    - 为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Heartbeat
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-07-11T20:32:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 与 cron 如何选择？** 请参阅[自动化](/zh-CN/automation)，了解各自的适用场景。
</Note>

Heartbeat 会在主会话中运行**周期性智能体轮次**，使模型能够主动发现任何需要关注的事项，同时避免向你发送过多消息。

Heartbeat 是按计划运行的主会话轮次——它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于脱离主会话执行的工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排查：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="Pick a cadence">
    保持 Heartbeat 启用（默认为 `30m`；配置 Anthropic OAuth/令牌身份验证时为 `1h`，包括复用 Claude CLI），或设置你自己的运行频率。
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    在 Agent 工作区中创建一个简短的 `HEARTBEAT.md` 检查清单或 `tasks:` 块。
  </Step>
  <Step title="Decide where heartbeat messages should go">
    默认值为 `target: "none"`；设置 `target: "last"` 可将消息路由到最近的联系人。
  </Step>
  <Step title="Optional tuning">
    - 启用 Heartbeat 推理过程传递，以提高透明度。
    - 如果 Heartbeat 运行只需要 `HEARTBEAT.md`，请使用轻量级引导上下文。
    - 启用隔离会话，避免每次 Heartbeat 都发送完整的对话历史记录。
    - 将 Heartbeat 限制在活跃时段（本地时间）。

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`。应用 Anthropic 提供商默认值后，如果解析出的身份验证模式为 OAuth/令牌（包括复用 Claude CLI），间隔会增加到 `1h`，但仅在未设置 `heartbeat.every` 时生效。可设置 `agents.defaults.heartbeat.every` 或各智能体的 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示词正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 超时：未单独设置的 Heartbeat 轮次会在 `agents.defaults.timeoutSeconds` 已配置时使用该值。否则，它们使用 Heartbeat 运行间隔，但上限为 600 秒。若 Heartbeat 工作需要更长时间，请设置 `agents.defaults.heartbeat.timeoutSeconds` 或各智能体的 `agents.list[].heartbeat.timeoutSeconds`。
- Heartbeat 提示词会作为用户消息**原样**发送。仅当默认智能体启用了 Heartbeat（且 `includeSystemPromptSection` 不为 `false`）时，系统提示词才会包含“Heartbeats”部分，并且该运行会在内部进行标记。
- 使用 `0m` 禁用 Heartbeat 后，常规运行也会从引导上下文中省略 `HEARTBEAT.md`，使模型不会看到仅用于 Heartbeat 的指令。
- 活跃时段（`heartbeat.activeHours`）会按照配置的时区进行检查。在时间窗口之外，Heartbeat 会被跳过，直到窗口内的下一个周期。
- 当 cron 工作正在运行或排队时，Heartbeat 会自动延后。设置 `heartbeat.skipWhenBusy: true` 后，如果某个智能体自身基于会话键的子智能体或嵌套命令通道正忙，也会延后该智能体的 Heartbeat；其他同级智能体不会再仅仅因为另一个智能体正在执行子智能体工作而暂停。

## Heartbeat 提示词的用途

默认提示词有意保持宽泛：

- **后台任务**：“考虑尚未完成的任务”会促使智能体检查待办事项（收件箱、日历、提醒、排队的工作），并主动报告任何紧急事项。
- **主动关心用户**：“白天偶尔询问用户的情况”会促使智能体偶尔发送简短的“有什么需要吗？”消息，同时使用你配置的本地时区来避免在夜间频繁打扰（请参阅[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 Heartbeat 运行本身不会创建任务记录。

如果希望 Heartbeat 执行非常具体的操作（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 健康”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（将原样发送）。

## 响应约定

- 如果没有需要关注的事项，请回复 **`HEARTBEAT_OK`**。
- Heartbeat 运行也可以改为调用 `heartbeat_respond`：使用 `notify: false` 表示不提供可见更新，或使用 `notify: true` 并附带 `notificationText` 发出提醒。如果存在结构化工具响应，它的优先级高于文本回退响应。
- 在 Heartbeat 运行期间，如果 `HEARTBEAT_OK` 出现在回复的**开头或结尾**，OpenClaw 会将其视为确认。该令牌会被移除；如果剩余内容的长度**不超过 `ackMaxChars`**（默认值：300），整条回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会受到特殊处理。
- 对于提醒，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在 Heartbeat 之外，如果消息开头或结尾意外出现 `HEARTBEAT_OK`，它会被移除并记入日志；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

## 配置

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

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在此基础上合并；如果任何智能体包含 `heartbeat` 块，则**只有这些智能体**会运行 Heartbeat。
- `channels.defaults.heartbeat` 设置所有渠道的可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户渠道）覆盖各渠道设置。

### 各智能体的 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，则**只有这些智能体**会运行 Heartbeat。各智能体的配置块会在 `agents.defaults.heartbeat` 基础上合并（因此你可以统一设置共享默认值，并为各智能体覆盖这些值）。

示例：两个智能体中，只有第二个智能体运行 Heartbeat。

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

将 Heartbeat 限制在指定时区的工作时间内：

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

在此时间窗口之外（美国东部时间上午 9 点之前或晚上 10 点之后），Heartbeat 会被跳过。窗口内的下一个计划周期会正常运行。

### 全天候设置

如果希望 Heartbeat 全天运行，请使用以下任一方式：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天时间窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 设置为相同时间（例如从 `08:00` 到 `08:00`）。这会被视为宽度为零的时间窗口，因此 Heartbeat 始终会被跳过。
</Warning>

### 多账户示例

在 Telegram 等多账户渠道上，使用 `accountId` 指定特定账户：

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
  Heartbeat 间隔（持续时间字符串；默认单位为分钟）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 运行的可选模型覆盖值（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  启用后，在可用时还会传递单独的 `Thinking` 消息（格式与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，Heartbeat 运行会使用轻量级引导上下文，并且仅从工作区引导文件中保留 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次 Heartbeat 都会在没有先前对话历史记录的新会话中运行。它使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。这会大幅降低每次 Heartbeat 的令牌成本。与 `lightContext: true` 配合使用可最大程度节省成本。传递路由仍然使用主会话上下文。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  为 true 时，如果该智能体的额外繁忙通道正在工作，Heartbeat 运行会延后：包括其自身基于会话键的子智能体或嵌套命令工作。即使没有此标志，cron 通道也始终会延后 Heartbeat，因此本地模型主机不会同时运行 cron 和 Heartbeat 提示词。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（从 `openclaw sessions --json` 或[会话 CLI](/zh-CN/cli/sessions)复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：传递到最近使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 Heartbeat，但**不向外部传递**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接消息/私信的传递行为。`allow`：允许通过直接消息/私信传递 Heartbeat。`block`：禁止通过直接消息/私信传递（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选的收件人覆盖值（特定于渠道的 ID，例如 WhatsApp 使用 E.164，Telegram 使用聊天 ID）。对于 Telegram 话题/线程，请使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账户渠道的可选账户 ID。当 `target: "last"` 时，如果解析出的最后一个渠道支持账户，该账户 ID 将应用于该渠道；否则会被忽略。如果账户 ID 与解析出的渠道中已配置的账户不匹配，则跳过投递。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认提示词正文（不会合并）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  是否注入默认智能体系统提示词中的 `## Heartbeats` 部分。设为 `false` 可保留 Heartbeat 运行时行为（频率、投递、HEARTBEAT.md），同时从智能体系统提示词中省略 Heartbeat 指令。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  投递前，`HEARTBEAT_OK` 后允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat 智能体轮次在中止前允许运行的最大秒数。保持未设置时，如果已设置 `agents.defaults.timeoutSeconds`，则使用该值；否则使用 Heartbeat 频率，且上限为 600 秒。

</ParamField>
<ParamField path="activeHours" type="object">
  将 Heartbeat 运行限制在某个时间窗口内。对象包含 `start`（HH:MM，包含该时刻；使用 `00:00` 表示一天开始）、`end`（HH:MM，不包含该时刻；允许使用 `24:00` 表示一天结束）以及可选的 `timezone`。

- 省略或设为 `"user"`：如果已设置 `agents.defaults.userTimezone`，则使用该值；否则回退到主机系统时区。
- `"local"`：始终使用主机系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上述 `"user"` 行为。
- 对于有效时间窗口，`start` 和 `end` 不得相同；相同的值会被视为零宽度窗口（始终处于窗口外）。
- 在有效时间窗口之外，将跳过 Heartbeat，直到窗口内的下一个触发时刻。

</ParamField>

## 投递行为

<AccordionGroup>
  <Accordion title="会话和目标路由">
    - Heartbeat 默认在智能体的主会话中运行（`agent:<id>:<mainKey>`）；当 `session.scope = "global"` 时则在 `global` 中运行。设置 `session` 可覆盖为特定的渠道会话（Discord、WhatsApp 等）。
    - `session` 仅影响运行上下文；投递由 `target` 和 `to` 控制。
    - 要投递到特定渠道/收件人，请设置 `target` + `to`。使用 `target: "last"` 时，投递将使用该会话最后使用的外部渠道。
    - Heartbeat 投递默认允许直接目标/私信目标。设置 `directPolicy: "block"` 可抑制向直接目标发送消息，同时仍运行 Heartbeat 轮次。
    - 如果主队列、目标会话通道、cron 通道或某个正在运行的 cron 作业繁忙，则跳过 Heartbeat，并在稍后重试。
    - 如果设置 `skipWhenBusy: true`，该智能体按会话键区分的子智能体通道和嵌套通道也会推迟 Heartbeat 运行。其他智能体的繁忙通道不会推迟此智能体。
    - 如果 `target` 未解析到任何外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="可见性和跳过行为">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 均被禁用，则运行会预先以 `reason=alerts-disabled` 为由跳过。
    - 如果仅禁用了提醒投递，OpenClaw 仍可运行 Heartbeat、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外提醒载荷。
    - 如果解析出的 Heartbeat 目标支持输入状态，OpenClaw 会在 Heartbeat 运行期间显示正在输入。它使用 Heartbeat 原本会向其发送聊天输出的同一目标，并可通过 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="会话生命周期和审计">
    - 仅由 Heartbeat 产生的回复**不会**使会话保持活跃。Heartbeat 元数据可能会更新会话行，但空闲过期使用上次真实用户/渠道消息的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - Control UI 和 WebChat 历史记录会隐藏 Heartbeat 提示词和仅含 OK 的确认。底层会话记录仍可包含这些轮次，以供审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以将系统事件加入队列，并在主会话需要快速注意某件事时唤醒 Heartbeat。该唤醒操作不会使 Heartbeat 运行变成后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而提醒内容会正常投递。你可以按渠道或账户调整此行为：

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

优先级：按账户 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型仅返回 OK 回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送提醒内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三者全部**为 false，OpenClaw 将完全跳过 Heartbeat 运行（不会调用模型）。

### 按渠道与按账户示例

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

| 目标                                     | 配置                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默处理 OK，启用提醒） | _（无需配置）_                                                                     |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅使用指示器（无消息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个渠道中显示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会要求智能体读取该文件。可以将它视为你的“Heartbeat 检查清单”：内容简短、稳定，并且适合每 30 分钟检查一次。

在正常运行中，仅当默认智能体启用了 Heartbeat 指引时，才会注入 `HEARTBEAT.md`。使用 `0m` 禁用 Heartbeat 频率或设置 `includeSystemPromptSection: false`，会将其从正常的引导上下文中省略。

在原生 Codex harness 中，`HEARTBEAT.md` 的内容不会像其他引导文件那样注入轮次。如果该文件存在且包含非空白内容，Heartbeat 协作模式说明会将 Codex 指向该文件，并要求其在继续之前读取文件。

如果 `HEARTBEAT.md` 存在但实际上为空（仅包含空行、Markdown/HTML 注释、类似 `# Heading` 的 Markdown 标题、围栏标记或空的检查清单占位项），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件不存在，Heartbeat 仍会运行，由模型决定要执行的操作。

保持内容精简（简短的检查清单或提醒），以避免提示词膨胀。

`HEARTBEAT.md` 示例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在 Heartbeat 内执行基于时间间隔的检查。

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
    - OpenClaw 会解析 `tasks:` 块，并根据每项任务自己的 `interval` 检查任务。
    - 只有**到期**任务会包含在该次触发的 Heartbeat 提示词中。
    - 如果没有任务到期，则完全跳过 Heartbeat（`reason=no-tasks-due`），以避免浪费一次模型调用。
    - `HEARTBEAT.md` 中的非任务内容会保留，并在到期任务列表之后作为附加上下文追加。
    - 任务上次运行时间戳存储在会话状态（`heartbeatTaskState`）中，因此时间间隔状态可在正常重启后保留。
    - 只有 Heartbeat 运行完成正常回复流程后，任务时间戳才会向前更新。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望用一个 Heartbeat 文件保存多项定期检查，又不想在每次触发时为所有检查付出调用成本时，任务模式非常有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以——只要你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，因此你可以在正常聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，使其更简短，并专注于收件箱跟进事项。”

如果你希望主动执行此操作，也可以在 Heartbeat 提示词中包含明确的一行，例如：“如果检查清单已经过时，请用更好的内容更新 HEARTBEAT.md。”

<Warning>
不要将秘密信息（API 密钥、电话号码、私有令牌）放入 `HEARTBEAT.md`，因为它会成为提示词上下文的一部分。
</Warning>

## 手动唤醒（按需）

使用 `openclaw system event` 将系统事件加入队列，并可选择立即触发一次 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| 标志                         | 说明                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | 系统事件文本（必需）。                                                                    |
| `--mode <mode>`              | `now` 会立即运行一次 Heartbeat；`next-heartbeat`（默认）会等待下一个计划触发时刻。 |
| `--session-key <sessionKey>` | 将事件发送到特定会话；默认为智能体的主会话。                   |
| `--json`                     | 输出 JSON。                                                                                     |

如果未提供 `--session-key`，并且多个智能体配置了 `heartbeat`，则 `--mode now` 会立即运行其中每个智能体的 Heartbeat。

同一 CLI 组中的相关 Heartbeat 控制命令：

```bash
openclaw system heartbeat last     # show the last heartbeat event
openclaw system heartbeat enable   # enable heartbeats
openclaw system heartbeat disable  # disable heartbeats
```

## 推理投递（可选）

默认情况下，Heartbeat 仅传送最终的“回答”载荷。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，Heartbeat 还会传送一条单独的消息，并以 `Thinking` 为前缀（格式与 `/reasoning on` 相同）。当智能体管理多个会话或 Codex 实例，而你想了解它为何决定向你发送提醒时，这会很有用；但它也可能泄露超出你预期的内部细节。在群聊中，建议保持关闭。

## 成本考量

Heartbeat 会运行完整的智能体轮次。间隔越短，消耗的 token 越多。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整的对话历史记录（每次运行的 token 数可从约 10 万降至约 2,000–5,000）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置成本更低的 `model`（例如 `ollama/llama3.2:1b`）。
- 尽量精简 `HEARTBEAT.md`。
- 如果只需要内部状态更新，请使用 `target: "none"`。

## Heartbeat 后上下文溢出

Heartbeat 运行完成后，会保留共享会话中现有的运行时模型。因此，如果某次 Heartbeat 将会话切换到上下文窗口较小的本地模型（例如上下文窗口为 32k 的 Ollama 模型），该模型可能会继续用于主会话的下一轮对话。如果下一轮随后报告上下文溢出，并且会话上次使用的运行时模型与配置的 `heartbeat.model` 相同，OpenClaw 的恢复消息会指出 Heartbeat 模型残留很可能是原因，并建议修复方法。

要避免此问题：使用 `isolatedSession: true` 在新会话中运行 Heartbeat（还可搭配 `lightContext: true`，以获得最精简的提示词），或者选择上下文窗口足以容纳共享会话的 Heartbeat 模型。

## 相关内容

- [自动化](/zh-CN/automation) - 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) - 如何跟踪分离运行的工作
- [时区](/zh-CN/concepts/timezone) - 时区如何影响 Heartbeat 调度
- [故障排查](/zh-CN/automation/cron-jobs#troubleshooting) - 调试自动化问题
