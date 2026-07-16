---
read_when:
    - 你希望 OpenClaw 记住自然产生的后续事项
    - 你想了解推断式跟进与提醒有何不同
    - 你想要审查或取消跟进承诺
sidebarTitle: Commitments
summary: 用于非精确提醒类跟进的推断式记忆
title: 推断式跟进承诺
x-i18n:
    generated_at: "2026-07-16T11:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

跟进承诺是短期的后续记忆。启用后，OpenClaw 可以
注意到对话中出现了未来适合跟进的时机，并记住
稍后再次提起。

示例：

- 你提到明天有一场面试。OpenClaw 可能会在面试后询问情况。
- 你说自己筋疲力尽。OpenClaw 之后可能会询问你是否睡过觉。
- 智能体表示会在某件事发生变化后继续跟进。OpenClaw 可能会跟踪
  这个尚未闭环的事项。

跟进承诺不同于 `MEMORY.md` 这样的持久事实，也不是精确的
提醒。它们介于记忆和自动化之间：OpenClaw 会记住一项
与对话绑定的跟进义务，然后在到期时由 Heartbeat 进行传递。

## 启用跟进承诺

跟进承诺默认关闭（`commitments.enabled: false`）。在配置中启用：

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

`commitments.maxPerDay` 限制在滚动的一天内，每个智能体会话最多可以传递多少条推断出的后续跟进。
默认值为 `3`。

## 工作原理

智能体回复后，OpenClaw 可能会在独立上下文中运行一个隐藏的后台提取过程，
并禁用工具。该过程只查找推断出的后续跟进承诺。它
不会写入可见对话，也不会要求主智能体
对提取过程进行推理。

找到高置信度的候选项后，OpenClaw 会存储一项包含以下内容的跟进承诺：

- 智能体 ID
- 会话键
- 原始渠道和传递目标
- 到期时间窗口
- 一条简短的建议跟进内容
- 供 Heartbeat 判断是否发送的非指令性元数据

传递通过 Heartbeat 完成。当跟进承诺到期时，Heartbeat
会将其加入同一智能体和渠道范围的 Heartbeat 轮次。
提示词会明确警告跟进承诺元数据不可信，并指示
模型不要遵循其中的指令，也不要因此使用工具。
模型可以发送一条自然的跟进消息，或回复 `HEARTBEAT_OK` 将其忽略。
如果 Heartbeat 配置了 `target: "none"`，到期的跟进承诺将保持
内部状态，不会发送外部跟进消息。跟进承诺传递提示词不会
重放原始对话文本，只会包含建议的跟进内容和
元数据，并且到期跟进承诺的 Heartbeat 轮次不会使用 OpenClaw 工具。

OpenClaw 绝不会在写入推断出的跟进承诺后立即传递它。
到期时间会被限制为至少在跟进承诺创建一个 Heartbeat 间隔后，
因此后续跟进不会在被推断出的同一时刻立即重复反馈。

## 范围

跟进承诺仅限于创建它们时的确切智能体和渠道上下文。
在 Discord 中与某个智能体交谈时推断出的后续跟进，不会由
其他智能体、其他渠道或无关会话传递。

此范围是该功能的一部分。自然的跟进应让人感觉是同一段
对话的延续，而不是一个全局提醒系统。

## 跟进承诺与提醒的区别

| 需求                                            | 使用                                     |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 点提醒我”                               | [定时任务](/zh-CN/automation/cron-jobs)        |
| “20 分钟后提醒我”                               | [定时任务](/zh-CN/automation/cron-jobs)        |
| “每个工作日运行这份报告”                        | [定时任务](/zh-CN/automation/cron-jobs)        |
| “我明天有一场面试”                              | 跟进承诺                                 |
| “我彻夜未眠”                                    | 跟进承诺                                 |
| “如果我没有回复这个未结话题，请继续跟进”        | 跟进承诺                                 |

用户明确提出的请求已经属于调度器处理范围。跟进承诺仅用于
推断出的后续跟进：用户没有要求设置提醒，
但对话显然产生了未来进行有用跟进的时机。

## 管理跟进承诺

使用 CLI 检查和清除已存储的跟进承诺：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完整命令参考请参阅 [`openclaw commitments`](/zh-CN/cli/commitments)。

## 隐私和成本

跟进承诺提取会使用一次 LLM 调用，因此启用后会在符合条件的轮次结束时
产生额外的后台模型用量。该过程不会显示在用户可见的
对话中，但可以读取判断是否存在
后续跟进所需的近期交流内容。

存储的跟进承诺是共享 SQLite 状态数据库中的本地 OpenClaw
运行记忆，而非长期记忆。使用以下命令禁用该功能：

```bash
openclaw config set commitments.enabled false
```

## 故障排查

如果预期的后续跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 检查 `openclaw commitments --all` 中是否有待处理、已忽略、已推迟或已过期的
  记录。
- 确保该智能体的 Heartbeat 正在运行。
- 检查该智能体会话是否已经达到 `commitments.maxPerDay`。
- 请记住，精确提醒会被跟进承诺提取跳过，应该改为显示在
  [定时任务](/zh-CN/automation/cron-jobs)中。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [`openclaw commitments`](/zh-CN/cli/commitments)
- [配置参考](/zh-CN/gateway/configuration-reference#commitments)
