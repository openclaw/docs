---
read_when:
    - 你想要索引或搜索语义记忆。
    - 你正在调试记忆可用性或索引问题。
    - 你想将回忆出的短期记忆提升到 `MEMORY.md` 中。
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness）'
title: 记忆
x-i18n:
    generated_at: "2026-04-23T06:17:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ea7aa2858b18cc6daa6531c45c9e838015b84de1c7a1b88716f2b1323e419c
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

管理语义记忆的索引与搜索。
由当前激活的记忆插件提供（默认：`memory-core`；将 `plugins.slots.memory = "none"` 设为禁用）。

相关内容：

- 记忆概念：[记忆](/zh-CN/concepts/memory)
- 记忆 wiki：[Memory Wiki](/zh-CN/plugins/memory-wiki)
- wiki CLI：[wiki](/zh-CN/cli/wiki)
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

- `--agent <id>`：限定到单个智能体。不传时，这些命令会对每个已配置的智能体运行；如果未配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测向量 + 嵌入可用性。
- `--index`：如果存储处于脏状态，则执行重新索引（隐含 `--deep`）。
- `--fix`：修复过期的 recall 锁并规范化提升元数据。
- `--json`：输出 JSON。

`memory index`：

- `--force`：强制执行完整重新索引。

`memory search`：

- 查询输入：可传位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，则以 `--query` 为准。
- 如果两者都未提供，命令会报错退出。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--max-results <n>`：限制返回结果数量。
- `--min-score <n>`：过滤低分匹配结果。
- `--json`：输出 JSON 结果。

`memory promote`：

预览并应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 将提升内容写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` -- 限制显示的候选数量。
- `--include-promoted` -- 包含之前周期中已提升的条目。

完整选项：

- 使用加权提升信号（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）对来自 `memory/YYYY-MM-DD.md` 的短期候选进行排序。
- 使用来自记忆回忆和每日摄取流程的短期信号，以及 light/REM 阶段的强化信号。
- 启用 Dreaming 时，`memory-core` 会自动管理一个 cron 任务，在后台运行完整流程（`light -> REM -> deep`）（无需手动执行 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：返回/应用的最大候选数。
- `--min-score <n>`：最小加权提升分数。
- `--min-recall-count <n>`：候选项所需的最小回忆次数。
- `--min-unique-queries <n>`：候选项所需的最小不同查询数。
- `--apply`：将选中的候选追加到 `MEMORY.md`，并标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选。
- `--json`：输出 JSON。

`memory promote-explain`：

解释特定提升候选及其分数明细。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：用于查找的候选键、路径片段或片段内容。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的候选。
- `--json`：输出 JSON。

`memory rem-harness`：

预览 REM 反思、候选事实和 deep 提升输出，不会写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的 deep 候选。
- `--json`：输出 JSON。

## Dreaming

Dreaming 是后台记忆整合系统，由三个协作阶段组成：
**light**（整理/暂存短期材料）、**deep**（将持久事实提升到 `MEMORY.md` 中）和 **REM**（反思并呈现主题）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 可在聊天中通过 `/dreaming on|off` 切换（或使用 `/dreaming status` 查看状态）。
- Dreaming 按一个受管的完整流程计划（`dreaming.frequency`）运行，并按顺序执行各阶段：light、REM、deep。
- 只有 deep 阶段会将持久记忆写入 `MEMORY.md`。
- 人类可读的阶段输出和日记条目会写入 `DREAMS.md`（或现有的 `dreams.md`），并可选择将每阶段报告写入 `memory/dreaming/<phase>/YYYY-MM-DD.md`。
- 排名使用加权信号：回忆频率、检索相关性、查询多样性、时间新近性、跨日整合程度以及派生概念丰富度。
- 提升在写入 `MEMORY.md` 前会重新读取实时每日笔记，因此已编辑或删除的短期片段不会基于过期的 recall-store 快照被提升。
- 计划任务和手动 `memory promote` 运行共享相同的 deep 阶段默认值，除非你传入 CLI 阈值覆盖。
- 自动运行会在已配置的记忆工作区之间展开执行。

默认调度：

- **完整流程频率**：`dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` 会打印各阶段细节（提供商、模型、来源、批处理活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果实际生效的记忆远程 API 密钥字段被配置为 SecretRef，该命令会从当前激活的 Gateway 网关快照中解析这些值。如果 Gateway 网关不可用，命令会快速失败。
- Gateway 网关版本偏差说明：此命令路径要求 Gateway 网关支持 `secrets.resolve`；旧版 Gateway 网关会返回 unknown-method 错误。
- 使用 `dreaming.frequency` 调整计划完整流程频率。Deep 提升策略本身属于内部逻辑；当你需要一次性手动覆盖时，请在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 会从历史每日笔记中预览有依据的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，不会写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 会将可回滚的有依据日记条目写入 `DREAMS.md` 以供 UI 审查。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还会将有依据的持久候选植入实时短期提升存储，以便正常 deep 阶段进行排序。
- `memory rem-backfill --rollback` 会移除先前写入的有依据日记条目，而 `memory rem-backfill --rollback-short-term` 会移除先前暂存的有依据短期候选。
- 完整的阶段说明和配置参考，请参见 [Dreaming](/zh-CN/concepts/dreaming)。
