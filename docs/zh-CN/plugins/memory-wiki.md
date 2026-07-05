---
read_when:
    - 你想要超出普通 MEMORY.md 笔记的持久知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 wiki_search、wiki_get 或桥接模式
summary: 'memory-wiki: 编译后的知识库，包含来源、断言、仪表板和桥接模式'
title: 记忆 wiki
x-i18n:
    generated_at: "2026-07-05T11:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e6233922483e0e858cb39cdeb2537e5f454e5b6df0c49ea5b89dc56da3e0bfe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，会把持久知识编译成可导航的
wiki：确定性页面、带证据的结构化声明、来源、仪表盘，以及机器可读摘要。

它不会替代主动记忆插件。召回、提升、索引和
Dreaming 仍由已配置的记忆后端负责
（`memory-core`、QMD、Honcho 等）。`memory-wiki` 位于旁侧，并将
知识编译成一个受维护的 wiki 层。

| 层级                 | 负责                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| 主动记忆插件 | 召回、语义搜索、提升、Dreaming、记忆运行时                      |
| `memory-wiki`        | 编译后的 wiki 页面、富来源综合、仪表盘、wiki 搜索/获取/应用 |

实用规则：

- 使用 `memory_search` 对已配置的任意语料库执行一次广泛召回
- 当你需要 wiki 专属排序、来源或页面级信念结构时，使用 `wiki_search` / `wiki_get`
- 当主动记忆插件支持语料库选择时，使用 `memory_search corpus=all` 在一次调用中跨越两个层级

一种常见的本地优先设置：用 QMD 作为用于召回的主动记忆后端，并将
`memory-wiki` 以 `bridge` 模式用于持久综合页面。请参阅
[配置](#configuration) 下的 QMD + 桥接模式示例。

如果桥接模式报告导出的工件为零，则主动记忆插件
当前没有暴露公共桥接输入。先运行 `openclaw wiki doctor`，
然后确认主动记忆插件支持公共工件。

## Vault 模式

- `isolated`（默认）：自己的 vault、自己的来源，不依赖主动记忆插件。用于自包含的精选知识存储。
- `bridge`：通过公共插件 SDK 接缝，从主动记忆插件读取公共记忆工件和事件日志。用于编译记忆插件导出的工件，而不触及私有插件内部机制。
- `unsafe-local`：面向本地私有路径的显式同机逃生口。刻意保持实验性且不可移植；仅在你理解信任边界，并且确实需要桥接模式无法提供的本地文件系统访问时使用。

桥接模式可以按 `bridge.*` 配置开关索引：

- 导出的记忆工件（`indexMemoryRoot`）
- 每日笔记（`indexDailyNotes`）
- dream 报告（`indexDreamReports`）
- 记忆事件日志（`followMemoryEvents`）

当桥接模式处于活动状态且启用了 `bridge.readMemoryArtifacts` 时，
`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关路由，因此它们看到的主动记忆
插件上下文与智能体/运行时记忆相同。如果桥接被禁用或工件
读取已关闭，这些命令会保持本地/离线行为。

## Vault 布局

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

受管理内容保留在生成块内；人工笔记块会在
重新生成时保留。

- `sources/`：导入的原始材料，以及由桥接/`unsafe-local` 支撑的页面
- `entities/`：持久事物、人物、系统、项目、对象
- `concepts/`：想法、抽象、模式、策略（也是 OKF 导入的落点）
- `syntheses/`：编译后的摘要和受维护的汇总
- `reports/`：生成的仪表盘

## Open Knowledge Format 导入

```bash
openclaw wiki okf import ./bundles/ga4
```

将一个已解包的 Open Knowledge Format bundle 导入到 wiki 概念页面中。当数据目录、文档爬虫或增强智能体已经
生成 OKF 时非常适合：保留 OKF 作为可移植交换工件，让 `memory-wiki`
将其转换为 OpenClaw 原生概念页面和编译摘要。

- 非保留的 `.md` 文件是概念文档
- 每个导入的概念都需要非空的 `type` frontmatter 字段；缺少 `type` 会产生 `missing-type` 警告，并跳过该文件
- 未知 `type` 值会作为通用概念接受
- `index.md` 和 `log.md` 是保留文件，永远不会作为概念导入
- 损坏的或外部 Markdown 链接会保持不变

导入的页面会平铺到 `concepts/` 下，因此现有的编译、搜索、获取和
仪表盘流程无需第二棵 wiki 树即可看到它们。每个页面都会保留
原始 OKF 概念 ID、来源路径、`type`、`resource`、`tags`、时间戳，
以及完整的生产者 frontmatter。内部 OKF 链接会重写到生成的
wiki 概念页面，并且还会发出带有 `kind: okf-link` 的结构化
`relationships` 条目。

## 结构化声明和证据

页面携带结构化的 `claims` frontmatter，而不只是自由格式文本。每个
声明可以包含 `id`、`text`、`status`、`confidence`、`evidence[]` 和
`updatedAt`。每个证据条目可以包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 和 `updatedAt`。

这让 wiki 像一个信念层，而不是被动的笔记堆。
声明可以被跟踪、评分、质疑，并解析回来源。

## 面向智能体的实体元数据

实体页面携带通用路由元数据，可用于人物、团队、
系统、项目或任何其他实体类型：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨别名和导入的稳定身份键
- `aliases`：解析到同一页面的名称、handle 或标签
- `privacyTier`：自由格式字符串；`public` 会被视为无需审核，任何其他值（例如 `local-private`、`sensitive`、`confirm-before-use`）都会在 `reports/privacy-review.md` 中标记
- `bestUsedFor` / `notEnoughFor`：紧凑路由提示
- `lastRefreshedAt`：来源刷新时间戳，独立于页面编辑时间
- `personCard`：可选的人物专属路由卡（handle、社交账号、电子邮件、时区、lane、适合询问、不适合询问、置信度、隐私层级）
- `relationships`：指向相关页面的类型化边（目标、类型、权重、置信度、证据类型、隐私层级、备注）

对于人物 wiki，先从 `reports/person-agent-directory.md` 开始，然后在使用联系方式或推断事实前，
用 `wiki_get` 打开人物页面。

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
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 编译流水线

编译会读取 wiki 页面，规范化摘要，并在以下位置输出稳定的
面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

智能体和运行时代码读取这些摘要，而不是抓取 Markdown。
编译后的输出还会驱动搜索/获取的首轮 wiki 索引、声明 ID
回查到所属页面、紧凑提示补充，以及报告生成。

## 仪表盘和健康报告

当启用 `render.createDashboards` 时，编译会维护 `reports/` 下的仪表盘：

| 报告                              | 跟踪                                             |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 存在未解决问题的页面                    |
| `reports/contradictions.md`         | 矛盾笔记集群                        |
| `reports/low-confidence.md`         | 低置信度页面和声明                    |
| `reports/claim-health.md`           | 缺少结构化证据的声明                 |
| `reports/stale-pages.md`            | 过时或新鲜度未知的页面                         |
| `reports/person-agent-directory.md` | 人物/实体路由卡                        |
| `reports/relationship-graph.md`     | 结构化关系边                      |
| `reports/provenance-coverage.md`    | 证据类别覆盖                            |
| `reports/privacy-review.md`         | 使用前需要审核的非公开隐私层级 |

## 搜索和检索

两个搜索后端：

- `shared`：在可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

三个语料库：`wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` 会在可能时使用编译摘要作为首轮
- 声明 ID 会解析回所属页面
- 被质疑/过时/新鲜的声明会影响排序
- 来源标签会保留到结果中

搜索模式（`--mode` / 工具 `mode` 参数）：

| 模式              | 提升                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 均衡默认值                                               |
| `find-person`     | 类人物实体、别名、handle、社交账号、规范 ID |
| `route-question`  | 智能体卡、适合询问/最适合用途提示、关系上下文 |
| `source-evidence` | 来源页面和结构化证据元数据                  |
| `raw-claim`       | 匹配结构化声明；返回声明/证据元数据    |

当结果匹配结构化声明时，`wiki_search` 会在其详细信息 payload 中返回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。可用时，文本输出
会包含紧凑的 `Claim:` 和 `Evidence:` 行。

## 智能体工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 当前 vault 模式、健康状态、Obsidian CLI 可用性                                                                                                         |
| `wiki_search` | 搜索 wiki 页面，并在已配置时搜索共享记忆语料库；接受 `mode`，用于人物查找、问题路由、来源证据或原始声明下钻 |
| `wiki_get`    | 按 ID/路径读取 wiki 页面；当启用共享搜索且查找未命中时，回退到共享记忆语料库                                     |
| `wiki_apply`  | 无需自由格式页面手术即可执行窄范围综合/元数据变更                                                                                             |
| `wiki_lint`   | 结构检查、来源缺口、矛盾、未解决问题                                                                                            |

该插件还会注册一个非独占的记忆语料库补充，因此当主动记忆
插件支持语料库选择时，共享的 `memory_search` 和 `memory_get` 可以访问 wiki。

## 提示和上下文行为

当 `context.includeCompiledDigestPrompt` 启用时，记忆提示词章节会
从 `agent-digest.json` 追加一个紧凑的已编译快照：仅包含置顶页面、
置顶声明、矛盾数量、问题数量、置信度/新鲜度限定词。这是可选功能，因为它会改变提示词形态；它主要影响显式消费记忆
补充内容的上下文引擎或提示词组装。

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

关键开关：

| 键                                         | 取值 / 默认值                                  | 说明                                                     |
| ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| `vaultMode`                                | `isolated`（默认）、`bridge`、`unsafe-local`   |                                                          |
| `vault.path`                               | 默认 `~/.openclaw/wiki/main`                   |                                                          |
| `vault.renderMode`                         | `native`（默认）、`obsidian`                   |                                                          |
| `bridge.readMemoryArtifacts`               | 默认 `true`                                    | 导入主动记忆插件的公开产物                               |
| `bridge.followMemoryEvents`                | 默认 `true`                                    | 在 bridge 模式中包含事件日志                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 默认 `false`                                   | 运行 `unsafe-local` 导入所必需                           |
| `unsafeLocal.paths`                        | 默认 `[]`                                      | 在 `unsafe-local` 模式中要导入的显式本地路径             |
| `search.backend`                           | `shared`（默认）、`local`                      |                                                          |
| `search.corpus`                            | `wiki`（默认）、`memory`、`all`                |                                                          |
| `context.includeCompiledDigestPrompt`      | 默认 `false`                                   | 向记忆提示词章节追加紧凑摘要快照                         |
| `render.createBacklinks`                   | 默认 `true`                                    | 生成确定性的相关区块                                     |
| `render.createDashboards`                  | 默认 `true`                                    | 生成仪表盘页面                                           |

### 示例：QMD + bridge 模式

当你希望用 QMD 进行召回，并用 `memory-wiki` 维护
知识层时使用此配置。每一层都保持专注：QMD 让原始笔记、会话
导出和额外集合可被搜索，而 `memory-wiki` 编译
稳定实体、声明、仪表盘和来源页面。

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

这会让 QMD 负责主动记忆召回，让 `memory-wiki` 专注于
已编译页面和仪表盘，并且在你有意启用已编译摘要提示词之前保持提示词形态不变。

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

参阅 [CLI: wiki](/zh-CN/cli/wiki) 获取完整命令参考，包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import` / `wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，该插件会写入 Obsidian 友好的
Markdown，并且可以选择使用官方 `obsidian` CLI 来进行状态
探测、知识库搜索、打开页面、调用命令，以及跳转到
每日笔记。这是可选的；即使没有 Obsidian，wiki 仍可在 native 模式下工作。

## 推荐工作流

<Steps>
<Step title="保留主动记忆插件用于召回">
召回、提升和 Dreaming 仍由已配置的记忆后端拥有。
</Step>
<Step title="启用 memory-wiki">
除非你明确想要 bridge 模式，否则从 `isolated` 模式开始。
</Step>
<Step title="当来源出处很重要时使用 wiki_search / wiki_get">
当你需要 wiki 专用排序或页面级信念结构时，优先使用这些命令，而不是 `memory_search`。
</Step>
<Step title="使用 wiki_apply 进行窄范围综合或元数据更新">
避免手动编辑受管理的生成区块。
</Step>
<Step title="在有意义的更改后运行 wiki_lint">
捕获矛盾、未解决问题和来源出处缺口。
</Step>
<Step title="开启仪表盘以查看过期/矛盾可见性">
设置 `render.createDashboards: true`（默认）。
</Step>
</Steps>

## 相关文档

- [记忆概览](/zh-CN/concepts/memory)
- [CLI: memory](/zh-CN/cli/memory)
- [CLI: wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
