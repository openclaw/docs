---
read_when:
    - 你想要超出普通 MEMORY.md 笔记的持久知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 wiki_search、wiki_get 或 bridge 模式
summary: 'memory-wiki: 带有来源、声明、仪表板和桥接模式的编译知识库'
title: 记忆 wiki
x-i18n:
    generated_at: "2026-06-27T02:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，可将持久记忆转换为编译后的知识库。

它**不会**取代主动记忆插件。主动记忆插件仍然负责召回、提升、索引和 Dreaming。`memory-wiki` 位于其旁边，将持久知识编译为可导航的 wiki，包含确定性页面、结构化声明、来源、仪表板和机器可读摘要。

当你希望记忆更像一个持续维护的知识层，而不是一堆 Markdown 文件时，可以使用它。

## 它添加了什么

- 一个专用 wiki 知识库，具有确定性的页面布局
- 结构化声明和证据元数据，而不只是散文式文本
- 页面级来源、置信度、矛盾和未决问题
- 面向智能体/运行时消费者的编译摘要
- wiki 原生搜索/get/apply/lint 工具
- 将 Open Knowledge Format 导入为编译后的 wiki 概念
- 可选桥接模式，用于从主动记忆插件导入公开工件
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 它如何适配记忆

可以这样理解分层：

| 层                                                      | 负责                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 主动记忆插件（`memory-core`、QMD、Honcho 等）           | 召回、语义搜索、提升、Dreaming、记忆运行时                                                  |
| `memory-wiki`                                           | 编译后的 wiki 页面、来源丰富的综合内容、仪表板、wiki 专用 search/get/apply                 |

如果主动记忆插件公开共享召回工件，OpenClaw 可以通过 `memory_search corpus=all` 一次性搜索两层。

当你需要 wiki 专用排序、来源或直接页面访问时，请改用 wiki 原生工具。

## 推荐的混合模式

对于本地优先设置，一个强默认方案是：

- 使用 QMD 作为主动记忆后端，用于召回和广泛语义搜索
- 以 `bridge` 模式使用 `memory-wiki`，生成持久综合知识页面

这种分层效果很好，因为每一层都保持专注：

- QMD 让原始笔记、会话导出和额外集合保持可搜索
- `memory-wiki` 编译稳定实体、声明、仪表板和来源页面

实用规则：

- 当你希望跨记忆执行一次广泛召回时，使用 `memory_search`
- 当你希望获得可感知来源的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你希望共享搜索覆盖两层时，使用 `memory_search corpus=all`

如果桥接模式报告导出的工件为零，则主动记忆插件当前尚未公开公共桥接输入。先运行 `openclaw wiki doctor`，然后确认主动记忆插件支持公开工件。

当桥接模式处于活动状态并启用 `bridge.readMemoryArtifacts` 时，`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关读取。这样可以让 CLI 桥接检查与运行时记忆插件上下文保持一致。如果桥接被禁用或工件读取被关闭，这些命令会保持其本地/离线行为。

## 知识库模式

`memory-wiki` 支持三种知识库模式：

### `isolated`

自己的知识库、自己的来源，不依赖 `memory-core`。

当你希望 wiki 成为独立策展的知识存储时，请使用此模式。

### `bridge`

通过公共插件 SDK 接缝，从主动记忆插件读取公开记忆工件和记忆事件。

当你希望 wiki 编译并组织记忆插件导出的工件，而不进入私有插件内部机制时，请使用此模式。

桥接模式可以索引：

- 导出的记忆工件
- Dreaming 报告
- 每日笔记
- 记忆根文件
- 记忆事件日志

### `unsafe-local`

面向本机私有路径的显式同机逃生口。

此模式有意保持实验性且不可移植。只有在你理解信任边界，并明确需要桥接模式无法提供的本地文件系统访问时，才使用它。

## 知识库布局

该插件会初始化如下知识库：

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

托管内容保留在生成块内。人工笔记块会被保留。

主要页面组包括：

- `sources/` 用于导入的原始材料和桥接支持的页面
- `entities/` 用于持久事物、人物、系统、项目和对象
- `concepts/` 用于想法、抽象、模式和策略
- `syntheses/` 用于编译后的摘要和维护型汇总
- `reports/` 用于生成的仪表板

## Open Knowledge Format 导入

`memory-wiki` 可以通过以下命令导入已解包的 Open Knowledge Format bundle：

```bash
openclaw wiki okf import ./bundles/ga4
```

当数据目录、文档爬虫或增强智能体已经生成 OKF 时，这是最干净的适配方式：将 OKF 保持为可移植交换工件，然后让 `memory-wiki` 将其转换为 OpenClaw 原生概念页面和编译摘要。

导入器遵循 OKF v0.1 结构：

- 非保留的 `.md` 文件是概念文档
- 每个导入的概念都需要非空的 `type` frontmatter 字段
- 未知 OKF `type` 值会被接受
- 保留的 `index.md` 和 `log.md` 文件不会作为概念导入
- 损坏的或外部 Markdown 链接会被保留

导入的概念页面会被扁平化到 `concepts/` 下，因此现有的编译、搜索、获取、仪表板和提示摘要路径无需添加第二棵 wiki 树即可看到它们。每个页面都会保留原始 OKF 概念 ID、来源路径、`type`、`resource`、`tags`、时间戳和完整的生产者 frontmatter。内部 OKF 链接会被重写到生成的 wiki 概念页面，并且也会作为带有 `kind: okf-link` 的结构化 `relationships` 条目发出。

## 结构化声明和证据

页面可以携带结构化 `claims` frontmatter，而不只是自由格式文本。

每个声明可以包含：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

证据条目可以包含：

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

这让 wiki 更像一个信念层，而不是被动的笔记堆。声明可以被跟踪、评分、质疑，并追溯回来源以解决。

## 面向智能体的实体元数据

实体页面也可以携带供智能体使用的路由元数据。这是通用 frontmatter，因此适用于人物、团队、系统、项目或任何其他实体类型。

常见字段包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨别名和导入使用的稳定身份键
- `aliases`：应解析到同一页面的名称、handle 或标签
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：紧凑路由提示
- `lastRefreshedAt`：与页面编辑时间分开的来源刷新时间戳
- `personCard`：可选的人物专用路由卡，包含 handle、社交资料、电子邮件、时区、赛道、询问事项、避免询问事项、置信度和隐私
- `relationships`：指向相关页面的类型化边，包含目标、类型、权重、置信度、证据类型、隐私层级和备注

对于人物 wiki，智能体通常应从 `reports/person-agent-directory.md` 开始，然后在使用联系方式或推断事实之前，通过 `wiki_get` 打开人物页面。

示例：

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## 编译流水线

编译步骤会读取 wiki 页面，规范化摘要，并在以下位置发出稳定的机器面向工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要存在的目的，是让智能体和运行时代码无需抓取 Markdown 页面。

编译输出还支持：

- 用于 search/get 流程的第一阶段 wiki 索引
- 将 claim-id 查找回所属页面
- 紧凑提示补充
- 报告/仪表板生成

## 仪表板和健康报告

启用 `render.createDashboards` 时，编译会维护 `reports/` 下的仪表板。

内置报告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

这些报告跟踪如下内容：

- 矛盾笔记簇
- 竞争性声明簇
- 缺少结构化证据的声明
- 低置信度页面和声明
- 陈旧或未知的新鲜度
- 存在未解决问题的页面
- 人物/实体路由卡
- 结构化关系边
- 证据类别覆盖率
- 使用前需要审查的非公开隐私层级

## 搜索和检索

`memory-wiki` 支持两个搜索后端：

- `shared`：可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

它还支持三个语料范围：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会尽可能使用编译摘要作为第一阶段
- 声明 ID 可以解析回所属页面
- 被质疑/陈旧/新鲜的声明会影响排序
- 来源标签可以保留到结果中
- 搜索模式可以偏向人物查找、问题路由、来源证据或原始声明

实用规则：

- 使用 `memory_search corpus=all` 执行一次广泛召回
- 当你关心 wiki 专用排序、来源或页面级信念结构时，使用 `wiki_search` + `wiki_get`

搜索模式：

- `auto`：均衡默认值
- `find-person`：提升类似人物的实体、别名、handle、社交资料和规范 ID
- `route-question`：提升智能体卡片、ask-for 提示、best-used-for 提示和关系上下文
- `source-evidence`：提升来源页面和结构化证据元数据
- `raw-claim`：提升匹配的结构化声明，并在结果中返回声明/证据元数据

当结果匹配结构化声明时，`wiki_search` 可以在其 details 载荷中返回 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`。可用时，文本输出还会包含紧凑的 `Claim:` 和 `Evidence:` 行。

## 智能体工具

该插件注册以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前知识库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，以及在配置后搜索共享记忆语料；接受 `mode`，用于人物查找、问题路由、来源证据或原始声明下钻
- `wiki_get`：按 ID/路径读取 wiki 页面，或回退到共享记忆语料
- `wiki_apply`：执行窄范围综合/元数据变更，而不是自由格式页面手术
- `wiki_lint`：结构检查、来源缺口、矛盾、未决问题

该插件还会注册一个非独占的记忆语料库补充，因此当主动记忆插件支持语料库选择时，共享的
`memory_search` 和 `memory_get` 可以访问 wiki。

## 提示词和上下文行为

启用 `context.includeCompiledDigestPrompt` 后，记忆提示词章节会追加来自 `agent-digest.json` 的紧凑编译快照。

该快照有意保持小巧且高信号：

- 仅包含顶部页面
- 仅包含顶部主张
- 矛盾数量
- 问题数量
- 置信度/新鲜度限定信息

这是可选项，因为它会改变提示词形态，并且主要适用于明确消费记忆补充的上下文引擎或旧版提示词组装。

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
- `bridge.readMemoryArtifacts`：导入主动记忆插件的公共构件
- `bridge.followMemoryEvents`：在桥接模式中包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：向记忆提示词章节追加紧凑摘要快照
- `render.createBacklinks`：生成确定性的相关区块
- `render.createDashboards`：生成仪表板页面

### 示例：QMD + 桥接模式

当你想用 QMD 负责召回，并用 `memory-wiki` 维护知识层时，使用此配置：

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

这会保持：

- QMD 负责主动记忆召回
- `memory-wiki` 专注于编译页面和仪表板
- 在你有意启用编译摘要提示词之前，提示词形态保持不变

## CLI

`memory-wiki` 还公开了一个顶层 CLI 表面：

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

当 `vault.renderMode` 为 `obsidian` 时，该插件会写入对 Obsidian 友好的 Markdown，并且可以选择使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- 保险库搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到每日笔记

这是可选的。即使没有 Obsidian，wiki 仍可在原生模式下工作。

## 推荐工作流

1. 保留你的主动记忆插件，用于召回/提升/Dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确想使用桥接模式，否则先从 `isolated` 模式开始。
4. 当出处很重要时，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 进行范围较窄的综合或元数据更新。
6. 在有意义的更改之后运行 `wiki_lint`。
7. 如果你想查看过期内容/矛盾，请开启仪表板。

## 相关文档

- [记忆概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)
- [CLI：wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
