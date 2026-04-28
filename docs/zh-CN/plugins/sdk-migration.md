---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到了 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用过 api.registerEmbeddedExtensionFactory
    - 你正在将插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-28T20:08:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: efaf0f397e7b06a67fd324f1710ac62529dd2c039d483b381a8df5495716cd51
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，使用聚焦且有文档说明的导入。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 正在变化的内容

旧插件系统提供了两个开放范围很大的表面，允许插件从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 一个会重新导出数十个辅助函数的单一导入。它的引入是为了在新的插件架构构建期间，保持较旧的基于钩子的插件可用。
- **`openclaw/plugin-sdk/infra-runtime`** — 一个宽泛的运行时辅助 barrel，混合了系统事件、心跳状态、投递队列、fetch/proxy 辅助函数、文件辅助函数、审批类型和无关工具。
- **`openclaw/plugin-sdk/config-runtime`** — 一个宽泛的配置兼容性 barrel，在迁移窗口期间仍携带已弃用的直接加载/写入辅助函数。
- **`openclaw/extension-api`** — 一个桥接层，让插件可以直接访问主机侧辅助函数，例如嵌入式智能体 runner。
- **`api.registerEmbeddedExtensionFactory(...)`** — 一个已移除的仅限 Pi 的内置扩展钩子，可观察嵌入式 runner 事件，例如 `tool_result`。

这些宽泛的导入表面现在已**弃用**。它们在运行时仍可工作，但新插件不得使用它们，现有插件也应在下一个主要版本移除它们之前完成迁移。仅限 Pi 的嵌入式扩展工厂注册 API 已移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一变更中移除或重新解释有文档说明的插件行为。破坏性契约变更必须先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、manifest 字段、设置 API、钩子和运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中移除。届时仍从这些表面导入的插件将会中断。仅限 Pi 的嵌入式扩展工厂注册现在已经不再加载。
</Warning>

## 为什么做出此变更

旧方法带来了问题：

- **启动缓慢** — 导入一个辅助函数会加载数十个无关模块
- **循环依赖** — 宽泛的重新导出很容易造成导入环
- **API 表面不清晰** — 无法判断哪些导出是稳定的，哪些是内部的

现代插件 SDK 修复了这一点：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含模块，具有明确用途和有文档说明的契约。

内置渠道的旧提供商便利接缝也已移除。带渠道品牌的辅助接缝是私有 mono-repo 快捷方式，不是稳定的插件契约。请改用狭窄的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的辅助函数保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用流辅助函数保留在自己的 `api.ts` / `contract-api.ts` 接缝中
- OpenAI 将提供商 builder、默认模型辅助函数和实时提供商 builder 保留在自己的 `api.ts` 中
- OpenRouter 将提供商 builder 和新手引导/配置辅助函数保留在自己的 `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容性适配器保持旧行为连通
3. 发出诊断或警告，指明旧路径和替代方案
4. 在测试中覆盖两个路径
5. 记录弃用和迁移路径
6. 仅在已公告的迁移窗口之后移除，通常是在主要版本中

维护者可以使用 `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 获取紧凑计数，使用 `--owner <id>` 查看单个插件或兼容性 owner，并在 CI gate 应因到期兼容性记录、跨 owner 保留 SDK 导入或未使用的保留 SDK 子路径而失败时使用 `pnpm plugins:boundary-report:ci`。该报告会按移除日期对已弃用的兼容性记录分组，统计本地代码/文档引用，显示跨 owner 保留 SDK 导入，并汇总私有 memory-host SDK 桥接，使兼容性清理保持显式，而不是依赖临时搜索。保留 SDK 子路径必须有已跟踪的 owner 使用；未使用的保留辅助导出应从公共 SDK 中移除。

如果某个 manifest 字段仍被接受，插件作者可以继续使用它，直到文档和诊断另有说明。新代码应优先使用有文档说明的替代方案，但现有插件不应在普通次要版本发布期间中断。

## 如何迁移

<Steps>
  <Step title="Migrate runtime config load/write helpers">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已传入当前活动调用路径的配置。需要当前进程快照的长生命周期处理器可以使用 `api.runtime.config.current()`。长生命周期智能体工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，这样在配置写入前创建的工具仍能看到刷新的运行时配置。

    配置写入必须通过事务辅助函数，并选择写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道变更需要一次干净的 Gateway 网关重启时，使用 `afterWrite: { mode: "restart", reason: "..." }`；只有当调用方拥有后续处理并有意抑制 reload planner 时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含一个带类型的 `followUp` 摘要，用于测试和日志；Gateway 网关仍负责应用或调度重启。`loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为外部插件的已弃用兼容性辅助函数保留，并会以 `runtime-config-load-write` 兼容性代码警告一次。内置插件和仓库运行时代码受到
    `pnpm check:deprecated-internal-config-api` 和
    `pnpm check:no-runtime-action-load-config` 中扫描器 guardrail 的保护：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时渠道发送/action/client 辅助函数必须从其边界接收配置，并且长生命周期运行时模块允许的环境级 `loadConfig()` 调用数为零。

    新插件代码还应避免导入宽泛的
    `openclaw/plugin-sdk/config-runtime` 兼容性 barrel。请使用与任务匹配的狭窄 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-types` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret 输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试会通过扫描器防护避免使用宽泛 barrel，确保导入和 mock 保持在所需行为的本地范围内。宽泛 barrel 仍为外部兼容性存在，但新代码不应依赖它。

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    内置插件必须将仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为运行时中立的中间件。

    ```typescript
    // Pi and Codex runtime dynamic tools
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

    外部插件不能注册工具结果中间件，因为它可以在模型看到高信任工具输出之前重写它。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    支持审批的渠道插件现在通过 `approvalCapability.nativeRuntime` 加共享运行时上下文注册表来暴露原生审批行为。

    关键变更：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用 auth/delivery 从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；将 delivery/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于渠道登录/登出流程；core 不再读取其中的审批 auth 钩子
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象，例如 client、token 或 Bolt app
    - 不要从原生审批处理器发送插件拥有的 reroute 通知；core 现在根据实际投递结果拥有 routed-elsewhere 通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，提供真实的 `createPluginRuntime().channel` 表面。部分 stub 会被拒绝。

    请参阅 `/plugins/sdk-channel-plugins` 了解当前审批能力布局。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows `.cmd`/`.bat` wrapper 现在会 fail closed，除非你显式传入 `allowShellFallback: true`。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    如果你的调用方并非有意依赖 shell fallback，不要设置 `allowShellFallback`，而应处理抛出的错误。

  </Step>

  <Step title="Find deprecated imports">
    在你的插件中搜索来自任一已弃用表面的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    旧表面中的每个导出都映射到一个特定的现代导入路径：

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机侧辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同一模式也适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等价项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储辅助函数 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替换宽泛的 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性而存在，但新代码应导入它实际需要的聚焦辅助接口：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存中去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件会通过扫描器防止使用 `infra-runtime`，因此仓库代码无法退回到宽泛的 barrel。

  </Step>

  <Step title="迁移渠道路由辅助函数">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。较旧的 route-key 和 comparable-target 名称在迁移窗口期间仍作为兼容性别名保留，但新插件应使用直接描述行为的路由名称：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。如果你的插件拥有自定义目标语法，请使用 `resolveChannelRouteTargetWithParser(...)` 将该解析器适配到相同的路由目标契约。

  </Step>

  <Step title="构建并测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="Common import path table">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 旧版统括式重新导出，用于渠道入口定义/构建器 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置期间运行时辅助工具 | 导入安全的设置补丁适配器、查找备注辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账号辅助工具 | 账号列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账号 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账号查找辅助工具 | 账号查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄范围账号辅助工具 | 账号列表/账号操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入中状态和来源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 仅共享渠道配置 schema 原语和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置 schema | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地 schema |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置 schema | 仅兼容性别名；对维护中的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述裁剪、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账号状态和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览终结辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享记录并分发辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 无需导入完整出站运行时的轻量级 `resolveOutboundSendDep` 查找 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站投递、身份/发送委托、会话、格式化和载荷规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助工具 | 适用于旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性 shim | 仅旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 广范围运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助工具 | 日志记录器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/http/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助工具 | 共享 webhook/内部钩子流水线辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端和渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性 shim | 优先使用 `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 合同表面不可用时，提供回退稳定的 Telegram 命令验证辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | exec/插件审批载荷、审批能力/配置文件辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助工具 | 审批者解析、同一聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 exec 审批配置文件/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助工具 | 面向热门渠道入口点的轻量级原生审批适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理程序辅助工具 | 更广范围的审批处理程序运行时辅助工具；当更窄的适配器/Gateway 网关衔接已足够时，优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/账号绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | exec/插件审批回复载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/获取/监听辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和专用网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定 dispatcher、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳辅助工具 | 心跳事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存中去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装 fetch/代理辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助工具 | 终结、提供商分发和对话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道/账号状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志记录辅助函数 | 子系统日志记录器和修订辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管提供商设置辅助函数 | 自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助函数 | 相同的自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助函数 | 运行时 API 密钥解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置辅助函数 | API 密钥新手引导/配置文件写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果辅助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录辅助函数 | 共享交互式登录辅助函数 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动提供商选择以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助函数 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数以及模型 ID 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP/端点能力辅助函数，包括音频转录 multipart 表单辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助函数 | Web-fetch 提供商注册/缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助函数 | 面向不需要插件启用接线的提供商的窄 Web 搜索配置/凭证辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助函数 | 窄 Web 搜索配置/凭证契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及作用域化凭证设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助函数 | Web 搜索提供商注册/缓存/运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容辅助函数 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini 架构清理 + 诊断，以及 xAI 兼容辅助函数，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量辅助函数 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage` 以及其他提供商用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装器辅助函数 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如受保护的 fetch、传输消息转换以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取/转换/存储辅助函数以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 用于图像/视频/音乐生成的共享故障转移辅助函数、候选选择以及缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型以及面向提供商的图像/音频辅助导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助函数 | 助手可见文本剥离、Markdown 渲染/分块/表格辅助函数、修订辅助函数、指令标签辅助函数、安全文本实用工具以及相关文本/日志记录辅助函数 |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型以及面向提供商的指令、注册表、验证辅助函数和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | 提供商类型、注册表辅助函数以及共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、注册表/解析辅助函数以及桥接会话辅助函数 |
  | `plugin-sdk/image-generation` | 图像生成辅助函数 | 图像生成提供商类型以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找以及模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找以及模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复载荷规范化/缩减 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基元 | 窄渠道配置架构基元 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助函数 | 渠道配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前奏 | 共享渠道插件前奏导出 |
  | `plugin-sdk/channel-status` | 渠道 Status 辅助函数 | 共享渠道 Status 快照/摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助函数 | 允许列表配置编辑/读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm` | 直接私信辅助函数 | 共享直接私信认证/防护辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道/Status 和环境代理辅助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助函数 | Webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | Webhook 路径辅助函数 | Webhook 路径规范化辅助函数 |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助函数 | 远程/本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 消费者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | 内存管理器/配置/文件/CLI 辅助表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 内存引擎运行时门面 | 内存索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎 | 内存主机基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入引擎 | 内存嵌入契约、注册表访问、本地提供商以及通用批处理/远程辅助函数；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎 | 内存主机 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎 | 内存主机存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态辅助函数 | 内存主机多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | 内存主机查询辅助函数 | 内存主机查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | 内存主机密钥辅助函数 | 内存主机密钥辅助函数 |
  | `plugin-sdk/memory-core-host-events` | 内存主机事件日志辅助函数 | 内存主机事件日志辅助函数 |
  | `plugin-sdk/memory-core-host-status` | 内存主机 Status 辅助函数 | 内存主机 Status 辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时 | 内存主机 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时 | 内存主机核心运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时辅助函数 | 内存主机文件/运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | 内存主机核心运行时别名 | 内存主机核心运行时辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-events` | 内存主机事件日志别名 | 内存主机事件日志辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-files` | 内存主机文件/运行时别名 | 内存主机文件/运行时辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助函数 | 面向内存相关插件的共享托管 Markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 活跃内存搜索门面 | 延迟活跃内存搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 内存主机 Status 别名 | 内存主机 Status 辅助函数的供应商中立别名 |
  | `plugin-sdk/testing` | 测试实用工具 | 旧版宽泛兼容 barrel；优先使用聚焦的测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表有意只列出常见迁移子集，而不是完整的 SDK
表面。200 多个入口点的完整列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

预留的内置插件 helper 接缝已从公共 SDK
导出映射中退役，但明确记录的兼容 facade 除外，例如为已发布的
`@openclaw/discord@2026.3.13` 包保留的已弃用
`plugin-sdk/discord` shim。特定所有者的 helper 位于所属的
插件包内；共享的宿主行为应通过通用 SDK
契约迁移，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄导入。如果找不到导出，
请检查 `src/plugin-sdk/` 中的源代码，或询问维护者应由哪个通用契约
拥有它。

## 活跃弃用项

适用于插件 SDK、提供商契约、运行时表面和清单的更窄弃用项。
每一项今天仍可使用，但会在未来的主版本中移除。每个条目下方
都会把旧 API 映射到其规范替代项。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**：相同签名、相同
    导出，只是从更窄的子路径导入。`command-auth`
    会将它们重新导出为兼容 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控 helper → resolveInboundMentionDecision">
    **旧**：来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，返回单个
    decision 对象，而不是两次拆分调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已经切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道 actions helper">
    `openclaw/plugin-sdk/channel-runtime` 是面向较旧
    渠道插件的兼容 shim。新代码不要从它导入；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` helper
    已随原始 “actions” 渠道导出一起弃用。请改为通过语义化
    `presentation` 表面暴露能力，即渠道插件声明它们渲染什么
    （卡片、按钮、选择器），而不是它们接受哪些原始 action 名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() helper → 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK helper 来注册工具 wrapper。

  </Accordion>

  <Accordion title="明文渠道信封 → BodyForAgent">
    **旧**：使用 `formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`）从入站渠道消息构建扁平明文提示
    信封。

    **新**：`BodyForAgent` 加结构化用户上下文块。渠道
    插件将路由元数据（线程、主题、回复目标、反应）作为
    类型化字段附加，而不是把它们拼接进提示字符串。
    `formatAgentEnvelope(...)` helper 仍支持用于合成
    面向 assistant 的信封，但入站明文信封正在
    退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何对
    `channelEnvelope` 文本进行后处理的自定义
    渠道插件。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在只是目录时代类型的薄 wrapper：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外还有旧版 `ProviderCapabilities` 静态包。提供商插件
    应通过提供商运行时契约附加能力 facts，
    而不是使用静态对象。

  </Accordion>

  <Accordion title="Thinking 策略钩子 → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，它返回包含规范 `id`、
    可选 `label` 和排序 level 列表的
    `ProviderThinkingProfile`。OpenClaw 会自动按 profile
    rank 降级过时的已存储值。

    实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍可工作，
    但不会与 profile 结果组合。

  </Accordion>

  <Accordion title="外部 OAuth 提供商 fallback → contracts.externalAuthProviders">
    **旧**：实现 `resolveExternalOAuthProfiles(...)`，但未在
    插件清单中声明提供商。

    **新**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧的 “auth
    fallback” 路径会在运行时发出警告，并会被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商环境变量查找 → setup.providers[].envVars">
    **旧**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：把相同的环境变量查找镜像到清单上的 `setup.providers[].envVars`。
    这会把设置/Status 环境元数据整合到一个
    位置，并避免仅为响应环境变量查找而启动插件运行时。

    在弃用窗口关闭前，`providerAuthEnvVars` 会继续通过兼容适配器
    受支持。

  </Accordion>

  <Accordion title="Memory 插件注册 → registerMemoryCapability">
    **旧**：三个独立调用：
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**：memory-state API 上的一次调用：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同槽位，单次注册调用。增量 Memory helper
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，请改用
    `getSessionMessages`。签名相同；旧方法会转调到
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回实时 task-flow 访问器。

    **新**：`runtime.tasks.managedFlows` 为需要从 flow 创建、更新、取消或运行
    子任务的插件保留托管 TaskFlow 变更
    运行时。当插件只需要基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式插件工厂 → 智能体工具结果中间件">
    已在上方“如何迁移 → 将 Pi 工具结果插件迁移到
    中间件”中涵盖。为完整性在此列出：已移除的仅 Pi
    `api.registerEmbeddedExtensionFactory(...)` 路径由
    `api.registerAgentToolResultMiddleware(...)` 取代，并在
    `contracts.agentToolResultMiddleware` 中提供显式运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行别名。优先使用规范名称。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
插件级弃用项（位于 `extensions/` 下的内置渠道/提供商插件内）
在它们自己的 `api.ts` 和 `runtime-api.ts`
barrel 中跟踪。它们不影响第三方插件契约，也不会在此列出。
如果你直接使用内置插件的本地 barrel，请在升级前阅读该
barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间                   | 会发生什么                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在**               | 已弃用表面会发出运行时警告                               |
| **下一个主版本**       | 已弃用表面将被移除；仍在使用它们的插件会失败 |

所有核心插件都已迁移。外部插件应在下一个主版本发布前迁移。

## 临时抑制警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时逃生口，不是永久解决方案。

## 相关

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深入解析
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema 参考
