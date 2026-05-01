---
read_when:
    - 调整 Heartbeat 频率或消息文案
    - 为定时任务在 Heartbeat 和 cron 之间做选择
sidebarTitle: Heartbeat
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-05-01T18:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 与 cron？** 请参阅 [自动化与任务](/zh-CN/automation)，了解何时使用二者。
</Note>

Heartbeat 会在主会话中运行**周期性智能体轮次**，让模型能够显示需要关注的事项，而不会向你发送垃圾信息。

Heartbeat 是一次定时的主会话轮次——它**不会**创建 [后台任务](/zh-CN/automation/tasks)记录。任务记录用于脱离当前会话的工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="选择频率">
    保持 Heartbeat 启用（默认是 `30m`，如果使用 Anthropic OAuth/token 凭证，包括复用 Claude CLI，则为 `1h`），或设置你自己的频率。
  </Step>
  <Step title="添加 HEARTBEAT.md（可选）">
    在 Agent 工作区中创建一个很小的 `HEARTBEAT.md` 检查清单或 `tasks:` 块。
  </Step>
  <Step title="决定 Heartbeat 消息应发送到哪里">
    `target: "none"` 是默认值；设置 `target: "last"` 可路由到上次联系对象。
  </Step>
  <Step title="可选调优">
    - 启用 Heartbeat 推理投递以提高透明度。
    - 如果 Heartbeat 运行只需要 `HEARTBEAT.md`，使用轻量级引导上下文。
    - 启用隔离会话，避免每次 Heartbeat 都发送完整对话历史。
    - 将 Heartbeat 限制在活跃时段内（本地时间）。

  </Step>
</Steps>

示例配置：

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

- 间隔：`30m`（当检测到 Anthropic OAuth/token 凭证模式时为 `1h`，包括复用 Claude CLI）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat 提示会作为用户消息**逐字**发送。只有当默认智能体启用了 Heartbeat 时，系统提示才会包含 “Heartbeat” 部分，并且本次运行会在内部标记。
- 使用 `0m` 禁用 Heartbeat 时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，因此模型不会看到仅用于 Heartbeat 的指令。
- 活跃时段（`heartbeat.activeHours`）会在配置的时区中检查。在时间窗口外，Heartbeat 会被跳过，直到窗口内的下一次 tick。
- 当 cron 工作处于活跃或排队状态时，Heartbeat 会自动推迟。设置 `heartbeat.skipWhenBusy: true` 后，在额外繁忙的通道（子智能体或嵌套命令工作）上也会推迟；这对本地 Ollama 和其他受限的单运行时主机很有用。

## Heartbeat 提示的用途

默认提示有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会提示智能体检查后续事项（收件箱、日历、提醒、排队工作），并显示任何紧急事项。
- **人工签到**：“Checkup sometimes on your human during day time” 会提示偶尔发送轻量级的“你有什么需要吗？”消息，但会使用你配置的本地时区避免夜间打扰（请参阅[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 Heartbeat 运行本身不会创建任务记录。

如果你希望 Heartbeat 执行非常具体的操作（例如“检查 Gmail PubSub 统计数据”或“验证 Gateway 网关健康状态”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

## 响应契约

- 如果没有需要关注的事项，请回复 **`HEARTBEAT_OK`**。
- 支持工具的 Heartbeat 运行也可以调用 `heartbeat_respond`，在没有可见更新时使用 `notify: false`，或在需要提醒时使用 `notify: true` 加 `notificationText`。如果存在结构化工具响应，它优先于文本回退。
- 在 Heartbeat 运行期间，如果 `HEARTBEAT_OK` 出现在回复的**开头或结尾**，OpenClaw 会将其视为确认。该 token 会被剥离；如果剩余内容 **≤ `ackMaxChars`**（默认值：300），该回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复**中间**，不会进行特殊处理。
- 对于提醒，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在 Heartbeat 之外，消息开头/结尾散落的 `HEARTBEAT_OK` 会被剥离并记录；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### 作用域与优先级

- `agents.defaults.heartbeat` 设置全局 Heartbeat 行为。
- `agents.list[].heartbeat` 在其上合并；如果任何智能体有 `heartbeat` 块，**只有这些智能体**会运行 Heartbeat。
- `channels.defaults.heartbeat` 设置所有渠道的可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）覆盖按渠道的设置。

### 按智能体设置 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些智能体**会运行 Heartbeat。按智能体的块会合并到 `agents.defaults.heartbeat` 之上（因此你可以一次设置共享默认值，并按智能体覆盖）。

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

将 Heartbeat 限制在特定时区的工作时间内：

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

在此窗口之外（东部时间早上 9 点前或晚上 10 点后），Heartbeat 会被跳过。窗口内的下一次计划 tick 会正常运行。

### 24/7 设置

如果你希望 Heartbeat 全天运行，请使用以下模式之一：

- 完全省略 `activeHours`（无时间窗口限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 设为同一时间（例如从 `08:00` 到 `08:00`）。这会被视为零宽度窗口，因此 Heartbeat 始终会被跳过。
</Warning>

### 多账号示例

使用 `accountId` 定位到 Telegram 等多账号渠道上的特定账号：

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
  启用后，在可用时也会投递单独的 `Reasoning:` 消息（形状与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，Heartbeat 运行使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次 Heartbeat 都会在没有先前对话历史的新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。会显著降低每次 Heartbeat 的 token 成本。与 `lightContext: true` 结合使用可最大化节省。投递路由仍使用主会话上下文。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  为 true 时，Heartbeat 运行会在额外繁忙的通道上推迟：子智能体或嵌套命令工作。即使没有此标志，cron 通道也始终会推迟 Heartbeat，因此本地模型主机不会同时运行 cron 和 Heartbeat 提示。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（从 `openclaw sessions --json` 或[会话 CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：投递到上次使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 Heartbeat，但**不向外部投递**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/私信投递行为。`allow`：允许直接/私信 Heartbeat 投递。`block`：抑制直接/私信投递（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选收件人覆盖（渠道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram topic/thread，使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账号渠道的可选账号 id。当 `target: "last"` 时，如果解析出的上次渠道支持账号，该账号 id 会应用于该渠道；否则会被忽略。如果账号 id 与解析出的渠道中已配置的账号不匹配，投递会被跳过。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认提示正文（不合并）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  `HEARTBEAT_OK` 之后、交付之前允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。

</ParamField>
<ParamField path="activeHours" type="object">
  将 Heartbeat 运行限制在一个时间窗口内。对象包含 `start`（HH:MM，包含；使用 `00:00` 表示一天开始）、`end`（HH:MM，不包含；允许 `24:00` 表示一天结束），以及可选的 `timezone`。

- 省略或 `"user"`：如果设置了你的 `agents.defaults.userTimezone`，则使用它，否则回退到宿主系统时区。
- `"local"`：始终使用宿主系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活动窗口，`start` 和 `end` 不能相等；相等的值会被视为零宽度窗口（始终在窗口外）。
- 在活动窗口外，Heartbeat 会被跳过，直到窗口内的下一个 tick。

</ParamField>

## 交付行为

<AccordionGroup>
  <Accordion title="Session and target routing">
    - 默认情况下，Heartbeat 在智能体的主会话中运行（`agent:<id>:<mainKey>`），或者当 `session.scope = "global"` 时在 `global` 中运行。设置 `session` 可覆盖到特定渠道会话（Discord/WhatsApp 等）。
    - `session` 只影响运行上下文；交付由 `target` 和 `to` 控制。
    - 要交付给特定渠道/接收者，请设置 `target` + `to`。使用 `target: "last"` 时，交付会使用该会话最后一个外部渠道。
    - Heartbeat 交付默认允许直接/私信目标。设置 `directPolicy: "block"` 可在仍然运行 Heartbeat 回合的同时抑制直接目标发送。
    - 如果主队列、目标会话 lane、cron lane 或活动 cron 作业正忙，Heartbeat 会被跳过并稍后重试。
    - 如果 `skipWhenBusy: true`，子智能体和嵌套 lane 也会延后 Heartbeat 运行。
    - 如果 `target` 未解析到外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，运行会预先以 `reason=alerts-disabled` 跳过。
    - 如果只禁用了告警交付，OpenClaw 仍可运行 Heartbeat、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外告警载荷。
    - 如果解析出的 Heartbeat 目标支持正在输入状态，OpenClaw 会在 Heartbeat 运行处于活动状态时显示正在输入。这会使用 Heartbeat 原本会向其发送聊天输出的同一目标，并且会被 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - 仅 Heartbeat 的回复**不会**让会话保持存活。Heartbeat 元数据可能会更新会话行，但空闲过期使用最后一条真实用户/渠道消息的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - Control UI 和 WebChat 历史会隐藏 Heartbeat 提示词和仅 OK 的确认。底层会话 transcript 仍可包含这些回合，用于审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以将系统事件入队，并在主会话应快速注意到某事时唤醒 Heartbeat。该唤醒不会让 Heartbeat 运行后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而告警内容会被交付。你可以按渠道或按账户调整：

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

- `showOk`：当模型返回仅 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI Status 表面发出指示器事件。

如果**全部三个**都是 false，OpenClaw 会完全跳过 Heartbeat 运行（不会调用模型）。

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
| 默认行为（静默 OK，告警开启）            | _(无需配置)_                                                                             |
| 完全静默（无消息，无指示器）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）                       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个渠道中显示 OK                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会告诉智能体读取它。你可以把它看作你的“Heartbeat 检查清单”：小巧、稳定，并且适合每 30 分钟纳入一次。

在正常运行中，只有当默认智能体启用了 Heartbeat 指导时，才会注入 `HEARTBEAT.md`。使用 `0m` 禁用 Heartbeat 节奏，或设置 `includeSystemPromptSection: false`，会将它从正常 bootstrap 上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和像 `# Heading` 这样的 Markdown 标题），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件缺失，Heartbeat 仍会运行，由模型决定要做什么。

保持它很小（简短检查清单或提醒），以避免提示词膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在 Heartbeat 内部执行基于间隔的检查。

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
  <Accordion title="Behavior">
    - OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 检查它。
    - 只有**到期**任务会被包含在该 tick 的 Heartbeat 提示词中。
    - 如果没有任务到期，Heartbeat 会被完全跳过（`reason=no-tasks-due`），以避免浪费一次模型调用。
    - `HEARTBEAT.md` 中的非任务内容会被保留，并作为额外上下文附加在到期任务列表之后。
    - 任务上次运行时间戳会存储在会话状态（`heartbeatTaskState`）中，因此间隔能在正常重启后保留。
    - 任务时间戳只会在 Heartbeat 运行完成其正常回复路径后推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望一个 Heartbeat 文件承载多个周期性检查，而不是每个 tick 都为全部检查付费时，任务模式很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以，只要你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，因此你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短并聚焦于收件箱跟进。”

如果你希望这主动发生，也可以在 Heartbeat 提示词中包含一行明确指令，例如：“如果检查清单变得过时，请用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把秘密（API key、电话号码、私有 token）放入 `HEARTBEAT.md`，它会成为提示词上下文的一部分。
</Warning>

## 手动唤醒（按需）

你可以用以下命令将系统事件入队并触发立即 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行这些智能体的每个 Heartbeat。

使用 `--mode next-heartbeat` 等待下一个计划 tick。

## Reasoning 交付（可选）

默认情况下，Heartbeat 只交付最终“answer”载荷。

如果你需要透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，Heartbeat 还会交付一条单独消息，前缀为 `Reasoning:`（形状与 `/reasoning on` 相同）。当智能体管理多个会话/codexes，而你想看到它为何决定 ping 你时，这会很有用，但它也可能泄露比你想要更多的内部细节。建议在群聊中保持关闭。

## 成本意识

Heartbeat 会运行完整的智能体回合。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行从约 100K token 降至约 2-5K）。
- 使用 `lightContext: true`，将 bootstrap 文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 小巧。
- 如果你只想要内部状态更新，请使用 `target: "none"`。

## Heartbeat 后的上下文溢出

如果 Heartbeat 使用较小的本地模型，例如上下文窗口为 32k 的 Ollama 模型，并且下一个主会话回合报告上下文溢出，请检查上一次 Heartbeat 是否让会话停留在 Heartbeat 模型上。当最后一个运行时模型与配置的 `heartbeat.model` 匹配时，OpenClaw 的重置消息会指出这一点。

使用 `isolatedSession: true` 在新会话中运行 Heartbeat，将它与 `lightContext: true` 结合以获得最小提示词，或者选择上下文窗口足够容纳共享会话的 Heartbeat 模型。

## 相关

- [自动化和任务](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — 分离工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) — 时区如何影响 Heartbeat 调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 调试自动化问题
