---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换 / 撤销）'
title: 设备
x-i18n:
    generated_at: "2026-04-24T04:00:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

管理设备配对请求和设备范围令牌。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对的设备。

```
openclaw devices list
openclaw devices list --json
```

待处理请求的输出会在设备已配对时，将请求的访问权限显示在该设备当前已批准访问权限旁边。这样可以明确显示 scope / 角色升级，而不会看起来像是配对丢失了。

### `openclaw devices remove <deviceId>`

移除一条已配对设备记录。

当你使用已配对设备令牌完成认证时，非管理员调用方只能移除**自己的**设备记录。移除其他设备需要 `operator.admin`。

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

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传入 `--latest`，OpenClaw 只会打印所选的待处理请求并退出；请在验证详细信息后，使用精确的请求 ID 重新运行批准命令。

注意：如果设备使用变更后的认证详细信息（角色 / scopes / 公钥）重试配对，OpenClaw 会替换之前的待处理记录，并发出新的 `requestId`。请在批准前立刻运行 `openclaw devices list`，以使用当前 ID。

如果设备已经配对，并请求更宽的 scopes 或更高的角色，OpenClaw 会保留现有批准状态，并创建新的待处理升级请求。请查看 `openclaw devices list` 中的 `Requested` 和 `Approved` 列，或使用 `openclaw devices approve --latest` 在批准前预览准确的升级内容。

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

为特定角色轮换设备令牌（可选更新 scopes）。
目标角色必须已经存在于该设备已批准的配对契约中；轮换不能生成新的、未经批准的角色。
如果你省略 `--scope`，以后使用存储的已轮换令牌重新连接时，将复用该令牌缓存的已批准 scopes。如果你显式传入 `--scope` 值，这些值将成为未来缓存令牌重连时存储的 scope 集合。
非管理员的已配对设备调用方只能轮换**自己的**设备令牌。
此外，任何显式的 `--scope` 值都必须保持在调用方当前会话自己的 operator scopes 范围内；轮换不能生成比调用方现有权限更宽的 operator 令牌。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 形式返回新的令牌负载。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备令牌。

非管理员的已配对设备调用方只能撤销**自己的**设备令牌。
撤销其他设备的令牌需要 `operator.admin`。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 形式返回撤销结果。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关令牌（如需要）。
- `--password <password>`：Gateway 网关密码（密码认证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（建议用于脚本）。

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境变量中的凭证。
请显式传入 `--token` 或 `--password`。如果缺少显式凭证，将报错。

## 说明

- 令牌轮换会返回一个新令牌（敏感信息）。请像对待机密一样处理它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）scope。
- 令牌轮换会保持在该设备已批准的配对角色集合和已批准 scope 基线之内。意外存在的缓存令牌记录不会授予新的轮换目标。
- 对于已配对设备令牌会话，跨设备管理仅限管理员：`remove`、`rotate` 和 `revoke` 仅限管理自己的设备，除非调用方具有 `operator.admin`。
- `devices clear` 会被 `--yes` 有意保护。
- 如果 local loopback 上不可用配对 scope（且未显式传入 `--url`），`list` / `approve` 可以使用本地配对回退机制。
- `devices approve` 在生成令牌前需要显式请求 ID；省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求。

## 令牌漂移恢复检查清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时，请使用此清单。

1. 确认当前 Gateway 网关令牌来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 ID：

```bash
openclaw devices list
```

3. 为受影响设备轮换 operator 令牌：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换还不够，请移除陈旧配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌 / 密码重试客户端连接。

说明：

- 正常重连认证优先级依次为：显式共享令牌 / 密码，然后是显式 `deviceToken`，然后是存储的设备令牌，最后是 bootstrap 令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以在一次受限重试中，临时同时发送共享令牌和存储的设备令牌。

相关内容：

- [Dashboard 认证故障排除](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
