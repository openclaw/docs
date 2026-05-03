---
read_when:
    - 你想要超出普通 MEMORY.md 笔记的持久知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 wiki_search、wiki_get 或桥接模式
summary: 'memory-wiki: 带有来源信息、声明、仪表板和桥接模式的编译知识库'
title: 记忆 wiki
x-i18n:
    generated_at: "2026-05-03T22:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，会将持久记忆转换为编译后的知识库。

它**不会**取代主动记忆插件。主动记忆插件仍然负责召回、提升、索引和 Dreaming。`memory-wiki` 与它并列工作，并将持久知识编译成可导航的 wiki，其中包含确定性页面、结构化声明、来源依据、仪表板和机器可读摘要。

当你希望记忆更像一个维护良好的知识层，而不是一堆 Markdown 文件时，请使用它。

## 它添加了什么

- 一个带有确定性页面布局的专用 wiki 库
- 结构化声明和证据元数据，而不仅是 prose
- 页面级来源依据、置信度、矛盾和开放问题
- 面向智能体/运行时消费者的编译摘要
- wiki 原生的 search/get/apply/lint 工具
- 可选桥接模式，用于从主动记忆插件导入公共产物
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 它如何配合记忆

可以这样理解这种分层：

| 层                                                      | 负责                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 主动记忆插件（`memory-core`、QMD、Honcho 等） | 召回、语义搜索、提升、Dreaming、记忆运行时                               |
| `memory-wiki`                                           | 编译后的 wiki 页面、富含来源依据的综合内容、仪表板、wiki 专用 search/get/apply |

如果主动记忆插件暴露共享召回产物，OpenClaw 可以用 `memory_search corpus=all` 在一次处理中搜索两个层。

当你需要 wiki 专用排序、来源依据或直接页面访问时，请改用 wiki 原生工具。

## 推荐的混合模式

对于本地优先设置，一个强默认方案是：

- 使用 QMD 作为主动记忆后端，用于召回和广泛语义搜索
- 使用 `bridge` 模式的 `memory-wiki`，用于持久的综合知识页面

这种分层效果很好，因为每一层都保持专注：

- QMD 让原始笔记、会话导出和额外集合可搜索
- `memory-wiki` 编译稳定实体、声明、仪表板和来源页面

实用规则：

- 当你想对记忆进行一次广泛召回时，使用 `memory_search`
- 当你想要具有来源依据感知能力的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你想让共享搜索跨越两层时，使用 `memory_search corpus=all`

如果桥接模式报告导出的产物为零，说明主动记忆插件当前尚未暴露公共桥接输入。先运行 `openclaw wiki doctor`，然后确认主动记忆插件支持公共产物。

当桥接模式处于活动状态且启用了 `bridge.readMemoryArtifacts` 时，`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关读取。这样可让 CLI 桥接检查与运行时记忆插件上下文保持一致。如果桥接被禁用或产物读取被关闭，这些命令会保持本地/离线行为。

## 库模式

`memory-wiki` 支持三种库模式：

### `isolated`

拥有自己的库、自己的来源，不依赖 `memory-core`。

当你希望 wiki 成为独立策划的知识存储时使用此模式。

### `bridge`

通过公共插件 SDK 接缝，从主动记忆插件读取公共记忆产物和记忆事件。

当你希望 wiki 编译和整理记忆插件导出的产物，而不进入私有插件内部机制时使用此模式。

桥接模式可以索引：

- 导出的记忆产物
- Dream 报告
- 每日笔记
- 记忆根文件
- 记忆事件日志

### `unsafe-local`

针对本机私有路径的显式同机逃生口。

此模式有意保持实验性且不可移植。仅当你理解信任边界，并且明确需要桥接模式无法提供的本地文件系统访问时，才使用它。

## 库布局

该插件会初始化如下库：

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
- `syntheses/` 用于编译摘要和维护型汇总
- `reports/` 用于生成的仪表板

## 结构化声明和证据

页面可以携带结构化的 `claims` frontmatter，而不仅是自由格式文本。

每条声明可以包括：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

证据条目可以包括：

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

这使 wiki 更像一个信念层，而不是被动的笔记转储。声明可以被跟踪、评分、争议化，并追溯回来源。

## 面向智能体的实体元数据

实体页面还可以携带供智能体使用的路由元数据。这是通用 frontmatter，因此适用于人物、团队、系统、项目或任何其他实体类型。

常见字段包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨别名和导入使用的稳定身份键
- `aliases`：应解析到同一页面的名称、用户名或标签
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：紧凑的路由提示
- `lastRefreshedAt`：独立于页面编辑时间的来源刷新时间戳
- `personCard`：可选的人物专用路由卡，包含用户名、社交账号、邮箱、时区、通道、适合询问事项、避免询问事项、置信度和隐私
- `relationships`：指向相关页面的类型化边，包含目标、类型、权重、置信度、证据类型、隐私级别和备注

对于人物 wiki，智能体通常应先从 `reports/person-agent-directory.md` 开始，然后在使用联系方式或推断事实前，用 `wiki_get` 打开人物页面。

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

编译步骤会读取 wiki 页面、规范化摘要，并在以下位置输出稳定的机器面向产物：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要的存在，是为了让智能体和运行时代码不必抓取 Markdown 页面。

编译输出还支持：

- search/get 流程的首轮 wiki 索引
- 声明 ID 回查到所属页面
- 紧凑的提示词补充
- 报告/仪表板生成

## 仪表板和健康报告

启用 `render.createDashboards` 后，编译会在 `reports/` 下维护仪表板。

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

这些报告会跟踪如下内容：

- 矛盾备注簇
- 竞争声明簇
- 缺少结构化证据的声明
- 低置信度页面和声明
- 过期或未知新鲜度
- 带有未解决问题的页面
- 人物/实体路由卡
- 结构化关系边
- 证据类别覆盖率
- 使用前需要审查的非公共隐私级别

## 搜索和检索

`memory-wiki` 支持两种搜索后端：

- `shared`：可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

它还支持三种语料库：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会在可能时使用编译摘要作为第一轮处理
- 声明 ID 可以解析回所属页面
- 有争议/过期/新鲜的声明会影响排序
- 来源依据标签可以保留到结果中
- 搜索模式可以让排序偏向人物查找、问题路由、来源证据或原始声明

实用规则：

- 使用 `memory_search corpus=all` 进行一次广泛召回
- 当你关心 wiki 专用排序、来源依据或页面级信念结构时，使用 `wiki_search` + `wiki_get`

搜索模式：

- `auto`：平衡默认值
- `find-person`：提升类似人物的实体、别名、用户名、社交账号和规范 ID
- `route-question`：提升智能体卡片、适合询问提示、最适合用途提示和关系上下文
- `source-evidence`：提升来源页面和结构化证据元数据
- `raw-claim`：提升匹配的结构化声明，并在结果中返回声明/证据元数据

当结果匹配结构化声明时，`wiki_search` 可以在其 details payload 中返回 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`。可用时，文本输出也会包含紧凑的 `Claim:` 和 `Evidence:` 行。

## 智能体工具

该插件注册以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，并在配置后搜索共享记忆语料库；接受用于人物查找、问题路由、来源证据或原始声明钻取的 `mode`
- `wiki_get`：按 ID/路径读取 wiki 页面，或回退到共享记忆语料库
- `wiki_apply`：进行窄范围综合/元数据变更，而不是自由格式页面手术
- `wiki_lint`：结构检查、来源依据缺口、矛盾、开放问题

该插件还会注册一个非独占的记忆语料库补充，因此当主动记忆插件支持语料库选择时，共享的 `memory_search` 和 `memory_get` 可以触达 wiki。

## 提示词和上下文行为

启用 `context.includeCompiledDigestPrompt` 后，记忆提示词区段会附加来自 `agent-digest.json` 的紧凑编译快照。

该快照有意保持小而高信号：

- 仅包含顶层页面
- 仅包含顶层声明
- 矛盾数量
- 问题数量
- 置信度/新鲜度限定词

这是可选项，因为它会改变提示词形状，并且主要适用于明确消费记忆补充的上下文引擎或旧版提示词组装。

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
- `bridge.readMemoryArtifacts`：导入主动记忆插件的公开产物
- `bridge.followMemoryEvents`：在桥接模式中包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：将紧凑摘要快照追加到记忆提示词部分
- `render.createBacklinks`：生成确定性的相关块
- `render.createDashboards`：生成仪表盘页面

### 示例：QMD + 桥接模式

当你想将 QMD 用于回忆，并将 `memory-wiki` 用作维护型知识层时使用此配置：

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

- QMD 负责主动记忆回忆
- `memory-wiki` 专注于编译后的页面和仪表盘
- 提示词形态保持不变，直到你有意启用编译摘要提示词

## CLI

`memory-wiki` 还公开了一个顶层 CLI 界面：

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

完整命令参考见 [CLI：wiki](/zh-CN/cli/wiki)。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，该插件会写入适合 Obsidian 的 Markdown，并可选择使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- vault 搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到每日笔记

这是可选的。即使没有 Obsidian，wiki 仍可在原生模式下工作。

## 推荐工作流

1. 保留你的主动记忆插件，用于回忆、提升和 Dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确想要桥接模式，否则从 `isolated` 模式开始。
4. 当来源依据很重要时，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 进行小范围综合或元数据更新。
6. 在有意义的变更后运行 `wiki_lint`。
7. 如果你想查看过期内容或矛盾内容，请开启仪表盘。

## 相关文档

- [记忆概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)
- [CLI：wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
