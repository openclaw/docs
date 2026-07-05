---
read_when:
    - 你想询问一个关于当前会话的简短附带问题
    - 你正在跨客户端实现或调试 BTW 行为
summary: 使用 /btw 提出临时附带问题
title: 顺便问几个问题
x-i18n:
    generated_at: "2026-07-05T11:43:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c20220c037e4b6963b1708f75dc7f268a76b88b297363e9b65e6d3d8bfa6d26a
    source_path: tools/btw.md
    workflow: 16
---

`/btw`（别名 `/side`）用于询问关于**当前会话**的快速旁路问题，而不会将其加入对话历史。它以 Claude Code 的 `/btw` 为模型，并适配了 OpenClaw 的 Gateway 网关和多渠道架构。

```text
/btw what changed?
/side what does this error mean?
```

## 它的作用

1. 将当前会话快照为后台上下文（包括任何正在进行的主运行提示词）。
2. 运行一个单独的一次性旁路查询，指示模型只回答这个旁路问题，不要恢复或 Steer 主任务。
3. 将答案作为实时旁路结果交付，而不是普通的助手消息。
4. 绝不把问题或答案写入会话历史或 `chat.history`。

如果主运行处于活动状态，它会保持不变。

对于 Codex harness 会话，BTW 会将活动的 Codex app-server 线程 fork 到一个临时子线程，而不是运行单独的提供商调用。这会保持 Codex OAuth 以及原生工具/线程行为不变，且 fork 后的线程会保留父线程当前的审批策略、沙箱和原生工具表面。fork 后的线程会获得一个边界提示词，告知模型边界之前的所有内容都是继承的参考上下文，而不是活动指令，并且只有边界之后的消息才是实时的。`/btw` 需要已有的 Codex 线程；请先发送一条普通消息。

对于 CLI 运行时别名，BTW 会以一次性旁路问题模式调用所属的 CLI 后端：它会将经过清理的对话上下文注入到一次新的 CLI 调用中，并禁用工具打包和可复用会话状态，同时添加后端支持的任何不恢复/禁用工具标志。直接（非 CLI）运行时则改用直接的一次性提供商调用。

## 它不做什么

`/btw` 不会创建持久会话、继续未完成的主任务、将问题/答案数据持久化到转录历史，也不会在重新加载后保留。

## 交付模型

普通助手聊天使用 Gateway 网关的 `chat` 事件。BTW 使用单独的 `chat.side_result` 事件，因此客户端不会将其误认为常规对话历史。因为它不会从 `chat.history` 重放，所以会在重新加载后消失。

## 界面行为

| 界面 | 行为 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI | 在聊天日志中内联渲染，并且与普通回复有明显区分，可用 `Enter` 或 `Esc` 关闭。 |
| 外部渠道 | 作为清晰标记的一次性回复交付（Telegram、WhatsApp、Discord 没有本地临时浮层）。 |
| Control UI / web | Gateway 网关会正确发出 `chat.side_result`，且它会被排除在 `chat.history` 之外，但 Control UI 目前还没有消费者在浏览器中实时渲染它。 |

## 何时使用它

使用 `/btw` 获取快速澄清、在长运行仍在进行时获取事实性旁路答案，或获取一个不应进入未来会话上下文的临时答案。

```text
/btw what file are we editing?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

对于任何你希望成为会话未来工作上下文一部分的内容，请改为在主会话中正常提问。

## 相关

<CardGroup cols={2}>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="思考级别" href="/zh-CN/tools/thinking" icon="brain">
    旁路问题模型调用的推理强度级别。
  </Card>
  <Card title="会话" href="/zh-CN/concepts/session" icon="comments">
    会话键、历史和持久化语义。
  </Card>
  <Card title="Steer 命令" href="/zh-CN/tools/steer" icon="arrow-right">
    在不结束活动运行的情况下向其中注入一条转向消息。
  </Card>
</CardGroup>
