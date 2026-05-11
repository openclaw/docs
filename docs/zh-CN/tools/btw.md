---
read_when:
    - 你想快速询问一个关于当前会话的附带问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 的临时旁支问题
title: 顺便问几个附带问题
x-i18n:
    generated_at: "2026-05-11T20:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 允许你针对**当前会话**快速提出一个旁路问题，而不会
把该问题变成普通对话历史。`/side` 是别名。

它参考了 Claude Code 的 `/btw` 行为，但已适配 OpenClaw 的
Gateway 网关和多渠道架构。

## 它的作用

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 快照当前会话上下文，
2. 运行一个独立的临时旁路查询，
3. 只回答这个旁路问题，
4. 不影响主运行，
5. **不会**将 BTW 问题或回答写入会话历史，
6. 将回答作为**实时旁路结果**发出，而不是作为普通助手消息。

重要的心智模型是：

- 相同的会话上下文
- 独立的一次性旁路查询
- 当会话使用原生 harness 时，使用相同的原生 harness 传输
- 不污染未来上下文
- 不持久化 transcript

对于 Codex harness 会话，BTW 会留在 Codex 内部，通过将活动
app-server 线程 fork 成一个临时旁路线程来实现。这样既能保持 Codex OAuth 和原生
线程行为不变，又能把旁路回答与父级
transcript 隔离开。与 Codex `/side` 一样，旁路线程会保留当前 Codex
权限和原生工具表面，同时带有护栏，告诉模型不要把继承的父线程工作
当作活动指令。非 Codex 运行时
保留较旧的直接一次性路径。

## 它不做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 将 BTW 问题/回答数据写入 transcript 历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它是刻意设计为**临时的**。

## 上下文如何工作

BTW 只将当前会话用作**背景上下文**。

如果主运行当前处于活动状态，OpenClaw 会快照当前消息
状态，并将正在进行中的主提示作为背景上下文包含进去，同时
明确告诉模型：

- 只回答旁路问题，
- 不要恢复或完成未完成的主任务，
- 不要 Steer 父级对话。

这会让 BTW 与主运行隔离，同时仍然让它了解
会话的主题。

## 交付模型

BTW **不会**作为普通助手 transcript 消息交付。

在 Gateway 网关协议层面：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意的。如果 BTW 复用普通 `chat` 事件路径，
客户端会把它当作常规对话历史处理。

因为 BTW 使用独立的实时事件，且不会从
`chat.history` 重放，所以它会在重新加载后消失。

## 表面行为

### TUI

在 TUI 中，BTW 会以内联方式渲染在当前会话视图中，但它仍然是
临时的：

- 与普通助手回复有明显区分
- 可用 `Enter` 或 `Esc` 关闭
- 重新加载时不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 等渠道上，BTW 会作为
带有清晰标签的一次性回复交付，因为这些表面没有本地
临时浮层概念。

该回答仍会被视为旁路结果，而不是普通会话历史。

### Control UI / web

Gateway 网关会正确地将 BTW 作为 `chat.side_result` 发出，并且 BTW 不会包含
在 `chat.history` 中，因此 web 的持久化契约已经正确。

当前 Control UI 仍然需要一个专用的 `chat.side_result` consumer，才能在
浏览器中实时渲染 BTW。在该客户端侧支持落地之前，BTW 是一个
Gateway 网关级功能，拥有完整的 TUI 和外部渠道行为，但还不是
完整的浏览器 UX。

## 何时使用 BTW

当你想要以下内容时使用 `/btw`：

- 关于当前工作的快速澄清，
- 在长时间运行仍在进行时获得事实性旁路回答，
- 一个不应成为未来会话上下文一部分的临时回答。

示例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不使用 BTW

当你希望回答成为会话
未来工作上下文的一部分时，不要使用 `/btw`。

这种情况下，请在主会话中正常提问，而不是使用 BTW。

## 相关

<CardGroup cols={2}>
  <Card title="Slash commands" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="Thinking levels" href="/zh-CN/tools/thinking" icon="brain">
    旁路问题模型调用的推理强度级别。
  </Card>
  <Card title="Session" href="/zh-CN/concepts/session" icon="comments">
    会话键、历史和持久化语义。
  </Card>
  <Card title="Steer command" href="/zh-CN/tools/steer" icon="arrow-right">
    在不结束活动运行的情况下，向其中注入一条 Steering 消息。
  </Card>
</CardGroup>
