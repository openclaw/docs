---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要理解 ChannelPlugin 适配器接口
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-05-06T02:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南介绍如何构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可工作的渠道，具备私信安全、配对、回复串联和外发消息能力。

<Info>
  如果你以前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本的包
  结构和清单设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自己的发送/编辑/反应工具。OpenClaw 在核心中保留一个
共享的 `message` 工具。你的插件负责：

- **配置** - 账号解析和设置向导
- **安全** - 私信策略和允许列表
- **配对** - 私信审批流程
- **会话语法** - 提供商特定的会话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **外发** - 向平台发送文本、媒体和投票
- **串联** - 回复如何串联
- **Heartbeat 输入状态** - 面向 Heartbeat 投递目标的可选输入中/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 簿记和分发。

新的渠道插件还应从 `openclaw/plugin-sdk/channel-message` 暴露带有
`defineChannelMessageAdapter` 的 `message` 适配器。该适配器声明原生传输实际支持哪些持久最终发送能力，并将文本/媒体发送指向与旧版 `outbound` 适配器相同的传输函数。只有在合约测试证明了原生副作用和返回的回执后，才声明某项能力。
关于完整 API 合约、示例、能力矩阵、回执规则、实时预览最终化、接收确认策略、测试和迁移表，请参阅
[频道消息 API](/zh-CN/plugins/sdk-channel-message)。
如果现有 `outbound` 适配器已经具有正确的发送方法和能力元数据，请使用 `createChannelMessageAdapterFromOutbound(...)` 派生 `message` 适配器，而不是手写另一个桥接层。
适配器发送应返回 `MessageReceipt` 值。当兼容代码仍需要旧版 ID 时，请用 `listMessageReceiptPlatformIds(...)`
或 `resolveMessageReceiptPrimaryId(...)` 派生它们，而不是在新的生命周期代码中保留并行的
`messageIds` 字段。
支持预览的渠道还应声明 `message.live.capabilities`，并精确列出它们拥有的实时生命周期，例如 `draftPreview`、
`previewFinalization`、`progressUpdates`、`nativeStreaming` 或
`quietFinalization`。会就地最终化草稿预览的渠道还应声明 `message.live.finalizer.capabilities`，例如 `finalEdit`、
`normalFallback`、`discardPending`、`previewReceipt` 和
`retainOnAmbiguousFailure`，并通过
`defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑。让这些能力始终由 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和
`verifyChannelMessageLiveFinalizerProofs(...)` 测试支撑，这样原生预览、进度、编辑、回退/保留、清理和回执行为就不会静默漂移。
会延迟平台确认的入站接收器应声明
`message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把确认时机隐藏在监视器本地状态中。用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每个已声明的策略。

旧版回复/轮次辅助函数（例如 `createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`）仍可用于兼容分发器。不要在新的渠道代码中使用这些名称；新插件应从 `message` 适配器、回执以及 `openclaw/plugin-sdk/channel-message` 上的接收/发送生命周期辅助函数开始。

如果你的渠道支持入站回复之外的输入状态指示，请在渠道插件上暴露
`heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始前，使用解析出的 Heartbeat 投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了承载媒体来源的消息工具参数，请通过
`describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心会使用该显式列表来进行沙箱路径规范化和外发媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图参数添加共享核心特例。
优先返回按操作键索引的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关操作不会继承另一个操作的媒体参数。对于有意在每个暴露操作之间共享的参数，扁平数组仍然有效。

如果你的渠道需要为 `message(action="send")` 做提供商特定的整形，优先使用 `actions.prepareSendPayload(...)`。将原生卡片、区块、嵌入内容或其他持久数据放在 `payload.channelData.<channel>` 下，并让核心通过 outbound/message 适配器执行实际发送。仅当载荷无法序列化和重试时，才把
`actions.handleAction(...)` 用作发送的兼容回退。

如果你的平台在会话 ID 内存储额外作用域，请在插件中使用 `messaging.resolveSessionConversation(...)` 保留该解析。这是将 `rawId` 映射到基础会话 ID、可选线程 ID、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛/基础会话的顺序排列它们。

当插件代码需要规范化路由类字段、比较子线程及其父路由，或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助函数会以与核心相同的方式规范化数字线程 ID，因此插件应优先使用它，而不是临时的 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将自己的解析器注入
`resolveChannelRouteTargetWithParser(...)`，并且仍能获得与核心相同的路由目标形状和线程回退语义。

需要在渠道注册表启动前执行相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。只有在运行时插件注册表尚不可用时，核心才会使用这个可安全引导的表面。

当插件只需要在通用/原始 ID 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会先使用
`resolveSessionConversation(...).parentConversationCandidates`，并且只有当规范钩子省略它们时，才回退到 `resolveParentConversationCandidates(...)`。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。

- 核心负责同一聊天内的 `/approve`、共享审批按钮载荷，以及通用回退投递。
- 当渠道需要审批特定行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。将审批投递、原生、渲染、鉴权事实放在 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取审批鉴权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批鉴权衔接点。
- 使用 `approvalCapability.getActionAvailabilityState` 获取同一聊天内审批鉴权可用性。
- 如果你的渠道暴露原生 exec 审批，当发起界面/原生客户端状态不同于同一聊天内审批鉴权时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用该 exec 专用钩子来区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生 exec 审批，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见场景填充此项。
- 对于渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示，或在投递前发送正在输入指示，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制。
- 使用 `approvalCapability.nativeRuntime` 表示渠道自有的原生审批事实。在热渠道入口点上通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持惰性，它可以按需导入你的运行时模块，同时仍让核心组装审批生命周期。
- 仅当渠道确实需要自定义审批载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复说明启用原生 exec 审批所需的确切配置旋钮时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天内的 `/approve`，而无需添加审批特定的核心逻辑。
- 如果渠道需要原生审批投递，请让渠道代码聚焦于目标规范化以及传输/呈现事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就能组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅，以及已路由到其他位置的通知。`nativeRuntime` 被拆分为几个更小的衔接点：
- `createChannelNativeOriginTargetResolver` 默认对 `{ to, accountId, threadId }` 目标使用共享渠道路由匹配器。仅当渠道具有提供商特定的等价规则时才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时为投递保留原始目标时，将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当解析出的投递目标本身应被规范化时，才使用 `normalizeTarget`。
- `availability` - 账号是否已配置，以及请求是否应被处理
- `presentation` - 将共享审批视图模型映射为待处理/已解决/已过期的原生载荷或最终操作
- `transport` - 准备目标，并发送/更新/删除原生审批消息
- `interactions` - 原生按钮或回应的可选绑定/解绑/清除操作钩子
- `observe` - 可选的投递诊断钩子
- 如果渠道需要运行时自有对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心可以从渠道启动状态引导能力驱动的处理器，而无需添加审批特定的包装胶水代码。
- 仅当能力驱动衔接点表达能力仍不足时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助函数传递 `accountId` 和 `approvalKind`。`accountId` 让多账号审批策略作用域限定到正确的 bot 账号，`approvalKind` 让渠道可使用 exec 与插件审批行为，而无需在核心中使用硬编码分支。
- 核心现在也负责审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已转到私信/另一个渠道”后续消息；相反，应通过共享审批能力辅助函数暴露准确的来源 + 审批者私信路由，并让核心汇总实际投递后再向发起聊天发布任何通知。
- 端到端保留已投递审批 ID 的类型。原生客户端不应
  从渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批类型可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 保持原生审批路由同时可用于 exec 和插件 ID。
  - Matrix 对 exec 和插件审批保持相同的原生私信/渠道路由与回应 UX，
    同时仍允许鉴权按审批类型不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

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

同样，当你不需要更宽泛的总括界面时，优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

专门针对设置：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助函数：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找备注输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向环境的窄适配器
  衔接点，用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`，

如果你的渠道支持环境驱动的设置或鉴权，并且通用启动/配置流程应在运行时加载前知道这些环境名称，请在插件清单中使用 `channelEnvVars` 声明它们。渠道运行时 `envVars` 或本地常量只用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应可在只读命令路径中安全导入，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、Status 适配器，以及渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

也要保持主渠道入口导入路径狭窄。设备发现可以评估入口和渠道插件模块来注册能力，而无需激活渠道。诸如 `channel-plugin-api.ts` 的文件应导出渠道插件对象，而不导入设置向导、传输客户端、套接字监听器、子进程启动器或服务启动模块。将这些运行时部分放入从 `registerFull(...)`、运行时 setter 或惰性能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助函数时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 衔接点，
  例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会对配置写入和最终确定执行失败关闭，并在校验、最终确定和文档链接文案中复用同一条要求安装的消息。

对于其他热渠道路径，优先使用窄辅助函数，而不是更宽泛的旧版界面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和
  默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封和
  记录并分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份/发送委托和载荷规划
- 当出站路由应保留显式的 `replyToId`/`threadId`，或在基础会话键仍匹配后恢复当前 `:thread:` 会话时，使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。
  当提供商插件的平台具有原生线程投递语义时，可以覆盖
  优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- 仅当仍需要旧版智能体/媒体
  载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及回退稳定的命令
  配置契约

仅鉴权渠道通常可以停在默认路径：核心处理审批，插件只暴露出站/鉴权能力。诸如 Matrix、Slack、Telegram 和自定义聊天传输这样的原生审批渠道应使用共享原生辅助函数，而不是自行实现审批生命周期。

## 入站提及策略

将入站提及处理保持为两层：

- 插件自有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 做提及策略决策。
仅当你需要更宽泛的入站辅助函数桶时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- 回复 bot 检测
- 引用 bot 检测
- 线程参与检查
- 服务/系统消息排除
- 证明 bot 参与所需的平台原生缓存

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

`api.runtime.channel.mentions` 暴露同一组共享提及辅助函数，供已依赖运行时注入的内置渠道插件使用：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助函数。

较旧的 `resolveMentionGating*` 辅助函数仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，仅作为兼容性导出。新代码应使用
`resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    会让它成为一个渠道插件。完整的包元数据表面请参阅
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

    `configSchema` 会验证 `plugins.entries.acme-chat.config`。将它用于
    不属于渠道账号配置的插件自有设置。`channelConfigs`
    会验证 `channels.acme-chat`，并且是在插件运行时加载前供配置
    架构、设置和 UI 表面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选的适配器表面。先从
    最小项（`id` 和 `setup`）开始，然后按需添加适配器。

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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账号本地值优先于继承的根值。将同一个解析器与 `normalizeLegacyDmAliases` 的 Doctor 修复配对，这样运行时和迁移就会读取同一份契约。

    <Accordion title="createChatChannelPlugin 为你做什么">
      你不需要手动实现底层适配器接口，而是传入声明式选项，
      构建器会将它们组合起来：

      | 选项 | 它连接的内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域化私信安全解析器 |
      | `pairing.text` | 基于文本、带代码交换的私信配对流程 |
      | `threading` | 回复模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果需要完全控制，你也可以传入原始适配器对象，
      而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带发送时的格式化决策，
      例如 `maxLinesPerMessage`；请在发送前应用它，这样回复线程
      和分块边界只需由共享出站投递解析一次。
      当解析到原生回复目标时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），
      因此载荷辅助函数可以保留显式回复标签，而不会消耗隐式的一次性回复槽。
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
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们，
    同时正常的完整加载仍会获取同一组描述符，用于真实的命令
    注册。将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专属前缀。核心管理员命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。所有
    选项请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载它，而不是完整入口。
    它可以避免在设置流程中拉入较重的运行时代码。
    详情请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar 模块中的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将它们转发给
    OpenClaw。典型模式是使用 webhook 验证请求，
    并通过你的渠道入站处理器分发它：

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
      入站消息处理因渠道而异。每个渠道插件都拥有
      自己的入站流水线。请参考内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的实际模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    有关共享测试辅助工具，请参阅[测试](/zh-CN/plugins/sdk-testing)。

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
  <Card title="Threading options" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、按账号限定或自定义回复模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用 subagent
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/zh-CN/plugins/sdk-channel-turn">
    共享入站轮次生命周期：提取、解析、记录、分发、完成
  </Card>
</CardGroup>

<Note>
一些内置辅助接缝仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你直接维护该内置插件系列，否则应优先使用通用 SDK
表面提供的通用 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) - 测试实用工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) - 完整清单架构

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
