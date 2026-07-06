---
read_when:
    - 你想要定时任务和唤醒
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度和运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-07-06T10:47:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 任务。

<Tip>
运行 `openclaw cron --help` 查看完整命令面。概念指南见 [Cron jobs](/zh-CN/automation/cron-jobs)。
</Tip>

<Note>
所有 cron 变更（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令载荷运行会直接在 Gateway 网关进程中执行，而不是作为 agent `tools.exec` 工具调用执行；`tools.exec.*` 和 exec 审批仍然控制模型可见的 exec 工具。
</Note>

## 快速创建任务

`openclaw cron create` 是 `openclaw cron add` 的别名。对于新任务，请先放调度表达式，再放提示：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

当任务应通过 POST 发送完成后的载荷，而不是投递到聊天目标时，使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

对于在 OpenClaw cron 内部运行、且不启动隔离 agent/模型运行的确定性 shell 风格任务，使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可进行精确 argv 执行。命令任务会捕获 stdout/stderr，记录常规 cron 历史，并通过与隔离任务相同的 `announce`、`webhook` 或 `none` 投递模式路由输出。只打印 `NO_REPLY` 的命令会被抑制。

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到 agent 的主会话。
    - `isolated` 为每次运行创建新的转录和会话 id。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式的持久会话键。

  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境会话上下文。频道和群组路由、发送/队列策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及显式用户选择的模型或凭证覆盖可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析而来，或者会故障关闭。

带提供商前缀的目标可以消除未解析公告频道的歧义。例如，`to: "telegram:123"` 会在省略 `delivery.channel` 或其为 `last` 时选择 Telegram。只有已加载插件公布的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，则前缀必须匹配该频道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是由频道拥有的目标语法。

<Note>
隔离 `cron add` 任务默认使用 `--announce` 投递。使用 `--no-deliver` 可将输出保留在内部。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 投递所有权

隔离 cron 聊天投递由 agent 和运行器共享：

- 当聊天路由可用时，agent 可以使用 `message` 工具直接发送。
- 只有当 agent 没有直接发送到解析后的目标时，`announce` 才会兜底投递最终回复。
- `webhook` 会将完成后的载荷发布到 URL。
- `none` 会禁用运行器兜底投递。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 设置 webhook 投递。不要将 `--webhook` 与 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天投递标志组合使用。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消设置单个投递路由字段（每个标志在与其对应的设置标志组合时都会被拒绝）。不同于只禁用运行器兜底投递的 `--no-deliver`，这些标志会移除已存储字段，使任务再次从默认值解析该路由部分。

`--announce` 是最终回复的运行器兜底投递。`--no-deliver` 会禁用该兜底，但在聊天路由可用时不会移除 agent 的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，用于兜底公告投递。内部会话键可能是小写；不要把它们作为区分大小写的提供商 ID（例如 Matrix 房间 ID）的事实来源。

### 失败投递

失败通知按以下顺序解析：

1. 任务上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 任务的主要公告目标（当上述两项都未解析到具体目标时）。

<Note>
主会话任务只有在主要投递模式为 `webhook` 时才能使用 `delivery.failureDestination`。隔离任务在所有模式下都接受它。
</Note>

即使没有生成回复载荷，隔离 cron 运行也会把运行级 agent 失败视为任务错误，因此模型/提供商失败仍会递增错误计数器并触发失败通知。

命令 cron 任务不会启动隔离 agent 轮次。退出码为零会记录 `ok`；非零退出、信号、超时或无输出超时会记录 `error`，并可触发相同的失败通知路径。

如果隔离运行在第一次模型请求之前超时，`openclaw cron show` 和 `openclaw cron runs` 会包含阶段特定错误，例如 `setup timed out before runner start`，或包含最后已知启动阶段名称的停滞消息（例如 `context-engine`）。对于 CLI 支持的提供商，模型前看门狗会保持活动，直到外部 CLI 轮次开始，因此会话查找、钩子、凭证、提示和 CLI 设置停滞都会报告为模型前 cron 失败。

## 调度

### 一次性任务

`--at <datetime>` 会调度一次性运行。无偏移量的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，后者会按给定时区解释挂钟时间。

<Note>
一次性任务默认会在成功后删除。使用 `--keep-after-run` 可保留它们。
</Note>

### 周期性任务

周期性任务在连续错误后使用指数重试退避：30s、1m、5m、15m、60m。下一次成功运行后，调度会恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以让失败警报选择加入重复跳过运行通知。

对于面向本地已配置模型提供商（base URL 位于 loopback、私有网络或 `.local`）的隔离任务，cron 会在启动 agent 轮次之前运行轻量级提供商预检：`api: "ollama"` 提供商会探测 `/api/tags`；其他本地 OpenAI 兼容提供商（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）会探测 `/models`。如果端点不可达，该运行会被记录为 `skipped`，并在后续调度中重试；可达性结果会按端点缓存 5 分钟，因此面向同一本地服务器的大量任务不会用重复探测反复冲击它。

Cron 任务、待处理运行时状态和运行历史位于共享 SQLite 状态数据库中。旧版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 文件会被导入一次，并以 `.migrated` 后缀重命名。导入后，请使用 `openclaw cron add|edit|remove` 编辑调度，而不是编辑 JSON 文件。

### 手动运行

`openclaw cron run <job-id>` 默认会强制运行，并在手动运行排队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 检查后续结果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

当脚本应阻塞直到该精确排队运行记录终止状态时，添加 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 时，CLI 仍会先调用 `cron.run`，然后轮询 `cron.runs` 以查找返回的 `runId`。只有当运行以 `ok` 状态完成时，命令才以 `0` 退出。当运行以 `error` 或 `skipped` 完成、Gateway 网关响应不包含 `runId`，或 `--wait-timeout` 过期时，命令会以非零退出（默认 `10m`，默认每 `2s` 轮询一次）。`--poll-interval` 必须大于零。

<Note>
当你希望手动命令仅在任务当前到期时运行，请使用 `--due`。如果 `--due --wait` 没有排队运行，命令会返回正常的非运行响应，而不是轮询。
</Note>

## Models

`cron add|edit --model <ref>` 为任务选择允许的模型。`cron add|edit --fallbacks <list>` 设置每任务 fallback 模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；传入 `--fallbacks ""` 可进行没有 fallback 的严格运行。`cron edit <job-id> --clear-fallbacks` 会移除每任务 fallback 覆盖。`cron edit <job-id> --clear-model` 会移除每任务模型覆盖，使任务遵循正常 cron 模型选择优先级（如果存在则使用已存储的 cron 会话覆盖，否则使用 agent/默认模型）；它不能与 `--model` 组合。`cron add|edit --thinking <level>` 设置每任务 thinking 覆盖；`cron edit <job-id> --clear-thinking` 会移除它，使任务遵循正常 cron thinking 优先级，并且它不能与 `--thinking` 组合。

<Warning>
如果模型不被允许或无法解析，cron 会以显式验证错误使运行失败，而不是 fallback 到任务的 agent 或默认模型选择。
</Warning>

Cron `--model` 是**任务主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 当所选任务模型失败时，已配置的模型 fallback 仍会适用。
- 每任务载荷 `fallbacks` 在存在时会替换已配置的 fallback 列表。
- 空的每任务 fallback 列表（任务载荷/API 中的 `--fallbacks ""` 或 `fallbacks: []`）会使 cron 运行变为严格模式。
- 当任务有 `--model` 但未配置 fallback 列表时，OpenClaw 会传递显式的空 fallback 覆盖，因此 agent 主模型不会作为隐藏重试目标追加。
- 本地提供商预检会先遍历已配置的 fallback，然后才将 cron 运行标记为 `skipped`。

`openclaw doctor` 会报告已经设置了 `payload.model` 的任务，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配项。当凭证、提供商或计费行为在实时聊天和调度任务之间看起来不同时，请使用该检查。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖。
2. 每任务 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择了一个模型时）。
4. Agent 或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认适用，但已存储的会话 `fastMode` 覆盖仍优先于配置。当解析后的模式为 `auto` 时，截止值使用所选模型的 `params.fastAutoOnSeconds` 值，默认为 60 秒。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试之前为活动运行持久化已切换的提供商和模型（以及存在时的已切换凭证配置覆盖）。外层重试循环限制为初始尝试后最多两次切换重试，之后会中止，而不是无限循环。

## 运行输出和拒绝

### 过期确认抑制

隔离 cron 轮次会抑制过期的仅确认回复。如果第一个结果只是临时状态更新，并且没有后代子 agent 运行负责最终答案，cron 会在投递前重新提示一次以获取真实结果。

### 静默令牌抑制

如果一次隔离 cron 运行只返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和后备排队摘要路径，因此不会向聊天回发任何内容。

### 结构化拒绝

隔离 cron 运行使用嵌入式运行中的结构化执行拒绝元数据（编码为 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命 exec 工具错误）作为权威拒绝信号。它们也会识别节点主机对嵌套结构化错误的 `UNAVAILABLE` 包装，只要该嵌套错误携带这些代码之一。

除非嵌入式运行也提供结构化拒绝元数据，否则 cron 不会把最终输出文本或看似审批拒绝的措辞分类为拒绝，因此普通助手文本不会被视为被阻止的命令。

`cron list` 和运行历史会显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`，或设为 `false` 以禁用）会修剪已完成的隔离运行会话。
- `cron.runLog.keepLines`（默认 `2000`）会按任务修剪保留的 SQLite 运行历史行。`cron.runLog.maxBytes`（默认 `2000000`）仍会被接受，以兼容较旧的文件型运行日志；SQLite 修剪基于行数。

## 迁移旧任务

<Note>
如果你有来自当前投递和存储格式之前的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、载荷 `provider` 投递别名），并将 `notify: true` Webhook 后备任务从 `cron.webhook` 迁移到显式 Webhook 投递。已经向聊天公告的任务会保留该投递，并获得一个完成 Webhook 目标。当 `cron.webhook` 未设置时，对于没有迁移目标的任务，惰性的顶层 `notify` 标记会被移除（现有投递会原样保留），因此 `doctor --fix` 不再持续对它们重复警告。
</Note>

## 常见编辑

在不更改消息的情况下更新投递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离任务禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道公告：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

向 Telegram 论坛话题公告：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建带轻量级引导上下文的隔离任务：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离智能体轮次任务。对于 cron 运行，轻量级模式会让引导上下文保持为空，而不是注入完整的工作区引导集合。

创建带精确 argv、cwd、env、stdin 和输出限制的命令任务：

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

## 常用管理命令

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

`openclaw cron list` 默认显示所有匹配的任务。传入 `--agent <id>` 可仅显示有效规范化智能体 ID 匹配的任务；没有存储智能体 ID 的任务会计为配置的默认智能体。

`openclaw cron get <job-id>` 会直接返回存储的任务 JSON。当你需要带投递路由预览的可读视图时，请使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 会在每个任务上包含一个顶层 `status` 字段，该字段根据 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算得出。取值：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 状态保持规范且无修饰，以便外部工具无需重新推导即可读取任务状态；人工输出可能会用失败计数修饰重复的 `error` 状态。

`cron runs` 条目包含投递诊断信息，包括预期 cron 目标、解析后的目标、消息工具发送、后备使用情况和已投递状态。

智能体和会话重定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

在智能体轮次任务上省略 `--agent` 时，`openclaw cron add` 会发出警告，并回退到默认智能体（`main`）。在创建时传入 `--agent <id>` 可固定到特定智能体。

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
