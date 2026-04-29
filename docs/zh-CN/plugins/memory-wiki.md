---
read_when:
    - 你想要超出普通 MEMORY.md 笔记的持久知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 wiki_search、wiki_get 或桥接模式
summary: memory-wiki：带有来源、声明、仪表板和桥接模式的已编译知识库
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-29T19:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一个内置插件，可将持久化记忆转换为编译后的知识库。

它**不会**取代活跃记忆插件。活跃记忆插件仍然负责召回、提升、索引和 Dreaming。`memory-wiki` 与它并行工作，并将持久化知识编译成可导航的 wiki，其中包含确定性页面、结构化声明、来源、仪表盘和机器可读摘要。

当你希望记忆更像一个维护良好的知识层，而不是一堆 Markdown 文件时，可以使用它。

## 它增加了什么

- 一个带有确定性页面布局的专用 wiki 库
- 结构化的声明和证据元数据，而不仅仅是散文
- 页面级来源、置信度、矛盾和开放问题
- 面向智能体/运行时消费者的编译摘要
- wiki 原生搜索/获取/应用/lint 工具
- 可选桥接模式，用于从活跃记忆插件导入公共工件
- 可选 Obsidian 友好的渲染模式和 CLI 集成

## 它如何与记忆配合

可以这样理解这种分层：

| 层                                                      | 拥有                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 活跃记忆插件（`memory-core`、QMD、Honcho 等） | 召回、语义搜索、提升、Dreaming、记忆运行时                               |
| `memory-wiki`                                           | 编译后的 wiki 页面、来源丰富的综合内容、仪表盘、wiki 专用搜索/获取/应用 |

如果活跃记忆插件公开共享召回工件，OpenClaw 可以用 `memory_search corpus=all` 一次性搜索这两层。

当你需要 wiki 专用排序、来源或直接页面访问时，请改用 wiki 原生工具。

## 推荐的混合模式

对于本地优先设置，一个可靠的默认选择是：

- 使用 QMD 作为活跃记忆后端，用于召回和广泛语义搜索
- 使用处于 `bridge` 模式的 `memory-wiki`，用于持久化综合知识页面

这种分层效果很好，因为每一层都保持专注：

- QMD 让原始笔记、会话导出和额外集合保持可搜索
- `memory-wiki` 编译稳定实体、声明、仪表盘和来源页面

实用规则：

- 当你想对记忆进行一次广泛召回时，使用 `memory_search`
- 当你想要具有来源感知能力的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你希望共享搜索跨越两层时，使用 `memory_search corpus=all`

如果桥接模式报告导出工件为零，说明活跃记忆插件当前尚未公开公共桥接输入。先运行 `openclaw wiki doctor`，然后确认活跃记忆插件支持公共工件。

当桥接模式处于活动状态且启用了 `bridge.readMemoryArtifacts` 时，`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 会通过正在运行的 Gateway 网关读取。这会让 CLI 桥接检查与运行时记忆插件上下文保持一致。如果桥接被禁用或工件读取被关闭，这些命令会保留本地/离线行为。

## 库模式

`memory-wiki` 支持三种库模式：

### `isolated`

自己的库、自己的来源，不依赖 `memory-core`。

当你希望 wiki 成为自己的精选知识存储时使用此模式。

### `bridge`

通过公共插件 SDK 边界，从活跃记忆插件读取公共记忆工件和记忆事件。

当你希望 wiki 编译和组织记忆插件导出的工件，而不访问私有插件内部实现时使用此模式。

桥接模式可以索引：

- 导出的记忆工件
- Dream 报告
- 每日笔记
- 记忆根文件
- 记忆事件日志

### `unsafe-local`

显式的同机逃生口，用于本地私有路径。

此模式有意设计为实验性且不可移植。仅当你理解信任边界，并且确实需要桥接模式无法提供的本地文件系统访问时才使用它。

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

主要页面分组包括：

- `sources/` 用于导入的原始材料和桥接支持的页面
- `entities/` 用于持久化事物、人物、系统、项目和对象
- `concepts/` 用于想法、抽象、模式和策略
- `syntheses/` 用于编译后的摘要和维护型汇总
- `reports/` 用于生成的仪表盘

## 结构化声明和证据

页面可以携带结构化的 `claims` frontmatter，而不仅仅是自由形式文本。

每个声明可以包括：

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

这让 wiki 更像一个信念层，而不是被动的笔记堆。声明可以被跟踪、评分、质疑，并回溯到来源来解决。

## 面向智能体的实体元数据

实体页面还可以携带供智能体使用的路由元数据。这是通用 frontmatter，因此适用于人物、团队、系统、项目或任何其他实体类型。

常见字段包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨别名和导入使用的稳定身份键
- `aliases`：应解析到同一页面的名称、用户名或标签
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：紧凑的路由提示
- `lastRefreshedAt`：独立于页面编辑时间的来源刷新时间戳
- `personCard`：可选的人物专用路由卡片，包含用户名、社交账号、邮箱、时区、路线、适合询问、不适合询问、置信度和隐私
- `relationships`：指向相关页面的类型化边，包含目标、类型、权重、置信度、证据类型、隐私层级和备注

对于人物 wiki，智能体通常应从 `reports/person-agent-directory.md` 开始，然后在使用联系方式或推断事实之前，用 `wiki_get` 打开人物页面。

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

编译步骤会读取 wiki 页面、规范化摘要，并在以下位置输出稳定的面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要存在的目的，是让智能体和运行时代码不必抓取 Markdown 页面。

编译输出还支持：

- 搜索/获取流程的首轮 wiki 索引
- 声明 ID 回查到所属页面
- 紧凑的提示词补充
- 报告/仪表盘生成

## 仪表盘和健康报告

启用 `render.createDashboards` 后，编译会维护 `reports/` 下的仪表盘。

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

- 矛盾备注集群
- 竞争声明集群
- 缺少结构化证据的声明
- 低置信度页面和声明
- 过期或未知新鲜度
- 带有未解决问题的页面
- 人物/实体路由卡片
- 结构化关系边
- 证据类别覆盖率
- 使用前需要审查的非公开隐私层级

## 搜索和检索

`memory-wiki` 支持两种搜索后端：

- `shared`：可用时使用共享记忆搜索流程
- `local`：在本地搜索 wiki

它还支持三种语料库：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会在可能时使用编译摘要作为首轮结果
- 声明 ID 可以解析回所属页面
- 有争议/过期/新鲜的声明会影响排序
- 来源标签可以保留到结果中
- 搜索模式可以为人物查找、问题路由、来源证据或原始声明偏置排序

实用规则：

- 使用 `memory_search corpus=all` 进行一次广泛召回
- 当你关心 wiki 专用排序、来源或页面级信念结构时，使用 `wiki_search` + `wiki_get`

搜索模式：

- `auto`：平衡的默认模式
- `find-person`：提升类似人物的实体、别名、用户名、社交账号和规范 ID
- `route-question`：提升智能体卡片、适合询问提示、最适用提示和关系上下文
- `source-evidence`：提升来源页面和结构化证据元数据
- `raw-claim`：提升匹配的结构化声明，并在结果中返回声明/证据元数据

当结果匹配结构化声明时，`wiki_search` 可以在其详情载荷中返回 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`。可用时，文本输出还会包含紧凑的 `Claim:` 和 `Evidence:` 行。

## 智能体工具

该插件注册以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，以及在配置后搜索共享记忆语料库；接受 `mode`，用于人物查找、问题路由、来源证据或原始声明深挖
- `wiki_get`：按 ID/路径读取 wiki 页面，或回退到共享记忆语料库
- `wiki_apply`：进行窄范围综合/元数据变更，而不是自由形式页面手术
- `wiki_lint`：结构检查、来源缺口、矛盾、开放问题

该插件还会注册非独占的记忆语料库补充，因此当活跃记忆插件支持语料库选择时，共享的 `memory_search` 和 `memory_get` 可以访问 wiki。

## 提示词和上下文行为

启用 `context.includeCompiledDigestPrompt` 后，记忆提示词部分会附加来自 `agent-digest.json` 的紧凑编译快照。

该快照有意保持小而高信号：

- 仅包含顶级页面
- 仅包含顶级声明
- 矛盾数量
- 问题数量
- 置信度/新鲜度限定信息

这是可选功能，因为它会改变提示词形态，并且主要适用于显式消费记忆补充的上下文引擎或旧版提示词组装。

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

- `vaultMode`: `isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`: `native` 或 `obsidian`
- `bridge.readMemoryArtifacts`: 导入活跃 memory 插件的公共工件
- `bridge.followMemoryEvents`: 在 bridge 模式中包含事件日志
- `search.backend`: `shared` 或 `local`
- `search.corpus`: `wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`: 将紧凑摘要快照追加到 memory 提示词分区
- `render.createBacklinks`: 生成确定性的相关区块
- `render.createDashboards`: 生成仪表板页面

### 示例：QMD + bridge 模式

当你想用 QMD 进行召回，并用 `memory-wiki` 维护知识层时，请使用此配置：

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

- QMD 负责活跃 memory 召回
- `memory-wiki` 专注于编译页面和仪表板
- 在你有意启用编译摘要提示词之前，提示词形态保持不变

## CLI

`memory-wiki` 还暴露一个顶层 CLI 界面：

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

- Status 探测
- vault 搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到日记

这是可选的。即使没有 Obsidian，wiki 仍可在原生模式下工作。

## 推荐工作流

1. 保留你的活跃 memory 插件，用于召回、提升和 Dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确需要 bridge 模式，否则从 `isolated` 模式开始。
4. 当来源出处很重要时，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 进行范围较窄的综合整理或元数据更新。
6. 在有意义的更改后运行 `wiki_lint`。
7. 如果你想查看陈旧内容或矛盾内容，请开启仪表板。

## 相关文档

- [Memory 概览](/zh-CN/concepts/memory)
- [CLI：memory](/zh-CN/cli/memory)
- [CLI：wiki](/zh-CN/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
