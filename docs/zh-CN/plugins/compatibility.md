---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一条插件兼容性警告
    - 你正在规划一次插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-28T00:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f097e51beb57790dc8b491793edb398adf3ab0457cc2404f5fe4b1c89159d112
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会在移除旧版插件契约之前，通过具名兼容性适配器继续接通较旧的插件契约。这样可以在 SDK、清单、设置、配置和智能体运行时契约演进的过程中，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约记录在核心注册表 `src/plugins/compat/registry.ts` 中。

每条记录都包含：

- 一个稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断信息和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果某项面向插件的行为发生变化，请在添加适配器的同一项变更中新增或更新对应的兼容性记录。

Doctor 修复和迁移兼容性会单独记录在 `src/commands/doctor/shared/deprecation-compat.ts`。这些记录覆盖旧版配置结构、安装账本布局以及修复垫片；即使运行时兼容路径已被移除，它们仍可能需要继续保留。

发布巡检应同时检查这两个注册表。不要仅因为对应的运行时或配置兼容性记录已过期，就删除某个 Doctor 迁移；首先要确认不存在任何仍受支持、且仍需要该修复的升级路径。还要在发布规划期间重新验证每条替代说明，因为随着提供商和渠道移出核心，插件归属和配置范围可能会发生变化。

## 插件检查器包

插件检查器应位于核心 OpenClaw 仓库之外，作为一个独立的包或仓库，并以带版本的兼容性契约和清单契约为基础。

第一天上线的 CLI 应该是：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单 / schema 验证
- 正在检查的契约兼容版本
- 安装 / 来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用 `--json` 可获得稳定的机器可读输出。OpenClaw 核心应暴露检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器继续接通旧行为。
3. 当插件作者可以采取行动时，发出诊断信息或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已宣布的迁移窗口结束。
7. 仅在获得明确的破坏性发布批准后再移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。除非维护者明确决定该兼容路径将永久保留并将其标记为 `active`，否则不要添加移除时间窗口不明确的已弃用兼容路径。

## 当前兼容性领域

当前的兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态以及 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，同时插件正迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`，以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商 / 渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商正迁移到显式目录、认证、思考、回放和传输钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 旧版 memory 插件拆分注册方式，同时 memory 插件正迁移到 `registerMemoryCapability`
- 旧版渠道 SDK 辅助工具，用于原生消息 schema、提及门控、入站信封格式化和批准能力嵌套
- 旧版渠道路由键和可比较目标辅助别名，同时插件正迁移到 `openclaw/plugin-sdk/channel-route`
- 正在被清单贡献归属替代的激活提示
- `setup-api` 运行时回退，同时设置描述符正迁移到冷路径 `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商目录钩子正迁移到 `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包正迁移到 `openclaw.channel.exposure`
- 旧版 runtime-policy 配置键，同时 Doctor 正将操作员迁移到 `agentRuntime`
- 已生成的内置渠道配置元数据回退，同时注册表优先的 `channelConfigs` 元数据正在落地
- 持久化插件注册表禁用和安装迁移环境变量标志，同时修复流程正将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版由插件持有的 web search、web fetch 和 x_search 配置路径，同时 Doctor 正将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 手写配置和内置插件加载路径别名，同时安装元数据正迁移到由状态管理的插件账本中

新的插件代码应优先使用注册表和特定迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明宣布移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用项、目标日期以及迁移文档链接。必须先发出该警告，然后兼容路径才能转为 `removal-pending` 或 `removed`。
