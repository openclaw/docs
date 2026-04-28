---
read_when:
    - 调整心跳节奏或消息传递
    - 为定时任务选择心跳还是 cron
sidebarTitle: Heartbeat
summary: 心跳轮询消息和通知规则
title: 心跳
x-i18n:
    generated_at: "2026-04-28T11:52:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a88385f08704b724a22f0d55719043861f94ed6890d2fbaadb3b399ee27c6d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat 与 cron？** 请参阅 [自动化与任务](/zh-CN/automation)，了解何时使用它们。
</Note>

Heartbeat 会在主会话中运行**周期性智能体轮次**，让模型可以暴露任何需要关注的事项，而不会向你发送垃圾消息。

Heartbeat 是一个定时的主会话轮次，它**不会**创建[后台任务](/zh-CN/automation/tasks)记录。任务记录用于分离式工作（ACP 运行、子智能体、隔离的 cron 作业）。

故障排除：[定时任务](/zh-CN/automation/cron-jobs#troubleshooting)

## 快速开始（初学者）

<Steps>
  <Step title="选择节奏">
    保持启用 heartbeat（默认是 `30m`，对于 Anthropic OAuth/token 认证，包括 Claude CLI 复用，则为 `1h`），或设置你自己的节奏。
  </Step>
  <Step title="添加 HEARTBEAT.md（可选）">
    在 Agent 工作区中创建一个很小的 `HEARTBEAT.md` 清单或 `tasks:` 块。
  </Step>
  <Step title="决定 heartbeat 消息应发送到哪里">
    `target: "none"` 是默认值；设置 `target: "last"` 可路由到最近一次联系人。
  </Step>
  <Step title="可选调优">
    - 启用 heartbeat 推理投递以提高透明度。
    - 如果 heartbeat 运行只需要 `HEARTBEAT.md`，使用轻量级引导上下文。
    - 启用隔离会话，避免每次 heartbeat 都发送完整对话历史。
    - 将 heartbeat 限制在活跃时段内（本地时间）。

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
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## 默认值

- 间隔：`30m`（当检测到的认证模式是 Anthropic OAuth/token 认证，包括 Claude CLI 复用时，为 `1h`）。设置 `agents.defaults.heartbeat.every` 或每个智能体的 `agents.list[].heartbeat.every`；使用 `0m` 禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat 提示会作为用户消息**逐字**发送。只有在默认智能体启用 heartbeat 时，系统提示才包含 “Heartbeat” 章节，并且该运行会在内部打上标记。
- 使用 `0m` 禁用 heartbeat 时，普通运行也会从引导上下文中省略 `HEARTBEAT.md`，因此模型不会看到仅用于 heartbeat 的指令。
- 活跃时段（`heartbeat.activeHours`）会按配置的时区检查。在窗口之外，heartbeat 会跳过，直到窗口内的下一个 tick。

## heartbeat 提示的用途

默认提示有意保持宽泛：

- **后台任务**：“Consider outstanding tasks” 会提醒智能体检查后续事项（收件箱、日历、提醒、排队的工作），并暴露任何紧急事项。
- **人工检查**：“Checkup sometimes on your human during day time” 会提醒偶尔发送一条轻量的“有什么需要吗？”消息，但会使用你配置的本地时区来避免夜间垃圾消息（请参阅[时区](/zh-CN/concepts/timezone)）。

Heartbeat 可以响应已完成的[后台任务](/zh-CN/automation/tasks)，但 heartbeat 运行本身不会创建任务记录。

如果你希望 heartbeat 执行非常具体的事情（例如“检查 Gmail PubSub 统计信息”或“验证 Gateway 网关健康状况”），请将 `agents.defaults.heartbeat.prompt`（或 `agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

## 响应契约

- 如果没有需要关注的事项，请回复 **`HEARTBEAT_OK`**。
- 在 heartbeat 运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 会将其视为确认。该 token 会被剥离；如果剩余内容 **≤ `ackMaxChars`**（默认：300），回复会被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复**中间**，则不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；只返回警报文本。

在 heartbeat 之外，消息开头/结尾处意外出现的 `HEARTBEAT_OK` 会被剥离并记录；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

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

### 每个智能体的 heartbeat

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**只有这些智能体**会运行 heartbeat。每个智能体的块会合并到 `agents.defaults.heartbeat` 之上（因此你可以设置一次共享默认值，并按智能体覆盖）。

示例：两个智能体，只有第二个智能体运行 heartbeat。

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

将 heartbeat 限制在特定时区的工作时间内：

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

在此窗口之外（东部时间上午 9 点之前或晚上 10 点之后），heartbeat 会被跳过。窗口内的下一个定时 tick 将正常运行。

### 24/7 设置

如果你希望 heartbeat 全天运行，请使用以下模式之一：

- 完全省略 `activeHours`（没有时间窗口限制；这是默认行为）。
- 设置全天窗口：`activeHours: { start: "00:00", end: "24:00" }`。

<Warning>
不要将 `start` 和 `end` 时间设置为相同（例如从 `08:00` 到 `08:00`）。这会被视为零宽度窗口，因此 heartbeat 将始终被跳过。
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
  heartbeat 运行的可选模型覆盖（`provider/model`）。
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  启用时，在可用时还会投递单独的 `Reasoning:` 消息（形状与 `/reasoning on` 相同）。
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  为 true 时，heartbeat 运行会使用轻量级引导上下文，并仅保留工作区引导文件中的 `HEARTBEAT.md`。
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  为 true 时，每次 heartbeat 都会在没有先前对话历史的新会话中运行。使用与 cron `sessionTarget: "isolated"` 相同的隔离模式。可大幅降低每次 heartbeat 的 token 成本。与 `lightContext: true` 结合使用可获得最大节省。投递路由仍使用主会话上下文。
</ParamField>
<ParamField path="session" type="string">
  heartbeat 运行的可选会话键。

- `main`（默认）：智能体主会话。
- 显式会话键（从 `openclaw sessions --json` 或 [sessions CLI](/zh-CN/cli/sessions) 复制）。
- 会话键格式：请参阅[会话](/zh-CN/concepts/session)和[群组](/zh-CN/channels/groups)。

</ParamField>
<ParamField path="target" type="string">
- `last`：投递到上次使用的外部渠道。
- 显式渠道：任何已配置的渠道或插件 ID，例如 `discord`、`matrix`、`telegram` 或 `whatsapp`。
- `none`（默认）：运行 heartbeat，但**不向外部投递**。

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  控制直接/私信投递行为。`allow`：允许直接/私信 heartbeat 投递。`block`：抑制直接/私信投递（`reason=dm-blocked`）。

</ParamField>
<ParamField path="to" type="string">
  可选收件人覆盖（渠道特定 ID，例如 WhatsApp 的 E.164 或 Telegram 聊天 ID）。对于 Telegram 话题/线程，请使用 `<chatId>:topic:<messageThreadId>`。

</ParamField>
<ParamField path="accountId" type="string">
  多账号渠道的可选账号 ID。当 `target: "last"` 时，如果解析出的最近渠道支持账号，则该账号 ID 会应用于它；否则会被忽略。如果账号 ID 与解析出的渠道中已配置的账号不匹配，则会跳过投递。

</ParamField>
<ParamField path="prompt" type="string">
  覆盖默认提示正文（不合并）。

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  投递前 `HEARTBEAT_OK` 之后允许的最大字符数。

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  为 true 时，会在 heartbeat 运行期间抑制工具错误警告载荷。

</ParamField>
<ParamField path="activeHours" type="object">
  将 heartbeat 运行限制在一个时间窗口内。对象包含 `start`（HH:MM，包含；使用 `00:00` 表示一天开始）、`end`（HH:MM，不包含；允许 `24:00` 表示一天结束）和可选的 `timezone`。

- 省略或 `"user"`：如果设置了你的 `agents.defaults.userTimezone`，则使用它，否则回退到主机系统时区。
- `"local"`：始终使用主机系统时区。
- 任意 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，则回退到上面的 `"user"` 行为。
- 对于活动窗口，`start` 和 `end` 不能相等；相等值会被视为零宽度（始终在窗口外）。
- 在活动窗口外，心跳会被跳过，直到窗口内的下一个 tick。

</ParamField>

## 交付行为

<AccordionGroup>
  <Accordion title="Session and target routing">
    - 默认情况下，心跳在智能体的主会话中运行（`agent:<id>:<mainKey>`），或当 `session.scope = "global"` 时在 `global` 中运行。设置 `session` 可覆盖为特定渠道会话（Discord/WhatsApp 等）。
    - `session` 只影响运行上下文；交付由 `target` 和 `to` 控制。
    - 若要交付到特定渠道/收件人，请设置 `target` + `to`。使用 `target: "last"` 时，交付会使用该会话的最后一个外部渠道。
    - 心跳交付默认允许直接/私信目标。设置 `directPolicy: "block"` 可抑制直接目标发送，同时仍运行心跳轮次。
    - 如果主队列繁忙，心跳会被跳过并稍后重试。
    - 如果 `target` 未解析到外部目的地，运行仍会发生，但不会发送出站消息。

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - 如果 `showOk`、`showAlerts` 和 `useIndicator` 全部禁用，运行会预先以 `reason=alerts-disabled` 被跳过。
    - 如果只禁用告警交付，OpenClaw 仍可运行心跳、更新到期任务时间戳、恢复会话空闲时间戳，并抑制对外告警载荷。
    - 如果解析出的心跳目标支持输入状态，OpenClaw 会在心跳运行期间显示输入中。这使用心跳会向其发送聊天输出的同一目标，并且会被 `typingMode: "never"` 禁用。

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - 仅心跳回复**不会**保持会话活跃。心跳元数据可能会更新会话行，但空闲过期使用最后一条真实用户/渠道消息的 `lastInteractionAt`，每日过期使用 `sessionStartedAt`。
    - Control UI 和 WebChat 历史会隐藏心跳提示和仅 OK 确认。底层会话转录仍可包含这些轮次，用于审计/重放。
    - 分离的[后台任务](/zh-CN/automation/tasks)可以入队系统事件，并在主会话应快速注意某事时唤醒心跳。该唤醒不会让心跳运行成为后台任务。

  </Accordion>
</AccordionGroup>

## 可见性控制

默认情况下，交付告警内容时会抑制 `HEARTBEAT_OK` 确认。你可以按渠道或按账号调整：

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
- `useIndicator`：为 UI 状态界面发出指示器事件。

如果**三者**都为 false，OpenClaw 会完全跳过心跳运行（不调用模型）。

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
| 默认行为（静默 OK，开启告警） | _(无需配置)_                                                                     |
| 完全静默（无消息，无指示器） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 只在一个渠道中显示 OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（可选）

如果工作区中存在 `HEARTBEAT.md` 文件，默认提示会告诉智能体读取它。可以把它看作你的“心跳检查清单”：小巧、稳定，并且适合每 30 分钟包含一次。

在正常运行中，只有为默认智能体启用心跳指导时，才会注入 `HEARTBEAT.md`。用 `0m` 禁用心跳节奏或设置 `includeSystemPromptSection: false` 会将它从正常引导上下文中省略。

如果 `HEARTBEAT.md` 存在但实际上为空（只有空行和像 `# Heading` 这样的 markdown 标题），OpenClaw 会跳过心跳运行以节省 API 调用。该跳过会报告为 `reason=empty-heartbeat-file`。如果文件缺失，心跳仍会运行，并由模型决定要做什么。

保持它很小（简短检查清单或提醒），以避免提示膨胀。

示例 `HEARTBEAT.md`：

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` 块

`HEARTBEAT.md` 还支持一个小型结构化 `tasks:` 块，用于心跳内部基于间隔的检查。

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
    - OpenClaw 会解析 `tasks:` 块，并按各自的 `interval` 检查每个任务。
    - 只有**到期**任务会被包含在该 tick 的心跳提示中。
    - 如果没有任务到期，心跳会被完全跳过（`reason=no-tasks-due`），以避免浪费模型调用。
    - `HEARTBEAT.md` 中的非任务内容会被保留，并在到期任务列表后作为附加上下文追加。
    - 任务上次运行时间戳存储在会话状态（`heartbeatTaskState`）中，因此间隔能在正常重启后保留。
    - 任务时间戳只会在心跳运行完成其正常回复路径后推进。被跳过的 `empty-heartbeat-file` / `no-tasks-due` 运行不会将任务标记为已完成。

  </Accordion>
</AccordionGroup>

当你希望一个心跳文件保存多个周期性检查，而不是每个 tick 都为所有检查付费时，任务模式很有用。

### 智能体可以更新 HEARTBEAT.md 吗？

可以，如果你要求它这样做。

`HEARTBEAT.md` 只是智能体工作区中的一个普通文件，所以你可以在普通聊天中告诉智能体，例如：

- “更新 `HEARTBEAT.md`，添加每日日历检查。”
- “重写 `HEARTBEAT.md`，让它更短并专注于收件箱跟进。”

如果你希望它主动发生，也可以在心跳提示中包含一行明确内容，例如：“如果检查清单变得过时，请用更好的版本更新 HEARTBEAT.md。”

<Warning>
不要把机密（API 密钥、电话号码、私有令牌）放入 `HEARTBEAT.md`，它会成为提示上下文的一部分。
</Warning>

## 手动唤醒（按需）

你可以用以下命令入队系统事件并触发立即心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体配置了 `heartbeat`，手动唤醒会立即运行每个此类智能体心跳。

使用 `--mode next-heartbeat` 可等待下一次计划 tick。

## 推理交付（可选）

默认情况下，心跳只交付最终“答案”载荷。

如果你需要透明度，请启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳还会交付一条带 `Reasoning:` 前缀的单独消息（形状与 `/reasoning on` 相同）。当智能体管理多个会话/codex，并且你想看到它为什么决定 ping 你时，这会很有用，但它也可能泄露比你想要更多的内部细节。建议在群聊中保持关闭。

## 成本意识

心跳会运行完整的智能体轮次。更短的间隔会消耗更多 token。要降低成本：

- 使用 `isolatedSession: true`，避免发送完整对话历史（每次运行约从 100K token 降到约 2-5K）。
- 使用 `lightContext: true`，将引导文件限制为仅 `HEARTBEAT.md`。
- 设置更便宜的 `model`（例如 `ollama/llama3.2:1b`）。
- 保持 `HEARTBEAT.md` 小巧。
- 如果你只想要内部状态更新，请使用 `target: "none"`。

## 心跳后的上下文溢出

如果心跳使用较小的本地模型，例如具有 32k 窗口的 Ollama 模型，并且下一次主会话轮次报告上下文溢出，请检查上一次心跳是否将会话留在了心跳模型上。当最后一个运行时模型匹配已配置的 `heartbeat.model` 时，OpenClaw 的重置消息会指出这一点。

使用 `isolatedSession: true` 在新会话中运行心跳，将它与 `lightContext: true` 结合以获得最小提示，或选择上下文窗口足够容纳共享会话的心跳模型。

## 相关

- [自动化和任务](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — 如何跟踪分离的工作
- [时区](/zh-CN/concepts/timezone) — 时区如何影响心跳调度
- [故障排除](/zh-CN/automation/cron-jobs#troubleshooting) — 调试自动化问题
