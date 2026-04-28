---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-28T11:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 会通过具名兼容性适配器保留旧版插件契约的连接，然后再移除它们。这会在 SDK、清单、设置、配置和智能体运行时契约演进时，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约在核心注册表中跟踪：
`src/plugins/compat/registry.ts`。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指导
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果面向插件的行为发生变化，请在添加适配器的同一变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性在以下位置单独跟踪：
`src/commands/doctor/shared/deprecation-compat.ts`。这些记录涵盖旧配置形状、安装账本布局和修复垫片；即使运行时兼容性路径被移除，它们也可能仍需保持可用。

发布扫描应检查两个注册表。不要仅仅因为匹配的运行时或配置兼容性记录已过期就删除 Doctor 迁移；请先确认没有仍需要该修复的受支持升级路径。发布规划期间还要重新验证每个替代方案注释，因为随着提供商和渠道移出核心，插件所有权和配置覆盖范围可能会发生变化。

## 插件检查器包

插件检查器应位于核心 OpenClaw 仓库之外，作为一个独立包/仓库，并由版本化的兼容性和清单契约支撑。

第一天的 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/schema 验证
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用 `--json` 输出稳定的机器可读结果。OpenClaw 核心应暴露检查器可使用的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

### 维护者验收通道

在针对 OpenClaw 插件包验证外部检查器时，使用 Blacksmith Testbox 运行可安装包验收通道。包构建完成后，从干净的 OpenClaw checkout 运行：

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

让维护者显式选择启用此通道，因为它会安装外部 npm 包，并可能检查在仓库之外克隆的插件包。本地仓库守卫覆盖 SDK 导出映射、兼容性注册表元数据、弃用 SDK 导入清理，以及内置插件导入边界；Testbox 检查器证明覆盖外部插件作者实际使用的包形态。

## 弃用策略

OpenClaw 不应在引入替代方案的同一发布中移除已记录的插件契约。

迁移顺序是：

1. 添加新契约。
2. 通过具名兼容性适配器保持旧行为连接。
3. 在插件作者可以采取行动时发出诊断或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待公告的迁移窗口期结束。
7. 仅在获得明确的破坏性发布批准后移除。

弃用记录必须包含警告开始日期、替代方案、文档链接，以及不晚于警告开始后三个月的最终移除日期。不要添加没有固定移除窗口的弃用兼容性路径，除非维护者明确决定它是永久兼容性，并改为将其标记为 `active`。

## 当前兼容性区域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子的插件形状和 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，同时插件迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 测试子路径替代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商迁移到显式目录、凭证、思考、重放和传输钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已弃用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 旧版 memory-plugin 拆分注册，同时内存插件迁移到 `registerMemoryCapability`
- 旧版渠道 SDK 辅助工具，用于原生消息 schema、提及门控、入站信封格式化，以及审批能力嵌套
- 旧版渠道路由键和可比较目标辅助别名，同时插件迁移到 `openclaw/plugin-sdk/channel-route`
- 正被清单贡献所有权替代的激活提示
- 对尚未声明 `activation.onStartup` 的插件，已弃用的隐式启动 sidecar 加载；维护者可以用 `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` 测试未来更严格的行为
- `setup-api` 运行时回退，同时设置描述符迁移到冷 `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商目录钩子迁移到 `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包迁移到 `openclaw.channel.exposure`
- 旧版运行时策略配置键，同时 Doctor 将操作员迁移到 `agentRuntime`
- 生成的内置渠道配置元数据回退，同时注册表优先的 `channelConfigs` 元数据落地
- 持久化插件注册表禁用和安装迁移环境变量标志，同时修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版插件自有 Web 搜索、Web 获取和 x_search 配置路径，同时 Doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 手写配置和内置插件加载路径别名，同时安装元数据迁移到由状态管理的插件账本中

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容性路径，直到文档、诊断和发布说明公告移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用、目标日期以及指向迁移文档的链接。该警告需要在兼容性路径移至 `removal-pending` 或 `removed` 之前发生。
