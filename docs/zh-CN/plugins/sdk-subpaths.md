---
read_when:
    - 为插件导入选择合适的插件 SDK 子路径
    - 审计内置插件子路径和辅助接口面
summary: 插件 SDK 子路径目录：按领域分组说明各导入项的位置
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-07-16T11:54:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

OpenClaw 插件 SDK 以一组精简的公共子路径形式暴露在
`openclaw/plugin-sdk/` 下。本页按用途对常用子路径进行分组汇总。
以下三个文件定义了该接口：

- `scripts/lib/plugin-sdk-entrypoints.json`：由构建系统编译的、持续维护的入口点清单。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：仓库本地的
  测试/内部子路径。软件包导出项为清单中排除此列表后的内容。
- `src/plugin-sdk/entrypoints.ts`：用于已弃用子路径、保留的内置辅助工具、受支持的内置 facade
  以及插件自有公共接口的分类元数据。

维护者使用 `pnpm plugin-sdk:surface` 审核公共导出项数量，并使用
`pnpm plugins:boundary-report:summary` 审核仍在使用的保留辅助工具子路径；
未使用的保留辅助工具导出项会导致 CI 报告失败，而不会作为闲置的兼容性债务继续留在公共 SDK 中。

有关插件编写指南，请参阅[插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 插件入口点

| 子路径                        | 主要导出项                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`defineSetupPluginEntry`、`buildChannelConfigSchema`、`buildJsonChannelConfigSchema`、`resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | 迁移提供商条目辅助工具，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助工具和 `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | 运行时迁移辅助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                             |
| `plugin-sdk/health`            | 面向内置健康状态使用方的 Doctor 健康检查注册、检测、修复、选择、严重程度和发现类型                                                                                |
| `plugin-sdk/config-schema`     | 已弃用。根级 `openclaw.json` Zod schema（`OpenClawSchema`）；请改为定义插件本地 schema，并使用 `plugin-sdk/json-schema-runtime` 进行验证                                                  |

### 已弃用的兼容性和测试辅助工具

为兼容旧版插件，已弃用的子路径仍会导出，但新代码应使用下方
职责明确的 SDK 子路径。持续维护的列表为
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 会拒绝内置插件的
生产代码从中导入。`plugin-sdk/compat`、
`plugin-sdk/config-types`、`plugin-sdk/infra-runtime` 和
`plugin-sdk/text-runtime` 等宽泛的桶式导出仅用于兼容，而 `plugin-sdk/zod` 是
兼容性重导出：请直接从 `zod` 导入 `zod`。宽泛的领域
桶式导出 `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、
`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、
`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、
`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 和
`plugin-sdk/security-runtime` 同样已弃用，请改用职责明确的
子路径。

OpenClaw 基于 Vitest 的测试辅助工具子路径仅限仓库本地使用，不再作为
软件包导出项：`agent-runtime-test-contracts`、
`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、
`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、
`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、
`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、
`test-node-mocks` 和 `testing`。私有的内置辅助工具接口
`ssrf-runtime-internal` 和 `codex-native-task-runtime` 也仅限仓库本地
使用。

### 保留的内置插件辅助工具子路径

`plugin-sdk/codex-mcp-projection` 是唯一保留的子路径：它是内置 Codex 插件自有的
兼容性接口，而不是通用 SDK API。软件包契约防护机制会阻止跨所有者的插件导入，
当保留子路径不再被导入时，CI 会失败。
`plugin-sdk/codex-native-task-runtime` 仅限仓库本地使用，不属于软件包
导出项。

`src/plugin-sdk/entrypoints.ts` 还会跟踪受支持的内置 facade，即在通用契约取代它们之前，
由相应内置插件提供实现的 SDK 入口点：`plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、
`plugin-sdk/matrix`、`plugin-sdk/mattermost`、
`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、
`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、
`plugin-sdk/tts-runtime` 和 `plugin-sdk/zalouser`。其中多个入口点也已不建议用于
新代码；请参阅下方各行的说明。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | 用于插件自有 schema 的缓存式 JSON Schema 验证辅助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、设置翻译器、允许列表提示和设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容性别名；请使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控辅助工具、默认账户回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账户查找和默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 精简的账户列表/账户操作辅助工具 |
    | `plugin-sdk/access-groups` | 访问群组允许列表解析和已脱敏群组诊断辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置 schema 基础组件，以及 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅供受维护的内置插件使用的内置 OpenClaw 渠道配置 schema |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。规范的内置/官方聊天渠道 ID，以及供需要识别带信封前缀文本而无需硬编码自身表格的插件使用的格式化器标签/别名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置渠道配置 schema 兼容性别名 |
    | `plugin-sdk/telegram-command-config` | 已弃用的 Telegram 命令名称/描述规范化及重复/冲突检查；新插件代码应使用插件本地的命令配置处理 |
    | `plugin-sdk/command-gating` | 精简的命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | 用于已迁移渠道接收路径的实验性高级渠道入口运行时解析器和路由事实构建器。相比在每个插件中分别组装有效允许列表、命令允许列表和旧版投影，应优先使用此项。请参阅[频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 消息生命周期契约，以及回复流水线选项、回执、实时预览/流式传输、生命周期辅助工具、出站身份、载荷规划、持久发送和消息发送上下文辅助工具。请参阅[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | 已弃用的 `plugin-sdk/channel-outbound` 兼容性别名。 |
    | `plugin-sdk/channel-message-runtime` | 已弃用的 `plugin-sdk/channel-outbound` 兼容性别名。 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由和信封构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已弃用的兼容性门面。入站运行器和分派谓词请使用 `plugin-sdk/channel-inbound`，消息递送辅助工具请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已弃用的目标解析别名；请使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载和托管媒体状态辅助工具 |
    | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 精简的投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 话题绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 智能体媒体载荷根目录和加载器 |
    | `plugin-sdk/conversation-runtime` | 已弃用的宽泛导出入口，涵盖对话/话题绑定、配对和已配置绑定辅助工具；应优先使用聚焦的绑定子路径，例如 `plugin-sdk/thread-bindings-runtime` 和 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 精简的渠道配置 schema 基础组件 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 已弃用的群组访问决策辅助工具；请使用 `plugin-sdk/channel-ingress-runtime` 中的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 精简的私信加密前守卫策略辅助工具 |
    | `plugin-sdk/discord` | 已弃用的 Discord 兼容性门面，用于已发布的 `@openclaw/discord@2026.3.13` 和受跟踪的所有者兼容性；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 已弃用的 Telegram 账户解析兼容性门面，用于受跟踪的所有者兼容性；新插件应使用注入的运行时辅助工具或通用渠道 SDK 子路径 |
    | `plugin-sdk/zalouser` | 已弃用的 Zalo Personal 兼容性门面，供仍导入发送者命令授权的已发布 Lark/Zalo 软件包使用；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、递送和旧版交互式回复辅助工具。请参阅[消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于事件分类、上下文构建、格式化、根目录、防抖、提及匹配、提及策略和入站日志记录的共享入站辅助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 精简的入站防抖辅助工具 |
    | `plugin-sdk/channel-mention-gating` | 精简的提及策略、提及标记和提及文本辅助工具，不包含更宽泛的入站运行时接口 |
    | `plugin-sdk/channel-envelope`、`plugin-sdk/channel-inbound-roots`、`plugin-sdk/channel-location`、`plugin-sdk/channel-logging` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面。请使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、话题 ID 字符串化、去重/紧凑路由键、已解析目标类型，以及路由/目标比较辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析辅助工具；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/表情回应连接 |
  </Accordion>

已弃用的渠道辅助函数族仅为已发布插件的兼容性而保留。移除计划如下：在外部插件迁移窗口期间保留它们，让仓库内/内置插件继续使用 `channel-inbound` 和 `channel-outbound`，然后在下一次 SDK 重大清理中移除这些兼容性子路径。这适用于旧版渠道消息/运行时、渠道流式传输、私信直接访问、入口辅助函数分支、回复选项以及配对路径函数族。

  <Accordion title="提供商子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 受支持的 LM Studio 提供商门面，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 受支持的 LM Studio 运行时门面，用于本地服务器默认值、模型发现、请求标头和已加载模型辅助函数 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 已弃用的 OpenAI 兼容自托管设置辅助函数；请使用 `plugin-sdk/provider-setup` 或插件自有的设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值和看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商身份验证运行时辅助函数：OAuth loopback 流程、令牌交换、身份验证持久化和 API 密钥解析 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供商 OAuth 回调类型、回调页面渲染、PKCE/状态辅助函数、授权输入解析、令牌过期辅助函数和中止辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥新手引导/配置文件写入辅助函数，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 身份验证结果构建器 |
    | `plugin-sdk/provider-env-vars` | 提供商身份验证环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 身份验证导入辅助函数、已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数和共享模型 ID 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用于受保护的 `/models` 式发现的实时提供商模型目录辅助函数：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 筛选、TTL 缓存和静态回退 |
    | `plugin-sdk/provider-catalog-runtime` | 提供商目录扩充运行时钩子，以及用于契约测试的插件提供商注册表接缝 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助函数、提供商 HTTP 错误和音频转录 multipart 表单辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 精简的 Web 获取配置/选择契约辅助函数，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web 获取提供商注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向无需插件启用接线的提供商的精简 Web 搜索配置/凭据辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 精简的 Web 搜索配置/凭据契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定作用域的凭据设置器/获取器 |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/运行时辅助函数 |
    | `plugin-sdk/embedding-providers` | 通用嵌入提供商类型和读取辅助函数，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；插件通过 `api.registerEmbeddingProvider(...)` 注册提供商，以强制执行清单所有权 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 架构清理和诊断 |
    | `plugin-sdk/provider-usage` | 提供商用量快照类型、共享用量获取辅助函数，以及 `fetchClaudeUsage` 等提供商获取器 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型、纯文本工具调用兼容性，以及共享的 Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI 包装器辅助函数 |
    | `plugin-sdk/provider-stream-shared` | 公共共享提供商流包装器辅助函数，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic/DeepSeek/OpenAI 兼容流实用函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助函数，例如受保护的获取、工具结果文本提取、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程内单例/映射/缓存辅助函数 |
    | `plugin-sdk/group-activation` | 精简的群组激活模式和命令解析辅助函数 |
  </Accordion>

提供商用量快照通常会报告一个或多个配额 `windows`，每个都包含
标签、已使用百分比和可选的重置时间。对于公开余额或
账户状态文本而非可重置配额窗口的提供商，应返回
`summary` 并使用空的 `windows` 数组，而不是虚构百分比。
OpenClaw 会在状态输出中显示该摘要文本；仅当
用量端点失败或未返回可用的用量数据时，才使用 `error`。

  <Accordion title="身份验证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已弃用的宽泛命令授权表面（`resolveControlCommandGate`、命令注册表辅助函数，包括动态参数菜单格式化、发送者授权辅助函数）；请使用渠道入口/运行时授权或命令状态辅助函数 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同一聊天操作身份验证辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 Exec 审批配置文件/筛选器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析器 |
    | `plugin-sdk/approval-reference-runtime` | 用于受传输限制的审批回调的确定性持久定位器辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于高频渠道入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 更宽泛的审批处理程序运行时辅助函数；当更精简的适配器/Gateway 网关接缝已足够时，应优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标、账户绑定、路由门控、转发回退和本地原生 Exec 提示抑制辅助函数 |
    | `plugin-sdk/approval-reaction-runtime` | 硬编码审批表情回应绑定、表情回应提示负载、表情回应目标存储、表情回应提示文本辅助函数，以及本地原生 Exec 提示抑制的兼容性导出 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复负载辅助函数 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批负载辅助函数、审批能力构建器、审批身份验证/配置文件辅助函数、原生审批路由/运行时辅助函数，以及 `formatApprovalDisplayPath` 等结构化审批显示辅助函数 |
    | `plugin-sdk/reply-dedupe` | 已弃用的精简入站回复去重重置辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令身份验证、动态参数菜单格式化和原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 用于高频渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 用于私有渠道和 Web UI 设备代码配对的延迟加载提供商身份验证登录流程辅助函数 |
    | `plugin-sdk/channel-secret-runtime` | 已弃用的宽泛机密契约表面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、机密目标类型）；应优先使用下方的聚焦子路径 |
    | `plugin-sdk/channel-secret-basic-runtime` | 面向非 TTS 渠道/插件机密表面的精简机密契约导出和目标注册表构建器 |
    | `plugin-sdk/channel-secret-tts-runtime` | 精简的嵌套渠道 TTS 机密赋值辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 用于机密契约/配置解析的精简 SecretRef 类型定义、解析和计划目标路径查找 |
    | `plugin-sdk/secret-provider-integration` | 仅类型的 SecretRef 提供商集成清单和预设契约，供发布外部机密提供商预设的插件使用 |
    | `plugin-sdk/security-runtime` | 已弃用的宽泛桶形导出，涵盖信任、私信门控、根目录边界内的文件/路径辅助函数（包括仅创建写入、同步/异步原子文件替换、同级临时写入、跨设备移动回退）、私有文件存储辅助函数、符号链接父目录防护、外部内容、敏感文本脱敏、常量时间机密比较和机密收集辅助函数；应优先使用聚焦的安全/SSRF/机密子路径 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不含宽泛基础设施运行时表面的精简固定调度器辅助函数 |
    | `plugin-sdk/ssrf-runtime` | 固定调度器、受 SSRF 防护的获取、SSRF 错误和 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 机密输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助函数，以及原始 WebSocket/正文强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时辅助函数，以及用于跟踪确认后处理的 `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 运行时、日志、备份辅助函数，插件安装路径警告，以及进程辅助函数 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、日志记录器、超时、重试和退避辅助函数 |
    | `plugin-sdk/browser-config` | 受支持的浏览器配置门面，用于规范化配置文件和默认值、解析 CDP URL，以及提供浏览器控制身份验证辅助函数 |
    | `plugin-sdk/agent-harness-task-runtime` | 通用任务生命周期和完成结果交付辅助函数，供使用主机签发任务作用域且由 harness 支持的智能体使用 |
    | `plugin-sdk/codex-mcp-projection` | 保留的内置 Codex 辅助函数，用于将用户 MCP 服务器配置映射到 Codex 线程配置；不供第三方插件使用 |
    | `plugin-sdk/codex-native-task-runtime` | 仓库本地的内置 Codex 辅助函数，用于原生任务镜像和运行时接线；不属于软件包导出 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/matrix` | 面向旧版第三方渠道软件包的已弃用 Matrix 兼容门面；新插件应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 面向旧版第三方渠道软件包的已弃用 Mattermost 兼容门面；新插件应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 面向插件命令、钩子、HTTP 和交互辅助函数的已弃用宽泛统一导出；请优先使用聚焦的插件运行时子路径 |
    | `plugin-sdk/hook-runtime` | 面向 webhook 和内部钩子管线辅助函数的已弃用宽泛统一导出；请优先使用聚焦的钩子和插件运行时子路径 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入和绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助函数 |
    | `plugin-sdk/node-host` | Node 主机可执行文件解析和 PTY 恢复辅助函数 |
    | `plugin-sdk/cli-runtime` | 面向 CLI 格式化、等待、版本、参数调用和延迟命令组辅助函数的已弃用宽泛统一导出；请优先使用聚焦的 CLI 和运行时子路径 |
    | `plugin-sdk/qa-runner-runtime` | 受支持的门面，通过 CLI 命令界面公开插件 QA 场景 |
    | `plugin-sdk/tts-runtime` | 面向文本转语音配置架构和运行时辅助函数的受支持门面 |
    | `plugin-sdk/gateway-method-runtime` | 保留的 Gateway 网关方法分派辅助函数，用于声明了 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的插件 HTTP 路由 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、事件循环就绪的客户端启动辅助函数、Gateway 网关 CLI RPC、Gateway 网关协议错误、公布的 LAN 主机解析，以及渠道状态修补辅助函数 |
    | `plugin-sdk/config-contracts` | 聚焦的纯类型配置界面，用于 `OpenClawConfig` 等插件配置结构以及渠道和提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 插件运行时配置辅助函数，例如 `mergeDeep`、`requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务式配置变更辅助函数，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共享的消息工具交付元数据提示字符串 |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照设置函数 |
    | `plugin-sdk/text-autolink-runtime` | 文件引用自动链接检测，无需宽泛文本统一导出 |
    | `plugin-sdk/reply-runtime` | 共享的入站和回复运行时辅助函数、分块、分派、Heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复分派、最终处理和会话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享的短时间窗口回复历史辅助函数。新的消息轮次代码应使用 `createChannelHistoryWindow`；底层映射辅助函数仍仅作为已弃用的兼容导出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本和 Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话工作流辅助函数（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修复和生命周期辅助函数（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、过渡期 `sessionFile` 值的标记辅助函数、按会话身份进行的有界近期用户和助手转录文本读取、会话存储路径和会话键辅助函数，以及更新时间读取，不包含宽泛配置写入和维护导入 |
    | `plugin-sdk/session-transcript-runtime` | 转录身份、限定作用域的目标和读写辅助函数、可见消息条目映射、更新发布、写锁，以及转录记忆命中键 |
    | `plugin-sdk/sqlite-runtime` | 面向第一方运行时的聚焦 SQLite 智能体架构、路径和事务辅助函数，不包含数据库生命周期控制 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径、加载和保存辅助函数 |
    | `plugin-sdk/state-paths` | 状态和 OAuth 目录路径辅助函数 |
    | `plugin-sdk/plugin-state-runtime` | 插件 sidecar SQLite 键控状态类型，以及面向插件自有数据库的集中式连接 pragma、经验证的 WAL 维护和原子 STRICT 架构迁移辅助函数 |
    | `plugin-sdk/routing` | 路由、会话键和账户绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享的渠道和账户状态摘要辅助函数、运行时状态默认值，以及问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享的目标解析辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | Slug 和字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从类似 fetch 或 request 的输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时功能的命令运行器，返回规范化的 stdout 和 stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具和 CLI 参数读取函数 |
    | `plugin-sdk/tool-plugin` | 定义简单的类型化智能体工具插件，并公开用于生成清单的静态元数据 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化载荷 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范的发送目标字段 |
    | `plugin-sdk/sandbox` | 沙箱后端类型以及 SSH 和 OpenShell 命令辅助函数，包括快速失败的执行命令预检 |
    | `plugin-sdk/temp-path` | 共享的临时下载路径辅助函数和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型和会话覆盖辅助函数，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/json-unsafe-integers` | 将不安全的整数字面量保留为字符串的 JSON 解析辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时、会话和回复分派辅助函数 |
    | `plugin-sdk/acp-runtime-backend` | 面向启动时加载插件的轻量 ACP 后端注册和回复分派辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不导入生命周期启动逻辑的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 已弃用的智能体运行时配置架构基元；请从维护中的插件自有界面导入架构基元 |
    | `plugin-sdk/boolean-param` | 宽松的布尔参数读取函数 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数，包括 `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | 共享的被动渠道、状态和环境代理辅助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令和提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表、构建和序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向底层智能体 harness 的实验性可信插件界面：harness 类型、活动运行的 steer 和中止辅助函数、OpenClaw 工具桥接辅助函数、运行时计划工具策略辅助函数、终端结果分类、工具进度格式化和详情辅助函数，以及尝试结果实用函数 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI 提供商自有端点检测门面；请使用 Z.AI 插件公共 API |
    | `plugin-sdk/async-lock-runtime` | 面向小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存和持久化后端支持的去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待交付项排空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全的本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 唤醒、事件和可见性辅助函数 |
    | `plugin-sdk/expect-runtime` | 面向可证明运行时不变量的必需值断言辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌和 UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略文件辅助函数，无需宽泛的基础设施运行时统一导出 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容垫片；请使用上方聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和跟踪上下文辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封装的 fetch、代理、EnvHttpProxyAgent 选项和固定查询辅助函数 |
    | `plugin-sdk/runtime-fetch` | 支持 Dispatcher 的运行时 fetch，不导入代理或受保护 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 内联图像数据 URL 清理和签名嗅探辅助函数，无需宽泛的媒体运行时界面 |
    | `plugin-sdk/response-limit-runtime` | 受字节数、空闲时间和截止时间限制的响应正文读取函数，无需宽泛的媒体运行时界面 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置的绑定路由或配对存储 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文筛选，不导入宽泛配置或安全模块 |
    | `plugin-sdk/string-coerce-runtime` | 精简的基本记录和字符串强制转换与规范化辅助函数，不导入 Markdown 或日志模块 |
    | `plugin-sdk/html-entity-runtime` | 单遍解码以分号结尾的 HTML5 实体，无需宽泛文本实用函数 |
    | `plugin-sdk/text-utility-runtime` | 底层文本和路径辅助函数，包括五种实体的 HTML 转义 |
    | `plugin-sdk/widget-html` | 面向自包含 HTML 小组件的完整文档检测、大小验证和工具输入错误 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 面向智能体目录、身份和工作区辅助函数的已弃用宽泛统一导出，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容导出；请优先使用聚焦的智能体和运行时子路径 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询和去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已弃用的宽泛媒体桶形导出，包括 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 和已弃用的 `fetchRemoteMedia`；优先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 和能力运行时子路径；当 URL 应转换为 OpenClaw 媒体时，优先在读取缓冲区之前使用存储辅助函数 |
    | `plugin-sdk/media-mime` | 精简的 MIME 规范化、文件扩展名映射、MIME 检测和媒体类型辅助函数 |
    | `plugin-sdk/media-store` | 精简的媒体存储辅助函数，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共享的媒体生成故障转移辅助函数、候选项选择和模型缺失消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像、音频和结构化提取辅助函数导出 |
    | `plugin-sdk/text-chunking` | 出站文本和保留偏移量的范围分块、Markdown 分块/渲染辅助函数、识别引号的 HTML 标签词元化、Markdown 表格转换、指令标签移除和安全文本实用工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音辅助函数导出 |
    | `plugin-sdk/speech-core` | 共享的语音提供商类型、注册表、指令、规范化和语音辅助函数导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
    | `plugin-sdk/realtime-bootstrap-context` | 用于注入有界 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 上下文的实时配置文件引导辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型、注册表辅助函数和共享实时语音行为辅助函数，包括输出活动跟踪 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享的图像生成类型、故障转移、身份验证和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 已弃用的共享音乐生成类型、故障转移辅助函数、提供商查找和模型引用解析；优先使用插件自有的音乐提供商接口 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享的视频生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
    | `plugin-sdk/transcripts` | 共享的转录来源提供商类型、注册表辅助函数、会话描述符和话语元数据 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | 已弃用的兼容性别名；请使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享的远程/本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 已弃用的兼容性重新导出；请直接从 `zod` 导入 `zod` |
    | `plugin-sdk/plugin-test-api` | 仓库本地的最小化 `createTestPluginApi` 辅助函数，用于无需导入仓库测试辅助桥接模块的直接插件注册单元测试 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地的原生智能体运行时适配器契约夹具，用于身份验证、投递、故障转移、工具钩子、提示词叠加、架构和转录投影测试 |
    | `plugin-sdk/channel-test-helpers` | 仓库本地、面向渠道的测试辅助函数，用于通用操作/设置/状态契约、目录断言、账号启动生命周期、发送配置传递、运行时模拟、状态问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 用于渠道测试的仓库本地共享目标解析错误用例套件 |
    | `plugin-sdk/channel-contract-testing` | 不使用宽泛测试桶形导出的仓库本地精简渠道契约测试辅助函数 |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地的插件包、注册、公共工件、直接导入、运行时 API 和导入副作用契约辅助函数 |
    | `plugin-sdk/plugin-state-test-runtime` | 仓库本地的插件状态存储、入口队列和状态数据库测试辅助函数 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地的提供商运行时、身份验证、设备发现、引导设置、目录、向导、媒体能力、重放策略、实时 STT 实况音频、Web 搜索/获取和流契约辅助函数 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地的选择启用式 Vitest HTTP/身份验证模拟，用于测试 `plugin-sdk/provider-http` 的提供商测试 |
    | `plugin-sdk/reply-payload-testing` | 用于向回复载荷夹具附加元数据的仓库本地辅助函数 |
    | `plugin-sdk/sqlite-runtime-testing` | 用于第一方测试的仓库本地 SQLite 生命周期辅助函数 |
    | `plugin-sdk/test-fixtures` | 仓库本地的通用 CLI 运行时捕获、沙箱上下文、技能编写器、智能体消息、系统事件、模块重新加载、内置插件路径、终端文本、分块、身份验证令牌和类型化用例夹具 |
    | `plugin-sdk/test-node-mocks` | 仓库本地的聚焦式 Node 内置模块模拟辅助函数，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | 已弃用的记忆索引/搜索运行时门面；优先使用供应商中立的记忆宿主子路径 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 轻量级记忆嵌入提供商注册表辅助函数 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入契约、注册表访问、本地提供商和通用批处理/远程辅助函数。此接口上的 `registerMemoryEmbeddingProvider` 已弃用；新提供商请使用通用嵌入提供商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 已弃用的记忆宿主多模态辅助函数；优先使用供应商中立的记忆宿主子路径 |
    | `plugin-sdk/memory-core-host-query` | 已弃用的记忆宿主查询辅助函数；优先使用供应商中立的记忆宿主子路径 |
    | `plugin-sdk/memory-core-host-secret` | 记忆宿主机密辅助函数 |
    | `plugin-sdk/memory-core-host-events` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 记忆宿主事件日志辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 用于记忆相关插件的共享托管式 Markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于访问搜索管理器的主动记忆运行时门面 |
    | `plugin-sdk/memory-host-status` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的内置辅助函数子路径">
    保留的内置辅助函数 SDK 子路径是面向内置插件代码的精简所有者专用接口。SDK 清单会跟踪这些接口，以确保包构建和别名处理保持确定性，但它们不是通用的插件开发 API。新的可复用宿主契约应使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime` 和
    `plugin-sdk/plugin-config-runtime`。

    | 子路径 | 所有者和用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 内置 Codex 插件辅助函数，用于将用户 MCP 服务器配置投影到 Codex 应用服务器线程配置中（保留的包导出） |
    | `plugin-sdk/codex-native-task-runtime` | 内置 Codex 插件辅助函数，用于将 Codex 应用服务器原生子智能体镜像到 OpenClaw 任务状态中（仅限仓库本地，不属于包导出） |

  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
