---
read_when:
    - 你需要一个适合初学者的日志概览
    - 你想要配置日志级别或格式
    - 你正在进行故障排除，需要快速找到日志
summary: 日志概览：文件日志、控制台输出、CLI 尾随查看，以及 Control UI
title: 日志概览
x-i18n:
    generated_at: "2026-04-25T18:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 745c14ef9ca008d43a0f4f2d5c051ec6bafbe5249e1a1753448182fff72afd6e
    source_path: logging.md
    workflow: 15
---

# 日志

OpenClaw 有两个主要的日志输出面：

- 由 Gateway 网关写入的**文件日志**（JSON 行）。
- 在终端和 Gateway 网关调试 UI 中显示的**控制台输出**。

Control UI 的 **Logs** 选项卡会尾随读取网关文件日志。本页将说明日志存放在哪里、如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用网关主机的本地时区。

你可以在 `~/.openclaw/openclaw.json` 中覆盖该设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时尾随查看（推荐）

使用 CLI 通过 RPC 尾随查看网关日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：按你的本地时区显示时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（这里通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：按行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式的 `--url` 时，CLI 不会自动应用配置或环境变量中的凭证；如果目标 Gateway 网关需要认证，请自行包含 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的原始日志行

如果本地的 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式的 `--url` 目标不会使用此回退。

如果 Gateway 网关无法访问，CLI 会输出一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的 **Logs** 选项卡会使用 `logs.tail` 尾随读取同一个文件。
有关如何打开它，请参阅 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅查看渠道日志

如需筛选渠道活动（WhatsApp / Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

### 控制台输出

控制台日志会**感知 TTY**，并以便于阅读的格式显示：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info / warn / error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：只显示重要结果（错误、解析错误、慢调用）
- `--verbose`：显示所有请求 / 响应流量
- `--ws-log auto|compact|full`：选择详细输出的渲染样式
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志

所有日志配置都位于 `~/.openclaw/openclaw.json` 的 `logging` 下。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 日志级别

- `logging.level`：**文件日志**（JSONL）级别。
- `logging.consoleLevel`：**控制台**详细程度级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两个设置（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅为单次运行提高详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会在该命令中覆盖环境变量。

`--verbose` 仅影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人阅读、带颜色、带时间戳。
- `compact`：更紧凑的输出（最适合长时间会话）。
- `json`：每行一个 JSON（用于日志处理器）。

### 脱敏

工具摘要可以在输出到控制台之前，对敏感令牌进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串列表，用于覆盖默认集合

脱敏**只影响控制台输出**，不会修改文件日志。

## 诊断 + OpenTelemetry

诊断是面向模型运行**以及**消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**取代日志；它们的存在是为了向指标、追踪和其他导出器提供数据。

诊断事件会在进程内发出，但只有在启用了 diagnostics 和导出器插件后，导出器才会附加。

### OpenTelemetry 与 OTLP 的区别

- **OpenTelemetry（OTel）**：用于追踪、指标和日志的数据模型 + SDK。
- **OTLP**：用于将 OTel 数据导出到收集器 / 后端的线协议。
- OpenClaw 当前通过 **OTLP/HTTP（protobuf）** 导出。

### 导出的信号

- **指标**：计数器 + 直方图（token 使用量、消息流、排队）。
- **追踪**：用于模型使用 + webhook / 消息处理的 span。
- **日志**：当启用 `diagnostics.otel.logs` 时通过 OTLP 导出。日志量可能很大；请留意 `logging.level` 和导出器过滤器。

### 诊断事件目录

模型使用：

- `model.usage`：token、成本、时长、上下文、provider / model / channel、session id。

消息流：

- `webhook.received`：每个渠道的 webhook 入站。
- `webhook.processed`：webhook 已处理 + 时长。
- `webhook.error`：webhook 处理器错误。
- `message.queued`：消息已加入处理队列。
- `message.processed`：结果 + 时长 + 可选错误。
- `message.delivery.started`：出站投递尝试已开始。
- `message.delivery.completed`：出站投递尝试已完成 + 时长 / 结果数量。
- `message.delivery.error`：出站投递尝试失败 + 时长 / 有界错误类别。

队列 + 会话：

- `queue.lane.enqueue`：命令队列通道入队 + 深度。
- `queue.lane.dequeue`：命令队列通道出队 + 等待时间。
- `session.state`：会话状态转换 + 原因。
- `session.stuck`：会话卡住警告 + 持续时长。
- `run.attempt`：运行重试 / 尝试元数据。
- `diagnostic.heartbeat`：聚合计数器（webhook / 队列 / 会话）。

Exec：

- `exec.process.completed`：终端 exec 进程结果、时长、目标、模式、
  退出码和失败类型。不包含命令文本和工作目录。

### 启用 diagnostics（不启用导出器）

如果你希望 diagnostics 事件可供插件或自定义接收端使用，请这样配置：

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### diagnostics 标志（定向日志）

使用标志启用额外的、定向的调试日志，而不必提高 `logging.level`。
标志不区分大小写，并支持通配符（例如 `telegram.*` 或 `*`）。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

环境变量覆盖（一次性）：

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

说明：

- 标志日志会写入标准日志文件（与 `logging.file` 相同）。
- 输出仍会按照 `logging.redactSensitive` 进行脱敏。
- 完整指南：[/diagnostics/flags](/zh-CN/diagnostics/flags)。

### 导出到 OpenTelemetry

diagnostics 可以通过 `diagnostics-otel` 插件（OTLP/HTTP）导出。这适用于任何接受 OTLP/HTTP 的 OpenTelemetry 收集器 / 后端。

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

说明：

- 你也可以使用 `openclaw plugins enable diagnostics-otel` 启用该插件。
- `protocol` 当前仅支持 `http/protobuf`。`grpc` 会被忽略。
- 指标包括 token 使用量、成本、上下文大小、运行时长，以及消息流计数器 / 直方图（webhook、排队、会话状态、队列深度 / 等待时间）。
- 可以通过 `traces` / `metrics` 切换追踪 / 指标（默认：开启）。启用后，追踪包括模型使用 span，以及 webhook / 消息处理 span。
- 默认不会导出原始模型 / 工具内容。仅当你的收集器和保留策略已获准用于提示词、响应、工具或系统提示词文本时，才使用 `diagnostics.otel.captureContent`。
- 当你的收集器需要认证时，请设置 `headers`。
- 支持的环境变量：`OTEL_EXPORTER_OTLP_ENDPOINT`、
  `OTEL_SERVICE_NAME`、`OTEL_EXPORTER_OTLP_PROTOCOL`。
- 当另一个预加载项或宿主进程已经注册了全局 OpenTelemetry SDK 时，请设置 `OPENCLAW_OTEL_PRELOADED=1`。在该模式下，插件不会启动或关闭自己的 SDK，但仍会连接 OpenClaw 诊断监听器，并遵循 `diagnostics.otel.traces`、`metrics` 和 `logs`。

### 已导出指标（名称 + 类型）

模型使用：

- `openclaw.tokens`（计数器，属性：`openclaw.token`、`openclaw.channel`、
  `openclaw.provider`、`openclaw.model`）
- `openclaw.cost.usd`（计数器，属性：`openclaw.channel`、`openclaw.provider`、
  `openclaw.model`）
- `openclaw.run.duration_ms`（直方图，属性：`openclaw.channel`、
  `openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（直方图，属性：`openclaw.context`、
  `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（直方图，GenAI 语义约定指标，
  属性：`gen_ai.token.type` = `input` / `output`、`gen_ai.system`、
  `gen_ai.operation.name`、`gen_ai.request.model`）

消息流：

- `openclaw.webhook.received`（计数器，属性：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.webhook.error`（计数器，属性：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（直方图，属性：`openclaw.channel`、
  `openclaw.webhook`）
- `openclaw.message.queued`（计数器，属性：`openclaw.channel`、
  `openclaw.source`）
- `openclaw.message.processed`（计数器，属性：`openclaw.channel`、
  `openclaw.outcome`）
- `openclaw.message.duration_ms`（直方图，属性：`openclaw.channel`、
  `openclaw.outcome`）
- `openclaw.message.delivery.started`（计数器，属性：`openclaw.channel`、
  `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（直方图，属性：
  `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、
  `openclaw.errorCategory`）

队列 + 会话：

- `openclaw.queue.lane.enqueue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.lane.dequeue`（计数器，属性：`openclaw.lane`）
- `openclaw.queue.depth`（直方图，属性：`openclaw.lane` 或
  `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（直方图，属性：`openclaw.lane`）
- `openclaw.session.state`（计数器，属性：`openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（计数器，属性：`openclaw.state`）
- `openclaw.session.stuck_age_ms`（直方图，属性：`openclaw.state`）
- `openclaw.run.attempt`（计数器，属性：`openclaw.attempt`）

Exec：

- `openclaw.exec.duration_ms`（直方图，属性：`openclaw.exec.target`、
  `openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

诊断内部机制（内存 + 工具循环）：

- `openclaw.memory.heap_used_bytes`（直方图，属性：`openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（直方图）
- `openclaw.memory.pressure`（计数器，属性：`openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（计数器，属性：`openclaw.toolName`、
  `openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（直方图，属性：`openclaw.toolName`、
  `openclaw.outcome`）

### 已导出 span（名称 + 关键属性）

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input / output / cache_read / cache_write / total）
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、
    `openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`、`gen_ai.request.model`、`gen_ai.operation.name`、
    `openclaw.provider`、`openclaw.model`、`openclaw.api`、
    `openclaw.transport`、`openclaw.provider.request_id_hash`（上游提供商请求 id 的有界 SHA 哈希；不会导出原始 id）
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、
    `openclaw.failureKind`、`openclaw.exec.command_length`、
    `openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、
    `openclaw.messageId`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、
    `openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、
    `openclaw.context.tokens`、`openclaw.errorCategory`（不包含 prompt、历史、响应或会话键内容）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、
    `openclaw.errorCategory`（不包含循环消息、参数或工具输出）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、
    `openclaw.memory.rss_bytes`

当明确启用内容捕获时，模型 / 工具 span 还可以包含你选择启用的特定内容类别对应的、有界且已脱敏的 `openclaw.content.*` 属性。

### 采样 + 刷新

- 追踪采样：`diagnostics.otel.sampleRate`（0.0–1.0，仅根 span）。
- 指标导出间隔：`diagnostics.otel.flushIntervalMs`（最小 1000 ms）。

### 协议说明

- OTLP/HTTP 端点可以通过 `diagnostics.otel.endpoint` 或
  `OTEL_EXPORTER_OTLP_ENDPOINT` 设置。
- 如果端点已包含 `/v1/traces` 或 `/v1/metrics`，则按原样使用。
- 如果端点已包含 `/v1/logs`，则会按原样用于日志。
- `OPENCLAW_OTEL_PRELOADED=1` 会复用外部已注册的 OpenTelemetry SDK
  来处理追踪 / 指标，而不是启动由插件拥有的 NodeSDK。
- `diagnostics.otel.logs` 会为主日志记录器输出启用 OTLP 日志导出。

### 日志导出行为

- OTLP 日志使用与写入 `logging.file` 相同的结构化记录。
- 遵循 `logging.level`（文件日志级别）。控制台脱敏**不**适用于
  OTLP 日志。
- 高日志量的安装应优先使用 OTLP 收集器采样 / 过滤。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，以及是否正在向
  `logging.file` 中的文件路径写入。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace`，然后重试。

## 相关内容

- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [诊断](/zh-CN/gateway/configuration-reference#diagnostics) — OpenTelemetry 导出和缓存追踪配置
