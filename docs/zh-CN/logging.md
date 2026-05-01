---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志概览
    - 你想配置日志级别、格式或脱敏
    - 你正在进行故障排除，需要快速找到日志
summary: 文件日志、控制台输出、CLI 实时跟踪，以及 Control UI 日志标签页
title: 日志
x-i18n:
    generated_at: "2026-05-01T05:49:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw 有两个主要日志界面：

- **文件日志**（JSON 行），由 Gateway 网关写入。
- **控制台输出**，显示在终端和 Gateway 网关调试 UI 中。

控制 UI 的 **日志** 标签页会跟踪 Gateway 网关文件日志。本页说明日志的存放位置、
如何读取日志，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下位置写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 Gateway 网关主机的本地时区。

每个文件达到 `logging.maxFileBytes`（默认值：100 MB）时会轮转。
OpenClaw 会在活动文件旁最多保留五个带编号的归档，例如
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

## 如何读取日志

### CLI：实时跟踪（推荐）

使用 CLI 通过 RPC 跟踪 Gateway 网关日志文件：

```bash
openclaw logs --follow
```

当前有用的选项：

- `--local-time`：以你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（这里通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、彩色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式 `--url` 时，CLI 不会自动应用配置或
环境凭证；如果目标 Gateway 网关需要认证，请自行包含 `--token`。

在 JSON 模式下，CLI 会发出带 `type` 标记的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：解析后的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行

如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，
或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到
已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用
此回退。

如果 Gateway 网关不可达，CLI 会打印一个简短提示，建议运行：

```bash
openclaw doctor
```

### 控制 UI（Web）

控制 UI 的 **日志** 标签页使用 `logs.tail` 跟踪同一个文件。
请参阅 [/web/control-ui](/zh-CN/web/control-ui) 了解如何打开它。

### 仅渠道日志

要筛选渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和控制 UI 会解析这些
条目，以渲染结构化输出（时间、级别、子系统、消息）。

文件日志 JSONL 记录在可用时还包含可由机器筛选的顶级字段：

- `hostname`：Gateway 网关主机名。
- `message`：用于全文搜索的扁平化日志消息文本。
- `agent_id`：日志调用携带智能体上下文时的活动智能体 ID。
- `session_id`：日志调用携带会话上下文时的活动会话 ID/键。
- `channel`：日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在这些字段旁保留原始结构化日志参数，
因此读取编号 tslog 参数键的现有解析器仍可继续工作。

### 控制台输出

控制台日志**感知 TTY**，并为可读性进行格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还为 RPC 流量提供 WebSocket 协议日志：

- 普通模式：仅记录有意义的结果（错误、解析错误、慢调用）
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
- `logging.consoleLevel`：**控制台**详细级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，为单次运行提高详细程度。你也可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会为该命令覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会更改
文件日志级别。

### 跟踪关联

文件日志是 JSONL。当日志调用携带有效的诊断跟踪上下文时，
OpenClaw 会将跟踪字段写为顶级 JSON 键（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`），以便外部日志处理器可以将该行
与 OTEL span 和提供商 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求
跟踪作用域。在该异步作用域内发出的日志和诊断事件，如果没有传入
显式跟踪上下文，就会继承请求跟踪。智能体运行和模型调用跟踪会成为
活动请求跟踪的子项，因此本地日志、诊断快照、OTEL span，以及可信
提供商 `traceparent` 标头可以通过 `traceId` 联结，而无需记录原始请求或模型内容。

### 模型调用大小和计时

模型调用诊断会记录有界的请求/响应测量值，而不会
捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应事件的 UTF-8 字节大小
- `timeToFirstByteMs`：首个流式响应事件前经过的时间
- `durationMs`：模型调用总持续时间

启用诊断导出时，这些字段可用于诊断快照、模型调用插件钩子，以及
OTEL 模型调用 span/指标。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：对人友好、彩色、带时间戳。
- `compact`：更紧凑的输出（最适合长会话）。
- `json`：每行一个 JSON（供日志处理器使用）。

### 脱敏

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、
OTLP 日志记录、持久化会话转录文本，或控制 UI 工具
事件载荷（工具启动参数、部分/最终结果载荷、派生的
执行输出和补丁摘要）之前对其进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则表达式字符串列表。自定义模式会叠加应用在控制 UI 工具载荷的内置默认值之上，因此添加模式永远不会削弱对已被默认值捕获的值的脱敏。

文件日志和会话转录保持 JSONL，但匹配的密钥值会在行或消息
写入磁盘前被遮盖。脱敏是尽力而为的：
它适用于承载文本的消息内容和日志字符串，而不是每个
标识符或二进制载荷字段。

内置默认值覆盖常见 API 凭证和支付凭证字段名，例如卡号、CVC/CVV、
共享支付令牌，以及作为 JSON 字段、URL 参数、CLI 标志或赋值出现的支付凭证。

`logging.redactSensitive: "off"` 只会禁用这项通用日志/转录
策略。OpenClaw 仍会对可显示给 UI 客户端、支持包、诊断观察者、
审批提示或智能体工具的安全边界载荷进行脱敏。示例包括控制 UI 工具调用事件、`sessions_history` 输出、
诊断支持导出、提供商错误观察、执行审批命令显示，以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns`
仍可在这些界面上添加项目特定模式。

## 诊断与 OpenTelemetry

诊断是用于模型运行和消息流遥测（webhook、排队、会话状态）的结构化、
机器可读事件。它们**不会**取代日志，而是为指标、跟踪和导出器提供输入。
无论是否导出，事件都会在进程内发出。

两个相邻界面：

- **OpenTelemetry 导出** — 通过 OTLP/HTTP 将指标、跟踪和日志发送到
  任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、
  Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、
  指标/span 名称、环境变量和隐私模型位于专门页面：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志** — 定向调试日志标志，可将额外日志路由到
  `logging.file`，而无需提高 `logging.level`。标志不区分大小写，
  并支持通配符（`telegram.*`、`*`）。在 `diagnostics.flags`
  下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境覆盖配置。完整指南：
  [诊断标志](/zh-CN/diagnostics/flags)。

要在不导出 OTLP 的情况下为插件或自定义接收端启用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

对于导出到收集器的 OTLP，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关不可达？** 请先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并写入
  `logging.file` 中的文件路径。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace` 后重试。

## 相关

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整 `diagnostics.*` 字段参考
