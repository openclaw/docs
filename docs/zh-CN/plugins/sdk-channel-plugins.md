---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想要将 OpenClaw 连接到一个消息平台
    - 你需要了解 ChannelPlugin 适配器接口
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-05T10:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 构建渠道插件

本指南将带你构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可用的渠道，具备私信安全、配对、回复线程处理和出站消息发送能力。

<Info>
  如果你以前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础的软件包结构和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己的发送/编辑/响应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **配置** — 账号解析和设置向导
- **安全** — 私信策略和允许列表
- **配对** — 私信批准流程
- **会话语法** — 提供商特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程处理** — 如何对回复进行线程归类

核心负责共享消息工具、提示词接线、外层会话键结构、通用 `:thread:` 记录，以及分发。

如果你的平台在会话 id 中存储了额外的作用域，请将该解析逻辑保留在插件中，并使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射到基础会话 id、可选线程 id、显式 `baseConversationId` 以及任意 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础会话的顺序排列。

需要在渠道注册表启动前执行相同解析的内置插件，也可以公开一个顶层 `session-key-api.ts` 文件，并提供匹配的 `resolveSessionConversation(...)` 导出。仅当运行时插件注册表尚不可用时，核心才会使用这个可安全引导的接口。

当插件仅需要在通用/raw id 之上提供父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍可作为旧版兼容性回退使用。如果两个钩子都存在，核心会优先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有当该规范钩子省略它们时，才会回退到 `resolveParentConversationCandidates(...)`。

## 批准和渠道能力

大多数渠道插件不需要特定于批准的代码。

- 核心负责同聊天中的 `/approve`、共享批准按钮负载以及通用回退投递。
- 当渠道需要特定于批准的行为时，优先在渠道插件上使用单个 `approvalCapability` 对象。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准鉴权接口。
- 对于隐藏重复的本地批准提示或在投递前发送输入中指示等渠道特定的负载生命周期行为，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅在需要原生批准路由或抑制回退时使用 `approvalCapability.delivery`。
- 仅当渠道确实需要自定义批准负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 如果某个渠道可以从现有配置中推断出稳定的类似所有者的私信身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天中的 `/approve`，而无需添加特定于批准的核心逻辑。
- 如果某个渠道需要原生批准投递，请让渠道代码专注于目标规范化和传输钩子。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` 和 `createChannelNativeApprovalRuntime`，这样核心就可以负责请求过滤、路由、去重、过期和 Gateway 网关订阅。
- 原生批准渠道必须通过这些辅助方法同时传递 `accountId` 和 `approvalKind`。`accountId` 会让多账号批准策略限定在正确的机器人账号范围内，而 `approvalKind` 则让渠道可以在不在核心中硬编码分支的情况下区分 exec 与插件批准行为。
- 在端到端流程中保留已投递的批准 id 类型。原生客户端不应根据渠道本地状态去猜测或重写 exec 与插件批准的路由。
- 不同的批准类型可以有意暴露不同的原生接口。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生批准路由。
  - Matrix 仅对 exec 批准保留原生私信/渠道路由，而插件批准仍走共享的同聊天 `/approve` 路径。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容性包装器存在，但新代码应优先使用能力构建器，并在插件上暴露 `approvalCapability`。

对于高频渠道入口点，如果你只需要该系列中的某一部分，优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

同样地，当你不需要范围更广的总括接口时，请优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置部分，具体来说：

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助方法：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  setup-proxy 构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用于 `createEnvPatchedAccountSetupAdapter` 的窄范围、环境感知适配器接口
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装的设置构建器，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、
  `createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
  `createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
  `splitSetupEntries`
- 只有当你还需要更重的共享设置/配置辅助方法（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，
  才使用更宽泛的 `openclaw/plugin-sdk/setup` 接口

如果你的渠道只想在设置界面中提示“请先安装这个插件”，优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导会在配置写入和最终确认时默认拒绝，并且会在校验、最终确认和文档链接文案中复用相同的“需要安装”消息。

对于其他高频渠道路径，也应优先使用窄范围辅助方法，而不是更宽泛的旧版接口：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账号配置和默认账号回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/信封以及记录和分发接线
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期和适配器注册
- 仅当仍需要旧版 agent/media 负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令规范化、重复/冲突校验，以及一个回退稳定的命令配置契约

仅鉴权渠道通常可以停留在默认路径：核心负责批准，而插件只需暴露出站/鉴权能力。像 Matrix、Slack、Telegram 和自定义聊天传输这样的原生批准渠道，应使用共享的原生辅助方法，而不是自行实现批准生命周期。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="软件包和清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    使其成为一个渠道插件。关于完整的软件包元数据接口，
    请参阅 [插件设置和配置](/zh-CN/plugins/sdk-setup#openclawchannel)：

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
    `ChannelPlugin` 接口有许多可选的适配器接口。先从最小集合开始 —
    即 `id` 和 `setup` — 然后按需添加适配器。

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
      构建器会将它们组合起来：

      | 选项 | 它接线的内容 |
      | --- | --- |
      | `security.dm` | 从配置字段解析带作用域的私信安全 |
      | `pairing.text` | 通过代码交换实现基于文本的私信配对流程 |
      | `threading` | 回复模式解析器（固定、账号作用域或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果你需要完全控制，也可以传入原始适配器对象，而不是声明式选项。
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

    将由渠道拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，
    这样 OpenClaw 就能在不激活完整渠道运行时的情况下，
    在根帮助中显示它们；而正常的完整加载仍会获取相同的描述符，
    以进行真实的命令注册。将 `registerFull(...)` 保留给仅运行时的工作。
    如果 `registerFull(...)` 注册 Gateway 网关 RPC 方法，请使用
    插件特定前缀。核心管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）是保留的，并且始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。有关所有
    选项，请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，以便在新手引导期间进行轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载它而不是完整入口。
    这样可以避免在设置流程中拉入沉重的运行时代码。
    详见 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发给 OpenClaw。典型模式是
    使用一个 webhook，对请求进行验证，然后通过你的渠道入站处理器
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
      入站消息处理是渠道特定的。每个渠道插件都拥有
      自己的入站流水线。请查看内置渠道插件
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

    如需共享测试辅助方法，请参阅 [测试](/zh-CN/plugins/sdk-testing)。

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
  <Card title="线程处理选项" icon="git-branch" href="/zh-CN/plugins/sdk-entrypoints#registration-mode">
    固定、账号作用域或自定义回复模式
  </Card>
  <Card title="Message 工具集成" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助方法" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、subagent
  </Card>
</CardGroup>

<Note>
一些内置辅助接口仍然存在，用于内置插件维护和兼容性。
它们并不是新渠道插件的推荐模式；
除非你正在直接维护该内置插件系列，否则应优先使用公共 SDK
接口中的通用 channel/setup/reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 如果你的插件也提供模型
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件 SDK 测试](/zh-CN/plugins/sdk-testing) — 测试工具和契约测试
- [插件清单](/zh-CN/plugins/manifest) — 完整清单模式
