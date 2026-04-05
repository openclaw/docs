---
read_when:
    - 你需要知道应该从哪个 SDK 子路径导入
    - 你想查阅 OpenClawPluginApi 上所有注册方法的参考
    - 你正在查找某个特定的 SDK 导出
sidebarTitle: SDK Overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-05T22:37:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e023cf1ca8a35a437e27fdebde66d955771d50a3db5ffeef335c174873b1867
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# 插件 SDK 概览

插件 SDK 是插件与核心之间的类型化契约。本页是关于**导入什么**以及**你可以注册什么**的参考。

<Tip>
  **在找操作指南？**
  - 第一个插件？从 [入门指南](/zh-CN/plugins/building-plugins) 开始
  - 渠道插件？参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)
  - 提供商插件？参见 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、独立的模块。这能保持快速启动，并防止循环依赖问题。对于渠道专用的入口/构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 留给更广泛的总入口表面和共享辅助函数，例如 `buildChannelConfigSchema`。

不要添加或依赖带有提供商名称的便捷入口，例如 `openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`，或带有渠道品牌的辅助入口。内置插件应在它们自己的 `api.ts` 或 `runtime-api.ts` barrel 文件中组合通用 SDK 子路径，而核心则应使用这些插件本地的 barrel 文件，或者在需求确实跨渠道时新增一个窄而通用的 SDK 契约。

生成的导出映射仍然包含一小部分内置插件辅助入口，例如 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些子路径仅用于内置插件维护和兼容性；它们有意未出现在下面的常用表格中，也不是新第三方插件推荐的导入路径。

## 子路径参考

最常用的子路径，按用途分组。生成的完整列表包含 200 多个子路径，位于 `scripts/lib/plugin-sdk-entrypoints.json`。

保留的内置插件辅助子路径仍会出现在那个生成列表中。除非某个文档页面明确将其作为公共接口推荐，否则请将它们视为实现细节/兼容性表面。

### 插件入口

| 子路径 | 关键导出 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助函数、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/动作门控辅助函数、默认账户回退辅助函数 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化辅助函数 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助函数 |
    | `plugin-sdk/account-helpers` | 窄范围的账户列表/账户操作辅助函数 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 渠道配置 schema 类型 |
    | `plugin-sdk/telegram-command-config` | 带有内置契约回退的 Telegram 自定义命令规范化/校验辅助函数 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + envelope 构建辅助函数 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录与分发辅助函数 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助函数 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助函数 |
    | `plugin-sdk/outbound-runtime` | 出站身份/发送委托辅助函数 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助函数 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助函数 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助函数 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助函数 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助函数 |
    | `plugin-sdk/channel-config-primitives` | 窄范围的渠道配置 schema 基元 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助函数 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | allowlist 配置编辑/读取辅助函数 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助函数 |
    | `plugin-sdk/direct-dm` | 共享直接私信认证/保护辅助函数 |
    | `plugin-sdk/interactive-runtime` | 交互式回复负载规范化/归约辅助函数 |
    | `plugin-sdk/channel-inbound` | 去抖、提及匹配、envelope 辅助函数 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`、`createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助函数 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 兼容自托管提供商的设置辅助函数 |
    | `plugin-sdk/provider-auth-runtime` | 用于提供商插件的运行时 API 密钥解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥新手引导/配置文件写入辅助函数 |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth auth-result 构建器 |
    | `plugin-sdk/provider-auth-login` | 用于提供商插件的共享交互式登录辅助函数 |
    | `plugin-sdk/provider-env-vars` | 提供商凭证环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享 replay-policy 构建器、provider-endpoint 辅助函数，以及诸如 `normalizeNativeXaiModelId` 之类的模型 ID 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助函数 |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供商注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search` | Web 搜索提供商注册/缓存/配置辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 诊断，以及诸如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 之类的 xAI 兼容辅助函数 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似函数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助函数 |
  </Accordion>

  <Accordion title="认证和安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助函数、发送者授权辅助函数 |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同聊天动作认证辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 审批配置文件/过滤器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/投递适配器 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | exec/插件审批回复负载辅助函数 |
    | `plugin-sdk/command-auth-native` | 原生命令认证 + 原生会话目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容和 secret 收集辅助函数 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、受 SSRF 保护的 fetch，以及 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | secret 输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | webhook 请求/目标辅助函数 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助函数 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/插件安装辅助函数 |
    | `plugin-sdk/runtime-env` | 窄范围的运行时环境、logger、超时、重试和退避辅助函数 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令/hook/http/交互式辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部 hook 流水线辅助函数 |
    | `plugin-sdk/lazy-runtime` | 惰性运行时导入/绑定辅助函数，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待和版本辅助函数 |
    | `plugin-sdk/gateway-runtime` | Gateway 网关客户端和渠道状态补丁辅助函数 |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助函数 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化以及重复/冲突检查，即使内置 Telegram 契约表面不可用时也可使用 |
    | `plugin-sdk/approval-runtime` | exec/插件审批辅助函数、审批能力构建器、认证/配置文件辅助函数、原生路由/运行时辅助函数 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助函数、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄范围的回复分发/完成辅助函数 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助函数，例如 `buildHistoryContext`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄范围的文本/Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + updated-at 辅助函数 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助函数，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账户状态摘要辅助函数、运行时状态默认值和问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | slug/字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带超时的命令运行器，返回规范化的 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助函数 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复分发辅助函数 |
    | `plugin-sdk/agent-config-primitives` | 窄范围的智能体运行时配置 schema 基元 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对 token 辅助函数 |
    | `plugin-sdk/extension-shared` | 共享被动渠道和状态辅助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助函数 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测辅助函数 |
    | `plugin-sdk/infra-runtime` | 系统事件/心跳辅助函数 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装后的 fetch、代理和 pinned 查找辅助函数 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | 智能体目录/身份/工作区辅助函数 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助函数，以及媒体负载构建器 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助函数，例如移除对助手可见的文本、Markdown 渲染/分块/表格辅助函数、脱敏辅助函数、directive-tag 辅助函数和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助函数 |
    | `plugin-sdk/speech` | 语音提供商类型，以及面向提供商的 directive、注册表和校验辅助函数 |
    | `plugin-sdk/speech-core` | 共享语音提供商类型、注册表、directive 和规范化辅助函数 |
    | `plugin-sdk/realtime-transcription` | 实时转录提供商类型和注册表辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助函数 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障切换、认证和注册表辅助函数 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障切换辅助函数、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | webhook 路径规范化辅助函数 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 为插件 SDK 使用者重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`、`shouldAckReaction` |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助表面，用于 manager/config/file/CLI 辅助函数 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入引擎导出 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态辅助函数 |
    | `plugin-sdk/memory-core-host-query` | 内存主机查询辅助函数 |
    | `plugin-sdk/memory-core-host-secret` | 内存主机 secret 辅助函数 |
    | `plugin-sdk/memory-core-host-status` | 内存主机状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时辅助函数 |
    | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助表面 |
  </Accordion>

  <Accordion title="保留的内置辅助子路径">
    | 系列 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support` | 内置 Browser 插件支持辅助函数（`browser-support` 仍然是兼容性 barrel） |
    | Matrix | `plugin-sdk/matrix`、`plugin-sdk/matrix-helper`、`plugin-sdk/matrix-runtime-heavy`、`plugin-sdk/matrix-runtime-shared`、`plugin-sdk/matrix-runtime-surface`、`plugin-sdk/matrix-surface`、`plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助/运行时表面 |
    | Line | `plugin-sdk/line`、`plugin-sdk/line-core`、`plugin-sdk/line-runtime`、`plugin-sdk/line-surface` | 内置 LINE 辅助/运行时表面 |
    | IRC | `plugin-sdk/irc`、`plugin-sdk/irc-surface` | 内置 IRC 辅助表面 |
    | 渠道专用辅助函数 | `plugin-sdk/googlechat`、`plugin-sdk/zalouser`、`plugin-sdk/bluebubbles`、`plugin-sdk/bluebubbles-policy`、`plugin-sdk/mattermost`、`plugin-sdk/mattermost-policy`、`plugin-sdk/feishu-conversation`、`plugin-sdk/msteams`、`plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、`plugin-sdk/twitch` | 内置渠道兼容/辅助入口 |
    | 认证/插件专用辅助函数 | `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、`plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、`plugin-sdk/thread-ownership`、`plugin-sdk/voice-call` | 内置功能/插件辅助入口；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调会收到一个 `OpenClawPluginApi` 对象，它包含以下方法：

### 能力注册

| 方法 | 注册内容 |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM） |
| `api.registerChannel(...)`                       | 消息渠道 |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录 |
| `api.registerRealtimeVoiceProvider(...)`         | 双向实时语音会话 |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析 |
| `api.registerImageGenerationProvider(...)`       | 图像生成 |
| `api.registerVideoGenerationProvider(...)`       | 视频生成 |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商 |
| `api.registerWebSearchProvider(...)`             | Web 搜索 |

### 工具和命令

| 方法 | 注册内容 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`） |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM） |

### 基础设施

| 方法 | 注册内容 |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 hook |
| `api.registerHttpRoute(params)`                | Gateway 网关 HTTP 端点 |
| `api.registerGatewayMethod(name, handler)`     | Gateway 网关 RPC 方法 |
| `api.registerCli(registrar, opts?)`            | CLI 子命令 |
| `api.registerService(service)`                 | 后台服务 |
| `api.registerInteractiveHandler(registration)` | 交互处理器 |

保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持为 `operator.admin`，即使插件尝试分配更窄的 Gateway 网关方法作用域也是如此。对于插件拥有的方法，优先使用插件专属前缀。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种顶层元数据：

- `commands`：由注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和惰性插件 CLI 注册的解析时命令描述符

如果你希望插件命令在正常的根 CLI 路径中保持惰性加载，请提供 `descriptors`，覆盖该注册器公开的每个顶层命令根。

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
        description: "管理 Matrix 账户、验证、设备和配置文件状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅在你不需要惰性根 CLI 注册时，才单独使用 `commands`。这种急切兼容路径仍受支持，但它不会安装带描述符支持的占位符用于解析时惰性加载。

### 独占槽位

| 方法 | 注册内容 |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次仅一个处于活动状态） |
| `api.registerMemoryPromptSection(builder)` | 内存提示词区段构建器 |
| `api.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器 |
| `api.registerMemoryRuntime(runtime)`       | 内存运行时适配器 |

### 内存嵌入适配器

| 方法 | 注册内容 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的内存嵌入适配器 |

- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 仅供内存插件独占使用。
- `registerMemoryEmbeddingProvider` 允许活动内存插件注册一个或多个嵌入适配器 ID（例如 `openai`、`gemini` 或自定义的插件定义 ID）。
- 用户配置，例如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`，会根据这些已注册的适配器 ID 进行解析。

### 事件和生命周期

| 方法 | 作用 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 hook |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调 |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任意处理器设置了它，低优先级处理器就会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为未做决策（等同于省略 `block`），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任意处理器设置了它，低优先级处理器就会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为未做决策（等同于省略 `block`），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任意处理器声明接管分发，低优先级处理器和默认模型分发路径都会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任意处理器设置了它，低优先级处理器就会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为未做决策（等同于省略 `cancel`），而不是覆盖。

### API 对象字段

| 字段 | 类型 | 描述 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 ID |
| `api.name`               | `string`                  | 显示名称 |
| `api.version`            | `string?`                 | 插件版本（可选） |
| `api.description`        | `string?`                 | 插件描述（可选） |
| `api.source`             | `string`                  | 插件源码路径 |
| `api.rootDir`            | `string?`                 | 插件根目录（可选） |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动内存运行时快照） |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置 |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助函数](/zh-CN/plugins/sdk-runtime) |
| `api.logger`             | `PluginLogger`            | 作用域 logger（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置前的轻量窗口 |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径 |

## 内部模块约定

在你的插件内部，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 供外部使用者使用的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅用于轻量设置的入口（可选）
```

<Warning>
  不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入你自己的插件。
  应通过 `./api.ts` 或 `./runtime-api.ts` 进行内部导入。SDK 路径仅是外部契约。
</Warning>

门面加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）现在会在 OpenClaw 已运行时优先使用活动运行时配置快照。如果运行时快照尚不存在，它们会回退到磁盘上解析得到的配置文件。

当某个辅助函数明确属于提供商专用、尚不适合放入通用 SDK 子路径时，提供商插件也可以公开一个窄范围的插件本地契约 barrel。当前内置示例：Anthropic 提供商将其 Claude 流辅助函数保留在自己的公共 `api.ts` / `contract-api.ts` 入口中，而不是将 Anthropic beta-header 和 `service_tier` 逻辑提升为通用 `plugin-sdk/*` 契约。

其他当前内置示例：

- `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、默认模型辅助函数和实时提供商构建器
- `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器以及新手引导/配置辅助函数

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助函数确实需要共享，应将其提升到中立的 SDK 子路径，例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他面向能力的表面，而不是让两个插件彼此耦合。
</Warning>

## 相关内容

- [入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry` 选项
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime) — 完整的 `api.runtime` 命名空间参考
- [设置和配置](/zh-CN/plugins/sdk-setup) — 打包、清单、配置 schema
- [测试](/zh-CN/plugins/sdk-testing) — 测试工具和 lint 规则
- [SDK 迁移](/zh-CN/plugins/sdk-migration) — 从已弃用表面迁移
- [插件内部机制](/zh-CN/plugins/architecture) — 深入的架构和能力模型
