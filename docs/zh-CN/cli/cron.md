---
read_when:
    - 你想要计划任务和唤醒功能
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-04-25T05:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

相关内容：

- Cron 作业：[Cron 作业](/zh-CN/automation/cron-jobs)

提示：运行 `openclaw cron --help` 可查看完整命令范围。

注意：`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示该路由是从主/当前会话解析得出，还是会以失败关闭。

注意：独立的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保持为内部可见。`--deliver` 仍然保留为 `--announce` 的已弃用别名。

注意：独立 cron 聊天投递是共享的。`--announce` 是用于最终回复的运行器后备投递；`--no-deliver` 会禁用该后备方式，但当聊天路由可用时，不会移除智能体的 `message` 工具。

注意：一次性（`--at`）作业默认在成功后删除。使用 `--keep-after-run` 可在运行后保留它们。

注意：`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。使用 `current` 可在创建时绑定到当前活动会话，或使用 `session:<id>` 指定一个显式的持久会话键。

注意：`--session isolated` 会为每次运行创建一个新的转录/会话 id。安全偏好设置和用户显式选择的模型/认证覆盖项可以继承，但环境中的对话上下文不会继承：渠道/群组路由、发送/排队策略、权限提升、来源和 ACP 运行时绑定都会为新的独立运行重置。

注意：对于一次性的 CLI 作业，无偏移量的 `--at` 日期时间默认按 UTC 处理，除非你同时传入 `--tz <iana>`，此时会将该本地墙钟时间按给定时区解释。

注意：循环作业现在会在连续错误后使用指数退避重试（30 秒 → 1 分钟 → 5 分钟 → 15 分钟 → 60 分钟），并在下一次成功运行后恢复正常调度。

注意：`openclaw cron run` 现在会在手动运行被加入执行队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 可跟踪最终结果。

注意：`openclaw cron run <job-id>` 默认会强制运行。使用 `--due` 可保留较早的“仅在到期时运行”行为。

注意：独立 cron 轮次会抑制过时的、仅确认性质的回复。如果第一个结果只是中间状态更新，并且没有后代子智能体运行负责给出最终答案，cron 会再提示一次以获取真实结果后再投递。

注意：如果独立 cron 运行只返回静默令牌（`NO_REPLY` / `no_reply`），cron 会同时抑制直接对外投递和后备排队摘要路径，因此不会向聊天回发任何内容。

注意：`cron add|edit --model ...` 会为该作业使用所选的允许模型。如果该模型不被允许，cron 会发出警告，并回退到该作业的智能体/默认模型选择。已配置的回退链仍然适用，但如果只是普通模型覆盖且没有显式的每作业回退列表，就不会再把智能体主模型作为隐藏的额外重试目标附加进去。

注意：独立 cron 的模型优先级依次为：先 Gmail-hook 覆盖，然后是每作业的 `--model`，再然后是任何用户选择并存储的 cron 会话模型覆盖，最后才是常规的智能体/默认选择。

注意：独立 cron 快速模式遵循已解析的实时模型选择。模型配置 `params.fastMode` 默认生效，但已存储的会话 `fastMode` 覆盖仍然优先于配置。

注意：如果独立运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为当前运行持久化切换后的 provider/模型（以及存在时切换后的认证配置覆盖）。外层重试循环限制为初始尝试后的 2 次切换重试，之后会中止，而不是无限循环。

注意：失败通知会优先使用 `delivery.failureDestination`，其次使用全局 `cron.failureDestination`，最后在未配置显式失败目标时回退到作业的主 announce 目标。

注意：保留/清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的独立运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有早于当前投递/存储格式的旧 cron 作业，请运行 `openclaw doctor --fix`。Doctor 现在会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、负载中的 `provider` 投递别名），并在配置了 `cron.webhook` 时，将简单的 `notify: true` webhook 后备作业迁移为显式 webhook 投递。

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为独立作业禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为独立作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道 announce：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建一个带轻量级引导上下文的独立作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于独立智能体轮次作业。对于 cron 运行，轻量模式会保持引导上下文为空，而不是注入完整的工作区引导集。

投递归属说明：

- 独立 cron 聊天投递是共享的。当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到已解析目标时，后备投递最终回复。`webhook` 会将完成后的负载发布到某个 URL。`none` 会禁用运行器后备投递。

## 常见管理命令

手动运行：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包含投递诊断信息，其中包括预期的 cron 目标、已解析的目标、message-tool 发送、后备使用情况以及已投递状态。

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

- `delivery.failureDestination` 支持用于独立作业。
- 主会话作业仅在主投递模式为 `webhook` 时，才能使用 `delivery.failureDestination`。
- 如果你未设置任何失败目标，并且该作业已经向某个渠道 announce，失败通知会复用同一个 announce 目标。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [计划任务](/zh-CN/automation/cron-jobs)
