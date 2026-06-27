---
read_when:
    - 为插件导入选择正确的 plugin-sdk 子路径
    - 审计内置插件子路径和辅助接口面
summary: 插件 SDK 子路径目录：按领域分组说明哪些导入位于何处
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-06-27T02:57:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

插件 SDK 以一组 `openclaw/plugin-sdk/` 下的窄公共子路径公开。本页按用途分组列出常用子路径。生成的编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出是在减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径之后的公共子集。维护者可以用 `pnpm plugin-sdk:surface` 审计公共导出数量，并用 `pnpm plugins:boundary-report:summary` 审计活跃的预留辅助子路径；未使用的预留辅助导出会使 CI 报告失败，而不是作为休眠的兼容性债务留在公共 SDK 中。

插件编写指南见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 插件入口点

| 子路径                        | 关键导出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 迁移提供商条目辅助工具，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助工具和 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 运行时迁移辅助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                              |
| `plugin-sdk/health`            | 供内置健康消费者使用的 Doctor 健康检查注册、检测、修复、选择、严重级别和发现类型                                               |

### 已弃用的兼容性和测试辅助工具

已弃用的子路径会继续为旧插件导出，但新代码应使用下面聚焦的 SDK 子路径。维护的列表位于 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 会拒绝内置生产代码从其中导入。`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod` 等宽泛桶导出仅用于兼容性。请直接从 `zod` 导入 `zod`。

OpenClaw 的 Vitest 支持的测试辅助子路径仅限仓库本地使用，不再作为包导出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。

### 预留的内置插件辅助子路径

这些子路径是其所属内置插件拥有的兼容性表面，不是通用 SDK API：`plugin-sdk/codex-mcp-projection` 和 `plugin-sdk/codex-native-task-runtime`。跨所有者的扩展导入会被包契约护栏阻止。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | 用于插件自有 schema 的缓存 JSON Schema 验证辅助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、设置翻译器、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容性别名；使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控辅助工具、默认账号回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 窄范围账号列表/账号操作辅助工具 |
    | `plugin-sdk/access-groups` | 访问组允许列表解析和已脱敏组诊断辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享频道配置 schema 原语，以及 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅用于维护中的内置插件的内置 OpenClaw 频道配置 schema |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`。规范内置/官方聊天频道 ID，以及供插件识别带信封前缀文本而无需硬编码自身表的格式化器标签/别名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 内置频道配置 schema 的已弃用兼容性别名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证辅助工具，带内置契约回退 |
    | `plugin-sdk/command-gating` | 窄范围命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已弃用的低层频道入口兼容性门面。新的接收路径应使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 实验性高层频道入口运行时解析器和路由事实构建器，用于已迁移的频道接收路径。优先使用它，而不是在每个插件中组装有效允许列表、命令允许列表和旧版投影。请参阅 [频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 消息生命周期契约，以及回复流水线选项、回执、实时预览/流式传输、生命周期辅助工具、出站身份、载荷规划、持久发送和消息发送上下文辅助工具。请参阅 [频道出站 API](/zh-CN/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已弃用兼容性别名，以及旧版回复分发门面。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已弃用兼容性别名，以及旧版回复分发门面。 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 信封构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已弃用的兼容性门面。入站运行器和分发谓词使用 `plugin-sdk/channel-inbound`，消息投递辅助工具使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已弃用的目标解析别名；使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载和托管媒体状态辅助工具 |
    | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 窄范围投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享频道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 窄范围频道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 频道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享频道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享组访问决策辅助工具 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 窄范围直接私信预加密守卫策略辅助工具 |
    | `plugin-sdk/discord` | 已弃用的 Discord 兼容性门面，用于已发布的 `@openclaw/discord@2026.3.13` 和被跟踪的所有者兼容性；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 已弃用的 Telegram 账号解析兼容性门面，用于被跟踪的所有者兼容性；新插件应使用注入的运行时辅助工具或通用渠道 SDK 子路径 |
    | `plugin-sdk/zalouser` | 已弃用的 Zalo Personal 兼容性门面，用于仍导入发送者命令授权的已发布 Lark/Zalo 包；新插件应使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、投递和旧版交互式回复辅助工具。请参阅 [消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于事件分类、上下文构建、格式化、根、去抖、提及匹配、提及策略和入站日志的共享入站辅助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 窄范围入站去抖辅助工具 |
    | `plugin-sdk/channel-mention-gating` | 不包含更广泛入站运行时表面的窄范围提及策略、提及标记和提及文本辅助工具 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面。使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 频道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/紧凑路由键、已解析目标类型，以及路由/目标比较辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析辅助工具；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 频道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄范围密钥契约辅助工具，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及密钥目标类型 |
  </Accordion>

已弃用的渠道辅助函数系列仅为已发布插件的兼容性保留。移除计划是：在外部插件迁移窗口期间保留它们，让仓库/内置插件继续使用 `channel-inbound` 和 `channel-outbound`，然后在下一次重大 SDK 清理中移除这些兼容性子路径。这适用于旧的渠道消息/运行时、渠道流式传输、直接私信访问、入口辅助函数分支、回复选项，以及配对路径系列。

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支持的 LM Studio 提供商 facade，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 支持的 LM Studio 运行时 facade，用于本地服务器默认值、模型发现、请求标头和已加载模型辅助工具 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助工具 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助工具 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供商 OAuth 回调类型、回调页面渲染、PKCE/state 辅助工具、授权输入解析、令牌过期辅助工具和中止辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/配置文件写入辅助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 认证导入辅助工具、已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助工具和共享模型 ID 规范化辅助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用于受保护的 `/models` 风格发现的实时提供商模型目录辅助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 过滤、TTL 缓存和静态回退 |
    | `plugin-sdk/provider-catalog-runtime` | 提供商目录增强运行时钩子，以及用于契约测试的插件-提供商注册表接缝 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助工具、提供商 HTTP 错误，以及音频转录 multipart 表单辅助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狭窄的 Web fetch 配置/选择契约辅助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web fetch 提供商注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用连接的提供商的狭窄 Web 搜索配置/凭据辅助工具 |
    | `plugin-sdk/provider-web-search-contract` | 狭窄的 Web 搜索配置/凭据契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及有作用域的凭据 setter/getter |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/运行时辅助工具 |
    | `plugin-sdk/embedding-providers` | 通用 embedding 提供商类型和读取辅助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；插件通过 `api.registerEmbeddingProvider(...)` 注册提供商，以强制执行清单所有权 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI schema 清理 + 诊断 |
    | `plugin-sdk/provider-usage` | 提供商用量快照类型、共享用量获取辅助工具，以及 `fetchClaudeUsage` 等提供商 fetcher |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型、纯文本工具调用兼容性，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-stream-shared` | 公共共享提供商流包装器辅助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic/DeepSeek/OpenAI 兼容流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助工具，例如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助工具 |
    | `plugin-sdk/group-activation` | 狭窄的群组激活模式和命令解析辅助工具 |
  </Accordion>

提供商用量快照通常会报告一个或多个配额 `windows`，每个都包含
标签、已用百分比和可选重置时间。对于公开余额或
账号状态文本而非可重置配额窗口的提供商，应返回
带空 `windows` 数组的 `summary`，而不是编造百分比。
OpenClaw 会在状态输出中显示该摘要文本；只有当
用量端点失败或没有返回可用的用量数据时，才使用 `error`。

  <Accordion title="认证和安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助工具，包括动态参数菜单格式化、发送者授权辅助工具 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同一聊天 action-auth 辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 面向热频道入口点的轻量原生审批适配器加载辅助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更宽泛的审批处理程序运行时辅助工具；当更窄的适配器/Gateway 网关接缝足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标、账号绑定、路由门控、转发回退，以及本地原生 exec 提示抑制辅助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬编码审批 reaction 绑定、reaction 提示载荷、reaction 目标存储，以及本地原生 exec 提示抑制的兼容性导出 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复载荷辅助工具 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批载荷辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示辅助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狭窄的入站回复去重重置辅助工具 |
    | `plugin-sdk/channel-contract-testing` | 不包含宽泛测试 barrel 的狭窄频道契约测试辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化，以及原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-primitives-runtime` | 面向热频道路径的轻量命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令表面辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向频道/插件 secret 表面的狭窄 secret 契约收集辅助工具 |
    | `plugin-sdk/secret-ref-runtime` | 面向 secret 契约/配置解析的狭窄 `coerceSecretRef` 和 SecretRef 类型辅助工具 |
    | `plugin-sdk/secret-provider-integration` | 面向发布外部 secret 提供商 preset 的插件的仅类型 SecretRef 提供商集成清单和 preset 契约 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、根边界文件/路径辅助工具，包括仅创建写入、同步/异步原子文件替换、同级临时写入、跨设备移动回退、私有文件存储辅助工具、符号链接父级保护、外部内容、敏感文本脱敏、常量时间 secret 比较，以及 secret 收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不包含宽泛 infra 运行时表面的狭窄 pinned-dispatcher 辅助工具 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、受 SSRF 保护的 fetch、SSRF 错误和 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | Secret 输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具和原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求 body 大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时/日志/备份/插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、logger、timeout、retry 和 backoff 辅助函数 |
    | `plugin-sdk/browser-config` | 受支持的浏览器配置门面，用于规范化 profile/defaults、CDP URL 解析和浏览器控制认证辅助函数 |
    | `plugin-sdk/agent-harness-task-runtime` | 使用主机签发任务作用域的 harness 支持智能体的通用任务生命周期和完成投递辅助函数 |
    | `plugin-sdk/codex-mcp-projection` | 预留的内置 Codex 辅助函数，用于将用户 MCP 服务器配置投射到 Codex thread 配置；不适用于第三方插件 |
    | `plugin-sdk/codex-native-task-runtime` | 私有的内置 Codex 辅助函数，用于原生任务镜像/运行时接线；不适用于第三方插件 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/matrix` | 已弃用的 Matrix 兼容门面，用于较旧的第三方渠道包；新插件应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已弃用的 Mattermost 兼容门面，用于较旧的第三方渠道包；新插件应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件 command/hook/http/interactive 辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部钩子流水线辅助函数 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入/绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 Exec 辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和延迟命令组辅助函数 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共享实时传输 QA 场景 id、基线覆盖率辅助函数和场景选择辅助函数 |
    | `plugin-sdk/gateway-method-runtime` | 为声明 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP 路由预留的 Gateway 网关方法调度辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、事件循环就绪客户端启动辅助函数、Gateway 网关 CLI RPC、Gateway 网关协议错误和渠道状态补丁辅助函数 |
    | `plugin-sdk/config-contracts` | 聚焦的仅类型配置表面，用于插件配置形状，例如 `OpenClawConfig` 和渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助函数，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助函数，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共享消息工具投递元数据提示字符串 |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化和重复/冲突检查，即使内置 Telegram contract 表面不可用也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖宽泛文本 barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-reaction-runtime` | 硬编码审批 reaction 绑定、reaction prompt 载荷、reaction 目标存储，以及用于本地原生 Exec prompt 抑制的兼容导出 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批辅助函数、审批能力构建器、认证/profile 辅助函数、原生路由/运行时辅助函数，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助函数、分块、调度、Heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复调度/finalize 和对话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助函数。新的消息轮次代码应使用 `createChannelHistoryWindow`；较低层级的 map 辅助函数仍仅作为已弃用的兼容导出保留 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本/Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话工作流辅助函数（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、按会话身份读取有界的最近用户/助手转录文本、旧版会话存储路径/会话键辅助函数、updated-at 读取，以及仅用于过渡的整个存储/文件路径兼容辅助函数 |
    | `plugin-sdk/session-transcript-runtime` | 转录身份、作用域目标/读取/写入辅助函数、更新发布、写锁和转录记忆命中键 |
    | `plugin-sdk/sqlite-runtime` | 聚焦的一方运行时 SQLite 智能体 schema、路径和事务辅助函数 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助函数 |
    | `plugin-sdk/state-paths` | State/OAuth 目录路径辅助函数 |
    | `plugin-sdk/plugin-state-runtime` | 插件 sidecar SQLite 键控状态类型，以及插件自有数据库的集中连接 pragma 和 WAL 维护设置 |
    | `plugin-sdk/routing` | 路由/会话键/账号绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账号状态摘要辅助函数、运行时状态默认值和 issue 元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时的命令运行器，返回规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-plugin` | 定义一个简单的类型化智能体工具插件，并公开用于生成插件清单的静态元数据 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化载荷 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/sandbox` | 沙箱后端类型和 SSH/OpenShell 命令辅助函数，包括快速失败的 Exec 命令预检 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助函数和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型/会话覆盖辅助函数，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读取/写入辅助函数 |
    | `plugin-sdk/json-unsafe-integers` | 将不安全整数字面量保留为字符串的 JSON 解析辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复调度辅助函数 |
    | `plugin-sdk/acp-runtime-backend` | 用于启动时加载插件的轻量 ACP 后端注册和回复调度辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不导入生命周期启动逻辑的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的智能体运行时配置 schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向低层级智能体 harness 的实验性受信插件表面：harness 类型、active-run steer/abort 辅助函数、OpenClaw 工具桥接辅助函数、runtime-plan 工具策略辅助函数、终端结果分类、工具进度格式化/详情辅助函数，以及 attempt 结果工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI 提供商自有端点检测门面；请使用 Z.AI 插件公共 API |
    | `plugin-sdk/async-lock-runtime` | 用于小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存内去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待投递队列排空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 唤醒、事件和可见性辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/exec-approvals-runtime` | 不依赖宽泛 infra-runtime barrel 的 Exec 审批策略文件辅助函数 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容 shim；请使用上方聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和 trace-context 辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装后的 fetch、代理、EnvHttpProxyAgent 选项和固定 lookup 辅助函数 |
    | `plugin-sdk/runtime-fetch` | 不导入代理/guarded-fetch 的 dispatcher 感知运行时 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 不依赖宽泛媒体运行时表面的内联图片 data URL 清理器和签名嗅探辅助函数 |
    | `plugin-sdk/response-limit-runtime` | 不依赖宽泛媒体运行时表面的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 不包含已配置绑定路由或配对存储的当前对话绑定状态 |
    | `plugin-sdk/session-store-runtime` | 不导入宽泛配置写入/维护逻辑的会话存储辅助函数 |
    | `plugin-sdk/sqlite-runtime` | 不包含数据库生命周期控制的聚焦 SQLite 智能体 schema、路径和事务辅助函数 |
    | `plugin-sdk/context-visibility-runtime` | 不导入宽泛配置/安全逻辑的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不导入 Markdown/日志逻辑的精简原始记录/字符串强制转换和规范化辅助函数 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助函数，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容导出 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助函数，包括 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 和已弃用的 `fetchRemoteMedia`；当 URL 应转换为 OpenClaw 媒体时，优先使用存储辅助函数，再读取缓冲区 |
    | `plugin-sdk/media-mime` | 窄范围 MIME 规范化、文件扩展名映射、MIME 检测和媒体类型辅助函数 |
    | `plugin-sdk/media-store` | 窄范围媒体存储辅助函数，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助函数、候选项选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频/结构化提取辅助导出 |
    | `plugin-sdk/text-chunking` | 文本和 Markdown 分块/渲染辅助函数、Markdown 表格转换、指令标签剥离和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助函数 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、验证、兼容 OpenAI 的 TTS 构建器和语音辅助导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化和语音辅助导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
    | `plugin-sdk/realtime-bootstrap-context` | 用于有界 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 上下文注入的实时配置文件引导辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型、注册表辅助函数和共享实时语音行为辅助函数，包括输出活动跟踪 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资产/data URL 辅助函数和兼容 OpenAI 的图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、鉴权和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
    | `plugin-sdk/transcripts` | 共享转录来源提供商类型、注册表辅助函数、会话描述符和话语元数据 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | 已弃用的兼容性别名；使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 已弃用的兼容性重新导出；直接从 `zod` 导入 `zod` |
    | `plugin-sdk/testing` | 用于旧版 OpenClaw 测试的仓库本地已弃用兼容性聚合导出。新的仓库测试应改为导入聚焦的本地测试子路径，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 仓库本地最小 `createTestPluginApi` 辅助函数，用于不导入仓库测试辅助桥接的直接插件注册单元测试 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地原生 Agent 运行时适配器契约夹具，用于鉴权、投递、故障转移、工具钩子、提示词叠加、schema 和转录投影测试 |
    | `plugin-sdk/channel-test-helpers` | 仓库本地面向频道的测试辅助函数，用于通用动作/设置/状态契约、目录断言、账号启动生命周期、发送配置线程传递、运行时模拟、状态问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 仓库本地共享目标解析错误用例套件，用于频道测试 |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地插件包、注册、公共工件、直接导入、运行时 API 和导入副作用契约辅助函数 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地提供商运行时、鉴权、设备发现、新手引导、目录、向导、媒体能力、重放策略、实时 STT 实时音频、Web 搜索/获取和流契约辅助函数 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地可选启用的 Vitest HTTP/鉴权模拟，用于测试 `plugin-sdk/provider-http` 的提供商测试 |
    | `plugin-sdk/test-fixtures` | 仓库本地通用 CLI 运行时捕获、沙箱上下文、技能写入器、智能体消息、系统事件、模块重载、内置插件路径、终端文本、分块、鉴权令牌和类型化用例夹具 |
    | `plugin-sdk/test-node-mocks` | 仓库本地聚焦的 Node 内置模拟辅助函数，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助表面，用于管理器/配置/文件/CLI 辅助函数 |
    | `plugin-sdk/memory-core-engine-runtime` | 记忆索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 轻量级记忆嵌入提供商注册表辅助函数 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入契约、注册表访问、本地提供商和通用批处理/远程辅助函数。此表面上的 `registerMemoryEmbeddingProvider` 已弃用；新提供商请使用通用嵌入提供商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助函数 |
    | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助函数 |
    | `plugin-sdk/memory-core-host-secret` | 记忆宿主密钥辅助函数 |
    | `plugin-sdk/memory-core-host-events` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 记忆宿主事件日志辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 用于记忆相邻插件的共享受管 Markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于访问搜索管理器的主动记忆运行时门面 |
    | `plugin-sdk/memory-host-status` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的内置辅助子路径">
    保留的内置辅助 SDK 子路径是面向内置插件代码的窄范围所有者专属表面。它们会在 SDK 清单中跟踪，以便包构建和别名保持确定性，但它们不是通用插件编写 API。新的可复用宿主契约应使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

    | 子路径 | 所有者和用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 内置 Codex 插件辅助函数，用于将用户 MCP 服务器配置投影到 Codex app-server 线程配置中 |
    | `plugin-sdk/codex-native-task-runtime` | 内置 Codex 插件辅助函数，用于将 Codex app-server 原生子智能体镜像到 OpenClaw 任务状态中 |

  </Accordion>
</AccordionGroup>

## 相关

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
