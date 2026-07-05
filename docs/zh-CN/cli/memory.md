---
read_when:
    - 你想索引或搜索语义记忆
    - 你正在调试记忆可用性或索引
    - 你想将召回的短期记忆提升为 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: 记忆
x-i18n:
    generated_at: "2026-07-05T11:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理语义记忆索引、搜索，以及提升到 `MEMORY.md`。
由内置的 `memory-core` 插件提供，当
`plugins.slots.memory` 选择 `memory-core`（默认值）时可用。其他记忆
插件会公开自己的 CLI 命名空间。

相关：[记忆](/zh-CN/concepts/memory)概念、[Dreaming](/zh-CN/concepts/dreaming)、
[记忆配置参考](/zh-CN/reference/memory-config)、[Memory Wiki](/zh-CN/plugins/memory-wiki)、
[wiki](/zh-CN/cli/wiki)、[插件](/zh-CN/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

不带 `--agent` 时，会为 `agents.list` 中的每个智能体运行；如果未配置智能体列表，
则回退到默认智能体。

| 标志        | 作用                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 探测向量存储、嵌入提供商和语义搜索就绪状态（意味着额外的提供商调用）。普通 `memory status` 保持快速并跳过此项；未知的向量/语义状态表示未探测。QMD 词法 `searchMode: "search"` 始终跳过语义向量探测，即使使用 `--deep`。 |
| `--index`   | 如果存储为脏，则重新索引。隐含 `--deep`。                                                                                                                                                                                                                                                          |
| `--fix`     | 修复过期的召回锁并规范化提升元数据。                                                                                                                                                                                                                                               |
| `--json`    | 打印 JSON。                                                                                                                                                                                                                                                                                               |
| `--verbose` | 输出每个阶段的详细日志。                                                                                                                                                                                                                                                                             |

如果即使设置了 `dreaming.enabled: true`，`Dreaming` 行仍保持为 `off`，或者
定时扫描看起来从未运行，则托管的 dreaming cron 依赖默认智能体的 heartbeat 触发来启动协调。请参阅
[Dreaming](/zh-CN/concepts/dreaming) 了解调度详情。

状态还会列出来自 `agents.defaults.memorySearch.extraPaths` 的任何额外搜索路径。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

与 `status` 使用相同的按智能体作用域。`--force` 会运行完整重新索引，而不是
增量索引。`--verbose` 会在显示索引进度前，打印每个智能体的提供商、模型、来源和
额外路径详情。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 查询：位置参数 `[query]` 或 `--query <text>`。如果两者都设置，则 `--query`
  优先。如果两者都未设置，命令会报错。
- `--agent <id>`：默认使用默认智能体（不是完整智能体列表）。
- `--max-results <n>`：限制结果数量（正整数）。
- `--min-score <n>`：过滤掉低于此分数的匹配项。

## `memory promote`

对来自 `memory/YYYY-MM-DD.md` 的短期候选项进行排序，并可选择将
排名靠前的条目追加到 `MEMORY.md`。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 标志                       | 默认值      | 作用                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 返回/应用的最大候选项数量。                                   |
| `--min-score <n>`          | `0.75`       | 最小加权提升分数。                                 |
| `--min-recall-count <n>`   | `3`          | 所需的最小召回次数。                                    |
| `--min-unique-queries <n>` | `2`          | 所需的最小不同查询数量。                            |
| `--apply`                  | 仅预览 | 将选中的候选项追加到 `MEMORY.md` 并标记为已提升。 |
| `--include-promoted`       |              | 包含之前周期中已提升的候选项。           |
| `--json`                   |              | 打印 JSON。                                                       |

这些 CLI 默认值不同于定时 dreaming 扫描的 deep 阶段
阈值（请参阅下方的 [Dreaming](#dreaming)）；如果希望一次性手动运行与
扫描行为匹配，请传入显式标志。

排序信号：召回频率、检索相关性、查询多样性、
时间新近度、跨日合并，以及派生概念丰富度，这些信号来自
记忆召回和每日摄取过程，另有针对 repeated dreaming revisits 的 light/REM 阶段
强化加成。写入前，提升会重新读取实时每日笔记，因此自排序以来对短期片段的
编辑或删除都会被尊重，而不是从过期快照提升。

## `memory promote-explain`

解释一个提升候选项的分数明细。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` 会匹配候选项的键（精确匹配或子字符串）、路径或片段
文本。

## `memory rem-harness`

预览 REM 反思、候选真相和 deep 阶段提升输出，
不写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`：从历史 `YYYY-MM-DD.md`
  每日文件为 harness 提供种子，而不是使用实时工作区。
- `--grounded`：还会基于历史笔记渲染 grounded 的 `What Happened` / `Reflections` /
  `Possible Lasting Updates` 预览。

## `memory rem-backfill`

将 grounded 历史 REM 摘要写入 `DREAMS.md` 以供 UI 审查。
可逆。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`：除非设置了 `--rollback`/`--rollback-short-term`，
  否则必填。要回填的历史每日记忆文件或目录。
- `--stage-short-term`：还会将 grounded 的持久候选项播种到实时
  短期提升存储中，以便正常 deep 阶段可以对它们排序。
- `--rollback`：从 `DREAMS.md` 中移除之前写入的 grounded 日记条目。
- `--rollback-short-term`：移除之前暂存的 grounded 短期
  候选项。

## Dreaming

Dreaming 是后台记忆整合系统，包含三个协作
阶段，按一个调度顺序运行：**light**（排序/暂存短期
材料）、**REM**（反思并浮现主题）、**deep**（将持久
事实提升到 `MEMORY.md`）。只有 deep 会写入 `MEMORY.md`。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true`
  启用（默认值为 `false`）；`memory-core` 会自动管理扫描 cron 作业，不需要手动
  `openclaw cron add`。
- 在聊天中使用 `/dreaming on|off` 切换；使用 `/dreaming status`
  检查（或 `/dreaming`/`/dreaming help`）。`on`/`off` 需要渠道所有者状态
  或 Gateway 网关 `operator.admin`；`status` 和帮助仍对任何
  可以调用该命令的人可用。
- 人类可读的阶段输出会写入 `DREAMS.md`（或现有的 `dreams.md`）。
  默认情况下（`dreaming.storage.mode: "separate"`），每个阶段还会将
  独立报告写入 `memory/dreaming/<phase>/YYYY-MM-DD.md`；设置 `mode:
"inline"` 可将报告折叠到每日记忆文件中，或设置 `"both"`
  同时使用两者。
- 定时和手动 `memory promote` 运行共享相同的 deep 阶段
  排序信号；只有默认阈值不同（见上表与下方
  定时默认值对比）。
- 定时运行会扇出到每个已配置智能体的记忆工作区。

定时默认值（`plugins.entries.memory-core.config.dreaming`）：

| 键                                    | 默认值     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

完整键列表和阶段详情：[Dreaming](/zh-CN/concepts/dreaming)、
[记忆配置参考](/zh-CN/reference/memory-config#dreaming)。

## SecretRef Gateway 网关依赖

如果主动记忆远程 API 密钥字段配置为 SecretRef，`memory`
命令会从活动 Gateway 网关快照解析它们；如果 Gateway 网关
不可用，命令会快速失败。这需要 Gateway 网关支持
`secrets.resolve` 方法；较旧的 Gateway 网关会返回未知方法错误。

## 相关

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
