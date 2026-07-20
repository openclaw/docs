---
read_when:
    - 你正在建置或重構訊息通道外掛的傳送路徑
    - 你需要可靠的最終回覆傳送、回條、即時預覽定稿或接收確認政策
    - 你正在從頻道訊息或舊版回覆分派輔助函式遷移
summary: 頻道外掛的傳出訊息生命週期 API：轉接器、回執、持久傳送、即時預覽與回覆流水線輔助工具
title: 頻道對外傳送 API
x-i18n:
    generated_at: "2026-07-20T00:55:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8edeca81d2e9261f33be1d538153caaea87caedb90dfccac33dd227c924501f1
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

頻道外掛從
`openclaw/plugin-sdk/channel-outbound` 公開出站訊息行為。接收／內容／分派
協調請使用
`openclaw/plugin-sdk/channel-inbound`。

核心負責佇列處理、持久性、耐久的**輸入監控與清空**
（`createChannelIngressMonitor`、`createChannelIngressDrain` 以及
`openChannelIngressDrain`）、通用重試政策、回合接管生命週期
（`turnAdoptionLifecycle` / `bindIngressLifecycleToReplyOptions`）、鉤子、
回執，以及共用的 `message` 工具。外掛負責原生
傳送／編輯／刪除呼叫、目標正規化、平台討論串、選取的
引用、通知旗標、帳號狀態、輸入檢查與承載資料
編碼、通道鍵、不可重試述詞、選用的取代
授權，以及平台特定的副作用。

## 耐久輸入監控器

當頻道必須在分派前保存已接受的
傳輸事件時，請使用 `createChannelIngressMonitor(...)`。它會將頻道輸入佇列與清空流程，
結合共用的准入、輪詢、修剪、遞送及關閉生命週期。
只有當傳輸層擁有實質不同的准入或泵送契約時，
才使用較低階的 `createChannelIngressDrain(...)`。

必要選項如下：

| 選項                           | 契約                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queue`                          | 一個 `ChannelIngressQueue`，或開啟帳號範圍佇列的延遲工廠。                                                                                                                                                                                                                                  |
| `inspect(raw, context)`          | 傳回穩定的 `eventId` 與序列化的 `laneKey`，若為忽略的事件則傳回 `null`。宣告時的事實必須符合已保存的 ID 與通道。                                                                                                                                                                    |
| `payload`                        | 提供承載資料版本，以及主體的序列化／反序列化。標準 `{ version, rawEvent }` 字串封套請使用 `storage: "raw-event"`，現有的頻道特定格式則提供自訂編碼／解碼回呼。`createClaimError` 會分類無效版本或已變更的身分。 |
| `deliver(raw, lifecycle, claim)` | 分派一個已解碼事件，並接收完整的接管生命週期。它可以傳回 `completed`、`deferred`、`failed-retryable`，或不傳回任何內容。                                                                                                                                                                |
| `pollIntervalMs`                 | 在監控器執行期間排定復原／清空輪詢。                                                                                                                                                                                                                                                     |
| `retention`                      | 提供修剪頻率，以及已完成／失敗項目的 TTL 與項目數上限。                                                                                                                                                                                                                                              |

監控器會將准入序列化，因此附加退避不會顛倒通道中的順序。預設的
有限附加延遲為 `0`、`100` 與 `300` ms；耗盡時會拒絕
傳輸回呼，而不是分派尚未持久化的事件。
宣告時，它會解碼具版本的承載資料、重新執行 `inspect`，並在遞送前
拒絕 ID 或通道不符的項目。

`deliver` 會接收 `onAdopted`、`onDeferred`、`onAdoptionFinalizing`、
`onAbandoned` 以及 `abortSignal`。未明確交接便傳回，會將終止且未分派的事件標記為已接管。
`admission` 一律為 `exclusive`。
延遲交接會保持宣告，而關閉或中止則讓未接管的工作
維持可重試狀態。監控器會獨立追蹤遞送與宣告結算，
因為接管可能會在頻道的遞送 Promise 傳回之前，先將資料列標記為墓碑。

選用設定包括自訂附加延遲、用於進階
清空排序／並行處理／重試政策的 `drain` 選項區塊、外部 `abortSignal`、
時鐘、泵送錯誤報告、已停止錯誤工廠，以及准入政策。
傳回的監控器會公開 `admit`、`start`、`pause`、`stop`、`waitForIdle`、
`isRunning` 與 `isStopped`。`stop` 會先結算已接受的准入，接著
中止並處置清空流程、等待泵送與進行中的遞送，然後再次
處置，以消除延遲建立的競爭情況。

將傳輸特定的遮蔽、原始封套驗證、不可重試
分類，以及保存的承載資料格式保留在外掛中。網路鉤子傳輸
應只在 `admit` 完成後確認；不可重播的傳輸應
揭露耐久附加耗盡，而不是默默分派。

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

只宣告原生傳輸實際保留的能力。請使用此子路徑匯出的
契約輔助函式，涵蓋每項已宣告的傳送、回執、即時預覽與接收確認能力。

## 出站回送抑制

當平台可能將外掛自身的出站訊息重新遞送為入站訊息時，請使用頻道、帳號、對話，以及穩定的平台訊息或來源身分來呼叫 `recordOutboundMessageIdentity(...)`。共用入站回合路徑會在工作階段記錄或代理程式分派前，於有限的 30 秒時段內捨棄相符的身分；可以在傳送前保留來源身分，或在移除頻道路由時重新整理，以消除遞送競爭情況。`isRecentOutboundMessageIdentity(...)` 會為頻道診斷與測試公開相同查詢。請勿針對相同的穩定身分維護平行的頻道本機 TTL 快取。

## 純文字清理

當出站轉接器需要將支援的 HTML 格式標籤
轉換為輕量文字標記時，請使用 `sanitizeForPlainText(...)`。預設會保留
現有聊天樣式的粗體與刪除線標記。只有當頻道會將結果重新解析為 Markdown 時，
才傳入 `{ style: "markdown" }`：

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown 樣式使用 `**bold**` 與 `~~strikethrough~~`；在兩種樣式中，斜體與行內
程式碼都會保留 `_italic_` 與反引號標記。請在
頻道邊界選取樣式，而不是在清理後重寫標記文字。

## 遞送證據

`MessageReceipt` 會記錄頻道轉接器傳回的結果。具體的
平台訊息識別碼顯示平台傳送路徑已接受該訊息；
但無法證明收件者的裝置已顯示或讀取該訊息。
不含平台訊息識別碼的回執僅是本機回執中繼資料。
具備已讀回執或裝置遞送狀態的頻道，應透過
獨立的頻道特定路徑追蹤這些事實。

如果頻道轉接器能證明重試失敗作業不會重複傳送
收件者可見的訊息，且尚未開始任何可完成最終處理的呼叫，請從
`openclaw/plugin-sdk/error-runtime` 擲回
`new PlatformMessageNotDispatchedError("...", { cause: error })`。如此核心便能清除過時的傳送嘗試
證據，並安全地重試已排入佇列的意圖。只有擁有
最終分派邊界的轉接器可以做出此斷言。開始最終處理／傳送呼叫或其
傳回含糊結果後，絕不可使用此標記；錯誤標記可能會
造成訊息重複。

## 現有出站轉接器

如果頻道已有相容的 `outbound` 轉接器，請從中衍生
訊息轉接器，而不要重複傳送程式碼：

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

執行階段傳送輔助函式也位於 `channel-outbound`：

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- 草稿串流／進度輔助函式，例如 `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` 會傳回一個明確結果：

| 結果          | 意義                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | 平台傳送路徑已接受至少一則可見的平台訊息            |
| `suppressed`     | 不應將任何平台訊息視為遺失                                        |
| `partial_failed` | 在後續承載資料或副作用失敗前，已接受至少一則平台訊息 |
| `failed`         | 未產生平台回執                                                        |

當批次混合已傳送、已抑制與失敗的
承載資料時，請使用 `payloadOutcomes`。請勿從空白的舊版
直接遞送結果推斷鉤子已取消。

## 延遲遞送准入

當已解析的帳號無法安全接受核心管理的出站或延遲遞送時，
請使用 `message.durableFinal.admitDeferredDelivery(...)`。核心會在即時出站工作前同步呼叫
此鉤子，包括略過佇列持久化的路徑，並在重播已復原的意圖前
再次呼叫。內容包含 `cfg`、`channel`、`to`、`accountId`，以及
值為 `live` 或 `recovery` 的 `phase`。

傳回 `{ status: "allowed" }` 以繼續。當遞送不得
持久化、直接傳送或重播時，傳回
`{ status: "permanent_rejection", reason }`。即時拒絕會在建立佇列、
訊息鉤子或平台工作前失敗。復原拒絕會將
佇列記錄標記為失敗，並略過協調與重播。省略此鉤子
即表示允許。

此鉤子是同步的准入決策，而非傳送路徑。僅讀取
已載入的設定或執行階段狀態；請勿執行網路、檔案系統或
其他非同步 I/O。契約測試應透過 `openclaw/plugin-sdk/channel-outbound` 中的
`ChannelMessageDurableFinalAdapter`，涵蓋兩個階段及兩種結果變體。

## 相容性分派

透過 `channel-inbound` 中的 `dispatchChannelInboundReply(...)`
組合傳入回覆分派。將平台傳遞保留在傳遞配接器中；針對
訊息配接器、持久傳送、回條、即時預覽與回覆流水線選項，請使用
`channel-outbound`。
