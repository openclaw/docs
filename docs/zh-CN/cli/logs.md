---
read_when:
    - 需要远程实时查看 Gateway 网关日志（无需 SSH）
    - 你希望为工具提供 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 实时查看 Gateway 网关日志）'
title: 日志
x-i18n:
    generated_at: "2026-06-27T01:38:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志（可在远程模式下使用）。

相关：

- 日志概览：[日志](/zh-CN/logging)
- Gateway 网关 CLI：[gateway](/zh-CN/cli/gateway)

## 选项

- `--limit <n>`：要返回的最大日志行数（默认 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认 `250000`）
- `--follow`：跟随日志流
- `--interval <ms>`：跟随时的轮询间隔（默认 `1000`）
- `--json`：输出按行分隔的 JSON 事件
- `--plain`：不带样式格式的纯文本输出
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：按你的本地时区渲染时间戳（默认）
- `--utc`：按 UTC 渲染时间戳

## 共享 Gateway 网关 RPC 选项

`openclaw logs` 也接受标准 Gateway 网关客户端标志：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：超时时间，单位为毫秒（默认 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

当你传入 `--url` 时，CLI 不会自动应用配置或环境凭据。如果目标 Gateway 网关需要身份验证，请显式包含 `--token`。

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

- 默认情况下，时间戳会按你的本地时区渲染。使用 `--utc` 输出 UTC。
- 如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用此回退。
- `openclaw logs --follow` 在隐式本地 Gateway 网关 RPC 失败后，不会继续跟随配置文件回退。在 Linux 上，当可用时，它会按 PID 使用活动的用户 systemd Gateway 网关日志，并打印所选日志来源；否则，它会继续重试实时 Gateway 网关，而不是跟踪可能已过期的并列文件。
- 使用 `--follow` 时，临时 Gateway 网关断开连接（WebSocket 关闭、超时、连接中断）会触发带指数退避的自动重连（最多 8 次重试，两次尝试之间上限为 30 秒）。每次重试都会向 stderr 打印警告，一旦轮询成功，会打印 `[logs] gateway reconnected` 通知。在 `--json` 模式下，重试警告和重连转换都会作为 `{"type":"notice"}` 记录输出到 stderr。不可恢复的错误（身份验证失败、错误配置）仍会立即退出。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关日志](/zh-CN/gateway/logging)
