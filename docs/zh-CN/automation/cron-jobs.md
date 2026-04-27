---
read_when:
    - 调度后台任务或唤醒操作
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用心跳还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-27T20:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61e85e3f4f334d611397e2d27e508ee7b20e342ccb52b8995b73555f2e6434b
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关的内置调度器。它会持久化任务，在正确的时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

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

- Cron 运行在 **Gateway 网关进程内部**（而不是在模型内部）。
- 任务定义持久保存在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度计划。
- 运行时执行状态保存在旁边的 `~/.openclaw/cron/jobs-state.json` 中。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 `gitignore`。
- 在拆分之后，旧版 OpenClaw 仍可读取 `jobs.json`，但可能会将任务视为全新任务，因为运行时字段现在位于 `jobs-state.json` 中。
- 当 Gateway 网关运行中或停止时编辑了 `jobs.json`，OpenClaw 会将变更后的调度字段与待处理的运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。仅格式调整或仅键顺序重写会保留待处理槽位。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认会在成功后自动删除。
- 独立 cron 运行会尽力在运行完成后关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，这样分离的浏览器自动化就不会留下孤儿进程。
- 独立 cron 运行还会防止陈旧的确认回复。如果第一个结果只是临时状态更新（如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在投递前再次提示一次以获取实际结果。
- 独立 cron 运行会优先使用来自嵌入式运行的结构化执行拒绝元数据，然后再回退到已知的最终摘要/输出标记，如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，这样被阻止的命令就不会被报告为一次绿色运行。
- 独立 cron 运行还会将运行级别的智能体失败视为任务错误，即使没有产生任何回复负载也是如此，因此模型/提供商失败会增加错误计数并触发失败通知，而不是将任务标记为成功。

<a id="maintenance"></a>

<Note>
cron 的任务对账首先由运行时负责，其次才依赖持久历史：只要 cron 运行时仍将某个任务跟踪为正在运行，该活跃 cron 任务就会保持存活，即使仍存在一条旧的子会话记录。一旦运行时不再拥有该任务，并且 5 分钟宽限期到期，维护检查就会检查与对应 `cron:<jobId>:<startedAt>` 运行相匹配的持久运行日志和任务状态。如果该持久历史显示终态结果，任务账本就会据此完成；否则，由 Gateway 网关拥有的维护流程可以将任务标记为 `lost`。离线 CLI 审计可以根据持久历史恢复，但不会将其自身为空的进程内活跃任务集视为 Gateway 网关拥有的 cron 运行已经消失的证据。
</Note>

## 调度类型

| 类型    | CLI 标志 | 说明                                                |
| ------- | -------- | --------------------------------------------------- |
| `at`    | `--at`   | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间）   |
| `every` | `--every`| 固定间隔                                            |
| `cron`  | `--cron` | 5 字段或 6 字段的 cron 表达式，可选 `--tz`         |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地墙上时钟时间调度。

重复的整点表达式会自动错开，最长可达 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定显式错开窗口。

### day-of-month 和 day-of-week 使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当 `day-of-month` 和 `day-of-week` 字段都不是通配符时，croner 会在**任一**字段匹配时触发——而不是两个都匹配时。这是标准的 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件，请使用 Croner 的 `+` weekday 修饰符（`0 9 15 * +1`），或者只按一个字段调度，并在你的任务提示或命令中对另一个字段做保护判断。

## 执行样式

| 样式           | `--session` 值      | 运行位置                 | 最适合                         |
| -------------- | ------------------- | ------------------------ | ------------------------------ |
| 主会话         | `main`              | 下一个心跳回合           | 提醒、系统事件                 |
| 独立           | `isolated`          | 专用 `cron:<jobId>`      | 报告、后台杂项任务             |
| 当前会话       | `current`           | 在创建时绑定             | 依赖上下文的重复工作           |
| 自定义会话     | `session:custom-id` | 持久化命名会话           | 基于历史逐步构建的工作流       |

<AccordionGroup>
  <Accordion title="主会话、独立和自定义的区别">
    **主会话**任务会将一个系统事件加入队列，并可选择唤醒心跳（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**独立**任务会以全新会话运行一次专用的智能体回合。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持诸如每日站会这类建立在先前摘要之上的工作流。
  </Accordion>
  <Accordion title="独立任务中的“全新会话”是什么意思">
    对于独立任务，“全新会话”意味着每次运行都会有一个新的 transcript/session id。OpenClaw 可能会保留安全的偏好设置，例如 thinking/fast/verbose 设置、标签以及用户显式选择的模型/凭证覆盖，但不会继承旧 cron 记录中的环境会话上下文：渠道/群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。当重复任务应当有意建立在相同会话上下文之上时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于独立任务，运行时拆除现在包括尽力清理该 cron 会话的浏览器。清理失败会被忽略，因此真正的 cron 结果仍然优先。

    独立 cron 运行还会通过共享的运行时清理路径，释放为该任务创建的所有内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式一致，因此独立 cron 任务不会在多次运行之间泄漏 stdio 子进程或长期存在的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体和 Discord 投递">
    当独立 cron 运行编排子智能体时，投递也会优先使用最终后代输出，而不是陈旧的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是播报它。

    对于仅文本的 Discord 通知目标，OpenClaw 会只发送一次规范化的最终 assistant 文本，而不是同时重放流式/中间文本负载和最终答案。媒体和结构化 Discord 负载仍会作为单独负载投递，以避免丢失附件和组件。

  </Accordion>
</AccordionGroup>

### 独立任务的负载选项

<ParamField path="--message" type="string" required>
  提示文本（独立任务必需）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该任务选择的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制任务可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 会使用为该任务选择的允许模型。如果请求的模型不被允许，cron 会记录一条警告，并回退到该任务的智能体/默认模型选择。已配置的回退链仍然适用，但仅有普通模型覆盖且没有显式的按任务回退列表时，不再把智能体主模型作为隐藏的额外重试目标附加进去。

独立任务的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 按任务负载中的 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

Fast 模式也会遵循解析后的实时选择。如果选中的模型配置带有 `params.fastMode`，独立 cron 默认会使用它。已存储会话中的 `fastMode` 覆盖在任意方向上都仍然优先生效。

如果独立运行遇到实时模型切换交接，cron 会使用切换后的提供商/模型重试，并在重试前为当前运行持久化该实时选择。当该切换还携带新的认证配置文件时，cron 也会为当前运行持久化该认证配置文件覆盖。重试次数是有上限的：在初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 投递与输出

| 模式       | 结果说明                                                        |
| ---------- | --------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则回退投递最终文本到目标                      |
| `webhook`  | 向某个 URL POST 已完成事件负载                                  |
| `none`     | 不进行运行器回退投递                                            |

使用 `--announce --channel telegram --to "-1001234567890"` 可投递到渠道。对于 Telegram 论坛主题，使用 `-1001234567890:topic:123`；直接 RPC/配置调用方也可以将 `delivery.threadId` 作为字符串或数字传入。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用 Matrix 中的 `room:!room:server` 形式。

对于独立任务，聊天投递是共享的。如果聊天路由可用，即使任务使用了 `--no-deliver`，智能体仍然可以使用 `message` 工具。如果智能体发送到了已配置/当前目标，OpenClaw 会跳过回退通知。否则，`announce`、`webhook` 和 `none` 仅控制运行器在智能体回合结束后如何处理最终回复。

当智能体从活跃聊天中创建独立提醒时，OpenClaw 会为回退通知路由保存保留的实时投递目标。内部会话键可能为小写；当当前聊天上下文可用时，不会根据这些键重建提供商投递目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 为失败通知设置全局默认值。
- `job.delivery.failureDestination` 按任务覆盖该值。
- 如果两者都未设置，而该任务已经通过 `announce` 进行投递，失败通知现在会回退到该主通知目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的任务上受支持，除非主投递模式是 `webhook`。
- `failureAlert.includeSkipped: true` 可让任务或全局 cron 告警策略选择加入重复的跳过运行告警。跳过运行会保留单独的连续跳过计数，因此不会影响执行错误退避。

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
  <Tab title="重复的独立任务">
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

## webhook

Gateway 网关可以暴露 HTTP webhook 端点来接收外部触发器。在配置中启用：

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

不接受查询字符串中的 token。

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
      事件说明。
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

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 hook（POST /hooks/<name>）">
    自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
请将 hook 端点放在 loopback、tailnet 或受信任的反向代理之后。

- 使用专用的 hook token；不要复用 gateway 认证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式的 `agentId` 路由。
- 除非你需要调用方自行选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也请设置 `hooks.allowedSessionKeyPrefixes`，以约束允许的会话键形状。
- 默认情况下，hook 负载会被安全边界包装。
  </Warning>

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。
</Note>

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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
# 列出所有任务
openclaw cron list

# 显示一个任务，包括解析后的投递路由
openclaw cron show <jobId>

# 编辑任务
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# 立即强制运行任务
openclaw cron run <jobId>

# 仅在到期时运行
openclaw cron run <jobId> --due

# 查看运行历史
openclaw cron runs --id <jobId> --limit 50

# 删除任务
openclaw cron remove <jobId>

# 智能体选择（多智能体设置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改任务的选定模型。
- 如果模型被允许，确切的该 provider/模型会传递到独立智能体运行。
- 如果不被允许，cron 会发出警告并回退到任务的智能体/默认模型选择。
- 已配置的回退链仍然适用，但仅使用普通 `--model` 覆盖且没有显式的按任务回退列表时，不会再静默回落到智能体主模型作为额外的重试目标。
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

`maxConcurrentRuns` 同时限制计划中的 cron 分发和独立智能体回合执行。独立 cron 智能体回合在内部使用队列专用的 `cron-nested` 执行通道，因此提高此值可以让相互独立的 cron LLM 运行并行推进，而不是只启动它们的外层 cron 包装器。共享的非 cron `nested` 通道不会因该设置而扩宽。

运行时状态 sidecar 由 `cron.store` 派生：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则会追加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 纳入源代码管理。OpenClaw 使用该 sidecar 保存待处理槽位、活跃标记、最近运行元数据，以及用于告诉调度器何时需要为外部编辑过的任务生成新的 `nextRunAtMs` 的调度标识。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并采用指数退避。永久性错误会立即禁用。

    **重复任务重试**：重试之间采用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

  </Accordion>
  <Accordion title="维护">
    `cron.sessionRetention`（默认 `24h`）会清理独立运行会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。
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
    - 对于 `cron` 调度，请核对时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示你使用 `openclaw cron run <jobId> --due` 检查了手动运行，但该任务尚未到期。
  </Accordion>
  <Accordion title="Cron 已触发但没有投递">
    - 投递模式为 `none` 表示不应期望有运行器回退发送。如果聊天路由可用，智能体仍可使用 `message` 工具直接发送。
    - 投递目标缺失/无效（`channel`/`to`）表示已跳过出站发送。
    - 对于 Matrix，复制或旧版任务中被小写化的 `delivery.to` 房间 ID 可能失败，因为 Matrix 房间 ID 区分大小写。请将任务编辑为 Matrix 中准确的 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示投递因凭证问题被阻止。
    - 如果独立运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制回退的排队摘要路径，因此不会向聊天回发任何内容。
    - 如果应该由智能体自行向用户发消息，请检查任务是否有可用路由（`channel: "last"` 且有先前聊天，或显式渠道/目标）。
  </Accordion>
  <Accordion title="Cron 或 heartbeat 看起来阻止了 /new-style rollover">
    - 每日和空闲重置新鲜度不是基于 `updatedAt`；参见[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 gateway 账务处理可能会更新会话行以用于路由/状态，但不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧记录，只要文件仍可用，OpenClaw 就可以从 transcript JSONL 会话头中恢复 `sessionStartedAt`。缺少 `lastInteractionAt` 的旧版空闲记录会使用该恢复出的开始时间作为其空闲基线。
  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 cron 会使用 gateway 主机时区。
    - 不带时区的 `at` 调度会被视为 UTC。
    - heartbeat `activeHours` 使用已配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关内容

- [自动化与任务](/zh-CN/automation) — 所有自动化机制概览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话回合
- [时区](/zh-CN/concepts/timezone) — 时区配置
