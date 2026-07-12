---
read_when:
    - 你想使用当前令牌打开 Control UI
    - 你希望在不启动浏览器的情况下输出 URL
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表盘
x-i18n:
    generated_at: "2026-07-12T14:21:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用当前的身份验证打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：打印 URL，但不启动浏览器。
- `--yes`：需要时无需提示即可启动/安装 Gateway 网关。

注意：

- 尽可能解析已配置的 `gateway.auth.token` SecretRef。
- 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会打印/打开 `https://` Control UI URL，并通过 `wss://` 连接。
- 对于 `lan` 或使用通配符的 `custom` 绑定，同一主机上的启动始终使用环回地址，因为通配符不能作为浏览器目标。明文 `tailnet` 和 `custom` 绑定也使用 `127.0.0.1`，以便浏览器具有安全上下文；启用 TLS 的特定主机会保留配置的地址，以确保与证书名称匹配。
- 在为特定接口绑定提供经过身份验证的环回 URL 之前，该命令会探测配置的接口，并验证该接口和 `127.0.0.1` 是否归同一个 Gateway 网关进程所有。如果监听器归属不明确，操作会以安全方式失败，并提供状态指引。
- 对于由 SecretRef 管理的令牌（无论已解析还是未解析），打印、复制或打开的 URL 都绝不会包含令牌，因此外部密钥不会泄露到终端输出、剪贴板历史记录或浏览器启动参数中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但未解析，该命令会打印不含令牌的 URL 和修复指引，而不是无效的令牌占位符。
- 如果通过剪贴板/浏览器传递使用令牌身份验证的 URL 失败，该命令会记录安全的手动身份验证提示，其中会注明 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段键 `token`，但不会打印令牌值。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [仪表板](/zh-CN/web/dashboard)
