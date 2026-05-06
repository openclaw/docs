---
read_when:
    - 更改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志输出面、文件日志、WS 日志样式和控制台格式化
title: Gateway 网关日志记录
x-i18n:
    generated_at: "2026-05-06T05:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# 日志记录

如需面向用户的概览（CLI + Control UI + 配置），请参见 [/logging](/zh-CN/logging)。

OpenClaw 有两个日志“界面”：

- **控制台输出**（你在终端 / Debug UI 中看到的内容）。
- **文件日志**（JSON 行），由 Gateway 网关日志记录器写入。

启动时，Gateway 网关会记录解析后的默认 agent 模型，以及影响新会话的模式默认值，例如：

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 来自默认 agent、模型参数或全局 agent 默认值；未设置时，启动摘要会显示 `medium`。`fast` 来自默认 agent 或模型 `fastMode` 参数。

## 基于文件的日志记录器

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 网关主机的本地时区。
- 活跃日志文件会在达到 `logging.maxFileBytes` 时轮转（默认：100 MB），最多保留五个编号归档，并继续写入新的活跃文件。
- 可以通过 `~/.openclaw/openclaw.json` 配置日志文件路径和级别：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

Control UI 的 Logs 标签页通过 Gateway 网关跟踪此文件（`logs.tail`）。CLI 也可以执行相同操作：

```bash
openclaw logs --follow
```

**Verbose 与日志级别**

- **文件日志**完全由 `logging.level` 控制。
- `--verbose` 只影响**控制台详细程度**（以及 WS 日志样式）；它**不会**提高文件日志级别。
- 若要在文件日志中捕获仅 verbose 模式下的详细信息，请将 `logging.level` 设置为 `debug` 或 `trace`。
- Trace 日志还会包含所选热点路径的诊断计时摘要，例如插件工具工厂准备。请参见 [/tools/plugin#slow-plugin-tool-setup](/zh-CN/tools/plugin#slow-plugin-tool-setup)。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace` 并将其写入文件日志，同时仍然打印到 stdout/stderr。

你可以通过以下配置独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 脱敏

OpenClaw 可以在日志或转录输出离开进程之前屏蔽敏感令牌。此日志脱敏策略会应用到控制台、文件日志、OTLP 日志记录和会话转录文本输出端，因此匹配的密钥值会在 JSONL 行或消息写入磁盘之前被屏蔽。

- `logging.redactSensitive`: `off` | `tools`（默认：`tools`）
- `logging.redactPatterns`: 正则表达式字符串数组（覆盖默认值）
  - 使用原始正则表达式字符串（自动 `gi`），如果需要自定义标志，也可以使用 `/pattern/flags`。
  - 匹配项会通过保留前 6 个字符 + 后 4 个字符进行屏蔽（长度 >= 18），否则为 `***`。
  - 默认值覆盖常见密钥赋值、CLI 标志、JSON 字段、bearer 头、PEM 块、常见令牌前缀，以及银行卡号、CVC/CVV、共享支付令牌和支付凭证等支付凭证字段名称。

某些安全边界始终会脱敏，不受 `logging.redactSensitive` 影响。这包括 Control UI 工具调用事件、`sessions_history` 工具输出、诊断支持导出、提供商错误观察、exec 审批命令显示，以及 Gateway 网关 WebSocket 协议日志。这些界面仍可使用 `logging.redactPatterns` 作为附加模式，但 `redactSensitive: "off"` 不会让它们输出原始密钥。

## Gateway 网关 WebSocket 日志

Gateway 网关会以两种模式打印 WebSocket 协议日志：

- **普通模式（无 `--verbose`）**：只打印“有意义”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **Verbose 模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持按 Gateway 网关设置样式开关：

- `--ws-log auto`（默认）：普通模式经过优化；verbose 模式使用紧凑输出
- `--ws-log compact`：verbose 时使用紧凑输出（配对的请求/响应）
- `--ws-log full`：verbose 时使用完整的逐帧输出
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

## 控制台格式化（子系统日志记录）

控制台格式化器**感知 TTY**，并打印一致的带前缀行。子系统日志记录器会让输出保持分组且易于浏览。

行为：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统稳定）加上级别着色
- **当输出为 TTY 或环境看起来像富终端时启用颜色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），并遵循 `NO_COLOR`
- **缩短的子系统前缀**：删除开头的 `gateway/` + `channels/`，保留最后 2 个片段（例如 `whatsapp/outbound`）
- **按子系统划分的子日志记录器**（自动前缀 + 结构化字段 `{ subsystem }`）
- **`logRaw()`** 用于 QR/UX 输出（无前缀、无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分离（当 `logging.level` 设置为 `debug`/`trace` 时，文件会保留完整细节）
- **WhatsApp 消息正文**以 `debug` 级别记录（使用 `--verbose` 查看）

这会在保持现有文件日志稳定的同时，让交互式输出易于浏览。

## 相关内容

- [日志记录](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)
- [诊断导出](/zh-CN/gateway/diagnostics)
