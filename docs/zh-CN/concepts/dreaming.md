---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想调优整合过程，同时不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 后台记忆整合，包含轻度、深度和 REM 阶段，以及梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T01:47:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它帮助 OpenClaw 将强烈的短期信号移入持久记忆，同时保持流程可解释、可审查。

<Note>
Dreaming 是**可选启用**的，默认禁用。
</Note>

## Dreaming 写入什么

Dreaming 保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或已有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

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
  <Accordion title="Light 阶段">
    Light 阶段会摄取近期每日记忆信号和召回轨迹，对它们去重，并暂存候选行。

    - 从短期召回状态、近期每日记忆文件，以及可用时经过脱敏的会话转录中读取。
    - 当存储包含内联输出时，写入一个受管理的 `## Light Sleep` 块。
    - 记录强化信号，供后续 Deep 排名使用。
    - 从不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep 阶段">
    Deep 阶段决定什么会成为长期记忆。

    - 使用加权评分和阈值门控对候选项排名。
    - 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 写入前从实时每日文件重新加载片段，因此会跳过陈旧或已删除的片段。
    - 将提升后的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    REM 阶段提取模式和反思信号。

    - 根据近期短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入一个受管理的 `## REM Sleep` 块。
    - 记录 Deep 排名使用的 REM 强化信号。
    - 从不写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将经过脱敏的会话转录摄取到 Dreaming 语料库中。当转录可用时，它们会与每日记忆信号和召回轨迹一起送入 Light 阶段。个人和敏感内容会在摄取前脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中维护叙事性的 **Dream Diary**。每个阶段积累足够材料后，`memory-core` 会以尽力而为的方式运行一次后台子智能体轮次，并追加一条简短的日记条目。除非配置了 `dreaming.model`，否则它使用默认运行时模型。如果配置的模型不可用，Dream Diary 会使用会话默认模型重试一次。

<Note>
这份日记供人类在 Dreams UI 中阅读，不是提升来源。Dreaming 生成的日记/报告工件会被排除在短期提升之外。只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

还有一条用于审查和恢复工作的、有依据的历史回填通道：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 会从历史 `YYYY-MM-DD.md` 笔记预览有依据的日记输出。
    - `memory rem-backfill --path ...` 会将可逆的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到普通 Deep 阶段已经使用的同一个短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填工件，而不触及普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 暴露相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定有依据候选项是否值得提升。该场景还会显示一条独立的有依据通道，让你看到哪些已暂存短期条目来自历史重放、哪些已提升项目由有依据内容引导，并且可以只清除仅有依据的已暂存条目，而不触及普通实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号加阶段强化：

| 信号           | 权重 | 描述                               |
| -------------- | ---- | ---------------------------------- |
| 频率           | 0.24 | 条目累计了多少短期信号             |
| 相关性         | 0.30 | 条目的平均检索质量                 |
| 查询多样性     | 0.15 | 触发它的不同查询/日期上下文        |
| 时效性         | 0.15 | 随时间衰减的新鲜度分数             |
| 整合           | 0.10 | 多日重复出现的强度                 |
| 概念丰富度     | 0.06 | 来自片段/路径的概念标签密度        |

Light 和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个较小的、按时效性衰减的提升。

Shadow-trial 结果可以叠加到该基础分数之上，作为任何持久写入前的审查信号。有帮助的试验会给候选项一个较小且有上限的提升，中性试验会让它保持推迟，有害试验会在该次评分中将其标记为拒绝。这个信号仍然只是报告用途：它可以改变候选项排序或审查元数据，但不会写入 `MEMORY.md`，也不会自行提升候选项。

## QA shadow trial 报告覆盖

QA Lab 包含一个仅报告场景，用于探索未来的 Dreaming shadow trial 如何在提升前审查候选记忆。该场景要求智能体比较一个基线答案和一个可以使用候选记忆的答案，然后写入一份本地报告，其中包含裁定、原因和风险标志。

这个覆盖范围有意限定在 QA。它验证报告工件会与 `MEMORY.md` 保持分离，并且智能体不会声称候选项已被提升。它不会添加生产 shadow-trial 行为，也不会更改 Deep 阶段提升引擎。

`memory-core` shadow-trial 运行器会为需要稳定工件的代码路径保持同样的仅报告契约。它接受候选项、试验提示、基线结果、候选结果、裁定、原因、风险标志和证据引用，然后写入一份带有 `promotion action: report-only` 的报告。有帮助的裁定会映射到 `promote` 建议，中性裁定会映射到 `defer`，有害裁定会映射到 `reject`；这些建议都不会写入 `MEMORY.md`，也不会应用 Deep 阶段提升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 任务。每次扫描按顺序运行各阶段：Light → REM → Deep。

扫描包含主运行时工作区以及任何已配置的 Agent 工作区，并按路径去重，因此子智能体工作区扇出不会排除主 Agent 的 `DREAMS.md` 和记忆状态。

默认节奏行为：

| 设置                 | 默认值       |
| -------------------- | ------------ |
| `dreaming.frequency` | `0 3 * * *`  |
| `dreaming.model`     | 默认模型     |

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
    解释为什么特定候选项会或不会被提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 预览">
    在不写入任何内容的情况下预览 REM 反思、候选事实和 Deep 提升输出：

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
  可选的 Dream Diary 子智能体模型覆盖。若同时设置子智能体 `allowedModels` allowlist，请使用规范的 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  从每个提升到 `MEMORY.md` 的短期召回片段中保留的最大估算 token 数。排名来源仍然可见。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。要限制它，还需设置 `plugins.entries.memory-core.subagent.allowedModels`。信任或 allowlist 失败会保持可见，而不是静默回退；重试仅覆盖模型不可用错误。
</Warning>

<Note>
大多数阶段策略、阈值和存储行为都是内部实现细节。完整键列表请参见 [记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管理扫描的存在情况
- 短期、有依据、信号和今日已提升计数
- 下一次计划运行时间
- 用于暂存历史重放条目的独立有依据场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## Dreaming 从未运行：状态显示 blocked

如果 `openclaw memory status` 报告 `Dreaming status: blocked`，表示受管理 cron 已存在，但默认 Agent heartbeat 没有触发。检查默认 Agent 是否启用了 heartbeat，并且其目标不是 `none`，然后在下一个 heartbeat 间隔后再次运行 `openclaw memory status --deep`。

## 相关

- [记忆](/zh-CN/concepts/memory)
- [Memory CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
