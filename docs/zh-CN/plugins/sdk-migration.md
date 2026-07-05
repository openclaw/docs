---
read_when:
    - 你看到 `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在将插件更新到现代插件架构
    - 你维护一个外部 OpenClaw 插件
sidebarTitle: Migrate to SDK
summary: 从旧版向后兼容层迁移到现代插件 SDK
title: 插件 SDK 迁移
x-i18n:
    generated_at: "2026-07-05T11:34:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed78d88fde5449c4e8f979839a729e05348a4307a85ef9839be9d98a29b93178
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 用由小型、聚焦导入构建的现代插件架构，替换了宽泛的向后兼容层。如果你的插件早于这次变更，本指南会帮助它迁移到当前契约。

## 变更内容

过去，两个完全开放的导入表面允许插件从单个入口点访问几乎所有内容：

- **`openclaw/plugin-sdk/compat`** - 重新导出了数十个辅助函数，以便在构建新架构期间让较旧的基于钩子的插件继续工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的 barrel，混合了系统事件、心跳状态、投递队列、fetch/proxy 辅助函数、文件辅助函数、审批类型和无关工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置 barrel，在迁移窗口期间仍携带已弃用的直接加载/写入辅助函数。
- **`openclaw/extension-api`** - 一个桥接层，让插件可以直接访问主机侧辅助函数，例如嵌入式智能体运行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已移除的仅限嵌入式运行器的钩子，用于观察嵌入式运行器事件，例如 `tool_result`。请改用智能体工具结果中间件（参见[将嵌入式工具结果扩展迁移到中间件](#how-to-migrate)）。

这些表面已**弃用**：它们仍然可用，但新插件不得使用，现有插件也应在下一个主版本移除它们之前完成迁移。`registerEmbeddedExtensionFactory` 已经移除；旧版注册不再加载。

<Warning>
  向后兼容层将在未来的主版本中移除。届时仍从这些表面导入的插件将会中断。
</Warning>

OpenClaw 不会在引入替代方案的同一次变更中移除或重新解释已记录的插件行为。破坏性契约变更会先经过兼容适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、钩子以及运行时注册行为。

### 原因

- **启动缓慢** - 导入一个辅助函数会加载数十个无关模块。
- **循环依赖** - 宽泛的重新导出很容易形成导入循环。
- **API 表面不清晰** - 无法区分稳定导出和内部导出。

现在，每个 `openclaw/plugin-sdk/<subpath>` 都是一个小型、自包含的模块，并带有明确记录的契约。

内置渠道的旧版提供商便捷接缝也已移除 - 带渠道品牌的辅助快捷方式只是私有单仓库便捷功能，不是稳定插件契约。请改用窄范围的通用 SDK 子路径。在内置插件工作区内，将提供商拥有的辅助函数保留在该插件自己的 `api.ts` 或 `runtime-api.ts` 中：

- Anthropic 将 Claude 专用流式传输辅助函数保留在自己的 `api.ts` / `contract-api.ts` 接缝中。
- OpenAI 将提供商构建器、默认模型辅助函数和实时提供商构建器保留在自己的 `api.ts` 中。
- OpenRouter 将提供商构建器和新手引导/配置辅助函数保留在自己的 `api.ts` 中。

## 兼容性策略

外部插件兼容性工作遵循以下顺序：

1. 添加新契约。
2. 通过兼容适配器继续接线旧行为。
3. 发出诊断或警告，点明旧路径和替代方案。
4. 在测试中覆盖两条路径。
5. 记录弃用和迁移路径。
6. 仅在宣布的迁移窗口结束后移除，通常是在主版本中。

如果某个清单字段仍被接受，请继续使用它，直到文档和诊断另有说明。新代码应优先使用已记录的替代方案；现有插件不应在普通次版本发布期间中断。

使用 `pnpm plugins:boundary-report` 审计当前迁移队列：

| 标志                                                    | 作用                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 使用紧凑计数而不是完整详情。                                         |
| `--json`                                                | 机器可读报告。                                                       |
| `--owner <id>`                                          | 筛选到一个插件或兼容性所有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨所有者的保留 SDK 导入时以非零状态退出。                             |
| `--fail-on-eligible-compat`                             | 当已弃用兼容性记录的 `removeAfter` 日期已过时以非零状态退出。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用且未分类的保留 SDK shim 时以非零状态退出。                                    |

`pnpm plugins:boundary-report:ci` 会启用全部三个失败标志。每条兼容性记录都有明确的 `removeAfter` 日期（不是模糊的“下一个主版本”）- 报告会按该日期分组已弃用记录，统计本地代码/文档引用，展示跨所有者保留 SDK 导入，并汇总私有 memory-host SDK 桥接。保留 SDK 子路径必须有被跟踪的所有者使用情况；未使用的保留导出应从公共 SDK 中移除。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助函数">
    内置插件应停止直接调用 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。优先使用已传入当前调用路径的配置。需要当前进程快照的长期存活处理器可以使用 `api.runtime.config.current()`。长期存活的智能体工具应在 `execute` 内读取 `ctx.getRuntimeConfig()`，这样在配置写入前创建的工具仍能看到刷新后的配置。

    配置写入通过带有显式写入后策略的事务辅助函数完成：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当变更需要干净重启 Gateway 网关时，使用 `afterWrite: { mode: "restart", reason: "..." }`；仅当调用方拥有后续动作并有意抑制重载规划器时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含一个类型化的 `followUp` 摘要，供测试和日志使用；Gateway 网关仍负责应用或调度重启。

    `loadConfig` 和 `writeConfigFile` 仍作为面向外部插件的已弃用兼容性辅助函数保留，并会使用
    `runtime-config-load-write` 兼容性代码警告一次。内置插件和仓库运行时代码受 `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 保护：新的生产插件用法会直接失败，直接配置写入会失败，Gateway 网关服务器方法必须使用请求运行时快照，运行时渠道发送/action/client 辅助函数必须从其边界接收配置，长期存活的运行时模块不允许任何环境级 `loadConfig()` 调用。

    新插件代码应避免使用宽泛的 `openclaw/plugin-sdk/config-runtime`
    barrel。请为具体任务使用窄范围子路径：

    | 需求 | 导入 |
    | --- | --- |
    | `OpenClawConfig` 等配置类型 | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置断言和插件入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | 会话存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/会话覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    内置插件及其测试会通过扫描器防护，避免使用宽泛 barrel，从而让导入和 mock 保持在所需行为本地。该 barrel 仍为外部兼容性存在，但新代码不应依赖它。

  </Step>

  <Step title="将嵌入式工具结果扩展迁移到中间件">
    内置插件必须用运行时中立的中间件替换仅限嵌入式运行器的
    `api.registerEmbeddedExtensionFactory(...)` 工具结果处理器：

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
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

    已安装插件也可以在显式启用且每个目标运行时都在
    `contracts.agentToolResultMiddleware` 中声明时注册工具结果中间件。未声明的已安装中间件注册会被拒绝。

  </Step>

  <Step title="将审批原生处理器迁移到能力事实">
    支持审批的渠道插件通过
    `approvalCapability.nativeRuntime` 加共享运行时上下文注册表暴露原生审批行为：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为
      `approvalCapability.nativeRuntime`。
    - 将审批专用的认证/投递从旧版 `plugin.auth` /
      `plugin.approvals` 接线迁移到 `approvalCapability`。
    - `ChannelPlugin.approvals` 已从公共渠道插件契约中移除；请将投递/native/render 字段迁移到
      `approvalCapability`。
    - `plugin.auth` 仅保留用于渠道登录/登出流程；核心不再从那里读取审批认证钩子。
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册渠道拥有的运行时对象（客户端、令牌、Bolt 应用）。
    - 不要从原生审批处理器发送插件拥有的重路由通知；核心根据实际投递结果拥有已路由到其他位置的通知。
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，请提供真实的 `createPluginRuntime().channel` 表面 - 部分 stub 会被拒绝。

    参见[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，了解当前审批能力布局。

  </Step>

  <Step title="审计 Windows 包装器回退行为">
    如果你的插件使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` 包装器现在会失败关闭，除非你显式传入
    `allowShellFallback: true`：

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    如果你的调用方并非有意依赖 shell 回退，不要设置
    `allowShellFallback`，而应处理抛出的错误。

  </Step>

  <Step title="查找已弃用导入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替换为聚焦导入">
    旧表面的每个导出都会映射到特定的现代导入路径：

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机侧辅助函数，请使用注入的插件运行时，而不是直接导入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助函数也采用相同模式：

    | 旧导入 | 现代等价项 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 会话存储辅助函数 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` 仍为外部兼容性保留，但新代码应导入它实际需要的聚焦接口：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 渠道活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存中和持久化后端的去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知调度器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    内置插件已通过扫描器防护，禁止使用 `infra-runtime`，因此仓库代码不能回退到宽泛的聚合导出。

  </Step>

  <Step title="Migrate channel route helpers">
    新的渠道路由代码使用 `openclaw/plugin-sdk/channel-route`。旧的路由键和可比较目标名称仍作为兼容性别名保留：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数会在原生审批、回复抑制、入站去重、cron 投递和会话路由中一致地规范化 `{ channel, to, accountId, threadId }`。

    不要新增对 `ChannelMessagingAdapter.parseExplicitTarget`、基于解析器的已加载路由辅助函数（`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`）或来自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 的使用 - 这些都已弃用，仅为旧插件保留。新的渠道插件应使用 `messaging.targetResolver.resolveTarget(...)` 进行目标 ID 规范化和目录未命中回退；当核心需要早期对端类型时使用 `messaging.inferTargetChatType(...)`；并使用 `messaging.resolveOutboundSessionRoute(...)` 处理提供商原生的会话和线程身份。

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

  <Accordion title="Common import path table">
  | 导入路径 | 用途 | 关键导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 渠道入口定义/构建器的旧版总括式重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置架构导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单提供商入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的渠道入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 设置翻译器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助工具 | `createSetupTranslator`, 可安全导入的设置补丁适配器、查找说明辅助工具、`promptResolvedAllowFrom`, `splitSetupEntries`, 委派设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账户 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`, 账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄范围账户辅助工具 | 账户列表/账户操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私信配对基元 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入状态和来源投递接线 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和私信访问辅助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置架构构建器 | 共享渠道配置架构基元和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 内置配置架构 | 仅限 OpenClaw 维护的内置插件；新插件必须定义插件本地架构 |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的内置配置架构 | 仅兼容性别名；对维护中的内置插件使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述裁剪、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/私信策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/channel-inbound` | 入站接收辅助工具 | 上下文构建、格式化、根、运行器、预备回复分发和分发谓词 |
  | `plugin-sdk/messaging-targets` | 已弃用的目标解析导入路径 | 使用 `plugin-sdk/channel-targets` 作为通用目标解析辅助工具，使用 `plugin-sdk/channel-route` 进行路由比较，并使用插件拥有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 进行提供商特定目标解析 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 出站消息生命周期辅助工具 | 消息适配器、回执、持久发送辅助工具、实时预览/流式传输辅助工具、回复选项、生命周期辅助工具、出站身份和载荷规划 |
  | `plugin-sdk/channel-streaming` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助工具 | 旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅旧版渠道运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽范围运行时辅助工具 | 运行时/日志/备份/插件安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄范围运行时环境辅助工具 | 日志记录器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享插件运行时辅助工具 | 插件命令/钩子/http/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | 钩子流水线辅助工具 | 共享 webhook/内部钩子流水线辅助工具 |
  | `plugin-sdk/lazy-runtime` | 惰性运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 网关辅助工具 | Gateway 网关客户端、事件循环就绪启动辅助工具、公布的 LAN 主机解析和渠道状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 内置 Telegram 合同表面不可用时保持回退稳定的 Telegram 命令验证辅助工具 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | Exec/插件审批载荷、审批能力/配置文件辅助工具、原生审批路由/运行时辅助工具，以及结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助工具 | 审批者解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助工具 | 原生 exec 审批配置文件/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 审批投递辅助工具 | 原生审批能力/投递适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 网关辅助工具 | 共享审批 Gateway 网关解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助工具 | 用于热渠道入口点的轻量级原生审批适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理器辅助工具 | 更宽范围的审批处理器运行时辅助工具；当更窄的适配器/Gateway 网关衔接足够时优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助工具 | 原生审批目标/账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助工具 | Exec/插件审批回复载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | 渠道运行时上下文辅助工具 | 通用渠道运行时上下文注册/get/watch 辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、私信门控、根边界文件/路径辅助工具、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定分发器、受保护的 fetch、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 辅助工具 | Heartbeat 唤醒、事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 渠道活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存中和持久化后端去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 审批策略辅助工具 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`, 错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装 fetch/代理辅助工具 | `resolveFetch`, 代理辅助工具、EnvHttpProxyAgent 选项辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`, 策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化和输入映射 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助工具 | `resolveControlCommandGate`, 发送者授权辅助工具、命令注册表辅助工具，包括动态参数菜单格式化 |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文保护辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、Heartbeat、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄范围回复分发辅助工具 | 完成、提供商分发和会话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `createChannelHistoryWindow`; 已弃用的 map-helper 兼容性导出，例如 `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | 会话存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/会话键辅助函数 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、会话键规范化辅助函数 |
  | `plugin-sdk/status-helpers` | 渠道状态辅助函数 | 渠道/账户状态摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助函数 | 共享目标解析器辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | Slug/字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类似请求的输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助函数 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统日志记录器和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助函数 | Markdown 表格模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管提供商设置辅助函数 | 自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 兼容自托管提供商设置辅助函数 | 相同的自托管提供商发现/配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | 提供商运行时认证辅助函数 | 运行时 API key 解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | 提供商 API key 设置辅助函数 | API key 新手引导/配置文件写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | 提供商认证结果辅助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | 提供商选择辅助函数 | 已配置或自动提供商选择，以及原始提供商配置合并 |
  | `plugin-sdk/provider-env-vars` | 提供商环境变量辅助函数 | 提供商认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享提供商模型/重放辅助函数 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、提供商端点辅助函数，以及模型 ID 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享提供商目录辅助函数 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供商新手引导补丁 | 新手引导配置辅助函数 |
  | `plugin-sdk/provider-http` | 提供商 HTTP 辅助函数 | 通用提供商 HTTP/端点能力辅助函数，包括音频转录 multipart 表单辅助函数 |
  | `plugin-sdk/provider-web-fetch` | 提供商 web-fetch 辅助函数 | Web-fetch 提供商注册/缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供商 Web 搜索配置辅助函数 | 面向不需要插件启用接线的提供商的窄 Web 搜索配置/凭据辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | 提供商 Web 搜索契约辅助函数 | 窄 Web 搜索配置/凭据契约辅助函数，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定作用域的凭据设置器/获取器 |
  | `plugin-sdk/provider-web-search` | 提供商 Web 搜索辅助函数 | Web 搜索提供商注册/缓存/运行时辅助函数 |
  | `plugin-sdk/provider-tools` | 提供商工具/架构兼容辅助函数 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 架构清理 + 诊断 |
  | `plugin-sdk/provider-usage` | 提供商用量辅助函数 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供商用量辅助函数 |
  | `plugin-sdk/provider-stream` | 提供商流包装器辅助函数 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | 提供商传输辅助函数 | 原生提供商传输辅助函数，例如受保护 fetch、工具结果文本提取、传输消息转换，以及可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体获取/转换/存储辅助函数、基于 ffprobe 的视频尺寸探测，以及媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 用于图像/视频/音乐生成的共享故障转移辅助函数、候选选择，以及缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解提供商类型，以及面向提供商的图像/音频辅助函数导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容性导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音提供商类型，以及面向提供商的指令、注册表、验证辅助函数和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音提供商类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | 提供商类型、注册表辅助函数，以及共享 WebSocket 会话辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | 提供商类型、注册表/解析辅助函数、桥接会话辅助函数、共享 Agent 回话队列、活动运行语音控制、转录稿/事件健康、回声抑制、咨询问题匹配、强制咨询协调、轮次上下文跟踪、输出活动跟踪，以及快速上下文咨询辅助函数 |
  | `plugin-sdk/image-generation` | 图像生成辅助函数 | 图像生成提供商类型，以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像提供商构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成提供商/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助函数、提供商查找，以及模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成提供商/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助函数、提供商查找，以及模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复载荷规范化/归约 |
  | `plugin-sdk/channel-config-primitives` | 渠道配置基元 | 窄渠道配置架构基元 |
  | `plugin-sdk/channel-config-writes` | 渠道配置写入辅助函数 | 渠道配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享渠道前导 | 共享渠道插件前导导出 |
  | `plugin-sdk/channel-status` | 渠道状态辅助函数 | 共享渠道状态快照/摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助函数 | 允许列表配置编辑/读取辅助函数 |
  | `plugin-sdk/group-access` | 群组访问辅助函数 | 共享群组访问决策辅助函数 |
  | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已弃用的兼容性门面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM 保护辅助函数 | 窄前加密保护策略辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动渠道/状态和环境代理辅助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助函数 | Webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助函数 | 远程/本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容性再导出 | 直接从 `zod` 导入 `zod` |
  | `plugin-sdk/memory-core` | 内置 memory-core 辅助函数 | 记忆管理器/配置/文件/CLI 辅助表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 记忆引擎运行时门面 | 记忆索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 记忆嵌入注册表 | 轻量级记忆嵌入提供商注册表辅助函数 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 记忆主机基础引擎 | 记忆主机基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 记忆主机嵌入引擎 | 记忆嵌入契约、注册表访问、本地提供商，以及通用批处理/远程辅助函数；具体远程提供商位于其所属插件中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 记忆主机 QMD 引擎 | 记忆主机 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 记忆主机存储引擎 | 记忆主机存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 记忆主机多模态辅助函数 | 记忆主机多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | 记忆主机查询辅助函数 | 记忆主机查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | 记忆主机密钥辅助函数 | 记忆主机密钥辅助函数 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的记忆事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 记忆主机状态辅助函数 | 记忆主机状态辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 记忆主机 CLI 运行时 | 记忆主机 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | 记忆主机核心运行时 | 记忆主机核心运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | 记忆主机文件/运行时辅助函数 | 记忆主机文件/运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | 记忆主机核心运行时别名 | 面向厂商中立的记忆主机核心运行时辅助函数别名 |
  | `plugin-sdk/memory-host-events` | 记忆主机事件日志别名 | 面向厂商中立的记忆主机事件日志辅助函数别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的记忆文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助函数 | 用于记忆相关插件的共享托管 Markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 主动记忆搜索门面 | 懒加载主动记忆搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 已弃用的记忆主机状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用工具 | 仓库本地已弃用的兼容性桶形导出；使用聚焦的仓库本地测试子路径，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表是常见迁移子集，不是完整 SDK 表面。编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；package exports 从公开子集生成。

预留的内置插件 helper seam 已从公共 SDK export map 中退役，但明确记录的兼容性 facade 除外，例如已弃用的 `plugin-sdk/discord` shim，它保留给仍直接导入已发布 `@openclaw/discord` 包的外部插件。所有者特定的 helper 位于所属插件包内；共享的宿主行为通过通用 SDK contract 移动，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

使用与任务匹配的最窄 import。如果找不到某个 export，请查看 `src/plugin-sdk/` 中的源码，或询问维护者应由哪个通用 contract 拥有它。

## 活跃弃用项

插件 SDK、提供商 contract、运行时表面和清单中的更窄弃用项。每项现在仍可工作，但会在未来的 major release 中移除。每个条目都会把旧 API 映射到它的规范替代项。

<AccordionGroup>
  <Accordion title="command-auth help builders -> command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同签名、相同
    exports - 只是从更窄的子路径导入。`command-auth`
    将它们作为兼容 stub 重新导出。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控 helper -> resolveInboundMentionDecision">
    **旧**：来自 `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveMentionGating(params)` 和
    `resolveMentionGatingWithBypass(params)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })` - 使用一个决策对象，
    而不是两个拆分的调用形态。

    已在 Discord、iMessage、Matrix、MS Teams、QQBot、Signal、
    Telegram、WhatsApp 和 Zalo 中采用。Slack 自己的 `app_mention` 事件模型
    不使用此 helper。

  </Accordion>

  <Accordion title="渠道运行时 shim 和渠道 action helper">
    `openclaw/plugin-sdk/channel-runtime` 是用于较旧渠道插件的兼容性 shim。
    新代码不要导入它；请使用
    `openclaw/plugin-sdk/channel-runtime-context` 注册运行时对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` helper
    与原始 “actions” 渠道 export 一起弃用。请改为通过语义化的
    `presentation` 表面暴露能力 - 渠道插件声明它们渲染什么（card、button、select），
    而不是声明它们接受哪些原始 action 名称。

  </Accordion>

  <Accordion title="Web 搜索提供商 tool() helper -> 插件上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` factory。

    **新**：直接在提供商插件上实现 `createTool(...)`。
    OpenClaw 不再需要 SDK helper 来注册工具 wrapper。

  </Accordion>

  <Accordion title="纯文本渠道 envelope -> BodyForAgent">
    **旧**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`（以及入口消息对象上的
    `channelEnvelope` 字段）从入口渠道消息构建扁平的纯文本 prompt envelope。

    **新**：`BodyForAgent` 加结构化用户上下文 block。渠道插件将路由元数据
    （thread、topic、reply-to、reaction）作为类型化字段附加，而不是把它们拼接进
    prompt 字符串。`formatAgentEnvelope(...)` helper 仍支持用于合成面向
    assistant 的 envelope，但入口纯文本 envelope 正在退出。

    受影响区域：`inbound_claim`、`message_received`，以及任何对旧 envelope 文本做后处理的自定义渠道插件。

  </Accordion>

  <Accordion title="deactivate hook -> gateway_stop">
    **旧**：`api.on("deactivate", handler)`。

    **新**：`api.on("gateway_stop", handler)`。相同的关闭清理
    contract；只有 hook 名称改变。

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 会继续作为已弃用的兼容性 alias 接线，直到
    2026-08-16 之后移除。

  </Accordion>

  <Accordion title="subagent_spawning hook -> core thread binding">
    **旧**：`api.on("subagent_spawning", handler)` 返回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新**：让 core 通过渠道会话绑定 adapter 准备 `thread: true` 子智能体绑定。
    仅将 `api.on("subagent_spawned", handler)`
    用于启动后的观察。

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 仅作为已弃用的兼容性表面保留，
    供外部插件迁移，并会在 2026-08-30 之后移除。

  </Accordion>

  <Accordion title="提供商发现类型 -> 提供商 catalog 类型">
    四个 discovery type alias 现在是 catalog 时代类型的薄 wrapper：

    | 旧 alias                  | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外还有旧版 `ProviderCapabilities` 静态 bag - 提供商插件应使用明确的提供商 hook，
    例如 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`，
    而不是静态对象。

  </Accordion>

  <Accordion title="Thinking policy hook -> resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回一个
    `ProviderThinkingProfile`，其中包含规范 `id`、可选 `label` 和排序后的 level 列表。
    OpenClaw 会按 profile 排名自动降级过期的已存储值。

    上下文包含 `provider`、`modelId`、可选合并后的 `reasoning`，
    以及可选合并后的模型 `compat` facts。提供商插件可以使用这些
    catalog facts，仅在配置的请求 contract 支持时暴露特定于模型的 profile。

    实现一个 hook，而不是三个。旧版 hook 在弃用窗口期内会继续工作，
    但不会与 profile 结果组合。

  </Accordion>

  <Accordion title="外部 auth 提供商 -> contracts.externalAuthProviders">
    **旧**：实现外部 auth hook，但未在插件清单中声明提供商。

    **新**：在插件清单中声明 `contracts.externalAuthProviders`
    **并且**实现 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供商 env-var 查找 -> setup.providers[].envVars">
    **旧**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：将相同的 env-var 查找镜像到清单上的 `setup.providers[].envVars`。
    这会把 setup/status 环境变量元数据整合到一处，并避免仅为回答 env-var 查找而启动插件运行时。

    `providerAuthEnvVars` 会通过兼容性 adapter 继续支持，
    直到弃用窗口关闭。

  </Accordion>

  <Accordion title="Memory 插件注册 -> registerMemoryCapability">
    **旧**：三个独立调用 - `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**：memory-state API 上的一个调用 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同 slot，单个注册调用。增量 prompt 和 corpus helper
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影响。

  </Accordion>

  <Accordion title="Memory embedding 提供商 API">
    **旧**：`api.registerMemoryEmbeddingProvider(...)` 加
    `contracts.memoryEmbeddingProviders`。

    **新**：`api.registerEmbeddingProvider(...)` 加
    `contracts.embeddingProviders`。

    通用 embedding 提供商 contract 可在 memory 之外复用，
    是新提供商的受支持路径。memory 专用注册 API 仍作为已弃用的兼容性接线，
    供现有提供商迁移。插件检查会将非内置用法报告为兼容性债务。

  </Accordion>

  <Accordion title="Subagent session messages 类型重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版 type alias：

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，请改用
    `getSessionMessages`。相同签名；旧方法会调用新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回 live task-flow
    accessor。

    **新**：`runtime.tasks.managedFlows` 为从 flow 创建、更新、取消或运行子任务的插件保留受管理的 TaskFlow mutation
    运行时。当插件只需要基于 DTO 的读取时，请使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26 之后移除。

  </Accordion>

  <Accordion title="嵌入式 extension factory -> agent tool-result middleware">
    已在上方的 [如何迁移](#how-to-migrate) 中说明。为完整性在此列出：
    已移除的仅限 embedded-runner 的
    `api.registerEmbeddedExtensionFactory(...)` 路径由
    `api.registerAgentToolResultMiddleware(...)` 替代，并在
    `contracts.agentToolResultMiddleware` 中使用明确的运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias -> OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是
    `OpenClawConfig` 的单行 alias。请优先使用规范名称。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级弃用项（位于 `extensions/` 下的内置渠道/提供商插件内部）会在它们自己的 `api.ts` 和 `runtime-api.ts` barrel 中跟踪。它们不会影响第三方插件契约，也不会在此列出。如果你直接使用内置插件的本地 barrel，请在升级前阅读该 barrel 中的弃用注释。
</Note>

## Talk 和实时语音迁移

实时语音、电话、会议和浏览器 Talk 代码共享一个由 `openclaw/plugin-sdk/realtime-voice` 导出的 Talk 会话控制器。该控制器负责通用 Talk 事件信封、活动轮次状态、采集状态、输出音频状态、近期事件历史，以及过期轮次拒绝。提供商插件负责特定厂商的实时会话；界面插件负责采集、播放、电话和会议相关的特殊处理。

所有内置界面都运行在共享控制器上：浏览器中继、托管房间移交、语音通话实时、语音通话流式 STT、Google Meet 实时，以及原生按住说话。Gateway 网关会在 `hello-ok.features.events` 中公布一个实时 Talk 事件渠道：`talk.event`。

新代码不应直接调用 `createTalkEventSequencer(...)`，除非是在实现低层适配器或测试夹具。请使用共享控制器，这样没有轮次 id 就无法发出轮次作用域事件，过期的 `turnEnd` / `turnCancel` 调用不会清除更新的活动轮次，并且输出音频生命周期事件能在电话、会议、浏览器中继、托管房间移交和原生 Talk 客户端之间保持一致。

公共 API 形状：

```typescript
// Gateway-owned Talk session API.
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

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

浏览器拥有的 WebRTC/提供商 websocket 会话使用 `talk.client.create`，因为浏览器负责提供商协商和媒体传输，而 Gateway 网关负责凭证、指令和工具策略。`talk.session.*` 是由 Gateway 网关管理的通用界面，用于 gateway-relay 实时、gateway-relay 转录，以及 managed-room 原生 STT/TTS 会话。

把实时选择器放在 `talk.provider` / `talk.providers` 旁边的旧配置，应使用 `openclaw doctor --fix` 修复；运行时 Talk 不会把语音/TTS 提供商配置重新解释为实时提供商配置。

支持的 `talk.session.create` 组合有意保持较少：

| 模式            | 传输       | Brain           | 所有者              | 说明                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway 网关            | 通过 Gateway 网关桥接全双工提供商音频；工具调用通过 agent-consult 工具路由。           |
| `transcription` | `gateway-relay` | `none`          | Gateway 网关            | 仅流式 STT；调用方发送输入音频并接收转录事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间 | 按住说话和对讲机式房间，其中客户端负责采集/播放，Gateway 网关负责轮次状态。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间 | 面向受信任第一方界面的仅管理员房间模式，可直接执行 Gateway 网关工具操作。                  |

供从较旧的 `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` 系列迁移的读者使用的方法映射（这些系列均已移除）：

| 旧                              | 新                                                      |
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

统一控制词汇也刻意保持精简：

| 方法                          | 适用于                                              | 契约                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 向同一个 Gateway 网关连接拥有的提供商会话追加一个 base64 PCM 音频块。                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 启动一个托管房间用户轮次。                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在过期轮次校验后结束活动轮次。                                                                                                                                         |
| `talk.session.cancelTurn`       | 所有 Gateway 网关拥有的会话                              | 取消某个轮次的活动采集/提供商/智能体/TTS 工作。                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助手音频输出，而不一定结束用户轮次。                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成中继发出的提供商工具调用；传入 `options.willContinue` 表示中间输出，或传入 `options.suppressResponse` 在不产生另一条助手响应的情况下满足该调用。 |
| `talk.session.steer`            | 由智能体支持的 Talk 会话                              | 向从 Talk 会话解析出的活动嵌入式运行发送口语化的 `status`、`steer`、`cancel` 或 `followup` 控制。                                                                |
| `talk.session.close`            | 所有统一会话                                    | 停止中继会话或撤销托管房间状态，然后遗忘统一会话 id。                                                                                                    |

不要为了实现此功能而在核心中引入提供商或平台特殊情况。核心负责 Talk 会话语义。提供商插件负责厂商会话设置。语音通话和 Google Meet 负责电话/会议适配器。浏览器和原生应用负责设备采集/播放用户体验。

## 移除时间线

| 时间                                        | 会发生什么                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **现在**                                     | 已弃用界面会发出运行时警告。                                                                                             |
| **每条兼容记录的 `removeAfter` 日期** | 该特定界面符合移除条件；日期过后，`pnpm plugins:boundary-report --fail-on-eligible-compat` 会让 CI 失败。 |
| **下一个主版本发布**                      | 仍未迁移的任何界面都会被移除；仍在使用它们的插件将失败。                                                       |

所有核心插件都已完成迁移。外部插件应在下一个主版本发布前迁移。运行 `pnpm plugins:boundary-report`，查看你的插件使用的界面中哪些兼容记录最早到期。

## 暂时抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时逃生口，不是永久解决方案。

## 相关

- [入门指南](/zh-CN/plugins/building-plugins) - 构建你的第一个插件
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建渠道插件
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 构建提供商插件
- [插件内部机制](/zh-CN/plugins/architecture) - 架构深度解析
- [Plugin Manifest](/zh-CN/plugins/manifest) - 清单 schema 参考
