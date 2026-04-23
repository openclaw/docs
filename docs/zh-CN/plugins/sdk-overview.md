---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你想查看 OpenClawPluginApi 上所有注册方法的参考文档
    - 你正在查找某个特定的 SDK 导出项
sidebarTitle: SDK overview
summary: Import map、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-23T17:31:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8635973d4c4081675ef104b9079667882ff1c6f8f7f73bcd1516222259bc1569
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是 plugins 与核心之间的类型化契约。本页是关于**导入什么**以及**你可以注册什么**的参考文档。

<Tip>
  在找操作指南而不是参考文档？

- 第一个 plugin？从 [构建 plugins](/zh-CN/plugins/building-plugins) 开始。
- 渠道插件？参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 提供商插件？参见 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。
  </Tip>

## 导入约定

始终从特定的子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含模块。这样可以保持快速启动，并防止循环依赖问题。对于特定于渠道的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更广泛的总入口表面和共享辅助工具，例如 `buildChannelConfigSchema`。

<Warning>
  不要导入带有 provider 或 channel 品牌的便捷接缝层（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用方应使用这些 plugin 本地
  barrel，或者在需求确实跨渠道时添加一个窄范围的通用 SDK 契约。

少量内置插件辅助接缝层（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` 等）仍会出现在生成的导出映射中。它们仅用于内置插件维护，不推荐作为新的第三方插件导入路径。
</Warning>

## 子路径参考

最常用的子路径，按用途分组。完整的 200+ 子路径生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`；保留给内置插件辅助工具的子路径也会出现在其中，但除非文档页面明确推荐，否则它们属于实现细节。

### 插件入口

| 子路径                      | 关键导出                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                       |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                          |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                         |

<AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控辅助工具、默认账户回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 窄范围账户列表/账户操作辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 渠道配置 schema 类型 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/校验辅助工具，带内置契约回退 |
    | `plugin-sdk/command-gating` | 窄范围命令授权门控辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/完成辅助工具 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + envelope 构建辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录与分发辅助工具 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-runtime` | 出站身份、发送委托和负载规划辅助工具 |
    | `plugin-sdk/poll-runtime` | 窄范围投票规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 窄范围渠道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前置导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist 配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享直接私信认证/守卫辅助工具 |
    | `plugin-sdk/interactive-runtime` | 语义化消息呈现、投递和旧版交互式回复辅助工具。参见 [消息呈现](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于入站防抖、提及匹配、提及策略辅助工具和 envelope 辅助工具的兼容性 barrel |
    | `plugin-sdk/channel-mention-gating` | 不包含更广泛入站运行时表面的窄范围提及策略辅助工具 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助工具 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和 typing/ack 失败的渠道日志辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为保持 plugin 兼容性而保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/reaction 连接 |
    | `plugin-sdk/channel-secret-runtime` | 窄范围密钥契约辅助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 以及密钥目标类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管 provider 设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 面向 OpenAI 兼容自托管 provider 的聚焦设置辅助工具 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/profile 写入辅助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件共享的交互式登录辅助工具 |
    | `plugin-sdk/provider-env-vars` | provider 认证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享 replay-policy 构建器、provider endpoint 辅助工具，以及模型 ID 规范化辅助工具，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 provider HTTP/endpoint 能力辅助工具，包括音频转录 multipart form 辅助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄范围 web-fetch 配置/选择契约辅助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 适用于不需要 plugin 启用连接的 provider 的窄范围 web-search 配置/凭证辅助工具 |
    | `plugin-sdk/provider-web-search-contract` | 窄范围 web-search 配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及带作用域的凭证设置器/获取器 |
    | `plugin-sdk/provider-web-search` | web-search provider 注册/缓存/运行时辅助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + diagnostics，以及 xAI 兼容性辅助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生 provider 传输辅助工具，例如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助工具 |
  </Accordion>

  <Accordion title="认证与安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助工具、发送方授权辅助工具 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批人解析和同聊天操作认证辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批 profile/filter 辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 网关解析辅助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热渠道入口点的轻量级原生审批适配器加载辅助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理器运行时辅助工具；当更窄范围的 adapter/gateway 接缝层已经足够时，优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定辅助工具 |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 审批回复负载辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令认证 + 原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令表面辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向渠道/plugin 密钥表面的窄范围密钥契约收集辅助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用于密钥契约/配置解析的窄范围 `coerceSecretRef` 和 SecretRef 类型辅助工具 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容和密钥收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含广泛基础设施运行时表面的窄范围 pinned-dispatcher 辅助工具 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、受 SSRF 防护的 fetch 和 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时与存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/plugin 安装辅助工具 |
    | `plugin-sdk/runtime-env` | 窄范围运行时环境、logger、超时、重试和回退辅助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册和查找辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享 plugin 命令/hook/http/交互式辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部 hook 管道辅助工具 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待和版本辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端和渠道状态补丁辅助工具 |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助工具和 plugin 配置查找辅助工具 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置的 Telegram 契约表面不可用时也可使用 |
    | `plugin-sdk/text-autolink-runtime` | 不依赖广泛 `text-runtime` barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | exec/plugin 审批辅助工具、审批能力构建器、认证/profile 辅助工具、原生路由/运行时辅助工具 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助工具、分块、分发、heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发/完成辅助工具 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助工具，例如 `buildHistoryContext`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄范围文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + updated-at 辅助工具 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账户状态摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从类似 fetch/request 的输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时的命令运行器，输出已规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复分发辅助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不带生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 窄范围智能体运行时配置 schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助工具 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/provider 回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助工具 |
    | `plugin-sdk/agent-harness` | 面向低层智能体 harness 的实验性可信 plugin 表面：harness 类型、活动运行 steer/abort 辅助工具、OpenClaw 工具桥接辅助工具和尝试结果实用工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 检测辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/heartbeat 辅助工具 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装后的 fetch、代理和 pinned 查找辅助工具 |
    | `plugin-sdk/runtime-fetch` | 具备 dispatcher 感知能力的运行时 fetch，不包含 proxy/guarded-fetch 导入 |
    | `plugin-sdk/response-limit-runtime` | 不依赖广泛媒体运行时表面的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不含广泛配置写入/维护导入的会话存储读取辅助工具 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文过滤，不包含广泛配置/安全导入 |
    | `plugin-sdk/string-coerce-runtime` | 不依赖 Markdown/日志导入的窄范围原始记录/字符串强制转换与规范化辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/workspace 辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具，以及媒体负载构建器 |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障切换辅助工具、候选项选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解 provider 类型，以及面向 provider 的图像/音频辅助工具导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助工具，例如对 assistant 可见文本的剥离、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive-tag 辅助工具和安全文本实用工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音 provider 类型，以及面向 provider 的 directive、注册表和校验辅助工具 |
    | `plugin-sdk/speech-core` | 共享语音 provider 类型、注册表、directive 和规范化辅助工具 |
    | `plugin-sdk/realtime-transcription` | 实时转录 provider 类型、注册表辅助工具和共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音 provider 类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成 provider 类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障切换、认证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成 provider/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障切换辅助工具、provider 查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成 provider/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障切换辅助工具、provider 查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为插件 SDK 使用方重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`、`shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助表面，用于 manager/config/file/CLI 辅助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host 基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding 契约、注册表访问、本地 provider 以及通用批处理/远程辅助工具 |
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
    | `plugin-sdk/memory-host-core` | 面向厂商中立的 memory host 核心运行时辅助工具别名 |
    | `plugin-sdk/memory-host-events` | 面向厂商中立的 memory host 事件日志辅助工具别名 |
    | `plugin-sdk/memory-host-files` | 面向厂商中立的 memory host 文件/运行时辅助工具别名 |
    | `plugin-sdk/memory-host-markdown` | 用于 memory 相邻插件的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 用于访问 search-manager 的活动 Memory 运行时外观 |
    | `plugin-sdk/memory-host-status` | 面向厂商中立的 memory host 状态辅助工具别名 |
    | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助表面 |
  </Accordion>

  <Accordion title="保留的内置辅助子路径">
    | 家族 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 内置 browser 插件支持辅助工具（`browser-support` 仍是兼容性 barrel） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助/运行时表面 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 内置 LINE 辅助/运行时表面 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 内置 IRC 辅助表面 |
    | 特定于渠道的辅助工具 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 内置渠道兼容性/辅助接缝层 |
    | 认证/plugin 专用辅助工具 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 内置功能/plugin 辅助接缝层；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调会接收一个 `OpenClawPluginApi` 对象，包含以下方法：

### 能力注册

| 方法 | 注册内容 |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)` | 文本推理（LLM） |
| `api.registerAgentHarness(...)` | 实验性的低层智能体执行器 |
| `api.registerCliBackend(...)` | 本地 CLI 推理后端 |
| `api.registerChannel(...)` | 消息渠道 |
| `api.registerSpeechProvider(...)` | 文本转语音 / STT 合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录 |
| `api.registerRealtimeVoiceProvider(...)` | 双向实时语音会话 |
| `api.registerMediaUnderstandingProvider(...)` | 图像/音频/视频分析 |
| `api.registerImageGenerationProvider(...)` | 图像生成 |
| `api.registerMusicGenerationProvider(...)` | 音乐生成 |
| `api.registerVideoGenerationProvider(...)` | 视频生成 |
| `api.registerWebFetchProvider(...)` | Web 获取 / 抓取 provider |
| `api.registerWebSearchProvider(...)` | Web 搜索 |

### 工具与命令

| 方法 | 注册内容 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`） |
| `api.registerCommand(def)` | 自定义命令（绕过 LLM） |

### 基础设施

| 方法 | 注册内容 |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)` | 事件 hook |
| `api.registerHttpRoute(params)` | Gateway 网关 HTTP endpoint |
| `api.registerGatewayMethod(name, handler)` | Gateway 网关 RPC 方法 |
| `api.registerCli(registrar, opts?)` | CLI 子命令 |
| `api.registerService(service)` | 后台服务 |
| `api.registerInteractiveHandler(registration)` | 交互式处理器 |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi 内嵌运行器扩展工厂 |
| `api.registerMemoryPromptSupplement(builder)` | 追加式 memory 相邻提示词段落 |
| `api.registerMemoryCorpusSupplement(adapter)` | 追加式 memory 搜索/读取语料库 |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使 plugin 尝试分配更窄范围的
  Gateway 网关方法作用域也是如此。对于 plugin 自有方法，优先使用特定于 plugin 的前缀。
</Note>

<Accordion title="何时使用 registerEmbeddedExtensionFactory">
  当某个 plugin 在 OpenClaw 内嵌运行期间需要 Pi 原生事件时序时，请使用 `api.registerEmbeddedExtensionFactory(...)`
  —— 例如必须在最终工具结果消息发出之前完成的异步 `tool_result`
  重写。

这目前是一个内置 plugin 接缝层：只有内置插件可以注册它，
并且它们必须在 `openclaw.plugin.json` 中声明 `contracts.embeddedExtensionFactories: ["pi"]`。
对于所有不需要这种更低层接缝层的情况，继续使用普通的 OpenClaw plugin hooks。
</Accordion>

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由 registrar 拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和惰性 plugin CLI 注册的解析时命令描述符

如果你希望某个 plugin 命令在普通根 CLI 路径中保持惰性加载，请提供覆盖该 registrar 暴露的每个顶层命令根的 `descriptors`。

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

仅在你不需要惰性根 CLI 注册时，才单独使用 `commands`。
这种急切兼容路径仍受支持，但它不会为解析时惰性加载安装基于 descriptor 的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许某个 plugin 拥有本地 AI CLI 后端（例如 `codex-cli`）的默认配置。

- 后端 `id` 会成为模型引用中的 provider 前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到 plugin 默认值之上，再运行 CLI。
- 当某个后端在合并后需要兼容性重写时，请使用 `normalizeConfig`
  （例如规范化旧版 flag 结构）。

### 独占槽位

| 方法 | 注册内容 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | 上下文引擎（一次仅一个处于活动状态）。`assemble()` 回调会接收 `availableTools` 和 `citationsMode`，以便引擎按需定制提示词补充内容。 |
| `api.registerMemoryCapability(capability)` | 统一 Memory 能力 |
| `api.registerMemoryPromptSection(builder)` | Memory 提示词段落构建器 |
| `api.registerMemoryFlushPlan(resolver)` | Memory 刷新计划解析器 |
| `api.registerMemoryRuntime(runtime)` | Memory 运行时适配器 |

### Memory embedding 适配器

| 方法 | 注册内容 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动 plugin 的 Memory embedding 适配器 |

- `registerMemoryCapability` 是首选的独占 Memory 插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，
  以便配套插件通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的 Memory 工件，
  而不是深入访问某个特定 Memory 插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占 Memory 插件 API。
- `registerMemoryEmbeddingProvider` 允许活动 Memory 插件注册一个
  或多个 embedding 适配器 ID（例如 `openai`、`gemini` 或 plugin 自定义 ID）。
- 用户配置（例如 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback`）会基于这些已注册的适配器 ID 进行解析。

### 事件与生命周期

| 方法 | 作用 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)` | 类型化生命周期 hook |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调 |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 为终止性决定。一旦任一处理器设置它，将跳过优先级更低的处理器。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 为终止性决定。一旦任一处理器设置它，将跳过优先级更低的处理器。
- `before_install`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 为终止性决定。一旦任一处理器声明已处理分发，将跳过优先级更低的处理器以及默认模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 为终止性决定。一旦任一处理器设置它，将跳过优先级更低的处理器。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作决定（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/主题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给特定于渠道的附加信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到特定于渠道的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关自有的启动状态，而不要依赖内部 `gateway:startup` hooks。

### API 对象字段

| 字段 | 类型 | 说明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | 插件 ID |
| `api.name` | `string` | 显示名称 |
| `api.version` | `string?` | 插件版本（可选） |
| `api.description` | `string?` | 插件描述（可选） |
| `api.source` | `string` | 插件源路径 |
| `api.rootDir` | `string?` | 插件根目录（可选） |
| `api.config` | `OpenClawConfig` | 当前配置快照（可用时为活动的内存中运行时快照） |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置 |
| `api.runtime` | `PluginRuntime` | [运行时辅助工具](/zh-CN/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | 作用域 logger（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置前的轻量预启动窗口 |
| `api.resolvePath(input)` | `(string) => string` | 解析相对于插件根目录的路径 |

## 内部模块约定

在你的插件内部，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 面向外部使用方的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅用于轻量设置的入口点（可选）
```

<Warning>
  不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 进行内部导入。SDK 路径仅是对外契约。
</Warning>

通过 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）在 OpenClaw 已经运行时会优先使用活动运行时配置快照。如果运行时快照尚不存在，它们会回退到磁盘上解析得到的配置文件。

当某个辅助工具有意保持提供商专属，且暂时还不适合放入通用 SDK
子路径时，provider 插件可以暴露一个窄范围的 plugin 本地契约 barrel。内置示例：

- **Anthropic**：用于 Claude
  beta-header 和 `service_tier` 流辅助工具的公共 `api.ts` / `contract-api.ts` 接缝层。
- **`@openclaw/openai-provider`**：`api.ts` 导出 provider 构建器、
  默认模型辅助工具和实时 provider 构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出 provider 构建器，
  以及新手引导/配置辅助工具。

<Warning>
  扩展的生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实是共享的，请将它提升到一个中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的表面，而不是让两个插件彼此耦合。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助工具" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置与配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、manifest 和配置 schema。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试实用工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用表面迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
