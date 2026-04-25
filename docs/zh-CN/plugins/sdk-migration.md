---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你在 OpenClaw 2026.4.24 之前使用过 `api.registerEmbeddedExtensionFactory`
    - 你正在将插件更新到现代插件架构
    - 你在维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-25T01:51:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7072e690b1f23fd80d4de9a00bc0352f0c635d1ed89d4b530bfbb1f9f6eab483
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，提供更聚焦、文档完善的导入路径。如果你的插件是在新架构之前构建的，本指南可帮助你完成迁移。

## 正在发生什么变化

旧插件系统提供了两个开放范围很大的接口面，使插件能够从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 一个单一导入路径，会重新导出数十个辅助函数。它最初是为了在构建新插件架构期间，让较旧的基于钩子的插件继续工作。
- **`openclaw/extension-api`** — 一个桥接层，使插件能够直接访问宿主端辅助函数，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** — 一个已移除的、仅限 Pi 的内置扩展钩子，可观察嵌入式运行器事件，例如 `tool_result`。

这些宽泛的导入接口面现已**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件也应在下一个主要版本移除它们之前完成迁移。仅限 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已文档化的插件行为。破坏性契约变更必须先经过兼容适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子和运行时注册行为。

<Warning>
  向后兼容层将在未来的一个主要版本中移除。
  仍然从这些接口面导入的插件届时将会失效。
  仅限 Pi 的嵌入式扩展工厂注册现在已经不会再加载。
</Warning>

## 为什么会有这项变更

旧方法会带来一些问题：

- **启动缓慢** — 导入一个辅助函数会加载数十个无关模块
- **循环依赖** — 宽泛的重新导出很容易造成导入循环
- **API 接口面不清晰** — 无法判断哪些导出是稳定的，哪些属于内部实现

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，具有明确用途和已文档化的契约。

面向内置渠道的旧版提供商便捷接口也已移除。类似
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
带有渠道品牌的辅助接口，以及
`openclaw/plugin-sdk/telegram-core`
这样的导入路径，都是私有 monorepo 快捷方式，而不是稳定的插件契约。请改用更窄、更通用的 SDK 子路径。在内置插件工作区内部，应将提供商自有的辅助函数保留在该插件自己的
`api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用的流式传输辅助函数保留在其自己的 `api.ts` /
  `contract-api.ts` 接口中
- OpenAI 将提供商构建器、默认模型辅助函数和实时提供商构建器保留在其自己的 `api.ts` 中
- OpenRouter 将提供商构建器以及新手引导 / 配置辅助函数保留在其自己的 `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容适配器保持旧行为继续可用
3. 发出诊断或警告，明确指出旧路径及其替代方案
4. 在测试中覆盖两条路径
5. 记录弃用信息和迁移路径
6. 仅在已宣布的迁移窗口结束后移除，通常是在主要版本中

如果某个清单字段仍然被接受，插件作者就可以继续使用它，直到文档和诊断另有说明。新代码应优先使用已文档化的替代方案，但现有插件不应在普通次要版本中失效。

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

    外部插件不能注册工具结果中间件，因为它可以在模型看到之前重写高信任级别的工具输出。

  </Step>

  <Step title="将原生审批处理器迁移到能力事实">
    支持审批的渠道插件现在通过
    `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表来暴露原生审批行为。

    关键变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`
    - 将审批专用的认证 / 投递逻辑从旧版 `plugin.auth` /
      `plugin.approvals` 线路迁移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公开的渠道插件契约中移除；
      请将 delivery / native / render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留用于渠道登录 / 登出流程；其中的审批认证
      钩子不再由核心读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context`
      注册渠道自有的运行时对象，例如客户端、令牌或 Bolt
      应用
    - 不要从原生审批处理器发送插件自有的重路由通知；
      核心现在会根据实际投递结果统一处理“已路由到其他地方”的通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供一个
      真实的 `createPluginRuntime().channel` 接口。部分桩实现将被拒绝。

    有关当前审批能力布局，请参见 `/plugins/sdk-channel-plugins`。

  </Step>

  <Step title="审查 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，
    那么当 Windows `.cmd` / `.bat` 包装器无法解析时，现在会默认失败关闭，除非你显式传入 `allowShellFallback: true`。

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
    在你的插件中搜索来自这两个已弃用接口面的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为聚焦导入">
    旧接口面中的每个导出都映射到一个特定的现代导入路径：

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

    相同模式也适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等价项 |
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

  <Accordion title="常用导入路径表">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范的插件入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义 / 构建器的旧版聚合重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享的设置向导辅助函数 | Allowlist 提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助函数 | 可安全导入的设置补丁适配器、查找说明辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委派设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助函数 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表 / 配置 / 操作门控辅助函数 |
  | `plugin-sdk/account-id` | account-id 辅助函数 | `DEFAULT_ACCOUNT_ID`、account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助函数 | 账户列表 / 账户操作辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入中状态线路 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 共享渠道配置 schema 原语；以内置渠道命名的 schema 导出仅用于旧版兼容性 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名规范化、描述裁剪、重复 / 冲突校验 |
  | `plugin-sdk/channel-policy` | 群组 / 私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态和草稿流生命周期辅助函数 | `createAccountStatusSink`、草稿预览收尾辅助函数 |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助函数 | 共享路由 + envelope 构建器辅助函数 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助函数 | 共享记录并分发辅助函数 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析 / 匹配辅助函数 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助函数 | 出站身份 / 发送委派和载荷规划辅助函数 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助函数 | 面向旧字段布局的智能体媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性 shim | 仅保留旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助函数 | 运行时 / 日志 / 备份 / 插件安装辅助函数 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助函数 | 日志器 / 运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助函数 | 插件命令 / 钩子 / http / 交互式辅助函数 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助函数 | 共享 webhook / 内部钩子流水线辅助函数 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助函数 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助函数 | Gateway 网关客户端和渠道状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 配置辅助函数 | 配置加载 / 写入辅助函数 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 当内置 Telegram 契约接口不可用时，提供具备稳定回退行为的 Telegram 命令校验辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | exec / 插件审批载荷、审批能力 / 配置文件辅助函数、原生审批路由 / 运行时辅助函数，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助函数 | 审批人解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 exec 审批配置文件 / 过滤器辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助函数 | 原生审批能力 / 投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助函数 | 共享审批 Gateway 网关解析辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 用于高频渠道入口点的轻量级原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助函数 | 范围更广的审批处理器运行时辅助函数；如果较窄的 adapter / gateway 接口已足够，则优先使用后者 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标 / 账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | exec / 插件审批回复载荷辅助函数 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助函数 | 通用渠道运行时上下文 register / get / watch 辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、私信门控、外部内容和密钥收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机 allowlist 和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | 固定 dispatcher、受保护 fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助函数 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助函数 |
  | `plugin-sdk/fetch-runtime` | 包装后的 fetch / 代理辅助函数 | `resolveFetch`、代理辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | Allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助函数 | `resolveControlCommandGate`、发送者授权辅助函数、命令注册表辅助函数 |
  | `plugin-sdk/command-status` | 命令状态 / 帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助函数 | Webhook 目标工具函数 |
  | `plugin-sdk/webhook-request-guards` | Webhook 请求体保护辅助函数 | 请求体读取 / 限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助函数 | 收尾、提供商分发和会话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助函数 | 文本 / Markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助函数 | 存储路径 + updated-at 辅助函数 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态目录和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由 / session-key 辅助函数 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、session-key 规范化辅助函数 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助函数 | 渠道 / 账户状态摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助函数 | 共享目标解析器辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | slug / 字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助函数 | 带标准化 stdout / stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具 / CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取标准化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范的发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统日志器和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 面向本地 / 自托管提供商的精选设置辅助函数 | 自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管提供商设置辅助函数 | 同一组自托管提供商发现 / 配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助函数 | 运行时 API key 解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API key 设置辅助函数 | API key 新手引导 / 配置文件写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果辅助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录辅助函数 | 共享交互式登录辅助函数 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动提供商选择，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型 / 重放辅助函数 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数，以及 model-id 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP / 端点能力辅助函数，包括音频转录 multipart 表单辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助函数 | web-fetch 提供商注册 / 缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 web-search 配置辅助函数 | 面向无需插件启用线路的提供商的窄范围 web-search 配置 / 凭证辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 web-search 契约辅助函数 | 窄范围 web-search 配置 / 凭证契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及作用域化凭证 setter / getter |
  | `plugin-sdk/provider-web-search` | 提供商 web-search 辅助函数 | web-search 提供商注册 / 缓存 / 运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具 / schema 兼容辅助函数 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + 诊断，以及 xAI 兼容辅助函数，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量辅助函数 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 以及其他提供商用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助函数 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic / Bedrock / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如受保护 fetch、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取 / 转换 / 存储辅助函数，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 共享故障转移辅助函数、候选项选择，以及用于图像 / 视频 / 音乐生成的缺失模型提示 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型，以及面向提供商的图像 / 音频辅助函数导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助函数 | 面向助手可见文本剥离、Markdown 渲染 / 分块 / 表格辅助函数、脱敏辅助函数、指令标签辅助函数、安全文本工具，以及相关文本 / 日志辅助函数 |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型，以及面向提供商的指令、注册表和校验辅助函数 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | 提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、注册表 / 解析辅助函数和桥接会话辅助函数 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商 / 请求 / 结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找和 model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复载荷规范化 / 缩减 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄范围渠道 config-schema 原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助函数 | 渠道配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导模块 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助函数 | 共享渠道状态快照 / 摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | Allowlist 配置辅助函数 | Allowlist 配置编辑 / 读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm` | 直接私信辅助函数 | 共享直接私信认证 / 保护辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道 / 状态和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助函数 | Webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | Webhook 路径辅助函数 | Webhook 路径规范化辅助函数 |
  | `plugin-sdk/web-media` | 共享 web 媒体辅助函数 | 远程 / 本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用者重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | Memory 管理器 / 配置 / 文件 / CLI 辅助接口 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 引擎运行时门面 | Memory 索引 / 搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 宿主基础引擎 | Memory 宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 宿主嵌入引擎 | Memory 嵌入契约、注册表访问、本地提供商和通用批处理 / 远程辅助函数；具体远程提供商位于其所属插件中 |
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
  | `plugin-sdk/memory-host-core` | Memory 宿主核心运行时别名 | 面向厂商中立的 Memory 宿主核心运行时辅助函数别名 |
  | `plugin-sdk/memory-host-events` | Memory 宿主事件日志别名 | 面向厂商中立的 Memory 宿主事件日志辅助函数别名 |
  | `plugin-sdk/memory-host-files` | Memory 宿主文件 / 运行时别名 | 面向厂商中立的 Memory 宿主文件 / 运行时辅助函数别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助函数 | 面向 Memory 相邻插件的共享托管 Markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 活动 Memory 搜索门面 | 惰性活动 Memory 搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | Memory 宿主状态别名 | 面向厂商中立的 Memory 宿主状态辅助函数别名 |
  | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助函数 | Memory-lancedb 辅助接口 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助函数和 mocks |
</Accordion>

这个表刻意只包含常见迁移子集，而不是完整的 SDK
接口面。完整的 200+ 个入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍然包含一些内置插件辅助接口，例如
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些导出仍会保留，
用于内置插件维护和兼容性，但它们被有意排除在常见迁移表之外，
也不是新插件代码的推荐目标。

同样的规则也适用于其他内置辅助接口族，例如：

- 浏览器支持辅助函数：`plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助函数 / 插件接口，例如 `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、
  `plugin-sdk/thread-ownership` 和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前公开的是窄范围 token 辅助接口
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用最符合当前任务的最窄导入路径。如果你找不到某个导出，
请查看 `src/plugin-sdk/` 中的源码，或在 Discord 中提问。

## 当前弃用项

这些更窄范围的弃用项适用于整个插件 SDK、提供商契约、
运行时接口和清单。它们目前仍然可用，但将在未来的主要版本中移除。
每个条目下方都给出了旧 API 与其规范替代方案的映射。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：签名相同，导出也相同——
    只是改为从更窄的子路径导入。`command-auth`
    会将它们作为兼容性 stub 重新导出。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助函数 → resolveInboundMentionDecision">
    **旧版**：`resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`，来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })` —— 它返回一个
    单一决策对象，而不是拆分为两个调用。

    下游渠道插件（Slack、Discord、Matrix、MS Teams）已全部完成切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道操作辅助函数">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧渠道插件的兼容性 shim。
    新代码不要导入它；请改用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*`
    辅助函数也已随原始 “actions” 渠道导出一同弃用。请改为通过语义化的
    `presentation` 接口暴露能力——渠道插件应声明它们能渲染什么
    （卡片、按钮、选择器），而不是声明它们接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助函数 → 插件上的 createTool()">
    **旧版**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工厂函数。

    **新版**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助函数来注册该工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道 envelope → BodyForAgent">
    **旧版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用于从入站渠道消息构建
    扁平的纯文本提示 envelope。

    **新版**：`BodyForAgent` 加上结构化用户上下文块。
    渠道插件会将路由元数据（线程、主题、reply-to、reactions）作为
    类型化字段附加，而不是将它们拼接到提示字符串中。
    `formatAgentEnvelope(...)` 辅助函数仍支持用于合成面向助手的
    envelope，但入站纯文本 envelope 正在逐步淘汰。

    受影响区域：`inbound_claim`、`message_received`，以及任何会对
    `channelEnvelope` 文本进行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="提供商发现类型 → 提供商目录类型">
    四个发现类型别名现在只是目录时代类型的薄包装：

    | 旧别名 | 新类型 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外，旧版的 `ProviderCapabilities` 静态集合也已不再推荐——提供商插件
    应通过提供商运行时契约附加能力事实，而不是使用静态对象。

  </Accordion>

  <Accordion title="Thinking 策略钩子 → resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上分散的三个钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：单个 `resolveThinkingProfile(ctx)`，它返回一个
    `ProviderThinkingProfile`，其中包含规范的 `id`、可选的 `label` 以及
    已排序的级别列表。OpenClaw 会按 profile 排名自动降级过时的已存储值。

    现在只需实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍可继续使用，
    但不会与 profile 结果组合。

  </Accordion>

  <Accordion title="外部 OAuth 提供商回退 → contracts.externalAuthProviders">
    **旧版**：实现 `resolveExternalOAuthProfiles(...)`，
    但不在插件清单中声明该提供商。

    **新版**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧版 “auth
    fallback” 路径会在运行时发出警告，并将在之后被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商环境变量查找 → setup.providers[].envVars">
    **旧版** 清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找镜像到清单中的 `setup.providers[].envVars`。
    这样可以将设置 / 状态环境变量元数据统一到一个位置，
    并避免仅为回答环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容适配器继续受支持，
    直到弃用窗口结束。

  </Accordion>

  <Accordion title="Memory 插件注册 → registerMemoryCapability">
    **旧版**：三个独立调用——
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：在 memory-state API 上使用一个调用——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    插槽相同，但统一为单次注册调用。增量式 Memory 辅助函数
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="Subagent 会话消息类型已重命名">
    仍然从 `src/plugins/runtime/types.ts` 导出的两个旧类型别名：

    | 旧版 | 新版 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，推荐改用
    `getSessionMessages`。签名相同；旧方法会转调到
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧版**：`runtime.tasks.flow`（单数）返回一个实时 task-flow 访问器。

    **新版**：`runtime.tasks.flows`（复数）返回基于 DTO 的 TaskFlow 访问，
    这种方式可安全导入，且不需要加载完整任务运行时。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → 智能体工具结果中间件">
    上文 “如何迁移 → 将 Pi 工具结果扩展迁移到中间件” 已对此进行说明。
    这里为了完整性再次列出：已移除的、仅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 路径，现替换为
    `api.registerAgentToolResultMiddleware(...)`，并在
    `contracts.agentToolResultMiddleware` 中显式声明运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在只是
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
扩展级弃用项（位于 `extensions/` 下的内置渠道 / 提供商插件内部）
会在它们各自的 `api.ts` 和 `runtime-api.ts`
barrel 中跟踪。它们不会影响第三方插件契约，因此这里不列出。
如果你直接使用某个内置插件的本地 barrel，请在升级前先阅读
该 barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间 | 将发生的事情 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口面会发出运行时警告 |
| **下一个主要版本** | 已弃用接口面将被移除；仍在使用它们的插件将会失效 |

所有核心插件都已完成迁移。外部插件应在下一个主要版本之前完成迁移。

## 临时抑制警告

在迁移期间工作时，可以设置以下环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是临时的应急出口，不是永久解决方案。

## 相关

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深度解析
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema 参考
