---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你想要一份 OpenClawPluginApi 上所有注册方法的参考
    - 你正在查找某个特定的 SDK 导出
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-05-11T20:32:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**应导入什么**以及**可以注册什么**的参考。

<Note>
  本页适用于在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于希望通过 Gateway 网关运行智能体的外部应用、脚本、仪表盘、CI 作业和 IDE 扩展，请改用 [OpenClaw 应用 SDK](/zh-CN/concepts/openclaw-sdk) 和 `@openclaw/sdk` 包。
</Note>

<Tip>
想找操作指南？从[构建插件](/zh-CN/plugins/building-plugins)开始；渠道插件请使用[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，提供商插件请使用[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端请使用 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，工具或生命周期钩子插件请使用[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这可以让启动保持快速，并避免循环依赖问题。对于特定渠道的入口/构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 留给更宽泛的总括表面和共享辅助函数，例如 `buildChannelConfigSchema`。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布由渠道拥有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 基元和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出保留在 `plugin-sdk/channel-config-schema-legacy`；两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带有提供商或渠道品牌名的便利接缝（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。内置插件会在自己的 `api.ts` / `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心消费者应使用这些插件本地 barrel，或在需求确实跨渠道时添加一个窄范围的通用 SDK 契约。

少量内置插件辅助接缝在有已跟踪的所有者使用时，仍会出现在生成的导出映射中。它们仅用于维护内置插件，不推荐作为新的第三方插件导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性 facade 保留，用于已跟踪的所有者使用。不要把这些导入路径复制到新插件中；请改用注入的运行时辅助函数和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的窄子路径暴露（插件入口、渠道、提供商、认证、运行时、能力、记忆，以及保留的内置插件辅助函数）。完整目录按组列出并带有链接，见[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径后，从公开子集生成的。运行 `pnpm plugin-sdk:surface` 来审计公开导出数量。足够旧且未被内置扩展生产代码使用的已弃用公开子路径，会在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用再导出 barrel 会在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调会接收一个带有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                       |
| `api.registerAgentHarness(...)`                  | 实验性低级智能体执行器                |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端                     |
| `api.registerChannel(...)`                       | 消息渠道                              |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转写                          |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话                      |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析                    |
| `api.registerImageGenerationProvider(...)`       | 图像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                              |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                              |
| `api.registerWebFetchProvider(...)`              | Web 抓取 / 抓取提供商                 |
| `api.registerWebSearchProvider(...)`             | Web 搜索                              |

### 工具和命令

| 方法                          | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`）     |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

当智能体需要一条简短、由命令拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。该文本应只描述命令本身；不要向核心提示构建器添加特定于提供商或插件的策略。

### 基础设施

| 方法                                           | 注册内容                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件钩子                                |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点                  |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法                   |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 网关发现通告器             |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                              |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 下的 Node 功能 CLI     |
| `api.registerService(service)`                 | 后台服务                                |
| `api.registerInteractiveHandler(registration)` | 交互式处理器                            |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件                    |
| `api.registerMemoryPromptSupplement(builder)`  | 追加式记忆相邻提示区段                  |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加式记忆搜索/读取语料库               |

### 工作流插件的主机钩子

主机钩子是插件需要参与主机生命周期时使用的 SDK 接缝，而不只是添加提供商、渠道或工具。它们是通用契约；Plan 模式可以使用它们，审批工作流、工作区策略门禁、后台监控器、设置向导和 UI 配套插件也可以使用它们。

| 方法                                                                                 | 它拥有的契约                                                                                                                      |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 由插件拥有、与 JSON 兼容，并通过 Gateway 网关会话投射的会话状态                                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 为一个会话注入到下一次智能体轮次中的持久、精确一次上下文                                                                          |
| `api.registerTrustedToolPolicy(...)`                                                 | 内置/可信的前置插件工具策略，可阻止或重写工具参数                                                                                 |
| `api.registerToolMetadata(...)`                                                      | 工具目录展示元数据，不更改工具实现                                                                                               |
| `api.registerCommand(...)`                                                           | 有作用域的插件命令；命令结果可以设置 `continueAgent: true`；Discord 原生命令支持 `descriptionLocalizations`                     |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 用于会话、工具、运行或设置表面的控制 UI 贡献描述符                                                                                |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置/删除/重新加载路径上清理插件拥有的运行时资源的回调                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监控器的已净化事件订阅                                                                                           |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次运行的插件暂存状态，会在终止运行生命周期时清除                                                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件拥有的调度器作业的清理元数据；不调度工作，也不创建任务记录                                                                    |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅内置插件可用、由主机媒介的文件附件投递到活跃的直接出站会话路由                                                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅内置插件可用、由 Cron 支持的定时会话轮次，以及基于标签的清理                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可通过 Gateway 网关分发的类型化会话操作                                                                                    |

新插件代码请使用分组命名空间：

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

等效的扁平方法仍作为已弃用的兼容性别名提供给现有插件使用。不要添加新的插件代码来直接调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag`。

`scheduleSessionTurn(...)` 是 Gateway 网关 Cron 调度器之上的会话级便捷封装。Cron 负责计时，并在轮次运行时创建后台任务记录；插件 SDK 只约束目标会话、插件拥有的命名以及清理。当工作本身需要持久的多步骤 Task Flow 状态时，请在计划轮次内使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮次注入和普通钩子。
- 可信工具策略会在普通 `before_tool_call` 钩子之前运行，并且仅限内置，因为它们参与宿主安全策略。
- 预留命令所有权仅限内置。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用会修改提示词的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 中的提示词字段，以及 `enqueueNextTurnInjection`。

非 Plan 使用者示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令继续、下一轮次注入、UI 描述符                                                                                           |
| 预算/工作区策略门控          | 可信工具策略、工具元数据、会话投影                                                                                                     |
| 后台生命周期监控             | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、Heartbeat 提示词贡献、UI 描述符                                            |
| 设置或新手引导向导           | 会话扩展、作用域命令、Control UI 描述符                                                                                                |

<Note>
  预留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持 `operator.admin`，即使插件尝试分配更窄的
  Gateway 网关方法作用域也是如此。插件拥有的方法优先使用插件专属前缀。
</Note>

<Accordion title="When to use tool-result middleware">
  当内置插件需要在工具执行之后、运行时将该结果反馈给模型之前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是用于异步输出归约器（例如 tokenjuice）的可信、运行时中立边界。

内置插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，
例如 `["pi", "codex"]`。外部插件不能注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通 OpenClaw 插件钩子。旧的仅限 Pi 的嵌入式扩展工厂注册路径已被移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在 mDNS/Bonjour 等本地设备发现传输协议上公布活动 Gateway 网关。启用本地设备发现时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理器。

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

Gateway 网关设备发现插件不得将公布的 TXT 值视为机密或身份验证。设备发现是路由提示；Gateway 网关身份验证和 TLS 固定仍然负责信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：用于 CLI 帮助、路由和懒加载插件 CLI 注册的解析时命令描述符
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于配对节点功能，优先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小型封装，并让 `openclaw nodes canvas` 等命令成为显式的插件拥有节点功能。

如果你希望插件命令在普通根 CLI 路径中保持懒加载，请提供覆盖该注册器暴露的每个顶级命令根的 `descriptors`。

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

嵌套命令会以 `program` 接收已解析的父命令：

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

只有在不需要懒加载根 CLI 注册时，才单独使用 `commands`。该急切兼容路径仍受支持，但它不会安装由描述符支持的占位符来进行解析时懒加载。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（例如 `codex-cli`）的默认配置。

- 后端 `id` 会成为 `codex-cli/gpt-5` 等模型引用中的提供商前缀。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的形状。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上，然后再运行 CLI。
- 当后端需要在合并后进行兼容性重写时，使用 `normalizeConfig`（例如规范化旧标志形状）。
- 对于属于 CLI 方言的请求级 argv 重写，使用 `resolveExecutionArgs`，例如将 OpenClaw 思考级别映射到原生 effort 标志。

端到端编写指南见
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（同一时间只能有一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎定制提示词附加内容。                    |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词段落构建器                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷写计划解析器                                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                          |

### 记忆嵌入适配器

| 方法                                           | 注册内容                             |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器             |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，
  使配套插件能够通过 `openclaw/plugin-sdk/memory-host-core` 消费导出的记忆工件，而不是访问特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是旧版兼容的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷写轮次固定到精确的 `provider/model`
  引用，例如 `ollama/qwen3:8b`，而不继承活动回退链。
- `registerMemoryEmbeddingProvider` 允许活动记忆插件注册一个或多个嵌入适配器 ID（例如 `openai`、`gemini`，或自定义插件定义的 ID）。
- 用户配置（例如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`）会根据这些已注册的适配器 ID 解析。

### 事件和生命周期

| 方法                                         | 作用                     |
| -------------------------------------------- | ------------------------ |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子       |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调             |

示例、常见钩子名称和守卫语义见 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性决策。一旦任何处理器设置它，低优先级处理器会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为没有决策（等同于省略 `block`），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性决策。一旦任何处理器设置它，低优先级处理器会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为没有决策（等同于省略 `block`），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性决策。一旦任何处理器声明分发，低优先级处理器和默认模型分发路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性决策。一旦任何处理器设置它，低优先级处理器会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为没有决策（等同于省略 `cancel`），而不是覆盖。
- `message_received`：当你需要入站线程/主题路由时，使用类型化 `threadId` 字段。将 `metadata` 保留给渠道特定的额外内容。
- `message_sending`：先使用类型化 `replyToId` / `threadId` 路由字段，再回退到渠道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变更。同步外部唤醒调度器时使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                    | 类型                      | 描述                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                   |
| `api.name`               | `string`                  | 显示名称                                                                                |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                   |
| `api.description`        | `string?`                 | 插件描述（可选）                                                               |
| `api.source`             | `string`                  | 插件源路径                                                                          |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                            |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃的内存中运行时快照）                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置                                   |
| `api.runtime`            | `PluginRuntime`           | [运行时助手](/zh-CN/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                        |

## 内部模块约定

在你的插件中，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 路由内部导入。SDK 路径仅作为外部合约。
</Warning>

通过 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）会在 OpenClaw 已运行时优先使用
活跃的运行时配置快照。如果尚不存在运行时快照，它们会回退到磁盘上解析出的配置文件。
打包后的内置插件 facade 应通过 OpenClaw 的插件
facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于插件自有代码的清单
和运行时 sidecar 检查。

提供商插件可以公开一个狭窄的插件本地合约 barrel，适用于某个
助手有意保持提供商专属，且尚不属于通用 SDK
子路径的情况。内置示例：

- **Anthropic**：用于 Claude
  beta-header 和 `service_tier` 流式助手的公共 `api.ts` / `contract-api.ts` 边界。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型助手和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器
  以及新手引导/配置助手。

<Warning>
  插件生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>`
  导入。如果某个助手确实是共享的，请将它提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
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
    打包、清单和配置 schema。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用表面迁移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入的架构和能力模型。
  </Card>
</CardGroup>
