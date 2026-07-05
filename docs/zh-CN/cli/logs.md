---
read_when:
    - 你需要远程 tail Gateway 网关日志（无需 SSH）
    - 你希望为工具输出 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 实时查看 Gateway 网关日志）'
title: 日志
x-i18n:
    generated_at: "2026-07-05T11:09:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志。可在远程模式下工作。

## 选项

- `--limit <n>`：要返回的最大日志行数（默认 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认 `250000`）
- `--follow`：跟随日志流
- `--interval <ms>`：跟随时的轮询间隔（默认 `1000`）
- `--json`：输出以行为分隔的 JSON 事件
- `--plain`：不带样式格式的纯文本输出
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：使用你的本地时区渲染时间戳（默认）
- `--utc`：使用 UTC 渲染时间戳

## 共享 Gateway 网关 RPC 选项

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：超时时间，单位为毫秒（默认 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

传入 `--url` 会跳过自动应用的配置凭证；如果目标 Gateway 网关需要身份验证，请显式包含 `--token`。

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 回退与恢复行为

- 如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式 `--url` 目标绝不会使用此回退。
- `--follow` 在隐式本地 Gateway 网关 RPC 失败后不会回退到该已配置文件，因为过时的并排文件可能误导实时跟踪。在 Linux 上，它会改为在可用时按 PID 使用活动的用户 systemd Gateway 网关日志（会打印所选来源）；否则会继续重试实时 Gateway 网关。
- 在 `--follow` 期间，瞬时断开连接（WebSocket 关闭、超时、连接中断）会触发带指数退避的自动重连：最多 8 次重试，尝试间隔上限为 30 秒。每次重试都会向 stderr 打印警告，且轮询成功后会打印一次 `[logs] gateway reconnected` 通知。在 `--json` 模式下，两者都会作为 `{"type":"notice"}` 记录输出到 stderr。不可恢复的错误（身份验证失败、错误配置）仍会立即退出。
- 在 `--follow --json` 模式下，日志来源转换会作为 `{"type":"meta"}` 记录输出。按 `sourceKind` 跟踪游标：流可以从 Gateway 网关文件输出（`sourceKind: "file"`）移动到本地日志回退（`sourceKind: "journal"`、`localFallback: true`，带 `service.pid`/`service.unit`），并在恢复后返回 Gateway 网关文件输出。不要假设整个会话只有一个稳定来源或游标，并且在恢复重放 Gateway 网关文件游标时，要容忍重叠日志行。

## 相关

- [日志概览](/zh-CN/logging)
- [Gateway CLI](/zh-CN/cli/gateway)
- [CLI 参考](/zh-CN/cli)
- [Gateway 网关日志](/zh-CN/gateway/logging)
