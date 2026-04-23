---
read_when:
    - 你想要使用 Memory Wiki CLI
    - 你正在为 `openclaw wiki` 编写文档或进行更改
summary: '`openclaw wiki` 的 CLI 参考（Memory Wiki 仓库状态、搜索、编译、lint、apply、bridge 和 Obsidian 辅助工具）'
title: wiki
x-i18n:
    generated_at: "2026-04-23T06:18:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

检查并维护 `memory-wiki` 仓库。

由内置的 `memory-wiki` 插件提供。

相关内容：

- [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)
- [Memory 概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)

## 用途

当你需要一个已编译的知识仓库，并具备以下能力时，请使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 带丰富来源信息的综合总结
- 矛盾与时效性报告
- 从当前激活的 memory 插件导入桥接数据
- 可选的 Obsidian CLI 辅助工具

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

检查当前仓库模式、健康状态以及 Obsidian CLI 可用性。

当你不确定仓库是否已初始化、bridge 模式是否健康，
或 Obsidian 集成是否可用时，请先使用此命令。

### `wiki doctor`

运行 wiki 健康检查，并显示配置或仓库问题。

典型问题包括：

- 已启用 bridge 模式，但没有公开的 memory 工件
- 仓库布局无效或缺失
- 在预期使用 Obsidian 模式时，缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 仓库布局和起始页面。

这会初始化根结构，包括顶级索引和缓存目录。

### `wiki ingest <path-or-url>`

将内容导入 wiki 源层。

说明：

- URL 导入由 `ingest.allowUrlIngest` 控制
- 导入的源页面会在 frontmatter 中保留来源信息
- 启用时，导入后可自动运行 compile

### `wiki compile`

重建索引、相关区块、仪表板和已编译摘要。

这会在以下位置写入稳定的面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，compile 还会刷新报告页面。

### `wiki lint`

对仓库运行 lint 并报告：

- 结构问题
- 来源信息缺口
- 矛盾
- 未解决问题
- 低置信度页面/声明
- 过时页面/声明

在对 wiki 进行有意义的更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`

当你需要 wiki 特定的排序或来源详情时，请使用 `wiki search`。
如果你只想进行一次广泛的共享召回，并且当前激活的 memory 插件公开了共享搜索，
则优先使用 `openclaw memory search`。

### `wiki get <lookup>`

按 ID 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

应用范围较窄的变更，而不是自由修改页面内容。

支持的流程包括：

- 创建/更新综合总结页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾项
- 更新置信度/状态
- 写入结构化声明

此命令的存在，是为了让 wiki 能够安全演化，而无需手动编辑受管理的区块。

### `wiki bridge import`

将当前激活的 memory 插件中的公开 memory 工件导入到由 bridge 支持的源页面中。

当你处于 `bridge` 模式，并希望将最新导出的 memory 工件拉入 wiki 仓库时，请使用此命令。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径导入。

这是有意设计为实验性的，并且仅限同一台机器使用。

### `wiki obsidian ...`

为运行在 Obsidian 友好模式下的仓库提供 Obsidian 辅助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用了 `obsidian.useOfficialCli` 时，
这些命令要求官方 `obsidian` CLI 在 `PATH` 中可用。

## 实际使用建议

- 当来源信息和页面标识很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑受管理的生成区段。
- 在信任存在矛盾或低置信度的内容前，先运行 `wiki lint`。
- 在批量导入或源内容变更后，如果你希望立即获得最新的
  仪表板和已编译摘要，请使用 `wiki compile`。
- 当 bridge 模式依赖新导出的 memory 工件时，使用 `wiki bridge import`。

## 配置关联项

`openclaw wiki` 的行为受以下配置影响：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型请参见 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。
