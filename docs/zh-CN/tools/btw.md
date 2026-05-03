---
read_when:
    - 你想顺便问一个关于当前会话的小问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 提出临时附带问题
title: 顺便问几个题外问题
x-i18n:
    generated_at: "2026-05-03T17:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 让你可以针对**当前会话**快速提出一个旁支问题，而不会把这个问题变成正常对话历史。`/side` 是它的别名。

它借鉴了 Claude Code 的 `/btw` 行为，但针对 OpenClaw 的 Gateway 网关和多渠道架构做了适配。

## 它的作用

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 快照当前会话上下文，
2. 运行一次单独的**无工具**模型调用，
3. 只回答这个旁支问题，
4. 不影响主运行，
5. **不**将 BTW 问题或答案写入会话历史，
6. 将答案作为**实时旁支结果**发出，而不是作为普通助手消息。

重要的心智模型是：

- 相同的会话上下文
- 单独的一次性旁支查询
- 无工具调用
- 不污染未来上下文
- 不持久化到转录记录

## 它不会做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 运行工具或智能体工具循环，
- 将 BTW 问题/答案数据写入转录历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它被有意设计为**临时性的**。

## 上下文如何工作

BTW 只将当前会话用作**背景上下文**。

如果主运行当前处于活跃状态，OpenClaw 会快照当前消息状态，并把正在进行中的主提示作为背景上下文包含进去，同时明确告诉模型：

- 只回答旁支问题，
- 不要恢复或完成未完成的主任务，
- 不要发出工具调用或伪工具调用。

这会让 BTW 与主运行保持隔离，同时仍然知道会话的主题。

## 交付模型

BTW **不会**作为普通助手转录消息交付。

在 Gateway 网关协议层面：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意的。如果 BTW 复用普通 `chat` 事件路径，客户端会把它当作常规对话历史处理。

由于 BTW 使用单独的实时事件，并且不会从 `chat.history` 重放，因此它会在重新加载后消失。

## 表面行为

### TUI

在 TUI 中，BTW 会在当前会话视图中内联渲染，但它仍然是临时性的：

- 与普通助手回复有明显区别
- 可用 `Enter` 或 `Esc` 关闭
- 重新加载后不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 等渠道上，BTW 会作为带有清晰标签的一次性回复交付，因为这些表面没有本地临时覆盖层概念。

答案仍会被当作旁支结果处理，而不是普通会话历史。

### Control UI / web

Gateway 网关会正确地将 BTW 作为 `chat.side_result` 发出，并且 BTW 不会包含在 `chat.history` 中，因此 web 的持久化契约已经是正确的。

当前 Control UI 仍然需要专用的 `chat.side_result` 消费者，才能在浏览器中实时渲染 BTW。在该客户端侧支持落地之前，BTW 是一个具备完整 TUI 和外部渠道行为的 Gateway 网关级功能，但还不是完整的浏览器 UX。

## 何时使用 BTW

当你想要以下内容时，使用 `/btw`：

- 对当前工作进行快速澄清，
- 在长时间运行仍在进行时获得一个事实性旁支答案，
- 一个不应成为未来会话上下文一部分的临时答案。

示例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不应使用 BTW

当你希望答案成为会话未来工作上下文的一部分时，不要使用 `/btw`。

在这种情况下，请直接在主会话中正常提问，而不是使用 BTW。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [思考级别](/zh-CN/tools/thinking)
- [会话](/zh-CN/concepts/session)
