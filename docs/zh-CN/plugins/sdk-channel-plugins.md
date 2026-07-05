---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 ChannelPlugin 适配器接口面
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-07-05T11:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c0151fad0915cda90987aa2401d1d4a326f7922cf5d838171a4014a84ad713f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南构建一个将 OpenClaw 连接到消息平台的渠道插件：私信安全、配对、回复串接和出站消息。

<Info>
  刚接触 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，了解包结构和清单设置。
</Info>

## 你的插件负责什么

渠道插件不实现发送/编辑/表情回应工具；核心提供一个共享的 `message` 工具。你的插件负责：

- **配置** - 账号解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信审批流程
- **会话语法** - 提供商特定会话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **出站** - 向平台发送文本、媒体和投票
- **线程** - 回复如何串接
- **心跳输入状态** - 面向心跳投递目标的可选输入/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 记账和分发。

## 消息适配器

从 `openclaw/plugin-sdk/channel-outbound` 使用 `defineChannelMessageAdapter` 暴露一个 `message` 适配器。只声明你的原生传输实际支持的、持久的最终发送能力，并用契约测试证明原生端副作用和返回的回执。将文本/媒体发送指向旧版 `outbound` 适配器使用的同一组传输函数。完整的 API 契约、能力矩阵、回执规则、实时预览终结、接收确认策略、测试和迁移表，请参阅[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。

如果你现有的 `outbound` 适配器已经具备正确的发送方法和能力元数据，请改用 `createChannelMessageAdapterFromOutbound(...)` 派生 `message` 适配器，而不是手写另一个桥接层。适配器发送会返回 `MessageReceipt` 值。对于旧版 ID，请用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生它们，而不是保留并行的 `messageIds` 字段。

精确声明实时和终结器能力 - 核心会用这些能力决定渠道能做什么，声明行为与实际行为漂移会导致契约测试失败：

| 接口面                                | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

会就地终结草稿预览的渠道，应通过 `defineFinalizableLivePreviewAdapter(...)` 加 `deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑，并用 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 测试支撑声明的能力，避免原生预览、进度、编辑、回退/保留、清理和回执行为静默漂移。

会延迟平台确认的入站接收器应声明 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把确认时机隐藏在监视器本地状态里。用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每个声明的策略。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply` 等旧版回复辅助工具仍可供兼容性分发器使用。不要在新的渠道代码中使用它们；请改从 `message` 适配器、回执，以及 `openclaw/plugin-sdk/channel-outbound` 上的接收/发送生命周期辅助工具开始。

### 入站入口（实验性）

迁移入站授权的渠道可以从运行时接收路径使用实验性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路径。它接受平台事实、原始允许列表、路由描述符、命令事实和访问组配置，然后返回发送者/路由/命令/激活投影以及有序入口图，同时平台查找和副作用保留在插件中。将插件身份规范化保留在你传给解析器的描述符中；不要从已解析状态或决策中序列化原始匹配值。API 设计、所有权边界和测试期望，请参阅[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。较旧的 `openclaw/plugin-sdk/channel-ingress` 子路径仍作为面向第三方插件的已弃用兼容性外观导出。

### 输入状态指示器

如果你的渠道支持入站回复之外的输入状态指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，添加 `heartbeat.clearTyping(...)`。

### 媒体源参数

如果你的渠道添加了携带媒体源的消息工具参数，请通过 `plugin.actions.describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心会用这个显式列表进行沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图片参数添加共享核心特例。

优先使用按动作键控的映射，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关动作不会继承另一个动作的媒体参数。对于有意在每个暴露动作间共享的参数，扁平数组仍然可用。

需要为平台侧媒体抓取暴露临时公开 URL 的渠道，可以配合插件状态存储使用 `openclaw/plugin-sdk/outbound-media` 中的 `createHostedOutboundMediaStore(...)`。将平台路由解析和令牌强制保留在渠道插件中；共享辅助工具只负责媒体加载、过期元数据、分块行和清理。

### 原生载荷塑形

如果你的渠道需要为 `message(action="send")` 做提供商特定塑形，请优先使用 `actions.prepareSendPayload(...)`。将原生卡片、块、嵌入或其他持久数据放在 `payload.channelData.<channel>` 下，并让核心通过出站/消息适配器发送。只有在载荷无法序列化和重试时，才把 `actions.handleAction(...)` 用作发送的兼容性回退。

### 会话对话语法

如果你的平台在会话 ID 中存储额外作用域，请使用 `messaging.resolveSessionConversation(...)` 将解析逻辑保留在插件中。这是将 `rawId` 映射到基础会话 ID、可选线程 ID、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范钩子。当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

`messaging.resolveParentConversationCandidates(...)` 是已弃用的兼容性回退，供只需要在通用/原始 ID 之上提供父级回退的插件使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时，才回退到 `resolveParentConversationCandidates(...)`。

在渠道注册表启动前需要相同解析的内置插件，可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`（请参阅 Feishu 和 Telegram 插件）。只有当运行时插件注册表尚不可用时，核心才会使用这个可安全用于引导的接口面。

当插件代码需要规范化类似路由的字段、比较子线程与其父路由，或从 `{ channel, to, accountId, threadId }` 构建稳定去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助工具会以与核心相同的方式规范化数值线程 ID，因此请优先使用它，而不是临时的 `String(threadId)` 比较。具有提供商特定目标语法的插件应暴露 `messaging.resolveOutboundSessionRoute(...)`，让核心无需解析器 shim 即可获得提供商原生的会话和线程身份。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。核心负责同一聊天中的 `/approve`、共享审批按钮载荷和通用回退投递。`ChannelPlugin.approvals` 已移除；请改为把审批投递/原生/渲染/鉴权事实放在一个 `approvalCapability` 对象上。`plugin.auth` 只用于登录/登出 - 核心不再从该对象读取审批鉴权钩子。

仅在需要原生审批路由或抑制回退时使用 `approvalCapability.delivery`；仅当渠道确实需要自定义审批载荷而不是共享渲染器时，才使用 `approvalCapability.render`。

### 审批鉴权

- `approvalCapability.authorizeActorAction` 和
  `approvalCapability.getActionAvailabilityState` 是规范的审批鉴权边界。
- 使用 `getActionAvailabilityState` 表示同一聊天审批鉴权可用性。即使原生投递被禁用，也要让已配置审批者可用于 `/approve`；改用原生发起接口面状态提供投递/设置指引。
- 如果你的渠道暴露原生 exec 审批，请在发起接口面/原生客户端状态不同于同一聊天审批鉴权时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个 exec 专用钩子区分 `enabled` 与 `disabled`，决定发起渠道是否支持原生 exec 审批，并将该渠道纳入原生客户端回退指引。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见情况填充这一点。
- 如果渠道可以从现有配置推断稳定的类所有者私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 限制同一聊天 `/approve`，而无需添加审批专用核心逻辑。
- 如果自定义审批鉴权有意只允许同一聊天回退，请从 `openclaw/plugin-sdk/approval-auth-runtime` 返回 `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否则核心会把结果视为显式审批者授权。
- 如果渠道拥有的原生回调会直接解析审批，请在解析前使用 `isImplicitSameChatApprovalAuthorization(...)`，这样隐式回退仍会通过渠道的正常参与者授权。

### 载荷生命周期和设置指引

- 将 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload` 用于渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示，或在投递前发送输入状态指示器。
- 当渠道希望禁用路径回复说明启用原生 exec 审批所需的确切配置旋钮时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 当插件审批失败指引可以安全地显示给插件审批无路由和超时失败时，使用 `approvalCapability.describePluginApprovalSetup`。`createApproverRestrictedNativeApprovalCapability(...)` 不会从 `describeExecApprovalSetup` 推断这一点；只有当插件审批和 exec 审批确实使用相同原生设置时，才显式传入同一个辅助工具。

### 原生审批投递

如果某个渠道需要原生审批投递，请让渠道代码专注于目标规范化以及传输/呈现事实。使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。把渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，这样核心就能组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅，以及已路由到其他位置的通知。

`nativeRuntime` 被拆分为几个更小的衔接面：

- `availability` - 账户是否已配置，以及请求是否应被处理
- `presentation` - 将共享审批视图模型映射为待处理/已解决/已过期的原生载荷或最终操作
- `transport` - 准备目标并发送/更新/删除原生审批消息
- `interactions` - 用于原生按钮或表情回应的可选绑定/解绑/清除操作钩子，以及可选的 `cancelDelivered` 钩子。当 `deliverPending` 注册进程内或持久状态（例如表情回应目标存储）时，实现 `cancelDelivered`，这样如果处理器停止在 `bindPending` 运行前取消了投递，或 `bindPending` 没有返回句柄，就能释放该状态
- `observe` - 可选的投递诊断钩子

其他审批助手：

- 当某个渠道同时支持会话来源的原生投递和显式审批转发目标时，使用来自 `openclaw/plugin-sdk/approval-native-runtime` 的 `createNativeApprovalChannelRouteGates`。该助手集中处理审批配置选择、`mode` 处理、智能体/会话过滤器、账户绑定、会话目标匹配和目标列表匹配，同时调用方仍然负责渠道 id、默认转发模式、账户查找、传输启用检查、目标规范化和轮次来源目标解析。不要用它创建核心拥有的渠道策略默认值；请显式传入该渠道文档化的默认模式。
- `createChannelNativeOriginTargetResolver` 默认会对 `{ to, accountId, threadId }` 目标使用共享渠道路由匹配器。只有当某个渠道有提供商特定的等价规则（例如 Slack 时间戳前缀匹配）时，才传入 `targetsMatch`。当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 id，同时保留原始目标用于投递时，传入 `normalizeTargetForMatch`。只有当解析出的投递目标本身也应被规范化时，才使用 `normalizeTarget`。
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心能够从渠道启动状态引导由能力驱动的处理器，而无需添加审批专用包装胶水。
- 只有当能力驱动的衔接面表达能力仍然不足时，才使用更低层级的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些助手同时路由 `accountId` 和 `approvalKind`。`accountId` 让多账户审批策略限定在正确的 Bot 账户范围内，而 `approvalKind` 让 exec 与插件审批行为可供渠道使用，避免在核心中写硬编码分支。
- 核心也负责审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已转到私信/其他渠道”后续消息；相反，应通过共享审批能力助手暴露准确的来源 + 审批人私信路由，并让核心在发起聊天中发布任何通知前聚合实际投递结果。
- 端到端保留已投递审批 id 的种类。原生客户端不应从渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批种类可以有意暴露不同的原生表面。当前内置示例：Matrix 为 exec 和插件审批保留相同的原生私信/渠道路由和表情回应 UX，同时仍允许凭证按审批种类有所不同；Slack 为 exec 和插件 id 都保留原生审批路由。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

### 更窄的审批运行时子路径

对于热门渠道入口点，如果你只需要该系列的一部分，请优先使用这些更窄的子路径，而不是更宽的 `approval-runtime` 汇总出口：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你并不全部需要时，请优先使用 `openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`，而不是更宽的伞状表面。

### 设置子路径

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置助手：`createSetupTranslator`、导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`）、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式设置代理构建器。
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置构建器，以及少量设置安全原语：`createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和 `splitSetupEntries`。
- 只有当你还需要更重的共享设置/配置助手（例如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽的 `openclaw/plugin-sdk/setup` 衔接面。

如果你的渠道只想在设置表面提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会对配置写入和最终化采取失败关闭策略，并在校验、最终化和文档链接文案中复用同一条需要安装的消息。

如果你的渠道支持由环境驱动的设置或凭证，并且通用启动/配置流程应在运行时加载前知道这些环境变量名称，请在插件清单中用 `channelEnvVars` 声明它们。渠道运行时 `envVars` 或本地常量只用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应能在只读命令路径中安全导入，并返回这些摘要所需的渠道元数据、设置安全的配置适配器、状态适配器和渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

主渠道入口导入路径也应保持狭窄。设备发现可以评估入口和渠道插件模块来注册能力，而无需激活渠道。像 `channel-plugin-api.ts` 这样的文件应导出渠道插件对象，而不导入设置向导、传输客户端、socket 监听器、子进程启动器或服务启动模块。把这些运行时部分放在从 `registerFull(...)`、运行时 setter 或懒加载能力适配器加载的模块中。

### 其他更窄的渠道子路径

对于其他热门渠道路径，请优先使用窄助手，而不是更宽的旧版表面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution` 和 `openclaw/plugin-sdk/account-helpers`，用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和 `openclaw/plugin-sdk/channel-inbound`，用于入站路由/信封以及记录并分发接线
- `openclaw/plugin-sdk/channel-targets`，用于目标解析助手
- `openclaw/plugin-sdk/outbound-media`，用于媒体加载；`openclaw/plugin-sdk/channel-outbound`，用于出站身份/发送委托和载荷规划
- 当出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍匹配后恢复当前 `:thread:` 会话时，使用来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台具备原生线程投递语义时，可以覆盖优先级、后缀行为和线程 id 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期和适配器注册
- 只有当仍然需要旧版智能体/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`（已弃用：没有内置插件在生产中使用它），用于 Telegram 自定义命令规范化、重复/冲突校验和回退稳定的命令配置契约；新插件代码应优先使用插件本地的命令配置处理

仅凭证渠道通常可以停在默认路径：核心处理审批，插件只暴露出站/凭证能力。Matrix、Slack、Telegram 和自定义聊天传输等原生审批渠道应使用共享原生助手，而不是自行实现审批生命周期。

## 入站提及策略

让入站提及处理分成两层：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 做提及策略决策。只有当你需要更宽的入站助手汇总出口时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复 Bot 检测
- 引用 Bot 检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明 Bot 参与度的平台原生缓存

适合共享助手的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在入站门禁中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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

`matchesMentionWithExplicit(...)` 返回布尔值。`hasAnyMention`、`isExplicitlyMentioned` 和 `canResolveExplicit` 来自渠道自己的原生提及元数据（消息实体、回复 Bot 标记及类似信息）；当你的平台无法检测它们时，请提供 `false`/`undefined` 值。

`api.runtime.channel.mentions` 为已依赖运行时注入的内置渠道插件暴露同一组共享提及辅助函数：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站运行时辅助函数。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    创建标准插件文件。`openclaw.plugin.json` 中的 `channels` 字段（不是 `kind` 字段）用于标记一个清单拥有渠道。完整的包元数据表面请参见
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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
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

    `configSchema` 校验 `plugins.entries.acme-chat.config`。将它用于不属于渠道账号配置的插件自有设置。
    `channelConfigs.acme-chat.schema` 校验 `channels.acme-chat`，并且是配置 schema、设置流程和 UI 表面在插件运行时加载前使用的冷路径来源。完整顶层字段参考请参见 [插件清单](/zh-CN/plugins/manifest)。

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 接口有许多可选适配器表面。先从最小集合开始：`id`、`config` 和 `setup`，然后按需添加适配器。

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
        // Account resolution/inspection belongs on `config`, not `setup`.
        // `setup` covers onboarding writes (applyAccountConfig, validateInput).
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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账号本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一个解析器与 Doctor 修复配对，使运行时和迁移读取同一份契约。

    <Accordion title="What createChatChannelPlugin does for you">
      你无需手动实现低层适配器接口，而是传入声明式选项，由构建器进行组合：

      | 选项 | 它会接线的内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域私信安全解析器 |
      | `pairing.text` | 基于文本、通过代码交换完成的私信配对流程 |
      | `threading` | 回复目标模式解析器（固定、按账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数；需要一个同级 `channel` id，以便核心能给返回的投递结果盖戳 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带投递时格式化决策，例如 `maxLinesPerMessage`；请在发送前应用它，这样回复串接和分块边界只由共享出站投递解析一次。
      当解析出原生回复目标时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），因此载荷辅助函数可以保留显式回复标签，而不会消耗隐式的一次性回复槽。
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    将渠道自有 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw 可以在不激活完整渠道运行时的情况下，在根帮助中展示它们，同时普通完整加载仍会获取相同描述符用于真实命令注册。将 `registerFull(...)` 保留给仅运行时工作。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用插件专属前缀。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终解析为 `operator.admin`。所有选项请参见
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="Add a setup entry">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载这个入口而不是完整入口。它可以避免在设置流程中拉入较重的运行时代码。
    详情请参见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar 模块的内置工作区渠道，如果还需要显式的设置时运行时 setter，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的插件需要从平台接收消息并将它们转发给 OpenClaw。典型模式是一个 webhook：它校验请求，然后通过你的渠道入站处理程序分发请求：

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
      入站消息处理是渠道专属的。每个渠道插件都拥有自己的入站流水线。请查看内置渠道插件（例如 Microsoft Teams 或 Google Chat 插件包）中的真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
在 `src/channel.test.ts` 中编写同位置测试：

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

    关于共享测试辅助工具，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

</Step>
</Steps>

## 文件结构

```text
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
  <Card title="Threading options" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、按账号作用域或自定义回复模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用子智能体
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/zh-CN/plugins/sdk-channel-inbound">
    共享入站事件生命周期：摄取、解析、记录、分发、完成
  </Card>
</CardGroup>

<Note>
一些内置辅助接缝仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件系列，否则应优先使用通用 SDK
表面中的泛用渠道、设置、回复、运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) - 测试实用工具和契约测试
- [Plugin Manifest](/zh-CN/plugins/manifest) - 完整清单架构

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [Building plugins](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
