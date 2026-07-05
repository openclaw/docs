---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到插件兼容性警告
    - 你正在规划插件 SDK 或插件清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-07-05T11:30:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 在移除旧插件契约前，会通过具名兼容性适配器保持其接线。这能在 SDK、清单、设置、配置和智能体运行时契约演进时，保护现有内置插件和外部插件。

## 兼容性注册表

插件兼容性契约在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：`sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、`agent-runtime` 或 `core`
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果面向插件的行为发生变化，请在添加适配器的同一变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性在 `src/commands/doctor/shared/deprecation-compat.ts` 中单独跟踪。这些记录覆盖旧配置形态、安装台账布局，以及可能需要在运行时兼容性路径移除后继续保留的修复填充层。

发布清扫应检查两个注册表。不要仅仅因为匹配的运行时或配置兼容性记录已过期就删除 Doctor 迁移；请先确认没有仍然需要该修复的受支持升级路径。在发布规划期间也要重新验证每条替代方案注解，因为随着提供商和渠道迁出核心，插件所有权和配置覆盖范围可能会变化。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。迁移顺序：

1. 添加新契约。
2. 通过具名兼容性适配器保留旧行为接线。
3. 在插件作者可以采取行动时发出诊断或警告。
4. 记录替代方案和时间线。
5. 同时测试旧路径和新路径。
6. 等待已公告的迁移窗口结束。
7. 仅在明确获得破坏性发布批准后移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。除非维护者明确决定这是永久兼容性并改为将其标记为 `active`，否则不要添加移除窗口开放未定的已弃用兼容性路径。

## 当前兼容性区域

该注册表目前跟踪这些区域中约 70 个兼容性代码。新的插件代码应使用每个区域及对应迁移指南中的替代方案；现有插件可以继续使用兼容性路径，直到文档、诊断和发布说明公告移除窗口。

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态和 `before_agent_start`
- 旧版 `api.on("deactivate", ...)` 清理钩子名称，同时插件迁移到 `gateway_stop`
- 旧版 `activate(api)` 插件入口点，同时插件迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件 allowlist 和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商迁移到显式目录、凭证、思考、重放和传输钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回调字段（见下文）
- WhatsApp `WebInboundMessage` 顶层准入字段（见下文）
- 旧版记忆插件拆分注册，同时记忆插件迁移到 `registerMemoryCapability`
- 旧版记忆专用嵌入提供商注册，同时嵌入提供商迁移到 `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders`
- 旧版渠道 SDK 辅助函数，用于原生消息 schema、提及门控、入站信封格式化和审批能力嵌套
- 旧版渠道路由键和可比较目标辅助函数别名，同时插件迁移到 `openclaw/plugin-sdk/channel-route`
- 激活提示被清单贡献所有权替代
- `setup-api` 运行时 fallback，同时设置描述符迁移到冷路径 `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商目录钩子迁移到 `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包迁移到 `openclaw.channel.exposure`
- 旧版运行时策略配置键，同时 Doctor 将操作员迁移到 `agentRuntime`
- 生成的内置渠道配置元数据 fallback，同时注册表优先的 `channelConfigs` 元数据落地
- 持久化插件注册表禁用和安装迁移环境变量标志，同时修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版插件拥有的 Web 搜索、Web 获取和 x_search 配置路径，同时 Doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 作者配置和内置插件加载路径别名，同时安装元数据迁移到状态管理的插件台账

### WhatsApp 入站回调扁平别名

WhatsApp 运行时回调会传递 `WebInboundMessage`：规范的嵌套 `event`、`payload`、`quote`、`group` 和 `platform` 上下文，以及已弃用的已发布回调字段扁平别名。新的回调代码应读取嵌套上下文。构造干净嵌套回调消息的代码可以使用 `WebInboundCallbackMessage`；仍然注入旧扁平测试或插件消息的兼容性监听器应使用 `LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平别名会保留到 **2026-08-30**；该窗口仅适用于扁平别名访问，不适用于嵌套形态，后者是规范运行时契约。每个扁平别名的 TypeScript `@deprecated` 注解都会命名其确切的嵌套替代项。常见示例：

- `id`、`timestamp` 和 `isBatched` 移到 `event` 下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location` 和 `untrustedStructuredContext` 移到 `payload` 下。
- `to`、`chatId`、发送者/自身字段、`sendComposing`、`reply(...)` 和 `sendMedia(...)` 移到 `platform` 下。
- `replyTo*` 字段移到 `quote` 下；群组主题/参与者/提及字段移到 `group` 下。

`payload.untrustedStructuredContext` 从入站提供商载荷中提取。插件在将其 `payload` 视为权威之前，应检查 `label`、`source` 和 `type`。

### WhatsApp 入站准入字段

已接受的 WhatsApp 回调消息会携带 `admission`，这是一个公开安全的信封，用于表示准入该消息的访问控制决策。新的回调代码应从 `msg.admission` 读取准入事实，而不是使用较旧的顶层准入字段。

顶层字段会保留到 **2026-08-30**。每个字段的 TypeScript `@deprecated` 注解都会命名其替代项：

- `from` 和 `conversationId` 移到 `admission.conversation.id`。
- `accountId` 移到 `admission.accountId`。
- `accessControlPassed` 是 `admission.ingress.decision === "allow"` 的派生兼容性视图；对于已经携带 `admission` 的消息，写入旧版布尔值不会重写入口图。
- `chatType` 移到 `admission.conversation.kind`。

## 插件检查器包

插件检查器应作为单独的包/仓库存在于核心 OpenClaw 仓库之外，并由带版本的兼容性和清单契约支撑。第一天的 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出清单/schema 验证、正在检查的契约兼容性版本、安装/来源元数据检查、冷路径导入检查，以及弃用/兼容性警告。使用 `--json` 在 CI 注解中获得稳定的机器可读输出。OpenClaw 核心应公开检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

### 维护者验收通道

在针对 OpenClaw 插件包验证外部检查器时，使用 Crabbox 支撑的 Blacksmith Testbox 运行可安装包验收通道。在包构建完成后，从干净的 OpenClaw checkout 中运行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

为维护者保持该通道为选择性启用，因为它会安装外部 npm 包，并可能检查在仓库之外克隆的插件包。本地仓库守卫覆盖 SDK 导出映射、兼容性注册表元数据、已弃用 SDK 导入清理，以及内置插件导入边界；Testbox 检查器证明覆盖外部插件作者实际消费它时的包形态。

## 发布说明

发布说明应包含即将到来的插件弃用项、目标日期和迁移文档链接，然后兼容性路径才可移动到 `removal-pending` 或 `removed`。
