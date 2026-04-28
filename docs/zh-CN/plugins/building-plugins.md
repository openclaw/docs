---
read_when:
    - 你想要创建一个新的 OpenClaw 插件
    - 你需要一份用于插件开发的快速开始指南
    - 你正在为 OpenClaw 添加一个新的渠道、提供商、工具或其他能力
sidebarTitle: Getting Started
summary: 在几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-04-28T02:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25b2f3f05a468d0ce017eb67877511f0e551f62322f16a00fee9f8b367a25494
    source_path: plugins/building-plugins.md
    workflow: 15
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索、智能体工具，或这些能力的任意组合。

你不需要把你的插件添加到 OpenClaw 仓库中。发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后用户使用 `openclaw plugins install <package-name>` 安装即可。OpenClaw 会优先尝试 ClawHub，并在失败时自动回退到 npm。

## 前提条件

- Node >= 22 和一个包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并完成 `pnpm install`

## 你要构建哪种插件？

<CardGroup cols={3}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到某个消息平台（Discord、IRC 等）
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加一个模型提供商（LLM、代理或自定义端点）
  </Card>
  <Card title="工具 / 钩子插件" icon="wrench" href="/zh-CN/plugins/hooks">
    注册智能体工具、事件钩子或服务——继续阅读下文
  </Card>
</CardGroup>

对于某个渠道插件，如果在新手引导 / 设置运行时不能保证它已安装，请使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。它会生成一个设置适配器 + 向导配对，用于提示安装要求，并在插件安装完成之前，对真实配置写入采取失败关闭策略。

## 快速开始：工具插件

本演练将创建一个注册智能体工具的最小插件。渠道插件和提供商插件有上方链接的专门指南。

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

    每个插件都需要一个清单，即使没有任何配置也是如此；并且每个插件都应该有意识地声明 `activation.onStartup`。运行时注册的工具需要在启动时导入，因此本示例将其设置为 `true`。完整 schema 请参见 [Manifest](/zh-CN/plugins/manifest)。规范的 ClawHub 发布片段位于 `docs/snippets/plugin-publish/`。

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

    `definePluginEntry` 用于非渠道插件。对于渠道，请使用 `defineChannelPluginEntry`——参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。有关完整入口点选项，请参见 [Entry Points](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试并发布">

    **外部插件：** 使用 ClawHub 验证并发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于像 `@myorg/openclaw-my-plugin` 这样的裸包规范，OpenClaw 也会先检查 ClawHub，再检查 npm。

    **仓库内插件：** 放在内置插件工作区树下——会被自动发现。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## 插件能力

单个插件可以通过 `api` 对象注册任意数量的能力：

| 能力 | 注册方法 | 详细指南 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文本推理（LLM） | `api.registerProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) |
| CLI 推理后端 | `api.registerCliBackend(...)` | [CLI Backends](/zh-CN/gateway/cli-backends) |
| 渠道 / 消息传递 | `api.registerChannel(...)` | [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) |
| 语音（TTS/STT） | `api.registerSpeechProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 实时转录 | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 实时语音 | `api.registerRealtimeVoiceProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 媒体理解 | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 图像生成 | `api.registerImageGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音乐生成 | `api.registerMusicGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 网页抓取 | `api.registerWebFetchProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 网页搜索 | `api.registerWebSearchProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 工具结果中间件 | `api.registerAgentToolResultMiddleware(...)` | [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api) |
| 智能体工具 | `api.registerTool(...)` | 下文 |
| 自定义命令 | `api.registerCommand(...)` | [Entry Points](/zh-CN/plugins/sdk-entrypoints) |
| 插件钩子 | `api.on(...)` | [插件钩子](/zh-CN/plugins/hooks) |
| 内部事件钩子 | `api.registerHook(...)` | [Entry Points](/zh-CN/plugins/sdk-entrypoints) |
| HTTP 路由 | `api.registerHttpRoute(...)` | [Internals](/zh-CN/plugins/architecture-internals#gateway-http-routes) |
| CLI 子命令 | `api.registerCli(...)` | [Entry Points](/zh-CN/plugins/sdk-entrypoints) |

完整注册 API 请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)。

内置插件在需要模型看到输出之前，异步重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。请在 `contracts.agentToolResultMiddleware` 中声明目标运行时，例如 `["pi", "codex"]`。这是一个受信任的内置插件扩展点；对于外部插件，除非 OpenClaw 为此能力引入明确的信任策略，否则应优先使用常规的 OpenClaw 插件钩子。

如果你的插件注册了自定义的 Gateway 网关 RPC 方法，请将它们放在插件专属前缀下。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保留给核心使用，即使插件请求了更窄的作用域，它们也始终会解析到 `operator.admin`。

需要注意的钩子守卫语义：

- `before_tool_call`：`{ block: true }` 是终止性结果，并会阻止更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 会被视为未作决定。
- `before_tool_call`：`{ requireApproval: true }` 会暂停智能体执行，并通过 exec 审批覆盖层、Telegram 按钮、Discord 交互，或任意渠道上的 `/approve` 命令提示用户进行审批。
- `before_install`：`{ block: true }` 是终止性结果，并会阻止更低优先级的处理器。
- `before_install`：`{ block: false }` 会被视为未作决定。
- `message_sending`：`{ cancel: true }` 是终止性结果，并会阻止更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 会被视为未作决定。
- `message_received`：当你需要入站线程 / 话题路由时，优先使用类型化的 `threadId` 字段。`metadata` 应保留用于渠道特定的额外信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，而不是渠道特定的 metadata 键。

`/approve` 命令会同时处理 exec 和插件审批，并带有有界回退：当找不到某个 exec 审批 id 时，OpenClaw 会通过插件审批重试同一个 id。插件审批转发可通过配置中的 `approvals.plugin` 独立设置。

如果你的自定义审批流程需要检测这一相同的有界回退场景，优先使用 `openclaw/plugin-sdk/error-runtime` 中的 `isApprovalNotFoundError`，而不是手动匹配审批过期字符串。

示例和钩子参考请参见 [插件钩子](/zh-CN/plugins/hooks)。

## 注册智能体工具

工具是 LLM 可调用的类型化函数。它们可以是必需的（始终可用）或可选的（用户主动启用）：

```typescript
register(api) {
  // 必需工具——始终可用
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 可选工具——用户必须添加到 allowlist
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

用户可以在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名称不得与核心工具冲突（冲突项会被跳过）
- 注册对象格式错误的工具，包括缺少 `parameters` 的情况，会被跳过，并在插件诊断中报告，而不会破坏智能体运行
- 对具有副作用或需要额外二进制依赖的工具，请使用 `optional: true`
- 用户可以通过将插件 id 添加到 `tools.allow` 来启用某个插件中的全部工具

## 导入约定

始终从聚焦的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 错误：单体根路径（已弃用，将被移除）
import { ... } from "openclaw/plugin-sdk";
```

完整子路径参考请参见 [SDK 概览](/zh-CN/plugins/sdk-overview)。

在你的插件内部，内部导入请使用本地 barrel 文件（`api.ts`、`runtime-api.ts`）——绝不要通过它自己的 SDK 路径导入你自己的插件。

对于提供商插件，除非某个扩展点确实是通用的，否则应将提供商专用辅助工具保留在这些包根级 barrel 中。当前内置示例包括：

- Anthropic：Claude 流包装器以及 `service_tier` / beta 辅助工具
- OpenAI：提供商构建器、默认模型辅助工具、实时提供商
- OpenRouter：提供商构建器以及新手引导 / 配置辅助工具

如果某个辅助工具只在一个内置提供商包中有用，就应将它保留在该包根级扩展面上，而不是提升到 `openclaw/plugin-sdk/*` 中。

某些生成的 `openclaw/plugin-sdk/<bundled-id>` 辅助扩展面仍然存在，用于内置插件维护和兼容性，例如 `plugin-sdk/feishu-setup` 或 `plugin-sdk/zalo-setup`。请将这些视为保留扩展面，而不是新第三方插件的默认模式。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单文件存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## beta 发布测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。beta 标签看起来像 `v2026.3.N-beta.1`。你也可以为 OpenClaw 官方 X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以获取发布公告。
2. beta 标签一出现，就尽快用它测试你的插件。stable 发布前的窗口通常只有几个小时。
3. 测试后，在 Discord 频道 `plugin-forum` 中你的插件主题帖里发送 `all good` 或说明哪里坏了。如果你还没有主题帖，请创建一个。
4. 如果出了问题，创建或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并加上 `beta-blocker` 标签。把该 issue 链接贴到你的主题帖中。
5. 向 `main` 提交一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和你的 Discord 主题帖中都链接该 issue。贡献者不能给 PR 打标签，因此标题是提供给维护者和自动化系统的 PR 侧信号。有 PR 的阻塞问题会被合并；没有 PR 的阻塞问题则可能仍会随版本发布。维护者会在 beta 测试期间关注这些主题帖。
6. 没有消息就表示一切正常。如果你错过了这个窗口，你的修复很可能会进入下一个周期。

## 后续步骤

<CardGroup cols={2}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="SDK 概览" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="测试" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="插件清单" icon="file-json" href="/zh-CN/plugins/manifest">
    完整清单 schema 参考
  </Card>
</CardGroup>

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) —— 内部架构深入解析
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 插件 SDK 参考
- [Manifest](/zh-CN/plugins/manifest) —— 插件清单格式
- [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) —— 构建渠道插件
- [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) —— 构建提供商插件
