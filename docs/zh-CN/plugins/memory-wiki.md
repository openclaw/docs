---
read_when:
    - 你想要超出普通 MEMORY.md 笔记的持久知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 wiki_search、wiki_get 或桥接模式
summary: memory-wiki：带有来源溯源、断言、仪表盘和桥接模式的编译知识库
title: 记忆 wiki
x-i18n:
    generated_at: "2026-04-28T11:58:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76e783930fbe1bbeeac309dda5a3075cab0e062338cf084a2a493e0afe7e0d87
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，可将持久化记忆转化为编译后的知识库。

它**不会**替代当前启用的记忆插件。当前启用的记忆插件仍然负责召回、提升、索引和 dreaming。`memory-wiki` 位于它旁边，将持久化知识编译为一个可导航的 wiki，包含确定性的页面、结构化声明、来源、仪表盘和机器可读摘要。

当你希望记忆更像一个受维护的知识层，而不是一堆 Markdown 文件时，可以使用它。

## 它添加了什么

- 带有确定性页面布局的专用 wiki 知识库
- 结构化声明和证据元数据，而不只是正文
- 页面级来源、置信度、矛盾和开放问题
- 面向智能体/运行时代码使用者的编译摘要
- wiki 原生的搜索/获取/应用/lint 工具
- 可选桥接模式，可从当前启用的记忆插件导入公开制品
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 它如何与记忆配合

可以这样理解这种分层：

| 层                                                      | 负责                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 当前启用的记忆插件（`memory-core`、QMD、Honcho 等） | 召回、语义搜索、提升、dreaming、记忆运行时                               |
| `memory-wiki`                                           | 编译后的 wiki 页面、富含来源的综合内容、仪表盘、wiki 专用搜索/获取/应用 |

如果当前启用的记忆插件暴露共享召回制品，OpenClaw 可以用 `memory_search corpus=all` 在一次搜索中同时搜索两个层。

当你需要 wiki 专用排序、来源信息或直接页面访问时，请改用 wiki 原生工具。

## 推荐的混合模式

对本地优先设置来说，一个可靠的默认选择是：

- 使用 QMD 作为当前启用的记忆后端，用于召回和广泛语义搜索
- 以 `bridge` 模式使用 `memory-wiki`，用于持久化的综合知识页面

这种分层效果很好，因为每一层都保持专注：

- QMD 让原始笔记、会话导出和额外集合保持可搜索
- `memory-wiki` 编译稳定实体、声明、仪表盘和源页面

实用规则：

- 当你想对记忆进行一次广泛召回时，使用 `memory_search`
- 当你想要感知来源的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你想让共享搜索覆盖两个层时，使用 `memory_search corpus=all`

如果桥接模式报告导出的制品数量为零，说明当前启用的记忆插件目前尚未暴露公开桥接输入。先运行 `openclaw wiki doctor`，然后确认当前启用的记忆插件支持公开制品。

当桥接模式处于活动状态并且启用了 `bridge.readMemoryArtifacts` 时，`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关读取。这样可以让 CLI 桥接检查与运行时记忆插件上下文保持一致。如果桥接被禁用或制品读取被关闭，这些命令会保持其本地/离线行为。

## 知识库模式

`memory-wiki` 支持三种知识库模式：

### `isolated`

自己的知识库、自己的来源，不依赖 `memory-core`。

当你希望 wiki 成为独立的精选知识存储时，使用此模式。

### `bridge`

通过公开的插件 SDK 接缝，从当前启用的记忆插件读取公开记忆制品和记忆事件。

当你希望 wiki 编译并组织记忆插件导出的制品，同时不深入私有插件内部机制时，使用此模式。

桥接模式可以索引：

- 导出的记忆制品
- dream 报告
- 每日笔记
- 记忆根文件
- 记忆事件日志

### `unsafe-local`

面向本机私有路径的显式同机逃生口。

此模式有意保持实验性且不可移植。只有在你理解信任边界，并且明确需要桥接模式无法提供的本地文件系统访问时，才应使用它。

## 知识库布局

插件会像这样初始化知识库：

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

受管理内容会保留在生成块内。人工笔记块会被保留。

主要页面分组包括：

- `sources/`：用于导入的原始材料和桥接支持的页面
- `entities/`：用于持久化事物、人物、系统、项目和对象
- `concepts/`：用于想法、抽象、模式和策略
- `syntheses/`：用于编译后的摘要和维护中的汇总
- `reports/`：用于生成的仪表盘

## 结构化声明和证据

页面可以携带结构化的 `claims` frontmatter，而不只是自由文本。

每条声明可以包含：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

证据条目可以包含：

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

这让 wiki 更像一个信念层，而不是被动的笔记堆。声明可以被跟踪、评分、质疑，并回溯到来源进行解决。

## 编译管线

编译步骤会读取 wiki 页面、规范化摘要，并在以下位置生成稳定的机器面向制品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要存在的目的，是让智能体和运行时代码不必抓取 Markdown 页面。

编译输出还会驱动：

- 搜索/获取流程的第一轮 wiki 索引
- 将声明 ID 回查到所属页面
- 紧凑的提示补充内容
- 报告/仪表盘生成

## 仪表盘和健康报告

当启用 `render.createDashboards` 时，编译会维护 `reports/` 下的仪表盘。

内置报告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

这些报告会跟踪以下内容：

- 矛盾笔记簇
- 竞争声明簇
- 缺少结构化证据的声明
- 低置信度页面和声明
- 过期或未知的新鲜度
- 存在未解决问题的页面

## 搜索和检索

`memory-wiki` 支持两种搜索后端：

- `shared`：可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

它还支持三种语料库：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会在可能时使用编译摘要作为第一轮结果
- 声明 ID 可以解析回所属页面
- 有争议/过期/新鲜的声明会影响排序
- 来源标签可以保留到结果中

实用规则：

- 使用 `memory_search corpus=all` 执行一次广泛召回
- 当你关心 wiki 专用排序、来源信息或页面级信念结构时，使用 `wiki_search` + `wiki_get`

## 智能体工具

插件会注册这些工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前知识库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，并在配置后搜索共享记忆语料库
- `wiki_get`：按 ID/路径读取 wiki 页面，或回退到共享记忆语料库
- `wiki_apply`：执行窄范围的综合/元数据变更，而不是自由形式的页面手术
- `wiki_lint`：结构检查、来源缺口、矛盾、开放问题

插件还会注册一个非独占的记忆语料库补充，因此当当前启用的记忆插件支持语料库选择时，共享的 `memory_search` 和 `memory_get` 可以访问 wiki。

## 提示和上下文行为

当启用 `context.includeCompiledDigestPrompt` 时，记忆提示部分会从 `agent-digest.json` 追加一个紧凑的编译快照。

该快照有意保持小巧且高信号：

- 仅顶部页面
- 仅顶部声明
- 矛盾数量
- 问题数量
- 置信度/新鲜度限定信息

这是选择启用项，因为它会改变提示形状，并且主要适用于明确消费记忆补充内容的上下文引擎或旧版提示组装。

## 配置

将配置放在 `plugins.entries.memory-wiki.config` 下：

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

关键开关：

- `vaultMode`：`isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`：`native` 或 `obsidian`
- `bridge.readMemoryArtifacts`：导入当前启用的记忆插件的公开制品
- `bridge.followMemoryEvents`：在桥接模式中包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：将紧凑摘要快照追加到记忆提示部分
- `render.createBacklinks`：生成确定性的相关块
- `render.createDashboards`：生成仪表盘页面

### 示例：QMD + 桥接模式

当你希望使用 QMD 进行召回，并用 `memory-wiki` 提供受维护的知识层时，使用此配置：

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

这会保持：

- QMD 负责当前启用的记忆召回
- `memory-wiki` 专注于编译页面和仪表盘
- 在你有意启用编译摘要提示之前，提示形状保持不变

## CLI

`memory-wiki` 还暴露一个顶层 CLI 表面：

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

完整命令参考请参阅 [CLI：wiki](/zh-CN/cli/wiki)。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，插件会写入 Obsidian 友好的 Markdown，并且可以选择使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- 知识库搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到每日笔记

这是可选的。即使没有 Obsidian，wiki 仍然可以在原生模式下工作。

## 推荐工作流

1. 保留当前启用的记忆插件，用于召回/提升/dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确想要桥接模式，否则从 `isolated` 模式开始。
4. 当来源信息很重要时，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 进行窄范围综合或元数据更新。
6. 在有意义的变更后运行 `wiki_lint`。
7. 如果你想查看过期/矛盾情况，请开启仪表盘。

## 相关文档

- [记忆概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)
- [CLI：wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
