---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 `ChannelPlugin` 适配器接口面
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-07-12T14:40:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南将构建一个把 OpenClaw 连接到消息平台的渠道插件：私信安全、配对、回复线程和出站消息。

<Info>
  第一次接触 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，
  了解软件包结构和清单设置。
</Info>

## 你的插件负责什么

渠道插件不实现发送、编辑或表情回应工具；核心提供一个共享的
`message` 工具。你的插件负责：

- **配置** - 账户解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信审批流程
- **会话语法** - 提供商特定的会话 ID 如何映射到基础
  聊天、线程 ID 和父级回退
- **出站** - 向平台发送文本、媒体和投票
- **线程处理** - 如何将回复组织为线程
- **Heartbeat 输入状态** - 针对 Heartbeat 递送
  目标的可选“正在输入”或“忙碌”信号

核心负责共享消息工具、提示词接线、外层会话键结构、
通用 `:thread:` 记录以及分派。

## 消息适配器

使用 `openclaw/plugin-sdk/channel-outbound` 中的
`defineChannelMessageAdapter` 暴露一个 `message` 适配器。仅声明原生传输实际支持的、
持久化的最终发送能力，并通过契约测试证明原生副作用和返回的回执。文本和媒体
发送应指向旧版 `outbound` 适配器使用的相同传输函数。有关完整 API 契约、
能力矩阵、回执规则、实时预览最终化、接收确认策略、测试和迁移表，请参阅
[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

如果现有 `outbound` 适配器已经具备正确的发送方法和能力元数据，请使用
`createChannelMessageAdapterFromOutbound(...)` 派生 `message` 适配器，
而不是手动编写另一个桥接器。适配器发送操作返回 `MessageReceipt` 值。
对于旧版 ID，请使用 `listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 派生，而不是保留并行的 `messageIds`
字段。

精确声明实时能力和最终化器能力——核心使用这些能力来确定渠道可以执行哪些操作，
而声明行为与实际行为之间的偏差会导致契约测试失败：

| 表面                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

需要原地最终化草稿预览的渠道，应通过
`defineFinalizableLivePreviewAdapter(...)` 和
`deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑，并使用
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和
`verifyChannelMessageLiveFinalizerProofs(...)` 测试为已声明的能力提供保障，
避免原生预览、进度、编辑、回退/保留、清理和回执行为在无提示的情况下发生偏差。

延迟平台确认的入站接收器应声明
`message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是将
确认时序隐藏在监视器本地状态中。使用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每项已声明的策略。

`createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`
等旧版回复辅助函数仍可供兼容性分派器使用。不要在新的渠道代码中使用它们；
应改为从 `openclaw/plugin-sdk/channel-outbound` 上的 `message` 适配器、
回执以及接收/发送生命周期辅助函数开始。

### 入站入口（实验性）

正在迁移入站授权的渠道可以在运行时接收路径中使用实验性的
`openclaw/plugin-sdk/channel-ingress-runtime` 子路径。它接受平台事实、
原始允许列表、路由描述符、命令事实和访问组配置，然后返回发送者、路由、命令和激活
投影以及有序入口图，同时平台查询和副作用仍保留在插件中。请在传递给解析器的
描述符中保留插件身份规范化；不要序列化已解析状态或决策中的原始匹配值。有关
API 设计、所有权边界和测试预期，请参阅
[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。较旧的
`openclaw/plugin-sdk/channel-ingress` 子路径仍作为面向第三方插件的已弃用
兼容性门面导出。

### 输入状态指示器

如果你的渠道支持在入站回复之外显示输入状态指示器，请在渠道插件上暴露
`heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始前，使用已解析的
Heartbeat 递送目标调用它，并使用共享的输入状态保活/清理生命周期。如果平台需要
显式停止信号，请添加 `heartbeat.clearTyping(...)`。

### 媒体源参数

如果你的渠道为消息工具添加了承载媒体源的参数，请通过
`plugin.actions.describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。
核心使用这个显式列表进行沙箱路径规范化和出站媒体访问策略处理，因此插件不需要
针对提供商特定的头像、附件或封面图像参数在共享核心中添加特殊处理。

优先使用按操作键控的映射，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，
这样无关操作不会继承另一个操作的媒体参数。对于有意在所有已暴露操作之间共享的参数，
仍可使用扁平数组。

必须为平台侧媒体获取暴露临时公共 URL 的渠道，可以结合插件状态存储使用
`openclaw/plugin-sdk/outbound-media` 中的
`createHostedOutboundMediaStore(...)`。平台路由解析和令牌强制执行应保留在
渠道插件中；共享辅助函数仅负责媒体加载、过期元数据、分块行和清理。

### 原生负载塑形

如果你的渠道需要针对 `message(action="send")` 进行提供商特定的塑形，
请优先使用 `actions.prepareSendPayload(...)`。将原生卡片、区块、嵌入内容或
其他持久数据放在 `payload.channelData.<channel>` 下，并让核心通过
出站/消息适配器发送。仅当负载无法序列化和重试时，才将
`actions.handleAction(...)` 用作发送操作的兼容性回退。

### 会话对话语法

如果你的平台在对话 ID 中存储额外作用域，请使用
`messaging.resolveSessionConversation(...)` 将解析逻辑保留在插件中。
这是将 `rawId` 映射到基础对话 ID、可选线程 ID、显式
`baseConversationId` 和任意 `parentConversationCandidates` 的规范钩子。
返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛父级/基础对话
的顺序排列。

`messaging.resolveParentConversationCandidates(...)` 是一个已弃用的
兼容性回退，供只需在通用/原始 ID 之上提供父级回退的插件使用。如果两个钩子都存在，
核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，并且仅在
规范钩子省略它们时，才回退到
`resolveParentConversationCandidates(...)`。

如果内置插件需要在渠道注册表启动前执行相同解析，可以暴露一个顶层
`session-key-api.ts` 文件，其中包含匹配的
`resolveSessionConversation(...)` 导出（参见 Feishu 和 Telegram
插件）。仅当运行时插件注册表尚不可用时，核心才使用这个可安全用于引导启动的表面。

当插件代码需要规范化类似路由的字段、比较子线程及其父路由，或根据
`{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用
`openclaw/plugin-sdk/channel-route`。该辅助函数规范化数字线程 ID 的方式与
核心相同，因此应优先使用它，而不是临时进行 `String(threadId)` 比较。
具有提供商特定目标语法的插件应暴露
`messaging.resolveOutboundSessionRoute(...)`，以便核心无需解析器垫片即可获得
提供商原生的会话和线程身份。

### 账户作用域的对话绑定支持

当渠道支持通用的当前对话绑定时，请设置
`conversationBindings.supportsCurrentConversationBinding`。
`createChatChannelPlugin(...)` 默认将此静态能力设置为 `true`。

如果支持情况因已配置账户而异，还应实现
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`。
核心仅在启用静态能力后才评估这个同步钩子。返回 `false` 会使该账户无法使用通用的
当前对话能力、绑定、查询、列出、更新访问时间和解除绑定操作。省略该钩子会将静态能力
应用到每个账户。

请根据已经加载的账户配置或运行时状态解析结果。此钩子仅控制通用的当前对话绑定；
它不会取代已配置的绑定规则或插件拥有的会话路由。契约测试应通过
`openclaw/plugin-sdk/channel-core` 导出的
`ChannelPlugin["conversationBindings"]` 契约，至少覆盖一个受支持账户和一个
不受支持账户。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。核心负责同一聊天中的 `/approve`、
共享审批按钮负载和通用回退递送。`ChannelPlugin.approvals` 已被移除；
请改为将审批递送、原生、渲染和身份验证事实放在一个 `approvalCapability` 对象中。
`plugin.auth` 仅用于登录/登出——核心不再从该对象读取审批身份验证钩子。

仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制；
仅当渠道确实需要自定义审批负载而非共享渲染器时，才使用
`approvalCapability.render`。

### 审批身份验证

- `approvalCapability.authorizeActorAction` 和
  `approvalCapability.getActionAvailabilityState` 是规范的
  审批身份验证接缝。
- 使用 `getActionAvailabilityState` 表示同一聊天中审批身份验证的可用性。
  即使原生递送已禁用，也应让已配置的审批者可以使用 `/approve`；原生发起表面状态
  应改用于递送/设置指导。
- 如果你的渠道暴露原生 Exec 审批，请在发起表面/原生客户端状态与同一聊天中的
  审批身份验证不同时，使用
  `approvalCapability.getExecInitiatingSurfaceState` 表示前者。核心使用这个
  Exec 专用钩子区分 `enabled` 和 `disabled`、判断发起渠道是否支持原生 Exec
  审批，并将该渠道纳入原生客户端回退指导。
  `createApproverRestrictedNativeApprovalCapability(...)` 会处理这一常见情况。
- 如果渠道可以从现有配置中推断稳定的、类似所有者的私信身份，请使用
  `openclaw/plugin-sdk/approval-runtime` 中的
  `createResolvedApproverActionAuthAdapter` 限制同一聊天中的 `/approve`，
  而无需添加审批专用的核心逻辑。
- 如果自定义审批身份验证有意仅允许同一聊天回退，请从
  `openclaw/plugin-sdk/approval-auth-runtime` 返回
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；
  否则核心会将结果视为显式审批者授权。
- 如果渠道拥有的原生回调直接解析审批，请在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，以便隐式回退仍通过渠道的
  常规参与者授权。

### 负载生命周期和设置指导

- 对于渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示，或在交付前发送正在输入指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload`。
- 当渠道希望在功能禁用时的回复中说明启用原生 Exec 审批所需的确切配置项，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；
  具名账户渠道应呈现账户范围的路径，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 当插件审批失败指南可安全地用于插件审批无路由和超时故障时，请使用 `approvalCapability.describePluginApprovalSetup`。
  `createApproverRestrictedNativeApprovalCapability(...)` 不会从
  `describeExecApprovalSetup` 推断此设置；仅当插件审批和 Exec 审批确实使用相同的原生设置时，才显式传入同一个辅助函数。

### 原生审批交付

如果渠道需要原生审批交付，请让渠道代码专注于目标规范化以及传输/呈现信息。使用
`openclaw/plugin-sdk/approval-runtime` 中的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 和
`createApproverRestrictedNativeApprovalCapability`。将渠道特定信息置于
`approvalCapability.nativeRuntime` 之后，最好通过
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，以便核心可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及已路由至其他位置的通知。

`nativeRuntime` 分为几个较小的接缝：

- `availability` - 账户是否已配置，以及是否应处理请求
- `presentation` - 将共享审批视图模型映射为待处理/已解决/已过期的原生载荷或最终操作
- `transport` - 准备目标，以及发送/更新/删除原生审批消息
- `interactions` - 用于原生按钮或表情回应的可选绑定/解绑/清除操作钩子，以及可选的 `cancelDelivered` 钩子。当 `deliverPending` 注册进程内或持久化状态（例如表情回应目标存储）时，应实现
  `cancelDelivered`，以便在 `bindPending` 运行前处理器停止并取消交付，或
  `bindPending` 未返回句柄时释放该状态
- `observe` - 可选的交付诊断钩子

其他审批辅助函数：

- 当渠道同时支持源自会话的原生交付和显式审批转发目标时，请使用
  `openclaw/plugin-sdk/approval-native-runtime` 中的
  `createNativeApprovalChannelRouteGates`。该辅助函数集中处理审批配置选择、`mode` 处理、智能体/会话过滤器、账户绑定、会话目标匹配和目标列表匹配；调用方仍负责渠道 ID、默认转发模式、账户查找、传输启用检查、目标规范化和轮次来源目标解析。不要用它创建由核心所有的渠道策略默认值；请显式传入该渠道文档中规定的默认模式。
- `createChannelNativeOriginTargetResolver` 默认使用共享渠道路由匹配器处理 `{ to, accountId, threadId }` 目标。仅当渠道具有提供商特定的等价规则（例如 Slack 时间戳前缀匹配）时，才传入
  `targetsMatch`。当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时保留原始目标用于交付时，请传入 `normalizeTargetForMatch`。仅当解析后的交付目标本身应被规范化时，才使用 `normalizeTarget`。
- 如果渠道需要由运行时所有的对象，例如客户端、令牌、Bolt
  应用或 webhook 接收器，请通过
  `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心能够从渠道启动状态引导由能力驱动的处理器，而无需添加审批专用的包装粘合代码。
- 仅当能力驱动的接缝表达能力仍不足时，才使用更底层的 `createChannelApprovalHandler` 或
  `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助函数传递 `accountId` 和 `approvalKind`。`accountId` 可将多账户审批策略限定到正确的 Bot 账户，而 `approvalKind` 可让渠道获知 Exec 审批与插件审批的行为，无需在核心中使用硬编码分支。
- 核心也负责审批重路由通知。渠道插件不应从
  `createChannelNativeApprovalRuntime` 发送自己的“审批已转到私信/其他渠道”后续消息；应通过共享审批能力辅助函数公开准确的来源路由和审批者私信路由，并让核心聚合实际交付结果，再向发起聊天发送通知。
- 端到端保留已交付审批 ID 的种类。原生客户端不应根据渠道本地状态猜测或改写 Exec 审批与插件审批的路由。
- 将该显式 `approvalKind` 传给 `resolveApprovalOverGateway`。它使用规范的 `approval.resolve` 服务，并在其他界面率先作答时返回记录的胜出者。旧版显式 `resolveMethod` 输入仍用于由命令支持的控件；新的原生操作不得使用它，也不得从 ID 推断种类。
- 不同审批种类可以有意公开不同的原生界面。当前内置示例：Matrix 对 Exec 审批和插件审批保持相同的原生私信/渠道路由和表情回应体验，同时仍允许身份验证因审批种类而异；Slack 则让 Exec ID 和插件 ID 都可使用原生审批路由。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上公开 `approvalCapability`。

### 更细分的审批运行时子路径

对于高频渠道入口点，如果只需要该系列中的一部分，请优先使用以下更细分的子路径，而不是更宽泛的 `approval-runtime` 桶形导出：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，如果不需要全部功能，请优先使用 `openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`，而不是更宽泛的总括界面。

### 设置子路径

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助函数：
  `createSetupTranslator`、导入安全的设置补丁适配器
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式设置代理构建器。
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装设置构建器，以及一些设置安全的基础组件：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 仅当还需要更重量级的共享设置/配置辅助函数（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接缝。

如果你的渠道只想在设置界面中提示“请先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导在配置写入和最终确定时会采用故障关闭策略，并在验证、最终确定和文档链接文案中复用同一条要求安装的消息。

如果你的渠道支持由环境变量驱动的设置或身份验证，并且通用启动/配置流程应在运行时加载前获知这些环境变量名称，请在插件清单中通过 `channelEnvVars` 声明它们。渠道运行时的 `envVars` 或本地常量仅用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或
SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应可安全地导入只读命令路径，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、状态适配器和渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

主渠道入口的导入路径也应保持精简。设备发现可以对入口和渠道插件模块求值，以注册能力，而不激活渠道。`channel-plugin-api.ts` 等文件应导出渠道插件对象，而不导入设置向导、传输客户端、套接字监听器、子进程启动器或服务启动模块。将这些运行时组件放入从 `registerFull(...)`、运行时设置器或惰性能力适配器加载的模块中。

### 其他细分渠道子路径

对于其他高频渠道路径，请优先使用细分辅助函数，而不是更宽泛的旧版界面：

- 使用 `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 处理多账户配置和默认账户回退
- 使用 `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound` 处理入站路由/信封以及记录并分发连接
- 使用 `openclaw/plugin-sdk/channel-targets` 中的目标解析辅助函数
- 使用 `openclaw/plugin-sdk/outbound-media` 加载媒体，并使用
  `openclaw/plugin-sdk/channel-outbound` 处理出站身份/发送委托和载荷规划
- 当出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍匹配时恢复当前 `:thread:` 会话，请使用
  `openclaw/plugin-sdk/channel-core` 中的
  `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台具有原生话题串交付语义时，可以覆盖优先级、后缀行为和话题串 ID 规范化。
- 使用 `openclaw/plugin-sdk/thread-bindings-runtime` 处理话题串绑定生命周期和适配器注册
- 仅当仍需要旧版智能体/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- 使用 `openclaw/plugin-sdk/telegram-command-config`（已弃用：没有内置插件在生产环境中使用它）处理 Telegram 自定义命令规范化、重复/冲突验证和具有稳定回退行为的命令配置契约；新插件代码应优先在插件本地处理命令配置

仅身份验证渠道通常可以止步于默认路径：核心处理审批，插件只需公开出站/身份验证能力。Matrix、Slack、Telegram 和自定义聊天传输等原生审批渠道应使用共享原生辅助函数，而不是自行实现审批生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 由插件负责收集证据
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。仅当需要更宽泛的入站辅助函数桶形导出时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放入插件本地逻辑的内容：

- 检测是否回复 Bot
- 检测引用内容中是否包含 Bot
- 话题串参与情况检查
- 排除服务/系统消息
- 用于证明 Bot 参与情况的平台原生缓存

适合使用共享辅助函数的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

首选流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的入站门控中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和
   `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` 返回一个布尔值。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 来自渠道自身的
原生提及元数据（消息实体、回复 Bot 标志及类似信息）；
当你的平台无法检测这些信息时，请提供 `false`/`undefined` 值。

对于已依赖运行时注入的内置渠道插件，
`api.runtime.channel.mentions` 提供相同的共享提及辅助函数：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载
无关的入站运行时辅助函数。

## 分步说明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`openclaw.plugin.json` 中的 `channels` 字段
    （而不是 `kind` 字段）用于将清单标记为拥有某个渠道。
    有关完整的包元数据表面，请参阅
    [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "将 OpenClaw 连接到 Acme Chat。"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat 渠道插件",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot 令牌",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 验证 `plugins.entries.acme-chat.config`。将它用于
    不属于渠道账户配置、由插件所有的设置。
    `channelConfigs.acme-chat.schema` 验证 `channels.acme-chat`，并且是在
    插件运行时加载之前供配置架构、设置和 UI 表面使用的冷路径来源。
    有关完整的顶层字段参考，请参阅
    [插件清单](/zh-CN/plugins/manifest)。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口包含许多可选的适配器表面。先从最小集合
    `id`、`config` 和 `setup` 开始，再按需添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // 你的平台 API 客户端

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat：必须提供令牌");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // 账户解析/检查属于 `config`，而不是 `setup`。
        // `setup` 负责新手引导写入（applyAccountConfig、validateInput）。
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // 私信安全：谁可以向 Bot 发送消息
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 配对：新私信联系人的审批流程
      pairing: {
        text: {
          idLabel: "Acme Chat 用户名",
          message: "发送此代码以验证你的身份：",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `配对码：${code}`);
          },
        },
      },

      // 线程：回复的递送方式
      threading: { topLevelReplyToMode: "reply" },

      // 出站：向平台发送消息
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会确保账户本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一解析器与 Doctor 修复配对，使运行时和迁移读取相同的契约。

    <Accordion title="createChatChannelPlugin 为你完成的工作">
      你无需手动实现底层适配器接口，只需传入声明式选项，
      构建器便会组合它们：

      | 选项 | 接入的功能 |
      | --- | --- |
      | `security.dm` | 基于配置字段的限定范围私信安全解析器 |
      | `pairing.text` | 通过代码交换实现的文本私信配对流程 |
      | `threading` | 回复模式解析器（固定、限定到账户或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数；需要同级 `channel` ID，以便核心为返回的递送结果加上标记 |

      如果你需要完全控制，也可以传入原始适配器对象，
      而不使用声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带递送时的格式决策，
      例如 `maxLinesPerMessage`；请在发送前应用它，以便共享出站递送
      只解析一次回复线程和分块边界。
      当原生回复目标已解析时，发送上下文还会包含 `replyToIdSource`
      （`implicit` 或 `explicit`），这样负载辅助函数便可保留
      显式回复标签，而不会消耗隐式的一次性回复槽位。
    </Accordion>

  </Step>

  <Step title="连接入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat 渠道插件",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat 管理");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat 管理",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    将渠道所有的 CLI 描述符放入 `registerCliMetadata(...)`，这样 OpenClaw
    无需激活完整的渠道运行时，就能在根帮助中显示它们；
    正常的完整加载仍会获取相同的描述符，用于实际命令注册。
    将 `registerFull(...)` 保留给仅运行时工作。
    `defineChannelPluginEntry` 会自动处理注册模式的拆分。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专用前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，并且始终
    解析为 `operator.admin`。有关所有选项，请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载此入口，而不是完整入口。
    这可避免在设置流程中引入繁重的运行时代码。
    有关详情，请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到附属模块中的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要接收来自平台的消息并将其转发给 OpenClaw。
    典型模式是使用 webhook 验证请求，然后通过你的渠道入站处理程序
    分派该请求：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 插件管理的身份验证（需自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的入站处理程序会将消息分派到 OpenClaw。
          // 具体连接方式取决于你的平台 SDK —
          // 可参阅内置 Microsoft Teams 或 Google Chat 插件包中的实际示例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理因渠道而异。每个渠道插件都拥有
      自己的入站处理流水线。请参考内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的实际模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写共置测试：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat 插件", () => {
      it("从配置解析账户", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("检查账户时不实体化密钥", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("报告缺失的配置", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    有关共享测试辅助工具，请参阅[测试](/zh-CN/plugins/sdk-testing)。

</Step>
</Steps>

## 文件结构

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 包含配置架构的清单
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 创建的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如需要）
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账户范围或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体和子智能体
  </Card>
  <Card title="频道入口 API" icon="bolt" href="/zh-CN/plugins/sdk-channel-inbound">
    共享入站事件生命周期：摄取、解析、记录、分派、完成
  </Card>
</CardGroup>

<Note>
对于内置插件维护和兼容性，仍保留了一些内置辅助接口。
对于新的渠道插件，不推荐使用这些模式；
除非你正在直接维护该内置插件系列，否则应优先使用公共 SDK
接口中的通用渠道、设置、回复和运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) - 测试实用工具和契约测试
- [Plugin Manifest](/zh-CN/plugins/manifest) - 完整的清单架构

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [Building Plugins](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
