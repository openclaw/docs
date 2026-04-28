---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想调整整合行为，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 后台记忆整合，包含浅层、深层和 REM 阶段，并附带梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-04-28T11:49:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它帮助 OpenClaw 将强短期信号转入持久记忆，同时保持流程可解释、可审查。

<Note>
Dreaming 是**选择启用**的，默认禁用。
</Note>

## Dreaming 写入什么

Dreaming 保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的                                   | 持久写入     |
| ----- | ----------------------------------------- | ----------------- |
| Light | 对近期短期材料进行排序并暂存 | 否                |
| Deep  | 为持久候选项评分并提升      | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法     | 否                |

这些阶段是内部实现细节，不是单独由用户配置的“模式”。

<AccordionGroup>
  <Accordion title="Light phase">
    Light 阶段摄取近期每日记忆信号和召回轨迹，对它们去重，并暂存候选行。

    - 在可用时，从短期召回状态、近期每日记忆文件和已脱敏的会话转录读取。
    - 当存储包含内联输出时，写入托管的 `## Light Sleep` 块。
    - 记录强化信号，供后续深度排名使用。
    - 从不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep phase">
    Deep 阶段决定哪些内容会成为长期记忆。

    - 使用加权评分和阈值门槛对候选项排名。
    - 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 写入前从实时每日文件重新水合片段，因此会跳过过时或已删除的片段。
    - 将已提升的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选择写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM phase">
    REM 阶段提取模式和反思信号。

    - 根据近期短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入托管的 `## REM Sleep` 块。
    - 记录 Deep 排名使用的 REM 强化信号。
    - 从不写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将已脱敏的会话转录摄取到 Dreaming 语料库中。转录可用时，会与每日记忆信号和召回轨迹一起输入 Light 阶段。个人内容和敏感内容会在摄取前脱敏。

## 梦境日记

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的**梦境日记**。每个阶段有足够材料后，`memory-core` 会运行一次尽力而为的后台子智能体轮次，并追加一条简短的日记条目。除非配置了 `dreaming.model`，否则它使用默认运行时模型。如果配置的模型不可用，梦境日记会使用会话默认模型重试一次。

<Note>
这份日记供 Dreams UI 中的人类阅读，不是提升来源。Dreaming 生成的日记/报告工件会从短期提升中排除。只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

还有一条用于审查和恢复工作的有依据历史回填通道：

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` 会从历史 `YYYY-MM-DD.md` 笔记预览有依据的日记输出。
    - `memory rem-backfill --path ...` 会将可回滚的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到普通 Deep 阶段已经使用的同一短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些暂存的回填工件，而不触碰普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 暴露了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定这些有依据的候选项是否值得提升。该场景还会显示一条独立的有依据通道，因此你可以看到哪些暂存的短期条目来自历史重放、哪些已提升项目由有依据内容引导，并且只清除仅有依据的暂存条目，而不触碰普通实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号和阶段强化：

| 信号              | 权重 | 描述                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 频率           | 0.24   | 条目累积了多少短期信号 |
| 相关性           | 0.30   | 条目的平均检索质量           |
| 查询多样性     | 0.15   | 呈现它的不同查询/日期上下文      |
| 新近性             | 0.15   | 随时间衰减的新鲜度分数                      |
| 整合       | 0.10   | 多日重复出现强度                     |
| 概念丰富度 | 0.06   | 来自片段/路径的概念标签密度             |

Light 和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个小的、随新近性衰减的提升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 作业。每次扫描按顺序运行阶段：Light → REM → Deep。

默认节奏行为：

| 设置              | 默认       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 默认模型 |

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

    除非用 CLI 标志覆盖，手动 `memory promote` 默认使用 Deep 阶段阈值。

  </Tab>
  <Tab title="Explain promotion">
    解释为什么某个特定候选项会或不会被提升：

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
  可选的梦境日记子智能体模型覆盖。同时设置子智能体 `allowedModels` 允许列表时，请使用规范的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，还需设置 `plugins.entries.memory-core.subagent.allowedModels`。信任或允许列表失败会保持可见，而不是静默回退；重试只覆盖模型不可用错误。
</Warning>

<Note>
阶段策略、阈值和存储行为是内部实现细节（不是面向用户的配置）。完整键列表请参阅[记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级 Status 和托管扫描存在情况
- 短期、有依据、信号和今日已提升数量
- 下一次计划运行时间
- 用于暂存历史重放条目的独立有依据场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开梦境日记阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [记忆 CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
