---
read_when:
    - 你想要定时作业和唤醒功能
    - 你正在调试 `cron` 执行和日志
summary: '`openclaw cron` 的 CLI 参考（用于调度和运行后台作业）'
title: cron
x-i18n:
    generated_at: "2026-04-23T06:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关 调度器的 `cron` 作业。

相关内容：

- Cron 作业：[Cron 作业](/zh-CN/automation/cron-jobs)

提示：运行 `openclaw cron --help` 可查看完整命令说明。

注意：`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览已解析的投递路由。对于 `channel: "last"`，预览会显示该路由是从主会话/当前会话解析得到，还是会以失败关闭。

注意：隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留为内部可见。`--deliver` 仍然可用，但已作为 `--announce` 的弃用别名。

注意：隔离的 `cron` 聊天投递为共享模式。`--announce` 是运行器对最终回复的后备投递方式；`--no-deliver` 会禁用该后备方式，但如果聊天路由可用，并不会移除智能体的 `message` 工具。

注意：一次性（`--at`）作业默认会在成功后删除。使用 `--keep-after-run` 可在运行后保留它们。

注意：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。
使用 `current` 可在创建时绑定到活动会话，或使用 `session:<id>` 指定显式的持久会话键。

注意：对于一次性 CLI 作业，不带偏移量的 `--at` 日期时间默认按 UTC 处理，除非你同时传入
`--tz <iana>`，此时会将该本地墙上时钟时间按给定时区解释。

注意：循环作业现在会在连续错误后使用指数退避重试（30 秒 → 1 分钟 → 5 分钟 → 15 分钟 → 60 分钟），并在下一次成功运行后恢复正常计划。

注意：`openclaw cron run` 现在会在手动运行被加入执行队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

注意：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。

注意：隔离的 `cron` 回合会抑制仅用于确认、但已过时的回复。如果
第一个结果只是中间状态更新，且没有后代子智能体运行负责给出最终答案，
则 `cron` 会在投递前再提示一次，以获取真实结果。

注意：如果某次隔离 `cron` 运行只返回静默令牌（`NO_REPLY` /
`no_reply`），`cron` 会同时抑制直接对外投递和后备排队摘要路径，因此不会向聊天回发任何内容。

注意：`cron add|edit --model ...` 会将所选的允许模型用于该作业。
如果该模型不被允许，`cron` 会发出警告，并改为回退到该作业的智能体/默认
模型选择。已配置的回退链仍然适用，但如果只是简单的模型覆盖，且没有显式的逐作业回退列表，则不再把智能体主模型作为隐藏的额外重试目标追加进去。

注意：隔离 `cron` 的模型优先级依次为：Gmail-hook 覆盖优先，其次是逐作业
`--model`，然后是任何已存储的 `cron` 会话模型覆盖，最后才是常规的
智能体/默认选择。

注意：隔离 `cron` 的快速模式会遵循已解析的实时模型选择。模型
配置 `params.fastMode` 默认会生效，但已存储会话中的 `fastMode`
覆盖仍然优先于配置。

注意：如果某次隔离运行抛出 `LiveSessionModelSwitchError`，`cron` 会在重试前持久化
切换后的提供商/模型（如果存在，也会持久化切换后的认证配置文件覆盖）。外层重试循环最多进行 2 次模型切换重试（在初始尝试之后），超过后会中止，而不是无限循环。

注意：失败通知会优先使用 `delivery.failureDestination`，然后使用
全局 `cron.failureDestination`，最后如果没有配置显式失败目标，
则回退到该作业的主要 announce 目标。

注意：保留/清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有在当前投递/存储格式之前创建的旧 `cron` 作业，请运行
`openclaw doctor --fix`。Doctor 现在会规范化旧版 `cron` 字段（`jobId`、`schedule.cron`、
顶层投递字段，包括旧版 `threadId`、负载中的 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的
`notify: true` webhook 后备作业迁移为显式 webhook 投递。

## 常见编辑

更新投递设置而不更改消息：

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

`--light-context` 仅适用于隔离的智能体回合作业。对于 `cron` 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集合。

投递归属说明：

- 隔离 `cron` 聊天投递为共享模式。如果聊天路由可用，智能体可以通过
  `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到已解析目标时，后备投递最终回复。`webhook` 会将完成后的负载发布到某个 URL。
  `none` 会禁用运行器的后备投递。

## 常见管理命令

手动运行：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，包括预期的 `cron` 目标、
已解析目标、`message` 工具发送、后备使用情况以及已投递状态。

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

- 隔离作业支持 `delivery.failureDestination`。
- 主会话作业仅在主要
  投递模式为 `webhook` 时，才可使用 `delivery.failureDestination`。
- 如果你没有设置任何失败目标，且该作业已经向某个
  渠道进行 announce，则失败通知会复用同一个 announce 目标。
