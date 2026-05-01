---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-05-01T22:18:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 会先通过具名兼容性适配器连接较旧的插件契约，然后再移除它们。这样可以在 SDK、清单、设置、配置和智能体运行时契约演进期间，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。

每条记录包含：

- 稳定的兼容性代码
- Status：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果面向插件的行为发生变化，请在添加适配器的同一变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性在 `src/commands/doctor/shared/deprecation-compat.ts` 中单独跟踪。这些记录覆盖旧配置形态、安装账本布局，以及在运行时兼容性路径移除后可能仍需保留的修复垫片。

发布扫描应检查两个注册表。不要仅因为匹配的运行时或配置兼容性记录已过期就删除 Doctor 迁移；请先验证是否不存在仍需要该修复的受支持升级路径。发布规划期间还要重新验证每个替代方案注释，因为随着提供商和渠道移出核心，插件所有权和配置覆盖范围可能会变化。

## 插件检查器包

插件检查器应作为一个单独的包/仓库存在于核心 OpenClaw 仓库之外，并由版本化的兼容性和清单契约支撑。

第一天的 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/架构验证
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

使用 `--json` 在 CI 注释中获得稳定的机器可读输出。OpenClaw 核心应暴露检查器可消费的契约和 fixture，但不应从主 `openclaw` 包发布检查器二进制文件。

### 维护者验收通道

在针对 OpenClaw 插件包验证外部检查器时，请使用 Blacksmith Testbox 运行可安装包验收通道。在包构建完成后，从干净的 OpenClaw 检出运行：

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

保持此通道为维护者选择加入，因为它会安装外部 npm 包，并且可能检查在仓库外克隆的插件包。本地仓库守卫覆盖 SDK 导出映射、兼容性注册表元数据、已弃用 SDK 导入清理，以及内置插件导入边界；Testbox 检查器证明覆盖外部插件作者实际消费该包的方式。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序是：

1. 添加新契约。
2. 通过具名兼容性适配器保持旧行为连接。
3. 在插件作者可以采取行动时发出诊断或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已公告的迁移窗口。
7. 仅在获得明确的破坏性发布批准后移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。除非维护者明确决定这是永久兼容性并将其标记为 `active`，否则不要添加移除窗口开放式的已弃用兼容性路径。

## 当前兼容性区域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态和 `before_agent_start`
- 插件迁移到 `register(api)` 期间的旧版 `activate(api)` 插件入口点
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` Status 构建器、`openclaw/plugin-sdk/test-utils`（已由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 提供商迁移到显式目录、凭证、思考、回放和传输钩子期间的旧版提供商插件钩子和类型别名
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 记忆插件迁移到 `registerMemoryCapability` 期间的旧版记忆插件拆分注册
- 面向原生消息架构、提及门控、入站信封格式化和审批能力嵌套的旧版渠道 SDK 辅助工具
- 插件迁移到 `openclaw/plugin-sdk/channel-route` 期间的旧版渠道路由键和可比目标辅助工具别名
- 正被清单贡献所有权替代的激活提示
- 设置描述符迁移到冷 `setup.requiresRuntime: false` 元数据期间的 `setup-api` 运行时回退
- 提供商目录钩子迁移到 `catalog.run(...)` 期间的提供商 `discovery` 钩子
- 渠道包迁移到 `openclaw.channel.exposure` 期间的渠道 `showConfigured` / `showInSetup` 元数据
- Doctor 将操作员迁移到 `agentRuntime` 期间的旧版运行时策略配置键
- 注册表优先的 `channelConfigs` 元数据落地期间的生成式内置渠道配置元数据回退
- 持久化插件注册表禁用和安装迁移环境标志，同时修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- Doctor 将旧版插件拥有的 Web 搜索、Web 获取和 x_search 配置路径迁移到 `plugins.entries.<plugin>.config`
- 安装元数据迁移到状态管理的插件账本期间的旧版 `plugins.installs` 手写配置和内置插件加载路径别名

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。在文档、诊断和发布说明公告移除窗口之前，现有插件可以继续使用兼容性路径。

## 发布说明

发布说明应包含即将发生的插件弃用、目标日期以及迁移文档链接。该警告需要在兼容性路径移动到 `removal-pending` 或 `removed` 之前发生。
