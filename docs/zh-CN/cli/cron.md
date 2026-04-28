---
read_when:
    - 你需要定时任务和唤醒
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台任务）'
title: 定时任务
x-i18n:
    generated_at: "2026-04-28T11:47:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。有关概念指南，请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。
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
    隔离运行会重置环境会话上下文。渠道和群组路由、发送/队列策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好设置以及用户显式选择的模型或凭证覆盖可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析而来，或者将失败关闭。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可让输出保持内部可见。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 投递归属

隔离 cron 聊天投递由智能体和运行器共同负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 仅当智能体未直接发送到解析后的目标时，`announce` 才会回退投递最终回复。
- `webhook` 会将完成后的负载发布到 URL。
- `none` 会禁用运行器回退投递。

`--announce` 是运行器对最终回复的回退投递。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，用于回退公告投递。内部会话键可以是小写；不要将它们用作区分大小写的提供商 ID（例如 Matrix 房间 ID）的真实来源。

### 失败投递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主公告目标（未设置显式失败目标时）。

<Note>
主会话作业仅在主投递模式为 `webhook` 时可以使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级智能体失败视为作业错误，即使
没有生成回复负载也是如此，因此模型/提供商失败仍会增加错误
计数器并触发失败通知。

## 调度

### 一次性作业

`--at <datetime>` 会调度一次性运行。除非你同时传入 `--tz <iana>`，否则不带偏移量的日期时间会被视为 UTC；`--tz <iana>` 会按给定时区解释本地钟表时间。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 循环作业

循环作业在连续出错后使用指数重试退避：30s、1m、5m、15m、60m。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以选择让失败警报包含重复的跳过运行通知。

对于目标为本地已配置模型提供商的隔离作业，cron 会在启动智能体轮次前运行轻量提供商预检。Loopback、私有网络和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 探测；本地 OpenAI 兼容提供商（例如 vLLM、SGLang 和 LM Studio）会在 `/models` 探测。如果端点不可达，该运行会记录为 `skipped`，并在后续调度中重试；匹配的失效端点会缓存 5 分钟，避免大量作业反复冲击同一本地服务器。

注意：cron 作业定义存放在 `jobs.json` 中，而待处理运行时状态存放在 `jobs-state.json` 中。如果从外部编辑 `jobs.json`，Gateway 网关会重新加载变更后的调度并清除陈旧的待处理槽；仅格式化的重写不会清除待处理槽。

### 手动运行

`openclaw cron run` 会在手动运行入队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。
</Note>

## Models

`cron add|edit --model <ref>` 为作业选择允许的模型。

<Warning>
如果模型不被允许或无法解析，cron 会以显式验证错误使运行失败，而不是回退到作业的智能体或默认模型选择。
</Warning>

Cron `--model` 是**作业主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 当所选作业模型失败时，已配置的模型回退仍然适用。
- 当存在单作业负载 `fallbacks` 时，它会替换已配置的回退列表。
- 空的单作业回退列表（作业负载/API 中的 `fallbacks: []`）会使 cron 运行变为严格模式。
- 当作业带有 `--model` 但未配置回退列表时，OpenClaw 会传入显式的空回退覆盖，因此智能体主模型不会作为隐藏重试目标追加。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖。
2. 单作业 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择了一个模型时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认适用，但已存储的会话 `fastMode` 覆盖仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化切换后的提供商和模型（以及存在时切换后的凭证配置文件覆盖）。外层重试循环在初始尝试后最多允许两次切换重试，随后中止，避免无限循环。

## 运行输出和拒绝

### 陈旧确认抑制

隔离 cron 轮次会抑制陈旧的仅确认回复。如果第一个结果只是临时状态更新，并且没有后代子智能体运行负责最终答案，cron 会在投递前重新提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和回退排队摘要路径，因此不会向聊天发回任何内容。

### 结构化拒绝

隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和审批绑定拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`）会修剪已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移较旧作业

<Note>
如果你有当前投递和存储格式之前的 cron 作业，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、负载 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 投递。
</Note>

## 常见编辑

更新投递设置且不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

公告到特定渠道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

公告到 Telegram 论坛主题：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建带轻量引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离智能体轮次作业。对于 cron 运行，轻量模式会让引导上下文保持为空，而不是注入完整工作区引导集。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断，其中包括预期的 cron 目标、解析后的目标、message 工具发送、回退使用情况以及已投递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

投递微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [计划任务](/zh-CN/automation/cron-jobs)
