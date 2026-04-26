---
read_when:
    - 调整心跳频率或消息内容
    - 为计划任务决定使用心跳还是 cron
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-26T01:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 440afefdbefba8317eeb7f3a1ecb6dddb2d88600e78b46a31f2f432bfa5eeb33
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **心跳还是 Cron？** 关于何时使用两者的指导，请参阅 [自动化与任务](/zh-CN/automation)。

心跳会在主会话中运行**周期性的智能体轮次**，这样模型就能主动提示任何需要关注的事项，而不会对你造成刷屏。

心跳是一次按计划执行的主会话轮次——它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。
任务记录用于脱离主会话的工作（ACP 运行、子智能体、独立的 cron 作业）。

故障排除：[计划任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（适合初学者）

1. 保持心跳启用状态（默认是 `30m`，对于 Anthropic OAuth/令牌认证，包括 Claude CLI 复用时为 `1h`），或者设置你自己的频率。
2. 在智能体工作区中创建一个简短的 `HEARTBEAT.md` 检查清单或 `tasks:` 块（可选，但推荐）。
3. 决定心跳消息应该发送到哪里（默认是 `target: "none"`；设置 `target: "last"` 可将其路由到上一次联系的对象）。
4. 可选：启用心跳推理内容投递，以提高透明度。
5. 可选：如果心跳运行只需要 `HEARTBEAT.md`，可使用轻量级引导上下文。
6. 可选：启用隔离会话，避免每次心跳都发送完整的对话历史。
7. 可选：将心跳限制在活跃时段内（本地时间）。

配置示例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系的对象（默认是 "none"）
        directPolicy: "allow", // 默认：允许直接/私信目标；设置为 "block" 可禁止
        lightContext: true, // 可选：仅从引导文件中注入 HEARTBEAT.md
        isolatedSession: true, // 可选：每次运行使用新会话（无对话历史）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：额外发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（当检测到的认证模式为 Anthropic OAuth/令牌认证时为 `1h`，包括 Claude CLI 复用）。设置 `agents.defaults.heartbeat.every` 或按智能体设置 `agents.list[].heartbeat.every`；使用 `0m` 可禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示会**原样**作为用户消息发送。系统提示中只有在默认智能体启用了心跳且该次运行已在内部标记时，才会包含一个“Heartbeat”部分。
- 当使用 `0m` 禁用心跳时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，因此模型不会看到仅用于心跳的说明。
- 活跃时段（`heartbeat.activeHours`）会按配置的时区检查。在该时间窗口之外，心跳会被跳过，直到窗口内的下一次轮询。

## 心跳提示的用途

默认提示特意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会促使智能体检查待跟进事项（收件箱、日历、提醒、排队中的工作），并提示任何紧急内容。
- **人工问候**：“Checkup sometimes on your human during day time” 会促使其偶尔发送轻量级的“你需要什么帮助吗？”之类消息，但会通过你配置的本地时区避免夜间打扰（参见 [/concepts/timezone](/zh-CN/concepts/timezone)）。

心跳可以对已完成的[后台任务](/zh-CN/automation/tasks)作出反应，但心跳运行本身不会创建任务记录。

如果你希望心跳执行非常具体的操作（例如“检查 Gmail PubSub 统计信息”或“验证网关健康状态”），可以将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（会原样发送）。

## 响应约定

- 如果没有任何需要关注的事项，请回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，如果回复的**开头或结尾**出现 `HEARTBEAT_OK`，OpenClaw 会将其视为确认。该标记会被移除；如果剩余内容**≤ `ackMaxChars`**（默认：300），则整条回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，则不会被特殊处理。
- 对于告警，**不要**包含 `HEARTBEAT_OK`；只返回告警文本。

在非心跳场景下，如果消息开头或结尾意外出现 `HEARTBEAT_OK`，也会被移除并记录日志；如果一条消息只有 `HEARTBEAT_OK`，则会被丢弃。

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 表示禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时投递单独的 Reasoning: 消息）
        lightContext: false, // 默认：false；true 时仅保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次心跳在新会话中运行（无对话历史）
        target: "last", // 默认：none | 可选：last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的渠道专用覆盖值
        accountId: "ops-bot", // 可选的多账号渠道 id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 会在其基础上合并；如果任何智能体带有 `heartbeat` 块，**则只有这些智能体**会运行心跳。
- `channels.defaults.heartbeat` 为所有渠道设置可见性默认值。
- `channels.<channel>.heartbeat` 会覆盖渠道默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账号渠道）会按渠道进一步覆盖。

### 按智能体配置心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**则只有这些智能体**会运行心跳。
按智能体的块会在 `agents.defaults.heartbeat` 之上合并（因此你可以先设置共享默认值，再为每个智能体覆盖）。

示例：两个智能体，只有第二个智能体运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系的对象（默认是 "none"）
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

将心跳限制在特定时区的工作时间内：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 显式投递到上一次联系的对象（默认是 "none"）
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

在该时间窗口之外（美东时间上午 9 点前或晚上 10 点后），心跳会被跳过。窗口内的下一次计划轮询将正常运行。

### 24/7 配置

如果你希望心跳全天运行，可以使用以下任一方式：

- 完全省略 `activeHours`（不限制时间窗口；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

不要将 `start` 和 `end` 设为相同时间（例如 `08:00` 到 `08:00`）。
这会被视为零宽度窗口，因此心跳始终会被跳过。

### 多账号示例

使用 `accountId` 将消息定向到 Telegram 等多账号渠道中的特定账号：

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

- `every`：心跳间隔（时长字符串；默认单位 = 分钟）。
- `model`：心跳运行时的可选模型覆盖值（`provider/model`）。
- `includeReasoning`：启用后，如果可用，还会投递单独的 `Reasoning:` 消息（形态与 `/reasoning on` 相同）。
- `lightContext`：为 true 时，心跳运行会使用轻量级引导上下文，并且仅保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳都会在全新会话中运行，不带先前对话历史。其隔离模式与 cron 的 `sessionTarget: "isolated"` 相同。可显著降低每次心跳的 token 成本。与 `lightContext: true` 结合可获得最大节省。投递路由仍使用主会话上下文。
- `session`：心跳运行的可选会话键。
  - `main`（默认）：智能体主会话。
  - 显式会话键（可从 `openclaw sessions --json` 或 [sessions CLI](/zh-CN/cli/sessions) 获取）。
  - 会话键格式：参见[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。
- `target`：
  - `last`：投递到上一次使用的外部渠道。
  - 显式渠道：任何已配置的渠道或插件 id，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
  - `none`（默认）：运行心跳，但**不进行**外部投递。
- `directPolicy`：控制直接/私信投递行为：
  - `allow`（默认）：允许直接/私信心跳投递。
  - `block`：禁止直接/私信投递（`reason=dm-blocked`）。
- `to`：可选的收件人覆盖值（渠道专用 id，例如 WhatsApp 的 E.164 或 Telegram chat id）。对于 Telegram topics/threads，使用 `<chatId>:topic:<messageThreadId>`。
- `accountId`：多账号渠道的可选账号 id。当 `target: "last"` 时，如果解析出的上一个渠道支持账号，则会应用该账号 id；否则会被忽略。如果该账号 id 与解析出的渠道中已配置账号不匹配，则会跳过投递。
- `prompt`：覆盖默认提示正文（不合并）。
- `ackMaxChars`：`HEARTBEAT_OK` 之后允许的最大字符数。
- `suppressToolErrorWarnings`：为 true 时，会在心跳运行期间抑制工具错误警告负载。
- `activeHours`：将心跳运行限制在一个时间窗口内。对象包含 `start`（HH:MM，含边界；使用 `00:00` 表示一天开始）、`end`（HH:MM，不含边界；一天结束可用 `24:00`）以及可选的 `timezone`。
  - 省略或设为 `"user"`：如果设置了你的 `agents.defaults.userTimezone` 则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上述 `"user"` 行为。
  - 对于活动窗口，`start` 和 `end` 不能相等；相等会被视为零宽度（始终在窗口外）。
  - 在活跃窗口之外，心跳会被跳过，直到窗口内的下一次轮询。

## 投递行为

- 心跳默认在智能体的主会话中运行（`agent:<id>:<mainKey>`），当 `session.scope = "global"` 时则为 `global`。设置 `session` 可覆盖到特定渠道会话（Discord/WhatsApp 等）。
- `session` 只影响运行上下文；投递由 `target` 和 `to` 控制。
- 若要投递到特定渠道/收件人，请设置 `target` + `to`。当使用 `target: "last"` 时，投递会使用该会话最近一次使用的外部渠道。
- 默认情况下，心跳投递允许直接/私信目标。设置 `directPolicy: "block"` 可在仍然运行心跳轮次的同时，禁止向直接目标发送消息。
- 如果主队列繁忙，心跳会被跳过并稍后重试。
- 如果 `target` 解析后没有外部目标，运行仍会发生，但不会发送出站消息。
- 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部被禁用，则会在开始前跳过该运行，并标记为 `reason=alerts-disabled`。
- 如果仅禁用了告警投递，OpenClaw 仍可运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外告警负载。
- 如果解析出的心跳目标支持“正在输入”状态，OpenClaw 会在心跳运行期间显示输入状态。它使用的目标与心跳发送聊天输出时相同，并且可通过 `typingMode: "never"` 禁用。
- 仅由心跳产生的回复**不会**保持会话存活。心跳元数据可能会更新会话行，但空闲过期使用的是最近一次真实用户/渠道消息的 `lastInteractionAt`，而每日过期使用的是 `sessionStartedAt`。
- Control UI 和 WebChat 历史记录会隐藏心跳提示以及仅 OK 的确认消息。底层会话转录仍可能包含这些轮次，以便审计/回放。
- 脱离主会话的[后台任务](/zh-CN/automation/tasks)可以排入一个系统事件并唤醒心跳，以便让主会话尽快注意到某些事项。但这种唤醒不会让心跳运行变成后台任务。

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认消息会被抑制，而告警内容会被投递。你可以按渠道或按账号进行调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示告警消息（默认）
      useIndicator: true # 发送指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 对此账号抑制告警投递
```

优先级：按账号 → 按渠道 → 渠道默认值 → 内置默认值。

### 每个标志的作用

- `showOk`：当模型返回仅包含 OK 的回复时，发送一条 `HEARTBEAT_OK` 确认消息。
- `showAlerts`：当模型返回非 OK 回复时，发送告警内容。
- `useIndicator`：为 UI 状态界面发送指示器事件。

如果**这三个标志全部**为 false，OpenClaw 会完全跳过心跳运行（不会调用模型）。

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
      showOk: true # 所有 Slack 账号
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅对 ops 账号抑制告警
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标 | 配置 |
| --- | --- |
| 默认行为（静默 OK，开启告警） | _(无需配置)_ |
| 完全静默（无消息、无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| 仅在一个渠道中显示 OK | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会告诉智能体去读取它。你可以把它看作你的“心跳检查清单”：简短、稳定，并且适合每 30 分钟都包含一次。

在普通运行中，仅当默认智能体启用了心跳指引时，才会注入 `HEARTBEAT.md`。将心跳频率设为 `0m` 禁用，或设置 `includeSystemPromptSection: false`，都会使它不再出现在普通引导上下文中。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和 Markdown 标题，如 `# Heading`），OpenClaw 会跳过该次心跳运行以节省 API 调用。
该跳过会记录为 `reason=empty-heartbeat-file`。
如果文件不存在，心跳仍会运行，由模型决定该怎么做。

请保持它足够小巧（简短检查清单或提醒），以避免提示膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于在心跳内部执行基于间隔的检查。

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

- OpenClaw 会解析 `tasks:` 块，并根据各自的 `interval` 检查每个任务。
- 只有**已到期**的任务才会被包含进该次轮询的心跳提示中。
- 如果没有任务到期，心跳会被完全跳过（`reason=no-tasks-due`），以避免浪费一次模型调用。
- `HEARTBEAT.md` 中的非任务内容会被保留，并在到期任务列表之后作为附加上下文追加。
- 任务上次运行时间戳会存储在会话状态（`heartbeatTaskState`）中，因此这些间隔在普通重启后仍可保留。
- 只有在心跳运行完成其正常回复路径后，任务时间戳才会推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

当你希望一个心跳文件容纳多个周期检查，而又不想在每次轮询时都为所有检查付费时，任务模式会很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以——如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，因此你可以在普通聊天中这样告诉智能体：

- “更新 `HEARTBEAT.md`，加入一个每日历检查。”
- “重写 `HEARTBEAT.md`，让它更短，并专注于收件箱跟进。”

如果你希望这能主动发生，也可以在心跳提示中加入一行明确说明，例如：“如果检查清单已经过时，就更新 HEARTBEAT.md，换成一个更好的版本。”

安全说明：不要把密钥（API keys、电话号码、私密令牌）放进 `HEARTBEAT.md`——它会成为提示上下文的一部分。

## 手动唤醒（按需）

你可以通过以下命令排入一个系统事件并立即触发一次心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体都配置了 `heartbeat`，手动唤醒会立即运行这些智能体各自的心跳。

使用 `--mode next-heartbeat` 可等待下一次计划轮询。

## 推理内容投递（可选）

默认情况下，心跳只投递最终的“answer”负载。

如果你希望提高透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会额外投递一条以
`Reasoning:` 为前缀的单独消息（形态与 `/reasoning on` 相同）。当智能体管理多个会话/codexes，且你希望了解它为何决定来提醒你时，这会很有用——但它也可能泄露比你希望看到的更多内部细节。在群聊中通常建议保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行大约可从 ~100K tokens 降到 ~2-5K）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置一个更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 简短。
- 如果你只想要内部状态更新，可使用 `target: "none"`。

## 相关内容

- [自动化与任务](/zh-CN/automation) —— 所有自动化机制总览
- [后台任务](/zh-CN/automation/tasks) —— 脱离主会话的工作如何被跟踪
- [时区](/zh-CN/concepts/timezone) —— 时区如何影响心跳调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) —— 自动化问题调试方法
