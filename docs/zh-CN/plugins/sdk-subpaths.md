---
read_when:
    - 为插件导入选择正确的 plugin-sdk 子路径
    - 审计内置插件子路径和辅助接口
summary: 插件 SDK 子路径目录：哪些导入位于何处，并按领域分组
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-07-05T11:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feb618466479488b576a6942ad4a21061a20e57870a2151b1cdcb868db9b80bb
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

插件 SDK 以一组位于 `openclaw/plugin-sdk/` 下的窄公共子路径形式暴露。本页按用途分组列出常用子路径。三个文件定义该表面：

- `scripts/lib/plugin-sdk-entrypoints.json`：构建会编译的维护版入口点清单。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：仓库本地测试/内部子路径。包导出是清单减去此列表。
- `src/plugin-sdk/entrypoints.ts`：用于已弃用子路径、保留的内置辅助工具、受支持的内置 facade，以及插件自有公共表面的分类元数据。

维护者使用 `pnpm plugin-sdk:surface` 审计公共导出数量，并使用 `pnpm plugins:boundary-report:summary` 审计活跃的保留辅助子路径；未使用的保留辅助导出会让 CI 报告失败，而不是作为休眠的兼容性债务留在公共 SDK 中。

插件编写指南见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 插件入口

| 子路径                         | 关键导出                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 迁移提供商条目辅助工具，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助工具，以及 `summarizeMigrationItems`                                               |
| `plugin-sdk/migration-runtime` | 运行时迁移辅助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                    |
| `plugin-sdk/health`            | 面向内置健康消费者的 Doctor 健康检查注册、检测、修复、选择、严重性和发现类型                                                                                          |
| `plugin-sdk/config-schema`     | 已弃用。根 `openclaw.json` Zod schema（`OpenClawSchema`）；请改为定义插件本地 schema，并使用 `plugin-sdk/json-schema-runtime` 验证                                     |

### 已弃用的兼容性和测试辅助工具

已弃用的子路径会继续为旧插件导出，但新代码应使用下面的聚焦 SDK 子路径。维护列表为 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 会拒绝内置生产代码从其中导入。宽泛 barrel（例如 `plugin-sdk/compat`、`plugin-sdk/config-types`、`plugin-sdk/infra-runtime` 和 `plugin-sdk/text-runtime`）仅用于兼容性，`plugin-sdk/zod` 是兼容性再导出：请直接从 `zod` 导入 `zod`。宽泛领域 barrel `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 和 `plugin-sdk/security-runtime` 也同样已弃用，请改用聚焦子路径。

OpenClaw 基于 Vitest 的测试辅助子路径仅限仓库本地使用，不再作为包导出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。私有内置辅助表面 `ssrf-runtime-internal` 和 `codex-native-task-runtime` 也仅限仓库本地使用。

### 保留的内置插件辅助子路径

`plugin-sdk/codex-mcp-projection` 是唯一保留子路径：它是内置 Codex 插件的插件自有兼容性表面，不是通用 SDK API。跨所有者插件导入会被包契约护栏阻止，并且当某个保留子路径停止被导入时，CI 会失败。`plugin-sdk/codex-native-task-runtime` 仅限仓库本地使用，不是包导出。

`src/plugin-sdk/entrypoints.ts` 还跟踪受支持的内置 facade，即由其内置插件支撑的 SDK 入口点，直到通用契约替代它们：`plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、`plugin-sdk/matrix`、`plugin-sdk/mattermost`、`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、`plugin-sdk/tts-runtime` 和 `plugin-sdk/zalouser`。其中几个也不建议在新代码中使用；请参阅下面每行的说明。

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路径 | 主要导出项 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | 用于插件自有 schema 的缓存 JSON Schema 验证辅助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享的设置向导辅助工具、设置转换器、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容性别名；请使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控辅助工具、默认账号回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 精简的账号列表/账号操作辅助工具 |
    | `plugin-sdk/access-groups` | 访问组允许列表解析和已脱敏组诊断辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享的渠道配置 schema 原语，以及 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅供维护中的内置插件使用的内置 OpenClaw 渠道配置 schema |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。规范的内置/官方聊天渠道 ID，以及供需要识别带信封前缀文本而无需硬编码自有表的插件使用的格式化标签/别名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 内置渠道配置 schema 的已弃用兼容性别名 |
    | `plugin-sdk/telegram-command-config` | 已弃用的 Telegram 命令名称/描述规范化以及重复/冲突检查；新的插件代码应使用插件本地的命令配置处理 |
    | `plugin-sdk/command-gating` | 精简的命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低层级渠道入口兼容性表面。新的接收路径应使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 实验性的高层级渠道入口运行时解析器和路由事实构建器，供已迁移的渠道接收路径使用。优先使用它，而不是在每个插件中组装有效允许列表、命令允许列表和旧版投影。参见 [频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 消息生命周期契约，以及回复流水线选项、回执、实时预览/流式传输、生命周期辅助工具、出站身份、载荷规划、持久发送和消息发送上下文辅助工具。参见 [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已弃用兼容性别名，外加旧版回复分发 facade。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已弃用兼容性别名，外加旧版回复分发 facade。 |
    | `plugin-sdk/inbound-envelope` | 共享的入站路由 + 信封构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已弃用的兼容性 facade。入站 runner 和分发谓词请使用 `plugin-sdk/channel-inbound`，消息投递辅助工具请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已弃用的目标解析别名；请使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共享的出站媒体加载和托管媒体状态辅助工具 |
    | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 精简的投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | Agent 媒体载荷根和加载器 |
    | `plugin-sdk/conversation-runtime` | 已弃用的会话/线程绑定、配对和已配置绑定辅助工具宽泛 barrel；优先使用聚焦的绑定子路径，例如 `plugin-sdk/thread-bindings-runtime` 和 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 运行时组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享的渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 精简的渠道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享的渠道插件 prelude 导出项 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 已弃用的组访问决策辅助工具；请使用来自 `plugin-sdk/channel-ingress-runtime` 的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 精简的直接私信加密前守卫策略辅助工具 |
    | `plugin-sdk/discord` | 面向已发布 `@openclaw/discord@2026.3.13` 和跟踪的所有者兼容性的已弃用 Discord 兼容性 facade；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 面向跟踪的所有者兼容性的已弃用 Telegram 账号解析兼容性 facade；新插件应使用注入的运行时辅助工具或通用渠道 SDK 子路径 |
    | `plugin-sdk/zalouser` | 面向仍导入发送者命令授权的已发布 Lark/Zalo 包的已弃用 Zalo Personal 兼容性 facade；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、投递和旧版交互式回复辅助工具。参见 [消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于事件分类、上下文构建、格式化、根、去抖、提及匹配、提及策略和入站日志的共享入站辅助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 精简的入站去抖辅助工具 |
    | `plugin-sdk/channel-mention-gating` | 精简的提及策略、提及标记和提及文本辅助工具，不包含更宽泛的入站运行时表面 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已弃用的兼容性 facade。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-route` | 共享的路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/紧凑路由键、已解析目标类型，以及路由/目标比较辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析辅助工具；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/表情回应接线 |
  </Accordion>

已弃用的渠道辅助工具族仅为已发布插件兼容性而继续可用。
移除计划是：在外部插件迁移窗口期间保留它们，让仓库/内置插件保持在 `channel-inbound` 和
`channel-outbound` 上，然后在下一次主要 SDK 清理中移除这些兼容性子路径。
这适用于旧的渠道消息/运行时、渠道流式传输、直接私信访问、入站辅助工具分支、回复选项，
以及配对路径系列。

  <Accordion title="Provider subpaths">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支持的 LM Studio 提供商 facade，用于设置、目录设备发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 支持的 LM Studio 运行时 facade，用于本地服务器默认值、模型设备发现、请求标头和已加载模型助手 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置助手 |
    | `plugin-sdk/self-hosted-provider-setup` | 已弃用的 OpenAI 兼容自托管设置助手；请使用 `plugin-sdk/provider-setup` 或插件自有的设置助手 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商凭证运行时助手：OAuth loopback 流程、令牌交换、凭证持久化和 API key 解析 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供商 OAuth 回调类型、回调页面渲染、PKCE/state 助手、授权输入解析、令牌过期助手和中止助手 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/配置文件写入助手，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth auth-result 构建器 |
    | `plugin-sdk/provider-env-vars` | 提供商凭证环境变量查找助手 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 凭证导入助手、已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 助手，以及共享 model-id 规范化助手 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用于受保护的 `/models` 风格设备发现的实时提供商模型目录助手：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、model-id 过滤、TTL 缓存和静态 fallback |
    | `plugin-sdk/provider-catalog-runtime` | 提供商目录增强运行时钩子，以及用于契约测试的插件提供商注册表 seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/endpoint 能力助手、提供商 HTTP 错误和音频转录 multipart form 助手 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄范围 web-fetch 配置/选择契约助手，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供商注册/缓存助手 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用接线的提供商的窄范围 web-search 配置/凭证助手 |
    | `plugin-sdk/provider-web-search-contract` | 窄范围 web-search 配置/凭证契约助手，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定作用域的凭证 setter/getter |
    | `plugin-sdk/provider-web-search` | Web-search 提供商注册/缓存/运行时助手 |
    | `plugin-sdk/embedding-providers` | 通用嵌入提供商类型和读取助手，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；插件通过 `api.registerEmbeddingProvider(...)` 注册提供商，因此会强制执行清单所有权 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI schema 清理 + 诊断 |
    | `plugin-sdk/provider-usage` | 提供商用量快照类型、共享用量获取助手，以及提供商 fetcher，例如 `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型、纯文本工具调用兼容性，以及共享 Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI 包装器助手 |
    | `plugin-sdk/provider-stream-shared` | 公共共享提供商流包装器助手，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic/DeepSeek/OpenAI 兼容流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输助手，例如受保护的 fetch、工具结果文本提取、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置 patch 助手 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 助手 |
    | `plugin-sdk/group-activation` | 窄范围群组激活模式和命令解析助手 |
  </Accordion>

提供商用量快照通常会报告一个或多个配额 `windows`，每个窗口包含
标签、已使用百分比和可选的重置时间。暴露余额或账户状态文本而不是
可重置配额窗口的提供商，应返回包含空 `windows` 数组的
`summary`，而不是虚构百分比。
OpenClaw 会在状态输出中显示该摘要文本；仅当
用量端点失败或未返回可用的用量数据时，才使用 `error`。

  <Accordion title="Auth and security subpaths">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已弃用的宽泛命令授权表面（`resolveControlCommandGate`、命令注册表助手，包括动态参数菜单格式化、发送者授权助手）；请使用渠道入口/运行时授权或命令状态助手 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天操作凭证助手 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器助手 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/交付适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析助手 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载助手 |
    | `plugin-sdk/approval-handler-runtime` | 更宽泛的审批处理器运行时助手；当更窄的适配器/Gateway 网关 seam 足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标、账户绑定、路由门控、转发 fallback，以及本地原生 exec 提示抑制助手 |
    | `plugin-sdk/approval-reaction-runtime` | 硬编码审批表情回应绑定、表情回应提示 payload、表情回应目标存储、表情回应提示文本助手，以及本地原生 exec 提示抑制的兼容性导出 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复 payload 助手 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批 payload 助手、审批能力构建器、审批凭证/配置文件助手、原生审批路由/运行时助手，以及结构化审批显示助手，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 已弃用的窄范围入站回复去重重置助手 |
    | `plugin-sdk/command-auth-native` | 原生命令凭证、动态参数菜单格式化，以及原生会话目标助手 |
    | `plugin-sdk/command-detection` | 共享命令检测助手 |
    | `plugin-sdk/command-primitives-runtime` | 用于热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面助手 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 用于私有渠道和 Web UI 设备码配对的延迟提供商凭证登录流程助手 |
    | `plugin-sdk/channel-secret-runtime` | 已弃用的宽泛密钥契约表面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、secret 目标类型）；请优先使用下面的聚焦子路径 |
    | `plugin-sdk/channel-secret-basic-runtime` | 面向非 TTS 渠道/插件密钥表面的窄范围密钥契约导出 |
    | `plugin-sdk/channel-secret-tts-runtime` | 窄范围嵌套渠道 TTS 密钥赋值助手 |
    | `plugin-sdk/secret-ref-runtime` | 用于密钥契约/配置解析的窄范围 `coerceSecretRef` 和 SecretRef 类型助手 |
    | `plugin-sdk/secret-provider-integration` | 面向发布外部密钥提供商 preset 的插件的仅类型 SecretRef 提供商集成清单和 preset 契约 |
    | `plugin-sdk/security-runtime` | 已弃用的宽泛 barrel，涵盖信任、私信门控、根目录边界文件/路径助手（包括仅创建写入）、同步/异步原子文件替换、同级临时写入、跨设备移动 fallback、私有文件存储助手、符号链接父级防护、外部内容、敏感文本脱敏、常量时间密钥比较和密钥收集助手；请优先使用聚焦的 security/SSRF/secret 子路径 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略助手 |
    | `plugin-sdk/ssrf-dispatcher` | 不包含宽泛 infra 运行时表面的窄范围 pinned-dispatcher 助手 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 保护的 fetch、SSRF 错误和 SSRF 策略助手 |
    | `plugin-sdk/secret-input` | 密钥输入解析助手 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标助手和原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时助手 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 运行时/日志/备份助手、插件安装路径警告和进程助手 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、logger、超时、重试和退避助手 |
    | `plugin-sdk/browser-config` | 支持的浏览器配置门面，用于规范化的 profile/defaults、CDP URL 解析和浏览器控制认证助手 |
    | `plugin-sdk/agent-harness-task-runtime` | 面向使用主机签发任务作用域的 harness-backed agent 的通用任务生命周期和完成投递助手 |
    | `plugin-sdk/codex-mcp-projection` | 预留的内置 Codex 助手，用于将用户 MCP server 配置投影到 Codex thread 配置；不供第三方插件使用 |
    | `plugin-sdk/codex-native-task-runtime` | 仓库本地内置 Codex 助手，用于原生任务镜像/运行时接线；不是 package 导出 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找助手 |
    | `plugin-sdk/matrix` | 已弃用的 Matrix 兼容门面，供较旧的第三方渠道包使用；新插件应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已弃用的 Mattermost 兼容门面，供较旧的第三方渠道包使用；新插件应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 已弃用的宽泛 barrel，用于插件 command/hook/http/interactive 助手；优先使用聚焦的插件运行时子路径 |
    | `plugin-sdk/hook-runtime` | 已弃用的宽泛 barrel，用于 webhook/内部 hook 管线助手；优先使用聚焦的 hook/插件运行时子路径 |
    | `plugin-sdk/lazy-runtime` | 懒运行时导入/绑定助手，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 助手 |
    | `plugin-sdk/cli-runtime` | 已弃用的宽泛 barrel，用于 CLI 格式化、等待、版本、参数调用和懒 command-group 助手；优先使用聚焦的 CLI/运行时子路径 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共享的 live transport QA 场景 ID、基线覆盖率助手和场景选择助手 |
    | `plugin-sdk/qa-runner-runtime` | 支持的门面，通过 CLI command surface 暴露插件 QA 场景 |
    | `plugin-sdk/tts-runtime` | 支持的门面，用于文本转语音配置 schema 和运行时助手 |
    | `plugin-sdk/gateway-method-runtime` | 预留的 Gateway 网关 method dispatch 助手，用于声明 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP routes |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、event-loop-ready 客户端启动助手、Gateway 网关 CLI RPC、Gateway 网关协议错误、公布的 LAN 主机解析和渠道状态 patch 助手 |
    | `plugin-sdk/config-contracts` | 聚焦的仅类型配置表面，用于插件配置形状，例如 `OpenClawConfig` 和 channel/provider config 类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找助手，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更助手，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共享的 message-tool 投递元数据提示字符串 |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照助手，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照 setter |
    | `plugin-sdk/text-autolink-runtime` | 不依赖宽泛 text barrel 的文件引用自动链接检测 |
    | `plugin-sdk/reply-runtime` | 共享的入站/reply 运行时助手、分块、dispatch、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的 reply dispatch/finalize 和 conversation-label 助手 |
    | `plugin-sdk/reply-history` | 共享的短窗口 reply-history 助手。新的 message-turn 代码应使用 `createChannelHistoryWindow`；较低层 map 助手仍仅作为已弃用的兼容导出保留 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的 text/markdown 分块助手 |
    | `plugin-sdk/session-store-runtime` | 会话工作流助手（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、按会话身份有界读取近期用户/assistant transcript 文本、旧版 session store path/session-key 助手、updated-at 读取，以及仅用于过渡的 whole-store/file-path 兼容助手，不包含宽泛的配置写入/维护导入 |
    | `plugin-sdk/session-transcript-runtime` | Transcript 身份、作用域化 target/read/write 助手、update 发布、写锁和 transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | 聚焦的 SQLite agent-schema、路径和事务助手，用于第一方运行时，不包含数据库生命周期控制 |
    | `plugin-sdk/cron-store-runtime` | Cron store path/load/save 助手 |
    | `plugin-sdk/state-paths` | State/OAuth dir path 助手 |
    | `plugin-sdk/plugin-state-runtime` | 插件 sidecar SQLite keyed-state 类型，以及插件自有数据库的集中式 connection pragma 和 WAL maintenance 设置 |
    | `plugin-sdk/routing` | Route/session-key/account 绑定助手，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享的 channel/account 状态摘要助手、runtime-state 默认值和 issue metadata 助手 |
    | `plugin-sdk/target-resolver-runtime` | 共享的 target resolver 助手 |
    | `plugin-sdk/string-normalization-runtime` | Slug/string 规范化助手 |
    | `plugin-sdk/request-url` | 从 fetch/request-like 输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带时间限制的 command runner，返回规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用 tool/CLI param readers |
    | `plugin-sdk/tool-plugin` | 定义简单的类型化 agent-tool 插件，并暴露用于清单生成的静态元数据 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化 payload |
    | `plugin-sdk/tool-send` | 从 tool args 中提取规范 send target 字段 |
    | `plugin-sdk/sandbox` | 沙箱后端类型和 SSH/OpenShell command 助手，包括 fail-fast exec command preflight |
    | `plugin-sdk/temp-path` | 共享的 temp-download 路径助手和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏助手 |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode 和转换助手 |
    | `plugin-sdk/model-session-runtime` | 模型/会话 override 助手，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析助手 |
    | `plugin-sdk/json-store` | 小型 JSON state 读写助手 |
    | `plugin-sdk/json-unsafe-integers` | JSON 解析助手，将不安全整数 literal 保留为字符串 |
    | `plugin-sdk/file-lock` | 可重入 file-lock 助手 |
    | `plugin-sdk/persistent-dedupe` | 磁盘后备的去重缓存助手 |
    | `plugin-sdk/acp-runtime` | ACP runtime/session 和 reply-dispatch 助手 |
    | `plugin-sdk/acp-runtime-backend` | 面向 startup-loaded plugins 的轻量级 ACP backend registration 和 reply-dispatch 助手 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命周期 startup 导入的只读 ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | 已弃用的 agent runtime config-schema primitives；请从受维护的插件自有表面导入 schema primitives |
    | `plugin-sdk/boolean-param` | 宽松 boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name 匹配解析助手 |
    | `plugin-sdk/device-bootstrap` | 设备 bootstrap 和 pairing token 助手 |
    | `plugin-sdk/extension-shared` | 共享的 passive-channel、状态和 ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply 助手 |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing 助手 |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize 助手 |
    | `plugin-sdk/agent-harness` | 实验性的 trusted-plugin 表面，用于低层级 agent harnesses：harness 类型、active-run steer/abort 助手、OpenClaw tool bridge 助手、runtime-plan tool policy 助手、terminal outcome classification、tool progress formatting/detail 助手，以及 attempt result 工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI provider-owned endpoint detection 门面；请使用 Z.AI 插件公共 API |
    | `plugin-sdk/async-lock-runtime` | 用于小型运行时状态文件的进程本地 async lock 助手 |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry 助手 |
    | `plugin-sdk/concurrency-runtime` | 有界 async task concurrency 助手 |
    | `plugin-sdk/dedupe-runtime` | 内存中和 persistent-backed 去重缓存助手 |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain 助手 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和 media-source 路径助手 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake、event 和 visibility 助手 |
    | `plugin-sdk/number-runtime` | 数值强制转换助手 |
    | `plugin-sdk/secure-random-runtime` | 安全 token/UUID 助手 |
    | `plugin-sdk/system-event-runtime` | System event queue 助手 |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait 助手 |
    | `plugin-sdk/exec-approvals-runtime` | Exec approval policy file 助手，不包含宽泛的 infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容 shim；请使用上方聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存助手 |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag、event 和 trace-context 助手 |
    | `plugin-sdk/error-runtime` | Error graph、格式化、共享错误分类助手、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch、proxy、EnvHttpProxyAgent option 和 pinned lookup 助手 |
    | `plugin-sdk/runtime-fetch` | dispatcher-aware runtime fetch，不导入 proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Inline image data URL sanitizer 和 signature sniffing 助手，不包含宽泛的 media runtime surface |
    | `plugin-sdk/response-limit-runtime` | 有界 response-body reader，不包含宽泛的 media runtime surface |
    | `plugin-sdk/session-binding-runtime` | 当前 conversation binding state，不含 configured binding routing 或 pairing stores |
    | `plugin-sdk/context-visibility-runtime` | Context visibility resolution 和 supplemental context filtering，不含宽泛 config/security 导入 |
    | `plugin-sdk/string-coerce-runtime` | 精简的 primitive record/string coercion 和 normalization 助手，不含 markdown/logging 导入 |
    | `plugin-sdk/host-runtime` | Hostname 和 SCP host normalization 助手 |
    | `plugin-sdk/retry-runtime` | Retry config 和 retry runner 助手 |
    | `plugin-sdk/agent-runtime` | 已弃用的宽泛 barrel，用于 agent dir/identity/workspace 助手，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容导出；优先使用聚焦的 agent/runtime 子路径 |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已弃用的宽泛媒体 barrel，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 和已弃用的 `fetchRemoteMedia`；优先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 和能力运行时子路径；当 URL 应成为 OpenClaw 媒体时，优先使用存储辅助函数，再读取 buffer |
    | `plugin-sdk/media-mime` | 精简的 MIME 规范化、文件扩展名映射、MIME 检测和媒体类型辅助函数 |
    | `plugin-sdk/media-store` | 精简的媒体存储辅助函数，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共享的媒体生成故障转移辅助函数、候选选择和缺失模型提示 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像、音频、结构化提取辅助导出 |
    | `plugin-sdk/text-chunking` | 出站文本和 markdown 分块/渲染辅助函数、markdown 表格转换、指令标签剥离和安全文本工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音辅助导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化和语音辅助导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
    | `plugin-sdk/realtime-bootstrap-context` | 用于有界 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 上下文注入的实时配置文件引导辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型、注册表辅助函数和共享实时语音行为辅助函数，包括输出活动跟踪 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、认证和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 已弃用的共享音乐生成类型、故障转移辅助函数、提供商查找和模型引用解析；优先使用插件自有的音乐提供商表面 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
    | `plugin-sdk/transcripts` | 共享转录来源提供商类型、注册表辅助函数、会话描述符和发言元数据 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | 已弃用的兼容性别名；使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享的远程/本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 已弃用的兼容性重新导出；直接从 `zod` 导入 `zod` |
    | `plugin-sdk/testing` | 面向旧版 OpenClaw 测试的仓库本地已弃用兼容性 barrel。新的仓库测试应改为导入聚焦的本地测试子路径，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 仓库本地的最小 `createTestPluginApi` 辅助函数，用于直接插件注册单元测试，无需导入仓库测试辅助桥接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地原生 Agent 运行时适配器契约 fixture，用于认证、投递、回退、工具钩子、提示覆盖、schema 和转录投影测试 |
    | `plugin-sdk/channel-test-helpers` | 面向渠道的仓库本地测试辅助函数，用于通用动作/设置/状态契约、目录断言、账户启动生命周期、发送配置线程化、运行时 mock、状态问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 面向渠道测试的仓库本地共享目标解析错误用例套件 |
    | `plugin-sdk/channel-contract-testing` | 精简的仓库本地渠道契约测试辅助函数，不包含宽泛测试 barrel |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地插件包、注册、公共工件、直接导入、运行时 API 和导入副作用契约辅助函数 |
    | `plugin-sdk/plugin-state-test-runtime` | 仓库本地插件状态存储、入口队列和状态数据库测试辅助函数 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地提供商运行时、认证、设备发现、引导设置、目录、向导、媒体能力、重放策略、实时 STT 实况音频、Web 搜索/获取和流契约辅助函数 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地可选启用的 Vitest HTTP/认证 mock，用于测试会触发 `plugin-sdk/provider-http` 的提供商测试 |
    | `plugin-sdk/reply-payload-testing` | 用于向回复 payload fixture 附加元数据的仓库本地辅助函数 |
    | `plugin-sdk/sqlite-runtime-testing` | 面向第一方测试的仓库本地 SQLite 生命周期辅助函数 |
    | `plugin-sdk/test-fixtures` | 仓库本地通用 CLI 运行时捕获、沙箱上下文、技能写入器、智能体消息、系统事件、模块重载、内置插件路径、终端文本、分块、认证令牌和类型化用例 fixture |
    | `plugin-sdk/test-node-mocks` | 仓库本地聚焦的 Node 内置 mock 辅助函数，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | 已弃用的记忆索引/搜索运行时 facade；优先使用供应商中立的 memory-host 子路径 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 轻量级记忆 embedding 提供商注册表辅助函数 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆 host foundation 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆 host embedding 契约、注册表访问、本地提供商，以及通用批处理/远程辅助函数。此表面上的 `registerMemoryEmbeddingProvider` 已弃用；新提供商请使用通用 embedding 提供商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆 host QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆 host 存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 已弃用的记忆 host 多模态辅助函数；优先使用供应商中立的 memory-host 子路径 |
    | `plugin-sdk/memory-core-host-query` | 已弃用的记忆 host 查询辅助函数；优先使用供应商中立的 memory-host 子路径 |
    | `plugin-sdk/memory-core-host-secret` | 记忆 host 密钥辅助函数 |
    | `plugin-sdk/memory-core-host-events` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 记忆 host 状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆 host CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆 host 核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆 host 文件/运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | 面向记忆 host 核心运行时辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 面向记忆 host 事件日志辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 面向记忆相邻插件的共享托管 markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于 search-manager 访问的主动记忆运行时 facade |
    | `plugin-sdk/memory-host-status` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="预留内置辅助子路径">
    预留的内置辅助 SDK 子路径是面向内置插件代码的精简 owner 专属表面。它们会在 SDK 清单中跟踪，以确保包构建和别名保持确定性，但它们不是通用插件创作 API。新的可复用 host 契约应使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime` 和 `plugin-sdk/plugin-config-runtime`。

    | 子路径 | Owner 和用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 内置 Codex 插件辅助函数，用于将用户 MCP 服务器配置投影到 Codex app-server 线程配置（预留包导出） |
    | `plugin-sdk/codex-native-task-runtime` | 内置 Codex 插件辅助函数，用于将 Codex app-server 原生子智能体镜像到 OpenClaw 任务状态（仅仓库本地，不是包导出） |

  </Accordion>
</AccordionGroup>

## 相关

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
