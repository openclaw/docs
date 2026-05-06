---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要用于远程/手动共享的 setup-code 输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码 + 设置代码）'
title: 二维码
x-i18n:
    generated_at: "2026-05-06T02:12:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对 QR 和设置代码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置，`gateway.tailscale.mode=serve|funnel` 仍可提供远程公开 URL
- `--url <url>`：覆盖 payload 中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖 payload 中使用的公开 URL
- `--token <token>`：覆盖 bootstrap 流程用于认证的 Gateway 网关 token
- `--password <password>`：覆盖 bootstrap 流程用于认证的 Gateway 网关密码
- `--setup-code-only`：只打印设置代码
- `--no-ascii`：跳过 ASCII QR 渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注意事项

- `--token` 和 `--password` 互斥。
- 设置代码本身现在携带一个不透明、短期有效的 `bootstrapToken`，而不是共享的 Gateway 网关 token/密码。
- 在内置的节点/operator bootstrap 流程中，主节点 token 仍会以 `scopes: []` 写入。
- 如果 bootstrap 交接还签发了 operator token，它会保持限定在 bootstrap allowlist 内：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- Bootstrap scope 检查带有角色前缀。该 operator allowlist 只满足 operator 请求；非 operator 角色仍需要在其自身角色前缀下的 scope。
- 对于 Tailscale/公开 `ws://` Gateway 网关 URL，移动端配对会默认失败并关闭。私有 LAN 地址和 `.local` Bonjour 主机仍支持通过 `ws://` 使用，但 Tailscale/公开移动端路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。
- 使用 `--remote` 时，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果实际处于活动状态的远程凭证配置为 SecretRefs，并且你没有传入 `--token` 或 `--password`，该命令会从活动 Gateway 网关快照中解析它们。如果 Gateway 网关不可用，该命令会快速失败。
- 不使用 `--remote` 时，如果没有传入 CLI 认证覆盖项，则会解析本地 Gateway 网关认证 SecretRefs：
  - 当 token 认证可以胜出时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或在没有密码来源胜出的情况下推断出的模式）。
  - 当密码认证可以胜出时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或在没有来自 auth/env 的 token 胜出时推断出的模式）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未设置 `gateway.auth.mode`，设置代码解析会失败，直到显式设置模式。
- Gateway 网关版本偏差注意事项：此命令路径需要支持 `secrets.resolve` 的 Gateway 网关；较旧的 Gateway 网关会返回未知方法错误。
- 扫描后，使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配对](/zh-CN/cli/pairing)
