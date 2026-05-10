---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 ChannelPlugin 适配器接口面
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-05-10T19:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南将介绍如何构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个支持私信安全性、配对、回复串联和出站消息发送的可用渠道。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和清单设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自己的发送、编辑或响应工具。OpenClaw 在核心中保留一个共享的 `message` 工具。你的插件负责：

- **配置** - 账号解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信批准流程
- **会话语法** - 提供商特定的对话 ID 如何映射到基础聊天、线程 ID 和父级回退项
- **出站** - 向平台发送文本、媒体和投票
- **线程** - 回复如何串联
- **Heartbeat 输入状态** - 针对 Heartbeat 投递目标的可选输入中/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 记录管理和分发。

新的渠道插件还应使用来自 `openclaw/plugin-sdk/channel-message` 的 `defineChannelMessageAdapter` 暴露一个 `message` 适配器。该适配器声明原生传输实际支持哪些持久最终发送能力，并将文本/媒体发送指向与旧版 `outbound` 适配器相同的传输函数。只有在合约测试证明原生副作用和返回的回执后，才声明某项能力。
完整的 API 合约、示例、能力矩阵、回执规则、实时预览最终化、接收确认策略、测试和迁移表，请参阅
[频道消息 API](/zh-CN/plugins/sdk-channel-message)。
如果现有的 `outbound` 适配器已经具备正确的发送方法和能力元数据，请使用 `createChannelMessageAdapterFromOutbound(...)` 派生 `message` 适配器，而不是手写另一个桥接层。
适配器发送应返回 `MessageReceipt` 值。当兼容代码仍需要旧版 ID 时，请用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生它们，而不是在新的生命周期代码中保留并行的 `messageIds` 字段。
支持预览的渠道还应使用其拥有的精确实时生命周期声明 `message.live.capabilities`，例如 `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming` 或 `quietFinalization`。在原处最终化草稿预览的渠道还应声明 `message.live.finalizer.capabilities`，例如 `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt` 和 `retainOnAmbiguousFailure`，并通过 `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑。请用 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 测试支撑这些能力，确保原生预览、进度、编辑、回退/保留、清理和回执行为不会静默漂移。
会延迟平台确认的入站接收器应声明 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把确认时机隐藏在监视器本地状态中。使用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每个已声明的策略。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply` 等旧版回复/轮次辅助函数仍可用于兼容性分发器。不要在新的渠道代码中使用这些名称；新插件应从 `message` 适配器、回执，以及 `openclaw/plugin-sdk/channel-message` 上的接收/发送生命周期辅助函数开始。

迁移入站授权的渠道可以从运行时接收路径使用实验性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路径。该子路径将平台查找和副作用保留在插件中，同时共享允许列表状态解析、路由/发送方/命令/事件/激活决策、脱敏诊断和轮次准入映射。请把插件身份规范化保留在传给解析器的描述符中；不要序列化已解析状态或决策中的原始匹配值。API 设计、所有权边界和测试预期请参阅
[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。

如果你的渠道支持入站回复之外的输入状态指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始前，使用已解析的 Heartbeat 投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了携带媒体来源的消息工具参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心会使用该显式列表进行沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图片参数添加共享核心特例。
建议返回按操作键组织的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样不相关的操作就不会继承另一个操作的媒体参数。对于有意在每个已暴露操作之间共享的参数，扁平数组仍然可用。

如果你的渠道需要为 `message(action="send")` 做提供商特定的成形处理，请优先使用 `actions.prepareSendPayload(...)`。把原生卡片、块、嵌入或其他持久数据放在 `payload.channelData.<channel>` 下，并让核心通过出站/message 适配器执行实际发送。仅在负载无法序列化并重试时，才将 `actions.handleAction(...)` 用作发送的兼容性回退。

如果你的平台在对话 ID 内存储额外作用域，请在插件中使用 `messaging.resolveSessionConversation(...)` 保留该解析逻辑。这是将 `rawId` 映射到基础对话 ID、可选线程 ID、显式 `baseConversationId` 和任何 `parentConversationCandidates` 的规范钩子。
返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛/基础对话的顺序排列。

当插件代码需要规范化类似路由的字段、比较子线程和其父级路由，或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助函数会以与核心相同的方式规范化数字线程 ID，因此插件应优先使用它，而不是临时的 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将其解析器注入 `resolveChannelRouteTargetWithParser(...)`，同时仍获得与核心使用的相同路由目标形状和线程回退语义。

在渠道注册表启动前需要相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，其中导出匹配的 `resolveSessionConversation(...)`。核心只会在运行时插件注册表尚不可用时，使用这个可安全引导的表面。

当插件只需要在通用/原始 ID 之上提供父级回退项时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容性回退使用。如果两个钩子都存在，核心会先使用 `resolveSessionConversation(...).parentConversationCandidates`，且只有当规范钩子省略它们时，才回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要特定于批准的代码。

- 核心拥有同一聊天中的 `/approve`、共享审批按钮 payload，以及通用 fallback 递送。
- 当渠道需要审批特定行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。将审批递送、native、render、auth 事实放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/注销；核心不再从该对象读取审批 auth 钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批 auth 接缝。
- 对同一聊天审批 auth 可用性使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露 native exec 审批，当发起表面/native 客户端状态不同于同一聊天审批 auth 时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`、决定发起渠道是否支持 native exec 审批，并在 native 客户端 fallback 指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见情况填充这一点。
- 对于渠道特定的 payload 生命周期行为，例如隐藏重复的本地审批提示，或在递送前发送正在输入指示，使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅将 `approvalCapability.delivery` 用于 native 审批路由或 fallback 抑制。
- 对渠道拥有的 native 审批事实使用 `approvalCapability.nativeRuntime`。在热渠道入口点上通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持懒加载；它可以按需导入你的运行时模块，同时仍让核心组装审批生命周期。
- 仅当渠道确实需要自定义审批 payload，而不是共享渲染器时，使用 `approvalCapability.render`。
- 当渠道希望 disabled 路径回复解释启用 native exec 审批所需的确切配置旋钮时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；命名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类似所有者的私信身份，使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天中的 `/approve`，而无需添加审批特定的核心逻辑。
- 如果渠道需要 native 审批递送，请让渠道代码聚焦于目标规范化以及传输/呈现事实。使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，这样核心就能组装处理器，并拥有请求过滤、路由、去重、过期、Gateway 网关订阅，以及已路由到其他位置的通知。`nativeRuntime` 被拆分为几个更小的接缝：
- `createChannelNativeOriginTargetResolver` 默认对 `{ to, accountId, threadId }` 目标使用共享渠道路由匹配器。仅当渠道具有提供商特定的等价规则时传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时保留原始目标用于递送时，将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当已解析的递送目标本身也应被规范化时，才使用 `normalizeTarget`。
- `availability` - 账号是否已配置，以及请求是否应被处理
- `presentation` - 将共享审批视图模型映射为待处理/已解决/已过期的 native payload 或最终操作
- `transport` - 准备目标，并发送/更新/删除 native 审批消息
- `interactions` - 用于 native 按钮或 reaction 的可选绑定/解绑/清除操作钩子
- `observe` - 可选递送诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用 runtime-context 注册表让核心可以从渠道启动状态引导 capability 驱动的处理器，而无需添加审批特定的包装 glue。
- 仅当 capability 驱动的接缝表达力还不够时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- Native 审批渠道必须通过这些 helper 路由 `accountId` 和 `approvalKind`。`accountId` 让多账号审批策略限定在正确的机器人账号内，`approvalKind` 让 exec 与插件审批行为可供渠道使用，而无需在核心中硬编码分支。
- 核心现在也拥有审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已发送到私信 / 另一个渠道”后续消息；而应通过共享审批 capability helper 暴露准确的来源 + 审批人私信路由，并让核心在向发起聊天发布任何通知前聚合实际递送。
- 端到端保留已递送审批 ID 的 kind。Native 客户端不应
  根据渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批 kind 可以有意暴露不同的 native 表面。
  当前内置示例：
  - Slack 为 exec 和插件 ID 都保持 native 审批路由可用。
  - Matrix 为 exec 和插件审批保持相同的 native 私信/渠道路由和 reaction UX，
    同时仍允许 auth 按审批 kind 区分。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用 capability builder，并在插件上暴露 `approvalCapability`。

对于热渠道入口点，当你只需要该系列的一部分时，优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你不需要更宽的伞形
表面时，优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

具体到设置：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置 helper：
  import-safe 设置 patch adapter（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托的
  setup-proxy builder
- `openclaw/plugin-sdk/setup-runtime` 包含用于
  `createEnvPatchedAccountSetupAdapter` 的 env 感知 adapter 接缝
- `openclaw/plugin-sdk/channel-setup` 覆盖 optional-install 设置
  builder，以及少量设置安全的 primitive：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持 env 驱动的设置或 auth，并且通用启动/配置
流程应在运行时加载前知道这些 env 名称，请在
插件清单中使用 `channelEnvVars` 声明它们。渠道运行时 `envVars` 或本地
常量仅用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或
SecretRef 扫描中，请在
`package.json` 中添加 `openclaw.setupEntry`。该入口点应可在只读命令
路径中安全导入，并应返回这些摘要所需的渠道元数据、设置安全配置 adapter、状态
adapter，以及渠道 secret 目标元数据。不要
从设置入口启动客户端、监听器或传输运行时。

也要保持主渠道入口导入路径狭窄。设备发现可以评估
入口和渠道插件模块以注册 capability，而不激活
该渠道。诸如 `channel-plugin-api.ts` 的文件应导出渠道
插件对象，而不导入设置向导、传输客户端、socket
监听器、子进程启动器或服务启动模块。将这些运行时
部分放入从 `registerFull(...)`、运行时 setter 或 lazy
capability adapter 加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要较重的共享设置/配置 helper，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 时，才使用更宽的 `openclaw/plugin-sdk/setup` 接缝

如果你的渠道只想在设置表面宣传“先安装此插件”，
优先使用 `createOptionalChannelSetupSurface(...)`。生成的
adapter/向导会在配置写入和 finalization 上 fail closed，并且它们会在验证、finalize 和文档链接
文案中复用同一条需要安装的消息。

对于其他热渠道路径，优先使用窄 helper，而不是更宽的旧版
表面：

- 对多账号配置和
  默认账号 fallback，使用 `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`
- 对入口路由/envelope 和
  记录并分发 wiring，使用 `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 对目标解析/匹配，使用 `openclaw/plugin-sdk/messaging-targets`
- 对媒体加载以及出站
  身份/发送 delegate 和 payload 规划，使用 `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`
- 当出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时，使用来自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台
  具有 native 线程递送语义时，可以覆盖
  优先级、后缀行为和线程 ID 规范化。
- 对 thread-binding 生命周期
  和 adapter 注册，使用 `openclaw/plugin-sdk/thread-bindings-runtime`
- 仅当仍需要旧版 agent/media
  payload 字段布局时，使用 `openclaw/plugin-sdk/agent-media-payload`
- 对 Telegram 自定义命令
  规范化、重复/冲突验证，以及 fallback 稳定的命令
  配置契约，使用 `openclaw/plugin-sdk/telegram-command-config`

仅 auth 渠道通常可以停留在默认路径：核心处理审批，插件只暴露出站/auth capability。Matrix、Slack、Telegram 等 native 审批渠道以及自定义聊天传输应使用共享 native helper，而不是自己实现审批生命周期。

## 入口 mention 策略

将入口 mention 处理保持为两层拆分：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 做 mention-policy 决策。
仅当你需要更宽的入口
helper barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- reply-to-bot 检测
- quoted-bot 检测
- 线程参与检查
- service/system-message 排除
- 证明机器人参与所需的平台 native 缓存

适合共享 helper 的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决定

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

`api.runtime.channel.mentions` 会为已经依赖运行时注入的内置渠道插件暴露相同的共享提及辅助函数：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站运行时辅助函数。

较旧的 `resolveMentionGating*` 辅助函数仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但仅作为兼容性导出。新代码应使用
`resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段会让它成为渠道插件。完整的包元数据表面请参阅 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 会校验 `plugins.entries.acme-chat.config`。将它用于并非渠道账户配置的插件自有设置。`channelConfigs`
    会校验 `channels.acme-chat`，并且是在插件运行时加载前，由配置
    schema、设置和 UI 表面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有很多可选的适配器表面。先从最小集合开始，即 `id` 和 `setup`，然后按需添加适配器。

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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账户本地值优先于继承的根值。将同一个解析器与通过 `normalizeLegacyDmAliases` 实现的 Doctor 修复配对，这样运行时和迁移会读取相同的契约。

    <Accordion title="createChatChannelPlugin 为你做什么">
      你无需手动实现低级适配器接口，而是传入声明式选项，由构建器组合它们：

      | 选项 | 它会连接什么 |
      | --- | --- |
      | `security.dm` | 来自配置字段的限定作用域私信安全解析器 |
      | `pairing.text` | 基于文本、通过代码交换完成的私信配对流程 |
      | `threading` | 回复模式解析器（固定、按账户限定作用域，或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 会携带交付时的格式决策，例如
      `maxLinesPerMessage`；请在发送前应用它，这样回复线程和分块边界只会由共享出站交付解析一次。
      当已解析原生回复目标时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），这样 payload 辅助函数可以保留显式回复标签，而不会消耗隐式的一次性回复槽位。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    无需激活完整渠道运行时，就可以在根帮助中显示它们；同时，普通的完整加载仍会为实际命令注册获取相同的描述符。将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用插件专属前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。所有选项请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载此入口，而不是完整入口。它可以避免在设置流程中拉入沉重的运行时代码。
    详情请参阅 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar 模块的内置工作区渠道，在还需要显式设置期运行时 setter 时，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将它们转发给 OpenClaw。典型模式是使用 webhook 校验请求，然后通过你的渠道入站处理器分发它：

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
      入站消息处理是特定于渠道的。每个渠道插件拥有
      自己的入站流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）以了解真实模式。
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

    关于共享测试辅助工具，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

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
  <Card title="会话线程选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号范围或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用子智能体
  </Card>
  <Card title="频道轮次内核" icon="bolt" href="/zh-CN/plugins/sdk-channel-turn">
    共享入站轮次生命周期：摄取、解析、记录、分发、完成
  </Card>
</CardGroup>

<Note>
仍有一些内置辅助接缝用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你直接维护该内置插件系列，否则请优先使用通用 SDK
表面的 generic channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) - 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) - 完整清单 schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
