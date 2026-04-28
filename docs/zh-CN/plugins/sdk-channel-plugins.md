---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到消息平台
    - 你需要了解 ChannelPlugin 适配器接口
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-28T11:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70a3f8fb671c7291a0566f71a56e45232ed51bb43a8fe470e651a03e994e4aa2
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南将介绍如何构建一个将 OpenClaw 连接到
消息平台的渠道插件。完成后，你将拥有一个可工作的渠道，具备私信安全、
配对、回复线程和出站消息功能。

<Info>
  如果你以前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本包
  结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送/编辑/回应工具。OpenClaw 在核心中保留一个
共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的对话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 回复如何被线程化
- **心跳输入状态** — 面向心跳投递目标的可选输入中/忙碌信号

核心负责共享消息工具、提示词接线、外层会话键形状、
通用 `:thread:` 记账和分发。

如果你的渠道支持入站回复之外的输入指示器，请在渠道插件上公开
`heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用解析后的
心跳投递目标调用它，并使用共享的输入状态保活/清理生命周期。当平台需要显式停止信号时，
添加 `heartbeat.clearTyping(...)`。

如果你的渠道添加了承载媒体来源的消息工具参数，请通过
`describeMessageTool(...).mediaSourceParams` 公开这些参数名。核心会使用
该显式列表进行沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的
头像、附件或封面图参数添加共享核心特例。
优先返回按操作键分组的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关操作不会
继承另一个操作的媒体参数。对于有意在每个公开操作之间共享的参数，扁平数组仍然可用。

如果你的平台在对话 ID 中存储额外作用域，请在插件内使用
`messaging.resolveSessionConversation(...)` 保持解析逻辑。这是将 `rawId`
映射到基础对话 ID、可选线程 ID、显式 `baseConversationId`，
以及任何 `parentConversationCandidates` 的规范钩子。
返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础对话的顺序排列。

当插件代码需要规范化类似路由的字段、比较子线程与其父路由，
或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，
使用 `openclaw/plugin-sdk/channel-route`。该辅助函数会以与核心相同的方式
规范化数字线程 ID，因此插件应优先使用它，而不是临时的 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将其解析器注入
`resolveChannelRouteTargetWithParser(...)`，并且仍然获得与核心相同的路由目标形状
和线程回退语义。

在渠道注册表启动前需要相同解析的内置插件，也可以公开一个顶层
`session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。只有当运行时插件注册表尚不可用时，
核心才会使用这个启动安全的接口。

当插件只需要在通用/原始 ID 之上添加父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍作为旧版兼容回退可用。
如果两个钩子都存在，核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，并且只有当规范钩子
省略它们时，才回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要批准专用代码。

- 核心负责同聊天 `/approve`、共享批准按钮载荷和通用回退投递。
- 当渠道需要批准专用行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。将批准投递/原生/渲染/认证事实放在 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取批准认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接缝。
- 使用 `approvalCapability.getActionAvailabilityState` 表示同聊天批准认证可用性。
- 如果你的渠道公开原生执行批准，请在发起界面/原生客户端状态不同于同聊天批准认证时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个执行专用钩子区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生执行批准，并将该渠道纳入原生客户端回退指引。`createApproverRestrictedNativeApprovalCapability(...)` 会为常见情况填充这一点。
- 对渠道特定的载荷生命周期行为使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`，例如隐藏重复的本地批准提示，或在投递前发送输入指示器。
- 仅将 `approvalCapability.delivery` 用于原生批准路由或回退抑制。
- 将 `approvalCapability.nativeRuntime` 用于渠道自有的原生批准事实。用 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 在热渠道入口点保持其惰性，它可以按需导入你的运行时模块，同时仍允许核心组装批准生命周期。
- 仅当渠道确实需要自定义批准载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复解释启用原生执行批准所需的确切配置开关时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置推断稳定的类似所有者的私信身份，请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，无需添加批准专用核心逻辑。
- 如果渠道需要原生批准投递，请让渠道代码聚焦于目标规范化以及传输/呈现事实。使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅和已路由到别处的通知。`nativeRuntime` 被拆分为几个更小的接缝：
- `createChannelNativeOriginTargetResolver` 默认对 `{ to, accountId, threadId }` 目标使用共享渠道路由匹配器。仅当渠道具有提供商特定的等价规则时才传入 `targetsMatch`，例如 Slack 时间戳前缀匹配。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前规范化提供商 ID，同时保留原始目标用于投递时，将 `normalizeTargetForMatch` 传给 `createChannelNativeOriginTargetResolver`。仅当解析后的投递目标本身应被规范化时，才使用 `normalizeTarget`。
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享批准视图模型映射为待处理/已解决/已过期的原生载荷或最终操作
- `transport` — 准备目标，并发送/更新/删除原生批准消息
- `interactions` — 用于原生按钮或回应的可选绑定/解绑/清除操作钩子
- `observe` — 可选投递诊断钩子
- 如果渠道需要运行时自有对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心能够从渠道启动状态引导能力驱动的处理器，而无需添加批准专用包装胶水。
- 仅当能力驱动接缝仍不够表达需求时，才使用更低层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助函数同时路由 `accountId` 和 `approvalKind`。`accountId` 让多账号批准策略限定在正确的机器人账号内，`approvalKind` 让执行与插件批准行为可供渠道使用，而不需要在核心中硬编码分支。
- 核心现在也负责批准重路由通知。渠道插件不应从 `createChannelNativeApprovalRuntime` 发送自己的“批准已发送到私信 / 另一个渠道”后续消息；而应通过共享批准能力辅助函数公开准确的来源和批准者私信路由，并让核心在向发起聊天发布任何通知前聚合实际投递结果。
- 端到端保留已投递批准 ID 类型。原生客户端不应
  从渠道本地状态猜测或重写执行与插件批准路由。
- 不同批准类型可以有意公开不同的原生界面。
  当前内置示例：
  - Slack 对执行和插件 ID 都保持原生批准路由可用。
  - Matrix 对执行和插件批准保持相同的原生私信/渠道路由和回应 UX，
    同时仍允许认证按批准类型不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用能力构建器，并在插件上公开 `approvalCapability`。

对于热渠道入口点，如果你只需要该系列的一部分，请优先使用更窄的运行时子路径：

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

特别是对于设置：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助函数：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用于 `createEnvPatchedAccountSetupAdapter`
  的窄环境感知适配器接缝
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`，

如果你的渠道支持由环境驱动的设置或认证，并且通用启动/配置
流程应在运行时加载前知道这些环境变量名，请在
插件清单中用 `channelEnvVars` 声明它们。渠道运行时 `envVars` 或本地
常量仅用于面向操作员的文案。

如果你的渠道会在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应能在只读命令路径中安全导入，并应返回这些摘要所需的渠道元数据、可安全用于设置的配置适配器、Status 适配器和渠道密钥目标元数据。不要从设置入口启动客户端、监听器或传输运行时。

同时保持主渠道入口导入路径收窄。设备发现可以评估入口和渠道插件模块，以注册能力，而不会激活该渠道。像 `channel-plugin-api.ts` 这样的文件应导出渠道插件对象，而不应导入设置向导、传输客户端、套接字监听器、子进程启动器或服务启动模块。将这些运行时部分放在从 `registerFull(...)`、运行时 setter 或懒加载能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和 `splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助工具（例如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽的 `openclaw/plugin-sdk/setup` seam

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终完成时失败关闭，并在验证、最终完成和文档链接文案中复用同一条需要安装的消息。

对于其他热路径渠道，请优先使用较窄的辅助工具，而不是更宽的旧版界面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution` 和 `openclaw/plugin-sdk/account-helpers` 用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和 `openclaw/plugin-sdk/inbound-reply-dispatch` 用于入站路由/信封以及记录并分发接线
- `openclaw/plugin-sdk/messaging-targets` 用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和 `openclaw/plugin-sdk/outbound-runtime` 用于媒体加载，以及出站身份/发送委托和载荷规划
- 当出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时，请使用来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。当平台具有原生线程投递语义时，提供商插件可以覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期和适配器注册
- 仅当仍需要旧版智能体/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令规范化、重复/冲突验证，以及回退稳定的命令配置契约

仅认证渠道通常可以停在默认路径：核心会处理审批，插件只需暴露出站/认证能力。Matrix、Slack、Telegram 以及自定义聊天传输等原生审批渠道应使用共享的原生辅助工具，而不是自行实现审批生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 插件拥有的证据收集
- 共享策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 进行提及策略决策。仅当你需要更宽的入站辅助 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 检测是否回复机器人
- 检测是否引用机器人
- 线程参与检查
- 服务/系统消息排除
- 证明机器人参与所需的平台原生缓存

适合放在共享辅助工具中的内容：

- `requireMention`
- 显式提及结果
- 隐式提及允许列表
- 命令绕过
- 最终跳过决策

推荐流程：

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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露相同的共享提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站运行时辅助工具。

较旧的 `resolveMentionGating*` 辅助工具仍保留在 `openclaw/plugin-sdk/channel-inbound` 上，仅作为兼容性导出。新代码应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段会使其成为渠道插件。有关完整的包元数据界面，请参阅 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 会验证 `plugins.entries.acme-chat.config`。将它用于插件拥有的、不是渠道账户配置的设置。`channelConfigs` 会验证 `channels.acme-chat`，并且是在插件运行时加载前，配置 schema、设置和 UI 界面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选的适配器界面。从最小集合开始，也就是 `id` 和 `setup`，然后按需添加适配器。

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

    <Accordion title="createChatChannelPlugin 为你做什么">
      你无需手动实现低层适配器接口，而是传入声明式选项，构建器会将它们组合起来：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域 DM 安全解析器 |
      | `pairing.text` | 基于文本的 DM 配对流程，包含代码交换 |
      | `threading` | 回复模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。可选的 `ctx.formatting` 携带投递时的格式决策，例如 `maxLinesPerMessage`；请在发送前应用它，这样回复线程和分块边界只由共享出站投递解析一次。发送上下文也会在解析出原生回复目标时包含 `replyToIdSource`（`implicit` 或 `explicit`），这样载荷辅助工具可以保留显式回复标签，而不会消耗隐式的一次性回复槽位。
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

    将渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们，
    同时正常的完整加载仍会获取相同描述符，用于实际命令
    注册。将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专用前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。请参阅
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    选项。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载这个入口，而不是完整入口。
    这样可以避免在设置流程期间引入沉重的运行时代码。
    详情请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到侧车模块的内置工作区渠道，
    如果还需要显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将它们转发给
    OpenClaw。典型模式是使用一个 webhook 验证请求，并
    通过你的渠道入站处理器分发请求：

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
      入站消息处理是渠道特定的。每个渠道插件拥有
      自己的入站流水线。查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）了解真实模式。
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
  <Card title="会话串联选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用的子智能体
  </Card>
</CardGroup>

<Note>
一些内置辅助接缝仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件系列，否则请优先使用通用 SDK
表面的通用渠道/设置/回复/运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/zh-CN/plugins/sdk-testing) — 测试实用工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
