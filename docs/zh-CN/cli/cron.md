---
read_when:
    - 你想要定时任务和唤醒
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: Cron 定时任务
x-i18n:
    generated_at: "2026-06-27T01:36:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。概念指南见 [Cron jobs](/zh-CN/automation/cron-jobs)。
</Tip>

## 快速创建作业

`openclaw cron create` 是 `openclaw cron add` 的别名。对于新作业，把计划时间放在前面，把提示词放在后面：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

当作业应 POST 完成后的载荷而不是投递到聊天目标时，使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

对于应在 OpenClaw cron 内运行、且不启动隔离智能体/模型运行的确定性 shell 风格作业，使用 `--command`：

<Note>
命令 cron 作业是由管理员编写的 Gateway 网关自动化。创建、编辑、
移除或手动运行它们需要 `operator.admin`；之后的计划运行
会在 Gateway 网关进程中执行，而不是作为智能体 `tools.exec` 工具调用执行。
`tools.exec.*` 和 exec 审批仍然约束模型可见的 exec 工具。
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 进行精确的 argv 执行。命令作业会捕获 stdout/stderr、记录普通 cron 历史，并通过与隔离作业相同的 `announce`、`webhook` 或 `none` 投递模式路由输出。仅打印 `NO_REPLY` 的命令会被抑制。

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的转录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久会话键。

  </Accordion>
  <Accordion title="Isolated session semantics">
    隔离运行会重置环境对话上下文。频道和群组路由、发送/队列策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好和用户显式选择的模型或凭证覆盖可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示该路由是从主会话还是当前会话解析而来，或者会失败关闭。

带提供商前缀的目标可以消除未解析 announce 频道的歧义。例如，`to: "telegram:123"` 会在省略 `delivery.channel` 或其为 `last` 时选择 Telegram。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，前缀必须匹配该频道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是频道拥有的目标语法。

<Note>
隔离 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 将输出保留为内部输出。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 投递所有权

隔离 cron 聊天投递由智能体和 runner 共同负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 只有当智能体没有直接发送到解析后的目标时，`announce` 才会回退投递最终回复。
- `webhook` 会将完成后的载荷发布到 URL。
- `none` 会禁用 runner 回退投递。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 设置 webhook 投递。不要将 `--webhook` 与聊天投递标志组合使用，例如 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account`。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消设置单个投递路由字段（每个标志与其匹配的设置标志组合时都会被拒绝）。与仅禁用 runner 回退投递的 `--no-deliver` 不同，这些标志会移除已存储字段，让作业重新从默认值解析该部分路由。

`--announce` 是最终回复的 runner 回退投递。`--no-deliver` 会禁用该回退，但在聊天路由可用时不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，用于回退 announce 投递。内部会话键可能是小写；不要把它们用作区分大小写的提供商 ID（例如 Matrix 房间 ID）的事实来源。

### 失败投递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主 announce 目标（未设置显式失败目标时）。

<Note>
主会话作业只有在主投递模式为 `webhook` 时才能使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行会将运行级智能体失败视为作业错误，即使
没有生成回复载荷也是如此，因此模型/提供商失败仍会递增错误
计数器并触发失败通知。

命令 cron 作业不会启动隔离智能体轮次。零退出码会记录为
`ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并且
可以触发同一条失败通知路径。

如果隔离运行在第一次模型请求前超时，`openclaw cron show`
和 `openclaw cron runs` 会包含阶段特定错误，例如
`setup timed out before runner start` 或
`stalled before first model call (last phase: context-engine)`。
对于 CLI 后端的提供商，模型前 watchdog 会保持活跃直到外部
CLI 轮次开始，因此会话查找、钩子、凭证、提示词和 CLI 设置卡住
都会报告为模型前 cron 失败。

## 调度

### 一次性作业

`--at <datetime>` 会计划一次性运行。无偏移的日期时间会按 UTC 处理，除非你同时传入 `--tz <iana>`，这会按给定时区解释挂钟时间。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 保留它们。
</Note>

### 周期性作业

周期性作业会在连续错误后使用指数重试退避：30s、1m、5m、15m、60m。下一次成功运行后，计划会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以选择让失败提醒包含重复的跳过运行通知。

对于以本地已配置模型提供商为目标的隔离作业，cron 会在启动智能体轮次前运行轻量级提供商预检。local loopback、私有网络和 `.local` 的 `api: "ollama"` 提供商会在 `/api/tags` 上探测；本地 OpenAI 兼容提供商（例如 vLLM、SGLang 和 LM Studio）会在 `/models` 上探测。如果端点不可达，运行会记录为 `skipped` 并在之后的计划中重试；匹配的失效端点会缓存 5 分钟，以避免大量作业反复冲击同一个本地服务器。

注意：cron 作业、待处理运行时状态和运行历史位于共享 SQLite 状态数据库中。旧版 `jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件会导入一次，并用 `.migrated` 后缀重命名。导入后，请使用 `openclaw cron add|edit|remove` 编辑计划，而不是编辑 JSON 文件。

### 手动运行

`openclaw cron run <job-id>` 默认强制运行，并在手动运行入队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 检查之后的结果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

当脚本应阻塞直到该精确入队运行记录终止状态时，添加 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 时，CLI 仍会先调用 `cron.run`，然后轮询 `cron.runs` 以获取返回的 `runId`。只有当运行以状态 `ok` 完成时，命令才会以 `0` 退出。当运行以 `error` 或 `skipped` 完成、Gateway 网关响应不包含 `runId`，或 `--wait-timeout` 到期时，它会以非零退出。`--poll-interval` 必须大于零。

<Note>
当你希望手动命令仅在作业当前到期时运行，请使用 `--due`。如果 `--due --wait` 没有入队运行，命令会返回普通的非运行响应，而不是轮询。
</Note>

## Models

`cron add|edit --model <ref>` 为作业选择允许的模型。`cron add|edit --fallbacks <list>` 设置每作业回退模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；传入 `--fallbacks ""` 可进行无回退的严格运行。`cron edit <job-id> --clear-fallbacks` 会移除每作业回退覆盖。`cron edit <job-id> --clear-model` 会移除每作业模型覆盖，让作业遵循普通 cron 模型选择优先级（如果存在已存储的 cron 会话覆盖则使用它，否则使用智能体/默认模型）；它不能与 `--model` 组合使用。

<Warning>
如果模型不被允许或无法解析，cron 会以显式验证错误让运行失败，而不是回退到作业的智能体或默认模型选择。
</Warning>

Cron `--model` 是**作业主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 所选作业模型失败时，已配置模型回退仍然适用。
- 存在每作业载荷 `fallbacks` 时，它会替换已配置的回退列表。
- 空的每作业回退列表（作业载荷/API 中的 `--fallbacks ""` 或 `fallbacks: []`）会让 cron 运行变为严格模式。
- 当作业有 `--model` 但未配置回退列表时，OpenClaw 会传入显式空回退覆盖，因此智能体主模型不会作为隐藏重试目标被追加。
- 本地提供商预检会先遍历已配置回退，然后才将 cron 运行标记为 `skipped`。

`openclaw doctor` 会报告已经设置 `payload.model` 的作业，包括提供商命名空间计数，以及与 `agents.defaults.model` 的不匹配项。当凭证、提供商或计费行为在实时聊天和计划作业之间看起来不同时，请使用该检查。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖。
2. 每作业 `--model`。
3. 已存储的 cron 会话模型覆盖（用户已选择时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。默认应用模型配置 `params.fastMode`，但已存储的会话 `fastMode` 覆盖仍优先于配置。当解析后的模式为 `auto` 时，截断值使用所选模型的 `params.fastAutoOnSeconds` 值，默认 60 秒。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化切换后的提供商和模型（以及存在时的切换后凭证配置覆盖）。外层重试循环在初始尝试后最多允许两次切换重试，随后中止而不是无限循环。

## 运行输出和拒绝

### 过期确认抑制

隔离 cron 轮次会抑制过期的仅确认回复。如果第一个结果只是临时状态更新，且没有后代子智能体运行负责最终答案，cron 会在投递前重新提示一次以获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行仅返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和回退排队摘要路径，因此不会向聊天发布任何内容。

### 结构化拒绝

隔离 cron 运行会使用嵌入运行中的结构化执行拒绝元数据作为权威拒绝信号。当嵌套的结构化错误消息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 开头时，它们也会遵循 node-host `UNAVAILABLE` 包装。

除非嵌入运行同时提供结构化拒绝元数据，否则 cron 不会将最终输出文本或看似审批拒绝的短语归类为拒绝，因此普通智能体文本不会被视为被阻止的命令。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）会清理已完成的隔离运行会话。
- `cron.runLog.keepLines` 会按任务清理保留的 SQLite 运行历史行。`cron.runLog.maxBytes` 仍会被接受，以兼容较旧的基于文件的运行日志。

## 迁移较旧的任务

<Note>
如果你有当前投递和存储格式之前的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、包含旧版 `threadId` 的顶层投递字段、payload `provider` 投递别名），并将 `notify: true` webhook 兜底任务从 `cron.webhook` 迁移到显式 webhook 投递。已经通知到聊天的任务会保留该投递，并获得一个完成 webhook 目标。当 `cron.webhook` 未设置时，没有迁移目标的任务会移除无效的顶层 `notify` 标记（现有投递保持不变），因此 `doctor --fix` 不再持续对它们重新发出警告。
</Note>

## 常见编辑

更新投递设置而不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离任务禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级启动上下文：

```bash
openclaw cron edit <job-id> --light-context
```

通知到特定渠道：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

通知到 Telegram 论坛话题：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建带有轻量级启动上下文的隔离任务：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次任务。对于 cron 运行，轻量级模式会保持启动上下文为空，而不是注入完整的工作区启动集合。

创建带有精确 argv、cwd、env、stdin 和输出限制的命令任务：

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## 常见管理员命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` 默认显示所有匹配的任务。传入 `--agent <id>` 只显示其有效规范化智能体 id 匹配的任务；没有存储智能体 id 的任务会计为已配置的默认智能体。

`openclaw cron get <job-id>` 会直接返回存储的任务 JSON。当你需要包含投递路由预览的人类可读视图时，请使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 会在每个任务上包含顶层 `status` 字段，该字段根据 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算。取值：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。这会镜像人类可读的状态列，因此外部工具可以读取任务状态，而无需重新推导。

`cron runs` 条目包含投递诊断，其中包括预期的 cron 目标、解析后的目标、消息工具发送、兜底使用情况和已投递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

当智能体轮次任务省略 `--agent` 时，`openclaw cron add` 会发出警告，并回退到默认智能体（`main`）。在创建时传入 `--agent <id>` 可固定到特定智能体。

投递微调：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
