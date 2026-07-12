---
read_when:
    - 你希望将 OpenClaw 的模型使用情况、消息流或会话指标发送到 OpenTelemetry 收集器
    - 你正在将追踪、指标或日志接入 Grafana、Datadog、Honeycomb、New Relic、Tempo 或其他 OTLP 后端
    - 你需要确切的指标名称、Span 名称或属性结构，以构建仪表板或告警
summary: 通过 diagnostics-otel 插件将 OpenClaw 诊断数据导出到 OpenTelemetry 收集器或 stdout JSONL
title: OpenTelemetry 导出
x-i18n:
    generated_at: "2026-07-12T14:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw 通过官方 `diagnostics-otel` 插件，使用 **OTLP/HTTP (protobuf)** 导出诊断数据。
日志也可以写入 stdout JSONL，供容器和沙箱日志管道使用。任何接受
OTLP/HTTP 的收集器或后端都无需更改代码即可使用。有关本地文件日志，请参阅
[日志](/zh-CN/logging)。

- **诊断事件**是由 Gateway 网关和内置插件为模型运行、消息流、会话、队列
  和 exec 发出的结构化进程内记录。
- **`diagnostics-otel`**订阅这些事件，并通过 OTLP/HTTP 将其导出为
  OpenTelemetry **指标**、**追踪**和**日志**，还可以将日志记录镜像到 stdout JSONL。
- 当提供商传输支持自定义标头时，**提供商调用**会从 OpenClaw
  可信模型调用 span 上下文接收 W3C `traceparent` 标头。插件发出的追踪上下文不会传播。
- 仅当诊断功能和插件都已启用时才会挂载导出器，因此默认情况下进程内开销接近于零。

## 快速开始

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

也可以从 CLI 启用插件：`openclaw plugins enable diagnostics-otel`。

<Note>
`protocol` 仅支持 `http/protobuf`。由于 `traces` 和 `metrics` 默认启用，任何其他值（包括 `grpc`）都会中止整个 diagnostics-otel 订阅并显示 `unsupported protocol` 警告，这也会停止 stdout 日志导出。如果你只想在使用非 OTLP 协议值时通过 `logsExporter: "stdout"` 导出日志，请显式设置 `traces: false` 和 `metrics: false`。
</Note>

## 导出的信号

| 信号        | 包含的内容                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **指标** | 令牌用量、成本、运行时长、故障转移、Skill 使用情况、消息流、Talk 事件、队列通道、会话状态/恢复、工具执行、exec、记忆、活跃状态和导出器健康状况的计数器/直方图。 |
| **追踪**  | 模型使用、模型调用、harness 生命周期、Skill 使用情况、工具执行、exec、webhook/消息处理、上下文组装和工具循环的 span。                                                      |
| **日志**    | 启用 `diagnostics.otel.logs` 时，通过 OTLP 或 stdout JSONL 导出的结构化 `logging.file` 记录；除非显式启用内容捕获，否则不会导出日志正文。                          |

可以分别切换 `traces`、`metrics` 和 `logs`。当 `diagnostics.otel.enabled`
为 true 时，追踪和指标默认开启；日志默认关闭，仅当显式将
`diagnostics.otel.logs` 设置为 `true` 时才会导出。日志默认通过 OTLP 导出；
将 `diagnostics.otel.logsExporter` 设置为 `stdout` 可通过 stdout 输出 JSONL，
设置为 `both` 则同时使用两者。

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
      protocol: "http/protobuf", // grpc disables OTLP export
      serviceName: "openclaw-gateway", // unset falls back to OTEL_SERVICE_NAME, then "openclaw"
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

| 变量                                                                                                          | 用途                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 未设置配置键时，作为 `diagnostics.otel.endpoint` 的回退值。                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 未设置对应的 `diagnostics.otel.*Endpoint` 配置键时使用的特定信号端点回退值。特定信号配置优先于特定信号环境变量，而特定信号环境变量优先于共享端点。                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 未设置配置键时，作为 `diagnostics.otel.serviceName` 的回退值。默认服务名称为 `openclaw`。                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 未设置 `diagnostics.otel.protocol` 时，作为线路协议的回退值。只有 `http/protobuf` 会启用导出。                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 设置为 `gen_ai_latest_experimental` 可发出最新的 GenAI 推理 span 结构：span 名称为 `{gen_ai.operation.name} {gen_ai.request.model}`，span 类型为 `CLIENT`，并使用 `gen_ai.provider.name` 代替旧版 `gen_ai.system`。无论如何，GenAI 指标始终使用有界的低基数属性。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 当其他预加载程序或宿主进程已注册全局 OpenTelemetry SDK 时，设置为 `1`。此时插件会跳过自身的 NodeSDK 生命周期，但仍会连接诊断监听器并遵循 `traces`/`metrics`/`logs` 设置。                                                                                    |

## 隐私和内容捕获

默认**不会**导出原始模型/工具内容。span 仅携带有界标识符（渠道、提供商、
模型、错误类别、仅含哈希的请求 ID、工具来源、工具所有者、Skill 名称/来源），
并且绝不包含提示词文本、响应文本、工具输入、工具输出、Skill 文件路径或会话键。
类似具有作用域的智能体会话键的值（例如以 `agent:` 开头）会在低基数属性中
替换为 `unknown`。默认情况下，OTLP 日志记录会保留严重性、记录器、代码位置、
可信追踪上下文和经过清理的属性；仅当布尔值
`diagnostics.otel.captureContent` 为 `true` 时，才会导出原始日志消息正文。
细粒度的 `captureContent.*` 子键绝不会启用日志正文。Talk 指标仅导出有界事件
元数据（模式、传输、提供商、事件类型），不包含文字记录、音频载荷、会话 ID、
轮次 ID、调用 ID、房间 ID 或交接令牌。

出站模型请求可能包含 W3C `traceparent` 标头，该标头仅根据活动模型调用的
OpenClaw 自有诊断追踪上下文生成。现有调用方提供的 `traceparent` 标头会被替换，
因此插件或自定义提供商选项无法伪造跨服务追踪祖先关系。

仅当你的收集器和保留策略已获批准，可以处理提示词、响应、工具或系统提示词文本时，
才应将 `diagnostics.otel.captureContent.*` 设置为 `true`。每个子键相互独立：

- `inputMessages` - 用户提示词内容。
- `outputMessages` - 模型响应内容。
- `toolInputs` - 工具参数载荷。
- `toolOutputs` - 工具结果载荷。
- `systemPrompt` - 组装后的系统/开发者提示词。
- `toolDefinitions` - 模型工具的名称、描述和 schema。

启用任一子键时，模型和工具 span 仅会获得该类别经过遮盖的有界
`openclaw.content.*` 属性。

<Note>
布尔值 `captureContent: true` 会同时启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions` 和 OTLP 日志正文，但**不会**启用 `systemPrompt`；如果还需要组装后的系统提示词，请显式设置 `captureContent.systemPrompt: true`。
</Note>

对于内置智能体运行时的工具执行，系统会捕获 `toolInputs`/`toolOutputs`
内容（已完成/错误 span 上的 `openclaw.content.tool_input` 和
`gen_ai.tool.call.arguments`；已完成 span 上的
`openclaw.content.tool_output` 和 `gen_ai.tool.call.result`）。
`openclaw.content.*` 名称仍是稳定的 OpenClaw 属性名称；
`gen_ai.tool.call.*` 副本为原生支持 semconv 的查看器提供镜像。
外部 harness 工具调用（Codex、Claude CLI）会发出不含内容载荷的
`tool.execution.*` span。捕获的内容通过可信的仅监听器渠道传输，
绝不会放到公共诊断事件总线上。

## 采样和刷新

- **追踪：** `diagnostics.otel.sampleRate` 仅在根 span 上设置 `TraceIdRatioBasedSampler`
  （`0.0` 丢弃全部，`1.0` 保留全部）。未设置时使用
  OpenTelemetry SDK 默认值（始终开启）。
- **指标：** `diagnostics.otel.flushIntervalMs`（最小值限制为
  `1000`）；未设置时使用 SDK 的定期导出默认值。
- **日志：** OTLP 日志遵循 `logging.level`（文件日志级别），并使用
  诊断日志记录脱敏路径，而不是控制台格式。高流量
  安装应优先使用 OTLP 收集器采样/筛选，而不是本地
  采样。如果你的平台已经将 stdout/stderr 发送到日志处理器，且没有 OTLP 日志
  收集器，请设置 `diagnostics.otel.logsExporter: "stdout"`。Stdout 记录每行包含一个 JSON 对象，其中含有 `ts`、`signal`、
  `service.name`、严重性、正文、已脱敏的属性，以及可用时可信的追踪
  字段。
- **文件日志关联：** 当日志调用携带有效的
  诊断追踪上下文时，JSONL 文件日志会包含顶层 `traceId`、
  `spanId`、`parentSpanId` 和 `traceFlags`，从而让日志处理器能够将本地日志行与
  已导出的 span 关联起来。
- **请求关联：** Gateway 网关 HTTP 请求和 WebSocket 帧会创建
  内部请求追踪作用域。该作用域内的日志和诊断事件
  默认继承请求追踪，而智能体运行和模型调用
  span 会作为其子级创建，因此提供商的 `traceparent` 标头会保留在
  同一追踪中。
- **模型调用关联：** `openclaw.model.call` span 默认包含安全的提示词
  组件大小；当提供商结果公开用量时，还包含每次调用的 token 属性。
  `openclaw.model.usage` 仍是用于汇总成本、上下文和渠道仪表板的运行级
  计量 span；当发出该 span 的运行时具有可信的
  追踪上下文时，它会保留在同一诊断追踪中。

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
- `openclaw.model_call.response_bytes`（直方图，流式响应分块载荷的 UTF-8 字节大小；高频文本、思考和工具调用增量仅计算递增的 `delta` 字节；不含原始响应内容）
- `openclaw.model_call.time_to_first_byte_ms`（直方图，第一个流式响应事件之前经过的时间）
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
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`；为可恢复的过期会话账务记录发出）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`；为可恢复的过期会话账务记录发出）
- `openclaw.session.turn.created`（计数器，属性：`openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（计数器，属性：`openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（直方图，属性：与对应的恢复计数器相同）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

### 会话活性遥测

`diagnostics.stuckSessionWarnMs` 是会话活性诊断的无进展时长
阈值。当 OpenClaw 观察到回复、工具、状态、分块或 ACP 运行时
进展时，`processing` 会话不会向此阈值累积时长。
输入状态保活不算作进展，因此仍然可以检测到静默的模型或
harness。

OpenClaw 根据仍可观察到的工作对会话进行分类：

- `session.long_running`：活跃的嵌入式工作、模型调用或工具调用
  仍在取得进展。归属明确且静默时间超过
  `diagnostics.stuckSessionWarnMs` 的模型调用，在
  `diagnostics.stuckSessionAbortMs` 之前也会报告为长时间运行，
  因此，只要仍可观察到中止状态，缓慢或非流式模型提供商就不会看起来像停滞的 Gateway 网关会话。
- `session.stalled`：存在活跃工作，但活跃运行最近没有报告
  进展。归属明确的模型调用在达到或超过
  `diagnostics.stuckSessionAbortMs` 时会从 `session.long_running` 切换为
  `session.stalled`；无归属的过期模型/工具活动不会被视为无害的长时间运行工作。
  停滞的嵌入式运行起初仅进行观察，随后在
  `diagnostics.stuckSessionAbortMs` 后仍无进展时执行中止并排空，
  使该通道后方排队的轮次能够恢复。当未设置时，中止阈值默认为更安全的
  延长窗口：至少 5 分钟，并且至少为
  `diagnostics.stuckSessionWarnMs` 的 3 倍。
- `session.stuck`：没有活跃工作的过期会话账务记录，或存在过期无归属
  模型/工具活动的空闲排队会话。这会在恢复门控通过后立即释放
  受影响的会话通道。

恢复会发出结构化的 `session.recovery.requested` 和
`session.recovery.completed` 事件。只有在恢复产生变更结果
（`aborted` 或 `released`），并且同一处理世代仍是当前世代时，
诊断会话状态才会标记为空闲。

只有 `session.stuck` 会发出 `openclaw.session.stuck` 计数器、
`openclaw.session.stuck_age_ms` 直方图和 `openclaw.session.stuck`
span。当会话保持不变时，重复的 `session.stuck` 诊断会进行退避，
因此仪表板应针对持续增长发出警报，而不是针对每个 Heartbeat 节拍。
有关配置项和默认值，请参阅
[配置参考](/zh-CN/gateway/configuration-reference#diagnostics)。

活性警告还会发出：

- `openclaw.liveness.warning`（计数器，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（直方图，属性：`openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（直方图，属性：`openclaw.liveness.reason`）

### Harness 生命周期

- `openclaw.harness.duration_ms`（直方图，属性：`openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`，错误时还有 `openclaw.harness.phase`）

### 工具执行和循环检测

- `openclaw.tool.execution.duration_ms`（直方图，属性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`，错误时还有 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（计数器，属性：`gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（计数器，属性：`openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`，可选 `openclaw.loop.paired_tool`；检测到重复的工具调用循环时发出）

### Exec

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 诊断内部指标（内存、载荷、导出器健康状态）

- `openclaw.payload.large`（计数器，属性：`openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（直方图，属性：与 `openclaw.payload.large` 相同）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（直方图，无属性；进程内存样本）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（计数器，属性：`openclaw.diagnostic.async_queue.drop_class`；内部诊断队列背压丢弃）
- `openclaw.telemetry.exporter.events`（计数器，属性：`openclaw.exporter`、`openclaw.signal`、`openclaw.status`，可选 `openclaw.reason`，可选 `openclaw.errorCategory`；导出器生命周期/故障自遥测）

## 导出的 span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 默认使用 `gen_ai.system`；选择启用最新的 GenAI 语义约定时，使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - 默认使用 `gen_ai.system`；选择启用最新的 GenAI 语义约定时，使用 `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - 发生错误时包含 `openclaw.errorCategory`、`error.type`，以及可选的 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（仅包含安全的组件大小，不包含提示词文本）
  - 当模型调用结果包含该次独立调用的提供商用量时，包含 `openclaw.model_call.usage.*` 和 `gen_ai.usage.*`
  - 当上游提供商结果公开请求 ID 时，包含属性 `openclaw.upstreamRequestIdHash`（有界、基于哈希）的 Span 事件 `openclaw.provider.request`；绝不会导出原始 ID
  - 设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` 后，模型调用 Span 会使用最新的 GenAI 推理 Span 名称 `{gen_ai.operation.name} {gen_ai.request.model}` 和 `CLIENT` Span 类型，而不是 `openclaw.model.call`。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完成时：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - 出错时：`openclaw.harness.phase`、`openclaw.errorCategory`、可选的 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`gen_ai.operation.name`（`execute_tool`）、`openclaw.toolName`、`openclaw.tool.source`、可选的 `gen_ai.tool.call.id`、`openclaw.tool.owner`、`openclaw.tool.params.*`
  - 发生错误时可选包含 `openclaw.errorCategory`/`openclaw.errorCode`；被策略或沙箱拒绝时包含 `openclaw.deniedReason` 和 `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.exit_signal`、`openclaw.exec.timed_out`
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
  - `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、可选的 `openclaw.loop.paired_tool`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.reason`、`openclaw.memory.rss_bytes`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.heap_total_bytes`、`openclaw.memory.external_bytes`、`openclaw.memory.array_buffers_bytes`、可选的 `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

显式启用内容捕获后，模型和工具 Span 还可以针对你选择启用的特定内容类别，包含有界且经过脱敏的 `openclaw.content.*` 属性。

## 诊断事件目录

以下事件为上述指标和 Span 提供支持。插件也可以直接订阅这些事件，而无需通过 OTLP 导出。

**模型用量**

- `model.usage` - token、成本、持续时间、上下文、提供商/模型/渠道、会话 ID。`usage` 是提供商/轮次层面的成本和遥测统计；`context.used` 是当前提示词/上下文快照，在涉及缓存输入或工具循环调用时，可能低于提供商的 `usage.total`。

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - Agent harness 的每次运行生命周期。包含 `harnessId`、可选的 `pluginId`、提供商/模型/渠道和运行 ID。完成事件还会添加 `durationMs`、`outcome`、可选的 `resultClassification`、`yieldDetected` 和 `itemLifecycle` 计数。错误事件还会添加 `phase`（`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory` 和可选的 `cleanupFailed`。

**Exec**

- `exec.process.completed` - 终端结果、持续时间、目标、模式、退出代码和失败类型。不包含命令文本和工作目录。
- `exec.approval.followup_suppressed` - 会话重新绑定后丢弃的过期审批后续操作。包含 `approvalId`、`reason`（`session_rebound`）、`phase`（`direct_delivery` 或 `gateway_preflight`）和调度器时间戳。不包含会话键、路由和命令文本。

## 不使用导出器

无需运行 `diagnostics-otel`，也可让插件或自定义接收端使用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

若要输出针对性的调试信息，而不提高 `logging.level`，请使用诊断标志。标志不区分大小写，并支持通配符（`telegram.*` 或 `*`）：

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

也可使用一次性的环境变量覆盖：

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

标志输出会写入标准日志文件（`logging.file`），并且仍会由 `logging.redactSensitive` 进行脱敏。完整指南：
[诊断标志](/zh-CN/diagnostics/flags)。

## 禁用

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

或者从 `plugins.allow` 中移除 `diagnostics-otel`，或运行
`openclaw plugins disable diagnostics-otel`。

## 相关内容

- [日志](/zh-CN/logging) - 文件日志、控制台输出、CLI 尾随查看和 Control UI 的 Logs 选项卡
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) - WS 日志样式、子系统前缀和控制台捕获
- [诊断标志](/zh-CN/diagnostics/flags) - 针对性的调试日志标志
- [诊断导出](/zh-CN/gateway/diagnostics) - 操作员支持包工具（与 OTEL 导出不同）
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) - 完整的 `diagnostics.*` 字段参考
