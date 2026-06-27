---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志概览
    - 你想配置日志级别、格式或脱敏
    - 你正在排查问题，需要快速找到日志
summary: 文件日志、控制台输出、CLI 追踪查看，以及 Control UI 日志选项卡
title: 日志
x-i18n:
    generated_at: "2026-06-27T02:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw 有两个主要日志表面：

- **文件日志**（JSON 行），由 Gateway 网关写入。
- **控制台输出**，显示在终端和 Gateway 网关调试 UI 中。

Control UI 的 **日志** 标签页会跟踪 Gateway 网关文件日志。本页说明日志的存放位置、如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关主机的本地时区。

每个文件在达到 `logging.maxFileBytes`（默认值：100 MB）时轮转。OpenClaw 会在活动文件旁边最多保留五个编号归档，例如 `openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志，而不是抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时跟踪（推荐）

使用 CLI 通过 RPC 跟踪 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：使用你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（此处通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、彩色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：按行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式 `--url` 时，CLI 不会自动应用配置或环境凭证；如果目标 Gateway 网关需要身份验证，请自行包含 `--token`。

在 JSON 模式下，CLI 会发出带 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行

如果隐式 local loopback Gateway 网关要求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用此回退。`openclaw logs --follow` 更严格：在 Linux 上，如果可用，它会按 PID 使用活动的用户 systemd Gateway 网关 journal；否则会持续重试实时 Gateway 网关，而不是跟踪可能已过期的并排文件。

如果无法访问 Gateway 网关，CLI 会打印一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（Web）

Control UI 的 **日志** 标签页使用 `logs.tail` 跟踪同一文件。请参阅 [Control UI](/zh-CN/web/control-ui) 了解如何打开它。

### 仅频道日志

要过滤频道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

文件日志 JSONL 记录在可用时还包含可供机器过滤的顶层字段：

- `hostname`：Gateway 网关主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：日志调用携带智能体上下文时的活动智能体 ID。
- `session_id`：日志调用携带会话上下文时的活动会话 ID/键。
- `channel`：日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在这些字段旁保留原始结构化日志参数，因此读取编号 tslog 参数键的现有解析器会继续工作。

Talk、实时语音和托管房间活动会通过同一个文件日志管线发出有边界的生命周期日志记录。这些记录在可用时包含事件类型、模式、传输、提供商和大小/时序度量，但会省略转录文本、音频载荷、轮次 ID、通话 ID 和提供商项目 ID。

### 控制台输出

控制台日志是 **TTY 感知** 的，并按可读性格式化：

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

- `logging.level`：**文件日志**（JSONL）级别。
- `logging.consoleLevel`：**控制台** 详细程度级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量（例如 `OPENCLAW_LOG_LEVEL=debug`）覆盖两者。环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下为单次运行提高详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 定向模型传输诊断

调试提供商调用时，请使用定向环境标志，而不是将所有日志提高到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用标志：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：以 `info` 级别发出请求开始、fetch 响应、SDK 标头、第一个流式事件、流完成和传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型请求日志中包含有边界的请求载荷摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含经过遮蔽且有上限的 JSON 载荷快照。仅在调试时使用；密钥会被遮蔽，但提示词和消息文本仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：发出首事件和流完成时序。
- `OPENCLAW_DEBUG_SSE=peek`：还会发出前五个经过遮蔽的 SSE 事件载荷，并对每个事件设置上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：发出代码模式模型表面诊断，包括由于代码模式拥有工具表面而隐藏原生提供商工具的情况。

这些标志通过正常 OpenClaw 日志记录，因此 `openclaw logs --follow` 和 Control UI 的日志标签页都会显示它们。没有这些标志时，同样的诊断仍可在 `debug` 级别获得。

无论 `OPENCLAW_DEBUG_MODEL_TRANSPORT` 如何，`[model-fetch]` 开始和响应元数据（提供商、API、模型、状态、延迟，以及方法、URL、超时、代理和策略等请求字段）始终会以 `info` 级别发出，因此无需调试标志也能看到基础模型传输卫生信息。

### Trace 关联

文件日志是 JSONL。当日志调用携带有效的诊断 trace 上下文时，OpenClaw 会将 trace 字段写为顶层 JSON 键（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），以便外部日志处理器可以将该行与 OTEL span 和提供商 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求 trace 作用域。在该异步作用域内发出的日志和诊断事件，如果没有传入显式 trace 上下文，会继承请求 trace。智能体运行和模型调用 trace 会成为活动请求 trace 的子级，因此本地日志、诊断快照、OTEL span 和受信任的提供商 `traceparent` 标头可以通过 `traceId` 连接，而无需记录原始请求或模型内容。

当启用 OpenTelemetry 日志导出时，Talk 生命周期日志记录也会流向 diagnostics-otel 日志导出，并使用与文件日志相同的有边界属性。配置 `diagnostics.otel.logsExporter` 以选择 OTLP、stdout JSONL 或两个接收器。

### 模型调用大小和时序

模型调用诊断会记录有边界的请求/响应度量，而不捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应分块载荷的 UTF-8 字节大小。高频文本、thinking 和工具调用 delta 事件只计算增量 `delta` 字节，而不是完整 `partial` 快照。
- `timeToFirstByteMs`：第一个流式响应事件之前经过的时间
- `durationMs`：模型调用总持续时间

启用诊断导出时，这些字段可供诊断快照、模型调用插件钩子和 OTEL 模型调用 span/指标使用。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：对人友好、彩色、带时间戳。
- `compact`：更紧凑的输出（最适合长会话）。
- `json`：每行一个 JSON（供日志处理器使用）。

### 遮蔽

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、OTLP 日志记录、持久化会话转录文本或 Control UI 工具事件载荷（工具开始参数、部分/最终结果载荷、派生的 exec 输出和补丁摘要）之前进行遮蔽：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则字符串列表。自定义模式会叠加应用在 Control UI 工具载荷的内置默认值之上，因此添加模式绝不会削弱已经被默认值捕获的值的遮蔽。

文件日志和会话转录会保持 JSONL，但匹配的密钥值会在行或消息写入磁盘之前被遮蔽。遮蔽是尽力而为：它适用于含文本的消息内容和日志字符串，而不是每个标识符或二进制载荷字段。

内置默认值覆盖常见 API 凭证和支付凭证字段名，例如卡号、CVC/CVV、共享支付令牌和支付凭证，当它们作为 JSON 字段、URL 参数、CLI 标志或赋值出现时会被处理。

`logging.redactSensitive: "off"` 只会禁用这种通用日志/转录策略。OpenClaw 仍会遮蔽可能显示给 UI 客户端、支持包、诊断观察者、审批提示或智能体工具的安全边界载荷。示例包括 Control UI 工具调用事件、`sessions_history` 输出、诊断支持导出、提供商错误观察、exec 审批命令显示，以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns` 仍可以在这些表面上添加项目特定模式。

## 诊断和 OpenTelemetry

诊断是用于模型运行和消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**替代日志，而是为指标、trace 和导出器提供输入。无论是否导出，事件都会在进程内发出。

两个相邻表面：

- **OpenTelemetry 导出** — 通过 OTLP/HTTP 将指标、trace 和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标/span 名称、环境变量和隐私模型位于专门页面：[OpenTelemetry export](/zh-CN/gateway/opentelemetry)。
- **诊断标志** — 定向调试日志标志，可将额外日志路由到 `logging.file`，而无需提高 `logging.level`。标志不区分大小写，并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags` 下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境覆盖。完整指南：[Diagnostics flags](/zh-CN/diagnostics/flags)。

要为插件或自定义接收器启用诊断事件，而不导出 OTLP：

```json5
{
  diagnostics: { enabled: true },
}
```

如需将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **无法访问 Gateway 网关？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并写入 `logging.file`
  中的文件路径。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace`，然后重试。

## 相关

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
