---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 ChannelPlugin 适配器接口。
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-29T15:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03384057a4316b87c6088d3859d16ed4546c803f7c64639cd12be293f4841258
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南会带你构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可工作的渠道，具备私信安全、配对、回复线程和出站消息发送能力。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本的包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送、编辑或回应工具。OpenClaw 在核心中保留一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 ID 如何映射到基础聊天、线程 ID 和父级回退项
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 回复如何进入线程
- **心跳输入状态** — 用于心跳投递目标的可选输入中/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、通用 `:thread:` 记账以及分发。

如果你的渠道支持入站回复之外的输入状态指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的输入状态 keepalive/cleanup 生命周期。当平台需要显式停止信号时，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了承载媒体来源的消息工具参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心会使用该显式列表来进行沙箱路径规范化和出站媒体访问策略处理，因此插件不需要为提供商特定的头像、附件或封面图像参数在共享核心中添加特殊情况。
优先返回按动作键索引的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关动作不会继承其他动作的媒体参数。对于有意在每个暴露动作之间共享的参数，扁平数组仍然可用。

如果你的平台在会话 ID 中存储额外作用域，请使用 `messaging.resolveSessionConversation(...)` 将解析逻辑保留在插件中。这是将 `rawId` 映射到基础会话 ID、可选线程 ID、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛/基础会话的顺序排列它们。

当插件代码需要规范化类似路由的字段、比较子线程与其父路由，或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助函数会以与核心相同的方式规范化数字线程 ID，因此插件应优先使用它，而不是临时的 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将自己的解析器注入 `resolveChannelRouteTargetWithParser(...)`，并仍然获得与核心使用的相同路由目标形状和线程回退语义。

在渠道注册表启动之前就需要相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`。核心仅在运行时插件注册表尚不可用时使用这个可安全用于引导阶段的接口。

当插件只需要在通用/原始 ID 之上提供父级回退项时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，并且仅当规范钩子省略它们时才回退到 `resolveParentConversationCandidates(...)`。

## 审批和渠道能力

大多数渠道插件不需要审批专用代码。

- 核心负责同一聊天中的 `/approve`、共享审批按钮载荷以及通用回退投递。
- 当渠道需要审批特定行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已被移除。请将审批投递、原生、渲染和鉴权事实放在 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取审批鉴权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批鉴权接缝。
- 使用 `approvalCapability.getActionAvailabilityState` 处理同一聊天审批鉴权可用性。
- 如果你的渠道暴露原生 exec 审批，请在发起面/原生客户端状态不同于同一聊天审批鉴权时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个 exec 专用钩子区分 `enabled` 和 `disabled`，决定发起渠道是否支持原生 exec 审批，并将该渠道包含在原生客户端回退指引中。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见情况填充这一点。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 处理渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示，或在投递前发送输入状态指示器。
- 仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制。
- 使用 `approvalCapability.nativeRuntime` 处理渠道拥有的原生审批事实。在热渠道入口点上通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持懒加载，它可以按需导入你的运行时模块，同时仍允许核心组装审批生命周期。
- 仅当渠道确实需要自定义审批载荷而非共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复说明启用原生 exec 审批所需的确切配置旋钮时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天中的 `/approve`，无需添加审批特定的核心逻辑。
- 如果渠道需要原生审批投递，请让渠道代码聚焦于目标规范化以及传输/呈现事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心可以组装处理程序，并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及已路由到其他位置的通知。`nativeRuntime` 被拆分为几个更小的接缝：
- `createChannelNativeOriginTargetResolver` 默认使用共享渠道路由匹配器处理 `{ to, accountId, threadId }` 目标。仅当渠道具有提供商特定的等价规则时才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行之前规范化提供商 ID，同时保留原始目标用于投递时，请将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当已解析的投递目标本身应被规范化时，才使用 `normalizeTarget`。
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享审批视图模型映射为待处理/已解决/已过期的原生载荷或最终动作
- `transport` — 准备目标，并发送/更新/删除原生审批消息
- `interactions` — 用于原生按钮或回应的可选绑定/解绑/清除动作钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要由运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心可以从渠道启动状态引导由能力驱动的处理程序，而无需添加审批特定的包装胶水代码。
- 仅当能力驱动的接缝表达能力仍不够时，才使用更低层级的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助函数路由 `accountId` 和 `approvalKind`。`accountId` 让多账号审批策略限定在正确的机器人账号内，`approvalKind` 则让渠道可用 exec 与插件审批行为，而无需在核心中硬编码分支。
- 核心现在也负责审批重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“审批已发送到私信/另一个渠道”后续消息；相反，应通过共享审批能力辅助函数暴露准确的来源和审批者私信路由，并让核心在发回任何通知到发起聊天之前汇总实际投递。
- 端到端保留已投递审批 ID 的类型。原生客户端不应
  从渠道本地状态猜测或重写 exec 与插件审批路由。
- 不同审批类型可以有意暴露不同的原生表面。
  当前内置示例：
  - Slack 让原生审批路由对 exec 和插件 ID 都可用。
  - Matrix 为 exec 和插件审批保留相同的原生私信/渠道路由和回应 UX，
    同时仍允许鉴权按审批类型不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

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

同样，当你不需要更宽泛的总括接口时，优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

专门针对设置：

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助函数：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找注释输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向 `createEnvPatchedAccountSetupAdapter` 的窄环境感知适配器接缝
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装设置
  构建器以及一些设置安全的原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境驱动的设置或鉴权，并且通用启动/配置流程应在运行时加载前知道这些环境名称，请在插件清单中使用 `channelEnvVars` 声明它们。将渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。

如果你的渠道会在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或
SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应该能够在只读命令
路径中安全导入，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、Status
适配器，以及渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

主渠道入口导入路径也要保持精简。设备发现可以评估入口和渠道插件模块，以注册能力，而不会激活
渠道。`channel-plugin-api.ts` 等文件应导出渠道插件对象，而不应导入设置向导、传输客户端、套接字
监听器、子进程启动器或服务启动模块。将这些运行时部分放在从 `registerFull(...)`、运行时 setter
或惰性能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助函数（如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽泛的
  `openclaw/plugin-sdk/setup` 接缝

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用
`createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终确认时失败关闭，并且会在验证、最终确认和文档链接文案中复用相同的必需安装消息。

对于其他热路径渠道，优先使用精简辅助函数，而不是更宽泛的旧界面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及记录并分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载，以及出站身份/发送委托和载荷规划
- 当出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍匹配后恢复当前 `:thread:` 会话时，使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。当提供商插件的平台具有原生线程投递语义时，可以覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期和适配器注册
- 仅当仍需要旧版智能体/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令规范化、重复/冲突验证，以及回退稳定的命令配置契约

仅认证渠道通常可以停在默认路径：核心处理批准，插件只暴露出站/认证能力。Matrix、Slack、Telegram 和自定义聊天传输等原生批准渠道应使用共享原生辅助函数，而不是自行实现批准生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。
仅当你需要更宽泛的入站辅助 barrel 时，才使用
`openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- 回复给机器人的检测
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

首选流程：

1. 计算本地提及事实。
2. 将这些事实传入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的入站网关中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站运行时辅助函数。

较旧的 `resolveMentionGating*` 辅助函数仍作为兼容导出保留在
`openclaw/plugin-sdk/channel-inbound` 上。新代码应使用
`resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段会让它成为渠道插件。完整的软件包元数据界面请参阅 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 验证 `plugins.entries.acme-chat.config`。将它用于插件拥有的设置，而不是渠道账号配置。`channelConfigs`
    验证 `channels.acme-chat`，并且是插件运行时加载前由配置架构、设置和 UI 界面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口包含许多可选的适配器界面。先从最小内容开始，即 `id` 和 `setup`，再按需添加适配器。

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

    对于同时接受规范顶层私信键和旧版嵌套键的渠道，使用 `plugin-sdk/channel-config-helpers` 中的辅助函数：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 会让账号本地值优先于继承的根值。通过 `normalizeLegacyDmAliases` 将同一个解析器与 Doctor 修复配对，这样运行时和迁移会读取相同的契约。

    <Accordion title="createChatChannelPlugin 为你做什么">
      你不需要手动实现低级适配器接口，而是传入声明式选项，构建器会组合它们：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域私信安全解析器 |
      | `pairing.text` | 基于文本的私信配对流程，带代码交换 |
      | `threading` | 回复到模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义一个 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 会携带发送时的格式决策，
      例如 `maxLinesPerMessage`；请在发送前应用它，这样回复串联
      和分块边界只会由共享出站发送流程解析一次。
      当原生回复目标已解析时，发送上下文也会包含 `replyToIdSource`（`implicit` 或 `explicit`），
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
    无需激活完整渠道运行时，就能在根帮助中显示它们；
    同时，正常的完整加载仍会获取相同描述符，用于真正的命令
    注册。将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专属前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。所有
    选项请参阅[入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="Add a setup entry">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载它，而不是完整入口。
    这样可以避免在设置流程中引入沉重的运行时代码。
    详情请参阅[设置与配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar 模块的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的插件需要从平台接收消息并将其转发给
    OpenClaw。典型模式是使用 webhook 来验证请求，并
    通过你的渠道入站处理器分发它：

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
      入站消息处理是渠道特定的。每个渠道插件都拥有
      自己的入站流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的真实模式。
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

    如需共享测试辅助函数，请参阅[测试](/zh-CN/plugins/sdk-testing)。

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
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用的子智能体
  </Card>
</CardGroup>

<Note>
一些内置辅助接缝仍然存在，用于维护内置插件以及
兼容性。它们不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件家族，否则请优先使用通用 SDK
表面中的通用 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件 Manifest](/zh-CN/plugins/manifest) — 完整 manifest schema

## 相关

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
