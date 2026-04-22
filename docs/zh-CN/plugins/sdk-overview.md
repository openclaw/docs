---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你想查看 OpenClawPluginApi 上所有注册方法的参考资料
    - 你正在查找某个特定的 SDK 导出项
sidebarTitle: SDK Overview
summary: Import map、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-22T01:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# 插件 SDK 概览

插件 SDK 是插件与核心之间的类型化契约。本页是关于**应导入什么**以及**你可以注册什么**的参考资料。

<Tip>
  **在找操作指南吗？**
  - 第一个插件？从 [入门指南](/zh-CN/plugins/building-plugins) 开始
  - 渠道插件？参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)
  - 提供商插件？参见 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
</Tip>

## 导入约定

始终从特定的子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、独立的模块。这样可以保持快速启动，并防止循环依赖问题。对于特定于渠道的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更广泛的总括性表面和共享辅助工具，例如 `buildChannelConfigSchema`。

不要添加或依赖带有提供商名称的便捷接缝，例如 `openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`，或带有渠道品牌的辅助工具接缝。内置插件应在其自身的 `api.ts` 或 `runtime-api.ts` barrel 中组合通用 SDK 子路径，而核心则应使用这些插件本地 barrel，或者在需求确实跨渠道时添加一个狭义的通用 SDK 契约。

生成的导出映射仍然包含一小部分内置插件辅助工具接缝，例如 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些子路径仅为内置插件维护和兼容性而存在；它们有意未包含在下面的通用表格中，也不是新第三方插件的推荐导入路径。

## 子路径参考

最常用的子路径，按用途分组。生成的完整列表包含 200 多个子路径，位于 `scripts/lib/plugin-sdk-entrypoints.json` 中。

保留的内置插件辅助工具子路径仍会出现在该生成列表中。除非某个文档页面明确将其推广为公共接口，否则应将其视为实现细节/兼容性表面。

### 插件入口

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
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户 config/action-gate 辅助工具、默认账户回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 狭义的账户列表/账户操作辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 渠道 config schema 类型 |
    | `plugin-sdk/telegram-command-config` | 带有内置契约回退的 Telegram 自定义命令规范化/验证辅助工具 |
    | `plugin-sdk/command-gating` | 狭义的命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/最终化辅助工具 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + envelope 构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录并分发辅助工具 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-runtime` | 出站身份、发送委托和负载规划辅助工具 |
    | `plugin-sdk/poll-runtime` | 狭义的投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时 config 快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 狭义的渠道 config-schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道 config 写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist config 编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享直接私信授权/守卫辅助工具 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、投递和旧版交互式回复辅助工具。参见 [消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于入站防抖、提及匹配、提及策略辅助工具和 envelope 辅助工具的兼容性 barrel |
    | `plugin-sdk/channel-mention-gating` | 不含更广泛入站运行时表面的狭义提及策略辅助工具 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助工具 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和 typing/ack 失败的渠道日志辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/reaction 接线 |
    | `plugin-sdk/channel-secret-runtime` | 狭义的密钥契约辅助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 和 secret target 类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助工具 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/profile-write 辅助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth auth-result 构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件的共享交互式登录辅助工具 |
    | `plugin-sdk/provider-env-vars` | 提供商凭证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 辅助工具，以及如 `normalizeNativeXaiModelId` 之类的 model-id 规范化辅助工具 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/endpoint 能力辅助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狭义的 web-fetch config/selection 契约辅助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | web-fetch 提供商注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 适用于不需要插件启用接线的提供商的狭义 web-search config/credential 辅助工具 |
    | `plugin-sdk/provider-web-search-contract` | 狭义的 web-search config/credential 契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 和作用域化 credential setter/getter |
    | `plugin-sdk/provider-web-search` | web-search 提供商注册/缓存/运行时辅助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + diagnostics，以及 xAI 兼容性辅助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助工具，例如受保护的 fetch、传输消息变换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导 config patch 辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助工具 |
  </Accordion>

  <Accordion title="凭证和安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助工具、发送者授权辅助工具 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天 action-auth 辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批 profile/filter 辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载辅助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理器运行时辅助工具；在适用时优先使用更狭义的 adapter/gateway 接缝 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定辅助工具 |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 审批回复负载辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令凭证 + 原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令表面辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用于渠道/插件密钥表面的狭义 secret-contract 收集辅助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用于 secret-contract/config 解析的狭义 `coerceSecretRef` 和 SecretRef 类型辅助工具 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容和密钥收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含广泛基础设施运行时表面的狭义 pinned-dispatcher 辅助工具 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、受 SSRF 保护的 fetch 和 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/插件安装辅助工具 |
    | `plugin-sdk/runtime-env` | 狭义的运行时 env、logger、timeout、retry 和 backoff 辅助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令/hook/http/interactive 辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部 hook 管道辅助工具 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入/绑定辅助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待和版本辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端和渠道状态 patch 辅助工具 |
    | `plugin-sdk/config-runtime` | config 加载/写入辅助工具 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 契约表面不可用时也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不含广泛 text-runtime barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | exec/plugin 审批辅助工具、审批能力构建器、凭证/profile 辅助工具、原生路由/运行时辅助工具 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助工具、分块、分发、heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 狭义的回复分发/最终化辅助工具 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助工具，例如 `buildHistoryContext`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭义的文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + updated-at 辅助工具 |
    | `plugin-sdk/state-paths` | State/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账户状态摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时的命令运行器，带规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON state 读写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复分发辅助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 狭义的智能体运行时 config-schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备 bootstrap 和配对令牌辅助工具 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skills 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助工具 |
    | `plugin-sdk/agent-harness` | 面向低级智能体 harness 的实验性可信插件表面：harness 类型、活动运行 steer/abort 辅助工具、OpenClaw 工具桥接辅助工具和尝试结果实用工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 检测辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/heartbeat 辅助工具 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装的 fetch、代理和 pinned 查找辅助工具 |
    | `plugin-sdk/runtime-fetch` | 不含 proxy/guarded-fetch 导入的 dispatcher-aware 运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不含广泛 media runtime 表面的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 不含已配置绑定路由或配对存储的当前会话绑定状态 |
    | `plugin-sdk/session-store-runtime` | 不含广泛 config 写入/维护导入的会话存储读取辅助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不含广泛 config/security 导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不含 Markdown/logging 导入的狭义原始记录/字符串强制转换和规范化辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试 config 和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于 config 的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具以及媒体负载构建器 |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选项选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助工具，例如面向助手可见文本剥离、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive-tag 辅助工具和安全文本实用工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的 directive、注册表和验证辅助工具 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、directive 和规范化辅助工具 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型和注册表辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、凭证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置的 memory-core 辅助工具表面，用于 manager/config/file/CLI 辅助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host 基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding 契约、注册表访问、本地提供商，以及通用 batch/remote 辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host 存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host 多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | Memory host 查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | Memory host 密钥辅助工具 |
    | `plugin-sdk/memory-core-host-events` | Memory host 事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | Memory host 状态辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host 核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host 文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 面向供应商中立的别名，用于 memory host 核心运行时辅助工具 |
    | `plugin-sdk/memory-host-events` | 面向供应商中立的别名，用于 memory host 事件日志辅助工具 |
    | `plugin-sdk/memory-host-files` | 面向供应商中立的别名，用于 memory host 文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-markdown` | 用于 memory 相邻插件的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于 search-manager 访问的活动 Memory 运行时外观 |
    | `plugin-sdk/memory-host-status` | 面向供应商中立的别名，用于 memory host 状态辅助工具 |
    | `plugin-sdk/memory-lancedb` | 内置的 memory-lancedb 辅助工具表面 |
  </Accordion>

  <Accordion title="保留的内置辅助工具子路径">
    | 系列 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 内置 Browser 插件支持辅助工具（`browser-support` 仍是兼容性 barrel） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助工具/运行时表面 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 内置 LINE 辅助工具/运行时表面 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 内置 IRC 辅助工具表面 |
    | 渠道特定辅助工具 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 内置渠道兼容性/辅助工具接缝 |
    | 凭证/插件特定辅助工具 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 内置功能/插件辅助工具接缝；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调会接收一个 `OpenClawPluginApi` 对象，其中包含这些方法：

### 能力注册

| 方法                                             | 注册内容                        |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                 |
| `api.registerAgentHarness(...)`                  | 实验性的低级智能体执行器        |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端               |
| `api.registerChannel(...)`                       | 消息渠道                        |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成           |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                    |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话                |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析              |
| `api.registerImageGenerationProvider(...)`       | 图像生成                        |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                        |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                        |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商           |
| `api.registerWebSearchProvider(...)`             | Web 搜索                        |

### 工具和命令

| 方法                            | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`）     |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

### 基础设施

| 方法                                           | 注册内容                        |
| ---------------------------------------------- | ------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 hook                       |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点          |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法           |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                      |
| `api.registerService(service)`                 | 后台服务                        |
| `api.registerInteractiveHandler(registration)` | 交互式处理器                    |
| `api.registerMemoryPromptSupplement(builder)`  | 附加的 memory 相邻提示部分      |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加的 memory 搜索/读取语料库   |

保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持为 `operator.admin`，即使插件尝试为其分配更窄的 Gateway 网关方法作用域也是如此。对于插件自有方法，优先使用插件特定前缀。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由 registrar 拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和延迟插件 CLI 注册的解析期命令描述符

如果你希望插件命令在正常的根 CLI 路径中保持延迟加载，请提供 `descriptors`，覆盖该 registrar 暴露的每一个顶层命令根。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "管理 Matrix 账户、验证、设备和 profile 状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅当你不需要延迟根 CLI 注册时，才单独使用 `commands`。这种急切兼容路径仍然受支持，但它不会为解析期延迟加载安装基于 descriptor 的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（例如 `codex-cli`）的默认 config。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户 config 仍然优先生效。OpenClaw 会在运行 CLI 之前，将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上。
- 当后端在合并后需要兼容性重写时，使用 `normalizeConfig`（例如规范化旧的 flag 结构）。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次仅一个活动）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎能够定制提示附加内容。 |
| `api.registerMemoryCapability(capability)` | 统一 Memory 能力                                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Memory 提示部分构建器                                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Memory 刷新计划解析器                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Memory 运行时适配器                                                                                                                                      |

### Memory embedding 适配器

| 方法                                           | 注册内容                                 |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的 Memory embedding 适配器       |

- `registerMemoryCapability` 是首选的独占 memory 插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，这样配套插件就可以通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的 memory 工件，而不是深入特定 memory 插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是兼容旧版的独占 memory 插件 API。
- `registerMemoryEmbeddingProvider` 允许活动 memory 插件注册一个或多个 embedding 适配器 id（例如 `openai`、`gemini` 或插件自定义 id）。
- 用户 config（例如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）会针对这些已注册的适配器 id 进行解析。

### 事件和生命周期

| 方法                                         | 作用                    |
| -------------------------------------------- | ----------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 hook     |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调            |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任意处理器设置它，就会跳过更低优先级的处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是作为覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任意处理器设置它，就会跳过更低优先级的处理器。
- `before_install`：返回 `{ block: false }` 会被视为未作出决定（与省略 `block` 相同），而不是作为覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任意处理器声明已分发，就会跳过更低优先级的处理器以及默认的模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任意处理器设置它，就会跳过更低优先级的处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作出决定（与省略 `cancel` 相同），而不是作为覆盖。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                             |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | 插件 id                                                                                          |
| `api.name`               | `string`                  | 显示名称                                                                                         |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                                 |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                                 |
| `api.source`             | `string`                  | 插件源路径                                                                                       |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                               |
| `api.config`             | `OpenClawConfig`          | 当前 config 快照（可用时为活动的内存中运行时快照）                                               |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属 config                                             |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                                           |
| `api.logger`             | `PluginLogger`            | 作用域化 logger（`debug`、`info`、`warn`、`error`）                                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置之前的轻量级预启动/设置窗口                   |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                       |

## 内部模块约定

在你的插件内部，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 面向外部使用者的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅设置用的轻量入口（可选）
```

<Warning>
  绝不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。应通过 `./api.ts` 或
  `./runtime-api.ts` 路由内部导入。SDK 路径仅是外部契约。
</Warning>

由 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）现在在 OpenClaw 已经运行时会优先使用活动运行时 config 快照。如果运行时快照尚不存在，它们会回退到磁盘上已解析的 config 文件。

当某个辅助工具是有意保持提供商专属、且暂时还不适合放入通用 SDK 子路径时，提供商插件也可以暴露一个狭义的插件本地契约 barrel。当前的内置示例：Anthropic 提供商将其 Claude 流辅助工具保留在自己的公共 `api.ts` / `contract-api.ts` 接缝中，而不是把 Anthropic beta-header 和 `service_tier` 逻辑提升到通用的 `plugin-sdk/*` 契约中。

其他当前的内置示例：

- `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、
  默认模型辅助工具，以及实时提供商构建器
- `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器以及
  新手引导/config 辅助工具

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实需要共享，应将其提升到一个中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的表面，而不是将两个插件耦合在一起。
</Warning>

## 相关内容

- [入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry` 选项
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime) — 完整的 `api.runtime` 命名空间参考
- [设置和配置](/zh-CN/plugins/sdk-setup) — 打包、manifest、config schema
- [测试](/zh-CN/plugins/sdk-testing) — 测试工具和 lint 规则
- [SDK 迁移](/zh-CN/plugins/sdk-migration) — 从已弃用表面迁移
- [插件内部机制](/zh-CN/plugins/architecture) — 深入的架构和能力模型
