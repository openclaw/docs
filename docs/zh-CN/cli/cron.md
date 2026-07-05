---
read_when:
    - 你需要定时作业和唤醒
    - 你正在调试 cron 执行和日志
summary: '`openclaw cron` 的 CLI 参考（调度并运行后台作业）'
title: Cron
x-i18n:
    generated_at: "2026-07-05T11:06:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c759d15a6abac04ccb5de852a14a4a985895886b6dbc29717ede7e83f9dcb75a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整命令范围。概念指南见 [Cron 作业](/zh-CN/automation/cron-jobs)。
</Tip>

<Note>
所有 cron 变更（`add`/`create`、`update`/`edit`、`remove`、`run`）都需要 `operator.admin`。命令负载运行会直接在 Gateway 网关进程中执行，而不是作为智能体 `tools.exec` 工具调用执行；`tools.exec.*` 和 Exec 审批仍然约束模型可见的 Exec 工具。
</Note>

## 快速创建作业

`openclaw cron create` 是 `openclaw cron add` 的别名。对于新作业，请将计划放在第一位，将提示放在第二位：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

当作业应 POST 完成后的负载而不是投递到聊天目标时，使用 `--webhook <url>`：

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

对于在 OpenClaw cron 内运行、无需启动隔离智能体/模型运行的确定性 shell 风格作业，使用 `--command`：

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 进行精确 argv 执行。命令作业会捕获 stdout/stderr、记录正常的 cron 历史，并通过与隔离作业相同的 `announce`、`webhook` 或 `none` 投递模式路由输出。仅打印 `NO_REPLY` 的命令会被抑制。

## 会话

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="会话键">
    - `main` 绑定到智能体的主会话。
    - `isolated` 为每次运行创建新的转录和会话 ID。
    - `current` 绑定到创建时的活动会话。
    - `session:<id>` 固定到显式持久会话键。

  </Accordion>
  <Accordion title="隔离会话语义">
    隔离运行会重置环境对话上下文。频道和群组路由、发送/队列策略、提权、来源以及 ACP 运行时绑定都会为新运行重置。安全偏好以及用户显式选择的模型或凭证覆盖可以跨运行保留。
  </Accordion>
</AccordionGroup>

## 投递

`openclaw cron list` 和 `openclaw cron show <job-id>` 会预览解析后的投递路由。对于 `channel: "last"`，预览会显示路由是从主会话还是当前会话解析而来，或者会失败关闭。

带提供商前缀的目标可以消除未解析 announce 渠道的歧义。例如，`to: "telegram:123"` 会在省略 `delivery.channel` 或其为 `last` 时选择 Telegram。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，则前缀必须匹配该渠道；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是渠道拥有的目标语法。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 投递。使用 `--no-deliver` 将输出保留在内部。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### 投递所有权

隔离 cron 聊天投递由智能体和运行器共享：

- 当聊天路由可用时，智能体可以使用 `message` 工具直接发送。
- `announce` 仅在智能体未直接发送到解析目标时，回退投递最终回复。
- `webhook` 将完成后的负载发布到 URL。
- `none` 禁用运行器回退投递。

使用 `cron add|create --webhook <url>` 或 `cron edit <job-id> --webhook <url>` 设置 webhook 投递。不要将 `--webhook` 与聊天投递标志（如 `--announce`、`--no-deliver`、`--channel`、`--to`、`--thread-id` 或 `--account`）组合使用。

`cron edit <job-id>` 可以用 `--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 取消设置单个投递路由字段（每个标志与其匹配的设置标志组合使用时都会被拒绝）。不同于仅禁用运行器回退投递的 `--no-deliver`，这些标志会移除已存储字段，使作业重新从默认值解析该路由部分。

`--announce` 是最终回复的运行器回退投递。`--no-deliver` 会禁用该回退，但不会在聊天路由可用时移除智能体的 `message` 工具。

从活动聊天创建的提醒会保留实时聊天投递目标，用于回退 announce 投递。内部会话键可能是小写；不要将它们作为 Matrix 房间 ID 等大小写敏感提供商 ID 的事实来源。

### 失败投递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主 announce 目标（当前两者都无法解析为具体目标时）。

<Note>
主会话作业仅在主投递模式为 `webhook` 时才可以使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

即使没有生成回复负载，隔离 cron 运行也会将运行级智能体失败视为作业错误，因此模型/提供商失败仍会递增错误计数器并触发失败通知。

命令 cron 作业不会启动隔离智能体轮次。零退出码记录为 `ok`；非零退出、信号、超时或无输出超时记录为 `error`，并可触发相同的失败通知路径。

如果隔离运行在第一次模型请求前超时，`openclaw cron show` 和 `openclaw cron runs` 会包含阶段特定错误，例如 `setup timed out before runner start`，或包含最后已知启动阶段名称的停滞消息（例如 `context-engine`）。对于 CLI 支持的提供商，预模型看门狗会保持活动状态，直到外部 CLI 轮次开始，因此会话查找、钩子、凭证、提示和 CLI 设置停滞会作为预模型 cron 失败报告。

## 调度

### 一次性作业

`--at <datetime>` 会调度一次性运行。无偏移的日期时间会被视为 UTC，除非你同时传入 `--tz <iana>`，此时会按给定时区解释墙钟时间。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 保留它们。
</Note>

### 周期性作业

周期性作业在连续错误后使用指数重试退避：30 秒、1 分钟、5 分钟、15 分钟、60 分钟。下一次成功运行后，计划恢复正常。

跳过的运行会与执行错误分开跟踪。它们不会影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以让失败提醒包含重复的跳过运行通知。

对于以本地已配置模型提供商为目标的隔离作业（base URL 位于 loopback、私有网络或 `.local`），cron 会在启动智能体轮次前运行轻量级提供商预检：`api: "ollama"` 提供商会在 `/api/tags` 探测；其他本地 OpenAI 兼容提供商（`api: "openai-completions"`，例如 vLLM、SGLang、LM Studio）会在 `/models` 探测。如果端点不可达，运行会记录为 `skipped` 并在后续计划中重试；可达性结果会按端点缓存 5 分钟，因此针对同一本地服务器的多个作业不会用重复探测造成冲击。

Cron 作业、待处理运行时状态和运行历史位于共享 SQLite 状态数据库中。旧版 `jobs.json`、`<name>-state.json` 和 `runs/*.jsonl` 文件会被导入一次，并重命名为带 `.migrated` 后缀的文件。导入后，请使用 `openclaw cron add|edit|remove` 编辑计划，而不是编辑 JSON 文件。

### 手动运行

`openclaw cron run <job-id>` 默认强制运行，并在手动运行入队后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用返回的 `runId` 检查后续结果：

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

当脚本应阻塞直到该精确入队运行记录终止状态时，添加 `--wait`：

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

使用 `--wait` 时，CLI 仍会先调用 `cron.run`，然后轮询 `cron.runs` 以获取返回的 `runId`。仅当运行以 `ok` 状态完成时，命令才以 `0` 退出。当运行以 `error` 或 `skipped` 完成、Gateway 网关响应不包含 `runId`，或 `--wait-timeout` 到期时，命令会以非零退出（默认 `10m`，默认每 `2s` 轮询一次）。`--poll-interval` 必须大于零。

<Note>
当你希望手动命令仅在作业当前到期时运行，请使用 `--due`。如果 `--due --wait` 未入队运行，命令会返回正常的非运行响应，而不是进行轮询。
</Note>

## Models

`cron add|edit --model <ref>` 为作业选择允许的模型。`cron add|edit --fallbacks <list>` 设置每个作业的回退模型，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`；传入 `--fallbacks ""` 可进行无回退的严格运行。`cron edit <job-id> --clear-fallbacks` 会移除每个作业的回退覆盖。`cron edit <job-id> --clear-model` 会移除每个作业的模型覆盖，使作业遵循正常的 cron 模型选择优先级（如果存在则使用已存储的 cron 会话覆盖，否则使用智能体/默认模型）；它不能与 `--model` 组合使用。`cron add|edit --thinking <level>` 设置每个作业的 thinking 覆盖；`cron edit <job-id> --clear-thinking` 会移除它，使作业遵循正常的 cron thinking 优先级，且不能与 `--thinking` 组合使用。

<Warning>
如果模型不被允许或无法解析，cron 会以显式验证错误使运行失败，而不是回退到作业的智能体或默认模型选择。
</Warning>

Cron `--model` 是**作业主模型**，不是聊天会话 `/model` 覆盖。这意味着：

- 当所选作业模型失败时，已配置的模型回退仍会适用。
- 如果存在每个作业负载 `fallbacks`，它会替换已配置的回退列表。
- 空的每个作业回退列表（作业负载/API 中的 `--fallbacks ""` 或 `fallbacks: []`）会使 cron 运行严格执行。
- 当作业有 `--model` 但未配置回退列表时，OpenClaw 会传递显式空回退覆盖，因此智能体主模型不会作为隐藏重试目标追加。
- 本地提供商预检会遍历已配置的回退，然后再将 cron 运行标记为 `skipped`。

`openclaw doctor` 会报告已经设置了 `payload.model` 的作业，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配项。当凭证、提供商或计费行为在实时聊天和计划作业之间看起来不同时，请使用该检查。

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail 钩子覆盖。
2. 每个作业的 `--model`。
3. 已存储的 cron 会话模型覆盖（当用户选择了模型时）。
4. 智能体或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循解析后的实时模型选择。模型配置 `params.fastMode` 默认适用，但已存储会话的 `fastMode` 覆盖仍优先于配置。当解析模式为 `auto` 时，截止时间使用所选模型的 `params.fastAutoOnSeconds` 值，默认为 60 秒。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 会在重试前为活动运行持久化切换后的提供商和模型（以及存在时的切换后凭证配置文件覆盖）。外层重试循环限制为初次尝试后的两次切换重试，随后会中止而不是无限循环。

## 运行输出和拒绝

### 陈旧确认抑制

隔离 cron 轮次会抑制陈旧的仅确认回复。如果第一个结果只是临时状态更新，且没有后代子智能体运行负责最终答案，cron 会在投递前重新提示一次以获取真实结果。

### 静默 token 抑制

如果隔离 cron 运行只返回静默 token（`NO_REPLY` 或 `no_reply`），cron 会同时抑制直接出站投递和回退的排队摘要路径，因此不会向聊天发回任何内容。

### 结构化拒绝

隔离 cron 运行使用嵌入式运行中的结构化执行拒绝元数据（编码为 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 的致命 exec-tool 错误）作为权威拒绝信号。它们也会识别节点主机围绕嵌套结构化错误的 `UNAVAILABLE` 包装，只要该嵌套错误携带其中一个代码。

cron 不会将最终输出的 prose 或看起来像审批拒绝的短语归类为拒绝，除非嵌入式运行也提供结构化拒绝元数据，因此普通助手文本不会被视为被阻止的命令。

`cron list` 和运行历史会显示拒绝原因，而不是把被阻止的命令报告为 `ok`。

## 保留

保留和修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`，或设为 `false` 以禁用）会修剪已完成的隔离运行会话。
- `cron.runLog.keepLines`（默认 `2000`）会按任务修剪保留的 SQLite 运行历史行。`cron.runLog.maxBytes`（默认 `2000000`）仍会被接受，以兼容较旧的文件后端运行日志；SQLite 修剪基于行数。

## 迁移旧任务

<Note>
如果你有当前投递和存储格式之前的 cron 任务，请运行 `openclaw doctor --fix`。Doctor 会规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层投递字段，包括旧版 `threadId`、payload `provider` 投递别名），并将 `notify: true` webhook 回退任务从 `cron.webhook` 迁移为显式 webhook 投递。已经向聊天发布通知的任务会保留该投递，并获得一个完成 webhook 目标。当 `cron.webhook` 未设置时，对于没有迁移目标的任务，惰性的顶层 `notify` 标记会被移除（现有投递保持不变），因此 `doctor --fix` 不会再反复警告它们。
</Note>

## 常用编辑

更新投递设置而不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离任务的投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离任务启用轻量级启动上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道发布通知：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

向 Telegram 论坛主题发布通知：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

创建带轻量级启动上下文的隔离任务：

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次任务。对于 cron 运行，轻量级模式会让启动上下文保持为空，而不是注入完整的工作区启动集。

创建包含精确 argv、cwd、env、stdin 和输出限制的命令任务：

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

`openclaw cron list` 默认显示所有匹配的任务。传入 `--agent <id>` 只显示有效规范化智能体 id 匹配的任务；没有存储智能体 id 的任务会计为已配置的默认智能体。

`openclaw cron get <job-id>` 会直接返回存储的任务 JSON。当你需要带投递路由预览的可读视图时，请使用 `cron show <job-id>`。

`cron list --json` 和 `cron show <job-id> --json` 会在每个任务上包含一个顶层 `status` 字段，该字段根据 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算得出。取值：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。这与可读状态列保持一致，因此外部工具可以读取任务状态，而无需重新推导。

`cron runs` 条目包含投递诊断信息，包括预期的 cron 目标、解析后的目标、消息工具发送、回退使用情况以及已投递状态。

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
