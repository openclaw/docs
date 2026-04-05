---
read_when:
    - 修改日志输出或格式
    - 调试 CLI 或 Gateway 网关输出
summary: 日志表面、文件日志、WS 日志样式和控制台格式
title: Gateway 网关日志
x-i18n:
    generated_at: "2026-04-05T08:23:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# 日志

有关面向用户的概览（CLI + Control UI + 配置），请参见 [/logging](/logging)。

OpenClaw 有两个日志“表面”：

- **控制台输出**（你在终端 / Debug UI 中看到的内容）。
- **文件日志**（JSON Lines），由 Gateway 网关日志记录器写入。

## 基于文件的日志记录器

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 网关主机的本地时区。
- 可以通过 `~/.openclaw/openclaw.json` 配置日志文件路径和级别：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

Control UI 的 Logs 标签页会通过 Gateway 网关尾随此文件（`logs.tail`）。
CLI 也可以这样做：

```bash
openclaw logs --follow
```

**详细模式与日志级别**

- **文件日志** 只由 `logging.level` 控制。
- `--verbose` 仅影响**控制台详细程度**（以及 WS 日志样式）；它**不会**
  提高文件日志级别。
- 若要在文件日志中捕获仅详细模式下显示的内容，请将 `logging.level` 设为 `debug` 或
  `trace`。

## 控制台捕获

CLI 会捕获 `console.log/info/warn/error/debug/trace`，并将其写入文件日志，
同时仍打印到 stdout / stderr。

你可以通过以下配置独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 工具摘要脱敏

详细工具摘要（例如 `🛠️ Exec: ...`）可以在进入控制台流之前屏蔽敏感 token。这**仅适用于工具**，不会更改文件日志。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则字符串数组（覆盖默认值）
  - 使用原始正则字符串（自动附加 `gi`），或者在需要自定义 flags 时使用 `/pattern/flags`。
  - 匹配内容会被屏蔽：保留前 6 个 + 后 4 个字符（长度 >= 18），否则显示为 `***`。
  - 默认规则涵盖常见的 key 赋值、CLI flags、JSON 字段、bearer 头、PEM 块以及常见 token 前缀。

## Gateway 网关 WebSocket 日志

Gateway 网关会以两种模式打印 WebSocket 协议日志：

- **普通模式（不带 `--verbose`）**：只打印“值得关注”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **详细模式（`--verbose`）**：打印所有 WS 请求 / 响应流量。

### WS 日志样式

`openclaw gateway` 支持按 Gateway 网关设置样式切换：

- `--ws-log auto`（默认）：普通模式下使用优化输出；详细模式下使用紧凑输出
- `--ws-log compact`：详细模式下使用紧凑输出（成对的请求 / 响应）
- `--ws-log full`：详细模式下使用完整逐帧输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# 优化输出（仅错误 / 慢调用）
openclaw gateway

# 显示所有 WS 流量（成对）
openclaw gateway --verbose --ws-log compact

# 显示所有 WS 流量（完整元数据）
openclaw gateway --verbose --ws-log full
```

## 控制台格式（子系统日志）

控制台格式化器是**TTY 感知的**，会打印一致且带前缀的行。
子系统日志记录器会让输出保持分组且便于快速浏览。

行为：

- 每行都有**子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统稳定不变）以及级别着色
- **当输出是 TTY 或环境看起来像富终端时启用颜色**（`TERM` / `COLORTERM` / `TERM_PROGRAM`），并遵循 `NO_COLOR`
- **缩短的子系统前缀**：去掉前导 `gateway/` + `channels/`，保留最后 2 段（例如 `whatsapp/outbound`）
- **按子系统划分的子日志记录器**（自动添加前缀 + 结构化字段 `{ subsystem }`）
- 用于 QR / UX 输出的 **`logRaw()`**（无前缀、无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别** 与文件日志级别分离（当 `logging.level` 设为 `debug` / `trace` 时，文件仍保留完整细节）
- **WhatsApp 消息正文** 记录在 `debug` 级别（使用 `--verbose` 可查看）

这样既能保持现有文件日志稳定，又能让交互式输出更便于快速浏览。
