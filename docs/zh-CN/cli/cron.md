---
read_when:
    - 你需要定时任务和唤醒功能
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（计划和运行后台任务）'
title: 定时任务
x-i18n:
    generated_at: "2026-07-11T20:24:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令功能。有关概念指南，请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。
</Tip>

<Note>
所有 cron 修改操作（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令载荷直接在 Gateway 网关进程中运行，而不是作为智能体的 `tools.exec` 工具调用执行；`tools.exec.*` 和 Exec 审批仍然约束模型可见的 Exec 工具。
</Note>

## 快速创建作业

`openclaw cron create` 是 `openclaw cron add` 的别名。对于新作业，请先指定计划，再指定提示词：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

如果作业应通过 POST 发送已完成的载荷，而不是投递到聊天目标，请使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

对于在 OpenClaw cron 内运行、无需启动隔离的智能体/模型运行的确定性 shell 风格作业，请使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。如需精确执行 argv，请使用 `--command-argv '["node","scripts/report.mjs"]'`。命令作业会捕获 stdout/stderr，记录常规 cron 历史记录，并通过与隔离作业相同的 `announce`、`webhook` 或 `none` 投递模式路由输出。仅输出 `NO_REPLY` 的命令会被抑制。

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的对话记录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到一个明确的持久会话键。

  </Accordion>
  <Accordion title="Isolated session semantics">
    隔离运行会重置环境对话上下文。渠道和群组路由、发送/队列策略、权限提升、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好设置以及用户明确选择的模型或身份验证覆盖项可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析而来，或者将以故障关闭方式失败。

带提供商前缀的目标可以消除未解析公告渠道的歧义。例如，当省略 `delivery.channel` 或其值为 `last` 时，`to: "telegram:123"` 会选择 Telegram。只有已加载插件公布的前缀才是提供商选择器。如果明确指定了 `delivery.channel`，前缀必须与该渠道匹配；`channel: "whatsapp"` 与 `to: "telegram:123"` 的组合会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍属于渠道所有的目标语法。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 将输出保留在内部。`--deliver` 仍作为 `--announce` 的已弃用别名。
</Note>

### 投递所有权

隔离 cron 的聊天投递由智能体和运行器共同负责：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- 仅当智能体未直接发送到解析后的目标时，`announce` 才会回退投递最终回复。
- `webhook` 将已完成的载荷通过 POST 发送到 URL。
- `none` 禁用运行器的回退投递。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 设置 webhook 投递。不要将 `--webhook` 与 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天投递标志组合使用。

`cron edit <job-id>` 可以使用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消设置各个投递路由字段（每个标志都不能与对应的设置标志组合使用）。`--no-deliver` 仅禁用运行器的回退投递；与之不同，这些标志会删除已存储的字段，使作业重新从默认值解析路由中的相应部分。

`--announce` 是运行器对最终回复的回退投递。`--no-deliver` 会禁用该回退，但当聊天路由可用时，不会移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，以供回退公告投递使用。内部会话键可能使用小写；不要将其作为区分大小写的提供商 ID（例如 Matrix 房间 ID）的事实来源。

### 失败投递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主要公告目标（当前两项均无法解析为具体目标时）。

<Note>
仅当主要投递模式为 `webhook` 时，主会话作业才可使用 `delivery.failureDestination`。隔离作业在所有模式下都可使用它。
</Note>

隔离 cron 运行会将运行级智能体失败视为作业错误，即使没有生成回复载荷也是如此，因此模型/提供商失败仍会增加错误计数器并触发失败通知。

命令 cron 作业不会启动隔离的智能体轮次。退出码为零时记录为 `ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并可触发相同的失败通知路径。

如果隔离运行在第一次模型请求之前超时，`openclaw cron show` 和 `openclaw cron runs` 会包含特定阶段的错误，例如 `setup timed out before runner start`，或包含最后已知启动阶段名称的停滞消息（例如 `context-engine`）。对于由 CLI 支持的提供商，模型前看门狗会持续运行，直到外部 CLI 轮次启动，因此会话查找、钩子、身份验证、提示词和 CLI 设置停滞都会报告为模型前 cron 失败。

## 调度

### 单次作业

`--at <datetime>` 会调度单次运行。没有偏移量的日期时间会被视为 UTC，除非你还传入 `--tz <iana>`；该选项会在指定时区中解释墙上时钟时间。

<Note>
单次作业默认在成功后删除。使用 `--keep-after-run` 保留它们。
</Note>

### 重复作业

重复作业在连续发生错误后使用指数重试退避：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次运行成功后，调度会恢复正常。

跳过的运行与执行错误分开跟踪。它们不会影响重试退避，但可以通过 `openclaw cron edit <job-id> --failure-alert-include-skipped` 让失败警报包含重复的跳过运行通知。

对于以本地已配置模型提供商为目标的隔离作业（基础 URL 位于环回地址、专用网络或 `.local`），cron 会在启动智能体轮次之前执行轻量级提供商预检：在 `/api/tags` 探测 `api: "ollama"` 提供商；在 `/models` 探测其他本地 OpenAI 兼容提供商（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）。如果无法访问端点，该运行会记录为 `skipped`，并在后续调度中重试；每个端点的可访问性结果会缓存 5 分钟，以避免大量面向同一本地服务器的作业通过重复探测对其造成冲击。

Cron 作业、待处理运行时状态和运行历史记录都存储在共享 SQLite 状态数据库中。旧版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 文件会导入一次，并重命名为带有 `.migrated` 后缀的文件。导入后，请使用 `openclaw cron add|edit|remove` 编辑计划，而不要编辑 JSON 文件。

### 手动运行

`openclaw cron run <job-id>` 默认强制运行，并在手动运行进入队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 检查之后的结果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

如果脚本应阻塞，直到该次确切的排队运行记录终止状态，请添加 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 时，CLI 仍会先调用 `cron.run`，然后针对返回的 `runId` 轮询 `cron.runs`。仅当运行以 `ok` 状态结束时，命令才以 `0` 退出。当运行以 `error` 或 `skipped` 结束、Gateway 网关响应不包含 `runId`，或 `--wait-timeout` 到期时（默认为 `10m`，默认每 `2s` 轮询一次），命令会以非零状态退出。`--poll-interval` 必须大于零。

<Note>
如果你希望手动命令仅在作业当前到期时运行，请使用 `--due`。如果 `--due --wait` 未将运行加入队列，命令会返回正常的未运行响应，而不是进行轮询。
</Note>

## Models

`cron add|edit --model <ref>` 为作业选择允许使用的模型。`cron add|edit --fallbacks <list>` 设置每个作业的回退模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；传入 `--fallbacks ""` 可进行不使用回退模型的严格运行。`cron edit <job-id> --clear-fallbacks` 会移除每个作业的回退覆盖项。`cron edit <job-id> --clear-model` 会移除每个作业的模型覆盖项，使作业遵循正常的 cron 模型选择优先级（如果存在已存储的 cron 会话覆盖项则使用它，否则使用智能体/默认模型）；它不能与 `--model` 组合使用。`cron add|edit --thinking <level>` 设置每个作业的思考覆盖项；`cron edit <job-id> --clear-thinking` 会将其移除，使作业遵循正常的 cron 思考优先级，并且不能与 `--thinking` 组合使用。

<Warning>
如果模型不被允许或无法解析，cron 会以明确的验证错误使运行失败，而不会回退到作业的智能体或默认模型选择。
</Warning>

Cron `--model` 是**作业主模型**，而不是聊天会话的 `/model` 覆盖项。这意味着：

- 所选作业模型失败时，已配置的模型回退仍然适用。
- 如果存在每个作业的载荷 `fallbacks`，它会替换已配置的回退列表。
- 空的每个作业回退列表（`--fallbacks ""` 或作业载荷/API 中的 `fallbacks: []`）会使 cron 严格运行。
- 当作业具有 `--model` 但未配置回退列表时，OpenClaw 会传入明确的空回退覆盖项，防止将智能体主模型作为隐藏的重试目标追加。
- 本地提供商预检会遍历已配置的回退模型，然后才将 cron 运行标记为 `skipped`。

`openclaw doctor` 会报告已设置 `payload.model` 的作业，包括提供商命名空间计数以及与 `agents.defaults.model` 不匹配的情况。当实时聊天与计划作业之间的身份验证、提供商或计费行为看起来不同时，请使用此检查。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖项。
2. 每个作业的 `--model`。
3. 已存储的 cron 会话模型覆盖项（当用户选择了一个模型时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 的快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认生效，但已存储的会话 `fastMode` 覆盖项仍优先于配置。当解析后的模式为 `auto` 时，截止时间使用所选模型的 `params.fastAutoOnSeconds` 值，默认值为 60 秒。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化已切换的提供商和模型（以及存在时已切换的身份验证配置文件覆盖项）。外层重试循环最多允许在初次尝试后进行两次切换重试，随后会中止，而不是无限循环。

## 运行输出和拒绝

### 过期确认抑制

隔离 cron 轮次会抑制过期且仅包含确认的回复。如果第一次结果只是临时状态更新，并且没有后代子智能体运行负责生成最终答案，cron 会在投递前重新提示一次以获取实际结果。

### 静默令牌抑制

如果隔离的 cron 运行仅返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和后备的排队摘要路径，因此不会向聊天中发回任何内容。

### 结构化拒绝

隔离的 cron 运行使用嵌入式运行产生的结构化执行拒绝元数据（编码为 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命 Exec 工具错误）作为权威拒绝信号。它们也会识别节点主机以 `UNAVAILABLE` 包装、且嵌套结构化错误携带上述任一代码的情况。

除非嵌入式运行还提供结构化拒绝元数据，否则 cron 不会将最终输出中的文字或看似请求审批的拒绝措辞归类为拒绝，因此普通的智能体文本不会被视为受阻命令。

`cron list` 和运行历史记录会显示拒绝原因，而不是将受阻命令报告为 `ok`。

## 保留策略

保留和清理由配置控制：

- `cron.sessionRetention`（默认为 `24h`，设为 `false` 可禁用）会清理已完成的隔离运行会话。
- `cron.runLog.keepLines`（默认为 `2000`）会按作业清理保留的 SQLite 运行历史记录行。`cron.runLog.maxBytes`（默认为 `2000000`）仍为兼容旧版文件型运行日志而接受；SQLite 清理基于行数。

## 迁移旧作业

<Note>
如果你的 cron 作业创建于当前投递和存储格式之前，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、载荷中的 `provider` 投递别名），并将使用 `notify: true` 的 Webhook 后备作业从 `cron.webhook` 迁移为显式 Webhook 投递。已向聊天发送通知的作业会保留该投递方式，并获得完成 Webhook 目标。未设置 `cron.webhook` 时，对于没有迁移目标的作业，会移除不起作用的顶层 `notify` 标记（现有投递保持不变），因此 `doctor --fix` 不会再持续对其发出警告。
</Note>

## 常见编辑操作

更新投递设置而不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离作业的投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向指定渠道发送通知：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

向 Telegram 论坛主题发送通知：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建使用轻量级引导上下文的隔离作业：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次作业。对于 cron 运行，轻量级模式会将引导上下文保持为空，而不是注入完整的工作区引导内容集。

创建具有精确 argv、cwd、env、stdin 和输出限制的命令作业：

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

默认情况下，`openclaw cron list` 会显示所有匹配的作业。传入 `--agent <id>` 可仅显示有效规范化智能体 ID 匹配的作业；未存储智能体 ID 的作业视为使用已配置的默认智能体。

`openclaw cron get <job-id>` 会直接返回存储的作业 JSON。需要包含投递路由预览的易读视图时，请使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 会在每个作业中包含顶层 `status` 字段，该字段根据 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算得出。可用值为：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。JSON 状态保持规范且不加修饰，以便外部工具无需重新推导即可读取作业状态；易读输出可能会为重复出现的 `error` 状态附加失败次数。

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、解析后的目标、消息工具发送情况、后备路径使用情况和已投递状态。

重新指定智能体和会话：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

在智能体轮次作业中省略 `--agent` 时，`openclaw cron add` 会发出警告，并回退到默认智能体（`main`）。创建时传入 `--agent <id>` 可固定使用特定智能体。

投递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [定时任务](/zh-CN/automation/cron-jobs)
