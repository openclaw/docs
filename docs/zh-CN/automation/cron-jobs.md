---
read_when:
    - 调度后台作业或唤醒任务
    - 将外部触发器（webhooks、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: 用于 Gateway 网关调度器的计划任务、webhooks 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-27T08:36:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52d48c5d6f19fe9bcaae63afd6a736d953de3f25a710faae9c1ac1df0c081354
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关的内置调度器。它会持久化作业，在正确的时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

## 快速开始

<Steps>
  <Step title="添加一次性提醒">
    ```bash
    openclaw cron add \
      --name "提醒" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "提醒：检查 cron 文档草稿" \
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

- Cron 在 **Gateway 网关进程内部** 运行（而不是在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度计划。
- 运行时执行状态会持久化到旁边的 `~/.openclaw/cron/jobs-state.json`。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json` 并将 `jobs-state.json` 加入 gitignore。
- 分离之后，较旧版本的 OpenClaw 可以读取 `jobs.json`，但可能会将作业视为全新作业，因为运行时字段现在存放在 `jobs-state.json` 中。
- 当 Gateway 网关运行或停止期间编辑 `jobs.json` 时，OpenClaw 会将变更后的调度字段与待处理运行时槽位元数据进行比较，并清除过期的 `nextRunAtMs` 值。纯格式调整或仅键顺序重写会保留待处理槽位。
- 所有 cron 执行都会创建 [后台任务](/zh-CN/automation/tasks) 记录。
- 一次性作业（`--at`）默认会在成功后自动删除。
- 独立 cron 运行会尽力在运行完成后关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会留下孤儿进程。
- 独立 cron 运行还会防止过时的确认回复。如果第一个结果只是中间状态更新（如 `on it`、`pulling everything together` 以及类似提示），且没有任何后代子智能体运行仍负责给出最终答案，OpenClaw 会在投递前再次提示一次，以获取实际结果。
- 独立 cron 运行会优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到已知的最终摘要/输出标记，例如 `SYSTEM_RUN_DENIED` 和 `INVALID_REQUEST`，从而避免将被阻止的命令报告为绿色成功运行。
- 独立 cron 运行还会在未产生任何回复负载时，将运行级别的智能体失败视为作业错误，因此模型/提供商失败会增加错误计数并触发失败通知，而不是将作业清除为成功。

<a id="maintenance"></a>

<Note>
cron 的任务协调首先由运行时拥有，其次由持久化历史记录支持：只要 cron 运行时仍将该作业跟踪为正在运行，活动 cron 任务就会保持为活动状态，即使旧的子会话行仍然存在。一旦运行时不再拥有该作业，且 5 分钟宽限窗口到期，维护检查会针对匹配的 `cron:<jobId>:<startedAt>` 运行检查持久化运行日志和作业状态。如果该持久化历史显示终止结果，任务账本就会据此完成最终状态；否则，由 Gateway 网关拥有的维护逻辑可以将任务标记为 `lost`。离线 CLI 审计可以从持久化历史中恢复，但它不会将其自身空的进程内活动作业集视为 Gateway 网关拥有的 cron 运行已经消失的证据。
</Note>

## 调度类型

| 类型    | CLI 标志  | 说明                                                  |
| ------- | --------- | ----------------------------------------------------- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或像 `20m` 这样的相对时间）    |
| `every` | `--every` | 固定间隔                                              |
| `cron`  | `--cron`  | 5 字段或 6 字段 cron 表达式，可选 `--tz`              |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 以按本地墙钟时间调度。

整点重复表达式会自动错开，最多延迟 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错开窗口。

### 每月第几天和每周第几天使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“每月第几天”和“每周第几天”字段都不是通配符时，croner 会在 **任一** 字段匹配时触发，而不是两个都匹配。这是标准的 Vixie cron 行为。

```
# 预期：“每月 15 日上午 9 点，仅当这一天是星期一时”
# 实际：  “每月所有 15 日上午 9 点，以及每周所有星期一上午 9 点”
0 9 15 * 1
```

这会导致它每月触发约 5–6 次，而不是 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要要求两个条件都成立，请使用 Croner 的 `+` 星期几修饰符（`0 9 15 * +1`），或者在一个字段上进行调度，并在你的作业提示词或命令中对另一个字段进行保护判断。

## 执行方式

| 方式           | `--session` 值     | 运行于                    | 最适合                              |
| -------------- | ------------------ | ------------------------- | ----------------------------------- |
| 主会话         | `main`             | 下一次 heartbeat 回合     | 提醒、系统事件                      |
| 独立           | `isolated`         | 专用 `cron:<jobId>`       | 报告、后台事务                      |
| 当前会话       | `current`          | 在创建时绑定              | 有上下文感知的重复性工作            |
| 自定义会话     | `session:custom-id`| 持久化命名会话            | 基于历史逐步构建的工作流            |

<AccordionGroup>
  <Accordion title="主会话、独立会话与自定义会话">
    **主会话** 作业会将系统事件加入队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**独立** 作业会使用全新会话执行专用智能体回合。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持如基于前一次摘要继续构建的每日报告等工作流。
  </Accordion>
  <Accordion title="独立作业中的“全新会话”是什么意思">
    对于独立作业，“全新会话”表示每次运行都有新的 transcript/session id。OpenClaw 可能会携带安全偏好设置，例如 thinking/fast/verbose 设置、标签以及用户明确选择的模型/凭证覆盖，但不会从旧的 cron 行继承环境对话上下文：渠道/群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。当重复性作业应有意建立在同一会话上下文上时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于独立作业，运行时拆除现在包括对该 cron 会话的浏览器进行尽力清理。清理失败会被忽略，因此实际 cron 结果仍然优先生效。

    独立 cron 运行还会通过共享的运行时清理路径，释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话 MCP 客户端的销毁方式一致，因此独立 cron 作业不会在多次运行之间泄漏 stdio 子进程或长期存在的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体与 Discord 投递">
    当独立 cron 运行编排子智能体时，投递也会优先采用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是将其宣布出去。

    对于仅文本的 Discord announce 目标，OpenClaw 只会发送一次规范化的最终助手文本，而不会重放流式/中间文本负载和最终答案。媒体和结构化 Discord 负载仍会作为单独的负载投递，以避免附件和组件丢失。

  </Accordion>
</AccordionGroup>

### 独立作业的负载选项

<ParamField path="--message" type="string" required>
  提示文本（独立模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用该作业所选的允许模型。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking 级别覆盖。
</ParamField>
<ParamField path="--light-context" type="boolean">
  跳过工作区引导文件注入。
</ParamField>
<ParamField path="--tools" type="string">
  限制作业可使用的工具，例如 `--tools exec,read`。
</ParamField>

`--model` 会使用该作业所选的允许模型。如果请求的模型不被允许，cron 会记录警告，并回退到该作业的智能体/默认模型选择。已配置的回退链仍然适用，但如果只是普通模型覆盖而没有显式的每作业回退列表，则不会再把智能体主模型作为隐藏的额外重试目标附加进去。

独立作业的模型选择优先级为：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每作业负载 `model`
3. 用户选择的已存储 cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式同样遵循已解析的实时选择。如果所选模型配置具有 `params.fastMode`，独立 cron 默认会使用它。已存储的会话 `fastMode` 覆盖仍会在任一方向上优先生效。

如果独立运行命中实时模型切换交接，cron 会使用切换后的提供商/模型进行重试，并在重试前为当前运行持久化该实时选择。当切换同时携带新的凭证配置文件时，cron 也会为当前运行持久化该凭证配置文件覆盖。重试是有上限的：在初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 投递与输出

| 模式       | 发生的情况                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则回退投递最终文本到目标                        |
| `webhook`  | 将完成事件负载 POST 到某个 URL                                    |
| `none`     | 不进行运行器回退投递                                              |

使用 `--announce --channel telegram --to "-1001234567890"` 可投递到渠道。对于 Telegram forum topics，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

对于独立作业，聊天投递是共享的。如果聊天路由可用，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到了已配置/当前目标，OpenClaw 会跳过回退 announce。否则，`announce`、`webhook` 和 `none` 只控制运行器在智能体回合结束后如何处理最终回复。

当智能体从活动聊天中创建独立提醒时，OpenClaw 会为回退 announce 路由存储保留的实时投递目标。内部会话键可能是小写；当当前聊天上下文可用时，不会根据这些键重建提供商投递目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 可按作业覆盖该设置。
- 如果两者都未设置，且作业已通过 `announce` 进行投递，失败通知现在会回退到该主 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 作业中受支持，除非主投递模式为 `webhook`。
- `failureAlert.includeSkipped: true` 允许作业或全局 cron 告警策略选择加入重复跳过运行告警。跳过运行会保留单独的连续跳过计数，因此不会影响执行错误退避。

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
  <Tab title="重复性独立作业">
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
  <Tab title="模型和 Thinking 覆盖">
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

## Webhooks

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

查询字符串中的 token 会被拒绝。

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
    运行一次独立的智能体回合：

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
将 hook 端点放在 loopback、tailnet 或可信任的反向代理之后。

- 使用专用 hook token；不要复用 gateway 认证 token。
- 将 `hooks.path` 设为专用子路径；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你需要调用方自行选择会话，否则保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也要设置 `hooks.allowedSessionKeyPrefixes` 来约束允许的会话键形态。
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

这会写入 `hooks.gmail` 配置，启用 Gmail 预设，并为推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve` 并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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

## 管理作业

```bash
# 列出所有作业
openclaw cron list

# 显示单个作业，包括解析后的投递路由
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

- `openclaw cron add|edit --model ...` 会更改作业所选模型。
- 如果该模型被允许，该精确的提供商/模型会传递到独立智能体运行。
- 如果不被允许，cron 会发出警告，并回退到作业的智能体/默认模型选择。
- 已配置的回退链仍然适用，但普通的 `--model` 覆盖若没有显式的每作业回退列表，将不再静默落回到智能体主模型作为额外重试目标。
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

`maxConcurrentRuns` 同时限制计划 cron 分发和独立智能体回合执行。独立 cron 智能体回合在内部使用队列的 `nested` 执行通道，因此提高该值可让相互独立的 cron LLM 运行并行推进，而不只是启动它们的外层 cron 包装器。

运行时状态 sidecar 由 `cron.store` 推导得出：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则会追加 `-state.json`。

如果你手动编辑 `jobs.json`，请不要将 `jobs-state.json` 纳入源代码控制。OpenClaw 使用这个 sidecar 存储待处理槽位、活动标记、最近运行元数据，以及调度身份信息，用于让调度器知道某个外部编辑过的作业何时需要新的 `nextRunAtMs`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

    **重复性重试**：重试之间使用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

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
    - 确认 Gateway 网关正在持续运行。
    - 对于 `cron` 调度，验证时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而该作业尚未到期。
  </Accordion>
  <Accordion title="Cron 已触发但没有投递">
    - 投递模式 `none` 表示不应期望运行器进行回退发送。如果聊天路由可用，智能体仍可直接使用 `message` 工具发送。
    - 缺少/无效的投递目标（`channel`/`to`）表示出站发送已被跳过。
    - 对于 Matrix，复制的或旧版作业中被小写化的 `delivery.to` 房间 ID 可能会失败，因为 Matrix 房间 ID 区分大小写。请将作业编辑为 Matrix 中精确的 `!room:server` 或 `room:!room:server` 值。
    - 渠道认证错误（`unauthorized`、`Forbidden`）表示投递被凭证阻止。
    - 如果独立运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站投递，也会抑制回退排队摘要路径，因此不会向聊天回发任何内容。
    - 如果智能体应自行向用户发送消息，请检查该作业是否具有可用路由（带有先前聊天的 `channel: "last"`，或显式渠道/目标）。
  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止了 /new 风格轮转">
    - 每日和空闲重置新鲜度并不是基于 `updatedAt`；参见 [会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知和 gateway 记账可能会为了路由/Status 更新会话行，但不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧版行，当文件仍可用时，OpenClaw 可以从 transcript JSONL 会话头恢复 `sessionStartedAt`。没有 `lastInteractionAt` 的旧版空闲行会将该恢复出来的开始时间作为空闲基线。
  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 cron 使用 gateway 主机时区。
    - 不带时区的 `at` 调度会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关内容

- [自动化与任务](/zh-CN/automation) — 所有自动化机制一览
- [后台任务](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话回合
- [时区](/zh-CN/concepts/timezone) — 时区配置
