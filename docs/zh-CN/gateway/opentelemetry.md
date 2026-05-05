---
read_when:
    - 你想将 OpenClaw 模型使用量、消息流或会话指标发送到 OpenTelemetry 采集器
    - 你正在将跟踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、跨度名称或属性结构，才能构建仪表板或告警
summary: 将 OpenClaw 诊断数据通过 diagnostics-otel 插件（OTLP/HTTP）导出到任意 OpenTelemetry 收集器
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-05-05T03:06:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 通过官方 `diagnostics-otel` 插件使用 **OTLP/HTTP (protobuf)** 导出诊断。任何接受 OTLP/HTTP 的收集器或后端都无需代码更改即可工作。有关本地文件日志以及如何读取它们，请参阅[日志](/zh-CN/logging)。

## 它如何协同工作

- **诊断事件**是由 Gateway 网关和内置插件在进程内发出的结构化记录，涵盖模型运行、消息流、会话、队列和 exec。
- **`diagnostics-otel` 插件**订阅这些事件，并通过 OTLP/HTTP 将它们导出为 OpenTelemetry **指标**、**链路追踪**和**日志**。
- 当提供商传输层接受自定义标头时，**提供商调用**会从 OpenClaw 的可信模型调用 span 上下文接收 W3C `traceparent` 标头。插件发出的 trace 上下文不会被传播。
- 只有在诊断表面和插件都启用时，导出器才会挂载，因此默认情况下进程内成本接近于零。

## 快速开始

对于打包安装，请先安装插件：

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

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
`protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 导出的信号

| 信号        | 内容                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标**    | 用于 token 用量、成本、运行时长、消息流、队列通道、会话状态、exec 和内存压力的计数器与直方图。                                           |
| **链路追踪** | 用于模型用量、模型调用、harness 生命周期、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。                                |
| **日志**    | 在启用 `diagnostics.otel.logs` 时，通过 OTLP 导出的结构化 `logging.file` 记录。                                                            |

可以独立切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled` 为 true 时，三者默认都开启。

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

| 变量                                                                                                              | 用途                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆盖 `diagnostics.otel.endpoint`。如果该值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则会按原样使用。                                                                                                                             |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 在对应的 `diagnostics.otel.*Endpoint` 配置键未设置时使用的按信号划分的端点覆盖项。按信号划分的配置优先于按信号划分的环境变量，后者又优先于共享端点。                         |
| `OTEL_SERVICE_NAME`                                                                                               | 覆盖 `diagnostics.otel.serviceName`。                                                                                                                                                                                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆盖线路协议（目前只认可 `http/protobuf`）。                                                                                                                                                                                             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 设置为 `gen_ai_latest_experimental` 可发出最新的实验性 GenAI span 属性（`gen_ai.provider.name`），而不是旧版 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 当另一个 preload 或宿主进程已经注册了全局 OpenTelemetry SDK 时设置为 `1`。随后该插件会跳过自身的 NodeSDK 生命周期，但仍会连接诊断监听器，并遵循 `traces`/`metrics`/`logs`。   |

## 隐私和内容捕获

默认情况下不会导出原始模型/工具内容。span 携带有界标识符（渠道、提供商、模型、错误类别、仅哈希请求 ID），绝不包含 prompt 文本、响应文本、工具输入、工具输出或会话键。

出站模型请求可能包含 W3C `traceparent` 标头。该标头仅根据活动模型调用的 OpenClaw 自有诊断 trace 上下文生成。已有调用方提供的 `traceparent` 标头会被替换，因此插件或自定义提供商选项无法伪造跨服务 trace 祖先关系。

仅当你的收集器和保留策略已获准处理 prompt、响应、工具或 system-prompt 文本时，才将 `diagnostics.otel.captureContent.*` 设置为 `true`。每个子键都需要单独选择启用：

- `inputMessages` — 用户 prompt 内容。
- `outputMessages` — 模型响应内容。
- `toolInputs` — 工具参数负载。
- `toolOutputs` — 工具结果负载。
- `systemPrompt` — 组装后的 system/developer prompt。

启用任何子键时，模型和工具 span 只会为该类别获得有界、已脱敏的 `openclaw.content.*` 属性。

## 采样和刷新

- **链路追踪：**`diagnostics.otel.sampleRate`（仅 root-span，`0.0` 丢弃全部，`1.0` 保留全部）。
- **指标：**`diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日志：**OTLP 日志遵循 `logging.level`（文件日志级别）。它们使用诊断日志记录脱敏路径，而不是控制台格式化。高流量安装应优先使用 OTLP 收集器采样/过滤，而不是本地采样。
- **文件日志关联：**当日志调用携带有效诊断 trace 上下文时，JSONL 文件日志会包含顶层 `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，从而让日志处理器把本地日志行与导出的 span 关联起来。
- **请求关联：**Gateway 网关 HTTP 请求和 WebSocket 帧会创建内部请求 trace 作用域。该作用域内的日志和诊断事件默认继承请求 trace，而 agent 运行和模型调用 span 会作为子项创建，因此提供商 `traceparent` 标头会保持在同一个 trace 上。

## 导出的指标

### 模型用量

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可选 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分类错误上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方图，最终模型请求负载的 UTF-8 字节大小；不含原始负载内容）
- `openclaw.model_call.response_bytes`（直方图，流式模型响应事件的 UTF-8 字节大小；不含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，第一个流式响应事件之前经过的时间）

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
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`；仅针对没有活动工作的陈旧会话簿记发出）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`；仅针对没有活动工作的陈旧会话簿记发出）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### 会话活性遥测

`diagnostics.stuckSessionWarnMs` 是用于会话活性诊断的无进展时长阈值。当 OpenClaw 观察到回复、工具、Status、block 或 ACP 运行时进展时，`processing` 会话不会朝该阈值老化。输入 keepalive 不会被计为进展，因此静默的模型或 harness 仍可被检测到。

OpenClaw 根据仍能观察到的工作对会话进行分类：

- `session.long_running`：活动中的嵌入式工作、模型调用或工具调用仍在取得进展。
- `session.stalled`：存在活动工作，但活动运行最近没有报告进展。停滞的嵌入式运行起初保持仅观察状态；如果在 `diagnostics.stuckSessionAbortMs` 后仍无进展，则进入 abort-drain，使该通道后方排队的轮次可以恢复。未设置时，中止阈值默认使用更安全的扩展窗口，即至少 10 分钟且为 `diagnostics.stuckSessionWarnMs` 的 5 倍。
- `session.stuck`：没有活动工作的陈旧会话记账状态。这会立即释放受影响的会话通道。

恢复会发出结构化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。只有在产生变更的恢复结果（`aborted` 或 `released`）之后，并且只有当同一处理代仍然是当前代时，诊断会话状态才会标记为空闲。

只有 `session.stuck` 会发出 `openclaw.session.stuck` 计数器、`openclaw.session.stuck_age_ms` 直方图和 `openclaw.session.stuck` span。重复的 `session.stuck` 诊断会在会话保持不变时退避，因此仪表板应针对持续增长发出警报，而不是针对每次 Heartbeat 跳动。有关配置旋钮和默认值，请参阅
[配置参考](/zh-CN/gateway/configuration-reference#diagnostics)。

### 运行框架生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时包含 `openclaw.harness.phase`）

### 执行

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
  - 默认使用 `gen_ai.system`，或在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 错误时包含 `openclaw.errorCategory` 和可选的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上游提供商请求 id 的有界 SHA 哈希；不会导出原始 id）
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`、`openclaw.errorCategory`、可选的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`
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

显式启用内容捕获时，模型和工具 span 还可以为你选择启用的特定内容类别包含有界且已脱敏的 `openclaw.content.*` 属性。

## 诊断事件目录

下面的事件支撑上述指标和 span。插件也可以直接订阅这些事件，无需 OTLP 导出。

**模型用量**

- `model.usage` — token、成本、持续时间、上下文、提供商/模型/渠道、会话 id。`usage` 是用于成本和遥测的提供商/轮次记账；`context.used` 是当前提示词/上下文快照，在涉及缓存输入或工具循环调用时，可能低于提供商的 `usage.total`。

**消息流**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**队列和会话**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（聚合计数器：webhook/队列/会话）

**运行框架生命周期**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` — 智能体运行框架的逐运行生命周期。包含 `harnessId`、可选 `pluginId`、提供商/模型/渠道以及运行 id。完成时会添加 `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误会添加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选的 `cleanupFailed`。

**执行**

- `exec.process.completed` — 终端结果、持续时间、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 没有导出器时

你可以在不运行 `diagnostics-otel` 的情况下，让插件或自定义接收端仍可使用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

如需定向调试输出而不提高 `logging.level`，请使用诊断标志。标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作为一次性环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出会写入标准日志文件（`logging.file`），并且仍会被 `logging.redactSensitive` 脱敏。完整指南：
[诊断标志](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

你也可以不将 `diagnostics-otel` 放入 `plugins.allow`，或运行 `openclaw plugins disable diagnostics-otel`。

## 相关

- [日志](/zh-CN/logging) — 文件日志、控制台输出、CLI 尾随查看以及 Control UI 日志标签页
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [诊断导出](/zh-CN/gateway/diagnostics) — 操作员支持包工具（与 OTEL 导出分开）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
