---
read_when:
    - 你正在建置或重構訊息通道外掛的傳送路徑
    - 你需要可靠的最終回覆傳送、回條、即時預覽定稿，或接收確認政策
    - 你正在從 channel-message、channel-message-runtime 或舊版回覆分派輔助函式進行遷移
summary: 頻道外掛的外送訊息生命週期 API：介接器、回執、持久化傳送、即時預覽與回覆管線輔助工具
title: 頻道傳出 API
x-i18n:
    generated_at: "2026-07-12T14:42:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

頻道外掛會從
`openclaw/plugin-sdk/channel-outbound` 公開出站訊息行為。接收／內容／分派
協調請使用 `openclaw/plugin-sdk/channel-inbound`。

核心負責佇列處理、持久性、通用重試政策、鉤子、收據，以及
共用的 `message` 工具。外掛負責原生傳送／編輯／刪除呼叫、
目標正規化、平台討論串、選定的引文、通知
旗標、帳號狀態，以及平台特定的副作用。

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

僅宣告原生傳輸實際保留的能力。使用此子路徑匯出的
合約輔助函式，涵蓋每項宣告的傳送、收據、即時預覽及接收確認能力。

## 純文字清理

當出站配接器需要將支援的 HTML 格式標籤轉換為輕量文字標記時，
請使用 `sanitizeForPlainText(...)`。預設會保留現有聊天樣式的
粗體與刪除線標記。只有在頻道會將結果重新解析為 Markdown 時，
才傳入 `{ style: "markdown" }`：

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown 樣式使用 `**bold**` 與 `~~strikethrough~~`；在兩種樣式中，
斜體與行內程式碼都會保留 `_italic_` 與反引號標記。請在頻道邊界
選擇樣式，而不是在清理後重寫標記文字。

## 傳遞證據

`MessageReceipt` 會記錄頻道配接器回傳的結果。具體的平台訊息
識別碼表示平台傳送路徑已接受該訊息；這並不能證明收件者的裝置
已顯示或讀取訊息。沒有平台訊息識別碼的收據僅是本機收據中繼資料。
具備已讀回條或裝置傳遞狀態的頻道，應透過獨立的頻道特定路徑
追蹤這些事實。

如果頻道配接器能證明重試失敗操作不可能造成收件者可見訊息重複，
且尚未開始任何可完成最終處理的呼叫，請從
`openclaw/plugin-sdk/error-runtime` 擲出
`new PlatformMessageNotDispatchedError("...", { cause: error })`。
核心便能清除過時的傳送嘗試證據，並安全地重試佇列中的意圖。
只有擁有最終分派邊界的配接器才能做出此判定。最終處理／傳送呼叫
開始後，或回傳結果不明確時，絕不可使用此標記；錯誤標記可能造成
訊息重複。

## 現有的出站配接器

如果頻道已有相容的 `outbound` 配接器，請從中衍生
訊息配接器，而不是重複傳送程式碼：

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

執行階段的傳送輔助函式也位於 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- 草稿串流／進度輔助函式，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 會回傳一個明確結果：

| 結果             | 意義                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | 平台傳送路徑至少接受了一則可見的平台訊息                                                |
| `suppressed`     | 不應將任何平台訊息視為遺漏                                                              |
| `partial_failed` | 後續酬載或副作用失敗前，至少已有一則平台訊息被接受                                      |
| `failed`         | 未產生任何平台收據                                                                      |

當批次混合已傳送、已抑制與失敗的酬載時，請使用 `payloadOutcomes`。
請勿從空白的舊版直接傳遞結果推斷鉤子取消。

## 延後傳遞准入

當已解析的帳號無法安全接受由核心管理的出站或延後傳遞時，
請使用 `message.durableFinal.admitDeferredDelivery(...)`。核心會在
即時出站工作之前同步呼叫此鉤子，包括略過佇列持久化的路徑；
並會在重播復原的意圖之前再次呼叫。內容包括 `cfg`、`channel`、
`to`、`accountId`，以及值為 `live` 或 `recovery` 的 `phase`。

回傳 `{ status: "allowed" }` 以繼續。當傳遞不得持久化、
直接傳送或重播時，回傳
`{ status: "permanent_rejection", reason }`。即時拒絕會在建立佇列、
訊息鉤子或平台工作之前失敗。復原拒絕會將佇列記錄標示為失敗，
並略過調和與重播。省略此鉤子即表示允許。

此鉤子是同步准入決策，不是傳送路徑。僅讀取已載入的設定或
執行階段狀態；請勿執行網路、檔案系統或其他非同步 I/O。
合約測試應透過 `openclaw/plugin-sdk/channel-outbound` 的
`ChannelMessageDurableFinalAdapter`，涵蓋兩個階段與兩種結果變體。

## 相容性分派

請使用 `channel-inbound` 的 `dispatchChannelInboundReply(...)`
組裝入站回覆分派。將平台傳遞保留在傳遞配接器中；訊息配接器、
持久傳送、收據、即時預覽與回覆管線選項則使用 `channel-outbound`。
