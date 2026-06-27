---
read_when:
    - 你想快速将移动端节点应用与 Gateway 网关配对
    - 你需要用于远程/手动共享的 setup-code 输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对 QR + 设置码）'
title: 二维码
x-i18n:
    generated_at: "2026-06-27T01:42:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对 QR 码和设置码。

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
- `--url <url>`：覆盖 payload 中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖 payload 中使用的公共 URL
- `--token <token>`：覆盖引导流程用于认证的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程用于认证的 Gateway 网关密码
- `--setup-code-only`：仅打印设置码
- `--no-ascii`：跳过 ASCII QR 渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 设置码本身现在携带一个不透明、短生命周期的 `bootstrapToken`，而不是共享的 Gateway 网关令牌/密码。
- 内置设置码引导会返回一个主 `node` 令牌（带 `scopes: []`），以及一个有界的 `operator` 移交令牌，用于受信任的移动端新手引导。
- 移交的操作员令牌仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`；`operator.admin` 和 `operator.pairing` 需要单独批准的操作员配对或令牌流程。
- 对于 Tailscale/公共 `ws://` Gateway 网关 URL，移动端配对会失败关闭。私有 LAN 地址和 `.local` Bonjour 主机仍支持通过 `ws://` 使用，但 Tailscale/公共移动端路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。
- 使用 `--remote` 时，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果实际活跃的远程凭证配置为 SecretRefs，且你没有传入 `--token` 或 `--password`，该命令会从活跃的 Gateway 网关快照中解析它们。如果 Gateway 网关不可用，该命令会快速失败。
- 不使用 `--remote` 时，如果未传入 CLI 认证覆盖项，会解析本地 Gateway 网关认证 SecretRefs：
  - 当令牌认证可以胜出时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或没有密码来源胜出的推断模式）。
  - 当密码认证可以胜出时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或没有来自认证/环境的令牌胜出的推断模式）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未设置 `gateway.auth.mode`，则设置码解析会失败，直到显式设置模式。
- Gateway 网关版本偏差说明：此命令路径需要支持 `secrets.resolve` 的 Gateway 网关；旧版 Gateway 网关会返回未知方法错误。
- 扫描后，使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配对](/zh-CN/cli/pairing)
