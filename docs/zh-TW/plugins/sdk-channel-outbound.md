---
read_when:
    - 你正在建置或重構訊息通道外掛傳送路徑
    - 你需要持久的最終回覆傳遞、收據、即時預覽定稿，或接收確認政策
    - 你正在從 channel-message、channel-message-runtime 或舊版回覆派送輔助函式遷移
summary: 通道外掛的傳出訊息生命週期 API：配接器、回執、持久傳送、即時預覽與回覆管線輔助工具
title: 通道對外 API
x-i18n:
    generated_at: "2026-07-06T10:51:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dea22c6a8de9a90a9ea182b18d922711e332efcd97ff429c7bc95d5807a7d1ad
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

通道外掛會從
`openclaw/plugin-sdk/channel-outbound` 暴露對外訊息行為。使用
`openclaw/plugin-sdk/channel-inbound` 進行接收／脈絡／分派
編排。

核心負責佇列、耐久性、通用重試策略、鉤子、收據，以及
共用的 `message` 工具。外掛負責原生傳送／編輯／刪除呼叫、
目標正規化、平台執行緒、所選引用、通知
旗標、帳戶狀態，以及平台特定的副作用。

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

只宣告原生傳輸實際會保留的能力。請使用此子路徑匯出的契約輔助工具，
涵蓋每個已宣告的傳送、收據、即時預覽與接收確認能力。

## 傳遞證據

`MessageReceipt` 會記錄通道轉接器傳回的結果。具體的平台訊息識別碼
表示平台傳送路徑已接受該訊息；它們不證明收件人的裝置已顯示或讀取該訊息。
沒有平台訊息識別碼的收據只屬於本機收據中繼資料。
具備已讀回條或裝置傳遞狀態的通道，應透過獨立的通道特定路徑追蹤這些事實。

## 既有對外轉接器

如果通道已經有相容的 `outbound` 轉接器，請從中衍生
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

## 持久傳送

執行階段傳送輔助工具也位於 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- 草稿串流／進度輔助工具，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 會傳回一個明確結果：

| 結果             | 意義                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | 至少一則可見的平台訊息已被平台傳送路徑接受            |
| `suppressed`     | 不應將任何平台訊息視為遺失                                        |
| `partial_failed` | 在後續承載或副作用失敗之前，至少一則平台訊息已被接受 |
| `failed`         | 未產生任何平台收據                                                        |

當一個批次混合已傳送、已抑制與失敗的承載時，請使用 `payloadOutcomes`。
不要從空的舊版直接傳遞結果推斷鉤子取消。

## 相容性分派

請透過 `channel-inbound` 的 `dispatchChannelInboundReply(...)`
組裝傳入回覆分派。將平台傳遞保留在傳遞轉接器中；使用
`channel-outbound` 處理訊息轉接器、持久傳送、收據、即時預覽，
以及回覆管線選項。
