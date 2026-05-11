---
read_when:
    - 选择适合插件导入的 plugin-sdk 子路径
    - 审查内置插件子路径和辅助接口面
summary: 插件 SDK 子路径目录：哪些导入项位于何处，按区域分组
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-05-11T20:32:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

插件 SDK 以 `openclaw/plugin-sdk/` 下的一组窄公共子路径公开。本页按用途分组列出常用子路径。生成的编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出是在减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径之后的公共子集。维护者可以用 `pnpm plugin-sdk:surface` 审计公共导出数量，并用 `pnpm plugins:boundary-report:summary` 审计活跃的保留 helper 子路径；未使用的保留 helper 导出会让 CI 报告失败，而不是作为休眠的兼容性债务留在公共 SDK 中。

有关插件编写指南，请参阅 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

## 插件入口

| 子路径                        | 主要导出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Migration 提供商条目 helper，例如 `createMigrationItem`、原因常量、条目状态标记、密文遮蔽 helper 和 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 运行时 migration helper，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                              |

### 已弃用的兼容性和测试 helper

这些子路径仍作为旧插件和 OpenClaw 测试套件的包导出保留，但新代码不应再从它们添加导入：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`、`channel-runtime`、`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod`。新的插件代码应直接从 `zod` 导入 `zod`。`plugin-test-runtime` 仍是活跃的聚焦测试 helper 子路径。

### 已弃用的未使用公共子路径

这些公共子路径已存在至少一个月，并且目前没有内置插件生产导入。它们仍可导入以保持兼容性，但新的插件代码应改用聚焦且正在被积极使用的 SDK 子路径：`agent-config-primitives`、`channel-config-schema-legacy`、`channel-reply-pipeline`、`channel-runtime`、`channel-secret-runtime`、`command-auth`、`compat`、`config-runtime`、`config-schema`、`discord`、`group-access`、`infra-runtime`、`matrix`、`mattermost`、`media-generation-runtime-shared`、`memory-core-engine-runtime`、`memory-core-host-multimodal`、`memory-core-host-query`、`music-generation-core`、`self-hosted-provider-setup`、`telegram-account`、`telegram-command-config` 和 `zalouser`。

### 已弃用的少用公共子路径

目前仅被一两个内置插件所有者使用的公共子路径，也已对新的插件代码弃用。它们仍作为包导出保留以保持兼容性，但新代码应优先使用正在被积极共享的 SDK 接口，或插件自有的包 API。维护者会在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪准确集合，并用 `pnpm plugin-sdk:surface` 跟踪当前预算。

### 已弃用的宽泛 barrel

这些宽泛的重新导出 barrel 对 OpenClaw 源代码和兼容性检查仍可构建，但新代码应优先使用聚焦的 SDK 子路径：`agent-runtime`、`channel-lifecycle`、`channel-runtime`、`cli-runtime`、`compat`、`config-types`、`conversation-runtime`、`hook-runtime`、`infra-runtime`、`media-runtime`、`plugin-runtime`、`security-runtime` 和 `text-runtime`。`channel-runtime`、`compat`、`config-types`、`infra-runtime` 和 `text-runtime` 仅为向后兼容而继续作为包导出保留；请改用聚焦的频道/运行时子路径、`config-contracts`、`string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core`。

  <AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod 模式导出（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | 用于插件自有模式的缓存 JSON Schema 验证辅助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容别名；请使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控辅助工具、默认账号回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 精简账号列表/账号操作辅助工具 |
    | `plugin-sdk/access-groups` | 访问组允许列表解析和已脱敏组诊断辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 旧版回复管线辅助工具。新的渠道回复管线代码应使用 `plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline` 和 `resolveChannelMessageSourceReplyDeliveryMode`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置模式基元，以及 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅供维护的内置插件使用的内置 OpenClaw 渠道配置模式 |
    | `plugin-sdk/channel-config-schema-legacy` | 内置渠道配置模式的已弃用兼容别名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证辅助工具，带内置契约回退 |
    | `plugin-sdk/command-gating` | 精简命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已弃用的低层渠道入口兼容门面。新的接收路径应使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 实验性的高层渠道入口运行时解析器和路由事实构建器，用于已迁移的渠道接收路径。优先使用它，而不是在每个插件中组装有效允许列表、命令允许列表和旧版投影。参见 [频道入口 API](/zh-CN/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、`createChannelRunQueue` 和旧版草稿流生命周期辅助工具。新的预览终结代码应使用 `plugin-sdk/channel-message`。 |
    | `plugin-sdk/channel-message` | 低成本消息生命周期契约辅助工具，例如 `defineChannelMessageAdapter`、`createChannelMessageAdapterFromOutbound`、`createChannelMessageReplyPipeline`、`createReplyPrefixContext`、`resolveChannelMessageSourceReplyDeliveryMode`、持久最终能力派生、发送/回执/副作用能力的能力证明辅助工具、`MessageReceiveContext`、接收确认策略证明、`defineFinalizableLivePreviewAdapter`、`deliverWithFinalizableLivePreviewAdapter`、实时预览和实时终结器能力证明、持久恢复状态、`RenderedMessageBatch`、消息回执类型和回执 ID 辅助工具。参见 [频道消息 API](/zh-CN/plugins/sdk-channel-message)。旧版回复分发门面仅作为已弃用兼容项。 |
    | `plugin-sdk/channel-message-runtime` | 可能加载出站投递的运行时投递辅助工具，包括 `deliverInboundReplyWithMessageSendContext`、`sendDurableMessageBatch` 和 `withDurableMessageSendContext`。已弃用的回复分发桥仍可导入，但仅用于兼容调度器。请在监控/发送运行时模块中使用，而不是在热插件启动文件中使用。 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 信封构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 旧版共享入站记录并分发辅助工具、可见/最终分发谓词，以及用于预备渠道调度器的已弃用 `deliverDurableInboundReplyPayload` 兼容项。新的渠道接收/分发代码应从 `plugin-sdk/channel-message-runtime` 导入运行时生命周期辅助工具。 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-send-deps` | 面向渠道适配器的轻量出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站身份、发送委托、会话、格式化和负载规划辅助工具。`deliverOutboundPayloads` 等直接投递辅助工具是已弃用的兼容底层；新的发送路径请使用 `plugin-sdk/channel-message-runtime`。 |
    | `plugin-sdk/poll-runtime` | 精简投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 精简渠道配置模式基元 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前置导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享直接私信认证/守卫辅助工具 |
    | `plugin-sdk/discord` | 已弃用的 Discord 兼容门面，用于已发布的 `@openclaw/discord@2026.3.13` 和跟踪的所有者兼容性；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 已弃用的 Telegram 账号解析兼容门面，用于跟踪的所有者兼容性；新插件应使用注入的运行时辅助工具或通用渠道 SDK 子路径 |
    | `plugin-sdk/zalouser` | 已弃用的 Zalo Personal 兼容门面，用于仍在导入发送者命令授权的已发布 Lark/Zalo 包；新插件应使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、投递和旧版交互式回复辅助工具。参见 [Message Presentation](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及匹配、提及策略辅助工具和信封辅助工具的兼容桶 |
    | `plugin-sdk/channel-inbound-debounce` | 精简入站防抖辅助工具 |
    | `plugin-sdk/channel-mention-gating` | 精简提及策略、提及标记和提及文本辅助工具，不包含更宽泛的入站运行时表面 |
    | `plugin-sdk/channel-envelope` | 精简入站信封格式化辅助工具 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助工具 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和输入/确认失败的渠道日志辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生模式辅助工具 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/紧凑路由键、已解析目标类型，以及路由/目标比较辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析辅助工具；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 精简密钥契约辅助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 和密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支持用于设置、目录发现和运行时模型准备的 LM Studio 提供商门面 |
    | `plugin-sdk/lmstudio-runtime` | 支持用于本地服务器默认值、模型发现、请求头和已加载模型辅助函数的 LM Studio 运行时门面 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API-key 解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API-key 新手引导/配置文件写入辅助函数，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`，已弃用的 `resolveOpenClawAgentDir` 兼容导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数，以及共享模型 ID 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-runtime` | 用于契约测试的提供商目录增强运行时钩子和插件提供商注册表接缝 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助函数、提供商 HTTP 错误，以及音频转写 multipart 表单辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄范围 Web 获取配置/选择契约辅助函数，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web 获取提供商注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用接线的提供商的窄范围 Web 搜索配置/凭证辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 窄范围 Web 搜索配置/凭证契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及有作用域的凭证设置器/获取器 |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/运行时辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 Gemini schema 清理 + 诊断 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似项 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助函数，例如受保护的 fetch、传输消息转换，以及可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地单例/map/cache 辅助函数 |
    | `plugin-sdk/group-activation` | 窄范围群组激活模式和命令解析辅助函数 |
  </Accordion>

  <Accordion title="认证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`，命令注册表辅助函数，包括动态参数菜单格式化、发送者授权辅助函数 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同聊天操作认证辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 更宽泛的审批处理器运行时辅助函数；当更窄的适配器/Gateway 网关接缝足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账号绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复载荷辅助函数 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批载荷辅助函数、原生审批路由/运行时辅助函数，以及结构化审批显示辅助函数，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 窄范围入站回复去重重置辅助函数 |
    | `plugin-sdk/channel-contract-testing` | 不带宽泛测试 barrel 的窄范围渠道契约测试辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化，以及原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 用于热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用于渠道/插件密钥表面的窄范围密钥契约收集辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 用于密钥契约/配置解析的窄范围 `coerceSecretRef` 和 SecretRef 类型辅助函数 |
    | `plugin-sdk/security-runtime` | 共享的信任、私信门控、根目录边界文件/路径辅助函数，包括仅创建写入、同步/异步原子文件替换、同级临时写入、跨设备移动回退、私有文件存储辅助函数、符号链接父级防护、外部内容、敏感文本脱敏、常量时间密钥比较，以及密钥收集辅助函数 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不带宽泛基础设施运行时表面的窄范围固定调度器辅助函数 |
    | `plugin-sdk/ssrf-runtime` | 固定调度器、SSRF 保护的 fetch、SSRF 错误，以及 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助函数和原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时辅助函数 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时、日志、备份、插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、日志记录器、超时、重试和退避辅助函数 |
    | `plugin-sdk/browser-config` | 支持的浏览器配置门面，用于规范化的配置文件/默认值、CDP URL 解析和浏览器控制认证辅助函数 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/matrix` | 已弃用的 Matrix 兼容性门面，面向较旧的第三方渠道包；新插件应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已弃用的 Mattermost 兼容性门面，面向较旧的第三方渠道包；新插件应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令、钩子、HTTP、交互辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部钩子流水线辅助函数 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和惰性命令组辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、事件循环就绪的客户端启动辅助函数、Gateway 网关 CLI RPC、Gateway 网关协议错误和渠道状态补丁辅助函数 |
    | `plugin-sdk/config-contracts` | 面向插件配置形状的精简纯类型配置表面，例如 `OpenClawConfig` 和渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助函数，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助函数，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照设置器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 契约表面不可用也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖宽泛文本 barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批辅助函数、审批能力构建器、认证/配置文件辅助函数、原生路由/运行时辅助函数，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助函数、分块、调度、Heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复调度/完成和会话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助函数和标记，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本/Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径、会话键、更新时间和存储变更辅助函数 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助函数 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账户状态摘要辅助函数、运行时状态默认值和问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带规范化 stdout/stderr 结果的限时命令运行器 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助函数和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型/会话覆盖辅助函数，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复调度辅助函数 |
    | `plugin-sdk/acp-runtime-backend` | 面向启动时加载插件的轻量级 ACP 后端注册和回复调度辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的智能体运行时配置架构原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向底层智能体 harness 的实验性可信插件表面：harness 类型、活跃运行 Steer/中止辅助函数、OpenClaw 工具桥接辅助函数、运行时计划工具策略辅助函数、终端结果分类、工具进度格式化/详情辅助函数，以及尝试结果实用工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI 提供商拥有的端点检测门面；请使用 Z.AI 插件公共 API |
    | `plugin-sdk/async-lock-runtime` | 面向小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存内去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待处理投递清空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 唤醒、事件和可见性辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性垫片；请使用上面的精简运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和跟踪上下文辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封装的 fetch、代理、EnvHttpProxyAgent 选项和固定查找辅助函数 |
    | `plugin-sdk/runtime-fetch` | 调度器感知的运行时 fetch，不包含代理/受保护 fetch 导入 |
    | `plugin-sdk/response-limit-runtime` | 有界响应体读取器，不包含宽泛媒体运行时表面 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置的绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 会话存储辅助函数，不包含宽泛配置写入/维护导入 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文过滤，不包含宽泛配置/安全导入 |
    | `plugin-sdk/string-coerce-runtime` | 精简的原始记录/字符串强制转换和规范化辅助函数，不包含 Markdown/日志导入 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助函数，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
    | `plugin-sdk/media-mime` | 精准 MIME 规范化、文件扩展名映射、MIME 检测，以及媒体类型辅助工具 |
    | `plugin-sdk/media-store` | 精准媒体存储辅助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选项选择，以及缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频/结构化提取辅助工具导出 |
    | `plugin-sdk/text-chunking` | 文本和 markdown 分块/渲染辅助工具、markdown 表格转换、指令标签剥离，以及安全文本实用工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、校验、OpenAI 兼容 TTS 构建器和语音辅助工具导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化，以及语音辅助工具导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资源/data URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、认证，以及注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、提供商查找，以及模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、提供商查找，以及模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | 已弃用的兼容性别名；请使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 已弃用的兼容性重新导出；请直接从 `zod` 导入 `zod` |
    | `plugin-sdk/testing` | 面向旧版 OpenClaw 测试的仓库本地已弃用兼容性汇总导出。新的仓库测试应改为导入聚焦的本地测试子路径，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 仓库本地最小 `createTestPluginApi` 辅助工具，用于不导入仓库测试辅助桥接的直接插件注册单元测试 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地原生智能体运行时适配器契约夹具，用于认证、投递、回退、工具钩子、提示词覆盖层、schema 和 transcript 投影测试 |
    | `plugin-sdk/channel-test-helpers` | 仓库本地面向渠道的测试辅助工具，用于通用操作/设置/状态契约、目录断言、账号启动生命周期、发送配置线程化、运行时 mock、状态问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 仓库本地共享目标解析错误用例套件，用于渠道测试 |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地插件包、注册、公共工件、直接导入、运行时 API 和导入副作用契约辅助工具 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地提供商运行时、认证、设备发现、新手引导、目录、向导、媒体能力、重放策略、实时 STT 现场音频、Web 搜索/获取，以及流契约辅助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地可选启用的 Vitest HTTP/auth mock，用于覆盖 `plugin-sdk/provider-http` 的提供商测试 |
    | `plugin-sdk/test-fixtures` | 仓库本地通用 CLI 运行时捕获、沙箱上下文、技能写入器、智能体消息、系统事件、模块重载、内置插件路径、终端文本、分块、认证令牌和类型化用例夹具 |
    | `plugin-sdk/test-node-mocks` | 仓库本地聚焦的 Node 内置 mock 辅助工具，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 面向管理器/配置/文件/CLI 辅助工具的内置 memory-core 辅助表面 |
    | `plugin-sdk/memory-core-engine-runtime` | 记忆索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | 记忆宿主 secret 辅助工具 |
    | `plugin-sdk/memory-core-host-events` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 面向记忆宿主核心运行时辅助工具的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 面向记忆宿主事件日志辅助工具的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 面向记忆相邻插件的共享托管 markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于搜索管理器访问的主动记忆运行时门面 |
    | `plugin-sdk/memory-host-status` | 已弃用的兼容性别名；请使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的内置辅助工具子路径">
    目前没有保留的内置辅助工具 SDK 子路径。所有者特定的
    辅助工具位于所属插件包内，而可复用的宿主契约
    使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
