---
read_when:
    - 你想索引或搜索语义记忆
    - 你正在调试内存可用性或索引
    - 你想要将召回的短期记忆提升为 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness）'
title: 记忆
x-i18n:
    generated_at: "2026-06-30T13:46:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理语义记忆索引和搜索。
由内置的 `memory-core` 插件提供。当 `plugins.slots.memory` 选择 `memory-core`（默认）时，该命令可用；其他记忆插件会公开自己的 CLI 命名空间。

相关内容：

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

- `--agent <id>`：限定到单个智能体。如果不传入，这些命令会为每个已配置的智能体运行；如果没有配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测本地向量存储就绪状态、嵌入提供商就绪状态，以及语义向量搜索就绪状态。普通 `memory status` 会保持快速，不运行实时嵌入或提供商发现工作；未知的向量存储或语义向量状态表示该命令没有探测它。QMD 词法 `searchMode: "search"` 即使配合 `--deep` 也会跳过语义向量探测和嵌入维护。
- `--index`：如果存储处于脏状态，则运行重新索引（隐含 `--deep`）。
- `--fix`：修复过期的召回锁并规范化提升元数据。
- `--json`：打印 JSON 输出。

如果 `memory status` 显示 `Dreaming status: blocked`，表示托管的 Dreaming cron 已启用，但驱动它的 heartbeat 没有为默认智能体触发。两个常见原因见 [Dreaming never runs](/zh-CN/concepts/dreaming#dreaming-never-runs-status-shows-blocked)。

`memory index`：

- `--force`：强制完整重新索引。

`memory search`：

- 查询输入：传入位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，`--query` 优先。
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
- `--include-promoted` -- 包含已在先前周期中提升的条目。

完整选项：

- 使用加权提升信号（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）对来自 `memory/YYYY-MM-DD.md` 的短期候选进行排序。
- 使用来自记忆召回和每日摄取过程的短期信号，并加上 light/REM 阶段强化信号。
- 启用 Dreaming 时，`memory-core` 会自动管理一个 cron 作业，在后台运行完整扫描（`light -> REM -> deep`）（无需手动 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：要返回/应用的最大候选数量。
- `--min-score <n>`：最低加权提升分数。
- `--min-recall-count <n>`：候选所需的最低召回次数。
- `--min-unique-queries <n>`：候选所需的最低不同查询数。
- `--apply`：将选定候选追加到 `MEMORY.md`，并将其标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory promote-explain`：

解释特定提升候选及其分数明细。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：要查找的候选键、路径片段或片段内容。
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

Dreaming 是后台记忆整合系统，包含三个协作阶段：**light**（整理/暂存短期材料）、**deep**（将持久事实提升到 `MEMORY.md`），以及 **REM**（反思并浮现主题）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 在聊天中使用 `/dreaming on|off` 切换（或使用 `/dreaming status` 查看）。
  频道调用方必须是所有者才能更改该设置；Gateway 网关客户端需要 `operator.admin`。只读状态和帮助仍对授权的命令发送方可用。
- Dreaming 按一个托管扫描计划（`dreaming.frequency`）运行，并按顺序执行各阶段：light、REM、deep。
- 只有 deep 阶段会将持久记忆写入 `MEMORY.md`。
- 人类可读的阶段输出和日记条目会写入 `DREAMS.md`（或现有的 `dreams.md`），可选的逐阶段报告会写入 `memory/dreaming/<phase>/YYYY-MM-DD.md`。
- 排名使用加权信号：召回频率、检索相关性、查询多样性、时间近因、跨日整合，以及派生的概念丰富度。
- 提升在写入 `MEMORY.md` 前会重新读取实时每日笔记，因此已编辑或删除的短期片段不会从过期的召回存储快照中被提升。
- 除非传入 CLI 阈值覆盖项，否则定时和手动 `memory promote` 运行共享相同的 deep 阶段默认值。
- 自动运行会分发到已配置的记忆工作区。

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

- `memory index --verbose` 会打印逐阶段细节（提供商、模型、来源、批处理活动）。
- `memory status` 会包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果有效的主动记忆远程 API key 字段配置为 SecretRefs，该命令会从活动 Gateway 网关快照中解析这些值。如果 Gateway 网关不可用，该命令会快速失败。
- Gateway 网关版本偏差说明：此命令路径需要支持 `secrets.resolve` 的 Gateway 网关；较旧的 Gateway 网关会返回未知方法错误。
- 使用 `dreaming.frequency` 调整定时扫描节奏。除此之外，deep 提升策略是内部策略，只有 `dreaming.phases.deep.maxPromotedSnippetTokens` 例外，它会限制提升片段长度，同时保持来源可见。当你需要一次性手动阈值覆盖时，请在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 会从历史每日笔记中预览有依据的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，不写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 会将可回滚、有依据的日记条目写入 `DREAMS.md`，供 UI 审查。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还会将有依据的持久候选播种到实时短期提升存储中，让常规 deep 阶段可以对它们排序。
- `memory rem-backfill --rollback` 会移除先前写入的有依据日记条目，`memory rem-backfill --rollback-short-term` 会移除先前暂存的有依据短期候选。
- 完整阶段说明和配置参考见 [Dreaming](/zh-CN/concepts/dreaming)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
