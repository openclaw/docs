---
read_when:
    - 你想针对当前会话快速提出一个旁支问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 提出临时的旁支问题
title: BTW 旁支问题
x-i18n:
    generated_at: "2026-04-05T10:10:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# BTW 旁支问题

`/btw` 让你可以针对**当前会话**快速提出一个旁支问题，而不会把这个问题写入正常的对话历史中。

它参考了 Claude Code 的 `/btw` 行为模型，但已针对 OpenClaw 的 Gateway 网关和多渠道架构进行了调整。

## 它会做什么

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 快照当前会话上下文，
2. 运行一次独立的**无工具**模型调用，
3. 只回答这个旁支问题，
4. 不影响主运行流程，
5. **不会**将 BTW 问题或答案写入会话历史，
6. 以**实时旁支结果**而不是普通助手消息的形式发出答案。

重要的心智模型是：

- 相同的会话上下文
- 独立的一次性旁支查询
- 无工具调用
- 不污染未来上下文
- 不持久化到转录记录中

## 它不会做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 运行工具或智能体工具循环，
- 将 BTW 问题/答案数据写入转录历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它是有意设计成**临时性的**。

## 上下文如何工作

BTW 将当前会话仅作为**背景上下文**使用。

如果主运行当前处于活跃状态，OpenClaw 会快照当前消息状态，并将进行中的主提示词作为背景上下文包含进去，同时明确告知模型：

- 只回答这个旁支问题，
- 不要恢复或完成未完成的主任务，
- 不要发出工具调用或伪工具调用。

这样可以在让 BTW 了解当前会话主题的同时，将它与主运行隔离开来。

## 投递模型

BTW **不会**作为普通助手转录消息投递。

在 Gateway 网关协议层：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意为之。如果 BTW 复用普通 `chat` 事件路径，客户端就会把它当成常规对话历史来处理。

由于 BTW 使用单独的实时事件，并且不会从
`chat.history` 中重放，因此它会在重新加载后消失。

## 界面行为

### TUI

在 TUI 中，BTW 会以内联方式渲染在当前会话视图中，但它仍然是临时性的：

- 在视觉上与普通助手回复明显区分
- 可通过 `Enter` 或 `Esc` 关闭
- 重新加载时不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 等渠道中，BTW 会以带明确标签的一次性回复形式投递，因为这些界面没有本地临时覆盖层的概念。

该答案仍会被视为旁支结果，而不是普通会话历史。

### 控制 UI / Web

Gateway 网关会正确地将 BTW 作为 `chat.side_result` 发出，而且 BTW 不会包含在 `chat.history` 中，因此对于 Web 来说，持久化契约已经是正确的。

当前的控制 UI 仍然需要一个专用的 `chat.side_result` 使用方，才能在浏览器中实时渲染 BTW。在这项客户端支持落地之前，BTW 仍是一个 Gateway 网关级功能，已经完整支持 TUI 和外部渠道行为，但浏览器 UX 还不算完整。

## 何时使用 BTW

当你想要以下能力时，请使用 `/btw`：

- 针对当前工作进行快速澄清，
- 在长时间运行仍在进行时获得一个事实性旁支答案，
- 获取一个不应成为未来会话上下文一部分的临时答案。

示例：

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不要使用 BTW

如果你希望答案成为该会话未来工作上下文的一部分，就不要使用 `/btw`。

在这种情况下，请直接在主会话中正常提问，而不是使用 BTW。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [Thinking 级别](/zh-CN/tools/thinking)
- [会话](/zh-CN/concepts/session)
