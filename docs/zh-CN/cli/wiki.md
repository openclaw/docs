---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在编写文档或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（memory-wiki vault status、search、compile、lint、apply、bridge、ChatGPT 导入和 Obsidian 辅助工具）'
title: wiki
x-i18n:
    generated_at: "2026-07-05T11:11:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f50389227366eadfb027b019998604be4651b44430f8d7c04d719990843dd84
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

检查并维护 `memory-wiki` 仓库。由内置的 `memory-wiki` 插件提供。

相关：[Memory Wiki 插件](/zh-CN/plugins/memory-wiki)、[记忆概览](/zh-CN/concepts/memory)、[CLI：memory](/zh-CN/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

显示仓库模式、健康状态和 Obsidian CLI 可用性。先使用此命令检查仓库是否已初始化、bridge 模式是否健康，或 Obsidian 集成是否可用。

当 bridge 模式处于活动状态并配置为读取记忆工件时，此命令会查询正在运行的 Gateway 网关，因此它能看到与智能体/运行时记忆相同的活动记忆插件上下文。

### `wiki doctor`

运行 wiki 健康检查并报告可执行的修复建议。不健康时以非零状态退出。

当 bridge 模式处于活动状态并配置为读取记忆工件时，此命令会先查询正在运行的 Gateway 网关，然后再构建报告。已禁用的 bridge 导入以及不读取记忆工件的 bridge 配置会保持本地/离线状态。

典型问题：

- 启用了 bridge 模式但没有公共记忆工件
- 仓库布局无效或缺失
- 预期使用 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 仓库布局和起始页面，包括顶层索引和缓存目录。

### `wiki ingest <path>`

将本地 Markdown 或文本文件导入到 wiki 的 `sources/` 文件夹，作为源页面。`<path>` 必须是本地文件路径；目前没有 URL 导入。会拒绝二进制文件。

导入的源页面带有溯源 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。导入后始终会重新编译仓库。

标志：`--title <title>` 覆盖源标题（默认：从文件名派生）。

### `wiki okf import <path>`

将解包后的 Open Knowledge Format 包导入为 wiki 概念页面。

导入器会读取 OKF 目录树中每个非保留的 `.md` 概念文档，要求提供非空的 `type` 字段，并将未知 OKF `type` 值视为通用概念。保留的 OKF `index.md` 和 `log.md` 文件不会作为概念导入。

导入的页面会扁平化到 `concepts/` 下，因此现有 wiki 编译、搜索、获取、摘要和仪表板流程可以立即看到它们。原始 OKF 概念 ID、`type`、`resource`、`tags`、时间戳、源路径和完整 frontmatter 都会保留在页面 frontmatter 中。内部 OKF Markdown 链接会重写为生成的 wiki 页面；损坏链接或外部链接会保持不变。导入后始终会重新编译仓库。

示例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相关块、仪表板和编译后的摘要。将稳定的面向机器的工件写入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译也会刷新报告页面。

### `wiki lint`

检查仓库并写入一份报告，覆盖：

- 结构问题（损坏链接、缺失/重复 ID、缺失页面类型或标题、无效 frontmatter）
- 溯源缺口（缺失源 ID、缺失导入溯源）
- 矛盾（标记的矛盾、冲突的声明）
- 开放问题
- 低置信度页面和声明
- 过时页面和声明

在有意义的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

使用 `wiki search` 获取 wiki 特定的排序和溯源。对于一次宽泛的共享召回，若活动记忆插件暴露共享搜索，优先使用 `openclaw memory search`。

搜索模式：

- `find-person`：别名、账号名、社交账号、规范 ID 和人物页面
- `route-question`：询问对象/最佳用途提示和关系上下文
- `source-evidence`：源页面和结构化证据字段
- `raw-claim`：带有声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出包含 `Claim:` 和 `Evidence:` 行。JSON 输出还会额外暴露 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供智能体侧下钻使用。

### `wiki get <lookup>`

按 ID 或相对路径读取 wiki 页面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

在不进行自由形式页面手术的情况下应用窄范围变更：

- `apply synthesis <title>`：使用托管的摘要正文创建或刷新综合页面
- `apply metadata <lookup>`：更新现有页面上的元数据

两者都接受 `--source-id`、`--contradiction`、`--question`（均可重复）、`--confidence <n>`（0-1）和 `--status <status>`。`apply metadata` 还接受 `--clear-confidence`，用于移除已存储的置信度值。这是演进 wiki 页面的受支持方式，可保持托管生成块完整。

### `wiki bridge import`

从活动记忆插件导入公共记忆工件到 bridge 支持的源页面。在 `bridge` 模式中使用此命令，将最新导出的记忆工件拉取到 wiki 仓库。

对于活动的 bridge 工件读取，CLI 会通过 Gateway 网关 RPC 路由导入，使其使用运行时记忆插件上下文。如果 bridge 导入已禁用或工件读取已关闭，该命令会保持本地/离线的零导入行为。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径（`unsafeLocal.paths`）导入。此功能有意保持实验性，并且仅限同一台机器。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

将 ChatGPT 导出导入为 wiki 草稿源页面。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 标志              | 默认值     | 描述                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必填）   | ChatGPT 导出目录或 `conversations.json` 路径。                |
| `--dry-run`       | `false`    | 在不写入页面的情况下预览已创建/已更新/已跳过的数量。         |

非 dry-run 导入如果更改了任何页面，会记录一个导入运行 ID，并在摘要中打印出来，回滚时需要该 ID。

### `wiki chatgpt rollback <run-id>`

回滚以前应用的 ChatGPT 导入运行，删除它创建的页面，并恢复它覆盖的页面。如果该运行已回滚，则不执行操作（并报告 `alreadyRolledBack`）。

### `wiki obsidian ...`

面向在 Obsidian 友好模式下运行的仓库的 Obsidian 辅助命令：`status`、`search`、`open`、`command`、`daily`。当启用 `obsidian.useOfficialCli` 时，这些命令要求官方 `obsidian` CLI 位于 `PATH` 上。

## 实用使用指南

- 当溯源和页面身份很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑托管生成区段。
- 在信任矛盾或低置信度内容之前，使用 `wiki lint`。
- 在批量导入或源变更后，如果想立即获得新的仪表板和编译后的摘要，请使用 `wiki compile`。
- 当数据目录、文档导出或智能体增强流水线已经输出 OKF Markdown 包时，使用 `wiki okf import`。
- 当 bridge 模式依赖新导出的记忆工件时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为由以下配置塑造：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型见 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Memory wiki](/zh-CN/plugins/memory-wiki)
