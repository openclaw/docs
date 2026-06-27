---
read_when:
    - 你想索引或搜索语义记忆
    - 你正在调试内存可用性或索引
    - 你想将已召回的短期记忆提升为 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness）'
title: 记忆
x-i18n:
    generated_at: "2026-06-27T01:38:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理语义记忆索引和搜索。
由内置的 `memory-core` 插件提供。当 `plugins.slots.memory` 选择 `memory-core`（默认值）时，该命令可用；其他记忆插件会公开自己的 CLI 命名空间。

相关：

- 记忆概念：[记忆](/zh-CN/concepts/memory)
- 记忆 wiki：[Memory Wiki](/zh-CN/plugins/memory-wiki)
- Wiki CLI：[wiki](/zh-CN/cli/wiki)
- 插件：[插件](/zh-CN/tools/plugin)

## 示例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 选项

`memory status` 和 `memory index`：

- `--agent <id>`：限定到单个智能体。如果未提供，这些命令会为每个已配置的智能体运行；如果没有配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测本地向量存储就绪状态、嵌入提供商就绪状态，以及语义向量搜索就绪状态。普通 `memory status` 会保持快速，不会运行实时嵌入或提供商发现工作；未知的向量存储或语义向量状态表示该命令未探测它。QMD 词法 `searchMode: "search"` 即使带有 `--deep`，也会跳过语义向量探测和嵌入维护。
- `--index`：如果存储为脏状态，则运行重新索引（隐含 `--deep`）。
- `--fix`：修复陈旧的回忆锁并规范化提升元数据。
- `--json`：打印 JSON 输出。

如果 `memory status` 显示 `Dreaming 状态：blocked`，则托管的 Dreaming cron 已启用，但驱动它的 Heartbeat 没有为默认智能体触发。有关两个常见原因，请参阅 [Dreaming 从不运行](/zh-CN/concepts/dreaming#dreaming-never-runs-status-shows-blocked)。

`memory index`：

- `--force`：强制完整重新索引。

`memory search`：

- 查询输入：传入位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，则以 `--query` 为准。
- 如果两者都未提供，该命令会以错误退出。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--max-results <n>`：限制返回的结果数量。
- `--min-score <n>`：过滤掉低分匹配。
- `--json`：打印 JSON 结果。

`memory promote`：

预览并应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 将提升写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` -- 限制显示的候选数量。
- `--include-promoted` -- 包含先前周期中已提升的条目。

完整选项：

- 使用加权提升信号（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）对来自 `memory/YYYY-MM-DD.md` 的短期候选进行排序。
- 使用来自记忆回忆和每日摄取流程的短期信号，并加上 light/REM 阶段强化信号。
- 启用 Dreaming 时，`memory-core` 会自动管理一个 cron 作业，在后台运行完整扫描（`light -> REM -> deep`）（无需手动执行 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：要返回/应用的最大候选数量。
- `--min-score <n>`：最低加权提升分数。
- `--min-recall-count <n>`：候选所需的最低回忆次数。
- `--min-unique-queries <n>`：候选所需的最低不同查询数量。
- `--apply`：将选中的候选追加到 `MEMORY.md` 并标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory promote-explain`：

解释特定提升候选及其分数明细。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：用于查找的候选键、路径片段或片段内容。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory rem-harness`：

预览 REM 反思、候选事实和深度提升输出，不写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的深度候选。
- `--json`：打印 JSON 输出。

## Dreaming

Dreaming 是后台记忆整合系统，包含三个协作阶段：**light**（整理/暂存短期材料）、**deep**（将持久事实提升到 `MEMORY.md`）和 **REM**（反思并浮现主题）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 在聊天中使用 `/dreaming on|off` 切换（或使用 `/dreaming status` 查看）。
- Dreaming 按一个托管扫描计划（`dreaming.frequency`）运行，并按顺序执行阶段：light、REM、deep。
- 只有 deep 阶段会将持久记忆写入 `MEMORY.md`。
- 人类可读的阶段输出和日记条目会写入 `DREAMS.md`（或现有的 `dreams.md`），也可在 `memory/dreaming/<phase>/YYYY-MM-DD.md` 中写入可选的分阶段报告。
- 排序使用加权信号：回忆频率、检索相关性、查询多样性、时间近因、跨日整合，以及派生的概念丰富度。
- 提升在写入 `MEMORY.md` 前会重新读取实时每日笔记，因此已编辑或已删除的短期片段不会从陈旧的回忆存储快照中被提升。
- 除非传入 CLI 阈值覆盖项，否则定时和手动 `memory promote` 运行共享相同的 deep 阶段默认值。
- 自动运行会在已配置的记忆工作区之间展开。

默认调度：

- **扫描节奏**：`dreaming.frequency = 0 3 * * *`
- **Deep 阈值**：`minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`、`recencyHalfLifeDays=14`、`maxAgeDays=30`

示例：

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

说明：

- `memory index --verbose` 会打印每个阶段的详细信息（提供商、模型、来源、批处理活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果实际启用的主动记忆远程 API key 字段被配置为 SecretRefs，该命令会从活动 Gateway 网关快照解析这些值。如果 Gateway 网关不可用，该命令会快速失败。
- Gateway 网关版本偏差说明：此命令路径需要支持 `secrets.resolve` 的 Gateway 网关；旧版 Gateway 网关会返回未知方法错误。
- 使用 `dreaming.frequency` 调整定时扫描节奏。除此之外，deep 提升策略是内部策略，但 `dreaming.phases.deep.maxPromotedSnippetTokens` 除外，它会限制被提升片段的长度，同时保持来源可见。需要一次性手动阈值覆盖时，请在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 会从历史每日笔记预览有依据的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，不写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 会将可逆的有依据日记条目写入 `DREAMS.md`，供 UI 审查。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还会将有依据的持久候选种入实时短期提升存储，使正常 deep 阶段能够对它们排序。
- `memory rem-backfill --rollback` 会移除先前写入的有依据日记条目，`memory rem-backfill --rollback-short-term` 会移除先前暂存的有依据短期候选。
- 完整阶段说明和配置参考见 [Dreaming](/zh-CN/concepts/dreaming)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
