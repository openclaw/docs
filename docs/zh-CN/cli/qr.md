---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要 setup-code 输出，用于远程/手动共享
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码 + 设置码）'
title: 二维码
x-i18n:
    generated_at: "2026-07-04T17:48:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对二维码和设置代码。

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
- `--url <url>`：覆盖载荷中使用的网关 URL
- `--public-url <url>`：覆盖载荷中使用的公共 URL
- `--token <token>`：覆盖引导流程用于认证的网关令牌
- `--password <password>`：覆盖引导流程用于认证的网关密码
- `--setup-code-only`：仅打印设置代码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 设置代码本身现在携带一个不透明的短期 `bootstrapToken`，而不是共享网关令牌/密码。
- 内置设置代码引导会返回一个主要的 `node` 令牌，其 `scopes: []`，并附带一个有界的 `operator` 移交令牌，用于受信任的移动端新手引导。
- 移交的 operator 令牌仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`；配对变更作用域和 `operator.admin` 仍需要单独批准的 operator 配对或令牌流程。
- 对于 Tailscale/公共 `ws://` 网关 URL，移动端配对会失败关闭。私有局域网地址和 `.local` Bonjour 主机仍支持通过 `ws://` 使用，但 Tailscale/公共移动端路由应使用 Tailscale Serve/Funnel 或 `wss://` 网关 URL。
- 使用 `--remote` 时，OpenClaw 需要 `gateway.remote.url` 或
  `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果实际处于活动状态的远程凭据配置为 SecretRefs，并且你未传入 `--token` 或 `--password`，该命令会从活动网关快照中解析它们。如果网关不可用，该命令会快速失败。
- 不使用 `--remote` 时，如果未传入 CLI 认证覆盖项，则会解析本地网关认证 SecretRefs：
  - 当令牌认证可以获胜时，解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"`，或推断模式中没有密码源获胜）。
  - 当密码认证可以获胜时，解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"`，或推断模式中没有来自 auth/env 的获胜令牌）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未设置 `gateway.auth.mode`，则设置代码解析会失败，直到显式设置模式。
- Gateway 网关版本偏差说明：此命令路径需要支持 `secrets.resolve` 的网关；旧版网关会返回未知方法错误。
- 官方 OpenClaw iOS 和 Android 应用会在其
  设置代码元数据匹配时自动连接。如果请求仍处于待处理状态（例如，
  非官方客户端或元数据不匹配），请使用以下命令查看并批准：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配对](/zh-CN/cli/pairing)
