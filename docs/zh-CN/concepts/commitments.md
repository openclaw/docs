---
read_when:
    - 你希望 OpenClaw 记住自然表达的后续事项
    - 你想了解推断式跟进事项与提醒有何不同
    - 你想要审查或忽略跟进承诺
sidebarTitle: Commitments
summary: 用于非精确提醒式跟进的推断记忆
title: 推断式跟进承诺
x-i18n:
    generated_at: "2026-07-11T20:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

跟进承诺是短期的后续跟进记忆。启用后，OpenClaw 可以注意到某次对话创造了未来进行问候的机会，并记住稍后重新提起此事。

示例：

- 你提到明天有一场面试。OpenClaw 可能会在面试后询问情况。
- 你说自己筋疲力尽。OpenClaw 可能会稍后询问你是否睡过觉。
- 智能体表示会在某件事发生变化后继续跟进。OpenClaw 可能会跟踪这个尚未闭环的事项。

跟进承诺不同于 `MEMORY.md` 中的持久事实，也不是精确的提醒。它们介于记忆与自动化之间：OpenClaw 会记住与对话关联的待办义务，然后在到期时通过 Heartbeat 将其送达。

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

`commitments.maxPerDay` 限制滚动一天内每个智能体会话可以送达的推断式后续跟进数量。默认值为 `3`。

## 工作原理

智能体回复后，OpenClaw 可能会在独立上下文中运行一次隐藏的后台提取流程，并禁用工具。该流程仅查找推断出的后续跟进承诺。它不会写入可见对话，也不会要求主智能体对提取过程进行推理。

找到高置信度的候选项后，OpenClaw 会存储一项跟进承诺，其中包含：

- 智能体 ID
- 会话键
- 原始渠道和送达目标
- 到期时间窗口
- 一条简短的建议问候语
- 供 Heartbeat 判断是否发送的非指令性元数据

送达通过 Heartbeat 完成。跟进承诺到期时，Heartbeat 会将该承诺添加到同一智能体和渠道范围的 Heartbeat 轮次中。提示会明确警告跟进承诺元数据不可信，并指示模型不要遵循其中的指令，也不要因为这些元数据而使用工具。模型可以发送一条自然的问候消息，也可以回复 `HEARTBEAT_OK` 将其忽略。如果 Heartbeat 配置了 `target: "none"`，到期的跟进承诺会保留在内部，不会发送外部问候。跟进承诺的送达提示不会重放原始对话文本，仅包含建议的问候语和元数据；处理到期跟进承诺的 Heartbeat 轮次运行时不会使用 OpenClaw 工具。

OpenClaw 绝不会在写入推断出的跟进承诺后立即送达它。到期时间至少会被限制为创建跟进承诺后的一个 Heartbeat 间隔，因此后续跟进不会在刚被推断出的同一时刻立即回显。

## 范围

跟进承诺的范围仅限于创建它们时的确切智能体和渠道上下文。在 Discord 中与某个智能体交谈时推断出的后续跟进，不会由另一个智能体、另一个渠道或不相关的会话送达。

这种范围限制是该功能的一部分。自然的问候应该让人感觉是在延续同一次对话，而不是一个全局提醒系统。

## 跟进承诺与提醒的对比

| 需求                                            | 使用方式                                      |
| ----------------------------------------------- | ---------------------------------------- |
| “下午 3 点提醒我”                             | [定时任务](/zh-CN/automation/cron-jobs) |
| “20 分钟后提醒我”                         | [定时任务](/zh-CN/automation/cron-jobs) |
| “每个工作日运行这份报告”                 | [定时任务](/zh-CN/automation/cron-jobs) |
| “我明天有一场面试”                  | 跟进承诺                              |
| “我彻夜未眠”                            | 跟进承诺                              |
| “如果我没有回复这个未结事项，请继续跟进” | 跟进承诺                              |

用户明确提出的请求已经属于调度器处理路径。跟进承诺仅用于推断式后续跟进：即用户没有请求提醒，但对话显然创造了一个有用的未来问候机会。

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

跟进承诺提取会运行一次大语言模型流程，因此启用该功能后，会在符合条件的轮次结束后增加后台模型用量。该流程不会显示在用户可见的对话中，但可以读取判断是否存在后续跟进所需的近期对话内容。

存储的跟进承诺属于 OpenClaw 本地状态。它们是操作性记忆，而不是长期记忆。使用以下命令禁用该功能：

```bash
openclaw config set commitments.enabled false
```

## 故障排查

如果预期的后续跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 使用 `openclaw commitments --all` 检查待处理、已忽略、已推迟或已过期的记录。
- 确保该智能体的 Heartbeat 正在运行。
- 检查该智能体会话是否已经达到 `commitments.maxPerDay` 限制。
- 请记住，跟进承诺提取会跳过精确提醒，此类提醒应改为显示在[定时任务](/zh-CN/automation/cron-jobs)下。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
- [`openclaw commitments`](/zh-CN/cli/commitments)
- [配置参考](/zh-CN/gateway/configuration-reference#commitments)
