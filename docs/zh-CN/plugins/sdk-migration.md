---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你曾在 OpenClaw 2026.4.25 之前使用 `api.registerEmbeddedExtensionFactory`
    - 你正在将插件更新为现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-07-12T14:40:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已将宽泛的向后兼容层替换为由小型、聚焦的导入构成的现代插件架构。如果你的插件早于这一变更，本指南将帮助它迁移到当前契约。

## 发生了什么变化

过去有两个完全开放的导入接口，允许插件通过单个入口点访问几乎所有内容：

- **`openclaw/plugin-sdk/compat`** - 重新导出数十个辅助函数，以便在构建新架构期间保持旧版基于钩子的插件正常工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的桶式导出，混合了系统事件、Heartbeat 状态、投递队列、获取/代理辅助函数、文件辅助函数、审批类型和无关的实用工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置桶式导出，在迁移窗口期间仍包含已弃用的直接加载/写入辅助函数。
- **`openclaw/extension-api`** - 一个桥接接口，使插件可直接访问宿主侧辅助函数，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已移除的仅限嵌入式运行器使用的钩子，用于观察 `tool_result` 等嵌入式运行器事件。请改用智能体工具结果中间件（参见[将嵌入式工具结果扩展迁移到中间件](#how-to-migrate)）。

这些接口均已**弃用**：它们目前仍然可用，但新插件不得使用，现有插件也应在下一个主要版本移除它们之前完成迁移。`registerEmbeddedExtensionFactory` 已被移除；旧版注册不再加载。

<Warning>
  向后兼容层将在未来的主要版本中移除。届时，仍从这些接口导入内容的插件将无法正常工作。
</Warning>

OpenClaw 不会在引入替代方案的同一变更中移除或重新解释已记录的插件行为。破坏性契约变更会先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、插件清单字段、设置 API、钩子和运行时注册行为。

### 原因

- **启动缓慢** - 导入一个辅助函数会加载数十个无关模块。
- **循环依赖** - 宽泛的重新导出很容易形成导入循环。
- **API 接口不明确** - 无法区分稳定导出和内部导出。

现在，每个 `openclaw/plugin-sdk/<subpath>` 都是一个具有文档化契约的小型独立模块。

内置渠道的旧版提供商便捷接口也已移除——带渠道品牌的辅助函数快捷方式是私有单体仓库中的便捷机制，而不是稳定的插件契约。请改用范围狭窄的通用 SDK 子路径。在内置插件工作区中，将提供商所有的辅助函数保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中：

- Anthropic 将 Claude 专用的流式辅助函数保留在其自己的 `api.ts` / `contract-api.ts` 接口中。
- OpenAI 将提供商构建器、默认模型辅助函数和实时提供商构建器保留在其自己的 `api.ts` 中。
- OpenRouter 将提供商构建器和新手引导/配置辅助函数保留在其自己的 `api.ts` 中。

## 兼容性策略

外部插件兼容性工作遵循以下顺序：

1. 添加新契约。
2. 通过兼容性适配器继续连接旧行为。
3. 发出诊断或警告，指出旧路径和替代方案。
4. 在测试中覆盖两条路径。
5. 记录弃用和迁移路径。
6. 仅在已公告的迁移窗口结束后移除，通常是在主要版本中。

如果某个插件清单字段仍被接受，请继续使用，直至文档和诊断另有说明。新代码应优先使用文档中说明的替代方案；现有插件不应在常规次要版本发布期间发生故障。

使用 `pnpm plugins:boundary-report` 审核当前迁移队列：

| 标志                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 显示紧凑计数，而非完整详情。                                         |
| `--json`                                                | 生成机器可读的报告。                                                       |
| `--owner <id>`                                          | 筛选到单个插件或兼容性所有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨所有者的保留 SDK 导入时以非零状态退出。                             |
| `--fail-on-eligible-compat`                             | 当弃用兼容性记录的 `removeAfter` 日期已过时，以非零状态退出。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用且未分类的保留 SDK 垫片时以非零状态退出。                                    |

`pnpm plugins:boundary-report:ci` 会启用全部三个失败标志。每条兼容性记录都有明确的 `removeAfter` 日期（而不是模糊的“下一个主要版本”）——报告会按该日期对弃用记录进行分组，统计本地代码/文档引用，显示跨所有者的保留 SDK 导入，并汇总私有的记忆宿主 SDK 桥接。保留的 SDK 子路径必须具有可追踪的所有者使用记录；未使用的保留导出应从公共 SDK 中移除。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助函数">
    内置插件应停止直接调用 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已传入当前调用路径的配置。需要当前进程快照的长生命周期处理程序可以使用 `api.runtime.config.current()`。长生命周期智能体工具应在 `execute` 内部读取 `ctx.getRuntimeConfig()`，以便在配置写入之前创建的工具仍能看到刷新后的配置。

    配置写入通过事务辅助函数进行，并明确指定写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当变更需要彻底重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；仅当调用方负责后续操作并有意禁止重新加载规划器时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含类型化的 `followUp` 摘要，供测试和日志使用；Gateway 网关仍负责应用或安排重启。

    `loadConfig` 和 `writeConfigFile` 仍作为面向外部插件的弃用兼容性辅助函数保留，并使用 `runtime-config-load-write` 兼容性代码发出一次警告。内置插件和仓库运行时代码受 `pnpm check:deprecated-api-usage` 和 `pnpm check:no-runtime-action-load-config` 保护：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求的运行时快照，运行时渠道发送/操作/客户端辅助函数必须从其边界接收配置，并且长生命周期运行时模块不允许在环境中调用任何 `loadConfig()`。

    新插件代码应避免使用宽泛的 `openclaw/plugin-sdk/config-runtime` 桶式导出。请根据任务使用范围狭窄的子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-contracts` |
    | 已加载的配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 读取当前运行时快照 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    扫描器会阻止内置插件及其测试使用这一宽泛的桶式导出，使导入和模拟仅限于其所需的行为。该桶式导出仍为外部兼容性而存在，但新代码不应依赖它。

  </Step>

  <Step title="将嵌入式工具结果扩展迁移到中间件">
    内置插件必须将仅限嵌入式运行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序替换为运行时无关的中间件：

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

    已安装的插件在明确启用且每个目标运行时均已在 `contracts.agentToolResultMiddleware` 中声明时，也可以注册工具结果中间件。未声明的已安装中间件注册会被拒绝。

  </Step>

  <Step title="将审批原生处理程序迁移到能力事实">
    支持审批的渠道插件通过 `approvalCapability.nativeRuntime` 和共享运行时上下文注册表公开原生审批行为：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为 `approvalCapability.nativeRuntime`。
    - 将审批专用的身份验证/投递从旧版 `plugin.auth` / `plugin.approvals` 连接迁移到 `approvalCapability`。
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；将投递/原生/渲染字段迁移到 `approvalCapability`。
    - `plugin.auth` 仅保留用于渠道登录/退出流程；核心不再从中读取审批身份验证钩子。
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道所有的运行时对象（客户端、令牌、Bolt 应用）。
    - 不要从原生审批处理程序发送插件所有的重新路由通知；核心根据实际投递结果负责发送“已路由到其他位置”通知。
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供真正的 `createPluginRuntime().channel` 接口——部分桩实现会被拒绝。

    有关当前审批能力布局，请参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="审核 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，除非明确传入 `allowShellFallback: true`，否则现在无法解析的 Windows `.cmd`/`.bat` 包装器会以关闭方式失败：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之后
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅为有意接受经由 shell 回退的可信兼容性调用方设置此项。
      allowShellFallback: true,
    });
    ```

    如果调用方并非有意依赖 shell 回退，请不要设置 `allowShellFallback`，而应处理抛出的错误。

  </Step>

  <Step title="查找弃用的导入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替换为聚焦的导入">
    旧接口中的每个导出都对应一个特定的现代导入路径：

    ```typescript
    // 之前（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之后（现代化的聚焦导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于宿主侧辅助函数，请使用注入的插件运行时，而不是
    直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接层）
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
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性而保留，
    但新代码应导入其实际需要的聚焦接口：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待处理投递队列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存和持久化后端的去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 支持调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/处理结果类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 等待传输就绪 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 用于可证明不变量的必需值断言 | `openclaw/plugin-sdk/expect-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件通过扫描器禁止使用 `infra-runtime`，因此仓库代码
    无法退回到这个宽泛的桶式导出入口。

  </Step>

  <Step title="迁移渠道路由辅助函数">
    新的渠道路由代码使用 `openclaw/plugin-sdk/channel-route`。旧版的
    路由键和可比较目标名称仍作为兼容性别名保留：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、
    cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。

    不要新增对 `ChannelMessagingAdapter.parseExplicitTarget`、基于解析器的
    已加载路由辅助函数（`parseExplicitTargetForLoadedChannel`、
    `resolveRouteTargetForLoadedChannel`）或
    `plugin-sdk/channel-route` 中 `resolveChannelRouteTargetWithParser(...)` 的使用——
    它们已被弃用，仅为旧版插件保留。新的渠道插件应使用
    `messaging.targetResolver.resolveTarget(...)` 进行
    目标 ID 规范化并在目录未命中时回退；当核心需要尽早确定对端类型时，使用
    `messaging.inferTargetChatType(...)`；对于提供商原生的
    会话和线程标识，则使用 `messaging.resolveOutboundSessionRoute(...)`。

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
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 渠道入口定义/构建器的旧版统一重导出 | `defineChannelPluginEntry`、`createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置模式导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单一提供商入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 专用渠道入口定义和构建器 | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助函数 | 设置翻译器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置阶段运行时辅助函数 | `createSetupTranslator`、导入安全的设置补丁适配器、查找备注辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表/配置/操作门控辅助函数 |
  | `plugin-sdk/account-id` | 账户 ID 辅助函数 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 精简账户辅助函数 | 账户列表/账户操作辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对基础组件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、正在输入状态和源投递装配 | `createChannelReplyPipeline`、`resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助函数 | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置模式构建器 | 仅包含共享渠道配置模式基础组件和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置模式 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地模式 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置模式 | 仅作为兼容性别名；维护中的内置插件请使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名称规范化、描述裁剪、重复项/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助函数 | 共享路由 + 信封构建器辅助函数 |
  | `plugin-sdk/channel-inbound` | 入站接收辅助函数 | 上下文构建、格式化、根目录、运行器、预备回复分派和分派谓词 |
  | `plugin-sdk/messaging-targets` | 已弃用的目标解析导入路径 | 通用目标解析辅助函数请使用 `plugin-sdk/channel-targets`，路由比较请使用 `plugin-sdk/channel-route`，提供商特定的目标解析请使用插件自有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 出站消息生命周期辅助函数 | 消息适配器、回执、持久发送辅助函数、实时预览/流式传输辅助函数、回复选项、生命周期辅助函数、出站身份和载荷规划 |
  | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助函数 | 用于旧版字段布局的智能体媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅限旧版渠道运行时实用工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 通用运行时辅助函数 | 运行时/日志/备份/插件安装辅助函数 |
  | `plugin-sdk/runtime-env` | 精简运行时环境辅助函数 | 日志记录器/运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助函数 | 插件命令/钩子/HTTP/交互式辅助函数 |
  | `plugin-sdk/hook-runtime` | 钩子管线辅助函数 | 共享 Webhook/内部钩子管线辅助函数 |
  | `plugin-sdk/lazy-runtime` | 延迟加载运行时辅助函数 | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeMethodBinder`、`createLazyRuntimeNamedExport`、`createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 Exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助函数 | Gateway 网关客户端、事件循环就绪启动辅助函数、公布的 LAN 主机解析和渠道状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 内置 Telegram 契约接口不可用时，提供回退稳定的 Telegram 命令验证辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | Exec/插件审批载荷、审批能力/配置文件辅助函数、原生审批路由/运行时辅助函数，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批身份验证辅助函数 | 审批者解析、同一聊天操作身份验证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 Exec 审批配置文件/筛选器辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助函数 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助函数 | 共享审批 Gateway 网关解析器 |
  | `plugin-sdk/approval-reference-runtime` | 审批传输引用 | 用于传输受限回调的确定性持久定位器辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 用于高频渠道入口点的轻量级原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助函数 | 更广泛的审批处理器运行时辅助函数；当精简的适配器/Gateway 网关接口足够时，应优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标/账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | Exec/插件审批回复载荷辅助函数 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助函数 | 通用渠道运行时上下文注册/获取/监视辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、私信门控、根目录边界内的文件/路径、外部内容和密钥收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机允许列表和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | 固定分派器、受保护的 fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助函数 | `enqueueSystemEvent`、`peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助函数 | Heartbeat 唤醒、事件和可见性辅助函数 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助函数 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助函数 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助函数 | 内存和持久化后端去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助函数 | 安全本地文件/媒体路径辅助函数 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助函数 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略辅助函数 | `loadExecApprovals`、`resolveExecApprovalsFromFile`、`ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`、`isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误辅助函数 | `formatUncaughtError`、`isApprovalNotFoundError`、错误图辅助函数、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | 封装的 fetch/代理辅助函数 | `resolveFetch`、代理辅助函数、EnvHttpProxyAgent 选项辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`、`normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`、`retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化和输入映射 | `formatAllowFromLowercase`、`mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令接口辅助函数 | `resolveControlCommandGate`、发送者授权辅助函数、命令注册表辅助函数（包括动态参数菜单格式化） |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助函数 | Webhook 目标实用工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文防护辅助函数 | 请求正文读取/限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分派、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 精简回复分派辅助函数 | 完成处理、提供商分派和对话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `createChannelHistoryWindow`；已弃用的映射辅助函数兼容性导出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助函数 | 文本/Markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助函数 | 限定作用域的会话行辅助函数、存储路径辅助函数和更新时间读取 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由/会话键辅助函数 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、会话键规范化辅助函数 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助函数 | 渠道/账号状态摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析辅助函数 | 共享目标解析辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | Slug/字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 限时命令辅助函数 | 提供规范化 stdout/stderr 的限时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送信息提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统日志记录器和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选的本地/自托管提供商设置辅助函数 | 自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 专注于 OpenAI 兼容自托管提供商的设置辅助函数 | 相同的自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时身份验证辅助函数 | 运行时 API 密钥解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API 密钥设置辅助函数 | API 密钥新手引导/配置文件写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商身份验证结果辅助函数 | 标准 OAuth 身份验证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动的提供商选择以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商身份验证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助函数 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数和模型 ID 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP/端点能力辅助函数，包括音频转写 multipart 表单辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 Web 获取辅助函数 | Web 获取提供商注册/缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助函数 | 面向无需插件启用接线的提供商的精简 Web 搜索配置/凭据辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助函数 | 精简的 Web 搜索配置/凭据契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 以及限定作用域的凭据设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助函数 | Web 搜索提供商注册/缓存/运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容辅助函数 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 架构清理和诊断 |
  | `plugin-sdk/provider-usage` | 提供商用量辅助函数 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage` 和其他提供商用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装辅助函数 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如受保护的 fetch、工具结果文本提取、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取/转换/存储辅助函数、由 ffprobe 支持的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 图像/视频/音乐生成的共享故障转移辅助函数、候选项选择和缺失模型提示消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型，以及面向提供商的图像/音频辅助函数导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型，以及面向提供商的指令、注册表、验证辅助函数和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转写辅助函数 | 提供商类型、注册表辅助函数和共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、注册/解析辅助函数、桥接会话辅助函数、共享智能体回话队列、活跃运行语音控制、转写稿/事件健康状态、回声抑制、咨询问题匹配、强制咨询协调、轮次上下文跟踪、输出活动跟踪和快速上下文咨询辅助函数 |
  | `plugin-sdk/image-generation` | 图像生成辅助函数 | 图像生成提供商类型，以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、身份验证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复载荷规范化/归并 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置原语 | 精简的渠道配置架构原语 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助函数 | 渠道配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前置模块 | 共享渠道插件前置导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助函数 | 共享渠道状态快照/摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助函数 | 允许列表配置编辑/读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已弃用的兼容外观 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私信防护辅助函数 | 精简的加密前防护策略辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道/状态和环境代理辅助原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助函数 | Webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助函数 | 远程/本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容重新导出 | 直接从 `zod` 导入 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | 记忆管理器/配置/文件/CLI 辅助函数接口 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时外观 | 记忆索引/搜索运行时外观 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 记忆嵌入注册表 | 轻量级记忆嵌入提供商注册表辅助函数 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆宿主基础引擎 | 记忆宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆宿主嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商和通用批处理/远程辅助函数；具体的远程提供商位于各自所属的插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆宿主 QMD 引擎 | 记忆宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆宿主存储引擎 | 记忆宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆宿主多模态辅助函数 | 记忆宿主多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | 记忆宿主查询辅助函数 | 记忆宿主查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | 记忆宿主密钥辅助函数 | 记忆宿主密钥辅助函数 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的记忆事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 记忆宿主状态辅助函数 | 记忆宿主状态辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆宿主 CLI 运行时 | 记忆宿主 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆宿主核心运行时 | 记忆宿主核心运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆宿主文件/运行时辅助函数 | 记忆宿主文件/运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | 记忆宿主核心运行时别名 | 记忆宿主核心运行时辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-events` | 记忆宿主事件日志别名 | 记忆宿主事件日志辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的记忆文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助函数 | 面向记忆相关插件的共享托管 Markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索外观 | 延迟加载的主动记忆搜索管理器运行时外观 |
  | `plugin-sdk/memory-host-status` | 已弃用的记忆宿主状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用工具 | 仓库本地的已弃用兼容聚合导出；请使用聚焦的仓库本地测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

  此表是常见的迁移子集，并非完整的 SDK 表面。编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出根据公共子集生成。

  除明确记录的兼容性外观接口外，内置插件专用的预留辅助接口已从公共 SDK 导出映射中移除，例如为仍直接导入已发布 `@openclaw/discord` 包的外部插件保留的、已弃用的 `plugin-sdk/discord` 兼容层。所有者专用辅助程序位于所属插件包内；共享宿主行为通过通用 SDK 契约提供，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

  使用与任务匹配的最窄导入。如果找不到某个导出，请检查 `src/plugin-sdk/` 中的源代码，或询问维护者应由哪个通用契约负责它。

  ## 当前弃用项

  以下是在插件 SDK、提供商契约、运行时表面和清单中的范围更窄的弃用项。它们目前仍然可用，但将在未来的主要版本中移除。每个条目都将旧 API 映射到其规范替代项。

  <AccordionGroup>
  <Accordion title="command-auth 帮助构建器 -> command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：签名和导出均相同，
    只是改为从范围更窄的子路径导入。`command-auth`
    将它们重新导出为兼容存根。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之后
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助程序 -> resolveInboundMentionDecision">
    **旧版**：来自 `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveMentionGating(params)` 和
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用一个决策
    对象替代两个拆分的调用形式。

    Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、
    Telegram、WhatsApp 和 Zalo 均已采用。Slack 自有的 `app_mention` 事件模型
    不使用此辅助程序。

  </Accordion>

  <Accordion title="渠道运行时兼容层和渠道操作辅助程序">
    `openclaw/plugin-sdk/channel-runtime` 是面向旧版
    渠道插件的兼容层。不要在新代码中导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 注册运行时
    对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*`
    辅助程序已与原始“操作”渠道导出一同弃用。请改为通过语义化的
    `presentation` 表面公开能力——渠道插件声明它们渲染的内容
    （卡片、按钮、选择项），而不是声明它们接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() 辅助程序 -> 插件上的 createTool()">
    **旧版**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工厂。

    **新版**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK 辅助程序来注册工具包装器。

  </Accordion>

  <Accordion title="纯文本渠道信封 -> BodyForAgent">
    **旧版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`
    （以及入站消息对象上的 `channelEnvelope` 字段），根据入站渠道消息
    构建扁平的纯文本提示词信封。

    **新版**：使用 `BodyForAgent` 和结构化用户上下文块。渠道
    插件将路由元数据（线程、主题、回复目标、表情回应）作为
    类型化字段附加，而不是将其拼接到提示词字符串中。
    `formatAgentEnvelope(...)` 辅助程序仍支持生成面向
    助手的合成信封，但入站纯文本信封正在逐步淘汰。

    受影响区域：`inbound_claim`、`message_received`，以及任何对
    旧信封文本执行后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="deactivate 钩子 -> gateway_stop">
    **旧版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。关闭清理
    契约相同；仅钩子名称发生变化。

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

    `deactivate` 将继续作为已弃用的兼容别名进行连接，直至
    2026-08-16 之后被移除。

  </Accordion>

  <Accordion title="subagent_spawning 钩子 -> 核心线程绑定">
    **旧版**：`api.on("subagent_spawning", handler)` 返回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：让核心通过渠道会话绑定适配器准备 `thread: true`
    子智能体绑定。仅将 `api.on("subagent_spawned", handler)`
    用于启动后观察。

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

    在外部插件迁移期间，`subagent_spawning`、
    `PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 仅作为
    已弃用的兼容表面保留，并将在 2026-08-30 之后移除。

  </Accordion>

  <Accordion title="提供商发现类型 -> 提供商目录类型">
    四个发现类型别名现在是目录时代类型的轻量包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    此外还有旧版 `ProviderCapabilities` 静态属性包——提供商插件
    应使用 `buildReplayPolicy`、`normalizeToolSchemas` 和
    `wrapStreamFn` 等显式提供商钩子，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略钩子 -> resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上的三个独立钩子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范的 `id`、可选的 `label`
    以及按等级排序的级别列表。OpenClaw 会自动按照配置文件等级
    降级过时的已存储值。

    上下文包含 `provider`、`modelId`、可选的合并后 `reasoning`
    以及可选的合并后模型 `compat` 事实。仅当配置的请求契约支持时，
    提供商插件才能使用这些目录事实公开模型专用配置文件。

    请实现一个钩子，而不是三个。旧版钩子在弃用窗口期间仍可使用，
    但不会与配置文件结果组合。

  </Accordion>

  <Accordion title="外部身份验证提供商 -> contracts.externalAuthProviders">
    **旧版**：实现外部身份验证钩子，但不在插件清单中声明提供商。

    **新版**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。

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

    **新版**：将同一环境变量查找镜像到清单上的
    `setup.providers[].envVars`。这样可将设置/状态环境元数据整合到一处，
    并避免仅为响应环境变量查找而启动插件运行时。

    在弃用窗口关闭之前，`providerAuthEnvVars` 仍通过兼容适配器
    获得支持。

  </Accordion>

  <Accordion title="记忆插件注册 -> registerMemoryCapability">
    **旧版**：三个独立调用——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：在记忆状态 API 上进行一次调用——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    插槽相同，只需一次注册调用。附加式提示词和语料库辅助程序
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影响。

  </Accordion>

  <Accordion title="记忆嵌入提供商 API">
    **旧版**：`api.registerMemoryEmbeddingProvider(...)` 加
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加
    `contracts.embeddingProviders`。

    通用嵌入提供商契约可在记忆之外复用，也是新提供商支持的路径。
    在现有提供商迁移期间，记忆专用注册 API 仍作为已弃用的兼容接口
    进行连接。插件检查会将非内置用法报告为兼容性债务。

  </Accordion>

  <Accordion title="子智能体会话消息类型已重命名">
    `src/plugins/runtime/types.ts` 仍导出两个旧版类型别名：

    | 旧版                          | 新版                                |
    | ----------------------------- | ----------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams`  |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult`  |

    运行时方法 `readSession` 已弃用，推荐改用
    `getSessionMessages`。签名相同；旧方法会转调新方法。

  </Accordion>

  <Accordion title="已移除的会话和转录文件 API">
    切换到 SQLite 会话/转录后，将移除或弃用面向插件的 API；
    这些 API 会公开活动的 `sessions.json` 存储、JSONL 转录路径或会话
    文件列表。运行时插件应使用会话身份和 SDK 运行时辅助程序，
    而不是解析或修改活动文件。

    | 迁移中的接口 | 替代方案 |
    | ----------------- | ----------- |
    | 已弃用的 `loadSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)` 和行级会话变更操作。 |
    | 已弃用的 `resolveSessionFilePath(...)` | 会话标识（`sessionKey`、`sessionId` 和 SDK 运行时目标辅助函数），以及对当前会话执行操作的 Gateway 网关方法。 |
    | 已移除的 `saveSessionStore(...)` | 由 Gateway 网关拥有的会话运行时 API；插件代码应通过已记录的运行时/上下文辅助函数请求或变更会话状态，而不是写入活动存储文件。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 和 `resolveAndPersistSessionFile(...)` | 会话标识以及对当前会话执行操作的 Gateway 网关方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 当前运行时上下文公开的基于标识的记录读取器；如果插件位于记录所有者路径之外，则使用 Gateway 网关历史记录/会话方法。 |
    | `SessionTranscriptUpdate.sessionFile` | 包含 `agentId`、`sessionKey` 和 `sessionId` 的 `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` 等记忆同步输入 | 由宿主提供的基于标识的记录/会话源；不要为实时会话遍历活动 JSONL 文件。 |
    | 活动会话中名为 `transcriptPath` 或 `sessionFile` 的运行时选项 | 携带存储中立会话标识的 `sessionTarget`/运行时目标对象。 |

    旧版 JSONL 记录文件作为导入、归档、导出和支持工件仍然有效。
    它们不再是活动会话的稳态运行时契约。

    随 `v2026.7.1-beta.5` 发布的官方插件导入了上述四个已弃用的
    辅助函数。`openclaw/plugin-sdk/session-store-runtime` 会将这一完全相同的
    过渡桥接保留到 2026-10-12；新插件必须使用替代方案。
    `resolveStorePath(...)` 仍是受支持的 SDK 辅助函数，不属于
    此次弃用范围。

    `openclaw plugins inspect --all --runtime` 会报告加载错误或诊断信息中
    仍引用这些已移除文件 API 的非内置插件。
    `@openclaw/plugin-inspector` 建议性扫描必须使用 `0.3.17` 或
    更高版本，以便外部包扫描也能在发布前标记整个存储的会话辅助函数、
    会话文件路径辅助函数、旧版记录文件目标和底层
    记录辅助函数。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧接口**：`runtime.tasks.flow`（单数形式）返回实时任务流
    访问器。

    **新接口**：`runtime.tasks.managedFlows` 为需要在流程中创建、更新、
    取消或运行子任务的插件保留托管式 TaskFlow 变更运行时。
    当插件仅需基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之后
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    于 2026-07-26 后移除。

  </Accordion>

  <Accordion title="嵌入式扩展工厂 -> 智能体工具结果中间件">
    上文的[如何迁移](#how-to-migrate)中已介绍。为完整起见，此处再次说明：
    已移除且仅供嵌入式运行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 路径由
    `api.registerAgentToolResultMiddleware(...)` 替代，并在
    `contracts.agentToolResultMiddleware` 中使用显式运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 -> OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行别名。建议使用规范名称。

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
由各自的 `api.ts` 和 `runtime-api.ts` 导出文件跟踪。
它们不影响第三方插件契约，因此未在此列出。
如果你直接使用内置插件的本地导出文件，请在升级前阅读
该导出文件中的弃用注释。
</Note>

## Talk 和实时语音迁移

实时语音、电话、会议和浏览器 Talk 代码共用一个由
`openclaw/plugin-sdk/realtime-voice` 导出的 Talk 会话控制器。
该控制器拥有通用 Talk 事件封装、活动轮次状态、采集状态、
输出音频状态、最近事件历史记录和过期轮次拒绝逻辑。
提供商插件拥有供应商特定的实时会话；表层插件拥有
采集、播放、电话和会议的特殊处理逻辑。

所有内置表层都在共享控制器上运行：浏览器中继、
托管房间移交、语音通话实时模式、语音通话流式 STT、Google
Meet 实时模式和原生按键通话。Gateway 网关在 `hello-ok.features.events`
中公布一个实时 Talk 事件渠道：`talk.event`。

除非正在实现底层适配器或测试夹具，否则新代码不应直接调用
`createTalkEventSequencer(...)`。请使用共享控制器，以确保
轮次范围内的事件无法在没有轮次 ID 的情况下发出，过期的 `turnEnd` /
`turnCancel` 调用无法清除较新的活动轮次，并且输出音频
生命周期事件在电话、会议、浏览器中继、托管房间移交
和原生 Talk 客户端之间保持一致。

公共 API 形态：

```typescript
// Gateway 网关拥有的 Talk 会话 API。
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

// 客户端拥有的提供商会话 API。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

浏览器拥有的 WebRTC/提供商 WebSocket 会话使用 `talk.client.create`，
因为浏览器拥有提供商协商和媒体传输，而 Gateway 网关拥有凭据、
指令和工具策略。`talk.session.*` 是由 Gateway 网关管理的通用接口，
用于 gateway-relay 实时模式、gateway-relay 转写以及托管房间原生
STT/TTS 会话。

对于将实时选择器放在 `talk.provider` / `talk.providers` 旁边的旧版配置，
应使用 `openclaw doctor --fix` 修复；Talk 运行时不会将语音/TTS
提供商配置重新解释为实时提供商配置。

受支持的 `talk.session.create` 组合有意保持精简：

| 模式            | 传输方式       | Brain           | 所有者              | 说明                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关            | 通过 Gateway 网关桥接的全双工提供商音频；工具调用通过 agent-consult 工具路由。           |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关            | 仅流式 STT；调用方发送输入音频并接收转写事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间 | 按键通话和对讲机式房间，其中客户端拥有采集/播放，Gateway 网关拥有轮次状态。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间 | 仅限管理员的房间模式，供直接执行 Gateway 网关工具操作的受信任第一方表层使用。                  |

供从较旧的 `talk.realtime.*` / `talk.transcription.*` /
`talk.handoff.*` 系列（均已移除）迁移的读者参考的方法映射：

| 旧方法                              | 新方法                                                      |
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

| 方法                            | 适用范围                                                | 契约                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 将 base64 编码的 PCM 音频块追加到由同一 Gateway 网关连接拥有的提供商会话。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 开始托管房间中的用户轮次。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 验证轮次未过期后，结束当前轮次。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有由 Gateway 网关拥有的会话                              | 取消某个轮次中正在进行的采集、提供商、智能体和 TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止智能体音频输出，但不一定结束用户轮次。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其桥接层公开的任何异步完成操作结束后，完成提供商工具调用；对于中间输出，传入 `options.willContinue`；或者在支持时传入 `options.suppressResponse`，以避免智能体再次响应。 |
| `talk.session.steer`            | 由智能体支持的 Talk 会话                                  | 向从 Talk 会话解析出的当前嵌入式运行发送语音 `status`、`steer`、`cancel` 或 `followup` 控制。                                                                                                 |
| `talk.session.close`            | 所有统一会话                                             | 停止中继会话或撤销托管房间状态，然后忘记统一会话 ID。                                                                                                                                     |

不要为了实现此功能而在核心中引入提供商或平台特例。
核心拥有 Talk 会话语义。提供商插件拥有供应商会话设置。
语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生
应用拥有设备采集/播放用户体验。

## 移除时间表

| 时间                                        | 发生的情况                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **现在**                                     | 已弃用的接口会发出运行时警告。                                                                                             |
| **每条兼容记录的 `removeAfter` 日期** | 对应接口可被移除；日期过后，`pnpm plugins:boundary-report --fail-on-eligible-compat` 会导致 CI 失败。 |
| **下一个主要版本**                      | 仍未迁移的所有接口都会被移除；仍在使用它们的插件将无法运行。                                                       |

所有核心插件均已迁移。外部插件应在下一个主要版本
发布前完成迁移。运行 `pnpm plugins:boundary-report`，查看你的插件所用
接口中哪些兼容记录最早到期。

## 暂时抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时应急手段，而不是永久解决方案。

## 相关内容

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 深入了解架构
- [插件清单](/zh-CN/plugins/manifest) - 清单架构参考
