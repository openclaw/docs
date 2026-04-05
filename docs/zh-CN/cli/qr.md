---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要用于远程/手动分享的设置代码输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对 QR 码 + 设置代码）'
title: qr
x-i18n:
    generated_at: "2026-04-05T08:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对 QR 码和设置代码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置，`gateway.tailscale.mode=serve|funnel` 仍然可以提供远程公共 URL
- `--url <url>`：覆盖负载中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖负载中使用的公共 URL
- `--token <token>`：覆盖引导流程进行身份验证时所针对的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程进行身份验证时所针对的 Gateway 网关密码
- `--setup-code-only`：仅打印设置代码
- `--no-ascii`：跳过 ASCII QR 码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 设置代码本身现在携带的是一个不透明的短期 `bootstrapToken`，而不是共享的 Gateway 网关令牌/密码。
- 在内置的节点/operator 引导流程中，主节点令牌仍然以 `scopes: []` 落地。
- 如果引导交接还签发了一个 operator 令牌，它会继续限制在引导允许列表内：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- 引导作用域检查采用角色前缀。该 operator 允许列表仅满足 operator 请求；非 operator 角色仍然需要其自身角色前缀下的作用域。
- 对于 Tailscale/公共 `ws://` Gateway 网关 URL，移动端配对会以失败即关闭的方式处理。私有局域网 `ws://` 仍受支持，但 Tailscale/公共移动路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。
- 使用 `--remote` 时，OpenClaw 要求存在 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果实际生效的远程凭证配置为 SecretRef，且你未传递 `--token` 或 `--password`，该命令会从当前活动的 Gateway 网关快照中解析这些凭证。如果 Gateway 网关不可用，命令会快速失败。
- 不使用 `--remote` 时，如果未传递 CLI 身份验证覆盖，本地 Gateway 网关身份验证 SecretRef 会被解析：
  - 当令牌认证可能胜出时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或在没有密码来源胜出的推断模式下）。
  - 当密码认证可能胜出时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或在认证/环境变量中没有胜出令牌的推断模式下）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），且未设置 `gateway.auth.mode`，则在显式设置 mode 之前，设置代码解析会失败。
- Gateway 网关版本偏差说明：此命令路径要求 Gateway 网关支持 `secrets.resolve`；较旧的 Gateway 网关会返回 unknown-method 错误。
- 扫描后，使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
