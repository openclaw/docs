---
read_when:
    - 你需要远程跟踪 Gateway 网关日志（无需 SSH）
    - 你想为工具获取 JSON 日志行
summary: '`openclaw logs` 的 CLI 参考（通过 RPC 跟踪 Gateway 网关日志）'
title: logs
x-i18n:
    generated_at: "2026-04-05T08:19:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

通过 RPC 跟踪 Gateway 网关文件日志（可在远程模式下使用）。

相关内容：

- 日志概览：[Logging](/logging)
- Gateway 网关 CLI：[gateway](/cli/gateway)

## 选项

- `--limit <n>`：返回的最大日志行数（默认 `200`）
- `--max-bytes <n>`：从日志文件读取的最大字节数（默认 `250000`）
- `--follow`：持续跟踪日志流
- `--interval <ms>`：跟踪时的轮询间隔（默认 `1000`）
- `--json`：输出按行分隔的 JSON 事件
- `--plain`：不带样式格式化的纯文本输出
- `--no-color`：禁用 ANSI 颜色
- `--local-time`：使用你的本地时区渲染时间戳

## 共享的 Gateway 网关 RPC 选项

`openclaw logs` 也接受标准的 Gateway 网关客户端标志：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关 token
- `--timeout <ms>`：超时时间（毫秒，默认 `30000`）
- `--expect-final`：当 Gateway 网关调用由智能体支持时，等待最终响应

当你传入 `--url` 时，CLI 不会自动应用配置或环境变量中的凭证。如果目标 Gateway 网关需要认证，请显式包含 `--token`。

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

## 注意事项

- 使用 `--local-time` 可按你的本地时区渲染时间戳。
- 如果本地 local loopback Gateway 网关请求配对，`openclaw logs` 会自动回退到已配置的本地日志文件。显式的 `--url` 目标不会使用此回退。
