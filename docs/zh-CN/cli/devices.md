---
read_when:
    - 你正在批准设备配对请求
    - 你需要轮换或撤销设备令牌
summary: '`openclaw devices` 的 CLI 参考（设备配对 + 令牌轮换/撤销）'
title: devices
x-i18n:
    generated_at: "2026-04-05T08:19:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
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

待处理请求的输出会包含请求的角色和作用域，以便你在批准前进行审核。

### `openclaw devices remove <deviceId>`

移除一个已配对设备条目。

当你使用已配对设备令牌进行身份验证时，非管理员调用方只能移除**自己的**设备条目。移除其他设备需要
`operator.admin`。

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

批准一个待处理的设备配对请求。如果省略 `requestId`，OpenClaw
会自动批准最近的待处理请求。

注意：如果设备在认证详情（角色/作用域/公钥）发生变化后重试配对，
OpenClaw 会替换之前的待处理条目并签发一个新的
`requestId`。请在批准前立即运行 `openclaw devices list`，以使用当前 ID。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒绝一个待处理的设备配对请求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

为特定角色轮换设备令牌（可选择同时更新作用域）。
目标角色必须已经存在于该设备已批准的配对契约中；
轮换不能铸造一个新的、未经批准的角色。
如果你省略 `--scope`，之后使用已存储的轮换后令牌重新连接时，会复用该
令牌缓存的已批准作用域。如果你传入显式的 `--scope` 值，这些值
将成为未来使用缓存令牌重新连接时所保存的作用域集合。
非管理员已配对设备调用方只能轮换**自己的**设备令牌。
另外，任何显式的 `--scope` 值都必须保持在调用方当前会话自身的
operator 作用域范围内；轮换不能铸造一个比调用方
当前已拥有权限更广的 operator 令牌。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 形式返回新的令牌负载。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备令牌。

非管理员已配对设备调用方只能撤销**自己的**设备令牌。
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

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。
请显式传递 `--token` 或 `--password`。缺少显式凭证会报错。

## 说明

- 令牌轮换会返回一个新令牌（敏感）。请像对待密钥一样妥善处理。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）作用域。
- 令牌轮换会限制在该设备已批准的配对角色集合和已批准作用域
  基线之内。一个偶然残留的缓存令牌条目不会授予新的
  轮换目标。
- 对于已配对设备令牌会话，跨设备管理仅限管理员：
  `remove`、`rotate` 和 `revoke` 仅允许操作自身设备，除非调用方具有
  `operator.admin`。
- `devices clear` 被有意通过 `--yes` 进行保护。
- 如果 local loopback 上没有配对作用域可用（且未传递显式 `--url`），`list`/`approve` 可以使用本地配对回退。
- 当你省略 `requestId` 或传递 `--latest` 时，`devices approve` 会自动选择最新的待处理请求。

## 令牌漂移恢复清单

当 Control UI 或其他客户端持续因 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时，请使用此清单。

1. 确认当前 Gateway 网关令牌来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 id：

```bash
openclaw devices list
```

3. 为受影响设备轮换 operator 令牌：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换还不够，请移除过期配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌/密码重试客户端连接。

说明：

- 正常的重连认证优先级依次为：显式共享令牌/密码优先，然后是显式 `deviceToken`，再然后是存储的设备令牌，最后是引导令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以在一次有界重试中，临时同时发送共享令牌和存储的设备令牌。

相关内容：

- [Dashboard 身份验证故障排除](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 网关故障排除](/gateway/troubleshooting#dashboard-control-ui-connectivity)
