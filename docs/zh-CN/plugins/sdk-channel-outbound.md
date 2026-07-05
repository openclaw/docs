---
read_when:
    - 你正在构建或重构消息渠道插件的发送路径
    - 你需要持久可靠的最终回复递送、回执、实时预览最终确认，或接收确认策略
    - 你正在从 `channel-message`、`channel-message-runtime` 或旧版回复分发辅助工具迁移
summary: 用于渠道插件的出站消息生命周期 API：适配器、回执、持久化发送、实时预览和回复流水线助手
title: 渠道出站 API
x-i18n:
    generated_at: "2026-07-05T11:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d85846fcfbc8d2119794dff83c851a746f696ba8273b3d0c872377a429bfe8
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

渠道插件通过 `openclaw/plugin-sdk/channel-outbound` 暴露出站消息行为。使用
`openclaw/plugin-sdk/channel-inbound` 进行接收、上下文和分发编排。

核心负责队列、持久性、通用重试策略、钩子、回执以及共享的 `message` 工具。插件负责原生发送、编辑、删除调用，目标规范化，平台线程处理，选定引用，通知标记，账号状态，以及平台特定的副作用。

## 适配器

大多数插件会定义一个 `message` 适配器：

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

只声明原生传输确实会保留的能力。使用此子路径导出的契约辅助函数覆盖每个已声明的发送、回执、实时预览和接收确认能力。

## 现有出站适配器

如果渠道已经有兼容的 `outbound` 适配器，请基于它派生消息适配器，而不是重复发送代码：

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## 持久发送

运行时发送辅助函数也位于 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- draft 流式传输/进度辅助函数，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 返回一个明确的结果：

| 结果             | 含义                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `sent`           | 至少一条可见的平台消息已送达                                                             |
| `suppressed`     | 不应将任何平台消息视为缺失                                                               |
| `partial_failed` | 在后续载荷或副作用失败之前，至少一条平台消息已送达                                      |
| `failed`         | 未产生平台回执                                                                           |

当一个批次混合了已发送、已抑制和失败的载荷时，使用 `payloadOutcomes`。不要从空的旧版直接递送结果推断钩子取消。

## 兼容性分发

通过 `channel-inbound` 中的 `dispatchChannelInboundReply(...)` 组装入站回复分发。将平台递送保留在递送适配器中；使用 `channel-outbound` 处理消息适配器、持久发送、回执、实时预览和回复流水线选项。
