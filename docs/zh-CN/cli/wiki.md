---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在记录或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（Memory Wiki 保险库状态、搜索、编译、lint、应用、桥接、ChatGPT 导入和 Obsidian 辅助工具）'
title: Wiki
x-i18n:
    generated_at: "2026-07-12T14:24:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

检查和维护 `memory-wiki` 知识库。由内置的 `memory-wiki` 插件提供。

相关内容：[Memory Wiki 插件](/zh-CN/plugins/memory-wiki)、[记忆概览](/zh-CN/concepts/memory)、[CLI：memory](/zh-CN/cli/memory)

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
openclaw wiki search "应该向谁咨询 Teams？" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha 摘要" \
  --body "简短的综合内容" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "仍然有效吗？"

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

## 智能体选择

当 `plugins.entries.memory-wiki.config.vault.scope` 为 `agent` 时，使用顶层 `--agent <id>` 选项选择知识库：

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "退款政策"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

在配置了多个智能体的设置中，CLI 操作必须使用 `--agent`，以防命令读取或写入任意默认知识库。如果仅配置了一个智能体，该智能体仍为默认值。未知的智能体 ID 会在知识库操作开始前导致失败。当 `vault.scope` 为 `global` 时，此选项不会更改所选路径。

Gateway 网关客户端遵循相同规则：在智能体作用域的多智能体设置中，对由知识库支持的 `wiki.*` 请求传递 `agentId`。缺失或未知的 ID 会导致错误。智能体轮次、wiki 工具、记忆语料库补充内容和已编译的提示摘要已携带当前有效的运行时智能体上下文。

## 命令

### `wiki status`

显示知识库模式和作用域、解析后的智能体、健康状态以及 Obsidian CLI 可用性。首先使用此命令检查目标知识库是否已初始化、桥接模式是否健康，或 Obsidian 集成是否可用。

当桥接模式处于活动状态并配置为读取记忆工件时，此命令会查询正在运行的 Gateway 网关，因此它看到的当前记忆插件上下文与智能体/运行时记忆相同。

### `wiki doctor`

运行 wiki 健康检查并报告可操作的修复方法。不健康时以非零状态退出。

当桥接模式处于活动状态并配置为读取记忆工件时，此命令会先查询正在运行的 Gateway 网关，然后再生成报告。已禁用的桥接导入以及未读取记忆工件的桥接配置仍在本地/离线运行。

典型问题：

- 已启用桥接模式，但没有公开的记忆工件
- 知识库布局无效或缺失
- 预期使用 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 知识库布局和初始页面，包括顶层索引和缓存目录。

### `wiki ingest <path>`

将本地 Markdown 或文本文件作为源页面导入 wiki 的 `sources/` 文件夹。`<path>` 必须是本地文件路径；目前不支持通过 URL 导入。二进制文件会被拒绝。

导入的源页面会包含来源追踪 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。导入后始终会重新编译知识库。

标志：`--title <title>` 覆盖来源标题（默认值：根据文件名派生）。

### `wiki okf import <path>`

将已解包的 Open Knowledge Format 包导入 wiki 概念页面。

导入器会读取 OKF 目录树中每个非保留的 `.md` 概念文档，要求 `type` 字段非空，并将未知的 OKF `type` 值视为通用概念。保留的 OKF `index.md` 和 `log.md` 文件不会作为概念导入。

导入的页面会扁平化到 `concepts/` 下，使现有的 wiki 编译、搜索、获取、摘要和仪表板流程能立即看到它们。原始 OKF 概念 ID、`type`、`resource`、`tags`、时间戳、源路径和完整 frontmatter 都会保留在页面 frontmatter 中。内部 OKF Markdown 链接会重写为生成的 wiki 页面；失效链接或外部链接保持不变。导入后始终会重新编译知识库。

示例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery 表" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重新构建索引、相关内容块、仪表板和已编译摘要。在以下位置写入稳定的机器可读工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译还会刷新报告页面。

### `wiki lint`

检查知识库并写入涵盖以下内容的报告：

- 结构问题（失效链接、ID 缺失或重复、页面类型或标题缺失、frontmatter 无效）
- 来源追踪缺口（来源 ID 缺失、导入来源信息缺失）
- 矛盾（已标记的矛盾、相互冲突的声明）
- 待解决问题
- 低置信度页面和声明
- 过时页面和声明

在完成有实质意义的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

使用 `wiki search` 获取针对 wiki 优化的排序和来源信息。如果只需执行一次广泛的共享内容检索，并且主动记忆插件提供共享搜索，则优先使用 `openclaw memory search`。

搜索模式：

- `find-person`：别名、账号名、社交账号、规范 ID 和人物页面
- `route-question`：适合咨询对象、最佳用途提示和关系上下文
- `source-evidence`：来源页面和结构化证据字段
- `raw-claim`：带有声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "谁了解 Teams 推出情况？" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "Teams 的强关联路径" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出会包含 `Claim:` 和 `Evidence:` 行。JSON 输出还会提供 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供智能体进一步查看。

### `wiki get <lookup>`

按 ID 或相对路径读取 wiki 页面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

应用精确变更，无需对页面进行自由形式编辑：

- `apply synthesis <title>`：创建或刷新综合页面，并生成受管理的摘要正文
- `apply metadata <lookup>`：更新现有页面的元数据

两者都接受 `--source-id`、`--contradiction`、`--question`（均可重复使用）、`--confidence <n>`（0-1）和 `--status <status>`。`apply metadata` 还接受 `--clear-confidence`，用于删除已存储的置信度值。这是更新 wiki 页面的受支持方式，可确保受管理的生成内容块保持完整。

### `wiki bridge import`

将主动记忆插件中的公开记忆工件导入由桥接支持的来源页面。在 `bridge` 模式下使用此命令，将最新导出的记忆工件拉取到 wiki 仓库中。

读取当前桥接工件时，CLI 会通过 Gateway RPC 路由导入，以便使用运行时记忆插件上下文。如果桥接导入已禁用或工件读取已关闭，该命令会保持本地/离线的零导入行为。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径（`unsafeLocal.paths`）导入。此功能有意设为实验性，并且仅限同一台机器使用。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

将 ChatGPT 导出内容导入为 wiki 来源页面草稿。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 标志              | 默认值     | 说明                                                         |
| ----------------- | ---------- | ------------------------------------------------------------ |
| `--export <path>` | （必填）   | ChatGPT 导出目录或 `conversations.json` 路径。                |
| `--dry-run`       | `false`    | 在不写入页面的情况下，预览已创建、已更新和已跳过的数量。     |

如果非试运行导入更改了任何页面，系统会记录导入运行 ID，并在摘要中输出该 ID；回滚时需要使用它。

### `wiki chatgpt rollback <run-id>`

回滚此前应用的 ChatGPT 导入运行，删除该运行创建的页面，并恢复被覆盖的页面。如果该运行已经回滚，则不执行任何操作（并报告 `alreadyRolledBack`）。

### `wiki obsidian ...`

用于在 Obsidian 友好模式下运行的仓库的 Obsidian 辅助命令：`status`、`search`、`open`、`command`、`daily`。启用 `obsidian.useOfficialCli` 时，这些命令要求 `PATH` 中存在官方 `obsidian` CLI。

当 `vault.scope` 为 `agent` 时，配置验证会拒绝
`obsidian.useOfficialCli: true`，因为 `obsidian.vaultName` 是一项全局设置，
而不是按智能体映射。Obsidian 友好的 Markdown 渲染仍然
可用。

## 实际使用指南

- 当来源信息和页面身份很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑受管理的生成部分。
- 在信任存在矛盾或低置信度的内容之前，使用 `wiki lint`。
- 批量导入或更改来源后，如果需要立即获得最新仪表板和已编译摘要，请使用 `wiki compile`。
- 当数据目录、文档导出或智能体增强流水线已经生成 OKF Markdown 包时，使用 `wiki okf import`。
- 当桥接模式依赖新导出的记忆工件时，使用 `wiki bridge import`。

## 配置关联

以下配置会影响 `openclaw wiki` 的行为：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型请参阅 [Memory Wiki 插件](/zh-CN/plugins/memory-wiki)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Memory wiki](/zh-CN/plugins/memory-wiki)
