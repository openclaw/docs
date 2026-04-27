---
read_when:
    - 你想要计划任务和唤醒功能
    - 你在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-04-27T03:38:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c37e5ccd1069ae50e641c420cae8e2250bb279def39f46ef52b46c791d6f8b0
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

相关内容：

- Cron 作业：[Cron jobs](/zh-CN/automation/cron-jobs)

提示：运行 `openclaw cron --help` 可查看完整命令界面。

注意：`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览已解析的投递路由。对于 `channel: "last"`，预览会显示该路由是从主/当前会话解析得到，还是会以失败关闭。

注意：隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留为内部输出。`--deliver` 仍作为 `--announce` 的已弃用别名保留。

注意：隔离 cron 的聊天投递是共享的。`--announce` 是运行器用于最终回复的回退投递；`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

注意：一次性（`--at`）作业在成功后默认删除。使用 `--keep-after-run` 可在运行后保留它们。

注意：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。使用 `current` 可在创建时绑定到当前活动会话，或使用 `session:<id>` 指定显式的持久会话键。

注意：`--session isolated` 会为每次运行创建新的转录/会话 id。安全偏好设置和用户显式选择的模型/认证覆盖项可以继承，但环境对话上下文不会继承：渠道/群组路由、发送/排队策略、提权、来源和 ACP 运行时绑定都会在新的隔离运行中重置。

注意：对于一次性的 CLI 作业，不带偏移量的 `--at` 日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，此时会将该本地墙钟时间解释为给定时区中的时间。

注意：循环作业现在会在连续出错后使用指数退避重试（30 秒 → 1 分钟 → 5 分钟 → 15 分钟 → 60 分钟），并在下一次成功运行后恢复正常计划。

注意：`openclaw cron run` 现在会在手动运行加入执行队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

注意：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留较旧的“仅在到期时运行”行为。

注意：隔离 cron 回合会抑制陈旧的、仅确认性质的回复。如果首个结果只是临时状态更新，且没有后代子智能体运行负责最终答案，cron 会再次提示一次以获取真实结果，然后再进行投递。

注意：如果隔离 cron 运行仅返回静默令牌（`NO_REPLY` / `no_reply`），cron 会同时抑制直接向外投递以及回退的排队摘要路径，因此不会向聊天回发任何内容。

注意：隔离 cron 运行会优先使用嵌入式运行中的结构化执行拒绝元数据，然后再回退到最终输出中的已知拒绝标记，例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和与审批绑定的拒绝短语。`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

注意：`cron add|edit --model ...` 会为该作业使用所选的允许模型。如果该模型不被允许，cron 会发出警告，并回退到作业的智能体/默认模型选择。已配置的回退链仍然适用，但若只是普通模型覆盖且没有显式的按作业回退列表，则不再将智能体主模型作为隐藏的额外重试目标附加进去。

注意：隔离 cron 的模型优先级依次为 Gmail-hook 覆盖、每作业 `--model`、任何用户选择并存储的 cron 会话模型覆盖，最后才是常规的智能体/默认选择。

注意：隔离 cron 快速模式会遵循已解析的实时模型选择。模型配置中的 `params.fastMode` 默认生效，但存储的会话 `fastMode` 覆盖仍然优先于配置。

注意：如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试之前为当前运行持久化已切换的 provider/模型（以及存在时已切换的认证配置覆盖）。外层重试循环在初始尝试后最多允许 2 次切换重试，随后会中止，而不是无限循环。

注意：失败通知会优先使用 `delivery.failureDestination`，然后使用全局 `cron.failureDestination`，最后在未配置显式失败目标时回退到作业的主要 announce 目标。

注意：保留/清理通过配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有在当前投递/存储格式之前创建的旧 cron 作业，请运行 `openclaw doctor --fix`。Doctor 现在会标准化旧版 cron 字段（`jobId`、`schedule.cron`、顶层 delivery 字段，包括旧版 `threadId`、payload 中 `provider` 的 delivery 别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 投递。

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建带有轻量级引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体回合作业。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

投递归属说明：

- 隔离 cron 的聊天投递是共享的。当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到已解析目标时，才会回退投递最终回复。`webhook` 会将完成后的 payload 发布到 URL。`none` 会禁用运行器回退投递。
- 从活动聊天创建的提醒会保留实时聊天投递目标，用于回退 announce 投递。内部会话键可能是小写；不要将它们作为区分大小写的 provider id（例如 Matrix 房间 id）的真实来源。

## 常见管理命令

手动运行：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、已解析目标、message-tool 发送、回退使用情况以及已投递状态。

智能体/会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

投递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失败投递说明：

- `delivery.failureDestination` 适用于隔离作业。
- 主会话作业仅在主要投递模式为 `webhook` 时才能使用 `delivery.failureDestination`。
- 如果你未设置任何失败目标，而该作业已经向某个渠道 announce，则失败通知会复用同一个 announce 目标。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [计划任务](/zh-CN/automation/cron-jobs)
