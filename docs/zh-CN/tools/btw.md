---
read_when:
- 你想就当前会话提出一个快速的顺手问题
- 你正在实现或调试跨客户端的 BTW 行为
summary: 使用 `/btw` 处理临时的顺手问题
title: BTW 顺手问题
x-i18n:
  generated_at: '2026-04-23T21:07:11Z'
  model: gpt-5.4
  provider: openai
  source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
  source_path: tools/btw.md
  workflow: 15
---
`/btw` 让你可以就**当前会话**提出一个快速的顺手问题，而不会
把这个问题写入普通对话历史。

它参考了 Claude Code 的 `/btw` 行为，但根据 OpenClaw 的
Gateway 网关和多渠道架构进行了适配。

## 它的作用

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 对当前会话上下文做快照，
2. 运行一次独立的**无工具**模型调用，
3. 只回答这个顺手问题，
4. 不干扰主运行，
5. **不会**将 BTW 问题或答案写入会话历史，
6. 将答案作为**实时侧边结果**发出，而不是普通 assistant 消息。

重要的心理模型是：

- 相同的会话上下文
- 独立的一次性顺手查询
- 不调用工具
- 不污染后续上下文
- 不持久化到 transcript

## 它不做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 运行工具或智能体工具循环，
- 将 BTW 的问题/答案数据写入 transcript 历史，
- 出现在 `chat.history` 中，
- 在重载后保留。

它本质上就是**临时的**。

## 上下文如何工作

BTW 将当前会话仅作为**背景上下文**使用。

如果主运行当前仍然活跃，OpenClaw 会对当前消息
状态做快照，并把正在进行中的主提示作为背景上下文包含进去，同时
明确告诉模型：

- 只回答这个顺手问题，
- 不要继续或完成未完成的主任务，
- 不要发出工具调用或伪工具调用。

这样既能让 BTW 与主运行隔离，又能让它知道当前会话
大致在讨论什么。

## 交付模型

BTW **不会**作为普通 assistant transcript 消息进行交付。

在 Gateway 网关协议层面：

- 普通 assistant 聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意设计的。如果 BTW 复用了普通 `chat` 事件路径，
客户端就会把它当成常规对话历史。

由于 BTW 使用独立的实时事件，并且不会从
`chat.history` 中重放，所以它会在重载后消失。

## 表面行为

### TUI

在 TUI 中，BTW 会内联渲染在当前会话视图中，但它仍然
是临时的：

- 与普通 assistant 回复有明显区别
- 可通过 `Enter` 或 `Esc` 关闭
- 重载后不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 这类渠道中，BTW 会作为
带清晰标签的一次性回复进行交付，因为这些表面没有本地
临时覆盖层的概念。

答案仍然会被视为侧边结果，而不是正常会话历史。

### Control UI / Web

Gateway 网关会以 `chat.side_result` 正确发出 BTW，并且 BTW 不包含在
`chat.history` 中，因此对 web 来说，持久化契约已经是正确的。

当前的 Control UI 仍然需要一个专门的 `chat.side_result` 消费器，才能在浏览器中实时渲染 BTW。在客户端支持落地之前，BTW 仍然是一个 Gateway 网关层级的功能，拥有完整的 TUI 和外部渠道行为，但还不是一个完整的浏览器用户体验。

## 何时使用 BTW

当你想要以下效果时，请使用 `/btw`：

- 对当前工作进行快速澄清，
- 在长时间运行仍在进行时获取一个事实性顺手答案，
- 获取一个不应成为未来会话上下文一部分的临时答案。

示例：

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不要使用 BTW

如果你希望答案成为该会话未来工作上下文的一部分，
就不要使用 `/btw`。

在这种情况下，请直接在主会话中正常提问，而不是使用 BTW。

## 相关内容

- [Slash Commands](/zh-CN/tools/slash-commands)
- [Thinking Levels](/zh-CN/tools/thinking)
- [Session](/zh-CN/concepts/session)
