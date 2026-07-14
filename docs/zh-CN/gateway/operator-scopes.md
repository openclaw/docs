---
read_when:
    - 调试缺少操作员权限范围的错误
    - 审核设备或节点配对审批
    - 添加或分类 Gateway 网关 RPC 方法
summary: Gateway 网关客户端的操作员角色、权限范围与审批时检查
title: 操作员权限范围
x-i18n:
    generated_at: "2026-07-14T13:39:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作员权限范围用于限制 Gateway 网关客户端通过身份验证后可以执行的操作。
它们是单个可信 Gateway 网关操作员域内的控制平面防护机制，
而不是用于抵御恶意行为的多租户隔离机制。若要在人员、
团队或机器之间实现强隔离，请在不同的操作系统用户或主机下运行独立的 Gateway 网关。

相关内容：[安全](/zh-CN/gateway/security)、[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Gateway 网关配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

每个 Gateway 网关 WebSocket 客户端都使用一种角色连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化系统和
  可信辅助进程。
- `node`：能力主机（macOS、iOS、Android、无头设备），它们通过
  `node.invoke` 公开命令。

操作员 RPC 方法要求 `operator` 角色；源自节点的方法
要求 `node` 角色。

## 权限范围级别

| 权限范围                   | 含义                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读状态、列表、目录、日志、会话读取及其他非变更调用。                                                                          |
| `operator.write`        | 会产生变更的操作员操作：发送消息、调用工具、更新 Talk/语音设置、转发节点命令。同时满足 `operator.read`。                |
| `operator.admin`        | 管理访问权限。满足所有 `operator.*` 权限范围。更改配置、执行更新、使用原生钩子、访问保留命名空间和进行高风险审批时必须具备此权限。 |
| `operator.pairing`      | 设备和节点配对管理：列出、批准、拒绝、移除、轮换、撤销。                                                                            |
| `operator.approvals`    | Exec 和插件审批 API。                                                                                                                                |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                             |

对于未来未知的 `operator.*` 权限范围，必须精确匹配，除非调用方
已持有 `operator.admin`。

## 方法权限范围只是第一道关卡

每个 Gateway 网关 RPC 都有一个最小权限方法范围，用于决定
请求能否到达其处理程序。部分处理程序随后会根据
具体审批或变更的对象实施更严格的检查：

- `device.pair.approve` 可通过 `operator.pairing` 访问，但在批准
  操作员设备时，只能授予或保留调用方已经持有的权限范围。
- `node.pair.approve` 可通过 `operator.pairing` 访问，随后会根据
  待处理节点声明的命令列表推导额外的审批权限范围。
- `chat.send` 是一个写入权限方法，但 `/config set` 和
  `/config unset` 聊天命令还要求具备 `operator.admin`，
  无论调用方具有什么聊天发送权限范围。

这样，权限范围较低的操作员便可执行低风险配对操作，
而无需将所有配对审批都限制为仅管理员可用。

## 设备配对审批

设备配对记录是已批准角色和权限范围的持久化事实来源。
已配对的设备不会被静默授予更广泛的访问权限：如果重新连接时
请求更广泛的角色或权限范围，系统会创建新的待处理升级请求。

批准设备请求时：

- 不包含操作员角色的请求无需操作员权限范围审批。
- 请求非操作员设备角色（例如 `node`）时必须具备
  `operator.admin`，即使 `device.pair.approve` 本身只要求
  `operator.pairing`。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用方必须已经
  持有相应权限范围或 `operator.admin`。
- 请求 `operator.admin` 时必须具备 `operator.admin`。
- 没有显式权限范围的修复请求可以继承现有操作员
  令牌的权限范围；如果该令牌具有管理员权限范围，审批仍然要求
  `operator.admin`。

使用非管理员共享密钥和可信代理的会话只能在自身声明的
操作员权限范围内批准操作员设备请求；即使这些会话可以使用
`operator.pairing` 执行其他操作，批准非操作员角色仍仅限管理员。

对于使用已配对设备令牌的会话，除非调用方具有
`operator.admin`，否则管理操作仅限自身：非管理员调用方只能看到自己的配对条目，
并且只能批准、拒绝、轮换、撤销或移除自己的设备条目。

## 节点配对审批

旧版 `node.pair.*` 方法使用由 Gateway 网关单独拥有的节点配对存储。
WS 节点改用设备配对（`role: node`），但适用相同的审批
术语。有关这两种存储之间的关系，请参阅 [Gateway 网关配对](/zh-CN/gateway/pairing)。

`node.pair.approve` 会根据待处理请求的
命令列表推导额外的必需权限范围：

| 声明的命令                                                                                                    | 必需的权限范围                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 无                                                                                                                 | `operator.pairing`                    |
| 普通节点命令                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir` 或 `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

批准节点声明不会启用受单独
运行时允许列表关卡限制的命令。例如，批准声明了
`computer.act` 的节点需要配对权限和写入权限范围，但这只会记录该功能入口。
管理员或所有者仍必须启用 `computer.act`。在其保持
启用期间，通过具有写入权限范围的 `node.invoke` 方法调用它时，
无需为每次操作提供管理员权限范围。

节点配对用于建立身份和信任；它不能取代节点自身的
`system.run` Exec 审批策略。

## 共享密钥身份验证

共享 Gateway 网关令牌/密码身份验证会被视为该 Gateway 网关的
可信操作员访问。对于使用共享密钥不记名身份验证的请求，OpenAI 兼容 HTTP 接口、
`/tools/invoke` 和 HTTP 会话历史记录端点会恢复完整的默认操作员权限范围集，
即使调用方发送了更窄的声明权限范围。

携带身份信息的模式（例如可信代理身份验证或私有入口 `none`）
仍可遵循显式声明的权限范围。若要实现真正的信任边界隔离，请使用独立的 Gateway 网关。
