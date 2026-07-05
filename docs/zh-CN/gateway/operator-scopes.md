---
read_when:
    - 调试缺失操作员权限范围错误
    - 审核设备或节点配对审批
    - 添加或分类 Gateway 网关 RPC 方法
summary: Gateway 网关客户端的操作员角色、权限范围和审批时检查
title: 操作员权限范围
x-i18n:
    generated_at: "2026-07-05T11:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfbaf4dc1d8e8cc07bfb10c4e9abf53df34868185f51546f74c12bd785fa380
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作员权限范围限制 Gateway 网关客户端在通过身份验证后可以执行的操作。
它们是在单个受信任 Gateway 网关操作员域内的控制平面防护栏，
不是敌对多租户隔离。若要在人、
团队或机器之间实现强隔离，请在不同的 OS 用户或主机下运行单独的 Gateway 网关。

相关：[Security](/zh-CN/gateway/security)、[Gateway protocol](/zh-CN/gateway/protocol)、
[Gateway pairing](/zh-CN/gateway/pairing)、[Devices CLI](/zh-CN/cli/devices)。

## 角色

每个 Gateway 网关 WebSocket 客户端都会以一个角色连接：

- `operator`：控制平面客户端，例如 CLI、Control UI、自动化，以及
  受信任的辅助进程。
- `node`：能力主机（macOS、iOS、Android、无头环境），通过
  `node.invoke` 暴露命令。

操作员 RPC 方法需要 `operator` 角色；节点发起的方法
需要 `node` 角色。

## 权限范围级别

| 权限范围                | 含义                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 只读状态、列表、目录、日志、会话读取，以及其他非变更调用。                                                                                                    |
| `operator.write`        | 会变更状态的操作员操作：发送消息、调用工具、更新 Talk/语音设置、节点命令中继。也满足 `operator.read`。                                                        |
| `operator.admin`        | 管理访问权限。满足每个 `operator.*` 权限范围。配置变更、更新、原生钩子、保留命名空间和高风险审批需要此权限。                                                  |
| `operator.pairing`      | 设备和节点配对管理：列出、批准、拒绝、移除、轮换、撤销。                                                                                                      |
| `operator.approvals`    | Exec 和插件审批 API。                                                                                                                                         |
| `operator.talk.secrets` | 读取包含密钥的 Talk 配置。                                                                                                                                    |

未知的未来 `operator.*` 权限范围需要精确匹配，除非调用方
已经持有 `operator.admin`。

## 方法权限范围只是第一道门槛

每个 Gateway 网关 RPC 都有一个最小权限方法范围，用于决定
请求是否到达其处理程序。随后，一些处理程序会根据
被批准或变更的具体对象应用更严格的检查：

- `device.pair.approve` 可通过 `operator.pairing` 访问，但批准
  操作员设备只能签发或保留调用方已经持有的权限范围。
- `node.pair.approve` 可通过 `operator.pairing` 访问，然后会从待处理节点声明的命令列表推导出额外的
  审批权限范围。
- `chat.send` 是写入权限范围的方法，但 `/config set` 和
  `/config unset` 聊天命令还需要 `operator.admin`，
  无论调用方的聊天发送权限范围如何。

这让较低权限范围的操作员可以执行低风险配对操作，而无需
让所有配对审批都仅限管理员。

## 设备配对审批

设备配对记录是已批准角色和权限范围的持久来源。
已配对设备不会悄然获得更宽泛的访问权限：如果重新连接
请求更宽泛的角色或更宽泛的权限范围，会创建新的待处理升级
请求。

批准设备请求：

- 没有操作员角色的请求不需要操作员权限范围审批。
- 请求非操作员设备角色（例如 `node`）需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 请求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 要求调用方已经
  持有该权限范围，或持有 `operator.admin`。
- 请求 `operator.admin` 需要 `operator.admin`。
- 没有显式权限范围的修复请求可以继承现有操作员
  令牌的权限范围；如果该令牌具有管理员权限范围，审批仍然需要
  `operator.admin`。

非管理员共享密钥和受信任代理会话只能在其自己声明的操作员权限范围内批准
操作员设备请求；批准
非操作员角色仅限管理员，即使这些会话在其他情况下可以使用
`operator.pairing`。

对于已配对设备令牌会话，除非调用方
拥有 `operator.admin`，否则管理范围仅限自身：非管理员调用方只会看到自己的配对条目，并且
只能批准、拒绝、轮换、撤销或移除自己的设备条目。

## 节点配对审批

旧版 `node.pair.*` 方法使用单独的 Gateway 网关拥有的节点配对存储。
WS 节点改用设备配对（`role: node`），但适用相同的审批
词汇。有关两个存储的关系，请参阅 [Gateway pairing](/zh-CN/gateway/pairing)。

`node.pair.approve` 会从待处理请求的
命令列表推导出额外所需的权限范围：

| 声明的命令                                            | 所需权限范围                          |
| ----------------------------------------------------- | ------------------------------------- |
| 无                                                    | `operator.pairing`                    |
| 非 exec 节点命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which` | `operator.pairing` + `operator.admin` |

节点配对会建立身份和信任；它不会替代节点自己的
`system.run` exec 审批策略。

## 共享密钥身份验证

共享网关令牌/密码身份验证会被视为该 Gateway 网关的受信任操作员访问。
OpenAI 兼容 HTTP 表面、`/tools/invoke` 和 HTTP
会话历史端点会为共享密钥 bearer 身份验证恢复完整的默认操作员权限范围集合，
即使调用方发送了更窄的声明权限范围。

带身份的模式，例如受信任代理身份验证或私有入口 `none`，
仍然可以遵循显式声明的权限范围。若要实现真正的信任
边界隔离，请使用单独的 Gateway 网关。
