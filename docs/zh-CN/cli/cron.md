---
read_when:
    - 你需要定时任务和唤醒
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: 定时任务
x-i18n:
    generated_at: "2026-05-02T04:47:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令界面。概念指南见 [cron 作业](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的转录记录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久会话键。

  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新的运行重置。安全偏好以及用户显式选择的模型或认证覆盖项可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析而来，或将以关闭方式失败。

带提供商前缀的目标可以消除未解析公告渠道的歧义。例如，`to: "telegram:123"` 会在省略 `delivery.channel` 或其值为 `last` 时选择 Telegram。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，前缀必须匹配该渠道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是渠道拥有的目标语法。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留为内部输出。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 投递所有权

隔离 cron 聊天投递由智能体和运行器共享：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到解析目标时，才回退投递最终回复。
- `webhook` 会将完成的载荷发布到 URL。
- `none` 会禁用运行器回退投递。

`--announce` 是运行器对最终回复的回退投递。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，以便进行回退公告投递。内部会话键可能是小写；不要将它们用作 Matrix 房间 ID 等区分大小写的提供商 ID 的事实来源。

### 失败投递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主要公告目标（未设置显式失败目标时）。

<Note>
主会话作业只有在主要投递模式为 `webhook` 时，才可以使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级智能体失败视为作业错误，即使
没有生成回复载荷也是如此，因此模型/提供商失败仍会递增错误
计数器并触发失败通知。

## 调度

### 一次性作业

`--at <datetime>` 会调度一次性运行。没有偏移量的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，此时会按给定时区解释该挂钟时间。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性作业

周期性作业在连续错误后使用指数重试退避：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以选择让失败警报包含重复的跳过运行通知。

对于以本地已配置模型提供商为目标的隔离作业，cron 会在启动智能体回合前运行轻量级提供商预检。Loopback、私有网络和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 探测；本地 OpenAI 兼容提供商（如 vLLM、SGLang 和 LM Studio）会在 `/models` 探测。如果端点无法访问，该运行会被记录为 `skipped`，并在后续调度中重试；匹配的失效端点会缓存 5 分钟，避免大量作业反复冲击同一个本地服务器。

注意：cron 作业定义位于 `jobs.json`，而待处理运行时状态位于 `jobs-state.json`。如果外部编辑了 `jobs.json`，Gateway 网关会重新加载变更后的调度并清除过期的待处理槽位；仅格式化的重写不会清除待处理槽位。

### 手动运行

`openclaw cron run` 会在手动运行排队后立即返回。成功响应包括 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 可保留较旧的“仅在到期时运行”行为。
</Note>

## Models

`cron add|edit --model <ref>` 会为该作业选择一个允许的模型。

<Warning>
如果模型不被允许或无法解析，cron 会以显式校验错误使运行失败，而不是回退到作业的智能体或默认模型选择。
</Warning>

Cron `--model` 是**作业主模型**，不是聊天会话 `/model` 覆盖项。这意味着：

- 当所选作业模型失败时，仍会应用已配置的模型回退。
- 存在按作业载荷的 `fallbacks` 时，它会替换已配置的回退列表。
- 空的按作业回退列表（作业载荷/API 中的 `fallbacks: []`）会使 cron 运行变为严格模式。
- 当作业有 `--model` 但未配置回退列表时，OpenClaw 会传递显式空回退覆盖项，这样智能体主模型不会作为隐藏重试目标追加。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖项。
2. 按作业的 `--model`。
3. 已存储的 cron 会话模型覆盖项（当用户选择过一个时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。默认会应用模型配置 `params.fastMode`，但已存储的会话 `fastMode` 覆盖项仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化切换后的提供商和模型（以及存在时切换后的认证配置文件覆盖项）。外层重试循环限制为初始尝试后的两次切换重试，随后中止而不是无限循环。

## 运行输出和拒绝

### 过期确认抑制

隔离 cron 回合会抑制过期的仅确认回复。如果第一个结果只是临时状态更新，并且没有后代子智能体运行负责最终答案，cron 会在投递前重新提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和回退队列摘要路径，因此不会向聊天回发任何内容。

### 结构化拒绝

隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和审批绑定拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`）会修剪已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移较旧作业

<Note>
如果你有当前投递和存储格式之前的 cron 作业，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、载荷 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 投递。
</Note>

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离作业的投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

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

创建带轻量级引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离智能体回合作业。对于 cron 运行，轻量级模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、解析后的目标、消息工具发送、回退使用情况以及已投递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 会在智能体回合作业省略 `--agent` 时发出警告，并回退到默认智能体（`main`）。在创建时传入 `--agent <id>` 可固定到特定智能体。

投递微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
