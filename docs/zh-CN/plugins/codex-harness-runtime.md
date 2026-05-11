---
read_when:
    - 你需要 Codex harness runtime 的支持契约
    - 你正在调试原生 Codex 工具、钩子、压缩或反馈上传
    - 你正在更改会影响 PI 和 Codex harness 轮次的插件行为
summary: Codex harness 的运行时边界、钩子、工具、权限和诊断
title: Codex harness runtime
x-i18n:
    generated_at: "2026-05-11T20:31:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

本页记录 Codex harness 轮次的运行时契约。关于设置和
路由，请从 [Codex harness](/zh-CN/plugins/codex-harness) 开始。关于配置字段，
请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 概览

Codex 模式并不是在底层换用另一个模型调用的 PI。Codex 负责更多
原生模型循环，而 OpenClaw 会围绕这个边界调整它的插件、工具、会话和
诊断表面。

OpenClaw 仍然负责频道路由、会话文件、可见消息投递、
OpenClaw 动态工具、审批、媒体投递，以及转录镜像。
Codex 负责规范的原生线程、原生模型循环、原生工具
续接，以及原生压缩。

## 线程绑定和模型变更

当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向
app-server 发送当前选定的 OpenAI 模型、审批策略、沙箱和服务
层级。从 `openai/gpt-5.5` 切换到
`openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用
新选定的模型继续。

## 可见回复和 Heartbeat

当来源聊天轮次通过 Codex harness 运行时，如果部署没有显式配置
`messages.visibleReplies`，可见回复默认使用 OpenClaw `message` 工具。
智能体仍然可以私下完成它的 Codex 轮次；只有在调用
`message(action="send")` 时才会发布到渠道。设置
`messages.visibleReplies: "automatic"` 可让直接聊天的最终回复继续走
旧版自动投递路径。

Codex heartbeat 轮次默认也会在可搜索的 OpenClaw 工具目录中获得
`heartbeat_respond`，这样智能体就能记录本次唤醒应保持安静还是通知，
而无需在最终文本中编码该控制流。

Heartbeat 专用的主动性指导会作为 Codex 协作模式开发者指令发送到
heartbeat 轮次本身。普通聊天轮次会恢复 Codex Default 模式，而不是在
正常运行时提示中携带 heartbeat 理念。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 PI 和 Codex harness 的产品/插件兼容性。                          |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮次适配器行为。                          |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入逐线程 Codex 配置。

启用 Codex app-server 审批时，也就是 `approvalPolicy` 不是
`"never"` 时，默认注入的原生钩子配置会省略 `PermissionRequest`，
让 Codex 的 app-server 审阅器和 OpenClaw 的审批桥接在审阅后处理
真实提权。操作员在需要兼容性中继时，可以显式将
`permission_request` 添加到 `nativeHookRelay.events`。

其他 Codex 钩子（例如 `SessionStart` 和 `UserPromptSubmit`）仍然是
Codex 级控制。它们不会在 v1 契约中作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用后执行该工具，
因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。
对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像选定事件，
但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则 OpenClaw
不能重写原生 Codex 线程。

Codex app-server 项通知还会为尚未由原生 `PostToolUse` 中继覆盖的
原生工具完成提供异步 `after_tool_call` 观察。这些观察仅用于遥测和
插件兼容性；它们不能阻塞、延迟或改变原生工具调用。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw
适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的
`before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察，并不是对 Codex 内部请求或压缩载荷的
逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为
用于轨迹和调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex runtime v1 中支持：

| 表面                                          | 支持                                                                             | 原因                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                                                             | Codex app-server 负责 OpenAI 轮次、原生线程恢复，以及原生工具续接。                                                                                                                                        |
| OpenClaw 频道路由和投递                       | 支持                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保留在模型运行时之外。                                                                                                                             |
| OpenClaw 动态工具                             | 支持                                                                             | Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 保留在执行路径中。                                                                                                                                         |
| 提示和上下文插件                              | 支持                                                                             | OpenClaw 会在启动或恢复线程之前构建提示叠加层，并将上下文投影到 Codex 轮次中。                                                                                                                             |
| 上下文引擎生命周期                            | 支持                                                                             | 组装、摄取、轮次后维护，以及上下文引擎压缩协调会为 Codex 轮次运行。                                                                                                                                         |
| 动态工具钩子                                  | 支持                                                                             | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 所拥有的动态工具运行。                                                                                                               |
| 生命周期钩子                                  | 作为适配器观察支持                                                               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                                                                                           |
| 最终答案修订门控                              | 通过原生钩子中继支持                                                             | Codex `Stop` 会被中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终确定前再执行一次模型传递。                                                                                                     |
| 原生 shell、patch 和 MCP 阻塞或观察           | 通过原生钩子中继支持                                                             | Codex `PreToolUse` 和 `PostToolUse` 会为已承诺的原生工具表面中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻塞；不支持参数重写。                                                       |
| 原生权限策略                                  | 通过 Codex app-server 审批和兼容性原生钩子中继支持                              | Codex app-server 审批请求会在 Codex 审阅后通过 OpenClaw 路由。`PermissionRequest` 原生钩子中继对于原生审批模式是选择加入的，因为 Codex 会在 guardian 审阅前发出它。                                      |
| App-server 轨迹捕获                           | 支持                                                                             | OpenClaw 会记录它发送给 app-server 的请求，以及它收到的 app-server 通知。                                                                                                                                   |

Codex runtime v1 中不支持：

| 表面                                                | V1 边界                                                                                                                                       | 未来路径                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生工具前置钩子可以阻塞，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                      | 需要 Codex 钩子/架构支持替换工具输入。                                                    |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范原生线程历史。OpenClaw 拥有镜像并可投影未来上下文，但不应改变不受支持的内部结构。                                               | 如果需要原生线程手术式修改，请添加显式 Codex app-server API。                             |
| Codex 原生工具记录的 `tool_result_persist`          | 该钩子转换的是 OpenClaw 所拥有的转录写入，而不是 Codex 原生工具记录。                                                                          | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                         |
| 丰富的原生压缩元数据                                | OpenClaw 会观察压缩开始和完成，但不会接收稳定的保留/丢弃列表、token 增量或摘要载荷。                                                         | 需要更丰富的 Codex 压缩事件。                                                            |
| 压缩干预                                            | 当前 OpenClaw 压缩钩子在 Codex 模式中是通知级别的。                                                                                            | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。                              |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终 OpenAI API 请求。                                                       | 需要 Codex 模型请求跟踪事件或调试 API。                                                   |

## 原生权限和 MCP elicitations

对于 `PermissionRequest`，OpenClaw 只有在策略做出决定时才返回显式允许或拒绝决定。
无决定结果不是允许。Codex 会将其视为没有钩子决定，并继续落入自己的 guardian
或用户审批路径。

Codex app-server 审批模式默认省略此原生 hook。此行为适用于 `permission_request` 被显式包含在 `nativeHookRelay.events` 中，或兼容性运行时安装它时。

当操作员为 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 会在一个有界的会话窗口内记住该精确的提供商/会话/工具输入/cwd 指纹。记住的决策刻意只采用精确匹配：命令、参数、工具载荷或 cwd 发生变化都会创建一次新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程路由。Codex `request_user_input` 提示会被发回到发起的聊天，并且下一个排队的后续消息会回答该原生服务器请求，而不是被作为额外上下文进行 Steer。其他 MCP 征询请求会默认失败关闭。

## 队列 Steer

活动运行队列 Steer 映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的安静窗口内批量收集排队的聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式会发送单独的 `turn/steer` 请求。

Codex 审查和手动压缩轮次可能拒绝同一轮次 Steer。在这种情况下，当所选模式允许回退时，OpenClaw 会使用后续队列。参见 [Steering queue](/zh-CN/concepts/queue-steering)。

## Codex 反馈上传

当使用原生 Codex harness 的会话批准 `/diagnostics [note]` 后，OpenClaw 还会为相关 Codex 线程调用 Codex app-server `feedback/upload`。该上传会请求 app-server 在可用时包含每个列出线程及其派生 Codex 子线程的日志。

上传会通过 Codex 的常规反馈路径发送到 OpenAI 服务器。如果该 app-server 禁用了 Codex 反馈，该命令会返回 app-server 错误。完成后的诊断回复会列出已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>` 命令。

如果你拒绝或忽略该审批，OpenClaw 不会打印这些 Codex ID，也不会发送 Codex 反馈。该上传不会替代本地 Gateway 网关诊断导出。关于审批、隐私、本地包和群聊行为，参见 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你明确希望为当前附加线程上传 Codex 反馈，而不需要完整 Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。

## 压缩和转录镜像

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会为渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换保留转录镜像。

该镜像包含用户提示词、最终助手文本，以及 app-server 发出时的轻量 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未公开可供人阅读的压缩摘要，也没有公开可审计的列表来说明 Codex 在压缩后保留了哪些条目。

因为 Codex 拥有规范的原生线程，`tool_result_persist` 目前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入由 OpenClaw 拥有的会话转录工具结果时适用。

## 媒体和投递

OpenClaw 继续拥有媒体投递和媒体提供商选择。图像、视频、音乐、PDF、TTS 和媒体理解会使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息传递工具输出会继续通过常规 OpenClaw 投递路径。媒体生成不需要 Pi。当 Codex 发出带有 `savedPath` 的原生图像生成项目时，即使 Codex 轮次没有助手文本，OpenClaw 也会通过常规回复媒体路径转发该精确文件。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [插件钩子](/zh-CN/plugins/hooks)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [轨迹导出](/zh-CN/tools/trajectory)
