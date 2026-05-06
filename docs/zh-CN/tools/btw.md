---
read_when:
    - 你想顺便问一个关于当前会话的小问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 提出临时性附带问题
title: 顺便问几个问题
x-i18n:
    generated_at: "2026-05-06T01:18:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 允许你针对**当前会话**快速提一个旁支问题，而不会把这个问题写入普通对话历史。`/side` 是它的别名。

它借鉴了 Claude Code 的 `/btw` 行为，但针对 OpenClaw 的 Gateway 网关和多渠道架构做了适配。

## 它会做什么

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 为当前会话上下文创建快照，
2. 发起一次独立的**无工具**模型调用，
3. 只回答旁支问题，
4. 不干扰主运行，
5. **不会**将 BTW 问题或答案写入会话历史，
6. 将答案作为**实时旁支结果**发出，而不是普通的助手消息。

重要的心智模型是：

- 相同的会话上下文
- 独立的一次性旁支查询
- 不调用工具
- 不污染未来上下文
- 不持久化转录记录

## 它不会做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 运行工具或智能体工具循环，
- 将 BTW 问题/答案数据写入转录历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它有意设计为**临时**的。

## 上下文如何工作

BTW 只将当前会话用作**背景上下文**。

如果主运行当前处于活跃状态，OpenClaw 会为当前消息状态创建快照，并将进行中的主提示作为背景上下文包含进去，同时明确告诉模型：

- 只回答旁支问题，
- 不要恢复或完成未完成的主任务，
- 不要发出工具调用或伪工具调用。

这样可以让 BTW 与主运行隔离，同时仍然知道会话在讨论什么。

## 交付模型

BTW **不会**作为普通助手转录消息交付。

在 Gateway 网关协议层：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意的。如果 BTW 复用普通的 `chat` 事件路径，客户端会把它当作常规对话历史处理。

因为 BTW 使用独立的实时事件，并且不会从 `chat.history` 重放，所以它会在重新加载后消失。

## 界面行为

### TUI

在 TUI 中，BTW 会以内联方式渲染在当前会话视图里，但它仍然是临时的：

- 在视觉上不同于普通助手回复
- 可用 `Enter` 或 `Esc` 关闭
- 重新加载后不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 等渠道上，BTW 会作为带有清晰标签的一次性回复交付，因为这些界面没有本地临时叠层概念。

该答案仍会被视为旁支结果，而不是普通会话历史。

### Control UI / 网页

Gateway 网关会正确地将 BTW 作为 `chat.side_result` 发出，并且 BTW 不会包含在 `chat.history` 中，因此 Web 的持久化契约已经正确。

当前的 Control UI 仍然需要专用的 `chat.side_result` 消费者，才能在浏览器中实时渲染 BTW。在该客户端侧支持落地之前，BTW 是一个具备完整 TUI 和外部渠道行为的 Gateway 网关级功能，但还不是完整的浏览器 UX。

## 何时使用 BTW

当你想要以下内容时，使用 `/btw`：

- 对当前工作进行快速澄清，
- 在长时间运行仍在进行时获得一个事实性旁支答案，
- 获取不应成为未来会话上下文一部分的临时答案。

示例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不要使用 BTW

如果你希望答案成为会话未来工作上下文的一部分，不要使用 `/btw`。

在这种情况下，请在主会话中正常提问，而不是使用 BTW。

## 相关内容

<CardGroup cols={2}>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="思考级别" href="/zh-CN/tools/thinking" icon="brain">
    旁支问题模型调用的推理投入级别。
  </Card>
  <Card title="会话" href="/zh-CN/concepts/session" icon="comments">
    会话键、历史和持久化语义。
  </Card>
  <Card title="Steer 命令" href="/zh-CN/tools/steer" icon="arrow-right">
    将一条引导消息注入活跃运行，而不结束它。
  </Card>
</CardGroup>
