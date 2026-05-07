---
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在为 OpenClaw 添加新的渠道、提供商、工具或其他能力
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-05-07T13:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 获取、Web 搜索、智能体工具，或这些能力的任意组合。

你不需要把你的插件添加到 OpenClaw 仓库。发布到 [ClawHub](/zh-CN/tools/clawhub)，用户可通过 `openclaw plugins install clawhub:<package-name>` 安装。在发布切换期间，裸包规格仍会从 npm 安装。

## 前提条件

- Node >= 22 和一个包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并完成 `pnpm install`。源码检出式插件开发仅支持 pnpm，因为 OpenClaw 会从 `extensions/*` 工作区包加载内置插件。

## 哪种插件？

<CardGroup cols={3}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台（Discord、IRC 等）
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加模型提供商（LLM、代理或自定义端点）
  </Card>
  <Card title="CLI 后端插件" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    将本地 AI CLI 映射到 OpenClaw 的文本回退运行器
  </Card>
  <Card title="工具 / 钩子插件" icon="wrench" href="/zh-CN/plugins/hooks">
    注册智能体工具、事件钩子或服务 - 继续阅读下文
  </Card>
</CardGroup>

对于不能保证在新手引导/设置运行时已安装的渠道插件，请使用来自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface(...)`。它会生成一个设置适配器 + 向导组合，用于提示安装要求，并在插件安装前对真实配置写入保持失败关闭。

## 快速开始：工具插件

本演练会创建一个注册智能体工具的最小插件。渠道和提供商插件有上方链接的专门指南。

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

    每个插件都需要清单，即使没有配置也是如此。运行时注册的工具必须列在 `contracts.tools` 中，这样 OpenClaw 才能在不加载每个插件运行时的情况下发现所属插件。插件也应有意声明 `activation.onStartup`。此示例将其设为 `true`。完整架构请参阅 [Manifest](/zh-CN/plugins/manifest)。规范的 ClawHub 发布片段位于 `docs/snippets/plugin-publish/`。

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

    `definePluginEntry` 用于非渠道插件。对于渠道，请使用 `defineChannelPluginEntry` - 请参阅 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。完整入口点选项请参阅 [入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试和发布">

    **外部插件：**使用 ClawHub 验证并发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    在发布切换期间，像 `@myorg/openclaw-my-plugin` 这样的裸包规格会从 npm 安装。当你需要 ClawHub 解析时，请使用 `clawhub:`。

    **仓库内插件：**放在内置插件工作区树下 - 会被自动发现。

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
| CLI 推理后端           | `api.registerCliBackend(...)`                    | [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)                                    |
| 渠道 / 消息            | `api.registerChannel(...)`                       | [渠道插件](/zh-CN/plugins/sdk-channel-plugins)                                        |
| 语音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时转录               | `api.registerRealtimeTranscriptionProvider(...)` | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时语音               | `api.registerRealtimeVoiceProvider(...)`         | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 媒体理解               | `api.registerMediaUnderstandingProvider(...)`    | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 图像生成               | `api.registerImageGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 音乐生成               | `api.registerMusicGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 视频生成               | `api.registerVideoGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| Web 获取               | `api.registerWebFetchProvider(...)`              | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| Web 搜索               | `api.registerWebSearchProvider(...)`             | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 工具结果中间件         | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)                              |
| 智能体工具             | `api.registerTool(...)`                          | 下文                                                                            |
| 自定义命令             | `api.registerCommand(...)`                       | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| 插件钩子               | `api.on(...)`                                    | [插件钩子](/zh-CN/plugins/hooks)                                                      |
| 内部事件钩子           | `api.registerHook(...)`                          | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [Internals](/zh-CN/plugins/architecture-internals#gateway-http-routes)                |
| CLI 子命令             | `api.registerCli(...)`                           | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |

完整注册 API 请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)。

当内置插件需要在模型看到输出之前异步重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。在 `contracts.agentToolResultMiddleware` 中声明目标运行时，例如 `["pi", "codex"]`。这是一个受信任的内置插件接缝；外部插件应优先使用常规 OpenClaw 插件钩子，除非 OpenClaw 为此能力增加明确的信任策略。

如果你的插件注册自定义 Gateway 网关 RPC 方法，请将它们放在插件专用前缀下。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终解析为 `operator.admin`，即使插件请求更窄的作用域也是如此。

需要牢记的钩子守卫语义：

- `before_tool_call`：`{ block: true }` 是终止性的，会停止较低优先级的处理器。
- `before_tool_call`：`{ block: false }` 会被视为未作决定。
- `before_tool_call`：`{ requireApproval: true }` 会暂停智能体执行，并通过 exec 批准覆盖层、Telegram 按钮、Discord 交互，或任意渠道上的 `/approve` 命令提示用户批准。
- `before_install`：`{ block: true }` 是终止性的，会停止较低优先级的处理器。
- `before_install`：`{ block: false }` 会被视为未作决定。
- `message_sending`：`{ cancel: true }` 是终止性的，会停止较低优先级的处理器。
- `message_sending`：`{ cancel: false }` 会被视为未作决定。
- `message_received`：当你需要入站线程/主题路由时，优先使用带类型的 `threadId` 字段。将 `metadata` 保留用于渠道特定的额外信息。
- `message_sending`：优先使用带类型的 `replyToId` / `threadId` 路由字段，而不是渠道特定的元数据键。

`/approve` 命令会通过有界回退处理 exec 和插件批准：当找不到 exec 批准 ID 时，OpenClaw 会用同一个 ID 通过插件批准重试。插件批准转发可通过配置中的 `approvals.plugin` 独立配置。

如果自定义批准管道需要检测同一个有界回退场景，请优先使用来自 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，而不是手动匹配批准过期字符串。

示例和钩子参考请参阅 [插件钩子](/zh-CN/plugins/hooks)。

## 注册智能体工具

工具是 LLM 可以调用的带类型函数。它们可以是必需的（始终可用），也可以是可选的（用户选择加入）：

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

每个通过 `api.registerTool(...)` 注册的工具也必须在插件清单中声明：

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw 会从已注册的工具中捕获并缓存通过验证的描述符，
因此插件无需在清单中重复 `description` 或 schema 数据。
清单契约只声明所有权和设备发现；执行仍然会调用实时注册的工具实现。
对于使用 `api.registerTool(..., { optional: true })` 注册的工具，请设置
`toolMetadata.<tool>.optional: true`，这样 OpenClaw 可以避免加载该
插件运行时，直到该工具被显式加入允许列表。

用户在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名称不得与核心工具冲突（冲突项会被跳过）
- 注册对象格式错误的工具（包括缺少 `parameters`）会被跳过，并在插件诊断中报告，而不是中断智能体运行
- 对有副作用或需要额外二进制文件的工具使用 `optional: true`
- 用户可以将插件 ID 添加到 `tools.allow`，以启用该插件的所有工具

## 注册 CLI 命令

插件可以通过 `api.registerCli` 添加根级 `openclaw` 命令组。请为每个顶级命令根提供
`descriptors`，这样 OpenClaw 无需急切加载每个插件运行时，也能显示并路由
该命令。

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

安装后，验证运行时注册并执行命令：

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

完整的子路径参考，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview)。

在你的插件内部，请使用本地 barrel 文件（`api.ts`、`runtime-api.ts`）进行
内部导入，不要通过其 SDK 路径导入你自己的插件。

对于提供商插件，除非该接缝确实是通用的，否则请将提供商专用辅助工具保留在这些包根
barrel 中。当前内置示例：

- Anthropic：Claude 流包装器和 `service_tier` / beta 辅助工具
- OpenAI：提供商构建器、默认模型辅助工具、实时提供商
- OpenRouter：提供商构建器以及新手引导/配置辅助工具

如果某个辅助工具只在一个内置提供商包内有用，请将它保留在该
包根接缝上，而不是提升到 `openclaw/plugin-sdk/*` 中。

一些生成的 `openclaw/plugin-sdk/<bundled-id>` 辅助接缝仍然存在，
用于维护有已跟踪所有者用法的内置插件。请将这些视为保留表面，
而不是新第三方插件的默认模式。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自我导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## Beta 发布测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签类似 `v2026.3.N-beta.1`。你也可以为官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以接收发布公告。
2. Beta 标签一出现，就用它测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 渠道中你的插件讨论串里发布 `all good` 或说明出了什么问题。如果还没有讨论串，请创建一个。
4. 如果有内容损坏，请打开或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并应用 `beta-blocker` 标签。把 issue 链接放入你的讨论串。
5. 打开一个指向 `main` 的 PR，标题为 `fix(<plugin-id>): beta blocker - <summary>`，并在 PR 和你的 Discord 讨论串中链接该 issue。贡献者无法给 PR 加标签，因此标题是维护者和自动化在 PR 侧使用的信号。有 PR 的阻塞问题会被合并；没有 PR 的阻塞问题仍可能照常发布。维护者会在 Beta 测试期间关注这些讨论串。
6. 没有消息就表示通过。如果你错过窗口，你的修复很可能会进入下一个周期。

## 后续步骤

<CardGroup cols={2}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="CLI 后端插件" icon="terminal" href="/zh-CN/plugins/cli-backend-plugins">
    注册本地 AI CLI 后端
  </Card>
  <Card title="SDK 概览" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="测试" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试实用工具和模式
  </Card>
  <Card title="插件清单" icon="file-json" href="/zh-CN/plugins/manifest">
    完整清单 schema 参考
  </Card>
</CardGroup>

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) - 内部架构深入解析
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 插件 SDK 参考
- [清单](/zh-CN/plugins/manifest) - 插件清单格式
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
