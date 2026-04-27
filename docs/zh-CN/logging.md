---
read_when:
    - 你需要一份适合初学者的 OpenClaw 日志记录概览
    - 你想要配置日志级别、格式或脱敏规则
    - 你正在进行故障排除，需要快速找到日志
summary: 文件日志、控制台输出、CLI 跟踪，以及 Control UI 日志标签页
title: 日志记录
x-i18n:
    generated_at: "2026-04-27T23:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15be49c23b42fbd0c78c6c41d8154fd6a12acfc5be7ddd29387be6bb158b12bd
    source_path: logging.md
    workflow: 15
---

OpenClaw 有两个主要的日志呈现界面：

- **文件日志**（JSON 行），由 Gateway 网关写入。
- **控制台输出**，显示在终端和 Gateway 网关 Debug UI 中。

Control UI 的**日志**标签页会跟踪 gateway 文件日志。本页说明日志位于哪里、如何读取它们，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会将滚动日志文件写入：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主机的本地时区。

每个文件在达到 `logging.maxFileBytes` 时轮转（默认：100 MB）。
OpenClaw 会在活动文件旁边最多保留五个带编号的归档文件，例如
`openclaw-YYYY-MM-DD.1.log`，并继续写入新的活动日志，而不是停止记录诊断信息。

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

使用 CLI 通过 RPC 跟踪 gateway 日志文件：

```bash
openclaw logs --follow
```

当前常用选项：

- `--local-time`：使用你的本地时区渲染时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（通过共享客户端层在此处接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你传入显式 `--url` 时，CLI 不会自动应用配置或环境凭证；如果目标 Gateway 网关需要认证，请自行包含 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标签的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的原始日志行

如果本地 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式 `--url` 目标不会使用此回退。

如果 Gateway 网关不可达，CLI 会打印一个简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的**日志**标签页使用 `logs.tail` 跟踪同一个文件。
如何打开它，请参阅 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

要筛选渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以呈现结构化输出（时间、级别、子系统、消息）。

文件日志 JSONL 记录在可用时还包含可供机器筛选的顶层字段：

- `hostname`：gateway 主机名。
- `message`：扁平化的日志消息文本，用于全文搜索。
- `agent_id`：当日志调用携带智能体上下文时的活动智能体 id。
- `session_id`：当日志调用携带会话上下文时的活动会话 id/key。
- `channel`：当日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在这些字段旁边保留原始结构化日志参数，因此现有读取带编号 tslog 参数键的解析器仍可继续工作。

### 控制台输出

控制台日志**可感知 TTY**，并针对可读性进行了格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别颜色（info/warn/error）
- 可选的紧凑模式或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅记录值得关注的结果（错误、解析错误、慢调用）
- `--verbose`：记录所有请求/响应流量
- `--ws-log auto|compact|full`：选择详细模式的渲染样式
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
- `logging.consoleLevel`：**控制台**详细级别。

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两者（例如 `OPENCLAW_LOG_LEVEL=debug`）。该环境变量优先于配置文件，因此你可以在单次运行时提高详细级别，而无需编辑 `openclaw.json`。你也可以传递全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会在该命令中覆盖环境变量。

`--verbose` 只影响控制台输出和 WS 日志详细程度；它不会改变文件日志级别。

### 跟踪关联

文件日志是 JSONL。当某次日志调用携带有效的诊断跟踪上下文时，
OpenClaw 会将跟踪字段写为顶层 JSON 键（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`），以便外部日志处理器将该行与 OTEL spans 和提供商 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求跟踪作用域。在该异步作用域内发出的日志和诊断事件，如果未显式传入跟踪上下文，则会继承该请求跟踪。智能体运行和模型调用跟踪会成为当前请求跟踪的子级，因此本地日志、诊断快照、OTEL spans 以及受信任提供商的 `traceparent` 标头都可以通过 `traceId` 关联，而无需记录原始请求或模型内容。

### 模型调用大小和时序

模型调用诊断会记录有边界的请求/响应测量数据，而不会捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求负载的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应事件的 UTF-8 字节大小
- `timeToFirstByteMs`：第一个流式响应事件出现前的耗时
- `durationMs`：模型调用总耗时

启用诊断导出后，这些字段可用于诊断快照、模型调用插件钩子以及 OTEL 模型调用 spans/metrics。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人类阅读，带颜色和时间戳。
- `compact`：输出更紧凑（最适合长时间会话）。
- `json`：每行一个 JSON（适用于日志处理器）。

### 脱敏

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、
OTLP 日志记录、持久化的会话转录文本或 Control UI 工具
事件负载（工具启动参数、部分/最终结果负载、派生的
exec 输出以及补丁摘要）之前对其进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串列表，用于覆盖默认集合。对于 Control UI 工具负载，自定义模式会叠加应用于内置默认模式之上，因此添加模式永远不会削弱对已被默认规则捕获值的脱敏效果。

文件日志和会话转录仍然保持为 JSONL，但匹配到的密钥值会在行或消息写入磁盘之前被屏蔽。脱敏是尽力而为的：它适用于承载文本的消息内容和日志字符串，而不是每一个标识符或二进制负载字段。

`logging.redactSensitive: "off"` 只会禁用这一通用日志/转录
策略。OpenClaw 仍会对可能展示给 UI 客户端、
支持包、诊断观察器、审批提示或智能体工具的安全边界负载执行脱敏。示例包括 Control UI 工具调用事件、`sessions_history` 输出、
诊断支持导出、提供商错误观测、exec 审批命令显示以及 Gateway 网关 WebSocket 协议日志。自定义 `logging.redactPatterns`
仍可在这些界面上添加项目特定模式。

## Diagnostics 和 OpenTelemetry

Diagnostics 是面向模型运行和
消息流遥测（webhooks、排队、会话状态）的结构化、机器可读事件。它们**不会**
替代日志——而是为指标、跟踪和导出器提供数据。无论你是否导出它们，事件都会在进程内发出。

两个相邻界面：

- **OpenTelemetry 导出**——通过 OTLP/HTTP 将指标、跟踪和日志发送到
  任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、
  Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、
  指标/span 名称、环境变量以及隐私模型位于专门页面：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志**——有针对性的调试日志标志，会将额外日志路由到
  `logging.file`，而无需提高 `logging.level`。标志不区分大小写，
  并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags`
  下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南：
  [诊断标志](/zh-CN/diagnostics/flags)。

要在不启用 OTLP 导出的情况下，为插件或自定义输出启用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

要将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并且正在向
  `logging.file` 中的文件路径写入。
- **需要更多细节？** 将 `logging.level` 设置为 `debug` 或 `trace`，然后重试。

## 相关内容

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标/span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 有针对性的调试日志标志
- [Gateway 网关日志记录内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
