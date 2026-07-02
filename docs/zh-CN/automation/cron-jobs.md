---
read_when:
    - 调度后台作业或唤醒
    - 将外部触发器（网络钩子、Gmail）接入 OpenClaw
    - 在 Heartbeat 和 cron 之间选择用于定时任务
sidebarTitle: Scheduled tasks
summary: 定时作业、Webhook 和 Gmail PubSub 触发器，用于 Gateway 网关调度器
title: 定时任务
x-i18n:
    generated_at: "2026-07-02T07:57:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关的内置调度器。它会持久化作业，在正确时间唤醒智能体，并可将输出送回聊天渠道或 webhook 端点。

## 快速开始

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron 的工作方式

- Cron 在 **Gateway 网关内部** 进程中运行（不是在模型中）。
- 作业定义、运行时状态和运行历史会持久化到 OpenClaw 的共享 SQLite 状态数据库中，因此重启不会丢失计划任务。
- 升级时，运行 `openclaw doctor --fix`，将旧版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件导入 SQLite，并用 `.migrated` 后缀重命名。格式错误的作业行会从运行时跳过，并复制到 `jobs-quarantine.json`，供之后修复或审查。
- `cron.store` 仍然命名逻辑 Cron 存储键和 Doctor 导入路径。导入后，编辑该 JSON 文件不再改变活跃 Cron 作业；请改用 `openclaw cron add|edit|remove` 或 Gateway 网关 Cron RPC 方法。
- 所有 Cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- Gateway 网关启动时，逾期的隔离智能体轮次作业会被重新调度到渠道连接窗口之外，而不是立即重放，因此 Discord/Telegram 启动和原生命令设置在重启后仍能保持响应。
- 一次性作业（`--at`）默认在成功后自动删除。
- 隔离 Cron 运行完成时，会尽力关闭其 `cron:<jobId>` 会话中跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤立进程。
- 获得窄范围 Cron 自清理授权的隔离 Cron 运行仍可读取调度器状态、自过滤的当前作业列表以及该作业的运行历史，因此状态/Heartbeat 检查可以检查自己的计划，而不会获得更广泛的 Cron 变更权限。
- 隔离 Cron 运行还会防止过时的确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 以及类似提示），并且没有后代子智能体运行仍负责最终答案，OpenClaw 会在投递前重新提示一次以获取实际结果。
- 隔离 Cron 运行会使用嵌入式运行中的结构化执行拒绝元数据，包括 node-host `UNAVAILABLE` 包装器，其嵌套错误消息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 开头，因此被阻止的命令不会被报告为绿色运行，同时普通助手文本也不会被当作拒绝。
- 隔离 Cron 运行还会将运行级智能体失败视为作业错误，即使没有生成回复载荷也是如此，因此模型/提供商失败会增加错误计数并触发失败通知，而不是将作业清为成功。
- 当隔离智能体轮次作业达到 `timeoutSeconds` 时，Cron 会中止底层智能体运行，并给它一个短暂的清理窗口。如果运行没有排空，Gateway 网关拥有的清理会在 Cron 记录超时前强制清除该运行的会话所有权，因此排队的聊天工作不会卡在过时的处理中会话后面。
- 如果隔离智能体轮次在运行器启动前或第一次模型调用前停滞，Cron 会记录特定阶段的超时，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。这些看门狗覆盖嵌入式提供商和 CLI 后端提供商在其外部 CLI 进程实际启动前的阶段，并且独立于较长的 `timeoutSeconds` 值设置上限，因此冷启动/认证/上下文失败会快速暴露，而不是等待完整作业预算。
- 如果你使用系统 Cron 或另一个外部调度器运行 `openclaw agent`，即使 CLI 会处理 `SIGTERM`/`SIGINT`，也请用硬终止升级机制包装它。Gateway 网关后端运行会请求 Gateway 网关中止已接受的运行；本地和嵌入式回退运行会收到相同的中止信号。对于 GNU `timeout`，优先使用 `timeout -k 60 600 openclaw agent ...`，而不是普通的 `timeout 600 ...`；`-k` 值是在进程无法排空时的监督器兜底。对于 systemd 单元，保持相同形态：使用 `SIGTERM` 停止信号，加上像 `TimeoutStopSec` 这样的宽限窗口，然后再执行任何最终终止。如果重试在原始 Gateway 网关运行仍处于活跃状态时复用 `--run-id`，该重复运行会被报告为进行中，而不是启动第二个运行。

<a id="maintenance"></a>

<Note>
Cron 的任务协调首先由运行时拥有，其次由持久历史支撑：只要 Cron 运行时仍将该作业跟踪为正在运行，活跃 Cron 任务就保持存活，即使旧的子会话行仍然存在。一旦运行时不再拥有该作业，并且 5 分钟宽限窗口过期，维护检查会为匹配的 `cron:<jobId>:<startedAt>` 运行检查持久化运行日志和作业状态。如果该持久历史显示终态结果，任务账本会从中完成；否则 Gateway 网关拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但它不会把自身空的进程内活跃作业集当作 Gateway 网关拥有的 Cron 运行已经消失的证明。
</Note>

## 计划类型

| 类型    | CLI 标志  | 描述                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every` | 固定间隔                                          |
| `cron`  | `--cron`  | 5 字段或 6 字段 Cron 表达式，可选 `--tz` |

不带时区的时间戳会按 UTC 处理。添加 `--tz America/New_York` 可进行本地挂钟时间调度。

整点重复表达式会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 强制精确时间，或使用 `--stagger 30s` 指定显式窗口。

### 月日和星期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月日和星期字段都不是通配符时，croner 会在**任一**字段匹配时匹配，而不是两个字段都匹配。这是标准 Vixie Cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5 到 6 次，而不是每月 0 到 1 次。OpenClaw 在这里使用 Croner 的默认 OR 行为。若要要求两个条件都满足，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或在一个字段上调度，并在你的作业提示词或命令中守卫另一个字段。

## 执行方式

| 方式           | `--session` 值   | 运行位置                  | 最适合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话    | `main`              | 专用 Cron 唤醒通道 | 提醒、系统事件        |
| 隔离        | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务      |
| 当前会话 | `current`           | 创建时绑定   | 感知上下文的重复工作    |
| 自定义会话  | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **主会话**作业会将系统事件排入 Cron 拥有的运行通道，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。它们可以使用目标主会话的最后投递上下文进行回复，但不会把常规 Cron 轮次追加到人工聊天通道，也不会延长目标会话的每日/空闲重置新鲜度。**隔离**作业会用新会话运行专用智能体轮次。**自定义会话**（`session:xxx`）会跨运行保留上下文，从而支持基于先前摘要构建的每日站会等工作流。

    主会话 Cron 事件是自包含的系统事件提醒。它们不会
    自动包含默认 Heartbeat 提示词中的“读取
    HEARTBEAT.md”指令。如果重复提醒应查阅
    `HEARTBEAT.md`，请在 Cron 事件文本或
    智能体自己的指令中明确说明。

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    对于隔离作业，“新会话”表示每次运行都有新的转录/会话 ID。OpenClaw 可能会携带安全偏好，例如思考/快速/详细设置、标签，以及用户显式选择的模型/认证覆盖，但它不会从较旧的 Cron 行继承环境对话上下文：渠道/群组路由、发送或队列策略、提权、来源或 ACP 运行时绑定。当重复作业应有意基于同一对话上下文构建时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="Runtime cleanup">
    对于隔离作业，运行时拆除现在包括针对该 Cron 会话的尽力浏览器清理。清理失败会被忽略，因此实际 Cron 结果仍优先。

    隔离 Cron 运行还会通过共享运行时清理路径释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆除方式一致，因此隔离 Cron 作业不会跨运行泄漏 stdio 子进程或长生命周期 MCP 连接。

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    当隔离 Cron 运行编排子智能体时，投递也会优先选择最终后代输出，而不是过时的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是宣布它。

    对于纯文本 Discord 公告目标，OpenClaw 只发送一次规范最终助手文本，而不是同时重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍作为单独载荷投递，因此附件和组件不会被丢弃。

  </Accordion>
</AccordionGroup>

### 命令载荷

对于应在 Gateway 网关调度器内部运行、且不启动模型后端隔离智能体轮次的确定性脚本，请使用命令载荷。命令作业在 Gateway 网关主机上执行，捕获 stdout/stderr，在 Cron 历史中记录运行，并复用与隔离作业相同的 `announce`、`webhook` 和 `none` 投递模式。

<Note>
命令 Cron 是操作员管理员 Gateway 网关自动化表面，不是智能体
`tools.exec` 调用。创建、更新、删除或手动运行 Cron 作业
需要 `operator.admin`；计划命令运行随后会在
Gateway 网关进程内作为该管理员编写的自动化执行。智能体 Exec 策略（例如
`tools.exec.mode`、审批提示和按智能体配置的工具 allowlist）管控
模型可见的 Exec 工具，而不是命令 Cron 载荷。
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

`--command <shell>` 存储 `argv: ["sh", "-lc", <shell>]`。当你想要无需 shell 解析的精确 argv 执行时，请使用 `--command-argv '["node","scripts/report.mjs"]'`。可选的 `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds` 和 `--output-max-bytes` 字段控制进程环境、stdin 和输出边界。

如果 stdout 非空，该文本就是交付结果。如果 stdout 为空且 stderr 非空，则交付 stderr。如果两个流都存在，cron 会交付一个小的 `stdout:` / `stderr:` 块。零退出码会将本次运行记录为 `ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并可能触发失败告警。只打印 `NO_REPLY` 的命令会使用普通的 cron 静默令牌抑制机制，不会向聊天回发任何内容。

### 隔离作业的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离模式必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选定的允许模型。
</ParamField>
<ParamField path="--fallbacks" type="string">
  每作业回退模型列表，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。传入 `--fallbacks ""` 可进行无回退的严格运行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 中，移除每作业回退覆盖，使作业遵循已配置的回退优先级。不能与 `--fallbacks` 组合使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 中，移除每作业模型覆盖，使作业遵循普通 cron 模型选择优先级（如果已设置，则使用已存储的 cron 会话覆盖，否则使用智能体/默认模型）。不能与 `--model` 组合使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考级别覆盖。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 中，移除每作业思考覆盖，使作业遵循普通 cron 思考优先级。不能与 `--thinking` 组合使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用选定的允许模型作为该作业的主模型。它不同于聊天会话的 `/model` 覆盖：当作业主模型失败时，已配置的回退链仍会生效。如果请求的模型不被允许或无法解析，cron 会以明确的验证错误使本次运行失败，而不是静默回退到作业的智能体/默认模型选择。

Cron 作业也可以携带载荷级 `fallbacks`。存在时，该列表会替换该作业已配置的回退链。当你希望严格的 cron 运行只尝试选定模型时，请在作业载荷/API 中使用 `fallbacks: []`。如果作业有 `--model`，但既没有载荷回退也没有已配置回退，OpenClaw 会传入显式的空回退覆盖，使智能体主模型不会被追加为隐藏的额外重试目标。

本地提供商预检会在将 cron 运行标记为 `skipped` 之前遍历已配置的回退；`fallbacks: []` 会让该预检路径保持严格。

隔离作业的模型选择优先级为：

1. Gmail 钩子模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每作业载荷 `model`
3. 用户选定并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果选定模型配置包含 `params.fastMode`，隔离 cron 默认使用该设置。已存储的会话 `fastMode` 覆盖仍会在两个方向上优先于配置。自动模式会在存在时使用选定模型的 `params.fastAutoOnSeconds` 截止值，默认值为 60 秒。

如果隔离运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为当前运行持久化该实时选择。当切换还携带新的凭证配置文件时，cron 也会为当前运行持久化该凭证配置文件覆盖。重试有上限：初始尝试加上 2 次切换重试后，cron 会中止，而不是无限循环。

在隔离 cron 运行进入智能体运行器之前，OpenClaw 会检查已配置的 `api: "ollama"` 和 `api: "openai-completions"` 提供商中可达的本地提供商端点，其 `baseUrl` 为 loopback、私有网络或 `.local`。如果该端点宕机，本次运行会以清晰的提供商/模型错误记录为 `skipped`，而不是启动模型调用。端点结果会缓存 5 分钟，因此许多到期作业使用同一个不可用的本地 Ollama、vLLM、SGLang 或 LM Studio 服务器时，会共享一次小型探测，而不是制造请求风暴。被提供商预检跳过的运行不会增加执行错误退避；当你希望重复收到跳过通知时，请启用 `failureAlert.includeSkipped`。

## 交付和输出

| 模式       | 发生的事情                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则将最终文本回退交付给目标 |
| `webhook`  | 将完成事件载荷 POST 到 URL                                |
| `none`     | 无运行器回退交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 进行频道交付。对于 Telegram 论坛话题，使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 所有的 `-1001234567890:123` 简写。直接 RPC/配置调用方可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用确切的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

当 announce 交付使用 `channel: "last"` 或省略 `channel` 时，像 `telegram:123` 这样的提供商前缀目标可以在 cron 回退到会话历史或单个已配置频道之前选择频道。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，目标前缀必须命名同一提供商；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝，而不是让 WhatsApp 将 Telegram ID 解释为电话号码。目标类型和服务前缀，例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`，仍然是频道拥有的目标语法，而不是提供商选择器。

对于隔离作业，聊天交付是共享的。如果聊天路由可用，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体轮次结束后如何处理最终回复。

当智能体从活跃聊天创建隔离提醒时，OpenClaw 会存储保留的实时交付目标，用于回退 announce 路由。内部会话键可能是小写；当当前聊天上下文可用时，不会从这些键重建提供商交付目标。

隐式 announce 交付使用已配置的频道允许列表来验证并重路由陈旧目标。私信配对存储批准不是回退自动化接收方；当定时作业应主动发送到私信时，请设置 `delivery.to` 或配置频道 `allowFrom` 条目。

## 输出语言

Cron 作业不会根据频道、区域设置或以前的消息推断回复语言。请将语言规则放在定时消息或模板中：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

对于模板文件，请在渲染后的提示词中保留语言指令，并在作业运行前验证 `{{language}}` 等占位符已填充。如果输出混用多种语言，请明确规则，例如：“叙述性文本使用中文，并保留英文技术术语。”

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 按作业覆盖该值。
- 如果两者都未设置，且作业已经通过 `announce` 投递，失败通知现在会回退到该主要 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业，除非主要投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 让作业或全局 cron 告警策略启用重复跳过运行告警。跳过的运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。

## CLI 示例

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

## Webhook

Gateway 网关可以公开 HTTP webhook 端点供外部触发器使用。在配置中启用：

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

每个请求都必须通过标头包含 hook 令牌：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串令牌会被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    为主会话将一个系统事件加入队列：

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
    运行一个隔离的 agent 轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
请将 hook 端点置于 loopback、tailnet 或受信任的反向代理之后。

- 使用专用 hook token；不要复用 Gateway 网关认证 token。
- 将 `hooks.path` 保持在专用子路径；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 来限制 hook 可以指向哪个有效智能体，包括省略 `agentId` 时的默认智能体。
- 除非你需要由调用方选择会话，否则保持 `hooks.allowRequestSessionKey=false`。
- 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形态。
- hook 载荷默认会用安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器连接到 OpenClaw。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve` 并自动续期 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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

## 管理任务

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

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

`openclaw cron run <jobId>` 会在手动运行入队后返回。对于关闭 hook、维护脚本或其他必须阻塞直到队列运行完成的自动化，请使用 `--wait`。等待模式会轮询确切返回的 `runId`；状态为 `ok` 时退出码为 `0`，状态为 `error`、`skipped` 或等待超时时退出码为非零。

智能体 `cron` 工具会从 `cron(action: "list")` 返回紧凑任务摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；使用 `cron(action: "get", jobId: "...")` 获取一个完整任务定义。直接调用 Gateway 网关的调用方可以向 `cron.list` 传入 `compact: true`；省略它会保留现有的带交付预览的完整响应。

`openclaw cron create` 是 `openclaw cron add` 的别名，新任务可以使用一个位置参数计划（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 时间戳），后面跟一个位置参数智能体提示词。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，可将已完成运行的载荷 POST 到 HTTP 端点。Webhook 交付不能与聊天交付标志组合使用，例如 `--announce`、`--channel`、`--to`、`--thread-id` 或 `--account`。在 `cron edit` 上，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 会分别取消设置这些路由字段（每个都会在与其对应的设置标志同时出现时被拒绝），这不同于 `--no-deliver` 禁用 runner 回退交付。

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改任务选定的模型。
- 如果模型被允许，那个确切的提供商/模型会进入隔离的智能体运行。
- 如果不被允许或无法解析，cron 会以明确的验证错误让该运行失败。
- API `cron.update` 载荷补丁可以设置 `model: null` 来清除已存储的任务模型覆盖。
- `openclaw cron edit <job-id> --clear-model` 会从 CLI 清除该覆盖（效果与 `model: null` 补丁相同），且不能与 `--model` 组合使用。
- 已配置的回退链仍会适用，因为 cron `--model` 是任务主模型，而不是会话 `/model` 覆盖。
- `openclaw cron add|edit --fallbacks ...` 会设置载荷 `fallbacks`，替换该任务的已配置回退；`--fallbacks ""` 会禁用回退并使运行严格执行。`openclaw cron edit <job-id> --clear-fallbacks` 会清除每任务覆盖。
- 没有显式或已配置回退列表的普通 `--model` 不会静默地回退到智能体主模型作为额外重试目标。

</Note>

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` 同时限制计划 cron 派发和隔离智能体轮次执行，默认值为 8。隔离的 cron 智能体轮次会在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值会让独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会被此设置扩宽。

`cron.store` 是逻辑存储键和旧版 Doctor 导入路径。运行 `openclaw doctor --fix` 将现有 JSON 存储导入 SQLite 并归档；未来的 cron 更改应通过 CLI 或 Gateway 网关 API 完成。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久错误会立即禁用。

    **周期性重试**：重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后退避会重置。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（默认 `24h`）会清理隔离运行会话条目。`cron.runLog.keepLines` 限制每个任务保留的 SQLite 运行历史行数；`maxBytes` 会为兼容较旧的文件后端运行日志配置而保留。
  </Accordion>
</AccordionGroup>

## 故障排除

### 命令梯形排查

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
    - 确认 Gateway 网关正在持续运行。
    - 对于 `cron` 计划，验证时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行是用 `openclaw cron run <jobId> --due` 检查的，而该任务尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 交付模式 `none` 表示不期望 runner 回退发送。当聊天路由可用时，智能体仍可使用 `message` 工具直接发送。
    - 交付目标缺失/无效（`channel`/`to`）表示出站已跳过。
    - 对于 Matrix，复制的或旧版任务如果带有小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。将任务编辑为来自 Matrix 的确切 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
    - 如果隔离运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退队列摘要路径，因此不会向聊天发回任何内容。
    - 如果智能体应自行向用户发消息，请检查任务是否有可用路由（带有先前聊天的 `channel: "last"`，或显式渠道/目标）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日和空闲重置新鲜度不基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 Gateway 网关记账可能会为路由/状态更新会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，如果文件仍然可用，OpenClaw 可以从 transcript JSONL 会话头恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为其空闲基线。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 没有 `--tz` 的 Cron 使用 Gateway 网关主机时区。
    - 没有时区的 `at` 计划会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
