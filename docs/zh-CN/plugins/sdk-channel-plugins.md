---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要了解 `ChannelPlugin` 适配器接口
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-25T00:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 451b4f888cfac92ff37dcc5edd3a942c4df5a6081b283eda8321704d6f760162
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你逐步构建一个渠道插件，把 OpenClaw 连接到某个消息平台。完成后，你将拥有一个可工作的渠道，支持私信安全、配对、回复线程以及出站消息。

<Info>
  如果你之前还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构
  和 manifest 设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自带 send/edit/react 工具。OpenClaw 在核心中保留了一个共享的
`message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 如何对回复进行线程关联
- **心跳输入状态** — 针对心跳传递目标的可选 typing/busy 信号

核心负责共享的消息工具、提示词连接、外层会话键形状、通用 `:thread:` 记录以及分发。

如果你的渠道支持在入站回复之外显示输入状态指示器，请在渠道插件上暴露
`heartbeat.sendTyping(...)`。核心会在心跳模型运行开始前，使用已解析的心跳传递目标调用它，并使用共享的输入状态保活/清理生命周期。如果平台需要显式的停止信号，请再添加 `heartbeat.clearTyping(...)`。

如果你的渠道为消息工具增加了携带媒体来源的参数，请通过
`describeMessageTool(...).mediaSourceParams` 暴露这些参数名。核心会使用这个显式列表来完成沙箱路径规范化和出站媒体访问策略，因此插件不需要为提供商特定的头像、附件或封面图参数增加共享核心特判。
优先返回一个按 action 键控的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，
这样无关的 action 就不会继承其他 action 的媒体参数。对于有意在所有暴露 action 中共享的参数，扁平数组依然可用。

如果你的平台在会话 id 中存储了额外作用域，请把解析逻辑保留在插件中，通过 `messaging.resolveSessionConversation(...)` 实现。这是将 `rawId` 映射到基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

如果某些内置插件在渠道注册表启动前也需要执行相同解析，它们还可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。仅当运行时插件注册表尚不可用时，核心才会使用这个启动安全接口。

当插件只需要在通用/raw id 之上增加父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退方案。
如果两个钩子同时存在，核心会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时，才回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件都不需要编写与批准相关的专用代码。

- 核心负责同一聊天中的 `/approve`、共享的批准按钮负载以及通用回退传递。
- 当渠道需要批准专用行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已被移除。请把批准传递/原生渲染/认证事实放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取批准认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接口。
- 对于同一聊天中的批准认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 批准，请在发起界面/原生客户端状态与同一聊天批准认证不同的情况下使用 `approvalCapability.getExecInitiatingSurfaceState`。核心会使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。对于常见情况，`createApproverRestrictedNativeApprovalCapability(...)` 会填充它。
- 对于渠道特定的负载生命周期行为，例如隐藏重复的本地批准提示或在传递前发送输入状态指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在原生批准路由或回退抑制时使用 `approvalCapability.delivery`。
- 对于渠道拥有的原生批准事实，请使用 `approvalCapability.nativeRuntime`。在热点渠道入口点上，使用 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 让它保持惰性加载，这样可以按需导入你的运行时模块，同时仍然让核心能够组装批准生命周期。
- 只有当某个渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 如果渠道希望禁用路径回复中解释启用原生 exec 批准所需的确切配置项，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账号渠道应渲染带账号作用域的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认路径。
- 如果某个渠道可以从现有配置中推断出稳定的类似 owner 的私信身份，请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，在不增加批准专用核心逻辑的情况下限制同一聊天中的 `/approve`。
- 如果某个渠道需要原生批准传递，请让渠道代码聚焦于目标规范化以及传输/展示事实。请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。把渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 完成，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅和“已路由到其他位置”通知。`nativeRuntime` 被拆分为几个更小的接口：
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享的批准视图模型映射为待处理/已解决/已过期的原生负载或最终 action
- `transport` — 准备目标并发送/更新/删除原生批准消息
- `interactions` — 针对原生按钮或反应的可选 bind/unbind/clear-action 钩子
- `observe` — 可选的传递诊断钩子
- 如果渠道需要运行时拥有的对象，例如 client、token、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心能够从渠道启动状态中引导基于能力的处理器，而无需增加批准专用的包装胶水代码。
- 只有当基于能力的接口还不够表达时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须同时通过这些辅助器传递 `accountId` 和 `approvalKind`。`accountId` 让多账号批准策略限定在正确的机器人账号上，`approvalKind` 则让 exec 与插件批准行为在渠道内可用，而不需要在核心中写死分支。
- 现在批准重路由通知也由核心负责。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“批准已发送到私信/其他渠道”后续消息；相反，应通过共享的批准能力辅助器暴露准确的来源 + approver 私信路由，并让核心在向发起聊天回发任何通知前聚合实际传递结果。
- 从头到尾保留已传递批准 id 的种类。原生客户端不应
  基于渠道本地状态去猜测或重写 exec 与插件批准路由。
- 不同的批准类型可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由。
  - Matrix 对 exec 和插件批准都保留相同的原生私信/渠道路由和 reaction 交互体验，同时仍允许认证按批准类型不同而不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍然存在，作为兼容包装器，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于热点渠道入口点，当你只需要这个能力族中的某一部分时，请优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当你不需要更宽泛的总入口接口时，也请优先使用
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置部分，具体如下：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助器：
  导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是窄化的、环境变量感知的适配器
  接口，用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  构建器，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或认证，并且通用启动/配置流程需要在运行时加载前就知道这些环境变量名，请在插件 manifest 中通过 `channelEnvVars` 声明它们。渠道运行时 `envVars` 或本地常量应仅用于面向运维者的文案。

如果你的渠道可能会在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点必须可在只读命令路径中安全导入，并返回这些摘要所需的渠道元数据、设置安全配置适配器、状态适配器以及渠道 secret 目标元数据。不要在 setup 入口中启动 client、listener 或传输运行时。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助器时，才使用更宽的
  `openclaw/plugin-sdk/setup` 接口，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装这个插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终确认时默认拒绝，并在校验、最终确认和文档链接文案中复用相同的安装必需提示。

对于其他热点渠道路径，也应优先使用窄化辅助器，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和
  默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及
  record-and-dispatch 连接
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份/发送委托和负载规划
- 来自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，用于在出站路由应保留显式 `replyToId`/`threadId`，或在基础会话键仍匹配后恢复当前 `:thread:` 会话时使用。提供商插件可以在其平台具有原生线程传递语义时覆盖优先级、后缀行为和线程 id 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- 仅当仍然需要旧版智能体/媒体
  负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及稳定回退的命令
  配置契约

仅认证渠道通常可以停留在默认路径：核心处理批准，而插件只需暴露出站/认证能力。像 Matrix、Slack、Telegram 以及自定义聊天传输这样的原生批准渠道，应使用共享的原生辅助器，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理保持为两层结构：

- 由插件拥有的证据收集
- 共享的策略评估

对于提及策略决策，请使用 `openclaw/plugin-sdk/channel-mention-gating`。
仅当你需要更宽泛的入站辅助器 barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- reply-to-bot 检测
- quoted-bot 检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明 bot 参与的平台原生缓存

适合放在共享辅助器中的内容：

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

`api.runtime.channel.mentions` 为已经依赖运行时注入的
内置渠道插件暴露了相同的共享提及辅助器：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时辅助器。

旧版 `resolveMentionGating*` 辅助器仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但仅作为兼容性导出。新代码
应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和 manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    就是使其成为渠道插件的标识。有关完整的包元数据接口，
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

    `configSchema` 用于校验 `plugins.entries.acme-chat.config`。请将它用于
    不属于渠道账号配置的插件拥有设置。`channelConfigs`
    用于校验 `channels.acme-chat`，并且是在插件运行时加载前供配置
    schema、设置和 UI 界面使用的冷路径数据源。

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口有许多可选适配器接口。先从最小集开始——`id` 和 `setup`——然后按需添加适配器。

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

      // 私信安全：谁可以给 bot 发消息
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 配对：新私信联系人的批准流程
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // 线程处理：如何传递回复
      threading: { topLevelReplyToMode: "reply" },

      // 出站：向平台发送消息
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

    <Accordion title="`createChatChannelPlugin` 为你做了什么">
      你不必手动实现底层适配器接口，而是传入声明式选项，
      由构建器负责组装：

      | 选项 | 它会连接的内容 |
      | --- | --- |
      | `security.dm` | 从配置字段派生的有作用域私信安全解析器 |
      | `pairing.text` | 基于文本代码交换的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是这些声明式选项。
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

    请将渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们，
    而正常的完整加载仍会拾取同一批描述符来完成真实命令
    注册。`registerFull(...)` 仅保留给运行时专用工作。
    如果 `registerFull(...)` 注册了 Gateway 网关 RPC 方法，请使用
    插件专属前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）是保留项，并且始终
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部
    选项，请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw 会在渠道被禁用
    或未配置时加载它，而不是完整入口。
    这样可以避免在设置流程中拉入重量级运行时代码。
    详情请参阅 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    对于将设置安全导出拆分到 sidecar
    模块中的内置工作区渠道，如果它们还需要一个
    显式的设置时运行时 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将其转发给
    OpenClaw。典型模式是一个 webhook，它验证请求并
    通过你的渠道入站处理器进行分发：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 插件管理的认证（你需要自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的入站处理器将消息分发到 OpenClaw。
          // 具体连接方式取决于你的平台 SDK —
          // 可在内置的 Microsoft Teams 或 Google Chat 插件包中查看真实示例。
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
      自己的入站处理流水线。请查看内置渠道插件
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

    有关共享测试辅助器，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带配置 schema 的 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 构建的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如需要）
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程处理选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助器" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
一些内置辅助器接口仍然保留，用于内置插件维护和
兼容性。它们并不是新渠道插件的推荐模式；
除非你是在直接维护那个内置插件家族，否则请优先使用公共 SDK
接口中的通用 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件还提供模型
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件 Manifest](/zh-CN/plugins/manifest) — 完整 Manifest schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [智能体 harness 插件](/zh-CN/plugins/sdk-agent-harness)
