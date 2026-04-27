---
read_when:
    - 你需要一份面向初学者的 OpenClaw 日志概览
    - 你想要配置日志级别、格式或脱敏处理
    - 你正在进行故障排除，需要快速找到日志
summary: 文件日志、控制台输出、CLI 尾随输出以及 Control UI 的“日志”标签页
title: 日志
x-i18n:
    generated_at: "2026-04-27T22:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c6f0e325540e6daca228a2e9cc6c032ccc27a3c2a38be13a29e87a6a1227081
    source_path: logging.md
    workflow: 15
---

OpenClaw 有两个主要的日志展示面：

- 由 Gateway 网关写入的**文件日志**（JSON 行）。
- 在终端和 Gateway 网关调试 UI 中显示的**控制台输出**。

Control UI 的**日志**标签页会尾随显示 gateway 文件日志。本页说明日志位于哪里、如何读取，以及如何配置日志级别和格式。

## 日志存放位置

默认情况下，Gateway 网关会在以下路径写入滚动日志文件：

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日期使用 gateway 主机的本地时区。

每个文件在达到 `logging.maxFileBytes`（默认：100 MB）时会轮转。OpenClaw 会在活动文件旁保留最多五个带编号的归档文件，例如 `openclaw-YYYY-MM-DD.1.log`，并继续写入一个新的活动日志文件，而不是抑制诊断信息。

你可以在 `~/.openclaw/openclaw.json` 中覆盖此设置：

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 如何读取日志

### CLI：实时尾随（推荐）

使用 CLI 通过 RPC 尾随 gateway 日志文件：

```bash
openclaw logs --follow
```

当前常用选项：

- `--local-time`：以你的本地时区显示时间戳
- `--url <url>` / `--token <token>` / `--timeout <ms>`：标准 Gateway 网关 RPC 标志
- `--expect-final`：由智能体支持的 RPC 最终响应等待标志（此处通过共享客户端层接受）

输出模式：

- **TTY 会话**：美观、带颜色、结构化的日志行。
- **非 TTY 会话**：纯文本。
- `--json`：按行分隔的 JSON（每行一个日志事件）。
- `--plain`：在 TTY 会话中强制使用纯文本。
- `--no-color`：禁用 ANSI 颜色。

当你显式传入 `--url` 时，CLI 不会自动应用配置或环境变量中的凭证；如果目标 Gateway 网关需要认证，请自行附带 `--token`。

在 JSON 模式下，CLI 会输出带有 `type` 标签的对象：

- `meta`：流元数据（文件、游标、大小）
- `log`：已解析的日志条目
- `notice`：截断 / 轮转提示
- `raw`：未解析的日志行

如果本地 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式 `--url` 目标不会使用此回退机制。

如果 Gateway 网关不可达，CLI 会输出一条简短提示，建议运行：

```bash
openclaw doctor
```

### Control UI（网页）

Control UI 的**日志**标签页会使用 `logs.tail` 尾随同一个文件。有关如何打开它，请参阅 [/web/control-ui](/zh-CN/web/control-ui)。

### 仅渠道日志

要筛选渠道活动（WhatsApp/Telegram 等），请使用：

```bash
openclaw channels logs --channel whatsapp
```

## 日志格式

### 文件日志（JSONL）

日志文件中的每一行都是一个 JSON 对象。CLI 和 Control UI 会解析这些条目，以渲染结构化输出（时间、级别、子系统、消息）。

文件日志的 JSONL 记录在可用时还包含便于机器过滤的顶级字段：

- `hostname`：gateway 主机名。
- `message`：扁平化的日志消息文本，用于全文检索。
- `agent_id`：当日志调用携带智能体上下文时的活动智能体 id。
- `session_id`：当日志调用携带会话上下文时的活动会话 id/key。
- `channel`：当日志调用携带渠道上下文时的活动渠道。

OpenClaw 会在保留这些字段的同时保留原始结构化日志参数，因此现有读取带编号 `tslog` 参数键的解析器仍然可以正常工作。

### 控制台输出

控制台日志**会感知 TTY**，并针对可读性进行格式化：

- 子系统前缀（例如 `gateway/channels/whatsapp`）
- 级别着色（info/warn/error）
- 可选的紧凑或 JSON 模式

控制台格式由 `logging.consoleStyle` 控制。

### Gateway 网关 WebSocket 日志

`openclaw gateway` 还提供用于 RPC 流量的 WebSocket 协议日志：

- 普通模式：仅记录重要结果（错误、解析错误、慢调用）
- `--verbose`：记录所有请求/响应流量
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

你可以通过 **`OPENCLAW_LOG_LEVEL`** 环境变量覆盖这两个设置（例如 `OPENCLAW_LOG_LEVEL=debug`）。该环境变量优先于配置文件，因此你可以在不编辑 `openclaw.json` 的情况下，仅针对单次运行提高详细程度。你还可以传入全局 CLI 选项 **`--log-level <level>`**（例如 `openclaw --log-level debug gateway run`），它会在该命令中覆盖环境变量。

`--verbose` 仅影响控制台输出和 WS 日志详细程度；它不会更改文件日志级别。

### 跟踪关联

文件日志采用 JSONL 格式。当一次日志调用携带有效的诊断跟踪上下文时，OpenClaw 会将跟踪字段写为顶级 JSON 键（`traceId`、`spanId`、`parentSpanId`、`traceFlags`），以便外部日志处理器将该行与 OTEL span 以及提供商的 `traceparent` 传播关联起来。

Gateway 网关 HTTP 请求和 Gateway 网关 WebSocket 帧会建立内部请求跟踪作用域。在该异步作用域内发出的日志和诊断事件，如果未显式传入跟踪上下文，就会继承该请求跟踪。智能体运行和模型调用跟踪会成为当前请求跟踪的子级，因此本地日志、诊断快照、OTEL span 以及受信任提供商的 `traceparent` 标头都可以通过 `traceId` 关联，而无需记录原始请求或模型内容。

### 模型调用大小与耗时

模型调用诊断会记录有界的请求/响应测量值，而不会捕获原始提示词或响应内容：

- `requestPayloadBytes`：最终模型请求载荷的 UTF-8 字节大小
- `responseStreamBytes`：流式模型响应事件的 UTF-8 字节大小
- `timeToFirstByteMs`：收到第一个流式响应事件前的耗时
- `durationMs`：模型调用总时长

启用诊断导出时，这些字段可用于诊断快照、模型调用插件钩子以及 OTEL 模型调用 span/指标。

### 控制台样式

`logging.consoleStyle`：

- `pretty`：适合人类阅读，带颜色并包含时间戳。
- `compact`：更紧凑的输出（最适合长时间会话）。
- `json`：每行一个 JSON（适用于日志处理器）。

### 脱敏

OpenClaw 可以在敏感令牌进入控制台输出、文件日志、OTLP 日志记录、持久化的会话转录文本或 Control UI 工具事件载荷（工具启动参数、部分/最终结果载荷、派生的执行输出和补丁摘要）之前对其进行脱敏：

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：用于覆盖默认集合的正则字符串列表。自定义模式会叠加到 Control UI 工具载荷的内置默认模式之上，因此添加模式绝不会削弱对那些已被默认规则捕获值的脱敏效果。

文件日志和会话转录仍然保持 JSONL 格式，但在将行或消息写入磁盘之前，匹配的密钥值会被掩码处理。脱敏是尽力而为的：它适用于承载文本的消息内容和日志字符串，而不是每一个标识符或二进制载荷字段。

## 诊断与 OpenTelemetry

诊断是针对模型运行和消息流遥测（webhook、排队、会话状态）的结构化、机器可读事件。它们**不会**替代日志——而是为指标、跟踪和导出器提供数据。无论你是否导出，这些事件都会在进程内发出。

相邻的两个展示面：

- **OpenTelemetry 导出**——通过 OTLP/HTTP 将指标、跟踪和日志发送到任何兼容 OpenTelemetry 的收集器或后端（Grafana、Datadog、Honeycomb、New Relic、Tempo 等）。完整配置、信号目录、指标 / span 名称、环境变量以及隐私模型位于专门页面中：
  [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- **诊断标志**——将额外日志定向写入 `logging.file` 的定向调试日志标志，而无需提高 `logging.level`。标志不区分大小写，并支持通配符（`telegram.*`、`*`）。可在 `diagnostics.flags` 下配置，或通过 `OPENCLAW_DIAGNOSTICS=...` 环境变量覆盖。完整指南：
  [诊断标志](/zh-CN/diagnostics/flags)。

要在不启用 OTLP 导出的情况下，为插件或自定义接收端启用诊断事件：

```json5
{
  diagnostics: { enabled: true },
}
```

如需将 OTLP 导出到收集器，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 故障排除提示

- **Gateway 网关无法访问？** 先运行 `openclaw doctor`。
- **日志为空？** 检查 Gateway 网关是否正在运行，并且是否正在向 `logging.file` 中的文件路径写入。
- **需要更多细节？** 将 `logging.level` 设为 `debug` 或 `trace` 后重试。

## 相关内容

- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — OTLP/HTTP 导出、指标 / span 目录、隐私模型
- [诊断标志](/zh-CN/diagnostics/flags) — 定向调试日志标志
- [Gateway 网关日志内部机制](/zh-CN/gateway/logging) — WS 日志样式、子系统前缀和控制台捕获
- [配置参考](/zh-CN/gateway/configuration-reference#diagnostics) — 完整的 `diagnostics.*` 字段参考
