---
read_when:
    - 你需要 Codex harness runtime 支持契约
    - 你正在调试 Native Codex plugins、Hooks、压缩或反馈上传
    - 你正在更改 OpenClaw 和 Codex harness 轮次中的插件行为
summary: Codex harness 的运行时边界、钩子、工具、权限和诊断
title: Codex harness runtime
x-i18n:
    generated_at: "2026-07-12T14:37:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex harness 轮次的运行时契约。有关设置和路由，请参阅
[Codex harness](/zh-CN/plugins/codex-harness)。有关配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 概览

Codex 负责原生模型循环、原生线程恢复、原生工具续接和原生压缩。OpenClaw 负责频道路由、会话文件、可见消息投递、OpenClaw 动态工具、审批、媒体投递，以及围绕该边界的对话记录镜像。

提示词路由遵循所选运行时，而不只取决于提供商字符串。原生 Codex 轮次会获得 Codex app-server 开发者指令；显式的 OpenClaw 兼容路由即使使用 Codex 风格的 OpenAI 身份验证或传输方式，也会保留常规 OpenClaw 系统提示词。

OpenClaw 启动和恢复原生 Codex 线程时，会禁用 Codex 的内置个性（`personality: "none"`），以确保工作区个性文件和 OpenClaw 智能体身份保持权威性。除此之外，原生 Codex 仍会保留由 Codex 管理的基础/模型指令和项目文档加载。轻量级 OpenClaw 运行（例如 cron）仍会禁止加载项目文档。

OpenClaw 开发者指令涵盖 OpenClaw 运行时相关事项：源频道投递、OpenClaw 动态工具、ACP 委派、适配器上下文，以及当前智能体工作区的配置文件。Skills 目录和通过工具路由的 `MEMORY.md` 指针会作为轮次级协作开发者指令进行投射。当记忆工具不可用时，当前 `BOOTSTRAP.md` 内容和完整的 `MEMORY.md` 会改为回退到普通轮次输入上下文中。

大多数 OpenClaw 动态工具使用可搜索的 `openclaw` 命名空间。标记为 `catalogMode: "direct-only"` 的工具使用 `openclaw_direct`；Codex 会将其作为 `DirectModelOnly` 保持对模型直接可见，而不会将其暴露给嵌套的代码模式执行。

## 线程绑定和模型更改

当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会将当前所选模型、审批策略、沙箱、审批审核者和服务层级重新发送到 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但要求 Codex 使用新选择的模型继续运行。

受监督绑定是例外情况。OpenClaw 模型选择器会保持锁定，恢复时会省略模型和提供商覆盖项，让 Codex 恢复规范线程中持久化的模型和提供商。单独的原生 Codex 控制项可以更改这个持久化组合，初始快照可能会产生 Codex 常规的模型差异警告；外层 OpenClaw 模型和回退链绝不会替代其中任何一个。

## 监督和安全续接

Codex 监督是同一个 `codex` 插件的一项可选能力。它通过单独的连接发现原生线程，并且仅将未归档的会话投射到 Gateway 网关目录中。如果没有显式的 `appServer` 连接设置，该连接会使用托管的用户主目录 stdio，而普通 harness 仍限定在智能体范围内。列表和元数据读取是被动操作：它们不会恢复线程、让 OpenClaw 订阅线程的实时事件，也不会响应线程的审批。

对于 Gateway 网关计算机上已存储或空闲的会话，**作为分支继续**会创建一个普通的模型锁定 Chat，并镜像有界的用户和助手历史记录，直至源会话最后一个持久化的终结轮次。第一个普通 Chat 轮次会安装真正的审批处理程序，并使用临时原生分叉来固定快照，而不覆盖模型或提供商。Codex App Server 使用其当前原生配置并返回所选组合；如果该模型与源会话最后记录的模型不同，它会发出常规警告。在同一个监督连接上，OpenClaw 会在源会话的 cwd 和运行时策略下启动规范的 `appServer` 源 Codex harness 线程，并在该初次启动中准确使用返回的模型和提供商，注入有界的可见历史记录，然后归档临时分叉。源会话绝不会被恢复。规范线程拥有完整的 OpenClaw harness 工具界面；源会话中的推理、工具调用和工具结果不会克隆到该线程中。专用连接作用域会贯穿待处理和已提交的绑定状态，因此之后的每个轮次都会继续使用该连接及其原生身份验证和提供商配置。监督被禁用或绑定/连接发生漂移时，系统会以关闭方式失败，而不会切换到普通的智能体主目录 harness。

原始 CLI 或 VS Code 源会话仍可同时出现在两个目录中。规范分支是原生 Codex 线程，但其源类型为 `appServer`；原生客户端可能会过滤该源类型，因此无法保证它会出现在 Codex Desktop 中。

活动源会话无法启动新分支或被归档；现有的受监督 Chat 仍可打开。`notLoaded` 表示活动状态未知，而非空闲；只有在显式确认没有其他运行器，并重新读取进程本地状态后，OpenClaw 才允许归档本地 `idle` 或 `notLoaded` 行。Codex 会在单个 App Server 进程内串行化线程变更，但不会提供跨进程独占运行器租约或审批所有者租约，因此该读取操作无法证明其他进程未在使用该线程。对于精确目标，或 Codex 的分页后代查询返回的任何未归档派生后代，OpenClaw 都会阻止已知的活动绑定所有者。枚举错误、循环和安全限制耗尽时，系统会以关闭方式失败。原生归档仍可能与另一进程中的新轮次发生竞态，因此该确认涵盖未知客户端，以及状态读取与归档之间的间隙。当受监督且模型锁定的 Chat 保护原生绑定时，无法将其删除。

配对节点目录在初始版本中仅保留元数据。当前的节点调用边界采用请求/响应模式，无法承载真正的 Codex harness 绑定所需的长生命周期轮次事件、审批请求或流式输出。因此，即使相应行处于空闲状态，远程 **继续** 和 **归档** 仍不可用。

有关操作员设置和可见的 Control UI 行为，请参阅 [Codex 监督](/zh-CN/plugins/codex-supervision)。

## 可见回复与 Heartbeat

通过 Codex harness 进行的直接/来源聊天轮次，默认会在内部 WebChat 界面自动交付智能体的最终回复，这与 Pi harness 契约一致：智能体正常回复，OpenClaw 将最终文本发送到来源对话。设置 `messages.visibleReplies: "message_tool"` 后，除非智能体调用 `message(action="send")`，否则最终的智能体文本将保持私密。

默认情况下，Codex Heartbeat 轮次会在可搜索的 OpenClaw 工具目录中获得 `heartbeat_respond`，以便智能体记录此次唤醒应保持静默还是发送通知。Heartbeat 主动行为指南会作为仅适用于该 Heartbeat 轮次的 Codex 协作模式开发者指令发送；普通聊天轮次仍使用 Codex Default 模式。当 `HEARTBEAT.md` 非空时，Heartbeat 指令会引导 Codex 查看该文件，而不是内联其内容。

## 钩子边界

| 层                                    | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 确保 OpenClaw 与 Codex harness 之间的产品/插件兼容性。               |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具提供每轮次的适配器行为。                       |
| Codex 原生钩子                        | Codex                    | 通过 Codex 配置控制底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由插件行为。对于原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入按线程配置的 Codex 设置。

当启用 Codex app-server 审批（`approvalPolicy` 不为
`"never"`）时，默认注入的原生钩子配置会省略 `PermissionRequest`，
以便 Codex 的 app-server 审核器和 OpenClaw 的审批桥接在审核后处理实际的
权限提升请求。若仍要强制使用兼容性中继，请将 `permission_request` 添加到
`nativeHookRelay.events`。其他 Codex 钩子（如 `SessionStart` 和
`UserPromptSubmit`）仍属于 Codex 级控制；在 v1 契约中，它们不会作为
OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，Codex 请求调用后，由 OpenClaw 执行工具，
因此插件和中间件行为在 harness 适配器中运行。对于 Codex 原生工具，
Codex 拥有规范工具记录；OpenClaw 可以镜像选定事件，但无法重写原生线程，
除非 Codex 通过 app-server 或原生钩子回调公开该能力。

Codex app-server 报告模式的 `PreToolUse` 事件会将插件审批推迟到
对应的 app-server 审批。如果 OpenClaw 的 `before_tool_call` 钩子返回
`requireApproval`，而原生载荷设置了 `openclaw_approval_mode:
"report"`，则原生钩子中继会记录插件审批要求，并且不返回原生决策。
当 Codex 随后针对同一次工具使用发送 app-server 审批请求时，
OpenClaw 会打开插件审批提示，并将决策映射回 Codex。Codex 的
`PermissionRequest` 事件属于独立的审批路径；当配置为使用该桥接时，
它们仍可通过 OpenClaw 审批进行路由。

Codex app-server 项目通知还会针对尚未由原生 `PostToolUse` 中继覆盖的
原生工具完成事件，提供异步 `after_tool_call` 观测。这些通知仅用于
遥测/兼容性；它们无法阻止、延迟或修改原生工具调用。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而非 Codex 原生钩子命令。
`before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 是
适配器层面的观察结果，并非对 Codex 内部请求或压缩载荷逐字节的捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被
投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 运行时 v1 支持：

| 表面                                          | 支持情况                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环               | 支持                                                                             | Codex app-server 负责 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                                                                                                                                                                                                                                                                                                        |
| OpenClaw 频道路由和交付                       | 支持                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍位于模型运行时之外。                                                                                                                                                                                                                                                                                                                                                                                                           |
| OpenClaw 动态工具                             | 支持                                                                             | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 始终处于执行路径中。                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 提示词和上下文插件                            | 支持                                                                             | OpenClaw 将 OpenClaw 特有的提示词/上下文投射到 Codex 轮次中，同时将 Codex 所有的基础提示词、模型提示词和已配置的项目文档提示词保留在原生 Codex 路径中。OpenClaw 会为原生线程禁用 Codex 的内置个性设定，以确保 Agent 工作区的个性设定文件保持权威性。原生 Codex 开发者指令仅接受明确限定于 `codex_app_server` 的命令指导；旧版全局命令提示仍用于非 Codex 提示词表面。 |
| 上下文引擎生命周期                            | 支持                                                                             | 组装、摄取和轮次后维护在 Codex 轮次前后运行。上下文引擎不会取代原生 Codex 压缩。                                                                                                                                                                                                                                                                                                                                                                                                         |
| 动态工具钩子                                  | 支持                                                                             | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 所有的动态工具运行。                                                                                                                                                                                                                                                                                                                                                                                               |
| 生命周期钩子                                  | 支持作为适配器观测                                                               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实反映 Codex 模式的负载触发。                                                                                                                                                                                                                                                                                                                                                                 |
| 最终答案修订门控                              | 通过原生钩子中继支持                                                             | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会在最终定稿前请求 Codex 再执行一次模型轮次。                                                                                                                                                                                                                                                                                                                                                                                  |
| 原生 shell、补丁和 MCP 的阻止或观测           | 通过原生钩子中继支持                                                             | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具表面进行中继，包括 Codex app-server `0.142.0` 或更高版本上的 MCP 负载。支持阻止，但不支持重写参数。                                                                                                                                                                                                                                                                                                                            |
| 原生权限策略                                  | 通过 Codex app-server 审批和兼容性原生钩子中继支持                               | Codex 审查后，Codex app-server 审批请求会通过 OpenClaw 路由。对于原生审批模式，`PermissionRequest` 原生钩子中继为可选启用，因为 Codex 会在守护程序审查前发出该事件。                                                                                                                                                                                                                                                                                                                       |
| App-server 轨迹捕获                           | 支持                                                                             | OpenClaw 会记录发送给 app-server 的请求以及从 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                                                  |

Codex runtime v1 不支持：

| 表面                                                | V1 边界                                                                                                                                          | 未来路径                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 原生工具参数修改                                    | Codex 原生工具调用前钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                  | 需要 Codex 钩子/架构支持替换工具输入。                                                    |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有其镜像并可投射未来上下文，但不应修改不受支持的内部结构。                                               | 如果需要对原生线程进行修改，请添加明确的 Codex app-server API。                           |
| Codex 原生工具记录的 `tool_result_persist`          | 该钩子转换的是 OpenClaw 所有的转录写入，而不是 Codex 原生工具记录。                                                                               | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                        |
| 丰富的原生压缩元数据                                | OpenClaw 可以请求原生压缩，但不会收到稳定的保留/丢弃列表、令牌增量、完成摘要或摘要负载。                                                         | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | OpenClaw 不允许插件或上下文引擎否决、重写或替换原生 Codex 压缩。                                                                                | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。                             |
| 逐字节捕获模型 API 请求                             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心在内部构建最终的 OpenAI API 请求。                                                         | 需要 Codex 模型请求跟踪事件或调试 API。                                                   |

## 原生权限和 MCP 请求

对于 `PermissionRequest`，只有在策略作出决定时，OpenClaw 才会返回明确的允许或拒绝决定。无决定结果并不表示允许：Codex 会将其视为钩子未作出决定，并转而使用自身的守护程序或用户审批路径。

默认情况下，Codex app-server 审批模式会省略此原生钩子。除非 `nativeHookRelay.events` 明确包含 `permission_request`，或兼容性运行时安装了该钩子，否则均适用此行为。

当操作员为 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 会在一个有界会话时间窗口内记住该提供商/会话/工具输入/cwd 的精确指纹。记住的决定有意仅适用于完全匹配：命令、参数、工具负载或 cwd 发生变化都会触发新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程路由。Codex `request_user_input` 提示会发送回发起请求的聊天，下一条排队的后续消息将用于回答该原生服务器请求，而不会作为额外上下文进行 Steer。其他 MCP 请求将以失败关闭方式处理。

有关承载这些提示的常规插件审批流程，请参阅[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

## 队列 Steer

活跃运行期间的队列 Steer 会映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在已配置的静默时间窗口内批处理 Steer 模式的聊天消息，并按到达顺序将其作为一个 `turn/steer` 请求发送。

Codex 审查和手动压缩轮次可能会拒绝同轮 Steering。在这种情况下，OpenClaw 会等待当前运行结束后再启动该提示。若消息默认应排队而非用于 Steering，请使用 `/queue followup` 或 `/queue collect`。请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。

## Codex 反馈上传

在原生 Codex harness 上批准某个会话的 `/diagnostics [note]` 后，OpenClaw 还会针对相关 Codex 线程调用 Codex app-server 的 `feedback/upload`，其中包括每个列出线程的日志，以及可用时由其生成的 Codex 子线程日志。

上传会通过 Codex 的常规反馈路径发送至 OpenAI 服务器。如果该 app-server 中已禁用 Codex 反馈，此命令会返回 app-server 错误。诊断完成后的回复会列出已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>` 命令。

如果你拒绝或忽略审批，OpenClaw 不会输出这些 Codex ID，也不会发送 Codex 反馈。上传不会取代本地 Gateway 网关诊断导出。有关审批、隐私、本地捆绑包和群聊行为，请参阅[诊断导出](/zh-CN/gateway/diagnostics)。

仅当你希望为当前附加的线程上传 Codex 反馈，而不需要完整的 Gateway 网关诊断捆绑包时，才使用 `/codex diagnostics [note]`。

## 压缩和转录镜像

当所选模型使用 Codex harness 时，原生线程压缩由 Codex app-server 负责。OpenClaw 不会为 Codex 轮次运行预检压缩，不会用上下文引擎压缩取代 Codex 压缩，也不会在无法启动原生压缩时回退到 OpenClaw 或公开的 OpenAI 摘要功能。OpenClaw 会保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset`，以及将来切换模型或 harness。

显式压缩请求（例如 `/compact` 或插件请求的手动压缩操作）会通过 `thread/compact/start` 启动原生 Codex 压缩。OpenClaw 会保持请求和共享客户端租约处于打开状态，直到 Codex 发出匹配的 `contextCompaction` 完成项，然后将该压缩轮次报告为已完成。如果该终止轮次超过配置的压缩超时时间，OpenClaw 会请求原生轮次中断。在 Codex 报告终止状态或确认中断 RPC 前，租约和每线程压缩围栏会一直保持占用。如果 Codex 未在中断宽限期内确认，OpenClaw 会先停用连接，再释放围栏。远程连接还会分离匹配的线程绑定，以避免后续工作与未确认的远程轮次重叠。已停用连接上的其他轮次会失败，并可使用新客户端重试。客户端关闭、请求取消或压缩轮次失败都会返回操作失败。上下文压力触发的自动压缩由 Codex 负责；OpenClaw 仅针对手动请求的触发条件启动原生压缩。

当上下文引擎请求 Codex 线程引导投影时，OpenClaw 会将工具调用名称和 ID、输入结构以及经过脱敏的工具结果内容投影到新的 Codex 线程中。它不会将原始工具调用参数值复制到该投影中。

当 app-server 发出相关记录时，镜像会包含用户提示、助手最终文本以及轻量级 Codex 推理或计划记录。OpenClaw 会记录原生压缩的开始和终止状态，但不会公开人类可读的压缩摘要，也不会提供压缩后 Codex 保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入由 OpenClaw 所有的会话转录工具结果时适用。

## 媒体和交付

OpenClaw 继续负责媒体交付和媒体提供商选择。图像、视频、音乐、PDF、TTS 和媒体理解会使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息工具输出继续通过常规 OpenClaw 交付路径传送；媒体生成不需要旧版运行时。当 Codex 发出带有 `savedPath` 的原生图像生成项时，即使该 Codex 轮次没有助手文本，OpenClaw 也会通过常规回复媒体路径转发该确切文件。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex 监管](/zh-CN/plugins/codex-supervision)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [插件钩子](/zh-CN/plugins/hooks)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [轨迹导出](/zh-CN/tools/trajectory)
