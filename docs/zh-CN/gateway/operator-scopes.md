---
read_when:
    - 调试缺少操作员作用域的错误
    - 查看设备或节点配对审批
    - 添加或分类 Gateway 网关 RPC 方法
summary: Gateway 网关客户端的操作员角色、作用域和批准时检查
title: 操作员作用域
x-i18n:
    generated_at: "2026-05-03T00:43:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 作用域定义了 Gateway 网关客户端在认证后可以执行什么操作。
它们是一个受信任 Gateway 网关 operator 域内的控制平面防护栏，
不是敌意多租户隔离。如果你需要在人员、团队或机器之间实现强隔离，
请在不同 OS 用户或主机下运行独立的 Gateway 网关。

相关：[安全](/zh-CN/gateway/security)、[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Gateway 网关配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

Gateway 网关 WebSocket 客户端以一种角色连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化以及
  受信任的辅助进程。
- `node`：能力主机，例如 macOS、iOS、Android，或通过
  `node.invoke` 暴露命令的无头节点。

Operator RPC 方法要求 `operator` 角色。节点发起的方法
要求 `node` 角色。

## 作用域级别

| 作用域                   | 含义                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读 Status、列表、目录、日志、会话读取，以及其他不会变更控制平面的调用。                                                                                    |
| `operator.write`        | 常规可变更 operator 操作，例如发送消息、调用工具、更新 talk/voice 设置，以及节点命令转发。也满足 `operator.read`。                      |
| `operator.admin`        | 管理性控制平面访问。满足每个 `operator.*` 作用域。配置变更、更新、原生钩子、敏感保留命名空间和高风险批准都需要它。 |
| `operator.pairing`      | 设备和节点配对管理，包括列出、批准、拒绝、移除、轮换和撤销配对记录或设备令牌。                                       |
| `operator.approvals`    | Exec 和插件批准 API。                                                                                                                                                        |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                     |

未知的未来 `operator.*` 作用域需要精确匹配，除非调用方拥有
`operator.admin`。

## 方法作用域只是第一道门槛

每个 Gateway 网关 RPC 都有一个最小权限方法作用域。该方法作用域决定
请求是否可以到达处理程序。然后，一些处理程序会根据具体要批准或变更的对象，
在批准时应用更严格的检查。

示例：

- `device.pair.approve` 可通过 `operator.pairing` 访问，但批准
  operator 设备时，只能签发或保留调用方已经持有的作用域。
- `node.pair.approve` 可通过 `operator.pairing` 访问，然后从待处理的节点命令列表中
  派生额外的批准作用域。
- `chat.send` 通常是写入作用域方法，但持久化的 `/config set`
  和 `/config unset` 在命令级别要求 `operator.admin`。

这让较低作用域的 operator 可以执行低风险配对操作，而不必让
所有配对批准都只能由管理员执行。

## 设备配对批准

设备配对记录是已批准角色和作用域的持久来源。
已配对设备不会静默获得更广泛访问权限：重新连接时如果请求
更广泛角色或更广泛作用域，会创建新的待处理升级请求。

批准设备请求时：

- 没有 operator 角色的请求不需要 operator 令牌作用域批准。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用方必须持有
  这些作用域，或持有 `operator.admin`。
- 请求 `operator.admin` 时需要 `operator.admin`。
- 没有显式作用域的修复请求可以继承现有 operator
  令牌作用域。如果该现有令牌具有 admin 作用域，批准仍然需要
  `operator.admin`。

对于已配对设备令牌会话，除非调用方也拥有 `operator.admin`，
否则管理操作受自身作用域限制：非管理员调用方只能轮换、撤销或移除
自己的设备条目。

## 节点配对批准

旧版 `node.pair.*` 使用单独的 Gateway 网关拥有的节点配对存储。WS 节点
使用带有 `role: node` 的设备配对，但适用相同的批准级别词汇。

`node.pair.approve` 使用待处理请求命令列表来派生额外的
必需作用域：

- 无命令请求：`operator.pairing`
- 非 exec 节点命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

节点配对建立身份和信任。它不会替代节点自身的
`system.run` exec 批准策略。

## 共享密钥认证

共享 gateway 令牌/密码认证会被视为该 Gateway 网关的受信任 operator 访问。
OpenAI 兼容 HTTP 接口和 `/tools/invoke` 会为共享密钥 bearer 认证
恢复正常的完整 operator 默认作用域集合，即使调用方发送了更窄的声明作用域。

带身份的模式，例如受信任代理认证或私有入口 `none`，
仍然可以遵守显式声明的作用域。对于真正的信任边界隔离，请使用独立的 Gateway 网关。
