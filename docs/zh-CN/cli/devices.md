---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/撤销）'
title: 设备
x-i18n:
    generated_at: "2026-07-05T11:06:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d6233acac966b3fd83618935e732366a40650503cb2e21b347e93be3e1ce5d5
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理设备配对请求和设备范围令牌。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认为 `gateway.remote.url`）
- `--token <token>`：Gateway 网关令牌（如需要）
- `--password <password>`：Gateway 网关密码（密码认证）
- `--timeout <ms>`：RPC 超时
- `--json`：JSON 输出（建议用于脚本）

<Warning>
设置 `--url` 时，CLI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`，否则命令会报错。
</Warning>

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对设备。

```bash
openclaw devices list
openclaw devices list --json
```

对于已配对设备上的待处理请求，输出会在设备当前已批准访问权限旁显示请求的访问权限，因此作用域/角色升级会清晰可见，而不会看起来像丢失了配对。

### `openclaw devices approve [requestId] [--latest]`

通过精确的 `requestId` 批准待处理的配对请求。省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求并退出（代码 1）；请使用精确的请求 ID 重新运行以批准。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
如果设备使用变更后的认证详情（角色、作用域或公钥）重试配对，OpenClaw 会用新的 `requestId` 取代之前的待处理条目。请在批准前立即运行 `openclaw devices list` 获取当前 ID。
</Note>

批准行为：

- 如果设备已经配对并请求更宽的作用域或角色，OpenClaw 会保留现有批准并创建新的待处理升级请求。批准前，请在 `openclaw devices list` 中比较 `Requested` 与 `Approved`，或使用 `--latest` 预览。
- 批准 `node` 角色或其他非操作员角色需要 `operator.admin`。`operator.pairing` 足以批准操作员设备，但仅当请求的操作员作用域保持在调用方自身作用域内时有效。参见 [操作员权限范围](/zh-CN/gateway/operator-scopes)。
- 如果配置了 `gateway.nodes.pairing.autoApproveCidrs`，来自匹配客户端 IP 的首次 `role: node` 请求可以在出现在此列表前自动批准。默认禁用；绝不适用于操作员/浏览器客户端或升级请求。

### `openclaw devices reject <requestId>`

拒绝待处理的设备配对请求。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

移除一个已配对设备条目。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

使用已配对设备令牌认证的调用方只能移除其**自己的**设备条目。移除其他设备需要 `operator.admin`。

### `openclaw devices clear --yes [--pending]`

批量清除已配对设备。受 `--yes` 保护。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` 也会拒绝所有待处理的配对请求。

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

为某个角色轮换设备令牌，并可选择更新其作用域。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 目标角色必须已经存在于该设备已批准的配对合约中；轮换不能生成新的未批准角色。
- 省略 `--scope` 会在后续重新连接时复用已存储令牌的缓存批准作用域。传入显式 `--scope` 值会替换未来缓存令牌重新连接使用的已存储作用域集合。
- 非管理员的已配对设备调用方只能轮换其**自己的**设备令牌，且目标作用域集合必须保持在调用方自身操作员作用域内；轮换不能生成或保留比调用方已有权限更宽的令牌。

以 JSON 返回轮换元数据。如果调用方在使用该设备令牌认证时轮换自己的令牌，响应会包含替换令牌，以便客户端在重新连接前持久化它。共享/管理员轮换绝不会回显 bearer 令牌。

### `openclaw devices revoke --device <id> --role <role>`

撤销某个角色的设备令牌。

```bash
openclaw devices revoke --device <deviceId> --role node
```

非管理员的已配对设备调用方只能撤销其**自己的**设备令牌。撤销其他设备的令牌需要 `operator.admin`。目标作用域集合也必须适合调用方自身的操作员作用域；仅具备配对权限的调用方不能撤销管理员/写入操作员令牌。

## 说明

- 这些命令需要 `operator.pairing`（或 `operator.admin`）作用域。非操作员设备角色始终需要 `operator.admin`；参见 [操作员权限范围](/zh-CN/gateway/operator-scopes)。
- 令牌轮换和撤销保持在设备已批准的配对角色集合和作用域基线内。零散的缓存令牌条目不会授予令牌管理目标。
- 对于已配对设备令牌会话，跨设备管理（`remove`、`rotate`、`revoke`）默认只能管理自身，除非调用方拥有 `operator.admin`。
- 令牌轮换会返回新令牌（敏感信息）——请像处理密钥一样处理它。
- 如果 local loopback 上无法使用配对作用域，并且未传入显式 `--url`，`list`/`approve` 可以回退到本地配对状态。

## 令牌漂移恢复检查清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 失败时使用此清单。

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

4. 如果轮换还不够，请移除陈旧配对并重新批准：

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 使用当前共享令牌/密码重试客户端连接。

说明：

- 正常重新连接认证优先级：先使用显式共享令牌/密码，然后使用显式 `deviceToken`，然后使用已存储设备令牌，最后使用 bootstrap 令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以临时同时发送共享令牌和已存储设备令牌，用于一次有界重试。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但不携带请求的作用域集合；请先修复配对/作用域批准合约，再更改共享 Gateway 网关认证。

相关内容：

- [Dashboard 认证故障排查](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` 首次运行批准

通过 `openclaw_gateway` 适配器连接的 Paperclip 智能体会像任何其他新客户端一样经历首次运行设备配对批准。如果 Paperclip 报告 `openclaw_gateway_pairing_required`，请批准待处理设备并重试。

```bash
openclaw devices approve --latest
```

预览会打印精确的 `openclaw devices approve <requestId>` 命令；请验证详情，然后使用请求 ID 重新运行该命令以批准。对于远程 Gateway 网关或显式凭据，请在预览和批准时传入相同选项：

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

为了避免每次重启后重新批准，请在 Paperclip 中配置持久的 `adapterConfig.devicePrivateKeyPem`，而不是让它每次运行都生成新的临时设备身份：

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

如果批准持续失败，请先运行 `openclaw devices list` 确认存在待处理请求。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
