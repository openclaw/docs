---
read_when:
    - 调度后台作业或唤醒任务
    - 将外部触发器（webhooks、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
summary: 用于 Gateway 网关调度器的计划任务、webhooks 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-25T05:53:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关内置的调度器。它会持久化作业，在正确的时间唤醒智能体，并可将输出回传到聊天渠道或 webhook 端点。

## 快速开始

```bash
# 添加一次性提醒
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# 检查你的作业
openclaw cron list
openclaw cron show <job-id>

# 查看运行历史
openclaw cron runs --id <job-id>
```

## cron 的工作方式

- Cron 在 **Gateway 网关** 进程**内部**运行（不是在模型内部）。
- 作业定义持久化保存在 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度计划。
- 运行时执行状态保存在旁边的 `~/.openclaw/cron/jobs-state.json`。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 加入 gitignore。
- 拆分之后，较旧版本的 OpenClaw 可以读取 `jobs.json`，但可能会将作业视为全新作业，因为运行时字段现在保存在 `jobs-state.json` 中。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性作业（`--at`）默认在成功后自动删除。
- 隔离的 cron 运行会尽力关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页 / 进程，因此分离的浏览器自动化不会在运行完成后留下孤儿进程。
- 隔离的 cron 运行还会防止陈旧的确认回复。如果第一个结果只是临时状态更新（例如 `on it`、`pulling everything together` 以及类似提示），并且没有后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次以获取实际结果。

<a id="maintenance"></a>

cron 的任务协调由运行时负责：只要 cron 运行时仍将该作业标记为正在运行，活动的 cron 任务就会保持存活，即使旧的子会话行仍然存在也是如此。一旦运行时不再拥有该作业且 5 分钟宽限期到期，维护过程就可以将任务标记为 `lost`。

## 调度类型

| 类型    | CLI 标志 | 描述 |
| ------- | --------- | ---- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every` | 固定间隔 |
| `cron`  | `--cron`  | 5 字段或 6 字段的 cron 表达式，可选 `--tz` |

不带时区的时间戳会按 UTC 处理。添加 `--tz America/New_York` 可按本地挂钟时间调度。

每小时整点循环表达式会自动错峰，最多延后 5 分钟，以降低负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错峰窗口。

### 月中的某一天和星期几使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“月中的某一天”和“星期几”两个字段都不是通配符时，croner 会在**任一**字段匹配时触发——而不是两个都匹配。这是标准的 Vixie cron 行为。

```
# 预期："每月 15 日上午 9 点，但仅当这天是周一"
# 实际："每月 15 日上午 9 点，以及每个周一上午 9 点"
0 9 15 * 1
```

这会每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件，请使用 Croner 的 `+` 星期几修饰符（`0 9 15 * +1`），或者仅基于其中一个字段调度，并在你的作业提示词或命令中校验另一个条件。

## 执行方式

| 方式            | `--session` 值      | 运行位置                 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------ |
| 主会话          | `main`              | 下一次 heartbeat 轮次    | 提醒、系统事件 |
| 隔离            | `isolated`          | 专用 `cron:<jobId>`      | 报告、后台事务 |
| 当前会话        | `current`           | 在创建时绑定             | 依赖上下文的循环工作 |
| 自定义会话      | `session:custom-id` | 持久命名会话             | 基于历史构建的工作流 |

**主会话**作业会排入一个系统事件，并可选唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。**隔离**作业会以全新会话运行一个专用智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持例如基于先前摘要构建的每日站会等工作流。

对于隔离作业，“全新会话”表示每次运行都有新的 transcript / session id。OpenClaw 可能会保留安全的偏好设置，例如 thinking / fast / verbose 设置、标签以及用户显式选择的模型 / 凭证覆盖，但不会继承旧 cron 记录中的环境会话上下文：渠道 / 群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。如果循环作业应有意建立在同一会话上下文之上，请使用 `current` 或 `session:<id>`。

对于隔离作业，运行时拆除现在包括尽力清理该 cron 会话的浏览器。清理失败会被忽略，因此实际的 cron 结果仍然优先。

隔离的 cron 运行还会通过共享的运行时清理路径，释放为该作业创建的所有内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式一致，因此隔离的 cron 作业不会在多次运行间泄漏 stdio 子进程或长期存在的 MCP 连接。

当隔离的 cron 运行协调子智能体时，交付也会优先使用最终的后代输出，而不是陈旧的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是把它公布出去。

对于纯文本的 Discord 通知目标，OpenClaw 只会发送一次规范的最终助手文本，而不会同时重放流式 / 中间文本负载和最终答案。媒体和结构化的 Discord 负载仍会作为独立负载交付，以避免附件和组件被丢弃。

### 隔离作业的负载选项

- `--message`：提示词文本（隔离模式必需）
- `--model` / `--thinking`：模型和 thinking 级别覆盖
- `--light-context`：跳过工作区引导文件注入
- `--tools exec,read`：限制作业可使用的工具

`--model` 会为该作业使用所选且被允许的模型。如果请求的模型不被允许，cron 会记录警告，并改为回退到该作业的智能体 / 默认模型选择。已配置的回退链仍然适用，但单纯的模型覆盖在没有显式的按作业回退列表时，不再把智能体主模型追加为隐藏的额外重试目标。

隔离作业的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 按作业负载中的 `model`
3. 用户选择的已存储 cron 会话模型覆盖
4. 智能体 / 默认模型选择

Fast mode 也会遵循解析后的实时选择。如果所选模型配置带有 `params.fastMode`，隔离的 cron 默认会使用它。已存储的会话 `fastMode` 覆盖在任一方向上都仍然优先于配置。

如果某个隔离运行遇到实时模型切换交接，cron 会使用切换后的 provider / 模型重试，并在重试前为当前运行持久化该实时选择。当切换同时携带新的 auth profile 时，cron 也会为当前运行持久化该 auth profile 覆盖。重试次数有上限：在初始尝试加上 2 次切换重试之后，cron 会中止，而不是无限循环。

## 交付与输出

| 模式       | 发生的情况 |
| ---------- | ---------- |
| `announce` | 如果智能体未发送，则回退交付最终文本到目标 |
| `webhook`  | 向某个 URL `POST` 完成事件负载 |
| `none`     | 运行器不做回退交付 |

使用 `--announce --channel telegram --to "-1001234567890"` 可交付到渠道。对于 Telegram forum topics，使用 `-1001234567890:topic:123`。Slack / Discord / Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。

对于隔离作业，聊天交付是共享的。如果存在聊天路由，即使作业使用 `--no-deliver`，智能体仍可使用 `message` 工具。如果智能体发送到了已配置 / 当前目标，OpenClaw 会跳过回退通知。否则，`announce`、`webhook` 和 `none` 只控制运行器如何在智能体轮次结束后处理最终回复。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 可按作业覆盖它。
- 如果两者都未设置，且作业已通过 `announce` 交付，失败通知现在会回退到该主要通知目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业中受支持，除非主要交付模式是 `webhook`。

## CLI 示例

一次性提醒（主会话）：

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

带交付的循环隔离作业：

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

带模型和 thinking 覆盖的隔离作业：

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

不接受查询字符串中的 token。

### POST /hooks/wake

为主会话排入一个系统事件：

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必需）：事件描述
- `mode`（可选）：`now`（默认）或 `next-heartbeat`

### POST /hooks/agent

运行一个隔离的智能体轮次：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

字段：`message`（必需）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### 映射 hooks（POST /hooks/\<name\>）

自定义 hook 名称通过配置中的 `hooks.mappings` 解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。

### 安全性

- 将 hook 端点置于 loopback、tailnet 或受信任的反向代理之后。
- 使用专用的 hook token；不要复用 gateway 认证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式的 `agentId` 路由。
- 保持 `hooks.allowRequestSessionKey=false`，除非你确实需要由调用方选择会话。
- 如果你启用了 `hooks.allowRequestSessionKey`，也请设置 `hooks.allowedSessionKeyPrefixes` 以限制允许的会话键形态。
- 默认情况下，hook 负载会包裹安全边界。

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

**前置条件**：`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并为推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

### 手动一次性设置

1. 选择拥有 `gog` 所使用 OAuth 客户端的 GCP 项目：

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 创建 topic 并授予 Gmail 推送访问权限：

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. 启动 watch：

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改作业所选的模型。
- 如果该模型被允许，那个精确的 provider / 模型 就会传递到隔离的智能体运行。
- 如果不被允许，cron 会发出警告，并回退到该作业的智能体 / 默认模型选择。
- 已配置的回退链仍然适用，但普通的 `--model` 覆盖在没有显式按作业回退列表时，不再静默回退到智能体主模型作为额外重试目标。

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

运行时状态 sidecar 由 `cron.store` 派生：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而没有 `.json` 后缀的存储路径则会追加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

**一次性重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久错误会立即禁用。

**循环重试**：重试之间使用指数退避（30 秒到 60 分钟）。在下一次成功运行后，退避会重置。

**维护**：`cron.sessionRetention`（默认 `24h`）会清理隔离运行的会话条目。`cron.runLog.maxBytes` / `cron.runLog.keepLines` 会自动清理运行日志文件。

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

### Cron 未触发

- 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
- 确认 Gateway 网关在持续运行。
- 对于 `cron` 调度，验证时区（`--tz`）与主机时区是否一致。
- 运行输出中的 `reason: not-due` 表示通过 `openclaw cron run <jobId> --due` 检查手动运行时，该作业尚未到期。

### Cron 已触发但没有交付

- 交付模式为 `none` 表示预期不会有运行器回退发送。当存在聊天路由时，智能体仍可通过 `message` 工具直接发送。
- 交付目标缺失 / 无效（`channel` / `to`）表示已跳过出站发送。
- 渠道认证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
- 如果隔离运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退排队摘要路径，因此不会向聊天回发任何内容。
- 如果应由智能体自行向用户发送消息，请检查该作业是否有可用路由（带有先前聊天记录的 `channel: "last"`，或显式的 channel / target）。

### 时区注意事项

- 未指定 `--tz` 的 cron 会使用 gateway 主机时区。
- 未指定时区的 `at` 调度会按 UTC 处理。
- Heartbeat `activeHours` 使用已配置的时区解析。

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 所有自动化机制概览
- [Background Tasks](/zh-CN/automation/tasks) — cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [Timezone](/zh-CN/concepts/timezone) — 时区配置
