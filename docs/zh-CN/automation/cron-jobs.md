---
read_when:
    - 安排后台作业或唤醒任务
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关 调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-28T01:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1a044f3d76acebec45e631b6b5c3bffc753543afd21f8e1a16326d1c50aa50b
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关 的内置调度器。它会持久化作业，在正确时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

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

## cron 的工作方式

- Cron 在 **Gateway 网关** 进程内部运行（不在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失计划。
- 运行时执行状态会持久化到它旁边的 `~/.openclaw/cron/jobs-state.json`。如果你在 git 中跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 在拆分之后，旧版 OpenClaw 仍然可以读取 `jobs.json`，但可能会把作业视为全新作业，因为运行时字段现在位于 `jobs-state.json` 中。
- 当 Gateway 网关 运行中或停止时编辑了 `jobs.json`，OpenClaw 会将变更后的调度字段与待运行的运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。纯格式化或仅键顺序变化的重写会保留待运行槽位。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性作业（`--at`）默认会在成功后自动删除。
- 隔离的 cron 运行会在运行完成后，尽力关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤儿进程。
- 隔离的 cron 运行还会防止过时的确认性回复。如果第一个结果只是中间状态更新（如 `on it`、`pulling everything together` 以及类似提示），并且没有后代子智能体运行仍在负责最终答案，OpenClaw 会再提示一次以获取实际结果，然后再进行交付。
- 隔离的 cron 运行会优先使用来自嵌入式运行的结构化执行拒绝元数据，然后再回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，从而避免把被阻止的命令误报为绿色运行。
- 隔离的 cron 运行还会将运行级别的智能体失败视为作业错误，即使没有生成任何回复负载也一样，因此模型/提供商失败会增加错误计数并触发失败通知，而不是将作业清除为成功。

<a id="maintenance"></a>

<Note>
cron 的任务对账会先以运行时归属为准，其次才依赖持久历史：只要 cron 运行时仍在跟踪某个作业处于运行中，该活动 cron 任务就保持存活，即使仍存在一条旧的子会话记录也是如此。一旦运行时不再拥有该作业，且 5 分钟宽限窗口已过，维护检查就会为匹配的 `cron:<jobId>:<startedAt>` 运行检查已持久化的运行日志和作业状态。如果该持久历史显示终态结果，任务账本就会据此完成；否则，由 Gateway 网关 拥有的维护逻辑可以将任务标记为 `lost`。离线 CLI 审计可以基于持久历史进行恢复，但它不会把自身空的进程内活动作业集合视为 Gateway 网关 拥有的 cron 运行已消失的证据。
</Note>

## 调度类型

| 类型    | CLI 标志 | 说明                                                |
| ------- | -------- | --------------------------------------------------- |
| `at`    | `--at`   | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）    |
| `every` | `--every`| 固定间隔                                            |
| `cron`  | `--cron` | 5 字段或 6 字段 cron 表达式，可选配 `--tz`          |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地挂钟时间进行调度。

每小时整点的循环表达式会自动错峰，最多延后 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定显式错峰窗口。

### day-of-month 和 day-of-week 使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当 day-of-month 和 day-of-week 字段都不是通配符时，croner 会在 **任一** 字段匹配时触发——而不是两个都匹配时才触发。这是标准的 Vixie cron 行为。

```
# 预期："每月 15 日上午 9 点，且只有在星期一时"
# 实际："每个 15 日上午 9 点，以及每个星期一上午 9 点"
0 9 15 * 1
```

这样每月会触发约 5–6 次，而不是 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件，请使用 Croner 的 `+` day-of-week 修饰符（`0 9 15 * +1`），或者只按一个字段调度，并在作业的提示词或命令中对另一个条件进行判断。

## 执行样式

| 样式           | `--session` 值      | 运行位置                 | 最适合                         |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| 主会话         | `main`              | 下一次 heartbeat 回合    | 提醒、系统事件                 |
| 隔离           | `isolated`          | 专用 `cron:<jobId>`      | 报告、后台杂务                 |
| 当前会话       | `current`           | 在创建时绑定             | 依赖上下文的周期性工作         |
| 自定义会话     | `session:custom-id` | 持久命名会话             | 基于历史逐步构建的工作流       |

<AccordionGroup>
  <Accordion title="主会话 vs 隔离 vs 自定义">
    **主会话** 作业会将系统事件加入队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**隔离** 作业会在一个全新会话中运行专用智能体回合。**自定义会话**（`session:xxx`）会跨运行保留上下文，从而支持诸如每日站会这类基于之前摘要持续推进的工作流。
  </Accordion>
  <Accordion title="隔离作业中的“全新会话”是什么意思">
    对于隔离作业来说，“全新会话”意味着每次运行都会有新的 transcript/session id。OpenClaw 可能会保留安全偏好，例如 thinking/fast/verbose 设置、标签以及用户显式选择的模型/凭证覆盖，但不会从旧的 cron 记录继承环境式会话上下文：渠道/群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。如果某个周期性作业需要有意构建在同一会话上下文上，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离作业，运行时拆除现在还包括对该 cron 会话执行尽力而为的浏览器清理。清理失败会被忽略，因此真正的 cron 结果仍然优先生效。

    隔离的 cron 运行还会通过共享的运行时清理路径，处置为该作业创建的所有内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端清理方式一致，因此隔离的 cron 作业不会在多次运行之间泄漏 stdio 子进程或长生命周期的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体与 Discord 交付">
    当隔离的 cron 运行编排子智能体时，交付也会优先采用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该不完整的父级更新，而不是将其发布出去。

    对于仅文本的 Discord announce 目标，OpenClaw 会只发送一次规范的最终 assistant 文本，而不是同时重放流式/中间文本负载和最终答案。媒体和结构化 Discord 负载仍会作为单独负载交付，以避免附件和组件被丢弃。

  </Accordion>
</AccordionGroup>

### 隔离作业的负载选项

<ParamField path="--message" type="string" required>
  提示词文本（隔离模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选择的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 会将所选允许模型用作该作业的主模型。它不同于聊天会话中的 `/model` 覆盖：当作业主模型失败时，已配置的回退链仍会继续生效。如果请求的模型不被允许，cron 会记录一条警告，并回退到该作业的智能体/默认模型选择。

Cron 作业还可以携带负载级别的 `fallbacks`。存在时，该列表会替换该作业已配置的回退链。当你希望严格的 cron 运行只尝试所选模型时，可在作业负载/API 中使用 `fallbacks: []`。如果作业有 `--model`，但负载和配置中都没有 fallbacks，OpenClaw 会传递一个显式的空回退覆盖，这样智能体主模型就不会被作为隐藏的额外重试目标附加进去。

隔离作业的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每个作业负载中的 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

Fast 模式也会遵循已解析的实时选择。如果所选模型配置带有 `params.fastMode`，隔离的 cron 默认会使用它。已存储的会话 `fastMode` 覆盖在任意方向上都仍然优先生效。

如果隔离运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为当前运行持久化该实时选择。如果切换还携带了新的凭证配置文件，cron 也会为当前运行持久化该凭证配置文件覆盖。重试是有界的：初次尝试之后最多再进行 2 次切换重试，超过后 cron 会中止，而不是无限循环。

在隔离的 cron 运行进入智能体运行器之前，OpenClaw 会检查已配置 `api: "ollama"` 和 `api: "openai-completions"` 且其 `baseUrl` 为 loopback、私有网络或 `.local` 的本地提供商端点是否可达。如果该端点不可用，此次运行会被记录为 `skipped`，并带有清晰的提供商/模型错误，而不是开始模型调用。该端点检查结果会缓存 5 分钟，因此多个到期作业如果使用同一个不可用的本地 Ollama、vLLM、SGLang 或 LM Studio 服务器，只会共享一次小型探测，而不会形成请求风暴。因提供商预检而被跳过的运行不会增加执行错误退避；如果你希望重复收到 skip 通知，请启用 `failureAlert.includeSkipped`。

## 交付与输出

| 模式       | 结果                                                            |
| ---------- | --------------------------------------------------------------- |
| `announce` | 如果智能体没有发送，则回退交付最终文本到目标                    |
| `webhook`  | 向某个 URL POST 已完成事件负载                                  |
| `none`     | 不进行运行器回退交付                                            |

使用 `--announce --channel telegram --to "-1001234567890"` 可交付到渠道。对于 Telegram forum topic，请使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以把 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

对于隔离作业，聊天交付是共享的。如果存在聊天路由，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体已发送到配置的/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体回合结束后如何处理最终回复。

当智能体从活动聊天中创建隔离提醒时，OpenClaw 会为回退 announce 路由存储保留的实时交付目标。内部会话键可能是小写；当当前聊天上下文可用时，不会根据这些键重建提供商交付目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认目标。
- `job.delivery.failureDestination` 可为单个作业覆盖该设置。
- 如果两者都未设置，且该作业已经通过 `announce` 交付，失败通知现在会回退到该主 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主交付模式是 `webhook`。
- `failureAlert.includeSkipped: true` 可让单个作业或全局 cron 告警策略选择加入重复的 skipped 运行告警。Skipped 运行会维护单独的连续跳过计数器，因此不会影响执行错误退避。

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
  <Tab title="循环隔离作业">
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
  <Tab title="模型和 thinking 覆盖">
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

Gateway 网关 可以暴露 HTTP webhook 端点以接收外部触发器。在配置中启用：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 认证

每个请求都必须通过请求头携带 hook token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串中的 token 会被拒绝。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    为主会话加入一个系统事件：

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
    运行一次隔离的智能体回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 hooks（POST /hooks/<name>）">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用 hook token；不要复用 gateway 凭证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你确实需要由调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也请同时设置 `hooks.allowedSessionKeyPrefixes`，以限制允许的会话键形态。
- 默认情况下，hook 负载会被安全边界包装。
  </Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前置条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置，启用 Gmail preset，并为推送端点使用 Tailscale Funnel。

### Gateway 网关 自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关 会在启动时运行 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

<Steps>
  <Step title="选择 GCP 项目">
    选择 `gog` 所用 OAuth 客户端所属的 GCP 项目：

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="创建 topic 并授予 Gmail 推送访问权限">
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

## 管理作业

```bash
# 列出所有作业
openclaw cron list

# 显示单个作业，包括解析后的交付路由
openclaw cron show <jobId>

# 编辑作业
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行一个作业
openclaw cron run <jobId>

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 删除作业
openclaw cron remove <jobId>

# 智能体选择（多智能体设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改作业选定的模型。
- 如果该模型被允许，那个精确的提供商/模型会传递到隔离智能体运行中。
- 如果不被允许，cron 会发出警告，并回退到作业的智能体/默认模型选择。
- 已配置的回退链仍会生效，因为 cron 的 `--model` 是作业主模型，而不是会话 `/model` 覆盖。
- 负载中的 `fallbacks` 会替换该作业已配置的 fallbacks；`fallbacks: []` 会禁用回退，使运行变为严格模式。
- 只有普通的 `--model` 且没有显式或已配置的回退列表时，不会静默回退到智能体主模型作为额外重试目标。
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

`maxConcurrentRuns` 同时限制计划的 cron 分发和隔离智能体回合执行。隔离的 cron 智能体回合在内部使用队列专用的 `cron-nested` 执行通道，因此提高该值可以让彼此独立的 cron LLM 运行并行推进，而不是仅启动其外层 cron 包装器。共享的非 cron `nested` 通道不会因该设置而变宽。

运行时状态 sidecar 由 `cron.store` 推导而来：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则会附加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 纳入源码控制。OpenClaw 使用该 sidecar 存储待运行槽位、活动标记、最近运行元数据，以及用于告知调度器“外部编辑的作业何时需要新的 `nextRunAtMs`”的调度标识。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久错误会立即禁用。

    **循环重试**：重试之间采用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）会清理隔离运行的会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。
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
    - 确认 Gateway 网关 持续运行中。
    - 对于 `cron` 调度，检查时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示使用 `openclaw cron run <jobId> --due` 检查手动运行时，该作业尚未到期。
  </Accordion>
  <Accordion title="Cron 已触发但没有交付">
    - 交付模式 `none` 表示不会有运行器回退发送。若聊天路由可用，智能体仍可直接使用 `message` 工具发送。
    - 缺少/无效的交付目标（`channel`/`to`）意味着外发被跳过。
    - 对于 Matrix，复制而来或旧作业里被小写化的 `delivery.to` 房间 ID 可能会失败，因为 Matrix 房间 ID 区分大小写。请将作业编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道凭证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
    - 如果隔离运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接外发交付，也会抑制回退的排队摘要路径，因此不会向聊天回发任何内容。
    - 如果智能体应当自行给用户发消息，请检查该作业是否有可用路由（`channel: "last"` 且存在之前聊天，或显式的渠道/目标）。
  </Accordion>
  <Accordion title="Cron 或 heartbeat 看起来阻止了 /new-style rollover">
    - 每日和空闲重置的新鲜度并不是基于 `updatedAt`；参见[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 gateway 记账都可能更新会话行以进行路由/状态记录，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧记录，只要 transcript JSONL 会话头文件仍可用，OpenClaw 就可以从中恢复 `sessionStartedAt`。对于没有 `lastInteractionAt` 的旧空闲记录，会使用恢复出的开始时间作为其空闲基线。
  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 cron 会使用 gateway 主机时区。
    - 不带时区的 `at` 调度会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 所有自动化机制一览
- [Background Tasks](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话回合
- [Timezone](/zh-CN/concepts/timezone) — 时区配置
