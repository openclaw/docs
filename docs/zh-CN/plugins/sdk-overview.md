---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你需要 OpenClawPluginApi 上所有注册方法的参考
    - 你正在查找某个特定的 SDK 导出项
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-05-04T18:18:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**要导入什么**以及**可以注册什么**的参考。

<Note>
  本页面适用于在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于想通过 Gateway 网关运行智能体的外部应用、脚本、仪表板、CI 作业和 IDE 扩展，请改用
  [OpenClaw 应用 SDK](/zh-CN/concepts/openclaw-sdk) 和 `@openclaw/sdk` 包。
</Note>

<Tip>
想找操作指南？请从[构建插件](/zh-CN/plugins/building-plugins)开始；渠道插件请使用[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，提供商插件请使用[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，工具或生命周期钩子插件请使用[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这样可以保持启动快速，并防止循环依赖问题。对于渠道专用的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更宽泛的总括接口以及共享辅助工具，例如 `buildChannelConfigSchema`。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布渠道拥有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 原语和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已废弃的兼容性导出仍保留在 `plugin-sdk/channel-config-schema-legacy`；这两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带有提供商或渠道品牌的便利衔接层（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。内置插件会在自己的 `api.ts` /
  `runtime-api.ts` barrel 内组合通用 SDK 子路径；核心消费者应使用这些插件本地 barrel，或者在需求确实跨渠道时添加一个窄的通用 SDK 契约。

当一小部分内置插件辅助衔接层有已跟踪的所有者使用时，它们仍会出现在生成的导出映射中。它们仅用于内置插件维护，不建议作为新第三方插件的导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已废弃的兼容性 facade 保留，用于已跟踪的所有者使用。不要将这些导入路径复制到新插件中；请改用注入的运行时辅助工具和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的窄子路径公开（插件入口、渠道、提供商、凭证、运行时、能力、记忆，以及保留的内置插件辅助工具）。完整目录（已分组并附链接）请参阅
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

生成的 200+ 个子路径列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

## 注册 API

`register(api)` 回调会收到一个 `OpenClawPluginApi` 对象，其中包含这些方法：

### 能力注册

| 方法                                             | 注册内容                              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                       |
| `api.registerAgentHarness(...)`                  | 实验性低层级智能体执行器              |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端                     |
| `api.registerChannel(...)`                       | 消息渠道                              |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成                 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                          |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话                      |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析                    |
| `api.registerImageGenerationProvider(...)`       | 图像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                              |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                              |
| `api.registerWebFetchProvider(...)`              | Web 抓取 / 爬取提供商                 |
| `api.registerWebSearchProvider(...)`             | Web 搜索                              |

### 工具和命令

| 方法                           | 注册内容                                      |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`）     |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

当智能体需要一条简短的、由命令拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。让这段文本只说明命令本身；不要向核心提示构建器添加提供商或插件专用策略。

### 基础设施

| 方法                                           | 注册内容                              |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件钩子                              |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点                |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法                 |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 网关发现广播器           |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                            |
| `api.registerService(service)`                 | 后台服务                              |
| `api.registerInteractiveHandler(registration)` | 交互式处理器                          |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件                  |
| `api.registerMemoryPromptSupplement(builder)`  | 追加式记忆相邻提示部分                |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加式记忆搜索/读取语料库             |

### 工作流插件的宿主钩子

宿主钩子是插件需要参与宿主生命周期，而不只是添加提供商、渠道或工具时使用的 SDK 衔接层。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门禁、后台监视器、设置向导和 UI 配套插件也可以使用它们。

| 方法                                                                     | 它拥有的契约                                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | 插件拥有的、JSON 兼容的会话状态，通过 Gateway 网关会话投射                                                                           |
| `api.enqueueNextTurnInjection(...)`                                      | 持久、仅一次的上下文，注入到某个会话的下一轮智能体回合                                                                               |
| `api.registerTrustedToolPolicy(...)`                                     | 内置/可信的插件前工具策略，可以阻止或重写工具参数                                                                                    |
| `api.registerToolMetadata(...)`                                          | 工具目录展示元数据，不改变工具实现                                                                                                    |
| `api.registerCommand(...)`                                               | 有作用域的插件命令；命令结果可以设置 `continueAgent: true`；Discord 原生命令支持 `descriptionLocalizations`                         |
| `api.registerControlUiDescriptor(...)`                                   | 面向会话、工具、运行或设置界面的 Control UI 贡献描述符                                                                               |
| `api.registerRuntimeLifecycle(...)`                                      | reset/delete/reload 路径上插件拥有的运行时资源清理回调                                                                               |
| `api.registerAgentEventSubscription(...)`                                | 面向工作流状态和监视器的已净化事件订阅                                                                                                |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 每次运行的插件临时状态，会在终止运行生命周期时清除                                                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | 插件拥有的会话调度器作业记录，并具备确定性清理                                                                                       |

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入和普通钩子。
- 可信工具策略会在普通 `before_tool_call` 钩子之前运行，并且仅限内置插件，因为它们参与宿主安全策略。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用会改变提示的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、来自旧版 `before_agent_start` 的提示字段，以及 `enqueueNextTurnInjection`。

非 Plan 消费者示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令续行、下一轮注入、UI 描述符                                                                                              |
| 预算/工作区策略门禁          | 可信工具策略、工具元数据、会话投射                                                                                                      |
| 后台生命周期监视器           | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、heartbeat 提示贡献、UI 描述符                                               |
| 设置或新手引导向导           | 会话扩展、有作用域的命令、Control UI 描述符                                                                                             |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持为 `operator.admin`，即使插件试图分配一个更窄的网关方法作用域也是如此。插件拥有的方法请优先使用插件专用前缀。
</Note>

<Accordion title="When to use tool-result middleware">
  当内置插件需要在工具执行之后、运行时将结果送回模型之前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是面向 tokenjuice 等异步输出 reducer 的可信、运行时中立衔接层。

内置插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。外部插件不能注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通 OpenClaw 插件钩子。旧的仅 Pi 嵌入式扩展工厂注册路径已移除。
</Accordion>

### Gateway 网关发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在 mDNS/Bonjour 等本地设备发现传输协议上通告活动的 Gateway 网关。启用本地设备发现时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理程序。

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

Gateway 网关设备发现插件不得将通告的 TXT 值视为密钥或身份验证。设备发现只是路由提示；Gateway 网关身份验证和 TLS 固定仍然负责信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种顶层元数据：

- `commands`：注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和延迟插件 CLI 注册的解析时命令描述符

如果你希望插件命令在正常的根 CLI 路径中保持延迟加载，请提供覆盖该注册器公开的每个顶层命令根的 `descriptors`。

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

仅在不需要延迟根 CLI 注册时，才单独使用 `commands`。该急切兼容路径仍受支持，但它不会为解析时延迟加载安装由描述符支撑的占位项。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（例如 `codex-cli`）的默认配置。

- 后端 `id` 会成为 `codex-cli/gpt-5` 等模型引用中的提供商前缀。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上，然后再运行 CLI。
- 当后端需要在合并后进行兼容性重写时（例如规范化旧的 flag 结构），请使用 `normalizeConfig`。
- 对于属于 CLI 方言的请求范围 argv 重写，请使用 `resolveExecutionArgs`，例如将 OpenClaw 思考级别映射到原生 effort flag。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎定制提示词补充内容。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词段落构建器                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                     |

### 记忆嵌入适配器

| 方法                                           | 注册内容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器 |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以公开 `publicArtifacts.listArtifacts(...)`，这样配套插件就能通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆制品，而不必访问某个特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是与旧版兼容的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到精确的 `provider/model` 引用，例如 `ollama/qwen3:8b`，而不继承活动的回退链。
- `registerMemoryEmbeddingProvider` 允许活动记忆插件注册一个或多个嵌入适配器 ID（例如 `openai`、`gemini`，或插件定义的自定义 ID）。
- `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback` 等用户配置会根据这些已注册的适配器 ID 进行解析。

### 事件和生命周期

| 方法                                         | 作用             |
| -------------------------------------------- | ---------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子 |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调     |

示例、常用钩子名称和保护语义请参见 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

- `before_tool_call`：返回 `{ block: true }` 会终止处理。一旦任一处理程序设置它，较低优先级的处理程序会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 会终止处理。一旦任一处理程序设置它，较低优先级的处理程序会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 会终止处理。一旦任一处理程序声明已处理分发，较低优先级的处理程序和默认模型分发路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 会终止处理。一旦任一处理程序设置它，较低优先级的处理程序会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为没有决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/话题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道特定的额外数据。
- `message_sending`：先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到渠道特定的 `metadata`。
- `gateway_start`：请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变化。在同步外部唤醒调度器时，请使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | 插件 ID                                                                                    |
| `api.name`               | `string`                  | 显示名称                                                                                   |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                           |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                           |
| `api.source`             | `string`                  | 插件源路径                                                                                 |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                         |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动内存运行时快照）                                                 |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                           |
| `api.runtime`            | `PluginRuntime`           | [运行时帮助函数](/zh-CN/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口                          |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                 |

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
  `./runtime-api.ts` 路由内部导入。SDK 路径仅是外部契约。
</Warning>

由 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）会在 OpenClaw 已运行时优先使用活动运行时配置快照。如果尚不存在运行时快照，它们会回退到磁盘上解析出的配置文件。打包的内置插件 facade 应通过 OpenClaw 的插件 facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于插件拥有代码的清单和运行时 sidecar 检查。

当某个帮助函数有意是提供商特定的，并且尚不属于通用 SDK 子路径时，提供商插件可以公开一个很窄的插件本地契约 barrel。内置示例：

- **Anthropic**：用于 Claude beta-header 和 `service_tier` 流式帮助函数的公共 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、默认模型帮助函数和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器以及新手引导/配置帮助函数。

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。如果某个帮助函数确实是共享的，请将它提升到中立的 SDK 子路径，例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一个面向能力的表面，而不是把两个插件耦合在一起。
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
    打包、清单和配置架构。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和代码检查规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用的接口迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入的架构和能力模型。
  </Card>
</CardGroup>
