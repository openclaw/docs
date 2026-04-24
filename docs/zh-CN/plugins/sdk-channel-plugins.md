---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要理解 `ChannelPlugin` 适配器接口 surface
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-24T03:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

本指南将带你逐步构建一个渠道插件，用于将 OpenClaw 连接到某个消息平台。完成后，你将拥有一个可用的渠道，支持私信安全、配对、回复线程和出站消息。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins) 了解基础包结构和 manifest 设置。
</Info>

## 渠道插件的工作方式

渠道插件不需要自带发送/编辑/反应工具。OpenClaw 在 core 中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 回复如何进入线程
- **心跳输入状态** — 为心跳投递目标提供可选的输入中/忙碌信号

core 负责共享的消息工具、提示词接线、外层会话键形状、通用的 `:thread:` 记录和分发。

如果你的渠道支持在入站回复之外显示输入指示器，请在渠道插件上暴露 `heartbeat.sendTyping(...)`。core 会在心跳模型运行开始前，使用已解析的心跳投递目标调用它，并使用共享的输入状态保活/清理生命周期。如果平台需要显式停止信号，请再添加 `heartbeat.clearTyping(...)`。

如果你的渠道为消息工具添加了携带媒体来源的参数，请通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名。core 使用这个显式列表进行沙箱路径标准化和出站媒体访问策略处理，因此插件不需要为提供商特定的头像、附件或封面图参数添加共享 core 特判。
更推荐返回按 action 键控的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，这样无关 action 就不会继承其他 action 的媒体参数。对于有意在每个已暴露 action 之间共享的参数，扁平数组仍然可用。

如果你的平台在会话 id 中存储了额外作用域，请将这类解析逻辑保留在插件中，使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射为基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

需要在渠道注册表启动之前进行同样解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`。仅当运行时插件注册表尚不可用时，core 才会使用这个启动安全的接口。

当插件只需要在通用/原始 id 之上添加父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍然可作为旧版兼容回退使用。如果这两个钩子都存在，core 会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要编写专门的批准代码。

- core 负责同聊天中的 `/approve`、共享批准按钮负载和通用回退投递。
- 当渠道需要与批准相关的行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请将批准投递/原生/渲染/认证相关事实放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；core 不再从该对象读取批准认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接口。
- 对于同聊天批准认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 批准，请在发起界面/原生客户端状态与同聊天批准认证不同的情况下使用 `approvalCapability.getExecInitiatingSurfaceState`。core 使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`、判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见情况填充了这部分。
- 对于渠道特定的负载生命周期行为，例如隐藏重复的本地批准提示或在投递前发送输入指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在原生批准路由或回退抑制中使用 `approvalCapability.delivery`。
- 对于渠道拥有的原生批准事实，请使用 `approvalCapability.nativeRuntime`。在高热度渠道入口点中，通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性加载；这样它可以按需导入你的运行时模块，同时仍允许 core 组装批准生命周期。
- 只有当渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望在禁用路径的回复中解释启用原生 exec 批准所需的确切配置开关时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；命名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置中推断出稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而不要增加批准专用的 core 逻辑。
- 如果渠道需要原生批准投递，请让渠道代码聚焦于目标标准化以及传输/展示事实。请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样 core 就可以组装处理器并负责请求过滤、路由、去重、过期、Gateway 网关订阅和“已路由到其他位置”的通知。`nativeRuntime` 被拆分为几个更小的接口：
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享批准视图模型映射为待处理/已解决/已过期的原生负载或最终 action
- `transport` — 准备目标，并发送/更新/删除原生批准消息
- `interactions` — 原生按钮或反应的可选 bind/unbind/clear-action 钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要运行时持有的对象，例如 client、token、Bolt app 或 webhook receiver，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表使 core 能够从渠道启动状态中引导基于 capability 的处理器，而无需添加批准专用的包装胶水代码。
- 只有当基于 capability 的接口还不足以表达需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些 helper 同时路由 `accountId` 和 `approvalKind`。`accountId` 可将多账号批准策略限定到正确的机器人账号上，而 `approvalKind` 可让渠道在无需 core 中硬编码分支的情况下区分 exec 与插件批准行为。
- core 现在也负责批准重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 自行发送“批准已发送到私信/其他渠道”这类后续消息；请改为通过共享批准 capability helper 暴露准确的 origin + approver 私信路由，让 core 在向发起聊天回发任何通知前聚合实际投递结果。
- 在端到端流程中保留已投递批准 id 的 kind。原生客户端不应根据渠道本地状态猜测或重写 exec 与插件批准的路由。
- 不同批准 kind 可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由能力。
  - Matrix 对 exec 和插件批准保持相同的原生私信/渠道路由和 reaction UX，同时仍允许认证按批准 kind 不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容包装器存在，但新代码应优先使用 capability builder，并在插件上暴露 `approvalCapability`。

对于高热度渠道入口点，当你只需要该能力族中的某一部分时，优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总接口时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

关于设置，具体如下：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置 helper：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找备注输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向环境感知适配器的窄接口，
  用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置 builder 以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或认证，并且通用启动/配置流程需要在运行时加载前知道这些环境变量名称，请在插件 manifest 中通过 `channelEnvVars` 声明它们。渠道运行时的 `envVars` 或本地常量应仅用于面向运维人员的文案。

如果你的渠道可能在插件运行时启动前出现在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应当可以在只读命令路径中安全导入，并返回这些摘要所需的渠道元数据、设置安全配置适配器、状态适配器和渠道 secret 目标元数据。不要从 setup 入口启动 client、listener 或传输运行时。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重型的共享设置/配置 helper 时，才使用更宽泛的
  `openclaw/plugin-sdk/setup` 接口，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“先安装这个插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的 adapter/wizard 在配置写入和最终完成上会失败关闭，并会在验证、完成和文档链接文案之间复用同一条“需要先安装”的消息。

对于其他高热度渠道路径，也请优先使用窄 helper，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和
  默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/envelope 以及
  记录并分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份/发送委托和负载规划
- `buildThreadAwareOutboundSessionRoute(...)`，来自
  `openclaw/plugin-sdk/channel-core`，当出站路由应保留显式
  `replyToId`/`threadId`，或在基础会话键仍然匹配后恢复当前
  `:thread:` 会话时使用。提供商插件可以在其平台具有原生线程投递语义时，
  覆盖优先级、后缀行为和线程 id 标准化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- `openclaw/plugin-sdk/agent-media-payload`，仅在仍然需要旧版 agent/media
  负载字段布局时使用
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  标准化、重复/冲突校验，以及回退稳定的命令
  配置契约

仅认证型渠道通常可以停留在默认路径：core 处理批准，而插件只需暴露出站/认证能力。像 Matrix、Slack、Telegram 和自定义聊天传输这样的原生批准渠道，应使用共享的原生 helper，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 由插件负责的证据收集
- 共享策略评估

提及策略决策请使用 `openclaw/plugin-sdk/channel-mention-gating`。
只有在你需要更宽泛的入站
helper barrel 时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复机器人检测
- 引用机器人检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明机器人参与的平台原生缓存

适合放在共享 helper 中的内容：

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

对于已经依赖运行时注入的内置渠道插件，
`api.runtime.channel.mentions` 暴露了同一组共享提及 helper：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，请从
`openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载无关的入站
运行时 helper。

较旧的 `resolveMentionGating*` helper 仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但仅作为兼容导出。新代码
应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和 manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    使其成为一个渠道插件。有关完整的包元数据接口，
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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="构建渠道插件对象">
    `ChannelPlugin` 接口包含许多可选的适配器接口。从最小集合开始——
    `id` 和 `setup`——然后按需添加适配器。

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

    <Accordion title="`createChatChannelPlugin` 为你做了什么">
      你无需手动实现底层适配器接口，而是传入声明式选项，
      由 builder 负责组合它们：

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver from config fields |
      | `pairing.text` | Text-based DM pairing flow with code exchange |
      | `threading` | Reply-to-mode resolver (fixed, account-scoped, or custom) |
      | `outbound.attachedResults` | Send functions that return result metadata (message IDs) |

      如果你需要完全控制，也可以传入原始适配器对象，
      而不是声明式选项。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就可以在不激活完整渠道运行时的情况下，在根帮助中显示它们；
    同时常规完整加载仍会获取相同描述符，用于真实命令注册。
    `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专属前缀。core 管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，
    并始终解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部
    选项，请参见 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加 setup 入口">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载这个入口，而不是完整入口。
    这可以避免在设置流程中拉入沉重的运行时代码。
    详情请参见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到 sidecar
    模块中的内置工作区渠道，如果还需要显式的 setup 时运行时 setter，
    可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息，并将其转发给
    OpenClaw。典型模式是使用 webhook 验证请求，然后通过你的渠道入站处理器
    进行分发：

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
      入站消息处理是渠道特定的。每个渠道插件都负责
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

    有关共享测试 helper，请参见 [测试](/zh-CN/plugins/sdk-testing)。

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
    describeMessageTool 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时 helper" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、subagent
  </Card>
</CardGroup>

<Note>
一些内置 helper 接口仍然存在，用于内置插件维护和
兼容性。它们不是新渠道插件的推荐模式；
除非你是在直接维护该内置插件家族，否则请优先使用通用 SDK
接口中的 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件 Manifest](/zh-CN/plugins/manifest) — 完整 manifest schema

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [智能体 harness 插件](/zh-CN/plugins/sdk-agent-harness)
