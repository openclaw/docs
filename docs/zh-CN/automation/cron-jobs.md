---
read_when:
    - 调度后台作业或唤醒任务
    - 将外部触发器（webhooks、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的计划任务、webhooks 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-26T06:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55261244743958bdc1d9d4ea6676a282ff95928d1230ac39c2368c3f41ad9639
    source_path: automation/cron-jobs.md
    workflow: 15
---

cron 是 Gateway 网关的内置调度器。它会持久化作业，在正确的时间唤醒智能体，并且可以将输出回传到聊天渠道或 webhook 端点。

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

- cron 运行在 **Gateway 网关** 进程**内部**（而不是在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度计划。
- 运行时执行状态会持久化到相邻的 `~/.openclaw/cron/jobs-state.json`。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json` 并将 `jobs-state.json` 加入 `gitignore`。
- 拆分之后，旧版 OpenClaw 仍可读取 `jobs.json`，但可能会将作业视为全新作业，因为运行时字段现在存放在 `jobs-state.json` 中。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性作业（`--at`）默认会在成功后自动删除。
- 隔离 cron 运行会在运行完成后尽力关闭其 `cron:<jobId>` 会话中被跟踪的浏览器标签页 / 进程，因此分离式浏览器自动化不会留下孤儿进程。
- 隔离 cron 运行还会防止过时的确认回复。如果第一个结果只是中间状态更新（如 `on it`、`pulling everything together` 及类似提示），并且没有后代子智能体运行仍负责给出最终答案，OpenClaw 会在投递前再次提示一次以获取实际结果。

<a id="maintenance"></a>

<Note>
cron 的任务协调由运行时负责：只要 cron 运行时仍将某个作业跟踪为正在运行，对应的活跃 cron 任务就会保持存活，即使仍存在旧的子会话行也是如此。一旦运行时不再拥有该作业，且 5 分钟宽限窗口到期，维护流程即可将任务标记为 `lost`。
</Note>

## 调度类型

| 类型    | CLI 标志 | 说明 |
| ------- | -------- | ---- |
| `at`    | `--at`   | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every`| 固定间隔 |
| `cron`  | `--cron` | 5 字段或 6 字段的 cron 表达式，可选 `--tz` |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 可按本地钟表时间调度。

整点重复表达式会自动错开最多 5 分钟，以降低负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错开窗口。

### 每月日期和星期字段使用 OR 逻辑

cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“每月日期”和“星期”字段都不是通配符时，croner 会在**任一**字段匹配时触发 —— 而不是两个都匹配时才触发。这是标准的 Vixie cron 行为。

```
# 预期：“每月 15 日上午 9 点，且仅当这一天是周一”
# 实际：“每月每个 15 日上午 9 点，以及每周一上午 9 点”
0 9 15 * 1
```

这样每月会触发约 5–6 次，而不是 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若你要求两个条件都成立，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或者只按一个字段调度，并在作业的提示词或命令中对另一个条件做额外判断。

## 执行方式

| 方式           | `--session` 值     | 运行位置                 | 最适合 |
| -------------- | ------------------ | ------------------------ | ------ |
| 主会话         | `main`             | 下一次 heartbeat 轮次    | 提醒、系统事件 |
| 隔离           | `isolated`         | 专用 `cron:<jobId>`      | 报告、后台杂务 |
| 当前会话       | `current`          | 在创建时绑定            | 需要上下文感知的重复工作 |
| 自定义会话     | `session:custom-id`| 持久命名会话             | 基于历史持续推进的工作流 |

<AccordionGroup>
  <Accordion title="主会话、隔离和自定义会话的区别">
    **主会话**作业会将系统事件加入队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日 / 空闲重置新鲜度。**隔离**作业会使用全新会话运行一次专用智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持例如每日站会这类基于先前摘要持续构建的工作流。
  </Accordion>
  <Accordion title="隔离作业中的“全新会话”是什么意思">
    对于隔离作业，“全新会话”意味着每次运行都有新的 transcript / session id。OpenClaw 可能会保留安全的偏好设置，例如 thinking / fast / verbose 设置、标签以及用户显式选择的模型 / auth 覆盖，但不会继承旧 cron 行中的环境对话上下文：渠道 / 群组路由、发送或排队策略、提权、来源，或 ACP 运行时绑定。当重复作业应明确建立在同一对话上下文之上时，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对于隔离作业，运行时拆除现在包括尽力清理该 cron 会话的浏览器资源。清理失败会被忽略，因此实际的 cron 结果仍然优先。

    隔离 cron 运行还会通过共享的运行时清理路径，释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式保持一致，因此隔离 cron 作业不会在多次运行之间泄漏 stdio 子进程或长期存在的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体和 Discord 投递">
    当隔离 cron 运行编排子智能体时，投递也会优先采用最终的后代输出，而不是陈旧的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是提前宣布它。

    对于纯文本的 Discord 通知目标，OpenClaw 只会发送一次规范化的最终 assistant 文本，而不会同时重放流式 / 中间文本负载和最终答案。媒体和结构化 Discord 负载仍会作为单独负载投递，以免附件和组件被丢弃。

  </Accordion>
</AccordionGroup>

### 隔离作业的负载选项

<ParamField path="--message" type="string" required>
  提示文本（隔离模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用该作业所选的允许模型。
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

`--model` 会使用该作业所选的允许模型。如果请求的模型不被允许，cron 会记录一条警告，并回退到该作业的智能体 / 默认模型选择。已配置的回退链仍然适用，但仅有模型覆盖、且没有显式的逐作业回退列表时，不再把智能体主模型作为隐藏的额外重试目标追加进去。

隔离作业的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 每个作业负载中的 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体 / 默认模型选择

Fast 模式也会遵循已解析出的实时选择。如果选定模型配置包含 `params.fastMode`，隔离 cron 默认会使用它。已存储的会话 `fastMode` 覆盖仍会在任一方向上优先于配置。

如果某次隔离运行命中了实时模型切换交接，cron 会使用切换后的提供商 / 模型重试，并在重试前为当前运行持久化该实时选择。当切换还携带了新的 auth profile 时，cron 也会为当前运行持久化该 auth profile 覆盖。重试次数是有上限的：初始尝试后再加 2 次切换重试，超过后 cron 会中止，而不是无限循环。

## 投递与输出

| 模式       | 行为 |
| ---------- | ---- |
| `announce` | 如果智能体未发送，则回退投递最终文本到目标 |
| `webhook`  | 将完成事件负载 POST 到某个 URL |
| `none`     | 不进行运行器回退投递 |

使用 `--announce --channel telegram --to "-1001234567890"` 可投递到渠道。对于 Telegram forum topics，请使用 `-1001234567890:topic:123`。Slack / Discord / Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或 Matrix 中的 `room:!room:server` 形式。

对于隔离作业，聊天投递是共享的。如果存在聊天路由，即使作业使用了 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到了已配置 / 当前目标，OpenClaw 会跳过回退通知。否则，`announce`、`webhook` 和 `none` 仅控制运行器在智能体轮次结束后如何处理最终回复。

当智能体从活跃聊天中创建一个隔离提醒时，OpenClaw 会为回退通知路由存储保留的实时投递目标。内部会话键可能是小写；当当前聊天上下文可用时，不会根据这些键重建提供商投递目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认目标。
- `job.delivery.failureDestination` 会对单个作业进行覆盖。
- 如果两者都未设置，且作业已通过 `announce` 投递，失败通知现在会回退到该主通知目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主投递模式是 `webhook`。

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
  <Tab title="重复的隔离作业">
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
  <Tab title="模型与 thinking 覆盖">
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
    运行一次隔离智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 hooks（POST /hooks/<name>）">
    自定义 hook 名称会通过配置中的 `hooks.mappings` 进行解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点放在 local loopback、tailnet 或受信任的反向代理之后。

- 使用专用的 hook token；不要复用网关身份验证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式 `agentId` 路由。
- 除非你确实需要调用方自选会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 以约束允许的会话键形态。
- 默认情况下，hook 负载会被包裹在安全边界中。
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

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并对推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时运行 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

<Steps>
  <Step title="选择 GCP 项目">
    选择由 `gog` 所用 OAuth 客户端所属的 GCP 项目：

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

- `openclaw cron add|edit --model ...` 会更改作业选定的模型。
- 如果模型被允许，该精确的提供商 / 模型就会传递给隔离智能体运行。
- 如果不被允许，cron 会发出警告，并回退到作业的智能体 / 默认模型选择。
- 已配置的回退链仍然适用，但纯 `--model` 覆盖且没有显式的逐作业回退列表时，不再静默回退到智能体主模型作为额外重试目标。
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

运行时状态 sidecar 由 `cron.store` 派生而来：例如 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则会追加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

    **重复性重试**：重试之间采用指数退避（30 秒到 60 分钟）。下一次成功运行后，退避会重置。

  </Accordion>
  <Accordion title="维护">
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
  <Accordion title="Cron 未触发">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行。
    - 对于 `cron` 调度，请核对时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而该作业当时尚未到期。
  </Accordion>
  <Accordion title="Cron 已触发但没有投递">
    - 投递模式 `none` 表示不应期待运行器执行回退发送。当有聊天路由可用时，智能体仍可直接使用 `message` 工具发送。
    - 投递目标缺失 / 无效（`channel` / `to`）表示出站发送已被跳过。
    - 对于 Matrix，复制的或旧版作业如果使用了小写的 `delivery.to` 房间 ID，可能会失败，因为 Matrix 房间 ID 区分大小写。请将作业编辑为 Matrix 中精确的 `!room:server` 或 `room:!room:server` 值。
    - 渠道身份验证错误（`unauthorized`、`Forbidden`）表示投递被凭据阻止。
    - 如果隔离运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接的出站投递，也会抑制回退队列摘要路径，因此不会向聊天回发任何内容。
    - 如果智能体本应自行向用户发消息，请检查作业是否具有可用路由（带有之前聊天的 `channel: "last"`，或显式的渠道 / 目标）。
  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止了 /new-style rollover">
    - 每日和空闲重置新鲜度并不是基于 `updatedAt`；参见[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - cron 唤醒、heartbeat 运行、exec 通知和 Gateway 网关记账都可能更新会话行以进行路由 / 状态维护，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧版行，只要 transcript JSONL 会话头文件仍可用，OpenClaw 就可以从中恢复 `sessionStartedAt`。对于没有 `lastInteractionAt` 的旧版空闲行，则会使用该恢复出的开始时间作为空闲基线。
  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 cron 会使用 Gateway 网关主机时区。
    - 不带时区的 `at` 调度会被视为 UTC。
    - heartbeat `activeHours` 使用已配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关内容

- [Automation & Tasks](/zh-CN/automation) —— 所有自动化机制总览
- [Background Tasks](/zh-CN/automation/tasks) —— cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) —— 周期性的主会话轮次
- [Timezone](/zh-CN/concepts/timezone) —— 时区配置
