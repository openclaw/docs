---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想要将 OpenClaw 连接到某个消息平台
    - 你需要理解 `ChannelPlugin` 适配器表面
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-07T20:09:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23365b6d92006b30e671f9f0afdba40a2b88c845c5d2299d71c52a52985672f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 构建渠道插件

本指南将带你完成一个渠道插件的构建，该插件用于将 OpenClaw 连接到某个消息平台。完成后，你将拥有一个可正常工作的渠道，具备私信安全、配对、回复线程和出站消息能力。

<Info>
  如果你之前还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins) 以了解基础包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送/编辑/反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 回复如何在线程中组织

核心负责共享消息工具、提示词接线、外层会话键形状、通用的 `:thread:` 记录，以及分发。

如果你的平台会在会话 id 中存储额外的作用域，请将该解析逻辑保留在插件中，使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射到基础会话 id、可选线程 id、显式 `baseConversationId` 和任何 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请保持它们按从最窄父级到最宽/基础会话的顺序排列。

需要在渠道注册表启动前执行相同解析的内置插件，也可以公开一个顶层 `session-key-api.ts` 文件，并导出匹配的 `resolveSessionConversation(...)`。只有当运行时插件注册表尚不可用时，核心才会使用这个可安全引导的表面。

当插件只需要在通用/原始 id 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容回退使用。如果两个钩子都存在，核心会先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要编写与批准特定相关的代码。

- 核心负责同聊天内的 `/approve`、共享批准按钮负载，以及通用回退投递。
- 当渠道需要与批准相关的特定行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。将批准投递/原生/渲染/授权相关信息放到 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取批准授权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准授权扩展点。
- 对于同聊天批准授权可用性，使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道公开原生 exec 批准，请在其与同聊天批准授权不同时，使用 `approvalCapability.getExecInitiatingSurfaceState` 表示发起表面/原生客户端状态。核心会使用这个 exec 专用钩子来区分 `enabled` 与 `disabled`，判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指引中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见场景填充了这一点。
- 对于渠道特定的负载生命周期行为，例如隐藏重复的本地批准提示或在投递前发送输入中指示，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅将 `approvalCapability.delivery` 用于原生批准路由或回退抑制。
- 将 `approvalCapability.nativeRuntime` 用于渠道自有的原生批准信息。对于高频渠道入口点，请通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性加载，这样它可以按需导入你的运行时模块，同时仍让核心组装批准生命周期。
- 仅在渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复解释启用原生 exec 批准所需的确切配置项时，使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；命名账号渠道应渲染账号作用域路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果某个渠道可以从现有配置中推断出稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需添加批准特定的核心逻辑。
- 如果某个渠道需要原生批准投递，请让渠道代码专注于目标规范化以及传输/展示事实。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定信息放在 `approvalCapability.nativeRuntime` 后面，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及“已路由到其他地方”的通知。`nativeRuntime` 被拆分为几个更小的扩展点：
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享批准视图模型映射为待处理/已解决/已过期的原生负载或最终动作
- `transport` — 准备目标并发送/更新/删除原生批准消息
- `interactions` — 原生按钮或反应的可选绑定/解绑/清除动作钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要运行时自有对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用 runtime-context 注册表让核心能够从渠道启动状态引导由能力驱动的处理器，而无需添加批准特定的包装胶水代码。
- 只有当能力驱动的扩展点仍不够表达需求时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助工具同时传递 `accountId` 和 `approvalKind`。`accountId` 可使多账号批准策略限定在正确的机器人账号范围内，而 `approvalKind` 可让渠道在无需核心中硬编码分支的情况下区分 exec 与插件批准行为。
- 核心现在也负责批准改道路由通知。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送它们自己的“批准已发送到私信/另一个渠道”后续消息；请改为通过共享批准能力辅助工具公开准确的源头 + approver 私信路由，让核心在向发起聊天发送任何通知前聚合实际投递结果。
- 在端到端流程中保留已投递批准 id 的种类。原生客户端不应根据渠道本地状态去猜测或重写 exec 与插件批准路由。
- 不同批准种类可以有意公开不同的原生表面。
  当前的内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由能力。
  - Matrix 对 exec 和插件批准保留相同的原生私信/渠道路由和反应 UX，同时仍允许授权随批准种类而不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上公开 `approvalCapability`。

对于高频渠道入口点，如果你只需要其中一个部分，请优先使用这一系列更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样地，当你不需要更宽泛的总表面时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置，具体如下：

- `openclaw/plugin-sdk/setup-runtime` 包含运行时安全的设置辅助工具：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用于 `createEnvPatchedAccountSetupAdapter` 的窄型环境感知适配器扩展点
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装设置构建器以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境变量驱动的设置或授权，并且通用启动/配置流程需要在运行时加载前知道这些环境变量名称，请在插件清单中通过 `channelEnvVars` 声明它们。将渠道运行时 `envVars` 或本地常量仅用于面向操作员的文案。
`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 仅当你还需要更重的共享设置/配置辅助工具时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 扩展点，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置表面中提示“先安装这个插件”，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终化时采用默认拒绝行为，并在验证、完成和文档链接文案中复用相同的“需要安装”消息。

对于其他高频渠道路径，请优先使用窄型辅助工具，而不是更宽泛的旧版表面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 用于多账号配置和默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch` 用于入站路由/封装以及记录与分发接线
- `openclaw/plugin-sdk/messaging-targets` 用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime` 用于媒体加载以及出站身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期和适配器注册
- 仅当仍需要旧版智能体/媒体负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令规范化、重复/冲突校验，以及一个可稳定回退的命令配置契约

仅授权渠道通常只需走默认路径：核心处理批准，插件只暴露出站/授权能力。像 Matrix、Slack、Telegram 和自定义聊天传输这类原生批准渠道，应使用共享的原生辅助工具，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 插件自有的证据收集
- 共享策略评估

共享层请使用 `openclaw/plugin-sdk/channel-inbound`。

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

对于已依赖运行时注入的内置渠道插件，`api.runtime.channel.mentions` 公开了相同的共享提及辅助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

较旧的 `resolveMentionGating*` 辅助工具仍保留在
`openclaw/plugin-sdk/channel-inbound` 中，但仅作为兼容性导出。新代码应使用
`resolveInboundMentionDecision({ facts, policy })`。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    使其成为一个渠道插件。有关完整的包元数据表面，
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
    `ChannelPlugin` 接口有许多可选适配器表面。先从最小集合开始——`id` 和 `setup`——然后按需添加适配器。

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
      你无需手动实现底层适配器接口，而是传入声明式选项，由构建器负责组合：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 基于配置字段的作用域私信安全解析器 |
      | `pairing.text` | 基于文本和验证码交换的私信配对流程 |
      | `threading` | 回复模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 id）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是这些声明式选项。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw 就能在不激活完整渠道运行时的情况下，在根帮助中显示它们；而普通完整加载仍会拾取相同的描述符以进行真实命令注册。将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用插件特定前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析到 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部选项，请参见
    [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载它，而不是完整入口。
    这样可以避免在设置流程中拉入沉重的运行时代码。
    详情请参见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发给 OpenClaw。典型模式是一个 webhook：验证请求后，通过你渠道的入站处理器进行分发。

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
      入站消息处理是渠道特定的。每个渠道插件都拥有自己的入站处理管线。请查看内置渠道插件
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

    关于共享测试辅助工具，请参见 [测试](/zh-CN/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带有配置 schema 的清单
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
  <Card title="线程选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
某些内置辅助扩展点仍保留，用于内置插件维护和兼容性。它们并不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件家族，否则应优先使用公共 SDK 表面中的通用渠道/设置/回复/运行时子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema
