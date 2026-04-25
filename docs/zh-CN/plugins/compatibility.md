---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一个插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-25T05:55:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 在移除旧版插件契约之前，会先通过具名兼容性适配器保持这些旧契约继续可用。这样可以在 SDK、清单、设置、配置和 Agent Runtimes 契约演进的同时，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中跟踪。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 归属方：SDK、配置、设置、渠道、提供商、插件执行、Agent Runtimes 或核心
- 适用时的引入日期和弃用日期
- 替代指引
- 覆盖旧行为和新行为的文档、诊断和测试

该注册表是维护者规划和未来插件检查器校验的依据。如果面向插件的行为发生变化，请在添加适配器的同一次变更中添加或更新兼容性记录。

## 插件检查器包

插件检查器应位于核心 OpenClaw 仓库之外，作为一个由版本化兼容性契约和清单契约支持的独立包/仓库。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单 / schema 校验
- 正在检查的契约兼容性版本
- install / source 元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注解中使用 `--json` 以获得稳定的机器可读输出。OpenClaw 核心应公开检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器保留旧行为继续可用。
3. 在插件作者可以采取行动时发出诊断或警告。
4. 记录替代方案和时间线。
5. 同时测试旧路径和新路径。
6. 等待已公布的迁移窗口结束。
7. 只有在获得显式破坏性版本批准后才移除。

弃用记录必须包含警告开始日期、替代方案、文档链接，以及在已知情况下的目标移除日期。

## 当前兼容性范围

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态和 `before_agent_start`
- 内置插件 allowlist 和启用行为
- 旧版 provider / channel 环境变量清单元数据
- 正在由清单贡献所有权替代的激活提示
- 当公共命名转向 `agentRuntime` 时，`embeddedHarness` 和 `agent-harness` 命名别名
- 当注册表优先的 `channelConfigs` 元数据落地时，生成的内置渠道配置元数据回退

新插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断和发布说明公布移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用信息，并附带目标日期和迁移文档链接。这类预警必须在兼容路径转为 `removal-pending` 或 `removed` 之前发出。
