---
read_when:
    - 调整 Heartbeat 节奏或消息内容
    - 为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Heartbeat
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T15:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 和 cron？** 请参阅 [自动化与任务](/zh-CN/automation)，了解何时使用二者。
</Note>

Heartbeat 会在主会话中运行**周期性的智能体轮次**，让模型可以提示任何需要注意的事项，而不会向你发送大量消息。

Heartbeat 是一次计划的主会话轮次，它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于脱离主流程的工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="选择节奏">
    保持 heartbeat 启用（默认是 `30m`，Anthropic OAuth/token auth 时为 `1h`，包括 Claude CLI 复用），或设置你自己的节奏。
  </Step>
  <Step title="添加 HEARTBEAT.md（可选）">
    在 Agent 工作区中创建一个小型 `HEARTBEAT.md` 清单或 `tasks:` 块。
  </Step>
  <Step title="决定 heartbeat 消息应发送到哪里">
    `target: "none"` 是默认值；设置 `target: "last"` 可路由到最近的联系人。
  </Step>
  <Step title="可选调优">
    - 启用 heartbeat 推理传递以提高透明度。
    - 如果 heartbeat 运行只需要 `HEARTBEAT.md`，使用轻量级 bootstrap 上下文。
    - 启用隔离会话，以避免每次 heartbeat 都发送完整对话历史。
    - 将 heartbeat 限制在活跃时段（本地时间）。

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

- 间隔：`30m`（当检测到的 auth 模式为 Anthropic OAuth/token auth 时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或每个智能体的 `agents.list[].heartbeat.every`；使用 `0m` 禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat 提示会作为用户消息**逐字**发送。只有当默认智能体启用了 heartbeat 时，系统提示才会包含 “Heartbeat” 部分，并且该运行会在内部标记。
- 当使用 `0m` 禁用 heartbeat 时，普通运行也会从 bootstrap 上下文中省略 `HEARTBEAT.md`，因此模型不会看到仅用于 heartbeat 的指令。
- 活跃时段（`heartbeat.activeHours`）会按配置的时区检查。在窗口外，heartbeat 会被跳过，直到窗口内的下一个 tick。
- 当 cron 工作处于活动或排队状态时，heartbeat 会自动延后。设置 `heartbeat.skipWhenBusy: true`，还会在额外繁忙的通道（子智能体或嵌套命令工作）上延后；这对本地 Ollama 和其他受限的单运行时主机很有用。

## heartbeat 提示的用途

默认提示有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会提示智能体审查跟进事项（收件箱、日历、提醒、排队工作），并提示任何紧急事项。
- **与人类确认**：“Checkup sometimes on your human during day time” 会提示偶尔发送轻量的“anything you need?”消息，但会使用你配置的本地时区来避免夜间打扰（参见[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 heartbeat 运行本身不会创建任务记录。

如果你希望 heartbeat 执行非常具体的事项（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 网关健康状况”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

## 响应契约

- 如果没有需要注意的事项，回复 **`HEARTBEAT_OK`**。
- 支持工具的 heartbeat 运行也可以调用 `heartbeat_respond`，使用 `notify: false` 表示没有可见更新，或使用 `notify: true` 加 `notificationText` 发送提醒。存在结构化工具响应时，它优先于文本回退。
- 在 heartbeat 运行期间，如果 `HEARTBEAT_OK` 出现在回复的**开头或结尾**，OpenClaw 会将其视为确认。该 token 会被移除；如果剩余内容**≤ `ackMaxChars`**（默认：300），回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复**中间**，不会被特殊处理。
- 对于提醒，**不要**包含 `HEARTBEAT_OK`；只返回提醒文本。

在 heartbeat 之外，消息开头/结尾出现的游离 `HEARTBEAT_OK` 会被移除并记录；只有 `HEARTBEAT_OK` 的消息会被丢弃。

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

### 范围和优先级

- `agents.defaults.heartbeat` 设置全局 heartbeat 行为。
- `agents.list[].heartbeat` 在其上合并；如果任何智能体有 `heartbeat` 块，**只有这些智能体**会运行 heartbeat。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）覆盖每个渠道的设置。

### 每智能体 Heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些智能体**会运行 Heartbeat。每智能体块会合并到 `agents.defaults.heartbeat` 之上（因此你可以只设置一次共享默认值，并按智能体覆盖）。

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

在此时间窗口之外（美国东部时间上午 9 点之前或晚上 10 点之后），会跳过 Heartbeat。窗口内的下一次计划触发会正常运行。

### 全天候设置

如果你希望 Heartbeat 全天运行，请使用以下模式之一：

- 完全省略 `activeHours`（无时间窗口限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 时间设置为相同（例如从 `08:00` 到 `08:00`）。这会被视为零宽窗口，因此 Heartbeat 总是会被跳过。
</Warning>

### 多账号示例

使用 `accountId` 在 Telegram 等多账号渠道中定位特定账号：

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
  启用后，在可用时也会发送单独的 `Reasoning:` 消息（形状与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，Heartbeat 运行会使用轻量级启动上下文，并且只保留工作区启动文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次 Heartbeat 都会在一个没有先前对话历史的全新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可大幅降低每次 Heartbeat 的 token 成本。与 `lightContext: true` 结合使用可获得最大节省。递送路由仍使用主会话上下文。
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  为 true 时，Heartbeat 运行会在额外繁忙的执行通道上延后：子智能体或嵌套命令工作。cron 执行通道始终会延后 Heartbeat，即使没有此标志也是如此，因此本地模型主机不会同时运行 cron 和 Heartbeat prompt。
</ParamField>
<ParamField path="session" type="string">
  Heartbeat 运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（从 `openclaw sessions --json` 或 [会话 CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：递送到上次使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 Heartbeat，但**不向外部递送**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/私信递送行为。`allow`：允许直接/私信 Heartbeat 递送。`block`：禁止直接/私信递送（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选的接收者覆盖（特定于渠道的 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。对于 Telegram 主题/线程，使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账户渠道的可选账户 ID。当 `target: "last"` 时，如果解析出的上次渠道支持账户，则账户 ID 会应用于该渠道；否则会被忽略。如果账户 ID 与解析出的渠道中已配置的账户不匹配，则会跳过递送。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认提示词正文（不合并）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  `HEARTBEAT_OK` 后、递送前允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。

</ParamField>
<ParamField path="activeHours" type="object">
  将 Heartbeat 运行限制在一个时间窗口内。对象包含 `start`（HH:MM，含起点；使用 `00:00` 表示一天开始）、`end`（HH:MM，不含终点；允许 `24:00` 表示一天结束），以及可选的 `timezone`。

- 省略或 `"user"`：如果已设置，则使用你的 `agents.defaults.userTimezone`，否则回退到主机系统时区。
- `"local"`：始终使用主机系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活跃窗口，`start` 和 `end` 不能相等；相等的值会被视为零宽度（始终在窗口外）。
- 在活跃窗口之外，Heartbeat 会被跳过，直到窗口内的下一个 tick。

</ParamField>

## 递送行为

<AccordionGroup>
  <Accordion title="会话和目标路由">
    - Heartbeat 默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），或者当 `session.scope = "global"` 时在 `global` 中运行。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp 等）。
    - `session` 只影响运行上下文；递送由 `target` 和 `to` 控制。
    - 要递送到特定渠道/接收者，请设置 `target` + `to`。使用 `target: "last"` 时，递送会使用该会话的最后一个外部渠道。
    - Heartbeat 递送默认允许直接目标/私信目标。设置 `directPolicy: "block"` 可抑制直接目标发送，同时仍然运行 Heartbeat 回合。
    - 如果主队列、目标会话 lane、cron lane 或活跃 cron 作业正忙，Heartbeat 会被跳过并稍后重试。
    - 如果 `skipWhenBusy: true`，子智能体和嵌套 lane 也会推迟 Heartbeat 运行。
    - 如果 `target` 解析不到外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="可见性和跳过行为">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，运行会在前置阶段以 `reason=alerts-disabled` 跳过。
    - 如果只禁用了告警递送，OpenClaw 仍可运行 Heartbeat、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外告警载荷。
    - 如果解析出的 Heartbeat 目标支持 typing，OpenClaw 会在 Heartbeat 运行处于活跃状态时显示 typing。这会使用 Heartbeat 本应向其发送聊天输出的同一目标，并且可通过 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="会话生命周期和审计">
    - 仅 Heartbeat 的回复**不会**保持会话存活。Heartbeat 元数据可能会更新会话行，但空闲过期使用最后一条真实用户/渠道消息的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - Control UI 和 WebChat 历史会隐藏 Heartbeat 提示词和仅 OK 的确认。底层会话转录仍可包含这些回合，用于审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以入队一个系统事件，并在主会话应快速注意到某些内容时唤醒 Heartbeat。该唤醒不会让 Heartbeat 运行变成后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而告警内容会被递送。你可以按渠道或按账号调整：

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
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI Status 表面发出指示器事件。

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
| 默认行为（静默 OK，开启告警）            | _（无需配置）_                                                                           |
| 完全静默（无消息、无指示器）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）                       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个渠道中显示 OK                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示词会告诉智能体读取它。可以把它看作你的 “Heartbeat 检查清单”：小巧、稳定，并且可安全地每 30 分钟纳入一次。

在正常运行中，只有为默认智能体启用 Heartbeat 指引时，才会注入 `HEARTBEAT.md`。用 `0m` 禁用 Heartbeat 节奏，或设置 `includeSystemPromptSection: false`，会将它从正常引导上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和类似 `# Heading` 的 markdown 标题），OpenClaw 会跳过 Heartbeat 运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件缺失，Heartbeat 仍会运行，并由模型决定要做什么。

保持精简（简短检查清单或提醒），以避免提示词膨胀。

`HEARTBEAT.md` 示例：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在 Heartbeat 本身内部进行基于间隔的检查。

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
    - OpenClaw 解析 `tasks:` 块，并按每个任务自己的 `interval` 检查它。
    - 只有**到期**任务会被包含在该 tick 的 Heartbeat 提示词中。
    - 如果没有任务到期，Heartbeat 会被完全跳过（`reason=no-tasks-due`），以避免浪费模型调用。
    - `HEARTBEAT.md` 中的非任务内容会保留，并作为附加上下文追加到到期任务列表之后。
    - 任务上次运行时间戳会存储在会话状态中（`heartbeatTaskState`），因此间隔能在正常重启后保留。
    - 只有在 Heartbeat 运行完成其正常回复路径后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望一个 Heartbeat 文件保存多个周期性检查，但不想每个 tick 都为所有检查付费时，任务模式很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以，只要你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的普通文件，所以你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并专注于收件箱跟进。”

如果你希望这主动发生，也可以在 Heartbeat 提示词中加入明确的一行，例如：“如果检查清单变得过时，请用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把秘密（API key、电话号码、私有令牌）放进 `HEARTBEAT.md`，它会成为提示词上下文的一部分。
</Warning>

## 手动唤醒（按需）

你可以用以下命令入队一个系统事件并触发即时 Heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行这些智能体的每个 Heartbeat。

使用 `--mode next-heartbeat` 等待下一个计划 tick。

## 推理递送（可选）

默认情况下，Heartbeat 只递送最终 “answer” 载荷。

如果你想提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，Heartbeat 还会递送一条以 `Reasoning:` 为前缀的单独消息（形状与 `/reasoning on` 相同）。当智能体管理多个会话/codex，并且你想了解它为何决定 ping 你时，这会很有用，但它也可能泄露比你想要的更多内部细节。建议在群聊中保持关闭。

## 成本意识

Heartbeat 会运行完整的智能体回合。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行从约 100K token 降到约 2-5K）。
- 使用 `lightContext: true`，将引导文件限制为只有 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 小巧。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## Heartbeat 后的上下文溢出

如果某次 Heartbeat 之前把现有会话留在较小的本地模型上，例如窗口为 32k 的 Ollama 模型，并且下一次主会话回合报告上下文溢出，请将会话运行时模型重置回已配置的主模型。当最后一个运行时模型匹配已配置的 `heartbeat.model` 时，OpenClaw 的重置消息会指出这一点。

当前 Heartbeat 会在运行完成后保留共享会话的现有运行时模型。你仍可使用 `isolatedSession: true` 在新会话中运行 Heartbeat，将它与 `lightContext: true` 结合以获得最小提示词，或选择上下文窗口足以容纳共享会话的 Heartbeat 模型。

## 相关

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — 分离工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) — 时区如何影响 Heartbeat 调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 调试自动化问题
