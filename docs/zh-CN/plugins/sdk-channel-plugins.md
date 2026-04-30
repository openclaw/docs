---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要理解 ChannelPlugin 适配器接口面
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-30T00:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南介绍如何构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可用的渠道，支持私信安全、配对、回复串联和出站消息。

<Info>
  如果你此前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本的软件包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送、编辑或响应工具。OpenClaw 在核心中保留一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信审批流程
- **会话语法** — 提供商特定的对话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 回复如何串联
- **Heartbeat 输入状态** — 可选的输入中或忙碌信号，用于 Heartbeat 投递目标

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 账簿记录和分发。

如果你的渠道支持入站回复之外的输入状态指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在 Heartbeat 模型运行开始前，使用解析后的 Heartbeat 投递目标调用它，并使用共享的输入状态保活和清理生命周期。当平台需要显式停止信号时，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了携带媒体源的消息工具参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用该显式列表执行沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图片参数添加共享核心特例。
优先返回按操作键分组的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关操作就不会继承其他操作的媒体参数。对于有意在每个暴露操作之间共享的参数，扁平数组仍然可用。

如果你的平台在对话 ID 内存储额外作用域，请在插件中使用 `messaging.resolveSessionConversation(...)` 保留该解析逻辑。这是将 `rawId` 映射到基础对话 ID、可选线程 ID、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范钩子。
返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛/基础对话的顺序排列。

当插件代码需要规范化类似路由的字段、比较子线程与其父级路由，或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助工具会以与核心相同的方式规范化数字线程 ID，因此插件应优先使用它，而不是临时的 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将自己的解析器注入 `resolveChannelRouteTargetWithParser(...)`，并仍然获得与核心相同的路由目标形状和线程回退语义。

需要在渠道注册表启动前进行相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`。核心只会在运行时插件注册表尚不可用时使用这个可安全用于引导的表面。

当插件只需要在通用/原始 ID 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，并且只会在规范钩子省略它们时回退到 `resolveParentConversationCandidates(...)`。

## 审批与渠道能力

大多数渠道插件不需要审批专用代码。

- 核心负责同一聊天中的 `/approve`、共享审批按钮负载和通用回退投递。
- 当渠道需要审批特定行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请将审批投递、原生、渲染和鉴权事实放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/注销；核心不再从该对象读取审批鉴权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批鉴权接缝。
- 使用 `approvalCapability.getActionAvailabilityState` 处理同一聊天审批鉴权可用性。
- 如果你的渠道暴露原生执行审批，请在发起表面/原生客户端状态与同一聊天审批鉴权不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用该执行专用钩子区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生执行审批，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见场景填充此内容。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 处理渠道特定的负载生命周期行为，例如隐藏重复的本地审批提示，或在投递前发送输入状态指示器。
- 仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制。
- 使用 `approvalCapability.nativeRuntime` 存放渠道拥有的原生审批事实。通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 让它在热渠道入口点上保持惰性；该适配器可按需导入你的运行时模块，同时仍允许核心组装审批生命周期。
- 仅当渠道确实需要自定义审批负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望在禁用路径的回复中说明启用原生执行审批所需的确切配置旋钮时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天中的 `/approve`，而无需添加审批专用核心逻辑。
- 如果渠道需要原生审批投递，请让渠道代码聚焦于目标规范化以及传输/呈现事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅和“已路由到其他位置”通知。`nativeRuntime` 被拆分为几个更小的接缝：
- `createChannelNativeOriginTargetResolver` 默认使用共享渠道路由匹配器处理 `{ to, accountId, threadId }` 目标。只有当渠道具有提供商特定的等价规则时才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时保留原始目标用于投递时，请将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当解析出的投递目标本身也应被规范化时，才使用 `normalizeTarget`。
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享审批视图模型映射为待处理/已解决/已过期的原生负载或最终操作
- `transport` — 准备目标并发送、更新、删除原生审批消息
- `interactions` — 用于原生按钮或反应的可选绑定、解绑和清除操作钩子
- `observe` — 可选投递诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表允许核心从渠道启动状态引导由能力驱动的处理器，而无需添加审批专用包装胶水代码。
- 只有当能力驱动接缝尚不足以表达需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助工具路由 `accountId` 和 `approvalKind`。`accountId` 将多账号审批策略限定到正确的机器人账号，`approvalKind` 让执行审批与插件审批行为可供渠道使用，而无需在核心中使用硬编码分支。
- 核心现在也负责审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已转到私信 / 另一个渠道”后续消息；相反，应通过共享审批能力辅助工具暴露准确的来源和审批人私信路由，并让核心在向发起聊天发布任何通知前聚合实际投递。
- 端到端保留已投递审批 ID 的种类。原生客户端不应
  基于渠道本地状态猜测或改写执行审批与插件审批路由。
- 不同审批种类可以有意暴露不同的原生表面。
  当前内置示例：
  - Slack 为执行和插件 ID 都保留原生审批路由。
  - Matrix 为执行审批和插件审批保留相同的原生私信/渠道路由和反应 UX，
    同时仍允许鉴权按审批种类区分。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于热渠道入口点，如果只需要该系列中的一个部分，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你不需要更宽泛的伞形表面时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

具体到设置：

- `openclaw/plugin-sdk/setup-runtime` 覆盖可安全用于运行时的设置辅助工具：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找备注输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向环境的窄适配器
  接缝，用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器，以及少量可安全用于设置的基础能力：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`，

如果你的渠道支持由环境变量驱动的设置或鉴权，并且通用启动/配置流程应在运行时加载前知道这些环境变量名称，请在插件清单中使用 `channelEnvVars` 声明它们。渠道运行时的 `envVars` 或本地常量仅用于面向操作员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或
SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应可在只读命令
路径中安全导入，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、Status
适配器和渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

也要让主渠道入口导入路径保持狭窄。设备发现可以评估入口和渠道插件模块，以便在不激活
渠道的情况下注册能力。`channel-plugin-api.ts` 等文件应导出渠道插件对象，而不导入设置向导、
传输客户端、套接字监听器、子进程启动器或服务启动模块。将这些运行时部分放入从
`registerFull(...)`、运行时 setter 或惰性能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有在你还需要更重的共享设置/配置助手（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽的
  `openclaw/plugin-sdk/setup` seam

如果你的渠道只想在设置界面中提示“先安装此插件”，优先使用
`createOptionalChannelSetupSurface(...)`。生成的适配器/向导会对配置写入和最终确定采取失败关闭策略，
并在验证、最终确定和文档链接文案中复用同一条需要安装的消息。

对于其他热门渠道路径，优先使用狭窄助手，而不是更宽的旧版界面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及记录并分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载，以及出站身份/发送委托和载荷规划
- 来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，用于出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍匹配后恢复当前 `:thread:` 会话的情况。提供商插件可以在其平台具有原生线程投递语义时覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期和适配器注册
- 仅当仍需要旧版智能体/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令规范化、重复/冲突验证，以及回退稳定的命令配置契约

仅鉴权渠道通常可以停在默认路径：核心会处理批准，插件只需暴露出站/鉴权能力。Matrix、Slack、Telegram 和自定义聊天传输等原生批准渠道应使用共享的原生助手，而不是自行实现批准生命周期。

## 入站提及策略

保持入站提及处理分为两层：

- 插件自有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。
仅当需要更宽的入站助手 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复机器人的检测
- 引用机器人的检测
- 线程参与检查
- 服务/系统消息排除
- 证明机器人参与所需的平台原生缓存

适合共享助手的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

首选流程：

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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露相同的共享提及助手：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时助手。

较旧的 `resolveMentionGating*` 助手仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但仅作为兼容性导出。新代码
应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段会使其成为渠道插件。有关完整的软件包元数据界面，
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

    `configSchema` 会验证 `plugins.entries.acme-chat.config`。将其用于插件自有设置，
    而不是渠道账号配置。`channelConfigs` 会验证 `channels.acme-chat`，并且是在插件运行时加载前，
    配置 schema、设置和 UI 界面使用的冷路径来源。

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 接口有许多可选适配器界面。从最小集合开始，即 `id` 和 `setup`，
    然后按需添加适配器。

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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，请使用 `plugin-sdk/channel-config-helpers` 中的助手：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账号本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一解析器与 Doctor 修复配对，使运行时和迁移读取同一契约。

    <Accordion title="What createChatChannelPlugin does for you">
      你无需手动实现低级适配器接口，而是传入声明式选项，构建器会组合它们：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域私信安全解析器 |
      | `pairing.text` | 基于文本的私信配对流程，带代码交换 |
      | `threading` | 回复模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义一个 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 会携带发送时的格式决策，
      例如 `maxLinesPerMessage`；在发送前应用它，这样回复串联
      和分块边界就会由共享出站发送统一解析一次。
      当解析出原生回复目标时，发送上下文还会包含 `replyToIdSource`（`implicit` 或 `explicit`），
      因此载荷辅助函数可以保留显式回复标签，而不会消耗隐式的一次性回复槽。
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

    将渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    可以在不激活完整渠道运行时的情况下，在根帮助中显示它们，
    同时普通完整加载仍会获取相同的描述符，用于实际命令注册。
    将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专用前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，并且始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。查看
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    选项。

  </Step>

  <Step title="Add a setup entry">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载它而不是完整入口。
    这样可以避免在设置流程期间拉入较重的运行时代码。
    查看[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)了解详情。

    将设置安全导出拆分到随附模块中的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，
    可以使用来自 `openclaw/plugin-sdk/channel-entry-contract` 的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的插件需要从平台接收消息，并将它们转发给
    OpenClaw。典型模式是一个 webhook：它验证请求并
    通过你的渠道入站处理程序分派请求：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      入站消息处理是渠道专属的。每个渠道插件都拥有
      自己的入站流水线。查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）了解真实模式。
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

    对于共享测试辅助函数，请查看[测试](/zh-CN/plugins/sdk-testing)。

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
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 的子智能体
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/zh-CN/plugins/sdk-channel-turn">
    共享入站轮次生命周期：摄取、解析、记录、分派、完成
  </Card>
</CardGroup>

<Note>
一些内置辅助 seam 仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你在直接维护该内置插件系列，否则请优先使用通用 SDK
表面中的通用渠道、设置、回复和运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) — 测试实用工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema

## 相关

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
