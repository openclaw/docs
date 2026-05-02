---
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在向 OpenClaw 添加新的渠道、提供商、工具或其他能力
sidebarTitle: Getting Started
summary: 只需几分钟即可创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-05-02T05:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件通过新增能力扩展 OpenClaw：渠道、模型提供商、
语音、实时转写、实时语音、媒体理解、图像
生成、视频生成、Web 抓取、Web 搜索、智能体工具，或任意
组合。

你无需将插件添加到 OpenClaw 仓库。发布到
[ClawHub](/zh-CN/tools/clawhub)，用户使用
`openclaw plugins install <package-name>` 安装。OpenClaw 会先尝试 ClawHub，
并针对仍使用 npm 分发的包自动回退到 npm。

## 前提条件

- Node >= 22 和一个包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并完成 `pnpm install`。源码
  checkout 插件开发仅支持 pnpm，因为 OpenClaw 会从 `extensions/*` 工作区包加载内置
  插件。

## 哪种插件？

<CardGroup cols={3}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台（Discord、IRC 等）
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加模型提供商（LLM、代理或自定义端点）
  </Card>
  <Card title="工具 / 钩子插件" icon="wrench" href="/zh-CN/plugins/hooks">
    注册智能体工具、事件钩子或服务 — 继续阅读下文
  </Card>
</CardGroup>

对于在新手引导/设置运行时不能保证已安装的渠道插件，请使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。
它会生成一个设置适配器 + 向导组合，用于说明安装要求，并且在插件安装前，
对真实配置写入采取失败关闭策略。

## 快速开始：工具插件

本演练会创建一个注册智能体工具的最小插件。渠道
和提供商插件有上方链接的专门指南。

<Steps>
  <Step title="创建包和清单">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    每个插件都需要清单，即使没有配置也是如此。运行时注册的工具
    必须列在 `contracts.tools` 中，这样 OpenClaw 才能在不加载每个插件运行时的情况下发现所属
    插件。插件也应有意声明
    `activation.onStartup`。本示例将其设置为 `true`。完整 schema 请参阅
    [清单](/zh-CN/plugins/manifest)。规范的 ClawHub
    发布片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="编写入口点">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` 用于非渠道插件。对于渠道，请使用
    `defineChannelPluginEntry` — 参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
    完整入口点选项请参阅[入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试并发布">

    **外部插件：** 使用 ClawHub 验证并发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于像 `@myorg/openclaw-my-plugin` 这样的裸包规格，
    OpenClaw 也会先检查 ClawHub，再检查 npm；对于尚未
    迁移到 ClawHub 的包，npm 仍作为回退。

    **仓库内插件：** 放在内置插件工作区树下 — 会被自动发现。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## 插件能力

单个插件可以通过 `api` 对象注册任意数量的能力：

| 能力                   | 注册方法                                         | 详细指南                                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文本推理（LLM）        | `api.registerProvider(...)`                      | [提供商插件](/zh-CN/plugins/sdk-provider-plugins)                                     |
| CLI 推理后端           | `api.registerCliBackend(...)`                    | [CLI 后端](/zh-CN/gateway/cli-backends)                                               |
| 渠道 / 消息            | `api.registerChannel(...)`                       | [渠道插件](/zh-CN/plugins/sdk-channel-plugins)                                        |
| 语音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时转写               | `api.registerRealtimeTranscriptionProvider(...)` | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时语音               | `api.registerRealtimeVoiceProvider(...)`         | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 媒体理解               | `api.registerMediaUnderstandingProvider(...)`    | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 图像生成               | `api.registerImageGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 音乐生成               | `api.registerMusicGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 视频生成               | `api.registerVideoGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| Web 抓取               | `api.registerWebFetchProvider(...)`              | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| Web 搜索               | `api.registerWebSearchProvider(...)`             | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 工具结果中间件         | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)                              |
| 智能体工具             | `api.registerTool(...)`                          | 下文                                                                            |
| 自定义命令             | `api.registerCommand(...)`                       | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| 插件钩子               | `api.on(...)`                                    | [插件钩子](/zh-CN/plugins/hooks)                                                      |
| 内部事件钩子           | `api.registerHook(...)`                          | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [内部机制](/zh-CN/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |

完整注册 API 请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)。

当内置插件需要在模型看到输出前异步重写工具结果时，可以使用
`api.registerAgentToolResultMiddleware(...)`。请在
`contracts.agentToolResultMiddleware` 中声明目标运行时，例如
`["pi", "codex"]`。这是一个受信任的内置插件接口；外部
插件应优先使用常规 OpenClaw 插件钩子，除非 OpenClaw 为此能力发展出
明确的信任策略。

如果你的插件注册自定义 Gateway 网关 RPC 方法，请将它们保持在
插件专属前缀下。核心管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析为
`operator.admin`，即使插件请求更窄的 scope 也是如此。

需要牢记的钩子防护语义：

- `before_tool_call`：`{ block: true }` 是终止性的，并会停止较低优先级处理器。
- `before_tool_call`：`{ block: false }` 被视为没有决定。
- `before_tool_call`：`{ requireApproval: true }` 会暂停智能体执行，并通过 exec approval 叠层、Telegram 按钮、Discord 交互或任意渠道上的 `/approve` 命令提示用户审批。
- `before_install`：`{ block: true }` 是终止性的，并会停止较低优先级处理器。
- `before_install`：`{ block: false }` 被视为没有决定。
- `message_sending`：`{ cancel: true }` 是终止性的，并会停止较低优先级处理器。
- `message_sending`：`{ cancel: false }` 被视为没有决定。
- `message_received`：需要入站线程/话题路由时，优先使用带类型的 `threadId` 字段。将 `metadata` 保留给渠道特定的额外信息。
- `message_sending`：优先使用带类型的 `replyToId` / `threadId` 路由字段，而不是渠道特定的 metadata 键。

`/approve` 命令通过有界回退同时处理 exec 和插件审批：当找不到 exec approval id 时，OpenClaw 会通过插件审批重试同一个 id。插件审批转发可通过配置中的 `approvals.plugin` 独立配置。

如果自定义审批管线需要检测同一个有界回退场景，
请优先使用 `openclaw/plugin-sdk/error-runtime` 中的 `isApprovalNotFoundError`，
而不是手动匹配审批过期字符串。

示例和钩子参考请参阅[插件钩子](/zh-CN/plugins/hooks)。

## 注册智能体工具

工具是 LLM 可以调用的带类型函数。它们可以是必需的（始终
可用）或可选的（用户选择启用）：

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

每个通过 `api.registerTool(...)` 注册的工具也必须在
插件清单中声明：

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

用户在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名称不得与核心工具冲突（冲突项会被跳过）
- 注册对象格式错误的工具（包括缺少 `parameters`）会被跳过，并在插件诊断中报告，而不会中断智能体运行
- 对有副作用或额外二进制要求的工具使用 `optional: true`
- 用户可以通过将插件 id 添加到 `tools.allow` 来启用某个插件的所有工具

## 注册 CLI 命令

插件可以通过 `api.registerCli` 添加根级 `openclaw` 命令组。为每个顶级命令根提供 `descriptors`，这样 OpenClaw 就能显示和路由命令，而不必急切加载每个插件运行时。

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

安装后，验证运行时注册并执行该命令：

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## 导入约定

始终从聚焦的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完整子路径参考见 [SDK 概览](/zh-CN/plugins/sdk-overview)。

在你的插件内部，使用本地 barrel 文件（`api.ts`、`runtime-api.ts`）进行内部导入，不要通过其 SDK 路径导入你自己的插件。

对于提供商插件，除非该接缝确实是通用的，否则请将提供商特定的辅助函数保留在这些 package-root barrel 中。当前内置示例：

- Anthropic：Claude 流包装器和 `service_tier` / beta 辅助函数
- OpenAI：提供商构建器、默认模型辅助函数、实时提供商
- OpenRouter：提供商构建器以及新手引导/配置辅助函数

如果某个辅助函数只在一个内置提供商包内部有用，请将其保留在该 package-root 接缝上，而不是提升到 `openclaw/plugin-sdk/*`。

一些生成的 `openclaw/plugin-sdk/<bundled-id>` 辅助接缝仍然存在，用于有已跟踪所有者使用情况的内置插件维护。请将这些视为保留接口，而不是新第三方插件的默认模式。

## 提交前检查清单

<Check>**package.json** 包含正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## Beta 发布测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签类似 `v2026.3.N-beta.1`。你也可以为官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以接收发布公告。
2. Beta 标签一出现，就针对它测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 渠道中你的插件线程里发布 `all good` 或说明损坏了什么。如果你还没有线程，请创建一个。
4. 如果出现问题，请创建或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并应用 `beta-blocker` 标签。把 issue 链接放到你的线程中。
5. 向 `main` 打开一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和你的 Discord 线程中都链接该 issue。贡献者无法给 PR 加标签，因此标题是给维护者和自动化使用的 PR 侧信号。带 PR 的阻塞问题会被合并；没有 PR 的阻塞问题可能仍会随版本发布。维护者会在 beta 测试期间关注这些线程。
6. 沉默就代表绿色通过。如果你错过窗口，你的修复很可能会进入下一个周期。

## 后续步骤

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整清单 schema 参考
  </Card>
</CardGroup>

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) — 内部架构深入解析
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
- [清单](/zh-CN/plugins/manifest) — 插件清单格式
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
