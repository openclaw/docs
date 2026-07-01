---
read_when:
    - 你需要远程跟踪 Gateway 网关日志（无需 SSH）
    - 你想要供工具使用的 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 实时查看 Gateway 网关日志）'
title: 日志
x-i18n:
    generated_at: "2026-07-01T15:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志（在远程模式下可用）。

相关：

- 日志概览：[日志](/zh-CN/logging)
- Gateway 网关 CLI：[gateway](/zh-CN/cli/gateway)

## 选项

- `--limit <n>`：要返回的最大日志行数（默认 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认 `250000`）
- `--follow`：跟踪日志流
- `--interval <ms>`：跟踪时的轮询间隔（默认 `1000`）
- `--json`：输出按行分隔的 JSON 事件
- `--plain`：不带样式格式的纯文本输出
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：按你的本地时区渲染时间戳（默认）
- `--utc`：按 UTC 渲染时间戳

## 共享 Gateway 网关 RPC 选项

`openclaw logs` 也接受标准 Gateway 网关客户端标志：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：超时时间（毫秒，默认 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

传入 `--url` 时，CLI 不会自动应用配置或环境凭据。如果目标 Gateway 网关需要身份验证，请显式包含 `--token`。

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 说明

- 时间戳默认按你的本地时区渲染。使用 `--utc` 输出 UTC 时间。
- 如果隐式的 local loopback Gateway 网关要求配对、在连接期间关闭，或在 `logs.tail` 应答前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式的 `--url` 目标不会使用此回退。
- `openclaw logs --follow` 不会在隐式本地 Gateway 网关 RPC 失败后继续跟踪已配置文件的回退。在 Linux 上，当可用时，它会按 PID 使用当前用户的 systemd Gateway 网关日志，并打印所选日志源；否则，它会继续重试实时 Gateway 网关，而不是跟踪可能已过期的并排文件。
- 使用 `--follow` 时，临时的 Gateway 网关断开（WebSocket 关闭、超时、连接中断）会触发带指数退避的自动重连（最多 8 次重试，尝试之间的间隔上限为 30 秒）。每次重试都会向标准错误打印警告，并在一次轮询成功后打印 `[logs] gateway reconnected` 通知。在 `--json` 模式下，重试警告和重连转换都会作为 `{"type":"notice"}` 记录输出到标准错误。不可恢复错误（身份验证失败、配置错误）仍会立即退出。
- 在 `--follow --json` 模式下，日志源转换会作为 `{"type":"meta"}` 记录输出。消费者应按 `sourceKind` 跟踪游标：流可以从 Gateway 网关文件输出（`sourceKind: "file"`）移动到本地日志回退（`sourceKind: "journal"`、`localFallback: true`，带有 `service.pid`/`service.unit`），并在恢复后回到 Gateway 网关文件输出。不要假设整个跟踪会话只有一个稳定的源或游标，并且在恢复重放 Gateway 网关文件游标时，应容忍重叠的行。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关日志](/zh-CN/gateway/logging)
