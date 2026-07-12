---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要输出设置代码，以便远程/手动共享
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码和设置代码）'
title: 二维码
x-i18n:
    generated_at: "2026-07-11T20:25:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据当前的 Gateway 网关配置生成移动设备配对二维码和设置代码。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

当设置代码的元数据匹配时，官方 OpenClaw iOS 和 Android 应用会自动连接。如果请求仍处于待处理状态（例如使用非官方客户端或元数据不匹配），请查看并批准该请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置该 URL，则回退到 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 插件的 `publicUrl`。
- `--url <url>`：覆盖载荷中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖载荷中使用的公共 URL
- `--token <token>`：覆盖引导流程用于身份验证的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程用于身份验证的 Gateway 网关密码
- `--setup-code-only`：仅输出设置代码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、可选的 `gatewayUrls`、`auth`、`urlSource`）

`--token` 和 `--password` 互斥。

## 设置代码内容

设置代码携带的是不透明的短期 `bootstrapToken`，而不是共享的 Gateway 网关令牌或密码。内置引导流程会签发：

- 一个主要的 `node` 令牌，带有 `scopes: []`
- 一个受限的 `operator` 交接令牌，其权限仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

配对变更权限范围和 `operator.admin` 仍需要单独获批的操作员配对或令牌流程。

## Gateway 网关 URL 解析

对于使用 Tailscale 或公共 `ws://` 的 Gateway 网关 URL，移动设备配对会以失败关闭方式处理：请使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。专用局域网地址和 `.local` Bonjour 主机仍支持通过普通 `ws://` 连接。

当选定的 Gateway 网关 URL 来自 `gateway.bind=lan` 时，OpenClaw 还会检查持久化的 `tailscale serve status --json` 路由。任何代理到活动 Gateway 网关 local loopback 端口的 HTTPS Serve 根路由都会作为回退项包含在内。二维码命令仅针对 `lan` 添加此回退项；`custom` 和 `tailnet` 会保留其明确公布的路由。当前 iOS 客户端会按顺序探测公布的路由，并保存第一个可访问的路由；旧版 `url` 字段保持不变，以供较旧的客户端使用。

使用 `--remote` 时，必须配置 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 之一。

## 身份验证解析（不使用 `--remote`）

未传入 CLI 身份验证覆盖参数时，本地 Gateway 网关身份验证 SecretRef 按以下方式解析：

| 条件                                                                                                                         | 解析为                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推断模式下不存在优先级更高的密码来源                                                          | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推断模式下身份验证配置和环境变量中不存在优先级更高的令牌                                    | `gateway.auth.password`                   |
| 同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），且未设置 `gateway.auth.mode`                   | 失败；请显式设置 `gateway.auth.mode`      |

## 身份验证解析（使用 `--remote`）

如果实际生效的远程凭据被配置为 SecretRef，并且未传入 `--token` 或 `--password`，该命令会从活动的 Gateway 网关快照中解析这些凭据。如果 Gateway 网关不可用，该命令会立即失败。

<Note>
此命令路径要求 Gateway 网关支持 `secrets.resolve` RPC 方法。较旧的 Gateway 网关会返回“未知方法”错误。
</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [设备](/zh-CN/cli/devices)
- [配对](/zh-CN/cli/pairing)
