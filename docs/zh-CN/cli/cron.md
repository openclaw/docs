---
read_when:
    - 你需要定时作业和唤醒机制
    - 你在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: 定时任务
x-i18n:
    generated_at: "2026-04-27T02:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c63cb6418b8ac4a38566f604162ca5d4e202726d1ef6a97e3ce072f90c179c3
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的定时任务。

相关内容：

- 定时任务：[定时任务](/zh-CN/automation/cron-jobs)

提示：运行 `openclaw cron --help` 以查看完整命令功能。

注意：`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览已解析的投递路由。对于 `channel: "last"`，预览会显示该路由是从主/当前会话解析得到，还是会以失败关闭。

注意：隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保持为内部可见。`--deliver` 仍保留为 `--announce` 的已弃用别名。

注意：隔离的 cron 聊天投递是共享的。`--announce` 是运行器针对最终回复的后备投递；`--no-deliver` 会禁用该后备机制，但当聊天路由可用时，不会移除智能体的 `message` 工具。

注意：一次性（`--at`）作业默认在成功后删除。使用 `--keep-after-run` 可在运行后保留它们。

注意：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。使用 `current` 可在创建时绑定到当前活动会话，或使用 `session:<id>` 指定一个明确的持久会话键。

注意：`--session isolated` 会为每次运行创建一个新的转录记录/会话 id。安全偏好设置和用户显式选择的模型/凭证覆盖可以继承，但环境对话上下文不会继承：渠道/群组路由、发送/排队策略、权限提升、来源以及 ACP 运行时绑定，都会为新的隔离运行重置。

注意：对于一次性的 CLI 作业，不带偏移量的 `--at` 日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，这样会将该本地墙上时间按给定时区解释。

注意：重复作业现在会在连续出错后使用指数重试退避（30 秒 → 1 分钟 → 5 分钟 → 15 分钟 → 60 分钟），并在下一次成功运行后恢复正常调度。

注意：`openclaw cron run` 现在会在手动运行进入执行队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

注意：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。

注意：隔离的 cron 轮次会抑制过时的、仅确认类回复。如果第一个结果只是中间状态更新，且没有后代子智能体运行负责给出最终答案，cron 会再提示一次以获取真实结果后再投递。

注意：如果隔离的 cron 运行仅返回静默标记（`NO_REPLY` / `no_reply`），cron 会同时抑制直接对外投递以及后备排队摘要路径，因此不会向聊天回发任何内容。

注意：隔离的 cron 运行会将最终输出中已知的拒绝标记（例如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 以及与审批绑定相关的拒绝短语）视为错误。随后 `cron list` 和运行历史会在错误原因中显示匹配到的标记，而不是将被阻止的命令报告为 `ok`。

注意：`cron add|edit --model ...` 会为该作业使用所选的允许模型。如果该模型不被允许，cron 会发出警告并回退到该作业的智能体/默认模型选择。已配置的回退链仍然适用，但仅使用普通模型覆盖、且没有显式的每作业回退列表时，不会再把智能体主模型作为隐藏的额外重试目标附加进去。

注意：隔离的 cron 模型优先级依次为 Gmail-hook 覆盖、每作业 `--model`、任何用户选择并存储的 cron 会话模型覆盖，最后才是常规的智能体/默认选择。

注意：隔离的 cron 快速模式会遵循已解析的实时模型选择。默认应用模型配置 `params.fastMode`，但已存储会话中的 `fastMode` 覆盖仍优先于配置。

注意：如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为当前运行持久化切换后的提供商/模型（以及存在时切换后的凭证配置覆盖）。外层重试循环在初次尝试后最多允许 2 次切换重试，之后会中止，而不是无限循环。

注意：失败通知会优先使用 `delivery.failureDestination`，其次使用全局 `cron.failureDestination`，最后在未配置显式失败目标时回退到该作业的主 announce 目标。

注意：保留/清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有早于当前投递/存储格式的旧 cron 作业，请运行 `openclaw doctor --fix`。Doctor 现在会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、负载中的 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 后备作业迁移为显式 webhook 投递。

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

发布到特定渠道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建一个带轻量级引导上下文的隔离作业：

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

投递归属说明：

- 隔离的 cron 聊天投递是共享的。当聊天路由可用时，智能体可以直接使用 `message` 工具发送。
- `announce` 仅在智能体未直接发送到已解析目标时，后备投递最终回复。`webhook` 会将完成后的负载发送到某个 URL。`none` 会禁用运行器后备投递。
- 从活动聊天创建的提醒会保留实时聊天投递目标，用于后备 announce 投递。内部会话键可能为小写；不要将其作为区分大小写的 provider ID（例如 Matrix 房间 ID）的真实来源。

## 常见管理命令

手动运行：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、已解析目标、message-tool 发送、后备使用情况以及已投递状态。

智能体/会话重新定向：

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

失败投递说明：

- `delivery.failureDestination` 适用于隔离作业。
- 主会话作业仅在主投递模式为 `webhook` 时才可使用 `delivery.failureDestination`。
- 如果你未设置任何失败目标，且该作业已经向某个渠道 announce，则失败通知会复用同一个 announce 目标。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
