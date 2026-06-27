---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在编写文档或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（memory-wiki 库状态、搜索、编译、lint、应用、桥接和 Obsidian 辅助工具）'
title: Wiki
x-i18n:
    generated_at: "2026-06-27T01:44:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
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

当你需要一个已编译的知识库，并具备以下能力时，使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 具备丰富来源信息的综合内容
- 矛盾和新鲜度报告
- 从主动记忆插件桥接导入
- 可选的 Obsidian CLI 辅助工具

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
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

检查当前知识库模式、健康状态和 Obsidian CLI 可用性。

当你不确定知识库是否已初始化、桥接模式是否健康，或 Obsidian 集成是否可用时，先使用此命令。

当桥接模式处于活动状态，并配置为读取记忆工件时，此命令会查询正在运行的 Gateway 网关，因此它看到的主动记忆插件上下文与 Agent/运行时记忆相同。

### `wiki doctor`

运行 wiki 健康检查，并显示配置或知识库问题。

当桥接模式处于活动状态，并配置为读取记忆工件时，此命令会在生成报告前查询正在运行的 Gateway 网关。已禁用的桥接导入，以及不读取记忆工件的桥接配置，会保持本地/离线状态。

典型问题包括：

- 启用了桥接模式，但没有公共记忆工件
- 知识库布局无效或缺失
- 预期使用 Obsidian 模式时，缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 知识库布局和起始页面。

这会初始化根结构，包括顶层索引和缓存目录。

### `wiki ingest <path-or-url>`

将内容导入到 wiki 源层。

注意：

- URL 导入由 `ingest.allowUrlIngest` 控制
- 导入的源页面会在 frontmatter 中保留来源信息
- 启用后，导入完成后可以自动编译

### `wiki okf import <path>`

将解包后的 Open Knowledge Format 包导入为 wiki 概念页面。

导入器会读取 OKF 目录树中每个非保留的 `.md` 概念文档，要求存在非空的 `type` 字段，并将未知的 OKF `type` 值视为通用概念。保留的 OKF `index.md` 和 `log.md` 文件不会作为概念导入。

导入的页面会扁平化到 `concepts/` 下，因此现有的 wiki compile、search、get、digest 和 dashboard 流程可以立即看到它们。原始 OKF 概念 ID、`type`、`resource`、`tags`、时间戳、源路径和完整 frontmatter 都会保留在页面 frontmatter 中。内部 OKF Markdown 链接会被重写到生成的 wiki 页面；损坏或外部链接会保持不变。

示例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相关块、仪表板和已编译摘要。

这会在以下位置写入稳定的面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，compile 也会刷新报告页面。

### `wiki lint`

检查知识库并报告：

- 结构问题
- 来源信息缺口
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
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

当你需要 wiki 专用排序或来源详情时，使用 `wiki search`。如果只需要一次广泛的共享召回，并且主动记忆插件暴露了共享搜索，优先使用 `openclaw memory search`。

搜索模式帮助智能体选择正确的表面：

- `find-person`：别名、handle、社交账号、规范 ID 和人物页面
- `route-question`：询问对象/最适用场景提示和关系上下文
- `source-evidence`：源页面和结构化证据字段
- `raw-claim`：带声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出会包含 `Claim:` 和 `Evidence:` 行。JSON 输出还会额外暴露 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供智能体侧下钻使用。

### `wiki get <lookup>`

通过 ID 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

在不进行自由形式页面手术的情况下应用窄范围变更。

支持的流程包括：

- 创建/更新综合页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾
- 更新置信度/状态
- 写入结构化声明

此命令的存在是为了让 wiki 能够安全演进，而无需手动编辑受管理的块。

### `wiki bridge import`

从主动记忆插件将公共记忆工件导入到桥接支持的源页面。

当你处于 `bridge` 模式，并希望将最新导出的记忆工件拉入 wiki 知识库时，使用此命令。

对于活动桥接工件读取，CLI 会通过 Gateway RPC 路由导入，因此导入会使用运行时记忆插件上下文。如果桥接导入被禁用，或工件读取被关闭，此命令会保持本地/离线的零导入行为。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径导入。

这是有意设计为实验性的，并且仅限同一台机器使用。

### `wiki obsidian ...`

用于以 Obsidian 友好模式运行的知识库的 Obsidian 辅助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用 `obsidian.useOfficialCli` 时，这些命令要求官方 `obsidian` CLI 位于 `PATH` 上。

## 实用使用指南

- 当来源信息和页面身份重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑受管理的生成章节。
- 在信任矛盾或低置信度内容之前，使用 `wiki lint`。
- 在批量导入或源变更后，如果你希望立即获得新鲜的仪表板和已编译摘要，使用 `wiki compile`。
- 当数据目录、文档导出或智能体增强流水线已经产出 OKF Markdown 包时，使用 `wiki okf import`。
- 当桥接模式依赖新导出的记忆工件时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 行为由以下配置塑造：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型见 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Memory wiki](/zh-CN/plugins/memory-wiki)
