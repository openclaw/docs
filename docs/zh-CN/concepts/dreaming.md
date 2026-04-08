---
read_when:
    - 你希望记忆提升自动运行
    - 你希望了解每个 dreaming 阶段的作用
    - 你希望调整整合过程而不污染 `MEMORY.md`
summary: 带有浅度、深度和 REM 阶段以及 Dream Diary 的后台记忆整合
title: Dreaming（实验性）
x-i18n:
    generated_at: "2026-04-08T21:46:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1275e1eff91fd34af47f709b53a1f2746be9f68b0381db8585af4ea1ffa15434
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（实验性）

Dreaming 是 `memory-core` 中的后台记忆整合系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时
让整个过程保持可解释且可审查。

Dreaming 为**选择启用**功能，默认禁用。

## dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| 浅度 | 对近期短期材料进行整理和暂存 | 否 |
| 深度  | 对持久候选项进行评分和提升 | 是（`MEMORY.md`） |
| REM   | 反思主题和重复出现的想法 | 否 |

这些阶段是内部实现细节，而不是单独的用户可配置
“模式”。

### 浅度阶段

浅度阶段会摄取最近的每日记忆信号和召回轨迹，对其去重，
并暂存候选条目。

- 从短期召回状态、最近的每日记忆文件以及可用时经过脱敏处理的会话转录中读取。
- 当存储包含内联输出时，会写入受管理的 `## Light Sleep` 区块。
- 记录强化信号，供后续深度排序使用。
- 绝不会写入 `MEMORY.md`。

### 深度阶段

深度阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 要求通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 写入前会从实时每日文件中重新获取片段，因此陈旧或已删除的片段会被跳过。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 根据近期短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，会写入受管理的 `## REM Sleep` 区块。
- 记录供深度排序使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将经过脱敏处理的会话转录摄取到 dreaming 语料中。当
转录可用时，它们会与每日记忆信号和召回轨迹一起被送入浅度
阶段。个人和敏感内容会在摄取前进行脱敏处理。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事式的 **Dream Diary**。
每个阶段积累了足够材料后，`memory-core` 会运行一次尽力而为的后台
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记用于在 Dreams UI 中供人阅读，而不是作为提升来源。

此外，还有一条基于事实的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可从历史 `YYYY-MM-DD.md` 备注中预览基于事实的日记输出。
- `memory rem-backfill --path ...` 会将可逆的、基于事实的日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将基于事实的持久候选项暂存到与常规深度阶段已使用的同一短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会触碰普通日记条目或实时短期召回。

Control UI 公开了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定这些基于事实的候选项是否值得提升。

## 深度排序信号

深度排序使用六个加权基础信号，再加上阶段强化：

| 信号 | 权重 | 说明 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24   | 条目累积了多少短期信号 |
| 相关性 | 0.30   | 条目的平均检索质量 |
| 查询多样性 | 0.15   | 让它浮现出来的不同查询/日期上下文 |
| 时效性 | 0.15   | 带时间衰减的新鲜度评分 |
| 整合度 | 0.10   | 跨日重复出现的强度 |
| 概念丰富度 | 0.06   | 来自片段/路径的概念标签密度 |

浅度和 REM 阶段命中会从
`memory/.dreams/phase-signals.json` 中增加一个带轻微时效衰减的提升值。

## 调度

启用后，`memory-core` 会自动管理一个 cron 任务，用于执行完整的 dreaming
扫描。每次扫描都会按顺序运行各阶段：浅度 -> REM -> 深度。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 快速开始

启用 dreaming：

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

使用自定义扫描频率启用 dreaming：

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

手动 `memory promote` 默认使用深度阶段阈值，除非通过
CLI 标志覆盖。

解释为什么某个特定候选项会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

在不写入任何内容的情况下，预览 REM 反思、候选事实和深度提升输出：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键名 | 默认值 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为都是内部实现
细节（不是面向用户的配置）。

完整键名列表请参见 [Memory configuration reference](/zh-CN/reference/memory-config#dreaming-experimental)。

## Dreams UI

启用后，Gateway 网关的 **Dreams** 选项卡会显示：

- 当前 dreaming 启用状态
- 阶段级状态和受管理扫描的存在情况
- 短期、长期以及今日已提升的数量
- 下一次计划运行时间
- 一个可展开的 Dream Diary 阅读器，由 `doctor.memory.dreamDiary` 提供支持

## 相关内容

- [Memory](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/zh-CN/reference/memory-config)
