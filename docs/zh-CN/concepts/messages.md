---
read_when:
    - 解释入站消息如何变成回复
    - 说明会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-05T08:21:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# 消息

本页将 OpenClaw 如何处理入站消息、会话、排队、流式传输和推理可见性串联起来。

## 消息流（高层）

```
入站消息
  -> 路由/绑定 -> 会话键
  -> 队列（如果某个运行处于活动状态）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

关键调节项位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖（`channels.whatsapp.*`、`channels.telegram.*` 等）用于容量上限和流式传输开关。

完整 schema 参见 [配置](/gateway/configuration)。

## 入站去重

渠道在重新连接后可能会重复投递同一条消息。OpenClaw 会维护一个短期缓存，按渠道/账号/对端/会话/消息 id 建立键，因此重复投递不会再次触发智能体运行。

## 入站去抖动

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 合并为一次智能体轮次。去抖动按每个渠道 + 会话范围生效，并使用最新消息来进行回复线程/ID 绑定。

配置（全局默认值 + 按渠道覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

说明：

- 去抖动仅适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过去抖动，从而保持独立。

## 会话和设备

会话归 Gateway 网关所有，而不是归客户端所有。

- 私聊会折叠到智能体主会话键。
- 群组/渠道会获得各自的会话键。
- 会话存储和转录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一个会话，但历史不会完全同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分叉。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录，因此它们是真实来源。

详情： [会话管理](/concepts/session)。

## 入站正文和历史上下文

OpenClaw 将**提示正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。其中可包含渠道封装和可选历史包装器。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧别名（为兼容性保留）。

当渠道提供历史时，会使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非私聊**（群组/渠道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用相同风格）。这样可以让实时消息与排队/历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含未触发运行的群组消息 _（例如受提及门控限制的消息）_，并且**排除**已存在于会话转录中的消息。

指令剥离仅适用于**当前消息**部分，因此历史会保持完整。包装历史的渠道应将 `CommandBody`（或 `RawBody`）设为原始消息文本，并将 `Body` 保持为合并后的提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及按渠道覆盖（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`）进行配置（设为 `0` 可禁用）。

## 排队和后续消息

如果某次运行已经处于活动状态，入站消息可以进入队列、转向当前运行，或收集到后续轮次中。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）进行配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及 backlog 变体。

详情： [排队](/concepts/queue)。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。
分块会遵循渠道文本限制，并避免拆分带围栏的代码块。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认 off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（块回复之间的人类式停顿）
- 渠道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情： [流式传输 + 分块](/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 用于控制可见性。
- 当模型产生推理内容时，这些内容仍会计入 token 使用量。
- Telegram 支持将推理流式传输到草稿气泡中。

详情： [Thinking + 推理指令](/tools/thinking) 和 [Token 使用](/reference/token-use)。

## 前缀、线程和回复

出站消息格式由 `messages` 统一控制：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值实现回复线程

详情： [配置](/gateway/configuration-reference#messages) 和各渠道文档。

## 相关内容

- [流式传输](/concepts/streaming) — 实时消息投递
- [重试](/concepts/retry) — 消息投递重试行为
- [队列](/concepts/queue) — 消息处理队列
- [渠道](/channels) — 消息平台集成
