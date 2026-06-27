---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-06-27T02:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 会通过具名兼容性适配器保留旧版插件契约的接线，然后再移除它们。这能在 SDK、插件清单、设置、配置和智能体运行时契约演进时，保护现有内置插件和外部插件。

## 兼容性注册表

插件兼容性契约在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果面向插件的行为发生变化，请在添加适配器的同一个变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性在 `src/commands/doctor/shared/deprecation-compat.ts` 中单独跟踪。这些记录覆盖旧配置形态、安装账本布局，以及在运行时兼容性路径移除后可能仍需保留的修复垫片。

发布清理应检查两个注册表。不要仅仅因为匹配的运行时或配置兼容性记录已过期就删除 Doctor 迁移；请先验证是否仍有受支持的升级路径需要该修复。此外，在发布规划期间重新验证每个替代方案注释，因为随着提供商和渠道迁出核心，插件所有权和配置占用范围可能会变化。

## 插件检查器包

插件检查器应作为独立包/仓库位于核心 OpenClaw 仓库之外，并由版本化的兼容性和插件清单契约支撑。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 插件清单/架构验证
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用 `--json` 获得稳定的机器可读输出。OpenClaw 核心应暴露检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

### 维护者验收通道

在针对 OpenClaw 插件包验证外部检查器时，将由 Crabbox 支持的 Blacksmith Testbox 用于可安装包验收通道。包构建完成后，从干净的 OpenClaw 检出运行它：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

为维护者保持此通道为选择加入，因为它会安装外部 npm 包，并可能检查在仓库外克隆的插件包。本地仓库守卫覆盖 SDK 导出映射、兼容性注册表元数据、已弃用 SDK 导入清理，以及内置扩展导入边界；Testbox 检查器证明覆盖外部插件作者消费该包时的形态。

## 弃用策略

OpenClaw 不应在引入替代方案的同一个版本中移除已记录的插件契约。

迁移顺序为：

1. 添加新契约。
2. 通过具名兼容性适配器保留旧行为接线。
3. 在插件作者可以采取行动时发出诊断或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已公告的迁移窗口结束。
7. 只有获得明确的破坏性版本批准后才移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。不要添加带开放式移除窗口的已弃用兼容性路径，除非维护者明确决定它是永久兼容性，并将其标记为 `active`。

## 当前兼容性区域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子的插件形态和 `before_agent_start`
- 旧版 `api.on("deactivate", ...)` 清理钩子名称，同时插件迁移到 `gateway_stop`
- 旧版 `activate(api)` 插件入口点，同时插件迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量插件清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商迁移到显式目录、凭证、思考、重放和传输钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回调字段，例如 `body`、`chatId`、`reply(...)` 和 `mediaPath`，同时回调消费者迁移到嵌套的 `WebInboundCallbackMessage` `event`、`payload`、`quote`、`group` 和 `platform` 上下文
- WhatsApp `WebInboundMessage` 顶层准入字段，例如 `from`、`conversationId`、`accountId`、`accessControlPassed` 和 `chatType`，同时回调消费者迁移到 `admission` 信封
- 旧版记忆插件拆分注册，同时记忆插件迁移到 `registerMemoryCapability`
- 旧版记忆专用嵌入提供商注册，同时嵌入提供商迁移到 `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders`
- 旧版渠道 SDK 辅助工具，用于原生消息架构、提及门控、入站信封格式化和审批能力嵌套
- 旧版渠道路由键和可比较目标辅助工具别名，同时插件迁移到 `openclaw/plugin-sdk/channel-route`
- 正被插件清单贡献所有权替代的激活提示
- `setup-api` 运行时回退，同时设置描述符迁移到冷 `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商目录钩子迁移到 `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包迁移到 `openclaw.channel.exposure`
- 旧版运行时策略配置键，同时 Doctor 将操作者迁移到 `agentRuntime`
- 生成的内置渠道配置元数据回退，同时注册表优先的 `channelConfigs` 元数据落地
- 持久化插件注册表禁用和安装迁移环境变量标志，同时修复流程将操作者迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版插件所有的 Web 搜索、Web 获取和 x_search 配置路径，同时 Doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 作者配置和内置插件加载路径别名，同时安装元数据迁移到由状态管理的插件账本

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容性路径，直到文档、诊断和发布说明公告移除窗口。

### WhatsApp 入站回调扁平别名

WhatsApp 运行时回调会投递 `WebInboundMessage`：规范的嵌套 `event`、`payload`、`quote`、`group` 和 `platform` 上下文，以及已发布回调字段的已弃用扁平别名。新的回调代码应读取嵌套上下文。构造干净嵌套回调消息的代码可以使用 `WebInboundCallbackMessage`；仍注入旧扁平测试消息或插件消息的兼容性监听器应使用 `LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平别名会保留到 **2026-08-30**。该移除窗口仅适用于扁平别名访问；嵌套回调形态是规范运行时契约。每个扁平别名上的 TypeScript `@deprecated` 注释会标明其确切的嵌套替代项。常见示例：

- `id`、`timestamp` 和 `isBatched` 移到 `event` 下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location` 和 `untrustedStructuredContext` 移到 `payload` 下。
- `to`、`chatId`、发送者/自身字段、`sendComposing`、`reply(...)` 和 `sendMedia(...)` 移到 `platform` 下。
- `replyTo*` 字段移到 `quote` 下，群组主题/参与者/提及字段移到 `group` 下。

`payload.untrustedStructuredContext` 从入站提供商负载中提取。插件应先检查 `label`、`source` 和 `type`，再将其 `payload` 视为权威内容。

### WhatsApp 入站准入字段

已接受的 WhatsApp 回调消息现在携带 `admission`，这是用于记录准入该消息的访问控制决策的公开安全信封。新的回调代码应从 `msg.admission` 读取准入事实，而不是旧的顶层准入字段。

顶层字段会保留到 **2026-08-30**。TypeScript `@deprecated` 注释会标明每个替代项：

- `from` 和 `conversationId` 移到 `admission.conversation.id`。
- `accountId` 移到 `admission.accountId`。
- `accessControlPassed` 是 `admission.ingress.decision === "allow"` 的派生兼容性视图；在已经携带 `admission` 的消息上，写入旧版布尔值不会重写入口图。
- `chatType` 移到 `admission.conversation.kind`。

## 发布说明

发布说明应包含即将发生的插件弃用事项、目标日期和迁移文档链接。该警告需要在兼容性路径移到 `removal-pending` 或 `removed` 之前发生。
