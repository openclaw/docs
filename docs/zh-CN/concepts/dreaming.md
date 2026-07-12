---
read_when:
    - 你希望自动执行记忆提升
    - 你想了解每个 Dreaming 阶段的作用
    - 你希望调整整合机制，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 通过浅层、深层和 REM 阶段进行后台记忆整合，并生成梦境日记
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T14:24:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它将强烈的短期信号转入持久记忆，同时保持流程可解释、可审查。

<Note>
Dreaming 是**选择启用**的，默认禁用。
</Note>

## Dreaming 写入的内容

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

Dreaming 每次扫描按顺序运行三个协作阶段：light -> REM -> deep。这些是内部实现阶段，并非由用户分别配置的模式。

| 阶段  | 用途                         | 持久写入          |
| ----- | ---------------------------- | ----------------- |
| Light | 整理并暂存近期短期材料       | 否                |
| REM   | 反思主题和反复出现的想法     | 否                |
| Deep  | 为持久候选项评分并进行提升   | 是（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="Light 阶段">
    - 读取近期短期召回状态、每日记忆文件，以及可用时经过脱敏的会话转录。
    - 对信号去重并暂存候选行。
    - 当存储包含内联输出时，写入受管理的 `## Light Sleep` 块。
    - 记录强化信号，以供后续深度排名使用。
    - 从不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    - 根据近期短期轨迹生成主题和反思摘要。
    - 当存储包含内联输出时，写入受管理的 `## REM Sleep` 块。
    - 记录供深度排名使用的 REM 强化信号。
    - 从不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep 阶段">
    - 使用加权评分和阈值门槛对候选项进行排名（`minScore`、`minRecallCount`、`minUniqueQueries` 必须全部通过）。
    - 写入前从实时每日文件中重新载入片段，因此会跳过过时或已删除的片段。
    - 将提升后的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选择写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将经过脱敏的会话转录摄取到 Dreaming 语料库中。转录可用时，会与每日记忆信号和召回轨迹一起输入 Light 阶段。个人内容和敏感内容会在摄取前脱敏。

## 梦境日记

Dreaming 在 `DREAMS.md` 中维护叙事式的**梦境日记**。每个阶段积累足够材料后，`memory-core` 会以尽力而为的方式运行一次后台子智能体轮次，并追加一条简短的日记条目；除非配置了 `dreaming.model`，否则使用默认运行时模型。如果配置的模型不可用，日记运行会使用会话默认模型重试一次；由信任或允许列表导致的失败不会重试，并会保留在日志中清晰可见，而不是静默回退到通用日记条目。

<Note>
日记供人们在 Dreams UI 中阅读，不是提升来源。日记/报告工件不会参与短期提升；只有有事实依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

此外，还有一个基于事实的历史回填通道，用于审查和恢复工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 根据历史 `YYYY-MM-DD.md` 笔记预览基于事实的日记输出。
    - `memory rem-backfill --path ...` 将可逆的、基于事实的日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 将基于事实的持久候选项暂存到正常 Deep 阶段使用的同一个短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些暂存的回填工件，而不影响普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 在智能体的 Memory 选项卡（Agents 页面）中提供相同的日记回填/重置流程，因此你可以先在梦境场景中检查结果，再决定基于事实的候选项是否值得提升。独立的基于事实的 Scene 通道会显示哪些暂存的短期条目来自历史重放、哪些已提升项以基于事实的信号为主，并允许你仅清除完全基于事实的暂存条目，而不影响实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号和阶段强化：

| 信号       | 权重 | 说明                               |
| ---------- | ---- | ---------------------------------- |
| 相关性     | 0.30 | 条目的平均检索质量                 |
| 频率       | 0.24 | 条目积累的短期信号数量             |
| 查询多样性 | 0.15 | 使其浮现的不同查询/日期上下文      |
| 时效性     | 0.15 | 随时间衰减的新鲜度评分             |
| 整合度     | 0.10 | 多日重复出现的强度                 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度        |

Light 和 REM 阶段的命中会根据 `memory/.dreams/phase-signals.json` 提供小幅、随时间衰减的加成。

在进行任何持久写入前，影子试验结果可以作为审查信号叠加到基础分数之上：有帮助的试验会为候选项提供小幅且有上限的加成，中性试验会使其继续推迟，有害试验会将其标记为在该次评分中被拒绝。此信号仅用于报告——它可以改变候选项排序或审查元数据，但绝不会写入 `MEMORY.md`，也不会单独提升候选项。

### QA 影子试验报告覆盖范围

QA Lab 包含一个仅生成报告的场景，用于探索未来的 Dreaming 影子试验如何在晋升前审查候选记忆：智能体将基准答案与可使用候选记忆的答案进行比较，然后生成一份包含裁定、理由和风险标记的本地报告。此覆盖范围仅限于 QA——它验证报告工件始终与 `MEMORY.md` 分离，并且智能体绝不会声称候选记忆已晋升。它不会添加生产环境的影子试验行为，也不会更改深阶段晋升引擎。

对于需要稳定工件的代码路径，`memory-core` 影子试验运行器保持相同的仅生成报告契约。它接收候选记忆、试验提示词、基准结果、候选结果、裁定、理由、风险标记和证据引用，然后生成一份包含 `promotion action: report-only` 的报告。有帮助的裁定对应 `promote` 建议，中性裁定对应 `defer`，有害裁定对应 `reject`——这些操作均不会写入 `MEMORY.md`，也不会应用深阶段晋升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 作业，并在主运行时工作区和所有已配置的 Agent 工作区之间进行去重，从而确保子智能体工作区的扇出不会排除主智能体的 `DREAMS.md` 和记忆状态。

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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

对于渠道调用方，`/dreaming on` 和 `/dreaming off` 要求拥有者身份；对于 Gateway 网关客户端，则要求具有 `operator.admin` 权限。`/dreaming status` 和 `/dreaming help` 为只读命令。

## CLI 工作流

<Tabs>
  <Tab title="晋升预览/应用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非通过 CLI 标志覆盖，否则手动执行 `memory promote` 默认使用深阶段阈值。

  </Tab>
  <Tab title="解释晋升">
    解释特定候选记忆为何会或不会晋升：

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

## 主要默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  启用或禁用 Dreaming 扫描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 Dreaming 扫描的 Cron 执行频率。
</ParamField>
<ParamField path="model" type="string">
  可选的 Dream Diary 子智能体模型覆盖。若同时设置子智能体 `allowedModels` 允许列表，请使用规范的 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  从每个提升到 `MEMORY.md` 的短期召回片段中保留的最大估算 token 数。排名来源信息仍然可见。
</ParamField>

<Warning>
`dreaming.model` 要求设置 `plugins.entries.memory-core.subagent.allowModelOverride: true`。如需限制它，还应设置 `plugins.entries.memory-core.subagent.allowedModels`。自动重试仅涵盖模型不可用错误；信任或允许列表失败会继续显示在日志中，而不会静默回退。
</Warning>

<Note>
大多数阶段策略、阈值和存储行为均为内部实现细节。完整键列表请参阅[记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关的 **Dreams** 选项卡会显示：

- 当前 Dreaming 启用状态
- 阶段级状态以及是否存在托管扫描
- 短期、已溯源、信号和今日已提升的数量
- 下次计划运行时间
- 一个独立的已溯源 Scene 通道，用于暂存的历史重放条目
- 一个由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [记忆 CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
