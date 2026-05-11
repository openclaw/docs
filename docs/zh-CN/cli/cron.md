---
read_when:
    - 你需要定时任务和唤醒
    - 你正在调试 cron 执行和日志
summary: CLI 参考：`openclaw cron`（调度并运行后台作业）
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 任务。

<Tip>
运行 `openclaw cron --help` 查看完整命令界面。概念指南请参阅 [Cron 任务](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的转录记录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到一个显式的持久会话键。

  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好设置以及用户显式选择的模型或凭证覆盖项可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 递送

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的递送路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析得到，或者会以关闭失败告终。

带提供商前缀的目标可以消除未解析公告渠道的歧义。例如，`to: "telegram:123"` 会在省略 `delivery.channel` 或其为 `last` 时选择 Telegram。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，前缀必须与该渠道匹配；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是由渠道拥有的目标语法。

<Note>
隔离的 `cron add` 任务默认使用 `--announce` 递送。使用 `--no-deliver` 可将输出保留在内部。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 递送所有权

隔离 cron 聊天递送由智能体和运行器共享：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 只有当智能体未直接发送到解析后的目标时，`announce` 才会回退递送最终回复。
- `webhook` 将完成后的负载发布到 URL。
- `none` 禁用运行器回退递送。

`--announce` 是最终回复的运行器回退递送。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天递送目标，用于回退公告递送。内部会话键可能是小写；不要把它们当作用于区分大小写的提供商 ID 的事实来源，例如 Matrix 房间 ID。

### 失败递送

失败通知按以下顺序解析：

1. 任务上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 任务的主要公告目标（未设置显式失败目标时）。

<Note>
主会话任务仅在主要递送模式为 `webhook` 时才可使用 `delivery.failureDestination`。隔离任务在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级智能体失败视为任务错误，即使没有生成回复负载也是如此，因此模型/提供商失败仍会递增错误计数器并触发失败通知。

如果隔离运行在首次模型请求前超时，`openclaw cron show` 和 `openclaw cron runs` 会包含阶段特定错误，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。对于 CLI 支持的提供商，预模型看门狗会保持活动状态，直到外部 CLI 轮次开始，因此会话查找、钩子、凭证、提示词和 CLI 设置卡顿会被报告为预模型 cron 失败。

## 调度

### 一次性任务

`--at <datetime>` 会调度一次性运行。不带偏移量的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，此时会按给定时区解释挂钟时间。

<Note>
一次性任务默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性任务

周期性任务在连续错误后使用指数重试退避：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

跳过的运行与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以让失败警报包含重复的跳过运行通知。

对于以本地配置模型提供商为目标的隔离任务，cron 会在启动智能体轮次前运行轻量级提供商预检。Loopback、私有网络和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 上探测；本地 OpenAI 兼容提供商（例如 vLLM、SGLang 和 LM Studio）会在 `/models` 上探测。如果端点不可达，该运行会记录为 `skipped`，并在之后的调度中重试；匹配的失效端点会缓存 5 分钟，以避免大量任务冲击同一个本地服务器。

注意：cron 任务定义位于 `jobs.json`，而待处理运行时状态位于 `jobs-state.json`。如果 `jobs.json` 被外部编辑，Gateway 网关会重新加载已更改的调度并清除陈旧的待处理槽位；仅格式化的重写不会清除待处理槽位。

### 手动运行

`openclaw cron run` 会在手动运行排队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。
</Note>

## Models

`cron add|edit --model <ref>` 为任务选择允许的模型。

<Warning>
如果模型不被允许或无法解析，cron 会让运行因显式验证错误而失败，而不是回退到任务的智能体或默认模型选择。
</Warning>

Cron `--model` 是**任务主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 当所选任务模型失败时，配置的模型回退仍然适用。
- 当存在按任务负载的 `fallbacks` 时，它会替换配置的回退列表。
- 空的按任务回退列表（任务负载/API 中的 `fallbacks: []`）会使 cron 运行严格执行。
- 当任务有 `--model` 但未配置回退列表时，OpenClaw 会传入显式空回退覆盖项，这样智能体主模型就不会作为隐藏重试目标追加。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖项。
2. 按任务的 `--model`。
3. 已存储的 cron 会话模型覆盖项（当用户选择了一个时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认适用，但已存储的会话 `fastMode` 覆盖项仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化切换后的提供商和模型（以及存在时切换后的凭证配置覆盖项）。外层重试循环在初始尝试后最多允许两次切换重试，随后中止而不是无限循环。

## 运行输出和拒绝

### 陈旧确认抑制

隔离 cron 轮次会抑制陈旧的仅确认回复。如果第一个结果只是临时状态更新，并且没有后代子智能体运行负责最终答案，cron 会在递送前重新提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站递送和回退排队摘要路径，因此不会向聊天发回任何内容。

### 结构化拒绝

隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和审批绑定拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪在配置中控制：

- `cron.sessionRetention`（默认 `24h`）会修剪已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧任务

<Note>
如果你有当前递送和存储格式之前的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层递送字段，包括旧版 `threadId`、负载 `provider` 递送别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退任务迁移为显式 webhook 递送。
</Note>

## 常见编辑

更新递送设置而不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离任务的递送：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

公告到特定渠道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

公告到 Telegram 论坛话题：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建带轻量级引导上下文的隔离任务：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离智能体轮次任务。对于 cron 运行，轻量级模式会保持引导上下文为空，而不是注入完整的工作区引导集。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` 默认显示所有匹配的任务。传入 `--agent <id>` 可仅显示有效规范化智能体 ID 匹配的任务；没有存储智能体 ID 的任务会计为配置的默认智能体。

`openclaw cron get <job-id>` 会直接返回存储的任务 JSON。当你需要带递送路由预览的可读视图时，请使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 在每个任务上包含顶层 `status` 字段，该字段根据 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算。取值：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。这与可读状态列保持一致，因此外部工具可以读取任务状态，而无需重新推导。

`cron runs` 条目包含递送诊断信息，包括预期的 cron 目标、解析后的目标、message 工具发送、回退使用情况以及已递送状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 会在智能体轮次任务省略 `--agent` 时发出警告，并回退到默认智能体（`main`）。创建时传入 `--agent <id>` 可固定到特定智能体。

递送微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
