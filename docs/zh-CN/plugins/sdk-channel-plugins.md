---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要理解 ChannelPlugin 适配器接口
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-07T18:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b709fda7527fcf437b119c4668172804f2f9c9a46f5e39a2161467a4f5f1e42f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 构建渠道插件

本指南将带你逐步构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可用的渠道，支持私信安全、配对、回复线程和出站消息。

<Info>
  如果你之前还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins) 以了解基础的软件包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送/编辑/反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账户解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 回复如何串入线程

核心负责共享的消息工具、提示词接线、外层会话键形状、通用的 `:thread:` 记录以及分发。

如果你的平台在会话 id 中存储了额外作用域，请将该解析逻辑保留在插件中，并使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射为基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

需要在渠道注册表启动前进行相同解析的内置插件，也可以暴露一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`。只有在运行时插件注册表尚不可用时，核心才会使用这个对引导安全的接口。

当插件只需要在通用/原始 id 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，仅当该规范钩子未提供这些值时，才回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要批准专用代码。

- 核心负责同一聊天中的 `/approve`、共享的批准按钮负载，以及通用回退投递。
- 当渠道需要批准专用行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已被移除。请将批准投递/原生/渲染/认证相关信息放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象中读取批准认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接口。
- 对于同一聊天中的批准认证可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道暴露原生 exec 批准，当其与同一聊天批准认证不同时，请使用 `approvalCapability.getExecInitiatingSurfaceState` 来表示发起界面/原生客户端状态。核心使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`、判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 可为常见场景补齐这一点。
- 对于渠道专用的负载生命周期行为，例如隐藏重复的本地批准提示或在投递前发送输入中指示，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅将 `approvalCapability.delivery` 用于原生批准路由或回退抑制。
- 对于由渠道持有的原生批准信息，请使用 `approvalCapability.nativeRuntime`。在热门渠道入口点上，请通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性加载，它可以按需导入你的运行时模块，同时仍让核心组装批准生命周期。
- 仅当渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复解释启用原生 exec 批准所需的确切配置项时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；具名账户渠道应渲染带账户作用域的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置中推断出稳定的类所有者私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天中的 `/approve`，而无需添加批准专用的核心逻辑。
- 如果渠道需要原生批准投递，请让渠道代码专注于目标规范化以及传输/呈现相关事实。请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放到 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器，并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及“已在其他位置路由”的通知。`nativeRuntime` 被拆分为几个更小的接口：
- `availability` — 账户是否已配置，以及某个请求是否应被处理
- `presentation` — 将共享的批准视图模型映射为待处理/已解决/已过期的原生负载或最终动作
- `transport` — 准备目标，并发送/更新/删除原生批准消息
- `interactions` — 原生按钮或反应的可选 bind/unbind/clear-action 钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要由运行时持有的对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 进行注册。通用的运行时上下文注册表让核心能够从渠道启动状态引导基于能力的处理器，而无需添加批准专用的包装胶水代码。
- 只有当基于能力的接口仍不足以表达你的需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助工具同时传递 `accountId` 和 `approvalKind`。`accountId` 可使多账户批准策略限定在正确的机器人账户范围内，而 `approvalKind` 则使 exec 与插件批准行为可供渠道使用，而无需在核心中编写硬编码分支。
- 核心现在也负责批准重路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“批准已发送到私信/另一个渠道”后续消息；相反，应通过共享的批准能力辅助工具暴露准确的来源 + 批准者私信路由，并让核心在向发起聊天回发任何通知前聚合实际投递结果。
- 在端到端流程中保留已投递批准 id 的类型。原生客户端不应根据渠道本地状态猜测或重写 exec 与插件批准的路由。
- 不同的批准类型可以有意暴露不同的原生界面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由能力。
  - Matrix 对 exec 和插件批准保持相同的原生私信/渠道路由和反应 UX，同时仍允许批准类型之间的认证不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于热门渠道入口点，当你只需要这一族中的某一部分时，优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总入口接口时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`。

对于设置，具体来说：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助工具：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 和委托式
  设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向环境变量的窄适配器接口，
  用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置构建器以及一些设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或认证，并且通用启动/配置流程需要在运行时加载之前知道这些环境变量名，请在插件清单中通过 `channelEnvVars` 声明它们。将渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。
`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助工具时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接口，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“请先安装此插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终确定时默认关闭，并在校验、finalize 和文档链接文案中复用同一条“需要安装”的消息。

对于其他热门渠道路径，请优先使用窄辅助工具，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 用于多账户配置和
  默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch` 用于入站路由/信封以及
  记录并分发的接线
- `openclaw/plugin-sdk/messaging-targets` 用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime` 用于媒体加载以及出站
  身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期
  和适配器注册
- 仅当仍需要旧版智能体/媒体负载字段布局时，
  才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及稳定回退的命令
  配置契约

仅认证渠道通常可以止步于默认路径：核心处理批准，而插件只暴露出站/认证能力。像 Matrix、Slack、Telegram 和自定义聊天传输这类原生批准渠道，应使用共享的原生辅助工具，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 插件负责的证据收集
- 共享的策略评估

共享层请使用 `openclaw/plugin-sdk/channel-inbound`。

适合插件本地逻辑的内容：

- 回复机器人检测
- 引用机器人检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明机器人参与的平台原生缓存

适合共享辅助工具的内容：

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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件暴露了相同的共享提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

较旧的 `resolveMentionGating*` 辅助工具仍保留在
`openclaw/plugin-sdk/channel-inbound` 中，但仅作为兼容性导出。新代码
应使用 `resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="软件包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    用于将其标记为渠道插件。有关完整的软件包元数据接口，
    请参见 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclawchannel)：

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
    `ChannelPlugin` 接口有许多可选适配器接口。先从最小集合开始
    —— `id` 和 `setup` —— 然后按需添加适配器。

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

    <Accordion title="createChatChannelPlugin 为你做了什么">
      你无需手动实现底层适配器接口，只需传入声明式选项，
      构建器就会将它们组合起来：

      | 选项 | 它接线的内容 |
      | --- | --- |
      | `security.dm` | 从配置字段解析带作用域的私信安全策略 |
      | `pairing.text` | 通过验证码交换实现基于文本的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账户作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以直接传入原始适配器对象，而不是声明式选项。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就能在不激活完整渠道运行时的情况下，在根帮助中显示它们；
    同时，正常的完整加载也会拾取这些相同的描述符，用于真正的命令注册。
    将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件专属前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）仍为保留项，并始终
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部
    选项，请参见 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，以便在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或未配置时，OpenClaw 会加载这个入口，而不是完整入口。
    这样可以避免在设置流程中拉入沉重的运行时代码。
    详情请参见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发给 OpenClaw。典型模式是
    一个 webhook：验证请求，然后通过你渠道的入站处理器进行分发：

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
      自己的入站处理流水线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）以了解真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
编写同目录测试文件 `src/channel.test.ts`：

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

    有关共享测试辅助工具，请参见 [测试](/zh-CN/plugins/sdk-testing)。

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
    固定、账户作用域或自定义回复模式
  </Card>
  <Card title="message 工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    TTS、STT、媒体、通过 api.runtime 使用的子智能体
  </Card>
</CardGroup>

<Note>
一些内置辅助工具接口仍然存在，用于内置插件维护和
兼容性。对于新的渠道插件，它们不是推荐模式；
除非你正在直接维护该内置插件家族，否则请优先使用通用 SDK
接口中的 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema
