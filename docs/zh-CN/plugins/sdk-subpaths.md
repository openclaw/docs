---
read_when:
    - 为插件导入选择正确的 plugin-sdk 子路径
    - 审计内置插件的子路径和辅助接口
summary: 插件 SDK 子路径目录：哪些导入位于何处，按区域分组
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-04-30T03:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  插件 SDK 以 `openclaw/plugin-sdk/` 下的一组窄子路径形式公开。
  本页按用途分组列出常用子路径。生成的 200+ 个子路径完整列表位于 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的内置插件辅助子路径会出现在其中，但除非某个文档页面明确推荐，否则它们属于实现细节。维护者可以用 `pnpm plugins:boundary-report:summary` 审计当前活跃的保留辅助子路径；未使用的保留辅助导出会让 CI 报告失败，而不是作为休眠的兼容性债务留在公开 SDK 中。

  插件编写指南见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

  ## 插件入口

  | 子路径                                   | 主要导出                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 旧版插件测试的宽兼容 barrel；新的插件测试应优先使用聚焦的测试子路径                                                                     |
  | `plugin-sdk/plugin-test-api`              | 用于直接插件注册单元测试的最小 `OpenClawPluginApi` mock 构建器                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | 原生 Agent Runtime 适配器合约夹具，覆盖鉴权配置文件、投递抑制、回退分类、工具钩子、提示词叠加、schema 和转录修复 |
  | `plugin-sdk/channel-test-helpers`         | 渠道账号生命周期、目录、发送配置、运行时 mock、钩子、内置渠道入口、信封时间戳、配对回复和通用渠道合约测试辅助   |
  | `plugin-sdk/channel-target-testing`       | 共享的渠道目标解析错误场景测试套件                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | 插件注册、包 manifest、公开构件、运行时 API、导入副作用和直接导入合约辅助                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 用于测试的插件运行时、注册表、提供商注册、设置向导和运行时任务流夹具                                                                      |
  | `plugin-sdk/provider-test-contracts`      | 提供商运行时、鉴权、设备发现、新手引导、目录、媒体能力、重放策略、实时 STT 实时音频、Web 搜索/获取和向导合约辅助                 |
  | `plugin-sdk/provider-http-test-mocks`     | 针对执行 `plugin-sdk/provider-http` 的提供商测试，可选择启用的 Vitest HTTP/鉴权 mock                                                                                    |
  | `plugin-sdk/test-env`                     | 测试环境、fetch/网络、一次性 HTTP 服务器、传入请求、实时测试、临时文件系统和时间控制夹具                                        |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、沙箱、skill、智能体消息、系统事件、模块重载、内置插件路径、终端、分块、鉴权令牌和类型化用例测试夹具                   |
  | `plugin-sdk/test-node-mocks`              | 在 Vitest `vi.mock("node:*")` 工厂中使用的聚焦 Node 内置 mock 辅助                                                                                        |
  | `plugin-sdk/migration`                    | 迁移提供商条目辅助，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助和 `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | 运行时迁移辅助，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控辅助、默认账号回退辅助 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化辅助 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退辅助 |
    | `plugin-sdk/account-helpers` | 窄账号列表/账号操作辅助 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置 schema 基元和通用构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅供维护中的内置插件使用的内置 OpenClaw 渠道配置 schema |
    | `plugin-sdk/channel-config-schema-legacy` | 内置渠道配置 schema 的已弃用兼容别名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/校验辅助，带内置合约回退 |
    | `plugin-sdk/command-gating` | 窄命令授权门控辅助 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、草稿流生命周期/完成辅助 |
    | `plugin-sdk/inbound-envelope` | 共享传入路由 + 信封构建器辅助 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享传入记录与分发辅助 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助 |
    | `plugin-sdk/outbound-send-deps` | 用于渠道适配器的轻量出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站投递、身份、发送委托、会话、格式化和载荷规划辅助 |
    | `plugin-sdk/poll-runtime` | 窄投票规范化辅助 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定辅助 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助 |
    | `plugin-sdk/channel-status` | 共享渠道 Status 快照/摘要辅助 |
    | `plugin-sdk/channel-config-primitives` | 窄渠道配置 schema 基元 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前置导出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist 配置编辑/读取辅助 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助 |
    | `plugin-sdk/direct-dm` | 共享直接私信鉴权/守卫辅助 |
    | `plugin-sdk/discord` | 已弃用的 Discord 兼容 facade，用于已发布的 `@openclaw/discord@2026.3.13` 和受跟踪的所有者兼容性；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 已弃用的 Telegram 账号解析兼容 facade，用于受跟踪的所有者兼容性；新插件应使用注入的运行时辅助或通用渠道 SDK 子路径 |
    | `plugin-sdk/zalouser` | 已弃用的 Zalo Personal 兼容 facade，用于仍会导入发送者命令授权的已发布 Lark/Zalo 包；新插件应使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、投递和旧版交互式回复辅助。见 [Message Presentation](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 传入防抖、提及匹配、提及策略辅助和信封辅助的兼容 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 窄传入防抖辅助 |
    | `plugin-sdk/channel-mention-gating` | 不包含更宽传入运行时表面的窄提及策略、提及标记和提及文本辅助 |
    | `plugin-sdk/channel-envelope` | 窄传入信封格式化辅助 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助 |
    | `plugin-sdk/channel-logging` | 用于传入丢弃和输入中/确认失败的渠道日志辅助 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助，以及为插件兼容性保留的已弃用原生 schema 辅助 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/压缩路由键、已解析目标类型，以及路由/目标比较辅助 |
    | `plugin-sdk/channel-targets` | 目标解析辅助；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道合约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄密钥合约辅助，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 和密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 用于设置、目录发现和运行时模型准备的受支持 LM Studio 提供商外观 |
    | `plugin-sdk/lmstudio-runtime` | 用于本地服务器默认值、模型发现、请求标头和已加载模型辅助函数的受支持 LM Studio 运行时外观 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/配置文件写入辅助函数，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 授权结果构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件的共享交互式登录辅助函数 |
    | `plugin-sdk/provider-env-vars` | 提供商授权环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共享重放策略构建器、提供商端点辅助函数，以及模型 ID 规范化辅助函数，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 提供商目录增强运行时钩子，以及用于合约测试的插件提供商注册表接缝 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助函数、提供商 HTTP 错误，以及音频转写 multipart 表单辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 狭窄的网页抓取配置/选择合约辅助函数，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 网页抓取提供商注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 适用于不需要插件启用接线的提供商的狭窄网页搜索配置/凭据辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 狭窄的网页搜索配置/凭据合约辅助函数，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及限定作用域的凭据设置器/获取器 |
    | `plugin-sdk/provider-web-search` | 网页搜索提供商注册/缓存/运行时辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + 诊断，以及 xAI 兼容性辅助函数，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似函数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助函数，例如受保护的 fetch、传输消息转换，以及可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地单例/map/缓存辅助函数 |
    | `plugin-sdk/group-activation` | 狭窄的群组激活模式和命令解析辅助函数 |
  </Accordion>

  <Accordion title="授权和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`，命令注册表辅助函数，包括动态参数菜单格式化、发送者授权辅助函数 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天动作授权辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/交付适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理器运行时辅助函数；当更狭窄的适配器/Gateway 网关接缝足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账号绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复载荷辅助函数 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批载荷辅助函数、原生审批路由/运行时辅助函数，以及结构化审批显示辅助函数，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狭窄的入站回复去重重置辅助函数 |
    | `plugin-sdk/channel-contract-testing` | 不包含宽泛测试 barrel 的狭窄渠道合约测试辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令授权、动态参数菜单格式化，以及原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 用于热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用于渠道/插件密钥表面的狭窄密钥合约收集辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 用于密钥合约/配置解析的狭窄 `coerceSecretRef` 和 SecretRef 类型辅助函数 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容、敏感文本脱敏、常量时间密钥比较，以及密钥收集辅助函数 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和专用网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不包含宽泛基础设施运行时表面的狭窄固定 dispatcher 辅助函数 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、SSRF 保护 fetch、SSRF 错误，以及 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助函数，以及原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求 body 大小/超时辅助函数 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时、日志、备份和插件安装辅助工具 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、记录器、超时、重试和退避辅助工具 |
    | `plugin-sdk/browser-config` | 受支持的浏览器配置门面，用于规范化配置文件/默认值、CDP URL 解析和浏览器控制认证辅助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享的插件命令、钩子、HTTP 和交互式辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享的 webhook/内部钩子管线辅助工具 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入/绑定辅助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和延迟命令组辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、事件循环就绪客户端启动辅助工具、Gateway 网关 CLI RPC、Gateway 网关协议错误和渠道状态补丁辅助工具 |
    | `plugin-sdk/config-types` | 插件配置形状的仅类型配置表面，例如 `OpenClawConfig` 和渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照设置器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 合约表面不可用也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖广泛 text-runtime barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | 执行/插件审批辅助工具、审批能力构建器、认证/配置文件辅助工具、原生路由/运行时辅助工具，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享的入站/回复运行时辅助工具、分块、调度、Heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复调度/最终化和会话标签辅助工具 |
    | `plugin-sdk/reply-history` | 共享的短窗口回复历史辅助工具和标记，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径、会话键、更新时间和存储变更辅助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助工具 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享的渠道/账户状态摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享的目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时的命令运行器，返回规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享的临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统记录器和脱敏辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/会话覆盖辅助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 基于磁盘的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复调度辅助工具 |
    | `plugin-sdk/acp-runtime-backend` | 面向启动时加载插件的轻量级 ACP 后端注册和回复调度辅助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 无生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的 agent 运行时配置模式原语 |
    | `plugin-sdk/boolean-param` | 宽松的布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助工具 |
    | `plugin-sdk/extension-shared` | 共享的被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助工具 |
    | `plugin-sdk/agent-harness` | 面向底层 agent harness 的实验性受信任插件表面：harness 类型、活动运行引导/中止辅助工具、OpenClaw 工具桥辅助工具、运行时计划工具策略辅助工具、终端结果分类、工具进度格式化/详情辅助工具，以及尝试结果实用工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测辅助工具 |
    | `plugin-sdk/async-lock-runtime` | 面向小型运行时状态文件的进程本地异步锁辅助工具 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助工具 |
    | `plugin-sdk/dedupe-runtime` | 内存内去重缓存辅助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待处理投递清空辅助工具 |
    | `plugin-sdk/file-access-runtime` | 安全的本地文件和媒体源路径辅助工具 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 事件和可见性辅助工具 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助工具 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助工具 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助工具 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性 shim；请使用上方聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和跟踪上下文辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封装 fetch、代理、EnvHttpProxyAgent 选项和固定 lookup 辅助工具 |
    | `plugin-sdk/runtime-fetch` | 感知 Dispatcher 的运行时 fetch，不导入代理/受保护 fetch |
    | `plugin-sdk/response-limit-runtime` | 有界响应体读取器，不依赖广泛媒体运行时表面 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 会话存储辅助工具，不导入广泛配置写入/维护逻辑 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文过滤，不导入广泛配置/安全逻辑 |
    | `plugin-sdk/string-coerce-runtime` | 精简的原始记录/字符串强制转换和规范化辅助工具，不导入 Markdown/日志逻辑 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
    | `plugin-sdk/media-store` | 精简媒体存储辅助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选选择，以及缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助工具导出 |
    | `plugin-sdk/text-runtime` | 共享文本/markdown/日志辅助工具，例如剥离智能体可见文本、markdown 渲染/分块/表格辅助工具、脱敏辅助工具、指令标签辅助工具，以及安全文本实用工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音辅助工具导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化和语音辅助工具导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资产/数据 URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、身份验证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | 用于旧版插件测试的宽泛兼容性 barrel。新的插件测试应改为导入聚焦的 SDK 子路径，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 辅助工具，用于直接插件注册单元测试，无需导入仓库测试辅助工具桥接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 用于身份验证、投递、回退、工具钩子、提示词叠加、schema 和转录投影测试的原生 Agent Runtimes 适配器契约夹具 |
    | `plugin-sdk/channel-test-helpers` | 面向渠道的测试辅助工具，用于通用操作/设置/Status 契约、目录断言、账户启动生命周期、发送配置线程、运行时 mock、Status 问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 用于渠道测试的共享目标解析错误场景套件 |
    | `plugin-sdk/plugin-test-contracts` | 插件包、注册、公共工件、直接导入、运行时 API 和导入副作用契约辅助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供商运行时、身份验证、设备发现、新手引导、目录、向导、媒体能力、重放策略、实时 STT 现场音频、Web 搜索/获取和流式传输契约辅助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 面向测试 `plugin-sdk/provider-http` 的提供商测试的可选 Vitest HTTP/身份验证 mock |
    | `plugin-sdk/test-fixtures` | 通用 CLI 运行时捕获、沙箱上下文、Skill 写入器、智能体消息、系统事件、模块重载、内置插件路径、终端文本、分块、身份验证令牌和类型化用例夹具 |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 内置 mock 辅助工具，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 用于管理器/配置/文件/CLI 辅助工具的内置 memory-core 辅助工具表面 |
    | `plugin-sdk/memory-core-engine-runtime` | 记忆索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | 记忆宿主密钥辅助工具 |
    | `plugin-sdk/memory-core-host-events` | 记忆宿主事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | 记忆宿主 Status 辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-events` | 记忆宿主事件日志辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-files` | 记忆宿主文件/运行时辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-markdown` | 用于记忆相邻插件的共享托管 markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于 search-manager 访问的主动记忆运行时外观 |
    | `plugin-sdk/memory-host-status` | 记忆宿主 Status 辅助工具的厂商中立别名 |
  </Accordion>

  <Accordion title="保留的内置辅助工具子路径">
    当前没有保留的内置辅助工具 SDK 子路径。所有者特定的
    辅助工具位于所属插件包内，而可复用的宿主契约
    使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
