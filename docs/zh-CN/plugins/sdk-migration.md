---
read_when:
    - 你看到了 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到了 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你正在将插件更新到现代插件架构
    - 你在维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-04-06T04:10:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94f12d1376edd8184714cc4dbea4a88fa8ed652f65e9365ede6176f3bf441b33
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# 插件 SDK 迁移

OpenClaw 已从宽泛的向后兼容层迁移到现代插件架构，采用聚焦且有文档说明的导入方式。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 正在发生什么变化

旧版插件系统提供了两个高度开放的接口，使插件能够从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 一个单一导入入口，会重新导出数十个辅助工具。它的引入是为了在新插件架构构建期间，让较旧的基于 hook 的插件继续工作。
- **`openclaw/extension-api`** — 一个桥接层，让插件可以直接访问宿主端辅助工具，例如嵌入式智能体运行器。

这两个接口现在都已被**弃用**。它们在运行时仍然可用，但新插件不得再使用它们，现有插件也应在下一个主版本移除它们之前完成迁移。

<Warning>
  向后兼容层将在未来的一个主版本中移除。
  仍然从这些接口导入的插件届时将会中断。
</Warning>

## 为什么会有这个变化

旧方法会带来一些问题：

- **启动缓慢** — 导入一个辅助工具会加载数十个无关模块
- **循环依赖** — 宽泛的重新导出很容易造成导入环
- **API 接口不清晰** — 无法区分哪些导出是稳定的，哪些是内部实现

现代插件 SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/\<subpath\>`）都是一个小型、自包含的模块，具有清晰的用途和有文档说明的契约。

用于内置渠道的旧版提供商便捷接口也已移除。像 `openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、带有渠道品牌的辅助接口以及 `openclaw/plugin-sdk/telegram-core` 这样的导入，都是私有 mono-repo 快捷方式，而不是稳定的插件契约。请改用更窄、更通用的 SDK 子路径。在内置插件工作区中，请将提供商自有的辅助工具保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中。

当前内置提供商示例：

- Anthropic 将 Claude 专用的流式辅助工具保留在自己的 `api.ts` / `contract-api.ts` 接口中
- OpenAI 将提供商构建器、默认模型辅助工具以及 realtime 提供商构建器保留在自己的 `api.ts` 中
- OpenRouter 将提供商构建器以及新手引导 / 配置辅助工具保留在自己的 `api.ts` 中

## 如何迁移

<Steps>
  <Step title="审查 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，现在未解析的 Windows
    `.cmd`/`.bat` 包装器会默认以失败关闭，除非你显式传入
    `allowShellFallback: true`。

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
    在你的插件中搜索来自这两个已弃用接口的导入：

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

    对于宿主端辅助工具，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助工具同样适用这一模式：

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
  | `plugin-sdk/core` | 用于渠道入口定义 / 构建器的旧版总括式重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单一提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享的设置向导辅助工具 | allowlist 提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助工具 | 可安全导入的设置补丁适配器、lookup-note 辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表 / 配置 / 操作门控辅助工具 |
  | `plugin-sdk/account-id` | account-id 辅助工具 | `DEFAULT_ACCOUNT_ID`，account-id 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助工具 | 账户列表 / 账户操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入中状态联动 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 schema 构建器 | 渠道配置 schema 类型 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名规范化、描述裁剪、重复 / 冲突校验 |
  | `plugin-sdk/channel-policy` | 群组 / 私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态跟踪 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 入站 envelope 辅助工具 | 共享路由 + envelope 构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享的记录并分发辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析 / 匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享的出站媒体加载 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站身份 / 发送委托辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体负载辅助工具 | 用于旧版字段布局的智能体媒体负载构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性 shim | 仅限旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛的运行时辅助工具 | 运行时 / 日志 / 备份 / 插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助工具 | logger / runtime env、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令 / hooks / http / 交互辅助工具 |
  | `plugin-sdk/hook-runtime` | Hook 管道辅助工具 | 共享 webhook / 内部 hook 管道辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端和渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 配置辅助工具 | 配置加载 / 写入辅助工具 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当内置 Telegram 契约接口不可用时，提供具备稳定回退的 Telegram 命令校验辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | exec / 插件审批负载、审批能力 / 配置文件辅助工具、本地审批路由 / 运行时辅助工具 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助工具 | 审批人解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 exec 审批配置文件 / 过滤辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力 / 投递适配器 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标 / 账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | exec / 插件审批回复负载辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机 allowlist 和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | pinned-dispatcher、受保护 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装后的 fetch / 代理辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | allowlist 格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助工具 | `resolveControlCommandGate`、发送方授权辅助工具、命令注册表辅助工具 |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | webhook 请求辅助工具 | webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | webhook 请求体守卫辅助工具 | 请求体读取 / 限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助工具 | finalize + provider 分发辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本 / markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + updated-at 辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由 / session-key 辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、session-key 规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道 / 账户状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | slug / 字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带标准化 stdout / stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具 / CLI 参数读取器 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统 logger 和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复负载类型 |
  | `plugin-sdk/provider-setup` | 精选的本地 / 自托管提供商设置辅助工具 | 自托管提供商发现 / 配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 兼容自托管提供商设置辅助工具 | 同样的自托管提供商发现 / 配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助工具 | 运行时 API key 解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API key 设置辅助工具 | API key 新手引导 / 配置文件写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | 提供商 auth-result 辅助工具 | 标准 OAuth auth-result 构建器 |
  | `plugin-sdk/provider-auth-login` | 提供商交互式登录辅助工具 | 共享交互式登录辅助工具 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助工具 | 提供商认证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享提供商 model / replay 辅助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 辅助工具以及 model-id 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助工具 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助工具 | 通用提供商 HTTP / endpoint 能力辅助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助工具 | web-fetch 提供商注册 / 缓存辅助工具 |
  | `plugin-sdk/provider-web-search` | 提供商 web-search 辅助工具 | web-search 提供商注册 / 缓存 / 配置辅助工具 |
  | `plugin-sdk/provider-tools` | 提供商工具 / schema 兼容辅助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及 xAI 兼容辅助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供商用量辅助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 以及其他提供商用量辅助工具 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic / Bedrock / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装辅助工具 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取 / 转换 / 存储辅助工具以及媒体负载构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享 media-generation 辅助工具 | 图像 / 视频 / 音乐生成的共享故障切换辅助工具、候选项选择和缺失模型提示 |
  | `plugin-sdk/media-understanding` | media-understanding 辅助工具 | media understanding 提供商类型以及面向提供商的图像 / 音频辅助导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助工具 | 对智能体可见文本的剥离、markdown 渲染 / 分块 / 表格辅助工具、脱敏辅助工具、directive-tag 辅助工具、安全文本工具以及相关文本 / 日志辅助工具 |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音提供商类型以及面向提供商的 directive、注册表和校验辅助工具 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转写辅助工具 | 提供商类型和注册表辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | 提供商类型和注册表辅助工具 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障切换、认证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成 provider / request / result 类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障切换辅助工具、provider 查找和 model-ref 解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成 provider / request / result 类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障切换辅助工具、provider 查找和 model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复负载规范化 / 归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 窄范围渠道 config-schema 原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导模块 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助工具 | 共享渠道状态快照 / 摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | allowlist 配置辅助工具 | allowlist 配置编辑 / 读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm` | 直接私信辅助工具 | 共享直接私信认证 / 守卫辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道 / 状态辅助原语 |
  | `plugin-sdk/webhook-targets` | webhook 目标辅助工具 | webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | webhook 路径辅助工具 | webhook 路径规范化辅助工具 |
  | `plugin-sdk/web-media` | 共享 web 媒体辅助工具 | 远程 / 本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | Zod 重新导出 | 为插件 SDK 使用方重新导出的 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | memory manager / config / file / CLI 辅助接口 |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine 运行时门面 | memory index / search 运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine 导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory host embedding engine 导出 |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | memory host QMD engine 导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | memory host storage engine 导出 |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal 辅助工具 | memory host multimodal 辅助工具 |
  | `plugin-sdk/memory-core-host-query` | memory host query 辅助工具 | memory host query 辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | memory host secret 辅助工具 | memory host secret 辅助工具 |
  | `plugin-sdk/memory-core-host-events` | memory host 事件日志辅助工具 | memory host 事件日志辅助工具 |
  | `plugin-sdk/memory-core-host-status` | memory host 状态辅助工具 | memory host 状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI 运行时 | memory host CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host 核心运行时 | memory host 核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host 文件 / 运行时辅助工具 | memory host 文件 / 运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | memory host 核心运行时别名 | 面向厂商中立的 memory host 核心运行时辅助工具别名 |
  | `plugin-sdk/memory-host-events` | memory host 事件日志别名 | 面向厂商中立的 memory host 事件日志辅助工具别名 |
  | `plugin-sdk/memory-host-files` | memory host 文件 / 运行时别名 | 面向厂商中立的 memory host 文件 / 运行时辅助工具别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 markdown 辅助工具 | 面向 memory 邻接插件的共享托管 markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 活跃 memory 搜索门面 | 惰性 active-memory search-manager 运行时门面 |
  | `plugin-sdk/memory-host-status` | memory host 状态别名 | 面向厂商中立的 memory host 状态辅助工具别名 |
  | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助工具 | memory-lancedb 辅助接口 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助工具和 mocks |
</Accordion>

此表有意只包含常见迁移子集，而非完整的 SDK 接口。完整的 200+ 入口点列表位于
`scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍然包含一些内置插件辅助接口，例如
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些接口仍然会导出，以便支持内置插件维护和兼容性，但它们被有意排除在常见迁移表之外，也不是新插件代码的推荐目标。

同样的规则也适用于其他内置辅助工具家族，例如：

- 浏览器支持辅助工具：`plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 内置辅助 / 插件接口，例如 `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` 和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 当前公开的窄范围 token 辅助接口为
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

请使用与任务最匹配的最窄导入路径。如果你找不到某个导出，请查看 `src/plugin-sdk/` 中的源代码，或在 Discord 中提问。

## 移除时间线

| 时间 | 会发生什么 |
| ---------------------- | ----------------------------------------------------------------------- |
| **现在** | 已弃用接口会发出运行时警告 |
| **下一个主版本** | 已弃用接口将被移除；仍在使用它们的插件将会失败 |

所有核心插件都已经完成迁移。外部插件应在下一个主版本之前完成迁移。

## 临时抑制警告

在迁移期间，你可以设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是一个临时逃生口，不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) — 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) — 架构深入解析
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema 参考
