---
read_when:
    - 你想要定时任务和唤醒功能
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台任务）'
title: Cron
x-i18n:
    generated_at: "2026-04-28T03:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15a67675caea0948e698f7c054da2662f4bcbcd8bdfe6c8c4d14b8f092076375
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 任务。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。概念指南请参见 [Cron 任务](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建一个新的转录和会话 id。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到一个显式的持久会话键。
  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及用户显式选择的模型或认证覆盖项可以在运行之间延续。
  </Accordion>
</AccordionGroup>

## 传递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的传递路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析而来，或者将会以失败关闭。

<Note>
隔离的 `cron add` 任务默认使用 `--announce` 传递。使用 `--no-deliver` 可将输出保留为内部输出。`--deliver` 仍然保留为 `--announce` 的已弃用别名。
</Note>

### 传递所有权

隔离 cron 聊天传递由智能体和运行器共享负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 当智能体没有直接发送到已解析目标时，`announce` 会回退传递最终回复。
- `webhook` 会将完成的负载 POST 到某个 URL。
- `none` 会禁用运行器的回退传递。

`--announce` 是针对最终回复的运行器回退传递。`--no-deliver` 会禁用该回退，但不会在聊天路由可用时移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天传递目标，用于回退 announce 传递。内部会话键可能是小写形式；不要将它们作为区分大小写的提供商 ID（例如 Matrix 房间 ID）的真实依据。

### 失败传递

失败通知按以下顺序解析：

1. 任务上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 任务的主 announce 目标（当未设置显式失败目标时）。

<Note>
主会话任务只有在主传递模式为 `webhook` 时才能使用 `delivery.failureDestination`。隔离任务在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级智能体失败视为任务错误，即使没有生成回复负载也是如此，因此模型/提供商失败仍会增加错误计数并触发失败通知。

## 调度

### 一次性任务

`--at <datetime>` 用于调度一次性运行。没有偏移量的日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，此时会按给定时区解释该墙上时钟时间。

<Note>
一次性任务默认在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性任务

周期性任务在连续错误后使用指数重试退避：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以让失败告警选择加入重复的跳过运行通知。

对于面向本地已配置模型提供商的隔离任务，cron 会在启动智能体轮次前运行轻量级提供商预检。Loopback、私有网络和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 上探测；像 vLLM、SGLang 和 LM Studio 这样的本地 OpenAI 兼容提供商会在 `/models` 上探测。如果端点不可达，该次运行会被记录为 `skipped`，并在稍后的调度中重试；匹配的失效端点会缓存 5 分钟，以避免多个任务持续冲击同一台本地服务器。

注意：cron 任务定义保存在 `jobs.json` 中，而待处理运行时状态保存在 `jobs-state.json` 中。如果 `jobs.json` 被外部编辑，Gateway 网关会重新加载变更后的调度并清除陈旧的待处理槽位；仅格式化改写不会清除待处理槽位。

### 手动运行

`openclaw cron run` 会在手动运行进入队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 来跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认执行强制运行。使用 `--due` 可以保留旧的“仅在到期时运行”行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为任务选择一个允许的模型。

<Warning>
如果该模型不被允许或无法解析，cron 会以明确的校验错误使该次运行失败，而不是回退到任务的智能体或默认模型选择。
</Warning>

Cron 的 `--model` 是**任务主模型**，而不是聊天会话的 `/model` 覆盖。这意味着：

- 当所选任务模型失败时，已配置的模型回退仍然适用。
- 当存在每任务负载 `fallbacks` 时，它会替换已配置的回退列表。
- 空的每任务回退列表（任务负载/API 中的 `fallbacks: []`）会让该 cron 运行变为严格模式。
- 当任务设置了 `--model`，但没有配置回退列表时，OpenClaw 会传递一个显式的空回退覆盖，这样智能体主模型就不会作为隐藏重试目标被附加上去。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail-hook 覆盖。
2. 每任务 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择过模型时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循已解析的实时模型选择。模型配置 `params.fastMode` 默认生效，但已存储的会话 `fastMode` 覆盖仍然优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为当前运行持久化切换后的提供商和模型（以及存在时切换后的认证配置覆盖）。外层重试循环在初始尝试后最多只允许两次切换重试，随后会中止，而不是无限循环。

## 运行输出与拒绝

### 过期确认抑制

隔离 cron 轮次会抑制仅用于确认的过期回复。如果第一个结果只是中间状态更新，且没有后代子智能体运行负责最终答案，cron 会在传递前再次提示一次以获取真实结果。

### 静默 token 抑制

如果隔离 cron 运行仅返回静默 token（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接对外传递和回退排队摘要路径，因此不会向聊天回发任何内容。

### 结构化拒绝

隔离 cron 运行会优先使用嵌入式运行中的结构化执行拒绝元数据，然后再回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 以及与审批绑定的拒绝短语。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧任务

<Note>
如果你有早于当前传递和存储格式的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层传递字段，包括旧版 `threadId`、负载 `provider` 传递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退任务迁移为显式的 webhook 传递。
</Note>

## 常见编辑

在不更改消息的情况下更新传递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离任务禁用传递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建一个带有轻量级引导上下文的隔离任务：

```bash
openclaw cron add \
  --name "轻量级晨间简报" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "总结一夜之间的更新。" \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次任务。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

## 常见管理命令

手动运行与检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含传递诊断信息，包括预期的 cron 目标、已解析目标、message-tool 发送、回退使用情况以及已传递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

传递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
