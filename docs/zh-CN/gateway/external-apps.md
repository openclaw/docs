---
read_when:
    - 你正在构建一个与 OpenClaw 通信的外部应用、脚本、仪表盘、CI 任务或 IDE 扩展
    - 你正在 Gateway RPC 和插件 SDK 之间进行选择
    - 你正在集成 Gateway 网关智能体运行、会话、事件、审批、模型或工具
    - 你正在将托管控制器与外部唤醒调度器配对
sidebarTitle: External apps
summary: 外部应用、脚本、仪表板、CI 作业和 IDE 扩展的当前集成路径
title: 面向外部应用的 Gateway 网关集成
x-i18n:
    generated_at: "2026-07-11T20:32:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

外部应用通过 Gateway 协议与 OpenClaw 通信：使用 WebSocket
传输和 RPC 方法。当脚本、仪表板、CI 作业、IDE
扩展或其他进程需要启动智能体运行、流式接收事件、等待
结果、取消工作或检查 Gateway 网关资源时，请使用它。

<Warning>
  目前尚无公开的 npm 客户端软件包。在发布说明宣布已有软件包发布
  且本页面提供安装说明之前，请勿将 OpenClaw 客户端软件包
  名称添加为应用依赖项。
</Warning>

<Note>
  本页面面向 OpenClaw 进程外部的代码。在 OpenClaw
  内部运行的插件代码应改用文档中说明的 `openclaw/plugin-sdk/*` 子路径。
</Note>

## 当前可用内容

| 接口                                    | 状态   | 用途                                                                                          |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Gateway 协议](/zh-CN/gateway/protocol)       | 可用   | WebSocket 传输、连接握手、身份验证权限范围、协议版本管理和事件。                              |
| [Gateway RPC 参考](/zh-CN/reference/rpc)      | 可用   | 当前用于智能体、会话、任务、模型、工具、制品和审批的 Gateway 网关方法。                       |
| [`openclaw agent`](/zh-CN/cli/agent)          | 可用   | 当通过 shell 调用 CLI 已足够时，用于一次性脚本集成。                                          |
| [`openclaw message`](/zh-CN/cli/message)      | 可用   | 从脚本发送消息或执行渠道操作。                                                                |

未来的客户端库软件包正在内部开发中，但目前尚不是
公开安装接口。在发布版本化软件包的发布公告之前，请将其视为预览版实现细节。

## 推荐路径

1. 运行或发现一个 Gateway 网关。
2. 通过 [Gateway 协议](/zh-CN/gateway/protocol)连接。
3. 调用 [Gateway RPC 参考](/zh-CN/reference/rpc)中记录的 RPC 方法。
4. 固定你测试时所使用的 OpenClaw 版本。
5. 升级 OpenClaw 时重新查看 RPC 参考。

对于智能体运行，请从 `agent` RPC 开始，并配合 `agent.wait` 获取
终止结果。对于持久化的对话状态，请使用 `sessions.*` 方法。
对于 UI 集成，请订阅 Gateway 网关事件，并且只渲染你的应用
能够理解的事件系列。

## 协作式主机挂起

冻结或快照正在运行的进程的托管控制器可以使用
与主机无关的挂起握手：

1. 停止接收由主机控制的外部入口流量。
2. 使用稳定且唯一的 `requestId` 调用 `gateway.suspend.prepare`。
3. 如果响应为 `busy`，请保持进程运行并稍后重试。
4. 如果响应为 `ready`，请保存返回的 `suspensionId`，然后在
   `expiresAtMs` 之前冻结进程或创建其快照。
5. 解冻后，或放弃挂起时，通过现有 WebSocket 或 Admin HTTP 控制
   路径，使用该 `suspensionId` 调用 `gateway.suspend.resume`。

已准备挂起的 Gateway 网关会拒绝新的 WebSocket 握手。WebSocket 控制器
必须在主机操作期间保持其已通过身份验证的连接处于打开状态。如果无法
保证这一点，请在准备挂起之前启用并使用
[Admin HTTP RPC 插件](/zh-CN/plugins/admin-http-rpc)。如果控制路径丢失，
请等待两分钟的租约过期后再重新连接；租约过期会自动重新开放接入。

RPC 契约如下：

- `gateway.suspend.prepare` — `operator.admin`；参数
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`；参数
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`；参数
  `{ "suspensionId": "id-from-prepare" }`

ID 会去除首尾空白，必须包含至少一个非空白字符，且长度限制为
128 个字符。繁忙的准备结果包含 `status: "busy"`、`reason`、
`retryAfterMs`、`activeCount` 和 `blockers`。就绪结果的结构如下：

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

状态查询返回 `{"status":"running"}`，或包含 `expiresAtMs` 的就绪结果。
恢复操作返回 `{"ok":true,"status":"running","resumed":true}`；成功恢复后
再次调用会返回 `resumed: false`。

相互竞争的请求 ID 或暂时性的调度器恢复失败会返回可重试的
`UNAVAILABLE`，其中包含 `retryAfterMs`。调度器恢复期间，准备、状态查询
和恢复操作都会返回该错误，Gateway 网关会保持未就绪并以故障关闭方式运行，
主机不得冻结或快照该进程。OpenClaw 会自动重试调度器恢复，并且仅在恢复成功后
重新开放接入。使用不匹配的恢复 ID 会返回 `INVALID_REQUEST`。准备操作与
Gateway 网关共享控制平面每分钟三次尝试的写入预算；请遵守返回的重试延迟。
WebSocket 客户端按设备和 IP 分桶。Admin HTTP 控制器按解析出的客户端 IP
分桶，因此位于同一代理后的控制器可能共享预算。

准备操作只会拒绝新工作：OpenClaw 会关闭新的根级/会话/命令接入，
暂停自动 cron 触发，并同步检查工作。如果存在任何活动工作，它会恢复调度器
并重新开放接入，然后返回 `busy`；它不会中断或排空这些工作。就绪租约持续
两分钟。使用相同 `requestId` 重复调用 `prepare` 会续订租约；租约过期时会先
恢复调度器，再重新开放接入。
在就绪租约期间到期的重启触发会等待租约恢复后再执行；正在进行的重启会使准备操作返回 `busy`。

处于就绪状态时，`/healthz` 保持存活，而 `/readyz` 返回 `503`。本地或
已通过身份验证的就绪响应包含 `gateway-draining`；未经身份验证的远程探针
仅收到 `{ "ready": false }`。HTTP 健康探针、现有 WebSocket 连接上的挂起方法，
以及已启用的 Admin HTTP RPC 路由仍然可用。其他 RPC 返回可重试的
`UNAVAILABLE`。内置 HTTP 用户工作路由和普通插件 HTTP 路由，包括
OpenAI 兼容 API、工具/会话操作、节点监视和已配置的 Hooks，均返回 `503`，
并包含 `error.code: "gateway_unavailable"`。新的插件自有 WebSocket 升级
也返回 `503`；这涵盖升级过程的所有权，不涵盖之后通过已建立的插件套接字
执行的工作。

此握手不会持久化传入消息、停止第三方渠道传输，也不会控制托管平台。
主机必须在准备前隔离其入口流量，并继续负责唤醒、快照/冻结和停止操作。
`activeCount` 是受跟踪工作的总计数，而 `blockers` 包含非零类别计数和
有界的任务详情。这不是通用的进程静止屏障。`background-exec` 阻塞项
仅提供汇总信息：命令文本、进程 ID、输出，以及会话或权限范围标识符绝不会
通过协议传输。渠道健康检查、维护、缓存刷新、已建立的插件 WebSocket 会话，
以及未注册的插件自有后台工作仍可能保持活动状态。
托管平台必须以一致方式冻结或快照完整的进程树及其文件系统；首版契约
无法证明未注册工作处于空闲状态。

<Tip>
  对于主机唤醒调度，请将面向 OpenClaw 的部分保留在进程内
  插件中，并将具备幂等性的完整快照投射到外部主机适配器。
  托管控制器不应导入插件 SDK，也不应根据事件增量重建 cron
  状态。请参阅[安全的外部 cron
  投射](/zh-CN/plugins/hooks#safe-external-cron-projection)。
</Tip>

## 应用代码与插件代码

当代码位于 OpenClaw 外部时，请使用 Gateway RPC：

- 启动或观察智能体运行的 Node 脚本
- 调用 Gateway 网关的 CI 作业
- 仪表板和管理面板
- IDE 扩展
- 无需成为渠道插件的外部桥接器
- 使用模拟或真实 Gateway 网关传输的集成测试

当代码在 OpenClaw 内部运行时，请使用插件 SDK：

- 提供商插件
- 渠道插件
- 工具钩子或生命周期钩子
- Agent harness plugins
- 可信运行时辅助程序

外部应用不应导入 `openclaw/plugin-sdk/*`；这些子路径供
OpenClaw 加载的插件使用。

## 相关内容

- [Gateway 协议](/zh-CN/gateway/protocol)
- [Gateway RPC 参考](/zh-CN/reference/rpc)
- [CLI 智能体命令](/zh-CN/cli/agent)
- [CLI 消息命令](/zh-CN/cli/message)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [会话](/zh-CN/concepts/session)
- [后台任务](/zh-CN/automation/tasks)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
