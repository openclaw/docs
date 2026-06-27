---
read_when:
    - 你正在构建一个与 OpenClaw 通信的外部应用、脚本、仪表板、CI 任务或 IDE 扩展。
    - 你正在 Gateway 网关 RPC 和插件 SDK 之间选择
    - 你正在集成 Gateway 网关智能体运行、会话、事件、审批、模型或工具
sidebarTitle: External apps
summary: 外部应用、脚本、仪表板、CI 作业和 IDE 扩展的当前集成路径
title: 面向外部应用的 Gateway 网关集成
x-i18n:
    generated_at: "2026-06-27T02:01:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

外部应用现在应通过 Gateway 网关协议与 OpenClaw 通信。当脚本、仪表板、CI 任务、IDE
扩展或其他进程想要启动智能体运行、流式传输事件、等待结果、取消工作，或检查 Gateway 网关资源时，请使用
Gateway 网关 WebSocket 和 RPC 方法。

<Warning>
  目前还没有公开的 npm 客户端包。在发布说明宣布已发布的包，并且本页面包含安装说明之前，不要将 OpenClaw 客户端包
  名称添加为应用依赖。
</Warning>

<Note>
  本页面适用于 OpenClaw 进程之外的代码。在 OpenClaw 内部运行的插件代码应改用已文档化的 `openclaw/plugin-sdk/*` 子路径。
</Note>

## 目前可用的内容

| 表面                                    | 状态 | 用途                                                                                          |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Gateway 网关协议](/zh-CN/gateway/protocol)   | 就绪  | WebSocket 传输、连接握手、身份验证作用域、协议版本控制和事件。                                |
| [Gateway RPC 参考](/zh-CN/reference/rpc) | 就绪  | 当前用于智能体、会话、任务、模型、工具、构件和审批的 Gateway 网关方法。 |
| [`openclaw agent`](/zh-CN/cli/agent)          | 就绪  | 当调用 CLI 已足够时，用于一次性脚本集成。                                                     |
| [`openclaw message`](/zh-CN/cli/message)      | 就绪  | 从脚本发送消息或渠道操作。                                                                    |

源码树中包含未来客户端库的内部包工作，但这不是公开安装表面。在包发布并进行版本化之前，请将其视为预览实现细节。

## 推荐路径

1. 运行或发现一个 Gateway 网关。
2. 通过 [Gateway 网关协议](/zh-CN/gateway/protocol)连接。
3. 调用 [Gateway RPC 参考](/zh-CN/reference/rpc)中记录的 RPC 方法。
4. 固定你测试所针对的 OpenClaw 版本。
5. 升级 OpenClaw 时重新检查 RPC 参考。

对于智能体运行，先使用 `agent` RPC；当你需要终止结果时，将其与 `agent.wait` 配对使用。对于持久的对话状态，请使用 `sessions.*`
方法。对于 UI 集成，请订阅 Gateway 网关事件，并且只渲染你的应用理解的事件族。

## 应用代码与插件代码

当代码位于 OpenClaw 之外时，使用 Gateway 网关 RPC：

- 启动或观察智能体运行的 Node 脚本
- 调用 Gateway 网关的 CI 任务
- 仪表板和管理面板
- IDE 扩展
- 不需要成为渠道插件的外部桥接
- 使用模拟或真实 Gateway 网关传输的集成测试

当代码在 OpenClaw 内部运行时，使用插件 SDK：

- 提供商插件
- 渠道插件
- 工具或生命周期钩子
- Agent harness plugins
- 受信任的运行时辅助工具

外部应用不应导入 `openclaw/plugin-sdk/*`；这些子路径供 OpenClaw 加载的插件使用。

## 相关

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Gateway RPC 参考](/zh-CN/reference/rpc)
- [CLI agent 命令](/zh-CN/cli/agent)
- [CLI message 命令](/zh-CN/cli/message)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [会话](/zh-CN/concepts/session)
- [后台任务](/zh-CN/automation/tasks)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
