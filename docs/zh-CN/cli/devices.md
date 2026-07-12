---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/撤销）'
title: 设备
x-i18n:
    generated_at: "2026-07-12T14:22:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

管理设备配对请求和设备范围令牌。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认为 `gateway.remote.url`）
- `--token <token>`：Gateway 网关令牌（如果需要）
- `--password <password>`：Gateway 网关密码（密码身份验证）
- `--timeout <ms>`：RPC 超时时间
- `--json`：JSON 输出（建议用于脚本）

<Warning>
设置 `--url` 后，CLI 不会回退使用配置或环境变量中的凭据。请显式传入 `--token` 或 `--password`，否则命令将报错。
</Warning>

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对设备。

```bash
openclaw devices list
openclaw devices list --json
```

对于已配对设备上的待处理请求，输出会在设备当前已批准的访问权限旁显示请求的访问权限，以便清楚看到权限范围/角色升级，而不会看起来像配对丢失。

已配对设备显示名称采用以下优先级：操作员标签（通过 `devices rename` 设置的 `operatorLabel`）、客户端 `displayName`、`clientId`，最后是 `deviceId`。

### `openclaw devices approve [requestId] [--latest]`

通过准确的 `requestId` 批准待处理的配对请求。省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求，然后退出（代码 1）；请使用准确的请求 ID 重新运行以批准请求。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
如果设备使用变更后的身份验证详细信息（角色、权限范围或公钥）重试配对，OpenClaw 会用具有新 `requestId` 的条目取代先前的待处理条目。请在批准前立即运行 `openclaw devices list`，以获取当前 ID。
</Note>

批准行为：

- 如果设备已配对并请求更广泛的权限范围或角色，OpenClaw 会保留现有批准，并创建新的待处理升级请求。批准前，请在 `openclaw devices list` 中比较 `Requested` 和 `Approved`，或使用 `--latest` 预览。
- 批准 `node` 角色或其他非操作员角色需要 `operator.admin`。`operator.pairing` 足以批准操作员设备，但请求的操作员权限范围必须处于调用方自身的权限范围内。请参阅[操作员权限范围](/zh-CN/gateway/operator-scopes)。
- 如果配置了 `gateway.nodes.pairing.autoApproveCidrs`，来自匹配客户端 IP 的首次 `role: node` 请求可能会在出现在此列表之前自动获批。默认禁用；绝不适用于操作员/浏览器客户端或升级请求。
- `gateway.nodes.pairing.sshVerify`（默认启用）会在 Gateway 网关通过 SSH 向节点主机验证设备密钥后，自动批准首次 `role: node` 请求。因此，请求可能会在出现后不久变为已批准。设置 `sshVerify: false` 可禁用 SSH 验证；此设置与 `autoApproveCidrs` 相互独立，因此要仅允许手动配对，还需取消设置后者。

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

使用已配对设备令牌进行身份验证的调用方只能移除其**自身**的设备条目。移除其他设备需要 `operator.admin`。

### `openclaw devices rename --device <id> --name <label>`

为已配对设备分配操作员标签。标签是所有者侧状态：它们在配对修复和角色重新批准后仍会保留，并且不会更改稳定的 `deviceId`。

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` 为必填项，会去除首尾空白，不得为空，且最多为 64 个字符。
- 显示界面（CLI 列表、Control UI 清单）优先使用操作员标签，而不是客户端报告的显示名称。
- 非管理员的已配对设备调用方只能重命名其**自身**的设备。重命名其他设备需要 `operator.admin`。

### `openclaw devices clear --yes [--pending]`

批量清除已配对设备。必须通过 `--yes` 确认。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` 还会拒绝所有待处理的配对请求。

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

轮换某个角色的设备令牌，并可选择更新其权限范围。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- 目标角色必须已存在于该设备获批的配对约定中；轮换无法生成新的未批准角色。
- 省略 `--scope` 时，后续重新连接会复用存储令牌中缓存的已批准权限范围。传入显式的 `--scope` 值时，将替换存储的权限范围集合，用于未来使用缓存令牌的重新连接。
- 非管理员的已配对设备调用方只能轮换其**自身**的设备令牌，并且目标权限范围集合必须处于调用方自身的操作员权限范围内；轮换无法生成或保留比调用方现有权限更广的令牌。

以 JSON 形式返回轮换元数据。如果调用方在使用该设备令牌进行身份验证时轮换自身令牌，响应会包含替换令牌，以便客户端在重新连接前将其持久化。共享/管理员轮换绝不会回显持有者令牌。

### `openclaw devices revoke --device <id> --role <role>`

撤销某个角色的设备令牌。

```bash
openclaw devices revoke --device <deviceId> --role node
```

非管理员的已配对设备调用方只能撤销其**自身**的设备令牌。撤销其他设备的令牌需要 `operator.admin`。目标权限范围集合也必须处于调用方自身的操作员权限范围内；仅具有配对权限的调用方无法撤销管理员/写入操作员令牌。

## 注意事项

- 这些命令需要 `operator.pairing`（或 `operator.admin`）权限范围。非操作员设备角色始终需要 `operator.admin`；请参阅[操作员权限范围](/zh-CN/gateway/operator-scopes)。
- 令牌轮换和撤销仅限于设备获批的配对角色集合及权限范围基线。孤立的缓存令牌条目不会产生可管理的令牌目标。
- 对于已配对设备的令牌会话，跨设备管理（`remove`、`rename`、`rotate`、`revoke`）仅限自身，除非调用方具有 `operator.admin`。
- 令牌轮换会返回新令牌（敏感信息）——请像对待密钥一样对待它。
- 如果 local loopback 上无法使用配对权限范围，并且未显式传入 `--url`，`list`/`approve` 可以回退使用本地配对状态。

## 令牌漂移恢复检查清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH`、`AUTH_DEVICE_TOKEN_MISMATCH` 或 `AUTH_SCOPE_MISMATCH` 失败时，请使用此清单。

1. 确认当前 Gateway 网关令牌来源：

   ```bash
   openclaw config get gateway.auth.token
   ```

2. 列出已配对设备并确定受影响的设备 ID：

   ```bash
   openclaw devices list
   ```

3. 轮换受影响设备的操作员令牌：

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. 如果轮换不足以解决问题，请移除过期的配对并重新批准：

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. 使用当前共享令牌/密码重试客户端连接。

注意事项：

- 正常重新连接时的身份验证优先级：先使用显式共享令牌/密码，然后是显式 `deviceToken`，接着是已存储的设备令牌，最后是引导令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以在一次有界重试中临时同时发送共享令牌和已存储的设备令牌。
- `AUTH_SCOPE_MISMATCH` 表示设备令牌已被识别，但不包含请求的权限范围集合；请先修复配对/权限范围批准约定，再更改共享 Gateway 网关身份验证。

相关内容：

- [仪表板身份验证故障排除](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Paperclip / `openclaw_gateway` 首次运行批准

通过 `openclaw_gateway` 适配器连接的 Paperclip 智能体与任何其他新客户端一样，需要完成首次运行时的设备配对批准。如果 Paperclip 报告 `openclaw_gateway_pairing_required`，请批准待处理设备并重试。

```bash
openclaw devices approve --latest
```

预览会输出准确的 `openclaw devices approve <requestId>` 命令；验证详细信息后，使用请求 ID 重新运行该命令以批准请求。对于远程 Gateway 网关或显式凭据，请在预览和批准时传入相同的选项：

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

为避免每次重启后都要重新批准，请在 Paperclip 中配置持久的 `adapterConfig.devicePrivateKeyPem`，而不是让它每次运行都生成新的临时设备身份：

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

如果批准持续失败，请先运行 `openclaw devices list`，确认存在待处理请求。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
