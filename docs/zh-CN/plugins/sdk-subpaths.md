---
read_when:
    - 为插件导入选择正确的 plugin-sdk 子路径
    - 审查内置插件子路径和辅助接口
summary: 插件 SDK 子路径目录：按领域分组，说明各导入项分别位于何处
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-04-28T00:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6ad6676f134169657efbd160ec57018090b02325ea95262f493ccb1d2648d5b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  插件 SDK 通过 `openclaw/plugin-sdk/` 下的一组窄子路径公开。
  本页按用途分组，编目列出常用子路径。完整的 200+ 子路径生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`；其中也会出现为内置插件保留的辅助子路径，但除非某个文档页面明确将其提升为公开接口，否则它们都属于实现细节。

  关于插件编写指南，参见[插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

  ## 插件入口

  | 子路径 | 关键导出 |
  | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry` | `definePluginEntry` |
  | `plugin-sdk/core` | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/testing` | 公共插件测试夹具、提供商注册/目录辅助函数、向导契约钩子，以及内置插件契约维护辅助函数 |
  | `plugin-sdk/plugin-test-api` | 用于直接插件注册单元测试的最小 `OpenClawPluginApi` mock 构建器 |
  | `plugin-sdk/channel-test-helpers` | 渠道账户生命周期、目录、发送配置、运行时 mock，以及钩子测试辅助函数 |
  | `plugin-sdk/plugin-test-contracts` | 插件注册、包清单、公共产物、运行时 API、导入副作用，以及直接导入契约辅助函数 |
  | `plugin-sdk/plugin-test-runtime` | 用于测试的插件运行时、注册表、提供商注册、设置向导和运行时任务流夹具 |
  | `plugin-sdk/provider-test-contracts` | 提供商运行时、认证、发现、新手引导、目录、Web 搜索/抓取，以及向导契约辅助函数 |
  | `plugin-sdk/test-env` | 测试环境、抓取/网络、实时测试、临时文件系统和时间控制夹具 |
  | `plugin-sdk/test-fixtures` | 通用 CLI、沙箱、Skills、智能体消息、系统事件、终端、分块、认证令牌和带类型用例测试夹具 |
  | `plugin-sdk/migration` | 迁移提供商条目辅助函数，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助函数以及 `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime` | 运行时迁移辅助函数，例如 `copyMigrationFileItem` 和 `writeMigrationReport` |

  <AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助函数、允许列表提示和设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控辅助函数、默认账户回退辅助函数 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化辅助函数 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助函数 |
    | `plugin-sdk/account-helpers` | 窄化的账户列表/账户操作辅助函数 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置 schema 基元和通用构建器 |
    | `plugin-sdk/channel-config-schema-legacy` | 仅为内置兼容性保留的已弃用内置渠道配置 schema |
    | `plugin-sdk/telegram-command-config` | 带有内置契约回退的 Telegram 自定义命令规范化/校验辅助函数 |
    | `plugin-sdk/command-gating` | 窄化的命令授权门控辅助函数 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/最终化辅助函数 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 信封构建辅助函数 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录与分发辅助函数 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助函数 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助函数 |
    | `plugin-sdk/outbound-send-deps` | 供渠道适配器使用的轻量级出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站投递、身份、发送委托、会话、格式化和负载规划辅助函数 |
    | `plugin-sdk/poll-runtime` | 窄化的投票规范化辅助函数 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助函数 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助函数 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助函数 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助函数 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助函数 |
    | `plugin-sdk/channel-config-primitives` | 窄化的渠道配置 schema 基元 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助函数 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助函数 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助函数 |
    | `plugin-sdk/direct-dm` | 共享私信认证/保护辅助函数 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、投递和旧版交互式回复辅助函数。参见[消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站去抖、提及匹配、提及策略辅助函数和信封辅助函数的兼容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 窄化的入站去抖辅助函数 |
    | `plugin-sdk/channel-mention-gating` | 不含更广泛入站运行时接口的窄化提及策略、提及标记和提及文本辅助函数 |
    | `plugin-sdk/channel-envelope` | 窄化的入站信封格式化辅助函数 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助函数 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和 typing/ack 失败的渠道日志辅助函数 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助函数，以及为插件兼容性保留的已弃用原生 schema 辅助函数 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/紧凑路由键、解析后目标类型，以及路由/目标比较辅助函数 |
    | `plugin-sdk/channel-targets` | 目标解析辅助函数；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄化的密钥契约辅助函数，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 以及密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 受支持的 LM Studio 提供商外观层，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 受支持的 LM Studio 运行时外观层，用于本地服务器默认值、模型发现、请求头和已加载模型辅助函数 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 面向 OpenAI 兼容自托管提供商的专用设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 面向提供商插件的运行时 API 密钥解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥新手引导/配置文件写入辅助函数，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-auth-login` | 面向提供商插件的共享交互式登录辅助函数 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay 策略构建器、提供商端点辅助函数，以及诸如 `normalizeNativeXaiModelId` 之类的模型 ID 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-runtime` | 用于契约测试的提供商目录运行时钩子和插件提供商注册表扩展点 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP / 端点能力辅助函数、提供商 HTTP 错误，以及音频转录 multipart form 辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄化的 Web 抓取配置/选择契约辅助函数，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web 抓取提供商注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用接线的提供商的窄化 Web 搜索配置/凭证辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 窄化的 Web 搜索配置/凭证契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及作用域化凭证 setter/getter |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/运行时辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及诸如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 之类的 xAI 兼容辅助函数 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似内容 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic / Bedrock / DeepSeek V4 / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助函数，例如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton / map / 缓存辅助函数 |
    | `plugin-sdk/group-activation` | 窄化的群组激活模式和命令解析辅助函数 |
  </Accordion>

  <Accordion title="认证与安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助函数（包括动态参数菜单格式化）、发送者授权辅助函数 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天 action-auth 辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 面向高频渠道入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 范围更广的审批处理器运行时辅助函数；如果更窄的 adapter / gateway 扩展点已足够，应优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | exec / 插件审批回复负载辅助函数 |
    | `plugin-sdk/approval-runtime` | exec / 插件审批负载辅助函数、原生审批路由/运行时辅助函数，以及结构化审批显示辅助函数，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 窄化的入站回复去重重置辅助函数 |
    | `plugin-sdk/channel-contract-testing` | 不包含宽泛 testing barrel 的窄化渠道契约测试辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化和原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 面向高频渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令主体规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向渠道/插件密钥表面的窄化密钥契约收集辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 面向密钥契约/配置解析的窄化 `coerceSecretRef` 和 SecretRef 类型辅助函数 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容、敏感文本脱敏、常量时间密钥比较和密钥收集辅助函数 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不包含宽泛基础设施运行时接口的窄化固定 dispatcher 辅助函数 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、带 SSRF 防护的 fetch、SSRF 错误和 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | webhook 请求/目标辅助函数，以及原始 websocket / body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助函数 |
  </Accordion>

  <Accordion title="运行时与存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时 / 日志 / 备份 / 插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 窄化的运行时环境、logger、超时、重试和退避辅助函数 |
    | `plugin-sdk/browser-config` | 受支持的浏览器配置外观层，用于规范化配置文件/默认值、CDP URL 解析和浏览器控制认证辅助函数 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令 / 钩子 / HTTP / 交互式辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享 webhook / 内部钩子流水线辅助函数 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和惰性命令组辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、Gateway 网关 CLI RPC、Gateway 网关协议错误以及渠道状态补丁辅助函数 |
    | `plugin-sdk/config-types` | 仅类型的配置接口，用于插件配置形状，例如 `OpenClawConfig` 以及渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助函数，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助函数，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 契约接口不可用时也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖宽泛 text-runtime barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | exec / 插件审批辅助函数、审批能力构建器、认证/配置文件辅助函数、原生路由/运行时辅助函数，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助函数、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄化的回复分发/最终化和对话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助函数和标记，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄化的文本 / Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径、会话键、更新时间以及存储变更辅助函数 |
    | `plugin-sdk/cron-store-runtime` | cron 存储路径 / 加载 / 保存辅助函数 |
    | `plugin-sdk/state-paths` | 状态 / OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由 / 会话键 / 账户绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道 / 账户 Status 摘要辅助函数、运行时状态默认值和问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | slug / 字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch / request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带定时功能的命令运行器，返回规范化的 stdout / stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具 / CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范化的发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助函数 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型 / 会话覆盖辅助函数，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | talk 提供商配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时 / 会话和回复分发辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不引入生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 窄化的智能体运行时 config-schema 基元 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、Status 和环境代理辅助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令 / 提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表构建 / 序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向受信任插件的实验性低层 Agent harness 接口：harness 类型、活动运行 steer / abort 辅助函数、OpenClaw 工具桥接辅助函数、运行时计划工具策略辅助函数、终端结果分类、工具进度格式化 / 详情辅助函数以及尝试结果工具函数 |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I 端点检测辅助函数 |
    | `plugin-sdk/async-lock-runtime` | 面向小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待投递清空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | 心跳事件和可见性辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌 / UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性 shim；请改用上面更聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和 trace 上下文辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装后的 fetch、代理和固定查找辅助函数 |
    | `plugin-sdk/runtime-fetch` | 不引入代理 / 受保护 fetch 导入的、感知 dispatcher 的运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不依赖宽泛 media-runtime 接口的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前对话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不引入宽泛配置写入 / 维护导入的会话存储辅助函数 |
    | `plugin-sdk/context-visibility-runtime` | 不引入宽泛配置 / 安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不依赖 markdown / logging 导入的窄化原始值 record / 字符串强制转换和规范化辅助函数 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录 / 身份 / Agent 工作区辅助函数 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询 / 去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体抓取 / 转换 / 存储辅助函数，以及媒体负载构建器 |
    | `plugin-sdk/media-store` | 窄化的媒体存储辅助函数，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障切换辅助函数、候选项选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像 / 音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享文本 / Markdown / 日志辅助函数，例如助手可见文本剥离、Markdown 渲染 / 分块 / 表格辅助函数、脱敏辅助函数、指令标签辅助函数和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助函数 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的指令、注册表、校验和语音辅助导出 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、指令、规范化和语音辅助导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助函数 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障切换、认证和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成提供商 / 请求 / 结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障切换辅助函数、提供商查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商 / 请求 / 结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障切换辅助函数、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | webhook 路径规范化辅助函数 |
    | `plugin-sdk/web-media` | 共享远程 / 本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | 公共扩展测试辅助函数，包括插件注册表 / 运行时 mock、提供商注册捕获、设置向导辅助函数、fetch / env / 临时目录 / 时间夹具、schema / 媒体 / 实时测试辅助函数、`installCommonResolveTargetErrorCases`、`writeSkill`、`createTestRegistry` 以及实时生成环境加载。扩展 `*.test-support.ts` 辅助函数应保留在这里或聚焦的 SDK 子路径上，而不是核心内部实现 |
    | `plugin-sdk/plugin-test-api` | 最小 `createTestPluginApi` 辅助函数，用于直接插件注册单元测试，无需导入仓库测试辅助桥接 |
    | `plugin-sdk/channel-test-helpers` | 面向渠道的测试辅助函数，用于账户启动生命周期、目录断言、发送配置线程化、运行时 mock、Status 问题、出站投递和钩子注册 |
    | `plugin-sdk/plugin-test-contracts` | 插件包、注册、公共产物、直接导入、运行时 API 和导入副作用契约辅助函数 |
    | `plugin-sdk/provider-test-contracts` | 提供商运行时、认证、发现、新手引导、目录、向导、Web 搜索 / 抓取和流契约辅助函数 |
    | `plugin-sdk/test-fixtures` | 通用 CLI 运行时捕获、沙箱上下文、Skill 写入器、智能体消息、系统事件、终端文本、分块、认证令牌和带类型用例夹具 |
  </Accordion>

  <Accordion title="Memory 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助接口，用于管理器 / 配置 / 文件 / CLI 辅助函数 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引 / 搜索运行时外观层 |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory 主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 主机 embedding 契约、注册表访问、本地提供商和通用批处理 / 远程辅助函数 |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory 主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory 主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | Memory 主机多模态辅助函数 |
    | `plugin-sdk/memory-core-host-query` | Memory 主机查询辅助函数 |
    | `plugin-sdk/memory-core-host-secret` | Memory 主机密钥辅助函数 |
    | `plugin-sdk/memory-core-host-events` | Memory 主机事件日志辅助函数 |
    | `plugin-sdk/memory-core-host-status` | Memory 主机状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory 主机 CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory 主机核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory 主机文件 / 运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | 面向供应商中立的 Memory 主机核心运行时辅助函数别名 |
    | `plugin-sdk/memory-host-events` | 面向供应商中立的 Memory 主机事件日志辅助函数别名 |
    | `plugin-sdk/memory-host-files` | 面向供应商中立的 Memory 主机文件 / 运行时辅助函数别名 |
    | `plugin-sdk/memory-host-markdown` | 面向 Memory 相关插件的共享托管 Markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于访问搜索管理器的活动 Memory 运行时外观层 |
    | `plugin-sdk/memory-host-status` | 面向供应商中立的 Memory 主机状态辅助函数别名 |
    | `plugin-sdk/memory-lancedb` | 内置 Memory LanceDB 辅助接口 |
  </Accordion>

  <Accordion title="保留的内置辅助子路径">
    | 类别 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | 浏览器 | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 内置浏览器插件支持辅助函数。`browser-profiles` 导出 `resolveBrowserConfig`、`resolveProfile`、`ResolvedBrowserConfig`、`ResolvedBrowserProfile` 和 `ResolvedBrowserTabCleanupConfig`，用于规范化后的 `browser.tabCleanup` 形状。`browser-support` 仍保留为兼容性 barrel。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助函数 / 运行时接口 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 内置 LINE 辅助函数 / 运行时接口 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 内置 IRC 辅助接口 |
    | 渠道特定辅助函数 | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | 已弃用的内置渠道兼容性 / 辅助扩展点。新插件应导入通用 SDK 子路径或插件本地 barrel。 |
    | 认证 / 插件特定辅助函数 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 内置功能 / 插件辅助扩展点；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
