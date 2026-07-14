---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在将插件更新为现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-07-14T13:49:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7afd1c39e33f90c19e3e75824abb81074d0699ff0e49bb1d9d577d4e3a3e91bf
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已将宽泛的向后兼容层替换为由小型、聚焦的导入构成的现代插件架构。如果你的插件早于这项变更，本指南可帮助它迁移到当前契约。

## 变更内容

过去有两个完全开放的导入接口，允许插件从单个入口点访问几乎所有内容：

- **`openclaw/plugin-sdk/compat`** - 重新导出了数十个辅助函数，以便在构建新架构期间继续支持较旧的基于钩子的插件。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的聚合导出，混合了系统事件、Heartbeat 状态、投递队列、提取/代理辅助函数、文件辅助函数、审批类型和无关的实用工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置聚合导出，在迁移窗口期间仍包含已弃用的直接加载/写入辅助函数。
- **`openclaw/extension-api`** - 一个桥接接口，让插件能够直接访问主机端辅助函数，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已移除且仅适用于嵌入式运行器的钩子，用于观察 `tool_result` 等嵌入式运行器事件。请改用智能体工具结果中间件（参见[将嵌入式工具结果扩展迁移到中间件](#how-to-migrate)）。

这些接口已**弃用**：它们仍然可用，但新插件不得使用，现有插件也应在下一个主要版本将其移除之前完成迁移。`registerEmbeddedExtensionFactory` 已经移除；旧版注册不再加载。

<Warning>
  向后兼容层将在未来的主要版本中移除。届时，仍从这些接口导入的插件将无法运行。
</Warning>

OpenClaw 不会在引入替代方案的同一项变更中移除或重新解释已有文档说明的插件行为。破坏性契约变更会先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子和运行时注册行为。

### 原因

- **启动缓慢** - 导入一个辅助函数就会加载数十个无关模块。
- **循环依赖** - 宽泛的重新导出很容易造成导入循环。
- **API 接口不明确** - 无法区分稳定导出和内部导出。

现在，每个 `openclaw/plugin-sdk/<subpath>` 都是一个小型、自包含且具有文档化契约的模块。

内置渠道的旧版提供商便捷接口也已移除——带渠道品牌的辅助函数快捷方式只是单体仓库内部的便捷功能，并非稳定的插件契约。请改用范围更窄的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的辅助函数保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中：

- Anthropic 将 Claude 专用的流辅助函数保留在自己的 `api.ts` / `contract-api.ts` 接口中。
- OpenAI 将提供商构建器、默认模型辅助函数和实时提供商构建器保留在自己的 `api.ts` 中。
- OpenRouter 将提供商构建器以及新手引导/配置辅助函数保留在自己的 `api.ts` 中。

## 兼容性策略

外部插件的兼容性工作遵循以下顺序：

1. 添加新契约。
2. 通过兼容性适配器继续接入旧行为。
3. 发出诊断或警告，指出旧路径及其替代方案。
4. 在测试中覆盖两条路径。
5. 记录弃用信息和迁移路径。
6. 仅在已公布的迁移窗口结束后移除，通常是在主要版本中。

如果某个清单字段仍然被接受，请继续使用，直至文档和诊断另有说明。新代码应优先采用有文档说明的替代方案；现有插件不应在普通的次要版本发布期间发生破坏。

使用 `pnpm plugins:boundary-report` 审核当前迁移队列：

| 标志                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 显示精简计数，而非完整详情。                                         |
| `--json`                                                | 机器可读报告。                                                       |
| `--owner <id>`                                          | 筛选至单个插件或兼容性所有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨所有者的保留 SDK 导入时以非零状态退出。                             |
| `--fail-on-eligible-compat`                             | 已弃用兼容性记录的 `removeAfter` 日期已过时，以非零状态退出。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用的保留 SDK 兼容层时以非零状态退出。                                    |

`pnpm plugins:boundary-report:ci` 会启用全部三个失败标志。每条兼容性记录都有明确的 `removeAfter` 日期（而不是模糊的“下一个主要版本”）——报告会按该日期对已弃用记录分组，统计本地代码/文档引用，显示跨所有者的保留 SDK 导入，并汇总私有的内存主机 SDK 桥接接口。保留的 SDK 子路径必须具有已跟踪的所有者使用记录；未使用的保留导出应从公共 SDK 中移除。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助函数">
    内置插件应停止直接调用 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。应优先使用已传入当前调用路径的配置。需要当前进程快照的长生命周期处理程序可以使用 `api.runtime.config.current()`。长生命周期智能体工具应在 `execute` 内读取 `ctx.getRuntimeConfig()`，这样在配置写入前创建的工具仍能看到刷新后的配置。

    配置写入通过事务辅助函数完成，并显式指定写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当变更需要干净地重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；仅当调用方负责后续处理并有意抑制重新加载规划器时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含类型化的 `followUp` 摘要，用于测试和日志；Gateway 网关仍负责应用或安排重启。

    `loadConfig` 和 `writeConfigFile` 仍作为面向外部插件的已弃用兼容性辅助函数保留，并会使用 `runtime-config-load-write` 兼容性代码发出一次警告。内置插件和仓库运行时代码受 `pnpm check:deprecated-api-usage` 和 `pnpm check:no-runtime-action-load-config` 保护：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时渠道发送/操作/客户端辅助函数必须从其边界接收配置，并且长生命周期运行时模块不允许调用任何环境式 `loadConfig()`。

    新插件代码应避免使用宽泛的 `openclaw/plugin-sdk/config-runtime` 聚合导出。请根据具体用途使用范围较窄的子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置的断言、插件入口配置查找和配置合并 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试受到扫描器保护，不得使用宽泛的聚合导出，以便导入和模拟仅限于其所需行为。该聚合导出仍然为外部兼容性而保留，但新代码不应依赖它。

  </Step>

  <Step title="将嵌入式工具结果扩展迁移到中间件">
    内置插件必须将仅适用于嵌入式运行器的 `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序替换为与运行时无关的中间件：

    ```typescript
    // OpenClaw 和 Codex 运行时动态工具
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同时更新插件清单：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    安装的插件在显式启用后也可以注册工具结果中间件，但必须在 `contracts.agentToolResultMiddleware` 中声明所有目标运行时。未声明的已安装中间件注册会被拒绝。

  </Step>

  <Step title="将原生审批处理程序迁移到能力事实">
    支持审批的渠道插件通过 `approvalCapability.nativeRuntime` 和共享运行时上下文注册表公开原生审批行为：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为 `approvalCapability.nativeRuntime`。
    - 将审批专用的身份验证/投递从旧版 `plugin.auth` / `plugin.approvals` 接线迁移到 `approvalCapability`。
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；将投递/原生/渲染字段移至 `approvalCapability`。
    - `plugin.auth` 仅保留用于渠道登录/退出流程；核心不再从中读取审批身份验证钩子。
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象（客户端、令牌、Bolt 应用）。
    - 不要从原生审批处理程序发送插件拥有的重新路由通知；核心根据实际投递结果负责发送已路由至其他位置的通知。
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供真实的 `createPluginRuntime().channel` 接口——不完整的存根会被拒绝。

    有关当前审批能力布局，请参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="审核 Windows 包装器的回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，无法解析的 Windows `.cmd`/`.bat` 包装器现在会以关闭方式失败，除非你显式传入 `allowShellFallback: true`：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之后
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅为有意接受由 shell 介导的回退行为的可信兼容性调用方设置此项。
      allowShellFallback: true,
    });
    ```

    如果调用方并非有意依赖 shell 回退，请勿设置 `allowShellFallback`，而应改为处理抛出的错误。

  </Step>

  <Step title="查找已弃用的导入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替换为聚焦导入">
    旧接口中的每项导出都映射到一个特定的现代导入路径：

    ```typescript
    // 之前（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之后（现代聚焦导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机端辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 之后（注入的运行时）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助函数也遵循相同模式：

    | 旧导入 | 现代等效项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储辅助函数 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替换宽泛的 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性而保留，但新代码应导入实际需要的专用接口：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待处理投递队列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存及持久化支持的去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 支持调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解决类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 等待传输就绪 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 用于可证明不变量的必需值断言 | `openclaw/plugin-sdk/expect-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    扫描器会阻止内置插件使用 `infra-runtime`，因此仓库代码无法退回到宽泛的桶文件。

  </Step>

  <Step title="迁移渠道路由辅助函数">
    新的渠道路由代码使用 `openclaw/plugin-sdk/channel-route`。旧版路由键和可比较目标名称仍作为兼容性别名保留：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。

    不要新增对 `ChannelMessagingAdapter.parseExplicitTarget`、基于解析器的已加载路由辅助函数（`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`）或来自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 的使用——这些均已弃用，仅为旧版插件保留。新的渠道插件应使用 `messaging.targetResolver.resolveTarget(...)` 进行目标 ID 规范化和目录未命中回退；当核心需要提前确定对等端类型时，使用 `messaging.inferTargetChatType(...)`；对于提供商原生的会话和线程标识，使用 `messaging.resolveOutboundSessionRoute(...)`。

  </Step>

  <Step title="构建和测试">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="Common import path table">
  | 导入路径 | 用途 | 主要导出项 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于渠道入口定义和构建器的旧版统一重新导出 | `defineChannelPluginEntry`、`createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置架构导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 专用渠道入口定义和构建器 | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 设置转换器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助工具 | `createSetupTranslator`、导入安全的设置补丁适配器、查找备注辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表、配置和操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账户 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找和默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 精简账户辅助工具 | 账户列表和账户操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对基础组件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和来源投递接线 | `createChannelReplyPipeline`、`resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助工具 | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置架构构建器 | 仅包含共享渠道配置架构基础组件和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置架构 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地架构 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置架构 | 仅作为兼容性别名；对于仍在维护的内置插件，请使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述修剪、重复和冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由和信封构建器辅助工具 |
  | `plugin-sdk/channel-inbound` | 入站接收辅助工具 | 上下文构建、格式化、根目录、运行器、预备回复分派和分派谓词 |
  | `plugin-sdk/messaging-targets` | 已弃用的目标解析导入路径 | 通用目标解析辅助工具请使用 `plugin-sdk/channel-targets`，路由比较请使用 `plugin-sdk/channel-route`，提供商专用目标解析请使用插件自有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 出站消息生命周期辅助工具 | 消息适配器、回执、持久发送辅助工具、实时预览/流式传输辅助工具、回复选项、生命周期辅助工具、出站身份和载荷规划 |
  | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助工具 | 用于旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅限旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 通用运行时辅助工具 | 运行时、日志、备份和插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 精简运行时环境辅助工具 | 日志记录器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令、钩子、HTTP 和交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子管线辅助工具 | 共享 Webhook/内部钩子管线辅助工具 |
  | `plugin-sdk/lazy-runtime` | 延迟加载运行时辅助工具 | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeMethodBinder`、`createLazyRuntimeNamedExport`、`createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 Exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待和版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端、事件循环就绪启动辅助工具、公布的 LAN 主机解析和渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 内置 Telegram 契约表面不可用时保持回退稳定的 Telegram 命令验证辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | Exec/插件审批载荷、审批能力/配置文件辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批身份验证辅助工具 | 审批人解析、同一聊天操作身份验证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 Exec 审批配置文件/筛选器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析器 |
  | `plugin-sdk/approval-reference-runtime` | 审批传输引用 | 用于传输受限回调的确定性持久定位器辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助工具 | 用于渠道热路径入口点的轻量级原生审批适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理程序辅助工具 | 更通用的审批处理程序运行时辅助工具；当更精简的适配器/Gateway 网关接缝足够时，优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | Exec/插件审批回复载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/获取/监视辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、根目录边界内的文件/路径、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和专用网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定分派器、受保护的 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`（包括按键替换）、`peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助工具 | Heartbeat 唤醒、事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存和持久化后端去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全的本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略辅助工具 | `loadExecApprovals`、`resolveExecApprovalsFromFile`、`ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`、`isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误辅助工具 | `formatUncaughtError`、`isApprovalNotFoundError`、错误图辅助工具、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | 封装的 fetch/代理辅助工具 | `resolveFetch`、代理辅助工具、EnvHttpProxyAgent 选项辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`、`normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`、`retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化和输入映射 | `formatAllowFromLowercase`、`mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具（包括动态参数菜单格式化） |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分派、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 精简回复分派辅助工具 | 完成处理、提供商分派和对话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `createChannelHistoryWindow`；已弃用的映射辅助工具兼容性导出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/Markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 作用域会话行辅助工具、存储路径辅助工具和更新时间读取 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、会话键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助工具 | 渠道/账户状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | Slug/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 具有规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 常用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送信息提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统日志记录器和脱敏辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助工具 | 自托管提供商发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 专用的 OpenAI 兼容自托管提供商设置辅助工具 | 相同的自托管提供商发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时身份验证辅助工具 | 运行时 API 密钥解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置辅助工具 | API 密钥新手引导/配置文件写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | 提供商身份验证结果辅助工具 | 标准 OAuth 身份验证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助工具 | 已配置或自动选择提供商，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助工具 | 提供商身份验证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助工具和模型 ID 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助工具 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助工具 | 通用提供商 HTTP/端点能力辅助工具，包括音频转录 multipart 表单辅助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供商 Web 获取辅助工具 | Web 获取提供商注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助工具 | 面向不需要插件启用接线的提供商的精简 Web 搜索配置/凭据辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助工具 | 精简 Web 搜索配置/凭据契约辅助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定作用域的凭据设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助工具 | Web 搜索提供商注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容性辅助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 架构清理和诊断 |
  | `plugin-sdk/provider-usage` | 提供商用量辅助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供商用量辅助工具 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助工具 | 原生提供商传输辅助工具，例如受保护的 fetch、工具结果文本提取、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/转换/存储辅助工具、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 用于图像/视频/音乐生成的共享故障转移辅助工具、候选项选择和模型缺失消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解提供商类型，以及面向提供商的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容性导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本和保留偏移量的范围分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音提供商类型，以及面向提供商的指令、注册表、验证辅助工具和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令和规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | 提供商类型、注册表辅助工具和共享 WebSocket 会话辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | 提供商类型、注册表/解析辅助工具、桥接会话辅助工具、共享智能体回话队列、活动运行语音控制、转录/事件健康状况、回声抑制、咨询问题匹配、强制咨询协调、轮次上下文跟踪、输出活动跟踪和快速上下文咨询辅助工具 |
  | `plugin-sdk/image-generation` | 图像生成辅助工具 | 图像生成提供商类型，以及图像资产/数据 URL 辅助工具和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、身份验证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助工具、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复载荷规范化/精简 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基元 | 精简渠道配置架构基元 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助工具 | 渠道配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前置模块 | 共享渠道插件前置模块导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助工具 | 共享渠道状态快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助工具 | 允许列表配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私信防护辅助工具 | 精简的加密前防护策略辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动渠道/状态和环境代理辅助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助工具 | Webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容性重新导出 | 直接从 `zod` 导入 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助工具 | 记忆管理器/配置/文件/CLI 辅助工具界面 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时门面 | 记忆索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 记忆嵌入注册表 | 轻量级记忆嵌入提供商注册表辅助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎 | 记忆宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商和通用批处理/远程辅助工具；具体的远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎 | 记忆宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎 | 记忆宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助工具 | 记忆宿主多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助工具 | 记忆宿主查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | 记忆宿主机密信息辅助工具 | 记忆宿主机密信息辅助工具 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的记忆事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助工具 | 记忆宿主状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时 | 记忆宿主 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时 | 记忆宿主核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助工具 | 记忆宿主文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时别名 | 记忆宿主核心运行时辅助工具的供应商中立别名 |
  | `plugin-sdk/memory-host-events` | 记忆宿主事件日志别名 | 记忆宿主事件日志辅助工具的供应商中立别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的记忆文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 面向记忆相关插件的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索门面 | 延迟加载的主动记忆搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 已弃用的记忆宿主状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用工具 | 仓库本地已弃用的兼容性汇总导出；请使用聚焦的仓库本地测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

  此表仅涵盖通用迁移子集，并非完整的 SDK 接口范围。编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；
  包导出由公共子集生成。

  除明确记录的兼容性门面外，内置插件专用的保留辅助接口已从公共 SDK
  导出映射中移除；例如，已弃用的 `plugin-sdk/discord` shim 仍予以保留，供仍直接
  导入已发布 `@openclaw/discord` 包的外部插件使用。所有者专用的
  辅助工具位于对应插件包内部；共享的宿主行为则通过通用 SDK 契约实现，例如 `plugin-sdk/gateway-runtime`、
  `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

  请使用与任务相符的最精确导入路径。如果找不到某项导出，
  请查看 `src/plugin-sdk/` 中的源代码，或询问维护者应由哪个通用
  契约负责该功能。

  ## 当前弃用项

  插件 SDK、提供商契约、运行时
  接口和清单中的细粒度弃用项。它们目前仍可使用，但将在未来的
  主要版本中移除。每个条目都将旧 API 映射到其规范替代项。

  <AccordionGroup>
  <Accordion title="command-auth 帮助构建器 -> command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：签名和
    导出均保持不变，只需从范围更精确的子路径导入。`command-auth`
    将它们重新导出为兼容性存根。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之后
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助工具 -> resolveInboundMentionDecision">
    **旧版**：来自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveMentionGating(params)` 和
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用单个决策
    对象，而非两个分离的调用形式。

    Discord、iMessage、Matrix、MS Teams、QQ Bot、Signal、
    Telegram、WhatsApp 和 Zalo 均已采用。Slack 自身的 `app_mention` 事件模型
    不使用此辅助工具。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道操作辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是供旧版
    渠道插件使用的兼容性 shim。新代码不得导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助工具
    已与原始的 “actions” 渠道导出一同弃用。请改为通过语义化的 `presentation`
    接口公开能力——渠道插件声明其呈现的内容（卡片、按钮、选择器），而非其接受的原始
    操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助工具 -> 插件上的 createTool()">
    **旧版**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新版**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要通过 SDK 辅助工具注册工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道信封 -> BodyForAgent">
    **旧版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`（以及入站消息对象上的
    `channelEnvelope` 字段）从入站渠道消息构建扁平的
    纯文本提示词信封。

    **新版**：使用 `BodyForAgent` 加结构化用户上下文块。渠道
    插件将路由元数据（线程、主题、回复目标、表情回应）附加为
    类型化字段，而非将它们拼接到提示词字符串中。`formatAgentEnvelope(...)`
    辅助工具仍支持用于合成面向助手的信封，但入站纯文本信封正在逐步
    淘汰。

    受影响区域：`inbound_claim`、`message_received`，以及任何对旧信封文本
    进行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="deactivate 钩子 -> gateway_stop">
    **旧版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。关闭清理
    契约不变；仅钩子名称发生变化。

    ```typescript
    // 之前
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // 之后
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 在 2026-08-16 之后移除之前，仍作为已弃用的兼容性别名接入。

  </Accordion>

  <Accordion title="subagent_spawning 钩子 -> 核心线程绑定">
    **旧版**：`api.on("subagent_spawning", handler)` 返回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：让核心通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。
    仅将 `api.on("subagent_spawned", handler)` 用于启动后的观察。

    ```typescript
    // 之前
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // 之后
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    在外部插件迁移期间，`subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 仅作为
    已弃用的兼容性接口保留，并将在 2026-08-30 之后移除。

  </Accordion>

  <Accordion title="提供商发现类型 -> 提供商目录类型">
    现在，四个发现类型别名只是目录时代类型的轻量包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    此外还有旧版 `ProviderCapabilities` 静态集合——提供商插件
    应使用 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn` 等显式提供商钩子，
    而非静态对象。

  </Accordion>

  <Accordion title="思考策略钩子 -> resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：使用单个 `resolveThinkingProfile(ctx)`，它返回
    `ProviderThinkingProfile`，其中包含规范的 `id`、可选的 `label` 和一个
    按优先级排列的级别列表。OpenClaw 会根据配置文件优先级自动
    降级过期的已存储值。

    上下文包含 `provider`、`modelId`、可选的合并 `reasoning`
    以及可选的合并模型 `compat` 事实。仅当已配置的
    请求契约支持时，提供商插件才能使用这些目录事实公开特定于模型的配置文件。

    请实现一个钩子，而非三个。旧版钩子在
    弃用期内仍然有效，但不会与配置文件结果组合。

  </Accordion>

  <Accordion title="外部身份验证提供商 -> contracts.externalAuthProviders">
    **旧版**：实现外部身份验证钩子，但未在插件清单中声明提供商。

    **新版**：在插件清单中声明 `contracts.externalAuthProviders`
    **并**实现 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商环境变量查找 -> setup.providers[].envVars">
    **旧版**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找镜像到清单的 `setup.providers[].envVars`
    中。这会将设置/状态环境元数据整合到一个位置，
    并避免仅为响应环境变量查找而启动插件运行时。

    在弃用期结束之前，`providerAuthEnvVars` 仍通过兼容性适配器
    获得支持。

  </Accordion>

  <Accordion title="记忆插件注册 -> registerMemoryCapability">
    **旧版**：三个独立调用——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：在记忆状态 API 上执行一次调用——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    插槽相同，只需一次注册调用。增量提示词和语料库辅助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）不受影响。

  </Accordion>

  <Accordion title="记忆嵌入提供商 API">
    **旧版**：`api.registerMemoryEmbeddingProvider(...)` 加
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加
    `contracts.embeddingProviders`。

    通用嵌入提供商契约可在记忆之外复用，并且是
    新提供商支持的路径。在现有提供商
    迁移期间，记忆专用注册 API 仍作为已弃用兼容性接口接入。
    插件检查会将非内置插件的使用报告为兼容性债务。

  </Accordion>

  <Accordion title="原始渠道发送结果 -> OutboundDeliveryResult">
    **旧版**：通过 `ChannelSendRawResult` 返回 `{ ok, messageId, error }`，
    并使用 `createRawChannelSendResultAdapter(...)`
    将其规范化。

    **新版**：返回 `OutboundDeliveryResult` 字段，并通过
    `createAttachedChannelResultAdapter(...)` 附加渠道。发送失败时应抛出异常，
    而非返回错误字符串。原始结果类型将在下一个插件 SDK 主要版本发布前
    保持可用。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    `src/plugins/runtime/types.ts` 仍导出两个旧版类型别名：

    | 旧版                          | 新版                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，请改用
    `getSessionMessages`。两者签名相同；旧方法会调用
    新方法。

  </Accordion>

  <Accordion title="已移除的会话和转录文件 API">
    切换到 SQLite 会话/转录后，暴露活动 `sessions.json` 存储、
    JSONL 转录路径或会话文件列表的插件接口 API 已被移除或弃用。
    运行时插件应使用会话身份和 SDK 运行时辅助工具，而非解析或修改
    活动文件。

    | 迁移接口 | 替代项 |
    | ----------------- | ----------- |
    | 已弃用的 `loadSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)` 和行级会话变更。 |
    | 已弃用的 `resolveSessionFilePath(...)` | 会话身份（`sessionKey`、`sessionId` 和 SDK 运行时目标辅助工具），以及对当前会话执行操作的 Gateway 网关方法。 |
    | 已移除的 `saveSessionStore(...)` | Gateway 网关所有的会话运行时 API；插件代码应通过已记录的运行时/上下文辅助工具请求或修改会话状态，而非写入活动存储文件。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 和 `resolveAndPersistSessionFile(...)` | 会话身份，以及对当前会话执行操作的 Gateway 网关方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 当前运行时上下文公开的基于身份的转录读取器；如果插件位于转录所有者路径之外，则使用 Gateway 网关历史记录/会话方法。 |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target`，搭配 `agentId`、`sessionKey` 和 `sessionId`。 |
    | `sessionFiles` 等记忆同步输入 | 宿主提供的基于身份的转录/会话来源；请勿为实时会话遍历活动 JSONL 文件。 |
    | 活动会话中名为 `transcriptPath` 或 `sessionFile` 的运行时选项 | 携带与存储无关的会话身份的 `sessionTarget`/运行时目标对象。 |

    旧版 JSONL 转录文件作为导入、归档、导出和
    支持工件仍然有效。它们不再是活动会话的稳态运行时契约。

    随 `v2026.7.1-beta.5` 发布的官方插件导入了上述四个
    已弃用辅助函数。`openclaw/plugin-sdk/session-store-runtime` 会将
    这一完全相同的桥接保留至 2026-10-12；新插件必须使用替代项。
    `resolveStorePath(...)` 仍是受支持的 SDK 辅助函数，不属于
    此次弃用范围。

    `openclaw plugins inspect --all --runtime` 会报告加载错误或诊断信息中
    仍引用这些已移除文件 API 的非内置插件。`@openclaw/plugin-inspector`
    建议扫描必须使用 `0.3.17` 或更高版本，以便外部包扫描
    也能在发布前标记整个存储区的会话辅助函数、会话文件路径辅助函数、
    旧版转录文件目标以及底层转录辅助函数。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧版**：`runtime.tasks.flow`（单数形式）返回一个实时任务流
    访问器。

    **新版**：`runtime.tasks.managedFlows` 为需要从流程中创建、更新、取消或运行
    子任务的插件保留托管式 TaskFlow 变更运行时。当插件只需要
    基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之后
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    将于 2026-07-26 后移除。

  </Accordion>

  <Accordion title="嵌入式扩展工厂 -> 智能体工具结果中间件">
    上文的[如何迁移](#how-to-migrate)中已介绍。此处列出是为了
    保持完整：已移除的仅限嵌入式运行器的
    `api.registerEmbeddedExtensionFactory(...)` 路径，现由 `api.registerAgentToolResultMiddleware(...)`
    替代，并在 `contracts.agentToolResultMiddleware` 中显式指定运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 -> OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行别名。请优先使用规范名称。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之后
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级弃用项（位于 `extensions/` 下的内置渠道/提供商插件中）
在其各自的 `api.ts` 和 `runtime-api.ts`
导出入口中跟踪。它们不影响第三方插件契约，因此未在此处列出。
如果直接使用内置插件的本地导出入口，请在升级前阅读
该导出入口中的弃用注释。
</Note>

## Talk 与实时语音迁移

实时语音、电话、会议和浏览器 Talk 代码共用一个由
`openclaw/plugin-sdk/realtime-voice` 导出的 Talk 会话控制器。该控制器负责
通用 Talk 事件信封、活动轮次状态、采集状态、输出音频状态、
近期事件历史记录以及陈旧轮次拒绝。提供商插件负责供应商特定的实时会话；
表层插件负责采集、播放、电话和会议的特殊处理。

所有内置表层均运行于共享控制器之上：浏览器中继、
托管房间交接、语音通话实时模式、语音通话流式 STT、Google
Meet 实时模式以及原生按住说话。Gateway 网关在
`hello-ok.features.events` 中公布一个实时 Talk 事件渠道：`talk.event`。

除非正在实现底层适配器或测试夹具，否则新代码不应直接调用
`createTalkEventSequencer(...)`。请使用共享控制器，以确保无法在没有轮次 ID 的情况下
发出轮次范围事件，陈旧的 `turnEnd` /
`turnCancel` 调用无法清除较新的活动轮次，并使输出音频
生命周期事件在电话、会议、浏览器中继、托管房间交接和原生 Talk
客户端之间保持一致。

公共 API 形式：

```typescript
// Gateway 网关负责的 Talk 会话 API。
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// 客户端负责的提供商会话 API。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

浏览器负责的 WebRTC/提供商 WebSocket 会话使用 `talk.client.create`，
因为浏览器负责提供商协商和媒体传输，而 Gateway 网关负责凭据、
指令和工具策略。`talk.session.*` 是 Gateway 网关管理的通用表层，
适用于 Gateway 网关中继实时模式、Gateway 网关中继转录以及
托管房间原生 STT/TTS 会话。

对于将实时选择器放在 `talk.provider` /
`talk.providers` 旁边的旧版配置，应使用 `openclaw doctor --fix` 修复；
运行时 Talk 不会将语音/TTS 提供商配置重新解释为实时提供商配置。

受支持的 `talk.session.create` 组合有意保持精简：

| 模式            | 传输方式       | 核心           | 负责方              | 说明                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关            | 通过 Gateway 网关桥接的全双工提供商音频；工具调用通过 agent-consult 工具路由。           |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关            | 仅流式 STT；调用方发送输入音频并接收转录事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间 | 按住说话和对讲机式房间，客户端负责采集/播放，Gateway 网关负责轮次状态。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间 | 仅限管理员的房间模式，供受信任的第一方表层直接执行 Gateway 网关工具操作。                  |

供从旧版 `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` 系列迁移的读者参考的方法映射（均已移除）：

| 旧版                              | 新版                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

统一的控制词汇也刻意保持精简：

| 方法                          | 适用范围                                              | 契约                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 将一个 base64 PCM 音频块追加到由同一 Gateway 网关连接负责的提供商会话。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 启动托管房间用户轮次。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在完成陈旧轮次验证后结束活动轮次。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有由 Gateway 网关负责的会话                              | 取消某轮次的活动采集/提供商/智能体/TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助手音频输出，而不一定结束用户轮次。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其桥接所公开的任何异步完成操作结束后，完成提供商工具调用；传入 `options.willContinue` 以生成中间输出，或在受支持时传入 `options.suppressResponse` 以避免再次产生助手响应。 |
| `talk.session.steer`            | 由智能体支持的 Talk 会话                              | 将口述的 `status`、`steer`、`cancel` 或 `followup` 控制发送到从 Talk 会话解析出的活动嵌入式运行。                                                                                                 |
| `talk.session.close`            | 所有统一会话                                    | 停止中继会话或撤销托管房间状态，然后删除统一会话 ID。                                                                                                                                     |

不要为了实现此功能而在核心中引入提供商或平台特例。
核心负责 Talk 会话语义。提供商插件负责供应商会话设置。
语音通话和 Google Meet 负责电话/会议适配器。浏览器和原生
应用负责设备采集/播放用户体验。

## 移除时间表

| 时间                                        | 发生的情况                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **现在**                                     | 已弃用的接口会发出运行时警告。                                                                                             |
| **每条兼容性记录的 `removeAfter` 日期** | 该特定接口从此可以移除；日期一过，`pnpm plugins:boundary-report --fail-on-eligible-compat` 就会导致 CI 失败。 |
| **下一个主要版本**                      | 所有仍未迁移的接口都会被移除；仍在使用这些接口的插件将会失败。                                                       |

所有核心插件都已完成迁移。外部插件应在下一个主要版本发布前完成迁移。运行 `pnpm plugins:boundary-report`，查看你的插件所用接口中哪些兼容性记录最早到期。

## 暂时禁止显示警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这只是临时的应急手段，并非永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 深入了解架构
- [插件清单](/zh-CN/plugins/manifest) - 清单架构参考
