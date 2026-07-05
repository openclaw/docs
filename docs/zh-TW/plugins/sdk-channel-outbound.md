---
read_when:
    - 你正在建置或重構訊息通道外掛傳送路徑
    - 你需要持久的最終回覆遞送、收據、即時預覽定稿，或接收確認政策
    - 你正在從 channel-message、channel-message-runtime 或舊版回覆分派輔助程式遷移
summary: 頻道外掛的出站訊息生命週期 API：配接器、收據、持久傳送、即時預覽與回覆管線輔助工具
title: 通道傳出 API
x-i18n:
    generated_at: "2026-07-05T11:32:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d85846fcfbc8d2119794dff83c851a746f696ba8273b3d0c872377a429bfe8
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

頻道外掛會從
`openclaw/plugin-sdk/channel-outbound` 暴露傳出訊息行為。請使用
`openclaw/plugin-sdk/channel-inbound` 進行接收／脈絡／分派
協調。

核心負責佇列、耐久性、通用重試政策、鉤子、回條，以及
共用的 `message` 工具。外掛負責原生傳送／編輯／刪除呼叫、
目標正規化、平台執行緒、選取的引用、通知
旗標、帳號狀態，以及平台特定的副作用。

## 轉接器

大多數外掛會定義一個 `message` 轉接器：

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

只宣告原生傳輸實際會保留的能力。使用此子路徑匯出的
合約輔助工具，涵蓋每個已宣告的傳送、回條、即時預覽和
接收確認能力。

## 現有的傳出轉接器

如果頻道已經有相容的 `outbound` 轉接器，請衍生
訊息轉接器，而不是重複傳送程式碼：

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

| 結果             | 意義                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `sent`           | 至少一則可見的平台訊息已送達                                                             |
| `suppressed`     | 不應將任何平台訊息視為遺失                                                               |
| `partial_failed` | 在後續承載或副作用失敗前，至少一則平台訊息已送達                                         |
| `failed`         | 未產生任何平台回條                                                                       |

當批次混合已傳送、已抑制和失敗的承載時，請使用 `payloadOutcomes`。
不要從空的舊版直接遞送結果推斷鉤子取消。

## 相容性分派

透過 `channel-inbound` 的 `dispatchChannelInboundReply(...)`
組裝傳入回覆分派。將平台遞送保留在遞送轉接器中；使用
`channel-outbound` 處理訊息轉接器、耐久傳送、回條、即時
預覽，以及回覆管線選項。
