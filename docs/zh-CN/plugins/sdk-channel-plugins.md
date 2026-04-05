---
read_when:
    - 你正在构建一个新的消息渠道插件
    - 你想将 OpenClaw 连接到某个消息平台
    - 你需要了解 ChannelPlugin 适配器表面
sidebarTitle: Channel Plugins
summary: 构建 OpenClaw 消息渠道插件的分步指南
title: 构建渠道插件
x-i18n:
    generated_at: "2026-04-05T08:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64426736fd4b440e6d886339a82c74a04a4dead7ee83d037ad95c31a1765b9fc
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 构建渠道插件

本指南将带你构建一个将 OpenClaw 连接到消息平台的渠道插件。完成后，你将拥有一个可用的渠道，支持私信安全、配对、回复线程和出站消息。

<Info>
  如果你以前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/plugins/building-plugins) 了解基础包结构
  和清单设置。
</Info>

## 渠道插件如何工作

渠道插件不需要自己提供发送/编辑/反应工具。OpenClaw 在 core 中保留了一个
共享的 `message` 工具。你的插件负责：

- **配置** —— 账户解析和设置向导
- **安全** —— 私信策略和允许列表
- **配对** —— 新私信联系人审批流程
- **会话语法** —— provider 特定的对话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** —— 向平台发送文本、媒体和投票
- **线程** —— 如何对回复进行线程化

Core 负责共享消息工具、提示词连接、外层会话键形状、
通用 `:thread:` 记录以及分发。

如果你的平台在对话 id 中存储了额外作用域，请将该解析逻辑保留在
插件中，并使用 `messaging.resolveSessionConversation(...)`。这是
将 `rawId` 映射到基础对话 id、可选线程
id、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范钩子。
当你返回 `parentConversationCandidates` 时，请按从最窄父级到最宽/基础对话的顺序排列。

需要在渠道注册表启动前执行相同解析逻辑的内置插件
也可以公开一个顶层 `session-key-api.ts` 文件，并导出匹配的
`resolveSessionConversation(...)`。只有在运行时插件注册表尚不可用时，
core 才会使用这个可安全引导的表面。

当插件只需要在通用/raw id 之上添加父级回退时，
`messaging.resolveParentConversationCandidates(...)` 仍然可作为
旧版兼容性回退使用。如果两个钩子同时存在，core 会优先使用
`resolveSessionConversation(...).parentConversationCandidates`，仅在规范钩子
省略它们时才回退到 `resolveParentConversationCandidates(...)`。

## 审批与渠道能力

大多数渠道插件不需要审批专用代码。

- Core 负责同一聊天中的 `/approve`、共享审批按钮负载，以及通用回退投递。
- 当渠道需要审批专用行为时，优先在渠道插件上使用一个 `approvalCapability` 对象。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批认证接缝。
- 对于隐藏重复本地审批提示或在投递前发送输入中提示等渠道特定负载生命周期行为，请使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅当需要原生审批路由或抑制回退时，才使用 `approvalCapability.delivery`。
- 仅当某个渠道确实需要自定义审批负载而不是共享渲染器时，才使用 `approvalCapability.render`。
- 如果某个渠道可以从现有配置中推断出稳定的类所有者私信身份，请使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 来限制同一聊天中的 `/approve`，而无需添加审批专用 core 逻辑。
- 如果某个渠道需要原生审批投递，请让渠道代码专注于目标标准化和传输钩子。使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` 和 `createChannelNativeApprovalRuntime`，这样 core 就能负责请求过滤、路由、去重、过期和 gateway 订阅。
- 原生审批渠道必须同时通过这些辅助工具路由 `accountId` 和 `approvalKind`。`accountId` 让多账户审批策略限制在正确的机器人账户范围内，`approvalKind` 则让渠道能够在无需 core 中硬编码分支的情况下区分 exec 与插件审批行为。
- 端到端保留已投递审批 id 的种类。原生客户端不应
  根据渠道本地状态猜测或改写 exec 与插件审批路由。
- 不同审批种类可以有意公开不同的原生表面。
  当前内置示例：
  - Slack 对 exec 和插件 id 都保留原生审批路由。
  - Matrix 仅对 exec 审批保留原生私信/渠道路由，而将
    插件审批保留在共享的同聊天 `/approve` 路径上。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，但新代码应优先选择 capability builder，并在插件上公开 `approvalCapability`。

对于热点渠道入口点，当你只需要该家族中的某一部分时，
优先使用更窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

同样，当你不需要更宽泛的总表面时，
优先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

对于设置相关内容：

- `openclaw/plugin-sdk/setup-runtime` 覆盖运行时安全的设置辅助工具：
  可安全导入的设置补丁适配器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找注释输出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委托式
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` 是面向环境感知适配器的窄接缝，
  用于 `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 覆盖可选安装设置
  builder，以及少量设置安全原语：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、
  `createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
  `createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
  `splitSetupEntries`
- 只有在你还需要更重的共享设置/配置辅助工具时，
  才使用更宽泛的 `openclaw/plugin-sdk/setup` 接缝，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的渠道只想在设置表面中宣告“请先安装此插件”，
优先使用 `createOptionalChannelSetupSurface(...)`。生成的
adapter/wizard 会在配置写入和最终完成时默认失败即关闭，并在验证、完成和文档链接文案中复用相同的安装必需提示。

对于其他热点渠道路径，也优先使用窄辅助工具，而不是更宽泛的旧版表面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用于多账户配置和
  默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用于入站路由/封套以及
  记录与分发连接
- `openclaw/plugin-sdk/messaging-targets`，用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用于媒体加载以及出站
  身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime`，用于线程绑定生命周期
  和适配器注册
- 仅当仍然需要旧版 agent/media
  负载字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用于 Telegram 自定义命令
  标准化、重复/冲突校验，以及回退稳定的命令
  配置契约

仅认证渠道通常可以止步于默认路径：core 处理审批，而插件只暴露出站/认证能力。Matrix、Slack、Telegram 以及自定义聊天传输等原生审批渠道应使用共享原生辅助工具，而不是自行实现审批生命周期。

## 操作演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包与清单">
    创建标准插件文件。`package.json` 中的 `channel` 字段
    就是让它成为渠道插件的关键。有关完整包元数据表面，
    请参见 [插件设置](/plugins/sdk-setup#openclawchannel)：

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
    `ChannelPlugin` 接口有许多可选适配器表面。先从
    最小集合开始——`id` 和 `setup`——然后根据需要添加适配器。

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
      你不需要手动实现底层适配器接口，
      而是传入声明式选项，由 builder 负责组合：

      | 选项 | 它连接的内容 |
      | --- | --- |
      | `security.dm` | 从配置字段派生的作用域化私信安全解析器 |
      | `pairing.text` | 带代码交换的基于文本的私信配对流程 |
      | `threading` | 回复模式解析器（固定、按账户作用域，或自定义） |
      | `outbound.attachedResults` | 返回结果元数据的发送函数（消息 ID） |

      如果你需要完全控制，也可以传入原始 adapter 对象，而不是这些声明式选项。
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

    将渠道自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw
    就可以在不激活完整渠道运行时的情况下
    在根帮助中显示它们，而正常完整加载仍会获取相同描述符来进行真实命令
    注册。将 `registerFull(...)` 保留给仅运行时工作。
    如果 `registerFull(...)` 注册 gateway RPC 方法，请使用
    插件专用前缀。Core 管理命名空间（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）是保留的，并且始终
    解析为 `operator.admin`。
    `defineChannelPluginEntry` 会自动处理注册模式拆分。请参见
    [入口点](/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    选项。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts`，用于新手引导期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当渠道被禁用或尚未配置时，OpenClaw 会加载它，而不是完整入口。
    这样可以避免在设置流程中拉入沉重的运行时代码。
    详情请参见 [设置](/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并将其转发到
    OpenClaw。典型模式是一个用于验证请求并通过
    你的渠道入站处理器进行分发的 webhook：

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
      自己的入站管线。请查看内置渠道插件
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

    有关共享测试辅助工具，请参见 [测试](/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # 含配置 schema 的清单
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 创建的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API client
    └── runtime.ts            # 运行时存储（如需要）
```

## 高级主题

<CardGroup cols={2}>
  <Card title="线程选项" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    固定、按账户作用域或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和动作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子智能体
  </Card>
</CardGroup>

<Note>
保留的内置辅助接缝，例如 `plugin-sdk/whatsapp-surface`，仍然
存在，用于内置插件维护和兼容性。对于新的
渠道插件，这不是推荐模式；除非你是在直接维护
该内置插件家族，否则请优先使用通用 SDK 表面中的 channel/setup/
reply/runtime 子路径。
</Note>

## 后续步骤

- [提供商插件](/plugins/sdk-provider-plugins) —— 如果你的插件也提供模型
- [SDK 概览](/plugins/sdk-overview) —— 完整子路径导入参考
- [插件 SDK 测试](/plugins/sdk-testing) —— 测试工具和契约测试
- [插件清单](/plugins/manifest) —— 完整清单 schema
