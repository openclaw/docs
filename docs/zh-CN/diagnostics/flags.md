---
read_when:
    - 你需要定向调试日志，而不提高全局日志级别
    - 你需要采集特定子系统的日志以供支持使用
summary: 用于定向调试日志的诊断标志
title: 诊断标志
x-i18n:
    generated_at: "2026-04-24T04:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

诊断标志可让你启用定向调试日志，而无需在所有地方开启详细日志。标志为选择启用，除非某个子系统检查这些标志，否则不会产生任何影响。

## 工作原理

- 标志是字符串（不区分大小写）。
- 你可以在配置中启用标志，或通过环境变量覆盖。
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

更改标志后，重启 Gateway 网关。

## 环境变量覆盖（一次性）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

禁用所有标志：

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 日志写入位置

这些标志会将日志写入标准诊断日志文件。默认情况下：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果你设置了 `logging.file`，则改用该路径。日志格式为 JSONL（每行一个 JSON 对象）。仍会根据 `logging.redactSensitive` 应用脱敏。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断日志：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

或者在复现问题时实时查看：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程 Gateway 网关，你也可以使用 `openclaw logs --follow`（参见 [/cli/logs](/zh-CN/cli/logs)）。

## 说明

- 如果 `logging.level` 设置得高于 `warn`，这些日志可能会被抑制。默认的 `info` 是可以的。
- 这些标志可以安全地保持启用；它们只会影响特定子系统的日志量。
- 使用 [/logging](/zh-CN/logging) 更改日志目标、级别和脱敏设置。

## 相关内容

- [Gateway 网关诊断](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
