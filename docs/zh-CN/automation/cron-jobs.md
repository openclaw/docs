---
read_when:
    - 安排后台作业或唤醒任务
    - 将外部触发器（webhook、Gmail）接入 OpenClaw
    - 为计划任务决定使用 heartbeat 还是 cron
sidebarTitle: Scheduled tasks
summary: Gateway 网关调度器的计划任务、webhook 和 Gmail PubSub 触发器
title: 计划任务
x-i18n:
    generated_at: "2026-04-26T06:29:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron 是 Gateway 网关内置的调度器。它会持久化作业，在正确的时间唤醒智能体，并可将输出回传到聊天渠道或 webhook 端点。

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

- Cron 在 **Gateway 网关** 进程**内部**运行（而不是在模型内部）。
- 作业定义会持久化到 `~/.openclaw/cron/jobs.json`，因此重启不会丢失计划。
- 运行时执行状态会持久化到相邻的 `~/.openclaw/cron/jobs-state.json`。如果你用 git 跟踪 cron 定义，请跟踪 `jobs.json`，并将 `jobs-state.json` 添加到 gitignore。
- 拆分之后，较旧版本的 OpenClaw 可以读取 `jobs.json`，但可能会将作业视为全新作业，因为运行时字段现在存放在 `jobs-state.json` 中。
- 所有 cron 执行都会创建[后台任务](/zh-CN/automation/tasks)记录。
- 一次性作业（`--at`）默认会在成功后自动删除。
- 隔离的 cron 运行会尽力在运行完成时关闭其 `cron:<jobId>` 会话所跟踪的浏览器标签页/进程，这样分离的浏览器自动化就不会留下孤儿进程。
- 隔离的 cron 运行还会防止过时的确认回复。如果第一次结果只是中间状态更新（例如 `on it`、`pulling everything together` 以及类似提示），并且没有任何后代子智能体运行仍负责最终答案，OpenClaw 会在交付前再次提示一次以获取实际结果。

<a id="maintenance"></a>

<Note>
cron 的任务协调优先由运行时负责，其次由持久化历史支持：只要 cron 运行时仍将该作业跟踪为正在运行，活动的 cron 任务就会保持存活，即使旧的子会话记录仍然存在也是如此。一旦运行时不再拥有该作业，并且 5 分钟宽限窗口到期，维护检查就会查看与匹配的 `cron:<jobId>:<startedAt>` 运行对应的持久化运行日志和作业状态。如果该持久化历史显示终态结果，任务台账就会据此完成收尾；否则，由 Gateway 网关拥有的维护检查可以将任务标记为 `lost`。离线 CLI 审计可以从持久化历史中恢复，但它不会将自己空的进程内活动作业集视为 Gateway 网关拥有的 cron 运行已经消失的证明。
</Note>

## 调度类型

| 类型    | CLI 标志 | 说明 |
| ------- | --------- | ---- |
| `at`    | `--at`    | 一次性时间戳（ISO 8601 或类似 `20m` 的相对时间） |
| `every` | `--every` | 固定间隔 |
| `cron`  | `--cron`  | 5 字段或 6 字段的 cron 表达式，可选 `--tz` |

不带时区的时间戳会被视为 UTC。添加 `--tz America/New_York` 以使用本地挂钟时间调度。

按整点重复执行的表达式会自动错开，最多延迟 5 分钟，以减少负载尖峰。使用 `--exact` 可强制精确时间，或使用 `--stagger 30s` 指定明确的错开窗口。

### 日期和星期使用 OR 逻辑

Cron 表达式由 [croner](https://github.com/Hexagon/croner) 解析。当“每月第几天”和“星期几”字段都不是通配符时，croner 会在**任一**字段匹配时触发，而不是要求两者都匹配。这是标准的 Vixie cron 行为。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

这会每月触发约 5–6 次，而不是每月 0–1 次。OpenClaw 在这里使用 Croner 默认的 OR 行为。若要同时要求两个条件都满足，请使用 Croner 的 `+` 星期修饰符（`0 9 15 * +1`），或者仅按其中一个字段调度，并在你的作业提示词或命令中对另一个条件进行判断。

## 执行样式

| 样式 | `--session` 值 | 运行位置 | 最适合 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| 主会话 | `main` | 下一次 heartbeat 轮次 | 提醒、系统事件 |
| 隔离 | `isolated` | 专用 `cron:<jobId>` | 报告、后台杂务 |
| 当前会话 | `current` | 在创建时绑定 | 依赖上下文的重复性工作 |
| 自定义会话 | `session:custom-id` | 持久化命名会话 | 基于历史构建的工作流 |

<AccordionGroup>
  <Accordion title="主会话、隔离和自定义之间的区别">
    **主会话**作业会将系统事件加入队列，并可选择唤醒 heartbeat（`--wake now` 或 `--wake next-heartbeat`）。这些系统事件不会延长目标会话的每日/空闲重置新鲜度。**隔离**作业会使用全新会话运行一次专用智能体轮次。**自定义会话**（`session:xxx`）会在多次运行之间保留上下文，从而支持例如基于先前摘要构建的每日站会这类工作流。
  </Accordion>
  <Accordion title="隔离作业中的“全新会话”是什么意思">
    对隔离作业来说，“全新会话”意味着每次运行都会使用新的 transcript/session id。OpenClaw 可能会保留安全偏好，例如 thinking/fast/verbose 设置、标签，以及用户显式选择的模型/凭证覆盖，但不会从旧的 cron 记录继承环境对话上下文：渠道/群组路由、发送或排队策略、提权、来源或 ACP 运行时绑定。如果某个重复性作业应刻意基于同一会话上下文继续构建，请使用 `current` 或 `session:<id>`。
  </Accordion>
  <Accordion title="运行时清理">
    对隔离作业而言，运行时拆除现在包括对该 cron 会话的浏览器进行尽力清理。清理失败会被忽略，因此实际的 cron 结果仍然优先。

    隔离的 cron 运行还会通过共享的运行时清理路径，释放为该作业创建的任何内置 MCP 运行时实例。这与主会话和自定义会话的 MCP 客户端销毁方式保持一致，因此隔离的 cron 作业不会在多次运行之间泄漏 stdio 子进程或长期存在的 MCP 连接。

  </Accordion>
  <Accordion title="子智能体和 Discord 交付">
    当隔离的 cron 运行编排子智能体时，交付也会优先采用最终后代输出，而不是过时的父级中间文本。如果后代仍在运行，OpenClaw 会抑制该部分父级更新，而不是将其发布出去。

    对于仅文本的 Discord 通知目标，OpenClaw 会只发送一次规范化的最终助手文本，而不会同时重放流式/中间文本载荷和最终答案。媒体和结构化的 Discord 载荷仍会作为单独载荷发送，以免附件和组件丢失。

  </Accordion>
</AccordionGroup>

### 隔离作业的载荷选项

<ParamField path="--message" type="string" required>
  提示文本（隔离模式必填）。
</ParamField>
<ParamField path="--model" type="string">
  模型覆盖；使用为该作业选择且允许的模型。
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

`--model` 会使用为该作业选择且允许的模型。如果请求的模型不被允许，cron 会记录警告，并回退到该作业的智能体/默认模型选择。已配置的回退链仍然适用，但仅指定模型覆盖且未显式提供逐作业回退列表时，不会再把智能体主模型作为隐藏的额外重试目标附加进去。

隔离作业的模型选择优先级为：

1. Gmail hook 模型覆盖（当该运行来自 Gmail 且该覆盖被允许时）
2. 逐作业载荷 `model`
3. 用户选择并存储的 cron 会话模型覆盖
4. 智能体/默认模型选择

Fast 模式也会遵循已解析的实时选择。如果所选模型配置包含 `params.fastMode`，隔离 cron 默认会使用它。存储的会话 `fastMode` 覆盖在任一方向上仍优先于配置。

如果隔离运行遇到实时模型切换交接，cron 会使用切换后的 provider/模型重试，并在重试前为当前运行持久化该实时选择。当切换还携带新的凭证配置文件时，cron 也会为当前运行持久化该凭证配置文件覆盖。重试次数是有上限的：初始尝试之后最多再进行 2 次切换重试，随后 cron 会中止，而不是无限循环。

## 交付与输出

| 模式 | 会发生什么 |
| ---------- | ------------------------------------------------------------------- |
| `announce` | 如果智能体未发送，则回退将最终文本交付到目标 |
| `webhook`  | 将完成事件载荷 POST 到某个 URL |
| `none`     | 运行器不进行回退交付 |

使用 `--announce --channel telegram --to "-1001234567890"` 可交付到渠道。对于 Telegram forum topics，请使用 `-1001234567890:topic:123`。Slack/Discord/Mattermost 目标应使用显式前缀（`channel:<id>`、`user:<id>`）。Matrix 房间 ID 区分大小写；请使用精确的房间 ID，或使用来自 Matrix 的 `room:!room:server` 形式。

对于隔离作业，聊天交付是共享的。如果有可用的聊天路由，即使作业使用 `--no-deliver`，智能体也可以使用 `message` 工具。如果智能体发送到了已配置/当前目标，OpenClaw 会跳过回退通知。否则，`announce`、`webhook` 和 `none` 仅控制运行器在智能体轮次结束后如何处理最终回复。

当智能体从活动聊天中创建隔离提醒时，OpenClaw 会为回退通知路由存储保留的实时交付目标。内部会话键可能是小写；当当前聊天上下文可用时，不会依据这些键重新构造 provider 交付目标。

失败通知遵循单独的目标路径：

- `cron.failureDestination` 设置失败通知的全局默认值。
- `job.delivery.failureDestination` 会按作业覆盖该设置。
- 如果两者都未设置，且该作业已经通过 `announce` 交付，失败通知现在会回退到该主通知目标。
- `delivery.failureDestination` 仅在 `sessionTarget="isolated"` 的作业上受支持，除非主交付模式是 `webhook`。

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

## Webhooks

Gateway 网关可以暴露 HTTP webhook 端点，以供外部触发器使用。在配置中启用：

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
    运行一个隔离的智能体轮次：

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    字段：`message`（必填）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="映射 hooks（POST /hooks/<name>）">
    自定义 hook 名称通过配置中的 `hooks.mappings` 进行解析。映射可以使用模板或代码转换，将任意载荷转换为 `wake` 或 `agent` 动作。
  </Accordion>
</AccordionGroup>

<Warning>
将 hook 端点置于 local loopback、tailnet 或受信任的反向代理之后。

- 使用专用的 hook token；不要复用 gateway 身份验证 token。
- 将 `hooks.path` 保持在专用子路径下；`/` 会被拒绝。
- 设置 `hooks.allowedAgentIds` 以限制显式的 `agentId` 路由。
- 除非你确实需要调用方选择会话，否则请保持 `hooks.allowRequestSessionKey=false`。
- 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 以约束允许的会话键形式。
- hook 载荷默认会被安全边界包装。
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

这会写入 `hooks.gmail` 配置、启用 Gmail 预设，并使用 Tailscale Funnel 作为推送端点。

### Gateway 网关自动启动

当 `hooks.enabled=true` 且设置了 `hooks.gmail.account` 时，Gateway 网关会在启动时启动 `gog gmail watch serve`，并自动续订 watch。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出。

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

# 显示一个作业，包括已解析的交付路由
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
- 如果该模型被允许，该精确 provider/模型 就会传递给隔离的智能体运行。
- 如果不被允许，cron 会发出警告，并回退到作业的智能体/默认模型选择。
- 已配置的回退链仍然适用，但仅使用普通 `--model` 覆盖且未显式提供逐作业回退列表时，不会再静默回退到智能体主模型作为额外重试目标。
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

运行时状态 sidecar 由 `cron.store` 推导得出：像 `~/clawd/cron/jobs.json` 这样的 `.json` 存储会使用 `~/clawd/cron/jobs-state.json`，而不带 `.json` 后缀的存储路径则会追加 `-state.json`。

禁用 cron：`cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="重试行为">
    **一次性作业重试**：瞬时错误（限流、过载、网络、服务器错误）最多重试 3 次，并使用指数退避。永久性错误会立即禁用。

    **重复作业重试**：在重试之间使用指数退避（30 秒到 60 分钟）。下一次成功运行后，退避会重置。

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
  <Accordion title="Cron 没有触发">
    - 检查 `cron.enabled` 和 `OPENCLAW_SKIP_CRON` 环境变量。
    - 确认 Gateway 网关持续运行中。
    - 对于 `cron` 调度，验证时区（`--tz`）与主机时区是否一致。
    - 运行输出中的 `reason: not-due` 表示手动运行是通过 `openclaw cron run <jobId> --due` 检查的，而该作业当时尚未到期。
  </Accordion>
  <Accordion title="Cron 已触发但没有交付">
    - 交付模式 `none` 表示不应期待运行器的回退发送。如果有聊天路由可用，智能体仍可通过 `message` 工具直接发送。
    - 缺失/无效的交付目标（`channel`/`to`）表示已跳过出站发送。
    - 对于 Matrix，复制或旧版作业中带有小写 `delivery.to` 房间 ID 的情况可能失败，因为 Matrix 房间 ID 区分大小写。请将作业编辑为来自 Matrix 的精确 `!room:server` 或 `room:!room:server` 值。
    - 渠道身份验证错误（`unauthorized`、`Forbidden`）表示交付被凭证阻止。
    - 如果隔离运行只返回静默 token（`NO_REPLY` / `no_reply`），OpenClaw 会抑制直接出站交付，也会抑制回退的排队摘要路径，因此不会有任何内容发回聊天。
    - 如果智能体本应自行向用户发送消息，请检查该作业是否具有可用路由（带有先前聊天的 `channel: "last"`，或显式的渠道/目标）。
  </Accordion>
  <Accordion title="Cron 或 heartbeat 似乎阻止了 /new-style rollover">
    - 每日和空闲重置的新鲜度并不基于 `updatedAt`；请参阅[会话管理](/zh-CN/concepts/session#session-lifecycle)。
    - Cron 唤醒、heartbeat 运行、exec 通知以及 gateway 记账可能会为路由/状态更新会话记录，但它们不会延长 `sessionStartedAt` 或 `lastInteractionAt`。
    - 对于这些字段出现之前创建的旧版记录，如果 transcript JSONL 会话头文件仍可用，OpenClaw 可以从中恢复 `sessionStartedAt`。对于没有 `lastInteractionAt` 的旧版空闲记录，会使用该恢复出的开始时间作为空闲基线。
  </Accordion>
  <Accordion title="时区注意事项">
    - 不带 `--tz` 的 cron 会使用 gateway 主机时区。
    - 不带时区的 `at` 调度会被视为 UTC。
    - Heartbeat `activeHours` 使用已配置的时区解析。
  </Accordion>
</AccordionGroup>

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 所有自动化机制一览
- [Background Tasks](/zh-CN/automation/tasks) — cron 执行的任务台账
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [Timezone](/zh-CN/concepts/timezone) — 时区配置
