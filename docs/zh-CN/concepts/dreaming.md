---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想要调整整合行为，同时不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 后台记忆整合，包含 light、deep 和 REM 阶段以及 Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-07-05T11:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 220b41de84a3cecf932f1409faa7e53f17c3845fa90f4b67f5add6e224196aae
    source_path: concepts/dreaming.md
    workflow: 16
---

梦境整理是 `memory-core` 中的后台记忆整合系统。它会将强短期信号转入持久记忆，同时保持过程可解释、可审查。

<Note>
梦境整理是**选择启用**的，并且默认禁用。
</Note>

## 梦境整理写入什么

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

梦境整理每次扫描会按顺序运行三个协作阶段：浅睡眠 -> REM -> 深睡眠。这些是内部实现阶段，不是单独的用户配置模式。

| 阶段 | 目的                                   | 持久写入     |
| ----- | ----------------------------------------- | ----------------- |
| 浅睡眠 | 整理并暂存近期短期材料 | 否                |
| REM   | 反思主题和反复出现的想法     | 否                |
| 深睡眠  | 评分并提升持久候选项      | 是（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="浅睡眠阶段">
    - 读取近期短期召回状态、每日记忆文件，以及可用时经过脱敏的会话转录。
    - 对信号去重并暂存候选行。
    - 当存储包含内联输出时，写入托管的 `## Light Sleep` 块。
    - 记录强化信号，供后续深睡眠排序使用。
    - 永不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    - 根据近期短期轨迹构建主题和反思摘要。
    - 当存储包含内联输出时，写入托管的 `## REM Sleep` 块。
    - 记录供深睡眠排序使用的 REM 强化信号。
    - 永不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深睡眠阶段">
    - 使用加权评分和阈值门槛对候选项排序（`minScore`、`minRecallCount`、`minUniqueQueries` 必须全部通过）。
    - 写入前从实时每日文件重新补水片段，因此会跳过过时或已删除的片段。
    - 将提升的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

梦境整理可以将经过脱敏的会话转录摄取到梦境整理语料库中。可用时，转录会与每日记忆信号和召回轨迹一起供浅睡眠阶段使用。个人内容和敏感内容会在摄取前脱敏。

## 梦境日记

梦境整理会在 `DREAMS.md` 中维护叙事性的**梦境日记**。每个阶段拥有足够材料后，`memory-core` 会尽力运行一次后台子智能体轮次并追加一条简短日记，默认使用运行时模型，除非配置了 `dreaming.model`。如果配置的模型不可用，日记运行会使用会话默认模型重试一次；信任或允许列表失败不会重试，而是保留在日志中可见，不会静默回退到通用日记条目。

<Note>
日记用于 Dreams UI 中的人类阅读，不是提升来源。日记/报告制品会从短期提升中排除；只有有依据的记忆片段才有资格提升到 `MEMORY.md`。
</Note>

还有一条用于审查和恢复工作的有依据历史回填通道：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 会从历史 `YYYY-MM-DD.md` 笔记预览有依据的日记输出。
    - `memory rem-backfill --path ...` 会将可逆的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到正常深睡眠阶段使用的同一个短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些暂存的回填制品，而不触碰普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 暴露相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定有依据的候选项是否值得提升。一个独立的有依据 Scene 通道会显示哪些暂存短期条目来自历史重放、哪些已提升项目由依据驱动，并允许你只清除仅有依据的暂存条目，而不触碰实时短期状态。

## 深睡眠排序信号

深睡眠排序使用六个加权基础信号加上阶段强化：

| 信号              | 权重 | 描述                                       |
| ------------------- | ------ | ------------------------------------------------- |
| 相关性           | 0.30   | 条目的平均检索质量           |
| 频率           | 0.24   | 条目积累的短期信号数量 |
| 查询多样性     | 0.15   | 触发它的不同查询/日期上下文      |
| 近期性             | 0.15   | 按时间衰减的新鲜度评分                      |
| 整合       | 0.10   | 多日重复出现的强度                     |
| 概念丰富度 | 0.06   | 来自片段/路径的概念标签密度             |

浅睡眠和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 添加一个按近期性衰减的小幅提升。

影子试验结果可以叠加在基础评分之上，作为任何持久写入前的审查信号：有帮助的试验会给候选项一个小幅有界提升，中性试验会让它继续延后，有害试验会在该评分轮次中将其标记为拒绝。此信号仅用于报告 - 它可以改变候选项排序或审查元数据，但永远不会写入 `MEMORY.md`，也不会单独提升候选项。

### QA 影子试验报告覆盖

QA Lab 包含一个仅报告场景，用于探索未来梦境整理影子试验如何在提升前审查候选记忆：智能体会比较基线答案与可使用候选记忆的答案，然后写入包含结论、原因和风险标志的本地报告。此覆盖范围限定在 QA - 它验证报告制品与 `MEMORY.md` 保持分离，并且智能体绝不会声称候选项已被提升。它不会添加生产影子试验行为，也不会改变深睡眠阶段提升引擎。

`memory-core` 影子试验运行器为需要稳定制品的代码路径保持同样的仅报告契约。它接受候选项、试验提示、基线结果、候选结果、结论、原因、风险标志和证据引用，然后写入带有 `promotion action: report-only` 的报告。有帮助结论映射为 `promote` 建议，中性结论映射为 `defer`，有害结论映射为 `reject` - 这些都不会写入 `MEMORY.md`，也不会应用深睡眠阶段提升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整梦境整理扫描的 cron 作业，并在主运行时工作区和任何已配置的 Agent 工作区之间去重，因此子智能体工作区扇出不会排除主智能体的 `DREAMS.md` 和记忆状态。

| 设置              | 默认值       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 默认模型 |

## 快速开始

<Tabs>
  <Tab title="启用梦境整理">
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` 和 `/dreaming off` 要求渠道调用者具备所有者状态，或 Gateway 网关客户端具备 `operator.admin`。`/dreaming status` 和 `/dreaming help` 为只读。

## CLI 工作流

<Tabs>
  <Tab title="提升预览 / 应用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手动 `memory promote` 默认使用深睡眠阶段阈值，除非通过 CLI 标志覆盖。

  </Tab>
  <Tab title="解释提升">
    解释为什么某个特定候选项会或不会提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 预览">
    预览 REM 反思、候选事实和深睡眠提升输出，而不写入任何内容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  启用或禁用梦境整理扫描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整梦境整理扫描的 cron 节奏。
</ParamField>
<ParamField path="model" type="string">
  可选的梦境日记子智能体模型覆盖。在同时设置子智能体 `allowedModels` 允许列表时，使用规范的 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  从每个提升到 `MEMORY.md` 的短期召回片段中保留的最大估算 token 数量。排序来源仍保持可见。
</ParamField>

<Warning>
`dreaming.model` 要求 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，还需要设置 `plugins.entries.memory-core.subagent.allowedModels`。自动重试仅覆盖模型不可用错误；信任或允许列表失败会保留在日志中可见，而不会静默回退。
</Warning>

<Note>
大多数阶段策略、阈值和存储行为都是内部实现细节。完整键列表请参见[记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前梦境整理启用状态
- 阶段级状态和托管扫描存在状态
- 短期、有依据、信号和今日已提升计数
- 下一次计划运行时间
- 用于暂存历史重放条目的独立有依据 Scene 通道
- 由 `doctor.memory.dreamDiary` 支撑的可展开梦境日记阅读器

## 相关

- [记忆](/zh-CN/concepts/memory)
- [记忆 CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
