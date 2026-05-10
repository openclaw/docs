---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你想要一份 OpenClawPluginApi 上所有注册方法的参考。
    - 你正在查找特定的 SDK 导出
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-05-10T19:43:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**导入什么**以及**可以注册什么**的参考。

<Note>
  本页面面向在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于希望通过 Gateway 网关运行智能体的外部应用、脚本、仪表板、CI 任务和 IDE 扩展，请改用
  [OpenClaw 应用 SDK](/zh-CN/concepts/openclaw-sdk) 和 `@openclaw/sdk` 包。
</Note>

<Tip>
想找操作指南？从[构建插件](/zh-CN/plugins/building-plugins)开始；渠道插件使用[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，提供商插件使用[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端使用 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，工具或生命周期钩子插件使用[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这可以保持启动快速，并防止循环依赖问题。对于渠道专用的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更宽泛的总括表面以及共享辅助工具，例如
`buildChannelConfigSchema`。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 原语和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出仍保留在
`plugin-sdk/channel-config-schema-legacy`；这两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带有提供商或渠道品牌的便利接缝（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心消费者应使用这些插件本地
  barrel，或者在需求确实跨渠道时添加一个狭窄的通用 SDK 契约。

少量内置插件辅助接缝在存在已跟踪的所有者使用时，仍会出现在生成的导出映射中。它们仅用于内置插件维护，不建议作为新的第三方插件导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性 facade 保留，用于已跟踪的所有者使用。不要把这些导入路径复制到新插件中；请改用注入的运行时辅助工具和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的狭窄子路径暴露（插件入口、渠道、提供商、认证、运行时、能力、记忆，以及保留的内置插件辅助工具）。完整目录（已分组并带链接）见
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于
`scripts/lib/plugin-sdk-entrypoints.json`；包导出会在扣除列于
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 的仓库本地测试/内部子路径后，从公共子集生成。运行
`pnpm plugin-sdk:surface` 来审计公共导出数量。足够旧且未被内置扩展生产代码使用的已弃用公共子路径，会在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用再导出 barrel 会在
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调会收到一个包含以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                           | 注册内容                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                  |
| `api.registerAgentHarness(...)`                  | 实验性的低层级智能体执行器 |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端           |
| `api.registerChannel(...)`                       | 消息渠道                     |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成        |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录      |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话        |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析            |
| `api.registerImageGenerationProvider(...)`       | 图像生成                      |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                      |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                      |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商           |
| `api.registerWebSearchProvider(...)`             | Web 搜索                            |

### 工具和命令

| 方法                          | 注册内容                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`） |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）             |

当智能体需要一个简短的、由命令拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。让这段文本只描述命令本身；不要向核心提示词构建器添加提供商或插件专用策略。

### 基础设施

| 方法                                         | 注册内容                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件钩子                              |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法                      |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 网关发现广播器      |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                          |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 下的 Node 功能 CLI |
| `api.registerService(service)`                 | 后台服务                      |
| `api.registerInteractiveHandler(registration)` | 交互式处理器                     |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件          |
| `api.registerMemoryPromptSupplement(builder)`  | 增量式记忆相邻提示词部分 |
| `api.registerMemoryCorpusSupplement(adapter)`  | 增量式记忆搜索/读取语料      |

### 工作流插件的主机钩子

主机钩子是插件需要参与主机生命周期而不只是添加提供商、渠道或工具时使用的 SDK 接缝。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门禁、后台监视器、设置向导和 UI 配套插件也可以使用它们。

| 方法                                                                   | 拥有的契约                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | 插件拥有的、兼容 JSON 的会话状态，通过 Gateway 网关会话投射                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | 对一个会话的下一次智能体轮次注入持久的、恰好一次的上下文                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | 内置/受信任的插件前工具策略，可阻止或重写工具参数                                                      |
| `api.registerToolMetadata(...)`                                          | 工具目录显示元数据，不改变工具实现                                                            |
| `api.registerCommand(...)`                                               | 作用域化插件命令；命令结果可以设置 `continueAgent: true`；Discord 原生命令支持 `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | 面向会话、工具、运行或设置界面的控制 UI 贡献描述符                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | 在重置/删除/重载路径上清理插件拥有的运行时资源的回调                                                 |
| `api.registerAgentEventSubscription(...)`                                | 面向工作流状态和监视器的已净化事件订阅                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次运行的插件临时状态，会在终止运行生命周期时清除                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | 插件拥有的会话调度器任务记录，并具备确定性清理                                                             |

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入以及普通钩子。
- 受信任工具策略会在普通 `before_tool_call` 钩子之前运行，并且仅限内置插件，因为它们参与主机安全策略。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名或别名。
- `allowPromptInjection=false` 会禁用会修改提示词的钩子，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  来自旧版 `before_agent_start` 的提示词字段，以及
  `enqueueNextTurnInjection`。

非 Plan 消费者示例：

| 插件原型             | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流            | 会话扩展、命令延续、下一轮注入、UI 描述符                                                            |
| 预算/工作区策略门禁 | 受信任工具策略、工具元数据、会话投射                                                                                 |
| 后台生命周期监视器 | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、Heartbeat 提示词贡献、UI 描述符 |
| 设置或新手引导向导   | 会话扩展、作用域化命令、控制 UI 描述符                                                                              |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持 `operator.admin`，即使插件尝试分配更窄的 Gateway 网关方法作用域也是如此。插件拥有的方法应优先使用插件专用前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  内置插件可以在需要于执行后、运行时将工具结果反馈给模型前重写工具结果时，使用 `api.registerAgentToolResultMiddleware(...)`。这是用于 tokenjuice 等异步输出归约器的受信任、运行时中立衔接点。

内置插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。外部插件不能注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通的 OpenClaw 插件钩子。旧的仅限 Pi 的嵌入式扩展工厂注册路径已移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 让插件可以在 mDNS/Bonjour 等本地设备发现传输协议上通告活动的 Gateway 网关。当本地设备发现已启用时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理器。

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

Gateway 网关设备发现插件不得将通告的 TXT 值视为机密或认证信息。设备发现只是路由提示；Gateway 网关认证和 TLS 固定仍然负责信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：用于 CLI 帮助、路由和惰性插件 CLI 注册的解析期命令描述符
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于配对节点功能，优先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 外层的一个小包装，并让 `openclaw nodes canvas` 等命令成为显式由插件拥有的节点功能。

如果你希望插件命令在普通根 CLI 路径中保持惰性加载，请提供覆盖该注册器公开的每个顶级命令根的 `descriptors`。

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

嵌套命令会接收解析后的父命令作为 `program`：

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在不需要惰性根 CLI 注册时，才单独使用 `commands`。该急切兼容路径仍受支持，但它不会安装由描述符支持、用于解析期惰性加载的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 让插件可以拥有本地 AI CLI 后端（例如 `codex-cli`）的默认配置。

- 后端 `id` 会成为 `codex-cli/gpt-5` 等模型引用中的提供商前缀。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的形状。
- 用户配置仍然优先。OpenClaw 会在运行 CLI 前，将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上。
- 当后端需要在合并后进行兼容性重写时，使用 `normalizeConfig`（例如规范化旧的标志形状）。
- 对于属于 CLI 方言的请求级 argv 重写，使用 `resolveExecutionArgs`，例如将 OpenClaw 思考级别映射到原生 effort 标志。

端到端编写指南请参阅 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（同一时间一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎定制提示词附加内容。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词分区构建器                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                      |

### 记忆嵌入适配器

| 方法                                           | 注册内容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器         |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以公开 `publicArtifacts.listArtifacts(...)`，以便配套插件通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆制品，而不是访问特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到精确的 `provider/model` 引用，例如 `ollama/qwen3:8b`，而不继承活动的回退链。
- `registerMemoryEmbeddingProvider` 让活动记忆插件可以注册一个或多个嵌入适配器 ID（例如 `openai`、`gemini`，或插件定义的自定义 ID）。
- `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback` 等用户配置会根据这些已注册的适配器 ID 解析。

### 事件和生命周期

| 方法                                         | 作用                   |
| -------------------------------------------- | ---------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子     |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调           |

示例、常见钩子名称和守卫语义请参阅 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为未作决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任何处理器声明已分发，较低优先级的处理器和默认模型分发路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/主题路由时，使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道特定的附加信息。
- `message_sending`：在回退到渠道特定的 `metadata` 之前，优先使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变化。同步外部唤醒调度器时使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 ID                                                                                      |
| `api.name`               | `string`                  | 显示名称                                                                                     |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                             |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                             |
| `api.source`             | `string`                  | 插件源路径                                                                                   |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                           |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动的内存中运行时快照）                                               |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                            |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口前的轻量级启动/设置窗口                            |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                   |

## 内部模块约定

在你的插件中，对内部导入使用本地 barrel 文件：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入你自己的插件。请通过 `./api.ts` 或 `./runtime-api.ts` 路由内部导入。SDK 路径仅作为外部契约。
</Warning>

通过门面加载的内置插件公共接口表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）会在 OpenClaw 已在运行时优先使用
活动运行时配置快照。如果尚不存在运行时快照，它们会回退到磁盘上已解析的配置文件。
打包后的内置插件门面应通过 OpenClaw 的插件门面加载器加载；直接从 `dist/extensions/...`
导入会绕过打包安装用于插件自有代码的清单和运行时伴随检查。

提供商插件可以暴露一个狭窄的插件本地契约 barrel，适用于某个助手明确是提供商特定的、
且尚不属于通用 SDK 子路径的情况。内置示例：

- **Anthropic**：用于 Claude beta-header 和 `service_tier` 流助手的公共 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、默认模型助手和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器以及新手引导/配置助手。

<Warning>
  插件生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>`
  导入。如果某个助手确实是共享的，请将其提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的表面，而不是把两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置架构。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用表面迁移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
