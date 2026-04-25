---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你在 OpenClaw 2026.4.24 之前使用了 `api.registerEmbeddedExtensionFactory`
    - 你正在将插件更新为现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-25T01:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 109261bd1358dab30dc521b5103201e6f8b06800650497bcb86bb4e423694eff
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw 已经从宽泛的向后兼容层迁移到现代插件架构，采用聚焦、文档化的导入方式。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 正在发生什么变化

旧版插件系统提供了两个开放范围很大的接口，使插件可以从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 一个会重新导出几十个辅助函数的单一导入入口。它的引入是为了在构建新插件架构期间，让较旧的基于钩子的插件继续正常工作。
- **`openclaw/extension-api`** — 一个桥接层，让插件能够直接访问宿主端的辅助功能，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** — 一个已移除的、仅限 Pi 的内置扩展钩子，可以观察诸如 `tool_result` 之类的嵌入式运行器事件。

这些宽泛的导入接口现已**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件也应在下一个主要版本移除它们之前完成迁移。仅限 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已文档化的插件行为。破坏契约的变更必须先经过兼容适配器、诊断、文档以及弃用窗口。这一规则适用于 SDK 导入、清单字段、设置 API、钩子以及运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中移除。
  到那时，仍从这些接口导入的插件将会中断。
  仅限 Pi 的嵌入式扩展工厂注册已经不再加载。
</Warning>

## 为什么会有这个变化

旧方法会导致一些问题：

- **启动缓慢** — 导入一个辅助函数会加载几十个无关模块
- **循环依赖** — 宽泛的重新导出使创建导入循环变得很容易
- **API 接口不清晰** — 无法分辨哪些导出是稳定的，哪些是内部实现

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含模块，具有明确用途和文档化契约。

面向内置渠道的旧版提供商便捷接口也已经移除。诸如 `openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、带渠道品牌的辅助接口以及 `openclaw/plugin-sdk/telegram-core` 之类的导入，都是私有单体仓库快捷方式，而不是稳定的插件契约。请改用更窄的通用 SDK 子路径。在内置插件工作区内部，请将提供商自有辅助函数保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用的流式辅助函数保留在其自己的 `api.ts` / `contract-api.ts` 接口中
- OpenAI 将提供商构建器、默认模型辅助函数以及实时提供商构建器保留在其自己的 `api.ts` 中
- OpenRouter 将提供商构建器以及新手引导 / 配置辅助函数保留在其自己的 `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容适配器保持旧行为继续接通
3. 发出诊断或警告，明确指出旧路径及其替代方案
4. 在测试中覆盖两条路径
5. 记录弃用信息和迁移路径
6. 仅在宣布的迁移窗口结束后移除，通常是在主要版本中

如果某个清单字段仍被接受，插件作者就可以继续使用它，直到文档和诊断另有说明。新代码应优先使用文档化的替代方案，但现有插件不应在普通的小版本发布中被破坏。

## 如何迁移

<Steps>
  <Step title="将 Pi 工具结果扩展迁移到中间件">
    内置插件必须将仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为
    与运行时无关的中间件。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同时更新插件清单：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部插件不能注册工具结果中间件，因为它可以在模型看到高信任度工具输出之前重写这些输出。

  </Step>

  <Step title="将原生审批处理器迁移到能力事实">
    具备审批能力的渠道插件现在通过
    `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表来公开原生审批行为。

    关键变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用的认证 / 投递逻辑从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；
      请将 delivery / native / render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留给渠道登录 / 登出流程使用；其中的审批认证
      钩子不再被核心读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context`
      注册渠道自有的运行时对象，例如客户端、令牌或 Bolt
      应用
    - 不要从原生审批处理器发送插件自有的改道路由通知；
      核心现在会根据实际投递结果统一负责“已路由到其他位置”的通知
    - 当把 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供一个
      真实的 `createPluginRuntime().channel` 接口。部分桩实现将被拒绝。

    请参阅 `/plugins/sdk-channel-plugins`，了解当前的审批能力布局。

  </Step>

  <Step title="审查 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，
    那么未解析的 Windows `.cmd`/`.bat` 包装器现在会默认失败关闭，
    除非你显式传入 `allowShellFallback: true`。

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

    如果你的调用方并非有意依赖 shell 回退，请不要设置
    `allowShellFallback`，而应改为处理抛出的错误。

  </Step>

  <Step title="查找已弃用的导入">
    在你的插件中搜索来自以下任一已弃用接口的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为聚焦导入">
    旧接口中的每个导出都映射到一个特定的现代导入路径：

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

    对于宿主端辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同样的模式也适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等价方式 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储辅助函数 | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义 / 构建器的旧版伞式重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助函数 | Allowlist 提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助函数 | 导入安全的设置补丁适配器、lookup-note 辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助函数 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表 / 配置 / action-gate 辅助函数 |
  | `plugin-sdk/account-id` | account-id 辅助函数 | `DEFAULT_ACCOUNT_ID`、account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助函数 | 账户列表 / 账户操作辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信 配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 正在输入接线 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 共享渠道配置 schema 原语；带内置渠道名称的 schema 导出仅用于旧版兼容性 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名称规范化、描述裁剪、重复 / 冲突校验 |
  | `plugin-sdk/channel-policy` | 群组 / 私信 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态和草稿流生命周期辅助函数 | `createAccountStatusSink`、草稿预览完成辅助函数 |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助函数 | 共享 route + envelope 构建辅助函数 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助函数 | 共享 record-and-dispatch 辅助函数 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析 / 匹配辅助函数 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助函数 | 出站身份 / 发送委托和负载规划辅助函数 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体负载辅助函数 | 用于旧版字段布局的智能体媒体负载构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅限旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助函数 | 运行时 / 日志 / 备份 / 插件安装辅助函数 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助函数 | Logger / 运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助函数 | 插件命令 / 钩子 / http / 交互式辅助函数 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助函数 | 共享 webhook / 内部钩子流水线辅助函数 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助函数 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助函数 | Gateway 网关客户端和渠道状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 配置辅助函数 | 配置加载 / 写入辅助函数 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 当内置 Telegram 契约接口不可用时，提供回退稳定的 Telegram 命令校验辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | exec / 插件审批负载、approval capability / profile 辅助函数、原生审批路由 / 运行时辅助函数 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助函数 | approver 解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 exec 审批 profile / filter 辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助函数 | 原生 approval capability / delivery 适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助函数 | 共享审批 Gateway 网关解析辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 用于热渠道入口点的轻量级原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助函数 | 范围更广的审批处理器运行时辅助函数；如果更窄的 adapter / gateway 接口已足够，优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标 / 账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | exec / 插件审批回复负载辅助函数 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助函数 | 通用渠道运行时上下文 register / get / watch 辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、私信 门控、外部内容和密钥收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机 allowlist 和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | pinned-dispatcher、guarded fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助函数 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助函数 |
  | `plugin-sdk/fetch-runtime` | 封装 fetch / proxy 辅助函数 | `resolveFetch`、proxy 辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助函数 | `resolveControlCommandGate`、发送方授权辅助函数、命令注册表辅助函数 |
  | `plugin-sdk/command-status` | 命令状态 / 帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | webhook 请求辅助函数 | webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | webhook 请求体守卫辅助函数 | 请求体读取 / 限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助函数 | 完成、提供商分发和会话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助函数 | 文本 / markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助函数 | 存储路径 + updated-at 辅助函数 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由 / session-key 辅助函数 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、session-key 规范化辅助函数 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助函数 | 渠道 / 账户状态摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助函数 | 共享目标解析器辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | slug / 字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助函数 | 带标准化 stdout / stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具 / CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具负载提取 | 从工具结果对象中提取标准化负载 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统 logger 和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复负载类型 |
  | `plugin-sdk/provider-setup` | 精选的本地 / 自托管提供商设置辅助函数 | 自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管提供商设置辅助函数 | 相同的自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助函数 | 运行时 API key 解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API key 设置辅助函数 | API key 新手引导 / profile 写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商 auth-result 辅助函数 | 标准 OAuth auth-result 构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录辅助函数 | 共享交互式登录辅助函数 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动提供商选择，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型 / 重放辅助函数 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 辅助函数以及 model-id 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP / endpoint capability 辅助函数，包括音频转录 multipart form 辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助函数 | web-fetch 提供商注册 / 缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 web-search 配置辅助函数 | 面向不需要插件启用接线的提供商的窄范围 web-search 配置 / 凭证辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 web-search 契约辅助函数 | 窄范围 web-search 配置 / 凭证契约辅助函数，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 以及作用域凭证 setter / getter |
  | `plugin-sdk/provider-web-search` | 提供商 web-search 辅助函数 | web-search 提供商注册 / 缓存 / 运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具 / schema 兼容性辅助函数 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及 xAI 兼容性辅助函数，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量辅助函数 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 以及其他提供商用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助函数 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装类型，以及共享 Anthropic / Bedrock / Google / Kilocode / Moonshot AI / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如 guarded fetch、传输消息转换以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取 / 转换 / 存储辅助函数，以及媒体负载构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 图像 / 视频 / 音乐生成的共享故障转移辅助函数、候选项选择以及缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型，以及面向提供商的图像 / 音频辅助导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助函数 | 对助手可见文本的剥离、markdown 渲染 / 分块 / 表格辅助函数、脱敏辅助函数、directive-tag 辅助函数、安全文本工具以及相关文本 / 日志辅助函数 |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型，以及面向提供商的 directive、注册表和校验辅助函数 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、directives、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | 提供商类型、注册表辅助函数以及共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、注册表 / 解析辅助函数以及桥接会话辅助函数 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复负载规范化 / 归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄范围渠道 config-schema 原语 |
  | `plugin-sdk/channel-config-writes` | 渠道 config-write 辅助函数 | 渠道 config-write 授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导模块 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助函数 | 共享渠道状态快照 / 摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | allowlist 配置辅助函数 | allowlist 配置编辑 / 读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm` | 直接私信辅助函数 | 共享直接私信 认证 / 守卫辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道 / 状态和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | webhook 目标辅助函数 | webhook 目标注册表和 route-install 辅助函数 |
  | `plugin-sdk/webhook-path` | webhook 路径辅助函数 | webhook 路径规范化辅助函数 |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助函数 | 远程 / 本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用方重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | Memory 核心管理器 / 配置 / 文件 / CLI 辅助接口 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 引擎运行时外观 | Memory 索引 / 搜索运行时外观 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 宿主基础引擎 | Memory 宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 宿主嵌入引擎 | Memory 嵌入契约、注册表访问、本地提供商以及通用批处理 / 远程辅助函数；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory 宿主 QMD 引擎 | Memory 宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory 宿主存储引擎 | Memory 宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | Memory 宿主多模态辅助函数 | Memory 宿主多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | Memory 宿主查询辅助函数 | Memory 宿主查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | Memory 宿主密钥辅助函数 | Memory 宿主密钥辅助函数 |
  | `plugin-sdk/memory-core-host-events` | Memory 宿主事件日志辅助函数 | Memory 宿主事件日志辅助函数 |
  | `plugin-sdk/memory-core-host-status` | Memory 宿主状态辅助函数 | Memory 宿主状态辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory 宿主 CLI 运行时 | Memory 宿主 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory 宿主核心运行时 | Memory 宿主核心运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory 宿主文件 / 运行时辅助函数 | Memory 宿主文件 / 运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | Memory 宿主核心运行时别名 | 面向供应商中立的 Memory 宿主核心运行时辅助函数别名 |
  | `plugin-sdk/memory-host-events` | Memory 宿主事件日志别名 | 面向供应商中立的 Memory 宿主事件日志辅助函数别名 |
  | `plugin-sdk/memory-host-files` | Memory 宿主文件 / 运行时别名 | 面向供应商中立的 Memory 宿主文件 / 运行时辅助函数别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 markdown 辅助函数 | 面向与 Memory 邻接插件的共享托管 markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 活跃 Memory 搜索外观 | 惰性活跃 Memory search-manager 运行时外观 |
  | `plugin-sdk/memory-host-status` | Memory 宿主状态别名 | 面向供应商中立的 Memory 宿主状态辅助函数别名 |
  | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助函数 | Memory-lancedb 辅助接口 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助函数和 mocks |
</Accordion>

这个表刻意只包含常见迁移子集，而不是完整的 SDK
接口。完整的 200+ 个入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍然包含一些内置插件辅助接口，例如
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些接口仍会继续导出，
用于内置插件维护和兼容性，但它们被有意省略在常见迁移表之外，也不是
新插件代码推荐使用的目标。

同样的规则也适用于其他内置辅助函数家族，例如：

- 浏览器支持辅助函数：`plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助函数 / 插件接口，例如 `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` 和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前暴露了窄范围的令牌辅助接口
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用与任务最匹配的最窄导入路径。如果你找不到某个导出，
请检查 `src/plugin-sdk/` 中的源码，或在 Discord 中提问。

## 当前弃用项

以下是横跨插件 SDK、提供商契约、运行时接口和清单的更窄范围弃用项。它们目前仍然可用，但将在未来的主要版本中移除。每个条目下方都给出了旧 API 到其规范替代方案的映射。

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：签名相同，导出相同——
    只是从更窄的子路径导入。`command-auth`
    将它们重新导出为兼容性桩。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **旧版**：`resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`，来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })` —— 返回一个
    单一决策对象，而不是拆分为两个调用。

    下游渠道插件（Slack、Discord、Matrix、Microsoft Teams）已经完成切换。

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` 是为较旧
    渠道插件提供的兼容性垫片。新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助函数
    已与原始 “actions” 渠道导出一起弃用。请改为通过语义化的
    `presentation` 接口暴露能力——渠道插件声明它们能渲染什么
    （cards、buttons、selects），而不是声明它们接受哪些原始
    action 名称。

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **旧版**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工厂。

    **新版**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助函数来注册工具包装器。

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **旧版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用于从入站渠道消息构建
    扁平纯文本提示 envelope。

    **新版**：`BodyForAgent` 加结构化用户上下文块。渠道
    插件会将路由元数据（thread、topic、reply-to、reactions）作为
    类型化字段附加，而不是把它们拼接进提示字符串中。
    `formatAgentEnvelope(...)` 辅助函数仍然支持用于合成的、
    面向助手的 envelope，但入站纯文本 envelope 正在被逐步淘汰。

    受影响区域：`inbound_claim`、`message_received`，以及任何对
    `channelEnvelope` 文本做后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    四个 discovery 类型别名现在只是对
    catalog 时代类型的轻量封装：

    | 旧别名 | 新类型 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder` | `ProviderCatalogOrder` |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult` |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog` |

    以及旧版的 `ProviderCapabilities` 静态集合——提供商插件
    应通过提供商运行时契约附加能力事实，而不是使用静态对象。

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，包含规范 `id`、可选 `label` 以及
    按级别排序的列表。OpenClaw 会按 profile 排名自动降级过期的已存储值。

    只需实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍可使用，
    但不会与 profile 结果进行组合。

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **旧版**：在插件清单中未声明提供商的情况下，实现
    `resolveExternalOAuthProfiles(...)`。

    **新版**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧的 “auth
    fallback” 路径会在运行时发出警告，并将在后续移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **旧版**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找镜像到清单中的 `setup.providers[].envVars`
    中。这样可以把设置 / 状态环境变量元数据整合到一个位置，
    并避免仅仅为了回答环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 仍然通过兼容适配器支持，
    直到弃用窗口结束。

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **旧版**：三个独立调用——
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：在 memory-state API 上使用一个调用——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同插槽，单次注册调用。附加型 Memory 辅助函数
    （`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧版 | 新版 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，改用
    `getSessionMessages`。签名相同；旧方法会直接调用
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧版**：`runtime.tasks.flow`（单数）返回一个实时 task-flow 访问器。

    **新版**：`runtime.tasks.flows`（复数）返回基于 DTO 的 TaskFlow 访问，
    它具备导入安全性，且不需要加载完整任务运行时。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    上文“如何迁移 → 将 Pi 工具结果扩展迁移到中间件”中已涵盖。这里列出
    仅为完整性考虑：已移除的、仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 路径现由
    `api.registerAgentToolResultMiddleware(...)` 替代，并在
    `contracts.agentToolResultMiddleware` 中提供显式运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的一行别名。请优先使用规范名称。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级弃用项（位于 `extensions/` 下的内置渠道 / 提供商插件内部）
会在它们各自的 `api.ts` 和 `runtime-api.ts`
barrel 中跟踪。它们不会影响第三方插件契约，因此未在此列出。如果你直接
使用某个内置插件的本地 barrel，请在升级前先阅读该
barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间 | 会发生什么 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口会发出运行时警告 |
| **下一个主要版本** | 已弃用接口将被移除；仍在使用它们的插件将会失败 |

所有核心插件都已经完成迁移。外部插件应在下一个主要版本之前完成迁移。

## 临时抑制警告

在你进行迁移期间，设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是临时逃生舱口，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深度解析
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema 参考
