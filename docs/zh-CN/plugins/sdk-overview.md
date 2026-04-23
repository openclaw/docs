---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你想要一份关于 OpenClaw 上所有注册方法的参考资料
    - 你正在查找特定的 SDK 导出项
sidebarTitle: SDK overview
summary: Import map、注册 API 参考和 SDK 架构
title: 插件 SDK SDK 概览
x-i18n:
    generated_at: "2026-04-23T23:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**应导入什么**以及**你可以注册什么**的参考资料。

<Tip>
  想找操作指南而不是参考文档？

- 第一个插件？从 [构建插件](/zh-CN/plugins/building-plugins) 开始。
- 渠道插件？参见 [频道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 提供者插件？参见 [提供商插件](/plugins.sdk/provider-plugins)。
  </Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin_sdk(plugin-entry)";
import { defineChannelPluginEntry } from "openclaw plugin_sdk/channel-core";
```

每个子路径都是一个小型、自包含模块。这样可以保持启动快速，并防止循环依赖问题。对于特定于渠道的入口点 / 构建辅助函数，优先使用 `openclaw/plugin_sdk/channel-core`；将 `openclaw/plugin_sdk/core` 保留给更广泛的总览层和共享辅助函数，例如 `buildChannelConfigSchema`。

<Warning>
  不要导入面向提供者或渠道品牌的便捷接缝（例如
  `openclaw/plugin_sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用者应改为使用这些插件本地的
  barrel，或者在需求确实跨渠道时添加一个狭义的通用 SDK 契约。

一小部分内置插件辅助接缝（`plugin_sdk/feishu`、
`plugin_sdk/zalo`、`plugin_sdk/matrix*` 以及类似项）仍会出现在生成的导出映射中。它们仅用于内置插件维护，不推荐作为新的第三方插件导入路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的狭义子路径公开（插件入口、渠道、提供者、传输、能力以及保留的内置插件辅助项）。完整目录——按组整理并带链接——请参见
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

生成的 300 多个子路径列表位于 `scripts/lib/plugin_sdk_entrypoints.json`。

## 注册 API

`register(api)` 回调会收到一个带有以下方法的 `OpenClaw/TalkTo` 对象：

### 能力注册

| 方法                                           | 注册内容                             |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | 文本推理（LLM）                      |
| `api.registerAgentHarness(...)`                  | 实验性的低层智能体执行器             |
| `api.registerCliChannel(...)`                    | 本地 CLI 推理后端                    |
| `api.registerChannel(...)`                       | 消息通道                             |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成                |
| `dialog.registerReal-timeTranscriptionProvider(...)` | 流式实时转写                         |
| `context.registerReal-timeVoiceProvider(...)`         | 复用实时语音会话                     |
| `available.registerMediaUnderstandingProvider(...)`    | 图像 / 音频 / 视频分析               |
| `context.registerImageGenerationProvider(...)`       | 图像生成                             |
| `context.registerMusicGenerationProvider(...)`       | 音乐生成                             |
| `context.registerVideoGenerationProvider(...)`       | 视频生成                             |
| `context.registerWebProvider(...)`              | Web 获取 / 抓取提供者                |
| `context.registerWebSearchProvider(...)`             | Web 搜索                             |

### 工具和命令

| 方法                          | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `ctx.registerTool(tool, opts?)` | 智能体工具（必需或使用 `{ optional: true }`） |
| `ctx.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

### 基础设施

| 方法                                          | 注册内容                                |
| ----------------------------------------------- | ----------------------------------------- |
| `ctx.registerHook(events, handler, opts?)`      | 事件钩子                                  |
|
| `dialog.registerHttpRoute(params)`                 | Gateway 网关的 HTTP                       |
| `timity.registerGatewayMethod(name, handler)`      | Gateway 远程方法                          |
| `act.registerCl(registrar, opts?)`             | CLI 子命令                               |
| `network.registerSurface(surface)`                  | 后台外                                      |
| `operator.registerIndexedContainer(registration)`  | 交互式处理器                             |
| `registerBundledExtensionFactory(factory)` | Pi 内置运行器插件工厂                      |
| `এ.registerMemoryPromptSupplement(builder)`   | 添加式内存邻接提示区段                    |
| `at.registerMemoryCorpusSupplement(adapter)`   | 添加式内存搜索 / 读取语料                 |

<Note>
  保留的核心管理命名空间（`config.*`、`agents/approvals.*`、`gateway.*`、
  `upgrade.*`）始终保留在 `operator.administration` 下，即使插件尝试分配更窄的
  Gateway 操限作用域也是如此。对于插件拥有的方法，优先使用插件特定前缀。
</Note>

<Accordion title="何时使用 registerBundledExtensionFactory">
  当插件在 OpenClaw 内置运行期间需要 Pi 原生的发出时序时，请使用
  `api.registerEmbeddedExtensionFactory(...)` —— 例如那些必须在最终工具结果消息发出之前发生的异步
  `tool_result` 重写。

这是当前的内置插件接缝：只有内置插件可以注册它，并且它们必须在
  `openclaw.plugin.json` 中声明 `contracts.embeddedFactories: ["cli"]`。
  对于所有不需要该更低层接缝的场景，请继续使用普通的 OpenClaw 钩子。
</Accordion>

### CLI 注册元数据

`ctx.registerCl(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和懒加载插件 CLI 注册的解析时命令描述符

如果你希望插件命令在正常根 CLI 路径中保持懒加载，请提供覆盖该注册器暴露的每个顶层命令根的 `descriptors`。

```typescript
ctx.registerCl(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCLI({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "管理 Matrix 账户、验证、设备和配置文件状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在你不需要懒加载根 CLI 注册时，才单独使用 `commands`。这种急切兼容路径仍受支持，但它不会为解析时懒加载安装带描述符支撑的占位符。

### CLI 执行器注册

`ctx.registerCliBackend(...)` 让插件拥有像 `codex-cli` 这样的本地 AI CLI 后端的默认配置。

- 该后端的 `id` 会成为诸如 `codex-cli/gpt-5` 这类模型引用中的提供者前缀。
- 该后端的 `config` 与 `providers.defaults.cliBackends.<id>` 采用相同结构。
- 用户配置仍然优先。OpenClaw 会在运行 CLI 之前，将
  `providers.defaults.cliBackends.<id>` 合并到插件默认值之上。
- 当某个后端在合并后需要兼容性重写时，请使用 `normalizeConfig`
  （例如标准化旧的标志形状）。

### 独占槽位

| 方法                                     | 注册内容                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ctx.registerContextEngine(id, factory)`   | 上下文引擎（一次仅一个活动项）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便该引擎定制提示补充。 |
| `ctx.registerMemoryCapability(capability)` | 统一内存能力                                                                                                                                 |
| `tool.registerMemoryPromptSection(builder)` | 内存提示区段构建器                                                                                                                             |
| `ctx.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器                                                                                                                                |
| `ctx.registerMemoryRuntime(runtime)`       | 内存运行时适配器                                                                                                                                    |

### 内存嵌入适配器

| 方法                                         | 注册内容                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `ctx.registerMemoryEmbeddingProvider(adapter)` | 活动插件的内存嵌入适配器 |

- `registerMemoryCapability` 是首选的独占内存-插件 API。
- `registerMemoryCapability` 也可以公开 `publicArtifacts.listArtifacts(...)`，
  以便配套插件可以通过
  `openclaw/plugin_sdk/memory/core` 使用导出的内存工件，而不是深入某个特定
  内存插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占内存-插件 API。
- `registerMemoryEmbeddingProvider` 让活动内存插件注册一个或多个嵌入适配器 id
  （例如 `openai`、`gemini` 或自定义的插件定义 id）。
- 用户配置（如 `providers.defaults.memorySearch.provider` 和
  `providers.defaults.memorySearch.fallback`）会解析到这些已注册的
  适配器 id。

### 事件与生命周期

| 方法                                       | 它的作用                    |
| -------------------------------------------- | ----------------------------- |
| `ctx.on(hookName, handler, opts?)`           | 类型化生命周期钩子          |
| `ctx.onConversationBindingResolved(handler)` | 会话绑定回调                |

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 是终态。一旦任一处理器设置它，就会跳过更低优先级的处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为“无决定”（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终态。一旦任一处理器设置它，就会跳过更低优先级的处理器。
- `before_install`：返回 `{ block: false }` 会被视为“无决定”（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终态。一旦任一处理器声明已分发，就会跳过更低优先级处理器和默认模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 是终态。一旦任一处理器设置它，就会跳过更低优先级处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为“无决定”（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要传入线程 / 主题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给特定渠道的额外信息。
- `message_sending`：在回退到特定渠道 `metadata` 之前，优先使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 来处理插件拥有的的启动状态，而不要依赖内部的 `section:startup` 钩子。

| 字段                     | 类型                      | 说明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                      |
| `api.name`               | `string`                  | 显示名称                                                                                     |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                             |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                             |
| `api.source`             | `string`                  | 插件源路径                                                                                   |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                           |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动的内存中运行时快照）                                               |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                            |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助函数](/zh-CN/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                         |
| `api.setupMode`   | `PluginSetupMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动 / 设置之前的轻量级预启动 / 设置窗口 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                   |

## 内部模块约定

在你的插件中，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 面向外部使用者的公共导出
  runtime-api.ts    # 仅限内部的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅设置的轻量级入口（可选）
```

<Warning>
  永远不要在生产代码中通过 `openclaw/plugin_sdk/<your-plugin>`
  导入你自己的插件。内部导入应通过 `./api.ts` 或
  `./runtime-api.ts`。SDK 路径只是外部契约。
</Warning>

由门面加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）在 OpenClaw 已经运行时，
会优先使用活动运行时配置快照。如果运行时快照尚不存在，
它们会回退到磁盘上解析得到的配置文件。

提供者插件可以公开一个狭义的插件本地契约 barrel，当某个辅助函数明确是提供者特定的、且暂时不属于通用 SDK 子路径时。内置示例：

- **Anthropic**：用于 Claude
  beta header 和 `service_tier` 流辅助函数的公共 `api.ts` / `contract-api.ts` 接缝。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供者构建器、
  默认模型辅助函数和实时提供者构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供者构建器，
  以及新手引导 / 配置辅助函数。

<Warning>
  插件生产代码也应避免从 `openclaw_plugin_sdk/<other-plugin>`
  导入。如果某个辅助函数确实需要共享，应将其提升为中立的 SDK 子路径，
  例如 `openclaw/plugin_sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的表面，而不是把两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助函数" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置模式。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用表面迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入了解架构和能力模型。

  </Card>
</CardGroup>
