---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要用于远程/手动共享的 setup-code 输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码 + 设置码）'
title: QR
x-i18n:
    generated_at: "2026-07-05T17:41:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc8e1781b654f281f53beea8ec684c743fb585f65a0ecc9823a20a0180b4ca4c
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据当前 Gateway 配置生成移动端配对二维码和设置代码。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

官方 OpenClaw iOS 和 Android 应用在其
setup-code 元数据匹配时会自动连接。如果请求仍处于待处理状态（例如，
非官方客户端或元数据不匹配），请查看并批准它：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果该 URL 未设置，则回退到 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 插件的 `publicUrl`。
- `--url <url>`：覆盖载荷中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖载荷中使用的公共 URL
- `--token <token>`：覆盖引导流程用于认证的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程用于认证的 Gateway 网关密码
- `--setup-code-only`：仅打印设置代码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、可选的 `gatewayUrls`、`auth`、`urlSource`）

`--token` 和 `--password` 互斥。

## 设置代码内容

设置代码携带的是不透明、短生命周期的 `bootstrapToken`，而不是共享的 Gateway 网关令牌/密码。内置引导流程会签发：

- 一个主 `node` 令牌，带有 `scopes: []`
- 一个有边界的 `operator` 交接令牌，仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

配对变更权限范围和 `operator.admin` 仍需要单独批准的操作员配对或令牌流程。

## Gateway 网关 URL 解析

对于 Tailscale/公共 `ws://` Gateway 网关 URL，移动端配对会失败并保持关闭状态：请为这些地址使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。私有局域网地址和 `.local` Bonjour 主机仍支持通过纯 `ws://` 使用。

当选定的 Gateway 网关 URL 来自 `gateway.bind=lan` 时，OpenClaw 还会检查持久化的 `tailscale serve status --json` 路由。任何代理到活动 Gateway 网关 loopback 端口的 HTTPS Serve 根路径都会作为回退包含在内。指定接口的 `custom` 和 `tailnet` 绑定不会获得该回退，因为 loopback Serve 代理无法访问这些监听器。当前 iOS 客户端会按顺序探测公布的路由，并保存第一个可访问的路由；旧版 `url` 字段会保持不变，以支持较旧客户端。

使用 `--remote` 时，必须配置 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 之一。

## 认证解析（无 `--remote`）

未传入 CLI 认证覆盖时，本地 Gateway 网关认证 SecretRefs 会按如下方式解析：

| 条件                                                                                                                    | 解析为                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推断模式下没有胜出的密码来源                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推断模式下没有来自 auth/env 的胜出令牌                                         | `gateway.auth.password`                   |
| 同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs）且未设置 `gateway.auth.mode` | 失败；请显式设置 `gateway.auth.mode` |

## 认证解析（`--remote`）

如果实际生效的远程凭证配置为 SecretRefs，且既未传入 `--token` 也未传入 `--password`，该命令会从活动 Gateway 网关快照中解析它们。如果 Gateway 网关不可用，该命令会快速失败。

<Note>
此命令路径需要 Gateway 网关支持 `secrets.resolve` RPC 方法。较旧的 Gateway 网关会返回 unknown-method 错误。
</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [设备](/zh-CN/cli/devices)
- [配对](/zh-CN/cli/pairing)
