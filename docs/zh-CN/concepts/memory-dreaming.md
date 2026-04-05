---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解 dreaming 模式和阈值
    - 你想调整整合过程而不污染 `MEMORY.md`
summary: 将短期召回在后台提升为长期记忆
title: Dreaming（实验性）
x-i18n:
    generated_at: "2026-04-05T08:21:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming（实验性）

Dreaming 是 `memory-core` 中的后台记忆整合过程。

之所以称为 “dreaming”，是因为系统会重新查看白天出现过的内容，
并决定哪些值得保留为持久上下文。

Dreaming 是**实验性**、**需主动启用**且**默认关闭**的功能。

## Dreaming 的作用

1. 跟踪来自 `memory_search` 命中的短期召回事件，并记录到
   `memory/YYYY-MM-DD.md`。
2. 使用加权信号为这些召回候选项打分。
3. 仅将符合条件的候选项提升到 `MEMORY.md`。

这使长期记忆聚焦于持久、重复出现的上下文，而不是一次性细节。

## 提升信号

Dreaming 结合四种信号：

- **频率**：同一候选项被召回的频率。
- **相关性**：被检索到时的召回分数有多高。
- **查询多样性**：有多少不同的查询意图触发了它。
- **新近性**：对近期召回进行时间加权。

提升要求所有已配置的阈值门槛都通过，而不只是某一个信号达标。

### 信号权重

| 信号     | 权重 | 描述                         |
| -------- | ---- | ---------------------------- |
| 频率     | 0.35 | 同一条目被召回的频率         |
| 相关性   | 0.35 | 被检索到时的平均召回分数     |
| 多样性   | 0.15 | 触发它的不同查询意图数量     |
| 新近性   | 0.15 | 时间衰减（14 天半衰期）      |

## 工作原理

1. **召回跟踪** —— 每次 `memory_search` 命中都会记录到
   `memory/.dreams/short-term-recall.json`，其中包含召回次数、分数和查询
   hash。
2. **定时评分** —— 按配置的频率，对候选项使用加权信号进行排序。
   所有阈值门槛必须同时满足。
3. **提升** —— 符合条件的条目会连同提升时间戳一起追加到 `MEMORY.md`。
4. **清理** —— 已提升的条目会在后续周期中被过滤掉。文件锁可防止并发运行。

## 模式

`dreaming.mode` 控制频率和默认阈值：

| 模式   | 频率           | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | 已禁用         | --       | --             | --               |
| `core` | 每天凌晨 3 点  | 0.75     | 3              | 2                |
| `rem`  | 每 6 小时一次  | 0.85     | 4              | 3                |
| `deep` | 每 12 小时一次 | 0.80     | 3              | 3                |

## 调度模型

启用 dreaming 后，`memory-core` 会自动管理循环调度。
你无需为此功能手动创建 cron 任务。

你仍然可以通过显式覆盖来调整行为，例如：

- `dreaming.frequency`（cron 表达式）
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## 配置

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

## 聊天命令

可通过聊天切换模式并检查状态：

```
/dreaming core          # 切换到 core 模式（每晚）
/dreaming rem           # 切换到 rem 模式（每 6 小时）
/dreaming deep          # 切换到 deep 模式（每 12 小时）
/dreaming off           # 禁用 dreaming
/dreaming status        # 显示当前配置和频率
/dreaming help          # 显示模式指南
```

## CLI 命令

从命令行预览并应用提升：

```bash
# 预览提升候选项
openclaw memory promote

# 将提升内容应用到 MEMORY.md
openclaw memory promote --apply

# 限制预览数量
openclaw memory promote --limit 5

# 包含已提升条目
openclaw memory promote --include-promoted

# 检查 dreaming 状态
openclaw memory status --deep
```

完整标志参考请参见 [memory CLI](/cli/memory)。

## Dreams UI

启用 dreaming 后，Gateway 网关侧边栏会显示一个 **Dreams** 标签页，
其中包含记忆统计信息（短期数量、长期数量、已提升数量）以及下一次计划周期时间。

## 延伸阅读

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory 配置参考](/reference/memory-config)
