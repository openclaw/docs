---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志记录概览
    - 你想配置日志级别、格式或脱敏
    - 你正在进行故障排除，需要快速查找日志
summary: 文件日志、控制台输出、CLI 实时跟踪输出和控制 UI 日志标签页
title: 日志记录
x-i18n:
    generated_at: "2026-05-11T20:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw 有两个主要日志界面：

- **文件日志**（JSON 行），由 Gateway 网关写入。
- **控制台输出**，显示在终端和 Gateway 网关调试 UI 中。

控制 UI 的 **日志** 标签页会跟踪 Gateway 网关文件日志。本页说明日志的存放位置、
阅读方式，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关主机的本地时区。

每个文件达到 `logging.maxFileBytes`（默认值：100 MB）时会轮转。
OpenClaw 会在活动文件旁保留最多五个带编号的归档文件，例如
`openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志，而不是
抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何阅读日志

### CLI：实时跟踪（推荐）

使用 CLI 通过 RPC 跟踪 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：以你的本地时区呈现时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（这里通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、彩色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：按行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式 `--url` 时，CLI 不会自动应用配置或
环境凭据；如果目标 Gateway 网关需要认证，请自行包含 `--token`。

在 JSON 模式下，CLI 会输出带 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行

如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，
或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到
已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用
此回退。

如果 Gateway 网关不可达，CLI 会打印简短提示，建议运行：

```bash
openclaw doctor
```

### 控制 UI（Web）

控制 UI 的 **日志** 标签页使用 `logs.tail` 跟踪同一文件。
请参阅 [控制 UI](/zh-CN/web/control-ui) 了解如何打开它。

### 仅频道日志

要筛选频道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和控制 UI 会解析这些
条目，以呈现结构化输出（时间、级别、子系统、消息）。

文件日志 JSONL 记录在可用时还包含可由机器筛选的顶层字段：

- `hostname`：Gateway 网关主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：日志调用携带智能体上下文时的活动智能体 ID。
- `session_id`：日志调用携带会话上下文时的活动会话 ID/键。
- `channel`：日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在这些字段旁保留原始结构化日志参数，
因此读取编号 tslog 参数键的现有解析器仍可正常工作。

Talk、实时语音和受管房间活动会通过同一文件日志管道发出有界生命周期日志
记录。这些记录会在可用时包含事件类型、模式、传输、提供商和大小/计时测量，
但会省略转录文本、音频载荷、轮次 ID、通话 ID 和提供商项目 ID。

### 控制台输出

控制台日志**感知 TTY**，并按可读性格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还为 RPC 流量提供 WebSocket 协议日志：

- 普通模式：仅记录有意义的结果（错误、解析错误、慢调用）
- `--verbose`：所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细呈现样式
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 配置日志记录

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

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此你可以为单次运行提高详细程度，而无需编辑 `openclaw.json`。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会覆盖该命令的环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改
文件日志级别。

### 定向模型传输诊断

调试提供商调用时，请使用定向环境标志，而不是将
所有日志提升到 `debug`：

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

可用标志：

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`：在 `info` 级别发出请求开始、fetch 响应、SDK
  头、首个流式事件、流完成和传输错误。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`：在模型请求日志中包含有界请求载荷
  摘要。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`：在载荷摘要中包含所有面向模型的工具名称。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`：包含经遮蔽且有上限的 JSON
  载荷快照。仅在调试时使用；密钥会被遮蔽，但提示词
  和消息文本仍可能存在。
- `OPENCLAW_DEBUG_SSE=events`：发出首个事件和流完成的计时。
- `OPENCLAW_DEBUG_SSE=peek`：还会发出前五个经遮蔽的 SSE 事件
  载荷，并按事件设置上限。
- `OPENCLAW_DEBUG_CODE_MODE=1`：发出代码模式模型界面诊断，
  包括当代码模式拥有工具界面而隐藏原生提供商工具时的诊断。

这些标志通过普通 OpenClaw 日志记录，因此 `openclaw logs --follow`
和控制 UI 的日志标签页都会显示它们。没有这些标志时，相同诊断
仍可在 `debug` 级别获得。

### Trace 关联

文件日志是 JSONL。当日志调用携带有效的诊断 trace 上下文时，
OpenClaw 会将 trace 字段写为顶层 JSON 键（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`），这样外部日志处理器就可以将该行
与 OTEL span 和提供商 `traceparent` 传播相关联。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求
trace 作用域。在该异步作用域内发出的日志和诊断事件，如果未传入显式
trace 上下文，就会继承请求 trace。智能体运行和
模型调用 trace 会成为活动请求 trace 的子级，因此本地日志、
诊断快照、OTEL span 和受信任提供商 `traceparent` 头可以
通过 `traceId` 连接起来，而无需记录原始请求或模型内容。

启用 OpenTelemetry 日志导出时，Talk 生命周期日志记录也会流向 OTLP 日志，
并使用与文件日志相同的有界属性。

### 模型调用大小和计时

模型调用诊断会记录有界的请求/响应测量值，而不会
捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应事件的 UTF-8 字节大小
- `timeToFirstByteMs`：首个流式响应事件前经过的时间
- `durationMs`：模型调用总持续时间

启用诊断导出时，这些字段可供诊断快照、模型调用插件钩子和
OTEL 模型调用 span/指标使用。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：便于人阅读，带颜色和时间戳。
- `compact`：更紧凑的输出（最适合长会话）。
- `json`：每行 JSON（供日志处理器使用）。

### 遮蔽

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、
OTLP 日志记录、持久化会话转录文本或控制 UI 工具
事件载荷（工具启动参数、部分/最终结果载荷、派生的
exec 输出和补丁摘要）之前对其进行遮蔽：

- `logging.redactSensitive`：`off` | `tools`（默认值：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则表达式字符串列表。自定义模式会叠加应用在控制 UI 工具载荷的内置默认规则之上，因此添加模式永远不会削弱已被默认规则捕获的值的遮蔽。

文件日志和会话转录仍保持 JSONL，但匹配的密钥值会在行或消息写入磁盘前
被掩码。遮蔽是尽力而为的：
它适用于承载文本的消息内容和日志字符串，而不是每个
标识符或二进制载荷字段。

内置默认规则覆盖常见 API 凭据和支付凭据字段
名称，例如卡号、CVC/CVV、共享支付令牌和支付凭据，
当它们作为 JSON 字段、URL 参数、CLI 标志或赋值出现时都会生效。

`logging.redactSensitive: "off"` 只会禁用这种通用日志/转录
策略。OpenClaw 仍会遮蔽可能展示给 UI
客户端、支持包、诊断观察者、审批提示或智能体
工具的安全边界载荷。示例包括控制 UI 工具调用事件、`sessions_history` 输出、
诊断支持导出、提供商错误观察、exec 审批命令
显示，以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns`
仍可在这些界面上添加项目特定模式。

## 诊断和 OpenTelemetry

诊断是用于模型运行和
消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**
替代日志，而是为指标、trace 和导出器提供输入。无论是否导出，
事件都会在进程内发出。

两个相邻界面：

- **OpenTelemetry 导出**：通过 OTLP/HTTP 将指标、trace 和日志发送到
  任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、
  Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、
  指标/span 名称、环境变量和隐私模型位于专用页面：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志**：定向调试日志标志，会将额外日志路由到
  `logging.file`，而无需提高 `logging.level`。标志不区分大小写，
  并支持通配符（`telegram.*`、`*`）。在 `diagnostics.flags`
  下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境覆盖。完整指南：
  [诊断标志](/zh-CN/diagnostics/flags)。

要为插件或自定义 sink 启用诊断事件，而不进行 OTLP 导出：

```json5
{
  diagnostics: { enabled: true },
}
```

要将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关不可达？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并且正在写入
  `logging.file` 中的文件路径。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace` 后重试。

## 相关

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 字段参考
