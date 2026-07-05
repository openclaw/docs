---
read_when:
    - 调整 Heartbeat 节奏或消息内容
    - 在为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Heartbeat
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-07-05T11:18:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 与 cron？** 请参阅 [自动化](/zh-CN/automation)，了解何时使用各自的指导。
</Note>

Heartbeat 会在主会话中运行**周期性智能体轮次**，让模型能够浮现需要注意的事项，同时避免向你发送垃圾信息。

Heartbeat 是一次计划的主会话轮次 - 它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于分离式工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排查：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="选择节奏">
    保持 Heartbeat 启用（默认是 `30m`；当配置了 Anthropic OAuth/令牌认证，包括复用 Claude CLI 时为 `1h`），或设置你自己的节奏。
  </Step>
  <Step title="添加 HEARTBEAT.md（可选）">
    在 Agent 工作区中创建一个很小的 `HEARTBEAT.md` 检查清单或 `tasks:` 块。
  </Step>
  <Step title="决定 Heartbeat 消息应发送到哪里">
    `target: "none"` 是默认值；设置 `target: "last"` 可路由到最近一次联系人。
  </Step>
  <Step title="可选调优">
    - 启用 Heartbeat 推理交付以提高透明度。
    - 如果 Heartbeat 运行只需要 `HEARTBEAT.md`，使用轻量级引导上下文。
    - 启用隔离会话，避免每次 Heartbeat 都发送完整对话历史。
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

- 间隔：`30m`。应用 Anthropic provider 默认值时，如果解析后的认证模式是 OAuth/令牌（包括复用 Claude CLI），会将其提升到 `1h`，但仅在 `heartbeat.every` 未设置时生效。设置 `agents.defaults.heartbeat.every` 或按 Agent 设置 `agents.list[].heartbeat.every`；使用 `0m` 禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 超时：未设置的 Heartbeat 轮次会在设置了 `agents.defaults.timeoutSeconds` 时使用该值。否则，它们使用 Heartbeat 节奏，并以 600 秒为上限。设置 `agents.defaults.heartbeat.timeoutSeconds` 或按 Agent 设置 `agents.list[].heartbeat.timeoutSeconds`，以支持更长的 Heartbeat 工作。
- Heartbeat 提示会作为用户消息**逐字**发送。只有当默认 Agent 启用了 Heartbeat（且 `includeSystemPromptSection` 不是 `false`）时，系统提示才包含 “Heartbeats” 部分，并且该运行会在内部标记。
- 当使用 `0m` 禁用 Heartbeat 时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，这样模型就不会看到仅供 Heartbeat 使用的指令。
- 活跃时段（`heartbeat.activeHours`）会在配置的时区中检查。在窗口外，Heartbeat 会跳过，直到窗口内的下一个 tick。
- 当 cron 工作处于活动或排队状态时，Heartbeat 会自动延后。设置 `heartbeat.skipWhenBusy: true` 后，如果某个 Agent 自己的按会话键区分的子智能体或嵌套命令 lane 正忙，也会延后该 Agent；兄弟 Agent 不再仅因为另一个 Agent 有子智能体工作正在进行就暂停。

## Heartbeat 提示的用途

默认提示有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会引导智能体查看后续事项（收件箱、日历、提醒、排队工作），并浮现任何紧急事项。
- **人工签到**：“Checkup sometimes on your human during day time” 会引导偶尔发送一条轻量级的“你有什么需要吗？”消息，但会使用你配置的本地时区来避免夜间垃圾信息（请参阅[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 Heartbeat 运行本身不会创建任务记录。

如果你希望 Heartbeat 执行非常具体的事项（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 健康”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

## 响应契约

- 如果没有需要注意的事项，请回复 **`HEARTBEAT_OK`**。
- Heartbeat 运行也可以改为调用 `heartbeat_respond`，使用 `notify: false` 表示没有可见更新，或使用 `notify: true` 加 `notificationText` 发送提醒。当存在结构化工具响应时，它优先于文本回退。
- 在 Heartbeat 运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为确认。该令牌会被剥离；如果剩余内容 **≤ `ackMaxChars`**（默认：300），回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，不会被特殊处理。
- 对于提醒，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在 Heartbeat 之外，消息开头/结尾处多余的 `HEARTBEAT_OK` 会被剥离并记录日志；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

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

### 范围和优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在其上合并；如果任何 Agent 有 `heartbeat` 块，**只有这些 Agent** 会运行 Heartbeat。
- `channels.defaults.heartbeat` 设置所有渠道的可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）覆盖按渠道设置。

### 按 Agent 配置的 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些 Agent** 会运行 Heartbeat。按 Agent 配置的块会合并到 `agents.defaults.heartbeat` 之上（因此你可以一次设置共享默认值，并按 Agent 覆盖）。

示例：两个 Agent，只有第二个 Agent 运行 Heartbeat。

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

将 Heartbeat 限制到特定时区的工作时间：

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

在此窗口外（美国东部时间上午 9 点前或晚上 10 点后），Heartbeat 会被跳过。窗口内的下一个计划 tick 会正常运行。

### 24/7 设置

如果你希望 Heartbeat 全天运行，请使用以下模式之一：

- 完全省略 `activeHours`（没有时间窗口限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将相同的 `start` 和 `end` 时间设为一样（例如从 `08:00` 到 `08:00`）。这会被视为零宽度窗口，因此 Heartbeat 总会被跳过。
</Warning>

### 多账号示例

使用 `accountId` 在 Telegram 等多账号渠道上定位特定账号：

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
  Heartbeat 间隔（持续时间字符串；默认单位 = 分钟）。
</ParamField>
<ParamField path="model" type="string">
  Heartbeat 运行的可选模型覆盖（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  启用后，在可用时还会交付单独的 `Thinking` 消息（形状与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，Heartbeat 运行会使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次 Heartbeat 都在全新会话中运行，不包含先前对话历史。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。会显著降低每次 Heartbeat 的 token 成本。与 `lightContext: true` 组合可最大化节省。交付路由仍使用主会话上下文。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  为 true 时，Heartbeat 运行会在该 Agent 的额外繁忙 lane 上延后：即它自己的按会话键区分的子智能体或嵌套命令工作。即使没有此标志，cron lane 也始终会延后 Heartbeat，因此本地模型主机不会同时运行 cron 和 Heartbeat 提示。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 运行的可选会话键。

- `main`（默认）：Agent 主会话。
- 显式会话键（从 `openclaw sessions --json` 或[会话 CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：交付到最近使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 Heartbeat，但**不向外部交付**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/私信交付行为。`allow`：允许直接/私信 Heartbeat 交付。`block`：抑制直接/私信交付（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选的接收方覆盖（渠道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram topic/thread，请使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账号渠道的可选账号 id。当 `target: "last"` 时，如果解析出的最后一个渠道支持账号，则账号 id 会应用到该渠道；否则会被忽略。如果账号 id 与解析出的渠道中已配置的账号不匹配，则跳过投递。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认 prompt 正文（不合并）。

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  是否注入默认智能体的 `## Heartbeats` system prompt section。设为 `false` 可保留 Heartbeat 运行时行为（节奏、投递、HEARTBEAT.md），同时从智能体 system prompt 中省略 Heartbeat 指令。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  投递前，`HEARTBEAT_OK` 之后允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，在 Heartbeat 运行期间抑制工具错误警告 payload。

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat 智能体轮次在被中止前允许的最长秒数。留空时，如果已设置则使用 `agents.defaults.timeoutSeconds`，否则使用 Heartbeat 节奏并上限为 600 秒。

</ParamField>
<ParamField path="activeHours" type="object">
  将 Heartbeat 运行限制在一个时间窗口内。对象包含 `start`（HH:MM，含起点；使用 `00:00` 表示一天开始）、`end`（HH:MM，不含终点；允许用 `24:00` 表示一天结束）以及可选的 `timezone`。

- 省略或为 `"user"`：如果已设置，则使用你的 `agents.defaults.userTimezone`，否则回退到主机系统时区。
- `"local"`：始终使用主机系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活动窗口，`start` 和 `end` 不得相等；相等值会被视为零宽度（始终在窗口外）。
- 在活动窗口外，Heartbeat 会被跳过，直到窗口内的下一个 tick。

</ParamField>

## 投递行为

<AccordionGroup>
  <Accordion title="会话和目标路由">
    - 默认情况下，Heartbeat 在智能体的主会话中运行（`agent:<id>:<mainKey>`），当 `session.scope = "global"` 时则在 `global` 中运行。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp/等）。
    - `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
    - 若要投递到特定渠道/接收方，请设置 `target` + `to`。使用 `target: "last"` 时，投递会使用该会话的最后一个外部渠道。
    - 默认情况下，Heartbeat 投递允许直接/私信目标。设置 `directPolicy: "block"` 可抑制发送到直接目标，同时仍运行 Heartbeat 轮次。
    - 如果主队列、目标会话 lane、cron lane 或活动的 cron job 正忙，则 Heartbeat 会被跳过并稍后重试。
    - 如果 `skipWhenBusy: true`，此智能体的按会话键划分的子智能体和嵌套 lane 也会延迟 Heartbeat 运行。其他智能体的忙碌 lane 不会延迟此智能体。
    - 如果 `target` 未解析出任何外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="可见性和跳过行为">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，运行会预先以 `reason=alerts-disabled` 跳过。
    - 如果仅禁用提醒投递，OpenClaw 仍可运行 Heartbeat、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外提醒 payload。
    - 如果解析出的 Heartbeat 目标支持 typing，OpenClaw 会在 Heartbeat 运行处于活动状态时显示 typing。这会使用 Heartbeat 原本用于发送聊天输出的同一目标，并可通过 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="会话生命周期和审计">
    - 仅 Heartbeat 的回复**不会**让会话保持活动状态。Heartbeat 元数据可能会更新会话行，但空闲过期使用上一条真实用户/渠道消息中的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - Control UI 和 WebChat 历史会隐藏 Heartbeat prompt 和仅 OK 的确认。底层会话 transcript 仍可包含这些轮次，用于审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以入队一个系统事件，并在主会话应快速注意到某事时唤醒 Heartbeat。该唤醒不会使 Heartbeat 运行成为后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而提醒内容会被投递。你可以按渠道或按账号调整：

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

- `showOk`：当模型返回仅 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送提醒内容。
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三个**都为 false，OpenClaw 会完全跳过 Heartbeat 运行（不会调用模型）。

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

| 目标                                     | 配置                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，开启提醒） | _(不需要配置)_                                                                           |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个渠道中显示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认 prompt 会告诉智能体读取它。可以把它视为你的“Heartbeat checklist”：小而稳定，并且适合每 30 分钟考虑一次。

在普通运行中，只有为默认智能体启用 Heartbeat guidance 时，才会注入 `HEARTBEAT.md`。用 `0m` 禁用 Heartbeat 节奏，或设置 `includeSystemPromptSection: false`，会从普通 bootstrap 上下文中省略它。

在原生 Codex harness 上，`HEARTBEAT.md` 内容不会像其他 bootstrap 文件一样注入轮次。如果文件存在且包含非空白内容，Heartbeat 协作模式 note 会将 Codex 指向该文件，并告诉它先读取文件再继续。

如果 `HEARTBEAT.md` 存在但实际为空（只有空行、Markdown/HTML 注释、像 `# Heading` 这样的 Markdown 标题、fence 标记，或空的 checklist stub），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件缺失，Heartbeat 仍会运行，并由模型决定要做什么。

保持它很小（简短 checklist 或提醒），以避免 prompt 膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于 Heartbeat 内部基于间隔的检查。

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
    - OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 检查该任务。
    - 只有**到期**任务会包含在该 tick 的 Heartbeat prompt 中。
    - 如果没有任务到期，Heartbeat 会被完全跳过（`reason=no-tasks-due`），以避免浪费一次模型调用。
    - `HEARTBEAT.md` 中的非任务内容会被保留，并作为额外上下文追加到到期任务列表之后。
    - 任务的上次运行时间戳会存储在会话状态（`heartbeatTaskState`）中，因此间隔会在普通重启后保留。
    - 只有在一次 Heartbeat 运行完成其普通回复路径后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望一个 Heartbeat 文件容纳多个周期性检查，而不想在每个 tick 都为所有检查付费时，任务模式很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以 - 如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，因此你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并聚焦于收件箱 follow-up。”

如果你希望这件事主动发生，也可以在 Heartbeat prompt 中包含一行明确指令，例如：“如果 checklist 过时，请用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把密钥（API key、电话号码、私有 token）放入 `HEARTBEAT.md` - 它会成为 prompt 上下文的一部分。
</Warning>

## 手动唤醒（按需）

使用 `openclaw system event` 入队一个系统事件，并可选择触发一次立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| 标志                         | 描述                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | 系统事件文本（必需）。                                                                           |
| `--mode <mode>`              | `now` 会立即运行 Heartbeat；`next-heartbeat`（默认）会等待下一个计划 tick。                     |
| `--session-key <sessionKey>` | 将事件定向到特定会话；默认是智能体的主会话。                                                     |
| `--json`                     | 输出 JSON。                                                                                      |

如果未提供 `--session-key`，且多个智能体配置了 `heartbeat`，则 `--mode now` 会立即运行这些智能体的每个 Heartbeat。

同一 CLI 组中的相关 Heartbeat 控制：

```bash
openclaw system heartbeat last     # show the last heartbeat event
openclaw system heartbeat enable   # enable heartbeats
openclaw system heartbeat disable  # disable heartbeats
```

## 推理投递（可选）

默认情况下，Heartbeat 只会递送最终的 “answer” 载荷。

如果你想要透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，Heartbeat 还会递送一条单独消息，前缀为 `Thinking`（形状与 `/reasoning on` 相同）。当智能体正在管理多个会话/Codex，并且你想了解它为什么决定 ping 你时，这会很有用，但它也可能泄露比你期望更多的内部细节。建议在群聊中保持关闭。

## 成本意识

Heartbeat 会运行完整的智能体轮次。间隔越短，消耗的 token 越多。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行从约 100K token 降到约 2-5K）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 简短。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## Heartbeat 后的上下文溢出

Heartbeat 会在运行完成后保留共享会话现有的运行时模型，因此，如果某次 Heartbeat 将会话切换到了更小的本地模型（例如上下文窗口为 32k 的 Ollama 模型），该模型可能会保留到下一次主会话轮次。如果下一次轮次随后报告上下文溢出，并且会话的最后运行时模型与配置的 `heartbeat.model` 匹配，OpenClaw 的恢复消息会指出 Heartbeat 模型泄漏是可能原因，并建议修复方式。

要避免这种情况：使用 `isolatedSession: true` 在全新会话中运行 Heartbeat（可选择结合 `lightContext: true` 以获得最小提示词），或选择上下文窗口足够容纳共享会话的 Heartbeat 模型。

## 相关

- [自动化](/zh-CN/automation) - 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) - 如何跟踪分离的工作
- [时区](/zh-CN/concepts/timezone) - 时区如何影响 Heartbeat 调度
- [故障排查](/zh-CN/automation/cron-jobs#troubleshooting) - 调试自动化问题
