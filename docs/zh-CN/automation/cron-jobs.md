---
read_when:
    - 调度后台任务或唤醒
    - 将外部触发器（webhooks、Gmail）接入 OpenClaw
    - 为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: 用于 Gateway 网关调度器的定时作业、网络钩子和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-07-01T02:57:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关的内置调度器。它会持久化任务，在合适时间唤醒智能体，并可将输出送回聊天渠道或 webhook 端点。

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

## cron 的工作方式

- Cron 在 **Gateway 网关**进程内部运行（不在模型内部运行）。
- 任务定义、运行时状态和运行历史会持久化到 OpenClaw 的共享 SQLite 状态数据库中，因此重启不会丢失计划。
- 升级时，运行 `openclaw doctor --fix`，将旧版 `~/.openclaw/cron/jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件导入 SQLite，并用 `.migrated` 后缀重命名它们。格式错误的任务行会从运行时跳过，并复制到 `jobs-quarantine.json`，以便后续修复或审查。
- `cron.store` 仍然命名逻辑 cron 存储键和 Doctor 导入路径。导入后，编辑该 JSON 文件不再改变活动 cron 任务；请改用 `openclaw cron add|edit|remove` 或 Gateway 网关 cron RPC 方法。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- Gateway 网关启动时，逾期的隔离式智能体轮次任务会被重新调度到频道连接窗口之外，而不是立即重放，因此 Discord/Telegram 启动和原生命令设置在重启后仍能保持响应。
- 一次性任务（`--at`）默认在成功后自动删除。
- 隔离式 cron 运行在完成时会尽力关闭其 `cron:<jobId>` 会话跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤立进程。
- 获得窄范围 cron 自清理授权的隔离式 cron 运行仍可读取调度器状态、经过自过滤的当前任务列表，以及该任务的运行历史，因此状态/Heartbeat 检查可以查看自己的计划，而不会获得更广泛的 cron 变更权限。
- 隔离式 cron 运行也会防止过期的确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 以及类似提示），并且没有后代子智能体运行仍负责最终答案，OpenClaw 会在交付前重新提示一次以获取实际结果。
- 隔离式 cron 运行会使用嵌入式运行中的结构化执行拒绝元数据，包括节点主机 `UNAVAILABLE` 包装器，其嵌套错误消息以 `SYSTEM_RUN_DENIED` 或 `INVALID_REQUEST` 开头，因此被阻止的命令不会被报告为绿色运行，同时普通助手文本也不会被当作拒绝。
- 隔离式 cron 运行还会将运行级智能体失败视为任务错误，即使没有生成回复载荷也是如此，因此模型/提供商失败会增加错误计数并触发失败通知，而不是将任务清除为成功。
- 当隔离式智能体轮次任务达到 `timeoutSeconds` 时，cron 会中止底层智能体运行，并给它一个很短的清理窗口。如果该运行没有排空，Gateway 网关拥有的清理会在 cron 记录超时前强制清除该运行的会话所有权，因此排队的聊天工作不会被遗留在过期的处理会话后面。
- 如果隔离式智能体轮次在运行器启动前或第一次模型调用前停滞，cron 会记录阶段特定的超时，例如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。这些看门狗覆盖嵌入式提供商和 CLI 支持的提供商，在其外部 CLI 进程实际启动前生效，并且与较长的 `timeoutSeconds` 值独立设限，因此冷启动/凭证/上下文失败会快速暴露，而不是等待完整任务预算。
- 如果你使用系统 cron 或其他外部调度器运行 `openclaw agent`，即使 CLI 会处理 `SIGTERM`/`SIGINT`，也要用硬终止升级机制包装它。Gateway 网关支持的运行会请求 Gateway 网关中止已接受的运行；本地和嵌入式回退运行会收到相同的中止信号。对于 GNU `timeout`，优先使用 `timeout -k 60 600 openclaw agent ...`，而不是普通的 `timeout 600 ...`；如果进程无法排空，`-k` 值就是监督器的兜底。对于 systemd 单元，使用 `SIGTERM` 停止信号加上宽限窗口（例如 `TimeoutStopSec`），在任何最终终止前保持相同形态。如果某次重试在原始 Gateway 网关运行仍处于活动状态时复用 `--run-id`，该重复运行会被报告为进行中，而不是启动第二个运行。

<a id="maintenance"></a>

<Note>
cron 的任务对账首先由运行时拥有，其次由持久历史支持：当 cron 运行时仍跟踪该任务为运行中时，活动 cron 任务会保持实时状态，即使旧的子会话行仍然存在。一旦运行时不再拥有该任务，并且 5 分钟宽限窗口到期，维护检查会为匹配的 `cron:<jobId>:<startedAt>` 运行检查持久化运行日志和任务状态。如果该持久历史显示终态结果，任务账本会据此完成；否则 Gateway 网关拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但它不会把自己进程内的空活动任务集合当作 Gateway 网关拥有的 cron 运行已消失的证明。
</Note>

## 计划类型

| 类型    | CLI 标志  | 描述                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every` | 固定间隔                                          |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz` |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地墙钟时间调度。

整点重复表达式会自动错开最多 5 分钟，以降低负载峰值。使用 `--exact` 强制精确时间，或使用 `--stagger 30s` 指定显式窗口。

### 月份日期和星期日期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月份日期和星期日期字段都不是通配符时，croner 会在**任一**字段匹配时匹配，而不是两个字段都匹配。这是标准 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5-6 次，而不是每月 0-1 次。OpenClaw 在这里使用 Croner 的默认 OR 行为。若要要求两个条件都满足，请使用 Croner 的 `+` 星期日期修饰符（`0 9 15 * +1`），或在一个字段上调度，并在任务提示词或命令中防护另一个条件。

## 执行样式

| 样式           | `--session` 值   | 运行位置                  | 最适合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话    | `main`              | 专用 cron 唤醒通道 | 提醒、系统事件        |
| 隔离式        | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务      |
| 当前会话 | `current`           | 创建时绑定   | 感知上下文的重复工作    |
| 自定义会话  | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **主会话**任务会将系统事件排入 cron 拥有的运行通道，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。它们可以使用目标主会话的最后交付上下文进行回复，但不会将常规 cron 轮次追加到人工聊天通道，也不会延长目标会话的每日/空闲重置新鲜度。**隔离式**任务会使用全新会话运行专用智能体轮次。**自定义会话**（`session:xxx`）会跨运行持久化上下文，从而支持每日站会等基于先前摘要构建的工作流。

    主会话 cron 事件是自包含的系统事件提醒。它们不会自动包含默认 Heartbeat 提示词中的 “Read HEARTBEAT.md” 指令。如果重复提醒应查询 `HEARTBEAT.md`，请在 cron 事件文本或智能体自己的指令中明确说明。

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    对于隔离式任务，“全新会话”是指每次运行都有新的转录/会话 ID。OpenClaw 可能会携带安全偏好，例如 thinking/fast/verbose 设置、标签，以及用户明确选择的模型/凭证覆盖，但它不会从旧的 cron 行继承环境对话上下文：频道/群组路由、发送或队列策略、提权、来源或 ACP 运行时绑定。当重复任务应有意基于同一对话上下文构建时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="Runtime cleanup">
    对于隔离式任务，运行时拆卸现在包括针对该 cron 会话的尽力浏览器清理。清理失败会被忽略，因此实际 cron 结果仍然优先。

    隔离式 cron 运行还会通过共享运行时清理路径释放为该任务创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆卸方式一致，因此隔离式 cron 任务不会在运行之间泄漏 stdio 子进程或长生命周期 MCP 连接。

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    当隔离式 cron 运行编排子智能体时，交付也会优先使用最终后代输出，而不是过期的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是宣布它。

    对于仅文本的 Discord announce 目标，OpenClaw 只发送一次规范最终助手文本，而不是同时重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍会作为单独载荷交付，因此附件和组件不会丢失。

  </Accordion>
</AccordionGroup>

### 命令载荷

对于应在 Gateway 网关调度器内部运行、且不启动模型支持的隔离式智能体轮次的确定性脚本，请使用命令载荷。命令任务在 Gateway 网关主机上执行，捕获 stdout/stderr，在 cron 历史中记录运行，并复用与隔离式任务相同的 `announce`、`webhook` 和 `none` 交付模式。

<Note>
命令 cron 是操作员管理员 Gateway 网关自动化表面，不是智能体 `tools.exec` 调用。创建、更新、移除或手动运行 cron 任务需要 `operator.admin`；后续计划命令运行会在 Gateway 网关进程内部作为该管理员编写的自动化执行。智能体 exec 策略（例如 `tools.exec.mode`、审批提示和按智能体配置的工具允许列表）管理模型可见的 exec 工具，而不是命令 cron 载荷。
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

`--command <shell>` 会存储 `argv: ["sh", "-lc", <shell>]`。如果你想要不经 shell 解析的精确 argv 执行，请使用 `--command-argv '["node","scripts/report.mjs"]'`。可选的 `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds` 和 `--output-max-bytes` 字段控制进程环境、stdin 和输出边界。

如果 stdout 非空，该文本就是已交付的结果。如果 stdout 为空且 stderr 非空，则交付 stderr。如果两个流都存在，cron 会交付一个小型 `stdout:` / `stderr:` 块。零退出码会将本次运行记录为 `ok`；非零退出、信号、超时或无输出超时会记录为 `error`，并可能触发失败告警。只打印 `NO_REPLY` 的命令会使用常规 cron 静默令牌抑制，并且不会向聊天回发任何内容。

### 隔离任务的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离模式必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该任务选定的允许模型。
</ParamField>
<ParamField path="--fallbacks" type="string">
  按任务设置的备用模型列表，例如 `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。传入 `--fallbacks ""` 可进行无备用模型的严格运行。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  在 `cron edit` 中，移除按任务设置的备用模型覆盖，使该任务遵循已配置的备用优先级。不能与 `--fallbacks` 组合使用。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  在 `cron edit` 中，移除按任务设置的模型覆盖，使该任务遵循常规 cron 模型选择优先级（如果设置了已存储的 cron 会话覆盖，则使用它，否则使用智能体/默认模型）。不能与 `--model` 组合使用。
</ParamField>
<ParamField path="--thinking" type="string">
  思考级别覆盖。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  在 `cron edit` 中，移除按任务设置的思考覆盖，使该任务遵循常规 cron 思考优先级。不能与 `--thinking` 组合使用。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制该任务可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用选定的允许模型作为该任务的主模型。它不同于聊天会话的 `/model` 覆盖：当任务主模型失败时，已配置的备用链仍会生效。如果请求的模型不被允许或无法解析，cron 会以明确的验证错误让本次运行失败，而不是静默回退到该任务的智能体/默认模型选择。

Cron 任务也可以携带载荷级别的 `fallbacks`。当它存在时，该列表会替换该任务已配置的备用链。当你想要只尝试选定模型的严格 cron 运行时，请在任务载荷/API 中使用 `fallbacks: []`。如果任务有 `--model`，但既没有载荷备用模型，也没有已配置的备用模型，OpenClaw 会传入显式的空备用覆盖，避免将智能体主模型作为隐藏的额外重试目标追加进去。

本地提供商预检会先遍历已配置的备用模型，然后才将 cron 运行标记为 `skipped`；`fallbacks: []` 会让该预检路径保持严格。

隔离任务的模型选择优先级为：

1. Gmail 钩子模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 按任务设置的载荷 `model`
3. 用户选定并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果选定的模型配置包含 `params.fastMode`，隔离 cron 默认会使用它。已存储的会话 `fastMode` 覆盖仍会在任一方向上优先于配置。自动模式会在存在时使用选定模型的 `params.fastAutoOnSeconds` 截止值，默认值为 60 秒。

如果隔离运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为当前运行持久化该实时选择。当切换还携带新的身份验证配置文件时，cron 也会为当前运行持久化该身份验证配置文件覆盖。重试有上限：初始尝试加 2 次切换重试之后，cron 会中止，而不是无限循环。

在隔离 cron 运行进入智能体运行器之前，OpenClaw 会检查已配置的本地提供商端点是否可达，这些提供商包括 `api: "ollama"` 和 `api: "openai-completions"` 且 `baseUrl` 为 local loopback、私有网络或 `.local`。如果该端点宕机，本次运行会被记录为 `skipped`，并给出清晰的提供商/模型错误，而不是启动模型调用。端点结果会缓存 5 分钟，因此许多使用同一个不可用本地 Ollama、vLLM、SGLang 或 LM Studio 服务器的到期任务会共享一次小型探测，而不是制造请求风暴。被提供商预检跳过的运行不会增加执行错误退避；如果你希望收到重复跳过通知，请启用 `failureAlert.includeSkipped`。

## 交付和输出

| 模式       | 发生的情况                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则将最终文本回退交付给目标 |
| `webhook`  | 将完成事件载荷 POST 到一个 URL                                |
| `none`     | 无运行器回退交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 进行频道交付。对于 Telegram 论坛主题，请使用 `-1001234567890:topic:123`；OpenClaw 也接受 Telegram 拥有的 `-1001234567890:123` 简写。直接 RPC/配置调用方可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

当 announce 交付使用 `channel: "last"` 或省略 `channel` 时，诸如 `telegram:123` 这样的提供商前缀目标可以在 cron 回退到会话历史或单个已配置频道之前选择频道。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，目标前缀必须命名同一提供商；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝，而不是让 WhatsApp 将 Telegram ID 解释为电话号码。目标类型和服务前缀（例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`）仍然是频道拥有的目标语法，而不是提供商选择器。

对于隔离任务，聊天交付是共享的。如果聊天路由可用，即使任务使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体轮次之后如何处理最终回复。

当智能体从活动聊天创建隔离提醒时，OpenClaw 会为回退 announce 路由存储保留的实时交付目标。内部会话键可以是小写；当当前聊天上下文可用时，不会从这些键重建提供商交付目标。

隐式 announce 交付会使用已配置的频道允许列表来验证并重路由陈旧目标。私信配对存储审批不是回退自动化接收方；当定时任务应主动发送到私信时，请设置 `delivery.to` 或配置频道的 `allowFrom` 条目。

## 输出语言

Cron 任务不会从频道、区域设置或以前的
消息中推断回复语言。请将语言规则放入定时消息或模板中：

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

对于模板文件，请在渲染后的提示词中保留语言指令，并在任务运行前验证
`{{language}}` 等占位符已填充。如果输出混用多种语言，请明确规则，例如：“叙述文本使用中文，技术术语保留英文。”

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 按任务覆盖该设置。
- 如果两者都未设置，且该任务已经通过 `announce` 投递，失败通知现在会回退到该主要 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 任务，除非主要投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 会让某个任务或全局 cron 告警策略启用重复跳过运行告警。跳过运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。

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
  <Tab title="重复的隔离任务">
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

## Webhook

Gateway 网关可以暴露 HTTP webhook 端点，用于外部触发器。在配置中启用：

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

每个请求都必须通过请求头包含 hook token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串 token 会被拒绝。

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
    运行一次隔离的智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射的 hook（POST /hooks/<name>）">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
请将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用钩子令牌；不要复用 Gateway 网关认证令牌。
- 将 `hooks.path` 保持在专用子路径上；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制钩子可以指向哪个有效智能体，包括省略 `agentId` 时的默认智能体。
- 除非需要由调用方选择会话，否则保持 `hooks.allowRequestSessionKey=false`。
- 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形状。
- 钩子载荷默认会用安全边界包裹。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw 钩子、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且已设置 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve` 并自动续订监听。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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
  <Step title="启动监听">
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

## 管理作业

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

`openclaw cron run <jobId>` 会在手动运行入队后返回。对必须阻塞到队列运行完成的关闭钩子、维护脚本或其他自动化，请使用 `--wait`。等待模式会轮询准确返回的 `runId`；状态为 `ok` 时以 `0` 退出，状态为 `error`、`skipped` 或等待超时时以非零值退出。

智能体 `cron` 工具会从 `cron(action: "list")` 返回紧凑的作业摘要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）；使用 `cron(action: "get", jobId: "...")` 获取一个完整作业定义。直接 Gateway 网关调用方可以向 `cron.list` 传递 `compact: true`；省略它会保留现有的完整响应和投递预览。

`openclaw cron create` 是 `openclaw cron add` 的别名，新作业可以使用位置式计划（`"0 9 * * 1"`、`"every 1h"`、`"20m"` 或 ISO 时间戳），后面跟随位置式智能体提示词。在 `cron add|create` 或 `cron edit` 上使用 `--webhook <url>`，可将已完成运行的载荷 POST 到 HTTP 端点。Webhook 投递不能与 `--announce`、`--channel`、`--to`、`--thread-id` 或 `--account` 等聊天投递标志组合使用。在 `cron edit` 中，`--clear-channel`、`--clear-to`、`--clear-thread-id` 和 `--clear-account` 会分别取消设置这些路由字段（每个都会在与其匹配的设置标志同时出现时被拒绝），这不同于 `--no-deliver` 禁用运行器回退投递。

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改作业选定的模型。
- 如果允许该模型，准确的提供商/模型会进入隔离的智能体运行。
- 如果不允许或无法解析，cron 会以明确的验证错误使该运行失败。
- API `cron.update` 载荷补丁可以设置 `model: null` 来清除已存储的作业模型覆盖。
- `openclaw cron edit <job-id> --clear-model` 会从 CLI 清除该覆盖（效果与 `model: null` 补丁相同），且不能与 `--model` 组合使用。
- 已配置的回退链仍会生效，因为 cron `--model` 是作业主模型，而不是会话 `/model` 覆盖。
- `openclaw cron add|edit --fallbacks ...` 会设置载荷 `fallbacks`，替换该作业配置的回退；`--fallbacks ""` 会禁用回退并使运行严格执行。`openclaw cron edit <job-id> --clear-fallbacks` 会清除每作业覆盖。
- 没有显式或已配置回退列表的普通 `--model`，不会静默回退到智能体主模型作为额外重试目标。

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

`maxConcurrentRuns` 会限制计划 cron 分发和隔离智能体轮次执行，默认值为 8。隔离 cron 智能体轮次会在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可让独立 cron LLM 运行并行推进，而不是只启动其外层 cron 包装器。共享的非 cron `nested` 通道不会被此设置扩宽。

`cron.store` 是逻辑存储键和旧版 Doctor 导入路径。运行 `openclaw doctor --fix` 可将现有 JSON 存储导入 SQLite 并归档；后续 cron 更改应通过 CLI 或 Gateway 网关 API 完成。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）会以指数退避最多重试 3 次。永久性错误会立即禁用。

    **周期性重试**：重试之间使用指数退避（30 秒到 60 分钟）。下次成功运行后会重置退避。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）会清理隔离运行会话条目。`cron.runLog.keepLines` 会限制每个作业保留的 SQLite 运行历史行数；`maxBytes` 会为了与较旧的文件后端运行日志保持配置兼容而保留。
  </Accordion>
</AccordionGroup>

## 故障排除

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
  <Accordion title="Cron 未触发">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行。
    - 对于 `cron` 计划，验证时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行是用 `openclaw cron run <jobId> --due` 检查的，且该作业尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但没有投递">
    - 投递模式 `none` 表示不应有运行器回退发送。当聊天路由可用时，智能体仍可使用 `message` 工具直接发送。
    - 投递目标缺失/无效（`channel`/`to`）表示出站已跳过。
    - 对于 Matrix，复制的或旧版作业如果带有小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。将作业编辑为来自 Matrix 的准确 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果隔离运行只返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制回退队列摘要路径，因此不会向聊天发回任何内容。
    - 如果智能体应自行给用户发消息，请检查该作业是否有可用路由（`channel: "last"` 且存在之前的聊天，或显式渠道/目标）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止 /new 样式轮转">
    - 每日和空闲重置新鲜度不基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、exec 通知和 Gateway 网关记账可能会更新用于路由/状态的会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，当文件仍可用时，OpenClaw 可以从转录 JSONL 会话头恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为其空闲基线。

  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 Cron 使用 Gateway 网关主机时区。
    - 不带时区的 `at` 计划会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
