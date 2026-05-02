---
read_when:
    - 你想将 OpenClaw 模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将跟踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、跨度名称或属性结构，才能构建仪表板或告警
summary: 通过 diagnostics-otel 插件（OTLP/HTTP）将 OpenClaw 诊断信息导出到任意 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-05-01T23:59:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: be58bb48f06e72b5b08d21bf37c0dcc218be8e4c0030b074523794be01f2611a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 通过内置的 `diagnostics-otel` 插件使用 **OTLP/HTTP（protobuf）** 导出诊断数据。任何接受 OTLP/HTTP 的收集器或后端都无需更改代码即可工作。关于本地文件日志以及如何读取它们，请参阅 [日志](/zh-CN/logging)。

## 其工作方式

- **诊断事件** 是结构化的进程内记录，由 Gateway 网关和内置插件为模型运行、消息流、会话、队列和 exec 发出。
- **`diagnostics-otel` 插件** 订阅这些事件，并通过 OTLP/HTTP 将其作为 OpenTelemetry **指标**、**追踪** 和 **日志** 导出。
- 当提供商传输层接受自定义标头时，**提供商调用** 会从 OpenClaw 的受信任模型调用 span 上下文接收 W3C `traceparent` 标头。插件发出的追踪上下文不会传播。
- 只有在诊断面和插件都启用时，导出器才会附加，因此默认情况下进程内成本接近于零。

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

你也可以从 CLI 启用该插件：

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` 目前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 导出的信号

| 信号 | 内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标** | token 用量、成本、运行持续时间、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。 |
| **追踪** | 模型用量、模型调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。 |
| **日志** | 启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。 |

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
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 覆盖 `diagnostics.otel.endpoint`。如果值已经包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则按原样使用。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当匹配的 `diagnostics.otel.*Endpoint` 配置键未设置时使用的信号特定端点覆盖项。信号特定配置优先于信号特定环境变量，而后者又优先于共享端点。 |
| `OTEL_SERVICE_NAME` | 覆盖 `diagnostics.otel.serviceName`。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | 覆盖传输协议（目前只接受 `http/protobuf`）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 设置为 `gen_ai_latest_experimental`，以发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`），而不是旧版 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED` | 当另一个 preload 或宿主进程已经注册全局 OpenTelemetry SDK 时，设置为 `1`。随后插件会跳过自己的 NodeSDK 生命周期，但仍会连接诊断监听器并遵循 `traces`/`metrics`/`logs`。 |

## 隐私与内容捕获

默认情况下不会导出原始模型/工具内容。Span 携带有界标识符（渠道、提供商、模型、错误类别、仅哈希的请求 ID），并且绝不包含提示词文本、响应文本、工具输入、工具输出或会话键。

出站模型请求可能包含 W3C `traceparent` 标头。该标头只会从 OpenClaw 拥有的、用于活跃模型调用的诊断追踪上下文生成。已有的调用方提供的 `traceparent` 标头会被替换，因此插件或自定义提供商选项无法伪造跨服务追踪祖先关系。

仅当你的收集器和保留策略已获准处理提示词、响应、工具或系统提示词文本时，才将 `diagnostics.otel.captureContent.*` 设置为 `true`。每个子键都独立选择启用：

- `inputMessages` — 用户提示词内容。
- `outputMessages` — 模型响应内容。
- `toolInputs` — 工具参数载荷。
- `toolOutputs` — 工具结果载荷。
- `systemPrompt` — 组装后的系统/开发者提示词。

启用任何子键时，模型和工具 span 会仅针对该类别获得有界、已脱敏的 `openclaw.content.*` 属性。

## 采样与刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 丢弃全部，`1.0` 保留全部）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别）。它们使用诊断日志记录脱敏路径，而不是控制台格式化。高容量安装应优先使用 OTLP 收集器采样/过滤，而不是本地采样。
- **文件日志关联：** 当日志调用携带有效诊断追踪上下文时，JSONL 文件日志会包含顶层 `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，这让日志处理器可以将本地日志行与导出的 span 连接起来。
- **请求关联：** Gateway 网关 HTTP 请求和 WebSocket 帧会创建内部请求追踪作用域。该作用域内的日志和诊断事件默认继承请求追踪，而智能体运行和模型调用 span 会作为子项创建，因此提供商 `traceparent` 标头会保留在同一条追踪上。

## 导出的指标

### 模型用量

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可选 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分类错误上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方图，最终模型请求载荷的 UTF-8 字节大小；不含原始载荷内容）
- `openclaw.model_call.response_bytes`（直方图，流式模型响应事件的 UTF-8 字节大小；不含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，首个流式响应事件之前经过的时间）

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
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`；仅为没有活跃工作的陈旧会话记账发出）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`；仅为没有活跃工作的陈旧会话记账发出）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### 会话活跃度遥测

`diagnostics.stuckSessionWarnMs` 是会话活跃度诊断的无进展时长阈值。当 OpenClaw 观察到回复、工具、Status、分块或 ACP 运行时进展时，`processing` 会话不会朝此阈值老化。Typing keepalive 不计为进展，因此仍可检测到静默的模型或 harness。

OpenClaw 会按其仍能观察到的工作对会话进行分类：

- `session.long_running`：活跃的嵌入式工作、模型调用或工具调用仍在推进。
- `session.stalled`：存在活跃工作，但活跃运行近期未报告进展。
- `session.stuck`：没有活跃工作的陈旧会话簿记。这是唯一会释放受影响会话通道的存活性分类。

只有 `session.stuck` 会发出 `openclaw.session.stuck` 计数器、`openclaw.session.stuck_age_ms` 直方图和 `openclaw.session.stuck` span。重复的 `session.stuck` 诊断会在会话保持不变时退避，因此仪表板应针对持续增加发出告警，而不是针对每个 Heartbeat tick 告警。有关配置开关和默认值，请参阅[配置参考](/zh-CN/gateway/configuration-reference#diagnostics)。

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、错误时的 `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部机制（内存和工具循环）

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或在启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或在启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 错误时的 `openclaw.errorCategory` 和可选的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（不包含提示、历史记录、响应或会话键内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

显式启用内容捕获时，模型和工具 span 还可以为你选择加入的特定内容类别包含有界且已脱敏的 `openclaw.content.*` 属性。

## 诊断事件目录

下面的事件为上述指标和 span 提供支撑。插件也可以在不导出 OTLP 的情况下直接订阅它们。

**模型用量**

- `model.usage` — token、成本、持续时间、上下文、提供商/模型/渠道、会话 ID。`usage` 是用于成本和遥测的提供商/轮次记账；`context.used` 是当前提示/上下文快照，在涉及缓存输入或工具循环调用时，可能低于提供商 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（聚合计数器：webhook/队列/会话）

**Harness 生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — Agent harness 的每次运行生命周期。包含 `harnessId`、可选的 `pluginId`、提供商/模型/渠道，以及运行 ID。完成时会添加 `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误会添加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` — 终端结果、持续时间、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 没有导出器

你可以在不运行 `diagnostics-otel` 的情况下，让诊断事件可供插件或自定义接收端使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如需在不提高 `logging.level` 的情况下获得有针对性的调试输出，请使用诊断标志。标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

也可以作为一次性的环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出会写入标准日志文件（`logging.file`），并且仍会由 `logging.redactSensitive` 脱敏。完整指南：[诊断标志](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以将 `diagnostics-otel` 排除在 `plugins.allow` 之外，或运行 `openclaw plugins disable diagnostics-otel`。

## 相关

- [日志记录](/zh-CN/logging) — 文件日志、控制台输出、CLI 跟踪，以及 Control UI Logs 标签页
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [诊断导出](/zh-CN/gateway/diagnostics) — 操作者支持包工具（独立于 OTEL 导出）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
