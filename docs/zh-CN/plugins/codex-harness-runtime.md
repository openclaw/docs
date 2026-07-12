---
read_when:
    - 你需要 Codex harness runtime 支持契约
    - 你正在调试原生 Codex 工具、钩子、压缩或反馈上传
    - 你正在更改 OpenClaw 和 Codex harness 轮次中的插件行为
summary: Codex harness 的运行时边界、钩子、工具、权限和诊断
title: Codex harness runtime
x-i18n:
    generated_at: "2026-07-11T20:40:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex harness 轮次的运行时契约。有关设置和路由，请参阅
[Codex harness](/zh-CN/plugins/codex-harness)。有关配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 概览

Codex 负责原生模型循环、原生线程恢复、原生工具续接和原生压缩。OpenClaw 负责渠道路由、会话文件、可见消息递送、OpenClaw 动态工具、审批、媒体递送，以及该边界周围的对话记录镜像。

提示词路由遵循所选运行时，而不只是提供商字符串。原生 Codex 轮次会获得 Codex app-server 开发者指令；显式的 OpenClaw 兼容路由即使使用 Codex 风格的 OpenAI 身份验证或传输方式，也会保留常规的 OpenClaw 系统提示词。

OpenClaw 启动和恢复原生 Codex 线程时，会禁用 Codex 的内置个性（`personality: "none"`），以确保工作区个性文件和 OpenClaw 智能体身份保持权威性。除此之外，原生 Codex 仍会保留由 Codex 管理的基础/模型指令和项目文档加载。轻量级 OpenClaw 运行（例如 cron）仍会禁止加载项目文档。

OpenClaw 开发者指令涵盖 OpenClaw 运行时相关事项：源渠道递送、OpenClaw 动态工具、ACP 委派、适配器上下文，以及当前智能体工作区的配置文件。技能目录和通过工具路由的 `MEMORY.md` 指针会投射为仅限当前轮次的协作开发者指令。当记忆工具不可用时，当前 `BOOTSTRAP.md` 内容和完整的 `MEMORY.md` 会改为作为普通轮次输入上下文提供。

大多数 OpenClaw 动态工具使用可搜索的 `openclaw` 命名空间。标记为 `catalogMode: "direct-only"` 的工具使用 `openclaw_direct`，Codex 会将其作为 `DirectModelOnly` 直接保持为模型可见，而不会向嵌套的代码模式执行公开。

## 线程绑定和模型变更

当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会将当前所选模型、审批策略、沙箱、审批复核方和服务层级重新发送给 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 时会保留线程绑定，但要求 Codex 使用新选择的模型继续运行。

受监管绑定是例外。OpenClaw 模型选择器会保持锁定，恢复时会省略模型和提供商覆盖项，以便 Codex 恢复规范线程中持久化的模型和提供商。单独的原生 Codex 控件可以更改这对持久化设置，而初始快照可能会产生 Codex 的常规模型差异警告；外层 OpenClaw 模型和回退链绝不会替代其中任何一个。

## 监管和安全续接

Codex 监管是同一个 `codex` 插件的一项可选能力。它通过单独的连接发现原生线程，并且只将未归档的会话投射到 Gateway 网关目录中。如果没有显式的 `appServer` 连接设置，该连接会使用托管的用户主目录 stdio，而普通 harness 仍限定在智能体范围内。列表和元数据读取是被动操作：它们不会恢复线程、让 OpenClaw 订阅其实时事件，也不会响应其审批请求。

对于 Gateway 网关计算机上已存储或空闲的会话，**作为分支继续**会创建一个普通的、模型锁定的聊天，并镜像有界的用户和助手历史记录，直至源会话最后一个已持久化的终止轮次。第一个普通聊天轮次会安装真正的审批处理程序，并使用临时原生分叉固定快照，而不覆盖模型或提供商。Codex App Server 使用其当前原生配置并返回所选的模型与提供商组合；如果该模型与源会话最后记录的模型不同，它会发出常规警告。在同一个监管连接上，OpenClaw 会在该源会话的当前工作目录和运行时策略下，启动来源为 `appServer` 的规范 Codex harness 线程，并在首次启动时严格使用返回的模型和提供商；然后注入有界的可见历史记录，并归档临时分叉。源会话绝不会被恢复。规范线程拥有完整的 OpenClaw harness 工具表面；源会话中的推理、工具调用和工具结果不会被克隆到其中。专用连接作用域会贯穿待处理和已提交的绑定状态，因此后续每个轮次都会继续使用该连接及其原生身份验证和提供商配置。如果监管被禁用，或绑定/连接发生漂移，系统会以关闭方式失败，而不会切换到普通的智能体主目录 harness。

原始 CLI 或 VS Code 源会话仍可同时出现在两个目录中。规范分支是原生 Codex 线程，但其来源类型为 `appServer`；原生客户端可能会筛除此来源类型，因此无法保证它会出现在 Codex Desktop 中。

活动源会话无法启动新分支或被归档；现有的受监管聊天仍可打开。`notLoaded` 表示活动状态未知，而不是空闲；只有在明确确认没有其他运行方，并完成一次最新的进程本地状态读取后，OpenClaw 才允许归档本地的 `idle` 或 `notLoaded` 条目。Codex 会在单个 App Server 进程内串行化线程变更，但不会提供跨进程独占运行方租约或审批所有者租约，因此该读取无法证明其他进程未使用此线程。对于精确目标或 Codex 分页后代查询返回的任何未归档派生后代，如果存在已知的活动绑定所有者，OpenClaw 会阻止操作。枚举错误、循环和达到安全上限时都会以关闭方式失败。原生归档仍可能与另一个进程中的新轮次发生竞态，因此该确认涵盖未知客户端，以及状态读取与归档之间的时间间隔。当受监管且模型锁定的聊天仍在保护原生绑定时，不能将其删除。

在初始版本中，已配对节点目录仅包含元数据。当前节点调用边界采用请求/响应模式，无法承载真正 Codex harness 绑定所需的长时轮次事件、审批请求或流式输出。因此，即使条目处于空闲状态，远程 **继续**和**归档**仍不可用。

有关操作员设置和 Control UI 中的可见行为，请参阅 [Codex 监管](/zh-CN/plugins/codex-supervision)。

## 可见回复和 Heartbeat

通过 Codex harness 进行的直接/源聊天轮次默认会自动向内部 WebChat 表面递送助手的最终回复，这与 Pi harness 契约一致：智能体正常回复，OpenClaw 将最终文本发布到源对话。将 `messages.visibleReplies: "message_tool"` 设置为仅当智能体调用 `message(action="send")` 时才公开最终助手文本，否则保持私有。

默认情况下，Codex Heartbeat 轮次会在可搜索的 OpenClaw 工具目录中获得 `heartbeat_respond`，以便智能体记录本次唤醒应保持静默还是发出通知。Heartbeat 主动性指导会作为仅限该 Heartbeat 轮次的 Codex 协作模式开发者指令发送；普通聊天轮次则保持 Codex Default 模式。当 `HEARTBEAT.md` 非空时，Heartbeat 指令会引导 Codex 读取该文件，而不是内联其内容。

## 钩子边界

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 保持 OpenClaw 与 Codex harness 之间的产品/插件兼容性。               |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具提供逐轮次的适配器行为。                       |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                 |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由插件行为。对于原生工具和权限桥接，OpenClaw 会为每个线程注入针对 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 的 Codex 配置。

启用 Codex app-server 审批时（`approvalPolicy` 不为 `"never"`），默认注入的原生钩子配置会省略 `PermissionRequest`，以便 Codex 的 app-server 复核方和 OpenClaw 的审批桥接在复核后处理实际的权限提升请求。如果仍要强制使用兼容性中继，请将 `permission_request` 添加到 `nativeHookRelay.events`。其他 Codex 钩子（例如 `SessionStart` 和 `UserPromptSubmit`）仍属于 Codex 层级的控制项；在 v1 契约中，它们不会作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，Codex 请求调用后由 OpenClaw 执行工具，因此插件和中间件行为会在 harness 适配器中运行。对于 Codex 原生工具，Codex 负责规范工具记录；OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调公开相应能力，否则无法重写原生线程。

Codex app-server 报告模式的 `PreToolUse` 事件会将插件审批推迟到对应的 app-server 审批。如果 OpenClaw `before_tool_call` 钩子返回 `requireApproval`，而原生载荷设置了 `openclaw_approval_mode: "report"`，原生钩子中继会记录插件审批要求，并且不返回原生决策。当 Codex 随后针对同一次工具使用发送 app-server 审批请求时，OpenClaw 会打开插件审批提示，并将决策映射回 Codex。Codex `PermissionRequest` 事件属于单独的审批路径；如果为该桥接进行了配置，它仍可通过 OpenClaw 审批进行路由。

Codex app-server 条目通知还会针对尚未由原生 `PostToolUse` 中继覆盖的原生工具完成事件，提供异步 `after_tool_call` 观测。这些信息仅用于遥测/兼容性；它们无法阻止、延迟或修改原生工具调用。

压缩和 LLM 生命周期投射来自 Codex app-server 通知及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。`before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 属于适配器层级的观测，并非对 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投射为用于轨迹记录和调试的 `codex_app_server.hook` 智能体事件。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 运行时 v1 支持：

| 表面能力                                      | 支持情况                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环               | 支持                                                                             | Codex app-server 负责 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                                                                                                                                                                                                                                                                                                     |
| OpenClaw 频道路由和交付                       | 支持                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道位于模型运行时之外。                                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw 动态工具                             | 支持                                                                             | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 始终处于执行路径中。                                                                                                                                                                                                                                                                                                                                                                                                                |
| 提示词和上下文插件                            | 支持                                                                             | OpenClaw 将 OpenClaw 特有的提示词/上下文投射到 Codex 轮次中，同时将 Codex 所有的基础提示词、模型提示词和已配置的项目文档提示词保留在原生 Codex 路径中。OpenClaw 会为原生线程禁用 Codex 的内置人格，使 Agent 工作区人格文件保持权威性。原生 Codex 开发者指令仅接受明确限定于 `codex_app_server` 的命令指导；旧版全局命令提示仍用于非 Codex 提示词表面。 |
| 上下文引擎生命周期                            | 支持                                                                             | 组装、摄取和轮次后维护围绕 Codex 轮次运行。上下文引擎不会取代原生 Codex 压缩。                                                                                                                                                                                                                                                                                                                                                                                                       |
| 动态工具钩子                                  | 支持                                                                             | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 所有的动态工具运行。                                                                                                                                                                                                                                                                                                                                                                                            |
| 生命周期钩子                                  | 支持作为适配器观测                                                               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式载荷触发。                                                                                                                                                                                                                                                                                                                                                                   |
| 最终答案修订门控                              | 通过原生钩子中继支持                                                             | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会在最终确定前请求 Codex 再执行一次模型处理。                                                                                                                                                                                                                                                                                                                                                                                |
| 原生 Shell、补丁和 MCP 阻止或观测             | 通过原生钩子中继支持                                                             | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具表面进行中继，包括 Codex app-server `0.142.0` 或更高版本中的 MCP 载荷。支持阻止；不支持重写参数。                                                                                                                                                                                                                                                                                                                            |
| 原生权限策略                                  | 通过 Codex app-server 审批和兼容性原生钩子中继支持                               | Codex 审查后，Codex app-server 审批请求会通过 OpenClaw 路由。对于原生审批模式，`PermissionRequest` 原生钩子中继需要显式启用，因为 Codex 会在守护机制审查前触发它。                                                                                                                                                                                                                                                                                                                     |
| App-server 轨迹捕获                           | 支持                                                                             | OpenClaw 会记录发送给 app-server 的请求以及从 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                                               |

Codex runtime v1 不支持：

| 表面能力                                            | V1 边界                                                                                                                                        | 未来路径                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生工具前置钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                   | 需要 Codex 钩子/模式支持替换工具输入。                                                    |
| 可编辑的 Codex 原生对话历史                         | Codex 拥有规范的原生线程历史记录。OpenClaw 拥有其镜像并可投射未来上下文，但不应修改不受支持的内部机制。                                         | 如果需要修改原生线程，请添加明确的 Codex app-server API。                                 |
| Codex 原生工具记录的 `tool_result_persist`          | 该钩子转换的是 OpenClaw 所有的对话记录写入，而不是 Codex 原生工具记录。                                                                         | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                         |
| 丰富的原生压缩元数据                                | OpenClaw 可以请求原生压缩，但不会收到稳定的保留/丢弃列表、词元差值、完成摘要或摘要载荷。                                                        | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | OpenClaw 不允许插件或上下文引擎否决、重写或替换原生 Codex 压缩。                                                                                | 如果插件需要否决或重写原生 Codex 压缩，请添加 Codex 压缩前置/后置钩子。                   |
| 逐字节捕获模型 API 请求                             | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex core 在内部构建。                                                     | 需要 Codex 模型请求追踪事件或调试 API。                                                   |

## 原生权限和 MCP 信息征询

对于 `PermissionRequest`，仅当策略作出决定时，OpenClaw 才会返回明确的允许或拒绝
决定。无决定结果不代表允许：Codex
会将其视为钩子未作决定，并转入自身的守护机制或用户
审批路径。

Codex app-server 审批模式默认省略此原生钩子。除非将 `permission_request`
明确包含在 `nativeHookRelay.events` 中，或由兼容性运行时安装该钩子，否则均
适用此行为。

当操作员对 Codex 原生权限请求选择 `allow-always` 时，
OpenClaw 会在有界的会话时间窗口内记住该提供商/会话/工具输入/cwd
精确指纹。所记住的决定有意仅限精确匹配：命令、参数、工具载荷或
cwd 发生变化都会触发新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批信息征询会通过 OpenClaw 的插件审批
流程路由。Codex
`request_user_input` 提示会发送回原始聊天，下一条排队的跟进消息将用于回答该原生服务器请求，而不是作为额外上下文
进行 Steer。其他 MCP 信息征询请求会以拒绝方式安全关闭。

有关承载这些提示的常规插件审批流程，请参阅
[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

## 队列 Steer

活跃运行队列 Steer 会映射到 Codex app-server `turn/steer`。使用
默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默时间窗口内批量收集 Steer 模式聊天
消息，并按照到达顺序将其作为一个 `turn/steer`
请求发送。

Codex 审查和手动压缩轮次可能会拒绝同一轮次的 Steering。在这种情况下，OpenClaw 会等待当前运行结束后再开始处理提示词。如果希望消息默认进入队列而不是用于 Steering，请使用 `/queue followup` 或 `/queue collect`。请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。

## Codex 反馈上传

当原生 Codex harness 上的某个会话批准执行 `/diagnostics [note]` 时，OpenClaw 还会针对相关 Codex 线程调用 Codex app-server 的 `feedback/upload`，其中包括每个列出线程的日志，以及可用时由其生成的 Codex 子线程日志。

上传通过 Codex 的常规反馈路径发送至 OpenAI 服务器。如果该 app-server 中已禁用 Codex 反馈，此命令将返回 app-server 错误。诊断完成后的回复会列出已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>` 命令。

如果你拒绝或忽略审批，OpenClaw 不会输出这些 Codex ID，也不会发送 Codex 反馈。此上传不会取代本地 Gateway 网关诊断导出。有关审批、隐私、本地捆绑包和群聊行为，请参阅[诊断导出](/zh-CN/gateway/diagnostics)。

仅当你希望为当前附加的线程上传 Codex 反馈，而不生成完整的 Gateway 网关诊断捆绑包时，才使用 `/codex diagnostics [note]`。

## 压缩与对话记录镜像

当所选模型使用 Codex harness 时，原生线程压缩由 Codex app-server 负责。对于 Codex 轮次，OpenClaw 不会运行预检压缩，不会使用上下文引擎压缩取代 Codex 压缩，也不会在无法启动原生压缩时回退到 OpenClaw 或公开的 OpenAI 摘要功能。OpenClaw 会保留对话记录镜像，用于渠道历史记录、搜索、`/new`、`/reset`，以及将来切换模型或 harness。

显式压缩请求（例如 `/compact` 或插件请求的手动压缩操作）会通过 `thread/compact/start` 启动原生 Codex 压缩。OpenClaw 会保持请求和共享客户端租约处于打开状态，直到 Codex 发出匹配的 `contextCompaction` 完成项，随后将压缩轮次报告为已完成。如果该终止轮次超过配置的压缩超时时间，OpenClaw 会请求中断原生轮次。租约和每线程压缩栅栏会一直保持占用，直到 Codex 报告终止状态或确认中断 RPC。如果 Codex 未在中断宽限期内确认，OpenClaw 会先停用连接，再释放栅栏。远程连接还会解除匹配的线程绑定，确保后续工作不会与未确认的远程轮次重叠。已停用连接上的其他轮次会失败，并可在新客户端上重试。客户端关闭、请求取消或压缩轮次失败都会返回操作失败。由上下文压力自动触发的压缩是 Codex 的职责；OpenClaw 仅针对手动请求的触发条件启动原生压缩。

当上下文引擎请求 Codex 线程引导投影时，OpenClaw 会将工具调用名称和 ID、输入结构以及经过脱敏的工具结果内容投影到新的 Codex 线程中。它不会将原始工具调用参数值复制到该投影中。

镜像包含用户提示词、智能体最终文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。OpenClaw 会记录原生压缩的开始和终止状态，但不会公开人类可读的压缩摘要，也不会提供可审计的条目列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入由 OpenClaw 所有的会话对话记录工具结果时适用。

## 媒体与交付

OpenClaw 继续负责媒体交付和媒体提供商选择。图像、视频、音乐、PDF、TTS 和媒体理解会使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息工具输出会继续通过常规 OpenClaw 交付路径传递；媒体生成不需要旧版运行时。当 Codex 发出带有 `savedPath` 的原生图像生成项时，即使 Codex 轮次没有智能体文本，OpenClaw 也会通过常规回复媒体路径转发该确切文件。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex 监督](/zh-CN/plugins/codex-supervision)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [插件钩子](/zh-CN/plugins/hooks)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [轨迹导出](/zh-CN/tools/trajectory)
