---
read_when:
    - 你需要在不提高全局日志级别的情况下获取定向调试日志
    - 你需要捕获特定子系统的日志以便支持排查
summary: 用于定向调试日志的诊断标志
title: 诊断标志
x-i18n:
    generated_at: "2026-04-29T18:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

诊断标志可让你启用有针对性的调试日志，而不必到处开启详细日志记录。标志需要显式启用；除非某个子系统检查它们，否则不会产生任何效果。

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
    "flags": ["telegram.http", "gateway.*"]
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

## 时间线产物

`timeline` 标志会为外部 QA harness 写入结构化的启动和运行时计时事件：

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

时间线文件路径仍来自 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`。当仅从配置启用 `timeline` 时，最早的配置加载 span 不会发出，因为 OpenClaw 还没有读取配置；后续启动 span 会使用配置标志。

`OPENCLAW_DIAGNOSTICS=1`、`OPENCLAW_DIAGNOSTICS=all` 和 `OPENCLAW_DIAGNOSTICS=*` 也会启用时间线，因为它们会启用每一个诊断标志。当你只需要 JSONL 计时产物时，优先使用 `timeline`。

时间线记录使用 `openclaw.diagnostics.v1` 信封。事件可以包含进程 ID、阶段名称、span 名称、持续时间、插件 ID、依赖数量、事件循环延迟样本、提供商操作名称、子进程退出状态，以及启动错误名称/消息。请将时间线文件视为本地诊断产物；在机器外共享之前先审阅它们。

## 日志写入位置

标志会将日志发出到标准诊断日志文件。默认情况下：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你设置了 `logging.file`，则改用该路径。日志是 JSONL（一行一个 JSON 对象）。脱敏仍会基于 `logging.redactSensitive` 应用。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

或者在复现时跟踪：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway 网关，你也可以使用 `openclaw logs --follow`（参见 [/cli/logs](/zh-CN/cli/logs)）。

## 备注

- 如果 `logging.level` 设置得高于 `warn`，这些日志可能会被抑制。默认的 `info` 没问题。
- 标志可以安全地保持启用；它们只会影响特定子系统的日志量。
- 使用 [/logging](/zh-CN/logging) 更改日志目标位置、级别和脱敏。

## 相关

- [Gateway 网关诊断](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
