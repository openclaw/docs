---
read_when:
    - 你需要知道应该从哪个 SDK 子路径导入
    - 你想要一份 OpenClawPluginApi 上所有注册方法的参考说明
    - 你正在查找某个特定的 SDK 导出项
sidebarTitle: SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-24T19:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 791b22f4753094ab1e0d26fb4d471cd400e9a34be699736fb96646d9e620d3cb
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**导入什么**以及**你可以注册什么**的参考。

<Tip>
  在找操作指南而不是参考说明？

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

每个子路径都是一个小型、独立的模块。这样可以保持启动速度快，
并防止循环依赖问题。对于渠道专用的入口/构建辅助工具，
优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给
更广泛的总入口 surface 和共享辅助工具，例如
`buildChannelConfigSchema`。

<Warning>
  不要导入带有提供商或渠道品牌的便捷 seam（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用方应改用这些插件本地
  barrel，或者在确实存在跨渠道需求时添加一个窄而通用的 SDK 契约。

一小部分内置插件辅助 seam（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` 等）仍会出现在
生成的导出映射中。它们仅供内置插件维护使用，
不建议作为新的第三方插件的导入路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的窄子路径形式公开（插件
入口、渠道、提供商、认证、运行时、能力、Memory，以及保留的
内置插件辅助工具）。有关完整目录——按组分类并带链接——请参阅
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

这份包含 200 多个子路径的生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

## 注册 API

`register(api)` 回调会接收一个带有以下
方法的 `OpenClawPluginApi` 对象：

### 能力注册

| Method                                           | 注册内容                  |
| ------------------------------------------------ | ------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）           |
| `api.registerAgentHarness(...)`                  | 实验性低层智能体执行器    |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端         |
| `api.registerChannel(...)`                       | 消息渠道                  |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成     |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录              |
| `api.registerRealtimeVoiceProvider(...)`         | 双向实时语音会话          |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析        |
| `api.registerImageGenerationProvider(...)`       | 图像生成                  |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                  |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                  |
| `api.registerWebFetchProvider(...)`              | Web 抓取 / 爬取提供商     |
| `api.registerWebSearchProvider(...)`             | Web 搜索                  |

### 工具和命令

| Method                          | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需，或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

### 基础设施

| Method                                          | 注册内容                            |
| ----------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                            |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点              |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法               |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关发现广播器         |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                          |
| `api.registerService(service)`                  | 后台服务                            |
| `api.registerInteractiveHandler(registration)`  | 交互处理器                          |
| `api.registerAgentToolResultMiddleware(...)`    | Harness 工具结果中间件              |
| `api.registerEmbeddedExtensionFactory(factory)` | 已弃用的 PI 扩展工厂                |
| `api.registerMemoryPromptSupplement(builder)`   | 附加型 Memory 邻接提示区段          |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加型 Memory 搜索/读取语料         |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件尝试分配
  更窄的 Gateway 网关方法作用域也是如此。对于插件自有的方法，请优先使用插件专用前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当插件需要在工具执行之后、harness 将该
  结果送回模型之前重写工具结果时，请使用 `api.registerAgentToolResultMiddleware(...)`。
  这是用于异步输出
  reducer（例如 tokenjuice）的 harness 无关 seam。

插件必须为每个目标
harness 声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex-app-server"]`。对于不需要模型前工具结果时序的工作，
请继续使用普通的 OpenClaw
插件钩子。
</Accordion>

<Accordion title="旧版 Pi 扩展工厂">
  `api.registerEmbeddedExtensionFactory(...)` 已弃用。它仍然是一个
  兼容性 seam，用于那些仍需直接处理 Pi
  embedded-runner 事件的内置插件。新的工具结果转换应改用
  `api.registerAgentToolResultMiddleware(...)`。
</Accordion>

### Gateway 网关发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件通过本地发现传输协议（如 mDNS/Bonjour）广播活动中的
Gateway 网关。启用本地发现时，OpenClaw 会在
Gateway 网关启动期间调用该服务，传入当前的
Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的
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

Gateway 网关发现插件不得将已广播的 TXT 值视为机密信息或
认证信息。发现只是路由提示；信任仍由 Gateway 网关认证和 TLS pinning 负责。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由 registrar 拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、
  路由和延迟插件 CLI 注册的解析时命令描述符

如果你希望插件命令在正常的根 CLI 路径中保持延迟加载，
请提供 `descriptors`，覆盖该 registrar 暴露的每个顶层命令根。

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
        description: "管理 Matrix 账户、验证、设备和配置文件状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在你不需要延迟根 CLI 注册时，才单独使用 `commands`。
这种预加载兼容路径仍受支持，但它不会安装
基于 descriptor 的占位符来支持解析时延迟加载。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地
AI CLI 后端（如 `codex-cli`）的默认配置。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先生效。OpenClaw 会在运行 CLI 之前，将 `agents.defaults.cliBackends.<id>` 合并到
  插件默认值之上。
- 当后端在合并后需要执行兼容性重写时，请使用 `normalizeConfig`
  （例如规范化旧版 flag 结构）。

### 独占插槽

| Method                                     | 注册内容                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，这样该引擎就可以定制提示附加内容。 |
| `api.registerMemoryCapability(capability)` | 统一 Memory 能力                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Memory 提示区段构建器                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan 解析器                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Memory 运行时适配器                                                                                                                           |

### Memory 嵌入适配器

| Method                                         | 注册内容                          |
| ---------------------------------------------- | --------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 当前活动插件的 Memory 嵌入适配器  |

- `registerMemoryCapability` 是首选的独占 Memory 插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，
  以便配套插件通过
  `openclaw/plugin-sdk/memory-host-core` 消费导出的 Memory 制品，而不是深入到特定
  Memory 插件的私有布局中。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占 Memory 插件 API。
- `registerMemoryEmbeddingProvider` 允许活动 Memory 插件注册一个
  或多个嵌入适配器 ID（例如 `openai`、`gemini` 或自定义
  插件定义的 ID）。
- 用户配置，例如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`，会针对这些已注册的
  适配器 ID 进行解析。

### 事件和生命周期

| Method                                       | 作用                  |
| -------------------------------------------- | --------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子    |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调          |

有关示例、常见钩子名称和 guard
语义，请参阅 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置了它，就会跳过更低优先级的处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置了它，就会跳过更低优先级的处理器。
- `before_install`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任何处理器声明已处理分发，就会跳过更低优先级的处理器以及默认模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理器设置了它，就会跳过更低优先级的处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作出决定（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/话题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道专用的额外信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，然后再回退到渠道专用的 `metadata`。
- `gateway_start`：对于 Gateway 网关自有的启动状态，请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而不要依赖内部的 `gateway:startup` 钩子。

### API 对象字段

| Field                    | Type                      | Description                                                           |
| ------------------------ | ------------------------- | --------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 ID                                                               |
| `api.name`               | `string`                  | 显示名称                                                              |
| `api.version`            | `string?`                 | 插件版本（可选）                                                      |
| `api.description`        | `string?`                 | 插件描述（可选）                                                      |
| `api.source`             | `string`                  | 插件源码路径                                                          |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                    |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动内存运行时快照）                            |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专用配置                     |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                |
| `api.logger`             | `PluginLogger`            | 作用域 logger（`debug`、`info`、`warn`、`error`）                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口前的轻量启动/设置窗口       |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                            |

## 内部模块约定

在你的插件内部，对内部导入使用本地 barrel 文件：

```
my-plugin/
  api.ts            # 面向外部使用方的公开导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅设置用的轻量入口（可选）
```

<Warning>
  不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。内部导入应通过 `./api.ts` 或
  `./runtime-api.ts`。SDK 路径仅是外部契约。
</Warning>

由 facade 加载的内置插件公共 surface（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）在
OpenClaw 已经运行时，优先使用活动运行时配置快照。如果尚不存在运行时
快照，则回退到磁盘上解析得到的配置文件。

提供商插件可以暴露一个窄的插件本地契约 barrel，当某个
辅助工具本身就是提供商专用、且暂时不属于通用 SDK
子路径时可以这样做。内置示例：

- **Anthropic**：公开的 `api.ts` / `contract-api.ts` seam，用于 Claude
  beta-header 和 `service_tier` 流式辅助工具。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型辅助工具以及实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器，
  以及新手引导/配置辅助工具。

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实需要共享，应将其提升为中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的 surface，而不是让两个插件彼此耦合。
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
    从已弃用 surface 迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入了解架构和能力模型。
  </Card>
</CardGroup>
