---
read_when:
    - 为插件导入选择合适的 plugin-sdk 子路径
    - 审查内置插件子路径和辅助接口 surface
summary: 插件 SDK 子路径目录：按领域分组，哪些导入位于何处
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-04-27T23:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb4fdb61b69fc045b6ba94efe8430e761812e2e21dea9abac653b527ad11f195
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  插件 SDK 通过 `openclaw/plugin-sdk/` 下的一组精简子路径对外暴露。
  本页按用途对常用子路径进行归类。生成的完整列表包含 200 多个子路径，位于 `scripts/lib/plugin-sdk-entrypoints.json`；其中也包含保留给内置插件辅助工具的子路径，但除非某个文档页面明确推荐，否则它们都属于实现细节。

  关于插件编写指南，请参阅 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

  ## 插件入口

  | 子路径                         | 关键导出                                                                                                                                               |
  | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                    |
  | `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                 |
  | `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                       |
  | `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                      |
  | `plugin-sdk/testing`           | 公共插件测试夹具、提供商注册/目录辅助工具、向导契约钩子，以及内置插件契约维护辅助工具                                                                  |
  | `plugin-sdk/migration`         | 迁移提供商条目辅助工具，例如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助工具，以及 `summarizeMigrationItems`                               |
  | `plugin-sdk/migration-runtime` | 运行时迁移辅助工具，例如 `copyMigrationFileItem` 和 `writeMigrationReport`                                                                              |

  <AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账号配置/操作门控辅助工具、默认账号回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账号 ID 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账号查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 精简的账号列表/账号操作辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 共享渠道配置 schema 原语和通用构建器 |
    | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置渠道配置 schema，仅为保持内置兼容性而保留 |
    | `plugin-sdk/telegram-command-config` | 带内置契约回退的 Telegram 自定义命令规范化/校验辅助工具 |
    | `plugin-sdk/command-gating` | 精简的命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/最终化辅助工具 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + envelope 构建辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录与派发辅助工具 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-send-deps` | 面向渠道适配器的轻量级出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站投递、身份、发送委托、会话、格式化和载荷规划辅助工具 |
    | `plugin-sdk/poll-runtime` | 精简的投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道 Status 快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 精简的渠道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist 配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享直接私信认证/守卫辅助工具 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、投递和旧版交互式回复辅助工具。参见 [消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 面向入站去抖动、提及匹配、提及策略辅助工具和 envelope 辅助工具的兼容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 精简的入站去抖动辅助工具 |
    | `plugin-sdk/channel-mention-gating` | 精简的提及策略、提及标记和提及文本辅助工具，不包含更宽泛的入站运行时接口 |
    | `plugin-sdk/channel-envelope` | 精简的入站 envelope 格式化辅助工具 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助工具 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和 typing/ack 失败的渠道日志辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应连线 |
    | `plugin-sdk/channel-secret-runtime` | 精简的 secret 契约辅助工具，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及 secret 目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 受支持的 LM Studio 提供商门面，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 受支持的 LM Studio 运行时门面，用于本地服务器默认值、模型发现、请求头和已加载模型辅助工具 |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 兼容自托管提供商的设置辅助工具 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 面向提供商插件的运行时 API key 解析辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/配置文件写入辅助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-auth-login` | 面向提供商插件的共享交互式登录辅助工具 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy 构建器、提供商端点辅助工具，以及诸如 `normalizeNativeXaiModelId` 之类的模型 ID 规范化辅助工具 |
    | `plugin-sdk/provider-catalog-runtime` | 用于契约测试的提供商目录运行时钩子和插件提供商注册表接口 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助工具、提供商 HTTP 错误，以及音频转录 multipart form 辅助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精简的 web-fetch 配置/选择契约辅助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | web-fetch 提供商注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 面向不需要插件启用连线的提供商的精简 web-search 配置/凭证辅助工具 |
    | `plugin-sdk/provider-web-search-contract` | 精简的 web-search 配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及作用域化凭证 setter/getter |
    | `plugin-sdk/provider-web-search` | web-search 提供商注册/缓存/运行时辅助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及诸如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 之类的 xAI 兼容辅助工具 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似导出 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助工具，例如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助工具 |
    | `plugin-sdk/group-activation` | 精简的群组激活模式和命令解析辅助工具 |
  </Accordion>

  <Accordion title="认证与安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助工具（包括动态参数菜单格式化）、发送者授权辅助工具 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天操作认证辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 面向热渠道入口点的轻量级原生审批适配器加载辅助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更宽泛的审批处理器运行时辅助工具；若更精简的 adapter/gateway 接口已足够，优先使用后者 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账号绑定辅助工具 |
    | `plugin-sdk/approval-reply-runtime` | exec/插件审批回复载荷辅助工具 |
    | `plugin-sdk/approval-runtime` | exec/插件审批载荷辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示辅助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精简的入站回复去重重置辅助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含宽泛 testing barrel 的精简渠道契约测试辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化和原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-primitives-runtime` | 面向热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令主体规范化和命令接口辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向渠道/插件 secret 接口的精简 secret 契约收集辅助工具 |
    | `plugin-sdk/secret-ref-runtime` | 面向 secret 契约/配置解析的精简 `coerceSecretRef` 和 SecretRef 类型辅助工具 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容、敏感文本脱敏、常量时间 secret 比较和 secret 收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含宽泛 infra 运行时接口的精简固定 dispatcher 辅助工具 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、受 SSRF 保护的 fetch、SSRF 错误和 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | secret 输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | webhook 请求/目标辅助工具，以及原始 websocket/body 强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时与存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时/日志/备份/插件安装辅助工具 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、logger、超时、重试和退避辅助工具 |
    | `plugin-sdk/browser-config` | 受支持的浏览器配置门面，用于规范化配置文件/默认值、CDP URL 解析和浏览器控制认证辅助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令/钩子/http/交互式辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部钩子流水线辅助工具 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和惰性命令组辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端、Gateway 网关 CLI RPC、Gateway 网关协议错误，以及渠道 Status 补丁辅助工具 |
    | `plugin-sdk/config-types` | 面向插件配置形状的仅类型配置接口，例如 `OpenClawConfig` 以及渠道/提供商配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时插件配置查找辅助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务型配置变更辅助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化，以及重复/冲突检查，即使内置 Telegram 契约接口不可用时也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不含宽泛 text-runtime barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | exec/插件审批辅助工具、审批能力构建器、认证/配置文件辅助工具、原生路由/运行时辅助工具，以及结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助工具、分块、派发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复派发/最终化和会话标签辅助工具 |
    | `plugin-sdk/reply-history` | 共享的短窗口回复历史辅助工具和标记，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径、会话键、更新时间和存储变更辅助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助工具 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账号绑定辅助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账号 Status 摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带超时的命令运行器，返回规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化载荷 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范的发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/会话覆盖辅助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供商配置解析辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复派发辅助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的智能体运行时配置 schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助工具 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、Status 和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表构建/序列化辅助工具 |
    | `plugin-sdk/agent-harness` | 面向低层 Agent harnesses 的实验性受信任插件接口：harness 类型、活动运行 steer/abort 辅助工具、OpenClaw 工具桥接辅助工具、运行时计划工具策略辅助工具、终端结果分类、工具进度格式化/细节辅助工具，以及尝试结果工具函数 |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I 端点检测辅助工具 |
    | `plugin-sdk/async-lock-runtime` | 面向小型运行时状态文件的进程本地异步锁辅助工具 |
    | `plugin-sdk/channel-activity-runtime` | 渠道活动遥测辅助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助工具 |
    | `plugin-sdk/dedupe-runtime` | 内存去重缓存辅助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待投递清空辅助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体源路径辅助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳事件和可见性辅助工具 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助工具 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助工具 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助工具 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性 shim；请使用上面更聚焦的运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和 trace-context 辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封装的 fetch、代理和固定查找辅助工具 |
    | `plugin-sdk/runtime-fetch` | 不含代理/受保护 fetch 导入的 dispatcher 感知型运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不含宽泛媒体运行时接口的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不含宽泛配置写入/维护导入的会话存储辅助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不含宽泛配置/安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不含 markdown/日志导入的精简原始记录/字符串强制转换和规范化辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具，以及媒体载荷构建器 |
    | `plugin-sdk/media-store` | 精简的媒体存储辅助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成功能故障切换辅助工具、候选项选择和缺失模型提示消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助工具导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助工具，例如剥离对助手可见的文本、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive tag 辅助工具和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | Speech 提供商类型，以及面向提供商的 directive、注册表、校验和 speech 辅助工具导出 |
    | `plugin-sdk/speech-core` | 共享 Speech 提供商类型、注册表、directive、规范化和 speech 辅助工具导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助工具和共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障切换、认证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障切换辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障切换辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | 公共扩展测试辅助工具，包括插件注册表/运行时 mock、提供商注册捕获、设置向导辅助工具、fetch/env/temp/time 夹具、schema/媒体/live-test 辅助工具、`installCommonResolveTargetErrorCases`、`writeSkill`、`createTestRegistry` 和 live generation 环境加载。扩展 `*.test-support.ts` 辅助工具应保留在此路径或更聚焦的 SDK 子路径中，而不是核心内部实现 |
  </Accordion>

  <Accordion title="记忆子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助接口，用于 manager/config/file/CLI 辅助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | 记忆索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主 embedding 契约、注册表访问、本地提供商和通用批处理/远程辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | 记忆宿主 secret 辅助工具 |
    | `plugin-sdk/memory-core-host-events` | 记忆宿主事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | 记忆宿主 Status 辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 面向供应商中立的记忆宿主核心运行时辅助工具别名 |
    | `plugin-sdk/memory-host-events` | 面向供应商中立的记忆宿主事件日志辅助工具别名 |
    | `plugin-sdk/memory-host-files` | 面向供应商中立的记忆宿主文件/运行时辅助工具别名 |
    | `plugin-sdk/memory-host-markdown` | 面向与记忆相关插件的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于访问搜索管理器的活动记忆运行时门面 |
    | `plugin-sdk/memory-host-status` | 面向供应商中立的记忆宿主 Status 辅助工具别名 |
    | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助接口 |
  </Accordion>

  <Accordion title="保留的内置辅助工具子路径">
    | 家族 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 内置浏览器插件支持辅助工具。`browser-profiles` 导出 `resolveBrowserConfig`、`resolveProfile`、`ResolvedBrowserConfig`、`ResolvedBrowserProfile` 和 `ResolvedBrowserTabCleanupConfig`，用于规范化后的 `browser.tabCleanup` 形状。`browser-support` 仍是兼容性 barrel。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助工具/运行时接口 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 内置 LINE 辅助工具/运行时接口 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 内置 IRC 辅助接口 |
    | 渠道专用辅助工具 | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | 已弃用的内置渠道兼容性/辅助工具接口。新插件应导入通用 SDK 子路径或插件本地 barrel。 |
    | 认证/插件专用辅助工具 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 内置功能/插件辅助工具接口；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
