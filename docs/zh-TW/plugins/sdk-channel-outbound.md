---
read_when:
    - 你正在建置或重構訊息通道外掛的傳送路徑
    - 你需要可靠的最終回覆傳遞、回條、即時預覽定稿，或接收確認政策
    - 你正在從 channel-message、channel-message-runtime 或舊版回覆派送輔助工具遷移
summary: 頻道外掛的傳出訊息生命週期 API：配接器、回條、持久化傳送、即時預覽與回覆管線輔助工具
title: 頻道傳出 API
x-i18n:
    generated_at: "2026-06-27T19:47:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel 外掛應從
`openclaw/plugin-sdk/channel-outbound` 暴露傳出訊息行為。使用
`openclaw/plugin-sdk/channel-inbound` 進行接收／內容脈絡／派送協調。

核心負責佇列、耐久性、通用重試政策、鉤子、回條，以及共用的
`message` 工具。外掛負責原生傳送／編輯／刪除呼叫、目標
正規化、平台執行緒、選取的引用、通知旗標、帳號
狀態，以及平台特定的副作用。

## 配接器

多數外掛會定義一個 `message` 配接器：

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

只宣告原生傳輸實際會保留的能力。對每個已宣告的
傳送、回條、即時預覽與接收確認能力，使用此子路徑匯出的
合約輔助工具涵蓋。

## 現有傳出配接器

如果通道已經有相容的 `outbound` 配接器，請衍生訊息
配接器，而不是重複傳送程式碼：

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

## 耐久傳送

執行階段傳送輔助工具也位於 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- 草稿串流／進度輔助工具，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 會回傳一個明確結果：

- `sent`：至少已送達一則可見的平台訊息。
- `suppressed`：不應將任何平台訊息視為遺失。
- `partial_failed`：在後續酬載或副作用失敗之前，至少已送達一則平台訊息。
- `failed`：未產生任何平台回條。

當批次混合已傳送、已抑制與失敗的酬載時，請使用 `payloadOutcomes`。
不要從空的舊版直接傳遞結果推斷鉤子取消。

## 相容性派送

傳入回覆派送應透過 `channel-inbound` 中的
`dispatchChannelInboundReply(...)` 組裝。將平台
傳遞保留在傳遞配接器中；針對訊息配接器、耐久傳送、回條、
即時預覽與回覆管線選項，使用 `channel-outbound`。
