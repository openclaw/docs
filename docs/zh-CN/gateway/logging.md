---
read_when:
    - 更改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志入口、文件日志、WS 日志样式和控制台格式设置
title: Gateway 网关日志
x-i18n:
    generated_at: "2026-07-05T11:19:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7c689690d10ccdc5eca838e5248a5bf235a595c7498c600760dc71cf5c688eb
    source_path: gateway/logging.md
    workflow: 16
---

# 日志

如需面向用户的概览（CLI + Control UI + 配置），请参阅 [/logging](/zh-CN/logging)。

OpenClaw 有两个日志表面：

- **控制台输出** - 你在终端 / Debug UI 中看到的内容。
- **文件日志** - 由 Gateway 网关日志记录器写入的 JSON 行。

启动时，Gateway 网关会记录解析后的默认 Agent 模型，以及影响新会话的模式默认值：

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 来自默认 Agent、模型参数或全局 Agent 默认值；未设置时显示 `medium`。`fast` 来自默认 Agent 或模型的 `fastMode` 参数。

## 基于文件的日志记录器

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`，日期按 Gateway 网关主机的本地时区确定。如果该目录不安全或不可写（所有者错误、全局可写、符号链接），OpenClaw 会改用按用户限定的 `os.tmpdir()/openclaw-<uid>` 路径；在 Windows 上始终使用该 OS 临时目录回退路径。
- 活跃日志文件会在 `logging.maxFileBytes`（默认：100 MB）处轮转，最多保留五个编号归档（从 `.1` 到 `.5`），并继续写入新的活跃文件。
- 通过 `~/.openclaw/openclaw.json` 配置日志文件路径和级别：`logging.file`、`logging.level`。
- 文件格式为每行一个 JSON 对象。

Talk、实时语音和托管房间代码路径会使用共享文件日志记录器，写入有边界的生命周期记录，用于运维调试和 OTLP 日志导出。转录文本、音频负载、轮次 ID、调用 ID 和提供商条目 ID 绝不会复制到日志记录中。

Control UI 的日志标签页会通过 Gateway 网关（`logs.tail`）追踪该文件。CLI 也会执行相同操作：

```bash
openclaw logs --follow
```

### 详细模式与日志级别

- **文件日志** 仅由 `logging.level` 控制。
- `--verbose` 只影响**控制台详细程度**（以及 WS 日志样式）- 它**不会**提高文件日志级别。
- 要在文件日志中捕获仅详细模式才有的细节，请将 `logging.level` 设置为 `debug` 或 `trace`。
- Trace 日志还包含所选热路径的诊断计时摘要，例如插件工具工厂准备。请参阅 [/tools/plugin#slow-plugin-tool-setup](/zh-CN/tools/plugin#slow-plugin-tool-setup)。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace`，将它们写入文件日志，并仍然打印到 stdout/stderr。

可单独调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`；在 TTY 上默认为 `pretty`，否则为 `compact`）

## 脱敏

OpenClaw 会在日志或转录输出离开进程前遮蔽敏感令牌。此脱敏策略适用于控制台、文件日志、OTLP 日志记录和会话转录文本接收端，因此匹配的密钥值会在 JSONL 行或消息写入磁盘前被遮蔽。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则字符串数组（覆盖默认值）
  - 使用原始正则字符串（自动 `gi`），或使用 `/pattern/flags` 指定自定义标志。
  - 匹配项会保留前 6 个和后 4 个字符并遮蔽其余部分（值长度 >= 18 个字符）；较短值会变为 `***`。
  - 默认值覆盖常见密钥赋值、CLI 标志、JSON 字段、bearer 标头、PEM 块、热门厂商令牌前缀，以及支付凭证字段名（卡号、CVC/CVV、共享支付令牌、支付凭证）。

某些安全边界无论 `logging.redactSensitive` 如何设置都会始终脱敏：Control UI 工具调用事件、`sessions_history` 工具输出、诊断支持导出、提供商错误观测、Exec 审批命令显示，以及 Gateway 网关 WebSocket 协议日志。这些表面仍会遵循 `logging.redactPatterns` 作为附加模式，但 `redactSensitive: "off"` 不会让它们发出原始密钥。

## Gateway 网关 WebSocket 日志

Gateway 网关会以两种模式打印 WebSocket 协议日志：

- **普通模式（无 `--verbose`）**：仅打印“有关注价值”的 RPC 结果 - 错误（`ok=false`）、慢调用（默认阈值：`>= 50ms`）和解析错误。
- **详细模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持按 Gateway 网关设置样式开关：

- `--ws-log auto`（默认）：普通模式经过优化；详细模式使用紧凑输出。
- `--ws-log compact`：详细模式下使用紧凑输出（成对的请求/响应）。
- `--ws-log full`：详细模式下使用完整的逐帧输出。
- `--compact`：`--ws-log compact` 的别名。

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 控制台格式化（子系统日志）

控制台格式化器**感知 TTY**，并打印一致的带前缀行。子系统日志记录器会让输出保持分组且易于扫描：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）。
- **子系统颜色**（每个子系统稳定，按名称哈希）以及级别颜色。
- 当输出为 TTY，或环境看起来像富终端（`TERM`/`COLORTERM`/`TERM_PROGRAM`）时使用**颜色**；遵循 `NO_COLOR` 和 `FORCE_COLOR`。
- **缩短的子系统前缀**：删除开头的 `gateway/`、`channels/` 或 `providers/` 段，然后最多保留剩余部分的最后 2 段（例如 `channels/turn/kernel` 显示为 `turn/kernel`）。已知频道子系统（`telegram`、`whatsapp`、`slack` 等）始终折叠为频道名称本身。
- **按子系统划分的子日志记录器**（自动前缀 + 结构化字段 `{ subsystem }`）。
- **`logRaw()`** 用于 QR/UX 输出（无前缀、无格式化）。
- **控制台样式**：`pretty` | `compact` | `json`。
- **控制台日志级别** 与文件日志级别分离（当 `logging.level` 为 `debug`/`trace` 时，文件会保留完整细节）。
- **WhatsApp 消息正文** 以 `debug` 级别记录（使用 `--verbose` 查看）。

这会让文件日志保持稳定，同时使交互式输出易于扫描。

## 相关

- [日志](/zh-CN/logging)
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)
- [诊断导出](/zh-CN/gateway/diagnostics)
