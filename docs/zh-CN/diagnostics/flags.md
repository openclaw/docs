---
read_when:
    - 你需要有针对性的调试日志，而不提高全局日志级别
    - 你需要为支持工作捕获特定子系统的日志
summary: 用于定向调试日志的诊断标志
title: 诊断标志
x-i18n:
    generated_at: "2026-06-27T01:56:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

诊断标志让你可以启用有针对性的调试日志，而不必在所有地方开启详细日志。标志是选择启用的，除非子系统检查它们，否则没有任何效果。

## 工作原理

- 标志是字符串（不区分大小写）。
- 你可以在配置中启用标志，也可以通过环境变量覆盖启用。
- 支持通配符：
  - `telegram.*` 匹配 `telegram.http`
  - `*` 启用所有标志

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

更改标志后重启 Gateway 网关。

## 环境变量覆盖（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

禁用所有标志：

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` 是进程级禁用覆盖：它会为该进程禁用来自环境变量和配置的标志。

## 性能分析标志

性能分析器标志可以启用有针对性的计时跨度，而无需提高全局日志级别。它们默认禁用。

为一次 Gateway 网关运行启用所有由性能分析器门控的跨度：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

仅启用回复分发性能分析器跨度：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

仅启用 Codex 应用服务器启动/工具/线程性能分析器跨度：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

从配置启用性能分析器标志：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

更改配置标志后重启 Gateway 网关。要禁用性能分析器标志，请将其从 `diagnostics.flags` 中移除并重启。要在配置启用性能分析器标志时临时禁用所有诊断标志，请用以下方式启动进程：

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## 时间线工件

`timeline` 标志会为外部 QA 测试框架写入结构化的启动和运行时计时事件：

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

你也可以在配置中启用它：

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

时间线文件路径仍来自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`。当 `timeline` 仅从配置启用时，最早的配置加载跨度不会被发出，因为 OpenClaw 当时还没有读取配置；后续启动跨度会使用该配置标志。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all` 和 `OPENCLAW_DIAGNOSTICS=*` 也会启用时间线，因为它们会启用所有诊断标志。当你只需要 JSONL 计时工件时，优先使用 `timeline`。

时间线记录使用 `openclaw.diagnostics.v1` 信封。事件可以包含进程 ID、阶段名称、跨度名称、持续时间、插件 ID、依赖数量、事件循环延迟样本、提供商操作名称、子进程退出状态，以及启动错误名称/消息。将时间线文件视为本地诊断工件；在机器外共享之前先审阅它们。

## 日志位置

标志会将日志发出到标准诊断日志文件。默认情况下：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你设置了 `logging.file`，请改用该路径。日志是 JSONL（每行一个 JSON 对象）。仍会根据 `logging.redactSensitive` 应用脱敏。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

筛选 Brave Search HTTP 诊断：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

或在复现时跟踪输出：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway 网关，你也可以使用 `openclaw logs --follow`（参见 [/cli/logs](/zh-CN/cli/logs)）。

## 注意事项

- 如果 `logging.level` 设置得高于 `warn`，这些日志可能会被抑制。默认的 `info` 没问题。
- `brave.http` 会记录 Brave Search 请求 URL/查询参数、响应状态/计时，以及缓存命中/未命中/写入事件。它不会记录 API key 或响应正文，但搜索查询可能是敏感信息。
- 标志可以安全地保持启用；它们只会影响特定子系统的日志量。
- 使用 [/logging](/zh-CN/logging) 更改日志目标位置、级别和脱敏设置。

## 相关

- [Gateway 诊断](/zh-CN/gateway/diagnostics)
- [Gateway 故障排除](/zh-CN/gateway/troubleshooting)
