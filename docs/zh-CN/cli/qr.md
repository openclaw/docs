---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要输出设置代码，以便远程或手动共享
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码和设置代码）'
title: 二维码
x-i18n:
    generated_at: "2026-07-16T11:34:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据当前 Gateway 配置生成移动设备配对二维码和设置代码。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

当设置代码元数据匹配时，OpenClaw 官方 iOS 和 Android 应用会自动连接。如果请求仍处于待处理状态（例如，使用非官方客户端或元数据不匹配），请检查并批准该请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果该 URL 未设置，则回退到 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 插件 `publicUrl`。
- `--url <url>`：覆盖载荷中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖载荷中使用的公共 URL
- `--token <token>`：覆盖引导流程进行身份验证时所用的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程进行身份验证时所用的 Gateway 网关密码
- `--limited`：从移交的操作员令牌中省略 Gateway 网关管理访问权限
- `--setup-code-only`：仅输出设置代码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、可选的 `gatewayUrls`、`auth`、`access`、可选的 `accessDowngraded`、`urlSource`）

`--token` 和 `--password` 互斥。

## 设置代码内容

设置代码携带的是不透明、短期有效的 `bootstrapToken`，而不是共享的 Gateway 网关令牌或密码。对于 `wss://` 端点（或同一主机上的环回地址），默认引导流程会签发：

- 一个具有 `scopes: []` 的主要 `node` 令牌
- 一个完整的原生移动端 `operator` 移交令牌，具有 `operator.admin`、`operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

使用 `--limited` 可保留相同的节点令牌，同时从操作员移交中省略 `operator.admin`。设置代码绝不会移交配对变更权限范围。

明文 LAN `ws://` 设置仍然可用，但 OpenClaw 会自动使用受限配置，因为网络观察者可能会捕获持有者引导令牌并抢先使用。配置 `wss://` 或 Tailscale Serve，然后生成新代码以获得完整访问权限。

## Gateway 网关 URL 解析

对于 Tailscale/公共 `ws://` Gateway 网关 URL，移动设备配对会采用失败关闭策略：请为这些 URL 使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。私有 LAN 地址和 `.local` Bonjour 主机仍支持通过明文 `ws://` 访问，并且操作员访问权限会按上述说明受到限制。

当所选 Gateway 网关 URL 来自 `gateway.bind=lan` 时，OpenClaw 还会检查持久化的 `tailscale serve status --json` 路由。任何代理到当前 Gateway 网关环回端口的 HTTPS Serve 根路由都会作为回退路由包含在内。QR 命令仅为 `lan` 添加此回退路由；`custom` 和 `tailnet` 会保留各自明确公布的路由。当前 iOS 客户端会按顺序探测公布的路由，并保存第一个可访问的路由；旧版 `url` 字段保持不变，以兼容较旧的客户端。

使用 `--remote` 时，必须提供 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 之一。

## 身份验证解析（无 `--remote`）

未传入 CLI 身份验证覆盖项时，本地 Gateway 网关身份验证 SecretRef 按以下方式解析：

| 条件                                                                                                                    | 解析为                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推断模式下没有最终采用的密码来源                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推断模式下身份验证配置/环境变量中没有最终采用的令牌                                         | `gateway.auth.password`                   |
| 同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），且未设置 `gateway.auth.mode` | 失败；请显式设置 `gateway.auth.mode` |

## 身份验证解析（`--remote`）

如果实际处于活动状态的远程凭据配置为 SecretRef，且未传入 `--token` 或 `--password`，该命令会从当前 Gateway 网关快照中解析这些凭据。如果 Gateway 网关不可用，该命令会快速失败。

<Note>
此命令路径要求 Gateway 网关支持 `secrets.resolve` RPC 方法。较旧的 Gateway 网关会返回未知方法错误。
</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [设备](/zh-CN/cli/devices)
- [配对](/zh-CN/cli/pairing)
