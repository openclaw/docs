---
read_when:
    - 你需要有针对性的调试日志，而不提高全局日志级别
    - 你需要捕获特定子系统的日志，以便获得支持
summary: 用于定向调试日志的诊断标志
title: 诊断标志
x-i18n:
    generated_at: "2026-07-11T20:29:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

诊断标志可为某个子系统启用额外日志，而无需全局提高
`logging.level`。除非子系统检查某个标志，否则该标志不会生效。

## 工作原理

- 标志是不区分大小写的字符串，由配置中的 `diagnostics.flags`
  与 `OPENCLAW_DIAGNOSTICS` 环境变量覆盖值合并解析，并进行去重和小写转换。
- `name.*` 会匹配 `name` 本身及 `name.` 下的所有内容（例如，
  `telegram.*` 会匹配 `telegram.http`）。
- `*` 或 `all` 会启用所有标志。
- 更改配置中的 `diagnostics.flags` 后，请重启 Gateway 网关；该设置
  不支持热重载。

## 已知标志

| 标志             | 启用的功能                                                   |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP 错误日志                       |
| `brave.http`     | Brave Search 请求/响应/缓存日志               |
| `profiler`       | 回复阶段分析器和 Codex app-server 分析器（两者） |
| `reply.profiler` | 仅回复阶段分析器                                 |
| `codex.profiler` | 仅 Codex app-server 分析器                            |
| `timeline`       | 结构化 JSONL 时间线产物（见下文）            |

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

## 环境变量覆盖（单次）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

值以逗号或空白字符分隔。特殊值：

| 值                       | 效果                                   |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | 禁用所有标志，同时覆盖配置 |
| `1`, `true`, `all`, `*`     | 启用所有标志                        |

`OPENCLAW_DIAGNOSTICS=0` 会针对该进程禁用来自环境变量和配置的标志，
适合在不编辑文件的情况下，临时关闭配置中仍处于启用状态的分析器标志。

## 分析器标志

分析器标志控制轻量级计时区间；关闭时不会增加任何开销。

为单次 Gateway 网关运行启用所有受分析器控制的计时区间：

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

仅启用回复分派分析器计时区间：

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

仅启用 Codex app-server 启动/工具/线程分析器计时区间：

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` 会同时启用回复分析器和 Codex 分析器；如只需启用其中一个，
请使用限定范围的标志名称。

也可以在配置中设置：

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

更改配置标志后，请重启 Gateway 网关。要禁用分析器标志，
请从 `diagnostics.flags` 中移除该标志并重启，或使用
`OPENCLAW_DIAGNOSTICS=0` 启动进程，以在该次运行中覆盖所有诊断标志。

## 时间线产物

`timeline` 标志（别名：`diagnostics.timeline`）会将结构化的启动和
运行时计时事件写入 JSONL，供外部 QA 测试框架使用：

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

即使标志本身在配置中设置，输出路径也始终来自
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`；没有用于该路径的配置键。
如果仅通过配置启用 `timeline`，最早的配置加载计时区间将会缺失，
因为 OpenClaw 此时尚未读取配置；后续启动计时区间会正常捕获。

`OPENCLAW_DIAGNOSTICS=1`、`=all` 和 `=*` 也会启用时间线，因为它们
会启用所有标志。如果只需要 JSONL 产物，而不需要其他所有诊断标志，
请优先使用限定范围的 `timeline` 标志。

时间线中的事件循环延迟样本除 `timeline` 外还需要额外选择启用：
在启用时间线的基础上，设置 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1`
（或 `on`/`true`/`yes`）。

时间线记录使用 `openclaw.diagnostics.v1` 信封格式，其中可以包含
进程 ID、阶段名称、计时区间名称、持续时间、插件 ID、依赖项数量、
事件循环延迟样本、提供商操作名称、子进程退出状态，以及启动错误的名称/消息。
请将时间线文件视为本地诊断产物；在将其分享至你的机器之外前，请先审查内容。

## 日志位置

标志会将日志写入标准诊断日志文件。默认路径为：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果设置了 `logging.file`，则改用该路径。日志采用 JSONL 格式（每行一个
JSON 对象）。仍会根据 `logging.redactSensitive` 应用脱敏。
有关完整的日志路径解析、轮转和脱敏模型，请参阅[日志](/zh-CN/logging)。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断日志：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

筛选 Brave Search HTTP 诊断日志：

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

或者在复现问题时持续查看：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway 网关，请改用 `openclaw logs --follow`（参阅
[/cli/logs](/zh-CN/cli/logs)）。

## 注意事项

- 如果 `logging.level` 设置为高于 `warn` 的级别，受标志控制的日志可能会
  被抑制。默认的 `info` 即可。
- `brave.http` 会记录 Brave Search 请求 URL/查询参数、响应
  状态/耗时，以及缓存命中/未命中/写入事件。它不会记录 API 密钥
  （该密钥通过请求标头发送）或响应正文，但搜索查询可能包含
  敏感信息。
- 标志可以安全地保持启用；它们只会影响特定子系统的日志量。
- 使用 [/logging](/zh-CN/logging) 更改日志目标、级别和脱敏设置。

## 相关内容

- [Gateway 网关诊断](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
