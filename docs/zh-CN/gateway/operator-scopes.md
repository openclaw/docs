---
read_when:
    - 调试缺少操作员权限范围的错误
    - 审核设备或节点配对审批
    - 添加或分类 Gateway RPC 方法
summary: Gateway 网关客户端的操作员角色、权限范围和审批时检查
title: 操作员权限范围
x-i18n:
    generated_at: "2026-07-12T14:29:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作员权限范围控制 Gateway 客户端通过身份验证后可以执行的操作。
它们是单个受信任 Gateway 操作员域内的控制平面防护机制，
而非用于抵御恶意行为的多租户隔离机制。要在人员、团队或机器之间实现强隔离，
请在不同的操作系统用户或主机下运行独立的 Gateway 网关。

相关内容：[安全性](/zh-CN/gateway/security)、[Gateway 协议](/zh-CN/gateway/protocol)、
[Gateway 配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

每个 Gateway WebSocket 客户端都使用以下一种角色进行连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化系统以及
  受信任的辅助进程。
- `node`：能力宿主（macOS、iOS、Android、无头设备），通过
  `node.invoke` 暴露命令。

操作员 RPC 方法要求 `operator` 角色；节点发起的方法
要求 `node` 角色。

## 权限范围级别

| 权限范围                | 含义                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读的状态、列表、目录、日志、会话读取以及其他非修改类调用。                                                                                                  |
| `operator.write`        | 修改类操作员操作：发送消息、调用工具、更新 Talk/语音设置、转发节点命令。同时满足 `operator.read`。                                                             |
| `operator.admin`        | 管理访问权限。满足所有 `operator.*` 权限范围。修改配置、执行更新、使用原生 Hooks、访问保留命名空间以及批准高风险操作时需要此权限。                              |
| `operator.pairing`      | 设备和节点配对管理：列出、批准、拒绝、移除、轮换、撤销。                                                                                                      |
| `operator.approvals`    | Exec 和插件审批 API。                                                                                                                                         |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                    |

对于未来未知的 `operator.*` 权限范围，除非调用方
已持有 `operator.admin`，否则必须精确匹配。

## 方法权限范围只是第一道关卡

每个 Gateway RPC 都有一个最小权限方法范围，用于决定请求是否能
到达其处理程序。部分处理程序随后会根据实际批准或修改的
具体对象执行更严格的检查：

- 持有 `operator.pairing` 即可调用 `device.pair.approve`，但批准
  操作员设备时，只能签发或保留调用方已持有的权限范围。
- 持有 `operator.pairing` 即可调用 `node.pair.approve`，随后会根据
  待处理节点声明的命令列表推导出额外的审批权限范围。
- `chat.send` 是需要写入权限的方法，但 `/config set` 和
  `/config unset` 聊天命令还要求 `operator.admin`，
  无论调用方具有什么聊天发送权限范围。

这使权限范围较低的操作员能够执行低风险的配对操作，
而不必要求所有配对审批都仅限管理员执行。

## 设备配对审批

设备配对记录是已批准角色和权限范围的持久化权威来源。
已配对设备不会被静默授予更广泛的访问权限：重新连接时
请求更广泛的角色或权限范围，会创建新的待处理升级请求。

批准设备请求时：

- 不包含操作员角色的请求不需要操作员权限范围审批。
- 请求非操作员设备角色（例如 `node`）时需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用方必须已经
  持有相应权限范围或 `operator.admin`。
- 请求 `operator.admin` 时需要 `operator.admin`。
- 未明确指定权限范围的修复请求可以继承现有操作员
  令牌的权限范围；如果该令牌具有管理员权限范围，审批仍需要
  `operator.admin`。

非管理员共享密钥会话和受信任代理会话只能在其自身声明的
操作员权限范围内批准操作员设备请求；即使这些会话能够以其他方式使用
`operator.pairing`，批准非操作员角色也仅限管理员执行。

对于已配对设备的令牌会话，除非调用方持有
`operator.admin`，否则管理操作仅限自身：非管理员调用方只能看到自己的配对条目，
并且只能批准、拒绝、轮换、撤销或移除自己的设备条目。

## 节点配对审批

旧版 `node.pair.*` 方法使用单独的、由 Gateway 网关拥有的节点配对存储。
WS 节点则使用设备配对（`role: node`），但适用相同的审批
术语。有关这两个存储之间的关系，请参阅 [Gateway 配对](/zh-CN/gateway/pairing)。

`node.pair.approve` 根据待处理请求的
命令列表推导出额外所需的权限范围：

| 声明的命令                                            | 所需权限范围                          |
| ----------------------------------------------------- | ------------------------------------- |
| 无                                                    | `operator.pairing`                    |
| 非 Exec 节点命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which` | `operator.pairing` + `operator.admin` |

批准节点声明并不会启用另有运行时允许列表关卡的命令。
例如，批准声明了 `computer.act` 的节点需要配对权限和写入权限，
但这只会记录该功能接口。管理员或所有者仍必须启用 `computer.act`。
在它保持启用期间，通过需要写入权限的 `node.invoke` 方法调用它时，
不要求每个操作都具有管理员权限范围。

节点配对用于建立身份和信任；它不会取代节点自身的
`system.run` Exec 审批策略。

## 共享密钥身份验证

共享 Gateway 网关令牌/密码身份验证被视为该 Gateway 网关的受信任操作员访问。
对于共享密钥 Bearer 身份验证，OpenAI 兼容 HTTP 接口、`/tools/invoke` 和 HTTP
会话历史记录端点会恢复完整的默认操作员权限范围集，即使调用方发送了更窄的声明权限范围。

带身份信息的模式（例如受信任代理身份验证或私有入口 `none`）
仍可遵循明确声明的权限范围。请使用独立的 Gateway 网关实现真正的信任边界隔离。
