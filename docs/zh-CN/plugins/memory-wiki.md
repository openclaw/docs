---
read_when:
    - 你希望获得超越普通 MEMORY.md 笔记的持久化知识
    - 你正在配置内置的 Memory Wiki 插件
    - 你需要为同一个 Gateway 网关中的各个智能体使用独立的 wiki 知识库
    - 你想了解 wiki_search、wiki_get 或桥接模式
summary: memory-wiki：包含来源追溯、声明、仪表板和桥接模式的编译知识库
title: 记忆 wiki
x-i18n:
    generated_at: "2026-07-11T20:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，可将持久知识编译成可导航的
wiki：确定性页面、带证据的结构化主张、来源追踪、仪表板以及机器可读摘要。

它不会取代主动记忆插件。回忆、提升、索引和
Dreaming 仍由配置的记忆后端负责
（`memory-core`、QMD、Honcho 等）。`memory-wiki` 与其并行运行，将
知识编译为持续维护的 wiki 层。

| 层                   | 负责                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| 主动记忆插件         | 回忆、语义搜索、提升、Dreaming、记忆运行时                                        |
| `memory-wiki`        | 编译后的 wiki 页面、富来源追踪的综合内容、仪表板、wiki 搜索/获取/应用             |

实用规则：

- 使用 `memory_search` 对配置的所有语料库执行一次广泛的回忆检索
- 需要 wiki 特有的排序、来源追踪或页面级信念结构时，使用 `wiki_search` / `wiki_get`
- 当主动记忆插件支持选择语料库时，使用 `memory_search corpus=all` 在一次调用中覆盖两层

一种常见的本地优先设置：使用 QMD 作为负责回忆的主动记忆后端，并让
`memory-wiki` 以 `bridge` 模式生成持久的综合页面。请参阅
[配置](#configuration)下的 QMD + bridge 模式示例。

如果 bridge 模式报告导出的构件数量为零，则主动记忆插件
当前未公开 bridge 输入。请先运行 `openclaw wiki doctor`，
然后确认主动记忆插件支持公开构件。

## 仓库模式

- `isolated`（默认）：使用自己的仓库和来源，不依赖主动记忆插件。适用于自包含的精选知识存储。
- `bridge`：通过公开的插件 SDK 接口，读取主动记忆插件提供的公开记忆构件和事件日志。适用于编译记忆插件导出的构件，而无需访问插件私有内部机制。
- `unsafe-local`：显式的同机逃生通道，用于访问本地私有路径。此模式有意保持实验性且不可移植；仅当你了解信任边界，并明确需要 bridge 模式无法提供的本地文件系统访问时使用。

仓库模式和仓库作用域是两个独立选项：

- `vaultMode` 选择 wiki 输入的来源。
- `vault.scope` 选择所有智能体共用一个仓库，还是每个智能体使用一个子仓库。

`vault.scope: "global"` 是默认值，并保留现有的单仓库
行为。当智能体不得共享 wiki 页面、编译摘要、搜索结果或写入内容时，
请将 `vault.scope: "agent"` 与 `isolated` 或 `bridge` 模式配合使用。
Agent 作用域不能与 `unsafe-local` 模式结合使用，因为配置的这些
私有路径并非 Agent 所有的输入。配置验证会拒绝
这种组合。

bridge 模式可根据各 `bridge.*` 配置开关索引：

- 导出的记忆构件（`indexMemoryRoot`）
- 每日笔记（`indexDailyNotes`）
- Dreaming 报告（`indexDreamReports`）
- 记忆事件日志（`followMemoryEvents`）

启用 bridge 模式且 `bridge.readMemoryArtifacts` 已开启时，
`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关进行路由，因此它们看到的主动记忆
插件上下文与 Agent/运行时记忆一致。如果 bridge 已禁用或构件
读取已关闭，这些命令会继续使用本地/离线行为。

## 仓库布局

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

托管内容保留在生成的区块内；人工笔记区块在
重新生成时会得到保留。

- `sources/`：导入的原始材料以及由 bridge/unsafe-local 支持的页面
- `entities/`：持久的事物、人物、系统、项目和对象
- `concepts/`：理念、抽象概念、模式和策略（也是 OKF 导入内容的存放位置）
- `syntheses/`：编译后的摘要和持续维护的汇总
- `reports/`：生成的仪表板

## Open Knowledge Format 导入

```bash
openclaw wiki okf import ./bundles/ga4
```

将解包后的 Open Knowledge Format 包导入 wiki 概念页面。当数据目录、
文档爬虫或内容增强智能体已生成 OKF 时，此方式非常适合：将 OKF 保留为
可移植的交换构件，由 `memory-wiki` 将其转换为 OpenClaw 原生概念页面和
编译摘要。

- 非保留的 `.md` 文件会被视为概念文档
- 每个导入的概念都必须包含非空的 `type` frontmatter 字段；缺少 `type` 会产生 `missing-type` 警告，并跳过该文件
- 未知的 `type` 值会被接受为通用概念
- `index.md` 和 `log.md` 为保留文件，绝不会作为概念导入
- 无效或外部 Markdown 链接会保持不变

导入的页面会扁平化存放在 `concepts/` 下，因此现有的编译、搜索、获取和
仪表板流程无需第二棵 wiki 树即可访问它们。每个页面都会保留
原始 OKF 概念 ID、源路径、`type`、`resource`、`tags`、时间戳
以及完整的生产方 frontmatter。内部 OKF 链接会重写为生成的
wiki 概念页面，同时还会生成带有
`kind: okf-link` 的结构化 `relationships` 条目。

## 结构化主张和证据

页面包含结构化的 `claims` frontmatter，而不仅是自由格式文本。每项
主张都可以包含 `id`、`text`、`status`、`confidence`、`evidence[]` 和
`updatedAt`。每条证据可以包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 和 `updatedAt`。

这使 wiki 成为信念层，而不是被动的笔记堆积。
主张可以被跟踪、评分、质疑，并追溯到来源以解决争议。

## 面向 Agent 的实体元数据

实体页面包含可供人物、团队、系统、项目或其他任何实体类型使用的通用路由元数据：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨别名和导入保持稳定的身份键
- `aliases`：解析到同一页面的名称、用户名或标签
- `privacyTier`：自由格式字符串；`public` 被视为无需审核，其他任何值（例如 `local-private`、`sensitive`、`confirm-before-use`）都会在 `reports/privacy-review.md` 中标记
- `bestUsedFor` / `notEnoughFor`：精简的路由提示
- `lastRefreshedAt`：来源刷新时间戳，与页面编辑时间分开
- `personCard`：可选的人员专用路由卡片（用户名、社交账号、电子邮件、时区、分工、适合咨询事项、不适合咨询事项、置信度、隐私等级）
- `relationships`：指向相关页面的类型化边（目标、类型、权重、置信度、证据类型、隐私等级、备注）

对于人物 wiki，请先从 `reports/person-agent-directory.md` 开始，然后在
使用联系方式或推断事实之前，通过 `wiki_get` 打开人员页面。

<Accordion title="实体页面示例">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - 示例生态系统路由
notEnoughFor:
  - 法律审批
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: 示例生态系统
  askFor:
    - 示例发布问题
  avoidAskingFor:
    - 无关的计费决策
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: 其他人员
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex 适合处理示例生态系统路由。
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 编译流水线

编译过程读取 wiki 页面、规范化摘要，并在以下位置生成稳定的
机器可用构件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agent 和运行时代码会读取这些摘要，而不是抓取 Markdown。
编译后的输出还支持搜索/获取的第一阶段 wiki 索引、通过主张 ID
查找所属页面、精简的提示词补充内容以及报告
生成。

## 仪表板和健康报告

启用 `render.createDashboards` 后，编译过程会维护 `reports/` 下的
仪表板：

| 报告                                | 跟踪内容                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 包含未解决问题的页面                               |
| `reports/contradictions.md`         | 矛盾备注集群                                       |
| `reports/low-confidence.md`         | 低置信度页面和主张                                 |
| `reports/claim-health.md`           | 缺少结构化证据的主张                               |
| `reports/stale-pages.md`            | 已过时或新鲜度未知的页面                           |
| `reports/person-agent-directory.md` | 人员/实体路由卡片                                  |
| `reports/relationship-graph.md`     | 结构化关系边                                       |
| `reports/provenance-coverage.md`    | 证据类别覆盖情况                                   |
| `reports/privacy-review.md`         | 使用前需要审核的非公开隐私等级                     |

## 搜索和检索

两种搜索后端：

- `shared`：可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

三种语料库：`wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` 会尽可能使用编译摘要进行第一阶段检索
- 主张 ID 可以解析回所属页面
- 有争议、过时和新鲜的主张会影响排序
- 来源追踪标签会保留在结果中

搜索模式（`--mode` / 工具 `mode` 参数）：

| 模式              | 优先提升                                                       |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 均衡的默认模式                                                 |
| `find-person`     | 人员类实体、别名、用户名、社交账号、规范 ID                    |
| `route-question`  | Agent 卡片、适合咨询/最佳用途提示、关系上下文                   |
| `source-evidence` | 来源页面和结构化证据元数据                                     |
| `raw-claim`       | 匹配的结构化主张；返回主张/证据元数据                          |

当结果与结构化主张匹配时，`wiki_search` 会在其详细信息载荷中返回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。如果相关信息可用，文本输出
会包含精简的 `Claim:` 和 `Evidence:` 行。

## Agent 工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 当前知识库模式和作用域、解析后的智能体、健康状态、Obsidian CLI 可用性                                                                               |
| `wiki_search` | 搜索 wiki 页面，并在配置后搜索共享记忆语料库；接受 `mode`，用于人员查找、问题路由、来源证据或原始声明深入分析 |
| `wiki_get`    | 按 ID/路径读取 wiki 页面；启用共享搜索且查找未命中时，回退到共享记忆语料库                                     |
| `wiki_apply`  | 执行有限范围的综合整理/元数据变更，不进行自由形式的页面修改                                                                                             |
| `wiki_lint`   | 检查结构问题、溯源缺口、矛盾和未解决问题                                                                                            |

该插件还会注册一个非排他的记忆语料库补充源，因此当活动记忆
插件支持选择语料库时，共享的 `memory_search` 和 `memory_get`
也可以访问 wiki。

## 提示词与上下文行为

启用 `context.includeCompiledDigestPrompt` 后，记忆提示词部分会
附加来自 `agent-digest.json` 的紧凑编译快照：仅包含排名靠前的页面、
排名靠前的声明、矛盾数量、问题数量，以及置信度/新鲜度
限定信息。此功能为可选启用，因为它会改变提示词结构；它主要适用于
显式使用记忆补充内容的上下文引擎或提示词组装流程。

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

主要开关：

| 键                                         | 值/默认值                                      | 说明                                                                          |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`（默认）、`bridge`、`unsafe-local`   | 选择输入和集成行为                                                            |
| `vault.scope`                              | `global`（默认）、`agent`                      | 使用一个共享知识库，或为每个智能体使用一个子知识库                            |
| `vault.path`                               | 全局默认值 `~/.openclaw/wiki/main`             | 全局作用域下为知识库的确切路径；智能体作用域的父目录默认为 `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native`（默认）、`obsidian`                   |                                                                               |
| `bridge.readMemoryArtifacts`               | 默认 `true`                                    | 导入活动记忆插件的公开产物                                                    |
| `bridge.followMemoryEvents`                | 默认 `true`                                    | 在桥接模式下包含事件日志                                                      |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 默认 `false`                                   | 运行 `unsafe-local` 导入时必须启用                                            |
| `unsafeLocal.paths`                        | 默认 `[]`                                      | 在 `unsafe-local` 模式下要导入的显式本地路径                                  |
| `search.backend`                           | `shared`（默认）、`local`                      |                                                                               |
| `search.corpus`                            | `wiki`（默认）、`memory`、`all`                |                                                                               |
| `context.includeCompiledDigestPrompt`      | 默认 `false`                                   | 将所选智能体的紧凑摘要快照附加到记忆提示词部分                                |
| `render.createBacklinks`                   | 默认 `true`                                    | 生成确定性的相关内容块                                                        |
| `render.createDashboards`                  | 默认 `true`                                    | 生成仪表板页面                                                                |

### 每智能体知识库

将 `vault.scope` 设为 `agent`，可为每个已配置的智能体提供独立的 wiki。
在此作用域中，`vault.path` 是父目录，OpenClaw 会在其后附加
规范化的智能体 ID：

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

这会解析为 `~/.openclaw/wiki/support` 和
`~/.openclaw/wiki/marketing`。如果在智能体作用域中省略 `vault.path`，
父目录默认为 `~/.openclaw/wiki`。因此，默认的 `main` 智能体仍会沿用
现有的 `~/.openclaw/wiki/main` 路径。

智能体工具、编译后的提示词摘要，以及通过
`memory_search` / `memory_get` 公开的 wiki 补充内容，都会根据活动智能体上下文
解析知识库。对于配置了多个智能体的 CLI 和 Gateway 网关调用，请通过
`openclaw wiki --agent <agentId> ...` 或 Gateway 网关请求中的 `agentId`
显式指定智能体。如果仅配置了一个智能体，则未提供 ID 时仍默认使用该智能体。

在桥接模式下，只有当公开记忆产物的 `agentIds` 包含所选智能体时，
智能体作用域的导入才会接受该产物。属于其他智能体、没有所有权元数据
或所有者未知的产物会被跳过。全局作用域会保留现有的共享产物行为。

<Warning>
更改 `vault.scope` 不会复制或拆分现有知识库。在智能体作用域中，
显式配置的 `vault.path` 会成为父目录，因此在切换生产智能体之前，
请有计划地移动或导入现有页面。请先备份知识库。

每智能体知识库是同一进程内的知识边界，而不是操作系统级
安全边界。能够访问主机文件系统的插件和未经过沙箱隔离的工具
仍然可以读取其他智能体的目录。当智能体之间互不信任时，请使用
[沙箱隔离](/zh-CN/gateway/sandboxing)或[独立的 Gateway 网关配置文件](/zh-CN/gateway/multiple-gateways)。
</Warning>

### 示例：QMD + 桥接模式

当你希望使用 QMD 进行记忆检索，并使用 `memory-wiki` 维护
知识层时，请使用此配置。每一层各司其职：QMD 让原始笔记、会话
导出和额外集合保持可搜索状态，而 `memory-wiki` 则编译
稳定的实体、声明、仪表板和来源页面。

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

这样会让 QMD 继续负责活动记忆检索，让 `memory-wiki` 专注于
编译页面和仪表板，并在你有意启用编译摘要提示词之前保持
提示词结构不变。

## CLI

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

完整的命令参考请参阅 [CLI：wiki](/zh-CN/cli/wiki)，其中包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import` / `wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，插件会写入适合 Obsidian 的
Markdown，并可选择使用官方 `obsidian` CLI 来探测状态、
搜索知识库、打开页面、调用命令以及跳转到
每日笔记。这是可选功能；即使没有 Obsidian，wiki 仍可在原生模式下
正常工作。

智能体作用域的知识库仍可使用适合 Obsidian 的 Markdown，但配置
验证会拒绝同时设置 `obsidian.useOfficialCli: true` 和 `vault.scope: "agent"`。
当前的 `obsidian.vaultName` 设置是全局的，无法为每个智能体选择不同的
Obsidian 知识库。请改用 wiki 工具和 CLI 操作，
或将由 Obsidian 操作的 wiki 保持在全局作用域。

## 推荐工作流

<Steps>
<Step title="保留活动记忆插件用于检索">
检索、提升和 Dreaming 仍由已配置的记忆后端负责。
</Step>
<Step title="启用 memory-wiki">
除非你明确需要桥接模式，否则请从 `isolated` 模式开始。
</Step>
<Step title="需要溯源时使用 wiki_search / wiki_get">
如果需要 wiki 专属排名或页面级信念结构，请优先使用这些工具，而不是 `memory_search`。
</Step>
<Step title="使用 wiki_apply 进行有限范围的综合整理或元数据更新">
避免手动编辑由系统管理的生成内容块。
</Step>
<Step title="进行重要更改后运行 wiki_lint">
它可以发现矛盾、未解决问题和溯源缺口。
</Step>
<Step title="启用仪表板以显示陈旧内容和矛盾">
设置 `render.createDashboards: true`（默认）。
</Step>
</Steps>

## 相关文档

- [记忆概览](/zh-CN/concepts/memory)
- [CLI：记忆](/zh-CN/cli/memory)
- [CLI：wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
