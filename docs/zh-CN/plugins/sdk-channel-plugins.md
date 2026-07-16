---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 `ChannelPlugin` 适配器接口面。
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-07-16T11:48:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南将构建一个把 OpenClaw 连接到消息平台的渠道插件：私信安全、配对、回复线程和出站消息。

<Info>
  初次接触 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，了解软件包结构和清单设置。
</Info>

## 插件负责的内容

渠道插件不实现发送/编辑/回应工具；核心提供一个共享的
`message` 工具。插件负责：

- **配置** - 账户解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信审批流程
- **会话语法** - 提供商特定的会话 ID 如何映射到基础
  聊天、线程 ID 和父级回退项
- **出站** - 向平台发送文本、媒体和投票
- **线程处理** - 回复如何形成线程
- **Heartbeat 输入状态** - 面向 Heartbeat 投递目标的可选输入中/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键结构、通用
`:thread:` 记录管理和分发。

## 消息适配器

通过 `openclaw/plugin-sdk/channel-outbound` 中的 `defineChannelMessageAdapter`
公开一个 `message` 适配器。只声明原生传输实际支持的持久化最终发送
能力，并通过契约测试证明原生副作用和返回的回执。文本/媒体
发送应指向旧版 `outbound` 适配器使用的相同传输函数。有关
完整 API 契约、能力矩阵、回执规则、实时预览
终结、接收确认策略、测试和迁移表，请参阅
[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

如果现有 `outbound` 适配器已具备正确的发送方法和
能力元数据，请使用 `createChannelMessageAdapterFromOutbound(...)`
派生 `message` 适配器，而不是手写另一个
桥接层。适配器发送返回 `MessageReceipt` 值。对于旧版 ID，请使用
`listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 派生，而不是保留并行的 `messageIds`
字段。

准确声明实时和终结器能力——核心通过这些能力判断
渠道可以执行哪些操作，而声明行为与实际行为之间的偏差会导致
契约测试失败：

| 接口                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、`retainOnAmbiguousFailure`    |

就地终结草稿预览的渠道应通过
`defineFinalizableLivePreviewAdapter(...)` 加
`deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑，并持续使用
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和
`verifyChannelMessageLiveFinalizerProofs(...)` 测试为声明的能力提供保障，确保原生预览、
进度、编辑、回退/保留、清理和回执行为不会
悄然发生偏差。

延迟发送平台确认的入站接收器应声明
`message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是将
确认时机隐藏在监控器本地状态中。使用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每项声明的策略。

`dispatchInboundReplyWithBase` 和
`recordInboundSessionAndDispatchReply` 等旧版回复辅助函数仍可用于兼容性
分发器。请勿在新的渠道代码中使用它们；应从 `message`
适配器、回执以及
`openclaw/plugin-sdk/channel-outbound` 上的接收/发送生命周期辅助函数开始。

### 入站入口（实验性）

正在迁移入站授权的渠道可从运行时接收
路径使用实验性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路径。它接收平台事实、原始允许列表、路由描述符、命令
事实和访问组配置，然后返回发送者/路由/命令/激活
投影以及有序入口图，同时平台查找和副作用仍由插件负责。请将插件身份规范化逻辑保留在
传递给解析器的描述符中；不要序列化已解析状态或决策中的原始匹配值。有关 API 设计、
所有权边界和测试预期，请参阅
[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。

### 输入状态指示器

如果渠道支持在入站回复之外显示输入状态指示器，请在渠道插件上公开
`heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始前，使用已解析的
Heartbeat 投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，请添加
`heartbeat.clearTyping(...)`。

### 媒体源参数

如果渠道添加了携带媒体源的消息工具参数，请通过
`plugin.actions.describeMessageTool(...).mediaSourceParams` 公开这些参数名称。
核心使用这一显式列表执行沙箱路径规范化和出站
媒体访问策略，因此插件无需为
提供商特定的头像、附件或封面图像参数在共享核心中添加特殊处理。

优先使用 `{ "set-profile": ["avatarUrl", "avatarPath"] }` 这类按操作键控的映射，
以免无关操作继承其他操作的媒体参数。对于有意在所有公开操作间共享的参数，
仍可使用扁平数组。

必须为平台侧媒体获取公开临时公共 URL 的渠道，可以结合插件状态存储使用
`openclaw/plugin-sdk/outbound-media` 中的
`createHostedOutboundMediaStore(...)`。平台
路由解析和令牌执行应保留在渠道插件中；共享辅助函数
仅负责媒体加载、到期元数据、分块行和清理。

### 原生载荷塑形

如果渠道需要针对 `message(action="send")` 进行提供商特定的塑形，
优先使用 `actions.prepareSendPayload(...)`。将原生卡片、区块、嵌入内容或
其他持久化数据放在 `payload.channelData.<channel>` 下，并让核心通过
出站/消息适配器发送。仅将用于发送的 `actions.handleAction(...)`
用作无法序列化并重试的载荷的兼容性回退。

### 会话对话语法

如果平台在会话 ID 中存储额外作用域，请使用 `messaging.resolveSessionConversation(...)`
将解析逻辑保留在插件中。这是将 `rawId` 映射到基础会话 ID、可选
线程 ID、显式 `baseConversationId` 以及任何
`parentConversationCandidates` 的规范钩子。返回 `parentConversationCandidates` 时，
请按照从最窄父级到最宽泛父级/基础会话的顺序排列。

`messaging.resolveParentConversationCandidates(...)` 是已弃用的
兼容性回退，适用于仅需在通用/原始 ID 之上提供父级回退的插件。
如果两个钩子都存在，核心会先使用
`resolveSessionConversation(...).parentConversationCandidates`，仅当规范钩子
省略这些回退项时，才回退到 `resolveParentConversationCandidates(...)`。

需要在渠道注册表启动前进行相同解析的内置插件，可以公开一个顶层
`session-key-api.ts` 文件，并提供匹配的
`resolveSessionConversation(...)` 导出（请参阅 Feishu 和 Telegram
插件）。仅当运行时插件注册表尚不可用时，核心才会使用这一可安全用于引导的接口。

当插件代码需要规范化类似路由的字段、比较子线程与其父路由，或根据
`{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用
`openclaw/plugin-sdk/channel-route`。该辅助函数规范化数字线程 ID 的方式与核心相同，
因此应优先使用它，而不是临时进行
`String(threadId)` 比较。具有提供商特定目标语法的插件
应公开 `messaging.resolveOutboundSessionRoute(...)`，以便核心无需解析器适配层即可获得
提供商原生的会话和线程身份。

### 账户级会话绑定支持

当渠道支持通用当前会话绑定时，请设置
`conversationBindings.supportsCurrentConversationBinding`。`createChatChannelPlugin(...)`
默认将此静态能力设置为 `true`。

如果支持情况因已配置账户而异，还应实现
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`。
核心仅在启用静态能力后才会执行此同步钩子。返回 `false` 会使该账户无法使用
通用当前会话的能力查询、绑定、查找、列出、更新访问时间和解绑操作。
省略此钩子会将静态能力应用于所有账户。

请根据已加载的账户配置或运行时状态解析结果。此
钩子仅控制通用当前会话绑定；它不替代
已配置的绑定规则或插件自有的会话路由。契约测试
应通过 `openclaw/plugin-sdk/channel-core` 导出的
`ChannelPlugin["conversationBindings"]` 契约，至少覆盖一个受支持账户和一个不受支持账户。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。核心负责同一聊天中的
`/approve`、共享审批按钮载荷和通用回退投递。
`ChannelPlugin.approvals` 已被移除；请改为将审批投递/原生/渲染/身份验证
事实放在一个 `approvalCapability` 对象上。`plugin.auth` 仅用于登录/注销——核心不再从该对象读取审批身份验证钩子。

仅将 `approvalCapability.delivery` 用于原生审批路由或禁止回退，
并且仅当渠道确实需要自定义审批载荷而不是共享渲染器时，才使用
`approvalCapability.render`。

### 审批身份验证

- `approvalCapability.authorizeActorAction` 和
  `approvalCapability.getActionAvailabilityState` 是规范的
  审批身份验证接口。
- 使用 `getActionAvailabilityState` 判断同一聊天中的审批身份验证是否可用。
  即使原生投递被禁用，也应让已配置的审批者可用于 `/approve`；
  投递/设置指导应改用发起操作的原生界面状态。
- 如果渠道公开原生 Exec 审批，请在
  发起界面/原生客户端状态与同一聊天中的
  审批身份验证不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用此 Exec 专用钩子区分 `enabled` 与
  `disabled`，判断发起渠道是否支持原生 Exec
  审批，并将该渠道纳入原生客户端回退指导。
  `createApproverRestrictedNativeApprovalCapability(...)` 可处理
  常见情况。
- 如果渠道可以从现有配置中推断出稳定的类似所有者的私信身份，
  请使用 `openclaw/plugin-sdk/approval-runtime` 中的
  `createResolvedApproverActionAuthAdapter` 限制同一聊天中的 `/approve`，
  而无需添加审批专用的核心逻辑。
- 如果自定义审批身份验证有意只允许同一聊天回退，请从
  `openclaw/plugin-sdk/approval-auth-runtime` 返回
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否则核心会将该
  结果视为显式审批者授权。
- 如果渠道自有的原生回调会直接解析审批，请在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，确保隐式
  回退仍经过渠道的常规参与者授权。

### 载荷生命周期和设置指导

- 对于隐藏重复的本地审批提示或在投递前发送输入状态
  指示器等渠道特定的载荷生命周期行为，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload`。
- 当渠道希望在禁用路径的回复中说明启用
  原生 Exec 审批所需的确切配置项时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；
  具名账户渠道应呈现账户级路径，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层
  默认值。
- 当插件审批的无路由和超时
  失败可以安全显示插件审批失败指导时，请使用 `approvalCapability.describePluginApprovalSetup`。
  `createApproverRestrictedNativeApprovalCapability(...)` 不会根据
  `describeExecApprovalSetup` 推断这一点；仅当插件审批和 Exec 审批确实使用相同的原生设置时，
  才显式传递同一个辅助函数。

### 原生审批投递

如果渠道需要原生审批投递，请让渠道代码专注于
目标规范化以及传输/呈现事实。使用
`openclaw/plugin-sdk/approval-runtime` 中的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 和
`createApproverRestrictedNativeApprovalCapability`。将渠道特定事实置于
`approvalCapability.nativeRuntime` 后，最好通过
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，以便核心能够组装
处理程序，并负责请求筛选、路由、去重、到期、Gateway 网关
订阅以及已路由至其他位置的通知。

`nativeRuntime` 被拆分为几个更小的接口：

- `availability` - 账户是否已配置，以及是否应处理请求
- `presentation` - 将共享审批视图模型映射为
  待处理/已解决/已过期的原生载荷或最终操作
- `transport` - 准备目标，以及发送/更新/删除原生审批
  消息
- `interactions` - 用于原生按钮或表情回应的可选绑定/解绑/清除操作钩子，
  以及可选的 `cancelDelivered` 钩子。如果 `deliverPending`
  注册了进程内或持久状态（例如表情回应目标存储），请实现
  `cancelDelivered`，以便在 `bindPending` 运行前因处理程序停止而
  取消投递时，或 `bindPending` 未返回句柄时，释放该状态
- `observe` - 可选的投递诊断钩子

其他审批辅助函数：

- 当渠道同时支持基于会话来源的原生投递和显式审批转发目标时，
  使用 `openclaw/plugin-sdk/approval-native-runtime` 中的 `createNativeApprovalChannelRouteGates`。该辅助函数集中处理
  审批配置选择、`mode` 处理、智能体/会话过滤、账户绑定、
  会话目标匹配和目标列表匹配；调用方仍负责渠道 ID、默认转发模式、
  账户查找、传输启用检查、目标规范化和轮次来源目标解析。不要用它创建
  核心拥有的渠道策略默认值；请显式传入该渠道有文档说明的默认模式。
- 对于 `{ to, accountId, threadId }` 目标，`createChannelNativeOriginTargetResolver`
  默认使用共享渠道路由匹配器。仅当渠道具有提供商特定的等价规则时，
  才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。当渠道需要在
  默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，
  同时保留原始投递目标时，传入 `normalizeTargetForMatch`。仅当解析后的投递目标
  本身也应规范化时，才使用 `normalizeTarget`。
- 如果渠道需要由运行时拥有的对象，例如客户端、令牌、Bolt
  应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。
  通用运行时上下文注册表让核心能够从渠道启动状态引导由能力驱动的处理程序，
  无需添加审批专用的包装衔接代码。
- 仅当能力驱动的接缝尚不足以表达需求时，才使用更底层的
  `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助函数路由 `accountId`
  和 `approvalKind`。`accountId` 将多账户审批策略限定在正确的
  Bot 账户范围内，`approvalKind` 则让渠道可以使用 Exec 与插件审批行为，
  而无需在核心中设置硬编码分支。
- 核心也负责审批重路由通知。渠道插件不应从
  `createChannelNativeApprovalRuntime` 发送自己的“审批已转至私信/其他渠道”后续消息；
  应通过共享审批能力辅助函数公开准确的来源 + 审批者私信路由，并让核心在向
  发起聊天发回任何通知前汇总实际投递情况。
- 端到端保留已投递审批 ID 的种类。原生客户端不应根据渠道本地
  状态猜测或重写 Exec 与插件审批路由。
- 将该显式 `approvalKind` 传给 `resolveApprovalOverGateway`。
  这会使用规范的 `approval.resolve` 服务，并在其他界面率先响应时返回已记录的
  胜出结果。较旧的显式 `resolveMethod` 输入仍用于命令支持的控件；新的原生
  操作不得使用它，也不得从 ID 推断种类。
- 不同的审批种类可以有意公开不同的原生界面。当前内置示例：
  Matrix 对 Exec 和插件审批保持相同的原生私信/渠道路由和表情回应体验，同时仍允许
  身份验证因审批种类而异；Slack 对 Exec 和插件 ID 均保持原生审批路由可用。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，
  但新代码应优先使用能力构建器，并在插件上公开 `approvalCapability`。

### 更精细的审批运行时子路径

对于高频渠道入口点，如果只需要该功能族的一部分，请优先使用以下更精细的子路径，
而不是更宽泛的 `approval-runtime` 聚合导出：

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
`openclaw/plugin-sdk/reply-chunking`，而不是更宽泛的聚合界面。

### 设置子路径

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助函数：
  `createSetupTranslator`、可安全导入的设置补丁适配器
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 和委托式
  设置代理构建器。
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装设置构建器，
  以及若干设置安全的基础组件：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 仅当还需要更重型的共享设置/配置辅助函数（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接缝。

如果渠道只想在设置界面中提示“请先安装此插件”，请优先使用
`createOptionalChannelSetupSurface(...)`。生成的适配器/向导在配置写入和最终确定时会采用
失败关闭策略，并在验证、最终确定和文档链接文案中复用相同的“需要安装”消息。

如果渠道支持由环境变量驱动的设置或身份验证，并且通用启动/配置流程需要在运行时
加载前获知这些环境变量名称，请在插件清单中使用 `channelEnvVars` 声明它们。
渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。

如果渠道可以在插件运行时启动前出现在 `status`、
`channels list`、`channels status` 或 SecretRef 扫描中，请在
`package.json` 中添加 `openclaw.setupEntry`。该入口点应可安全地导入
只读命令路径，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、
状态适配器和渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

主渠道入口的导入路径也应保持精简。设备发现可以评估入口和渠道插件模块以注册能力，
而不激活渠道。`channel-plugin-api.ts` 等文件应导出渠道插件对象，且不得导入设置向导、
传输客户端、套接字监听器、子进程启动器或服务启动模块。请将这些运行时组件放在由
`registerFull(...)`、运行时设置器或惰性能力适配器加载的模块中。

### 其他精细渠道子路径

对于其他高频渠道路径，请优先使用精细辅助函数，而不是更宽泛的旧版界面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账户配置和
  默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用于入站路由/信封以及
  记录并分发的接线
- `openclaw/plugin-sdk/channel-targets`，用于目标解析辅助函数
- `openclaw/plugin-sdk/outbound-media`，用于媒体加载；
  `openclaw/plugin-sdk/channel-outbound`，用于出站身份/发送委托
  和载荷规划
- 当出站路由应保留显式
  `replyToId`/`threadId`，或在基础会话键仍匹配时恢复当前
  `:thread:` 会话，请使用 `openclaw/plugin-sdk/channel-core` 中的
  `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台具有原生线程投递语义时，可以覆盖
  优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- 仅当仍需要旧版智能体/媒体载荷字段布局时，才使用
  `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`（已弃用：没有内置插件在生产中使用它），
  用于 Telegram 自定义命令规范化、重复/冲突验证，以及具有稳定回退行为的命令配置
  契约；新插件代码应优先使用插件本地的命令配置处理

仅身份验证渠道通常可以止步于默认路径：核心处理审批，插件只公开出站/身份验证能力。
Matrix、Slack、Telegram 等原生审批渠道和自定义聊天传输应使用共享原生辅助函数，
而不是自行实现审批生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。
仅当需要更宽泛的入站辅助函数聚合导出时，才使用
`openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- 检测是否回复 Bot
- 检测是否引用 Bot
- 线程参与检查
- 排除服务/系统消息
- 用于证明 Bot 参与情况的平台原生缓存

适合共享辅助函数的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在入站门控中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention`
   和 `decision.shouldSkip`。

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

`matchesMentionWithExplicit(...)` 返回布尔值。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 来自渠道自身的原生提及元数据
（消息实体、回复 Bot 标志及类似信息）；如果平台无法检测这些信息，请提供
`false`/`undefined` 值。

`api.runtime.channel.mentions` 为已依赖运行时注入的内置渠道插件公开相同的共享提及辅助函数：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载
无关的入站运行时辅助函数。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`openclaw.plugin.json` 中的 `channels` 字段（而不是 `kind` 字段）用于将清单标记为归属某个渠道。有关完整的包元数据界面，请参阅
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

    `configSchema` 用于验证 `plugins.entries.acme-chat.config`。将其用于不属于渠道账号配置、由插件归属的设置。
    `channelConfigs.acme-chat.schema` 用于验证 `channels.acme-chat`，并且是插件运行时加载前，配置架构、设置和 UI 界面使用的冷路径来源。有关完整的顶层字段参考，请参阅[插件清单](/zh-CN/plugins/manifest)。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口包含许多可选的适配器界面。先从最少的 `id`、`config` 和 `setup` 开始，再根据需要添加适配器。

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
      if (!token) throw new Error("acme-chat: token is required");
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
        // 账号解析/检查属于 `config`，而不是 `setup`。
        // `setup` 涵盖新手引导写入（applyAccountConfig、validateInput）。
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

      // 私信安全性：谁可以向 Bot 发送消息
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
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // 线程：回复的传递方式
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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账号本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一解析器与 Doctor 修复配对，使运行时和迁移读取相同的契约。

    <Accordion title="createChatChannelPlugin 为你完成的工作">
      无需手动实现底层适配器接口，只需传入声明式选项，构建器便会组合它们：

      | 选项 | 连接的功能 |
      | --- | --- |
      | `security.dm` | 根据配置字段确定作用域的私信安全解析器 |
      | `pairing.text` | 通过代码交换进行基于文本的私信配对流程 |
      | `threading` | 回复模式解析器（固定、账号范围或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数；需要同级 `channel` ID，以便核心能为返回的传递结果加盖标记 |

      如果需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带传递时的格式化决策，例如 `maxLinesPerMessage`；请在发送前应用它，以便共享出站传递只解析一次回复线程和分块边界。
      当原生回复目标已解析时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），以便载荷辅助函数可以保留显式回复标签，而不消耗隐式的一次性回复槽位。
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

    将渠道归属的 CLI 描述符放在 `registerCliMetadata(...)` 中，以便 OpenClaw 无需激活完整渠道运行时即可在根帮助中显示它们，同时常规完整加载仍会获取相同的描述符，用于实际的命令注册。将 `registerFull(...)` 保留给仅运行时工作。
    `defineChannelPluginEntry` 会自动处理注册模式的拆分。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用插件专属前缀。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，并始终解析为 `operator.admin`。有关所有选项，请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，以便在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载此入口而不是完整入口。这样可避免在设置流程中引入繁重的运行时代码。有关详情，请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到辅助模块中的内置工作区渠道，如果还需要显式的设置时运行时 setter，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    插件需要从平台接收消息并将其转发给 OpenClaw。典型模式是使用 Webhook 验证请求，并通过渠道的入站处理程序进行分派：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 插件管理的身份验证（自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的入站处理程序会将消息分派给 OpenClaw。
          // 具体连接方式取决于你的平台 SDK —
          // 请参阅内置 Microsoft Teams 或 Google Chat 插件包中的实际示例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理因渠道而异。每个渠道插件归属自己的入站管道。请参阅内置渠道插件（例如 Microsoft Teams 或 Google Chat 插件包）以了解实际模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写同目录测试：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
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
  <Card title="渠道入站 API" icon="bolt" href="/zh-CN/plugins/sdk-channel-inbound">
    共享入站事件生命周期：接收、解析、记录、分派、完成
  </Card>
</CardGroup>

<Note>
仍有一些内置辅助接口用于维护内置插件及实现兼容性。
不建议新渠道插件采用这些模式；除非你正在直接维护该内置插件系列，
否则应优先使用公共 SDK 接口中的通用渠道、设置、回复和运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) - 测试实用工具和契约测试
- [Plugin Manifest](/zh-CN/plugins/manifest) - 完整的清单架构

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
