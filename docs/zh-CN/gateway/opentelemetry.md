---
read_when:
    - 你想将 OpenClaw 的模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、span 名称或属性结构来构建仪表板或告警
summary: 通过 diagnostics-otel 插件（OTLP/HTTP），将 OpenClaw 诊断数据导出到任何 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-04-26T06:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b0a8e2e9e808597c6a139306d4b1264e198edb95579a5f7ba36db049ec96afe
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw 通过内置的 `diagnostics-otel` 插件，使用 **OTLP/HTTP（protobuf）** 导出诊断数据。任何接受 OTLP/HTTP 的收集器或后端都无需代码改动即可使用。关于本地文件日志以及如何读取它们，请参阅 [Logging](/zh-CN/logging)。

## 它是如何协同工作的

- **诊断事件** 是由 Gateway 网关和内置插件为模型运行、消息流、会话、队列和 exec 发出的结构化进程内记录。
- **`diagnostics-otel` 插件** 订阅这些事件，并通过 OTLP/HTTP 将其导出为 OpenTelemetry **指标**、**追踪** 和 **日志**。
- 只有在诊断功能和插件都启用时，导出器才会附加，因此默认情况下进程内开销几乎为零。

## 快速开始

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

你也可以通过 CLI 启用该插件：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 导出的信号

| 信号 | 包含内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标** | 用于 token 使用量、成本、运行时长、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。 |
| **追踪** | 用于模型使用、模型调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。 |
| **日志** | 当启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。 |

可以独立切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled` 为 true 时，这三项默认都开启。

## 配置参考

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 环境变量

| 变量 | 用途 |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 覆盖 `diagnostics.otel.endpoint`。如果该值已经包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当匹配的 `diagnostics.otel.*Endpoint` 配置键未设置时，使用对应信号的 endpoint 覆盖。优先级为：信号专用配置 > 信号专用环境变量 > 共享 endpoint。 |
| `OTEL_SERVICE_NAME` | 覆盖 `diagnostics.otel.serviceName`。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | 覆盖线协议（当前只有 `http/protobuf` 会生效）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 设置为 `gen_ai_latest_experimental`，以发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`），而不是旧版的 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED` | 当另一个 preload 或宿主进程已经注册了全局 OpenTelemetry SDK 时，设置为 `1`。此时插件会跳过自身的 NodeSDK 生命周期，但仍会连接诊断监听器，并遵守 `traces` / `metrics` / `logs`。 |

## 隐私与内容捕获

默认**不会**导出原始模型/工具内容。span 携带的是有界标识符（渠道、提供商、模型、错误类别、仅哈希的请求 ID），绝不会包含提示词文本、响应文本、工具输入、工具输出或会话键。

仅当你的收集器和保留策略已获批准可存储提示词、响应、工具或系统提示文本时，才将 `diagnostics.otel.captureContent.*` 设为 `true`。每个子键都需要独立选择启用：

- `inputMessages` —— 用户提示内容。
- `outputMessages` —— 模型响应内容。
- `toolInputs` —— 工具参数负载。
- `toolOutputs` —— 工具结果负载。
- `systemPrompt` —— 组装后的 system/developer 提示词。

当启用任一子键时，模型和工具 span 仅会为该类内容添加有界、已脱敏的 `openclaw.content.*` 属性。

## 采样与刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 表示全部丢弃，`1.0` 表示全部保留）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值为 `1000`）。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别）。控制台脱敏**不会**应用到 OTLP 日志。高流量部署应优先使用 OTLP 收集器采样/过滤，而不是本地采样。

## 导出的指标

### 模型使用情况

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，单位为秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可选 `error.type`）

### 消息流

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### 队列和会话

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时还包括 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部指标（内存和工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或者在启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或者在启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - `openclaw.provider.request_id_hash`（上游提供商请求 ID 的有界 SHA 哈希；不会导出原始 ID）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`、`openclaw.errorCategory`、可选的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、`openclaw.messageId`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含 prompt、history、response 或 session-key 内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

当显式启用内容捕获时，模型和工具 span 还可以包含有界、已脱敏的 `openclaw.content.*` 属性，用于你选择启用的特定内容类别。

## 诊断事件目录

以下事件为上面的指标和 span 提供支持。插件也可以直接订阅它们，而无需 OTLP 导出。

**模型使用情况**

- `model.usage` — token、成本、时长、上下文、提供商/模型/渠道、会话 ID。`usage` 是提供商/轮次级别的成本和遥测统计；`context.used` 是当前的 prompt/上下文快照，在涉及缓存输入或工具循环调用时，可能低于提供商的 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（聚合计数器：webhooks/queue/session）

**Harness 生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — 智能体 harness 的单次运行生命周期。包括 `harnessId`、可选的 `pluginId`、provider/model/channel，以及运行 ID。完成事件还会增加 `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误事件还会增加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 终态结果、时长、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下，仍然让诊断事件可供插件或自定义 sink 使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如需在不提高 `logging.level` 的情况下获取定向调试输出，请使用诊断标志。标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或者作为一次性的环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出会写入标准日志文件（`logging.file`），并且仍会由 `logging.redactSensitive` 进行脱敏。完整指南请参阅：
[Diagnostics flags](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不将 `diagnostics-otel` 加入 `plugins.allow`，或运行
`openclaw plugins disable diagnostics-otel`。

## 相关内容

- [Logging](/zh-CN/logging) — 文件日志、控制台输出、CLI tail，以及 Control UI 的 Logs 标签页
- [Gateway logging internals](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [Diagnostics flags](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Diagnostics export](/zh-CN/gateway/diagnostics) — 面向运维人员的支持包导出工具（与 OTEL 导出分开）
- [Configuration reference](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
