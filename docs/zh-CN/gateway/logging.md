---
read_when:
    - 更改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志呈现界面、文件日志、WS 日志样式以及控制台格式化
title: Gateway 网关日志记录
x-i18n:
    generated_at: "2026-04-27T23:11:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 15
---

# 日志记录

如需面向用户的概览（CLI + Control UI + 配置），请参阅 [/logging](/zh-CN/logging)。

OpenClaw 有两个日志“呈现界面”：

- **控制台输出**（你在终端 / Debug UI 中看到的内容）。
- **文件日志**（JSON 行），由 Gateway 网关日志记录器写入。

## 基于文件的日志记录器

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 网关主机的本地时区。
- 活动日志文件会在达到 `logging.maxFileBytes` 时轮转（默认：100 MB），最多保留五个带编号的归档文件，并继续写入一个新的活动文件。
- 日志文件路径和级别可以通过 `~/.openclaw/openclaw.json` 配置：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

Control UI 的日志标签页会通过 Gateway 网关跟踪该文件（`logs.tail`）。
CLI 也可以执行相同操作：

```bash
openclaw logs --follow
```

**详细模式与日志级别**

- **文件日志**仅由 `logging.level` 控制。
- `--verbose` 只影响**控制台详细程度**（以及 WS 日志样式）；它**不会**提高文件日志级别。
- 要在文件日志中捕获仅详细模式可见的细节，请将 `logging.level` 设置为 `debug` 或 `trace`。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace` 并将其写入文件日志，同时仍然输出到 stdout/stderr。

你可以通过以下配置独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 脱敏

OpenClaw 可以在日志或转录输出离开进程之前屏蔽敏感令牌。此日志脱敏策略会应用于控制台、文件日志、OTLP 日志记录以及会话转录文本输出，因此匹配到的密钥值会在 JSONL 行或消息写入磁盘之前被屏蔽。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串数组（覆盖默认值）
  - 使用原始正则表达式字符串（自动添加 `gi`），或者如果你需要自定义标志，可以使用 `/pattern/flags`。
  - 匹配内容会被屏蔽：保留前 6 个字符 + 后 4 个字符（长度 >= 18），否则显示为 `***`。
  - 默认规则涵盖常见的键赋值、CLI 标志、JSON 字段、bearer 标头、PEM 块以及常见令牌前缀。

无论 `logging.redactSensitive` 如何设置，一些安全边界都会始终执行脱敏。
其中包括 Control UI 工具调用事件、`sessions_history` 工具输出、诊断支持导出、提供商错误观测、exec 审批命令显示以及 Gateway 网关 WebSocket 协议日志。这些界面仍可能将 `logging.redactPatterns` 用作附加模式，但 `redactSensitive: "off"` 不会让它们输出原始密钥。

## Gateway 网关 WebSocket 日志

Gateway 网关以两种模式打印 WebSocket 协议日志：

- **普通模式（不使用 `--verbose`）**：只打印“值得关注”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **详细模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持按 Gateway 网关切换样式：

- `--ws-log auto`（默认）：普通模式经过优化；详细模式使用紧凑输出
- `--ws-log compact`：详细模式下使用紧凑输出（配对的请求/响应）
- `--ws-log full`：详细模式下使用完整的逐帧输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# 优化模式（仅错误/慢调用）
openclaw gateway

# 显示所有 WS 流量（配对）
openclaw gateway --verbose --ws-log compact

# 显示所有 WS 流量（完整元数据）
openclaw gateway --verbose --ws-log full
```

## 控制台格式化（子系统日志记录）

控制台格式化器**可感知 TTY**，并打印一致的、带前缀的行。
子系统日志记录器会让输出保持分组且便于快速扫描。

行为：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统固定）以及级别颜色
- **当输出是 TTY 或环境看起来像富终端时显示颜色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），并遵循 `NO_COLOR`
- **缩短的子系统前缀**：去掉前导 `gateway/` + `channels/`，保留最后 2 段（例如 `whatsapp/outbound`）
- **按子系统划分的子日志记录器**（自动前缀 + 结构化字段 `{ subsystem }`）
- **`logRaw()`** 用于 QR/UX 输出（无前缀、无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分离（当 `logging.level` 设置为 `debug`/`trace` 时，文件仍保留完整细节）
- **WhatsApp 消息正文**记录在 `debug` 级别（使用 `--verbose` 可查看）

这样既能保持现有文件日志稳定，又能让交互式输出更便于快速浏览。

## 相关内容

- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)
- [诊断导出](/zh-CN/gateway/diagnostics)
