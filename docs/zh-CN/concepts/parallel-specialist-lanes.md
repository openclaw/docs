---
read_when:
    - 你将群聊路由到专用智能体
    - 你想要并行处理工作，而不是让一个长任务阻塞每个聊天
    - 你正在设计一个多 Agent 运维设置
sidebarTitle: Specialist lanes
status: active
summary: 并行运行专门智能体，而不占满共享模型和工具容量
title: 并行专家通道
x-i18n:
    generated_at: "2026-05-10T19:31:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

并行专门通道让一个 Gateway 网关可以将不同聊天或房间路由到
不同智能体，同时保持用户体验快速。诀窍是把并行性视为一种稀缺资源设计问题，
而不只是“更多智能体”。

## 基本原则

只有在减少对真正瓶颈的争用时，专门通道才会提升吞吐量：

- **会话锁**：一次只能有一个运行改变给定会话。
- **全局模型容量**：所有可见聊天运行仍然共享提供商限制。
- **工具容量**：shell、浏览器、网络和仓库工作可能比模型轮次本身更慢。
- **上下文预算**：长转录会让之后每个轮次都更慢、更不聚焦。
- **所有权不明确**：重复做同一项工作的智能体会浪费容量。

OpenClaw 已经按会话序列化运行，并通过[命令队列](/zh-CN/concepts/queue)
限制全局并行度。专门通道在此之上增加策略：哪个智能体拥有哪项工作、
什么留在聊天里，以及什么变成后台工作。

## 推荐推出方式

### 阶段 1：通道契约 + 后台重型工作

在每个通道的工作区和系统提示中给它一份书面契约：

- **目的**：这个通道负责的工作。
- **非目标**：它应该移交而不是尝试处理的工作。
- **聊天预算**：快速回答留在聊天中；长任务应简短确认，
  然后在后台子智能体或任务中运行。
- **移交规则**：当另一个通道拥有该工作时，说明应该交到哪里，
  并提供一份紧凑的移交摘要。
- **工具风险规则**：优先使用能完成工作的最小工具范围。

这是成本最低的阶段，并能解决大多数堵塞：一个编码任务不再让研究通道变得迟缓，
每个聊天也能保持自己的上下文干净。

### 阶段 2：优先级和并发控制

围绕每个通道的业务价值调整队列和模型容量：

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

将直接/个人聊天和生产运维智能体用于高优先级工作。当系统繁忙时，
让研究、起草和批量编码转入后台任务。

### 阶段 3：协调器 / 流量控制器

一旦多个通道处于活跃状态，就添加一个小型协调器模式：

- 跟踪活跃的通道任务和所有者。
- 检测跨群组的重复请求。
- 在通道之间路由移交摘要。
- 只呈现阻塞项、已完成结果，以及必须由人类做出的决策。

不要从这里开始。没有通道契约的协调器只是在协调混乱。

## 最小通道契约模板

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## 相关内容

- [多智能体路由](/zh-CN/concepts/multi-agent)
- [命令队列](/zh-CN/concepts/queue)
- [子智能体](/zh-CN/tools/subagents)
