---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你希望在不污染 `MEMORY.md` 的情况下调整巩固过程
summary: 通过浅睡、深睡和 REM 阶段进行后台记忆巩固，并配有梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T05:28:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming 是 `memory-core` 中的后台记忆巩固系统。  
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时让整个过程保持可解释且可审查。

Dreaming 是**可选启用**的，默认关闭。

## Dreaming 会写入什么

Dreaming 保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 用途 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| 浅睡 | 对近期短期材料进行分类和暂存 | 否 |
| 深睡 | 对持久候选项进行评分并提升 | 是（`MEMORY.md`） |
| REM | 对主题和反复出现的想法进行反思 | 否 |

这些阶段是内部实现细节，而不是单独的、由用户配置的“模式”。

### 浅睡阶段

浅睡阶段会摄取近期的每日记忆信号和召回轨迹，对其去重，并暂存候选行。

- 在可用时，从短期召回状态、近期每日记忆文件以及已脱敏的会话转录中读取。
- 当存储包含内联输出时，写入一个受管理的 `## Light Sleep` 区块。
- 记录强化信号，以供后续深度排序使用。
- 绝不会写入 `MEMORY.md`。

### 深睡阶段

深睡阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 要求通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 在写入前，会从当前每日文件中重新提取片段，因此过时或已删除的片段会被跳过。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选地写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 根据近期短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，写入一个受管理的 `## REM Sleep` 区块。
- 记录供深度排序使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将已脱敏的会话转录摄取到 Dreaming 语料中。当转录可用时，它们会与每日记忆信号和召回轨迹一起输入浅睡阶段。在摄取之前，个人和敏感内容会被脱敏处理。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中维护一个叙事性的 **Dream Diary**。  
每当某个阶段积累了足够的材料后，`memory-core` 都会尽力运行一次后台子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记是供人类在 Dreams UI 中阅读的，不是提升来源。  
Dreaming 生成的日记/报告产物会被排除在短期提升之外。只有有依据的记忆片段才有资格提升到 `MEMORY.md` 中。

此外，还提供了一条基于事实依据的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可从历史 `YYYY-MM-DD.md` 笔记中预览基于事实依据的日记输出。
- `memory rem-backfill --path ...` 会将可逆的、基于事实依据的日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将基于事实依据的持久候选项暂存到与常规深睡阶段相同的短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会影响普通日记条目或实时短期召回。

Control UI 公开了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定这些基于事实依据的候选项是否值得提升。该场景还会显示一条独立的 grounded 通道，这样你就可以看到哪些暂存的短期条目来自历史回放、哪些提升项由 grounded 引导而来，并且可以只清除仅 grounded 的暂存条目，而不影响普通的实时短期状态。

## 深度排序信号

深度排序使用六个带权重的基础信号，再加上阶段强化：

| 信号 | 权重 | 描述 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24 | 该条目累计了多少短期信号 |
| 相关性 | 0.30 | 该条目的平均检索质量 |
| 查询多样性 | 0.15 | 使其浮现出来的不同查询/日期上下文 |
| 新近度 | 0.15 | 带时间衰减的新鲜度分数 |
| 巩固度 | 0.10 | 跨多天重复出现的强度 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度 |

浅睡和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个小幅、带新近度衰减的加成。

## 调度

启用后，`memory-core` 会自动管理一个 cron 任务，用于执行完整的 Dreaming 扫描。每次扫描会按顺序运行各阶段：浅睡 -> REM -> 深睡。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 快速开始

启用 Dreaming：

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

使用自定义扫描频率启用 Dreaming：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## 斜杠命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流

使用 CLI 提升进行预览或手动应用：

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手动 `memory promote` 默认使用深睡阶段阈值，除非通过 CLI 标志覆盖。

解释某个特定候选项为什么会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

在不写入任何内容的情况下，预览 REM 反思、候选事实以及深睡提升输出：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键 | 默认值 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为属于内部实现细节（不是面向用户的配置）。

完整键列表请参阅 [Memory configuration reference](/zh-CN/reference/memory-config#dreaming)。

## Dreams UI

启用后，Gateway 网关中的 **Dreams** 选项卡会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管理扫描是否存在
- 短期、grounded、信号以及当日已提升计数
- 下次计划运行时间
- 一条用于暂存历史回放条目的独立 grounded 场景通道
- 一个可展开的 Dream Diary 阅读器，由 `doctor.memory.dreamDiary` 提供支持

## 相关内容

- [Memory](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/zh-CN/cli/memory)
- [Memory configuration reference](/zh-CN/reference/memory-config)
