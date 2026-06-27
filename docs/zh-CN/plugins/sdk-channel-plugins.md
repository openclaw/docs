---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要了解 ChannelPlugin 适配器表面
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-06-27T02:54:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南将带你构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可工作的渠道，支持私信安全、配对、回复串联和出站消息。

<Info>
  如果你以前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本包结构和清单设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自己的发送、编辑或响应工具。OpenClaw 在核心中保留一个共享的 `message` 工具。你的插件负责：

- **配置** - 账号解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信审批流程
- **会话语法** - 提供商特定的会话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **出站** - 向平台发送文本、媒体和投票
- **串联** - 回复如何串联
- **Heartbeat 输入状态** - 可选的输入中或忙碌信号，用于 Heartbeat 投递目标

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 记账和分发。

新的渠道插件还应通过 `openclaw/plugin-sdk/channel-outbound` 中的 `defineChannelMessageAdapter` 暴露一个 `message` 适配器。该适配器声明原生传输实际支持哪些持久最终发送能力，并将文本和媒体发送指向与旧版 `outbound` 适配器相同的传输函数。只有当契约测试证明原生副作用和返回的回执时，才声明某项能力。
完整的 API 契约、示例、能力矩阵、回执规则、实时预览最终化、接收确认策略、测试和迁移表，请参阅
[频道出站 API](/zh-CN/plugins/sdk-channel-outbound)。
如果现有 `outbound` 适配器已经具备正确的发送方法和能力元数据，请使用 `createChannelMessageAdapterFromOutbound(...)` 派生 `message` 适配器，而不是手写另一个桥接层。
适配器发送应返回 `MessageReceipt` 值。当兼容性代码仍需要旧版 ID 时，请用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生它们，而不是在新的生命周期代码中保留并行的 `messageIds` 字段。
支持预览的渠道还应声明 `message.live.capabilities`，并列出它们拥有的确切实时生命周期，例如 `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming` 或 `quietFinalization`。在原位最终化草稿预览的渠道还应声明 `message.live.finalizer.capabilities`，例如 `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt` 和 `retainOnAmbiguousFailure`，并通过 `defineFinalizableLivePreviewAdapter(...)` 加 `deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑。请用 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 测试支撑这些能力，避免原生预览、进度、编辑、回退/保留、清理和回执行为静默漂移。
延迟平台确认的入站接收器应声明 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把确认时机隐藏在监控器本地状态中。用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每个声明的策略。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply` 等旧版回复辅助函数仍可供兼容性分发器使用。不要在新的渠道代码中使用这些名称；新插件应从 `openclaw/plugin-sdk/channel-outbound` 上的 `message` 适配器、回执以及接收/发送生命周期辅助函数开始。

迁移入站授权的渠道可以从运行时接收路径使用实验性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路径。该子路径将平台查找和副作用保留在插件内，同时共享允许列表状态解析、路由/发送者/命令/事件/激活决策、已脱敏诊断，以及轮次准入映射。请在传给解析器的描述符中保留插件身份规范化；不要序列化已解析状态或决策中的原始匹配值。API 设计、所有权边界和测试预期请参阅
[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。

如果你的渠道支持入站回复之外的输入状态指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始之前，用已解析的 Heartbeat 投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了携带媒体来源的消息工具参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心会用这份显式列表执行沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图片参数添加共享核心特殊逻辑。
优先返回按动作键控的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样不相关的动作不会继承其他动作的媒体参数。对于有意在每个暴露动作之间共享的参数，扁平数组仍然可用。
必须为平台侧媒体拉取暴露临时公开 URL 的渠道，可以结合插件状态存储使用 `openclaw/plugin-sdk/outbound-media` 中的 `createHostedOutboundMediaStore(...)`。请将平台路由解析和令牌强制校验保留在渠道插件中；共享辅助函数只负责媒体加载、过期元数据、分块行和清理。

如果你的渠道需要为 `message(action="send")` 做提供商特定的整形，请优先使用 `actions.prepareSendPayload(...)`。将原生卡片、块、嵌入或其他持久数据放在 `payload.channelData.<channel>` 下，并让核心通过出站/消息适配器执行实际发送。仅在载荷无法序列化并重试时，才把 `actions.handleAction(...)` 用作发送的兼容性回退。

如果你的平台在会话 ID 中存储额外作用域，请在插件中用 `messaging.resolveSessionConversation(...)` 保留该解析。这是将 `rawId` 映射到基础会话 ID、可选线程 ID、显式 `baseConversationId` 和任何 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

当插件代码需要规范化类似路由的字段、比较子线程及其父路由，或基于 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助函数会以与核心相同的方式规范化数字线程 ID，因此插件应优先使用它，而不是临时用 `String(threadId)` 比较。
具有提供商特定目标语法的插件应暴露 `messaging.resolveOutboundSessionRoute(...)`，这样核心无需使用解析器兼容层即可获得提供商原生的会话和线程身份。

需要在渠道注册表启动前执行相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，其中包含匹配的 `resolveSessionConversation(...)` 导出。核心仅在运行时插件注册表尚不可用时使用这个启动安全的表面。

当插件只需要在通用/原始 ID 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容性回退使用。如果两个钩子都存在，核心会先使用 `resolveSessionConversation(...).parentConversationCandidates`，并且只有在规范钩子省略它们时才回退到 `resolveParentConversationCandidates(...)`。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。

- 核心拥有同一聊天中的 `/approve`、共享审批按钮载荷，以及通用回退投递。
- 当渠道需要审批专用行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。将审批投递、原生、渲染、鉴权信息放在 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取审批鉴权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批鉴权边界。
- 使用 `approvalCapability.getActionAvailabilityState` 表示同一聊天审批鉴权可用性。
- 如果你的渠道暴露原生 exec 审批，在发起界面/原生客户端状态与同一聊天审批鉴权不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用该 exec 专用钩子区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生 exec 审批，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见情况填充这一点。
- 对于渠道专用的载荷生命周期行为，例如隐藏重复的本地审批提示或在投递前发送正在输入指示，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制。
- 将 `approvalCapability.nativeRuntime` 用于渠道拥有的原生审批事实。在热渠道入口点上通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持惰性；它可以按需导入你的运行时模块，同时仍让核心组装审批生命周期。
- 仅当渠道确实需要自定义审批载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复解释启用原生 exec 审批所需的确切配置开关时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账户渠道应渲染账户作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类所有者私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天 `/approve`，而无需添加审批专用核心逻辑。
- 如果自定义审批鉴权有意只允许同一聊天回退，请从 `openclaw/plugin-sdk/approval-auth-runtime` 返回 `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否则核心会将结果视为显式审批者授权。
- 如果渠道拥有的原生回调直接解析审批，请在解析前使用 `isImplicitSameChatApprovalAuthorization(...)`，这样隐式回退仍会通过渠道的正常参与者授权。
- 如果渠道需要原生审批投递，请让渠道代码专注于目标规范化以及传输/呈现事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道专用事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，这样核心可以组装处理器，并拥有请求过滤、路由、去重、过期、Gateway 网关订阅，以及已路由到其他位置的通知。`nativeRuntime` 被拆分为几个更小的边界：
- 当渠道同时支持会话来源的原生投递和显式审批转发目标时，使用 `openclaw/plugin-sdk/approval-native-runtime` 中的 `createNativeApprovalChannelRouteGates`。该帮助器集中处理审批配置选择、`mode` 处理、智能体/会话过滤器、账户绑定、会话目标匹配和目标列表匹配，同时调用方仍拥有渠道 ID、默认转发模式、账户查找、传输启用检查、目标规范化和轮次来源目标解析。不要用它创建核心拥有的渠道策略默认值；请显式传入该渠道文档化的默认模式。
- `createChannelNativeOriginTargetResolver` 默认对 `{ to, accountId, threadId }` 目标使用共享渠道路由匹配器。仅当渠道具有提供商专用的等价规则时才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时保留原始目标用于投递时，将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当解析出的投递目标本身应被规范化时，才使用 `normalizeTarget`。
- `availability` - 账户是否已配置，以及请求是否应被处理
- `presentation` - 将共享审批视图模型映射为待处理/已解析/已过期的原生载荷或最终操作
- `transport` - 准备目标，并发送/更新/删除原生审批消息
- `interactions` - 原生按钮或回应的可选绑定/解绑/清除操作钩子，以及可选的 `cancelDelivered` 钩子。当 `deliverPending` 注册进程内或持久状态（例如回应目标存储）时实现 `cancelDelivered`，这样如果处理器停止在 `bindPending` 运行前取消投递，或 `bindPending` 未返回句柄，该状态就能被释放
- `observe` - 可选的投递诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心可以从渠道启动状态引导能力驱动的处理器，而无需添加审批专用包装胶水代码。
- 只有当能力驱动边界还不够表达需求时，才使用较低层级的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些帮助器路由 `accountId` 和 `approvalKind`。`accountId` 让多账户审批策略限定在正确的 Bot 账户范围内，`approvalKind` 让 exec 与插件审批行为可供渠道使用，而无需在核心中硬编码分支。
- 核心现在也拥有审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已发送到私信/另一个渠道”跟进消息；相反，应通过共享审批能力帮助器暴露准确的来源 + 审批者私信路由，并让核心在向发起聊天发布任何通知前聚合实际投递。
- 端到端保留已投递审批 ID 的种类。原生客户端不应
  根据渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批种类可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 ID 都保持原生审批路由可用。
  - Matrix 对 exec 和插件审批保持相同的原生私信/渠道路由和回应 UX，同时仍允许鉴权因审批种类而异。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于热渠道入口点，当你只需要该系列中的一部分时，优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你不需要更宽泛的伞形界面时，优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

具体到设置：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置帮助器：
  `createSetupTranslator`、导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-runtime` 包含用于
  `createEnvPatchedAccountSetupAdapter` 的环境感知适配器边界
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器，以及一些设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`，

如果你的渠道支持由环境驱动的设置或鉴权，并且通用启动/配置
流程应在运行时加载前知道这些环境名称，请在
插件清单中用 `channelEnvVars` 声明它们。仅将渠道运行时 `envVars` 或本地
常量用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或
SecretRef 扫描中，请在
`package.json` 中添加 `openclaw.setupEntry`。该入口点应可安全导入到只读命令
路径中，并应返回这些摘要所需的渠道元数据、设置安全配置适配器、状态
适配器和渠道密钥目标元数据。不要
从设置入口启动客户端、监听器或传输运行时。

也要保持主渠道入口导入路径狭窄。设备发现可以评估该
入口和渠道插件模块来注册能力，而不激活
渠道。`channel-plugin-api.ts` 等文件应导出渠道
插件对象，而不导入设置向导、传输客户端、套接字
监听器、子进程启动器或服务启动模块。将这些运行时
部分放入从 `registerFull(...)`、运行时 setter 或惰性
能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置帮助器时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 边界，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的
适配器/向导会对配置写入和最终化采取失败关闭策略，并在验证、最终化和文档链接
文案中复用同一条需要安装的消息。

对于其他热渠道路径，优先使用窄帮助器，而不是更宽泛的旧界面：

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 用于多账户配置和
  默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound` 用于入站路由/信封以及
  记录并分发接线
- `openclaw/plugin-sdk/channel-targets` 用于目标解析辅助函数
- `openclaw/plugin-sdk/outbound-media` 用于媒体加载，并使用
  `openclaw/plugin-sdk/channel-outbound` 处理出站身份/发送委托
  和负载规划
- 当出站路由需要保留显式 `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时，使用来自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台具有原生线程投递语义时，可以覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期
  和适配器注册
- 仅当仍然需要旧版 Agent/媒体负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及回退稳定的命令
  配置契约

仅凭证渠道通常可以停在默认路径：核心处理审批，插件只需暴露出站/凭证能力。Matrix、Slack、Telegram 以及自定义聊天传输协议等原生审批渠道应使用共享的原生辅助函数，而不是自行实现审批生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 做提及策略决策。
仅当需要更广泛的入站辅助函数桶时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- 回复机器人的检测
- 引用机器人的检测
- 线程参与检查
- 服务/系统消息排除
- 证明机器人参与所需的平台原生缓存

适合共享辅助函数的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的入站门控中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露相同的共享提及辅助函数：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助函数。

使用 `resolveInboundMentionDecision({ facts, policy })` 进行提及门控。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    会让它成为一个渠道插件。完整的软件包元数据表面
    请参阅 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 校验 `plugins.entries.acme-chat.config`。将它用于
    不属于渠道账户配置的插件自有设置。`channelConfigs`
    校验 `channels.acme-chat`，并且是在插件运行时加载之前供配置
    schema、设置和 UI 表面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选适配器表面。先从最小项开始，即
    `id` 和 `setup`，再按需添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账户本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一个解析器与 Doctor 修复配对，使运行时和迁移读取相同契约。

    <Accordion title="createChatChannelPlugin 为你做什么">
      你无需手动实现低层适配器接口，而是传入声明式选项，由构建器组合它们：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域私信安全解析器 |
      | `pairing.text` | 基于文本的私信配对流程，带代码交换 |
      | `threading` | 回复模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带投递时的格式化决策，
      例如 `maxLinesPerMessage`；请在发送前应用它，这样回复线程
      和分块边界只由共享出站投递解析一次。
      当原生回复目标已解析时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），因此负载辅助函数可以保留
      显式回复标签，而不消耗隐式的一次性回复槽。
    </Accordion>

  </Step>

  <Step title="接入入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    将渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，以便 OpenClaw
    可以在根帮助中显示它们，而无需激活完整的渠道运行时；
    同时，正常的完整加载仍会获取相同的描述符，用于真实的命令
    注册。将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专用前缀。核心管理员命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关所有
    选项，请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载此入口，而不是完整入口。
    这样可以避免在设置流程中拉入较重的运行时代码。
    详情请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar 模块中的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将它们转发给
    OpenClaw。典型模式是使用 webhook 验证请求，并通过你的渠道入站处理程序
    分发请求：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理是渠道特定的。每个渠道插件都拥有
      自己的入站流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的真实模式。
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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    如需共享测试辅助工具，请参阅[测试](/zh-CN/plugins/sdk-testing)。

</Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用的子智能体
  </Card>
  <Card title="频道入口 API" icon="bolt" href="/zh-CN/plugins/sdk-channel-inbound">
    共享入站事件生命周期：摄取、解析、记录、分发、完成
  </Card>
</CardGroup>

<Note>
一些内置辅助 seam 仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你直接维护该内置插件家族，否则请优先使用通用 SDK
表面中的通用渠道、设置、回复和运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) - 测试实用工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) - 完整清单 schema

## 相关

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
