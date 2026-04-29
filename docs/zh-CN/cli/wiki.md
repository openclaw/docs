---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在记录或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（memory-wiki 的 vault status、search、compile、lint、apply、bridge 以及 Obsidian 辅助工具）'
title: 维基
x-i18n:
    generated_at: "2026-04-29T19:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

检查并维护 `memory-wiki` 知识库。

由内置的 `memory-wiki` 插件提供。

相关内容：

- [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)
- [Memory 概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)

## 用途

当你需要一个编译后的知识库，并具备以下能力时，请使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 富含来源信息的综合内容
- 矛盾和新鲜度报告
- 从当前启用的 memory 插件进行桥接导入
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
openclaw wiki search "who should I ask about Teams?" --mode route-question
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

检查当前知识库模式、健康状况，以及 Obsidian CLI 可用性。

当你不确定知识库是否已初始化、桥接模式是否健康，或 Obsidian 集成是否可用时，请先使用此命令。

当桥接模式处于启用状态并配置为读取 memory 工件时，此命令会查询正在运行的 Gateway 网关，因此它看到的当前 memory 插件上下文与智能体/运行时 memory 相同。

### `wiki doctor`

运行 wiki 健康检查，并显示配置或知识库问题。

当桥接模式处于启用状态并配置为读取 memory 工件时，此命令会先查询正在运行的 Gateway 网关，再生成报告。已禁用的桥接导入，以及未读取 memory 工件的桥接配置，仍保持本地/离线模式。

典型问题包括：

- 桥接模式已启用，但没有公开的 memory 工件
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
- 启用时，导入后可自动运行编译

### `wiki compile`

重建索引、相关块、仪表板和编译后的摘要。

这会将稳定的机器可读工件写入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译还会刷新报告页面。

### `wiki lint`

检查知识库并报告：

- 结构问题
- 来源信息缺口
- 矛盾
- 未解决的问题
- 低置信度页面/声明
- 过期页面/声明

在进行有意义的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

当你需要 wiki 专用排序或来源详情时，请使用 `wiki search`。如果只需要一次宽泛的共享回忆检索，并且当前 memory 插件公开了共享搜索，请优先使用 `openclaw memory search`。

搜索模式可帮助智能体选择正确的界面：

- `find-person`：别名、用户名、社交账号、规范 ID 和人物页面
- `route-question`：适合询问/最适合使用场景提示，以及关系上下文
- `source-evidence`：源页面和结构化证据字段
- `raw-claim`：带有声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出会包含 `Claim:` 和 `Evidence:` 行。JSON 输出还会额外公开 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供智能体端深入查看。

### `wiki get <lookup>`

通过 ID 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

在不进行自由形式页面编辑的情况下应用小范围变更。

支持的流程包括：

- 创建/更新综合页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾
- 更新置信度/Status
- 写入结构化声明

此命令的存在，是为了让 wiki 能够安全演进，而无需手动编辑托管块。

### `wiki bridge import`

从当前启用的 memory 插件导入公开 memory 工件，并写入桥接支持的源页面。

当你处于 `bridge` 模式，并希望将最新导出的 memory 工件拉入 wiki 知识库时，请使用此命令。

对于当前启用的桥接工件读取，CLI 会通过 Gateway 网关 RPC 路由导入，因此导入会使用运行时 memory 插件上下文。如果桥接导入被禁用或工件读取被关闭，该命令会保持本地/离线的零导入行为。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径导入。

这有意设计为实验性功能，并且仅限同一台机器使用。

### `wiki obsidian ...`

用于在 Obsidian 友好模式下运行的知识库的 Obsidian 辅助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用 `obsidian.useOfficialCli` 时，这些命令要求官方 `obsidian` CLI 位于 `PATH` 中。

## 实用使用指南

- 当来源信息和页面身份很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑托管的生成区段。
- 在信任存在矛盾或低置信度的内容之前，使用 `wiki lint`。
- 在批量导入或源发生变更后，如果你希望立即获得最新的仪表板和编译摘要，请使用 `wiki compile`。
- 当桥接模式依赖新导出的 memory 工件时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为受以下配置影响：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型请参阅 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Memory wiki](/zh-CN/plugins/memory-wiki)
