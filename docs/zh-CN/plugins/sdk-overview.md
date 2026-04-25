---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你想查看 OpenClawPluginApi 上所有注册方法的参考文档
    - 你正在查找某个特定的 SDK 导出
sidebarTitle: SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-25T00:43:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4aedd09b7a02aeced8265c119d7d800f45d41780e5bf099826abee9a3c74c868
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是插件与核心之间的类型化契约。本页是
**该导入什么** 以及 **你可以注册什么** 的参考文档。

<Tip>
  在找操作指南而不是参考文档？

- 第一个插件？从 [构建插件](/zh-CN/plugins/building-plugins) 开始。
- 渠道插件？参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 提供商插件？参见 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。
- 工具或生命周期钩子插件？参见 [插件钩子](/zh-CN/plugins/hooks)。
  </Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、独立的模块。这可以保持启动快速，并
防止循环依赖问题。对于渠道专属入口 / 构建辅助工具，
优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给
更广义的总入口接口和共享辅助工具，例如
`buildChannelConfigSchema`。

对于渠道配置，请通过
`openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。
`plugin-sdk/channel-config-schema`
子路径用于共享 schema 原语和通用构建器。该子路径上任何
以内置渠道命名的 schema 导出都属于旧版兼容导出，
不是新插件应遵循的模式。

<Warning>
  不要导入带有提供商或渠道品牌的便捷接口（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用方要么使用这些插件本地
  barrel，要么在确实存在跨渠道需求时添加一个狭窄的通用 SDK 契约。

一小部分内置插件辅助接口（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` 及类似项）仍会出现在
生成的导出映射中。它们仅用于内置插件维护，
不建议新第三方插件导入。
</Warning>

## 子路径参考

插件 SDK 以一组按领域划分的狭窄子路径公开（插件
入口点、渠道、提供商、认证、运行时、能力、内存，以及为内置插件保留的
辅助工具）。完整目录 —— 按组分类并附链接 —— 请参见
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

200+ 子路径的生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

## 注册 API

`register(api)` 回调会接收一个 `OpenClawPluginApi` 对象，包含以下
方法：

### 能力注册

| 方法 | 注册内容 |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM） |
| `api.registerAgentHarness(...)`                  | 实验性的底层智能体执行器 |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端 |
| `api.registerChannel(...)`                       | 消息渠道 |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录 |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话 |
| `api.registerMediaUnderstandingProvider(...)`    | 图像 / 音频 / 视频分析 |
| `api.registerImageGenerationProvider(...)`       | 图像生成 |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成 |
| `api.registerVideoGenerationProvider(...)`       | 视频生成 |
| `api.registerWebFetchProvider(...)`              | 网页抓取 / 爬取提供商 |
| `api.registerWebSearchProvider(...)`             | 网页搜索 |

### 工具和命令

| 方法 | 注册内容 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`） |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM） |

### 基础设施

| 方法 | 注册内容 |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 事件钩子 |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点 |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法 |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关发现广播器 |
| `api.registerCli(registrar, opts?)`             | CLI 子命令 |
| `api.registerService(service)`                  | 后台服务 |
| `api.registerInteractiveHandler(registration)`  | 交互处理器 |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件 |
| `api.registerEmbeddedExtensionFactory(factory)` | 已弃用的 PI 扩展工厂 |
| `api.registerMemoryPromptSupplement(builder)`   | 追加型、邻接内存的提示词部分 |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加型内存搜索 / 读取语料库 |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件试图分配更窄的
  Gateway 网关方法作用域也是如此。对于插件自有方法，请优先使用插件专属前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当内置插件需要在工具执行之后、运行时
  将该结果回送给模型之前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是一个受信任的、运行时无关的
  扩展点，用于诸如 tokenjuice 这类异步输出缩减器。

内置插件必须为每个目标
运行时声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。外部插件
不能注册此中间件；对于不需要模型前工具结果时机的工作，
请继续使用常规 OpenClaw 插件钩子。
</Accordion>

<Accordion title="旧版 Pi 扩展工厂">
  `api.registerEmbeddedExtensionFactory(...)` 已弃用。它仍然是一个
  兼容性扩展点，用于仍需要直接 Pi
  嵌入式运行器事件的内置插件。新的工具结果转换应改用
  `api.registerAgentToolResultMiddleware(...)`。
</Accordion>

### Gateway 网关发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在本地发现传输层
（如 mDNS / Bonjour）上广播活动中的
Gateway 网关。OpenClaw 会在启用本地发现时于 Gateway 网关启动期间调用该
服务，传入当前 Gateway 网关端口和非 Secret TXT 提示数据，并在 Gateway 网关关闭期间调用返回的
`stop` 处理器。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 网关发现插件不得将已广播的 TXT 值视为 Secret 或
认证信息。设备发现只是路由提示；信任仍由 Gateway 网关认证和 TLS pinning 负责。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、
  路由和惰性插件 CLI 注册的解析时命令描述符

如果你希望插件命令在常规根 CLI 路径中保持惰性加载，
请提供 `descriptors`，覆盖该注册器暴露的每个顶层命令根。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "管理 Matrix 账号、验证、设备和配置档案状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅在你不需要惰性根 CLI 注册时才单独使用 `commands`。
这种急切兼容路径仍受支持，但它不会安装
用于解析时惰性加载的 descriptor 支持占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件为本地
AI CLI 后端（如 `codex-cli`）提供默认配置。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。运行 CLI 前，OpenClaw 会将 `agents.defaults.cliBackends.<id>` 合并到
  插件默认值之上。
- 当某个后端在合并后需要兼容性重写时，请使用 `normalizeConfig`
  （例如规范化旧的 flag 结构）。

### 独占槽位

| 方法 | 注册内容 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次仅一个活动项）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎定制提示词附加内容。 |
| `api.registerMemoryCapability(capability)` | 统一内存能力 |
| `api.registerMemoryPromptSection(builder)` | 内存提示词部分构建器 |
| `api.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器 |
| `api.registerMemoryRuntime(runtime)`       | 内存运行时适配器 |

### 内存嵌入适配器

| 方法 | 注册内容 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的内存嵌入适配器 |

- `registerMemoryCapability` 是首选的独占内存插件 API。
- `registerMemoryCapability` 还可以暴露 `publicArtifacts.listArtifacts(...)`，
  以便配套插件通过
  `openclaw/plugin-sdk/memory-host-core` 使用导出的内存工件，而不是深入某个特定
  内存插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占内存插件 API。
- `registerMemoryEmbeddingProvider` 允许活动内存插件注册一个
  或多个嵌入适配器 id（例如 `openai`、`gemini`，或某个自定义
  插件定义的 id）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`）会根据这些已注册的
  适配器 id 进行解析。

### 事件和生命周期

| 方法 | 作用 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子 |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调 |

示例、常见钩子名称和保护语义请参见 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性结果。一旦任意处理器设置它，就会跳过较低优先级处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性结果。一旦任意处理器设置它，就会跳过较低优先级处理器。
- `before_install`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性结果。一旦任意处理器接管分发，就会跳过较低优先级处理器和默认模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 是终止性结果。一旦任意处理器设置它，就会跳过较低优先级处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作出决定（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程 / 话题路由时，请使用类型化的 `threadId` 字段。`metadata` 保留给渠道专属附加信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到渠道专属 `metadata`。
- `gateway_start`：对于 Gateway 网关自有的启动状态，请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而不是依赖内部 `gateway:startup` 钩子。

### API 对象字段

| 字段 | 类型 | 描述 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id |
| `api.name`               | `string`                  | 显示名称 |
| `api.version`            | `string?`                 | 插件版本（可选） |
| `api.description`        | `string?`                 | 插件描述（可选） |
| `api.source`             | `string`                  | 插件源路径 |
| `api.rootDir`            | `string?`                 | 插件根目录（可选） |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动的内存运行时快照） |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置 |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime) |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动 / 设置前的轻量窗口 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径 |

## 内部模块约定

在你的插件内部，请使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 面向外部使用方的公共导出
  runtime-api.ts    # 仅内部运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅设置阶段的轻量入口点（可选）
```

<Warning>
  在生产代码中，绝不要通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。内部导入应通过 `./api.ts` 或
  `./runtime-api.ts` 进行。SDK 路径仅是对外契约。
</Warning>

由 facade 加载的内置插件公共接口（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 及类似公共入口文件）在
OpenClaw 已经运行时会优先使用活动运行时配置快照。如果尚不存在运行时
快照，它们会回退到磁盘上的已解析配置文件。

当某个辅助工具有意是提供商专属、且尚不属于某个通用 SDK
子路径时，提供商插件可以暴露一个狭窄的插件本地契约 barrel。内置示例：

- **Anthropic**：公共 `api.ts` / `contract-api.ts` 接口，用于 Claude
  beta header 和 `service_tier` 流式辅助工具。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型辅助工具和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器
  以及新手引导 / 配置辅助工具。

<Warning>
  扩展的生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实是共享的，请将其提升到一个中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  面向能力的接口，而不是将两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助工具" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置 schema。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用接口迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入的架构与能力模型。
  </Card>
</CardGroup>
