---
read_when:
    - 你希望将 OpenClaw 模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要准确的指标名称、Span 名称或属性结构来构建仪表板或告警
summary: 通过 diagnostics-otel 插件（OTLP/HTTP）将 OpenClaw 诊断数据导出到任何 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-04-26T04:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f2389c4efc2984d27e571152ce3cfea2ffeddc99084695f1c6ab6c97e6b7f7b
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw 通过内置的 `diagnostics-otel` 插件使用 **OTLP/HTTP（protobuf）** 导出诊断数据。任何接受 OTLP/HTTP 的收集器或后端都无需修改代码即可使用。有关本地文件日志以及如何读取它们，请参阅 [日志](/zh-CN/logging)。

## 工作方式

- **诊断事件** 是 Gateway 网关和内置插件为模型运行、消息流、会话、队列和 exec 发出的结构化进程内记录。
- **`diagnostics-otel` 插件** 订阅这些事件，并通过 OTLP/HTTP 将其导出为 OpenTelemetry **指标**、**追踪** 和 **日志**。
- 只有在诊断功能面和插件都已启用时，导出器才会附加，因此默认情况下进程内开销几乎为零。

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
`protocol` 目前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 导出的信号

| 信号 | 包含内容 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **指标** | 用于令牌使用量、成本、运行时长、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。 |
| **追踪** | 用于模型使用、模型调用、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 Span。 |
| **日志** | 当启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。 |

你可以独立切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled` 为 true 时，这三者默认都开启。

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
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 覆盖 `diagnostics.otel.endpoint`。如果该值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当对应的 `diagnostics.otel.*Endpoint` 配置键未设置时，使用按信号划分的端点覆盖。信号专用配置优先于信号专用环境变量，而信号专用环境变量优先于共享端点。 |
| `OTEL_SERVICE_NAME` | 覆盖 `diagnostics.otel.serviceName`。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | 覆盖传输协议（当前仅 `http/protobuf` 会生效）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 设置为 `gen_ai_latest_experimental` 以发出最新的实验性 GenAI Span 属性（`gen_ai.provider.name`），而不是旧版 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED` | 当另一个预加载项或宿主进程已注册全局 OpenTelemetry SDK 时，设为 `1`。此时插件会跳过自己的 `NodeSDK` 生命周期，但仍会连接诊断监听器并遵循 `traces`/`metrics`/`logs`。 |

## 隐私与内容采集

默认情况下**不会**导出原始模型/工具内容。Span 携带的是有界标识符（渠道、提供商、模型、错误类别、仅哈希的请求 id），绝不会包含提示词文本、响应文本、工具输入、工具输出或会话键。

仅当你的收集器和保留策略已获批准可处理提示词、响应、工具或系统提示文本时，才将 `diagnostics.otel.captureContent.*` 设为 `true`。每个子键都需单独选择启用：

- `inputMessages` — 用户提示内容。
- `outputMessages` — 模型响应内容。
- `toolInputs` — 工具参数负载。
- `toolOutputs` — 工具结果负载。
- `systemPrompt` — 组装后的 system/developer 提示词。

当启用任一子键时，模型和工具 Span 仅会为该类内容附加有界、已脱敏的 `openclaw.content.*` 属性。

## 采样与刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 Span，`0.0` 丢弃全部，`1.0` 保留全部）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值为 `1000`）。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别）。控制台脱敏**不会**应用于 OTLP 日志。高流量部署应优先使用 OTLP 收集器采样/过滤，而不是本地采样。

## 导出的指标

### 模型使用情况

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，单位为秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、可选的 `error.type`）

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

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部指标（内存和工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 Span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - `openclaw.provider.request_id_hash`（上游提供商请求 id 的有界、基于 SHA 的哈希；不会导出原始 id）
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示词、历史记录、响应或会话键内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

当显式启用内容采集时，模型和工具 Span 还可以包含有界、已脱敏的 `openclaw.content.*` 属性，仅适用于你选择启用的特定内容类别。

## 诊断事件目录

下列事件为上述指标和 Span 提供基础。插件也可以直接订阅这些事件，而无需 OTLP 导出。

**模型使用情况**

- `model.usage` — 令牌、成本、时长、上下文、提供商/模型/渠道、会话 id。`usage` 是提供商/轮次级别的成本与遥测计量；`context.used` 是当前提示词/上下文快照，在涉及缓存输入或工具循环调用时，它可能低于提供商的 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat`（聚合计数器：webhook/队列/会话）

**Exec**

- `exec.process.completed` — 最终结果、时长、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下，让插件或自定义接收端仍然可用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

如果你想在不提高 `logging.level` 的情况下获得定向调试输出，请使用诊断标记。标记不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或者作为一次性的环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标记输出会进入标准日志文件（`logging.file`），并且仍会由 `logging.redactSensitive` 进行脱敏。完整指南：
[诊断标记](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不将 `diagnostics-otel` 放入 `plugins.allow`，或者运行
`openclaw plugins disable diagnostics-otel`。

## 相关内容

- [日志](/zh-CN/logging) — 文件日志、控制台输出、CLI 尾随查看，以及 Control UI 的日志标签页
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标记](/zh-CN/diagnostics/flags) — 定向调试日志标记
- [诊断导出](/zh-CN/gateway/diagnostics) — 面向运维人员的支持包工具（与 OTEL 导出分开）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
