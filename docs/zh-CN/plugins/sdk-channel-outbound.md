---
read_when:
    - 你正在构建或重构消息渠道插件的发送路径
    - 你需要持久的最终回复投递、回执、实时预览最终化或接收确认策略
    - 你正在从 channel-message、channel-message-runtime 或旧版回复分发辅助工具迁移
summary: 渠道插件的出站消息生命周期 API：适配器、回执、持久发送、实时预览和回复流水线辅助工具
title: 渠道出站 API
x-i18n:
    generated_at: "2026-07-06T10:50:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dea22c6a8de9a90a9ea182b18d922711e332efcd97ff429c7bc95d5807a7d1ad
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

渠道插件通过 `openclaw/plugin-sdk/channel-outbound` 暴露出站消息行为。使用 `openclaw/plugin-sdk/channel-inbound` 处理接收、上下文和分发编排。

核心负责排队、持久性、通用重试策略、Hooks、回执，以及共享的 `message` 工具。插件负责原生发送、编辑、删除调用，目标规范化，平台线程，选定引用，通知标志，账户状态，以及平台特定的副作用。

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

只声明原生传输实际会保留的能力。对每个声明的发送、回执、实时预览和接收确认能力，都要使用此子路径导出的契约辅助函数覆盖。

## 投递证据

`MessageReceipt` 记录渠道适配器返回的结果。具体的平台消息标识符表明平台发送路径已接受该消息；它们不能证明接收者的设备已显示或读取该消息。没有平台消息标识符的回执仅是本地回执元数据。具备已读回执或设备投递状态的渠道，应通过单独的渠道特定路径跟踪这些事实。

## 现有出站适配器

如果该渠道已有兼容的 `outbound` 适配器，请派生消息适配器，而不是重复发送代码：

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
- 草稿流式传输/进度辅助函数，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 返回一个显式结果：

| 结果             | 含义                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | 至少一条可见平台消息已被平台发送路径接受                                                |
| `suppressed`     | 不应将任何平台消息视为缺失                                                              |
| `partial_failed` | 在后续载荷或副作用失败之前，至少一条平台消息已被接受                                    |
| `failed`         | 未生成任何平台回执                                                                      |

当一个批次混合了已发送、已抑制和失败的载荷时，使用 `payloadOutcomes`。不要从空的旧版直接投递结果推断 Hook 取消。

## 兼容性分发

通过 `channel-inbound` 中的 `dispatchChannelInboundReply(...)` 组装入站回复分发。将平台投递保留在投递适配器中；使用 `channel-outbound` 处理消息适配器、持久发送、回执、实时预览和回复流水线选项。
