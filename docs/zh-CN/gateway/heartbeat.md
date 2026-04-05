---
read_when:
    - 调整 heartbeat 频率或消息内容
    - 在定时任务中决定使用 heartbeat 还是 cron
summary: Heartbeat 轮询消息和通知规则
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T08:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat（Gateway 网关）

> **Heartbeat 还是 Cron？** 何时使用它们，请参阅[自动化与任务](/automation)。

Heartbeat 会在主会话中运行**周期性的智能体轮次**，让模型可以
发现任何需要你注意的内容，同时避免刷屏。

Heartbeat 是一次计划中的主会话轮次——它**不会**创建[后台任务](/automation/tasks)记录。
任务记录用于脱离式工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除：[定时任务](/automation/cron-jobs#troubleshooting)

## 快速开始（新手）

1. 保持 heartbeats 启用（默认是 `30m`，对于 Anthropic OAuth/token 认证，包括 Claude CLI 复用，则为 `1h`），或者设置你自己的频率。
2. 在智能体工作区中创建一个小型 `HEARTBEAT.md` 检查清单或 `tasks:` 块（可选，但推荐）。
3. 决定 heartbeat 消息应发送到哪里（默认是 `target: "none"`；设置 `target: "last"` 可将其路由到上一次联系人）。
4. 可选：启用 heartbeat 推理内容投递以提高透明度。
5. 可选：如果 heartbeat 运行只需要 `HEARTBEAT.md`，则使用轻量 bootstrap 上下文。
6. 可选：启用隔离会话，避免每次 heartbeat 都发送完整对话历史。
7. 可选：将 heartbeat 限制在活跃时段（本地时间）。

示例配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系人（默认是 "none"）
        directPolicy: "allow", // 默认：允许 direct/私信目标；设为 "block" 可抑制
        lightContext: true, // 可选：仅从 bootstrap 文件注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行都使用全新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：额外发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（如果检测到的认证模式是 Anthropic OAuth/token 认证，包括 Claude CLI 复用，则为 `1h`）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat 提示会**原样**作为用户消息发送。系统
  提示中会包含一个“Heartbeat”部分，并且该运行会在内部被标记。
- 活跃时段（`heartbeat.activeHours`）会根据已配置时区进行检查。
  若超出该时间窗口，heartbeat 会跳过，直到窗口内的下一次 tick。

## heartbeat 提示的用途

默认提示刻意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会推动智能体检查
  后续事项（收件箱、日历、提醒、排队工作），并提示任何紧急内容。
- **人工签到**：“Checkup sometimes on your human during day time” 会推动其
  偶尔发送轻量级的“你有什么需要吗？”消息，但通过使用你配置的本地时区来避免夜间刷屏
  （见 [/concepts/timezone](/concepts/timezone)）。

Heartbeat 可以对已完成的[后台任务](/automation/tasks)作出反应，但 heartbeat 运行本身不会创建任务记录。

如果你希望 heartbeat 执行非常具体的操作（例如“检查 Gmail PubSub
统计信息”或“验证 gateway 健康状态”），请设置 `agents.defaults.heartbeat.prompt`（或
`agents.list[].heartbeat.prompt`）为自定义正文（会原样发送）。

## 响应约定

- 如果没有任何内容需要注意，请回复 **`HEARTBEAT_OK`**。
- 在 heartbeat 运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，
  OpenClaw 会将其视为确认。若剩余内容长度**≤ `ackMaxChars`**（默认：300），
  则会剥离该标记并丢弃回复。
- 如果 `HEARTBEAT_OK` 出现在回复**中间**，则不会被特殊处理。
- 对于告警，**不要**包含 `HEARTBEAT_OK`；只返回告警文本。

在 heartbeat 之外，如果某条消息的开头/结尾出现了多余的 `HEARTBEAT_OK`，也会被剥离
并记录日志；如果整条消息只有 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 表示禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时投递单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；true 时仅保留工作区 bootstrap 文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次 heartbeat 都在全新会话中运行（无对话历史）
        target: "last", // 默认：none | 可选值：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道特定覆盖
        accountId: "ops-bot", // 可选的多账户渠道 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 之后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局 heartbeat 行为。
- `agents.list[].heartbeat` 会在其上合并；如果任意智能体拥有 `heartbeat` 块，**则只有这些智能体**会运行 heartbeat。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户渠道）会覆盖按渠道设置。

### 按智能体配置 heartbeat

如果任意 `agents.list[]` 条目包含 `heartbeat` 块，**则只有这些智能体**
会运行 heartbeat。按智能体配置块会在 `agents.defaults.heartbeat`
之上合并（因此你可以先设置共享默认值，再按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行 heartbeat。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系人（默认是 "none"）
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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 活跃时段示例

将 heartbeat 限制在特定时区的工作时段内：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系人（默认是 "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选；如果设置了 userTimezone 则使用它，否则使用主机时区
        },
      },
    },
  },
}
```

在该时间窗口之外（美东时间上午 9 点前或晚上 10 点后），heartbeat 会被跳过。窗口内的下一次计划 tick 将正常运行。

### 24/7 设置

如果你希望 heartbeat 全天运行，可以使用以下模式之一：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设为相同时间（例如 `08:00` 到 `08:00`）。
这会被视为零宽度窗口，因此 heartbeat 会始终被跳过。

### 多账户示例

在 Telegram 这类多账户渠道中，使用 `accountId` 指向特定账户：

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 可选：路由到特定 topic/thread
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

- `every`：heartbeat 间隔（时长字符串；默认单位 = 分钟）。
- `model`：heartbeat 运行使用的可选模型覆盖（`provider/model`）。
- `includeReasoning`：启用后，当可用时也会投递单独的 `Reasoning:` 消息（形式与 `/reasoning on` 相同）。
- `lightContext`：为 true 时，heartbeat 运行使用轻量 bootstrap 上下文，并且只保留工作区 bootstrap 文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 heartbeat 都会在一个没有先前对话历史的全新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可大幅降低每次 heartbeat 的 token 成本。与 `lightContext: true` 组合可获得最大节省。投递路由仍使用主会话上下文。
- `session`：heartbeat 运行使用的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（可从 `openclaw sessions --json` 或 [sessions CLI](/cli/sessions) 复制）。
  - 会话键格式：参见[会话](/concepts/session)和[群组](/channels/groups)。
- `target`：
  - `last`：投递到最后一次使用的外部渠道。
  - 显式渠道：任意已配置渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`（默认）：运行 heartbeat，但**不进行**外部投递。
- `directPolicy`：控制 direct/私信投递行为：
  - `allow`（默认）：允许 direct/私信 heartbeat 投递。
  - `block`：抑制 direct/私信投递（`reason=dm-blocked`）。
- `to`：可选收件人覆盖（渠道特定 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram topic/thread，请使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：多账户渠道的可选账户 id。当 `target: "last"` 时，如果解析出的最后渠道支持账户，则应用该账户 id；否则会被忽略。如果该账户 id 与解析出的渠道中任何已配置账户都不匹配，则会跳过投递。
- `prompt`：覆盖默认提示正文（不合并）。
- `ackMaxChars`：`HEARTBEAT_OK` 之后允许的最大字符数。
- `suppressToolErrorWarnings`：为 true 时，在 heartbeat 运行期间抑制工具错误警告负载。
- `activeHours`：将 heartbeat 运行限制在某个时间窗口内。对象包含 `start`（HH:MM，含边界；使用 `00:00` 表示一天开始）、`end`（HH:MM，不含边界；允许 `24:00` 表示一天结束）以及可选的 `timezone`。
  - 省略或设为 `"user"`：如果设置了 `agents.defaults.userTimezone` 则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任意 IANA 标识符（例如 `America/New_York`）：直接使用；若无效，则回退到上述 `"user"` 行为。
  - 对于有效窗口，`start` 和 `end` 不能相等；相等会被视为零宽度（始终在窗口外）。
  - 超出活跃窗口时，heartbeat 会被跳过，直到窗口内的下一次 tick。

## 投递行为

- heartbeat 默认在智能体主会话中运行（`agent:<id>:<mainKey>`），
  或在 `session.scope = "global"` 时使用 `global`。设置 `session` 可覆盖为某个
  特定渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
- 若要投递到特定渠道/收件人，请设置 `target` + `to`。当
  `target: "last"` 时，会使用该会话的最后一个外部渠道进行投递。
- heartbeat 默认允许向 direct/私信目标投递。设置 `directPolicy: "block"` 可在仍运行 heartbeat 轮次的同时抑制 direct 目标发送。
- 如果主队列繁忙，heartbeat 会被跳过并在稍后重试。
- 如果 `target` 未解析到外部目标，该运行仍会发生，但不会
  发送任何出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部被禁用，则运行会在开始前以 `reason=alerts-disabled` 被跳过。
- 如果只是禁用了告警投递，OpenClaw 仍可以运行 heartbeat、更新时间到期任务时间戳、恢复会话空闲时间戳，并抑制向外发送的告警负载。
- 仅 heartbeat 的回复**不会**保持会话活跃；最后的 `updatedAt`
  会被恢复，因此空闲过期行为保持正常。
- 脱离式[后台任务](/automation/tasks)可以排入一个系统事件并唤醒 heartbeat，
  以便主会话能尽快注意到某些内容。该唤醒不会让 heartbeat 运行变成后台任务。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认会被抑制，而告警内容会被
投递。你可以按渠道或按账户进行调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示告警消息（默认）
      useIndicator: true # 发出 indicator 事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 为此账户抑制告警投递
```

优先级：按账户 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅包含 OK 的回复时，发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI 状态表面发出 indicator 事件。

如果**三者全部**为 false，OpenClaw 会完全跳过 heartbeat 运行（不会发起模型调用）。

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
      showOk: true # 所有 Slack 账户
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅为 ops 账户抑制告警
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，显示告警） | _(无需配置)_ |
| 完全静默（无消息，无 indicator） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅 indicator（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在某一个渠道显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## `HEARTBEAT.md`（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会告诉
智能体读取它。你可以把它看作你的“heartbeat 检查清单”：小巧、稳定，并且
适合每 30 分钟都纳入一次。

如果 `HEARTBEAT.md` 存在，但实际上是空的（只有空行和 Markdown
标题，例如 `# Heading`），OpenClaw 会跳过 heartbeat 运行以节省 API 调用。
该跳过会记录为 `reason=empty-heartbeat-file`。
如果文件缺失，heartbeat 仍会运行，并由模型决定该做什么。

请尽量保持它很小（简短检查清单或提醒），避免提示膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在 heartbeat 内部执行基于间隔的
检查。

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

行为如下：

- OpenClaw 会解析 `tasks:` 块，并根据每个任务自己的 `interval` 来检查它。
- 每个 tick 中只会包含**已到期**的任务到 heartbeat 提示中。
- 如果没有任何任务到期，heartbeat 会被完全跳过（`reason=no-tasks-due`），避免浪费一次模型调用。
- `HEARTBEAT.md` 中非任务内容会被保留，并在到期任务列表之后追加为额外上下文。
- 任务上次运行时间戳会存储在会话状态中（`heartbeatTaskState`），因此在正常重启后也能保留间隔信息。
- 只有在 heartbeat 运行完成其正常回复路径后，任务时间戳才会前进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

当你希望一个 heartbeat 文件包含多个周期性检查，而又不想在每个 tick 上都为它们全部付费时，任务模式非常有用。

### 智能体可以更新 `HEARTBEAT.md` 吗？

可以——如果你要求它这么做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，因此你可以在普通聊天中告诉
智能体，例如：

- “Update `HEARTBEAT.md` to add a daily calendar check.”
- “Rewrite `HEARTBEAT.md` so it’s shorter and focused on inbox follow-ups.”

如果你希望它主动这样做，也可以在
heartbeat 提示中加入一条显式说明，例如：“If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

安全提示：不要把密钥（API key、电话号码、私有 token）放进
`HEARTBEAT.md`——它会成为提示上下文的一部分。

## 手动唤醒（按需）

你可以通过以下命令排入一个系统事件并立即触发 heartbeat：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，一次手动唤醒会立即运行这些
智能体中的每一个 heartbeat。

使用 `--mode next-heartbeat` 则会等待下一次计划 tick。

## 推理内容投递（可选）

默认情况下，heartbeat 只会投递最终的“answer”负载。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，heartbeat 还会投递一条单独消息，前缀为
`Reasoning:`（形式与 `/reasoning on` 相同）。当智能体
管理多个会话/Codex，并且你想知道它为什么决定提醒
你时，这会很有用——但它也可能泄露比你希望看到的更多内部细节。在群聊中通常应保持关闭。

## 成本意识

Heartbeat 会运行完整的智能体轮次。间隔越短，消耗的 token 越多。要降低成本：

- 使用 `isolatedSession: true` 以避免发送完整对话历史（每次运行可从约 100K token 降到约 2-5K）。
- 使用 `lightContext: true` 将 bootstrap 文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 简短。
- 如果你只想更新内部状态，请使用 `target: "none"`。

## 相关

- [自动化与任务](/automation) — 各种自动化机制的总览
- [后台任务](/automation/tasks) — 如何跟踪脱离式工作
- [时区](/concepts/timezone) — 时区如何影响 heartbeat 调度
- [故障排除](/automation/cron-jobs#troubleshooting) — 调试自动化问题
