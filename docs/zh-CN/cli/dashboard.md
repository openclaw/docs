---
read_when:
    - 你想使用当前 token 打开 Control UI
    - 你想仅打印 URL 而不启动浏览器
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: dashboard
x-i18n:
    generated_at: "2026-04-05T08:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

使用你当前的认证打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意事项：

- `dashboard` 会在可能时解析已配置的 `gateway.auth.token` SecretRef。
- 对于由 SecretRef 管理的 token（无论已解析还是未解析），`dashboard` 会打印/复制/打开不带 token 的 URL，以避免在终端输出、剪贴板历史或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路径中无法解析，该命令会打印一个不带 token 的 URL，并提供明确的修复指导，而不是嵌入无效的 token 占位符。
