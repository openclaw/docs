---
read_when:
    - 你正在建置或重構訊息通道 Plugin
    - 你需要持久可靠的最終回覆傳遞、回條、即時預覽定稿，或接收確認政策
    - 你正在從舊版回覆管線或傳入回覆分派輔助函式遷移
summary: 頻道 Plugin 的訊息生命週期介面，包含持久化傳送、回執、即時預覽、接收確認政策和舊版遷移
title: 通道訊息 API
x-i18n:
    generated_at: "2026-05-10T19:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Channel Plugin 應從 `openclaw/plugin-sdk/channel-message` 暴露一個 `message` adapter。此 adapter 描述平台支援的原生訊息生命週期：

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

核心擁有佇列、耐久性、通用重試政策、hook、receipt，以及共用的 `message` 工具。Plugin 擁有原生 send/edit/delete 呼叫、目標正規化、平台 threaded 訊息、選取的引文、通知旗標、帳號狀態，以及平台特定的副作用。

請搭配 [建置 Channel Plugin](/zh-TW/plugins/sdk-channel-plugins) 使用本頁。

`channel-message` 子路徑刻意設計得足夠輕量，適合 `channel.ts` 這類熱 Plugin 啟動檔案：它會暴露 adapter contract、capability proof、receipt，以及相容性 facade，而不載入 outbound delivery。Runtime delivery helper 可從 `openclaw/plugin-sdk/channel-message-runtime` 取得，供已在執行非同步訊息 I/O 的 monitor/send 程式路徑使用。

新的 Channel 與 Plugin send 程式碼應使用 `openclaw/plugin-sdk/channel-message-runtime` 的訊息生命週期 helper：`sendDurableMessageBatch`、`withDurableMessageSendContext` 或 `deliverInboundReplyWithMessageSendContext`。`openclaw/plugin-sdk/outbound-runtime` 中較舊的 `deliverOutboundPayloads(...)` helper 是 outbound 內部、復原與舊版 adapter 的已棄用相容性/runtime 基底。不要在新的 Channel 或 Plugin send 路徑中使用它。

`sendDurableMessageBatch(...)` 會傳回明確的生命週期結果：

- `sent` - 至少已傳遞一則可見的平台訊息。
- `suppressed` - 不應將任何平台訊息視為遺失。穩定原因包含 `cancelled_by_message_sending_hook`、`empty_after_message_sending_hook`、`no_visible_payload`、`adapter_returned_no_identity`，以及舊版 `no_visible_result`。
- `partial_failed` - 在後續 payload 或副作用失敗前，至少已傳遞一則平台訊息。結果包含已傳遞的 receipt 前綴加上失敗。
- `failed` - 未產生平台 receipt。

當 batch 混合已送出、已抑制與失敗的 payload 時，請使用 `payloadOutcomes`。不要藉由檢查舊的直接傳遞陣列是否為空，來推斷 hook 取消。

仍需要 buffered reply dispatcher 的相容性 dispatcher，應使用 `openclaw/plugin-sdk/channel-message` 的 `createChannelMessageReplyPipeline(...)` 建立 reply-prefix 選項，然後呼叫 runtime 的 `channel.turn.runPrepared(...)`。如此可在共用的 turn 生命週期上維持 session recording 與 dispatch 排序，而不新增另一個公開 turn wrapper。

## 最小 adapter

多數新的 Channel Plugin 可以從小型 adapter 開始：

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

接著將它附加到 Channel Plugin：

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

只宣告 adapter 確實會保留的 capability。每個已宣告的 capability 都應有 contract test。

## Outbound bridge

如果 Channel 已有相容的 `outbound` adapter，請優先衍生 message adapter，而非重複 send 程式碼：

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

此 bridge 會將舊的 outbound send 結果轉換成 `MessageReceipt` 值。新程式碼應端到端傳遞 receipt，並且只在相容性邊界使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 衍生舊版 id。
如果未提供 receive policy，`createChannelMessageAdapterFromOutbound(...)` 會使用 `manual` receive acknowledgement policy。這會明確化 Plugin 擁有的平台 acknowledgement，而不變更在通用 receive context 之外 acknowledge webhook、socket 或 polling offset 的 Channel。

## Message tool sends

共用的 `message(action="send")` 路徑應使用與最終回覆相同的核心 delivery 生命週期。如果 Channel 需要針對 tool send 進行 provider 特定 shaping，請實作 `actions.prepareSendPayload(...)`，而不是從 `actions.handleAction(...)` 傳送。

`prepareSendPayload(...)` 會接收已正規化的核心 `ReplyPayload` 以及完整 action context。請傳回一個在 `payload.channelData.<channel>` 中包含 Channel 特定資料的 payload，並讓核心呼叫 `sendMessage(...)`、訊息生命週期 runtime、write-ahead queue、message-sending hook、retry、recovery 與 ack cleanup。生命週期 runtime 可能會在內部呼叫 `deliverOutboundPayloads(...)` 作為相容性基底，但 Channel Plugin 不應為新的 send 行為直接呼叫它。

只有當 send 無法表示為 durable payload 時才傳回 `null`，例如因為它包含不可序列化的 component factory。核心會為相容性保留舊版 Plugin action fallback，但新的 Channel send 功能應能表示為 durable payload data。

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

outbound adapter 接著會在 `sendPayload` 內讀取 `payload.channelData.demo`。這讓平台特定 rendering 保留在 Plugin 中，同時核心仍擁有 persist、retry、recover、hook 與 ack。

已準備的 `message(action="send")` payload 與通用 final-reply delivery，預設使用具備 best-effort queueing 的核心 delivery。只有在核心驗證 Channel 能 reconcile 一個在 crash 後 outcome 未知的 send 之後，required durable queueing 才有效。如果 adapter 無法實作 `reconcileUnknownSend`，請讓 prepared send 路徑維持 best-effort；核心仍會嘗試 write-ahead queue，但 queue persistence 或不確定的 crash recovery 不屬於 required delivery contract。

## Durable final capabilities

Durable final delivery 會依副作用個別選擇加入。核心只有在 adapter 宣告 payload 與 delivery 選項所需的每個 capability 時，才會使用通用 durable delivery。

| Capability             | 宣告時機                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter 可以傳送文字並傳回 receipt。                                                 |
| `media`                | Media send 會為每個可見的平台訊息傳回 receipt。                                      |
| `payload`              | Adapter 會保留 rich reply payload 語意，而不只是文字與一個媒體 URL。                 |
| `replyTo`              | 原生 reply 目標會抵達平台。                                                          |
| `thread`               | 原生 thread、topic 或 channel thread 目標會抵達平台。                                |
| `silent`               | 通知抑制會抵達平台。                                                                 |
| `nativeQuote`          | 選取的 quote metadata 會抵達平台。                                                   |
| `messageSendingHooks`  | 核心 message-sending hook 可以在平台 I/O 前取消或改寫內容。                           |
| `batch`                | 多部分 rendered batch 可作為一個 durable plan 重播。                                 |
| `reconcileUnknownSend` | Adapter 可以在不盲目重播的情況下解析 `unknown_after_send` recovery。                 |
| `afterSendSuccess`     | Channel-local after-send 副作用會執行一次。                                          |
| `afterCommit`          | Channel-local after-commit 副作用會執行一次。                                        |

Best-effort final delivery 不需要 `reconcileUnknownSend`；當 adapter 保留 payload 的可見語意時，它會使用共用生命週期，並在 queue persistence 無法使用時 fallback 到直接平台 I/O。Required durable final delivery 必須明確要求 `reconcileUnknownSend`。如果 adapter 無法判斷已開始/未知的 send 是否抵達平台，請不要宣告該 capability；核心會在 queueing 前拒絕 required durable delivery。

當呼叫端需要 durable delivery 時，請衍生 requirement，而不是手動建立 map：

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

預設需要 `messageSendingHooks`。只有在某個路徑刻意不能執行全域 message-sending hook 時，才設定 `messageSendingHooks: false`。

## Durable send contract

Durable final send 的語意比舊版 Channel 擁有的 delivery 更嚴格：

- 在平台 I/O 前建立 durable intent。
- 如果 durable delivery 傳回已處理結果，不要 fallback 到舊版 send。
- 將 hook 取消與 no-send 結果視為終止。
- 只將 `unsupported` 視為 pre-intent 結果。
- 對於 required durability，如果 queue 無法記錄平台 send 已開始，請在平台 I/O 前失敗。
- 對於 required final delivery 與 required prepared message-tool send，請預檢 `reconcileUnknownSend`；recovery 必須能 ack 已送出的訊息，或只在 adapter 證明原始 send 未發生後才重播。
- 對於 `best_effort`，queue write failure 可 fallback 到直接平台 I/O。
- 將 abort signal 轉送給 media loading 與平台 send。
- 在 queue ack 後執行 after-commit hook；direct best-effort fallback 會在成功的平台 I/O 後執行它們，因為沒有 durable queue commit。
- 為每個可見的平台 message id 傳回 receipt。
- 當平台可以檢查不確定的 send 是否已抵達使用者時，請使用 `reconcileUnknownSend`。

此 contract 可避免 crash 後重複 send，並避免繞過 message-sending cancellation hook。

## Receipts

`MessageReceipt` 是平台接受內容的新內部記錄：

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

調整既有傳送結果時，請使用 `createMessageReceiptFromOutboundResults(...)`。當即時預覽訊息成為最終回執時，請使用 `createPreviewMessageReceipt(...)`。避免新增擁有者本地的 `messageIds` 欄位。舊版 `ChannelDeliveryResult.messageIds` 仍會在相容性邊界產生。

## 即時預覽

串流草稿預覽或進度更新的頻道應宣告即時功能：

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

請使用 `defineFinalizableLivePreviewAdapter(...)` 和 `deliverWithFinalizableLivePreviewAdapter(...)` 進行執行階段最終化。最終化器會決定最終回覆是否就地編輯預覽、傳送一般備援、捨棄待處理的預覽狀態、在不複製訊息的情況下保留結果不明確的失敗編輯，並回傳最終回執。

## 接收確認政策

控制平台確認時機的入站接收器應宣告接收政策：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

未宣告接收政策的配接器預設為：

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

當平台沒有可延後的確認、已在非同步處理前完成確認，或需要協定特定的回應語意時，請使用預設值。只有在接收器確實使用接收情境將平台確認延後時，才宣告其中一種分階段政策。

政策：

| 政策                   | 使用時機                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | 平台可在入站事件完成解析並記錄後進行確認。                                               |
| `after_agent_dispatch` | 平台應等到代理程式派發已被接受後再繼續。                                                 |
| `after_durable_send`   | 平台應等到最終遞送已有持久化決策後再繼續。                                               |
| `manual`               | Plugin 擁有確認流程，因為平台語意不符合通用階段。                                        |

在會延後確認狀態的接收器中使用 `createMessageReceiveContext(...)`，並在接收器需要測試某個階段是否已滿足設定的政策時使用 `shouldAckMessageAfterStage(...)`。

## 契約測試

功能宣告是 Plugin 契約的一部分。請以測試支撐這些宣告：

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

當配接器宣告即時與接收功能時，請加入對應的證明測試套件。缺少證明應讓測試失敗，而不是悄悄擴大持久化表面。

## 已棄用的相容性 API

這些 API 仍可匯入以供第三方相容性使用。請勿將其用於新的頻道程式碼。

| 已棄用 API                                 | 替代方案                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | 相容性派發器使用 `createChannelMessageReplyPipeline(...)`，新的頻道程式碼則使用 `message` 配接器                          |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` 加上 `channel.turn.runPrepared(...)`，或新的頻道程式碼使用 `message` 配接器       |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` 加上 `channel.turn.runPrepared(...)`，或新的頻道程式碼使用 `message` 配接器       |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` 加上 `channel.turn.runPrepared(...)`，或新的頻道程式碼使用 `message` 配接器       |
| `deliverOutboundPayloads(...)`               | 來自 `channel-message-runtime` 的 `sendDurableMessageBatch(...)` 或 `deliverInboundReplyWithMessageSendContext(...)`       |
| `deliverDurableInboundReplyPayload(...)`     | 來自 `openclaw/plugin-sdk/channel-message-runtime` 的 `deliverInboundReplyWithMessageSendContext(...)`                     |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` 加上 `channel.turn.runPrepared(...)`，或新的頻道程式碼使用 `message` 配接器       |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` 加上 `channel.turn.runPrepared(...)`，或新的頻道程式碼使用 `message` 配接器       |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

相容性派發器仍可透過訊息外觀介面使用 `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)` 和 `createTypingCallbacks(...)`。新的生命週期程式碼應避免使用舊的 `channel-reply-pipeline` 子路徑。

## 遷移檢查清單

1. 將 `message: defineChannelMessageAdapter(...)` 或 `message: createChannelMessageAdapterFromOutbound(...)` 加入頻道 Plugin。
2. 從文字、媒體和酬載傳送回傳 `MessageReceipt`。
3. 只宣告由原生行為與測試支撐的功能。
4. 以 `deriveDurableFinalDeliveryRequirements(...)` 取代手寫的持久化需求對應。
5. 當頻道會就地編輯草稿訊息時，透過即時預覽輔助工具移動預覽最終化流程。
6. 只有在接收器真的能延後平台確認時，才宣告接收確認政策。
7. 只在相容性邊界保留舊版回覆派發輔助工具。
