---
read_when:
    - 你想使用当前令牌打开 Control UI
    - 你想打印 URL，而不启动浏览器
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表盘
x-i18n:
    generated_at: "2026-07-05T11:09:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79c5e0884fca90c582499b73d49a72dccb09dd60cd1777c95040f540a3e539f3
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

使用你当前的认证打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`：打印 URL，但不启动浏览器。
- `--yes`：在需要时无需提示即可启动/安装 Gateway 网关。

说明：

- 在可能时解析已配置的 `gateway.auth.token` SecretRefs。
- 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会打印/打开 `https://` Control UI URL，并通过 `wss://` 连接。
- 对于由 SecretRef 管理的令牌（无论已解析还是未解析），打印/复制/打开的 URL 都绝不会包含令牌，因此外部密钥不会泄露到终端输出、剪贴板历史或浏览器启动参数中。
- 如果 `gateway.auth.token` 由 SecretRef 管理但未解析，该命令会打印不含令牌的 URL 和修复指导，而不是无效的令牌占位符。
- 如果令牌认证 URL 的剪贴板/浏览器传递失败，该命令会记录一条安全的手动认证提示，指出 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和 URL 片段键 `token`，但不会打印令牌值。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Dashboard](/zh-CN/web/dashboard)
