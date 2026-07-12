---
read_when:
    - 你正在建置或重構訊息通道外掛的傳送路徑
    - 你需要持久可靠的最終回覆傳遞、回執、即時預覽定稿，或接收確認政策
    - 你正在從 channel-message、channel-message-runtime 或舊版回覆分派輔助函式遷移
summary: 頻道外掛的外送訊息生命週期 API：配接器、回執、持久化傳送、即時預覽與回覆管線輔助工具
title: 頻道傳出 API
x-i18n:
    generated_at: "2026-07-11T21:39:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

頻道外掛從 `openclaw/plugin-sdk/channel-outbound` 公開出站訊息行為。接收、情境與分派的協調作業則使用 `openclaw/plugin-sdk/channel-inbound`。

核心負責佇列、持久性、通用重試原則、鉤子、收據，以及共用的 `message` 工具。外掛負責原生的傳送、編輯與刪除呼叫、目標正規化、平台討論串、選定的引用、通知旗標、帳號狀態，以及平台特有的副作用。

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

只宣告原生傳輸實際能保留的功能。使用此子路徑所匯出的契約輔助函式，涵蓋每項已宣告的傳送、收據、即時預覽與接收確認功能。

## 純文字清理

當出站轉接器需要將支援的 HTML 格式標籤轉換為輕量文字標記時，請使用 `sanitizeForPlainText(...)`。預設樣式會保留既有聊天風格的粗體與刪除線標記。只有當頻道會將結果重新解析為 Markdown 時，才傳入 `{ style: "markdown" }`：

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown 樣式使用 `**bold**` 與 `~~strikethrough~~`；兩種樣式中的斜體與行內程式碼都會保留 `_italic_` 與反引號標記。請在頻道邊界選擇樣式，而不要在清理後重寫標記文字。

## 傳遞證據

`MessageReceipt` 記錄頻道轉接器傳回的結果。具體的平台訊息識別碼表示平台傳送路徑已接受該訊息；但不能證明收件者的裝置已顯示或讀取該訊息。沒有平台訊息識別碼的收據僅代表本機收據中繼資料。具備已讀回條或裝置傳遞狀態的頻道，應透過獨立的頻道特定路徑追蹤這些資訊。

如果頻道轉接器可以證明重試某次失敗不會造成收件者可見的重複傳送，而且尚未開始任何可完成最終傳送的呼叫，請從 `openclaw/plugin-sdk/error-runtime` 擲出 `new PlatformMessageNotDispatchedError("...", { cause: error })`。核心便可清除過時的傳送嘗試證據，並安全地重試已排入佇列的意圖。只有擁有最終分派邊界的轉接器可以做出此斷言。最終處理或傳送呼叫一旦開始，或傳回含糊的結果，就絕不能使用此標記；錯誤標記可能造成訊息重複。

## 現有出站轉接器

如果頻道已有相容的 `outbound` 轉接器，請從該轉接器衍生訊息轉接器，而不要重複實作傳送程式碼：

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

## 持久化傳送

執行階段傳送輔助函式也位於 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- 草稿串流與進度輔助函式，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 會傳回一種明確結果：

| 結果             | 意義                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `sent`           | 平台傳送路徑已接受至少一則可見的平台訊息                                       |
| `suppressed`     | 不應將任何平台訊息視為遺漏                                                     |
| `partial_failed` | 在後續承載內容或副作用失敗前，至少有一則平台訊息已被接受                       |
| `failed`         | 未產生任何平台收據                                                             |

當批次混合已傳送、已抑制與失敗的承載內容時，請使用 `payloadOutcomes`。不要從空白的舊版直接傳遞結果推斷鉤子已取消作業。

## 延後傳遞准入

當已解析的帳號無法安全接受由核心管理的出站或延後傳遞時，請使用 `message.durableFinal.admitDeferredDelivery(...)`。核心會在即時出站作業前同步呼叫此鉤子，包括略過佇列持久化的路徑；在重播已復原的意圖前也會再次呼叫。情境包含 `cfg`、`channel`、`to`、`accountId`，以及值為 `live` 或 `recovery` 的 `phase`。

傳回 `{ status: "allowed" }` 以繼續。當傳遞不得持久化、直接傳送或重播時，傳回 `{ status: "permanent_rejection", reason }`。即時拒絕會在建立佇列、執行訊息鉤子或平台作業前失敗。復原拒絕會將佇列記錄標記為失敗，並略過協調與重播。省略此鉤子即表示允許。

此鉤子是同步的准入決策，而非傳送路徑。只能讀取已載入的設定或執行階段狀態；請勿執行網路、檔案系統或其他非同步 I/O。契約測試應透過 `openclaw/plugin-sdk/channel-outbound` 的 `ChannelMessageDurableFinalAdapter`，涵蓋兩個階段與兩種結果變體。

## 相容性分派

使用 `channel-inbound` 的 `dispatchChannelInboundReply(...)` 組合傳入回覆的分派流程。將平台傳遞保留在傳遞轉接器中；訊息轉接器、持久化傳送、收據、即時預覽與回覆管線選項則使用 `channel-outbound`。
