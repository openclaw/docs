---
read_when:
    - 你想要将 OpenClaw 模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、span 名称或属性结构来构建仪表板或告警
summary: 通过 diagnostics-otel 插件将 OpenClaw 诊断导出到 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-06-27T02:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 通过官方 `diagnostics-otel` 插件使用 **OTLP/HTTP (protobuf)** 导出诊断。日志也可以写为 stdout JSONL，以供容器和沙箱日志管道使用。任何接受 OTLP/HTTP 的采集器或后端都无需代码更改即可工作。关于本地文件日志以及如何读取它们，请参阅[日志](/zh-CN/logging)。

## 如何组合工作

- **诊断事件**是由 Gateway 网关和内置插件在进程内发出的结构化记录，用于模型运行、消息流、会话、队列和 exec。
- **`diagnostics-otel` 插件**订阅这些事件，并通过 OTLP/HTTP 将它们导出为 OpenTelemetry **指标**、**追踪**和**日志**。它也可以将诊断日志记录镜像到 stdout JSONL。
- 当提供商传输接受自定义标头时，**提供商调用**会从 OpenClaw 可信模型调用 span 上下文接收 W3C `traceparent` 标头。插件发出的追踪上下文不会被传播。
- 只有在诊断表面和插件都启用时，导出器才会附加，因此默认情况下进程内成本接近于零。

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
`protocol` 目前仅支持 `http/protobuf`。`grpc` 会被忽略。
</Note>

## 导出的信号

| 信号        | 其中包含的内容                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标**    | token 使用量、成本、运行时长、故障转移、技能使用、消息流、Talk 事件、队列通道、会话状态/恢复、工具执行、过大载荷、exec 和内存压力的计数器与直方图。 |
| **追踪**    | 模型使用、模型调用、harness 生命周期、技能使用、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。                                                            |
| **日志**    | 当 `diagnostics.otel.logs` 启用时，通过 OTLP 或 stdout JSONL 导出的结构化 `logging.file` 记录；除非显式启用内容捕获，否则会隐藏日志正文。                                |

可以独立切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled` 为 true 时，追踪和指标默认开启。日志默认关闭，只有在 `diagnostics.otel.logs` 显式为 `true` 时才会导出。日志导出默认使用 OTLP；将 `diagnostics.otel.logsExporter` 设置为 `stdout` 可在 stdout 上输出 JSONL，或设置为 `both` 以将每条诊断日志记录同时发送到 OTLP 和 stdout。

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### 环境变量

| 变量                                                                                                              | 用途                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 覆盖 `diagnostics.otel.endpoint`。如果该值已包含 `/v1/traces`、`/v1/metrics` 或 `/v1/logs`，则会按原样使用。                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 当匹配的 `diagnostics.otel.*Endpoint` 配置键未设置时使用的信号专用端点覆盖。信号专用配置优先于信号专用环境变量，后者又优先于共享端点。                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 覆盖 `diagnostics.otel.serviceName`。                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 覆盖传输协议（目前仅认可 `http/protobuf`）。                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 设置为 `gen_ai_latest_experimental` 可发出最新的实验性 GenAI 推理 span 形态，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名称、`CLIENT` span 类型，以及使用 `gen_ai.provider.name` 代替旧版 `gen_ai.system`。无论如何，GenAI 指标始终使用有界、低基数的语义属性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 当另一个预加载项或宿主进程已注册全局 OpenTelemetry SDK 时，设置为 `1`。随后该插件会跳过自己的 NodeSDK 生命周期，但仍会连接诊断监听器并遵守 `traces`/`metrics`/`logs`。                                                                                                                    |

## 隐私和内容捕获

默认情况下，原始模型/工具内容**不会**被导出。Span 携带有界标识符（渠道、提供商、模型、错误类别、仅哈希请求 ID、工具来源、工具所有者和技能名称/来源），并且永远不会包含提示文本、响应文本、工具输入、工具输出、技能文件路径或会话键。默认情况下，OTLP 日志记录会保留严重性、logger、代码位置、可信追踪上下文和已清理属性，但只有在 `diagnostics.otel.captureContent` 设置为布尔值 `true` 时才会导出原始日志消息正文。细粒度的 `captureContent.*` 子键不会启用日志正文。看起来像有作用域智能体会话键的标签会替换为 `unknown`。
Talk 指标只导出有界事件元数据，例如模式、传输、提供商和事件类型。它们不包含转录、音频载荷、会话 ID、轮次 ID、调用 ID、房间 ID 或交接 token。

出站模型请求可能包含 W3C `traceparent` 标头。该标头仅从活动模型调用的 OpenClaw 所有诊断追踪上下文生成。现有调用方提供的 `traceparent` 标头会被替换，因此插件或自定义提供商选项无法伪造跨服务追踪祖先关系。

只有在你的采集器和保留策略已获准处理提示、响应、工具或系统提示文本时，才将 `diagnostics.otel.captureContent.*` 设置为 `true`。每个子键都需要独立选择启用：

- `inputMessages` - 用户提示内容。
- `outputMessages` - 模型响应内容。
- `toolInputs` - 工具参数载荷。
- `toolOutputs` - 工具结果载荷。
- `systemPrompt` - 组装后的系统/开发者提示。
- `toolDefinitions` - 模型工具名称、描述和 schema。

当任意子键启用时，模型和工具 span 只会为该类别获取有界、已脱敏的 `openclaw.content.*` 属性。仅在广泛诊断捕获场景下使用布尔值 `captureContent: true`，且该场景中的 OTLP 日志消息正文也已获准导出。

内置智能体运行时的工具执行会捕获 `toolInputs`/`toolOutputs` 内容（已完成/错误 span 上的 `openclaw.content.tool_input`，已完成 span 上的 `openclaw.content.tool_output`）。外部 harness 工具调用（Codex、Claude CLI）会发出不带内容载荷的 `tool.execution.*` span。捕获的内容通过可信、仅监听器渠道传输，永远不会放到公共诊断事件总线上。

## 采样和刷新

- **追踪：** `diagnostics.otel.sampleRate`（仅根 span，`0.0` 丢弃全部，`1.0` 保留全部）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值 `1000`）。
- **日志：** OTLP 日志遵守 `logging.level`（文件日志级别）。它们使用诊断日志记录脱敏路径，而不是控制台格式化。高容量安装应优先使用 OTLP 采集器采样/过滤，而不是本地采样。当你的平台已将 stdout/stderr 发送到日志处理器且你没有 OTLP 日志采集器时，请设置 `diagnostics.otel.logsExporter: "stdout"`。Stdout 记录为每行一个 JSON 对象，包含 `ts`、`signal`、`service.name`、严重性、正文、已脱敏属性，以及可用时的可信追踪字段。
- **文件日志关联：** 当日志调用携带有效诊断追踪上下文时，JSONL 文件日志会包含顶层 `traceId`、`spanId`、`parentSpanId` 和 `traceFlags`，这让日志处理器可以将本地日志行与导出的 span 关联起来。
- **请求关联：** Gateway 网关 HTTP 请求和 WebSocket 帧会创建内部请求追踪作用域。该作用域内的日志和诊断事件默认继承请求追踪，而智能体运行和模型调用 span 会作为子级创建，因此提供商 `traceparent` 标头会保持在同一条追踪上。

## 导出的指标

### 模型使用

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，属性：`gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（直方图，秒，GenAI 语义约定指标，属性：`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`，可选 `error.type`）
- `openclaw.model_call.duration_ms`（直方图，属性：`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`，以及分类错误上的 `openclaw.errorCategory` 和 `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（直方图，最终模型请求载荷的 UTF-8 字节大小；不含原始载荷内容）
- `openclaw.model_call.response_bytes`（直方图，流式响应分块载荷的 UTF-8 字节大小；高频文本、思考和工具调用增量只统计增量 `delta` 字节；不含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，首个流式响应事件之前经过的时间）
- `openclaw.model.failover`（计数器，属性：`openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（计数器，属性：`openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`，可选 `openclaw.agent`，可选 `openclaw.toolName`）

### 消息流

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.received`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.started`（计数器，属性：`openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.completed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.dispatch.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：`openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### Talk

- `openclaw.talk.event`（计数器，属性：`openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（直方图，属性：与 `openclaw.talk.event` 相同；当 Talk 事件报告持续时间时发出）
- `openclaw.talk.audio.bytes`（直方图，属性：与 `openclaw.talk.event` 相同；为报告字节长度的 Talk 音频帧事件发出）

### 队列和会话

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或 `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`；为可恢复的陈旧会话记录发出）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`；为可恢复的陈旧会话记录发出）
- `openclaw.session.turn.created`（计数器，属性：`openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方图，属性：与匹配的恢复计数器相同）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### 会话存活遥测

`diagnostics.stuckSessionWarnMs` 是会话存活诊断的无进展时长阈值。当 OpenClaw 观察到回复、工具、状态、块或 ACP 运行时进展时，`processing` 会话不会朝此阈值老化。输入中保活不计为进展，因此静默的模型或 harness 仍然可以被检测到。

OpenClaw 会按仍可观察到的工作对会话分类：

- `session.long_running`：活跃的嵌入式工作、模型调用或工具调用仍在取得进展。归属明确的模型调用如果静默超过 `diagnostics.stuckSessionWarnMs`，也会在 `diagnostics.stuckSessionAbortMs` 之前报告为长期运行，因此缓慢或非流式模型提供商在仍可观察到中止状态时，不会看起来像停滞的 Gateway 网关会话。
- `session.stalled`：存在活跃工作，但活跃运行最近未报告进展。归属明确的模型调用会在达到或超过 `diagnostics.stuckSessionAbortMs` 时从 `session.long_running` 切换为 `session.stalled`；无归属的陈旧模型/工具活动不会被视为无害的长期运行工作。停滞的嵌入式运行起初只观察，然后在 `diagnostics.stuckSessionAbortMs` 后仍无进展时执行中止并清空，让同一 lane 后方排队的轮次可以恢复。未设置时，中止阈值默认使用更安全的扩展窗口，即至少 5 分钟且为 `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：没有活跃工作的陈旧会话记录，或存在陈旧无归属模型/工具活动的空闲排队会话。这会在恢复门通过后立即释放受影响的会话 lane。

恢复会发出结构化的 `session.recovery.requested` 和 `session.recovery.completed` 事件。诊断会话状态只会在产生变更的恢复结果（`aborted` 或 `released`）之后标记为空闲，并且仅当同一个处理世代仍是当前世代时才会这样做。

只有 `session.stuck` 会发出 `openclaw.session.stuck` 计数器、`openclaw.session.stuck_age_ms` 直方图和 `openclaw.session.stuck` span。重复的 `session.stuck` 诊断会在会话保持不变时退避，因此仪表板应对持续增加发出告警，而不是对每一次 heartbeat tick 告警。有关配置开关和默认值，请参阅[配置参考](/zh-CN/gateway/configuration-reference#diagnostics)。

存活警告还会发出：

- `openclaw.liveness.warning`（计数器，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方图，属性：`openclaw.liveness.reason`）

### 运行框架生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时包含 `openclaw.harness.phase`）

### 工具执行

- `openclaw.tool.execution.duration_ms`（直方图，属性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，以及错误上的 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（计数器，属性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部机制（内存和工具循环）

- `openclaw.payload.large`（计数器，属性：`openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（直方图，属性：与 `openclaw.payload.large` 相同）
- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、`openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、`openclaw.outcome`）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`，或者在选择启用最新 GenAI 语义约定时使用 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 错误时包含 `openclaw.errorCategory` 和可选的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（基于上游提供商请求 ID 的有界 SHA 哈希；不会导出原始 ID）
  - 使用 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 时，模型调用 span 会使用最新 GenAI 推理 span 名称 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` span 类型，而不是 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`, `openclaw.errorCategory`，可选的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`（不包含提示词、历史、响应或会话键内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

显式启用内容捕获时，模型和工具 span 还可以包含有界且已脱敏的 `openclaw.content.*` 属性，用于你选择启用的特定内容类别。

## 诊断事件目录

下面的事件支撑上述指标和 span。插件也可以直接订阅这些事件，而无需 OTLP 导出。

**模型用量**

- `model.usage` - token、成本、时长、上下文、提供商/模型/渠道、会话 ID。`usage` 是用于成本和遥测的提供商/轮次统计；`context.used` 是当前提示词/上下文快照，在涉及缓存输入或工具循环调用时，可能低于提供商的 `usage.total`。

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - Agent harness 的每次运行生命周期。包含 `harnessId`、可选的 `pluginId`、提供商/模型/渠道和运行 ID。完成时会添加 `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误时会添加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 终止结果、时长、目标、模式、退出码和失败类型。不包含命令文本和工作目录。

## 不使用导出器

你可以在不运行 `diagnostics-otel` 的情况下，让诊断事件仍可供插件或自定义接收器使用：

```json5
{
  diagnostics: { enabled: true },
}
```

如需有针对性的调试输出且不提高 `logging.level`，请使用诊断标志。标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

或作为一次性的环境变量覆盖：

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

你也可以不把 `diagnostics-otel` 加入 `plugins.allow`，或运行 `openclaw plugins disable diagnostics-otel`。

## 相关

- [日志](/zh-CN/logging) - 文件日志、控制台输出、CLI 跟踪和 Control UI 日志标签页
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) - WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/zh-CN/diagnostics/flags) - 定向调试日志标志
- [诊断导出](/zh-CN/gateway/diagnostics) - 操作员支持包工具（与 OTEL 导出分开）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 字段参考
