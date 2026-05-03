---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/吊销）'
title: 设备
x-i18n:
    generated_at: "2026-05-03T00:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理设备配对请求和设备作用域令牌。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对设备。

```
openclaw devices list
openclaw devices list --json
```

当设备已经配对时，待处理请求的输出会在设备当前已批准访问权限旁显示请求的访问权限。这样可以明确呈现作用域/角色升级，而不会看起来像配对已丢失。

### `openclaw devices remove <deviceId>`

移除一个已配对设备条目。

当你使用已配对设备令牌进行身份验证时，非管理员调用方只能移除**自己的**设备条目。移除其他设备需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

批量清除已配对设备。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传入 `--latest`，OpenClaw 只会打印选中的待处理请求并退出；验证详情后，使用精确的请求 ID 重新运行批准命令。

<Note>
如果设备使用更改后的身份验证详情（角色、作用域或公钥）重试配对，OpenClaw 会取代先前的待处理条目并签发新的 `requestId`。请在批准前立即运行 `openclaw devices list`，以使用当前 ID。
</Note>

如果设备已经配对，并请求更宽的作用域或更高的角色，OpenClaw 会保留现有批准，并创建新的待处理升级请求。查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，或使用 `openclaw devices approve --latest` 在批准前预览精确的升级内容。

如果 Gateway 网关显式配置了 `gateway.nodes.pairing.autoApproveCidrs`，来自匹配客户端 IP 的首次 `role: node` 请求可以在出现在此列表之前被批准。该策略默认禁用，并且绝不适用于操作员/浏览器客户端或升级请求。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒绝待处理的设备配对请求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

为特定角色轮换设备令牌（可选择更新作用域）。
目标角色必须已经存在于该设备已批准的配对契约中；轮换不能生成新的未批准角色。
如果省略 `--scope`，之后使用存储的已轮换令牌重新连接时，会复用该令牌缓存的已批准作用域。如果传入显式的 `--scope` 值，这些值会成为未来缓存令牌重新连接时存储的作用域集合。
非管理员已配对设备调用方只能轮换**自己的**设备令牌。
目标令牌作用域集合必须保持在调用方会话自身的操作员作用域内；轮换不能生成或保留比调用方现有权限更宽的操作员令牌。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 返回轮换元数据。如果调用方在使用该设备令牌进行身份验证时轮换自己的令牌，响应还会包含替换令牌，以便客户端在重新连接前持久化它。共享/管理员轮换不会回显 bearer 令牌。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备令牌。

非管理员已配对设备调用方只能撤销**自己的**设备令牌。撤销其他设备的令牌需要 `operator.admin`。
目标令牌作用域集合也必须适配调用方会话自身的操作员作用域；仅配对调用方不能撤销管理员/写入操作员令牌。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 返回撤销结果。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认为 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关令牌（如果需要）。
- `--password <password>`：Gateway 网关密码（密码身份验证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

<Warning>
当你设置 `--url` 时，CLI 不会回退到配置或环境凭证。请显式传入 `--token` 或 `--password`。缺少显式凭证是错误。
</Warning>

## 注释

- 令牌轮换会返回新令牌（敏感）。请像对待密钥一样处理它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）作用域。某些批准还要求调用方持有目标设备将生成或继承的操作员作用域；请参阅[操作员作用域](/zh-CN/gateway/operator-scopes)。
- `gateway.nodes.pairing.autoApproveCidrs` 是一个仅用于新节点设备配对的可选 Gateway 网关策略；它不会更改 CLI 批准权限。
- 令牌轮换和撤销会保持在该设备已批准的配对角色集合和已批准作用域基线内。零散的缓存令牌条目不会授予令牌管理目标权限。
- 对于已配对设备令牌会话，跨设备管理仅限管理员：除非调用方具有 `operator.admin`，否则 `remove`、`rotate` 和 `revoke` 只能作用于自身。
- 令牌变更也受调用方作用域约束：仅配对会话不能轮换或撤销当前携带 `operator.admin` 或 `operator.write` 的令牌。
- `devices clear` 有意由 `--yes` 保护。
- 如果 local loopback 上不可用配对作用域（且未传入显式的 `--url`），list/approve 可以使用本地配对回退。
- `devices approve` 在生成令牌前需要显式请求 ID；省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求。

## 令牌漂移恢复检查清单

当控制 UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时使用此清单。

1. 确认当前 Gateway 网关令牌来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 ID：

```bash
openclaw devices list
```

3. 为受影响设备轮换操作员令牌：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换仍不足以解决问题，移除过期配对并再次批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌/密码重试客户端连接。

注释：

- 正常重新连接的身份验证优先级是先显式共享令牌/密码，然后显式 `deviceToken`，然后存储的设备令牌，最后是引导令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以在一次有界重试中临时同时发送共享令牌和存储的设备令牌。

相关：

- [仪表板身份验证故障排除](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
