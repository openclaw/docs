---
read_when:
    - 调度后台作业或唤醒
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务在心跳和 cron 之间做选择
sidebarTitle: Scheduled tasks
summary: 用于 Gateway 网关调度器的定时任务、网络钩子和 Gmail PubSub 触发器
title: 定时任务
x-i18n:
    generated_at: "2026-04-29T08:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a3df95ee8680e49fa97373f8325eb348a817aad49ceae6c73547ae3fd294cf2
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron 是 Gateway 网关内置的调度器。它会持久化作业，在正确时间唤醒智能体，并可将输出送回聊天渠道或 webhook 端点。

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
- 作业定义持久化在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度。
- 运行时执行状态持久化在旁边的 `~/.openclaw/cron/jobs-state.json` 中。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 拆分之后，旧版 OpenClaw 可以读取 `jobs.json`，但可能会把作业视为全新作业，因为运行时字段现在位于 `jobs-state.json`。
- 当 Gateway 网关正在运行或已停止期间编辑 `jobs.json` 时，OpenClaw 会将已更改的调度字段与待处理运行时 slot 元数据进行比较，并清除过期的 `nextRunAtMs` 值。仅格式化或仅调整键顺序的重写会保留待处理 slot。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- Gateway 网关启动时，逾期的隔离智能体轮次作业会被重新调度到渠道连接窗口之外，而不是立即重放，因此 Discord/Telegram 启动和原生命令设置在重启后仍保持响应。
- 一次性作业（`--at`）默认在成功后自动删除。
- 隔离 cron 运行完成时，会尽力为其 `cron:<jobId>` 会话关闭被跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤儿进程。
- 隔离 cron 运行还会防止过期的确认回复。如果第一个结果只是临时状态更新（`on it`、`pulling everything together` 以及类似提示），且没有后代子智能体运行仍负责最终答案，OpenClaw 会在投递前重新提示一次以获取实际结果。
- 隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，因此被阻止的命令不会被报告为绿色运行。
- 隔离 cron 运行还会将运行级智能体失败视为作业错误，即使未生成回复载荷也是如此，因此模型/提供商失败会递增错误计数器并触发失败通知，而不是将作业清除为成功。

<a id="maintenance"></a>

<Note>
Cron 的任务对账首先由运行时拥有，其次由持久历史支撑：只要 cron 运行时仍将该作业跟踪为运行中，活跃 cron 任务就会保持活跃，即使旧的子会话行仍然存在。运行时不再拥有该作业且 5 分钟宽限窗口过期后，维护会检查持久化运行日志和作业状态，以匹配 `cron:<jobId>:<startedAt>` 运行。如果该持久历史显示终态结果，任务账本会据此完成；否则 Gateway 网关拥有的维护可以将任务标记为 `lost`。离线 CLI 审计可以从持久历史恢复，但不会把自身空的进程内活跃作业集视为 Gateway 网关拥有的 cron 运行已消失的证据。
</Note>

## 调度类型

| 类型    | CLI 标志  | 描述                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every` | 固定间隔                                          |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz` |

不带时区的时间戳会按 UTC 处理。添加 `--tz America/New_York` 可使用本地挂钟时间调度。

整点循环表达式会自动错开最多 5 分钟，以减少负载尖峰。使用 `--exact` 强制精确定时，或使用 `--stagger 30s` 指定显式窗口。

### 月中日期和星期日期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当月中日期和星期日期字段都不是通配符时，croner 会在**任一**字段匹配时匹配，而不是两个字段都匹配。这是标准 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会导致每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 的默认 OR 行为。若要要求两个条件都满足，请使用 Croner 的 `+` 星期日期修饰符（`0 9 15 * +1`），或在一个字段上调度，并在你的作业提示词或命令中守卫另一个字段。

## 执行风格

| 风格           | `--session` 值   | 运行位置                  | 最适合                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话    | `main`              | 下一个心跳轮次      | 提醒、系统事件        |
| 隔离        | `isolated`          | 专用 `cron:<jobId>` | 报告、后台杂务      |
| 当前会话 | `current`           | 创建时绑定   | 上下文感知的循环工作    |
| 自定义会话  | `session:custom-id` | 持久命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话、隔离和自定义的区别">
    **主会话**作业会将系统事件入队，并可选择唤醒心跳（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**隔离**作业会使用新会话运行专用智能体轮次。**自定义会话**（`session:xxx`）会跨运行持久化上下文，从而支持每日站会等基于先前摘要构建的工作流。
  </Accordion>
  <Accordion title="隔离作业中的“新会话”含义">
    对于隔离作业，“新会话”表示每次运行都有新的 transcript/session id。OpenClaw 可能携带安全的偏好设置，例如 thinking/fast/verbose 设置、标签，以及用户显式选择的模型/认证覆盖，但它不会从较旧的 cron 行继承环境会话上下文：渠道/群组路由、发送或队列策略、提权、来源，或 ACP 运行时绑定。当循环作业应有意基于同一会话上下文构建时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离作业，运行时拆除现在会包含针对该 cron 会话的尽力浏览器清理。清理失败会被忽略，因此实际 cron 结果仍然优先。

    隔离 cron 运行还会通过共享运行时清理路径释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的拆除方式一致，因此隔离 cron 作业不会在运行之间泄漏 stdio 子进程或长生命周期 MCP 连接。

  </Accordion>
  <Accordion title="子智能体和 Discord 投递">
    当隔离 cron 运行编排子智能体时，投递也会优先使用最终后代输出，而不是过期的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是发布它。

    对于纯文本 Discord 公告目标，OpenClaw 只发送一次规范的最终助手文本，而不是同时重放流式/中间文本载荷和最终答案。媒体和结构化 Discord 载荷仍会作为单独载荷投递，因此附件和组件不会丢失。

  </Accordion>
</AccordionGroup>

### 隔离作业的载荷选项

<ParamField path="--message" type="string" required>
  提示词文本（隔离作业必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选择的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可以使用哪些工具，例如 `--tools exec,read`。
</ParamField>

`--model` 使用所选允许模型作为该作业的主模型。它不同于聊天会话 `/model` 覆盖：当作业主模型失败时，已配置的回退链仍会适用。如果请求的模型不被允许或无法解析，cron 会让该运行以显式验证错误失败，而不是静默回退到作业的智能体/默认模型选择。

Cron 作业也可以携带载荷级 `fallbacks`。存在时，该列表会替换作业的已配置回退链。当你想要严格的 cron 运行、只尝试所选模型时，请在作业载荷/API 中使用 `fallbacks: []`。如果作业有 `--model`，但既没有载荷回退也没有已配置回退，OpenClaw 会传递显式空回退覆盖，因此不会把智能体主模型作为隐藏的额外重试目标追加进去。

隔离作业的模型选择优先级为：

1. Gmail 钩子模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每作业载荷 `model`
3. 用户选择的已存储 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也遵循已解析的实时选择。如果所选模型配置具有 `params.fastMode`，隔离 cron 会默认使用它。已存储的会话 `fastMode` 覆盖仍会在任一方向上优先于配置。

如果隔离运行命中实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为活跃运行持久化该实时选择。当切换还携带新的认证配置文件时，cron 也会为活跃运行持久化该认证配置文件覆盖。重试有界：在初始尝试加 2 次切换重试后，cron 会中止而不是无限循环。

在隔离 cron 运行进入智能体运行器之前，OpenClaw 会检查可达的本地提供商端点，针对已配置的 `api: "ollama"` 和 `api: "openai-completions"` 提供商，其 `baseUrl` 为 local loopback、专用网络或 `.local`。如果该端点已停机，运行会被记录为 `skipped`，并给出明确的提供商/模型错误，而不是启动模型调用。端点结果会缓存 5 分钟，因此许多使用同一个不可用本地 Ollama、vLLM、SGLang 或 LM Studio 服务器的到期作业会共享一次小探测，而不是制造请求风暴。被跳过的提供商预检运行不会递增执行错误退避；当你需要重复跳过通知时，请启用 `failureAlert.includeSkipped`。

## 投递和输出

| 模式       | 会发生什么                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则将最终文本回退投递给目标 |
| `webhook`  | 将完成事件载荷 POST 到 URL                                |
| `none`     | 无运行器回退投递                                         |

使用 `--announce --channel telegram --to "-1001234567890"` 进行渠道投递。对于 Telegram 论坛主题，请使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传递。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用确切的房间 ID，或 Matrix 中的 `room:!room:server` 形式。

对于隔离任务，聊天投递是共享的。如果聊天路由可用，即使任务使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到已配置/当前目标，OpenClaw 会跳过兜底公告。否则，`announce`、`webhook` 和 `none` 只控制 runner 在智能体轮次结束后如何处理最终回复。

当智能体从活跃聊天创建隔离提醒时，OpenClaw 会为兜底公告路由存储保留的实时投递目标。内部会话键可能是小写；当当前聊天上下文可用时，不会从这些键重建提供商投递目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 会按任务覆盖该设置。
- 如果两者都未设置且任务已通过 `announce` 投递，失败通知现在会回退到该主要公告目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 任务上受支持，除非主要投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 会让任务或全局 cron 告警策略选择启用重复的跳过运行告警。跳过的运行会保留单独的连续跳过计数器，因此不会影响执行错误退避。

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

Gateway 网关可以公开 HTTP webhook 端点，用于外部触发器。在配置中启用：

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
    运行一次隔离智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必需）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 操作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用 hook 令牌；不要复用 Gateway 网关身份验证令牌。
- 将 `hooks.path` 保持在专用子路径上；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 来限制显式 `agentId` 路由。
- 保持 `hooks.allowRequestSessionKey=false`，除非你需要调用方选择会话。
- 如果启用 `hooks.allowRequestSessionKey`，还要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形状。
- 默认情况下，hook 载荷会用安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**先决条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks、用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并为推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且 `hooks.gmail.account` 已设置时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续期 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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
- 如果该模型被允许，那个精确的提供商/模型会到达隔离智能体运行。
- 如果不被允许或无法解析，cron 会以明确的验证错误让该次运行失败。
- 已配置的兜底链仍然适用，因为 cron `--model` 是任务主模型，而不是会话 `/model` 覆盖。
- 载荷中的 `fallbacks` 会替换该任务已配置的兜底项；`fallbacks: []` 会禁用兜底，并使运行变为严格模式。
- 一个普通的 `--model` 如果没有显式或已配置的兜底列表，不会静默地继续落到智能体主模型作为额外重试目标。

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

`maxConcurrentRuns` 会限制计划的 cron 分发和隔离智能体轮次执行。隔离 cron 智能体轮次会在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可让独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会被此设置扩容。

运行时状态 sidecar 派生自 `cron.store`：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径会追加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 纳入源码控制。OpenClaw 使用该 sidecar 来记录待处理槽位、活跃标记、上次运行元数据，以及告知调度器外部编辑的任务何时需要新的 `nextRunAtMs` 的调度身份。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）会使用指数退避最多重试 3 次。永久错误会立即禁用。

    **循环重试**：重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后会重置退避。

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
    - 确认 Gateway 网关正在持续运行。
    - 对于 `cron` 调度，验证时区（`--tz`）与主机时区。
    - 运行输出中的 `reason: not-due` 表示手动运行是用 `openclaw cron run <jobId> --due` 检查的，而任务尚未到期。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 投递模式 `none` 表示不会有预期的 runner 兜底发送。当聊天路由可用时，智能体仍可使用 `message` 工具直接发送。
    - 投递目标缺失/无效（`channel`/`to`）表示已跳过出站。
    - 对于 Matrix，复制的或旧版任务如果包含小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。将任务编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道身份验证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果隔离运行只返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制兜底队列摘要路径，因此不会向聊天发回任何内容。
    - 如果智能体应自行给用户发消息，请检查任务是否有可用路由（带有上一条聊天的 `channel: "last"`，或显式渠道/目标）。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 每日和空闲重置的新鲜度不基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、心跳运行、exec 通知和 Gateway 网关记账可能会为路由/Status 更新会话行，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于在这些字段存在之前创建的旧版行，当文件仍可用时，OpenClaw 可以从 transcript JSONL 会话标头恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会使用该恢复的开始时间作为空闲基线。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - 没有 `--tz` 的 Cron 会使用 Gateway 网关主机时区。
    - 没有时区的 `at` 调度会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。

  </Accordion>
</AccordionGroup>

## 相关

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [心跳](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
