---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想把 OpenClaw 连接到一个消息平台
    - 你需要理解 ChannelPlugin 适配器接口 surface
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-28T00:32:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f005ea0e7928dfb055758e928f10a333979c8e67a0b85353d663940abb6a7b4
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你构建一个把 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可用的渠道，支持私信安全、配对、回复线程和出站消息。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础的包结构和清单设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自带发送 / 编辑 / 反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账户解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信审批流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 回复如何串接在线程中
- **心跳输入状态** — 面向心跳投递目标的可选输入中 / 忙碌信号

核心负责共享消息工具、提示词接线、外层会话键结构、通用 `:thread:` 记录和分发。

如果你的渠道在入站回复之外也支持输入指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的输入状态保活 / 清理生命周期。如果平台需要显式停止信号，请添加 `heartbeat.clearTyping(...)`。

如果你的渠道为消息工具增加了携带媒体来源的参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用这份显式列表来处理沙箱路径标准化和出站媒体访问策略，因此插件不需要在共享核心中为提供商特定的头像、附件或封面图参数添加特殊分支。
优先返回按 action 分组的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关的 action 就不会继承其他 action 的媒体参数。对于有意在所有暴露 action 之间共享的参数，扁平数组仍然可用。

如果你的平台会在会话 id 中存储额外作用域，请将解析逻辑保留在插件内，通过 `messaging.resolveSessionConversation(...)` 处理。这是把 `rawId` 映射为基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽 / 基础会话的顺序排列。

当插件代码需要标准化类似路由的字段、比较子线程与其父路由，或基于 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。该辅助工具会以与核心相同的方式标准化数字线程 id，因此插件应优先使用它，而不是临时写 `String(threadId)` 比较。
具有提供商特定目标语法的插件可以将自己的解析器注入 `resolveChannelRouteTargetWithParser(...)`，同时仍可获得与核心一致的路由目标结构和线程回退语义。

需要在渠道注册表启动前执行相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并提供匹配的 `resolveSessionConversation(...)` 导出。仅当运行时插件注册表尚不可用时，核心才会使用这个对启动安全的接口。

当某个插件只需要在通用 / 原始 id 之上添加父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容性回退使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有当该规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 审批与渠道能力

大多数渠道插件不需要编写特定于审批的代码。

- 核心负责同一聊天中的 `/approve`、共享审批按钮载荷以及通用回退投递。
- 当渠道需要审批特定行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请将审批投递 / 原生 / 渲染 / 认证相关信息放入 `approvalCapability`。
- `plugin.auth` 仅用于登录 / 登出；核心不再从该对象读取审批认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批认证接口。
- 对于同一聊天中的审批认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 审批，请在发起界面 / 原生客户端状态与同一聊天审批认证不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心会使用这个 exec 专用钩子区分 `enabled` 与 `disabled`、判断发起渠道是否支持原生 exec 审批，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见场景补齐了这一点。
- 对于渠道特定的载荷生命周期行为，例如隐藏重复的本地审批提示或在投递前发送输入指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在原生审批路由或回退抑制场景下使用 `approvalCapability.delivery`。
- 对于由渠道拥有的原生审批事实，请使用 `approvalCapability.nativeRuntime`。在高频渠道入口点上，使用 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性，这样它可以按需导入你的运行时模块，同时仍让核心组装审批生命周期。
- 只有当某个渠道确实需要自定义审批载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复准确说明启用原生 exec 审批所需的配置开关时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账户渠道应渲染带账户作用域的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果某个渠道可以从现有配置中推断出稳定的、类似所有者的私信身份，请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，在不向核心添加审批特定逻辑的前提下限制同一聊天中的 `/approve`。
- 如果某个渠道需要原生审批投递，请让渠道代码专注于目标标准化以及传输 / 展示相关事实。请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 之后，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及“已路由到其他位置”通知。`nativeRuntime` 被拆分为几个更小的接口：
- `createChannelNativeOriginTargetResolver` 默认使用共享的渠道路由匹配器来处理 `{ to, accountId, threadId }` 目标。只有当渠道具有提供商特定的等价规则（例如 Slack 时间戳前缀匹配）时，才传入 `targetsMatch`。
- 当渠道需要在默认路由匹配器或自定义 `targetsMatch` 回调运行前，对提供商 id 做规范化，同时保留原始目标用于投递时，请向 `createChannelNativeOriginTargetResolver` 传入 `normalizeTargetForMatch`。只有当已解析的投递目标本身也应被规范化时，才使用 `normalizeTarget`。
- `availability` — 账户是否已配置，以及某个请求是否应被处理
- `presentation` — 将共享审批视图模型映射为待处理 / 已解决 / 已过期的原生载荷或最终动作
- `transport` — 准备目标并发送 / 更新 / 删除原生审批消息
- `interactions` — 面向原生按钮或反应的可选绑定 / 解绑 / 清除动作钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。这个通用运行时上下文注册表让核心可以从渠道启动状态引导基于能力的处理器，而无需添加审批专用包装胶水代码。
- 只有当基于能力的接口还不够有表达力时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批渠道必须通过这些辅助工具同时传递 `accountId` 和 `approvalKind`。`accountId` 让多账户审批策略限定在正确的机器人账户范围内，而 `approvalKind` 让渠道可在不在核心中硬编码分支的情况下区分 exec 与插件审批行为。
- 核心现在也负责审批重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“审批已发送到私信 / 其他渠道”后续消息；相反，应通过共享审批能力辅助工具暴露准确的源路由 + 审批者私信路由，并让核心在向发起聊天回发任何通知前，先聚合实际投递结果。
- 在端到端流程中保留已投递审批 id 的种类。原生客户端不应根据渠道本地状态去猜测或重写 exec 与插件审批路由。
- 不同审批种类可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生审批路由能力。
  - Matrix 对 exec 和插件审批都保留相同的原生私信 / 渠道路由和 reaction UX，同时仍允许认证逻辑按审批种类区分。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于高频渠道入口点，如果你只需要该家族中的某一部分，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你不需要更宽泛的 umbrella 接口时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`。

对于设置，尤其如此：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助工具：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找备注输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向 `createEnvPatchedAccountSetupAdapter` 的窄型、环境变量感知适配器接口
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装的设置构建器以及一些设置安全的基础能力：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或认证，并且通用启动 / 配置流程需要在运行时加载前就知道这些环境变量名称，请在插件清单中使用 `channelEnvVars` 声明它们。请将渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。

如果你的渠道可能会在插件运行时启动之前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应当能够安全地在只读命令路径中导入，并应返回这些摘要所需的渠道元数据、设置安全的配置适配器、状态适配器以及渠道 secret target 元数据。不要从 setup 入口启动客户端、监听器或传输运行时。

同时也要保持主渠道入口的导入路径足够窄。设备发现可以在不激活渠道的情况下，对入口和渠道插件模块进行求值以注册能力。像 `channel-plugin-api.ts` 这样的文件应导出渠道插件对象，而不要导入设置向导、传输客户端、socket 监听器、子进程启动器或服务启动模块。请将这些运行时部分放入由 `registerFull(...)`、运行时 setter 或惰性能力适配器加载的模块中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置 / 配置辅助工具（例如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接口

如果你的渠道只想在设置界面中提示“先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器 / 向导会在配置写入和最终确定时默认关闭，并会在校验、最终确定和文档链接文案中复用同一条“需要先安装”的消息。

对于其他高频渠道路径，请优先使用这些窄型辅助工具，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由 / 信封以及记录与分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析 / 匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站身份 / 发送委托和载荷规划
- 来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，当某条出站路由应保留显式 `replyToId` / `threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时使用。提供商插件可以在其平台具有原生线程投递语义时，覆盖优先级、后缀行为和线程 id 标准化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期和适配器注册
- 仅当仍然需要旧版 agent / media 载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令标准化、重复 / 冲突校验，以及稳定回退的命令配置契约

仅认证渠道通常可以停留在默认路径：核心负责审批，而插件只暴露出站 / 认证能力。像 Matrix、Slack、Telegram 和自定义聊天传输这样的原生审批渠道，应使用共享的原生辅助工具，而不是自己实现审批生命周期。

## 入站提及策略

将入站提及处理拆分为两层：

- 由插件负责收集证据
- 使用共享策略进行评估

提及策略决策请使用 `openclaw/plugin-sdk/channel-mention-gating`。
只有在你需要更宽泛的入站辅助工具 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复机器人检测
- 引用机器人检测
- 线程参与检查
- 服务 / 系统消息排除
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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露了相同的共享提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站运行时辅助工具。

较旧的 `resolveMentionGating*` 辅助工具仍然保留在 `openclaw/plugin-sdk/channel-inbound` 上，但仅作为兼容性导出。新代码应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段就是让它成为渠道插件的关键。有关完整的包元数据接口，请参见 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclaw-channel)：

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
              "label": "机器人令牌",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 用于校验 `plugins.entries.acme-chat.config`。请将它用于并非渠道账户配置的插件自有设置。`channelConfigs` 用于校验 `channels.acme-chat`，并且是在插件运行时加载之前，供配置 schema、设置和 UI 界面使用的冷路径来源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口包含许多可选适配器接口。先从最小集开始——`id` 和 `setup`——然后按需添加适配器。

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

    <Accordion title="`createChatChannelPlugin` 为你完成了什么">
      你无需手动实现底层适配器接口，而是传入声明式选项，由构建器负责组合：

      | 选项 | 它接线的内容 |
      | --- | --- |
      | `security.dm` | 基于配置字段的作用域化私信安全解析器 |
      | `pairing.text` | 基于文本和验证码交换的私信配对流程 |
      | `threading` | 回复模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是这些声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带投递时的格式化决策，例如 `maxLinesPerMessage`；请在发送前应用它，这样回复线程和分块边界就只需由共享出站投递解析一次。
      发送上下文还包含 `replyToIdSource`（`implicit` 或 `explicit`），当原生回复目标已解析时可用，因此载荷辅助工具可以保留显式回复标签，而不会消耗一次性的隐式回复槽位。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw 就能在不激活完整渠道运行时的情况下，在根帮助信息里显示它们；而常规完整加载时，也仍会拾取相同的描述符以注册真实命令。请将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 要注册 Gateway 网关 RPC 方法，请使用插件专用前缀。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。所有选项请参见 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载这个入口，而不是完整入口。
    这样可以避免在设置流程中拉取较重的运行时代码。详情请参见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar
    模块中的内置工作区渠道，如果还需要一个显式的设置阶段运行时 setter，可以使用来自
    `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将其转发给 OpenClaw。典型模式是一个 webhook，用于校验请求并通过你的渠道入站处理器分发它：

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
      入站消息处理是渠道特定的。每个渠道插件都拥有自己的入站流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）以了解真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
编写同目录测试文件 `src/channel.test.ts`：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat 插件", () => {
      it("从配置中解析账户", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("在不具体化 secrets 的情况下检查账户", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("报告缺失的配置", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    关于共享测试辅助工具，请参见 [测试](/zh-CN/plugins/sdk-testing)。

</Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带配置 schema 的清单
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
  <Card title="线程处理选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
某些内置辅助接口仍然存在，用于内置插件维护和兼容性。
它们并不是新渠道插件的推荐模式；除非你正在直接维护该内置插件家族，否则请优先使用通用 SDK 接口中的渠道 / 设置 / 回复 / 运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
