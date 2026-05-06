---
read_when:
    - 你正在建置或重構訊息通道 Plugin
    - 你需要可靠持久的最終回覆傳遞、回執、即時預覽定稿，或接收確認政策
    - 您正在從舊版回覆管線或入站回覆分派輔助函式遷移
summary: 頻道 Plugin 的訊息生命週期 API，包括持久化傳送、收據、即時預覽、接收確認政策，以及舊版遷移
title: 頻道訊息 API
x-i18n:
    generated_at: "2026-05-06T09:15:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

頻道 Plugin 應從 `openclaw/plugin-sdk/channel-message` 暴露一個 `message` 轉接器。此轉接器描述平台支援的原生訊息生命週期：

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

核心負責佇列、持久性、通用重試政策、hook、收據，以及共用的 `message` 工具。Plugin 負責原生傳送/編輯/刪除呼叫、目標正規化、平台討論串、選取引用、通知旗標、帳號狀態，以及平台特定的副作用。

請將本頁搭配 [建置頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) 使用。

`channel-message` 子路徑刻意保持足夠輕量，適合 `channel.ts` 這類熱 Plugin 啟動檔案：它會暴露轉接器合約、能力證明、收據，以及相容性 facade，而不載入外送遞送。執行階段遞送輔助工具可從 `openclaw/plugin-sdk/channel-message-runtime` 取得，供已在執行非同步訊息 I/O 的監控/傳送程式碼路徑使用。

## 最小轉接器

多數新的頻道 Plugin 可以從小型轉接器開始：

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

接著將它附加到頻道 Plugin：

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

只宣告轉接器真正能保留的能力。每個已宣告的能力都應有合約測試。

## 外送橋接

如果頻道已有相容的 `outbound` 轉接器，請優先衍生訊息轉接器，而不是複製傳送程式碼：

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

橋接會將舊的外送傳送結果轉換為 `MessageReceipt` 值。新程式碼應端到端傳遞收據，並且只在相容性邊界使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 衍生舊版 ID。
如果未提供接收政策，`createChannelMessageAdapterFromOutbound(...)` 會使用 `manual` 接收確認政策。這會讓 Plugin 擁有的平台確認變得明確，而不改變在通用接收情境外確認 Webhook、socket 或輪詢 offset 的頻道。

## 訊息工具傳送

共用的 `message(action="send")` 路徑應使用與最終回覆相同的核心遞送生命週期。如果頻道需要對工具傳送進行供應商特定的塑形，請實作 `actions.prepareSendPayload(...)`，而不是從 `actions.handleAction(...)` 傳送。

`prepareSendPayload(...)` 會接收正規化的核心 `ReplyPayload` 以及完整動作情境。請回傳在 `payload.channelData.<channel>` 中包含頻道特定資料的 payload，並讓核心呼叫 `sendMessage(...)`、`deliverOutboundPayloads(...)`、預寫佇列、訊息傳送 hook、重試、復原與 ack 清理。

只有當傳送無法表示為持久化 payload 時才回傳 `null`，例如因為它包含不可序列化的元件 factory。核心會為了相容性保留舊版 Plugin 動作 fallback，但新的頻道傳送功能應能表示為持久化 payload 資料。

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

外送轉接器接著會在 `sendPayload` 內讀取 `payload.channelData.demo`。這會讓平台特定的渲染保留在 Plugin 中，同時核心仍負責持久化、重試、復原、hook 與 ack。

已準備的 `message(action="send")` payload 和通用最終回覆遞送，預設會使用具備 best-effort 佇列的核心遞送。只有在核心驗證頻道能協調當機後結果未知的傳送時，才可使用必要的持久化佇列。如果轉接器無法實作 `reconcileUnknownSend`，請讓已準備的傳送路徑維持 best-effort；核心仍會嘗試預寫佇列，但佇列持久化或不確定的當機復原不屬於必要遞送合約的一部分。

## 持久化最終能力

持久化最終遞送會依副作用逐項選擇加入。只有當轉接器宣告 payload 與遞送選項所需的每項能力時，核心才會使用通用持久化遞送。

| 能力                   | 宣告時機                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 轉接器可以傳送文字並回傳收據。                                                       |
| `media`                | 媒體傳送會為每個可見的平台訊息回傳收據。                                             |
| `payload`              | 轉接器會保留豐富回覆 payload 語意，而不只是文字與一個媒體 URL。                     |
| `replyTo`              | 原生回覆目標可到達平台。                                                             |
| `thread`               | 原生討論串、主題或頻道討論串目標可到達平台。                                         |
| `silent`               | 通知抑制可到達平台。                                                                 |
| `nativeQuote`          | 選取引用中繼資料可到達平台。                                                         |
| `messageSendingHooks`  | 核心訊息傳送 hook 可以在平台 I/O 前取消或重寫內容。                                  |
| `batch`                | 多部分渲染批次可作為一個持久化計畫重放。                                             |
| `reconcileUnknownSend` | 轉接器可以在不盲目重放的情況下解析 `unknown_after_send` 復原。                       |
| `afterSendSuccess`     | 頻道本機的傳送後副作用只執行一次。                                                   |
| `afterCommit`          | 頻道本機的提交後副作用只執行一次。                                                   |

Best-effort 最終遞送不需要 `reconcileUnknownSend`；當轉接器保留 payload 的可見語意時，它會使用共用生命週期，並在佇列持久化不可用時 fallback 到直接平台 I/O。必要的持久化最終遞送必須明確要求 `reconcileUnknownSend`。如果轉接器無法判斷已開始/未知的傳送是否到達平台，請勿宣告該能力；核心會在佇列前拒絕必要的持久化遞送。

當呼叫端需要持久化遞送時，請衍生需求，而不是手動建立 map：

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

`messageSendingHooks` 預設為必要。只有在某個路徑刻意無法執行全域訊息傳送 hook 時，才設定 `messageSendingHooks: false`。

## 持久化傳送合約

持久化最終傳送比舊版頻道擁有的遞送具有更嚴格的語意：

- 在平台 I/O 前建立持久化意圖。
- 如果持久化遞送回傳已處理結果，請勿 fallback 到舊版傳送。
- 將 hook 取消與不傳送結果視為終止狀態。
- 只將 `unsupported` 視為意圖前結果。
- 對必要持久性而言，如果佇列無法記錄平台傳送已開始，請在平台 I/O 前失敗。
- 對必要最終遞送與必要的已準備訊息工具傳送，請預先檢查 `reconcileUnknownSend`；復原必須能 ack 已傳送的訊息，或只在轉接器證明原始傳送未發生後才重放。
- 對 `best_effort` 而言，佇列寫入失敗可 fallback 到直接平台 I/O。
- 將中止訊號轉送至媒體載入與平台傳送。
- 在佇列 ack 後執行提交後 hook；直接 best-effort fallback 會在成功的平台 I/O 後執行，因為沒有持久化佇列提交。
- 為每個可見平台訊息 ID 回傳收據。
- 當平台可以檢查不確定的傳送是否已到達使用者時，請使用 `reconcileUnknownSend`。

此合約可避免當機後重複傳送，並避免繞過訊息傳送取消 hook。

## 收據

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

調整現有傳送結果時，請使用 `createMessageReceiptFromOutboundResults(...)`。當即時預覽訊息成為最終收據時，請使用 `createPreviewMessageReceipt(...)`。避免新增擁有者本機的 `messageIds` 欄位。舊版 `ChannelDeliveryResult.messageIds` 仍會在相容性邊界產生。

## 即時預覽

串流草稿預覽或進度更新的頻道應宣告即時能力：

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

請使用 `defineFinalizableLivePreviewAdapter(...)` 和 `deliverWithFinalizableLivePreviewAdapter(...)` 進行執行階段最終化。最終化器會決定最終回覆是否就地編輯預覽、傳送一般 fallback、捨棄待處理預覽狀態、保留模稜兩可的失敗編輯而不重複訊息，並回傳最終收據。

## 接收 ack 政策

控制平台確認時機的傳入接收器應宣告接收政策：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

未宣告接收政策的轉接器預設為：

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

當平台沒有需要延後的確認、已在非同步處理前完成確認，或需要協定特定的回應語意時，請使用預設值。只有在接收器實際使用接收內容脈絡將平台確認延後時，才宣告其中一種分階段政策。

政策：

| 政策                   | 使用時機                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | 平台可在入站事件解析並記錄後完成確認。                                                   |
| `after_agent_dispatch` | 平台應等到代理分派已被接受。                                                             |
| `after_durable_send`   | 平台應等到最終遞送有持久決策。                                                           |
| `manual`               | Plugin 擁有確認流程，因為平台語意不符合通用階段。                                        |

在會延後確認狀態的接收器中使用 `createMessageReceiveContext(...)`，並在接收器需要測試某個階段是否已滿足設定政策時使用 `shouldAckMessageAfterStage(...)`。

## 合約測試

能力宣告是 Plugin 合約的一部分。請用測試支撐它們：

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

當轉接器宣告這些功能時，請加入即時與接收證明套件。缺少證明應讓測試失敗，而不是默默擴大持久表面。

## 已棄用的相容性 API

這些 API 仍可匯入，以維持第三方相容性。請勿在新的通道程式碼中使用它們。

| 已棄用的 API                                | 替代項                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | 相容性分派器使用 `createChannelMessageReplyPipeline(...)`，新的通道程式碼則使用 `message` 轉接器                   |
| `deliverDurableInboundReplyPayload(...)`     | 來自 `openclaw/plugin-sdk/channel-message-runtime` 的 `deliverInboundReplyWithMessageSendContext(...)`              |
| `dispatchInboundReplyWithBase(...)`          | 僅供相容性分派器使用的 `dispatchChannelMessageReplyWithBase(...)`                                                   |
| `recordInboundSessionAndDispatchReply(...)`  | 僅供相容性分派器使用的 `recordChannelMessageReplyDispatch(...)`                                                     |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

相容性分派器仍可透過訊息外觀使用 `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)` 和 `createTypingCallbacks(...)`。新的生命週期程式碼應避免使用舊的 `channel-reply-pipeline` 子路徑。

## 遷移檢查清單

1. 將 `message: defineChannelMessageAdapter(...)` 或 `message: createChannelMessageAdapterFromOutbound(...)` 加入通道 Plugin。
2. 從文字、媒體和承載資料傳送回傳 `MessageReceipt`。
3. 只宣告由原生行為與測試支撐的能力。
4. 以 `deriveDurableFinalDeliveryRequirements(...)` 取代手寫的持久需求對應表。
5. 當通道會就地編輯草稿訊息時，請透過即時預覽輔助工具移動預覽最終化流程。
6. 只有在接收器確實能延後平台確認時，才宣告接收確認政策。
7. 僅在相容性邊界保留舊版回覆分派輔助工具。
