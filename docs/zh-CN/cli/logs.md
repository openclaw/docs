---
read_when:
    - 你需要远程实时查看 Gateway 网关日志（无需 SSH）
    - 你需要用于工具处理的 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 实时查看 Gateway 网关日志）'
title: 日志
x-i18n:
    generated_at: "2026-04-29T07:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志（适用于远程模式）。

相关内容：

- 日志记录概览：[日志记录](/zh-CN/logging)
- Gateway 网关 CLI：[gateway](/zh-CN/cli/gateway)

## 选项

- `--limit <n>`：返回的最大日志行数（默认 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认 `250000`）
- `--follow`：跟随日志流
- `--interval <ms>`：跟随时的轮询间隔（默认 `1000`）
- `--json`：输出以行为分隔的 JSON 事件
- `--plain`：不带样式格式的纯文本输出
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：使用你的本地时区渲染时间戳

## 共享 Gateway 网关 RPC 选项

`openclaw logs` 也接受标准 Gateway 网关客户端标志：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：超时时间，单位为 ms（默认 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

传入 `--url` 时，CLI 不会自动应用配置或环境凭证。如果目标 Gateway 网关需要身份验证，请显式包含 `--token`。

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 备注

- 使用 `--local-time` 以你的本地时区渲染时间戳。
- 如果隐式 local loopback Gateway 网关请求配对、在连接期间关闭，或在 `logs.tail` 应答前超时，`openclaw logs` 会自动回退到已配置的 Gateway 网关文件日志。显式 `--url` 目标不会使用此回退。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关日志记录](/zh-CN/gateway/logging)
