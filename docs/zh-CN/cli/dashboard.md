---
read_when:
    - 你想使用当前 token 打开 Control UI
    - 你想在不启动浏览器的情况下打印 URL
summary: '`openclaw dashboard` 的 CLI 参考（打开 Control UI）'
title: 仪表盘
x-i18n:
    generated_at: "2026-04-24T04:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

使用你当前的 auth 打开 Control UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

说明：

- `dashboard` 会在可能的情况下解析已配置的 `gateway.auth.token` SecretRefs。
- 对于由 SecretRef 管理的 token（无论已解析还是未解析），`dashboard` 会打印/复制/打开一个不含 token 的 URL，以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路径中无法解析，该命令会打印一个不含 token 的 URL，并提供明确的修复指导，而不是嵌入无效的 token 占位符。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [仪表盘](/zh-CN/web/dashboard)
