---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志概览
    - 你想配置日志级别、格式或脱敏
    - 你正在故障排查，需要快速找到日志
summary: 文件日志、控制台输出、CLI 尾随查看以及 Control UI 日志标签页
title: 日志
x-i18n:
    generated_at: "2026-07-05T11:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw 有两个主要日志界面：

- Gateway 网关写入的**文件日志**（JSON 行）。
- 运行 Gateway 网关的终端中的**控制台输出**。

Control UI 的**日志**标签页会跟踪 Gateway 网关文件日志。本页说明日志存放位置、如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关每天写入一个滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关主机的本地时区。当 `/tmp/openclaw` 不安全或不可用时（在 Windows 上始终如此），OpenClaw 会改用 OS 临时目录下按用户划分的 `openclaw-<uid>` 目录。带日期的日志文件会在 24 小时后清理。

当下一次写入会超过 `logging.maxFileBytes`（默认：100 MB）时，每个文件都会轮转。OpenClaw 会在活动文件旁保留最多五个带编号的归档文件，例如 `openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志，而不是抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖路径：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时跟踪（推荐）

通过 RPC 跟踪 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

选项：

| 标志                | 默认值   | 行为                                                                                  |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | 关闭     | 持续跟踪；断开连接时使用退避重连                                                      |
| `--limit <n>`       | `200`    | 每次获取的最大行数                                                                    |
| `--max-bytes <n>`   | `250000` | 每次获取读取的最大字节数                                                              |
| `--interval <ms>`   | `1000`   | 跟踪时的轮询间隔                                                                      |
| `--json`            | 关闭     | 行分隔 JSON（每行一个事件）                                                           |
| `--plain`           | 关闭     | 在 TTY 会话中强制使用纯文本                                                           |
| `--no-color`        | —        | 禁用 ANSI 颜色                                                                        |
| `--utc`             | 关闭     | 以 UTC 渲染时间戳（默认使用本地时间）                                                 |
| `--local-time`      | 关闭     | 本地时间默认值的兼容拼写；除此之外没有效果                                            |
| `--url` / `--token` | —        | 标准 Gateway 网关 RPC 标志                                                            |
| `--timeout <ms>`    | `30000`  | Gateway 网关 RPC 超时                                                                 |
| `--expect-final`    | 关闭     | Agent 支持的 RPC 最终响应等待标志（此处通过共享客户端层接受）                         |

输出模式：

- **TTY 会话**：美观、彩色、结构化的日志行。
- **非 TTY 会话**：纯文本。

当你传入显式的 `--url` 时，CLI 不会自动应用配置或环境凭证；请自行包含 `--token`，否则调用会失败并显示 `gateway url override requires explicit credentials`。

在 JSON 模式下，CLI 会发出带 `type` 标签的对象：

- `meta`：流元数据（file、source、sourceKind、service、cursor、size）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行
- `error`：Gateway 网关连接失败（写入 stderr）

如果隐式 local loopback Gateway 网关要求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用此回退。`openclaw logs --follow` 更严格：在 Linux 上，如果可用，它会按 PID 使用活动的 user-systemd Gateway 网关 journal；否则会使用退避重试实时 Gateway 网关，而不是跟踪一个可能已过期的并排文件。

如果 Gateway 网关无法访问，CLI 会打印一条简短提示，要求运行：

```bash
openclaw doctor
```

### Control UI（Web）

Control UI 的**日志**标签页使用 `logs.tail` 跟踪同一个文件。
参见 [Control UI](/zh-CN/web/control-ui) 了解如何打开它。

### 仅渠道日志

要筛选渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

`--channel` 默认为 `all`；`--lines <n>`（默认 200）和 `--json` 也可用。

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

可用时，文件日志 JSONL 记录还会包含可由机器筛选的顶级字段：

- `hostname`：Gateway 网关主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：当日志调用携带智能体上下文时的活动智能体 ID。
- `session_id`：当日志调用携带会话上下文时的活动会话 ID/键。
- `channel`：当日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在这些字段旁保留原始结构化日志参数，因此读取带编号 tslog 参数键的现有解析器会继续工作。

Talk、实时语音和托管房间活动会通过同一个文件日志管道发出有界的生命周期日志记录。这些记录会在可用时包含事件类型、模式、传输协议、提供商以及大小/时间测量，但会省略转录文本、音频载荷、轮次 ID、通话 ID 和提供商项目 ID。

### 控制台输出

控制台日志**感知 TTY**，并以便于阅读的方式格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还为 RPC 流量提供 WebSocket 协议日志：

- 普通模式：仅记录值得关注的结果（错误、解析错误、慢调用）
- `--verbose`：所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细渲染样式
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

- `logging.level`：**文件日志**（JSONL）级别（默认：`info`）。
- `logging.consoleLevel`：**控制台**详细程度级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下为单次运行提高详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 定向模型传输诊断

调试提供商调用时，请使用定向环境标志，而不是将所有日志提升到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用标志：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：在 `info` 级别发出请求开始、fetch 响应、SDK 标头、首个流式事件、流完成和传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型请求日志中包含有界的请求载荷摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含一个经过脱敏且有上限的 JSON 载荷快照。仅在调试时使用；密钥会被脱敏，但提示词和消息文本仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：发出首个事件和流完成时间。
- `OPENCLAW_DEBUG_SSE=peek`：还会发出前五个经脱敏的 SSE 事件载荷，并对每个事件设置上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：发出代码模式模型界面诊断，包括因代码模式拥有工具界面而隐藏原生提供商工具的情况。

这些标志会通过普通 OpenClaw 日志记录，因此 `openclaw logs --follow` 和 Control UI 日志标签页会显示它们。没有这些标志时，同样的诊断仍可在 `debug` 级别使用。

无论 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 如何，`[model-fetch]` 开始和响应元数据（提供商、API、模型、状态、延迟，以及 method、URL、timeout、proxy 和 policy 等请求字段）始终会以 `info` 级别发出，因此无需调试标志也能看到基本的模型传输卫生信息。

### Trace 关联

文件日志是 JSONL。当日志调用携带有效的诊断 trace 上下文时，OpenClaw 会将 trace 字段写为顶级 JSON 键（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），以便外部日志处理器将该行与 OTEL span 和提供商 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求 trace 作用域。在该异步作用域内发出的日志和诊断事件，如果没有传入显式 trace 上下文，就会继承请求 trace。Agent 运行和模型调用 trace 会成为活动请求 trace 的子级，因此本地日志、诊断快照、OTEL span 和受信任提供商 `traceparent` 标头可以通过 `traceId` 连接，而无需记录原始请求或模型内容。

当启用 OpenTelemetry 日志导出时，Talk 生命周期日志记录也会流向 diagnostics-otel 日志导出，并使用与文件日志相同的有界属性。配置 `diagnostics.otel.logsExporter` 以选择 OTLP、stdout JSONL，或两个接收端同时使用。

### 模型调用大小和时间

模型调用诊断会记录有界的请求/响应测量值，而不会捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应分块载荷的 UTF-8 字节大小。高频文本、思考和工具调用增量事件只计算增量 `delta` 字节，而不是完整的 `partial` 快照。
- `timeToFirstByteMs`：首个流式响应事件前经过的时间
- `durationMs`：模型调用总持续时间

当启用诊断导出时，这些字段可用于诊断快照、模型调用插件钩子和 OTEL 模型调用 span/指标。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：对人友好、彩色、带时间戳。
- `compact`：更紧凑的输出（最适合长会话）。
- `json`：每行一个 JSON（用于日志处理器）。

### 脱敏

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、OTLP 日志记录、持久化会话转录文本，或 Control UI 工具事件载荷（工具启动参数、部分/最终结果载荷、派生的 exec 输出和补丁摘要）之前对其进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串列表，会替换用于日志/转录输出的默认集合。对于 Control UI 工具载荷，自定义模式会叠加在内置默认值之上，因此添加模式永远不会削弱对已被默认值捕获的值的脱敏。

文件日志和会话转录会保持 JSONL，但匹配的密钥值会在行或消息写入磁盘前被掩码。脱敏是尽力而为的：它适用于承载文本的消息内容和日志字符串，而不是每个标识符或二进制载荷字段。

内置默认值覆盖常见 API 凭证和支付凭证字段名称，例如卡号、CVC/CVV、共享支付令牌和支付凭证，当它们作为 JSON 字段、URL 参数、CLI 标志或赋值出现时都会覆盖。

`logging.redactSensitive: "off"` 只会停用这项通用日志/转录策略。OpenClaw 仍会遮盖可显示给 UI 客户端、支持包、诊断观察器、审批提示或智能体工具的安全边界载荷。示例包括 Control UI 工具调用事件、`sessions_history` 输出、诊断支持导出、提供商错误观察、Exec 审批命令显示，以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns` 仍可在这些表面上添加项目特定模式。

## 诊断和 OpenTelemetry

诊断是用于模型运行和消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**取代日志，而是为指标、追踪和导出器提供输入。默认情况下，事件会在进程内发出（设置 `diagnostics.enabled: false` 可关闭）；导出这些事件是单独的配置。

两个相邻表面：

- **OpenTelemetry 导出** — 通过 OTLP/HTTP 将指标、追踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Datadog、Grafana、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标/span 名称、环境变量和隐私模型位于专门页面：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志** — 定向调试日志标志，可将额外日志路由到 `logging.file`，而不提高 `logging.level`。标志不区分大小写，并支持通配符（`telegram.*`、`*`）。在 `diagnostics.flags` 下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖配置。完整指南：
  [诊断标志](/zh-CN/diagnostics/flags)。

有关将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排查提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并写入 `logging.file` 中的文件路径。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace`，然后重试。

## 相关

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 字段参考
