---
read_when:
    - 你需要 Codex harness runtime 支持契约
    - 你正在调试原生 Codex 工具、Hooks、压缩或反馈上传
    - 你正在更改跨 OpenClaw 和 Codex harness 轮次的插件行为
summary: Codex harness 的运行时边界、钩子、工具、权限和诊断
title: Codex harness runtime
x-i18n:
    generated_at: "2026-07-05T11:29:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcf458cfae804655e4544682ff7c12643bccf298b868d918b7c115ae5d075eae
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex harness 轮次的运行时契约。关于设置和路由，请参阅
[Codex harness](/zh-CN/plugins/codex-harness)。关于配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 概览

Codex 负责原生模型循环、原生线程恢复、原生工具续接和原生压缩。OpenClaw 负责渠道路由、会话文件、可见消息投递、OpenClaw 动态工具、审批、媒体投递，以及围绕该边界的转录镜像。

提示路由遵循所选运行时，而不只是提供商字符串。原生 Codex 轮次会获得 Codex app-server 开发者指令；显式的 OpenClaw 兼容路由即使使用 Codex 风格的 OpenAI 凭证或传输，也会保留常规 OpenClaw 系统提示。

OpenClaw 会在禁用 Codex 内置个性（`personality: "none"`）的情况下启动和恢复原生 Codex 线程，以便工作区个性文件和 OpenClaw 智能体身份保持权威。除此之外，原生 Codex 仍保留 Codex 所有的基础/模型指令和项目文档加载。轻量级 OpenClaw 运行（例如 cron）仍会抑制项目文档加载。

OpenClaw 开发者指令覆盖 OpenClaw 运行时关注点：来源渠道投递、OpenClaw 动态工具、ACP 委派、适配器上下文，以及活动 Agent 工作区配置文件。Skills 目录和通过工具路由的 `MEMORY.md` 指针会被投射为轮次范围的协作开发者指令。当记忆工具不可用时，活动 `BOOTSTRAP.md` 内容和完整 `MEMORY.md` 会改为回退到普通轮次输入上下文。

## 线程绑定和模型变更

当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会向 app-server 重新发送当前选择的模型、审批策略、沙箱、审批审核方和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但要求 Codex 使用新选择的模型继续。

## 可见回复和 Heartbeat

通过 Codex harness 进行的直接/来源聊天轮次默认会为内部 WebChat 表面自动投递最终助手回复，与 Pi harness 契约一致：智能体正常回复，OpenClaw 将最终文本发布到来源对话。设置 `messages.visibleReplies: "message_tool"` 可让最终助手文本保持私密，除非智能体调用 `message(action="send")`。

Codex heartbeat 轮次默认会在可搜索的 OpenClaw 工具目录中获得 `heartbeat_respond`，以便智能体记录此次唤醒应保持安静还是发出通知。Heartbeat 主动性指导会作为限定到 heartbeat 轮次的 Codex 协作模式开发者指令发送；普通聊天轮次保持在 Codex Default 模式。当 `HEARTBEAT.md` 非空时，heartbeat 指令会将 Codex 指向该文件，而不是内联其内容。

## 钩子边界

| 层                                    | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 OpenClaw 和 Codex harness 的产品/插件兼容性。                    |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮次适配器行为。                          |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的低层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由插件行为。对于原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入逐线程 Codex 配置。

当 Codex app-server 审批已启用（`approvalPolicy` 不是 `"never"`）时，默认注入的原生钩子配置会省略 `PermissionRequest`，因此 Codex 的 app-server 审核方和 OpenClaw 的审批桥接会在审核后处理真实提权。将 `permission_request` 添加到 `nativeHookRelay.events` 可强制启用兼容中继。其他 Codex 钩子，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 级控制；它们不会在 v1 契约中作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，Codex 请求调用后由 OpenClaw 执行该工具，因此插件和中间件行为会在 harness 适配器中运行。对于 Codex 原生工具，Codex 拥有规范工具记录；OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该能力，否则无法重写原生线程。

Codex app-server report-mode `PreToolUse` 事件会将插件审批延后到匹配的 app-server 审批。如果 OpenClaw `before_tool_call` 钩子在原生载荷设置 `openclaw_approval_mode: "report"` 时返回 `requireApproval`，原生钩子中继会记录插件审批要求，并且不返回原生决策。当 Codex 随后为同一工具使用发送 app-server 审批请求时，OpenClaw 会打开插件审批提示，并将决策映射回 Codex。Codex `PermissionRequest` 事件是独立的审批路径，在为该桥接配置时仍可通过 OpenClaw 审批路由。

Codex app-server 条目通知还会为尚未由原生 `PostToolUse` 中继覆盖的原生工具完成提供异步 `after_tool_call` 观察。这些仅用于遥测/兼容性；它们不能阻塞、延迟或变更原生工具调用。

压缩和 LLM 生命周期投射来自 Codex app-server 通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。`before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 是适配器级观察，而不是逐字节捕获 Codex 内部请求或压缩载荷。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投射为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 运行时 v1 支持：

| 功能面                                        | 支持情况                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                                                             | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生工具延续。                                                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw 频道路由和递送                       | 支持                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                                                                                                                                                                                                                                                                                                      |
| OpenClaw 动态工具                             | 支持                                                                             | Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 提示词和上下文插件                            | 支持                                                                             | OpenClaw 将 OpenClaw 特定的提示词/上下文投射到 Codex 轮次中，同时将 Codex 拥有的基础提示词、模型提示词和已配置的项目文档提示词留在原生 Codex 通道中。OpenClaw 会为原生线程禁用 Codex 的内置人格，因此 Agent 工作区人格文件仍保持权威性。原生 Codex 开发者指令只接受明确限定到 `codex_app_server` 的命令指导；旧版全局命令提示仍保留给非 Codex 提示词表面。 |
| 上下文引擎生命周期                            | 支持                                                                             | 组装、摄取和轮次后维护围绕 Codex 轮次运行。上下文引擎不会替代原生 Codex 压缩。                                                                                                                                                                                                                                                                                                                                                                                                    |
| 动态工具钩子                                  | 支持                                                                             | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态工具运行。                                                                                                                                                                                                                                                                                                                                                                                           |
| 生命周期钩子                                  | 作为适配器观察支持                                                               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式载荷触发。                                                                                                                                                                                                                                                                                                                                                                  |
| 最终答案修订门控                              | 通过原生钩子中继支持                                                             | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终化之前再执行一次模型传递。                                                                                                                                                                                                                                                                                                                                                                               |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子中继支持                                                             | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具表面中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数重写。                                                                                                                                                                                                                                                                                                                             |
| 原生权限策略                                  | 通过 Codex app-server 审批和兼容性原生钩子中继支持                               | Codex app-server 审批请求会在 Codex review 之后通过 OpenClaw 路由。`PermissionRequest` 原生钩子中继对原生审批模式是选择启用的，因为 Codex 会在守护审查之前发出它。                                                                                                                                                                                                                                                                                                                   |
| App-server 轨迹捕获                           | 支持                                                                             | OpenClaw 会记录它发送给 app-server 的请求以及它收到的 app-server 通知。                                                                                                                                                                                                                                                                                                                                                                                                             |

Codex 运行时 v1 不支持：

| 功能面                                              | V1 边界                                                                                                                                        | 未来路径                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生工具前置钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                     | 需要 Codex 钩子/架构支持替换工具输入。                                                    |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像并可以投射未来上下文，但不应更改不受支持的内部机制。                                           | 如果需要原生线程手术式修改，请添加显式 Codex app-server API。                             |
| Codex 原生工具记录的 `tool_result_persist`          | 该钩子转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                                               | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                         |
| 丰富的原生压缩元数据                                | OpenClaw 可以请求原生压缩，但不会收到稳定的保留/丢弃列表、token 增量、完成摘要或摘要载荷。                                                    | 需要更丰富的 Codex 压缩事件。                                                            |
| 压缩干预                                            | OpenClaw 不允许插件或上下文引擎否决、重写或替换原生 Codex 压缩。                                                                              | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。                             |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终 OpenAI API 请求。                                                     | 需要 Codex 模型请求跟踪事件或调试 API。                                                   |

## 原生权限和 MCP 请求

对于 `PermissionRequest`，OpenClaw 只在策略做出决定时返回显式允许或拒绝
决定。无决定结果不是允许：Codex 会将其视为没有钩子决定，并继续进入自己的守护或用户
审批路径。

Codex app-server 审批模式默认省略此原生钩子。除非 `permission_request` 被显式包含在
`nativeHookRelay.events` 中，或兼容性运行时安装了它，否则适用此行为。

当操作员为 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 会在有界会话窗口中记住
该确切的提供商/会话/工具输入/cwd 指纹。记住的决定有意仅限精确匹配：命令、参数、
工具载荷或 cwd 发生变化都会创建新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批
流路由。Codex `request_user_input` 提示会被发送回原始聊天，并且下一个排队的后续消息会回答该原生服务器请求，而不是作为额外上下文进行
Steer。其他 MCP 请求会失败关闭。

有关承载这些提示的通用插件审批流，请参见
[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

## 队列 Steer

活动运行队列 Steer 映射到 Codex app-server `turn/steer`。使用默认
`messages.queue.mode: "steer"` 时，OpenClaw 会在已配置的静默窗口内批处理 Steer 模式聊天
消息，并按到达顺序将它们作为一个 `turn/steer`
请求发送。

Codex 审查和手动压缩轮次可能会拒绝同轮 Steer。在
这种情况下，OpenClaw 会等待活动运行完成后再启动该
提示。当消息默认应进入队列而不是进行 Steer 时，请使用
`/queue followup` 或 `/queue collect`。参见 [Steering queue](/zh-CN/concepts/queue-steering)。

## Codex 反馈上传

当原生 Codex harness 上的某个会话批准 `/diagnostics [note]` 后，
OpenClaw 还会针对相关 Codex 线程调用 Codex app-server 的 `feedback/upload`，
其中包括每个列出线程的日志，以及可用时派生的 Codex
子线程。

上传会通过 Codex 的正常反馈路径发送到 OpenAI 服务器。如果该
app-server 中禁用了 Codex 反馈，该命令会返回
app-server 错误。完成后的诊断回复会列出已发送线程的渠道、
OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>`
命令。

如果你拒绝或忽略审批，OpenClaw 不会打印这些 Codex ID，
也不会发送 Codex 反馈。此上传不会替代本地
Gateway 网关诊断导出。关于审批、隐私、本地包和群聊行为，
请参见 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你希望为当前附加线程上传 Codex 反馈，而不需要完整
Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。

## 压缩和转录镜像

当所选模型使用 Codex harness 时，原生线程压缩归 Codex app-server
所有。OpenClaw 不会为 Codex 轮次运行预检压缩，不会用
context-engine 压缩替代 Codex 压缩，也不会在无法启动原生压缩时
回退到 OpenClaw 或公开 OpenAI 摘要。OpenClaw 会为渠道历史、
搜索、`/new`、`/reset` 以及未来的模型或 harness 切换保留转录镜像。

显式压缩请求，例如 `/compact` 或插件请求的手动
compact 操作，会通过 `thread/compact/start` 启动原生 Codex 压缩。
OpenClaw 会保持请求和共享客户端租约打开，直到 Codex 发出匹配的
`contextCompaction` 完成项，然后报告压缩轮次已完成。如果该终止轮次超过
配置的压缩超时时间，OpenClaw 会请求原生轮次中断。租约和每线程
压缩栅栏会保持持有，直到 Codex 报告终止状态或确认
中断 RPC。如果 Codex 在中断宽限期内未确认，OpenClaw 会在释放栅栏前
淘汰该连接。远程连接还会分离匹配的线程绑定，以便后续工作
不能与未确认的远程轮次重叠。已淘汰连接上的其他轮次会失败，
并可在新客户端上重试。客户端关闭、请求取消或失败的压缩轮次
会返回失败的操作。自动上下文压力压缩是 Codex 的职责；
OpenClaw 只会为手动请求的触发器启动原生压缩。

当上下文引擎请求 Codex 线程引导投影时，OpenClaw 会将工具调用
名称和 ID、输入形状以及已脱敏的工具结果内容投影到新的 Codex 线程。
它不会把原始工具调用参数值复制到该投影中。

镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级
Codex 推理或计划记录。OpenClaw 会记录原生压缩的开始和终止状态，
但不会公开人类可读的压缩摘要，也不会公开一份可审计列表来说明
Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 不会重写
Codex 原生工具结果记录。它只在 OpenClaw 写入 OpenClaw 拥有的
会话转录工具结果时适用。

## 媒体和递送

OpenClaw 继续拥有媒体递送和媒体提供商选择。图像、
视频、音乐、PDF、TTS 和媒体理解会使用匹配的提供商/模型
设置，例如 `agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息工具输出会继续
通过正常 OpenClaw 递送路径；媒体生成不需要
旧版运行时。当 Codex 发出带有 `savedPath` 的原生图像生成项时，
即使 Codex 轮次没有助手文本，OpenClaw 也会通过正常回复媒体
路径转发该确切文件。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [插件钩子](/zh-CN/plugins/hooks)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [轨迹导出](/zh-CN/tools/trajectory)
