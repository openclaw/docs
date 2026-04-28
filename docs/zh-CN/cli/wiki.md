---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在记录或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（memory-wiki vault status、search、compile、lint、apply、bridge 和 Obsidian 辅助工具）'
title: wiki
x-i18n:
    generated_at: "2026-04-28T11:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9d25a16125ac201ba5856acdb9eeda43725c30815507b17a96702a2ce3d6c91
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

检查和维护 `memory-wiki` 知识库。

由内置的 `memory-wiki` 插件提供。

相关：

- [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)
- [记忆概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)

## 用途

当你需要一个编译后的知识库，并具备以下能力时，使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 带有丰富来源信息的综合内容
- 矛盾和新鲜度报告
- 从活跃记忆插件进行桥接导入
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

检查当前知识库模式、健康状态和 Obsidian CLI 可用性。

当你不确定知识库是否已初始化、桥接模式是否健康，或 Obsidian 集成是否可用时，先使用此命令。

当桥接模式处于活跃状态并配置为读取记忆产物时，此命令会查询正在运行的 Gateway 网关，因此它看到的活跃记忆插件上下文与智能体/运行时记忆相同。

### `wiki doctor`

运行 wiki 健康检查，并显示配置或知识库问题。

当桥接模式处于活跃状态并配置为读取记忆产物时，此命令会先查询正在运行的 Gateway 网关，然后构建报告。已禁用的桥接导入，以及不读取记忆产物的桥接配置，会保持本地/离线。

典型问题包括：

- 已启用桥接模式但没有公共记忆产物
- 知识库布局无效或缺失
- 预期使用 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 知识库布局和起始页面。

这会初始化根结构，包括顶层索引和缓存目录。

### `wiki ingest <path-or-url>`

将内容导入 wiki 源层。

注意：

- URL 导入由 `ingest.allowUrlIngest` 控制
- 导入的源页面会在 frontmatter 中保留来源信息
- 启用后，导入之后可以自动编译

### `wiki compile`

重建索引、相关块、仪表板和编译后的摘要。

这会在以下位置写入稳定的机器可读产物：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译还会刷新报告页面。

### `wiki lint`

检查知识库并报告：

- 结构问题
- 来源缺口
- 矛盾
- 未解决问题
- 低置信度页面/声明
- 过期页面/声明

在进行有意义的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`

当你需要 wiki 特定排序或来源详情时，使用 `wiki search`。如果只想进行一次广泛的共享召回，并且活跃记忆插件公开了共享搜索，请优先使用 `openclaw memory search`。

### `wiki get <lookup>`

通过 ID 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

应用小范围变更，而不是自由编辑页面。

支持的流程包括：

- 创建/更新综合页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾
- 更新置信度/状态
- 写入结构化声明

此命令的存在，是为了让 wiki 能够安全演进，而无需手动编辑托管块。

### `wiki bridge import`

从活跃记忆插件导入公共记忆产物到桥接支持的源页面。

在 `bridge` 模式下，当你想将最新导出的记忆产物拉取到 wiki 知识库中时使用此命令。

对于活跃桥接产物读取，CLI 会通过 Gateway 网关 RPC 路由导入，因此导入会使用运行时记忆插件上下文。如果桥接导入被禁用，或产物读取被关闭，该命令会保持本地/离线的零导入行为。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径导入。

这是有意设计为实验性的，并且仅限同一台机器使用。

### `wiki obsidian ...`

用于在 Obsidian 友好模式下运行的知识库的 Obsidian 辅助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用 `obsidian.useOfficialCli` 时，这些命令要求官方 `obsidian` CLI 位于 `PATH` 中。

## 实用使用建议

- 当来源和页面身份很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑托管的生成区段。
- 在信任存在矛盾或低置信度的内容之前，使用 `wiki lint`。
- 在批量导入或源内容变更后，如果你想立即获得新的仪表板和编译后的摘要，请使用 `wiki compile`。
- 当桥接模式依赖新导出的记忆产物时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为由以下配置决定：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型请参阅 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [记忆 wiki](/zh-CN/plugins/memory-wiki)
