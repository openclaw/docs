---
read_when:
    - 你需要有针对性的调试日志，而不提高全局日志级别
    - 你需要捕获特定子系统的日志以便支持
summary: 用于定向调试日志的诊断标志
title: 诊断标志
x-i18n:
    generated_at: "2026-07-05T11:16:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

诊断标志会为某个子系统开启额外日志，而不会全局提高
`logging.level`。除非子系统检查某个标志，否则该标志不会产生效果。

## 工作原理

- 标志是不区分大小写的字符串，从配置中的 `diagnostics.flags`
  加上 `OPENCLAW_DIAGNOSTICS` 环境变量覆盖值解析而来，去重并转为小写。
- `name.*` 会匹配 `name` 本身以及 `name.` 下的所有内容（例如
  `telegram.*` 会匹配 `telegram.http`）。
- `*` 或 `all` 会启用所有标志。
- 在配置中更改 `diagnostics.flags` 后，请重启 Gateway 网关；它不会
  热重载。

## 已知标志

| 标志             | 启用内容                                                  |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP 错误日志                            |
| `brave.http`     | Brave Search 请求/响应/缓存日志                           |
| `profiler`       | 回复阶段 profiler 和 Codex app-server profiler（两者）    |
| `reply.profiler` | 仅回复阶段 profiler                                       |
| `codex.profiler` | 仅 Codex app-server profiler                              |
| `timeline`       | 结构化 JSONL 时间线制品（见下文）                         |

## 通过配置启用

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

多个标志：

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## 环境变量覆盖（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

值按逗号或空白字符分割。特殊值：

| 值                          | 效果                                     |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | 禁用所有标志，也会覆盖配置               |
| `1`, `true`, `all`, `*`     | 启用所有标志                             |

`OPENCLAW_DIAGNOSTICS=0` 会为该进程禁用来自环境变量和配置的标志，
适合在不编辑文件的情况下临时静默配置中遗留开启的 profiler 标志。

## Profiler 标志

Profiler 标志会控制轻量级计时跨度；关闭时不会增加开销。

为一次 Gateway 网关运行启用所有受 profiler 控制的跨度：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

仅启用回复分发 profiler 跨度：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

仅启用 Codex app-server 启动/工具/线程 profiler 跨度：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` 会同时启用回复 profiler 和 Codex profiler；使用带作用域的
标志名称可只启用其中一个。

也可以在配置中设置：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

更改配置标志后请重启 Gateway 网关。要禁用 profiler 标志，请将其从
`diagnostics.flags` 中移除并重启，或使用 `OPENCLAW_DIAGNOSTICS=0`
启动进程，以覆盖该次运行的所有诊断标志。

## 时间线制品

`timeline` 标志（别名：`diagnostics.timeline`）会以 JSONL 写入结构化启动
和运行时计时事件，供外部 QA harness 使用：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

也可以在配置中启用：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

输出路径始终来自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`，即使标志本身是在
配置中设置的；路径没有对应的配置键。当 `timeline` 仅从配置启用时，
最早的配置加载跨度会缺失，因为 OpenClaw 当时尚未读取配置；后续启动跨度
会正常捕获。

`OPENCLAW_DIAGNOSTICS=1`、`=all` 和 `=*` 也会启用时间线，因为它们会
启用所有标志。当你只需要 JSONL 制品而不需要所有其他诊断标志时，优先使用
带作用域的 `timeline` 标志。

时间线中的事件循环延迟样本需要在 `timeline` 之外再显式开启：
在启用时间线的基础上设置 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`
（或 `on`/`true`/`yes`）。

时间线记录使用 `openclaw.diagnostics.v1` 信封，并且可以包含进程 ID、
阶段名称、跨度名称、持续时间、插件 ID、依赖项数量、事件循环延迟样本、
提供商操作名称、子进程退出状态，以及启动错误名称/消息。请将时间线文件
视为本地诊断制品；在你的机器之外共享前请先审阅。

## 日志位置

标志会将日志写入标准诊断日志文件。默认位置：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果设置了 `logging.file`，则改用该路径。日志为 JSONL（每行一个 JSON
对象）。仍会根据 `logging.redactSensitive` 应用脱敏。完整的日志路径解析、
轮转和脱敏模型请参阅 [日志](/zh-CN/logging)。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

过滤 Telegram HTTP 诊断：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

过滤 Brave Search HTTP 诊断：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

或在复现时 tail：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway 网关，请改用 `openclaw logs --follow`（参见
[/cli/logs](/zh-CN/cli/logs)）。

## 说明

- 如果 `logging.level` 设置得高于 `warn`，受标志控制的日志可能会被
  抑制。默认的 `info` 没问题。
- `brave.http` 会记录 Brave Search 请求 URL/查询参数、响应
  状态/计时，以及缓存命中/未命中/写入事件。它不会记录 API key
  （作为请求头发送）或响应正文，但搜索查询可能包含敏感信息。
- 标志可以安全地保持启用；它们只会影响特定子系统的日志量。
- 使用 [/logging](/zh-CN/logging) 更改日志目标、级别和脱敏。

## 相关内容

- [Gateway 诊断](/zh-CN/gateway/diagnostics)
- [Gateway 故障排查](/zh-CN/gateway/troubleshooting)
