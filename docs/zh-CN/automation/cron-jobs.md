---
read_when:
    - 安排后台作业或唤醒任务
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用心跳还是 cron】【。analysis to=final code 21 րոպե
summary: Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-10T20:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# 计划任务（Cron）

Cron 是 Gateway 网关内置的调度器。它会持久化任务，在正确的时间唤醒智能体，并可将输出回传到聊天渠道或 webhook 端点。

## 快速开始

```bash
# 添加一个一次性提醒
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# 检查你的任务
openclaw cron list

# 查看运行历史
openclaw cron runs --id <job-id>
```

## Cron 的工作方式

- Cron **在 Gateway 网关进程内部**运行（而不是在模型内部）。
- 任务会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失调度。
- 所有 Cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性任务（`--at`）默认在成功后自动删除。
- 隔离的 Cron 运行会在运行完成后，尽力关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，因此分离的浏览器自动化不会遗留孤儿进程。
- 隔离的 Cron 运行还会防止陈旧的确认回复。如果第一次结果只是一个临时状态更新（`on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次以获取实际结果。

<a id="maintenance"></a>

Cron 的任务协调由运行时负责：只要 Cron 运行时仍将某个任务跟踪为正在运行，该活动的 Cron 任务就会保持存活，即使旧的子会话记录仍然存在也是如此。一旦运行时不再拥有该任务，且 5 分钟宽限期已过，维护流程就可以将该任务标记为 `lost`。

## 调度类型

| 类型    | CLI 标志 | 描述                                             |
| ------- | -------- | ------------------------------------------------ |
| `at`    | `--at`   | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every`| 固定间隔                                         |
| `cron`  | `--cron` | 5 字段或 6 字段的 Cron 表达式，可选 `--tz`       |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 以按本地墙上时钟时间进行调度。

按整点重复执行的表达式会自动错峰，最多延迟 5 分钟，以减少负载峰值。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定显式错峰窗口。

## 执行样式

| 样式         | `--session` 值     | 运行位置                 | 最适合                         |
| ------------ | ------------------ | ------------------------ | ------------------------------ |
| 主会话       | `main`             | 下一个心跳轮次           | 提醒、系统事件                 |
| 隔离         | `isolated`         | 专用的 `cron:<jobId>`    | 报告、后台杂务                 |
| 当前会话     | `current`          | 在创建时绑定             | 依赖上下文的重复工作           |
| 自定义会话   | `session:custom-id`| 持久化命名会话           | 基于历史记录持续推进的工作流   |

**主会话**任务会将一个系统事件加入队列，并可选择唤醒心跳（`--wake now` 或 `--wake next-heartbeat`）。**隔离**任务会在一个全新的专用会话中运行一次独立的智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间持久化上下文，从而支持诸如基于先前摘要生成每日站会之类的工作流。

对于隔离任务，运行时拆除现在也包括对此 Cron 会话进行尽力而为的浏览器清理。清理失败会被忽略，因此实际的 Cron 结果仍然优先。

当隔离的 Cron 运行编排子智能体时，交付也会优先选择最终的后代输出，而不是陈旧的父级临时文本。如果后代仍在运行，OpenClaw 会抑制该父级的部分更新，而不是将其公布出来。

### 隔离任务的负载选项

- `--message`：提示文本（隔离任务必填）
- `--model` / `--thinking`：模型和思考级别覆盖
- `--light-context`：跳过工作区引导文件注入
- `--tools exec,read`：限制任务可使用的工具

`--model` 会为该任务使用所选且允许的模型。如果请求的模型不被允许，Cron 会记录一条警告，并回退到该任务的智能体/默认模型选择。已配置的回退链仍然适用，但仅设置模型覆盖且未显式设置按任务回退列表时，不再将智能体主模型作为隐藏的额外重试目标附加进去。

隔离任务的模型选择优先级如下：

1. Gmail hook 模型覆盖（当运行来自 Gmail 且该覆盖被允许时）
2. 按任务负载中的 `model`
3. 已存储的 Cron 会话模型覆盖
4. 智能体/默认模型选择

快速模式也会遵循已解析出的实时选择。如果所选模型配置带有 `params.fastMode`，隔离的 Cron 默认会使用它。已存储的会话 `fastMode` 覆盖仍然在两个方向上都优先于配置。

如果隔离运行遇到实时模型切换交接，Cron 会使用切换后的提供商/模型重试，并在重试前持久化该实时选择。如果切换还携带了新的认证配置文件，Cron 也会持久化该认证配置文件覆盖。重试次数是有上限的：初次尝试外加 2 次切换重试之后，Cron 会中止，而不是无限循环。

## 交付和输出

| 模式       | 发生的情况                                             |
| ---------- | ------------------------------------------------------ |
| `announce` | 将摘要发送到目标渠道（隔离任务的默认值）               |
| `webhook`  | 将完成事件负载通过 POST 发送到某个 URL                 |
| `none`     | 仅内部保留，不进行交付                                 |

使用 `--announce --channel telegram --to "-1001234567890"` 可交付到某个渠道。对于 Telegram 论坛话题，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。

对于由 Cron 拥有的隔离任务，运行器负责最终的交付路径。系统会提示智能体返回纯文本摘要，然后该摘要会通过 `announce`、`webhook` 发送，或在 `none` 模式下仅保留在内部。`--no-deliver` 不会将交付权交还给智能体；它会让此次运行保持为内部运行。

如果原始任务明确要求向某个外部收件人发送消息，智能体应在其输出中注明该消息应发送给谁/发送到哪里，而不是尝试直接发送。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认目标。
- `job.delivery.failureDestination` 可按任务覆盖该目标。
- 如果两者都未设置，并且该任务本身已通过 `announce` 进行交付，失败通知现在会回退到该主要 announce 目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的任务上受支持，除非主要交付模式为 `webhook`。

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

带交付的重复隔离任务：

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

带模型和思考覆盖的隔离任务：

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

### 认证

每个请求都必须通过请求头包含 hook token：

- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`

查询字符串中的 token 会被拒绝。

### POST /hooks/wake

为主会话加入一个系统事件：

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必填）：事件描述
- `mode`（可选）：`now`（默认）或 `next-heartbeat`

### POST /hooks/agent

运行一次隔离的智能体轮次：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### 映射的 hooks（POST /hooks/\<name\>）

自定义 hook 名称会通过配置中的 `hooks.mappings` 进行解析。映射可以使用模板或代码转换，将任意负载转换为 `wake` 或 `agent` 动作。

### 安全

- 将 hook 端点保留在 loopback、tailnet 或受信任的反向代理之后。
- 使用专用的 hook token；不要复用网关认证 token。
- 将 `hooks.path` 放在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式的 `agentId` 路由。
- 除非你确实需要由调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，也要设置 `hooks.allowedSessionKeyPrefixes`，以约束允许的会话键形态。
- 默认情况下，hook 负载会被安全边界包裹。

## Gmail PubSub 集成

通过 Google PubSub 将 Gmail 收件箱触发器接入 OpenClaw。

**前置条件**：`gcloud` CLI、`gog`（gogcli）、已启用 OpenClaw hooks，以及用于公共 HTTPS 端点的 Tailscale。

### 向导设置（推荐）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并对推送端点使用 Tailscale Funnel。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出此行为。

### 手动一次性设置

1. 选择拥有 `gog` 所使用 OAuth 客户端的 GCP 项目：

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. 创建主题并授予 Gmail 推送访问权限：

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

## 管理任务

```bash
# 列出所有任务
openclaw cron list

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

# 智能体选择（多智能体配置）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

模型覆盖说明：

- `openclaw cron add|edit --model ...` 会更改任务所选的模型。
- 如果该模型被允许，该确切的提供商/模型会传递给隔离的智能体运行。
- 如果不被允许，Cron 会发出警告，并回退到该任务的智能体/默认模型选择。
- 已配置的回退链仍然适用，但仅设置 `--model` 覆盖且未显式设置按任务回退列表时，不再悄悄回落到智能体主模型作为额外的重试目标。

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

禁用 Cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

**一次性任务重试**：瞬时错误（速率限制、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

**重复任务重试**：在重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后，退避会重置。

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
- 对于 `cron` 调度，核对时区（`--tz`）与主机时区是否一致。
- 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而该任务尚未到期。

### Cron 已触发但没有交付

- 交付模式为 `none` 表示不期望有任何外部消息。
- 缺少/无效的交付目标（`channel`/`to`）表示出站发送已被跳过。
- 渠道认证错误（`unauthorized`、`Forbidden`）表示交付被凭据阻止。
- 如果隔离运行只返回静默令牌（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接的对外交付，同时也会抑制回退的排队摘要路径，因此不会有任何内容回发到聊天中。
- 对于由 Cron 拥有的隔离任务，不要期待智能体使用消息工具作为回退。运行器负责最终交付；`--no-deliver` 会使其保持为内部运行，而不是允许直接发送。

### 时区注意事项

- 未使用 `--tz` 的 Cron 会使用 Gateway 网关主机的时区。
- 不带时区的 `at` 调度会被视为 UTC。
- Heartbeat `activeHours` 使用已配置的时区解析。

## 相关内容

- [自动化与任务](/zh-CN/automation) — 一览所有自动化机制
- [后台任务](/zh-CN/automation/tasks) — Cron 执行的任务账本
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [时区](/zh-CN/concepts/timezone) — 时区配置
