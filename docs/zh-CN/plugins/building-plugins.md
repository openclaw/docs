---
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一份插件开发快速开始指南
    - 你正在为 OpenClaw 添加新的渠道、提供商、工具或其他能力
sidebarTitle: Getting Started
summary: 几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-04-28T11:58:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69411f22977b521adebcdaf1f6ac7592055aa800dd22f284bef4adef08027438
    source_path: plugins/building-plugins.md
    workflow: 16
---

插件通过新增能力扩展 OpenClaw：渠道、模型提供商、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页获取、Web 搜索、智能体工具，或任意组合。

你不需要把你的插件添加到 OpenClaw 仓库。发布到
[ClawHub](/zh-CN/tools/clawhub) 或 npm，用户再使用
`openclaw plugins install <package-name>` 安装。OpenClaw 会先尝试 ClawHub，并在需要时自动回退到 npm。

## 前置条件

- Node >= 22 和一个包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并完成 `pnpm install`

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

对于在新手引导/设置运行时不保证已安装的渠道插件，请使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。
它会生成一对设置适配器 + 向导，用于说明安装要求，并在插件安装之前对真实配置写入执行失败关闭。

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

    每个插件都需要清单，即使没有配置也是如此，并且每个插件都应有意声明
    `activation.onStartup`。运行时注册的工具需要启动时导入，因此此示例将其设为 `true`。完整架构见
    [清单](/zh-CN/plugins/manifest)。规范的 ClawHub 发布片段位于 `docs/snippets/plugin-publish/`。

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
    `defineChannelPluginEntry` — 见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
    如需完整入口点选项，见 [入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试并发布">

    **外部插件：**使用 ClawHub 验证并发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于像 `@myorg/openclaw-my-plugin` 这样的裸包规格，OpenClaw 也会先检查 ClawHub，再检查 npm。

    **仓库内插件：**放在内置插件工作区树下 — 会被自动发现。

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
| 渠道 / 消息传递        | `api.registerChannel(...)`                       | [渠道插件](/zh-CN/plugins/sdk-channel-plugins)                                        |
| 语音（TTS/STT）        | `api.registerSpeechProvider(...)`                | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时转写               | `api.registerRealtimeTranscriptionProvider(...)` | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 实时语音               | `api.registerRealtimeVoiceProvider(...)`         | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 媒体理解               | `api.registerMediaUnderstandingProvider(...)`    | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 图像生成               | `api.registerImageGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 音乐生成               | `api.registerMusicGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 视频生成               | `api.registerVideoGenerationProvider(...)`       | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 网页获取               | `api.registerWebFetchProvider(...)`              | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| Web 搜索               | `api.registerWebSearchProvider(...)`             | [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)       |
| 工具结果中间件         | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)                              |
| 智能体工具             | `api.registerTool(...)`                          | 下文                                                                            |
| 自定义命令             | `api.registerCommand(...)`                       | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| 插件钩子               | `api.on(...)`                                    | [插件钩子](/zh-CN/plugins/hooks)                                                      |
| 内部事件钩子           | `api.registerHook(...)`                          | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |
| HTTP 路由              | `api.registerHttpRoute(...)`                     | [内部机制](/zh-CN/plugins/architecture-internals#gateway-http-routes)                 |
| CLI 子命令             | `api.registerCli(...)`                           | [入口点](/zh-CN/plugins/sdk-entrypoints)                                              |

完整注册 API 见 [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)。

内置插件在需要在模型看到输出之前异步重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。
请在 `contracts.agentToolResultMiddleware` 中声明目标运行时，例如
`["pi", "codex"]`。这是一个受信任的内置插件接缝；外部插件应优先使用常规 OpenClaw 插件钩子，除非 OpenClaw 为此能力新增明确的信任策略。

如果你的插件注册自定义 Gateway 网关 RPC 方法，请将它们放在插件专用前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）会保留，并且始终解析为
`operator.admin`，即使插件请求的是更窄的作用域。

需要记住的钩子保护语义：

- `before_tool_call`：`{ block: true }` 是终止性决定，会停止较低优先级的处理器。
- `before_tool_call`：`{ block: false }` 会被视为没有决定。
- `before_tool_call`：`{ requireApproval: true }` 会暂停智能体执行，并通过执行审批覆盖层、Telegram 按钮、Discord 交互，或任意渠道上的 `/approve` 命令提示用户审批。
- `before_install`：`{ block: true }` 是终止性决定，会停止较低优先级的处理器。
- `before_install`：`{ block: false }` 会被视为没有决定。
- `message_sending`：`{ cancel: true }` 是终止性决定，会停止较低优先级的处理器。
- `message_sending`：`{ cancel: false }` 会被视为没有决定。
- `message_received`：当你需要入站线程/主题路由时，优先使用带类型的 `threadId` 字段。保留 `metadata` 用于渠道特定的附加信息。
- `message_sending`：优先使用带类型的 `replyToId` / `threadId` 路由字段，而不是渠道特定的元数据键。

`/approve` 命令通过有界回退同时处理执行审批和插件审批：当找不到执行审批 id 时，OpenClaw 会通过插件审批使用相同 id 重试。插件审批转发可以通过配置中的 `approvals.plugin` 独立配置。

如果自定义审批管道需要检测同一个有界回退场景，请优先使用 `openclaw/plugin-sdk/error-runtime` 中的 `isApprovalNotFoundError`，而不是手动匹配审批过期字符串。

示例和钩子参考见 [插件钩子](/zh-CN/plugins/hooks)。

## 注册智能体工具

工具是 LLM 可以调用的带类型函数。它们可以是必需的（始终可用），也可以是可选的（用户选择加入）：

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

用户在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名称不得与核心工具冲突（冲突项会被跳过）
- 包含缺失 `parameters` 在内，带有格式错误注册对象的工具会被跳过并报告到插件诊断中，而不是破坏智能体运行
- 对于有副作用或额外二进制要求的工具，请使用 `optional: true`
- 用户可以通过将插件 id 添加到 `tools.allow` 来启用某个插件的所有工具

## 导入约定

始终从聚焦的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完整子路径参考见 [SDK 概览](/zh-CN/plugins/sdk-overview)。

在你的插件中，将本地 barrel 文件（`api.ts`、`runtime-api.ts`）用于内部导入，不要通过其 SDK 路径导入你自己的插件。

对于提供商插件，除非接口确实是通用的，否则应将提供商特定的辅助工具保留在这些包根级 barrel 中。当前内置示例：

- Anthropic：Claude 流包装器，以及 `service_tier` / beta 辅助工具
- OpenAI：提供商构建器、默认模型辅助工具、实时提供商
- OpenRouter：提供商构建器，以及新手引导/配置辅助工具

如果某个辅助工具只在一个内置提供商包内部有用，请将它保留在该包根级接口上，而不是提升到 `openclaw/plugin-sdk/*`。

一些生成的 `openclaw/plugin-sdk/<bundled-id>` 辅助接口仍然存在，用于在具有已跟踪所有者用法时维护内置插件。请将这些视为保留接口，而不是新第三方插件的默认模式。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## Beta 发布测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签看起来像 `v2026.3.N-beta.1`。你也可以为官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以接收发布公告。
2. Beta 标签一出现，就立即用它测试你的插件。稳定版发布前的窗口通常只有几个小时。
3. 测试后，在 `plugin-forum` Discord 渠道中你的插件主题帖里发布 `all good` 或说明哪里损坏了。如果你还没有主题帖，请创建一个。
4. 如果有内容损坏，请打开或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并应用 `beta-blocker` 标签。将 issue 链接放到你的主题帖中。
5. 向 `main` 打开一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和你的 Discord 主题帖中都链接该 issue。贡献者无法给 PR 加标签，因此标题是给维护者和自动化使用的 PR 侧信号。有 PR 的阻塞问题会被合并；没有 PR 的阻塞问题可能仍会随版本发布。维护者会在 beta 测试期间关注这些主题帖。
6. 沉默表示通过。如果你错过窗口，你的修复很可能会在下一个周期合入。

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

## 相关

- [插件架构](/zh-CN/plugins/architecture) — 内部架构深度解析
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
- [清单](/zh-CN/plugins/manifest) — 插件清单格式
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
