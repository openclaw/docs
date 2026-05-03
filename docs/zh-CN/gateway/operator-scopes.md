---
read_when:
    - 调试缺少操作员作用域的错误
    - 审核设备或节点配对批准
    - 添加或分类 Gateway 网关 RPC 方法
summary: Gateway 网关客户端的操作员角色、作用域和批准时检查
title: 操作员权限范围
x-i18n:
    generated_at: "2026-05-03T23:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 作用域定义了 Gateway 网关客户端在完成身份验证后可以执行的操作。
它们是一个受信任 Gateway 网关操作员域内的控制平面护栏，
不是针对恶意多租户的隔离。如果你需要在人、团队或机器之间实现强隔离，
请在单独的 OS 用户或主机下运行独立的 Gateway 网关。

相关：[安全](/zh-CN/gateway/security)、[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Gateway 网关配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

Gateway 网关 WebSocket 客户端使用一种角色连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化和
  受信任的辅助进程。
- `node`：能力宿主，例如 macOS、iOS、Android，或通过 `node.invoke`
  暴露命令的无头节点。

Operator RPC 方法需要 `operator` 角色。节点发起的方法需要
`node` 角色。

## 作用域级别

| 作用域                  | 含义                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读 Status、列表、目录、日志、会话读取，以及其他不会改变状态的控制平面调用。                                                                                    |
| `operator.write`        | 常规的可变更 operator 操作，例如发送消息、调用工具、更新 talk/voice 设置，以及节点命令中继。也满足 `operator.read`。                      |
| `operator.admin`        | 管理性控制平面访问。满足所有 `operator.*` 作用域。配置变更、更新、原生钩子、敏感保留命名空间和高风险批准都需要它。 |
| `operator.pairing`      | 设备和节点配对管理，包括列出、批准、拒绝、移除、轮换和吊销配对记录或设备令牌。                                       |
| `operator.approvals`    | Exec 和插件批准 API。                                                                                                                                                        |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                     |

未知的未来 `operator.*` 作用域需要精确匹配，除非调用方拥有
`operator.admin`。

## 方法作用域只是第一道检查

每个 Gateway 网关 RPC 都有一个最小权限方法作用域。该方法作用域决定
请求是否可以到达处理器。然后，一些处理器会根据正在批准或变更的具体对象
应用更严格的批准时检查。

示例：

- `device.pair.approve` 可通过 `operator.pairing` 访问，但批准一个
  operator 设备时，只能签发或保留调用方已经持有的作用域。
- `node.pair.approve` 可通过 `operator.pairing` 访问，然后从待处理的
  节点命令列表派生额外的批准作用域。
- `chat.send` 通常是一个写入作用域方法，但持久化的 `/config set`
  和 `/config unset` 在命令级别需要 `operator.admin`。

这让较低作用域的 operator 可以执行低风险配对操作，而无需把
所有配对批准都设为仅管理员可用。

## 设备配对批准

设备配对记录是已批准角色和作用域的持久来源。
已配对设备不会静默获得更大的访问权限：如果重连时请求更大的角色或更大的作用域，
会创建一个新的待处理升级请求。

批准设备请求时：

- 没有 operator 角色的请求不需要 operator 令牌作用域批准。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用方必须持有
  这些作用域，或持有 `operator.admin`。
- 请求 `operator.admin` 时需要 `operator.admin`。
- 没有显式作用域的修复请求可以继承现有 operator 令牌作用域。
  如果该现有令牌带有管理员作用域，批准仍然需要
  `operator.admin`。

对于已配对设备的令牌会话，除非调用方同时拥有 `operator.admin`，
否则管理是自作用域的：非管理员调用方只能看到自己的配对条目，
只能批准或拒绝自己的待处理请求，并且只能轮换、吊销或移除自己的设备条目。

## 节点配对批准

旧版 `node.pair.*` 使用一个独立的 Gateway 网关拥有的节点配对存储。
WS 节点使用带有 `role: node` 的设备配对，但适用相同的批准级别词汇。

`node.pair.approve` 使用待处理请求命令列表来派生额外的必需作用域：

- 无命令请求：`operator.pairing`
- 非 exec 节点命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

节点配对建立身份和信任。它不会替代节点自己的
`system.run` exec 批准策略。

## 共享密钥身份验证

共享 Gateway 网关令牌/密码身份验证会被视为该 Gateway 网关的受信任 operator 访问。
OpenAI 兼容 HTTP surface 和 `/tools/invoke` 会为共享密钥 bearer 身份验证恢复
常规的完整 operator 默认作用域集，即使调用方发送了更窄的声明作用域。

带身份的模式，例如受信任代理身份验证或私有入口 `none`，
仍然可以遵循显式声明的作用域。请使用独立的 Gateway 网关来实现真正的信任边界隔离。
