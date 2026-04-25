---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/撤销）'
title: 设备
x-i18n:
    generated_at: "2026-04-25T05:53:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
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

当设备已配对时，待处理请求输出会在设备当前已批准访问权限旁边显示其请求的访问权限。这样可以明确显示作用域/角色升级，而不会看起来像是配对丢失了。

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

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传入 `--latest`，OpenClaw 只会打印所选的待处理请求并退出；在核实详情后，请使用精确请求 ID 重新运行批准命令。

注意：如果设备在认证详情发生变化后重试配对（角色/作用域/公钥），OpenClaw 会替换之前的待处理记录并签发新的 `requestId`。请在批准前立即运行 `openclaw devices list`，以使用当前 ID。

如果设备已经配对，并请求更宽的作用域或更高权限的角色，OpenClaw 会保留现有批准，并创建新的待处理升级请求。请查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，或使用 `openclaw devices approve --latest` 预览要批准的准确升级内容。

如果 Gateway 网关已显式配置 `gateway.nodes.pairing.autoApproveCidrs`，则来自匹配客户端 IP 的首次 `role: node` 请求，可能会在出现在此列表之前就被批准。该策略默认禁用，且绝不会应用于 operator/浏览器客户端或升级请求。

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

为特定角色轮换设备令牌（可选地更新作用域）。  
目标角色必须已经存在于该设备已批准的配对契约中；轮换不能生成一个新的、未获批准的角色。  
如果你省略 `--scope`，后续使用存储的已轮换令牌重新连接时，会复用该令牌缓存的已批准作用域。如果你传入显式的 `--scope` 值，这些值将成为未来缓存令牌重连时使用的已存储作用域集合。  
非管理员的已配对设备调用方只能轮换**自己的**设备令牌。  
此外，任何显式的 `--scope` 值都必须保持在调用方当前会话自身的 operator 作用域范围内；轮换不能生成比调用方现有权限更广的 operator 令牌。

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

- `--url <url>`：Gateway 网关 WebSocket URL（配置时默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关令牌（如需要）。
- `--password <password>`：Gateway 网关密码（密码认证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境变量中的凭证。  
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

## 说明

- 令牌轮换会返回一个新令牌（敏感）。请像对待密钥一样保管它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）作用域。
- `gateway.nodes.pairing.autoApproveCidrs` 是一个仅用于首次节点设备配对的可选启用 Gateway 网关策略；它不会改变 CLI 的批准权限。
- 令牌轮换始终限制在该设备已批准的配对角色集和已批准的作用域基线内。零散的缓存令牌记录不会授予新的轮换目标。
- 对于已配对设备令牌会话，跨设备管理仅限管理员：
  `remove`、`rotate` 和 `revoke` 默认仅允许操作自己，除非调用方具有 `operator.admin`。
- `devices clear` 被有意用 `--yes` 进行保护。
- 如果 local loopback 上没有可用的 pairing 作用域（且未传入显式 `--url`），`list/approve` 可以使用本地配对回退。
- `devices approve` 在生成令牌之前需要显式请求 ID；省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求。

## 令牌漂移恢复清单

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

4. 如果轮换仍不够，请移除过期配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌/密码重试客户端连接。

说明：

- 正常重连的认证优先级依次为：显式共享令牌/密码，然后是显式 `deviceToken`，然后是已存储设备令牌，最后是引导令牌。
- 对于受信任的 `AUTH_TOKEN_MISMATCH` 恢复，可以在一次受限重试中临时同时发送共享令牌和已存储设备令牌。

相关内容：

- [Dashboard auth troubleshooting](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关

- [CLI reference](/zh-CN/cli)
- [Nodes](/zh-CN/nodes)
