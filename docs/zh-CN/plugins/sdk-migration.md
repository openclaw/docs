---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告。
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告。
    - 你正在使用 `api.registerEmbeddedExtensionFactory`。
    - 你正在将插件更新到现代插件架构。
    - 你在维护一个外部 OpenClaw 插件。
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-24T19:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa44b2e9f3748ce41c91b5e389dbe0acee03e2ec84b35086068f419a252208a0
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw 已从宽泛的向后兼容层迁移到具有聚焦且有文档说明导入路径的现代插件架构。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 正在发生的变化

旧的插件系统提供了两个完全开放的接口，使插件可以从单个入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** —— 一个会重新导出数十个辅助函数的单一导入入口。
  它的引入是为了在新的插件架构构建期间，让较旧的基于 hook 的插件继续工作。
- **`openclaw/extension-api`** —— 一个桥接层，使插件可以直接访问
  宿主侧辅助函数，例如嵌入式 agent 运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** —— 一个仅限 Pi 的内置扩展
  hook，可用于观察诸如 `tool_result` 之类的 embedded-runner 事件。

这些接口现在都已被**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件也应在下一个 major 版本移除它们之前完成迁移。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已文档化的插件行为。破坏性契约变更必须先经过兼容适配器、诊断、文档和弃用窗口。
这适用于 SDK 导入、manifest 字段、设置 API、hooks 和运行时注册行为。

<Warning>
  向后兼容层将在未来的某个 major 版本中移除。
  到那时仍从这些接口导入的插件将会失效。
</Warning>

## 为什么会有这个变化

旧方法会导致这些问题：

- **启动缓慢** —— 导入一个辅助函数会加载数十个无关模块
- **循环依赖** —— 宽泛的重新导出很容易造成导入环
- **API 接口不清晰** —— 无法分辨哪些导出是稳定的，哪些是内部实现

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）
都是一个小型、自包含的模块，具有明确用途和文档化契约。

用于内置渠道的旧版提供商便捷接口也已移除。像
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
带渠道品牌的辅助接口，以及
`openclaw/plugin-sdk/telegram-core`
这类导入，都是私有 mono-repo 快捷方式，而不是稳定的插件契约。请改用更窄的通用 SDK 子路径。在内置插件工作区内部，请将提供商自有辅助函数保留在该插件自己的
`api.ts` 或 `runtime-api.ts` 中。

当前的内置提供商示例：

- Anthropic 将 Claude 专用流辅助函数保留在它自己的 `api.ts` /
  `contract-api.ts` 接口中
- OpenAI 将提供商构建器、默认模型辅助函数和实时提供商构建器保留在它自己的 `api.ts` 中
- OpenRouter 将提供商构建器以及新手引导 / 配置辅助函数保留在它自己的
  `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容适配器继续保留旧行为
3. 发出诊断或警告，明确指出旧路径及其替代项
4. 在测试中覆盖两条路径
5. 记录弃用信息和迁移路径
6. 仅在已宣布的迁移窗口结束后移除，通常是在某个 major 版本中

如果某个 manifest 字段仍被接受，那么在文档和诊断另有说明之前，插件作者可以继续使用它。新代码应优先使用文档中的替代方案，但现有插件不应在普通 minor 版本中被破坏。

## 如何迁移

<Steps>
  <Step title="将 Pi 工具结果扩展迁移到中间件">
    将仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 工具结果
    处理器替换为与 harness 无关的中间件。

    ```typescript
    // Before: Pi-only compatibility hook
    api.registerEmbeddedExtensionFactory((pi) => {
      pi.on("tool_result", async (event) => {
        return compactToolResult(event);
      });
    });

    // After: Pi and Codex app-server dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      harnesses: ["pi", "codex-app-server"],
    });
    ```

    同时更新插件 manifest：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex-app-server"]
      }
    }
    ```

    仅当内置兼容代码仍然需要直接访问 Pi embedded-runner 事件时，
    才保留 `contracts.embeddedExtensionFactories`。

  </Step>

  <Step title="将原生审批处理器迁移到 capability facts">
    具备审批能力的渠道插件现在通过
    `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表来公开原生审批行为。

    关键变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用的认证 / 传递从旧版 `plugin.auth` /
      `plugin.approvals` 线路迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；
      请将 delivery / native / render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留给渠道登录 / 登出流程使用；其中的审批认证
      hooks 不再被核心读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context`
      注册渠道自有运行时对象，例如 clients、tokens 或 Bolt apps
    - 不要从原生审批处理器发送插件自有的重路由通知；
      核心现在根据实际传递结果统一处理“已路由到其他位置”的通知
    - 将 `channelRuntime` 传递给 `createChannelManager(...)` 时，请提供真实的
      `createPluginRuntime().channel` 接口。不接受部分 stub。

    当前的审批能力布局请参见 `/plugins/sdk-channel-plugins`。

  </Step>

  <Step title="审查 Windows wrapper 回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，现在未解析的 Windows
    `.cmd`/`.bat` wrapper 会以默认拒绝方式失败，除非你显式传入 `allowShellFallback: true`。

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

    如果你的调用方并不依赖 shell 回退，请不要设置
    `allowShellFallback`，而应改为处理抛出的错误。

  </Step>

  <Step title="查找已弃用的导入">
    在你的插件中搜索来自任一已弃用接口的导入：

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

    对于宿主侧辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    相同模式也适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等效项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | 规范的插件入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义 / 构建器的旧版聚合重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助函数 | Allowlist 提示，设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助函数 | 导入安全的设置补丁适配器、lookup-note 辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助函数 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表 / 配置 / action-gate 辅助函数 |
  | `plugin-sdk/account-id` | account-id 辅助函数 | `DEFAULT_ACCOUNT_ID`，account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助函数 | 账户列表 / account-action 辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入中 wiring | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 渠道配置 schema 类型 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名规范化、描述裁剪、重复 / 冲突校验 |
  | `plugin-sdk/channel-policy` | 群组 / 私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态和 draft 流生命周期辅助函数 | `createAccountStatusSink`，draft 预览完成辅助函数 |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助函数 | 共享 route + envelope 构建器辅助函数 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助函数 | 共享记录和分发辅助函数 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析 / 匹配辅助函数 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助函数 | 出站身份 / 发送委托和负载规划辅助函数 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体负载辅助函数 | 用于旧字段布局的智能体媒体负载构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性 shim | 仅限旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助函数 | 运行时 / 日志 / 备份 / 插件安装辅助函数 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助函数 | Logger / 运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助函数 | 插件命令 / hooks / HTTP / 交互式辅助函数 |
  | `plugin-sdk/hook-runtime` | hook 管道辅助函数 | 共享 webhook / 内部 hook 管道辅助函数 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助函数 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助函数 | Gateway 网关客户端和渠道状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 配置辅助函数 | 配置加载 / 写入辅助函数 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 当内置 Telegram 契约接口不可用时，提供具备稳定回退能力的 Telegram 命令校验辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | exec / 插件审批负载、审批能力 / 配置档辅助函数、原生审批路由 / 运行时辅助函数 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助函数 | approver 解析、同聊天 action 认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 exec 审批配置档 / 过滤辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批传递辅助函数 | 原生审批能力 / 传递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助函数 | 共享审批 Gateway 网关解析辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 用于热渠道入口点的轻量级原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助函数 | 更宽范围的审批处理器运行时辅助函数；如果更窄的 adapter / gateway 接口已足够，请优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标 / 账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | exec / 插件审批回复负载辅助函数 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助函数 | 通用渠道运行时上下文 register / get / watch 辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、私信门控、外部内容和秘密收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机 allowlist 和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | pinned-dispatcher、受保护 fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助函数 | `formatUncaughtError`, `isApprovalNotFoundError`，错误图辅助函数 |
  | `plugin-sdk/fetch-runtime` | 封装的 fetch / 代理辅助函数 | `resolveFetch`，代理辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`, `retryAsync`，策略运行器 |
  | `plugin-sdk/allow-from` | allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助函数 | `resolveControlCommandGate`，发送者授权辅助函数，命令注册表辅助函数 |
  | `plugin-sdk/command-status` | 命令状态 / 帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 秘密输入解析 | 秘密输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | webhook 请求辅助函数 | webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | webhook 请求体守卫辅助函数 | 请求体读取 / 限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助函数 | 完成、提供商分发和会话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助函数 | 文本 / markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助函数 | 存储路径 + updated-at 辅助函数 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由 / session-key 辅助函数 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`，session-key 规范化辅助函数 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助函数 | 渠道 / 账户状态摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助函数 | 共享目标解析器辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | slug / 字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助函数 | 带规范化 stdout / stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具 / CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具负载提取 | 从工具结果对象中提取规范化负载 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范的发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统 logger 和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复负载类型 |
  | `plugin-sdk/provider-setup` | 精选的本地 / 自托管提供商设置辅助函数 | 自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管提供商设置辅助函数 | 同一组自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助函数 | 运行时 API 密钥解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置辅助函数 | API 密钥新手引导 / 配置档写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果辅助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录辅助函数 | 共享交互式登录辅助函数 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动提供商选择，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型 / 重放辅助函数 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`，共享重放策略构建器、提供商端点辅助函数，以及 model-id 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP / 端点能力辅助函数，包括音频转录 multipart form 辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web 获取辅助函数 | web 获取提供商注册 / 缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 web 搜索配置辅助函数 | 适用于不需要插件启用线路的提供商的窄范围 web 搜索配置 / 凭证辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 web 搜索契约辅助函数 | 窄范围 web 搜索配置 / 凭证契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及带作用域的凭证 setter / getter |
  | `plugin-sdk/provider-web-search` | 提供商 web 搜索辅助函数 | web 搜索提供商注册 / 缓存 / 运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具 / schema 兼容辅助函数 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + 诊断，以及 xAI 兼容辅助函数，如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商使用量辅助函数 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`，以及其他提供商使用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助函数 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic / Bedrock / Google / Kilocode / Moonshot AI / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如受保护 fetch、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取 / 转换 / 存储辅助函数以及媒体负载构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 图像 / 视频 / 音乐生成的共享故障转移辅助函数、候选项选择和缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型，以及面向提供商的图像 / 音频辅助函数导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助函数 | 面向助手可见文本剥离、markdown 渲染 / 分块 / 表格辅助函数、脱敏辅助函数、directive-tag 辅助函数、安全文本工具，以及相关文本 / 日志辅助函数 |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型，以及面向提供商的 directive、registry 和校验辅助函数 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、registry、directives、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | 提供商类型、registry 辅助函数和共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、registry / 解析辅助函数和桥接会话辅助函数 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和 registry 辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复负载规范化 / 规约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄范围渠道 config-schema 原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助函数 | 渠道配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导模块 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助函数 | 共享渠道状态快照 / 摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | allowlist 配置辅助函数 | allowlist 配置编辑 / 读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm` | 直接私信辅助函数 | 共享直接私信认证 / 守卫辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道 / 状态和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | webhook 目标辅助函数 | webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | webhook 路径辅助函数 | webhook 路径规范化辅助函数 |
  | `plugin-sdk/web-media` | 共享 web 媒体辅助函数 | 远程 / 本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | Zod 重新导出 | 面向插件 SDK 使用者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | Memory 管理器 / 配置 / 文件 / CLI 辅助接口 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 引擎运行时外观层 | Memory 索引 / 搜索运行时外观层 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 宿主基础引擎 | Memory 宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 宿主嵌入引擎 | Memory 嵌入契约、registry 访问、本地提供商和通用批处理 / 远程辅助函数；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory 宿主 QMD 引擎 | Memory 宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory 宿主存储引擎 | Memory 宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | Memory 宿主多模态辅助函数 | Memory 宿主多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | Memory 宿主查询辅助函数 | Memory 宿主查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | Memory 宿主秘密辅助函数 | Memory 宿主秘密辅助函数 |
  | `plugin-sdk/memory-core-host-events` | Memory 宿主事件日志辅助函数 | Memory 宿主事件日志辅助函数 |
  | `plugin-sdk/memory-core-host-status` | Memory 宿主状态辅助函数 | Memory 宿主状态辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory 宿主 CLI 运行时 | Memory 宿主 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory 宿主核心运行时 | Memory 宿主核心运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory 宿主文件 / 运行时辅助函数 | Memory 宿主文件 / 运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | Memory 宿主核心运行时别名 | 面向供应商中立的 Memory 宿主核心运行时辅助函数别名 |
  | `plugin-sdk/memory-host-events` | Memory 宿主事件日志别名 | 面向供应商中立的 Memory 宿主事件日志辅助函数别名 |
  | `plugin-sdk/memory-host-files` | Memory 宿主文件 / 运行时别名 | 面向供应商中立的 Memory 宿主文件 / 运行时辅助函数别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 markdown 辅助函数 | 用于 memory 邻接插件的共享托管 markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 活跃 Memory 搜索外观层 | 惰性 active-memory search-manager 运行时外观层 |
  | `plugin-sdk/memory-host-status` | Memory 宿主状态别名 | 面向供应商中立的 Memory 宿主状态辅助函数别名 |
  | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助函数 | Memory-lancedb 辅助接口 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助函数和 mocks |
</Accordion>

此表刻意只包含常见迁移子集，而不是完整的 SDK
接口。完整的 200+ 个入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍包含一些内置插件辅助接口，例如
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些接口仍会继续导出，
以支持内置插件维护和兼容性，但它们被有意排除在常见迁移表之外，也不是新插件代码的推荐目标。

同样的规则也适用于其他内置辅助接口族，例如：

- 浏览器支持辅助函数：`plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助 / 插件接口，例如 `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、
  `plugin-sdk/thread-ownership` 和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前公开的窄范围 token 辅助接口为
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用与任务最匹配的最窄导入路径。如果你找不到某个导出，请查看
`src/plugin-sdk/` 中的源码，或在 Discord 中提问。

## 移除时间线

| 时间 | 会发生什么 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口会发出运行时警告 |
| **下一个 major 版本** | 已弃用接口将被移除；仍在使用它们的插件将会失效 |

所有核心插件都已经完成迁移。外部插件应在下一个 major 版本之前完成迁移。

## 临时抑制警告

在你进行迁移期间，可设置以下环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是一个临时紧急放行手段，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深度解析
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema 参考
