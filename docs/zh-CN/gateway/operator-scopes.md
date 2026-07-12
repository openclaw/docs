---
read_when:
    - 调试缺少操作员权限范围的错误
    - 审核设备或节点配对请求
    - 添加 Gateway 网关 RPC 方法或对其进行分类
summary: Gateway 网关客户端的操作员角色、权限范围和审批时检查
title: 操作员权限范围
x-i18n:
    generated_at: "2026-07-11T20:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作员权限范围用于限制 Gateway 网关客户端通过身份验证后可以执行的操作。
它们是单一可信 Gateway 网关操作员域内的控制平面护栏，
而非对抗恶意行为的多租户隔离机制。若要在人员、
团队或机器之间实现强隔离，请使用不同的操作系统用户或主机运行独立的 Gateway 网关。

相关内容：[安全](/zh-CN/gateway/security)、[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Gateway 网关配对](/zh-CN/gateway/pairing)、[设备 CLI](/zh-CN/cli/devices)。

## 角色

每个 Gateway 网关 WebSocket 客户端都使用一个角色进行连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化系统和
  可信辅助进程。
- `node`：提供功能的主机（macOS、iOS、Android、无头设备），通过
  `node.invoke` 公开命令。

操作员 RPC 方法要求 `operator` 角色；由节点发起的方法
要求 `node` 角色。

## 权限范围级别

| 权限范围                | 含义                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读访问状态、列表、目录、日志、会话内容以及其他不会修改状态的调用。                                                                                      |
| `operator.write`        | 会修改状态的操作员操作：发送消息、调用工具、更新 Talk/语音设置、转发节点命令。同时满足 `operator.read`。                                                  |
| `operator.admin`        | 管理访问权限。满足所有 `operator.*` 权限范围。修改配置、执行更新、使用原生 Hooks、访问保留命名空间以及批准高风险操作时必须具备此权限。                    |
| `operator.pairing`      | 设备和节点配对管理：列出、批准、拒绝、移除、轮换、撤销。                                                                                                 |
| `operator.approvals`    | Exec 和插件审批 API。                                                                                                                                     |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                |

未来新增且未知的 `operator.*` 权限范围要求完全匹配，除非调用方
已经持有 `operator.admin`。

## 方法权限范围只是第一道关卡

每个 Gateway 网关 RPC 都有一个遵循最小权限原则的方法权限范围，用于决定
请求能否到达其处理程序。之后，部分处理程序会根据具体获批或被修改的对象
执行更严格的检查：

- 持有 `operator.pairing` 即可调用 `device.pair.approve`，但在批准
  操作员设备时，只能授予或保留调用方已持有的权限范围。
- 持有 `operator.pairing` 即可调用 `node.pair.approve`，随后系统会根据
  待处理节点声明的命令列表推导出额外的批准权限范围。
- `chat.send` 是要求写入权限的方法，但 `/config set` 和
  `/config unset` 聊天命令还要求 `operator.admin`，
  无论调用方具备何种聊天发送权限范围。

这样，权限范围较低的操作员便可以执行低风险配对操作，
而不必将所有配对批准都限制为仅管理员可执行。

## 设备配对批准

设备配对记录是已批准角色和权限范围的持久化权威来源。
已配对设备不会被静默授予更广泛的访问权限：重新连接时，
如果请求更高权限的角色或更广泛的权限范围，系统会创建新的待处理升级请求。

批准设备请求时：

- 不包含操作员角色的请求无需操作员权限范围批准。
- 请求非操作员设备角色（例如 `node`）时，必须具备
  `operator.admin`，尽管 `device.pair.approve` 本身只要求
  `operator.pairing`。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 时，调用方必须已经
  持有对应权限范围或 `operator.admin`。
- 请求 `operator.admin` 时，必须具备 `operator.admin`。
- 未显式指定权限范围的修复请求可以继承现有操作员
  令牌的权限范围；如果该令牌具有管理员权限范围，批准操作仍要求
  `operator.admin`。

非管理员的共享密钥会话和可信代理会话只能在其自身声明的操作员
权限范围内批准操作员设备请求；即使这些会话能够以其他方式使用
`operator.pairing`，批准非操作员角色也仍然仅限管理员。

对于已配对设备的令牌会话，除非调用方具备 `operator.admin`，
否则管理操作仅限自身：非管理员调用方只能看到自己的配对条目，
并且只能批准、拒绝、轮换、撤销或移除自己的设备条目。

## 节点配对批准

旧版 `node.pair.*` 方法使用由 Gateway 网关所有的独立节点配对存储。
WebSocket 节点则使用设备配对（`role: node`），但采用相同的批准术语。
有关这两个存储之间的关系，请参阅 [Gateway 网关配对](/zh-CN/gateway/pairing)。

`node.pair.approve` 会根据待处理请求的命令列表推导额外的必需权限范围：

| 声明的命令                                            | 必需权限范围                          |
| ----------------------------------------------------- | ------------------------------------- |
| 无                                                    | `operator.pairing`                    |
| 非 Exec 节点命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which` | `operator.pairing` + `operator.admin` |

批准节点声明并不会启用那些设有独立运行时允许列表关卡的命令。
例如，批准声明了 `computer.act` 的节点需要配对权限和写入权限，
但这只会记录该功能界面。管理员或所有者仍须启用 `computer.act`。
启用期间，通过要求写入权限的 `node.invoke` 方法调用它时，
每项操作无需再具备管理员权限范围。

节点配对用于建立身份和信任关系；它不会取代节点自身的
`system.run` Exec 审批策略。

## 共享密钥身份验证

共享 Gateway 网关令牌/密码身份验证会被视为该 Gateway 网关的可信操作员访问。
对于共享密钥不记名身份验证，兼容 OpenAI 的 HTTP 界面、`/tools/invoke` 和 HTTP
会话历史记录端点会恢复完整的默认操作员权限范围集合，即使调用方发送了
范围更窄的声明权限。

携带身份信息的模式（例如可信代理身份验证或私有入口 `none`）
仍可遵循显式声明的权限范围。若要实现真正的信任边界隔离，
请使用独立的 Gateway 网关。
