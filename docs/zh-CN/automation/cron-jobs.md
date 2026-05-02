---
read_when:
    - 调度后台任务或唤醒
    - 将外部触发器（网络钩子、Gmail）接入 OpenClaw
    - 为定时任务选择 Heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的定时作业、网络钩子和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-05-02T04:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdda94c3c31e4530e0944cd8f5667a7eb567fcff8e602d6a86d5699d078e9b48
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关内置的调度器。它会持久化任务，在正确时间唤醒智能体，并且可以把输出送回聊天渠道或 webhook 端点。

## 快速开始

<Steps>
  <Step title="添加一次性提醒">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="检查你的任务">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="查看运行历史">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron 的工作方式

- Cron 在 **Gateway 网关** 进程内运行（不是在模型内）。
- 任务定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失计划。
- 运行时执行状态会持久化到旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 拆分后，较旧的 OpenClaw 版本可以读取 `jobs.json`，但可能会把任务视为全新任务，因为运行时字段现在位于 `jobs-state.json`。
- 当 `jobs.json` 在 Gateway 网关运行或停止时被编辑，OpenClaw 会将变更后的计划字段与待处理的运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。纯格式化或仅键顺序的重写会保留待处理槽位。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- Gateway 网关启动时，已逾期的隔离智能体回合任务会被重新安排到渠道连接窗口之外，而不是立即重放，因此 Discord/Telegram 启动和原生命令设置在重启后仍保持响应。
- 一次性任务（`--at`）默认在成功后自动删除。
- 隔离 cron 运行在完成时会尽力为其 `cron:<jobId>` 会话关闭已跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤立进程。
- 隔离 cron 运行还会防止过期的确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 以及类似提示），并且没有后代子智能体运行仍负责最终答案，OpenClaw 会在交付前重新提示一次以获取实际结果。
- 隔离 cron 运行会优先使用嵌入运行提供的结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被阻止的命令不会被报告为绿色运行。
- 隔离 cron 运行还会将运行级智能体失败视为任务错误，即使没有生成回复载荷也是如此，因此模型/提供商失败会递增错误计数器并触发失败通知，而不是把任务清为成功。
- 当隔离智能体回合任务达到 `timeoutSeconds` 时，cron 会中止底层智能体运行，并给它一个短暂的清理窗口。如果运行没有排空，Gateway 网关拥有的清理会在 cron 记录超时前强制清除该运行的会话所有权，因此排队的聊天工作不会被留在过期的处理中会话之后。

<a id="maintenance"></a>

<Note>
cron 的任务对账首先由运行时拥有，其次由持久历史支撑：只要 cron 运行时仍将该任务跟踪为运行中，活动 cron 任务就会保持存活，即使旧的子会话行仍然存在。一旦运行时停止拥有该任务且 5 分钟宽限窗口到期，维护检查会在持久化运行日志和任务状态中查找匹配的 `cron:<jobId>:<startedAt>` 运行。如果该持久历史显示终止结果，任务账本会据此完成；否则 Gateway 网关拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但它不会把自身空的进程内活动任务集合当作 Gateway 网关拥有的 cron 运行已消失的证明。
</Note>

## 计划类型

| 类型    | CLI 标志  | 描述                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every` | 固定间隔                                          |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz` |

没有时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可进行本地墙钟时间调度。

整点循环表达式会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 强制精确定时，或使用 `--stagger 30s` 指定显式窗口。

### 每月某日和每周某日使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当每月某日和每周某日字段都不是通配符时，croner 会在**任一**字段匹配时视为匹配，而不是两个都匹配。这是标准 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5 到 6 次，而不是每月 0 到 1 次。OpenClaw 在这里使用 Croner 的默认 OR 行为。若要要求两个条件都满足，请使用 Croner 的 `+` 每周某日修饰符（`0 9 15 * +1`），或只按一个字段调度，并在你的任务提示或命令中保护另一个条件。

## 执行样式

| 样式           | `--session` 值   | 运行位置                  | 最适合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话    | `main`              | 下一次 Heartbeat 回合      | 提醒、系统事件        |
| 隔离        | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务      |
| 当前会话 | `current`           | 创建时绑定   | 上下文感知的循环工作    |
| 自定义会话  | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话、隔离与自定义">
    **主会话**任务会将系统事件入队，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**隔离**任务会使用新会话运行专用智能体回合。**自定义会话**（`session:xxx`）会跨运行保留上下文，支持每日站会等基于先前摘要构建的工作流。
  </Accordion>
  <Accordion title="隔离任务中的“新会话”含义">
    对于隔离任务，“新会话”表示每次运行都会有新的转录/会话 ID。OpenClaw 可能会携带安全偏好，例如思考/快速/详细设置、标签，以及显式用户选择的模型/凭证覆盖，但不会从旧 cron 行继承环境会话上下文：渠道/群组路由、发送或队列策略、提权、来源，或 ACP 运行时绑定。当循环任务应当有意基于同一个对话上下文构建时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离任务，运行时拆除现在包括针对该 cron 会话的尽力浏览器清理。清理失败会被忽略，因此实际 cron 结果仍然优先。

    隔离 cron 运行还会通过共享运行时清理路径释放为该任务创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆除方式一致，因此隔离 cron 任务不会在运行之间泄漏 stdio 子进程或长生命周期 MCP 连接。

  </Accordion>
  <Accordion title="子智能体与 Discord 交付">
    当隔离 cron 运行编排子智能体时，交付也会优先使用最终后代输出，而不是过期的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是宣布它。

    对于纯文本 Discord announce 目标，OpenClaw 会发送一次规范最终助手文本，而不是同时重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍会作为单独载荷交付，因此附件和组件不会被丢弃。

  </Accordion>
</AccordionGroup>

### 隔离任务的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离任务必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用该任务所选的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  思考级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制任务可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 会使用所选允许模型作为该任务的主模型。它不同于聊天会话 `/model` 覆盖：当任务主模型失败时，已配置的回退链仍会应用。如果请求的模型不被允许或无法解析，cron 会以显式验证错误使运行失败，而不是静默回退到任务的智能体/默认模型选择。

Cron 任务还可以携带载荷级 `fallbacks`。存在时，该列表会替换该任务的已配置回退链。当你想要严格的 cron 运行、只尝试所选模型时，请在任务载荷/API 中使用 `fallbacks: []`。如果任务有 `--model`，但既没有载荷回退也没有已配置回退，OpenClaw 会传递显式空回退覆盖，因此智能体主模型不会作为隐藏的额外重试目标追加。

隔离任务的模型选择优先级如下：

1. Gmail 钩子模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每任务载荷 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果所选模型配置具有 `params.fastMode`，隔离 cron 默认使用该值。已存储的会话 `fastMode` 覆盖仍会在任一方向上优先于配置。

如果隔离运行命中实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为活动运行持久化该实时选择。当切换还携带新的凭证配置文件时，cron 也会为活动运行持久化该凭证配置文件覆盖。重试有上限：初始尝试加 2 次切换重试后，cron 会中止而不是无限循环。

在隔离 cron 运行进入智能体运行器之前，OpenClaw 会检查可达的本地提供商端点，面向配置了 `api: "ollama"` 和 `api: "openai-completions"` 且其 `baseUrl` 为 loopback、专用网络或 `.local` 的提供商。如果该端点不可用，运行会被记录为 `skipped`，并带有清晰的提供商/模型错误，而不是开始模型调用。端点结果会缓存 5 分钟，因此许多到期任务如果使用同一个宕掉的本地 Ollama、vLLM、SGLang 或 LM Studio 服务器，会共享一次小型探测，而不是制造请求风暴。跳过的提供商预检运行不会递增执行错误退避；当你想要重复跳过通知时，请启用 `failureAlert.includeSkipped`。

## 交付和输出

| 模式       | 发生的事情                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则向目标回退交付最终文本 |
| `webhook`  | 将完成事件载荷 POST 到 URL                                |
| `none`     | 无运行器回退交付                                         |

Use `--announce --channel telegram --to "-1001234567890"` 进行渠道投递。对于 Telegram 论坛主题，请使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

当公告投递使用 `channel: "last"` 或省略 `channel` 时，带提供商前缀的目标（例如 `telegram:123`）可以在 cron 回退到会话历史或单个已配置渠道之前选择渠道。只有已加载插件所声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式设置的，目标前缀必须命名同一个提供商；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝，而不是让 WhatsApp 将 Telegram ID 解释为电话号码。目标类型和服务前缀（例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`）仍然是渠道拥有的目标语法，而不是提供商选择器。

对于隔离作业，聊天投递是共享的。如果聊天路由可用，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过回退公告。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体轮次结束后如何处理最终回复。

当智能体从活动聊天中创建隔离提醒时，OpenClaw 会为回退公告路由存储保留下来的实时投递目标。内部会话键可以是小写；当当前聊天上下文可用时，不会从这些键重建提供商投递目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 会按作业覆盖该设置。
- 如果两者都未设置，并且作业已经通过 `announce` 投递，失败通知现在会回退到该主要公告目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 作业上受支持，除非主要投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 会让作业或全局 cron 警报策略启用重复的跳过运行警报。跳过的运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。

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
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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

每个请求都必须通过标头包含钩子令牌：

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
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自定义钩子名称会通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
请将钩子端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用钩子令牌；不要复用 Gateway 网关身份验证令牌。
- 将 `hooks.path` 保持在专用子路径；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你需要由调用方选择会话，否则保持 `hooks.allowRequestSessionKey=false`。
- 如果启用 `hooks.allowRequestSessionKey`，也请设置 `hooks.allowedSessionKeyPrefixes` 以约束允许的会话键形状。
- 默认情况下，钩子载荷会用安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前提条件：**`gcloud` CLI、`gog`（gogcli）、已启用的 OpenClaw 钩子、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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

## 管理作业

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改作业选择的模型。
- 如果允许该模型，那个精确的提供商/模型会到达隔离智能体运行。
- 如果不允许或无法解析，cron 会以显式验证错误让该运行失败。
- 已配置的回退链仍然适用，因为 cron `--model` 是作业主模型，而不是会话 `/model` 覆盖。
- 载荷 `fallbacks` 会替换该作业已配置的回退；`fallbacks: []` 会禁用回退并让运行变为严格模式。
- 如果没有显式或已配置的回退列表，普通 `--model` 不会静默落入智能体主模型作为额外重试目标。

</Note>

## 配置

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` 会限制计划的 cron 调度和隔离智能体轮次执行。隔离 cron 智能体轮次会在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值会让独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会被此设置拓宽。

运行时状态 sidecar 派生自 `cron.store`：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径会追加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 放入源代码控制。OpenClaw 使用该 sidecar 存放待处理槽位、活动标记、上次运行元数据，以及用于告诉调度器外部编辑的作业何时需要新的 `nextRunAtMs` 的计划身份。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重试**：瞬态错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久错误会立即禁用。

    **重复任务重试**：重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后退避会重置。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（默认 `24h`）会清理隔离运行会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。
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
  <Accordion title="Cron not firing">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行。
    - 对于 `cron` 计划，请核对时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，并且作业尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但没有投递">
    - 投递模式 `none` 表示不会有预期的 runner 回退发送。只要有可用的聊天路由，智能体仍然可以直接用 `message` 工具发送。
    - 投递目标缺失/无效（`channel`/`to`）表示出站已跳过。
    - 对于 Matrix，复制的或旧版任务如果包含小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。请将任务编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果隔离运行只返回静默标记（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制回退的队列摘要路径，因此不会有任何内容发回聊天。
    - 如果智能体应该自己给用户发消息，请检查任务是否有可用路由（`channel: "last"` 且有之前的聊天，或显式的渠道/目标）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止 /new-style 滚动切换">
    - 每日和空闲重置的新鲜度不是基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、exec 通知和 Gateway 网关记账可能会更新用于路由/Status 的会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，只要文件仍可用，OpenClaw 就可以从 transcript JSONL 会话头中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为其空闲基线。

  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 Cron 使用 Gateway 网关主机时区。
    - 不带时区的 `at` 定时会按 UTC 处理。
    - Heartbeat `activeHours` 使用配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化与任务](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — Cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 定期的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
