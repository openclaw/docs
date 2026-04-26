---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到了一个插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-26T09:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c05c90ecbb74d4249d28bd1398e3b7898a87b7cc8b9a5279e2e0862362b8dbb
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会先通过具名兼容适配器保留旧版插件契约的接线方式，然后再移除它们。这样可以在 SDK、清单、设置、配置以及智能体运行时契约演进的过程中，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。

每条记录都包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 归属方：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断信息和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果某项面向插件的行为发生变化，请在添加适配器的同一项变更中添加或更新兼容性记录。

## 插件检查器包

插件检查器应作为独立的软件包/仓库存在于 OpenClaw 核心仓库之外，并以带版本的兼容性契约和清单契约为基础。

首个版本的 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/模式验证
- 正在检查的契约兼容版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用稳定的机器可读输出时，请使用 `--json`。OpenClaw 核心应暴露检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容适配器保留旧行为的接线方式。
3. 在插件作者可以采取行动时发出诊断信息或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已公告的迁移窗口结束。
7. 仅在获得明确的破坏性版本批准后移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接以及最终移除日期，且最终移除日期不得晚于警告开始后三个月。除非维护者明确决定这是永久兼容并将其标记为 `active`，否则不要添加移除窗口开放式的已弃用兼容路径。

## 当前兼容性领域

当前的兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 仅含旧版钩子形式的插件结构以及 `before_agent_start`
- 在插件迁移到 `register(api)` 期间保留的旧版 `activate(api)` 插件入口点
- 旧版 SDK 别名，例如 `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` Status 构建器，以及 `ClawdbotConfig` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 正在被清单贡献归属替代的激活提示
- 在设置描述符迁移到冷态 `setup.requiresRuntime: false` 元数据期间保留的 `setup-api` 运行时回退
- 在提供商目录钩子迁移到 `catalog.run(...)` 期间保留的提供商 `discovery` 钩子
- 在渠道包迁移到 `openclaw.channel.exposure` 期间保留的渠道 `showConfigured` / `showInSetup` 元数据
- 在 Doctor 将运维人员迁移到 `agentRuntime` 期间保留的旧版运行时策略配置键
- 在注册表优先的 `channelConfigs` 元数据落地期间保留的已生成内置渠道配置元数据回退
- 在修复流程将运维人员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix` 期间保留的持久化插件注册表禁用和安装迁移环境变量标志

新插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明公告移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用项、目标日期以及迁移文档链接。这个警告必须先发生，然后兼容路径才能变为 `removal-pending` 或 `removed`。
