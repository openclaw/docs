---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到一个消息平台
    - 你需要了解 `ChannelPlugin` 适配器接口 surface
sidebarTitle: Channel Plugins
summary: 为 OpenClaw 构建消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-10T20:41:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 构建渠道插件

本指南将带你构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可工作的渠道，具备私信安全、配对、回复线程处理以及出站消息能力。

<Info>
  如果你之前还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送/编辑/响应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 回复如何在线程中组织

核心负责共享的消息工具、提示词接线、外层会话键形状、通用 `:thread:` 记录以及分发。

如果你的平台在会话 id 中存储了额外作用域，请将该解析逻辑保留在插件中，并使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射为基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽泛/基础会话的顺序排列。

需要在渠道注册表启动之前执行相同解析的内置插件，也可以公开一个顶层 `session-key-api.ts` 文件，并提供匹配的 `resolveSessionConversation(...)` 导出。只有在运行时插件注册表尚不可用时，核心才会使用这个可安全用于引导的接口。

当插件只需要在通用/原始 id 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍然可作为旧版兼容回退方案使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有在规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要特定于批准的代码。

- 核心负责同一聊天中的 `/approve`、共享的批准按钮负载以及通用回退投递。
- 当渠道需要特定于批准的行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已移除。请将批准投递/原生/渲染/鉴权相关信息放到 `approvalCapability` 中。
- `plugin.auth` 仅用于登录/登出；核心不再从该对象读取批准鉴权钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准鉴权接口。
- 对于同一聊天中的批准鉴权可用性，请使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的渠道公开原生 exec 批准，请在发起界面/原生客户端状态与同一聊天中的批准鉴权不同时使用 `approvalCapability.getExecInitiatingSurfaceState`。核心使用这个特定于 exec 的钩子来区分 `enabled` 与 `disabled`、判断发起渠道是否支持原生 exec 批准，并在原生客户端回退指南中包含该渠道。`createApproverRestrictedNativeApprovalCapability(...)` 为常见情况提供了这一能力。
- 对于渠道特定的负载生命周期行为，例如隐藏重复的本地批准提示，或在投递前发送输入中指示器，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在原生批准路由或回退抑制时使用 `approvalCapability.delivery`。
- 对于渠道自有的原生批准事实，请使用 `approvalCapability.nativeRuntime`。在高频渠道入口点上，请通过 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性加载；这样它可以按需导入你的运行时模块，同时仍让核心组装批准生命周期。
- 仅当渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当渠道希望禁用路径回复能够说明启用原生 exec 批准所需的精确配置项时，请使用 `approvalCapability.describeExecApprovalSetup`。该钩子接收 `{ channel, channelLabel, accountId }`；命名账号渠道应渲染带账号作用域的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是顶层默认值。
- 如果渠道可以从现有配置中推断出稳定的 owner 类似私信身份，请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，以在不添加特定于批准的核心逻辑的情况下限制同一聊天中的 `/approve`。
- 如果渠道需要原生批准投递，请让渠道代码专注于目标规范化以及传输/呈现事实。请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将渠道特定事实放在 `approvalCapability.nativeRuntime` 之后，理想情况下通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，这样核心就可以组装处理器并负责请求过滤、路由、去重、过期、Gateway 网关订阅以及“已路由到其他位置”的通知。`nativeRuntime` 被拆分为几个更小的接口：
- `availability` — 账号是否已配置，以及请求是否应被处理
- `presentation` — 将共享批准视图模型映射为待处理/已解决/已过期的原生负载或最终操作
- `transport` — 准备目标，以及发送/更新/删除原生批准消息
- `interactions` — 原生按钮或响应的可选绑定/解绑/清除操作钩子
- `observe` — 可选的投递诊断钩子
- 如果渠道需要运行时自有对象，例如客户端、令牌、Bolt 应用或 webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心能够从渠道启动状态中引导基于能力的处理器，而无需添加特定于批准的包装胶水代码。
- 仅当基于能力的接口还不够有表达力时，才使用更底层的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准渠道必须通过这些辅助工具同时路由 `accountId` 和 `approvalKind`。`accountId` 使多账号批准策略保持在正确的机器人账号作用域内，而 `approvalKind` 让渠道在不在核心中编写硬编码分支的情况下获得 exec 与插件批准行为。
- 现在连批准重路由通知也由核心负责。渠道插件不应再从 `createChannelNativeApprovalRuntime` 发送自己的“批准已转到私信/其他渠道”后续消息；相反，应通过共享批准能力辅助工具公开准确的来源和 approver 私信路由，并让核心在向发起聊天回发任何通知前聚合实际投递结果。
- 端到端保留已投递的批准 id 类型。原生客户端不应根据渠道本地状态猜测或重写 exec 与插件批准路由。
- 不同的批准类型可以有意公开不同的原生界面。
  当前的内置示例：
  - Slack 对 exec 和插件 id 都保留了原生批准路由能力。
  - Matrix 对 exec 和插件批准保留相同的原生私信/渠道路由和 reaction 交互体验，同时仍允许鉴权按批准类型不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容包装器存在，但新代码应优先使用能力构建器，并在插件上公开 `approvalCapability`。

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

同样，如果你不需要更宽泛的总接口，请优先使用 `openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`。

对于设置，具体如下：

- `openclaw/plugin-sdk/setup-runtime` 包含运行时安全的设置辅助工具：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用于 `createEnvPatchedAccountSetupAdapter` 的窄型、环境感知适配器接口
- `openclaw/plugin-sdk/channel-setup` 包含可选安装设置构建器以及一些设置安全的原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的渠道支持由环境驱动的设置或鉴权，并且通用启动/配置流程需要在运行时加载前知道这些环境变量名称，请在插件清单中使用 `channelEnvVars` 声明它们。请将渠道运行时 `envVars` 或本地常量仅保留给面向运维者的文案。
`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有在你还需要更重型的共享设置/配置辅助工具时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接口，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置界面中提示“请先安装此插件”，优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终完成时默认关闭，并在校验、完成和文档链接文案中复用同一条“需要安装”的消息。

对于其他高频渠道路径，请优先使用窄型辅助工具，而不是更宽泛的旧接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和
  默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及
  record-and-dispatch 接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- 仅当仍然需要旧版智能体/媒体负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  规范化、重复/冲突校验，以及一个回退稳定的命令
  配置契约

仅鉴权渠道通常可以停留在默认路径：核心处理批准，而插件只公开出站/鉴权能力。像 Matrix、Slack、Telegram 和自定义聊天传输这样的原生批准渠道，应使用共享的原生辅助工具，而不是自行实现批准生命周期。

## 入站提及策略

请将入站提及处理拆分为两层：

- 插件自有的证据收集
- 共享策略评估

共享层请使用 `openclaw/plugin-sdk/channel-inbound`。

适合放在插件本地逻辑中的内容：

- 回复给机器人的检测
- 引用机器人的检测
- 线程参与检查
- 服务/系统消息排除
- 用于证明机器人参与的平台原生缓存

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

`api.runtime.channel.mentions` 为已经依赖运行时注入的内置渠道插件公开了同样的共享提及辅助工具：

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
  <Step title="包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    让它成为一个渠道插件。有关完整的包元数据接口，
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
          "blurb": "将 OpenClaw 连接到 Acme Chat。"
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
      "description": "Acme Chat 渠道插件",
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
    `ChannelPlugin` 接口具有许多可选的适配器接口。先从
    最小集合开始——`id` 和 `setup`——然后按需添加适配器。

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

      // 私信安全：谁可以给机器人发消息
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
          idLabel: "Acme Chat 用户名",
          message: "发送此代码以验证你的身份：",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // 线程处理：回复如何投递
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
      你无需手动实现底层适配器接口，
      而是传入声明式选项，由构建器负责组合它们：

      | 选项 | 接线内容 |
      | --- | --- |
      | `security.dm` | 根据配置字段生成带作用域的私信安全解析器 |
      | `pairing.text` | 基于文本代码交换的私信配对流程 |
      | `threading` | reply-to 模式解析器（固定、账号作用域或自定义） |
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就可以在不激活完整渠道运行时的情况下在根帮助中显示它们，
    同时正常的完整加载仍会使用同一组描述符进行真实命令
    注册。请将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件特定前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关全部
    选项，请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载它而不是完整入口。
    这样可以避免在设置流程期间拉入重量级运行时代码。
    详见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发给
    OpenClaw。典型模式是一个 webhook：它验证请求，然后通过你的渠道入站处理器进行分发：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 插件管理的鉴权（请自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的入站处理器将消息分发到 OpenClaw。
          // 具体接线方式取决于你的平台 SDK —
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
      入站消息处理是渠道特定的。每个渠道插件都负责
      自己的入站管线。请查看内置渠道插件
      （例如 Microsoft Teams 或 Google Chat 插件包）中的真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写同目录测试：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("从配置解析账号", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("在不实体化密钥的情况下检查账号", () => {
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

    有关共享测试辅助工具，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # `openclaw.channel` 元数据
├── openclaw.plugin.json      # 带配置 schema 的清单
├── index.ts                  # `defineChannelPluginEntry`
├── setup-entry.ts            # `defineSetupPluginEntry`
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 `createChatChannelPlugin` 创建的 `ChannelPlugin`
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如有需要）
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程处理选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/zh-CN/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/zh-CN/plugins/architecture#channel-target-resolution">
    `inferTargetChatType`、`looksLikeId`、`resolveTarget`
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 `api.runtime` 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
一些内置辅助工具接口仍然存在，用于内置插件的维护和兼容性。
对于新的渠道插件，它们不是推荐模式；
除非你正在直接维护该内置插件家族，否则请优先使用通用 SDK
接口中的 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整的清单 schema
