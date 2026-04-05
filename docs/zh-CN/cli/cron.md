---
read_when:
    - 你想使用定时任务和唤醒机制
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台任务）'
title: cron
x-i18n:
    generated_at: "2026-04-05T08:19:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 任务。

相关内容：

- Cron 任务：[Cron jobs](/automation/cron-jobs)

提示：运行 `openclaw cron --help` 可查看完整命令界面。

说明：隔离的 `cron add` 任务默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留在内部。`--deliver` 仍保留为 `--announce` 的已弃用别名。

说明：由 cron 拥有的隔离运行预期返回纯文本摘要，并且最终发送路径由运行器负责。`--no-deliver` 会将运行保留在内部；它不会把投递控制交还给智能体的消息工具。

说明：一次性（`--at`）任务默认在成功后删除。使用 `--keep-after-run` 可保留它们。

说明：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。
使用 `current` 可在创建时绑定到当前活动会话，或使用 `session:<id>` 指定一个显式的持久会话键。

说明：对于一次性的 CLI 任务，不带时区偏移的 `--at` 日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，这样会按给定时区中的本地墙上时间解释它。

说明：循环任务现在会在连续错误后使用指数退避重试（30s → 1m → 5m → 15m → 60m），并在下一次成功运行后恢复正常调度。

说明：`openclaw cron run` 现在会在手动运行已排队执行后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

说明：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留旧的“仅在到期时运行”行为。

说明：隔离的 cron 回合会抑制过时的、仅用于确认的回复。如果第一个结果只是中间状态更新，并且没有任何后代子智能体运行负责给出最终答案，cron 会在投递前再次提示一次以获取真实结果。

说明：如果隔离的 cron 运行只返回静默令牌（`NO_REPLY` / `no_reply`），cron 会同时抑制直接对外投递和回退的排队摘要路径，因此不会向聊天回发任何内容。

说明：`cron add|edit --model ...` 会为该任务使用所选且被允许的模型。如果该模型不被允许，cron 会发出警告，并回退到任务的智能体/默认模型选择。已配置的回退链仍然适用，但仅使用普通模型覆盖且没有显式的每任务回退列表时，不会再把智能体主模型作为隐藏的额外重试目标附加进去。

说明：隔离的 cron 模型优先级为：先 Gmail-hook 覆盖，然后每任务 `--model`，再然后任何已存储的 cron 会话模型覆盖，最后才是正常的智能体/默认选择。

说明：隔离的 cron 快速模式会遵循已解析的实时模型选择。模型配置 `params.fastMode` 默认生效，但已存储的会话 `fastMode` 覆盖仍然优先于配置。

说明：如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前持久化切换后的 provider/model（以及存在时切换后的 auth 配置文件覆盖）。外层重试循环限制为初始尝试之后最多 2 次切换重试，之后会中止，而不是无限循环。

说明：失败通知会优先使用 `delivery.failureDestination`，然后是全局 `cron.failureDestination`，最后在未配置显式失败目标时回退到任务的主 announce 目标。

说明：保留/清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有早于当前投递/存储格式的旧 cron 任务，请运行 `openclaw doctor --fix`。Doctor 现在会标准化旧版 cron 字段（`jobId`、`schedule.cron`、顶层 delivery 字段，包括旧版 `threadId`、payload `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 回退任务迁移为显式 webhook 投递。

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离任务禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级 bootstrap 上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建带有轻量级 bootstrap 上下文的隔离任务：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体回合任务。对于 cron 运行，轻量模式会保持 bootstrap 上下文为空，而不是注入完整的工作区 bootstrap 集合。

投递归属说明：

- 由 cron 拥有的隔离任务始终会通过 cron 运行器处理最终的用户可见投递（`announce`、`webhook` 或仅内部的 `none`）。
- 如果任务提到要给某个外部收件人发消息，智能体应在结果中描述预期目标，而不是尝试直接发送。

## 常见管理命令

手动运行：

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

智能体/会话重定向：

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

- 隔离任务支持 `delivery.failureDestination`。
- 主会话任务仅在主投递模式为 `webhook` 时才可使用 `delivery.failureDestination`。
- 如果你未设置任何失败目标，而任务本身已经向某个渠道 announce，则失败通知会复用同一个 announce 目标。
