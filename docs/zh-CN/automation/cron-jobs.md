---
read_when:
    - 调度后台任务或唤醒
    - 将外部触发器（Webhooks、Gmail）接入 OpenClaw
    - 在 Heartbeat 和 cron 之间为定时任务做选择
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的定时作业、Webhooks 和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-07-05T11:00:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa2b15d205cfb9914b4dc25ba5c446ecc8460e322e99bb784495ef7802d94f1e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关内置的调度器。它会持久化任务，在合适时间唤醒智能体，并可将输出投递到聊天渠道、webhook，或不投递到任何地方。

## 快速开始

<Steps>
  <Step title="添加一次性提醒">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="检查你的任务">
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

## cron 如何工作

- Cron 在 **Gateway 网关进程内**运行，而不是在模型内运行。Gateway 网关必须保持运行，计划才会触发。
- 任务定义、运行时状态和运行历史会持久化到 OpenClaw 的共享 SQLite 状态数据库中，因此重启不会丢失计划。
- 每次 cron 执行都会创建一条[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认会在成功后自动删除；传入 `--keep-after-run` 可保留它们。
- 单次运行的挂钟时间预算：设置时使用 `--timeout-seconds`。否则，隔离/分离的智能体轮次任务会先受 cron 自身 60 分钟 watchdog 限制，随后底层智能体轮次超时（`agents.defaults.timeoutSeconds`，默认 48 小时）才可能适用；命令任务默认为 10 分钟。
- Gateway 网关启动时，逾期的隔离智能体轮次任务会被重新调度，而不是立即重放，从而避免模型/工具引导工作进入渠道连接窗口。
- 如果你通过系统 cron 或其他外部调度器驱动 `openclaw agent`，即使 CLI 已经处理 `SIGTERM`/`SIGINT`，也要用硬终止升级机制包装它。Gateway 网关托管的运行会请求 Gateway 网关中止已接受的运行；本地和嵌入式回退运行会收到相同的中止信号。对于 GNU `timeout`，优先使用 `timeout -k 60 600 openclaw agent ...`，而不是普通的 `timeout 600 ...` —— 如果进程无法及时排空，`-k` 值就是兜底。对于 systemd 单元，使用带宽限窗口（`TimeoutStopSec`）的 `SIGTERM` 停止信号，然后再执行最终终止。当原始 Gateway 网关运行仍处于活动状态时复用 `--run-id`，重复运行会被报告为正在进行，而不是启动第二次运行。

<AccordionGroup>
  <Accordion title="隔离运行加固">
    - 隔离运行会尽力在完成时关闭其 `cron:<jobId>` 会话跟踪的浏览器标签页/进程，并通过与主会话和自定义会话运行相同的共享清理路径，释放为该任务创建的任何内置 MCP 运行时实例。清理失败会被忽略，因此 cron 结果仍然优先。
    - 拥有狭窄 cron 自清理授权的隔离运行可以读取调度器状态、只包含自身任务的自过滤列表，以及该任务的运行历史，并且只能移除自身任务。
    - 隔离运行会防范过期确认回复：如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 和类似提示），并且没有后代子智能体仍负责最终答案，OpenClaw 会在投递前重新提示一次以获取实际结果。
    - 结构化执行拒绝元数据（包括 node-host `UNAVAILABLE` 包装，其嵌套错误以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 开头）会被识别，因此被阻止的命令不会被报告为绿色运行，同时普通助手正文不会被误判为拒绝。
    - 即使没有回复载荷，运行级智能体失败也会计为任务错误，因此模型/提供商失败会递增错误计数器并触发失败通知，而不是将任务清除为成功。
    - 当任务达到 `timeoutSeconds` 时，cron 会中止运行并给它一个短暂的清理窗口。如果它没有排空，Gateway 网关拥有的清理会在 cron 记录超时前强制清除该运行的会话所有权，因此排队的聊天工作不会卡在过期的处理中会话后面。
    - 设置/启动停滞会获得特定阶段的超时（例如 `cron: isolated agent setup timed out before runner start` 或 `cron: isolated agent run stalled before execution start (last phase: context-engine)`）。这些 watchdog 覆盖嵌入式和 CLI 托管的提供商，即使在其外部 CLI 进程启动前也会生效，并且会独立于较长的 `timeoutSeconds` 值进行封顶，因此冷启动/凭证/上下文故障会快速暴露。

  </Accordion>
  <Accordion title="任务对账">
    Cron 任务对账首先由运行时拥有，其次由持久历史支撑：只要 cron 运行时仍跟踪该任务为正在运行，活动 cron 任务就会保持活动，即使旧的子会话行仍然存在。一旦运行时停止拥有该任务并且 5 分钟宽限窗口过期，维护检查会查看持久化运行日志和任务状态，匹配 `cron:<jobId>:<startedAt>` 运行。那里的终止结果会最终确定任务账本；否则 Gateway 网关拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但它自身空的进程内活动任务集合不能证明 Gateway 网关拥有的运行已经消失。
  </Accordion>
</AccordionGroup>

## 计划类型

| 种类      | CLI 标志    | 描述                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）                                                     |
| `every`   | `--every`   | 固定间隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`    | 5 字段或 6 字段 cron 表达式，可选 `--tz`                                                  |
| `on-exit` | `--on-exit` | 监听的命令退出时触发一次（事件触发器；可跨轮次清理保留；可选 `--on-exit-cwd`） |

没有时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可在该 IANA 时区解释不带偏移量的 `--at` 日期时间，或评估 cron 表达式。没有 `--tz` 的 cron 表达式使用 Gateway 网关主机时区。`--tz` 不能与 `--every` 或 `--on-exit` 一起使用。

整点重复表达式（分钟为 `0` 且小时字段为通配符）会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 可强制精确计时，或使用 `--stagger 30s` 指定显式窗口（仅 cron 计划）。

### 日期和星期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当日期字段和星期字段都不是通配符时，croner 会在**任一**字段匹配时匹配，而不是要求两者都匹配。这是标准 Vixie cron 行为。

```bash
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会导致每月大约触发 5-6 次，而不是每月 0-1 次。若要求两个条件同时满足，请使用 croner 的 `+` 星期修饰符（`0 9 15 * +1`），或按一个字段调度，并在任务的提示或命令中保护另一个字段。

## 载荷

每个任务都只携带一种载荷类型，由标志选择：

| 载荷       | 标志                                           | 运行                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 系统事件  | `--system-event <text>`                        | 入队到主会话，本身不调用模型 |
| 智能体消息 | `--message <text>`                             | 模型支持的智能体轮次                               |
| 命令       | `--command <shell>` 或 `--command-argv <json>` | Gateway 网关主机上的 shell/进程，不调用模型      |

### 智能体轮次选项

<ParamField path="--message" type="string" required>
  提示文本（隔离/当前/自定义会话任务必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；必须解析为允许的模型，否则运行会因验证错误而失败。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每任务回退模型列表，例如 `--fallbacks openai/gpt-5.5,openrouter/meta-llama/llama-3.3-70b-instruct:free`。传入 `--fallbacks ""` 可执行没有回退的严格运行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 上，移除每任务回退覆盖，使任务遵循配置的回退优先级。不能与 `--fallbacks` 组合使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 上，移除每任务模型覆盖，使任务遵循常规 cron 模型优先级（已存储的 cron 会话覆盖，否则为智能体/默认模型）。不能与 `--model` 组合使用。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 级别覆盖（`off|minimal|low|medium|high|xhigh|adaptive|max`）。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 上，移除每任务 thinking 覆盖。不能与 `--thinking` 组合使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制任务可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 设置任务的主模型；它不会替换会话 `/model` 覆盖，因此已配置的回退链仍会应用在它之上。无法解析或不允许的模型会让运行以明确的验证错误失败，而不是静默回退到默认值。如果任务有 `--model` 但没有显式或已配置的回退列表，OpenClaw 会传递一个空的回退覆盖，而不是静默附加智能体主模型作为隐藏重试目标。

隔离任务的模型选择优先级，从高到低：

1. 每任务载荷 `model`（显式配置；不允许的模型会让运行失败）
2. Gmail 钩子模型覆盖（仅当运行来自 Gmail 且该覆盖被允许时）
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式遵循解析后的实时选择。如果所选模型配置具有 `params.fastMode`，隔离 cron 默认使用它；已存储的会话 `fastMode` 覆盖（然后是智能体 `fastModeDefault`）仍会在任一方向上优先于模型配置。自动模式使用模型的 `params.fastAutoOnSeconds` 截止值，默认为 60 秒。

如果运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并为活动运行持久化该选择（以及任何新的凭证配置文件）。重试有上限：初始尝试加 2 次切换重试后，cron 会中止而不是循环。

在隔离运行开始前，OpenClaw 会检查已配置 `api: "ollama"` 和 `api: "openai-completions"` 提供商的可达本地端点，其 `baseUrl` 为 loopback、私有网络或 `.local`。此预检会遍历任务配置的回退链，并且只有在每个候选都不可达后才将运行标记为 `skipped`；`--fallbacks ""` 会将该遍历严格限制为主模型。宕机端点会将运行记录为 `skipped` 并附带清晰错误，而不是启动模型调用。结果按端点缓存 5 分钟（不是按任务或模型），因此许多到期任务共享一个失效的本地 Ollama/vLLM/SGLang/LM Studio 服务器时，只需一次探测，而不是形成请求风暴。跳过的预检运行不会递增执行错误退避；设置 `failureAlert.includeSkipped` 可选择接收重复跳过提醒。

### 命令载荷

命令载荷在 Gateway 网关调度器内运行确定性脚本，而不启动模型支持的轮次。它们在 Gateway 网关主机上执行，捕获 stdout/stderr，在 cron 历史中记录运行，并复用与智能体轮次任务相同的 `announce`、`webhook` 和 `none` 投递模式。

<Note>
命令 cron 是操作员管理员级的 Gateway 网关自动化表面，不是智能体 `tools.exec` 调用。创建、更新、移除或手动运行 cron 作业需要 `operator.admin`；计划命令稍后会在 Gateway 网关进程内作为该管理员编写的自动化执行。智能体 exec 策略（`tools.exec.mode`、审批提示、按智能体配置的工具允许列表）管控模型可见的 exec 工具，而不是命令 cron 载荷。
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

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。使用 `--command-argv '["node","scripts/report.mjs"]'` 可在不经 shell 解析的情况下执行精确的 argv。可选的 `--command-env KEY=VALUE`（可重复）、`--command-input`、`--timeout-seconds`（默认 10 分钟）、`--no-output-timeout-seconds` 和 `--output-max-bytes` 用于控制进程环境、stdin 和输出边界。

投递的文本来自进程输出：非空 stdout 优先；如果 stdout 为空且 stderr 非空，则投递 stderr；如果两者都存在，cron 会发送一个小型 `stdout:` / `stderr:` 块。退出码 `0` 会将运行记录为 `ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并可能触发失败提醒。只打印 `NO_REPLY` 的命令会使用常规 cron 静默令牌抑制，不会向聊天发回任何内容。

## 执行样式

| 样式 | `--session` 值 | 运行于 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话 | `main` | 专用 cron 唤醒通道 | 提醒、系统事件 |
| 隔离 | `isolated` | 专用 `cron:<jobId>` | 报告、后台杂务 |
| 当前会话 | `current` | 创建时绑定 | 感知上下文的周期性工作 |
| 自定义会话 | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话与隔离会话与自定义会话">
    **主会话**作业会将系统事件入队到 cron 所有的运行通道，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。它们可以使用目标主会话最近一次投递上下文来回复，但不会把常规 cron 轮次追加到人工聊天通道，也不会延长目标会话的每日/空闲重置新鲜度。**隔离**作业会以新会话运行一个专用智能体轮次。**自定义会话**（`session:xxx`）会跨运行保留上下文，从而支持每日站会这类基于先前摘要构建的工作流。

    主会话 cron 事件是自包含的系统事件提醒。它们不会自动包含默认 Heartbeat 提示中的 “Read HEARTBEAT.md” 指令；如果提醒需要查阅 `HEARTBEAT.md`，请在 cron 事件文本中明确说明。

  </Accordion>
  <Accordion title="隔离作业中的“新会话”含义">
    每次运行都有新的转录/会话 id。OpenClaw 会携带安全偏好（思考/快速/详细设置、标签、用户明确选择的模型/凭证覆盖），但不会从旧 cron 行继承环境会话上下文：频道/群组路由、发送或队列策略、提升权限、来源或 ACP 运行时绑定。如果周期性作业应有意基于同一会话上下文构建，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="子智能体和 Discord 投递">
    当隔离 cron 运行编排子智能体时，投递会优先使用最终后代输出，而不是过期的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是公告它。

    对于纯文本 Discord 公告目标，OpenClaw 会发送一次规范的最终助手文本，而不是同时重放流式/中间文本和最终答案。媒体和结构化 Discord 载荷仍会单独投递，因此附件和组件不会被丢弃。

  </Accordion>
</AccordionGroup>

## 投递和输出

| 模式 | 发生的事情 |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则将最终文本回退投递到目标 |
| `webhook` | 将完成事件载荷 POST 到 URL |
| `none` | 无运行器回退投递 |

使用 `--announce --channel telegram --to "-1001234567890"` 进行渠道投递。对于 Telegram 论坛主题，请使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 所有的 `-1001234567890:123` 简写。直接 RPC/配置调用者可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

当公告投递使用 `channel: "last"` 或省略 `channel` 时，像 `telegram:123` 这样带提供商前缀的目标可以在 cron 回退到会话历史或单个已配置渠道之前选择渠道。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，目标前缀必须命名同一提供商；`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝，而不是让 WhatsApp 把 Telegram ID 解释为电话号码。目标类型和服务前缀（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）仍属于渠道所有的目标语法，而不是提供商选择器。

对于隔离作业，聊天投递是共享的：如果聊天路由可用，即使带有 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过回退公告。否则，`announce`、`webhook` 和 `none` 只控制智能体轮次结束后运行器如何处理最终回复。

当智能体从活跃聊天创建隔离提醒时，OpenClaw 会存储保留的实时投递目标，用于回退公告路由。内部会话键可能是小写；当前聊天上下文可用时，不会从这些键重建提供商投递目标。

隐式公告投递会使用已配置的渠道允许列表来验证并重路由过期目标。私信配对存储审批不是回退自动化接收者；如果计划作业应主动发送到私信，请设置 `delivery.to` 或配置渠道 `allowFrom` 条目。

### 失败通知

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 按作业覆盖该值。
- 如果两者都未设置，且作业已通过 `announce` 投递，失败通知会回退到该主要公告目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业，除非主投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 会让作业或全局 cron 警报策略加入重复跳过运行提醒。跳过的运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。
- `openclaw cron edit` 暴露按作业的提醒调优：`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode` 和 `--failure-alert-account-id`。

### 输出语言

Cron 作业不会从渠道、locale 或先前消息推断回复语言。请将语言规则放入计划消息或模板：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

对于模板文件，请将语言指令保留在渲染后的提示中，并在作业运行前验证 `{{language}}` 等占位符已填充。如果输出混合多种语言，请明确规则，例如：“叙述文本使用中文，技术术语保留英文。”

## CLI 示例

<Tabs>
  <Tab title="一次性提醒">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="周期性隔离作业">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="模型和思考覆盖">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook 输出">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="命令输出">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## 管理作业

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Enable/disable without deleting
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` 会在手动运行入队后返回。对于关机钩子、维护脚本或其他必须阻塞到队列运行完成的自动化，请使用 `--wait`；它会轮询返回的 `runId`（默认超时 `10m`，轮询间隔 `2s`），并在状态为 `ok` 时以 `0` 退出，在 `error`、`skipped` 或等待超时时以非零退出。

智能体 `cron` 工具会从 `cron(action: "list")` 返回紧凑作业摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；使用 `cron(action: "get", jobId: "...")` 获取单个完整作业定义。直接 Gateway 网关调用者可以向 `cron.list` 传入 `compact: true`；省略它会保留带投递预览的完整响应。

`openclaw cron create` 是 `openclaw cron add` 的别名。新任务可以使用位置式计划（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 时间戳），后面跟位置式智能体提示。对 `cron add|create` 或 `cron edit` 使用 `--webhook <url>`，可将已完成运行的载荷 POST 到 HTTP 端点；webhook 投递不能与聊天投递标志（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）组合使用。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 会分别取消设置这些路由字段（每个都会拒绝与其匹配的设置标志同时使用），这不同于 `--no-deliver`，后者只会禁用运行器兜底投递。

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改任务选择的模型。
- 如果模型被允许，该确切提供商/模型会进入隔离的智能体运行。
- 如果不被允许或无法解析，cron 会以明确的验证错误使该运行失败。
- API `cron.update` 载荷补丁可以设置 `model: null` 来清除已存储的任务模型覆盖。
- `openclaw cron edit <job-id> --clear-model` 会从 CLI 清除该覆盖（效果与 `model: null` 补丁相同），且不能与 `--model` 组合使用。
- 已配置的 fallback 链仍然适用，因为 cron `--model` 是任务主模型，而不是会话 `/model` 覆盖。
- `openclaw cron add|edit --fallbacks ...` 会设置载荷 `fallbacks`，替换该任务的已配置 fallback；`--fallbacks ""` 会禁用 fallback 并使运行严格执行。`openclaw cron edit <job-id> --clear-fallbacks` 会清除每任务覆盖。
- 没有显式或已配置 fallback 列表的普通 `--model` 不会静默落到智能体主模型作为额外重试目标。

</Note>

## Webhooks

Gateway 网关可以暴露 HTTP webhook 端点供外部触发器使用。在配置中启用：

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

每个请求都必须通过 header 包含 hook 令牌：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串令牌会被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    为主会话将系统事件加入队列：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      事件描述。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` 或 `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    运行隔离的智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.5"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`sessionKey`（需要 `hooks.allowRequestSessionKey=true`）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点置于回环、tailnet 或受信任的反向代理之后。

- 使用专用 hook 令牌；不要复用 Gateway 网关身份验证令牌。
- 将 `hooks.path` 保持在专用子路径上；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制 hook 可以指向的有效智能体，包括省略 `agentId` 时的默认智能体。
- 保持 `hooks.allowRequestSessionKey=false`，除非你需要调用方选择的会话。
- 如果启用 `hooks.allowRequestSessionKey`，也要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形状。
- 默认情况下，hook 载荷会用安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、已启用的 OpenClaw hooks、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并默认使用 Tailscale Funnel 作为 push 端点（`--tailscale funnel|serve|off`）。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且已设置 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

<Steps>
  <Step title="Select the GCP project">
    选择拥有 `gog` 所用 OAuth 客户端的 GCP 项目：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

上面的 `retry` 值是默认值：最多 3 次重试，使用 `30s/60s/5m` 退避，并重试全部五类瞬态类别。`webhookToken` 会在 cron webhook POST 中作为 `Authorization: Bearer <token>` 发送。

`maxConcurrentRuns` 会同时限制计划 cron 调度和隔离的智能体轮次执行，默认值为 8。隔离的 cron 智能体轮次内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可让独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会被此设置拓宽。

`cron.store` 是逻辑存储键和 Doctor 迁移路径，而不是要手动编辑的实时 JSON 文件。任务数据存储在 SQLite 中；请使用 CLI 或 Gateway 网关 API 进行更改。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重试**：瞬态错误（速率限制、过载、网络、超时、服务器错误）最多重试 `retry.maxAttempts` 次（默认 3），使用 `retry.backoffMs`（默认 30s、60s、5m）。永久错误会立即禁用任务。

    **周期性重试**：连续执行错误会按扩展计划退避（30s、60s、5m、15m、60m）。下一次成功运行后退避会重置。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（默认 `24h`，`false` 禁用）会修剪隔离运行会话条目。`cron.runLog.keepLines` 会限制每个任务保留的 SQLite 运行历史行数；`maxBytes` 为兼容较旧的文件后端运行日志而保留。
  </Accordion>
  <Accordion title="Legacy store migration">
    升级时，运行 `openclaw doctor --fix`，将旧版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件导入 SQLite，并使用 `.migrated` 后缀重命名它们。格式错误的任务行会从运行时跳过，并复制到 `jobs-quarantine.json` 供后续修复或审查。
  </Accordion>
</AccordionGroup>

## 故障排查

### 命令阶梯

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
  <Accordion title="Cron not firing">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行。
    - 对于 `cron` 计划，验证时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行是用 `openclaw cron run <jobId> --due` 检查的，并且该任务尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 投递模式 `none` 表示不预期运行器兜底发送。当有聊天路由可用时，智能体仍可用 `message` 工具直接发送。
    - 缺少投递目标或投递目标无效（`channel`/`to`）表示出站已跳过。
    - 对于 Matrix，复制的或旧版任务如果带有小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。将任务编辑为 Matrix 中精确的 `!room:server` 或 `room:!room:server` 值。
    - 渠道身份验证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果隔离运行只返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递和兜底队列摘要路径，因此不会向聊天发回任何内容。
    - 如果智能体应自行给用户发消息，请检查该任务是否有可用路由（`channel: "last"` 且有先前聊天，或显式渠道/目标）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日重置和空闲重置的新鲜度不基于 `updatedAt`；请参阅 [会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 Gateway 网关记账可能会为路由/状态更新会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，如果文件仍然可用，OpenClaw 可以从转录 JSONL 会话 header 中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为其空闲基线。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 不带 `--tz` 的 cron 使用 Gateway 网关主机时区。
    - 不带时区的 `at` 计划会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务台账
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
