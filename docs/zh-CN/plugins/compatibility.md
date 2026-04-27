---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一个插件兼容性警告
    - 你正在规划一个插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-27T13:31:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfe6896830a9493660b064a17ee2e082ae5bf5b43222a5652f0b37116332e997
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会通过具名兼容性适配器继续保留较旧的插件契约，然后再移除它们。这可以在 SDK、清单、设置、配置和智能体运行时契约演进期间，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中进行跟踪。

每条记录都包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、Agent Runtimes 或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 涵盖旧行为和新行为的文档、诊断和测试

该注册表是维护者进行规划和未来插件检查器校验的依据。如果某项面向插件的行为发生变化，请在添加适配器的同一次变更中添加或更新对应的兼容性记录。

Doctor 修复和迁移兼容性会单独在 `src/commands/doctor/shared/deprecation-compat.ts` 中跟踪。这些记录涵盖旧的配置结构、安装台账布局以及修复垫片；即使运行时兼容路径已被移除，它们也可能仍需继续保留。

发布清查应同时检查这两个注册表。不要仅仅因为对应的运行时或配置兼容性记录已过期，就删除某个 Doctor 迁移；首先要确认是否仍存在需要该修复的受支持升级路径。还要在发布规划期间重新验证每条替代说明，因为随着提供商和渠道迁出核心，插件归属和配置覆盖范围都可能发生变化。

## 插件检查器包

插件检查器应作为一个独立的包/仓库存在于 OpenClaw 核心仓库之外，并以带版本的兼容性契约和清单契约为基础。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单 / schema 校验
- 正在检查的契约兼容版本
- 安装 / 来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用 `--json` 可获得稳定的机器可读输出。OpenClaw 核心应暴露供检查器使用的契约和夹具，但不应从主 `openclaw` 包中发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入某个已文档化插件契约替代方案的同一版本中移除该契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器继续保留旧行为。
3. 当插件作者可以采取行动时，发出诊断或警告。
4. 记录替代方案和时间线。
5. 同时测试旧路径和新路径。
6. 等待已公布的迁移窗口结束。
7. 仅在获得明确的破坏性发布批准后才移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。不要添加移除窗口无限期开放的已弃用兼容路径，除非维护者明确决定这是永久兼容性，并将其标记为 `active`。

## 当前兼容性范围

当前的兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件结构和 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，同时插件正在迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  状态构建器、`openclaw/plugin-sdk/test-utils`，以及 `ClawdbotConfig` /
  `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商 / 渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商正在迁移到显式的 catalog、auth、thinking、replay 和 transport 钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 旧版 memory 插件拆分注册，同时 memory 插件正在迁移到
  `registerMemoryCapability`
- 旧版渠道 SDK 辅助工具，用于原生消息 schema、提及门控、入站信封格式化和审批能力嵌套
- 正在由清单贡献归属替代的激活提示
- `setup-api` 运行时回退，同时 setup 描述符正在迁移到冷路径
  `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商 catalog 钩子正在迁移到
  `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包正在迁移到
  `openclaw.channel.exposure`
- 旧版 runtime-policy 配置键，同时 Doctor 正在将操作员迁移到
  `agentRuntime`
- 生成的内置渠道配置元数据回退，同时注册表优先的
  `channelConfigs` 元数据正在落地
- 持久化插件注册表禁用和安装迁移环境变量标志，同时修复流程正在将操作员迁移到 `openclaw plugins registry --refresh` 和
  `openclaw doctor --fix`
- 旧版插件自有 web search、web fetch 和 x_search 配置路径，同时
  Doctor 正在将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 编写配置和内置插件加载路径别名，同时安装元数据正在迁移到由状态管理的插件台账中

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明公布移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用项、目标日期以及迁移文档链接。这个警告必须发生在某个兼容路径变为 `removal-pending` 或 `removed` 之前。
