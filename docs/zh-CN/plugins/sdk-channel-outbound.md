---
read_when:
    - 你正在构建或重构消息渠道插件的发送路径
    - 你需要持久可靠的最终回复投递、回执、实时预览定稿或接收确认策略
    - 你正在从 channel-message、channel-message-runtime 或旧版回复分发辅助函数迁移
summary: 渠道插件的出站消息生命周期 API：适配器、回执、持久发送、实时预览和回复管线辅助工具
title: 渠道出站 API
x-i18n:
    generated_at: "2026-07-11T20:48:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

渠道插件通过 `openclaw/plugin-sdk/channel-outbound` 暴露出站消息行为。接收、上下文和分派编排请使用 `openclaw/plugin-sdk/channel-inbound`。

核心负责排队、持久性、通用重试策略、钩子、回执以及共享的 `message` 工具。插件负责原生发送、编辑和删除调用、目标规范化、平台线程、所选引用、通知标志、账户状态以及平台特定的副作用。

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

仅声明原生传输实际能够保留的能力。对于声明的每项发送、回执、实时预览和接收确认能力，都应使用此子路径导出的契约辅助函数进行覆盖。

## 纯文本清理

当出站适配器需要将支持的 HTML 格式标签转换为轻量文本标记时，请使用 `sanitizeForPlainText(...)`。默认样式会保留现有聊天风格的粗体和删除线标记。仅当渠道会将结果重新解析为 Markdown 时，才传入 `{ style: "markdown" }`：

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown 样式使用 `**bold**` 和 `~~strikethrough~~`；在两种样式中，斜体和行内代码都分别保留 `_italic_` 和反引号标记。应在渠道边界选择样式，而不是在清理后重写标记文本。

## 投递证据

`MessageReceipt` 记录渠道适配器返回的结果。具体的平台消息标识符表明平台发送路径已接受消息；它们并不能证明接收方设备已显示或读取该消息。没有平台消息标识符的回执仅属于本地回执元数据。具备已读回执或设备投递状态的渠道应通过独立的渠道特定路径跟踪这些事实。

如果渠道适配器能够证明重试失败操作不会导致接收方可见的重复发送，并且尚未开始任何可完成最终提交的调用，请从 `openclaw/plugin-sdk/error-runtime` 抛出 `new PlatformMessageNotDispatchedError("...", { cause: error })`。这样核心便可清除过期的发送尝试证据，并安全地重试已排队的意图。只有负责最终分派边界的适配器才能作出此断言。最终提交或发送调用一旦开始，或返回模棱两可的结果后，绝不能使用此标记；错误标记可能导致消息重复。

## 现有出站适配器

如果渠道已有兼容的 `outbound` 适配器，请基于它派生消息适配器，而不是重复发送代码：

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

`sendDurableMessageBatch(...)` 返回以下一种明确结果：

| 结果             | 含义                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `sent`           | 平台发送路径至少接受了一条可见的平台消息                               |
| `suppressed`     | 不应将任何平台消息视为缺失                                             |
| `partial_failed` | 在后续载荷或副作用失败前，至少有一条平台消息已被接受                   |
| `failed`         | 未生成平台回执                                                         |

当批次混合了已发送、已抑制和失败的载荷时，请使用 `payloadOutcomes`。不要根据空的旧版直接投递结果推断钩子取消。

## 延迟投递准入

当已解析的账户无法安全接受由核心管理的出站或延迟投递时，请使用 `message.durableFinal.admitDeferredDelivery(...)`。核心会在实时出站工作开始前同步调用此钩子，包括跳过队列持久化的路径；在重放恢复的意图前也会再次调用。上下文包括 `cfg`、`channel`、`to`、`accountId`，以及值为 `live` 或 `recovery` 的 `phase`。

返回 `{ status: "allowed" }` 以继续。若不得持久化、直接发送或重放该投递，请返回 `{ status: "permanent_rejection", reason }`。实时拒绝会在创建队列、执行消息钩子或平台工作之前失败。恢复拒绝会将排队记录标记为失败，并跳过对账与重放。省略此钩子即表示允许。

此钩子是同步准入决策，而非发送路径。只能读取已加载的配置或运行时状态；不得执行网络、文件系统或其他异步 I/O。契约测试应通过 `openclaw/plugin-sdk/channel-outbound` 中的 `ChannelMessageDurableFinalAdapter` 覆盖两个阶段及两种结果变体。

## 兼容性分派

通过 `channel-inbound` 中的 `dispatchChannelInboundReply(...)` 组装入站回复分派。将平台投递保留在投递适配器中；消息适配器、持久发送、回执、实时预览和回复管道选项则使用 `channel-outbound`。
