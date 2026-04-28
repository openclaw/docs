---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你想查看 OpenClawPluginApi 上所有注册方法的参考资料
    - 你正在查找某个特定的 SDK 导出内容
sidebarTitle: SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-28T02:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4dbfde366d735863f5d22ce64d2ff812826989c2e4fd173173a26da62a3c786
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**导入什么**以及**你可以注册什么**的参考资料。

<Tip>
  想找操作指南而不是参考资料？

- 第一个插件？从 [构建插件](/zh-CN/plugins/building-plugins) 开始。
- 渠道插件？参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 提供商插件？参见 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。
- 工具或生命周期钩子插件？参见 [插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从特定的子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、独立的模块。这样可以保持快速启动，并防止循环依赖问题。对于特定于渠道的入口/构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更广泛的总括性接口和共享辅助函数，例如 `buildChannelConfigSchema`。

对于渠道配置，通过 `openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享的 schema 基元和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出仍保留在 `plugin-sdk/channel-config-schema-legacy` 上；这两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带有 provider 或渠道品牌的便捷接口层（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用方要么应使用这些插件本地的
  barrel，要么在需求确实跨渠道时添加一个狭义的通用 SDK 契约。

生成的导出映射中仍会出现少量内置插件辅助接口层（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` 及类似项）。它们仅用于内置插件维护，
不推荐作为新的第三方插件导入路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的狭义子路径形式公开（插件入口、渠道、提供商、认证、运行时、能力、记忆，以及保留给内置插件的辅助函数）。完整目录（按组分类并带链接）请参见
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

这份包含 200 多个子路径的生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

## 注册 API

`register(api)` 回调会接收一个带有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                 |
| ------------------------------------------------ | ------------------------ |
| `api.registerProvider(...)`                      | 文本推理（LLM）          |
| `api.registerAgentHarness(...)`                  | 实验性的底层智能体执行器 |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端        |
| `api.registerChannel(...)`                       | 消息渠道                 |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成    |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录             |
| `api.registerRealtimeVoiceProvider(...)`         | 双向实时语音会话         |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析       |
| `api.registerImageGenerationProvider(...)`       | 图像生成                 |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                 |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                 |
| `api.registerWebFetchProvider(...)`              | 网页抓取 / 抓取提供商    |
| `api.registerWebSearchProvider(...)`             | 网页搜索                 |

### 工具和命令

| 方法                            | 注册内容                                       |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需，或 `{ optional: true }`）    |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                         |

当智能体需要一个简短、命令自有的路由提示时，插件命令可以设置 `agentPromptGuidance`。请将这段文本限制在命令本身，不要向核心提示构建器中添加特定于提供商或插件的策略。

### 基础设施

| 方法                                           | 注册内容                     |
| ---------------------------------------------- | ---------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件钩子                     |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点       |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法        |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 网关发现广播器  |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                   |
| `api.registerService(service)`                 | 后台服务                     |
| `api.registerInteractiveHandler(registration)` | 交互式处理器                 |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件         |
| `api.registerMemoryPromptSupplement(builder)`  | 增量式记忆相邻提示区段       |
| `api.registerMemoryCorpusSupplement(adapter)`  | 增量式记忆搜索/读取语料库    |

### 工作流插件的宿主钩子

宿主钩子是供需要参与宿主生命周期的插件使用的 SDK 接口层，而不仅仅是添加一个提供商、渠道或工具。它们是通用契约；Plan Mode 可以使用它们，但审批工作流、工作区策略门禁、后台监控器、设置向导和 UI 配套插件也可以使用。

| 方法                                                                     | 所属契约                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `api.registerSessionExtension(...)`                                      | 由插件拥有的、兼容 JSON 的会话状态，通过 Gateway 网关会话进行投影                    |
| `api.enqueueNextTurnInjection(...)`                                      | 持久化且精确一次地注入到单个会话下一次智能体轮次中的上下文                           |
| `api.registerTrustedToolPolicy(...)`                                     | 内置/受信任的、在插件前执行的工具策略，可阻止或重写工具参数                           |
| `api.registerToolMetadata(...)`                                          | 不改变工具实现的前提下，为工具目录显示注册元数据                                     |
| `api.registerCommand(...)`                                               | 作用域化的插件命令；命令结果可以设置 `continueAgent: true`                            |
| `api.registerControlUiDescriptor(...)`                                   | 为会话、工具、运行或设置界面提供 Control UI 贡献描述符                               |
| `api.registerRuntimeLifecycle(...)`                                      | 在重置/删除/重载路径上清理插件拥有的运行时资源的回调                                  |
| `api.registerAgentEventSubscription(...)`                                | 用于工作流状态和监控器的脱敏事件订阅                                                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次运行的插件临时状态，在终结的运行生命周期中清除                                   |
| `api.registerSessionSchedulerJob(...)`                                   | 由插件拥有的会话调度器作业记录，并带有确定性的清理机制                               |

这些契约有意拆分了权限边界：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入和常规钩子。
- 受信任的工具策略会在普通的 `before_tool_call` 钩子之前运行，并且仅限内置插件，因为它们参与宿主安全策略。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用会修改提示的钩子，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  旧版 `before_agent_start` 中的提示字段，以及
  `enqueueNextTurnInjection`。

非 Plan 使用者示例：

| 插件原型                   | 使用的钩子                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| 审批工作流                 | 会话扩展、命令续接、下一轮注入、UI 描述符                                                        |
| 预算/工作区策略门禁        | 受信任的工具策略、工具元数据、会话投影                                                           |
| 后台生命周期监控器         | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、心跳提示贡献、UI 描述符               |
| 设置或新手引导向导         | 会话扩展、作用域化命令、Control UI 描述符                                                        |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件尝试分配更窄的
  Gateway 网关方法作用域也是如此。对于插件自有方法，优先使用插件特定的前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当内置插件需要在工具执行之后、运行时将结果送回模型之前重写工具结果时，
  可以使用 `api.registerAgentToolResultMiddleware(...)`。这是一个受信任的、
  与运行时无关的接口层，适用于 tokenjuice 之类的异步输出归约器。

内置插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如
  `["pi", "codex"]`。外部插件
  不能注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通的 OpenClaw 插件钩子。旧的仅限 Pi 的嵌入式扩展工厂注册路径已被移除。
</Accordion>

### Gateway 网关发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在本地发现传输协议（例如 mDNS/Bonjour）上广播活动中的 Gateway 网关。启用本地设备发现时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密的 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理器。

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

Gateway 网关发现插件不得将已广播的 TXT 值视为机密信息或认证信息。设备发现只是路由提示；信任仍由 Gateway 网关认证和 TLS pinning 负责。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由注册器拥有的显式命令根
- `descriptors`：在解析时使用的命令描述符，用于根 CLI 帮助、路由和懒加载插件 CLI 注册

如果你希望某个插件命令在常规根 CLI 路径中保持懒加载，
请提供覆盖该注册器暴露的每个顶层命令根的 `descriptors`。

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

仅在你不需要懒加载的根 CLI 注册时，才单独使用 `commands`。
这种急切兼容路径仍然受支持，但它不会安装由 descriptor 支持的占位符用于解析时懒加载。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（例如 `codex-cli`）的默认配置。

- 后端的 `id` 会成为模型引用中的 provider 前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会在运行 CLI 之前，将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上。
- 当后端在合并后需要兼容性重写时，使用 `normalizeConfig`（例如规范化旧的 flag 结构）。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎可以定制提示补充内容。                 |
| `api.registerMemoryCapability(capability)` | 统一的记忆能力                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | 记忆提示区段构建器                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                         |

### 记忆嵌入适配器

| 方法                                           | 注册内容                            |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器            |

- `registerMemoryCapability` 是首选的独占式记忆插件 API。
- `registerMemoryCapability` 还可以暴露 `publicArtifacts.listArtifacts(...)`，
  这样配套插件就可以通过
  `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆工件，而不必深入某个特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占式记忆插件 API。
- `registerMemoryEmbeddingProvider` 允许活动中的记忆插件注册一个或多个嵌入适配器 id（例如 `openai`、`gemini`，或自定义的插件定义 id）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`）会根据这些已注册的适配器 id 进行解析。

### 事件和生命周期

| 方法                                         | 作用                     |
| -------------------------------------------- | ------------------------ |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子       |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调             |

示例、常见钩子名称和守卫语义请参见 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 为终止性决定。一旦任一处理器设置它，就会跳过优先级更低的处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 为终止性决定。一旦任一处理器设置它，就会跳过优先级更低的处理器。
- `before_install`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 为终止性决定。一旦任一处理器认领分发，就会跳过优先级更低的处理器以及默认模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 为终止性决定。一旦任一处理器设置它，就会跳过优先级更低的处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作决定（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/主题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给特定于渠道的额外信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，再退回到特定于渠道的 `metadata`。
- `gateway_start`：请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部的 `gateway:startup` 钩子。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                     |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                  |
| `api.name`               | `string`                  | 显示名称                                                                                 |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                         |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                         |
| `api.source`             | `string`                  | 插件源路径                                                                               |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                       |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（如果可用，则为活动中的内存运行时快照）                                    |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                       |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助函数](/zh-CN/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | 有作用域的日志记录器（`debug`、`info`、`warn`、`error`）                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置前的轻量启动/设置窗口                |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                               |

## 内部模块约定

在你的插件内部，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 供外部使用方使用的公共导出
  runtime-api.ts    # 仅供内部运行时使用的导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅用于轻量设置的入口（可选）
```

<Warning>
  在生产代码中，绝不要通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 路由内部导入。SDK 路径仅是对外契约。
</Warning>

由 facade 加载的内置插件公共接口（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）在 OpenClaw 已经运行时，会优先使用当前活动的运行时配置快照。如果运行时快照尚不存在，它们会回退到磁盘上已解析的配置文件。
打包后的内置插件 facade 应通过 OpenClaw SDK facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于插件自有依赖项的分阶段运行时依赖镜像。

当某个辅助函数明确是 provider 特定的，且尚不属于通用 SDK 子路径时，provider 插件可以暴露一个狭义的插件本地契约 barrel。内置示例：

- **Anthropic**：公共 `api.ts` / `contract-api.ts` 接口层，用于 Claude
  beta-header 和 `service_tier` 流辅助函数。
- **`@openclaw/openai-provider`**：`api.ts` 导出 provider 构建器、
  默认模型辅助函数和实时 provider 构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出 provider 构建器
  以及新手引导/配置辅助函数。

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助函数确实是共享的，应将其提升到中性的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  面向能力的接口，而不是将两个插件耦合在一起。
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
    打包、清单和配置 schema。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用接口迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入了解架构和能力模型。
  </Card>
</CardGroup>
