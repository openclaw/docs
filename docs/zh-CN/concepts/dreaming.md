---
read_when:
    - 你希望记忆提升能够自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想在不污染 `MEMORY.md` 的情况下调整整合过程
sidebarTitle: Dreaming
summary: 通过浅睡眠、深睡眠和 REM 阶段进行后台记忆整合，并配有梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-04-27T10:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 408a7b971db5e505d2fb2c02c4fb30d3644c5426bb2e042d1c7a6b3cbc92976c
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时让整个过程保持可解释且可审查。

<Note>
Dreaming 是**可选启用**功能，默认关闭。
</Note>

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下可选的阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| 浅睡眠 | 对近期短期材料进行分类和暂存 | 否 |
| 深睡眠 | 对持久候选项进行评分并提升 | 是（`MEMORY.md`） |
| REM | 对主题和反复出现的想法进行反思 | 否 |

这些阶段属于内部实现细节，而不是单独的、由用户配置的“模式”。

<AccordionGroup>
  <Accordion title="浅睡眠阶段">
    浅睡眠阶段会摄取最近的每日记忆信号和召回轨迹，对它们去重，并暂存候选条目。

    - 在可用时，从短期召回状态、最近的每日记忆文件以及已脱敏的会话转录中读取。
    - 当存储包含内联输出时，写入受控的 `## Light Sleep` 区块。
    - 记录强化信号，以供后续深度排序使用。
    - 绝不会写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深睡眠阶段">
    深睡眠阶段决定哪些内容会成为长期记忆。

    - 使用加权评分和阈值门槛对候选项进行排序。
    - 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 在写入前，会从实时的每日文件中重新提取片段，因此过时或已删除的片段会被跳过。
    - 将已提升的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    REM 阶段会提取模式和反思信号。

    - 根据最近的短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入受控的 `## REM Sleep` 区块。
    - 记录用于深度排序的 REM 强化信号。
    - 绝不会写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将已脱敏的会话转录摄取到 Dreaming 语料中。当转录可用时，它们会与每日记忆信号和召回轨迹一起输入到浅睡眠阶段。在摄取之前，个人和敏感内容会被脱敏处理。

## 梦境日记

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的**梦境日记**。每个阶段积累了足够材料后，`memory-core` 会尽力运行一次后台子智能体回合，并追加一则简短的日记条目。除非配置了 `dreaming.model`，否则它会使用默认运行时模型。

<Note>
这份日记是供人类在 Dreams UI 中阅读的，不是提升来源。Dreaming 生成的日记/报告产物会被排除在短期提升之外。只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

此外，还有一条基于事实依据的历史回填通道，用于审查和恢复工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 可预览来自历史 `YYYY-MM-DD.md` 笔记的、有依据的日记输出。
    - `memory rem-backfill --path ...` 会将可逆的、有依据的日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到与正常深睡眠阶段相同的短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会影响普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 提供了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定这些有依据的候选项是否值得提升。该场景还会显示一条独立的 grounded 通道，这样你可以看到哪些已暂存的短期条目来自历史重放、哪些已提升项目由 grounded 流程引导产生，并且可以只清除仅 grounded 的已暂存条目，而不影响普通的实时短期状态。

## 深度排序信号

深度排序使用六个加权基础信号以及阶段强化：

| 信号 | 权重 | 说明 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24 | 该条目累积了多少短期信号 |
| 相关性 | 0.30 | 该条目的平均检索质量 |
| 查询多样性 | 0.15 | 使其浮现的不同查询/日期上下文 |
| 时效性 | 0.15 | 带时间衰减的新鲜度评分 |
| 整合度 | 0.10 | 跨日重复出现的强度 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度 |

浅睡眠和 REM 阶段的命中会从 `memory/.dreams/phase-signals.json` 中增加一个带轻微时间衰减的提升值。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 任务。每次扫描会按顺序运行各个阶段：浅睡眠 → REM → 深睡眠。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | 默认模型 |

## 快速开始

<Tabs>
  <Tab title="启用 Dreaming">
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
  </Tab>
  <Tab title="自定义扫描频率">
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
  </Tab>
</Tabs>

## 斜杠命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流

<Tabs>
  <Tab title="提升预览 / 应用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手动执行 `memory promote` 默认使用深睡眠阶段的阈值，除非通过 CLI 标志覆盖。

  </Tab>
  <Tab title="解释提升">
    解释为什么某个特定候选项会或不会被提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 预览">
    预览 REM 反思、候选事实和深度提升输出，而不写入任何内容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  启用或禁用 Dreaming 扫描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 Dreaming 扫描的 cron 频率。
</ParamField>
<ParamField path="model" type="string">
  可选的梦境日记子智能体模型覆盖值。如果你同时设置了子智能体的 `allowedModels` 允许列表，请使用规范的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。如果要限制它，还请设置 `plugins.entries.memory-core.subagent.allowedModels`。
</Warning>

<Note>
阶段策略、阈值和存储行为都属于内部实现细节（不是面向用户的配置）。完整键名列表请参阅 [记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关的 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受控扫描是否存在
- 短期、grounded、信号和当日已提升数量
- 下一次计划运行时间
- 一条用于已暂存历史重放条目的独立 grounded 场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开梦境日记阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [Memory CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
