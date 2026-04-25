---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要了解 `ChannelPlugin` 适配器接口
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-25T01:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac64ec8cc8963eaa5aff862e9b318951a156f10c2f6963cd7fce24780fb028ac
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你逐步构建一个渠道插件，把 OpenClaw 连接到某个消息平台。完成后，你将拥有一个可用的渠道，支持私信安全策略、配对、回复线程，以及出站消息发送。

<Info>
  如果你之前还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和清单设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自带 send/edit/react 工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** —— 账户解析和设置向导
- **安全** —— 私信策略和允许列表
- **配对** —— 私信批准流程
- **会话语法** —— 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** —— 向平台发送文本、媒体和投票
- **线程处理** —— 回复如何在线程中组织
- **心跳输入状态** —— 用于心跳投递目标的可选 typing/busy 信号

核心负责共享的消息工具、提示词接线、外层会话键形状、通用的 `:thread:` 记录，以及分发。

如果你的渠道支持在入站回复之外显示 typing 指示器，请在渠道插件上暴露
`heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的 typing 保活/清理生命周期。如果平台需要显式停止信号，请再添加 `heartbeat.clearTyping(...)`。

如果你的渠道为消息工具添加了携带媒体来源的参数，请通过
`describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用这个显式列表来进行沙箱路径规范化和出站媒体访问策略处理，因此插件不需要在共享核心中为提供商特定的头像、附件或封面图参数添加特殊分支。
优先返回按 action 键控的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关的 action 就不会继承其他 action 的媒体参数。对于有意在所有暴露 action 之间共享的参数，扁平数组仍然可用。

如果你的平台在会话 id 中存储了额外作用域，请把这部分解析保留在插件中，使用
`messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射为基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请保持从最窄父级到最宽/基础会话的顺序。

如果某些内置插件需要在渠道注册表启动之前完成相同的解析，它们也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。只有在运行时插件注册表尚不可用时，核心才会使用这个可安全引导的接口。

当某个插件只需要在通用/raw id 之上提供父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退继续使用。如果两个钩子都存在，核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准与渠道能力

大多数渠道插件不需要编写批准专用代码。

- 核心负责同聊天内的 `/approve`、共享的批准按钮负载，以及通用回退投递。
- 当渠道需要批准专用行为时，优先在渠道插件上提供一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请把批准投递/原生渲染/凭证相关信息放到 `approvalCapability` 中。
- `plugin.auth` 仅用于 login/logout；核心不再从该对象读取批准认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接口。
- 对于同聊天批准认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 批准，请在发起界面/原生客户端状态与同聊天批准认证不同时，使用 `approvalCapability.getExecInitiatingSurfaceState`。核心会使用这个 exec 专用钩子来区分 `enabled` 和 `disabled`，判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见场景填充了这部分。
- 对于渠道特定的负载生命周期行为，例如隐藏重复的本地批准提示或在投递前发送 typing 指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在需要原生批准路由或抑制回退时使用 `approvalCapability.delivery`。
- 使用 `approvalCapability.nativeRuntime` 表达由渠道拥有的原生批准信息。在高频渠道入口点保持其懒加载，使用 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，它可以按需导入你的运行时模块，同时仍允许核心组装批准生命周期。
- 只有当渠道确实需要自定义批准负载而不是使用共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望在禁用路径回复中说明启用原生 exec 批准所需的精确配置项时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子会接收 `{ channel, channelLabel, accountId }`；具名账户渠道应渲染带账户作用域的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果某个渠道可以从现有配置中推断出稳定的、类似 owner 的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需在核心中添加批准专用逻辑。
- 如果某个渠道需要原生批准投递，请让渠道代码专注于目标规范化以及传输/展示事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。把渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅，以及“已路由到其他位置”的通知。`nativeRuntime` 被拆分为几个更小的接口：
- `availability` —— 账户是否已配置，以及请求是否应被处理
- `presentation` —— 将共享批准视图模型映射为待处理/已解决/已过期的原生负载或最终 action
- `transport` —— 准备目标并发送/更新/删除原生批准消息
- `interactions` —— 原生按钮或 reaction 的可选 bind/unbind/clear-action 钩子
- `observe` —— 可选的投递诊断钩子
- 如果渠道需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用的运行时上下文注册表让核心可以从渠道启动状态中引导由能力驱动的处理器，而无需添加批准专用的包装胶水代码。
- 只有在能力驱动接口仍不足以表达需求时，才考虑更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助工具同时传递 `accountId` 和 `approvalKind`。`accountId` 使多账户批准策略能限定在正确的机器人账户范围内，而 `approvalKind` 使渠道能够区分 exec 与插件批准行为，而无需在核心中写死分支。
- 核心现在也负责批准重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“批准已发往私信/另一渠道”后续消息；应改为通过共享批准能力辅助工具暴露准确的 origin + approver 私信路由，让核心在向发起聊天回发通知之前，先聚合实际投递结果。
- 在端到端流程中保留已投递批准 id 的种类。原生客户端不应根据渠道本地状态去猜测或重写 exec 与插件批准路由。
- 不同的批准种类可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由能力。
  - Matrix 对 exec 和插件批准保持相同的原生私信/渠道路由和 reaction UX，同时仍允许认证随批准种类不同而变化。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容包装器存在，但新代码应优先使用 capability builder，并在插件上暴露 `approvalCapability`。

对于高频渠道入口点，如果你只需要该系列中的某一部分，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总括接口时，请优先使用
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置，具体来说：

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助工具：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` 是
  `createEnvPatchedAccountSetupAdapter` 的窄范围、环境变量感知适配器接口
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装设置 builder，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持基于环境变量的设置或认证，并且通用启动/配置流程需要在运行时加载前就知道这些环境变量名，请在插件清单中使用 `channelEnvVars` 进行声明。保留渠道运行时 `envVars` 或本地常量，仅用于面向运维者的文案。

如果你的渠道可能会在插件运行时启动之前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应能在只读命令路径中安全导入，并返回这些摘要所需的渠道元数据、设置安全配置适配器、状态适配器，以及渠道 secret target 元数据。不要从设置入口启动客户端、监听器或传输运行时。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重型的共享设置/配置辅助工具时，才使用更宽泛的
  `openclaw/plugin-sdk/setup` 接口，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只是想在设置界面中提示“请先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终确认时默认拒绝，并在校验、最终确认和文档链接文案中复用同一条“需要先安装”的消息。

对于其他高频渠道路径，也请优先使用窄接口辅助工具，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及
  record-and-dispatch 接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  identity/send 委托和负载规划
- 来自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，
  当某个出站路由需要保留显式的 `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前 `:thread:` 会话时使用。
  当平台具有原生线程投递语义时，提供商插件可以覆盖优先级、后缀行为和线程 id 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- `openclaw/plugin-sdk/agent-media-payload`，仅在仍需要旧版 agent/media
  负载字段布局时使用
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及稳定回退的命令
  配置契约

仅认证型渠道通常可以止步于默认路径：核心处理批准，插件只需暴露出站/认证能力。像 Matrix、Slack、Telegram 以及自定义聊天传输这类原生批准渠道，应使用共享的原生辅助工具，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 由插件拥有的证据收集
- 共享的策略评估

使用 `openclaw/plugin-sdk/channel-mention-gating` 做提及策略决策。
仅当你需要更宽泛的入站辅助 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复机器人检测
- 引用机器人检测
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
2. 将这些事实传给 `resolveInboundMentionDecision({ facts, policy })`。
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

`api.runtime.channel.mentions` 为已依赖运行时注入的内置渠道插件暴露了同一组共享提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助工具。

较旧的 `resolveMentionGating*` 辅助工具仍保留在
`openclaw/plugin-sdk/channel-inbound` 中，但仅作为兼容性导出。新代码应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    会将其标记为一个渠道插件。关于完整的包元数据接口，
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
              "label": "机器人令牌",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 用于校验 `plugins.entries.acme-chat.config`。请将它用于
    由插件拥有、但不属于渠道账户配置的设置。`channelConfigs`
    用于校验 `channels.acme-chat`，并且是在插件运行时加载之前，
    供配置 schema、设置和 UI 界面使用的冷路径数据源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选的适配器接口。先从
    最小集开始——`id` 和 `setup`——然后按需添加适配器。

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
      你无需手动实现底层适配器接口，而是传入声明式选项，
      由 builder 负责组合它们：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 从配置字段解析带作用域的私信安全策略 |
      | `pairing.text` | 基于文本和验证码交换的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以直接传入原始适配器对象，
      而不是这些声明式选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。
      可选的 `ctx.formatting` 携带投递时的格式化决策，
      例如 `maxLinesPerMessage`；请在发送前应用它，
      这样回复线程和分块边界就能由共享的出站投递统一解析一次。
      发送上下文还包括 `replyToIdSource`（`implicit` 或 `explicit`），
      当某个原生回复目标已被解析时，负载辅助工具就可以保留显式回复标签，
      而不会消耗隐式的单次回复槽位。
    </Accordion>

  </Step>

  <Step title="接线入口点">
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

    将由渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们，
    同时普通的完整加载仍会拾取同一组描述符以进行真实的命令注册。
    请把 `registerFull(...)` 保留给仅限运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专用前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关
    所有选项，请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载它，而不是完整入口。
    这样可以避免在设置流程中拉入较重的运行时代码。
    详情请参阅 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    对于将设置安全导出拆分到 sidecar
    模块中的内置工作区渠道，如果它们还需要一个显式的设置期运行时 setter，
    可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将其转发给
    OpenClaw。典型模式是使用 webhook 来验证请求，并通过你渠道的入站处理器进行分发：

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
      （例如 Microsoft Teams 或 Google Chat 插件包）以获取真实模式。
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
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带配置 schema 的清单
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 构建的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如有需要）
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
    通过 api.runtime 使用 TTS、STT、媒体、subagent
  </Card>
</CardGroup>

<Note>
一些内置辅助接口仍然保留，用于内置插件维护和兼容性。
它们并不是新渠道插件的推荐模式；
除非你是在直接维护该内置插件家族，否则请优先使用通用 SDK
接口中的 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 如果你的插件还提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 完整的子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) —— 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) —— 完整清单 schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
