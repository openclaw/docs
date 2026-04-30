---
read_when:
    - 你需要定时任务和唤醒
    - 你正在调试 cron 的执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: 定时调度
x-i18n:
    generated_at: "2026-04-30T08:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 任务。

<Tip>
运行 `openclaw cron --help` 查看完整命令界面。概念指南见 [Cron 任务](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` 绑定到智能体的主会话。
    - `isolated` 会为每次运行创建新的转录和会话 id。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久会话键。

  </Accordion>
  <Accordion title="Isolated session semantics">
    隔离运行会重置环境会话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及用户显式选择的模型或凭证覆盖可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 交付

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的交付路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析得到，或者会关闭失败。

<Note>
隔离的 `cron add` 任务默认使用 `--announce` 交付。使用 `--no-deliver` 可将输出保持为内部输出。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 交付所有权

隔离 cron 聊天交付由智能体和运行器共享：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 只有在智能体没有直接发送到解析后的目标时，`announce` 才会回退交付最终回复。
- `webhook` 会将完成后的载荷发布到 URL。
- `none` 会禁用运行器回退交付。

`--announce` 是最终回复的运行器回退交付。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天交付目标，用于回退 announce 交付。内部会话键可能是小写；不要将其用作区分大小写的提供商 ID（例如 Matrix 房间 ID）的真实来源。

### 失败交付

失败通知按以下顺序解析：

1. 任务上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 任务的主要 announce 目标（未设置显式失败目标时）。

<Note>
主会话任务只有在主要交付模式为 `webhook` 时才能使用 `delivery.failureDestination`。隔离任务在所有模式下都接受它。
</Note>

注意：即使没有生成回复载荷，隔离 cron 运行也会把运行级智能体失败视为任务错误，因此模型/提供商失败仍会增加错误计数并触发失败通知。

## 调度

### 一次性任务

`--at <datetime>` 会调度一次性运行。没有偏移量的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，该参数会按给定时区解释挂钟时间。

<Note>
一次性任务默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性任务

周期性任务在连续错误后使用指数重试退避：30s、1m、5m、15m、60m。下次运行成功后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以选择让失败提醒包含重复的跳过运行通知。

对于目标是本地已配置模型提供商的隔离任务，cron 会在启动智能体轮次前运行轻量级提供商预检。Loopback、private-network 和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 探测；本地 OpenAI 兼容提供商（例如 vLLM、SGLang 和 LM Studio）会在 `/models` 探测。如果端点不可达，该运行会记录为 `skipped` 并在之后的调度中重试；匹配的失效端点会缓存 5 分钟，以避免大量任务反复冲击同一个本地服务器。

注意：cron 任务定义存放在 `jobs.json` 中，而待处理运行时状态存放在 `jobs-state.json` 中。如果外部编辑了 `jobs.json`，Gateway 网关会重新加载已更改的调度并清除过期的待处理槽位；仅格式变更的重写不会清除待处理槽位。

### 手动运行

`openclaw cron run` 会在手动运行入队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留较旧的“仅在到期时运行”行为。
</Note>

## Models

`cron add|edit --model <ref>` 为任务选择允许的模型。

<Warning>
如果模型不被允许或无法解析，cron 会让该运行失败并给出显式验证错误，而不是回退到任务的智能体或默认模型选择。
</Warning>

Cron `--model` 是**任务主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 当所选任务模型失败时，已配置的模型回退仍会应用。
- 存在逐任务载荷 `fallbacks` 时，它会替换已配置的回退列表。
- 空的逐任务回退列表（任务载荷/API 中的 `fallbacks: []`）会让 cron 运行变为严格模式。
- 当任务有 `--model` 但未配置回退列表时，OpenClaw 会传递显式的空回退覆盖，这样智能体主模型不会作为隐藏的重试目标追加进去。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail-hook 覆盖。
2. 逐任务 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择过时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认应用，但已存储的会话 `fastMode` 覆盖仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化已切换的提供商和模型（以及存在时的已切换凭证配置文件覆盖）。外层重试循环限制为初次尝试后的两次切换重试，之后会中止而不是无限循环。

## 运行输出和拒绝

### 过期确认抑制

隔离 cron 轮次会抑制过期的仅确认回复。如果第一个结果只是临时状态更新，且没有后代子智能体运行负责最终答案，cron 会在交付前重新提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接外发交付和回退排队摘要路径，因此不会向聊天发回任何内容。

### 结构化拒绝

隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和凭证绑定拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`）会修剪已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧任务

<Note>
如果你有当前交付和存储格式之前创建的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层交付字段，包括旧版 `threadId`、载荷 `provider` 交付别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退任务迁移为显式 webhook 交付。
</Note>

## 常见编辑

在不更改消息的情况下更新交付设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离任务的交付：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

announce 到特定渠道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

announce 到 Telegram 论坛话题：

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

`--light-context` 仅适用于隔离的智能体轮次任务。对于 cron 运行，轻量级模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含交付诊断信息，包括预期的 cron 目标、解析后的目标、message 工具发送、回退使用情况以及已交付状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

当智能体轮次任务省略 `--agent` 时，`openclaw cron add` 会发出警告并回退到默认智能体（`main`）。在创建时传入 `--agent <id>` 可固定到特定智能体。

交付微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
