---
read_when:
    - 你希望 OpenClaw 记住自然的后续跟进
    - 你想了解推断式跟进承诺与提醒有何不同
    - 你想要查看或忽略跟进承诺
sidebarTitle: Commitments
summary: 用于并非精确提醒的签到的推断式跟进记忆
title: 推断式跟进承诺
x-i18n:
    generated_at: "2026-07-05T11:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

跟进承诺是短期的后续跟进记忆。启用后，OpenClaw 可以注意到一次对话产生了未来回访的机会，并记住稍后再提起。

示例：

- 你提到明天有面试。OpenClaw 可能会在之后回访。
- 你说你很疲惫。OpenClaw 可能会稍后询问你是否睡过觉。
- 智能体说它会在某件事变化后跟进。OpenClaw 可能会跟踪这个未闭环事项。

跟进承诺不是像 `MEMORY.md` 那样的持久事实，也不是精确的提醒。它们介于记忆和自动化之间：OpenClaw 记住一个绑定到对话的义务，然后在到期时由 Heartbeat 送达。

## 启用跟进承诺

跟进承诺默认关闭（`commitments.enabled: false`）。在配置中启用它们：

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

`commitments.maxPerDay` 限制每个智能体会话在滚动的一天内可以送达多少个推断出的后续跟进。默认值为 `3`。

## 工作原理

在智能体回复后，OpenClaw 可能会在单独的上下文中运行一个隐藏的后台提取过程，并禁用工具。该过程只查找推断出的后续跟进承诺。它不会写入可见对话，也不会要求主智能体对提取进行推理。

当它找到高置信度候选项时，OpenClaw 会存储一个跟进承诺，其中包含：

- 智能体 ID
- 会话键
- 原始渠道和送达目标
- 到期窗口
- 简短的建议回访
- 供 Heartbeat 判断是否发送的非指令性元数据

送达通过 Heartbeat 发生。当跟进承诺到期时，Heartbeat 会将该跟进承诺添加到同一智能体和渠道范围的 Heartbeat 轮次中。提示会明确警告跟进承诺元数据不可信，并指示模型不要遵循其中的指令，也不要因此使用工具。模型可以发送一条自然的回访，或回复 `HEARTBEAT_OK` 来忽略它。如果 Heartbeat 配置了 `target: "none"`，到期的跟进承诺会保留在内部，不会发送外部回访。跟进承诺送达提示不会重放原始对话文本，只包含建议回访和元数据，并且到期跟进承诺的 Heartbeat 轮次会在没有 OpenClaw 工具的情况下运行。

OpenClaw 永远不会在写入推断出的跟进承诺后立即送达它。到期时间会被限制为至少在创建跟进承诺后的一个 Heartbeat 间隔之后，因此后续跟进不会在被推断出的同一时刻回显回来。

## 范围

跟进承诺限定在创建它们时的确切智能体和渠道上下文内。在 Discord 中与一个智能体交谈时推断出的后续跟进，不会由另一个智能体、另一个渠道或无关会话送达。

这个范围是该功能的一部分。自然回访应该感觉像同一段对话的延续，而不是一个全局提醒系统。

## 跟进承诺与提醒

| 需求                                            | 使用                                      |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 点提醒我”                             | [定时任务](/zh-CN/automation/cron-jobs) |
| “20 分钟后提醒我”                         | [定时任务](/zh-CN/automation/cron-jobs) |
| “每个工作日运行这个报告”                 | [定时任务](/zh-CN/automation/cron-jobs) |
| “我明天有面试”                  | 跟进承诺                              |
| “我整晚没睡”                            | 跟进承诺                              |
| “如果我没有回复这个未闭环线程，就跟进” | 跟进承诺                              |

精确的用户请求已经属于调度器路径。跟进承诺仅用于推断出的后续跟进：也就是用户没有要求提醒，但对话明显产生了有用的未来回访的时刻。

## 管理跟进承诺

使用 CLI 检查并清除已存储的跟进承诺：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

完整命令参考见 [`openclaw commitments`](/zh-CN/cli/commitments)。

## 隐私和成本

跟进承诺提取会使用一次 LLM 过程，因此启用它会在符合条件的轮次后增加后台模型用量。该过程对用户可见的对话隐藏，但它可以读取用于判断是否存在后续跟进所需的最近交流。

存储的跟进承诺是本地 OpenClaw 状态。它们是操作性记忆，不是长期记忆。使用以下命令禁用该功能：

```bash
openclaw config set commitments.enabled false
```

## 故障排查

如果预期的后续跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 检查 `openclaw commitments --all` 中是否有待处理、已忽略、已暂停或已过期的记录。
- 确保该智能体的 Heartbeat 正在运行。
- 检查该智能体会话是否已达到 `commitments.maxPerDay`。
- 记住，精确提醒会被跟进承诺提取跳过，应该改为出现在[定时任务](/zh-CN/automation/cron-jobs)下。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [`openclaw commitments`](/zh-CN/cli/commitments)
- [配置参考](/zh-CN/gateway/configuration-reference#commitments)
