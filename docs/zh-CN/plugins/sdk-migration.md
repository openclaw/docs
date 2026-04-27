---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你在 OpenClaw 2026.4.25 之前使用过 `api.registerEmbeddedExtensionFactory`
    - 你正在将插件更新到现代插件架构
    - 你在维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-27T12:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40dd590e9a9a2a340da9b6ecba5dd471713552a214aa7fd24970db2b47a4a04c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw 已从宽泛的向后兼容层迁移到具有聚焦且文档化导入路径的现代插件架构。如果你的插件构建于新架构之前，本指南将帮助你完成迁移。

## 正在发生什么变化

旧的插件系统提供了两个开放面很大的接口，使插件能够从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** —— 一个会重新导出数十个辅助工具的单一导入入口。它的引入是为了在新的插件架构构建期间，让较旧的基于 hook 的插件继续工作。
- **`openclaw/extension-api`** —— 一个桥接层，让插件可以直接访问主机侧辅助工具，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** —— 一个已移除的、仅适用于 Pi 的内置扩展 hook，它过去可以观察诸如 `tool_result` 这样的嵌入式运行器事件。

这些宽泛的导入接口现在都已**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件也应在下一个主版本移除它们之前完成迁移。仅适用于 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已文档化的插件行为。破坏性契约变更必须先经过兼容适配器、诊断、文档和弃用窗口。此规则适用于 SDK 导入、manifest 字段、设置 API、hooks 和运行时注册行为。

<Warning>
  向后兼容层将在未来的某个主版本中移除。
  仍从这些接口导入的插件到时将会失效。
  仅适用于 Pi 的嵌入式扩展工厂注册现已不再加载。
</Warning>

## 为什么会有这项变化

旧方法带来了若干问题：

- **启动缓慢** —— 导入一个辅助工具会连带加载数十个无关模块
- **循环依赖** —— 宽泛的重新导出使创建导入环路变得很容易
- **API 界面不清晰** —— 无法分辨哪些导出是稳定的，哪些是内部实现

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，具有明确用途和文档化契约。

面向内置渠道的旧版 provider 便捷接口也已移除。
带有渠道品牌的辅助接口曾是私有 mono-repo 捷径，而不是稳定的插件契约。请改用更窄的通用 SDK 子路径。在内置插件工作区内，应将 provider 自有的辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置 provider 示例：

- Anthropic 将 Claude 特定的流式辅助工具保留在自己的 `api.ts` /
  `contract-api.ts` 接口中
- OpenAI 将 provider builder、默认模型辅助工具和 realtime provider
  builder 保留在自己的 `api.ts` 中
- OpenRouter 将 provider builder 以及新手引导/配置辅助工具保留在自己的
  `api.ts` 中

## 兼容性策略

对于外部插件，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容适配器保留旧行为
3. 发出诊断或警告，明确指出旧路径及其替代方案
4. 在测试中覆盖两条路径
5. 记录弃用和迁移路径
6. 仅在公布的迁移窗口结束后移除，通常是在主版本中

如果某个 manifest 字段仍然被接受，插件作者就可以继续使用它，直到文档和诊断另行说明。新代码应优先采用文档化的替代方案，但现有插件不应在普通的小版本发布中失效。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助工具">
    内置插件应停止直接调用
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。应优先使用已传入当前调用路径中的配置。需要当前进程快照的长生命周期处理器可使用 `api.runtime.config.current()`。长生命周期的智能体工具应在 `execute` 中使用工具上下文的 `ctx.getRuntimeConfig()`，这样即使工具创建于配置写入之前，也仍能看到刷新的运行时配置。

    配置写入必须通过事务性辅助工具完成，并选择写入后的策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方明确知道变更需要一次干净的 Gateway 网关重启时，请使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有当调用方自行负责后续处理并且有意抑制重载规划器时，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    变更结果会包含一个带类型的 `followUp` 摘要，用于测试和日志记录；Gateway 网关仍负责实际执行或调度重启。
    `loadConfig` 和 `writeConfigFile` 在迁移窗口期间仍作为已弃用的兼容辅助工具保留给外部插件使用，并会在调用时发出一次警告。
    内置插件和仓库运行时代码会受到 `pnpm check:deprecated-internal-config-api` 中扫描防护的约束：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，而长生命周期运行时模块不得存在任何环境式 `loadConfig()` 调用。

  </Step>

  <Step title="将 Pi 工具结果扩展迁移到中间件">
    内置插件必须将仅适用于 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器替换为运行时无关的中间件。

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

    外部插件不能注册工具结果中间件，因为这会在模型看到结果之前重写高信任度的工具输出。

  </Step>

  <Step title="将原生 approval 处理器迁移到 capability facts">
    支持 approval 的渠道插件现在通过
    `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表来公开原生 approval 行为。

    关键变化：

    - 用 `approvalCapability.nativeRuntime` 替换
      `approvalCapability.handler.loadRuntime(...)`
    - 将 approval 特有的认证/交付从旧版 `plugin.auth` /
      `plugin.approvals` 线路中迁出，改放到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；
      请将 delivery/native/render 字段迁移到 `approvalCapability`
    - `plugin.auth` 仅保留给渠道登录/登出流程；其中的 approval
      认证 hooks 不再被核心读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context`
      注册由渠道持有的运行时对象，例如客户端、token 或 Bolt
      应用
    - 不要从原生 approval 处理器发送由插件自有的改道通知；
      核心现在会根据实际交付结果自行处理“已路由到其他位置”的通知
    - 当把 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供真实的 `createPluginRuntime().channel` 接口。部分 stub 会被拒绝。

    参见 `/plugins/sdk-channel-plugins` 了解当前的 approval capability
    布局。

  </Step>

  <Step title="审查 Windows wrapper fallback 行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，现在未解析的 Windows
    `.cmd`/`.bat` wrapper 会默认失败即关闭，除非你显式传入
    `allowShellFallback: true`。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅对那些有意接受 shell 中介 fallback 的可信兼容调用方设置此项。
      allowShellFallback: true,
    });
    ```

    如果你的调用方并不有意依赖 shell fallback，就不要设置
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
    旧接口中的每个导出都映射到一个明确的现代导入路径：

    ```typescript
    // Before（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（现代聚焦导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机侧辅助工具，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before（已弃用的 extension-api 桥接）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入式运行时）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助工具也遵循同样的模式：

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
  | `plugin-sdk/plugin-entry` | 规范的插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 面向渠道入口定义/builders 的旧版聚合重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和 builders | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | Allowlist 提示、设置 Status builders |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助工具 | 可安全导入的设置补丁适配器、lookup-note 辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表/配置/action-gate 辅助工具 |
  | `plugin-sdk/account-id` | account-id 辅助工具 | `DEFAULT_ACCOUNT_ID`、account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助工具 | 账户列表/account-action 辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入中 wiring | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema builders | 共享渠道配置 schema 原语以及通用 builder |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置 schema | 仅用于内置兼容；新插件必须定义插件本地 schema |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名规范化、描述裁剪、重复/冲突校验 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户 Status 和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览最终化辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助工具 | 共享路由 + envelope builder 辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享 record-and-dispatch 辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 无需导入完整出站运行时的轻量 `resolveOutboundSendDep` 查找 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站交付、identity/send delegate、会话、格式化和负载规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体负载辅助工具 | 面向旧字段布局的智能体媒体负载 builder |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容 shim | 仅旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助工具 | logger/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/hooks/http/交互辅助工具 |
  | `plugin-sdk/hook-runtime` | hook 管线辅助工具 | 共享 webhook/内部 hook 管线辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端和渠道 Status 补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 配置辅助工具 | 配置加载/写入辅助工具 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 契约接口不可用时，提供稳定 fallback 的 Telegram 命令校验辅助工具 |
  | `plugin-sdk/approval-runtime` | approval 提示辅助工具 | exec/插件 approval 负载、approval capability/profile 辅助工具、原生 approval 路由/运行时辅助工具，以及结构化 approval 显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | approval 认证辅助工具 | approver 解析、同聊天 action 认证 |
  | `plugin-sdk/approval-client-runtime` | approval 客户端辅助工具 | 原生 exec approval profile/filter 辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | approval 交付辅助工具 | 原生 approval capability/delivery 适配器 |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway 网关辅助工具 | 共享 approval Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval 适配器辅助工具 | 面向热渠道入口点的轻量原生 approval 适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | approval 处理器辅助工具 | 更宽范围的 approval 处理器运行时辅助工具；若较窄的 adapter/gateway 接口已足够，则优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | approval 目标辅助工具 | 原生 approval 目标/账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | approval 回复辅助工具 | exec/插件 approval 回复负载辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用的渠道运行时上下文 register/get/watch 辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、外部内容和 secret 收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机 allowlist 和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | pinned-dispatcher、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`, 错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装过的 fetch/代理辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`, 策略运行器 |
  | `plugin-sdk/allow-from` | Allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令 Status/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Secret 输入解析 | Secret 输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | webhook 请求辅助工具 | webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | webhook body 守卫辅助工具 | 请求体读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助工具 | 最终化、provider 分发和会话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/Markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + updated-at 辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道 Status 辅助工具 | 渠道/账户 Status 摘要 builders、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具负载提取 | 从工具结果对象中提取规范化负载 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统 logger 和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复负载类型 |
  | `plugin-sdk/provider-setup` | 精选的本地/自托管 provider 设置辅助工具 | 自托管 provider 发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管 provider 设置辅助工具 | 同样的自托管 provider 发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | provider 运行时认证辅助工具 | 运行时 API key 解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | provider API key 设置辅助工具 | API key 新手引导/profile 写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | provider 认证结果辅助工具 | 标准 OAuth 认证结果 builder |
  | `plugin-sdk/provider-auth-login` | provider 交互式登录辅助工具 | 共享交互式登录辅助工具 |
  | `plugin-sdk/provider-selection-runtime` | provider 选择辅助工具 | 已配置或自动 provider 选择，以及原始 provider 配置合并 |
  | `plugin-sdk/provider-env-vars` | provider 环境变量辅助工具 | provider 认证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享 provider 模型/重放辅助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享 replay-policy builders、provider 端点辅助工具以及 model-id 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享 provider 目录辅助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding 补丁 | onboarding 配置辅助工具 |
  | `plugin-sdk/provider-http` | provider HTTP 辅助工具 | 通用 provider HTTP/端点 capability 辅助工具，包括音频转录 multipart form 辅助工具 |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch 辅助工具 | web-fetch provider 注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search 配置辅助工具 | 面向不需要插件启用 wiring 的 provider 的窄范围 web-search 配置/凭证辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | provider web-search 契约辅助工具 | 窄范围 web-search 配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及作用域化凭证 setter/getter |
  | `plugin-sdk/provider-web-search` | provider web-search 辅助工具 | web-search provider 注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | provider 工具/schema 兼容辅助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及 xAI 兼容辅助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | provider 用量辅助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage` 以及其他 provider 用量辅助工具 |
  | `plugin-sdk/provider-stream` | provider 流包装辅助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | provider 传输辅助工具 | 原生 provider 传输辅助工具，例如受保护 fetch、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/转换/存储辅助工具以及媒体负载 builders |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 图像/视频/音乐生成的共享 failover 辅助工具、候选选择和缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解 provider 类型，以及面向 provider 的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助工具 | assistant 可见文本剥离、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive-tag 辅助工具、安全文本工具以及相关文本/日志辅助工具 |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音 provider 类型，以及面向 provider 的 directive、注册表和校验辅助工具 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音 provider 类型、注册表、directive、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | provider 类型、注册表辅助工具和共享 WebSocket 会话辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | provider 类型、注册表/解析辅助工具和桥接会话辅助工具 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、failover、认证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成 provider/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、failover 辅助工具、provider 查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成 provider/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、failover 辅助工具、provider 查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复负载规范化/归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄范围渠道 config-schema 原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导层 | 共享渠道插件前导层导出 |
  | `plugin-sdk/channel-status` | 渠道 Status 辅助工具 | 共享渠道 Status 快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | Allowlist 配置辅助工具 | Allowlist 配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm` | 直接私信辅助工具 | 共享直接私信认证/守卫辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道/Status 和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | webhook 目标辅助工具 | webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | webhook 路径辅助工具 | webhook 路径规范化辅助工具 |
  | `plugin-sdk/web-media` | 共享 web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | Zod 重新导出 | 面向插件 SDK 使用方重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | Memory 管理器/配置/文件/CLI 辅助接口 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 引擎运行时门面 | Memory 索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 主机基础引擎 | Memory 主机基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 主机嵌入引擎 | Memory 嵌入契约、注册表访问、本地 provider 和通用批处理/远程辅助工具；具体远程 provider 位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory 主机 QMD 引擎 | Memory 主机 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory 主机存储引擎 | Memory 主机存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | Memory 主机多模态辅助工具 | Memory 主机多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | Memory 主机查询辅助工具 | Memory 主机查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | Memory 主机 secret 辅助工具 | Memory 主机 secret 辅助工具 |
  | `plugin-sdk/memory-core-host-events` | Memory 主机事件日志辅助工具 | Memory 主机事件日志辅助工具 |
  | `plugin-sdk/memory-core-host-status` | Memory 主机 Status 辅助工具 | Memory 主机 Status 辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory 主机 CLI 运行时 | Memory 主机 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory 主机核心运行时 | Memory 主机核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory 主机文件/运行时辅助工具 | Memory 主机文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | Memory 主机核心运行时别名 | 面向厂商中立的 Memory 主机核心运行时辅助工具别名 |
  | `plugin-sdk/memory-host-events` | Memory 主机事件日志别名 | 面向厂商中立的 Memory 主机事件日志辅助工具别名 |
  | `plugin-sdk/memory-host-files` | Memory 主机文件/运行时别名 | 面向厂商中立的 Memory 主机文件/运行时辅助工具别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 面向 memory 邻接插件的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 活跃 Memory 搜索门面 | 惰性活跃 Memory 搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | Memory 主机 Status 别名 | 面向厂商中立的 Memory 主机 Status 辅助工具别名 |
  | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助工具 | Memory-lancedb 辅助接口 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助工具和 mocks |
</Accordion>

此表刻意只包含常见迁移子集，而不是完整的 SDK
接口。完整的 200+ 个入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍包含一些内置插件辅助接口，例如
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些接口仍然会为内置插件维护和兼容性而导出，但它们被有意排除在常见迁移表之外，也不是新插件代码的推荐目标。

同样的规则也适用于其他内置辅助工具家族，例如：

- 浏览器支持辅助工具：`plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助/插件接口，例如 `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diagnostics-prometheus`、
  `plugin-sdk/diffs`、`plugin-sdk/llm-task`、`plugin-sdk/thread-ownership`、
  和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前公开的是窄范围 token 辅助接口：
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用与任务最匹配的最窄导入路径。如果找不到某个导出，请检查
`src/plugin-sdk/` 下的源码，或在 Discord 中提问。

## 当前弃用项

以下是适用于插件 SDK、provider 契约、运行时接口和 manifest 的更窄范围弃用项。它们目前仍然可用，但会在未来的某个主版本中移除。每一项下方的条目都将旧 API 映射到其规范替代方案。

<AccordionGroup>
  <Accordion title="command-auth 帮助 builders → command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：签名相同，导出相同——只是改为从更窄的子路径导入。`command-auth`
    会将它们作为兼容 stub 重新导出。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助工具 → resolveInboundMentionDecision">
    **旧版**：`resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`，来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——返回一个
    单一决策对象，而不是拆分成两个调用。

    下游渠道插件（Slack、Discord、Matrix、Microsoft Teams）都已完成切换。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道 actions 辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是一个面向旧版
    渠道插件的兼容 shim。新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 来注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助工具
    也已随着原始“actions”渠道导出一起弃用。请改为通过语义化的
    `presentation` 接口暴露 capability——渠道插件应声明它们渲染什么
    （卡片、按钮、选择器），而不是声明它们接受哪些原始 action 名称。

  </Accordion>

  <Accordion title="Web search provider tool() 辅助工具 → 插件上的 createTool()">
    **旧版**：`openclaw/plugin-sdk/provider-web-search` 中的 `tool()`
    工厂。

    **新版**：直接在 provider 插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助工具来注册该工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道 envelope → BodyForAgent">
    **旧版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用于从入站渠道消息构建扁平的纯文本提示词
    envelope。

    **新版**：`BodyForAgent` 加上结构化 user-context 块。
    渠道插件会将路由元数据（线程、话题、reply-to、reactions）作为
    类型化字段附加，而不是将它们拼接进一个提示词字符串中。
    `formatAgentEnvelope(...)` 辅助工具仍然支持用于合成的
    面向 assistant 的 envelope，但入站纯文本 envelope 正在退出使用。

    受影响区域：`inbound_claim`、`message_received`，以及任何会对
    `channelEnvelope` 文本进行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="Provider discovery 类型 → provider 目录类型">
    四个 discovery 类型别名现在都只是目录时代类型的薄包装：

    | 旧别名 | 新类型 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder` | `ProviderCatalogOrder` |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult` |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog` |

    另外还有旧版的 `ProviderCapabilities` 静态包——provider 插件
    应通过 provider 运行时契约附加 capability facts，
    而不是通过静态对象。

  </Accordion>

  <Accordion title="Thinking 策略 hooks → resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上的三个独立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范的 `id`、可选的 `label` 以及
    排序后的级别列表。OpenClaw 会按配置档位自动降级过期的已存储值。

    现在实现一个 hook，而不是三个。旧版 hooks 在弃用窗口期间仍然可用，
    但不会与 profile 结果进行组合。

  </Accordion>

  <Accordion title="外部 OAuth provider fallback → contracts.externalAuthProviders">
    **旧版**：实现 `resolveExternalOAuthProfiles(...)`，但不在
    插件 manifest 中声明该 provider。

    **新版**：在插件 manifest 中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。旧的“auth
    fallback”路径会在运行时发出警告，并将在未来移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider 环境变量查找 → setup.providers[].envVars">
    **旧版** manifest 字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找信息镜像到 manifest
    中的 `setup.providers[].envVars`。这样可以将设置/Status 环境变量元数据集中在一个位置，
    并避免仅仅为了响应环境变量查找而启动插件运行时。

    `providerAuthEnvVars` 在弃用窗口关闭前仍通过兼容适配器继续受支持。

  </Accordion>

  <Accordion title="Memory 插件注册 → registerMemoryCapability">
    **旧版**：三个独立调用——
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：在 memory-state API 上只调用一次——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    插槽相同，但只需一次注册调用。增量式 Memory 辅助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    两个旧版类型别名仍从 `src/plugins/runtime/types.ts` 导出：

    | 旧版 | 新版 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，建议改用
    `getSessionMessages`。签名相同；旧方法会调用到新方法上。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧版**：`runtime.tasks.flow`（单数）返回一个实时的 task-flow 访问器。

    **新版**：`runtime.tasks.flows`（复数）返回基于 DTO 的 Task Flow 访问接口，
    它可安全导入，并且不需要加载完整的任务运行时。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → 智能体工具结果中间件">
    详见上文“如何迁移 → 将 Pi 工具结果扩展迁移到
    中间件”。此处列出仅为完整性：已移除的、仅适用于 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 路径，已被
    `api.registerAgentToolResultMiddleware(...)` 替代，并需要在
    `contracts.agentToolResultMiddleware` 中显式列出运行时
    列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在只是
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
扩展级弃用项（位于 `extensions/` 下内置渠道/provider 插件内部）
会在它们自己的 `api.ts` 和 `runtime-api.ts`
barrel 中跟踪。它们不影响第三方插件契约，因此未在此列出。
如果你直接使用某个内置插件的本地 barrel，请在升级前先阅读该
barrel 中的弃用注释。
</Note>

## 移除时间线

| 时间 | 会发生什么 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口会发出运行时警告 |
| **下一个主版本** | 已弃用接口将被移除；仍在使用它们的插件将会失效 |

所有核心插件都已完成迁移。外部插件应在下一个主版本之前完成迁移。

## 暂时抑制警告

在迁移期间，可设置以下环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是临时的应急出口，不是永久解决方案。

## 相关内容

- [Getting Started](/zh-CN/plugins/building-plugins) —— 构建你的第一个插件
- [SDK Overview](/zh-CN/plugins/sdk-overview) —— 完整子路径导入参考
- [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) —— 构建渠道插件
- [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) —— 构建 provider 插件
- [Plugin Internals](/zh-CN/plugins/architecture) —— 架构深入解析
- [Plugin Manifest](/zh-CN/plugins/manifest) —— manifest schema 参考
