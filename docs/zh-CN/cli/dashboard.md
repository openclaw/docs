---
read_when:
    - 你想使用当前令牌打开 Control UI
    - 你希望仅输出 URL，而不启动浏览器
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表板
x-i18n:
    generated_at: "2026-07-11T20:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用当前身份验证打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：输出 URL，但不启动浏览器。
- `--yes`：需要时无需提示即可启动或安装 Gateway 网关。

注意：

- 尽可能解析已配置的 `gateway.auth.token` SecretRef。
- 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会输出或打开使用 `https://` 的 Control UI URL，并通过 `wss://` 连接。
- 对于 `lan` 绑定或使用通配符的 `custom` 绑定，同一主机上的启动始终使用回环地址，因为通配符不能作为浏览器目标。明文 `tailnet` 和 `custom` 绑定也使用 `127.0.0.1`，以便浏览器获得安全上下文；启用 TLS 的特定主机则保留配置的地址，以确保与证书名称匹配。
- 在为特定接口绑定提供经过身份验证的回环 URL 之前，该命令会探测配置的接口，并验证该接口和 `127.0.0.1` 是否由同一个 Gateway 网关进程持有。如果监听器归属不明确，命令将以故障关闭方式退出，并提供状态检查指引。
- 对于由 SecretRef 管理的令牌，无论是否已解析，输出、复制或打开的 URL 都绝不会包含令牌，因此外部密钥不会泄露到终端输出、剪贴板历史记录或浏览器启动参数中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但无法解析，该命令会输出不含令牌的 URL 和修复指引，而不是无效的令牌占位符。
- 如果带令牌身份验证的 URL 无法通过剪贴板或浏览器传递，该命令会记录一条安全的手动身份验证提示，其中会指出 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段键 `token`，但不会输出令牌值。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Dashboard](/zh-CN/web/dashboard)
