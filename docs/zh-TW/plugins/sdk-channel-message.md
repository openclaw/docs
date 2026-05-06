---
read_when:
    - 你正在建置或重構訊息通道 Plugin
    - 需要持久化的最終回覆傳遞、回執、即時預覽定稿，或接收確認政策
    - 您正在從舊版回覆管線或傳入回覆分派輔助函式遷移
summary: 頻道 Plugin 的訊息生命週期 API，包括持久化傳送、回執、即時預覽、接收確認政策，以及舊版遷移
title: 頻道訊息 API
x-i18n:
    generated_at: "2026-05-06T02:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14eb3105ef63a0c770173f83ed2de442a9651acdb5c81337c2751c1775d4e1e8
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

# 通道訊息 API

通道 Plugin 應從
`openclaw/plugin-sdk/channel-message` 暴露一個 `message` 配接器。該配接器描述平台支援的原生訊息生命週期：

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

核心負責佇列、持久性、通用重試策略、hook、收據，以及共用的 `message` 工具。Plugin 負責原生傳送/編輯/刪除呼叫、目標正規化、平台執行緒、選定引用、通知旗標、帳號狀態，以及平台特定的副作用。

請將此頁面與 [建置通道 Plugin](/zh-TW/plugins/sdk-channel-plugins) 搭配使用。

`channel-message` 子路徑刻意設計得足夠輕量，適合 `channel.ts` 這類熱門 Plugin 啟動檔案：它會暴露配接器合約、能力證明、收據，以及相容性 facade，而不會載入 outbound 傳遞。執行階段傳遞輔助工具可從
`openclaw/plugin-sdk/channel-message-runtime` 取得，適用於已經在執行非同步訊息 I/O 的監控/傳送程式碼路徑。

## 最小配接器

大多數新的通道 Plugin 可以從小型配接器開始：

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

然後將它附加到通道 Plugin：

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

只宣告配接器確實會保留的能力。每個宣告的能力都應有一個合約測試。

## Outbound 橋接

如果通道已經有相容的 `outbound` 配接器，請優先衍生訊息配接器，而不是重複傳送程式碼：

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

橋接器會將舊的 outbound 傳送結果轉換為 `MessageReceipt` 值。新程式碼應端到端傳遞收據，並且只在相容性邊界使用 `listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 衍生舊版 ID。
如果未提供接收政策，`createChannelMessageAdapterFromOutbound(...)` 會使用 `manual` 接收確認政策。這會讓 Plugin 擁有的平台確認明確化，而不會改變在通用接收內容之外確認 Webhook、socket 或輪詢位移的通道。

## 訊息工具傳送

共用的 `message(action="send")` 路徑應使用與最終回覆相同的核心傳遞生命週期。如果通道需要針對工具傳送進行提供者特定的塑形，請實作 `actions.prepareSendPayload(...)`，而不是從
`actions.handleAction(...)` 傳送。

`prepareSendPayload(...)` 會接收正規化後的核心 `ReplyPayload` 加上完整動作內容。請傳回在 `payload.channelData.<channel>` 中包含通道特定資料的 payload，並讓核心呼叫 `sendMessage(...)`、`deliverOutboundPayloads(...)`、write-ahead 佇列、訊息傳送 hook、重試、復原，以及 ack 清理。

只有在傳送無法表示為持久 payload 時才傳回 `null`，例如它包含不可序列化的元件工廠。核心會保留舊版 Plugin 動作後援以維持相容性，但新的通道傳送功能應能表示為持久 payload 資料。

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

outbound 配接器接著在 `sendPayload` 內讀取 `payload.channelData.demo`。這會讓平台特定的轉譯保留在 Plugin 中，同時核心仍負責持久化、重試、復原、hook，以及 ack。

已準備的 `message(action="send")` payload 和通用最終回覆傳遞，預設會使用具備 best-effort 佇列的核心傳遞。只有在核心驗證通道能協調一次當機後結果未知的傳送之後，才可使用必要的持久佇列。如果配接器無法實作 `reconcileUnknownSend`，請讓已準備的傳送路徑維持 best-effort；核心仍會嘗試 write-ahead 佇列，但佇列持久性或不確定的當機復原並不是必要傳遞合約的一部分。

## 持久最終能力

持久最終傳遞會依每個副作用選擇啟用。只有在配接器宣告 payload 與傳遞選項所需的所有能力時，核心才會使用通用持久傳遞。

| 能力                   | 宣告時機                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 配接器可以傳送文字並傳回收據。                                                       |
| `media`                | 媒體傳送會為每個可見的平台訊息傳回收據。                                             |
| `payload`              | 配接器會保留豐富回覆 payload 語意，而不只是文字和一個媒體 URL。                      |
| `replyTo`              | 原生回覆目標可抵達平台。                                                             |
| `thread`               | 原生執行緒、主題或通道執行緒目標可抵達平台。                                        |
| `silent`               | 通知抑制可抵達平台。                                                                 |
| `nativeQuote`          | 選定引用中繼資料可抵達平台。                                                         |
| `messageSendingHooks`  | 核心訊息傳送 hook 可以在平台 I/O 之前取消或重寫內容。                                |
| `batch`                | 多部分轉譯批次可作為一個持久計畫重播。                                               |
| `reconcileUnknownSend` | 配接器可以在不盲目重播的情況下解析 `unknown_after_send` 復原。                       |
| `afterSendSuccess`     | 通道本機的傳送後副作用執行一次。                                                     |
| `afterCommit`          | 通道本機的提交後副作用執行一次。                                                     |

Best-effort 最終傳遞不需要 `reconcileUnknownSend`；當配接器保留 payload 的可見語意時，它會使用共用生命週期，並在佇列持久性無法使用時後援到直接平台 I/O。必要的持久最終傳遞必須明確要求 `reconcileUnknownSend`。如果配接器無法判斷已開始/未知的傳送是否抵達平台，請不要宣告該能力；核心會在佇列之前拒絕必要的持久傳遞。

當呼叫端需要持久傳遞時，請衍生需求，而不是手動建置 map：

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

## 持久傳送合約

持久最終傳送具有比舊版通道擁有的傳遞更嚴格的語意：

- 在平台 I/O 之前建立持久意圖。
- 如果持久傳遞傳回已處理的結果，請不要後援到舊版傳送。
- 將 hook 取消和不傳送結果視為終端。
- 只將 `unsupported` 視為意圖前結果。
- 對於必要的持久性，如果佇列無法記錄平台傳送已開始，請在平台 I/O 之前失敗。
- 對於必要的最終傳遞與必要的已準備訊息工具傳送，請預先檢查 `reconcileUnknownSend`；復原必須能 ack 已傳送的訊息，或只有在配接器證明原始傳送未發生後才重播。
- 對於 `best_effort`，佇列寫入失敗可以後援到直接平台 I/O。
- 將中止訊號轉發到媒體載入和平台傳送。
- 在佇列 ack 後執行 after-commit hook；直接 best-effort 後援會在成功的平台 I/O 後執行它們，因為沒有持久佇列提交。
- 為每個可見的平台訊息 ID 傳回收據。
- 當平台可以檢查不確定的傳送是否已經抵達使用者時，使用 `reconcileUnknownSend`。

此合約可避免當機後重複傳送，也可避免繞過訊息傳送取消 hook。

## 收據

`MessageReceipt` 是平台已接受內容的新內部記錄：

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

在改編既有傳送結果時，請使用 `createMessageReceiptFromOutboundResults(...)`。當即時預覽訊息成為最終收據時，請使用 `createPreviewMessageReceipt(...)`。避免新增擁有者本機的 `messageIds` 欄位。舊版 `ChannelDeliveryResult.messageIds` 仍會在相容性邊界產生。

## 即時預覽

會串流草稿預覽或進度更新的通道應宣告即時能力：

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

請使用 `defineFinalizableLivePreviewAdapter(...)` 和
`deliverWithFinalizableLivePreviewAdapter(...)` 進行執行階段最終化。finalizer 會決定最終回覆是否就地編輯預覽、傳送一般後援、捨棄待處理預覽狀態、保留不明確的失敗編輯而不複製訊息，並傳回最終收據。

## 接收 Ack 政策

控制平台確認時機的 inbound 接收器應宣告接收政策：

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

當平台沒有可延後的確認、已經在非同步處理前完成確認，或需要通訊協定專屬的回應語意時，請使用預設值。只有在接收器實際使用接收情境來將平台確認延後時，才宣告其中一種分階段政策。

政策：

| 政策                   | 使用時機                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | 平台可在輸入事件完成剖析並記錄後確認。                                                   |
| `after_agent_dispatch` | 平台應等到代理分派已被接受後再確認。                                                     |
| `after_durable_send`   | 平台應等到最終遞送已有持久決策後再確認。                                                 |
| `manual`               | Plugin 擁有確認流程，因為平台語意不符合通用階段。                                        |

在會延後 ack 狀態的接收器中使用 `createMessageReceiveContext(...)`，並在接收器需要測試某個階段是否已滿足設定的政策時，使用 `shouldAckMessageAfterStage(...)`。

## 合約測試

能力宣告是 Plugin 合約的一部分。請以測試支撐它們：

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

當配接器宣告這些功能時，請加入即時與接收證明套件。缺少證明應讓測試失敗，而不是悄悄擴大持久介面範圍。

## 已棄用的相容性 API

這些 API 仍可匯入以維持第三方相容性。新的通道程式碼不要使用它們。

| 已棄用的 API                               | 替代項目                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | 相容性分派器使用 `createChannelMessageReplyPipeline(...)`，新的通道程式碼則使用 `message` 配接器                    |
| `deliverDurableInboundReplyPayload(...)`     | 來自 `openclaw/plugin-sdk/channel-message-runtime` 的 `deliverInboundReplyWithMessageSendContext(...)`               |
| `dispatchInboundReplyWithBase(...)`          | 僅供相容性分派器使用 `dispatchChannelMessageReplyWithBase(...)`                                                     |
| `recordInboundSessionAndDispatchReply(...)`  | 僅供相容性分派器使用 `recordChannelMessageReplyDispatch(...)`                                                       |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

相容性分派器仍可透過訊息外觀層使用 `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)` 和 `createTypingCallbacks(...)`。新的生命週期程式碼應避免使用舊的 `channel-reply-pipeline` 子路徑。

## 遷移檢查清單

1. 將 `message: defineChannelMessageAdapter(...)` 或 `message: createChannelMessageAdapterFromOutbound(...)` 加入通道 Plugin。
2. 從文字、媒體和承載資料傳送回傳 `MessageReceipt`。
3. 只宣告由原生行為和測試支撐的能力。
4. 以 `deriveDurableFinalDeliveryRequirements(...)` 取代手寫的持久需求對應表。
5. 當通道就地編輯草稿訊息時，透過即時預覽輔助工具進行預覽終結。
6. 只有在接收器真的可以延後平台確認時，才宣告接收 ack 政策。
7. 只在相容性邊界保留舊版回覆分派輔助工具。
