---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在将一个插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-29T07:02:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f701495b97e2660b5d0b9b65866ddaa7fc3ce91e6610950c9fb034f983dc1340
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，采用聚焦且有文档说明的导入路径。如果你的插件是在新架构之前构建的，本指南将帮助你迁移。

## 正在变更的内容

旧插件系统提供了两个完全开放的接口，让插件可以从单一入口点导入它们需要的任何内容：

- **`openclaw/plugin-sdk/compat`** — 单一导入，会重新导出数十个辅助工具。它的引入是为了在新插件架构构建期间，让较旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** — 宽泛的运行时辅助工具桶，混合了系统事件、心跳状态、投递队列、fetch/proxy 辅助工具、文件辅助工具、审批类型以及无关的实用工具。
- **`openclaw/plugin-sdk/config-runtime`** — 宽泛的配置兼容桶，在迁移窗口期间仍保留已弃用的直接加载/写入辅助工具。
- **`openclaw/extension-api`** — 一个桥接层，让插件可以直接访问宿主侧辅助工具，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** — 已移除的仅 Pi 内置扩展钩子，可观察嵌入式运行器事件，例如 `tool_result`。

这些宽泛的导入接口现在已**弃用**。它们在运行时仍然可用，但新插件不得使用它们，现有插件也应在下一次主版本发布移除它们之前完成迁移。仅 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已有文档说明的插件行为。破坏性契约变更必须先经过兼容适配器、诊断、文档和弃用窗口。此规则适用于 SDK 导入、manifest 字段、设置 API、钩子和运行时注册行为。

<Warning>
  向后兼容层将在未来的主版本中移除。届时仍从这些接口导入的插件将会中断。仅 Pi 的嵌入式扩展工厂注册已经不再加载。
</Warning>

## 为什么要这样变更

旧方法带来了一些问题：

- **启动缓慢** — 导入一个辅助工具会加载数十个无关模块
- **循环依赖** — 宽泛的重新导出很容易造成导入循环
- **API 接口不清晰** — 无法判断哪些导出是稳定的，哪些是内部的

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，具有明确用途和文档化契约。

针对内置渠道的旧版提供商便利接口也已移除。带渠道品牌的辅助接口是私有 monorepo 捷径，不是稳定的插件契约。请改用狭窄的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用流辅助工具保留在自己的 `api.ts` / `contract-api.ts` 接口中
- OpenAI 将提供商构建器、默认模型辅助工具和实时提供商构建器保留在自己的 `api.ts` 中
- OpenRouter 将提供商构建器和新手引导/配置辅助工具保留在自己的 `api.ts` 中

## 兼容策略

对于外部插件，兼容工作按以下顺序进行：

1. 添加新契约
2. 通过兼容适配器保持旧行为连通
3. 发出诊断或警告，指出旧路径和替代路径
4. 在测试中覆盖两条路径
5. 记录弃用说明和迁移路径
6. 仅在已公布的迁移窗口结束后移除，通常是在主版本发布中

维护者可以使用 `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 查看紧凑计数，使用 `--owner <id>` 查看单个插件或兼容性负责人，并在 CI gate 需要因到期兼容性记录、跨负责人保留 SDK 导入或未使用的保留 SDK 子路径而失败时使用 `pnpm plugins:boundary-report:ci`。该报告会按移除日期对已弃用的兼容性记录分组，统计本地代码/文档引用，暴露跨负责人保留 SDK 导入，并汇总私有 memory-host SDK 桥接，让兼容性清理保持显式，而不是依赖临时搜索。保留 SDK 子路径必须有已跟踪的负责人使用情况；未使用的保留辅助工具导出应从公共 SDK 中移除。

如果某个 manifest 字段仍被接受，插件作者可以继续使用它，直到文档和诊断另有说明。新代码应优先使用文档化的替代方案，但现有插件不应在普通次版本发布中中断。

## 如何迁移

<Steps>
  <Step title="Migrate runtime config load/write helpers">
    内置插件应停止直接调用 `api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)`。优先使用已经传入当前活跃调用路径的配置。需要当前进程快照的长生命周期处理器可以使用 `api.runtime.config.current()`。长生命周期智能体工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，这样在配置写入之前创建的工具仍能看到刷新后的运行时配置。

    配置写入必须通过事务性辅助工具，并选择写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道变更需要干净重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；仅当调用方拥有后续处理并刻意想抑制重载规划器时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含一个类型化的 `followUp` 摘要，用于测试和日志记录；Gateway 网关仍负责应用或调度重启。`loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为面向外部插件的已弃用兼容辅助工具保留，并会使用 `runtime-config-load-write` 兼容代码警告一次。内置插件和仓库运行时代码由扫描器护栏保护，位于 `pnpm check:deprecated-internal-config-api` 和 `pnpm check:no-runtime-action-load-config`：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时渠道发送/action/client 辅助工具必须从其边界接收配置，长生命周期运行时模块允许的环境性 `loadConfig()` 调用数为零。

    新插件代码还应避免导入宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容桶。请使用与任务匹配的狭窄 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | 配置类型，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助工具 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 组策略运行时辅助工具 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受到扫描器保护，不会使用这个宽泛桶，因此导入和 mock 会保持局部化，只覆盖它们需要的行为。这个宽泛桶仍为外部兼容性而存在，但新代码不应依赖它。

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    内置插件必须将仅 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为运行时中立的中间件。

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

    外部插件不能注册工具结果中间件，因为它可以在模型看到高信任工具输出之前重写这些输出。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    支持审批的渠道插件现在通过 `approvalCapability.nativeRuntime` 加共享运行时上下文注册表暴露原生审批行为。

    关键变更：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为 `approvalCapability.nativeRuntime`
    - 将审批专用的认证/投递从旧版 `plugin.auth` / `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；请将 delivery/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于渠道登录/登出流程；核心不再读取其中的审批认证钩子
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象，例如客户端、令牌或 Bolt 应用
    - 不要从原生审批处理器发送插件拥有的重路由通知；核心现在根据实际投递结果拥有已路由到其他位置的通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供真实的 `createPluginRuntime().channel` 接口。部分 stub 会被拒绝。

    请参见 `/plugins/sdk-channel-plugins` 了解当前审批能力布局。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows `.cmd`/`.bat` 包装器现在会默认封闭失败，除非你显式传入 `allowShellFallback: true`。

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

    如果你的调用方并不刻意依赖 shell 回退，请不要设置 `allowShellFallback`，而是处理抛出的错误。

  </Step>

  <Step title="Find deprecated imports">
    在你的插件中搜索来自任一已弃用接口的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    旧接口中的每个导出都映射到一个具体的现代导入路径：

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

    对于宿主侧辅助工具，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    相同模式也适用于其他旧版桥接帮助器：

    | 旧导入 | 现代等价项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储帮助器 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性保留，
    但新代码应导入它实际需要的聚焦帮助器表面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列帮助器 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳事件和可见性帮助器 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径帮助器 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 帮助器 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/决议类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令帮助器 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化帮助器 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌帮助器 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数字强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件会由扫描器防护，避免使用 `infra-runtime`，因此仓库代码
    不会回退到宽泛的 barrel。

  </Step>

  <Step title="Migrate channel route helpers">
    新的渠道路由代码应使用 `openclaw/plugin-sdk/channel-route`。
    在迁移窗口期间，较旧的路由键和可比较目标名称仍作为兼容性
    别名保留，但新插件应使用直接描述行为的路由名称：

    | 旧帮助器 | 现代帮助器 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由帮助器会在原生审批、回复抑制、入站去重、
    cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。
    如果你的插件拥有自定义目标语法，请使用 `resolveChannelRouteTargetWithParser(...)`
    将该解析器适配到同一路由目标契约。

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="Common import path table">
  | 导入路径 | 用途 | 主要导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义/构建器的旧版总括重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置架构导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助工具 | 可安全导入的设置补丁适配器、查找说明辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具链辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账号辅助工具 | 账号列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账号 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账号查找辅助工具 | 账号查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄范围账号辅助工具 | 账号列表/账号操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和来源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置架构构建器 | 仅共享渠道配置架构原语和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置架构 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地架构 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置架构 | 仅兼容性别名；对维护中的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述裁剪、重复/冲突校验 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账号状态和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览完成辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享记录并分发辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 无需导入完整出站运行时的轻量级 `resolveOutboundSendDep` 查找 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站投递、身份/发送委托、会话、格式化和载荷规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助工具 | 用于旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助工具 | 日志器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/HTTP/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子管道辅助工具 | 共享 webhook/内部钩子管道辅助工具 |
  | `plugin-sdk/lazy-runtime` | 懒加载运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享执行辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端和渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 合同表面不可用时，提供回退稳定的 Telegram 命令校验辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | 执行/插件审批载荷、审批能力/配置档案辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助工具 | 审批人解析、同一聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生执行审批配置档案/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助工具 | 用于热渠道入口点的轻量级原生审批适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理程序辅助工具 | 更宽范围的审批处理程序运行时辅助工具；当更窄的适配器/Gateway 网关接缝足够时，优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/账号绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | 执行/插件审批回复载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/获取/监听辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定分发器、受保护获取、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳辅助工具 | 心跳事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存中去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全的本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 封装的获取/代理辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具（包括动态参数菜单格式化） |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助工具 | 完成、提供商分发和对话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/Markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道/账号状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | Slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径帮助函数 | 共享的临时下载路径帮助函数 |
  | `plugin-sdk/logging-core` | 日志帮助函数 | 子系统日志记录器和脱敏帮助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格帮助函数 | Markdown 表格模式帮助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置帮助函数 | 自托管提供商设备发现/配置帮助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 兼容自托管提供商的设置帮助函数 | 相同的自托管提供商设备发现/配置帮助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证帮助函数 | 运行时 API 密钥解析帮助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置帮助函数 | API 密钥新手引导/profile 写入帮助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果帮助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录帮助函数 | 共享交互式登录帮助函数 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择帮助函数 | 已配置或自动提供商选择以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量帮助函数 | 提供商认证环境变量查找帮助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放帮助函数 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点帮助函数和模型 ID 规范化帮助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录帮助函数 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置帮助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 帮助函数 | 通用提供商 HTTP/端点能力帮助函数，包括音频转录 multipart 表单帮助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 帮助函数 | Web-fetch 提供商注册/缓存帮助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置帮助函数 | 针对不需要插件启用接线的提供商的窄 Web 搜索配置/凭证帮助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约帮助函数 | 窄 Web 搜索配置/凭证契约帮助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 和带作用域的凭证设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索帮助函数 | Web 搜索提供商注册/缓存/运行时帮助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容帮助函数 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini 架构清理 + 诊断，以及 xAI 兼容帮助函数，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量帮助函数 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage` 和其他提供商用量帮助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装器帮助函数 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器帮助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输帮助函数 | 原生提供商传输帮助函数，例如受保护的 fetch、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体帮助函数 | 媒体获取/转换/存储帮助函数、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成帮助函数 | 用于图像/视频/音乐生成的共享故障转移帮助函数、候选选择和缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解帮助函数 | 媒体理解提供商类型，以及面向提供商的图像/音频帮助函数导出 |
  | `plugin-sdk/text-runtime` | 共享文本帮助函数 | 助手可见文本剥离、Markdown 渲染/分块/表格帮助函数、脱敏帮助函数、指令标签帮助函数、安全文本实用工具，以及相关文本/日志帮助函数 |
  | `plugin-sdk/text-chunking` | 文本分块帮助函数 | 出站文本分块帮助函数 |
  | `plugin-sdk/speech` | 语音帮助函数 | 语音提供商类型，以及面向提供商的指令、注册表、验证帮助函数和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录帮助函数 | 提供商类型、注册表帮助函数和共享 WebSocket 会话帮助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音帮助函数 | 提供商类型、注册表/解析帮助函数和桥接会话帮助函数 |
  | `plugin-sdk/image-generation` | 图像生成帮助函数 | 图像生成提供商类型，以及图像资产/data URL 帮助函数和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表帮助函数 |
  | `plugin-sdk/music-generation` | 音乐生成帮助函数 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移帮助函数、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成帮助函数 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移帮助函数、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复帮助函数 | 交互式回复载荷规范化/缩减 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄渠道配置架构原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入帮助函数 | 渠道配置写入授权帮助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前置模块 | 共享渠道插件前置导出 |
  | `plugin-sdk/channel-status` | 渠道 Status 帮助函数 | 共享渠道 Status 快照/摘要帮助函数 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置帮助函数 | 允许列表配置编辑/读取帮助函数 |
  | `plugin-sdk/group-access` | 群组访问帮助函数 | 共享群组访问决策帮助函数 |
  | `plugin-sdk/direct-dm` | 直接私信帮助函数 | 共享直接私信认证/防护帮助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展帮助函数 | 被动渠道/Status 和环境代理帮助原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标帮助函数 | Webhook 目标注册表和路由安装帮助函数 |
  | `plugin-sdk/webhook-path` | Webhook 路径帮助函数 | Webhook 路径规范化帮助函数 |
  | `plugin-sdk/web-media` | 共享 Web 媒体帮助函数 | 远程/本地媒体加载帮助函数 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 帮助函数 | 内存管理器/配置/文件/CLI 帮助函数表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 内存引擎运行时门面 | 内存索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 内存宿主基础引擎 | 内存宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 内存宿主嵌入引擎 | 内存嵌入契约、注册表访问、本地提供商，以及通用批处理/远程帮助函数；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 内存宿主 QMD 引擎 | 内存宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 内存宿主存储引擎 | 内存宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 内存宿主多模态帮助函数 | 内存宿主多模态帮助函数 |
  | `plugin-sdk/memory-core-host-query` | 内存宿主查询帮助函数 | 内存宿主查询帮助函数 |
  | `plugin-sdk/memory-core-host-secret` | 内存宿主机密帮助函数 | 内存宿主机密帮助函数 |
  | `plugin-sdk/memory-core-host-events` | 内存宿主事件日志帮助函数 | 内存宿主事件日志帮助函数 |
  | `plugin-sdk/memory-core-host-status` | 内存宿主 Status 帮助函数 | 内存宿主 Status 帮助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 内存宿主 CLI 运行时 | 内存宿主 CLI 运行时帮助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | 内存宿主核心运行时 | 内存宿主核心运行时帮助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | 内存宿主文件/运行时帮助函数 | 内存宿主文件/运行时帮助函数 |
  | `plugin-sdk/memory-host-core` | 内存宿主核心运行时别名 | 内存宿主核心运行时帮助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-events` | 内存宿主事件日志别名 | 内存宿主事件日志帮助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-files` | 内存宿主文件/运行时别名 | 内存宿主文件/运行时帮助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 帮助函数 | 面向内存相邻插件的共享托管 Markdown 帮助函数 |
  | `plugin-sdk/memory-host-search` | 活跃内存搜索门面 | 懒加载活跃内存搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 内存宿主 Status 别名 | 内存宿主 Status 帮助函数的供应商中立别名 |
  | `plugin-sdk/testing` | 测试实用工具 | 旧版宽泛兼容性汇总入口；优先使用聚焦的测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出通用迁移子集，而不是完整 SDK
表面。200 多个入口点的完整列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

预留的内置插件辅助衔接点已经从公共 SDK
导出映射中退役，但明确记录的兼容门面除外，例如为已发布的
`@openclaw/discord@2026.3.13` 包保留的已弃用
`plugin-sdk/discord` shim。特定所有者的辅助工具位于所属
插件包内部；共享宿主行为应通过通用 SDK
契约迁移，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄导入。如果找不到某个导出，
请查看 `src/plugin-sdk/` 中的源码，或询问维护者应由哪个通用契约
拥有它。

## 当前弃用项

这些是跨插件 SDK、提供商契约、运行时表面和 manifest 适用的更窄弃用项。它们现在仍然可用，但会在未来的主版本中移除。每项下面的条目会把旧 API 映射到其规范替代项。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同签名、相同
    导出，只是从更窄的子路径导入。`command-auth`
    会将它们重新导出为兼容桩。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention 门控辅助工具 → resolveInboundMentionDecision">
    **旧**：来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，返回一个
    单一决策对象，而不是两次拆分调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已经
    切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道 actions 辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧版
    渠道插件的兼容 shim。新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助工具
    会与原始 “actions” 渠道导出一起弃用。请改为通过语义化
    `presentation` 表面公开能力，即渠道插件
    声明它们渲染什么（卡片、按钮、选择器），而不是声明它们接受哪些原始
    action 名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助工具 → 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助工具来注册工具包装器。

  </Accordion>

  <Accordion title="明文渠道信封 → BodyForAgent">
    **旧**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用于从入站渠道消息
    构建扁平的明文提示词信封。

    **新**：`BodyForAgent` 加结构化用户上下文块。渠道
    插件将路由元数据（线程、主题、回复目标、反应）作为
    类型化字段附加，而不是把它们拼接进提示词字符串。
    `formatAgentEnvelope(...)` 辅助工具仍支持用于合成的
    面向助手的信封，但入站明文信封正在
    逐步退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何会后处理
    `channelEnvelope` 文本的自定义
    渠道插件。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在是
    目录时代类型之上的轻量包装器：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    以及旧版 `ProviderCapabilities` 静态包。提供商插件
    应使用显式提供商钩子，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="Thinking 策略钩子 → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范 `id`、可选 `label` 和
    已排序的级别列表。OpenClaw 会自动按 profile
    排名降级过期的已存值。

    实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍会工作，
    但不会与 profile 结果组合。

  </Accordion>

  <Accordion title="外部 OAuth 提供商回退 → contracts.externalAuthProviders">
    **旧**：实现 `resolveExternalOAuthProfiles(...)`，但未在
    插件 manifest 中声明该提供商。

    **新**：在插件 manifest 中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧的 “auth
    fallback” 路径会在运行时发出警告，并将被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商 env-var 查找 → setup.providers[].envVars">
    **旧** manifest 字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：在 manifest 上把相同的 env-var 查找镜像到
    `setup.providers[].envVars`。这会把设置/Status 环境元数据
    合并到一个位置，并避免仅为响应 env-var
    查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容适配器继续支持，
    直到弃用窗口关闭。

  </Accordion>

  <Accordion title="Memory 插件注册 → registerMemoryCapability">
    **旧**：三次独立调用：
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**：memory-state API 上的一次调用：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同槽位，单次注册调用。增量 Memory 辅助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    两个仍从 `src/plugins/runtime/types.ts` 导出的旧版类型别名：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，请改用
    `getSessionMessages`。签名相同；旧方法会透传调用
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回一个实时任务流访问器。

    **新**：`runtime.tasks.managedFlows` 保留托管 TaskFlow 变更
    运行时，供插件从 flow 创建、更新、取消或运行子任务。
    当插件只需要基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式插件工厂 → agent 工具结果中间件">
    已在上文“如何迁移 → 将 Pi 工具结果扩展迁移到
    中间件”中说明。为完整起见，这里也列出：已移除的 Pi 专用
    `api.registerEmbeddedExtensionFactory(...)` 路径由
    `api.registerAgentToolResultMiddleware(...)` 替代，并在
    `contracts.agentToolResultMiddleware` 中提供显式运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行别名。请优先使用规范名称。

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
会在它们自己的 `api.ts` 和 `runtime-api.ts`
barrel 中跟踪。它们不会影响第三方插件契约，也不会在此
列出。如果你直接使用某个内置插件的本地 barrel，请在升级前阅读该
barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间                   | 会发生什么                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在**               | 已弃用表面会发出运行时警告                               |
| **下一个主版本**       | 已弃用表面将被移除；仍在使用它们的插件将失败 |

所有核心插件都已经迁移。外部插件应在下一个主版本之前
完成迁移。

## 临时抑制警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时逃生口，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深度解析
- [插件 Manifest](/zh-CN/plugins/manifest) — manifest schema 参考
