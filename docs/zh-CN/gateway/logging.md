---
read_when:
    - 更改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志记录界面、文件日志、WS 日志样式和控制台格式
title: Gateway 网关日志记录
x-i18n:
    generated_at: "2026-05-01T22:18:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# 日志

有关面向用户的概览（CLI + 控制 UI + 配置），请参阅 [/logging](/zh-CN/logging)。

OpenClaw 有两个日志“表面”：

- **控制台输出**（你在终端 / Debug UI 中看到的内容）。
- **文件日志**（JSON 行），由 Gateway 网关 logger 写入。

## 基于文件的 logger

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 网关主机的本地时区。
- 活跃日志文件会在达到 `logging.maxFileBytes` 时轮转（默认：100 MB），最多保留五个编号归档，并继续写入新的活跃文件。
- 日志文件路径和级别可以通过 `~/.openclaw/openclaw.json` 配置：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

控制 UI 的日志标签页会通过 Gateway 网关跟踪此文件（`logs.tail`）。
CLI 也可以执行相同操作：

```bash
openclaw logs --follow
```

**详细模式与日志级别**

- **文件日志**完全由 `logging.level` 控制。
- `--verbose` 只影响**控制台详细程度**（以及 WS 日志样式）；它**不会**提高文件日志级别。
- 要在文件日志中捕获仅详细模式显示的细节，请将 `logging.level` 设为 `debug` 或 `trace`。
- Trace 日志还会包含所选热点路径的诊断计时摘要，例如插件工具工厂准备。请参阅 [/tools/plugin#slow-plugin-tool-setup](/zh-CN/tools/plugin#slow-plugin-tool-setup)。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace` 并将其写入文件日志，同时仍会打印到 stdout/stderr。

你可以通过以下配置独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 脱敏

OpenClaw 可以在日志或转录输出离开进程前遮蔽敏感令牌。此日志脱敏策略会应用于控制台、文件日志、OTLP 日志记录和会话转录文本输出端，因此匹配的 secret 值会在 JSONL 行或消息写入磁盘前被遮蔽。

- `logging.redactSensitive`: `off` | `tools`（默认：`tools`）
- `logging.redactPatterns`: 正则字符串数组（覆盖默认值）
  - 使用原始正则字符串（自动 `gi`），或者在需要自定义 flags 时使用 `/pattern/flags`。
  - 匹配项会通过保留前 6 个字符 + 后 4 个字符来遮蔽（长度 >= 18），否则为 `***`。
  - 默认值覆盖常见键赋值、CLI flags、JSON 字段、bearer headers、PEM blocks、常见 token prefixes，以及支付凭据字段名称，例如卡号、CVC/CVV、共享支付令牌和支付凭据。

某些安全边界始终会脱敏，不受 `logging.redactSensitive` 影响。
这包括控制 UI 工具调用事件、`sessions_history` 工具输出、诊断支持导出、提供商错误观测、exec 审批命令显示，以及 Gateway 网关 WebSocket 协议日志。这些表面仍可使用 `logging.redactPatterns` 作为额外模式，但 `redactSensitive: "off"` 不会让它们发出原始 secret。

## Gateway 网关 WebSocket 日志

Gateway 网关会以两种模式打印 WebSocket 协议日志：

- **普通模式（无 `--verbose`）**：只打印“值得关注”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **详细模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持每个 Gateway 网关的样式开关：

- `--ws-log auto`（默认）：普通模式经过优化；详细模式使用紧凑输出
- `--ws-log compact`：详细模式下使用紧凑输出（成对请求/响应）
- `--ws-log full`：详细模式下使用完整的逐帧输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 控制台格式化（子系统日志）

控制台 formatter **感知 TTY**，并打印一致的带前缀行。
子系统 logger 会让输出保持分组且易于浏览。

行为：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统稳定）以及级别着色
- **当输出是 TTY 或环境看起来像富终端时启用颜色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），并遵循 `NO_COLOR`
- **缩短的子系统前缀**：删除开头的 `gateway/` + `channels/`，保留最后 2 段（例如 `whatsapp/outbound`）
- **按子系统划分的子 logger**（自动前缀 + 结构化字段 `{ subsystem }`）
- **`logRaw()`** 用于 QR/UX 输出（无前缀、无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分离（当 `logging.level` 设为 `debug`/`trace` 时，文件会保留完整细节）
- **WhatsApp 消息正文**会以 `debug` 记录（使用 `--verbose` 查看）

这会保持现有文件日志稳定，同时让交互式输出易于浏览。

## 相关

- [日志](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)
- [诊断导出](/zh-CN/gateway/diagnostics)
