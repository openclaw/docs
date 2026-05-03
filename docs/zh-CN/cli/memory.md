---
read_when:
    - 你想要索引或搜索语义记忆
    - 你正在调试记忆可用性或索引
    - 你想将召回的短期记忆提升为 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness）'
title: 记忆
x-i18n:
    generated_at: "2026-05-03T16:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理语义记忆索引和搜索。
由主动记忆插件提供（默认：`memory-core`；设置 `plugins.slots.memory = "none"` 可禁用）。

相关：

- 记忆概念：[记忆](/zh-CN/concepts/memory)
- Memory Wiki：[Memory Wiki](/zh-CN/plugins/memory-wiki)
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

- `--agent <id>`：限定到单个智能体。没有它时，这些命令会为每个已配置的智能体运行；如果未配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测本地向量存储就绪状态、嵌入提供商就绪状态，以及语义向量搜索就绪状态。普通 `memory status` 保持快速，不会运行实时嵌入或提供商发现工作；未知的向量存储或语义向量状态表示该命令中未进行探测。即使带有 `--deep`，QMD 词法 `searchMode: "search"` 也会跳过语义向量探测和嵌入维护。
- `--index`：如果存储为脏状态，则运行重新索引（隐含 `--deep`）。
- `--fix`：修复陈旧的召回锁，并规范化提升元数据。
- `--json`：打印 JSON 输出。

如果 `memory status` 显示 `Dreaming status: blocked`，则表示托管的 Dreaming cron 已启用，但驱动它的 heartbeat 没有为默认智能体触发。请参阅 [Dreaming 从不运行](/zh-CN/concepts/dreaming#dreaming-never-runs-status-shows-blocked)，了解两种常见原因。

`memory index`：

- `--force`：强制完整重新索引。

`memory search`：

- 查询输入：传入位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，则 `--query` 优先。
- 如果两者都未提供，命令会以错误退出。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--max-results <n>`：限制返回的结果数量。
- `--min-score <n>`：过滤掉低分匹配项。
- `--json`：打印 JSON 结果。

`memory promote`：

预览并应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 将提升写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` -- 限制显示的候选项数量。
- `--include-promoted` -- 包含先前周期中已提升的条目。

完整选项：

- 使用加权提升信号（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）对来自 `memory/YYYY-MM-DD.md` 的短期候选项排名。
- 使用来自记忆召回和每日摄取过程的短期信号，以及 light/REM 阶段强化信号。
- 启用 Dreaming 时，`memory-core` 会自动管理一个在后台运行完整扫描（`light -> REM -> deep`）的 cron 作业（无需手动 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：返回/应用的最大候选项数量。
- `--min-score <n>`：最低加权提升分数。
- `--min-recall-count <n>`：候选项所需的最低召回次数。
- `--min-unique-queries <n>`：候选项所需的最低不同查询次数。
- `--apply`：将选定候选项追加到 `MEMORY.md` 并标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选项。
- `--json`：打印 JSON 输出。

`memory promote-explain`：

解释特定提升候选项及其分数明细。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：要查找的候选项键、路径片段或代码片段片段。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的候选项。
- `--json`：打印 JSON 输出。

`memory rem-harness`：

预览 REM 反思、候选事实和 deep 提升输出，不写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的 deep 候选项。
- `--json`：打印 JSON 输出。

## Dreaming

Dreaming 是后台记忆整合系统，包含三个协作阶段：**light**（整理/暂存短期材料）、**deep**（将持久事实提升到 `MEMORY.md`），以及 **REM**（反思并呈现主题）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 在聊天中使用 `/dreaming on|off` 切换（或用 `/dreaming status` 检查）。
- Dreaming 按一个托管的扫描计划（`dreaming.frequency`）运行，并按顺序执行阶段：light、REM、deep。
- 只有 deep 阶段会将持久记忆写入 `MEMORY.md`。
- 人类可读的阶段输出和日记条目会写入 `DREAMS.md`（或现有的 `dreams.md`），并可选择在 `memory/dreaming/<phase>/YYYY-MM-DD.md` 中生成每阶段报告。
- 排名使用加权信号：召回频率、检索相关性、查询多样性、时间近因性、跨日整合，以及派生的概念丰富度。
- 提升在写入 `MEMORY.md` 前会重新读取实时每日笔记，因此已编辑或删除的短期片段不会从陈旧的召回存储快照中被提升。
- 除非传入 CLI 阈值覆盖项，否则定时和手动 `memory promote` 运行共享相同的 deep 阶段默认值。
- 自动运行会扇出到已配置的记忆工作区。

默认调度：

- **扫描频率**：`dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` 会打印每阶段详细信息（提供商、模型、来源、批处理活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果有效的主动记忆远程 API key 字段被配置为 SecretRefs，该命令会从活动 Gateway 网关快照解析这些值。如果 Gateway 网关不可用，命令会快速失败。
- Gateway 网关版本偏差说明：此命令路径需要支持 `secrets.resolve` 的 Gateway 网关；较旧的 Gateway 网关会返回未知方法错误。
- 使用 `dreaming.frequency` 调整定时扫描频率。除此之外，deep 提升策略是内部策略；当你需要一次性手动覆盖时，请在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 会从历史每日笔记预览有依据的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，不写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 会将可逆的有依据日记条目写入 `DREAMS.md`，供 UI 审查。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还会将有依据的持久候选项种入实时短期提升存储，以便正常的 deep 阶段对其排名。
- `memory rem-backfill --rollback` 会移除先前写入的有依据日记条目，`memory rem-backfill --rollback-short-term` 会移除先前暂存的有依据短期候选项。
- 请参阅 [Dreaming](/zh-CN/concepts/dreaming)，了解完整阶段说明和配置参考。

## 相关

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
