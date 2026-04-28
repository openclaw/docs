---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 `api.registerEmbeddedExtensionFactory`
    - 你正在将一个插件更新到现代插件架构
    - 你在维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-28T01:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0620977a2ded8518b00fa7b14c8860ff351530926af76c02d08c699028f0fbc3
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，提供聚焦且有文档说明的导入路径。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 正在发生的变化

旧插件系统提供了两个开放度很高的接口面，允许插件从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 一个单一导入路径，重新导出了几十个辅助工具。它的引入是为了在构建新插件架构期间，让旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** — 一个宽泛的运行时辅助 barrel，混合了系统事件、heartbeat 状态、投递队列、fetch/proxy 辅助工具、文件辅助工具、审批类型以及无关的实用工具。
- **`openclaw/plugin-sdk/config-runtime`** — 一个宽泛的配置兼容性 barrel，在迁移窗口期间仍然承载已弃用的直接加载/写入辅助工具。
- **`openclaw/extension-api`** — 一个桥接层，让插件能够直接访问宿主侧辅助工具，例如内嵌智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** — 一个已移除的、仅限 Pi 的内置扩展钩子，它曾可观察内嵌运行器事件，例如 `tool_result`。

这些宽泛的导入接口面现已被**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件应在下一个主要版本移除它们之前完成迁移。仅限 Pi 的内嵌扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中，移除或重新解释已有文档说明的插件行为。破坏性契约变更必须先经过兼容适配器、诊断信息、文档以及弃用窗口。这适用于 SDK 导入、manifest 字段、设置 API、钩子和运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中移除。届时，仍从这些接口面导入的插件将会失效。仅限 Pi 的内嵌扩展工厂注册现在已经不再加载。
</Warning>

## 为什么会有这项变化

旧方法会导致一些问题：

- **启动缓慢** — 导入一个辅助工具会加载几十个无关模块
- **循环依赖** — 宽泛的重新导出让导入循环更容易出现
- **API 接口面不清晰** — 无法判断哪些导出是稳定的，哪些属于内部实现

现代插件 SDK 修复了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含模块，具有明确用途和有文档说明的契约。

用于内置渠道的旧版 provider 便捷接缝也已移除。带有渠道品牌的辅助工具接缝属于私有 mono-repo 快捷方式，而不是稳定的插件契约。请改用狭义的通用 SDK 子路径。在内置插件工作区中，请将 provider 自有辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置 provider 示例：

- Anthropic 将 Claude 专用的流式辅助工具保留在它自己的 `api.ts` / `contract-api.ts` 接缝中
- OpenAI 将 provider builder、default-model 辅助工具以及 realtime provider builder 保留在它自己的 `api.ts` 中
- OpenRouter 将 provider builder 和 onboarding/config 辅助工具保留在它自己的 `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容适配器保持旧行为仍然可用
3. 发出诊断信息或警告，明确指出旧路径和替代方案
4. 在测试中覆盖两条路径
5. 记录弃用信息和迁移路径
6. 仅在已公告的迁移窗口结束后移除，通常是在主要版本中

如果某个 manifest 字段仍然被接受，插件作者就可以继续使用它，直到文档和诊断信息另行说明为止。新代码应优先使用文档说明的替代方案，但现有插件不应在普通次要版本中被破坏。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助工具">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。应优先使用已经传入当前调用路径的配置。需要当前进程快照的长生命周期处理器可以使用 `api.runtime.config.current()`。长生命周期的智能体工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，这样即使工具是在配置写入之前创建的，也仍能看到刷新后的运行时配置。

    配置写入必须通过事务性辅助工具进行，并选择一种写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方明确知道该更改需要一次干净的 Gateway 网关重启时，请使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有当调用方自行负责后续处理并且有意抑制重载规划器时，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    变更结果会包含一个带类型的 `followUp` 摘要，供测试和日志使用；Gateway 网关仍然负责应用或调度重启。
    `loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为外部插件的已弃用兼容辅助工具保留，并会以
    `runtime-config-load-write` 兼容代码发出一次警告。内置插件和仓库运行时代码受到
    `pnpm check:deprecated-internal-config-api` 和
    `pnpm check:no-runtime-action-load-config`
    中扫描器护栏的保护：新的生产插件用法会被直接判失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时渠道 send/action/client 辅助工具必须从其边界接收配置，而长生命周期运行时模块中不允许存在任何环境式 `loadConfig()` 调用。

    新插件代码也应避免导入宽泛的
    `openclaw/plugin-sdk/config-runtime` 兼容性 barrel。请使用与任务匹配的狭义 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | 配置类型，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助工具 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 组策略运行时辅助工具 | `openclaw/plugin-sdk/runtime-group-policy` |
    | secret 输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受到扫描器保护，禁止使用该宽泛 barrel，因此导入和 mock 都会局部化到它们所需的行为。该宽泛 barrel 仍然存在以兼容外部插件，但新代码不应再依赖它。

  </Step>

  <Step title="将 Pi 工具结果扩展迁移到中间件">
    内置插件必须将仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为
    runtime-neutral 中间件。

    ```typescript
    // Pi 和 Codex 运行时动态工具
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同时更新插件 manifest：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部插件不能注册工具结果中间件，因为它会在模型看到高信任度工具输出之前对其进行改写。

  </Step>

  <Step title="将原生审批处理器迁移到 capability facts">
    具备审批能力的渠道插件现在通过
    `approvalCapability.nativeRuntime` 以及共享的 runtime-context registry
    暴露原生审批行为。

    关键变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用 auth/delivery 从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；请将 delivery/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仍仅用于渠道登录/登出流程；其中的审批 auth 钩子不再被核心读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context`
      注册渠道自有运行时对象，例如 clients、tokens 或 Bolt apps
    - 不要从原生审批处理器中发送插件自有的 reroute notices；核心现在会根据实际投递结果统一负责“已路由到其他位置”的通知
    - 当把 `channelRuntime` 传给 `createChannelManager(...)` 时，请提供真实的 `createPluginRuntime().channel` 接口面。不接受部分 stub。

    有关当前 approval capability 布局，请参阅 `/plugins/sdk-channel-plugins`。

  </Step>

  <Step title="审查 Windows wrapper 回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，现在未解析的 Windows
    `.cmd`/`.bat` wrapper 会默认失败关闭，除非你显式传入
    `allowShellFallback: true`。

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之后
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅对有意接受 shell 中介回退的受信任兼容性调用方设置此项。
      allowShellFallback: true,
    });
    ```

    如果你的调用方并不有意依赖 shell 回退，请不要设置
    `allowShellFallback`，而是改为处理抛出的错误。

  </Step>

  <Step title="查找已弃用导入">
    在你的插件中搜索从任一已弃用接口面导入的代码：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为聚焦导入">
    旧接口面中的每个导出都映射到一个特定的现代导入路径：

    ```typescript
    // 之前（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之后（现代聚焦导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于宿主侧辅助工具，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 之后（注入的运行时）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同样的模式也适用于其他旧版桥接辅助工具：

    | 旧导入 | 现代等价物 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替换宽泛的 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍然保留用于外部兼容性，但新代码应导入其实际所需的聚焦辅助工具接口面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助工具 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 事件与可见性辅助工具 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列清空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存内去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助工具 | `openclaw/plugin-sdk/file-access-runtime` |
    | 具备 dispatcher 感知能力的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助工具 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher 策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复负载和命令辅助工具 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助工具 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全 token 辅助工具 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件受扫描器保护，不允许使用 `infra-runtime`，因此仓库代码不能回退到这个宽泛 barrel。

  </Step>

  <Step title="迁移渠道路由辅助工具">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。
    旧的 route-key 和 comparable-target 名称在迁移窗口期间仍作为兼容性别名保留，但新插件应使用能更直接描述行为的路由名称：

    | 旧辅助工具 | 现代辅助工具 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助工具会在原生审批、回复抑制、入站去重、cron 投递和会话路由之间一致地规范化 `{ channel, to, accountId, threadId }`。
    如果你的插件拥有自定义目标语法，请使用 `resolveChannelRouteTargetWithParser(...)`，将该解析器适配到同一套路由目标契约中。

  </Step>

  <Step title="构建并测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="常见导入路径表">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范的插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义/builders 的旧版 umbrella 重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单一 provider 入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和 builders | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享的设置向导辅助工具 | Allowlist 提示、设置状态 builders |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助工具 | 导入安全的设置 patch adapters、lookup-note 辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置 adapter 辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账号辅助工具 | 账号列表/配置/action-gate 辅助工具 |
  | `plugin-sdk/account-id` | account-id 辅助工具 | `DEFAULT_ACCOUNT_ID`、account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账号查找辅助工具 | 账号查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 狭义账号辅助工具 | 账号列表/account-action 辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导 adapters | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信 配对基础组件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 正在输入状态接线 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置 adapter 工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema builders | 共享渠道配置 schema 基础组件和仅通用 builder |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置 schema | 仅用于内置兼容性；新插件必须定义插件本地 schema |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名规范化、描述裁剪、重复/冲突校验 |
  | `plugin-sdk/channel-policy` | 群组/私信 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账号 Status 和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览完成辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助工具 | 共享路由 + envelope builder 辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享 record-and-dispatch 辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 轻量级 `resolveOutboundSendDep` 查找，无需导入完整出站运行时 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站投递、identity/send delegate、会话、格式化和 payload 规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和 adapter 辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体 payload 辅助工具 | 用于旧字段布局的智能体媒体 payload builder |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性 shim | 仅旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛的运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 狭义运行时环境辅助工具 | logger/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/http/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子管道辅助工具 | 共享 webhook/内部钩子管道辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端和渠道状态 patch 辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性 shim | 优先使用 `config-types`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 契约接口面不可用时，提供具有稳定回退能力的 Telegram 命令校验辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | exec/插件审批 payload、approval capability/profile 辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批 auth 辅助工具 | approver 解析、同聊天 action auth |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 exec 审批 profile/filter 辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生 approval capability/delivery adapters |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批 adapter 辅助工具 | 用于高频渠道入口点的轻量级原生审批 adapter 加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助工具 | 更宽泛的审批处理器运行时辅助工具；当更狭义的 adapter/gateway 接缝已足够时，应优先使用后者 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/account 绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | exec/插件审批回复 payload 辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道 runtime-context 辅助工具 | 通用渠道 runtime-context register/get/watch 辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信 门控、外部内容和 secret 收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机 allowlist 和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | pinned-dispatcher、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助工具 | Heartbeat 事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存内去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全的本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 封装的 fetch/proxy 辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | Allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令 Status /帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 输入解析 | secret 输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 请求体保护辅助工具 | 请求体读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 狭义回复分发辅助工具 | 完成、provider 分发和会话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + updated-at 辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道 Status 辅助工具 | 渠道/账号状态摘要 builders、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带有规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具 payload 提取 | 从工具结果对象中提取规范化 payload |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范的发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统 logger 和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复 payload 类型 |
  | `plugin-sdk/provider-setup` | 精选的本地/自托管 provider 设置辅助工具 | 自托管 provider 发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管 provider 设置辅助工具 | 同样的自托管 provider 发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | provider 运行时 auth 辅助工具 | 运行时 API key 解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | provider API key 设置辅助工具 | API key 新手引导/profile 写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | provider auth-result 辅助工具 | 标准 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider 交互式登录辅助工具 | 共享交互式登录辅助工具 |
  | `plugin-sdk/provider-selection-runtime` | provider 选择辅助工具 | 已配置或自动 provider 选择以及原始 provider 配置合并 |
  | `plugin-sdk/provider-env-vars` | provider 环境变量辅助工具 | provider auth 环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享 provider 模型/replay 辅助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy builders、provider endpoint 辅助工具，以及 model-id 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享 provider catalog 辅助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider 新手引导补丁 | 新手引导配置辅助工具 |
  | `plugin-sdk/provider-http` | provider HTTP 辅助工具 | 通用 provider HTTP/endpoint capability 辅助工具，包括音频转录 multipart form 辅助工具 |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch 辅助工具 | web-fetch provider 注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search 配置辅助工具 | 适用于不需要插件启用接线的 provider 的狭义 web-search 配置/凭证辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | provider web-search 契约辅助工具 | 狭义 web-search 配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及作用域化的凭证 setter/getter |
  | `plugin-sdk/provider-web-search` | provider web-search 辅助工具 | web-search provider 注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | provider 工具/schema 兼容性辅助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及 xAI 兼容性辅助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | provider 用量辅助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 以及其他 provider 用量辅助工具 |
  | `plugin-sdk/provider-stream` | provider 流包装辅助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | provider 传输辅助工具 | 原生 provider 传输辅助工具，例如受保护的 fetch、传输消息转换，以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/转换/存储辅助工具，以及媒体 payload builders |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 共享故障转移辅助工具、候选选择，以及图像/视频/音乐生成的模型缺失提示 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解 provider 类型，以及面向 provider 的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助工具 | 面向助手可见文本剥离、markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive-tag 辅助工具、安全文本实用工具，以及相关文本/日志辅助工具 |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | Speech 辅助工具 | Speech provider 类型，以及面向 provider 的 directive、注册表和校验辅助工具 |
  | `plugin-sdk/speech-core` | 共享 Speech 核心 | Speech provider 类型、注册表、directives、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | provider 类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | provider 类型、注册表/解析辅助工具，以及 bridge 会话辅助工具 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、auth 和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成 provider/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助工具、provider 查找和 model-ref 解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成 provider/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助工具、provider 查找和 model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复 payload 规范化/归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基础组件 | 狭义渠道 config-schema 基础组件 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导模块 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道 Status 辅助工具 | 共享渠道状态快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | Allowlist 配置辅助工具 | Allowlist 配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm` | 直接私信 辅助工具 | 共享直接私信 auth/保护辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道/状态和环境代理辅助工具基础组件 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助工具 | Webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | Webhook 路径辅助工具 | Webhook 路径规范化辅助工具 |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | Memory 管理器/配置/文件/CLI 辅助工具接口面 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 引擎运行时门面 | Memory 索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 宿主基础引擎 | Memory 宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 宿主嵌入引擎 | Memory 嵌入契约、注册表访问、本地 provider 和通用批处理/远程辅助工具；具体远程 provider 位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory 宿主 QMD 引擎 | Memory 宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory 宿主存储引擎 | Memory 宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | Memory 宿主多模态辅助工具 | Memory 宿主多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | Memory 宿主查询辅助工具 | Memory 宿主查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | Memory 宿主 secret 辅助工具 | Memory 宿主 secret 辅助工具 |
  | `plugin-sdk/memory-core-host-events` | Memory 宿主事件日志辅助工具 | Memory 宿主事件日志辅助工具 |
  | `plugin-sdk/memory-core-host-status` | Memory 宿主 Status 辅助工具 | Memory 宿主 Status 辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory 宿主 CLI 运行时 | Memory 宿主 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory 宿主核心运行时 | Memory 宿主核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory 宿主文件/运行时辅助工具 | Memory 宿主文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | Memory 宿主核心运行时别名 | 面向 vendor-neutral 的 Memory 宿主核心运行时辅助工具别名 |
  | `plugin-sdk/memory-host-events` | Memory 宿主事件日志别名 | 面向 vendor-neutral 的 Memory 宿主事件日志辅助工具别名 |
  | `plugin-sdk/memory-host-files` | Memory 宿主文件/运行时别名 | 面向 vendor-neutral 的 Memory 宿主文件/运行时辅助工具别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 供内存相关插件使用的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 活跃 Memory 搜索门面 | 惰性活跃 Memory 搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | Memory 宿主 Status 别名 | 面向 vendor-neutral 的 Memory 宿主 Status 辅助工具别名 |
  | `plugin-sdk/memory-lancedb` | 内置 Memory LanceDB 辅助工具 | Memory LanceDB 辅助工具接口面 |
  | `plugin-sdk/testing` | 测试工具 | 旧版宽泛兼容性 barrel；优先使用聚焦的测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只包含常见迁移子集，而不是完整的 SDK
接口面。完整的 200+ 入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍然包含一些内置插件辅助工具接缝，例如
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些导出仍保留，用于
内置插件维护和兼容性，但它们被刻意排除在常见迁移表之外，也不是新插件代码的推荐目标。

同样的规则也适用于其他内置辅助工具家族，例如：

- 浏览器支持辅助工具：`plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助工具/插件接口面，例如 `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diagnostics-prometheus`、
  `plugin-sdk/diffs`、`plugin-sdk/llm-task`、`plugin-sdk/thread-ownership`，
  以及 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前暴露了狭义 token-helper
接口面 `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用与任务最匹配的最狭义导入路径。如果你找不到某个导出，
请检查 `src/plugin-sdk/` 中的源代码，或在 Discord 中提问。

## 当前弃用项

以下是适用于整个插件 SDK、provider 契约、
运行时接口面和 manifest 的更狭义弃用项。它们目前仍然可用，但会在未来的主要版本中移除。每个条目下方都将旧 API 映射到其规范替代方案。

<AccordionGroup>
  <Accordion title="command-auth 帮助 builders → command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：相同签名、相同
    导出——只是改为从更狭义的子路径导入。`command-auth`
    会将它们重新导出为 compat 存根。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之后
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention 门控辅助工具 → resolveInboundMentionDecision">
    **旧版**：`resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`，来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——它会返回一个
    单一决策对象，而不是拆分成两次调用。

    下游渠道插件（Slack、Discord、Matrix、Microsoft Teams）已经完成切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道 actions 辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧版
    渠道插件的兼容性 shim。新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*`
    辅助工具会与原始“actions”渠道导出一起被弃用。请改为通过语义化的
    `presentation` 接口面暴露能力——渠道插件声明它们渲染什么
    （cards、buttons、selects），而不是声明它们接受哪些原始
    action 名称。

  </Accordion>

  <Accordion title="Web 搜索 provider tool() 辅助工具 → 插件上的 createTool()">
    **旧版**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工厂。

    **新版**：直接在 provider 插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助工具来注册这个工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道 envelopes → BodyForAgent">
    **旧版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用于从入站渠道消息构建扁平的纯文本提示
    envelope。

    **新版**：`BodyForAgent` 加上结构化用户上下文块。渠道
    插件会将路由元数据（thread、topic、reply-to、reactions）作为
    类型化字段附加，而不是把它们拼接成提示字符串。
    `formatAgentEnvelope(...)` 辅助工具仍然支持用于合成的
    面向 assistant 的 envelope，但入站纯文本 envelope 正在
    逐步淘汰。

    受影响区域：`inbound_claim`、`message_received`，以及任何对
    `channelEnvelope` 文本进行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="provider 发现类型 → provider catalog 类型">
    四个发现类型别名现在已变成 catalog 时代类型上的薄包装：

    | 旧别名 | 新类型 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    此外还有旧版 `ProviderCapabilities` 静态对象——provider 插件
    应通过 provider 运行时契约附加 capability facts，
    而不是通过静态对象。

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范的 `id`、可选的 `label` 以及
    按等级排序的 level 列表。OpenClaw 会按 profile 排名自动降级
    过期的已存储值。

    现在实现一个钩子即可，不必实现三个。旧钩子在
    弃用窗口期间仍然可用，但不会与 profile 结果组合使用。

  </Accordion>

  <Accordion title="外部 OAuth provider 回退 → contracts.externalAuthProviders">
    **旧版**：在插件 manifest 中未声明 provider 的情况下，实现
    `resolveExternalOAuthProfiles(...)`。

    **新版**：在插件 manifest 中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧的“auth
    fallback”路径会在运行时发出警告，并将在未来被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="provider 环境变量查找 → setup.providers[].envVars">
    **旧版** manifest 字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找镜像到 manifest 中的 `setup.providers[].envVars`
    中。这样可以把设置/Status 的环境变量元数据集中到同一个
    位置，并避免仅为了回答环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容适配器继续受支持，
    直到弃用窗口结束。

  </Accordion>

  <Accordion title="Memory 插件注册 → registerMemoryCapability">
    **旧版**：三个独立调用——
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：在 memory-state API 上使用一次调用——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同的插槽，单次注册调用。新增的 Memory 辅助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="Subagent 会话消息类型已重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧版 | 新版 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，建议改用
    `getSessionMessages`。签名相同；旧方法会转调到
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧版**：`runtime.tasks.flow`（单数）返回一个实时 task-flow 访问器。

    **新版**：`runtime.tasks.flows`（复数）返回基于 DTO 的 TaskFlow 访问，
    它是导入安全的，并且不要求加载完整任务运行时。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow(ctx);
    // 之后
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="内嵌扩展工厂 → 智能体工具结果中间件">
    上文“如何迁移 → 将 Pi 工具结果扩展迁移到
    中间件”中已介绍。这里为完整性再次列出：已移除的、仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 路径现由
    `api.registerAgentToolResultMiddleware(...)` 取代，并在
    `contracts.agentToolResultMiddleware` 中显式声明运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType`
    现在只是 `OpenClawConfig` 的一行别名。请优先使用规范名称。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之后
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级别的弃用项（位于 `extensions/` 下的内置渠道/provider 插件内部）
会在它们各自的 `api.ts` 和 `runtime-api.ts`
barrels 中追踪。它们不会影响第三方插件契约，因此未在此处列出。
如果你直接使用某个内置插件的本地 barrel，请在升级前阅读该 barrel 中的
弃用注释。
</Note>

## 移除时间线

| 时间 | 将发生什么 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口面会发出运行时警告 |
| **下一个主要版本** | 已弃用接口面将被移除；仍在使用它们的插件将会失效 |

所有核心插件都已完成迁移。外部插件应在下一个主要版本之前完成迁移。

## 临时抑制警告

在你进行迁移时，可以设置以下环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是临时的应急出口，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建 provider 插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深度解析
- [插件 Manifest](/zh-CN/plugins/manifest) — manifest schema 参考
