---
read_when:
    - 你希望 OpenClaw 记住自然的跟进事项
    - 你想了解推断式跟进与提醒有何不同
    - 你想查看或忽略跟进承诺
sidebarTitle: Commitments
summary: 用于非精确提醒回访的推断式跟进记忆
title: 推断式跟进承诺
x-i18n:
    generated_at: "2026-05-01T01:18:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

跟进承诺是短期的后续记忆。启用后，OpenClaw 可以
察觉一段对话创造了未来回访的机会，并记住稍后再提起。

示例：

- 你提到明天有面试。OpenClaw 可能会在之后回访。
- 你说自己很疲惫。OpenClaw 可能稍后询问你是否睡过觉。
- 智能体说它会在某件事变化后跟进。OpenClaw 可能会跟踪
  这个未闭合事项。

跟进承诺不是像 `MEMORY.md` 那样的持久事实，也不是精确的
提醒。它们位于记忆和自动化之间：OpenClaw 会记住一个
绑定到对话的义务，然后由 Heartbeat 在到期时投递。

## 启用跟进承诺

跟进承诺默认关闭。在配置中启用它们：

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

等效的 `openclaw.json`：

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` 会限制每个智能体会话在滚动一天内可投递的推断式跟进次数。
默认值为 `3`。

## 工作原理

智能体回复后，OpenClaw 可能会在独立上下文中运行一个隐藏的后台提取过程。
该过程只查找推断式跟进承诺。它
不会写入可见对话，也不会要求主智能体
推理提取过程。

当找到高置信度候选项时，OpenClaw 会存储一个跟进承诺，其中包含：

- 智能体 ID
- 会话键
- 原始渠道和投递目标
- 到期时间窗口
- 简短的建议回访内容
- 供 Heartbeat 决定是否发送的非指令性元数据

投递通过 Heartbeat 发生。当跟进承诺到期时，Heartbeat
会把该跟进承诺加入同一智能体和渠道范围的 Heartbeat 轮次中。
模型可以发送一条自然的回访消息，或回复 `HEARTBEAT_OK` 将其忽略。
如果 Heartbeat 配置了 `target: "none"`，到期的跟进承诺会保留在内部，
不会发送外部回访。跟进承诺投递提示不会
重放原始对话文本，并且到期跟进承诺的 Heartbeat 轮次
会在没有 OpenClaw 工具的情况下运行。

OpenClaw 绝不会在写入推断式跟进承诺后立即投递它。
到期时间会被限制为至少在创建跟进承诺后的一个 Heartbeat 间隔之后，
因此跟进不会在被推断出的同一时刻
回显回来。

## 范围

跟进承诺的范围限定为创建它们时所在的精确智能体和渠道上下文。
在 Discord 中与某个智能体对话时推断出的跟进，
不会由另一个智能体、另一个渠道或不相关的会话投递。

这个范围是该功能的一部分。自然回访应当感觉像同一段
对话的延续，而不是一个全局提醒系统。

## 跟进承诺与提醒

| 需求                                            | 使用                                      |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 点提醒我”                             | [定时任务](/zh-CN/automation/cron-jobs) |
| “20 分钟后提醒我”                         | [定时任务](/zh-CN/automation/cron-jobs) |
| “每个工作日运行这份报告”                 | [定时任务](/zh-CN/automation/cron-jobs) |
| “我明天有面试”                  | 跟进承诺                              |
| “我整晚没睡”                            | 跟进承诺                              |
| “如果我没有回复这个未闭合线程就跟进” | 跟进承诺                              |

明确的用户请求已经属于调度器路径。跟进承诺只用于
推断式跟进：用户没有要求提醒，
但对话明确创造了有用的未来回访时刻。

## 管理跟进承诺

使用 CLI 检查并清除已存储的跟进承诺：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

请参阅 [`openclaw commitments`](/zh-CN/cli/commitments) 了解命令参考。

## 隐私与成本

跟进承诺提取会使用一次 LLM 过程，因此启用它会在符合条件的轮次之后增加后台模型
用量。该过程对用户可见的
对话隐藏，但它可以读取最近的交流，以判断是否存在
跟进。

存储的跟进承诺是本地 OpenClaw 状态。它们是运行性记忆，而不是
长期记忆。使用以下命令禁用该功能：

```bash
openclaw config set commitments.enabled false
```

## 故障排除

如果预期的跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 检查 `openclaw commitments --all` 中是否有待处理、已忽略、已推迟或已过期的
  记录。
- 确保 Heartbeat 正在为该智能体运行。
- 检查该智能体会话是否已经达到 `commitments.maxPerDay`。
- 记住，精确提醒会被跟进承诺提取跳过，应该
  改为出现在[定时任务](/zh-CN/automation/cron-jobs)下。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [`openclaw commitments`](/zh-CN/cli/commitments)
- [配置参考](/zh-CN/gateway/configuration-reference#commitments)
