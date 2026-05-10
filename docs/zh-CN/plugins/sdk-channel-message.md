---
read_when:
    - 你正在构建或重构一个消息渠道插件
    - 你需要持久的最终回复送达、回执、实时预览定稿或接收确认策略
    - 你正在从旧版回复流水线或入站回复分发辅助函数迁移
summary: 用于渠道插件的消息生命周期 API，包括持久发送、回执、实时预览、接收确认策略和旧版迁移
title: 频道消息 API
x-i18n:
    generated_at: "2026-05-10T19:42:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

渠道插件应该从 `openclaw/plugin-sdk/channel-message` 暴露一个 `message` 适配器。该适配器描述平台支持的原生消息生命周期：

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

核心负责队列处理、持久性、通用重试策略、钩子、回执，以及共享的 `message` 工具。插件负责原生发送/编辑/删除调用、目标规范化、平台线程、选定引用、通知标志、账户状态，以及平台特定的副作用。

将本页与[构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)一起使用。

`channel-message` 子路径特意保持足够轻量，适合 `channel.ts` 这样的热路径插件引导文件：它会暴露适配器契约、能力证明、回执和兼容性门面，而不会加载出站投递。运行时投递辅助函数可从 `openclaw/plugin-sdk/channel-message-runtime` 获取，用于已经在执行异步消息 I/O 的监控/发送代码路径。

新的渠道和插件发送代码应使用 `openclaw/plugin-sdk/channel-message-runtime` 中的消息生命周期辅助函数：`sendDurableMessageBatch`、`withDurableMessageSendContext` 或 `deliverInboundReplyWithMessageSendContext`。`openclaw/plugin-sdk/outbound-runtime` 中较旧的 `deliverOutboundPayloads(...)` 辅助函数已弃用，它只是用于出站内部机制、恢复和旧版适配器的兼容性/运行时基础。不要在新的渠道或插件发送路径中使用它。

`sendDurableMessageBatch(...)` 返回显式的生命周期结果：

- `sent` - 至少已投递一条可见的平台消息。
- `suppressed` - 不应将缺失的平台消息视为问题。稳定原因包括 `cancelled_by_message_sending_hook`、`empty_after_message_sending_hook`、`no_visible_payload`、`adapter_returned_no_identity` 和旧版 `no_visible_result`。
- `partial_failed` - 在后续载荷或副作用失败之前，至少已投递一条平台消息。结果包含已投递回执前缀以及失败信息。
- `failed` - 未产生平台回执。

当一个批次混合了已发送、已抑制和失败的载荷时，使用 `payloadOutcomes`。不要通过检查旧的直接投递数组是否为空来推断钩子取消。

仍需要缓冲回复调度器的兼容性调度器，应使用 `openclaw/plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline(...)` 构建回复前缀选项，然后调用运行时的 `channel.turn.runPrepared(...)`。这样可以将会话记录和调度顺序保留在共享轮次生命周期上，而无需添加另一个公开轮次包装器。

## 最小适配器

大多数新的渠道插件可以从一个小型适配器开始：

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

然后将其附加到渠道插件：

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

只声明适配器真正保留的能力。每个已声明能力都应有契约测试。

## 出站桥接

如果该渠道已经有兼容的 `outbound` 适配器，优先派生消息适配器，而不是重复发送代码：

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

该桥接会将旧的出站发送结果转换为 `MessageReceipt` 值。新代码应端到端传递回执，并且只在兼容性边界使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生旧版 ID。
如果未提供接收策略，`createChannelMessageAdapterFromOutbound(...)` 会使用 `manual` 接收确认策略。这会明确插件拥有的平台确认责任，而不会改变那些在通用接收上下文之外确认 webhook、socket 或轮询偏移的渠道。

## 消息工具发送

共享的 `message(action="send")` 路径应使用与最终回复相同的核心投递生命周期。如果某个渠道需要为工具发送执行提供商特定的塑形，请实现 `actions.prepareSendPayload(...)`，而不是从 `actions.handleAction(...)` 发送。

`prepareSendPayload(...)` 会接收规范化的核心 `ReplyPayload` 以及完整的操作上下文。返回一个在 `payload.channelData.<channel>` 中带有渠道特定数据的载荷，并让核心调用 `sendMessage(...)`、消息生命周期运行时、预写队列、消息发送钩子、重试、恢复和 ack 清理。生命周期运行时可能会在内部调用 `deliverOutboundPayloads(...)` 作为兼容性基础，但渠道插件不应为新的发送行为直接调用它。

只有当发送无法表示为持久载荷时才返回 `null`，例如因为它包含不可序列化的组件工厂。核心会保留旧版插件操作回退以实现兼容，但新的渠道发送功能应能表示为持久载荷数据。

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

随后出站适配器会在 `sendPayload` 中读取 `payload.channelData.demo`。这会将平台特定的渲染保留在插件中，同时仍由核心负责持久化、重试、恢复、钩子和 ack。

已准备的 `message(action="send")` 载荷和通用最终回复投递默认使用带尽力而为队列处理的核心投递。只有在核心验证渠道能够协调一次崩溃后结果未知的发送之后，必需的持久队列处理才有效。如果适配器无法实现 `reconcileUnknownSend`，请将已准备发送路径保持为尽力而为；核心仍会尝试预写队列，但队列持久化或不确定崩溃恢复不属于必需的投递契约。

## 持久最终能力

持久最终投递按副作用选择启用。只有当适配器声明了载荷和投递选项所需的每项能力时，核心才会使用通用持久投递。

| 能力                   | 何时声明                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 适配器可以发送文本并返回回执。                                                       |
| `media`                | 媒体发送会为每条可见平台消息返回回执。                                               |
| `payload`              | 适配器会保留富回复载荷语义，而不仅是文本和一个媒体 URL。                             |
| `replyTo`              | 原生回复目标会到达平台。                                                             |
| `thread`               | 原生线程、主题或渠道线程目标会到达平台。                                             |
| `silent`               | 通知抑制会到达平台。                                                                 |
| `nativeQuote`          | 选定引用元数据会到达平台。                                                           |
| `messageSendingHooks`  | 核心消息发送钩子可以在平台 I/O 之前取消或重写内容。                                  |
| `batch`                | 多部分渲染批次可以作为一个持久计划重放。                                             |
| `reconcileUnknownSend` | 适配器可以在不盲目重放的情况下解决 `unknown_after_send` 恢复。                       |
| `afterSendSuccess`     | 渠道本地发送后副作用只运行一次。                                                     |
| `afterCommit`          | 渠道本地提交后副作用只运行一次。                                                     |

尽力而为的最终投递不需要 `reconcileUnknownSend`；当适配器保留载荷的可见语义时，它会使用共享生命周期，并在队列持久化不可用时回退到直接平台 I/O。必需的持久最终投递必须显式要求 `reconcileUnknownSend`。如果适配器无法确定已开始/未知的发送是否到达平台，请不要声明该能力；核心会在入队前拒绝必需的持久投递。

当调用方需要持久投递时，应派生需求，而不是手动构建映射：

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

默认需要 `messageSendingHooks`。只有对于有意无法运行全局消息发送钩子的路径，才设置 `messageSendingHooks: false`。

## 持久发送契约

持久最终发送比旧版渠道自有投递具有更严格的语义：

- 在平台 I/O 之前创建持久意图。
- 如果持久投递返回已处理结果，不要回退到旧版发送。
- 将钩子取消和不发送结果视为终态。
- 仅将 `unsupported` 视为意图前结果。
- 对于必需的持久性，如果队列无法记录平台发送已开始，则在平台 I/O 前失败。
- 对于必需的最终投递和必需的已准备消息工具发送，预检 `reconcileUnknownSend`；恢复必须能够 ack 已发送的消息，或只有在适配器证明原始发送未发生后才重放。
- 对于 `best_effort`，队列写入失败可以回退到直接平台 I/O。
- 将中止信号转发给媒体加载和平台发送。
- 在队列 ack 后运行提交后钩子；直接尽力而为回退会在成功的平台 I/O 后运行它们，因为没有持久队列提交。
- 为每个可见平台消息 ID 返回回执。
- 当平台可以检查不确定的发送是否已经到达用户时，使用 `reconcileUnknownSend`。

该契约可以避免崩溃后的重复发送，并避免绕过消息发送取消钩子。

## 回执

`MessageReceipt` 是平台已接受内容的新内部记录：

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

在适配现有发送结果时，使用 `createMessageReceiptFromOutboundResults(...)`。当实时预览消息变为最终回执时，使用 `createPreviewMessageReceipt(...)`。避免新增所有者本地的 `messageIds` 字段。旧版 `ChannelDeliveryResult.messageIds` 仍会在兼容边界生成。

## 实时预览

流式传输草稿预览或进度更新的渠道应声明实时能力：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

对运行时最终化，使用 `defineFinalizableLivePreviewAdapter(...)` 和 `deliverWithFinalizableLivePreviewAdapter(...)`。finalizer 决定最终回复是就地编辑预览、发送普通回退、丢弃待处理的预览状态、保留一次不明确的失败编辑且不重复发送消息，并返回最终回执。

## 接收确认策略

控制平台确认时机的入站接收器应声明接收策略：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

未声明接收策略的适配器默认使用：

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

当平台没有可延迟的确认、已在异步处理之前确认，或需要协议特定的响应语义时，使用默认值。只有当接收器实际使用接收上下文将平台确认推迟到更晚时，才声明其中一种分阶段策略。

策略：

| 策略                   | 使用场景                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | 平台可在入站事件被解析并记录后确认。                                                     |
| `after_agent_dispatch` | 平台应等到智能体派发被接受后再确认。                                                     |
| `after_durable_send`   | 平台应等到最终投递已有持久化决策后再确认。                                               |
| `manual`               | 插件拥有确认逻辑，因为平台语义不匹配通用阶段。                                           |

在会延迟确认状态的接收器中使用 `createMessageReceiveContext(...)`；当接收器需要测试某个阶段是否已满足配置的策略时，使用 `shouldAckMessageAfterStage(...)`。

## 契约测试

能力声明是插件契约的一部分。用测试为它们提供支撑：

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

当适配器声明这些功能时，添加实时和接收证明套件。缺失证明应使测试失败，而不是静默扩大持久化表面。

## 已弃用的兼容性 API

这些 API 仍可导入以支持第三方兼容性。不要在新的渠道代码中使用它们。

| 已弃用的 API                                | 替代方案                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | 用于兼容性派发器的 `createChannelMessageReplyPipeline(...)`，或用于新渠道代码的 `message` 适配器                           |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或用于新渠道代码的 `message` 适配器           |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或用于新渠道代码的 `message` 适配器           |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或用于新渠道代码的 `message` 适配器           |
| `deliverOutboundPayloads(...)`               | 来自 `channel-message-runtime` 的 `sendDurableMessageBatch(...)` 或 `deliverInboundReplyWithMessageSendContext(...)`       |
| `deliverDurableInboundReplyPayload(...)`     | 来自 `openclaw/plugin-sdk/channel-message-runtime` 的 `deliverInboundReplyWithMessageSendContext(...)`                     |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或用于新渠道代码的 `message` 适配器           |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或用于新渠道代码的 `message` 适配器           |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` 加 `deliverWithFinalizableLivePreviewAdapter(...)`                              |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

兼容性派发器仍可通过消息门面使用 `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)` 和 `createTypingCallbacks(...)`。新的生命周期代码应避免使用旧的 `channel-reply-pipeline` 子路径。

## 迁移清单

1. 向渠道插件添加 `message: defineChannelMessageAdapter(...)` 或 `message: createChannelMessageAdapterFromOutbound(...)`。
2. 从文本、媒体和载荷发送返回 `MessageReceipt`。
3. 只声明由原生行为和测试支撑的能力。
4. 用 `deriveDurableFinalDeliveryRequirements(...)` 替换手写的持久化需求映射。
5. 当渠道就地编辑草稿消息时，通过实时预览辅助函数移动预览最终化。
6. 只有当接收器确实能延迟平台确认时，才声明接收确认策略。
7. 仅在兼容边界保留旧版回复派发辅助函数。
