---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一条插件兼容性警告
    - 你正在规划一次插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-28T01:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cb004d9959f1892f3bebcdfb9bee3fd78fc3322a2cbee4e8078c41a3f6706c6
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会在移除旧版插件契约之前，通过具名兼容性适配器继续接入这些旧契约。这样可以在 SDK、清单、设置、配置和智能体运行时契约不断演进时，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。

每条记录都包含：

- 一个稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所属方：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果某个面向插件的行为发生变化，请在添加适配器的同一变更中新增或更新对应的兼容性记录。

Doctor 修复和迁移兼容性会在 `src/commands/doctor/shared/deprecation-compat.ts` 中单独跟踪。这些记录涵盖旧版配置结构、安装台账布局以及修复垫片；即使运行时兼容路径被移除，它们也可能仍需继续保留。

发布前的全面检查应同时检查这两个注册表。不要仅因为对应的运行时或配置兼容性记录已过期，就删除某个 Doctor 迁移；首先要确认不存在仍然需要该修复的受支持升级路径。还要在发布规划期间重新验证每条替代说明，因为随着提供商和渠道移出核心，插件归属和配置范围可能会发生变化。

## 插件检查器包

插件检查器应作为独立的包或仓库，存放在 OpenClaw 核心仓库之外，并以带版本的兼容性契约和清单契约为基础。

首个版本的 CLI 应该是：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单 / 模式验证
- 正在检查的契约兼容性版本
- 安装 / 来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中，如果需要稳定的机器可读输出，请使用 `--json`。OpenClaw 核心应暴露检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布该检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入某个插件契约替代方案的同一版本中移除已文档化的原契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器继续接入旧行为。
3. 当插件作者可以采取行动时，发出诊断或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已宣布的迁移窗口结束。
7. 只有在获得明确的破坏性发布批准后才移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。除非维护者明确决定它应作为永久兼容性保留并将其标记为 `active`，否则不要添加一个移除窗口不明确的已弃用兼容路径。

## 当前兼容性领域

当前的兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件结构和 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，在插件迁移到 `register(api)` 期间继续支持
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` Status 构建器、`openclaw/plugin-sdk/test-utils`（由更聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商 / 渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，在提供商迁移到显式目录、认证、思考、回放和传输钩子期间继续支持
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 旧版 memory 插件拆分注册方式，在 memory 插件迁移到 `registerMemoryCapability` 期间继续支持
- 旧版渠道 SDK 辅助方法，用于原生消息模式、提及门控、入站信封格式化和审批能力嵌套
- 旧版渠道路由键和可比较目标辅助别名，在插件迁移到 `openclaw/plugin-sdk/channel-route` 期间继续支持
- 正在被清单贡献归属替代的激活提示
- `setup-api` 运行时回退，在设置描述符迁移到冷路径 `setup.requiresRuntime: false` 元数据期间继续支持
- 提供商 `discovery` 钩子，在提供商目录钩子迁移到 `catalog.run(...)` 期间继续支持
- 渠道 `showConfigured` / `showInSetup` 元数据，在渠道包迁移到 `openclaw.channel.exposure` 期间继续支持
- 旧版运行时策略配置键，在 Doctor 将操作员迁移到 `agentRuntime` 期间继续支持
- 生成的内置渠道配置元数据回退，在注册表优先的 `channelConfigs` 元数据落地期间继续支持
- 持久化插件注册表禁用和安装迁移环境变量标志，在修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix` 期间继续支持
- 旧版插件自有的 web search、web fetch 和 x_search 配置路径，在 Doctor 将它们迁移到 `plugins.entries.<plugin>.config` 期间继续支持
- 旧版 `plugins.installs` 手写配置和内置插件加载路径别名，在安装元数据迁移到状态管理的插件台账期间继续支持

新插件代码应优先使用注册表和特定迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断和发布说明宣布移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用信息，并附上目标日期和迁移文档链接。必须先发出这类警告，兼容路径才能转为 `removal-pending` 或 `removed`。
