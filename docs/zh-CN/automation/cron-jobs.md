---
read_when:
    - 调度后台作业或唤醒
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为定时任务在 Heartbeat 和 cron 之间做选择
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的定时作业、网络钩子和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-05-02T07:07:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关内置的调度器。它会持久化作业、在正确时间唤醒智能体，并可将输出传回聊天渠道或 webhook 端点。

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
  <Step title="检查你的作业">
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

## Cron 的工作方式

- Cron 在 **Gateway 网关**进程内运行（不在模型内运行）。
- 作业定义持久化在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失日程。
- 运行时执行状态会持久化在旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json` 并将 `jobs-state.json` 加入 gitignore。
- 拆分后，较旧的 OpenClaw 版本可以读取 `jobs.json`，但可能会把作业视为新的，因为运行时字段现在位于 `jobs-state.json`。
- 当 Gateway 网关正在运行或已停止时编辑了 `jobs.json`，OpenClaw 会将变更后的调度字段与待处理运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。仅格式或键顺序的重写会保留待处理槽位。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- Gateway 网关启动时，逾期的隔离智能体回合作业会被重新调度到渠道连接窗口之外，而不是立即重放，因此 Discord/Telegram 启动和原生命令设置在重启后仍能保持响应。
- 一次性作业（`--at`）默认在成功后自动删除。
- 隔离 cron 运行完成时，会尽力关闭为其 `cron:<jobId>` 会话跟踪的浏览器标签页/进程，因此分离式浏览器自动化不会留下孤立进程。
- 隔离 cron 运行还会防止过期确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 以及类似提示），且没有后代子智能体运行仍负责最终答案，OpenClaw 会在交付前重新提示一次以获取实际结果。
- 隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被阻止的命令不会被报告为绿色运行。
- 隔离 cron 运行还会将运行级智能体失败视为作业错误，即使没有生成回复载荷也是如此，因此模型/提供商失败会递增错误计数器并触发失败通知，而不是将作业清除为成功。
- 当隔离智能体回合作业达到 `timeoutSeconds` 时，cron 会中止底层智能体运行，并给它一个短暂的清理窗口。如果该运行没有排空，由 Gateway 网关拥有的清理会在 cron 记录超时前强制清除该运行的会话所有权，因此排队的聊天工作不会被留在过期的处理中会话后面。

<a id="maintenance"></a>

<Note>
cron 的任务协调首先由运行时拥有，其次由持久历史支撑：只要 cron 运行时仍将该作业跟踪为正在运行，活动 cron 任务就会保持活跃，即使旧的子会话行仍然存在。一旦运行时停止拥有该作业且 5 分钟宽限窗口过期，维护检查会为匹配的 `cron:<jobId>:<startedAt>` 运行检查持久化运行日志和作业状态。如果该持久历史显示终止结果，任务账本会据此完成；否则由 Gateway 网关拥有的维护可将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但它不会把自己进程内的空活动作业集合当作 Gateway 网关拥有的 cron 运行已经消失的证明。
</Note>

## 调度类型

| 类型    | CLI 标志  | 描述                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every` | 固定间隔                                          |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz` |

没有时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可进行本地墙钟时间调度。

整点重复表达式会自动错开最多 5 分钟，以减少负载峰值。使用 `--exact` 强制精确时间，或使用 `--stagger 30s` 指定显式窗口。

### 月日期和周日期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月日期和周日期字段都不是通配符时，croner 会在**任一**字段匹配时匹配，而不是两个都匹配。这是标准 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 的默认 OR 行为。若要要求两个条件同时满足，请使用 Croner 的 `+` 周日期修饰符（`0 9 15 * +1`），或在一个字段上调度，并在你的作业提示或命令中守护另一个条件。

## 执行样式

| 样式           | `--session` 值   | 运行位置                  | 最适合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话    | `main`              | 下一个 Heartbeat 回合      | 提醒、系统事件        |
| 隔离        | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务      |
| 当前会话 | `current`           | 创建时绑定   | 感知上下文的重复工作    |
| 自定义会话  | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话、隔离和自定义">
    **主会话**作业会将系统事件入队，并可选择唤醒 Heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**隔离**作业会以全新会话运行专用智能体回合。**自定义会话**（`session:xxx`）会在多次运行之间持久化上下文，支持基于先前摘要构建的每日站会等工作流。
  </Accordion>
  <Accordion title="隔离作业中“全新会话”的含义">
    对于隔离作业，“全新会话”表示每次运行都有新的 transcript/session id。OpenClaw 可能会携带安全偏好，例如 thinking/fast/verbose 设置、标签，以及显式用户选择的模型/凭证覆盖，但不会从较旧 cron 行继承环境会话上下文：渠道/群组路由、发送或队列策略、提权、来源或 ACP 运行时绑定。当重复作业应有意基于相同对话上下文构建时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离作业，运行时拆卸现在包括对该 cron 会话进行尽力而为的浏览器清理。清理失败会被忽略，因此实际 cron 结果仍然优先。

    隔离 cron 运行还会通过共享运行时清理路径处置为作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆卸方式一致，因此隔离 cron 作业不会在运行之间泄漏 stdio 子进程或长生命周期 MCP 连接。

  </Accordion>
  <Accordion title="子智能体和 Discord 交付">
    当隔离 cron 运行编排子智能体时，交付也会优先使用最终后代输出，而不是过期的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是宣布它。

    对于仅文本的 Discord announce 目标，OpenClaw 会发送一次规范最终助手文本，而不是同时重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍会作为单独载荷交付，因此附件和组件不会被丢弃。

  </Accordion>
</AccordionGroup>

### 隔离作业的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离作业必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选定的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  思考级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区 bootstrap 文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可以使用哪些工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用选定的允许模型作为该作业的主模型。它不同于聊天会话 `/model` 覆盖：当作业主模型失败时，配置的回退链仍会适用。如果请求的模型不被允许或无法解析，cron 会以显式验证错误让运行失败，而不是静默回退到作业的智能体/默认模型选择。

Cron 作业还可以携带载荷级 `fallbacks`。存在时，该列表会替换作业的已配置回退链。当你想要严格的 cron 运行，只尝试选定模型时，请在作业载荷/API 中使用 `fallbacks: []`。如果作业有 `--model`，但既没有载荷回退也没有已配置回退，OpenClaw 会传递显式空回退覆盖，因此智能体主模型不会作为隐藏的额外重试目标追加。

隔离作业的模型选择优先级为：

1. Gmail 钩子模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每作业载荷 `model`
3. 用户选择的已存储 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循解析后的实时选择。如果选定模型配置具有 `params.fastMode`，隔离 cron 默认使用它。已存储会话的 `fastMode` 覆盖在任一方向上仍优先于配置。

如果隔离运行命中实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为活动运行持久化该实时选择。当切换还携带新的凭证配置文件时，cron 也会为活动运行持久化该凭证配置文件覆盖。重试有边界：初始尝试加上 2 次切换重试后，cron 会中止，而不是无限循环。

在隔离 cron 运行进入智能体运行器之前，OpenClaw 会检查已配置 `api: "ollama"` 和 `api: "openai-completions"` 提供商的可达本地提供商端点，这些提供商的 `baseUrl` 是 loopback、私有网络或 `.local`。如果该端点宕机，运行会被记录为 `skipped`，并带有清晰的提供商/模型错误，而不是启动模型调用。端点结果会缓存 5 分钟，因此使用同一个宕机的本地 Ollama、vLLM、SGLang 或 LM Studio 服务器的许多到期作业，会共享一次小型探测，而不是制造请求风暴。跳过的提供商预检运行不会递增执行错误退避；当你想要重复跳过通知时，请启用 `failureAlert.includeSkipped`。

## 交付和输出

| 模式       | 发生的事情                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体没有发送，则向目标回退交付最终文本 |
| `webhook`  | 将完成事件载荷 POST 到 URL                                |
| `none`     | 没有运行器回退交付                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 进行渠道投递。对于 Telegram 论坛主题，使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或 Matrix 中的 `room:!room:server` 形式。

当 announce 投递使用 `channel: "last"` 或省略 `channel` 时，带提供商前缀的目标（例如 `telegram:123`）可以在 cron 回退到会话历史记录或单个已配置渠道之前选择渠道。只有已加载插件声明的前缀才是提供商选择器。如果 `delivery.channel` 是显式的，目标前缀必须命名同一个提供商；例如，`channel: "whatsapp"` 搭配 `to: "telegram:123"` 会被拒绝，而不是让 WhatsApp 将 Telegram ID 解释为电话号码。目标类型和服务前缀（例如 `channel:<id>`、`user:<id>`、`imessage:<handle>` 和 `sms:<number>`）仍然是渠道拥有的目标语法，而不是提供商选择器。

对于隔离任务，聊天投递是共享的。如果聊天路由可用，即使任务使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体轮次结束后如何处理最终回复。

当智能体从活跃聊天创建隔离提醒时，OpenClaw 会为回退 announce 路由存储保留的实时投递目标。内部会话键可能是小写；当当前聊天上下文可用时，不会从这些键重建提供商投递目标。

隐式 announce 投递会使用已配置的渠道 allowlist 来验证并重路由过期目标。私信配对存储批准不是回退自动化接收方；当定时任务应主动发送到私信时，请设置 `delivery.to` 或配置渠道 `allowFrom` 条目。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 按任务覆盖该值。
- 如果两者都未设置，并且任务已经通过 `announce` 投递，失败通知现在会回退到该主要 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 任务，除非主要投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 会让某个任务或全局 cron 告警策略加入重复跳过运行告警。跳过运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。

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
  <Tab title="重复隔离任务">
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
</Tabs>

## Webhook

Gateway 网关可以暴露 HTTP webhook 端点以供外部触发。在配置中启用：

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
  <Accordion title="映射 hook（POST /hooks/<name>）">
    自定义 hook 名称会通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点置于 loopback、tailnet 或受信任的反向代理之后。

- 使用专用 hook 令牌；不要复用 gateway 身份验证令牌。
- 将 `hooks.path` 保持在专用子路径；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你需要调用方选择的会话，否则保持 `hooks.allowRequestSessionKey=false`。
- 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形态。
- hook 载荷默认会用安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前置条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hook、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并将 Tailscale Funnel 用于推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且已设置 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

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
  <Step title="启动 watch">
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

- `openclaw cron add|edit --model ...` 会更改任务选择的模型。
- 如果模型被允许，该精确的提供商/模型会到达隔离智能体运行。
- 如果不被允许或无法解析，cron 会以显式验证错误使该次运行失败。
- 已配置的回退链仍然适用，因为 cron `--model` 是任务主模型，不是会话 `/model` 覆盖。
- 载荷 `fallbacks` 会替换该任务的已配置回退；`fallbacks: []` 会禁用回退并使运行变为严格模式。
- 没有显式或已配置回退列表的普通 `--model` 不会静默落到智能体主模型作为额外重试目标。

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

`maxConcurrentRuns` 同时限制计划 cron 分发和隔离智能体轮次执行。隔离 cron 智能体轮次在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可以让彼此独立的 cron LLM 运行并行推进，而不只是启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会因该设置而扩宽。

运行时状态 sidecar 派生自 `cron.store`：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径会追加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 纳入源代码控制。OpenClaw 使用该 sidecar 存储待处理槽位、活跃标记、上次运行元数据，以及告诉调度器外部编辑的任务何时需要新的 `nextRunAtMs` 的调度身份。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久错误会立即禁用。

    **重复重试**：重试之间使用指数退避（30 秒到 60 分钟）。下次成功运行后会重置退避。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）会修剪隔离运行会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动修剪运行日志文件。
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
    - 对于 `cron` 计划，确认时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行通过 `openclaw cron run <jobId> --due` 检查，但任务尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但未送达">
    - 投递模式 `none` 表示不应有 runner 回退发送。只要有可用的聊天路由，智能体仍然可以直接使用 `message` 工具发送。
    - 投递目标缺失/无效（`channel`/`to`）表示已跳过出站发送。
    - 对于 Matrix，复制的作业或旧版作业如果包含小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。将作业编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果隔离运行仅返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制回退的排队摘要路径，因此不会向聊天回发任何内容。
    - 如果智能体应该自行向用户发送消息，请检查作业是否有可用路由（`channel: "last"` 且存在先前聊天，或显式的渠道/目标）。

  </Accordion>
  <Accordion title="Cron 或 Heartbeat 似乎阻止 /new-style 滚动更新">
    - 每日重置和空闲重置的新鲜度不基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、Heartbeat 运行、exec 通知和 Gateway 网关簿记可能会更新用于路由/Status 的会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，如果文件仍然可用，OpenClaw 可以从 transcript JSONL 会话头中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为它们的空闲基线。

  </Accordion>
  <Accordion title="时区注意事项">
    - 未带 `--tz` 的 Cron 使用 Gateway 网关主机时区。
    - 未指定时区的 `at` 调度会被视为 UTC。
    - Heartbeat `activeHours` 使用配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关内容

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — Cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 定期主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
