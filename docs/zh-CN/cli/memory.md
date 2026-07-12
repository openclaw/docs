---
read_when:
    - 你想要为语义记忆建立索引或进行搜索
    - 你正在调试记忆可用性或索引问题
    - 你希望将回忆出的短期记忆提升为 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: 记忆
x-i18n:
    generated_at: "2026-07-11T20:24:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理语义记忆的索引、搜索以及提升至 `MEMORY.md`。
此命令由内置的 `memory-core` 插件提供，在 `plugins.slots.memory` 选择
`memory-core`（默认值）时可用。其他记忆插件会公开各自的 CLI 命名空间。

相关内容：[记忆概览](/zh-CN/concepts/memory)概念、[Dreaming](/zh-CN/concepts/dreaming)、
[记忆配置参考](/zh-CN/reference/memory-config)、[Memory Wiki](/zh-CN/plugins/memory-wiki)、
[wiki](/zh-CN/cli/wiki)、[插件](/zh-CN/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

未指定 `--agent` 时，将对 `agents.list` 中的每个智能体运行；如果未配置智能体列表，
则回退到默认智能体。

| 标志        | 效果                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 探测向量存储、嵌入提供商和语义搜索是否就绪（意味着会额外调用提供商）。普通的 `memory status` 会保持快速并跳过此操作；向量/语义状态未知意味着尚未探测。即使指定 `--deep`，QMD 词法 `searchMode: "search"` 也始终跳过语义向量探测。 |
| `--index`   | 如果存储处于脏状态，则重新索引。隐含启用 `--deep`。                                                                                                                                                                                                                                                          |
| `--fix`     | 修复过期的召回锁并规范化提升元数据。                                                                                                                                                                                                                                               |
| `--json`    | 输出 JSON。                                                                                                                                                                                                                                                                                               |
| `--verbose` | 输出各阶段的详细日志。                                                                                                                                                                                                                                                                             |

如果即使设置了 `dreaming.enabled: true`，`Dreaming` 行仍保持为 `off`，
或者定时清理似乎从未运行，请注意，托管式 Dreaming 定时任务依赖默认智能体的
Heartbeat 触发，以启动协调流程。有关调度详情，请参阅
[Dreaming](/zh-CN/concepts/dreaming)。

状态还会列出 `agents.defaults.memorySearch.extraPaths` 中的所有额外搜索路径。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

智能体作用域与 `status` 相同。`--force` 将执行完整的重新索引，而非增量索引。
`--verbose` 会先输出各智能体的提供商、模型、来源和额外路径详情，
然后显示索引进度。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 查询：使用位置参数 `[query]` 或 `--query <text>`。如果两者均已设置，以 `--query`
  为准。如果两者均未设置，命令将报错。
- `--agent <id>`：默认为默认智能体（而非完整智能体列表）。
- `--max-results <n>`：限制结果数量（正整数）。
- `--min-score <n>`：过滤掉分数低于此值的匹配项。

## `memory promote`

对 `memory/YYYY-MM-DD.md` 中的短期候选项进行排序，并可选择将排名靠前的条目追加到
`MEMORY.md`。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 标志                       | 默认值       | 效果                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 返回/应用的最大候选项数量。                                   |
| `--min-score <n>`          | `0.75`       | 最低加权提升分数。                                 |
| `--min-recall-count <n>`   | `3`          | 所需的最低召回次数。                                    |
| `--min-unique-queries <n>` | `2`          | 所需的最低不同查询数量。                            |
| `--apply`                  | 仅预览 | 将选中的候选项追加到 `MEMORY.md`，并将其标记为已提升。 |
| `--include-promoted`       |              | 包含先前周期中已提升的候选项。           |
| `--json`                   |              | 输出 JSON。                                                       |

这些 CLI 默认值与定时 Dreaming 清理的深度阶段阈值不同
（请参阅下方的 [Dreaming](#dreaming)）；若要使一次性手动运行与清理行为一致，
请显式传入相应标志。

排序信号包括召回频率、检索相关性、查询多样性、时间新近性、
跨日整合以及派生概念的丰富度；这些信号来自记忆召回和每日摄取流程，
并包含针对 Dreaming 中重复回顾的轻度/REM 阶段强化加成。写入之前，提升流程会重新读取
实时的每日笔记，因此会尊重排序后对短期片段所做的编辑或删除，
而不会从过期快照中提升内容。

## `memory promote-explain`

解释某个提升候选项的分数构成。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` 可匹配候选项的键（精确匹配或子字符串匹配）、路径或片段文本。

## `memory rem-harness`

预览 REM 反思、候选事实和深度阶段的提升输出，而不写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`：使用历史 `YYYY-MM-DD.md` 每日文件为 harness 提供初始数据，
  而非使用实时工作区。
- `--grounded`：还会根据历史笔记渲染有依据的 `发生了什么` / `反思` /
  `可能的长期更新` 预览。

## `memory rem-backfill`

将有依据的历史 REM 摘要写入 `DREAMS.md`，以供 UI 审阅。
此操作可撤销。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`：除非设置了 `--rollback`/`--rollback-short-term`，
  否则为必填项。用于回填的历史每日记忆文件或目录。
- `--stage-short-term`：还会将有依据的持久候选项加入实时短期提升存储，
  以便常规深度阶段对其进行排序。
- `--rollback`：从 `DREAMS.md` 中删除先前写入的有依据的日记条目。
- `--rollback-short-term`：删除先前暂存的有依据的短期候选项。

## Dreaming

Dreaming 是后台记忆整合系统，包含三个按同一调度顺序运行的协作阶段：
**轻度**（整理/暂存短期材料）、**REM**（反思并呈现主题）、**深度**
（将持久事实提升至 `MEMORY.md`）。只有深度阶段会写入 `MEMORY.md`。

- 通过 `plugins.entries.memory-core.config.dreaming.enabled: true`
  启用（默认为 `false`）；`memory-core` 会自动管理清理定时任务，无需手动执行
  `openclaw cron add`。
- 在聊天中使用 `/dreaming on|off` 切换；使用 `/dreaming status`
  检查状态（也可使用 `/dreaming`/`/dreaming help`）。`on`/`off` 要求具备渠道所有者身份
  或 Gateway 网关的 `operator.admin` 权限；任何能够调用该命令的人都可以使用 `status`
  和帮助。
- 供人阅读的阶段输出会写入 `DREAMS.md`（或已有的 `dreams.md`）。
  默认情况下（`dreaming.storage.mode: "separate"`），每个阶段还会将独立报告写入
  `memory/dreaming/<phase>/YYYY-MM-DD.md`；将 `mode` 设置为
  `"inline"` 可改为把报告并入每日记忆文件，设置为 `"both"`
  则同时采用两种方式。
- 定时运行和手动运行 `memory promote` 使用相同的深度阶段排序信号；
  只有默认阈值不同（请比较上表和下方的定时任务默认值）。
- 定时运行会扩展到每个已配置智能体的记忆工作区。

定时任务默认值（`plugins.entries.memory-core.config.dreaming`）：

| 键                                     | 默认值      |
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

## SecretRef 的 Gateway 网关依赖

如果主动记忆的远程 API 密钥字段配置为 SecretRef，`memory`
命令会从当前 Gateway 网关快照中解析这些字段；如果 Gateway 网关不可用，
命令会立即失败。这需要 Gateway 网关支持 `secrets.resolve` 方法；
较旧的 Gateway 网关会返回未知方法错误。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
