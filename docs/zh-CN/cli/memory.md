---
read_when:
    - 你想要索引或搜索语义记忆
    - 你正在调试记忆可用性或索引问题
    - 你想要将回忆出的短期记忆提升到 `MEMORY.md` 中
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote/promote-explain/rem-harness）'
title: 内存
x-i18n:
    generated_at: "2026-04-27T13:13:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

管理语义记忆的索引和搜索。  
由当前激活的记忆插件提供（默认：`memory-core`；设置 `plugins.slots.memory = "none"` 可禁用）。

相关内容：

- Memory 概念：[内存](/zh-CN/concepts/memory)
- Memory wiki：[Memory Wiki](/zh-CN/plugins/memory-wiki)
- wiki CLI：[wiki](/zh-CN/cli/wiki)
- 插件：[Plugins](/zh-CN/tools/plugin)

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

- `--agent <id>`：限定到单个智能体。不带此参数时，这些命令会对每个已配置的智能体运行；如果未配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测向量和嵌入可用性。普通的 `memory status` 保持快速，不会执行实时嵌入 ping。QMD 词法 `searchMode: "search"` 即使带有 `--deep`，也会跳过语义向量探测和嵌入维护。
- `--index`：如果存储已脏，则运行重新索引（隐含 `--deep`）。
- `--fix`：修复过期的 recall 锁并规范化提升元数据。
- `--json`：打印 JSON 输出。

如果 `memory status` 显示 `Dreaming status: blocked`，表示托管的 dreaming cron 已启用，但驱动它的心跳没有为默认智能体触发。两种常见原因请参见 [Dreaming 从不运行](/zh-CN/concepts/dreaming#dreaming-never-runs-status-shows-blocked)。

`memory index`：

- `--force`：强制完整重新索引。

`memory search`：

- 查询输入：可传位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，则 `--query` 优先。
- 如果两者都未提供，命令会以错误退出。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--max-results <n>`：限制返回结果数量。
- `--min-score <n>`：过滤低分匹配项。
- `--json`：打印 JSON 结果。

`memory promote`：

预览并应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 将提升内容写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` -- 限制显示的候选数量。
- `--include-promoted` -- 包含在之前周期中已提升的条目。

完整选项：

- 使用加权提升信号（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）对来自 `memory/YYYY-MM-DD.md` 的短期候选进行排序。
- 同时使用来自记忆召回和每日摄取流程的短期信号，以及 light/REM 阶段的强化信号。
- 启用 dreaming 后，`memory-core` 会自动管理一个 cron 任务，在后台运行完整扫过（`light -> REM -> deep`）（无需手动执行 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：返回/应用的最大候选数。
- `--min-score <n>`：最低加权提升分数。
- `--min-recall-count <n>`：候选所需的最小召回次数。
- `--min-unique-queries <n>`：候选所需的最小不同查询数。
- `--apply`：将选中的候选追加到 `MEMORY.md` 并标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory promote-explain`：

解释特定提升候选及其分数拆解。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：用于查找的候选键、路径片段或内容片段。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory rem-harness`：

预览 REM 反思、候选事实和 deep 提升输出，不会写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--include-promoted`：包含已提升的 deep 候选。
- `--json`：打印 JSON 输出。

## Dreaming

Dreaming 是后台记忆整合系统，由三个协作阶段组成：**light**（整理/暂存短期材料）、**deep**（将持久事实提升到 `MEMORY.md`）、以及 **REM**（反思并提炼主题）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 可在聊天中通过 `/dreaming on|off` 切换（或用 `/dreaming status` 查看状态）。
- Dreaming 按一个托管的扫过计划（`dreaming.frequency`）运行，并按顺序执行各阶段：light、REM、deep。
- 只有 deep 阶段会将持久记忆写入 `MEMORY.md`。
- 面向人的阶段输出和日记条目会写入 `DREAMS.md`（或现有的 `dreams.md`），也可选择将各阶段报告写入 `memory/dreaming/<phase>/YYYY-MM-DD.md`。
- 排名使用加权信号：召回频率、检索相关性、查询多样性、时间新近性、跨日整合以及衍生概念丰富度。
- 提升前会重新读取实时每日笔记，再写入 `MEMORY.md`，因此已编辑或删除的短期片段不会因过期的 recall 存储快照而被提升。
- 定时和手动 `memory promote` 运行共享相同的 deep 阶段默认值，除非你通过 CLI 传入阈值覆盖参数。
- 自动运行会在已配置的记忆工作区之间扇出执行。

默认调度：

- **扫过频率**：`dreaming.frequency = 0 3 * * *`
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

注意：

- `memory index --verbose` 会打印每个阶段的详细信息（提供商、模型、来源、批处理活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的所有额外路径。
- 如果实际生效的 active memory remote API key 字段配置为 SecretRef，命令会从当前激活的 Gateway 网关快照中解析这些值。如果 Gateway 网关不可用，命令会快速失败。
- Gateway 网关版本偏差说明：此命令路径要求 Gateway 网关支持 `secrets.resolve`；较旧的 Gateway 网关会返回 unknown-method 错误。
- 可用 `dreaming.frequency` 调整定时扫过频率。deep 提升策略本身仍为内部实现；如需一次性手动覆盖，请在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 会基于历史每日笔记，预览有据可依的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，且不会写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 会将可逆的、有据可依的日记条目写入 `DREAMS.md` 以供 UI 审阅。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还会将有据可依的持久候选植入实时短期提升存储，以便正常的 deep 阶段进行排序。
- `memory rem-backfill --rollback` 会移除先前写入的有据可依日记条目，而 `memory rem-backfill --rollback-short-term` 会移除先前暂存的有据可依短期候选。
- 完整阶段说明和配置参考请参见 [Dreaming](/zh-CN/concepts/dreaming)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [记忆概览](/zh-CN/concepts/memory)
