---
read_when:
    - 你想快速将移动节点应用与 Gateway 网关配对
    - 你需要用于远程/手动共享的 setup-code 输出
summary: '`openclaw qr` 的 CLI 参考（生成移动端配对二维码 + 设置代码）'
title: QR
x-i18n:
    generated_at: "2026-07-05T11:11:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0caa7b53694ce63fab7fe1554809833c5df2b7499709a9137f3199ce01409757
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

根据你当前的 Gateway 网关配置生成移动端配对 QR 和设置代码。

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

当官方 OpenClaw iOS 和 Android 应用的设置代码元数据匹配时，它们会自动连接。如果某个请求仍处于待处理状态（例如非官方客户端或元数据不匹配），请检查并批准它：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果该 URL 未设置，则回退到 `gateway.tailscale.mode=serve|funnel`。忽略 `device-pair` 插件的 `publicUrl`。
- `--url <url>`：覆盖负载中使用的 Gateway 网关 URL
- `--public-url <url>`：覆盖负载中使用的公开 URL
- `--token <token>`：覆盖引导流程用于认证的 Gateway 网关令牌
- `--password <password>`：覆盖引导流程用于认证的 Gateway 网关密码
- `--setup-code-only`：仅打印设置代码
- `--no-ascii`：跳过 ASCII QR 渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

`--token` 和 `--password` 互斥。

## 设置代码内容

设置代码携带的是不透明、短生命周期的 `bootstrapToken`，而不是共享的 Gateway 网关令牌/密码。内置引导流程会签发：

- 一个主 `node` 令牌，带有 `scopes: []`
- 一个受限的 `operator` 交接令牌，仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`

配对变更权限范围和 `operator.admin` 仍需要单独批准的操作员配对或令牌流程。

## Gateway 网关 URL 解析

对于 Tailscale/公开的 `ws://` Gateway 网关 URL，移动端配对会默认拒绝：请对这些场景使用 Tailscale Serve/Funnel 或 `wss://` Gateway 网关 URL。私有局域网地址和 `.local` Bonjour 主机仍支持通过普通 `ws://` 使用。

使用 `--remote` 时，必须提供 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel` 之一。

## 身份验证解析（无 `--remote`）

未传入 CLI 身份验证覆盖项时，本地 Gateway 网关身份验证 SecretRefs 会按如下方式解析：

| 条件                                                                                                                    | 解析为                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`，或推断模式且没有胜出的密码来源                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`，或推断模式且没有来自身份验证/env 的胜出令牌                                         | `gateway.auth.password`                   |
| 同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），且未设置 `gateway.auth.mode` | 失败；请显式设置 `gateway.auth.mode` |

## 身份验证解析（`--remote`）

如果实际生效的远程凭据配置为 SecretRefs，且既未传入 `--token` 也未传入 `--password`，该命令会从活动 Gateway 网关快照中解析它们。如果 Gateway 网关不可用，该命令会快速失败。

<Note>
此命令路径需要支持 `secrets.resolve` RPC 方法的 Gateway 网关。较旧的 Gateway 网关会返回未知方法错误。
</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [设备](/zh-CN/cli/devices)
- [配对](/zh-CN/cli/pairing)
