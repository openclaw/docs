---
read_when:
    - 调度后台任务或唤醒事件
    - 将外部触发器（Webhooks、Gmail）接入 OpenClaw
    - 为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: 用于 Gateway 网关调度器的定时任务、Webhooks 和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-07-16T11:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关的内置调度器。它会持久保存任务，在正确的时间唤醒智能体，并可将输出传送到聊天渠道、webhook，或不传送到任何位置。

## 快速开始

<Steps>
  <Step title="添加一次性提醒">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "提醒：检查 cron 文档草稿" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="检查任务">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看运行历史">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 的工作原理

- Cron 在 **Gateway 网关进程内部**运行，而不是在模型内部。Gateway 网关必须保持运行，调度任务才能触发。
- 任务定义、运行时状态和运行历史持久保存在 OpenClaw 的共享 SQLite 状态数据库中，因此重启不会丢失调度任务。
- 每次 cron 执行都会创建一条[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认会在成功后自动删除；传入 `--keep-after-run` 可保留任务。
- 单次运行的实际时间预算：设置时使用 `--timeout-seconds`。否则，隔离/分离式智能体轮次任务会先受到 cron 自身 60 分钟看门狗的限制，底层智能体轮次超时（`agents.defaults.timeoutSeconds`，默认为 48 小时）不会有机会生效；命令任务默认为 10 分钟。
- Gateway 网关启动时，逾期的隔离式智能体轮次任务会被重新调度，而不会立即重放，以免模型/工具引导启动工作进入渠道连接时间窗口。
- 如果通过系统 cron 或其他外部调度器驱动 `openclaw agent`，即使 CLI 已经处理 `SIGTERM`/`SIGINT`，也要为其封装硬终止升级机制。由 Gateway 网关支持的运行会请求 Gateway 网关中止已接受的运行；本地和嵌入式回退运行会收到相同的中止信号。对于 GNU `timeout`，应优先使用 `timeout -k 60 600 openclaw agent ...`，而不是普通的 `timeout 600 ...`——如果进程无法及时完成清理，`-k` 值将作为最后保障。对于 systemd 单元，应使用 `SIGTERM` 停止信号，并在最终终止前保留宽限窗口（`TimeoutStopSec`）。如果原始 Gateway 网关运行仍处于活动状态时重复使用 `--run-id`，系统会将重复运行报告为正在执行，而不会启动第二次运行。

<AccordionGroup>
  <Accordion title="隔离运行加固">
    - 隔离运行完成时，会尽最大努力关闭为其 `cron:<jobId>` 会话跟踪的浏览器标签页/进程，并通过主会话和自定义会话运行使用的同一共享拆卸路径，释放为该任务创建的所有内置 MCP 运行时实例。清理失败会被忽略，以确保 cron 结果仍然优先。
    - 拥有受限 cron 自清理授权的隔离运行可以读取调度器状态、仅包含自身任务的自过滤列表，以及该任务的运行历史，并且只能删除自己的任务。
    - 隔离运行会防范过期的确认回复：如果首个结果只是临时状态更新（`on it`、`pulling everything together` 及类似提示），且没有任何后代子智能体仍负责提供最终答案，OpenClaw 会再次提示一次，以便在传送前获得实际结果。
    - 系统可以识别结构化执行拒绝元数据（包括嵌套错误以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 开头的节点主机 `UNAVAILABLE` 包装器），因此被阻止的命令不会被报告为成功运行，同时普通的助手文字也不会被误判为拒绝。
    - 即使没有回复载荷，运行级智能体故障也会计为任务错误，因此模型/提供商故障会增加错误计数器并触发失败通知，而不会将任务标记为成功并清除。
    - 任务达到 `timeoutSeconds` 时，cron 会中止运行，并为其提供一个较短的清理窗口。如果运行未能结束，由 Gateway 网关负责的清理会在 cron 记录超时前强制清除该运行的会话所有权，使排队的聊天工作不会被过期的处理会话阻塞。
    - 设置/启动卡顿会触发特定阶段的超时（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。即使外部 CLI 进程尚未启动，这些看门狗也会覆盖嵌入式和由 CLI 支持的提供商；它们的上限独立于较长的 `timeoutSeconds` 值，因此冷启动/身份验证/上下文故障可以快速显现。

  </Accordion>
  <Accordion title="任务协调">
    Cron 任务协调首先以运行时为依据，其次以持久历史为依据：只要 cron 运行时仍将相应任务跟踪为运行中，活动的 cron 任务就会保持活动，即使旧的子会话行仍然存在。运行时不再拥有该任务且 5 分钟宽限窗口结束后，维护检查会在持久化的运行日志和任务状态中查找匹配的 `cron:<jobId>:<startedAt>` 运行。其中的终止结果会最终确定任务账本；否则，由 Gateway 网关负责的维护可以将任务标记为 `lost`。离线 CLI 审计可以通过持久历史恢复，但它自身空的进程内活动任务集合并不能证明由 Gateway 网关负责的运行已经消失。
  </Accordion>
</AccordionGroup>

## 调度类型

| 类型      | CLI 标志    | 描述                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）                                                     |
| `every`   | `--every`   | 固定间隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`    | 5 字段或 6 字段 cron 表达式，可选 `--tz`                                                  |
| `on-exit` | `--on-exit` | 受监视的命令退出时触发一次（事件触发器；在轮次拆卸后仍然有效；可选 `--on-exit-cwd`） |

不含时区的时间戳按 UTC 处理。添加 `--tz America/New_York`，可在该 IANA 时区中解释不含偏移量的 `--at` 日期时间，或计算 cron 表达式。不含 `--tz` 的 cron 表达式使用 Gateway 网关主机的时区。`--tz` 不能与 `--every` 或 `--on-exit` 一起使用。

整点重复表达式（分钟字段为 `0`，小时字段为通配符）会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 可强制精确计时，或使用 `--stagger 30s` 设置明确的时间窗口（仅限 cron 调度）。

### 月中日期和星期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月中日期和星期字段均不是通配符时，只要**任一**字段匹配，croner 就会判定为匹配，而非要求两个字段都匹配。这是标准的 Vixie cron 行为。

```bash
# 预期：“仅当 15 日是星期一时，在上午 9 点触发”
# 实际：“每月 15 日上午 9 点，以及每周一上午 9 点”
0 9 15 * 1
```

这会导致每月大约触发 5-6 次，而不是 0-1 次。若要同时满足两个条件，请使用 croner 的 `+` 星期修饰符（`0 9 15 * +1`），或基于一个字段进行调度，并在任务提示词或命令中检查另一个字段。

## 事件触发器（条件监视器）

事件触发器会向 `every` 或 `cron` 调度添加无头条件脚本。Cron 会在任务到期时评估该脚本，并且仅在脚本返回 `fire: true` 时运行常规载荷：

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 仅当观察到的状态与上次评估不同时触发。
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "调查 CI 状态变化。" },
}
```

脚本必须返回 `{ fire, message?, state? }`。之前的 JSON 状态以深度冻结的 `trigger.state` 形式提供；返回新的 `state` 值可将其持久保存。状态上限为 16 KB。当触发结果包含 `message` 时，cron 会在执行前将其追加到系统事件文本或智能体轮次消息中。`once: true` 会在首次成功执行触发载荷后禁用该任务。

`fire: false` 会持久保存评估状态和计数器，然后重新调度，而不创建运行历史。如果已触发的载荷运行失败，返回的 `state` 将**不会**持久保存——下一次评估会看到之前的状态，并可再次触发，因此应将脚本编写为只读检查，并将操作保留在载荷中。触发器调度具有可配置的最小间隔（默认为 30 秒）。每次评估具有 30 秒的实际时间预算，最多可调用 5 次工具。

<Warning>
启用 `cron.triggers.enabled` 后，由智能体编写的脚本可以使用所属智能体的**完整工具策略（包括 `exec`）**以无头方式运行。应将其视为使用该智能体权限执行的无人值守代码；除非所有获准创建 cron 任务的智能体都具有相应的可信级别，否则应保持禁用。
</Warning>

从本地脚本文件创建监视器（`-` 从标准输入读取脚本）：

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "响应 CI 状态变化" \
  --session isolated
```

## 载荷

每个任务都恰好携带一种载荷类型，通过标志选择：

| 载荷       | 标志                                           | 运行方式                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 系统事件  | `--system-event <text>`                        | 加入主会话队列，本身不调用模型 |
| 智能体消息 | `--message <text>`                             | 由模型支持的智能体轮次                               |
| 命令       | `--command <shell>` 或 `--command-argv <json>` | 在 Gateway 网关主机上运行 shell/进程，不调用模型      |

### 智能体轮次选项

<ParamField path="--message" type="string" required>
  提示文本（对于隔离/当前/自定义会话任务为必填项）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；必须解析为允许的模型，否则运行会因验证错误而失败。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每个任务的后备模型列表，例如 `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`。传入 `--fallbacks ""` 可执行不使用后备模型的严格运行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 时，移除每个任务的后备模型覆盖，使任务遵循已配置的后备优先级。不能与 `--fallbacks` 组合使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 时，移除每个任务的模型覆盖，使任务遵循正常的 cron 模型优先级（已存储的 cron 会话覆盖，否则为智能体/默认模型）。不能与 `--model` 组合使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考级别覆盖（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。可用级别仍取决于所选模型和 Agent Runtimes。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 时，移除每个任务的思考覆盖。不能与 `--thinking` 组合使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制任务可以使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 设置任务的主模型；它不会替换会话的 `/model` 覆盖，因此已配置的后备链仍会在其基础上应用。无法解析或不允许使用的模型会使运行因明确的验证错误而失败，而不会静默回退到默认模型。如果任务具有 `--model`，但没有显式或已配置的后备列表，OpenClaw 会传入空的后备覆盖，而不会静默地将智能体主模型追加为隐藏的重试目标。

隔离任务的模型选择优先级（从高到低）：

1. 每个任务的载荷 `model`（显式配置；不允许使用的模型会使运行失败）
2. Gmail 钩子模型覆盖（仅当运行来自 Gmail 且允许该覆盖时）
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式遵循解析后的实时选择。如果所选模型配置具有 `params.fastMode`，隔离 cron 默认使用该值；已存储的会话 `fastMode` 覆盖（其次是智能体 `fastModeDefault`）在两个方向上仍优先于模型配置。自动模式使用模型的 `params.fastAutoOnSeconds` 截止时间，默认为 60 秒。

如果运行触发实时模型切换交接，cron 会使用切换后的提供商/模型重试，并为当前运行持久化该选择（以及任何新的身份验证配置文件）。重试次数有上限：初次尝试加上 2 次切换重试后，cron 会中止，而不会循环。

在隔离运行开始前，OpenClaw 会检查已配置的 `api: "ollama"` 和 `api: "openai-completions"` 提供商中可访问的本地端点，这些提供商的 `baseUrl` 为环回地址、专用网络或 `.local`。此预检会遍历任务配置的后备链，并且仅在所有候选项均不可访问后才将运行标记为 `skipped`；`--fallbacks ""` 会将遍历严格限制为仅主模型。端点不可用时，运行会被记录为 `skipped` 并附带明确错误，而不会开始模型调用。结果按端点缓存 5 分钟（而不是按任务或模型），因此许多到期任务共用一台不可用的本地 Ollama/vLLM/SGLang/LM Studio 服务器时，只需一次探测，而不会引发请求风暴。跳过的预检运行不会增加执行错误退避；设置 `failureAlert.includeSkipped` 可选择接收重复的跳过警报。

### 命令载荷

命令载荷在 Gateway 网关调度程序中运行确定性脚本，而不会启动由模型支持的轮次。它们在 Gateway 网关主机上执行，捕获 stdout/stderr，在 cron 历史记录中记录运行，并复用与智能体轮次任务相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
命令 cron 是操作员管理员使用的 Gateway 网关自动化界面，不是智能体的 `tools.exec` 调用。创建、更新、移除或手动运行 cron 任务需要 `operator.admin`；之后，计划命令运行会作为该管理员创建的自动化在 Gateway 网关进程内执行。智能体 Exec 策略（`tools.exec.mode`、审批提示、每个智能体的工具允许列表）管理模型可见的 Exec 工具，而不是命令 cron 载荷。
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

`--command <shell>` 存储 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不经 shell 解析的情况下精确执行 argv。可选的 `--command-env KEY=VALUE`（可重复）、`--command-input`、`--timeout-seconds`（默认 10 分钟）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 用于控制进程环境、stdin 和输出限制。

交付文本根据进程输出生成：非空 stdout 优先；如果 stdout 为空且 stderr 非空，则交付 stderr；如果两者都有内容，cron 会发送一个简短的 `stdout:` / `stderr:` 块。退出代码 `0` 会将运行记录为 `ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并可能触发失败警报。仅打印 `NO_REPLY` 的命令会使用正常的 cron 静默令牌抑制机制，不向聊天发送任何内容。

## 执行方式

| 方式            | `--session` 值 | 运行位置                 | 最适合                         |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话          | `main`              | 专用 cron 唤醒通道       | 提醒、系统事件                  |
| 隔离            | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务                  |
| 当前会话        | `current`           | 创建时绑定               | 感知上下文的周期性工作          |
| 自定义会话      | `session:custom-id` | 持久化命名会话           | 基于历史记录持续推进的工作流    |

<AccordionGroup>
  <Accordion title="主会话、隔离会话与自定义会话的对比">
    **主会话**任务会将系统事件加入 cron 所有的运行通道，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。它们可以使用目标主会话上次交付的上下文进行回复，但不会将常规 cron 轮次追加到人工聊天通道，也不会延长目标会话的每日/空闲重置新鲜度。**隔离**任务使用全新会话运行一个专用智能体轮次。**自定义会话**（`session:xxx`）会跨运行保留上下文，从而支持每日站会等基于先前摘要持续推进的工作流。

    主会话 cron 事件是自包含的系统事件提醒。它们不会自动包含默认 Heartbeat 提示中的“读取 HEARTBEAT.md”指令；如果提醒应查阅 `HEARTBEAT.md`，请在 cron 事件文本中明确说明。

  </Accordion>
  <Accordion title="对于隔离任务，“全新会话”意味着什么">
    每次运行都会创建新的记录/会话 ID。OpenClaw 会携带安全的偏好设置（思考/快速/详细设置、标签、用户显式选择的模型/身份验证覆盖），但不会从较早的 cron 行继承环境会话上下文：渠道/群组路由、发送或队列策略、权限提升、来源或 ACP 运行时绑定。当周期性任务需要有意基于同一对话上下文持续推进时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="子智能体和 Discord 交付">
    当隔离 cron 运行编排子智能体时，交付会优先采用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该父级的部分更新，而不会将其公布。

    对于纯文本 Discord 公布目标，OpenClaw 只发送一次规范的最终助手文本，而不会同时重放流式/中间文本和最终答案。媒体和结构化 Discord 载荷仍会单独交付，以免丢失附件和组件。

  </Accordion>
</AccordionGroup>

## 交付和输出

| 模式       | 行为                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则将最终文本后备交付到目标                        |
| `webhook`  | 将完成事件载荷 POST 到 URL                                          |
| `none`     | 不进行运行器后备交付                                                 |

使用 `--announce --channel telegram --to "-1001234567890"` 进行渠道交付。对于 Telegram 论坛话题，请使用 `-1001234567890:topic:123`；OpenClaw 也接受由 Telegram 所有的 `-1001234567890:123` 简写。直接 RPC/配置调用方可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用准确的房间 ID 或 Matrix 中的 `room:!room:server` 形式。

当公布交付使用 `channel: "last"` 或省略 `channel` 时，诸如 `telegram:123` 之类带提供商前缀的目标可以先选择渠道，然后 cron 才会回退到会话历史记录或唯一配置的渠道。只有已加载插件公布的前缀才是提供商选择器。如果显式指定 `delivery.channel`，目标前缀必须命名同一提供商；`channel: "whatsapp"` 与 `to: "telegram:123"` 的组合会被拒绝，而不会让 WhatsApp 将 Telegram ID 解释为电话号码。目标类型和服务前缀（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍是渠道所有的目标语法，而不是提供商选择器。

对于隔离任务，聊天交付是共享的：如果有可用的聊天路由，即使使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过后备公布。否则，`announce`、`webhook` 和 `none` 仅控制智能体轮次结束后运行器如何处理最终回复。

当智能体从活跃聊天创建隔离提醒时，OpenClaw 会存储保留的实时交付目标，作为后备公布路由。内部会话键可能使用小写；当当前聊天上下文可用时，不会根据这些键重建提供商交付目标。

隐式公布交付使用已配置的渠道允许列表来验证并重新路由过时的目标。私信配对存储中的批准项不是后备自动化接收方；当计划任务应主动发送到私信时，请设置 `delivery.to` 或配置渠道的 `allowFrom` 条目。

### 失败通知

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 针对每个任务覆盖该设置。
- 如果两者都未设置，并且任务已通过 `announce` 投递，则失败通知会回退到该主要公告目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 任务上受支持，除非主要投递模式为 `webhook`。
- `failureAlert.includeSkipped: true` 让任务或全局 cron 告警策略启用重复的跳过运行告警。跳过的运行使用单独的连续跳过计数器，因此不会影响执行错误的退避策略。
- `openclaw cron edit` 提供按任务调整告警的选项：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 和 `--failure-alert-account-id`。

### 输出语言

Cron 任务不会根据渠道、区域设置或之前的消息推断回复语言。请在定时消息或模板中加入语言规则：

```bash
openclaw cron edit <jobId> \
  --message "总结更新。使用中文回复；保持 URL、代码和产品名称不变。"
```

对于模板文件，请将语言指令保留在渲染后的提示词中，并在任务运行前确认 `{{language}}` 等占位符已填充。如果输出混合了多种语言，请明确规则，例如：“叙述性文本使用中文，技术术语保留英文。”

## CLI 示例

<Tabs>
  <Tab title="一次性提醒">
    ```bash
    openclaw cron add \
      --name "日历检查" \
      --at "20m" \
      --session main \
      --system-event "下一次 Heartbeat：检查日历。" \
      --wake now
    ```
  </Tab>
  <Tab title="重复的隔离任务">
    ```bash
    openclaw cron create "0 7 * * *" \
      "总结夜间更新。" \
      --name "晨间简报" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="覆盖模型和思考强度">
    ```bash
    openclaw cron add \
      --name "深度分析" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "每周深入分析项目进展。" \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook 输出">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "以 JSON 格式总结今天的部署。" \
      --name "部署摘要" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="命令输出">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "队列深度探测" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## 管理任务

```bash
# 列出所有任务
openclaw cron list

# 以 JSON 格式获取一个已存储的任务
openclaw cron get <jobId>

# 显示一个任务，包括解析后的投递路由
openclaw cron show <jobId>

# 在不删除任务的情况下启用/禁用
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# 编辑任务
openclaw cron edit <jobId> --message "更新后的提示词" --model "opus"

# 立即强制运行任务
openclaw cron run <jobId>

# 立即强制运行任务，并等待其终止状态
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史记录
openclaw cron runs --id <jobId> --limit 50

# 查看某次确切的运行
openclaw cron runs --id <jobId> --run-id <runId>

# 删除任务
openclaw cron remove <jobId>

# 选择智能体（多智能体设置）
openclaw cron create "0 6 * * *" "检查运维队列" --name "运维巡检" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

归档会话（通过 Control UI，或由操作员管理员调用方使用 `sessions.patch { archived: true }`）会禁用绑定到该会话的所有已启用 cron 任务：其隔离的 `cron:<jobId>` 会话、`session:<key>` 目标，或投递/唤醒 `sessionKey` 通道。恢复会话不会重新启用这些任务；请使用 `openclaw cron enable <jobId>`。绑定了已启用任务的会话会在 Control UI 侧边栏中显示时钟徽标。

`openclaw cron run <jobId>` 在手动运行入队后返回。对于关闭钩子、维护脚本或其他必须阻塞到队列中的运行完成为止的自动化，请使用 `--wait`；它会轮询返回的 `runId`（默认超时时间为 `10m`，轮询间隔为 `2s`），状态为 `ok` 时以 `0` 退出，状态为 `error`、`skipped` 或等待超时时以非零状态退出。

智能体的 `cron` 工具从 `cron(action: "list")` 返回精简的任务摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；使用 `cron(action: "get", jobId: "...")` 获取单个任务的完整定义。直接调用 Gateway 网关的调用方可以将 `compact: true` 传给 `cron.list`；省略它会保留包含投递预览的完整响应。

`openclaw cron create` 是 `openclaw cron add` 的别名。新任务可以使用位置式调度参数（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 时间戳），后跟位置式智能体提示词。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，可将已完成运行的负载通过 POST 发送到 HTTP 端点；webhook 投递不能与聊天投递标志（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）结合使用。在 `cron edit`、`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 上，分别取消设置这些路由字段（每个标志与其对应的设置标志同时使用时都会被拒绝）——这与 `--no-deliver` 不同，后者只禁用运行器的回退投递。

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 更改任务选择的模型。
- 如果该模型被允许，则会将该确切的提供商/模型传入隔离的智能体运行。
- 如果该模型不被允许或无法解析，cron 会以明确的验证错误使此次运行失败。
- API `cron.update` 负载补丁可将 `model: null` 设置为清除已存储任务的模型覆盖。
- `openclaw cron edit <job-id> --clear-model` 从 CLI 清除该覆盖（效果与 `model: null` 补丁相同），并且不能与 `--model` 结合使用。
- 配置的回退链仍然适用，因为 cron `--model` 是任务的主要模型，而不是会话 `/model` 覆盖。
- `openclaw cron add|edit --fallbacks ...` 设置负载中的 `fallbacks`，替换该任务已配置的回退模型；`--fallbacks ""` 禁用回退并使运行采用严格模式。`openclaw cron edit <job-id> --clear-fallbacks` 清除按任务设置的覆盖。
- 如果普通的 `--model` 没有显式或已配置的回退列表，则不会将智能体的主要模型作为额外的静默重试目标。

</Note>

## Webhooks

Gateway 网关可以公开 HTTP webhook 端点供外部触发。请在配置中启用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 身份验证

每个请求都必须通过请求头包含钩子令牌：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串令牌会被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    将系统事件加入主会话队列：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"收到新电子邮件","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件描述。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 或 `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    运行一个隔离的智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"总结收件箱","name":"电子邮件","model":"openai/gpt-5.6-sol"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射钩子（POST /hooks/<name>）">
    自定义钩子名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
请将钩子端点置于环回地址、tailnet 或可信反向代理之后。

- 使用专用的钩子令牌；不要重复使用 Gateway 网关身份验证令牌。
- 将 `hooks.path` 保持在专用子路径上；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds`，以限制钩子可以指定的有效智能体；当省略 `agentId` 时，此限制也包括默认智能体。
- 除非需要由调用方选择会话，否则请保留 `hooks.allowRequestSessionKey=false`。
- 如果启用 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes`，以限制允许的会话键格式。
- 默认情况下，钩子负载会由安全边界封装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器连接到 OpenClaw。

<Note>
**先决条件：**`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw 钩子，以及用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

此命令会写入 `hooks.gmail` 配置、启用 Gmail 预设，并默认使用 Tailscale Funnel 作为推送端点（`--tailscale funnel|serve|off`）。

<Warning>
Gmail 预设的按消息会话会分隔对话上下文；它不会限制目标智能体的工具或工作区。如果没有设置 `agentId` 的自定义映射，Gmail 钩子将以默认智能体身份运行。

对于不受信任的收件箱，请将钩子路由到专用的读取智能体，授予该智能体只读或无工作区访问权限，并禁用文件系统写入、shell、浏览器及其他不必要的工具。如果它需要通知主智能体，仅允许所需的智能体间交接。请参阅[提示词注入](/zh-CN/gateway/security#prompt-injection)、[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)和 [`tools.agentToAgent`](/zh-CN/gateway/config-tools#toolsagenttoagent)。
</Warning>

### Gateway 网关自动启动

设置 `hooks.enabled=true` 和 `hooks.gmail.account` 后，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订监视。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 一次性手动设置

<Steps>
  <Step title="选择 GCP 项目">
    选择拥有 `gog` 所用 OAuth 客户端的 GCP 项目：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="创建主题并授予 Gmail 推送访问权限">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="启动监视">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail 模型覆盖

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

对于不受信任的收件箱，请使用提供商所提供的最新一代最高档模型。以上值仅为示例；该模型必须存在于已配置的目录和允许列表中。

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

以上 `retry` 值为默认值：最多重试 3 次，采用 `30s/60s/5m` 退避，并对全部五类暂时性错误进行重试。Cron webhook POST 会将 `webhookToken` 作为 `Authorization: Bearer <token>` 发送。

`maxConcurrentRuns` 同时限制定时 cron 分派和隔离的智能体轮次执行，默认值为 8。隔离的 cron 智能体轮次在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可以让互相独立的 cron LLM 运行并行推进，而不是仅启动其外层 cron 包装器。此设置不会扩大共享的非 cron `nested` 通道。

`cron.store` 是逻辑存储键和 Doctor 迁移路径，并非可供手动编辑的实时 JSON 文件。作业数据存储在 SQLite 中；请使用 CLI 或 Gateway 网关 API 进行更改。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **单次作业重试**：暂时性错误（速率限制、过载、网络、超时、服务器错误）最多重试 `retry.maxAttempts` 次（默认 3 次），使用 `retry.backoffMs`（默认 30 秒、60 秒、5 分钟）。永久性错误会立即禁用作业。

    **周期性作业重试**：连续执行错误会按照延长的时间表进行退避（30 秒、60 秒、5 分钟、15 分钟、60 分钟）。下一次运行成功后，退避将重置。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认为 `24h`，`false` 表示禁用）会清理隔离的运行会话条目。运行历史记录会为每个作业保留最新的 2000 条终态记录；丢失的记录仍保留其 24 小时清理期限。
  </Accordion>
  <Accordion title="旧版存储迁移">
    升级时，运行 `openclaw doctor --fix`，将旧版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件导入 SQLite，并使用 `.migrated` 后缀对其重命名。格式错误的作业行会从运行时中跳过，并复制到 `jobs-quarantine.json`，以便稍后修复或审查。
  </Accordion>
</AccordionGroup>

## 故障排查

### 命令排查步骤

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron 未触发">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行。
    - 对于 `cron` 调度，请核对时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行使用 `openclaw cron run <jobId> --due` 进行了检查，而作业尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但未投递">
    - 投递模式 `none` 表示不会进行运行器回退发送。当存在聊天路由时，智能体仍可使用 `message` 工具直接发送。
    - 投递目标缺失或无效（`channel`/`to`）表示已跳过出站投递。
    - 对于 Matrix，复制的作业或旧版作业如果包含小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。请将作业中的值编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道身份验证错误（`unauthorized`、`Forbidden`）表示投递因凭据问题而被阻止。
    - 如果隔离运行仅返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递和回退的队列摘要路径，因此不会向聊天发回任何内容。
    - 如果智能体应自行向用户发送消息，请检查作业是否具有可用路由（带有先前聊天记录的 `channel: "last"`，或显式渠道/目标）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止了 /new 风格的会话轮换">
    - 每日重置和空闲重置的新鲜度不以 `updatedAt` 为依据；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、Exec 通知和 Gateway 网关记录操作可能会更新用于路由/状态的会话行，但不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版记录，如果转录 JSONL 会话头文件仍然可用，OpenClaw 可以从中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲记录会将该恢复的开始时间用作其空闲基准。

  </Accordion>
  <Accordion title="时区易错点">
    - 未设置 `--tz` 的 Cron 使用 Gateway 网关主机时区。
    - 未设置时区的 `at` 调度按 UTC 处理。
    - Heartbeat `activeHours` 使用已配置的时区解析方式。

  </Accordion>
</AccordionGroup>

## 相关内容

- [自动化](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 定期执行的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
