---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一条插件兼容性警告
    - 你正在规划插件 SDK 或插件清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-07-11T20:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 会先通过具名兼容性适配器继续连接旧版插件契约，再将其移除。这能在 SDK、清单、设置、配置和 Agent Runtimes 契约演进期间，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约记录在核心注册表 `src/plugins/compat/registry.ts` 中。每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：`sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、`agent-runtime` 或 `core`
- 适用时的引入日期和弃用日期
- 替代方案指引
- 涵盖新旧行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的依据。如果面向插件的行为发生变化，请在添加适配器的同一项变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性单独记录在 `src/commands/doctor/shared/deprecation-compat.ts` 中。这些记录涵盖旧配置结构、安装账本布局，以及运行时兼容路径移除后可能仍需保留的修复垫片。

发布清理应检查这两个注册表。不要仅仅因为相应的运行时或配置兼容性记录已过期，就删除 Doctor 迁移；应先确认是否仍有受支持的升级路径需要该修复。在发布规划期间，还要重新验证每条替代方案注解，因为随着提供商和渠道移出核心，插件所有权和配置覆盖范围可能会发生变化。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已记录的插件契约。迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器继续连接旧行为。
3. 在插件作者可以采取行动时发出诊断信息或警告。
4. 记录替代方案和时间表。
5. 测试新旧两条路径。
6. 等待已公布的迁移窗口结束。
7. 仅在明确批准破坏性版本后移除。

已弃用的记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。除非维护者明确决定永久保留该兼容性并将其标记为 `active`，否则不要添加没有明确移除期限的已弃用兼容路径。

## 当前兼容性领域

该注册表目前跟踪以下领域中约 70 个兼容性代码。新插件代码应采用各领域及其具体迁移指南中的替代方案；现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明公布移除窗口。

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件结构和 `before_agent_start`
- 插件迁移到 `gateway_stop` 期间使用的旧版 `api.on("deactivate", ...)` 清理钩子名称
- 插件迁移到 `register(api)` 期间使用的旧版 `activate(api)` 插件入口点
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 提供商迁移到显式目录、身份验证、思考、重放和传输钩子期间使用的旧版提供商插件钩子和类型别名
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回调字段（见下文）
- WhatsApp `WebInboundMessage` 顶层准入字段（见下文）
- 记忆插件迁移到 `registerMemoryCapability` 期间使用的旧版记忆插件拆分注册方式
- 嵌入提供商迁移到 `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders` 期间使用的旧版记忆专用嵌入提供商注册方式
- 用于原生消息架构、提及门控、入站信封格式化和审批能力嵌套的旧版渠道 SDK 辅助函数
- 插件迁移到 `openclaw/plugin-sdk/channel-route` 期间使用的旧版渠道路由键和可比较目标辅助函数别名
- 由清单贡献所有权替代的激活提示
- 设置描述符迁移到冷路径 `setup.requiresRuntime: false` 元数据期间使用的 `setup-api` 运行时回退
- 提供商目录钩子迁移到 `catalog.run(...)` 期间使用的提供商 `discovery` 钩子
- 渠道软件包迁移到 `openclaw.channel.exposure` 期间使用的渠道 `showConfigured` / `showInSetup` 元数据
- Doctor 将操作员迁移到 `agentRuntime` 期间使用的旧版运行时策略配置键
- 注册表优先的 `channelConfigs` 元数据落地期间使用的已生成内置渠道配置元数据回退
- 修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix` 期间使用的持久化插件注册表禁用和安装迁移环境标志
- Doctor 将旧版插件自有的网页搜索、网页获取和 x_search 配置路径迁移到 `plugins.entries.<plugin>.config`
- 安装元数据迁移到由状态管理的插件账本期间使用的旧版 `plugins.installs` 手工配置和内置插件加载路径别名

### WhatsApp 入站回调扁平别名

WhatsApp 运行时回调会传递 `WebInboundMessage`：规范的嵌套 `event`、`payload`、`quote`、`group` 和 `platform` 上下文，以及已发布回调字段的已弃用扁平别名。新的回调代码应读取嵌套上下文。构造纯净嵌套回调消息的代码可以使用 `WebInboundCallbackMessage`；仍注入旧版扁平测试消息或插件消息的兼容性监听器应使用 `LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平别名将保留至 **2026-08-30**；该窗口仅适用于扁平别名访问，不适用于嵌套结构，后者是规范的运行时契约。每个扁平别名的 TypeScript `@deprecated` 注解都会注明其确切的嵌套替代项。常见示例：

- `id`、`timestamp` 和 `isBatched` 移至 `event` 下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location` 和 `untrustedStructuredContext` 移至 `payload` 下。
- `to`、`chatId`、发送者/自身字段、`sendComposing`、`reply(...)` 和 `sendMedia(...)` 移至 `platform` 下。
- `replyTo*` 字段移至 `quote` 下；群组主题、参与者和提及字段移至 `group` 下。

`payload.untrustedStructuredContext` 从入站提供商载荷中提取。插件在将其 `payload` 视为权威数据之前，应检查 `label`、`source` 和 `type`。

### WhatsApp 入站准入字段

已接受的 WhatsApp 回调消息携带 `admission`，这是表示允许该消息进入的访问控制决策的公开安全信封。新的回调代码应从 `msg.admission` 读取准入事实，而不是读取旧版顶层准入字段。

顶层字段将保留至 **2026-08-30**。每个字段的 TypeScript `@deprecated` 注解都会注明其替代项：

- `from` 和 `conversationId` 移至 `admission.conversation.id`。
- `accountId` 移至 `admission.accountId`。
- `accessControlPassed` 是 `admission.ingress.decision === "allow"` 的派生兼容视图；对于已携带 `admission` 的消息，写入旧版布尔值不会重写入口图。
- `chatType` 移至 `admission.conversation.kind`。

## 插件检查器软件包

插件检查器应位于 OpenClaw 核心仓库之外，作为由版本化兼容性契约和清单契约支持的独立软件包/仓库。首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出清单/架构验证、当前检查的契约兼容性版本、安装/来源元数据检查、冷路径导入检查，以及弃用/兼容性警告。在 CI 注解中使用 `--json` 获取稳定的机器可读输出。OpenClaw 核心应公开检查器可使用的契约和固件，但不应从主 `openclaw` 软件包发布检查器二进制文件。

### 维护者验收通道

根据 OpenClaw 插件软件包验证外部检查器时，请对可安装软件包验收通道使用由 Crabbox 支持的 Blacksmith Testbox。软件包构建完成后，从干净的 OpenClaw 检出中运行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

此通道应仅供维护者选择启用，因为它会安装外部 npm 软件包，并可能检查从仓库外克隆的插件软件包。本地仓库防护措施涵盖 SDK 导出映射、兼容性注册表元数据、已弃用 SDK 导入的逐步清理，以及内置扩展的导入边界；Testbox 检查器证明则涵盖外部插件作者实际使用该软件包的方式。

## 发布说明

在兼容路径转为 `removal-pending` 或 `removed` 之前，发布说明应包含即将发生的插件弃用事项、目标日期和迁移文档链接。
