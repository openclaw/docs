---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在记录或更改 `openclaw wiki`
summary: '`openclaw wiki` 的 CLI 参考（Memory Wiki 保险库状态、搜索、编译、检查、应用、桥接、ChatGPT 导入和 Obsidian 辅助工具）'
title: Wiki
x-i18n:
    generated_at: "2026-07-11T20:26:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

检查和维护 `memory-wiki` 知识库。此功能由内置的 `memory-wiki` 插件提供。

相关内容：[Memory Wiki 插件](/zh-CN/plugins/memory-wiki)、[记忆概览](/zh-CN/concepts/memory)、[CLI：记忆](/zh-CN/cli/memory)

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

## Agent 选择

当 `plugins.entries.memory-wiki.config.vault.scope` 为 `agent` 时，使用顶层 `--agent <id>` 选项选择知识库：

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

在配置了多个 Agent 的设置中，CLI 操作必须指定 `--agent`，这样命令就无法读取或写入任意默认知识库。如果仅配置了一个 Agent，该 Agent 仍为默认值。未知的 Agent ID 会在知识库操作开始前导致失败。当 `vault.scope` 为 `global` 时，此选项不会更改所选路径。

Gateway 网关客户端遵循同一规则：在 Agent 作用域的多 Agent 设置中，对基于知识库的 `wiki.*` 请求传入 `agentId`。缺失或未知的 ID 均会导致错误。Agent 轮次、wiki 工具、记忆语料库补充内容和已编译的提示词摘要已携带当前活动运行时的 Agent 上下文。

## 命令

### `wiki status`

显示知识库模式和作用域、解析出的 Agent、健康状态以及 Obsidian CLI 可用性。请先使用此命令检查目标知识库是否已初始化、桥接模式是否健康，或者 Obsidian 集成是否可用。

当桥接模式处于活动状态且配置为读取记忆产物时，此命令会查询正在运行的 Gateway 网关，以便查看与 Agent/运行时记忆相同的活动记忆插件上下文。

### `wiki doctor`

运行 wiki 健康检查并报告可执行的修复建议。状态不健康时以非零状态码退出。

当桥接模式处于活动状态且配置为读取记忆产物时，此命令会在生成报告前查询正在运行的 Gateway 网关。已禁用的桥接导入，以及未读取记忆产物的桥接配置，仍在本地/离线运行。

典型问题：

- 启用了桥接模式，但没有公开的记忆产物
- 知识库布局无效或缺失
- 预期使用 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 知识库布局和初始页面，包括顶层索引和缓存目录。

### `wiki ingest <path>`

将本地 Markdown 或文本文件作为来源页面导入 wiki 的 `sources/` 文件夹。`<path>` 必须是本地文件路径；目前不支持通过 URL 导入。二进制文件会被拒绝。

导入的来源页面包含溯源 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。导入后始终会重新编译知识库。

标志：`--title <title>` 可覆盖来源标题（默认值：从文件名派生）。

### `wiki okf import <path>`

将已解压的 Open Knowledge Format 包导入为 wiki 概念页面。

导入器会读取 OKF 目录树中每个非保留的 `.md` 概念文档，要求其包含非空的 `type` 字段，并将未知的 OKF `type` 值视为通用概念。保留的 OKF `index.md` 和 `log.md` 文件不会作为概念导入。

导入的页面会平铺到 `concepts/` 下，使现有的 wiki 编译、搜索、获取、摘要和仪表板流程能够立即访问这些页面。原始 OKF 概念 ID、`type`、`resource`、`tags`、时间戳、来源路径和完整 frontmatter 都会保留在页面的 frontmatter 中。内部 OKF Markdown 链接会重写为生成的 wiki 页面；损坏或外部链接保持不变。导入后始终会重新编译知识库。

示例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重新构建索引、相关内容块、仪表板和已编译摘要。将稳定的机器可读产物写入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译还会刷新报告页面。

### `wiki lint`

检查知识库并写入涵盖以下内容的报告：

- 结构问题（损坏的链接、缺失/重复的 ID、缺少页面类型或标题、无效的 frontmatter）
- 溯源缺口（缺少来源 ID、缺少导入溯源信息）
- 矛盾（已标记的矛盾、相互冲突的声明）
- 未解决的问题
- 低置信度页面和声明
- 陈旧的页面和声明

完成重要的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

当 wiki 专用排序和溯源信息很重要时，请使用 `wiki search`。如果要进行一次广泛的共享召回，并且活动记忆插件提供共享搜索，请优先使用 `openclaw memory search`。

搜索模式：

- `find-person`：别名、用户名、社交账号、规范 ID 和人物页面
- `route-question`：可咨询事项、最适用场景提示及关系上下文
- `source-evidence`：来源页面和结构化证据字段
- `raw-claim`：包含声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出会包含 `Claim:` 和 `Evidence:` 行。JSON 输出还会公开 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供 Agent 端进一步深入查看。

### `wiki get <lookup>`

按 ID 或相对路径读取 wiki 页面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

执行精确变更，无需随意修改页面：

- `apply synthesis <title>`：使用受管理的摘要正文创建或刷新综合页面
- `apply metadata <lookup>`：更新现有页面的元数据

两者均接受 `--source-id`、`--contradiction`、`--question`（均可重复指定）、`--confidence <n>`（0-1）和 `--status <status>`。`apply metadata` 还接受 `--clear-confidence`，用于移除已存储的置信度值。这是更新 wiki 页面的受支持方式，可确保受管理的生成内容块保持完整。

### `wiki bridge import`

将活动记忆插件中的公开记忆产物导入由桥接支持的来源页面。在 `bridge` 模式下使用此命令，将最新导出的记忆产物拉取到 wiki 知识库中。

对于活动的桥接产物读取，CLI 会通过 Gateway RPC 路由导入，以使用运行时记忆插件上下文。如果桥接导入已禁用或产物读取已关闭，该命令会保持本地/离线的零导入行为。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从明确配置的本地路径（`unsafeLocal.paths`）导入。此功能刻意保持实验性质，仅限同一机器使用。导入后的索引刷新由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

将 ChatGPT 导出内容导入为 wiki 来源页面草稿。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 标志              | 默认值     | 说明                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必填）   | ChatGPT 导出目录或 `conversations.json` 路径。                 |
| `--dry-run`       | `false`    | 预览创建、更新和跳过的数量，而不写入页面。                    |

非试运行导入如果更改了任何页面，都会记录一个导入运行 ID；该 ID 会在摘要中打印，并用于回滚。

### `wiki chatgpt rollback <run-id>`

回滚之前应用的 ChatGPT 导入运行，删除它创建的页面，并恢复被它覆盖的页面。如果该运行已回滚，则不执行任何操作（并报告 `alreadyRolledBack`）。

### `wiki obsidian ...`

适用于以 Obsidian 友好模式运行的知识库的 Obsidian 辅助命令：`status`、`search`、`open`、`command`、`daily`。启用 `obsidian.useOfficialCli` 时，这些命令要求 `PATH` 中存在官方 `obsidian` CLI。

当 `vault.scope` 为 `agent` 时，配置验证会拒绝 `obsidian.useOfficialCli: true`，因为 `obsidian.vaultName` 是一项全局设置，而不是按 Agent 映射的设置。Obsidian 友好的 Markdown 渲染仍然可用。

## 实用使用指南

- 当溯源信息和页面身份很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑受管理的生成部分。
- 在信任相互矛盾或低置信度的内容前，使用 `wiki lint`。
- 批量导入或更改来源后，如果希望立即获得最新的仪表板和已编译摘要，请使用 `wiki compile`。
- 当数据目录、文档导出或 Agent 增强管道已生成 OKF Markdown 包时，使用 `wiki okf import`。
- 当桥接模式依赖新导出的记忆产物时，使用 `wiki bridge import`。

## 相关配置

`openclaw wiki` 的行为受以下配置影响：

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
