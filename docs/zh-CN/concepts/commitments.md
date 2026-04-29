---
read_when:
    - 你希望 OpenClaw 记住自然的后续跟进
    - 你想了解推断式跟进与提醒有何不同
    - 你想查看或忽略跟进承诺
sidebarTitle: Commitments
summary: 用于并非精确提醒的回访的推断式跟进记忆
title: 推断式跟进承诺
x-i18n:
    generated_at: "2026-04-29T21:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

跟进承诺是短期存在的后续跟进记忆。启用后，OpenClaw 可以
注意到某段对话创造了未来回访的机会，并记住稍后再提起。

示例：

- 你提到明天有面试。OpenClaw 可能会在之后回访。
- 你说自己很疲惫。OpenClaw 可能会稍后询问你是否睡过了。
- 智能体说它会在某件事变化后跟进。OpenClaw 可能会跟踪这个
  未闭合的循环。

跟进承诺不是像 `MEMORY.md` 那样的持久事实，也不是精确的
提醒。它位于记忆和自动化之间：OpenClaw 记住一个绑定到
对话的义务，然后由 Heartbeat 在到期时投递。

## 启用跟进承诺

跟进承诺默认关闭。请在配置中启用：

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

`commitments.maxPerDay` 限制在一个滚动日内，每个智能体会话可以投递
多少个推断式后续跟进。默认值为 `3`。

## 工作原理

智能体回复后，OpenClaw 可能会在单独的上下文中运行一次隐藏的后台
提取过程。该过程只查找推断式后续跟进承诺。它不会写入可见对话，
也不会要求主智能体对提取进行推理。

当它找到高置信度候选项时，OpenClaw 会存储一条跟进承诺，其中包含：

- 智能体 ID
- 会话键
- 原始渠道和投递目标
- 到期时间窗口
- 简短的建议回访
- 足够的来源上下文，供 Heartbeat 判断是否发送

投递通过 Heartbeat 进行。当跟进承诺到期时，Heartbeat 会把该跟进承诺
加入同一智能体和渠道范围内的 Heartbeat 回合。模型可以发送一条自然的
回访，也可以回复 `HEARTBEAT_OK` 将其忽略。

OpenClaw 绝不会在写入推断式跟进承诺后立即投递。到期时间会被限制为
至少晚于创建时间一个 Heartbeat 间隔，因此后续跟进不会在刚被推断出的
同一刻回显回来。

## 范围

跟进承诺限定在创建它们时的确切智能体和渠道上下文内。在 Discord 中与
一个智能体交谈时推断出的后续跟进，不会由另一个智能体、另一个渠道或
无关会话投递。

这种范围限定是该功能的一部分。自然回访应该像是同一段对话的延续，
而不是一个全局提醒系统。

## 跟进承诺与提醒

| 需求                                            | 使用                                      |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 点提醒我”                              | [定时任务](/zh-CN/automation/cron-jobs) |
| “20 分钟后提醒我”                              | [定时任务](/zh-CN/automation/cron-jobs) |
| “每个工作日运行这份报告”                       | [定时任务](/zh-CN/automation/cron-jobs) |
| “我明天有面试”                                 | 跟进承诺                              |
| “我整晚没睡”                                   | 跟进承诺                              |
| “如果我没有回复这个未处理的话题，请跟进”       | 跟进承诺                              |

精确的用户请求已经属于调度器路径。跟进承诺只用于推断式后续跟进：
也就是用户没有要求提醒，但对话明确创造了一个有用的未来回访时机。

## 管理跟进承诺

使用 CLI 检查和清除已存储的跟进承诺：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

请参阅 [`openclaw commitments`](/zh-CN/cli/commitments) 获取命令参考。

## 隐私和成本

跟进承诺提取会使用一次 LLM 过程，因此启用它会在符合条件的回合之后
增加后台模型用量。该过程对用户可见的对话是隐藏的，但它可以读取最近
的交流内容，以判断是否存在后续跟进。

已存储的跟进承诺是 OpenClaw 本地状态。它们是操作性记忆，而不是长期
记忆。使用以下命令停用该功能：

```bash
openclaw config set commitments.enabled false
```

## 故障排除

如果预期的后续跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 检查 `openclaw commitments --all` 中是否有待处理、已忽略、已稍后提醒或已过期的
  记录。
- 确保该智能体的 Heartbeat 正在运行。
- 检查该智能体会话是否已经达到 `commitments.maxPerDay`。
- 记住，精确提醒会被跟进承诺提取跳过，并且应改为出现在
  [定时任务](/zh-CN/automation/cron-jobs) 下。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [`openclaw commitments`](/zh-CN/cli/commitments)
- [配置参考](/zh-CN/gateway/configuration-reference#commitments)
