---
read_when:
    - 为插件导入选择合适的 plugin-sdk 子路径
    - 审计 bundled-plugin 子路径和辅助接口
summary: 插件 SDK 子路径目录：按领域分组说明各导入位于何处
title: 插件 SDK 子路径
x-i18n:
    generated_at: "2026-04-25T21:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fcedbb91b0b5c6ee79ee7f18c2b68867e3818b0d37e9870a1d2ef3f848f52a
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  插件 SDK 通过 `openclaw/plugin-sdk/` 下的一组精简子路径对外暴露。
  本页按用途对常用子路径进行分类整理。生成的完整列表包含 200 多个子路径，位于 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的 bundled-plugin 辅助子路径也会出现在其中，但除非某个文档页面明确将其作为公开能力介绍，否则它们属于实现细节。

  有关插件编写指南，请参见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview)。

  ## 插件入口

  | 子路径                      | 关键导出                                                                                                                                 |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                      |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                         |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                        |

  <AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根级 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享的设置向导辅助函数、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置 / 操作门控辅助函数，以及默认账户回退辅助函数 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 规范化辅助函数 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助函数 |
    | `plugin-sdk/account-helpers` | 精简的账户列表 / 账户操作辅助函数 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 渠道配置 schema 类型 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化 / 校验辅助函数，带 bundled-contract 回退 |
    | `plugin-sdk/command-gating` | 精简的命令授权门控辅助函数 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期 / 最终化辅助函数 |
    | `plugin-sdk/inbound-envelope` | 共享的入站路由 + envelope 构建辅助函数 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享的入站记录与分发辅助函数 |
    | `plugin-sdk/messaging-targets` | 目标解析 / 匹配辅助函数 |
    | `plugin-sdk/outbound-media` | 共享的出站媒体加载辅助函数 |
    | `plugin-sdk/outbound-send-deps` | 供渠道适配器使用的轻量级出站发送依赖查找 |
    | `plugin-sdk/outbound-runtime` | 出站投递、身份、发送委托、会话、格式化和载荷规划辅助函数 |
    | `plugin-sdk/poll-runtime` | 精简的投票规范化辅助函数 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期与适配器辅助函数 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 会话 / 线程绑定、配对和已配置绑定辅助函数 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助函数 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助函数 |
    | `plugin-sdk/channel-status` | 共享的渠道 Status 快照 / 摘要辅助函数 |
    | `plugin-sdk/channel-config-primitives` | 精简的渠道配置 schema 基元 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助函数 |
    | `plugin-sdk/channel-plugin-common` | 共享的渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist 配置编辑 / 读取辅助函数 |
    | `plugin-sdk/group-access` | 共享的群组访问决策辅助函数 |
    | `plugin-sdk/direct-dm` | 共享的直接私信鉴权 / 守卫辅助函数 |
    | `plugin-sdk/interactive-runtime` | 语义化消息展示、投递和旧版交互式回复辅助函数。参见 [Message Presentation](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于入站去抖动、提及匹配、提及策略辅助函数以及 envelope 辅助函数的兼容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 精简的入站去抖动辅助函数 |
    | `plugin-sdk/channel-mention-gating` | 不包含更宽泛入站运行时接口的精简提及策略和提及文本辅助函数 |
    | `plugin-sdk/channel-envelope` | 精简的入站 envelope 格式化辅助函数 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助函数 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃及 typing / ack 失败的渠道日志辅助函数 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助函数，以及为插件兼容性保留的已弃用原生 schema 辅助函数 |
    | `plugin-sdk/channel-targets` | 目标解析 / 匹配辅助函数 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈 / reaction 接线 |
    | `plugin-sdk/channel-secret-runtime` | 精简的密钥契约辅助函数，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精选的本地 / 自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 面向兼容 OpenAI 的自托管提供商的聚焦设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导 / 配置文件写入辅助函数，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth auth-result 构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件共享的交互式登录辅助函数 |
    | `plugin-sdk/provider-env-vars` | 提供商鉴权环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 辅助函数，以及诸如 `normalizeNativeXaiModelId` 之类的 model-id 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用的提供商 HTTP / endpoint 能力辅助函数、提供商 HTTP 错误，以及音频转录 multipart form 辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 精简的 web-fetch 配置 / 选择契约辅助函数，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | web-fetch 提供商注册 / 缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 适用于不需要插件启用接线的提供商的精简 web-search 配置 / 凭证辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 精简的 web-search 配置 / 凭证契约辅助函数，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及作用域凭证 setter / getter |
    | `plugin-sdk/provider-web-search` | web-search 提供商注册 / 缓存 / 运行时辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + diagnostics，以及诸如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 之类的 xAI 兼容性辅助函数 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似函数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic / Bedrock / DeepSeek V4 / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助函数，例如受保护的 fetch、传输消息转换，以及可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton / map / cache 辅助函数 |
    | `plugin-sdk/group-activation` | 精简的群组激活模式和命令解析辅助函数 |
  </Accordion>

  <Accordion title="鉴权与安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助函数（包括动态参数菜单格式化）、发送者授权辅助函数 |
    | `plugin-sdk/command-status` | 命令 / 帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天操作鉴权辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件 / 过滤器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力 / 投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享的审批 Gateway 网关解析辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 范围更广的审批处理器运行时辅助函数；如果更精简的 adapter / Gateway 网关接口已足够，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | exec / 插件审批回复载荷辅助函数 |
    | `plugin-sdk/approval-runtime` | exec / 插件审批载荷辅助函数、原生审批路由 / 运行时辅助函数，以及结构化审批展示辅助函数，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精简的入站回复去重重置辅助函数 |
    | `plugin-sdk/channel-contract-testing` | 不依赖宽泛 testing barrel 的精简渠道契约测试辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令鉴权、动态参数菜单格式化以及原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享的命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 用于热渠道路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令接口辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用于渠道 / 插件密钥接口的精简密钥契约收集辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 用于密钥契约 / 配置解析的精简 `coerceSecretRef` 和 `SecretRef` 类型辅助函数 |
    | `plugin-sdk/security-runtime` | 共享的信任、私信门控、外部内容和密钥收集辅助函数 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不依赖宽泛基础设施运行时接口的精简 pinned-dispatcher 辅助函数 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、带 SSRF 防护的 fetch，以及 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | webhook 请求 / 目标辅助函数 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小 / 超时辅助函数 |
  </Accordion>

  <Accordion title="运行时与存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 范围广泛的运行时 / 日志 / 备份 / 插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 精简的运行时环境、logger、超时、重试和退避辅助函数 |
    | `plugin-sdk/channel-runtime-context` | 通用的渠道运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享的插件命令 / hook / HTTP / 交互式辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享的 webhook / 内部 hook 管道辅助函数 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入 / 绑定辅助函数，例如 `createLazyRuntimeModule`, `createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用以及延迟命令组辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端和渠道 Status 补丁辅助函数 |
    | `plugin-sdk/config-runtime` | 配置加载 / 写入辅助函数，以及插件配置查找辅助函数 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称 / 描述规范化及重复 / 冲突检查，即使 bundled Telegram 契约接口不可用时也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖宽泛 `text-runtime` barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | exec / 插件审批辅助函数、审批能力构建器、鉴权 / 配置文件辅助函数、原生路由 / 运行时辅助函数，以及结构化审批展示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享的入站 / 回复运行时辅助函数、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精简的回复分发 / 最终化和会话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享的短窗口回复历史辅助函数，例如 `buildHistoryContext`, `recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精简的文本 / Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + updated-at 辅助函数 |
    | `plugin-sdk/state-paths` | state / OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由 / 会话键 / 账户绑定辅助函数，例如 `resolveAgentRoute`, `buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享的渠道 / 账户 Status 摘要辅助函数、运行时状态默认值，以及问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享的目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | slug / 字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch / request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时的命令运行器，返回规范化的 stdout / stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具 / CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化载荷 |
    | `plugin-sdk/tool-send` | 从工具参数中提取标准发送目标字段 |
    | `plugin-sdk/temp-path` | 共享的临时下载路径辅助函数 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘后端去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时 / 会话和回复分发辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不引入生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 精简的智能体运行时配置 schema 基元 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享的被动渠道、Status 和 ambient proxy 辅助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令 / 提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表构建 / 序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 面向低层 Agent harness 的实验性受信任插件接口：harness 类型、活动运行 steer / abort 辅助函数、OpenClaw 工具桥接辅助函数、工具进度格式化 / 详情辅助函数，以及 attempt 结果工具函数 |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 检测辅助函数 |
    | `plugin-sdk/infra-runtime` | 系统事件 / 心跳辅助函数 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标记和事件辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封装后的 fetch、proxy 和 pinned 查找辅助函数 |
    | `plugin-sdk/runtime-fetch` | 不引入 proxy / guarded-fetch 的 dispatcher 感知运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不依赖宽泛媒体运行时接口的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不引入宽泛配置写入 / 维护导入的会话存储读取辅助函数 |
    | `plugin-sdk/context-visibility-runtime` | 不引入宽泛配置 / 安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不引入 markdown / 日志的精简原始记录 / 字符串强制转换和规范化辅助函数 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录 / 身份 / 工作区辅助函数 |
    | `plugin-sdk/directory-runtime` | 配置驱动的目录查询 / 去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享的媒体获取 / 转换 / 存储辅助函数，以及媒体载荷构建器 |
    | `plugin-sdk/media-store` | 精简的媒体存储辅助函数，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享的媒体生成故障切换辅助函数、候选项选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像 / 音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享的文本 / Markdown / 日志辅助函数，例如面向助手可见文本剥离、Markdown 渲染 / 分块 / 表格辅助函数、脱敏辅助函数、directive-tag 辅助函数和安全文本工具函数 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助函数 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的 directive、注册表、校验和语音辅助导出 |
    | `plugin-sdk/speech-core` | 共享的语音提供商类型、注册表、directive、规范化和语音辅助导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型、注册表辅助函数，以及共享的 WebSocket 会话辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助函数 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享的图像生成类型、故障切换、鉴权和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成提供商 / 请求 / 结果类型 |
    | `plugin-sdk/music-generation-core` | 共享的音乐生成类型、故障切换辅助函数、提供商查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商 / 请求 / 结果类型 |
    | `plugin-sdk/video-generation-core` | 共享的视频生成类型、故障切换辅助函数、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | webhook 路径规范化辅助函数 |
    | `plugin-sdk/web-media` | 共享的远程 / 本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 为插件 SDK 使用方重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | bundled memory-core 辅助接口，用于 manager / config / file / CLI 辅助函数 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引 / 搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine 导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding 契约、注册表访问、本地 provider，以及通用 batch / remote 辅助函数 |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine 导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine 导出 |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host 多模态辅助函数 |
    | `plugin-sdk/memory-core-host-query` | Memory host 查询辅助函数 |
    | `plugin-sdk/memory-core-host-secret` | Memory host 密钥辅助函数 |
    | `plugin-sdk/memory-core-host-events` | Memory host 事件日志辅助函数 |
    | `plugin-sdk/memory-core-host-status` | Memory host Status 辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host 核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host 文件 / 运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | memory host 核心运行时辅助函数的 vendor-neutral 别名 |
    | `plugin-sdk/memory-host-events` | memory host 事件日志辅助函数的 vendor-neutral 别名 |
    | `plugin-sdk/memory-host-files` | memory host 文件 / 运行时辅助函数的 vendor-neutral 别名 |
    | `plugin-sdk/memory-host-markdown` | 用于 memory 邻近插件的共享托管 Markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于访问 search-manager 的活跃 Memory 运行时门面 |
    | `plugin-sdk/memory-host-status` | memory host Status 辅助函数的 vendor-neutral 别名 |
    | `plugin-sdk/memory-lancedb` | bundled memory-lancedb 辅助接口 |
  </Accordion>

  <Accordion title="保留的 bundled-helper 子路径">
    | 家族 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | bundled browser 插件支持辅助函数。`browser-profiles` 导出 `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` 和 `ResolvedBrowserTabCleanupConfig`，用于规范化后的 `browser.tabCleanup` 结构。`browser-support` 仍然是兼容性 barrel。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | bundled Matrix 辅助 / 运行时接口 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | bundled LINE 辅助 / 运行时接口 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | bundled IRC 辅助接口 |
    | 渠道专用辅助函数 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | bundled 渠道兼容性 / 辅助接口 |
    | 鉴权 / 插件专用辅助函数 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | bundled 功能 / 插件辅助接口；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
