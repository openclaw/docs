---
read_when:
    - 调试缺失 operator 作用域错误
    - 审查设备或节点配对审批
    - 添加或分类 Gateway 网关 RPC 方法
summary: Gateway 网关客户端的操作员角色、作用域和审批时检查
title: 操作员作用域
x-i18n:
    generated_at: "2026-06-27T02:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 作用域定义 Gateway 网关客户端在完成身份验证后可以执行的操作。
它们是一个受信任 Gateway 网关运营者域内的控制平面护栏，
不是敌对多租户隔离。如果你需要在人员、团队或机器之间实现强隔离，
请在不同 OS 用户或主机下运行独立的 Gateway 网关。

相关：[安全](/zh-CN/gateway/security)、[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Gateway 网关配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

Gateway 网关 WebSocket 客户端使用一个角色连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化，以及
  受信任的辅助进程。
- `node`：能力主机，例如 macOS、iOS、Android，或通过 `node.invoke`
  暴露命令的无头节点。

Operator RPC 方法需要 `operator` 角色。节点发起的方法
需要 `node` 角色。

## 作用域级别

| 作用域                  | 含义                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读状态、列表、目录、日志、会话读取，以及其他非变更型控制平面调用。                                                                                    |
| `operator.write`        | 常规变更型 operator 操作，例如发送消息、调用工具、更新 Talk/语音设置，以及节点命令中继。也满足 `operator.read`。                      |
| `operator.admin`        | 管理性控制平面访问。满足所有 `operator.*` 作用域。配置变更、更新、原生钩子、敏感保留命名空间和高风险审批都需要它。 |
| `operator.pairing`      | 设备和节点配对管理，包括列出、批准、拒绝、移除、轮换和撤销配对记录或设备令牌。                                       |
| `operator.approvals`    | Exec 和插件审批 API。                                                                                                                                                        |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                     |

未知的未来 `operator.*` 作用域需要精确匹配，除非调用者拥有
`operator.admin`。

## 方法作用域只是第一道门槛

每个 Gateway 网关 RPC 都有一个最小权限方法作用域。该方法作用域决定
请求是否可以到达处理程序。随后，某些处理程序会根据被批准或变更的具体对象，
应用更严格的审批时检查。

示例：

- `device.pair.approve` 可以通过 `operator.pairing` 访问，但批准
  operator 设备只能签发或保留调用者已拥有的作用域。
- `node.pair.approve` 可以通过 `operator.pairing` 访问，然后会从待处理节点命令列表中
  推导出额外的审批作用域。
- `chat.send` 通常是一个写入作用域方法，但持久化 `/config set`
  和 `/config unset` 需要命令级别的 `operator.admin`。

这让较低作用域的 operator 可以执行低风险配对操作，而不必把
所有配对审批都设为仅管理员可用。

## 设备配对审批

设备配对记录是已批准角色和作用域的持久来源。
已配对设备不会被静默授予更宽的访问权限：重新连接时如果请求
更宽的角色或更宽的作用域，会创建新的待处理升级请求。

批准设备请求时：

- 没有 operator 角色的请求不需要 operator 令牌作用域审批。
- 请求非 operator 设备角色（例如 `node`）需要
  `operator.admin`，即使 `device.pair.approve` 可通过
  `operator.pairing` 访问。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用者必须持有
  这些作用域，或持有 `operator.admin`。
- 请求 `operator.admin` 需要 `operator.admin`。
- 没有显式作用域的修复请求可以继承现有 operator
  令牌作用域。如果该现有令牌具有管理员作用域，审批仍然需要
  `operator.admin`。

非管理员共享密钥会话和受信任代理会话只能在它们自己声明的 operator 作用域内
批准 operator 设备请求。批准非 operator
角色仅限管理员，即使这些会话原本可以使用
`operator.pairing`。

对于已配对设备令牌会话，管理同样受自身作用域限制，除非
调用者拥有 `operator.admin`：非管理员调用者只能看到自己的配对
条目，只能批准或拒绝自己的待处理请求，并且只能轮换、
撤销或移除自己的设备条目。

## 节点配对审批

旧版 `node.pair.*` 使用单独的 Gateway 网关拥有的节点配对存储。WS 节点
使用带有 `role: node` 的设备配对，但同一套审批级别词汇
仍然适用。

`node.pair.approve` 使用待处理请求命令列表来推导额外的
必需作用域：

- 无命令请求：`operator.pairing`
- 非 exec 节点命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

节点配对建立身份和信任。它不会替代节点自身的
`system.run` exec 审批策略。

## 共享密钥认证

共享 Gateway 网关令牌/密码认证会被视为该 Gateway 网关的受信任 operator 访问。
OpenAI 兼容 HTTP 表面、`/tools/invoke` 和 HTTP 会话
历史端点会为共享密钥 bearer 认证恢复常规完整 operator 默认作用域集，
即使调用者发送了更窄的声明作用域。

带身份的模式，例如受信任代理认证或私有入口 `none`，
仍然可以遵循显式声明的作用域。请使用独立 Gateway 网关来实现真正的信任
边界隔离。
