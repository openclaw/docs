---
read_when:
    - 你需要 Codex harness runtime 支持契约
    - 你正在调试原生 Codex 工具、钩子、压缩或反馈上传
    - 你正在更改 OpenClaw 和 Codex harness 轮次中的插件行为
summary: Codex harness 的运行时边界、钩子、工具、权限和诊断
title: Codex harness runtime
x-i18n:
    generated_at: "2026-06-27T02:38:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

此页面记录 Codex harness 轮次的运行时契约。关于设置和路由，请从 [Codex harness](/zh-CN/plugins/codex-harness) 开始。关于配置字段，请参见 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 概览

Codex 模式并不是底层换了一个不同模型调用的 OpenClaw。Codex 拥有更多原生模型循环，OpenClaw 则围绕该边界适配它的插件、工具、会话和诊断表面。

OpenClaw 仍然拥有频道路由、会话文件、可见消息投递、OpenClaw 动态工具、审批、媒体投递和转录镜像。Codex 拥有规范的原生线程、原生模型循环、原生工具延续和原生压缩。

提示词路由遵循所选运行时，而不只是提供商字符串。原生 Codex 轮次会接收 Codex app-server 开发者指令，而显式的 OpenClaw 兼容路由会保留正常的 OpenClaw 系统提示词，即使它使用 Codex 风格的 OpenAI 凭证或传输协议。

原生 Codex 会根据活动 Codex 线程配置，保留 Codex 拥有的基础/模型指令和项目文档行为。OpenClaw 启动和恢复原生 Codex 线程时会禁用 Codex 内置人格，以便工作区人格文件和 OpenClaw 智能体身份保持权威。轻量级 OpenClaw 运行仍会保留现有的项目文档抑制。OpenClaw 开发者指令覆盖 OpenClaw 运行时关注点，例如来源频道投递、OpenClaw 动态工具、ACP 委派、适配器上下文，以及活动 Agent 工作区配置文件。OpenClaw Skills 目录和通过工具路由的 `MEMORY.md` 指针会被投射为原生 Codex 的轮次作用域协作开发者指令。活动 `BOOTSTRAP.md` 内容和完整 `MEMORY.md` 回退注入仍使用轮次输入引用上下文。

## 线程绑定和模型变更

当 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次向 app-server 发送当前选择的 OpenAI 模型、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续。

## 可见回复和 Heartbeat

当直接/来源聊天轮次通过 Codex harness 运行时，可见回复默认会对内部 WebChat 表面自动投递最终助手消息。这让 Codex 与 Pi harness 提示词契约保持一致：智能体正常回复，OpenClaw 将最终文本发布到来源对话。如果直接/来源聊天应有意保持最终助手文本私密，除非智能体调用 `message(action="send")`，请设置 `messages.visibleReplies: "message_tool"`。

Codex Heartbeat 轮次默认也会在可搜索的 OpenClaw 工具目录中获得 `heartbeat_respond`，因此智能体可以记录本次唤醒应保持安静还是发出通知，而不需要把该控制流编码到最终文本中。

Heartbeat 专用的主动性指导会在 Heartbeat 轮次本身作为 Codex 协作模式开发者指令发送。普通聊天轮次会恢复 Codex Default 模式，而不是在正常运行时提示词中携带 Heartbeat 理念。当存在非空 `HEARTBEAT.md` 时，Heartbeat 协作模式指令会指向该文件，而不是内联其内容。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 OpenClaw 和 Codex harness 的产品/插件兼容性。                    |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的每轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入按线程配置的 Codex 配置。

启用 Codex app-server 审批时，也就是 `approvalPolicy` 不是 `"never"` 时，默认注入的原生钩子配置会省略 `PermissionRequest`，以便 Codex 的 app-server 审阅器和 OpenClaw 的审批桥接在审阅后处理真实提权。操作员可以在需要兼容中继时，显式向 `nativeHookRelay.events` 添加 `permission_request`。

其他 Codex 钩子，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 级控制。它们不会在 v1 契约中暴露为 OpenClaw 插件钩子。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用后执行该工具，因此 OpenClaw 会在 harness 适配器中触发它拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像所选事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则它不能重写原生 Codex 线程。

Codex app-server 报告模式 `PreToolUse` 事件会将插件审批请求延迟到匹配的 app-server 审批。如果 OpenClaw `before_tool_call` 钩子返回 `requireApproval`，而原生载荷设置了报告审批模式（`openclaw_approval_mode` 为 `"report"`），原生钩子中继会记录插件审批要求，并且不返回原生决策。当 Codex 为同一工具使用发送 app-server 审批请求时，OpenClaw 会打开插件审批提示，并将决策映射回 Codex。Codex `PermissionRequest` 事件是独立的审批路径，并且当运行时为该桥接配置时，仍可通过 OpenClaw 审批进行路由。

Codex app-server 条目通知还会为尚未由原生 `PostToolUse` 中继覆盖的原生工具完成提供异步 `after_tool_call` 观察。这些观察仅用于遥测和插件兼容性；它们不能阻塞、延迟或变更原生工具调用。

压缩和 LLM 生命周期投射来自 Codex app-server 通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级观察，而不是对 Codex 内部请求或压缩载荷逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投射为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex runtime v1 支持：

| 接口面                                       | 支持情况                                                                          | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环               | 支持                                                                        | Codex app-server 负责 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw 频道路由和交付         | 支持                                                                        | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw 动态工具                        | 支持                                                                        | Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                                                                                                                                                                                                                                                                                |
| 提示词和上下文插件                    | 支持                                                                        | OpenClaw 将 OpenClaw 特定的提示词/上下文投射到 Codex 轮次中，同时将 Codex 拥有的基础、模型和已配置的项目文档提示词留在原生 Codex 通道中。OpenClaw 会为原生线程禁用 Codex 内置人格，因此智能体工作区人格文件仍然是权威来源。原生 Codex 开发者指令只接受明确限定到 `codex_app_server` 的命令指导；旧版全局命令提示仍保留给非 Codex 提示词接口面。 |
| 上下文引擎生命周期                      | 支持                                                                        | 组装、摄取和轮次后维护会围绕 Codex 轮次运行。上下文引擎不会替代原生 Codex 压缩。                                                                                                                                                                                                                                                                                                                                                        |
| 动态工具钩子                            | 支持                                                                        | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态工具运行。                                                                                                                                                                                                                                                                                                                                                                          |
| 生命周期钩子                               | 作为适配器观测受支持                                                | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式载荷触发。                                                                                                                                                                                                                                                                                                                                                           |
| 最终答案修订门控                    | 通过原生钩子中继支持                                              | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终确定之前再进行一次模型处理。                                                                                                                                                                                                                                                                                                                                                                |
| 原生 shell、patch 和 MCP 阻止或观测 | 通过原生钩子中继支持                                              | Codex `PreToolUse` 和 `PostToolUse` 会为已提交的原生工具接口面中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数重写。                                                                                                                                                                                                                                                                               |
| 原生权限策略                      | 通过 Codex app-server 审批和兼容性原生钩子中继支持 | Codex app-server 审批请求会在 Codex 审查后通过 OpenClaw 路由。`PermissionRequest` 原生钩子中继对原生审批模式是可选启用的，因为 Codex 会在 guardian 审查之前发出它。                                                                                                                                                                                                                                                                          |
| App-server 轨迹捕获                 | 支持                                                                        | OpenClaw 会记录它发送给 app-server 的请求以及它收到的 app-server 通知。                                                                                                                                                                                                                                                                                                                                                                                    |

Codex runtime v1 中不支持：

| 接口面                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生工具前置钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 需要 Codex 钩子/架构支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像，并且可以投射未来上下文，但不应变更不受支持的内部机制。 | 如果需要原生线程手术式修改，请添加显式 Codex app-server API。                    |
| Codex 原生工具记录的 `tool_result_persist` | 该钩子转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范重写需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 可以请求原生压缩，但不会收到稳定的保留/丢弃列表、token 增量、完成摘要或摘要载荷。   | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | OpenClaw 不允许插件或上下文引擎否决、重写或替换原生 Codex 压缩。                                             | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。 |
| 逐字节模型 API 请求捕获             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终 OpenAI API 请求。                      | 需要 Codex 模型请求跟踪事件或调试 API。                                   |

## 原生权限和 MCP 征询

对于 `PermissionRequest`，OpenClaw 只有在策略作出决定时才会返回显式允许或拒绝决策。无决策结果不是允许。Codex 会将其视为没有钩子决策，并继续落到自己的 guardian 或用户审批路径。

Codex app-server 审批模式默认省略此原生钩子。当 `permission_request` 被显式包含在 `nativeHookRelay.events` 中，或兼容性运行时安装它时，此行为适用。

当操作员为 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 会在有界会话窗口内记住该精确的提供商/会话/工具输入/cwd 指纹。记住的决策有意只做精确匹配：命令、参数、工具载荷或 cwd 的任何变化都会创建新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流路由。Codex `request_user_input` 提示会发回发起聊天，下一条排队的后续消息会响应该原生服务器请求，而不是作为额外上下文被 Steer。其他 MCP 征询请求会失败关闭。

有关承载这些提示的一般插件审批流，请参阅 [插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

## 队列 Steer

活动运行队列 Steer 会映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默窗口内批处理 Steer 模式聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。

Codex 审查和手动压缩轮次可能会拒绝同一轮次 Steer。在这种
情况下，OpenClaw 会等待活动运行完成，然后再开始该提示。
当消息默认应排队而不是 Steer 时，使用 `/queue followup` 或 `/queue collect`。
参见 [Steering queue](/zh-CN/concepts/queue-steering)。

## Codex 反馈上传

当使用原生 Codex harness 的会话批准 `/diagnostics [note]` 时，OpenClaw
还会为相关 Codex 线程调用 Codex app-server `feedback/upload`。该上传会请求
app-server 为每个列出的线程以及可用的已生成 Codex 子线程包含日志。

该上传通过 Codex 的常规反馈路径发送到 OpenAI 服务器。如果该 app-server
中禁用了 Codex 反馈，该命令会返回 app-server 错误。完成的诊断回复会列出
已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地
`codex resume <thread-id>` 命令。

如果你拒绝或忽略该审批，OpenClaw 不会打印这些 Codex ID，也不会发送
Codex 反馈。该上传不会取代本地 Gateway 网关诊断导出。关于审批、隐私、
本地包和群聊行为，参见 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你明确想要为当前附加线程上传 Codex 反馈，而不需要完整 Gateway 网关
诊断包时，才使用 `/codex diagnostics [note]`。

## 压缩和转录镜像

当所选模型使用 Codex harness 时，原生线程压缩归 Codex app-server 所有。
OpenClaw 不会为 Codex 轮次运行预检压缩，不会用上下文引擎压缩替换 Codex
压缩，也不会在无法启动原生 Codex 压缩时回退到 OpenClaw 或公共 OpenAI
摘要。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`
以及未来的模型或 harness 切换。

显式压缩请求，例如 `/compact` 或插件请求的手动压缩操作，会使用
`thread/compact/start` 启动原生 Codex 压缩。OpenClaw 在启动该原生操作后
返回。它不会等待完成、施加单独的 OpenClaw 超时、重启共享 Codex
app-server，也不会将该操作记录为 OpenClaw 已完成的压缩。

当上下文引擎请求 Codex 线程引导投影时，OpenClaw 会将工具调用名称和 ID、
输入形状以及经过脱敏的工具结果内容投影到新的 Codex 线程中。它不会把原始
工具调用参数值复制到该投影中。

该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex
推理或计划记录。目前，OpenClaw 仅在请求压缩时记录显式的原生压缩启动信号。
它不会公开人类可读的压缩摘要，也不会公开可审计的列表来说明 Codex 在压缩后
保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写
Codex 原生工具结果记录。它仅在 OpenClaw 写入 OpenClaw 拥有的会话转录工具结果时适用。

## 媒体和投递

OpenClaw 继续拥有媒体投递和媒体提供商选择。图像、视频、音乐、PDF、TTS
和媒体理解使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`
和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息工具输出会继续通过常规 OpenClaw
投递路径。媒体生成不需要旧版运行时。
当 Codex 发出带有 `savedPath` 的原生图像生成项时，即使 Codex 轮次没有助手文本，
OpenClaw 也会通过常规回复媒体路径转发该确切文件。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [插件钩子](/zh-CN/plugins/hooks)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [轨迹导出](/zh-CN/tools/trajectory)
