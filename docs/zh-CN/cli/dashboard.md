---
read_when:
    - 你想使用当前令牌打开控制界面
    - 你想输出该 URL，而不启动浏览器
summary: CLI 参考：`openclaw dashboard`（打开控制 UI）
title: 仪表盘
x-i18n:
    generated_at: "2026-05-04T23:44:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

使用你当前的认证信息打开控制 UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意事项：

- `dashboard` 会尽可能解析已配置的 `gateway.auth.token` SecretRefs。
- `dashboard` 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 网关会打印/打开
  `https://` 控制 UI URL，并通过 `wss://` 连接。
- 如果带令牌认证的仪表板 URL 的剪贴板/浏览器传递失败，
  `dashboard` 会记录一条安全的手动认证提示，提到 `OPENCLAW_GATEWAY_TOKEN`、
  `gateway.auth.token` 和片段键 `token`，但不会打印令牌
  值。
- 对于由 SecretRef 管理的令牌（无论已解析或未解析），`dashboard` 会打印/复制/打开不含令牌的 URL，以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理，但在此命令路径中未解析，该命令会打印不含令牌的 URL 和明确的修复指导，而不是嵌入无效的令牌占位符。

## 相关

- [CLI 参考](/zh-CN/cli)
- [仪表板](/zh-CN/web/dashboard)
