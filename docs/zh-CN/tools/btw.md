---
read_when:
    - 你想询问一个关于当前会话的快速附带问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 的临时旁支问题
title: 顺便问几个问题
x-i18n:
    generated_at: "2026-06-27T03:25:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 让你可以就**当前会话**快速提出一个旁路问题，而不会把这个问题变成普通对话历史。`/side` 是它的别名。

它参考了 Claude Code 的 `/btw` 行为，但适配了 OpenClaw 的 Gateway 网关和多渠道架构。

## 它会做什么

当你发送：

```text
/btw what changed?
```

OpenClaw 会：

1. 为当前会话上下文创建快照，
2. 运行一个独立的临时旁路查询，
3. 只回答这个旁路问题，
4. 不影响主运行，
5. **不会**把 BTW 问题或回答写入会话历史，
6. 将回答作为**实时旁路结果**发出，而不是普通的助手消息。

重要的心智模型是：

- 相同的会话上下文
- 独立的一次性旁路查询
- 当会话使用原生 harness 时，使用相同的原生 harness 传输
- 不污染未来上下文
- 不持久化 transcript

对于 Codex harness 会话，BTW 会通过将活动 app-server thread fork 为临时旁路 thread，留在 Codex 内部。这会保持 Codex OAuth 和原生 thread 行为不变，同时仍然把旁路回答与父 transcript 隔离。与 Codex `/side` 一样，旁路 thread 保留当前 Codex 权限和原生工具表面，并带有 guardrails，告诉模型不要把继承的父 thread 工作当作活动指令。

对于 CLI 运行时别名，BTW 会使用所属 CLI 后端的旁路问题模式，而不是回退到直接提供商调用。OpenClaw 会把经过清理的对话上下文注入到一个新的一次性 CLI 调用中，为该调用禁用 OpenClaw MCP 工具打包和可复用 CLI 会话状态，并让后端添加其支持的任何 CLI 原生 no-resume 或 no-tools 标志。直接的非 CLI 运行时会保留直接的一次性路径。

## 它不会做什么

`/btw` **不会**：

- 创建新的持久会话，
- 继续未完成的主任务，
- 将 BTW 问题/回答数据写入 transcript 历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它有意设计为**临时**。

## 上下文如何工作

BTW 只把当前会话用作**背景上下文**。

如果主运行当前处于活动状态，OpenClaw 会为当前消息状态创建快照，并把正在进行的主提示词作为背景上下文包含进去，同时明确告诉模型：

- 只回答旁路问题，
- 不要恢复或完成未完成的主任务，
- 不要 steer 父对话。

这会让 BTW 与主运行隔离，同时仍然了解会话的主题。

## 交付模型

BTW **不会**作为普通助手 transcript 消息交付。

在 Gateway 网关协议层面：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意设计的。如果 BTW 复用普通 `chat` 事件路径，客户端会把它当作常规对话历史。

因为 BTW 使用独立的实时事件，并且不会从 `chat.history` 重放，所以它会在重新加载后消失。

## 表面行为

### TUI

在 TUI 中，BTW 会以内联方式呈现在当前会话视图中，但它仍然是临时的：

- 与普通助手回复在视觉上明显区分
- 可用 `Enter` 或 `Esc` 关闭
- 重新加载后不会重放

### 外部渠道

在 Telegram、WhatsApp 和 Discord 等渠道上，BTW 会作为带有清晰标签的一次性回复交付，因为这些表面没有本地临时叠层概念。

该回答仍然被视为旁路结果，而不是普通会话历史。

### Control UI / web

Gateway 网关会正确地将 BTW 作为 `chat.side_result` 发出，并且 BTW 不包含在 `chat.history` 中，因此 web 的持久化契约已经正确。

当前 Control UI 仍然需要专用的 `chat.side_result` 消费者，以便在浏览器中实时渲染 BTW。在该客户端支持落地之前，BTW 是一个具备完整 TUI 和外部渠道行为的 Gateway 网关级功能，但还不是完整的浏览器 UX。

## 何时使用 BTW

当你想要以下内容时，使用 `/btw`：

- 对当前工作进行快速澄清，
- 在长时间运行仍在进行时获得事实性旁路回答，
- 获得一个不应成为未来会话上下文一部分的临时回答。

示例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不要使用 BTW

当你希望回答成为会话未来工作上下文的一部分时，不要使用 `/btw`。

在这种情况下，请在主会话中正常提问，而不是使用 BTW。

## 相关

<CardGroup cols={2}>
  <Card title="Slash commands" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="Thinking levels" href="/zh-CN/tools/thinking" icon="brain">
    旁路问题模型调用的推理强度等级。
  </Card>
  <Card title="Session" href="/zh-CN/concepts/session" icon="comments">
    会话键、历史和持久化语义。
  </Card>
  <Card title="Steer command" href="/zh-CN/tools/steer" icon="arrow-right">
    向活动运行注入一条 steering 消息，而不结束它。
  </Card>
</CardGroup>
