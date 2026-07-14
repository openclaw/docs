---
read_when:
    - 你想使用当前令牌打开 Control UI
    - 你想要输出 URL，而不启动浏览器
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表板
x-i18n:
    generated_at: "2026-07-14T13:33:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用当前身份验证打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`：打印 URL，但不启动浏览器。
- `--json`：打印一个机器可读的连接对象，不打开浏览器、不使用剪贴板、不提示，也不启动 Gateway 网关。
- `--yes`：需要时无需提示即可启动/安装 Gateway 网关。

## 机器可读输出

对于需要已解析 Control UI URL 的桌面集成和脚本，请使用 `--json`：

```bash
openclaw dashboard --json
```

响应包含 `url`、`httpUrl`、`wsUrl`、`port` 和 `tokenIncluded`。如果 Gateway 网关尚未就绪，该命令将返回 `{"ok":false,"reason":"..."}`，并以非零状态退出。由 SecretRef 管理的令牌绝不会包含在 `url` 中。

注意：

- 尽可能解析已配置的 `gateway.auth.token` SecretRef。
- 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会打印/打开 `https://` Control UI URL，并通过 `wss://` 连接。
- 对于 `lan` 或通配符 `custom` 绑定，同一主机上的启动始终使用环回地址，因为通配符不是浏览器目标。明文 `tailnet` 和 `custom` 绑定也使用 `127.0.0.1`，以便浏览器获得安全上下文；启用 TLS 的特定主机则保留已配置的地址，以确保与证书名称匹配。
- 在为特定接口绑定提供经过身份验证的环回 URL 之前，该命令会探测已配置的接口，并验证该接口和 `127.0.0.1` 是否由同一个 Gateway 网关进程持有。如果监听器所有权存在歧义，则会安全失败并提供状态指引。
- 对于由 SecretRef 管理的令牌（无论是否已解析），打印、复制或打开的 URL 都绝不会包含令牌，因此外部密钥不会泄露到终端输出、剪贴板历史记录或浏览器启动参数中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但尚未解析，该命令会打印不含令牌的 URL 和修复指引，而不是无效的令牌占位符。
- 如果令牌身份验证 URL 无法通过剪贴板/浏览器传递，该命令会记录安全的手动身份验证提示，其中会指明 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段键 `token`，但不会打印令牌值。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [仪表板](/zh-CN/web/dashboard)
