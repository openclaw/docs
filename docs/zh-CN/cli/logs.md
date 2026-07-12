---
read_when:
    - 你需要远程跟踪 Gateway 网关日志（无需 SSH）
    - 你需要供工具使用的 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 跟踪 Gateway 网关日志）'
title: 日志
x-i18n:
    generated_at: "2026-07-11T20:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志。支持远程模式。

## 选项

- `--limit <n>`：返回的最大日志行数（默认值为 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认值为 `250000`）
- `--follow`：持续跟踪日志流
- `--interval <ms>`：跟踪时的轮询间隔（默认值为 `1000`）
- `--json`：输出逐行分隔的 JSON 事件
- `--plain`：输出不带样式格式的纯文本
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：使用你的本地时区呈现时间戳（默认）
- `--utc`：使用 UTC 呈现时间戳

## 共享的 Gateway RPC 选项

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：超时时间（毫秒，默认值为 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

传入 `--url` 会跳过自动应用的配置凭据；如果目标 Gateway 网关需要身份验证，请显式提供 `--token`。

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

- 如果隐式 local loopback Gateway 网关要求配对、在连接期间关闭，或在 `logs.tail` 响应前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式指定的 `--url` 目标绝不会使用此回退机制。
- 隐式本地 Gateway 网关 RPC 失败后，`--follow` 不会回退到该已配置文件，因为并存的过期文件可能会误导实时日志跟踪。在 Linux 上，如果可用，它会改为按 PID 使用当前活跃的用户 systemd Gateway 网关日志（并输出所选来源）；否则会继续重试连接实时 Gateway 网关。
- 使用 `--follow` 期间，临时断开连接（WebSocket 关闭、超时、连接中断）会触发采用指数退避的自动重连：最多重试 8 次，两次尝试之间的间隔上限为 30 秒。每次重试都会向 stderr 输出警告，轮询成功后会输出一次 `[logs] gateway reconnected` 通知。在 `--json` 模式下，两者都会作为 `{"type":"notice"}` 记录输出到 stderr。不可恢复的错误（身份验证失败、配置错误）仍会立即退出。
- 在 `--follow --json` 模式下，日志来源切换会作为 `{"type":"meta"}` 记录输出。请按 `sourceKind` 分别跟踪游标：日志流可能从 Gateway 网关文件输出（`sourceKind: "file"`）切换到本地日志回退（`sourceKind: "journal"`、`localFallback: true`，并包含 `service.pid`/`service.unit`），恢复后再切回 Gateway 网关文件输出。不要假定整个会话始终使用同一来源或游标，并应允许恢复过程重新应用 Gateway 网关文件游标时出现重复日志行。

## 相关内容

- [日志概览](/zh-CN/logging)
- [Gateway CLI](/zh-CN/cli/gateway)
- [CLI 参考](/zh-CN/cli)
- [Gateway 网关日志](/zh-CN/gateway/logging)
