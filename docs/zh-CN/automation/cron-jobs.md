---
read_when:
    - 安排后台作业或唤醒任务
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-28T03:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: df45c96f3e803ede8c4c2d24a9c3ae489967f052d0279235c17fef4759771dbb
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关的内置调度器。它会持久化作业，在正确的时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

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

## cron 的工作原理

- Cron 在 **Gateway 网关** 进程**内部**运行（而不是在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度。
- 运行时执行状态会持久化到旁边的 `~/.openclaw/cron/jobs-state.json`。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 在拆分之后，旧版 OpenClaw 可以读取 `jobs.json`，但可能会把作业视为全新作业，因为运行时字段现在位于 `jobs-state.json` 中。
- 当 Gateway 网关运行中或停止时编辑了 `jobs.json`，OpenClaw 会将变更后的调度字段与待处理运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。纯格式化或仅键顺序重写会保留待处理槽位。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性作业（`--at`）在成功后默认会自动删除。
- 独立 cron 运行会尽力在运行完成时关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤儿进程。
- 独立 cron 运行还会防止过时的确认回复。如果第一个结果只是临时状态更新（如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次以获取实际结果。
- 独立 cron 运行会优先使用来自嵌入式运行的结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，这样被阻止的命令就不会被报告为绿色成功运行。
- 即使没有生成任何回复负载，独立 cron 运行也会将运行级别的智能体失败视为作业错误，因此模型/提供商失败会增加错误计数并触发失败通知，而不是把作业标记为成功完成。

<a id="maintenance"></a>

<Note>
cron 的任务协调会优先依赖运行时归属，其次依赖持久化历史：只要 cron 运行时仍将某个作业标记为正在运行，该活跃 cron 任务就会保持活动状态，即使旧的子会话行仍然存在也是如此。一旦运行时不再拥有该作业，且 5 分钟宽限窗口到期，维护检查就会查看与之匹配的 `cron:<jobId>:<startedAt>` 运行的持久化运行日志和作业状态。如果该持久化历史显示了终止结果，任务账本就会据此完成；否则，由 Gateway 网关拥有的维护流程可以将任务标记为 `lost`。离线 CLI 审计可以根据持久化历史进行恢复，但它不会把自己在进程内空的活跃作业集视为 Gateway 网关拥有的 cron 运行已经消失的证据。
</Note>

## 调度类型

| 类型    | CLI 标志 | 说明 |
| ------- | --------- | ---- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every` | 固定间隔 |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz` |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地挂钟时间调度。

按整点重复的表达式会自动错峰，最多延迟 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错峰窗口。

### day-of-month 和 day-of-week 使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当 day-of-month 和 day-of-week 字段都不是通配符时，croner 会在**任一**字段匹配时触发，而不是要求两者都匹配。这是标准的 Vixie cron 行为。

```
# 预期："每月 15 号上午 9 点，且仅当这一天是星期一"
# 实际：  "每月每个 15 号上午 9 点，以及每个星期一上午 9 点"
0 9 15 * 1
```

这会每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件都满足，请使用 Croner 的 `+` day-of-week 修饰符（`0 9 15 * +1`），或者按一个字段进行调度，并在作业的提示词或命令中对另一个字段进行保护判断。

## 执行样式

| 样式 | `--session` 值 | 运行位置 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话 | `main` | 下一个 heartbeat 回合 | 提醒、系统事件 |
| 独立 | `isolated` | 专用 `cron:<jobId>` | 报告、后台杂务 |
| 当前会话 | `current` | 在创建时绑定 | 依赖上下文的重复工作 |
| 自定义会话 | `session:custom-id` | 持久命名会话 | 基于历史逐步构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话、独立与自定义之间的区别">
    **主会话**作业会将系统事件加入队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**独立**作业会在一个新的会话中运行专用的智能体回合。**自定义会话**（`session:xxx`）会在各次运行之间保留上下文，从而支持例如基于之前摘要构建的每日站会这类工作流。
  </Accordion>
  <Accordion title="对于独立作业，什么叫“全新会话”">
    对于独立作业，“全新会话”意味着每次运行都会使用新的 transcript/session id。OpenClaw 可能会携带安全的偏好设置，例如 thinking/fast/verbose 设置、标签以及用户显式选择的模型/凭证覆盖，但不会继承来自旧 cron 行的环境会话上下文：渠道/群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。如果一个重复作业应当有意建立在相同的会话上下文之上，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于独立作业，运行时拆除现在包括对该 cron 会话的浏览器进行尽力清理。清理失败会被忽略，因此实际的 cron 结果仍然优先生效。

    独立 cron 运行还会通过共享的运行时清理路径，释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式一致，因此独立 cron 作业不会在多次运行之间泄漏 stdio 子进程或长期存活的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体与 Discord 交付">
    当独立 cron 运行编排子智能体时，交付也会优先选择最终后代输出，而不是过时的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该父级部分更新，而不是宣布它。

    对于仅文本的 Discord 公告目标，OpenClaw 会只发送一次规范的最终助手文本，而不是重复发送流式/中间文本负载以及最终答案。媒体和结构化 Discord 负载仍会作为单独的负载发送，因此附件和组件不会丢失。

  </Accordion>
</AccordionGroup>

### 独立作业的负载选项

<ParamField path="--message" type="string" required>
  提示文本（独立作业必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选定且被允许的模型。
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

`--model` 会将所选的允许模型用作该作业的主模型。它不同于聊天会话中的 `/model` 覆盖：当作业主模型失败时，已配置的回退链仍然适用。如果请求的模型不被允许或无法解析，cron 会以明确的验证错误使该次运行失败，而不是静默回退到该作业的智能体/默认模型选择。

Cron 作业还可以携带负载级别的 `fallbacks`。存在时，该列表会替换该作业已配置的回退链。当你希望严格的 cron 运行只尝试所选模型时，请在作业负载/API 中使用 `fallbacks: []`。如果某个作业有 `--model`，但既没有负载回退也没有已配置回退，OpenClaw 会传递一个显式的空回退覆盖，这样智能体主模型就不会作为隐藏的额外重试目标被附加进去。

独立作业的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每个作业负载中的 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

Fast mode 也会遵循解析后的实时选择。如果所选模型配置带有 `params.fastMode`，独立 cron 默认会使用它。无论方向如何，已存储的会话 `fastMode` 覆盖仍然优先于配置。

如果独立运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为当前运行持久化该实时选择。当切换还携带新的凭证配置文件时，cron 也会为当前运行持久化该凭证配置文件覆盖。重试次数是有上限的：初次尝试后再加 2 次切换重试，cron 就会中止，而不是无限循环。

在独立 cron 运行进入智能体运行器之前，OpenClaw 会检查已配置 `api: "ollama"` 和 `api: "openai-completions"` 的提供商中，那些 `baseUrl` 为 loopback、私有网络或 `.local` 的可达本地提供商端点。如果该端点已关闭，这次运行会被记录为 `skipped`，并附带清晰的提供商/模型错误，而不是开始模型调用。该端点结果会缓存 5 分钟，因此多个到期作业如果使用同一个失效的本地 Ollama、vLLM、SGLang 或 LM Studio 服务器，将共享一次小型探测，而不会造成请求风暴。被提供商预检跳过的运行不会增加执行错误退避；当你希望对重复跳过发送通知时，可启用 `failureAlert.includeSkipped`。

## 交付与输出

| 模式 | 发生的情况 |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体没有发送，则回退交付最终文本到目标 |
| `webhook`  | 将已完成事件负载 POST 到某个 URL |
| `none`     | 不进行运行器回退交付 |

使用 `--announce --channel telegram --to "-1001234567890"` 可交付到渠道。对于 Telegram forum topics，请使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传递。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

对于独立作业，聊天交付是共享的。如果存在聊天路由，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到了已配置/当前目标，OpenClaw 会跳过回退公告。否则，`announce`、`webhook` 和 `none` 仅控制运行器在智能体回合结束后如何处理最终回复。

当智能体从活动聊天中创建一个独立提醒时，OpenClaw 会为回退公告路由存储保留的实时交付目标。内部会话键可能是小写；当当前聊天上下文可用时，不会根据这些键重建提供商交付目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 按作业覆盖该设置。
- 如果两者都未设置，且作业已经通过 `announce` 交付，则失败通知现在会回退到该主公告目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主交付模式是 `webhook`。
- `failureAlert.includeSkipped: true` 可让某个作业或全局 cron 告警策略启用重复的跳过运行告警。跳过运行会维护单独的连续跳过计数，因此不会影响执行错误退避。

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
  <Tab title="重复的独立作业">
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

Gateway 网关可以暴露 HTTP webhook 端点以接收外部触发器。在配置中启用：

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

不接受查询字符串中的 token。

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
    运行一个独立的智能体回合：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必需）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射的 hook（POST /hooks/<name>）">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用的 hook token；不要复用 gateway 凭证 token。
- 将 `hooks.path` 保持在专用子路径下；不接受 `/`。
- 设置 `hooks.allowedAgentIds` 以限制显式的 `agentId` 路由。
- 除非你确实需要由调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 以限制允许的会话键形态。
- 默认情况下，hook 负载会被安全边界包装。

</Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前置条件：**`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并为推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

<Steps>
  <Step title="选择 GCP 项目">
    选择 `gog` 使用的 OAuth 客户端所属的 GCP 项目：

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

## 管理作业

```bash
# 列出所有作业
openclaw cron list

# 显示单个作业，包括解析后的交付路由
openclaw cron show <jobId>

# 编辑作业
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行作业
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

- `openclaw cron add|edit --model ...` 会更改作业所选的模型。
- 如果该模型被允许，那么这个精确的提供商/模型就会传递给独立智能体运行。
- 如果它不被允许或无法解析，cron 会以明确的验证错误使该次运行失败。
- 已配置的回退链仍然适用，因为 cron `--model` 是作业主模型，而不是会话 `/model` 覆盖。
- 负载 `fallbacks` 会替换该作业已配置的回退；`fallbacks: []` 会禁用回退并使该次运行变为严格模式。
- 仅有普通 `--model` 而没有显式或已配置回退列表时，不会静默落回到智能体主模型作为额外重试目标。

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

`maxConcurrentRuns` 同时限制计划的 cron 分发和独立智能体回合执行。独立 cron 智能体回合在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可以让相互独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会因该设置而扩展。

运行时状态 sidecar 由 `cron.store` 推导得出：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则会附加 `-state.json`。

如果你手动编辑 `jobs.json`，请将 `jobs-state.json` 排除在版本控制之外。OpenClaw 使用该 sidecar 保存待处理槽位、活跃标记、上次运行元数据以及调度标识，用于让调度器知道某个外部编辑过的作业何时需要新的 `nextRunAtMs`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并采用指数退避。永久性错误会立即禁用。

    **重复重试**：在重试之间采用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）会清理独立运行的会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。
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
    - 对于 `cron` 调度，验证时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而作业尚未到期。

  </Accordion>
  <Accordion title="Cron 已触发但没有交付">
    - 交付模式 `none` 表示不应期待运行器回退发送。如果聊天路由可用，智能体仍可直接使用 `message` 工具发送。
    - 缺少/无效的交付目标（`channel`/`to`）意味着出站发送被跳过。
    - 对于 Matrix，复制来的或旧作业如果使用了小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。请将作业编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道凭证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
    - 如果独立运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退的队列摘要路径，因此不会向聊天回发任何内容。
    - 如果智能体应当自行向用户发送消息，请检查作业是否具有可用路由（`channel: "last"` 且有先前聊天，或显式的渠道/目标）。

  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止了 /new 风格的滚动切换">
    - 每日和空闲重置新鲜度并不是基于 `updatedAt`；请参见[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 gateway 记账可能会更新会话行以用于路由/状态，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧行，如果文件仍可用，OpenClaw 可以从 transcript JSONL 会话头中恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧空闲行会使用该恢复出的开始时间作为空闲基线。

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
