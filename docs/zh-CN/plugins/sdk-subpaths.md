---
read_when:
    - 为插件导入选择正确的 plugin-sdk 子路径
    - 审计内置插件子路径和辅助接口
summary: 插件 SDK 子路径目录：哪些导入位于何处，按领域分组
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-04-29T15:39:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2b2cb0880317d4bd3fa7c1803afc119d500b3f8ae3c5d444839c9d4d7633b80
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  插件 SDK 以 `openclaw/plugin-sdk/` 下的一组窄子路径形式暴露。
  本页按用途对常用子路径进行分组编目。生成的
  200+ 个子路径完整列表位于 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的内置插件帮助器子路径会出现在其中，但除非某个文档页面明确推荐，
  否则它们属于实现细节。维护者可以使用 `pnpm plugins:boundary-report:summary`
  审计当前活跃的保留帮助器子路径；未使用的保留帮助器导出会使 CI 报告失败，
  而不是作为休眠的兼容性债务留在公共 SDK 中。

  插件编写指南见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

  ## 插件入口

  | 子路径                                    | 关键导出                                                                                                                                                                     |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 面向旧版插件测试的宽兼容性 barrel；新的扩展测试应优先使用聚焦的测试子路径                                                                                                    |
  | `plugin-sdk/plugin-test-api`              | 用于直接插件注册单元测试的最小 `OpenClawPluginApi` mock 构建器                                                                                                               |
  | `plugin-sdk/agent-runtime-test-contracts` | 用于鉴权配置、递送抑制、回退分类、工具钩子、提示词覆盖层、schema 和转录修复的原生智能体运行时适配器契约夹具                                                                  |
  | `plugin-sdk/channel-test-helpers`         | 渠道账号生命周期、目录、发送配置、运行时 mock、钩子、内置渠道入口、信封时间戳、配对回复和通用渠道契约测试帮助器                                                              |
  | `plugin-sdk/channel-target-testing`       | 共享的渠道目标解析错误用例测试套件                                                                                                                                           |
  | `plugin-sdk/plugin-test-contracts`        | 插件注册、包清单、公共产物、运行时 API、导入副作用和直接导入契约帮助器                                                                                                       |
  | `plugin-sdk/plugin-test-runtime`          | 用于测试的插件运行时、注册表、提供商注册、设置向导和运行时任务流夹具                                                                                                         |
  | `plugin-sdk/provider-test-contracts`      | 提供商运行时、鉴权、设备发现、新手引导、目录、媒体能力、重放策略、实时 STT 实时音频、Web 搜索/抓取和向导契约帮助器                                                           |
  | `plugin-sdk/provider-http-test-mocks`     | 面向会执行 `plugin-sdk/provider-http` 的提供商测试的可选 Vitest HTTP/鉴权 mock                                                                                                |
  | `plugin-sdk/test-env`                     | 测试环境、fetch/网络、一次性 HTTP 服务器、传入请求、实时测试、临时文件系统和时间控制夹具                                                                                     |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、沙箱、skill、智能体消息、系统事件、模块重载、内置插件路径、终端、分块、鉴权令牌和类型化用例测试夹具                                                                |
  | `plugin-sdk/test-node-mocks`              | 用于 Vitest `vi.mock("node:*")` 工厂内部的聚焦 Node 内置 mock 帮助器                                                                                                          |
  | `plugin-sdk/migration`                    | 迁移提供商条目帮助器，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏帮助器和 `summarizeMigrationItems`                                                             |
  | `plugin-sdk/migration-runtime`            | 运行时迁移帮助器，例如 `copyMigrationFileItem` 和 `writeMigrationReport`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享的设置向导帮助器、allowlist 提示词、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控帮助器、默认账号回退帮助器 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`，账号 ID 规范化帮助器 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退帮助器 |
    | `plugin-sdk/account-helpers` | 窄账号列表/账号操作帮助器 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置 schema 原语和通用构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅面向受维护内置插件的内置 OpenClaw 渠道配置 schema |
    | `plugin-sdk/channel-config-schema-legacy` | 内置渠道配置 schema 的已弃用兼容性别名 |
    | `plugin-sdk/telegram-command-config` | 带内置契约回退的 Telegram 自定义命令规范化/验证帮助器 |
    | `plugin-sdk/command-gating` | 窄命令授权门控帮助器 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`，草稿流生命周期/完成帮助器 |
    | `plugin-sdk/inbound-envelope` | 共享的入站路由 + 信封构建器帮助器 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享的入站记录并分发帮助器 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配帮助器 |
    | `plugin-sdk/outbound-media` | 共享的出站媒体加载帮助器 |
    | `plugin-sdk/outbound-send-deps` | 渠道适配器的轻量出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站递送、身份、发送委托、会话、格式化和载荷规划帮助器 |
    | `plugin-sdk/poll-runtime` | 窄投票规范化帮助器 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器帮助器 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定帮助器 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照帮助器 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析帮助器 |
    | `plugin-sdk/channel-status` | 共享渠道 Status 快照/摘要帮助器 |
    | `plugin-sdk/channel-config-primitives` | 窄渠道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权帮助器 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist 配置编辑/读取帮助器 |
    | `plugin-sdk/group-access` | 共享群组访问决策帮助器 |
    | `plugin-sdk/direct-dm` | 共享直接私信鉴权/守卫帮助器 |
    | `plugin-sdk/discord` | 面向已发布的 `@openclaw/discord@2026.3.13` 和跟踪所有者兼容性的已弃用 Discord 兼容性 facade；新插件应使用通用渠道 SDK 子路径 |
    | `plugin-sdk/telegram-account` | 面向跟踪所有者兼容性的已弃用 Telegram 账号解析兼容性 facade；新插件应使用注入的运行时帮助器或通用渠道 SDK 子路径 |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、递送和旧版交互式回复帮助器。见 [Message Presentation](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及匹配、提及策略帮助器和信封帮助器的兼容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 窄入站防抖帮助器 |
    | `plugin-sdk/channel-mention-gating` | 不包含更宽入站运行时表面的窄提及策略、提及标记和提及文本帮助器 |
    | `plugin-sdk/channel-envelope` | 窄入站信封格式化帮助器 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化帮助器 |
    | `plugin-sdk/channel-logging` | 入站丢弃和 typing/ack 失败的渠道日志帮助器 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作帮助器，以及为插件兼容性保留的已弃用原生 schema 帮助器 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/紧凑路由键、已解析目标类型和路由/目标比较帮助器 |
    | `plugin-sdk/channel-targets` | 目标解析帮助器；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/reaction 接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄密钥契约帮助器，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 和密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 受支持的 LM Studio 提供商门面，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 受支持的 LM Studio 运行时门面，用于本地服务器默认值、模型发现、请求标头和已加载模型助手 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置助手 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦于兼容 OpenAI 的自托管提供商设置助手 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API 密钥解析助手 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥新手引导/配置文件写入助手，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件的共享交互式登录助手 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找助手 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共享重放策略构建器、提供商端点助手，以及模型 ID 规范化助手，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 提供商目录增强运行时钩子，以及用于契约测试的插件提供商注册表接缝 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力助手、提供商 HTTP 错误，以及音频转录 multipart 表单助手 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄作用域的 Web fetch 配置/选择契约助手，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web fetch 提供商注册/缓存助手 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用接线的提供商的窄作用域 Web 搜索配置/凭证助手 |
    | `plugin-sdk/provider-web-search-contract` | 窄作用域的 Web 搜索配置/凭证契约助手，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及限定作用域的凭证设置器/获取器 |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/运行时助手 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + 诊断，以及 xAI 兼容助手，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似项 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器助手 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输助手，例如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁助手 |
    | `plugin-sdk/global-singleton` | 进程本地单例/map/缓存助手 |
    | `plugin-sdk/group-activation` | 窄作用域的群组激活模式和命令解析助手 |
  </Accordion>

  <Accordion title="认证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`，命令注册表助手，包括动态参数菜单格式化、发送者授权助手 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同一聊天操作认证助手 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器助手 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析助手 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 面向热渠道入口点的轻量级原生审批适配器加载助手 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理器运行时助手；当更窄的适配器/Gateway 网关接缝足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定助手 |
    | `plugin-sdk/approval-reply-runtime` | Exec/插件审批回复载荷助手 |
    | `plugin-sdk/approval-runtime` | Exec/插件审批载荷助手、原生审批路由/运行时助手，以及结构化审批显示助手，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 窄作用域的入站回复去重重置助手 |
    | `plugin-sdk/channel-contract-testing` | 不含宽泛测试 barrel 的窄作用域渠道契约测试助手 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化，以及原生会话目标助手 |
    | `plugin-sdk/command-detection` | 共享命令检测助手 |
    | `plugin-sdk/command-primitives-runtime` | 面向热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面助手 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向渠道/插件密钥表面的窄作用域密钥契约收集助手 |
    | `plugin-sdk/secret-ref-runtime` | 面向密钥契约/配置解析的窄作用域 `coerceSecretRef` 和 SecretRef 类型助手 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容、敏感文本遮蔽、常量时间密钥比较和密钥收集助手 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和专用网络 SSRF 策略助手 |
    | `plugin-sdk/ssrf-dispatcher` | 不含宽泛基础设施运行时表面的窄作用域固定 dispatcher 助手 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、受 SSRF 保护的 fetch、SSRF 错误和 SSRF 策略助手 |
    | `plugin-sdk/secret-input` | 密钥输入解析助手 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标助手，以及原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时助手 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时/日志记录/备份/插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、日志器、超时、重试和退避辅助函数 |
    | `plugin-sdk/browser-config` | 支持的浏览器配置门面，用于规范化配置文件/默认值、CDP URL 解析和浏览器控制鉴权辅助函数 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享的插件命令/钩子/http/交互式辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享的 webhook/内部钩子流水线辅助函数 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和惰性命令组辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、事件循环就绪客户端启动辅助函数、Gateway 网关 CLI RPC、Gateway 网关协议错误和渠道状态补丁辅助函数 |
    | `plugin-sdk/config-types` | 插件配置形状的仅类型配置表面，例如 `OpenClawConfig` 以及渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助函数，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助函数，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照设置器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 合约表面不可用也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 无需宽泛 text-runtime 桶即可进行文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | 执行/插件审批辅助函数、审批能力构建器、鉴权/配置文件辅助函数、原生路由/运行时辅助函数，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享的入站/回复运行时辅助函数、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复分发/完成和对话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享的短窗口回复历史辅助函数和标记，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本/Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径、会话键、更新时间和存储变更辅助函数 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助函数 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由/会话键/账号绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享的渠道/账号状态摘要辅助函数、运行时状态默认值和问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享的目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带规范化 stdout/stderr 结果的定时命令运行器 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化载荷 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享的临时下载路径辅助函数 |
    | `plugin-sdk/logging-core` | 子系统日志器和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型/会话覆盖辅助函数，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复分发辅助函数 |
    | `plugin-sdk/acp-runtime-backend` | 面向启动时加载插件的轻量级 ACP 后端注册和回复分发辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 无生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的智能体运行时配置架构原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享的被动渠道、Status 和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向底层智能体 harness 的实验性受信插件表面：harness 类型、活动运行引导/中止辅助函数、OpenClaw 工具桥接辅助函数、运行时计划工具策略辅助函数、终端结果分类、工具进度格式化/详情辅助函数和尝试结果工具函数 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测辅助函数 |
    | `plugin-sdk/async-lock-runtime` | 用于小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存中去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待处理投递排空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | 心跳事件和可见性辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性垫片；请使用上面的聚焦运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和跟踪上下文辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装后的 fetch、代理、EnvHttpProxyAgent 选项和固定查找辅助函数 |
    | `plugin-sdk/runtime-fetch` | 支持 Dispatcher 的运行时 fetch，无代理/受保护 fetch 导入 |
    | `plugin-sdk/response-limit-runtime` | 有界响应正文读取器，无宽泛媒体运行时表面 |
    | `plugin-sdk/session-binding-runtime` | 当前对话绑定状态，无配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 会话存储辅助函数，无宽泛配置写入/维护导入 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文过滤，无宽泛配置/安全导入 |
    | `plugin-sdk/string-coerce-runtime` | 精简的原始记录/字符串强制转换和规范化辅助函数，无 Markdown/日志记录导入 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助函数 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具、由 ffprobe 支持的视频尺寸探测，以及媒体载荷构建器 |
    | `plugin-sdk/media-store` | 窄范围媒体存储辅助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选项选择，以及缺失模型提示消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助工具，例如剥离智能体可见文本、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、指令标签辅助工具，以及安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音辅助导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化和语音辅助导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助工具，以及共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型，以及图像资产/data URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、身份验证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、提供商查找，以及模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、提供商查找，以及模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | 面向旧版插件测试的宽兼容性汇总入口。新的插件测试应改为导入聚焦的 SDK 子路径，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 辅助工具，用于不导入仓库测试辅助桥接的直接插件注册单元测试 |
    | `plugin-sdk/agent-runtime-test-contracts` | 用于身份验证、投递、回退、工具钩子、提示词覆盖、schema 和转录投影测试的原生智能体运行时适配器契约固件 |
    | `plugin-sdk/channel-test-helpers` | 面向渠道的测试辅助工具，用于通用操作/设置/Status 契约、目录断言、账号启动生命周期、发送配置线程化、运行时 mock、Status 问题、出站投递和钩子注册 |
    | `plugin-sdk/channel-target-testing` | 用于渠道测试的共享目标解析错误案例套件 |
    | `plugin-sdk/plugin-test-contracts` | 插件包、注册、公开构件、直接导入、运行时 API 和导入副作用契约辅助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供商运行时、身份验证、设备发现、新手引导、目录、向导、媒体能力、重放策略、实时 STT 现场音频、Web 搜索/获取和流契约辅助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 面向测试 `plugin-sdk/provider-http` 的提供商测试的可选 Vitest HTTP/身份验证 mock |
    | `plugin-sdk/test-fixtures` | 通用 CLI 运行时捕获、沙箱上下文、skill 写入器、智能体消息、系统事件、模块重新加载、内置插件路径、终端文本、分块、身份验证令牌和类型化用例固件 |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 内置 mock 辅助工具，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 面向管理器/配置/文件/CLI 辅助工具的内置 memory-core 辅助表面 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存宿主 foundation 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存宿主嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存宿主多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | 内存宿主查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | 内存宿主密钥辅助工具 |
    | `plugin-sdk/memory-core-host-events` | 内存宿主事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | 内存宿主 Status 辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存宿主 CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存宿主核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存宿主文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 内存宿主核心运行时辅助工具的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 内存宿主事件日志辅助工具的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 内存宿主文件/运行时辅助工具的供应商中立别名 |
    | `plugin-sdk/memory-host-markdown` | 面向内存相邻插件的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于 search-manager 访问的活动内存运行时门面 |
    | `plugin-sdk/memory-host-status` | 内存宿主 Status 辅助工具的供应商中立别名 |
  </Accordion>

  <Accordion title="预留的内置辅助工具子路径">
    目前没有预留的内置辅助工具 SDK 子路径。所有者特定的
    辅助工具位于所属插件包内，而可复用的宿主契约
    使用通用 SDK 子路径，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
