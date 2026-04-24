---
read_when:
    - 你希望快速将移动节点应用与 Gateway 网关配对
    - 你需要 setup code 输出以便远程/手动共享
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码和设置代码）'
title: 二维码
x-i18n:
    generated_at: "2026-04-24T04:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对二维码和 setup code。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置，`gateway.tailscale.mode=serve|funnel` 仍可提供远程公共 URL
- `--url <url>`：覆盖负载中使用的 gateway URL
- `--public-url <url>`：覆盖负载中使用的公共 URL
- `--token <token>`：覆盖 bootstrap 流程用于身份验证的 gateway token
- `--password <password>`：覆盖 bootstrap 流程用于身份验证的 gateway password
- `--setup-code-only`：仅打印 setup code
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`, `gatewayUrl`, `auth`, `urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- setup code 本身现在携带的是不透明的短期有效 `bootstrapToken`，而不是共享的 gateway token/password。
- 在内置的节点/操作员 bootstrap 流程中，主节点 token 仍会以 `scopes: []` 落地。
- 如果 bootstrap 交接还签发了操作员 token，它会继续受限于 bootstrap allowlist：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- Bootstrap scope 检查带有角色前缀。该操作员 allowlist 仅满足操作员请求；非操作员角色仍需要其各自角色前缀下的 scopes。
- 对于 Tailscale/公共 `ws://` gateway URL，移动端配对会以失败关闭方式处理。私有局域网 `ws://` 仍受支持，但 Tailscale/公共移动路由应使用 Tailscale Serve/Funnel 或 `wss://` gateway URL。
- 使用 `--remote` 时，OpenClaw 要求存在 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果有效启用的远程凭据被配置为 SecretRefs，且你未传入 `--token` 或 `--password`，该命令会从活动 gateway 快照中解析它们。如果 gateway 不可用，命令会快速失败。
- 不使用 `--remote` 时，如果未传入 CLI 身份验证覆盖，本地 gateway 身份验证 SecretRefs 会被解析：
  - 当 token 身份验证可胜出时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或没有 password 来源胜出的推断模式）。
  - 当 password 身份验证可胜出时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或在 auth/env 中没有胜出 token 的推断模式）。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置（包括 SecretRefs），且 `gateway.auth.mode` 未设置，则 setup code 解析会失败，直到显式设置 mode。
- Gateway 网关版本偏差说明：此命令路径要求 gateway 支持 `secrets.resolve`；较旧的 gateway 会返回 unknown-method 错误。
- 扫描后，使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配对](/zh-CN/cli/pairing)
