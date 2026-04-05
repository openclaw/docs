---
read_when:
    - 你希望记忆提升能够自动运行
    - 你希望了解 Dreaming 的三个阶段
    - 你希望调整整合过程而不污染 `MEMORY.md`
summary: 具有三个协作阶段的后台记忆整合：浅睡、深睡和 REM
title: Dreaming（实验性）
x-i18n:
    generated_at: "2026-04-05T23:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ba56b20013aa53f5f440fd79ea14dc67a61c4fb63ebe91b3fd183d09a842912
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（实验性）

Dreaming 是 `memory-core` 中的后台记忆整合系统。它会重新审视对话期间出现的内容，并判断哪些值得保留为持久上下文。

Dreaming 使用三个相互协作的**阶段**，而不是彼此竞争的模式。每个阶段都有不同的职责、写入不同的目标，并按各自的时间表运行。

## 三个阶段

### 浅睡

浅睡 Dreaming 用来整理最近的杂乱信息。它会扫描最近的记忆痕迹，按 Jaccard 相似度去重，对相关条目进行聚类，并在启用内联存储时将候选记忆暂存到共享的 Dreaming 轨迹文件（`DREAMS.md`）中。

浅睡**不会**向 `MEMORY.md` 写入任何内容。它只负责整理和暂存。可以理解为：“今天的哪些内容以后可能有用？”

### 深睡

深睡 Dreaming 决定哪些内容会成为持久记忆。它执行真正的提升逻辑：基于六个信号进行加权评分，并应用阈值门槛、召回次数、唯一查询多样性、时效衰减和最大年龄过滤。

深睡是**唯一**允许向 `MEMORY.md` 写入持久事实的阶段。它还负责在记忆稀薄时进行恢复（健康度低于配置阈值）。可以理解为：“哪些内容足够真实，值得保留？”

### REM

REM Dreaming 用于发现模式与反思。它会检查近期内容，通过概念标签聚类识别反复出现的主题，并在启用内联存储时将更高层次的笔记和反思写入 `DREAMS.md`。

REM 在内联模式下写入 `DREAMS.md`，**不会**写入 `MEMORY.md`。
它的输出是解释性的，而不是规范性的。可以理解为：“我注意到了什么模式？”

## 硬性边界

| 阶段 | 职责     | 写入位置                  | 不会写入 |
| ----- | -------- | ------------------------- | -------- |
| 浅睡 | 整理     | `DREAMS.md`（内联模式）   | MEMORY.md |
| 深睡  | 保留     | MEMORY.md                 | --       |
| REM   | 解释     | `DREAMS.md`（内联模式）   | MEMORY.md |

## 快速开始

启用全部三个阶段（推荐）：

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

仅启用深睡提升：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "phases": {
              "light": { "enabled": false },
              "deep": { "enabled": true },
              "rem": { "enabled": false }
            }
          }
        }
      }
    }
  }
}
```

## 配置

所有 Dreaming 设置都位于 `openclaw.json` 中的 `plugins.entries.memory-core.config.dreaming` 下。完整键名列表请参见[记忆配置参考](/zh-CN/reference/memory-config#dreaming-experimental)。

### 全局设置

| 键名             | 类型      | 默认值     | 描述                                                         |
| ---------------- | --------- | ---------- | ------------------------------------------------------------ |
| `enabled`        | `boolean` | `true`     | 所有阶段的总开关                                             |
| `timezone`       | `string`  | 未设置     | 用于时间表评估和 Dreaming 日期分桶的时区                     |
| `verboseLogging` | `boolean` | `false`    | 输出每次运行的详细 Dreaming 日志                             |
| `storage.mode`   | `string`  | `"inline"` | 使用内联 `DREAMS.md`、单独报告，或同时使用两者               |

### 浅睡阶段配置

| 键名               | 类型       | 默认值                          | 描述                         |
| ------------------ | ---------- | ------------------------------- | ---------------------------- |
| `enabled`          | `boolean`  | `true`                          | 启用浅睡阶段                 |
| `cron`             | `string`   | `0 */6 * * *`                   | 调度计划（默认：每 6 小时）  |
| `lookbackDays`     | `number`   | `2`                             | 扫描多少天内的痕迹           |
| `limit`            | `number`   | `100`                           | 每次运行最多暂存的候选数     |
| `dedupeSimilarity` | `number`   | `0.9`                           | 去重的 Jaccard 阈值          |
| `sources`          | `string[]` | `["daily","sessions","recall"]` | 要扫描的数据源               |

### 深睡阶段配置

| 键名                  | 类型       | 默认值                                          | 描述                             |
| --------------------- | ---------- | ----------------------------------------------- | -------------------------------- |
| `enabled`             | `boolean`  | `true`                                          | 启用深睡阶段                     |
| `cron`                | `string`   | `0 3 * * *`                                     | 调度计划（默认：每天凌晨 3 点）  |
| `limit`               | `number`   | `10`                                            | 每个周期最多提升的候选数         |
| `minScore`            | `number`   | `0.8`                                           | 提升所需的最低加权分数           |
| `minRecallCount`      | `number`   | `3`                                             | 最低召回次数阈值                 |
| `minUniqueQueries`    | `number`   | `3`                                             | 最低不同查询数量                 |
| `recencyHalfLifeDays` | `number`   | `14`                                            | 时效分数减半所需天数             |
| `maxAgeDays`          | `number`   | `30`                                            | 可用于提升的每日笔记最大年龄     |
| `sources`             | `string[]` | `["daily","memory","sessions","logs","recall"]` | 数据源                           |

### 深睡恢复配置

当长期记忆健康度低于某个阈值时，会触发恢复。

| 键名                              | 类型      | 默认值  | 描述                               |
| --------------------------------- | --------- | ------- | ---------------------------------- |
| `recovery.enabled`                | `boolean` | `true`  | 启用自动恢复                       |
| `recovery.triggerBelowHealth`     | `number`  | `0.35`  | 触发恢复的健康度阈值               |
| `recovery.lookbackDays`           | `number`  | `30`    | 向前回看多长时间以查找恢复材料     |
| `recovery.maxRecoveredCandidates` | `number`  | `20`    | 每次运行最多恢复的候选数           |
| `recovery.minRecoveryConfidence`  | `number`  | `0.9`   | 恢复候选所需的最低置信度           |
| `recovery.autoWriteMinConfidence` | `number`  | `0.97`  | 自动写入阈值（跳过人工审核）       |

### REM 阶段配置

| 键名                 | 类型       | 默认值                      | 描述                             |
| -------------------- | ---------- | --------------------------- | -------------------------------- |
| `enabled`            | `boolean`  | `true`                      | 启用 REM 阶段                    |
| `cron`               | `string`   | `0 5 * * 0`                 | 调度计划（默认：每周日凌晨 5 点） |
| `lookbackDays`       | `number`   | `7`                         | 回顾多少天内的材料               |
| `limit`              | `number`   | `10`                        | 最多写入的模式或主题数量         |
| `minPatternStrength` | `number`   | `0.75`                      | 最低标签共现强度                 |
| `sources`            | `string[]` | `["memory","daily","deep"]` | 用于反思的数据源                 |

### 执行覆盖设置

每个阶段都接受一个 `execution` 块，用于覆盖全局默认值：

| 键名              | 类型     | 默认值       | 描述                           |
| ----------------- | -------- | ------------ | ------------------------------ |
| `speed`           | `string` | `"balanced"` | `fast`、`balanced` 或 `slow`   |
| `thinking`        | `string` | `"medium"`   | `low`、`medium` 或 `high`      |
| `budget`          | `string` | `"medium"`   | `cheap`、`medium` 或 `expensive` |
| `model`           | `string` | 未设置       | 覆盖此阶段使用的模型           |
| `maxOutputTokens` | `number` | 未设置       | 限制输出 token 数              |
| `temperature`     | `number` | 未设置       | 采样温度（0-2）                |
| `timeoutMs`       | `number` | 未设置       | 阶段超时时间（毫秒）           |

## 提升信号（深睡阶段）

深睡 Dreaming 会组合六个加权信号。要完成提升，所有已配置的阈值门槛都必须同时通过。

| 信号               | 权重 | 描述                                               |
| ------------------ | ---- | -------------------------------------------------- |
| 频率               | 0.24 | 同一条目被召回的频率                               |
| 相关性             | 0.30 | 被检索到时的平均召回分数                           |
| 查询多样性         | 0.15 | 使其浮现出来的不同查询意图数量                     |
| 时效性             | 0.15 | 时间衰减（`recencyHalfLifeDays`，默认 14）         |
| 整合度             | 0.10 | 奖励跨多日重复发生的召回                           |
| 概念丰富度         | 0.06 | 奖励具有更丰富派生概念标签的条目                   |

## 聊天命令

```
/dreaming status                 # 显示阶段配置和运行节奏
/dreaming on                     # 启用所有阶段
/dreaming off                    # 禁用所有阶段
/dreaming enable light|deep|rem  # 启用指定阶段
/dreaming disable light|deep|rem # 禁用指定阶段
/dreaming help                   # 显示使用指南
```

## CLI 命令

在命令行中预览并应用深睡提升：

```bash
# 预览提升候选项
openclaw memory promote

# 将提升结果应用到 MEMORY.md
openclaw memory promote --apply

# 限制预览数量
openclaw memory promote --limit 5

# 包含已经提升的条目
openclaw memory promote --include-promoted

# 检查 Dreaming 状态
openclaw memory status --deep
```

完整 flag 参考请参见 [memory CLI](/cli/memory)。

### 预览与解释工具

另外两个子命令可帮助你在不写入任何内容的情况下检查提升与 REM 行为：

```bash
# 解释某个候选为何会或不会被提升
openclaw memory promote-explain "meeting notes"

# 预览 REM 反思、候选事实和深睡提升
openclaw memory rem-harness --json
```

完整选项请参见 [memory CLI](/cli/memory)。

## 工作原理

### 浅睡阶段流水线

1. 从 `memory/.dreams/short-term-recall.json` 读取短期召回条目。
2. 过滤出距当前时间在 `lookbackDays` 范围内的条目。
3. 按 Jaccard 相似度去重（阈值可配置）。
4. 按平均召回分数排序，最多取 `limit` 个条目。
5. 在启用内联存储时，将暂存候选写入 `DREAMS.md` 中的 `## Light Sleep` 区块下。

### 深睡阶段流水线

1. 使用加权信号读取并排序短期召回候选。
2. 应用阈值门槛：`minScore`、`minRecallCount`、`minUniqueQueries`。
3. 按 `maxAgeDays` 过滤，并应用时效衰减。
4. 分发到已配置的各个记忆工作区。
5. 写入前重新读取实时每日笔记（跳过过时或已删除的片段）。
6. 将符合条件的条目及其提升时间戳追加到 `MEMORY.md`。
7. 标记已提升条目，以便将来周期中排除它们。
8. 如果健康度低于 `recovery.triggerBelowHealth`，则运行恢复流程。

### REM 阶段流水线

1. 读取 `lookbackDays` 范围内的近期记忆痕迹。
2. 按共现关系对概念标签聚类。
3. 按 `minPatternStrength` 过滤模式。
4. 在启用内联存储时，将主题和反思写入 `DREAMS.md` 中的 `## REM Sleep` 区块下。

## 调度

每个阶段都会自动管理自己的 cron 作业。启用 Dreaming 后，`memory-core` 会在 Gateway 网关启动时协调受管 cron 作业。你无需手动创建 cron 条目。

| 阶段 | 默认计划         | 描述              |
| ----- | ---------------- | ----------------- |
| 浅睡 | `0 */6 * * *`    | 每 6 小时一次     |
| 深睡  | `0 3 * * *`      | 每天凌晨 3 点     |
| REM   | `0 5 * * 0`      | 每周日凌晨 5 点   |

你可以用各阶段的 `cron` 键覆盖任意计划。所有计划都会遵循全局 `timezone` 设置。

## Dreams UI

启用 Dreaming 后，Gateway 网关侧边栏会显示一个**Dreams**选项卡，其中包含记忆统计信息（短期数量、长期数量、已提升数量）以及下一次计划周期的时间。每日计数会在设置 `dreaming.timezone` 时遵循该时区，否则回退到已配置的用户时区。

手动运行 `openclaw memory promote` 默认会使用与深睡阶段相同的阈值，因此除非你传入 CLI 覆盖项，否则计划内提升与按需提升会保持一致。

## 相关内容

- [Memory](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [memory CLI](/cli/memory)
