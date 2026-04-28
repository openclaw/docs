---
read_when:
    - 你想要计划任务和唤醒功能
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（用于调度和运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-04-28T01:18:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35a9ba4c89c6022bda7e8c4dfb81d2efae7c541d73f4c4b36683fd128af0ba4d
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。概念性指南请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。
</Tip>

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建全新的对话记录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久化会话键。
  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/排队策略、提权、来源以及 ACP 运行时绑定都会为新的运行重置。安全偏好以及用户显式选择的模型或凭证覆盖可以在多次运行之间继承。
  </Accordion>
</AccordionGroup>

## 传递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的传递路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析而来，或者将会以故障关闭方式失败。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 传递。使用 `--no-deliver` 可将输出保留为内部可见。`--deliver` 仍然保留为 `--announce` 的已弃用别名。
</Note>

### 传递所有权

隔离 cron 聊天传递由智能体和运行器共享负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 只有当智能体未直接发送到已解析目标时，`announce` 才会作为后备方式传递最终回复。
- `webhook` 会将完成后的负载发送到某个 URL。
- `none` 会禁用运行器后备传递。

`--announce` 是针对最终回复的运行器后备传递。`--no-deliver` 会禁用该后备方式，但在聊天路由可用时不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天传递目标，用于后备 announce 传递。内部会话键可能是小写；不要将它们用作区分大小写的提供商 ID（例如 Matrix 房间 ID）的真实依据。

### 失败传递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主 announce 目标（当未设置显式失败目标时）。

<Note>
主会话作业仅可在主传递模式为 `webhook` 时使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级别的智能体失败视为作业错误，即使没有生成回复负载也是如此，因此模型/提供商失败仍会增加错误计数器并触发失败通知。

## 调度

### 单次作业

`--at <datetime>` 会调度一次性运行。不带偏移量的日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，此时会按给定时区中的墙上时间进行解释。

<Note>
单次作业在成功后默认删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性作业

周期性作业在连续出错后使用指数退避重试：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以让失败告警选择加入重复的跳过运行通知。

对于以本地已配置模型提供商为目标的隔离作业，cron 会在启动智能体轮次之前运行轻量级提供商预检。`api: "ollama"` 的 loopback、私有网络和 `.local` 提供商会在 `/api/tags` 上探测；本地兼容 OpenAI 的提供商（如 vLLM、SGLang 和 LM Studio）会在 `/models` 上探测。如果端点不可达，该次运行会被记录为 `skipped`，并在后续计划中重试；匹配的失效端点会缓存 5 分钟，以避免大量作业反复冲击同一个本地服务器。

注意：cron 作业定义保存在 `jobs.json` 中，而待处理的运行时状态保存在 `jobs-state.json` 中。如果 `jobs.json` 被外部编辑，Gateway 网关会重新加载已变更的调度并清除陈旧的待处理槽位；仅格式化层面的重写不会清除该待处理槽位。

### 手动运行

`openclaw cron run` 会在手动运行入队后立即返回。成功响应会包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 来跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为作业选择一个允许使用的模型。

<Warning>
如果该模型不被允许，cron 会发出警告，并回退到作业的智能体模型或默认模型选择。
</Warning>

Cron 的 `--model` 是**作业主模型**，不是聊天会话的 `/model` 覆盖。这意味着：

- 当所选作业模型失败时，已配置的模型回退仍然适用。
- 当存在每作业负载 `fallbacks` 时，它会替换已配置的回退列表。
- 空的每作业回退列表（作业负载/API 中的 `fallbacks: []`）会让 cron 运行变为严格模式。
- 当作业带有 `--model` 但未配置回退列表时，OpenClaw 会传递一个显式的空回退覆盖，以避免将智能体主模型作为隐藏的重试目标追加进去。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail-hook 覆盖。
2. 每作业 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选定了某个模型时）。
4. 智能体模型或默认模型选择。

### 快速模式

隔离 cron 的快速模式会遵循已解析的实时模型选择。默认会应用模型配置 `params.fastMode`，但已存储的会话 `fastMode` 覆盖仍然优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为当前运行持久化已切换的提供商和模型（以及存在时已切换的凭证配置文件覆盖）。外层重试循环在初始尝试后最多只允许两次切换重试，然后会中止，而不是无限循环。

## 运行输出与拒绝

### 过时确认抑制

隔离 cron 轮次会抑制仅包含过时确认的回复。如果第一个结果只是中间状态更新，且最终答案并不是由某个后代子智能体运行负责，cron 会再次提示一次以获取真实结果，然后再进行传递。

### 静默 token 抑制

如果隔离 cron 运行只返回静默 token（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接对外传递和后备排队摘要路径，因此不会向聊天回发任何内容。

### 结构化拒绝

隔离 cron 运行会优先使用来自嵌入式运行的结构化执行拒绝元数据，然后再回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 以及与审批绑定的拒绝措辞。

`cron list` 和运行历史会显示拒绝原因，而不是把被阻止的命令报告为 `ok`。

## 保留

保留和清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧作业

<Note>
如果你有来自当前传递和存储格式之前的 cron 作业，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层传递字段，包括旧版 `threadId`、负载中的 `provider` 传递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 后备作业迁移为显式 webhook 传递。
</Note>

## 常见编辑

在不更改消息的情况下更新传递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用传递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道进行 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
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

`--light-context` 仅适用于隔离的智能体轮次作业。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集。

## 常见管理命令

手动运行与检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包括传递诊断信息，其中包含预期的 cron 目标、已解析目标、message 工具发送、后备使用情况以及已传递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

传递微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [计划任务](/zh-CN/automation/cron-jobs)
