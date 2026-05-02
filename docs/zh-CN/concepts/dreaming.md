---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想调整整合过程，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 后台记忆整合，包含浅度、深度和 REM 阶段，以及梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T08:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时让这个过程可解释、可审查。

<Note>
Dreaming 是**选择启用**的，默认禁用。
</Note>

## Dreaming 写入什么

Dreaming 保留两类输出：

- **机器状态**位于 `memory/.dreams/`（召回存储、阶段信号、摄取检查点、锁）。
- **人类可读输出**位于 `DREAMS.md`（或现有的 `dreams.md`）以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段  | 目的                         | 持久写入          |
| ----- | ---------------------------- | ----------------- |
| Light | 整理并暂存近期短期材料       | 否                |
| Deep  | 评分并提升持久候选项         | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法     | 否                |

这些阶段是内部实现细节，而不是单独由用户配置的“模式”。

<AccordionGroup>
  <Accordion title="Light phase">
    Light 阶段会摄取近期每日记忆信号和召回轨迹，对它们去重，并暂存候选行。

    - 从短期召回状态、近期每日记忆文件以及可用时经过脱敏的会话转录中读取。
    - 当存储包含内联输出时，写入受管理的 `## Light Sleep` 块。
    - 记录用于后续 Deep 排名的强化信号。
    - 永远不会写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep phase">
    Deep 阶段决定哪些内容会成为长期记忆。

    - 使用加权评分和阈值门槛对候选项排名。
    - 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 写入前会从实时每日文件中重新加载片段，因此会跳过过时或已删除的片段。
    - 将提升后的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM phase">
    REM 阶段提取模式和反思信号。

    - 根据近期短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入受管理的 `## REM Sleep` 块。
    - 记录 Deep 排名使用的 REM 强化信号。
    - 永远不会写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将经过脱敏的会话转录摄取到 Dreaming 语料库中。当转录可用时，它们会与每日记忆信号和召回轨迹一起送入 Light 阶段。个人内容和敏感内容会在摄取前脱敏。

## 梦境日记

Dreaming 还会在 `DREAMS.md` 中保留叙事性的**梦境日记**。每个阶段拥有足够材料后，`memory-core` 会运行一次尽力而为的后台子智能体回合，并追加一条简短日记。除非配置了 `dreaming.model`，否则它使用默认运行时模型。如果配置的模型不可用，梦境日记会使用会话默认模型重试一次。

<Note>
这份日记供人类在 Dreams UI 中阅读，不是提升来源。Dreaming 生成的日记/报告产物会被排除在短期提升之外。只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

还有一个用于审查和恢复工作的、有依据的历史回填通道：

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` 从历史 `YYYY-MM-DD.md` 笔记中预览有依据的日记输出。
    - `memory rem-backfill --path ...` 将可回滚的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 将有依据的持久候选项暂存到普通 Deep 阶段已经使用的同一个短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 移除这些暂存的回填产物，而不会触碰普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 暴露了相同的日记回填/重置流程，因此你可以在 Dreams 场景中检查结果，再决定有依据的候选项是否值得提升。该场景还会显示一条独立的有依据通道，让你看到哪些暂存的短期条目来自历史重放、哪些已提升项由有依据内容引导，并且可以只清除仅有依据的暂存条目，而不触碰普通实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号以及阶段强化：

| 信号     | 权重 | 描述                               |
| -------- | ---- | ---------------------------------- |
| 频率     | 0.24 | 条目累积了多少短期信号             |
| 相关性   | 0.30 | 条目的平均检索质量                 |
| 查询多样性 | 0.15 | 使其浮现的不同查询/日期上下文      |
| 近因性   | 0.15 | 随时间衰减的新鲜度分数             |
| 整合度   | 0.10 | 多日重复出现的强度                 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度        |

Light 和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个小的、随近因性衰减的增强。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 任务。每次扫描都会按顺序运行各阶段：Light → REM → Deep。

扫描包括主运行时工作区以及任何已配置的 agent 工作区，并按路径去重，因此子智能体工作区扇出不会排除主 agent 的 `DREAMS.md` 和记忆状态。

默认节奏行为：

| 设置                 | 默认值        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 默认模型      |

## 快速开始

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手动 `memory promote` 默认使用 Deep 阶段阈值，除非通过 CLI 标志覆盖。

  </Tab>
  <Tab title="Explain promotion">
    解释为什么某个特定候选项会或不会提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    预览 REM 反思、候选事实和 Deep 提升输出，而不写入任何内容：

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
  完整 Dreaming 扫描的 cron 节奏。
</ParamField>
<ParamField path="model" type="string">
  可选的梦境日记子智能体模型覆盖。若同时设置子智能体 `allowedModels` 允许列表，请使用规范的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，还要设置 `plugins.entries.memory-core.subagent.allowedModels`。信任或允许列表失败会保持可见，而不是静默回退；重试只覆盖模型不可用错误。
</Warning>

<Note>
阶段策略、阈值和存储行为是内部实现细节（不是面向用户的配置）。完整键列表请参阅 [Memory 配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级 Status 和受管理扫描是否存在
- 短期、有依据、信号以及今日已提升计数
- 下次计划运行时间
- 用于暂存历史重放条目的独立有依据场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开梦境日记阅读器

## 相关

- [记忆](/zh-CN/concepts/memory)
- [Memory CLI](/zh-CN/cli/memory)
- [Memory 配置参考](/zh-CN/reference/memory-config)
- [Memory 搜索](/zh-CN/concepts/memory-search)
