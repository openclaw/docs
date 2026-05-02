---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想调优整合过程，同时避免污染 MEMORY.md
sidebarTitle: Dreaming
summary: 后台记忆巩固，包含浅层、深层和 REM 阶段，并提供梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:49:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的后台记忆巩固系统。它帮助 OpenClaw 将强烈的短期信号转入持久记忆，同时让过程保持可解释、可审查。

<Note>
Dreaming 是**选择启用**的，并且默认禁用。
</Note>

## Dreaming 会写入什么

Dreaming 保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下可选的阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段  | 目的                       | 持久写入          |
| ----- | -------------------------- | ----------------- |
| Light | 排序并暂存近期短期材料     | 否                |
| Deep  | 评分并提升持久候选项       | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法   | 否                |

这些阶段是内部实现细节，不是单独由用户配置的“模式”。

<AccordionGroup>
  <Accordion title="Light phase">
    Light 阶段摄取近期每日记忆信号和召回轨迹，对它们去重，并暂存候选行。

    - 从短期召回状态、近期每日记忆文件，以及可用时经过脱敏的会话转录中读取。
    - 当存储包含内联输出时，写入一个托管的 `## Light Sleep` 块。
    - 记录强化信号，供之后的 Deep 排名使用。
    - 绝不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep phase">
    Deep 阶段决定哪些内容会成为长期记忆。

    - 使用加权评分和阈值门控对候选项排名。
    - 要求 `minScore`、`minRecallCount` 和 `minUniqueQueries` 通过。
    - 写入前从实时每日文件中重新取回片段，因此会跳过陈旧或已删除的片段。
    - 将提升后的条目追加到 `MEMORY.md`。
    - 向 `DREAMS.md` 写入 `## Deep Sleep` 摘要，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM phase">
    REM 阶段提取模式和反思信号。

    - 基于近期短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入一个托管的 `## REM Sleep` 块。
    - 记录 Deep 排名使用的 REM 强化信号。
    - 绝不写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将经过脱敏的会话转录摄取到 Dreaming 语料库中。当转录可用时，它们会与每日记忆信号和召回轨迹一起送入 Light 阶段。个人内容和敏感内容会在摄取前脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的 **Dream Diary**。每个阶段积累了足够材料后，`memory-core` 会运行一次尽力而为的后台子智能体轮次，并追加一条简短的日记条目。除非配置了 `dreaming.model`，否则它使用默认运行时模型。如果配置的模型不可用，Dream Diary 会使用会话默认模型重试一次。

<Note>
这份日记用于 Dreams UI 中的人类阅读，不是提升来源。Dreaming 生成的日记/报告工件会被排除在短期提升之外。只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

还有一条用于审查和恢复工作的、有依据历史回填通道：

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` 从历史 `YYYY-MM-DD.md` 笔记预览有依据的日记输出。
    - `memory rem-backfill --path ...` 将可逆的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 将有依据的持久候选项暂存到普通 Deep 阶段已经使用的同一个短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 移除这些已暂存的回填工件，而不触及普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 暴露了相同的日记回填/重置流程，因此你可以在 Dreams 场景中检查结果，再决定这些有依据的候选项是否值得提升。该场景还显示一条独立的有依据通道，因此你可以看到哪些已暂存短期条目来自历史重放、哪些已提升项由有依据内容主导，并且只清除仅有依据的已暂存条目，而不触及普通实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号以及阶段强化：

| 信号       | 权重 | 描述                             |
| ---------- | ---- | -------------------------------- |
| 频率       | 0.24 | 该条目累积了多少短期信号         |
| 相关性     | 0.30 | 该条目的平均检索质量             |
| 查询多样性 | 0.15 | 使其浮现的不同查询/日期上下文    |
| 近期性     | 0.15 | 按时间衰减的新鲜度分数           |
| 巩固度     | 0.10 | 多日重复出现的强度               |
| 概念丰富度 | 0.06 | 片段/路径中的概念标签密度        |

Light 和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个较小的、按近期性衰减的提升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 作业。每次扫描按顺序运行阶段：Light → REM → Deep。

扫描包括主运行时工作区和任何已配置的 Agent 工作区，并按路径去重，因此子智能体工作区扇出不会排除主智能体的 `DREAMS.md` 和记忆状态。

默认节奏行为：

| 设置                 | 默认值        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 默认模型      |

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
  <Tab title="自定义扫描节奏">
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

    手动 `memory promote` 默认使用 Deep 阶段阈值，除非通过 CLI 标志覆盖。

  </Tab>
  <Tab title="解释提升">
    解释为什么某个特定候选项会或不会被提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 预览">
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
  可选的 Dream Diary 子智能体模型覆盖。同时设置子智能体 `allowedModels` 允许列表时，请使用规范的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。要限制它，也请设置 `plugins.entries.memory-core.subagent.allowedModels`。信任或允许列表失败会保持可见，而不是静默回退；重试只覆盖模型不可用错误。
</Warning>

<Note>
阶段策略、阈值和存储行为是内部实现细节（不是面向用户的配置）。完整键列表请参阅[记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级 Status 和托管扫描存在状态
- 短期、有依据、信号以及今日已提升计数
- 下一次计划运行时间
- 一条用于已暂存历史重放条目的独立有依据场景通道
- 由 `doctor.memory.dreamDiary` 支撑的可展开 Dream Diary 阅读器

## Dreaming 从不运行：Status 显示被阻止

如果 `openclaw memory status` 报告 `Dreaming status: blocked`，说明托管 cron 存在，但默认智能体 Heartbeat 未触发。检查默认智能体是否启用了 Heartbeat，并且其目标不是 `none`，然后在下一个 Heartbeat 间隔后再次运行 `openclaw memory status --deep`。

## 相关

- [记忆](/zh-CN/concepts/memory)
- [Memory CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
