---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志概览
    - 你想配置日志级别、格式或脱敏处理
    - 你正在进行故障排查，需要快速查找日志
summary: 文件日志、控制台输出、CLI 尾随查看，以及 Control UI 的 Logs 选项卡
title: 日志
x-i18n:
    generated_at: "2026-07-11T20:41:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw 有两个主要的日志界面：

- Gateway 网关写入的**文件日志**（JSON 行）。
- 运行 Gateway 网关的终端中的**控制台输出**。

Control UI 的**日志**标签页会实时跟踪 Gateway 网关文件日志。本页说明日志的存储位置、读取方式，以及如何配置日志级别和格式。

## 日志的存储位置

默认情况下，Gateway 网关每天写入一个滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关主机的本地时区。当 `/tmp/openclaw` 不安全或不可用时（Windows 上始终如此），OpenClaw 会改用操作系统临时目录下用户专属的 `openclaw-<uid>` 目录。带日期的日志文件会在 24 小时后清理。

当下一次写入会导致文件超过 `logging.maxFileBytes`（默认值：100 MB）时，文件会轮转。OpenClaw 会在活动文件旁最多保留五个带编号的归档文件，例如 `openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志，而不会停止记录诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖该路径：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时跟踪（推荐）

通过 RPC 实时跟踪 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

选项：

| 标志                | 默认值   | 行为                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 关闭     | 持续跟踪；断开连接后采用退避策略重新连接                                              |
| `--limit <n>`       | `200`    | 每次获取的最大行数                                                                    |
| `--max-bytes <n>`   | `250000` | 每次获取读取的最大字节数                                                              |
| `--interval <ms>`   | `1000`   | 跟踪时的轮询间隔                                                                      |
| `--json`            | 关闭     | 以行分隔的 JSON（每行一个事件）                                                       |
| `--plain`           | 关闭     | 在 TTY 会话中强制使用纯文本                                                          |
| `--no-color`        | —        | 禁用 ANSI 颜色                                                                        |
| `--utc`             | 关闭     | 以 UTC 呈现时间戳（默认使用本地时间）                                                 |
| `--local-time`      | 关闭     | 为默认本地时间接受的兼容写法；除此之外没有其他作用                                    |
| `--url` / `--token` | —        | 标准 Gateway 网关 RPC 标志                                                            |
| `--timeout <ms>`    | `30000`  | Gateway 网关 RPC 超时时间                                                             |
| `--expect-final`    | 关闭     | 等待智能体支持的 RPC 最终响应的标志（此处通过共享客户端层接受）                       |

输出模式：

- **TTY 会话**：美观、彩色且结构化的日志行。
- **非 TTY 会话**：纯文本。

当你显式传入 `--url` 时，CLI 不会自动应用配置或环境凭据；请自行提供 `--token`，否则调用会失败并显示 `gateway url override requires explicit credentials`。

在 JSON 模式下，CLI 会输出带 `type` 标签的对象：

- `meta`：流元数据（文件、来源、来源类型、服务、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断/轮转提示
- `raw`：未解析的日志行
- `error`：Gateway 网关连接失败（写入 stderr）

如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式的 `--url` 目标不会使用此回退机制。`openclaw logs --follow` 更为严格：在 Linux 上，如果可用，它会按 PID 使用当前用户的 systemd Gateway 网关日志；否则会采用退避策略重试实时 Gateway 网关，而不是跟踪旁边可能已经过时的文件。

如果无法连接 Gateway 网关，CLI 会输出一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的**日志**标签页使用 `logs.tail` 跟踪同一个文件。
有关打开方式，请参阅 [Control UI](/zh-CN/web/control-ui)。

### 仅渠道日志

要筛选渠道活动（WhatsApp、Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 默认为 `all`；还可以使用 `--lines <n>`（默认值为 200）和 `--json`。

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以呈现结构化输出（时间、级别、子系统、消息）。

如果相应信息可用，文件日志的 JSONL 记录还会包含可供机器筛选的顶层字段：

- `hostname`：Gateway 网关主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：日志调用携带智能体上下文时的当前智能体 ID。
- `session_id`：日志调用携带会话上下文时的当前会话 ID/键。
- `channel`：日志调用携带渠道上下文时的当前渠道。

OpenClaw 会在这些字段之外保留原始的结构化日志参数，以便读取带编号 tslog 参数键的现有解析器继续正常工作。

Talk、实时语音和托管房间活动会通过同一文件日志管道输出有界的生命周期日志记录。这些记录会在可用时包含事件类型、模式、传输方式、提供商以及大小/时间测量值，但不会包含转录文本、音频载荷、轮次 ID、通话 ID 和提供商条目 ID。

### 控制台输出

控制台日志会**感知 TTY**，并采用易于阅读的格式：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别颜色（信息/警告/错误）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅记录值得关注的结果（错误、解析错误、慢速调用）
- `--verbose`：记录所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细日志的呈现样式
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

级别：`silent`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`。

- `logging.level`：**文件日志**（JSONL）的级别（默认值：`info`）。
- `logging.consoleLevel`：**控制台**详细程度级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量同时覆盖两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量的优先级高于配置文件，因此你可以提高单次运行的日志详细程度，而无需编辑 `openclaw.json`。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会针对该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 定向模型传输诊断

调试提供商调用时，请使用定向环境标志，而不是将所有日志提升到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用标志：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 级别输出请求开始、fetch 响应、SDK 标头、首个流式事件、流完成和传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型请求日志中包含有界的请求载荷摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含经过脱敏且大小受限的 JSON 载荷快照。仅在调试时使用；机密信息会被脱敏，但提示词和消息文本可能仍然存在。
- `OPENCLAW_DEBUG_SSE=events`：输出首个事件和流完成的时间信息。
- `OPENCLAW_DEBUG_SSE=peek`：还会输出前五个经过脱敏的 SSE 事件载荷，并限制每个事件的大小。
- `OPENCLAW_DEBUG_CODE_MODE=1`：输出代码模式的模型界面诊断信息，包括由于代码模式拥有工具界面而隐藏原生提供商工具的情况。

这些标志通过 OpenClaw 的常规日志机制记录，因此 `openclaw logs --follow` 和 Control UI 的日志标签页都会显示它们。如果不设置这些标志，同样的诊断信息仍可在 `debug` 级别查看。

无论是否设置 `OPENCLAW_DEBUG_MODEL_TRANSPORT`，`[model-fetch]` 的开始和响应元数据（提供商、API、模型、状态、延迟，以及方法、URL、超时、代理和策略等请求字段）始终以 `info` 级别输出，因此无需调试标志即可查看基本的模型传输健康信息。

### 跟踪关联

文件日志采用 JSONL 格式。当日志调用携带有效的诊断跟踪上下文时，OpenClaw 会将跟踪字段作为顶层 JSON 键（`traceId`、`spanId`、`parentSpanId`、`traceFlags`）写入，以便外部日志处理器将该日志行与 OTEL span 及提供商的 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求跟踪范围。在该异步范围内输出的日志和诊断事件，如果没有传入显式跟踪上下文，就会继承请求跟踪。智能体运行和模型调用跟踪会成为当前请求跟踪的子项，因此本地日志、诊断快照、OTEL span 和可信提供商的 `traceparent` 标头可以通过 `traceId` 关联，而无需记录原始请求或模型内容。

启用 OpenTelemetry 日志导出后，Talk 生命周期日志记录也会流向 diagnostics-otel 日志导出，并使用与文件日志相同的有界属性。配置 `diagnostics.otel.logsExporter`，可选择 OTLP、stdout JSONL 或同时使用这两个接收端。

### 模型调用大小和时间

模型调用诊断会记录有界的请求/响应测量值，而不捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应块载荷的 UTF-8 字节大小。高频文本、思考和工具调用增量事件只计算递增的 `delta` 字节，而不是完整的 `partial` 快照。
- `timeToFirstByteMs`：首个流式响应事件出现前的耗时
- `durationMs`：模型调用的总持续时间

启用诊断导出后，诊断快照、模型调用插件钩子以及 OTEL 模型调用 span/指标均可使用这些字段。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人工阅读，带颜色和时间戳。
- `compact`：更紧凑的输出（最适合长时间会话）。
- `json`：每行一个 JSON（供日志处理器使用）。

### 脱敏

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、OTLP 日志记录、持久化的会话转录文本或 Control UI 工具事件载荷（工具启动参数、部分/最终结果载荷、派生的 Exec 输出和补丁摘要）之前将其脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认值：`tools`）
- `logging.redactPatterns`：正则表达式字符串列表，用于替换日志/转录输出的默认集合。对于 Control UI 工具载荷，自定义模式会叠加在内置默认模式之上，因此添加模式绝不会削弱对已被默认模式捕获的值的脱敏。

文件日志和会话转录仍采用 JSONL 格式，但匹配的机密值会在相应行或消息写入磁盘前被遮盖。脱敏采用尽力而为的方式：它适用于包含文本的消息内容和日志字符串，但不覆盖所有标识符或二进制载荷字段。

内置默认值涵盖了常见的 API 凭据和支付凭据字段名称，例如卡号、CVC/CVV、共享支付令牌和支付凭据；当它们作为 JSON 字段、URL 参数、CLI 标志或赋值项出现时，都会被处理。

`logging.redactSensitive: "off"` 仅禁用这项通用日志/转录文本策略。OpenClaw 仍会对可能展示给 UI 客户端、支持包、诊断观察器、审批提示或智能体工具的安全边界载荷进行脱敏。例如 Control UI 工具调用事件、`sessions_history` 输出、诊断支持导出、提供商错误观测、Exec 审批命令显示以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns` 仍可在这些界面中添加项目专用模式。

## 诊断和 OpenTelemetry

诊断是用于模型运行和消息流遥测（Webhooks、排队、会话状态）的结构化、机器可读事件。它们**不能**取代日志，而是用于为指标、追踪和导出器提供数据。默认情况下，事件在进程内发出（设置 `diagnostics.enabled: false` 可将其关闭）；事件导出需单独配置。

有两个相邻的功能界面：

- **OpenTelemetry 导出** — 通过 OTLP/HTTP 将指标、追踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Datadog、Grafana、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标/跨度名称、环境变量和隐私模型请参阅专门页面：[OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志** — 有针对性的调试日志标志，无需提高 `logging.level` 即可将额外日志发送到 `logging.file`。标志不区分大小写，并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags` 下配置，也可通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南：[诊断标志](/zh-CN/diagnostics/flags)。

如需将 OTLP 数据导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排查提示

- **无法访问 Gateway 网关？** 请先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并向 `logging.file` 中指定的文件路径写入数据。
- **需要更多详细信息？** 将 `logging.level` 设置为 `debug` 或 `trace`，然后重试。

## 相关内容

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/跨度目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 有针对性的调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
