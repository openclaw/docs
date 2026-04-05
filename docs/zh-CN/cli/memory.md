---
read_when:
    - 你想索引或搜索语义记忆
    - 你正在调试记忆可用性或索引
    - 你想将召回的短期记忆提升到 `MEMORY.md` 中
summary: '`openclaw memory` 的 CLI 参考（status/index/search/promote）'
title: memory
x-i18n:
    generated_at: "2026-04-05T08:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

管理语义记忆索引和搜索。
由当前启用的 memory 插件提供（默认：`memory-core`；设置 `plugins.slots.memory = "none"` 可禁用）。

相关内容：

- 记忆概念：[Memory](/concepts/memory)
- 插件：[插件](/tools/plugin)

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
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 选项

`memory status` 和 `memory index`：

- `--agent <id>`：限定到单个智能体。如果未提供，此类命令会对每个已配置的智能体运行；如果未配置智能体列表，则回退到默认智能体。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测向量 + embedding 可用性。
- `--index`：如果存储已脏，则运行重新索引（隐含 `--deep`）。
- `--fix`：修复过期的 recall 锁并规范化提升元数据。
- `--json`：输出 JSON。

`memory index`：

- `--force`：强制执行完整重新索引。

`memory search`：

- 查询输入：可传位置参数 `[query]`，或使用 `--query <text>`。
- 如果两者都提供，`--query` 优先。
- 如果两者都未提供，命令会报错退出。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--max-results <n>`：限制返回结果数量。
- `--min-score <n>`：过滤低分匹配项。
- `--json`：输出 JSON 结果。

`memory promote`：

预览并应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 将提升内容写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` -- 限制显示的候选数量。
- `--include-promoted` -- 包含先前周期中已提升的条目。

完整选项：

- 使用加权召回信号（`frequency`、`relevance`、`query diversity`、`recency`）对来自 `memory/YYYY-MM-DD.md` 的短期候选项进行排序。
- 使用在 `memory_search` 返回每日记忆命中时捕获的召回事件。
- 可选的自动 dreaming 模式：当 `plugins.entries.memory-core.config.dreaming.mode` 为 `core`、`deep` 或 `rem` 时，`memory-core` 会自动管理一个 cron 任务，在后台触发提升（无需手动运行 `openclaw cron add`）。
- `--agent <id>`：限定到单个智能体（默认：默认智能体）。
- `--limit <n>`：返回/应用的最大候选数量。
- `--min-score <n>`：最小加权提升分数。
- `--min-recall-count <n>`：候选项所需的最小召回次数。
- `--min-unique-queries <n>`：候选项所需的最小不同查询数。
- `--apply`：将选定候选项追加到 `MEMORY.md` 并将其标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选项。
- `--json`：输出 JSON。

## Dreaming（实验性）

Dreaming 是针对记忆的夜间反思过程。之所以称为 “dreaming”，是因为系统会重新查看当天被召回的内容，并决定哪些值得长期保留。

- 这是可选启用功能，默认关闭。
- 通过 `plugins.entries.memory-core.config.dreaming.mode` 启用。
- 你可以在聊天中通过 `/dreaming off|core|rem|deep` 切换模式。运行 `/dreaming`（或 `/dreaming options`）可查看每种模式的作用。
- 启用后，`memory-core` 会自动创建并维护一个受管 cron 任务。
- 如果你希望启用 dreaming，但实际上暂停自动提升，可将 `dreaming.limit` 设为 `0`。
- 排名使用加权信号：召回频率、检索相关性、查询多样性和时间新近性（最近召回会随时间衰减）。
- 只有在达到质量阈值时，才会提升到 `MEMORY.md`，这样长期记忆才能保持高信号，而不是积累一次性细节。

默认模式预设：

- `core`：每天 `0 3 * * *`，`minScore=0.75`，`minRecallCount=3`，`minUniqueQueries=2`
- `deep`：每 12 小时一次（`0 */12 * * *`），`minScore=0.8`，`minRecallCount=3`，`minUniqueQueries=3`
- `rem`：每 6 小时一次（`0 */6 * * *`），`minScore=0.85`，`minRecallCount=4`，`minUniqueQueries=3`

示例：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

说明：

- `memory index --verbose` 会输出每个阶段的详细信息（provider、model、sources、批处理活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果实际生效的活跃 memory 远程 API 密钥字段配置为 SecretRef，命令会从当前活跃的 Gateway 网关快照中解析这些值。如果 Gateway 网关不可用，命令会快速失败。
- Gateway 网关版本不匹配说明：此命令路径要求 Gateway 网关支持 `secrets.resolve`；较旧版本的 Gateway 网关会返回 unknown-method 错误。
- Dreaming 频率默认使用各模式的预设计划。你可以使用 `plugins.entries.memory-core.config.dreaming.frequency` 以 cron 表达式（例如 `0 3 * * *`）覆盖频率，并通过 `timezone`、`limit`、`minScore`、`minRecallCount` 和 `minUniqueQueries` 进行微调。
