---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/撤销）'
title: 设备
x-i18n:
    generated_at: "2026-04-27T14:14:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
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

当设备已配对时，待处理请求的输出会在该设备当前已批准的访问权限旁显示所请求的访问权限。这样可以明确展示作用域/角色升级，而不是看起来像配对已丢失。

### `openclaw devices remove <deviceId>`

删除一个已配对设备条目。

当你使用已配对设备令牌进行身份验证时，非管理员调用方只能删除**自己的**设备条目。删除其他设备需要 `operator.admin`。

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

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传入 `--latest`，OpenClaw 只会打印所选的待处理请求并退出；在核实详细信息后，请使用精确的请求 ID 重新运行批准命令。

<Note>
如果设备使用变更后的认证详情（角色、作用域或公钥）重试配对，OpenClaw 会取代之前的待处理条目并签发一个新的 `requestId`。请在批准前立即运行 `openclaw devices list` 以使用当前 ID。
</Note>

如果设备已配对且请求更宽泛的作用域或更高的角色，OpenClaw 会保留现有批准状态，并创建一个新的待处理升级请求。在批准前，请查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，或使用 `openclaw devices approve --latest` 预览精确的升级内容。

如果 Gateway 网关 已显式配置 `gateway.nodes.pairing.autoApproveCidrs`，来自匹配客户端 IP 的首次 `role: node` 请求可能会在出现在此列表之前就被批准。该策略默认禁用，且绝不会应用于 operator/browser 客户端或升级请求。

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
目标角色必须已存在于该设备已批准的配对契约中；轮换不能铸造新的未批准角色。
如果你省略 `--scope`，之后使用已存储的轮换后令牌重新连接时，会复用该令牌缓存的已批准作用域。如果你传入显式的 `--scope` 值，这些值将成为未来缓存令牌重新连接时所使用的已存储作用域集合。
非管理员已配对设备调用方只能轮换**自己的**设备令牌。
目标令牌的作用域集合必须保持在调用方当前会话自身的 operator 作用域范围内；轮换不能铸造或保留比调用方当前拥有的更宽泛的 operator 令牌。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 格式返回轮换元数据。如果调用方正在轮换自己的令牌，且当前使用该设备令牌进行身份验证，则响应还会包含替换令牌，以便客户端在重新连接前持久化保存。共享/管理员轮换不会回显 bearer token。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备令牌。

非管理员已配对设备调用方只能撤销**自己的**设备令牌。
撤销其他设备的令牌需要 `operator.admin`。
目标令牌的作用域集合也必须符合调用方当前会话自身的 operator 作用域；仅具备配对权限的调用方不能撤销 admin/write operator 令牌。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 格式返回撤销结果。

## 常用选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置时默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关令牌（如果需要）。
- `--password <password>`：Gateway 网关密码（密码认证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

<Warning>
当你设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。请显式传入 `--token` 或 `--password`。如果缺少显式凭证，将报错。
</Warning>

## 说明

- 令牌轮换会返回一个新令牌（敏感信息）。请像对待密钥一样对待它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）作用域。
- `gateway.nodes.pairing.autoApproveCidrs` 是一项可选启用的 Gateway 网关策略，仅适用于新的节点设备配对；它不会改变 CLI 的批准权限。
- 令牌轮换和撤销始终限制在该设备已批准的配对角色集合和已批准的作用域基线之内。一个游离的缓存令牌条目不会授予令牌管理目标。
- 对于已配对设备令牌会话，跨设备管理仅限管理员：`remove`、`rotate` 和 `revoke` 仅限操作自身，除非调用方具有 `operator.admin`。
- 令牌变更同样受调用方作用域限制：仅具备配对权限的会话不能轮换或撤销当前携带 `operator.admin` 或 `operator.write` 的令牌。
- `devices clear` 被有意通过 `--yes` 进行保护。
- 如果 local loopback 上不可用配对作用域（且未传入显式 `--url`），`list`/`approve` 可以使用本地配对回退。
- `devices approve` 在铸造令牌前需要显式请求 ID；省略 `requestId` 或传入 `--latest` 只会预览最新的待处理请求。

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

4. 如果轮换仍不足以解决问题，请移除过期配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌/密码重试客户端连接。

说明：

- 正常重连认证优先级依次为：显式共享令牌/密码，然后是显式 `deviceToken`，然后是已存储设备令牌，最后是引导令牌。
- 可信的 `AUTH_TOKEN_MISMATCH` 恢复在一次受限重试中，可以临时同时发送共享令牌和已存储设备令牌。

相关内容：

- [Dashboard 认证故障排除](/zh-CN/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)
