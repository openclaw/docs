---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道傳入訊息、回覆分派、傳出佇列、預覽串流或外掛 SDK 訊息 API
    - 設計需要持久化傳送、收件回條、預覽、編輯或重試的新頻道外掛
summary: 持久化訊息接收／傳送生命週期的狀態：已發布的內容、相較原始設計的變更，以及仍待解決的事項
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-07-11T21:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
本頁最初源自一份前瞻性的設計提案。此設計的核心後來已在
`src/channels/message/*`，以及公開的
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 子路徑中實作並發布。關於
目前的 API，請使用[頻道傳出 API](/zh-TW/plugins/sdk-channel-outbound)與
[頻道傳入 API](/zh-TW/plugins/sdk-channel-inbound)。本頁記錄已發布的內容、實作與原始草案
不同之處，以及仍待處理的項目。
</Note>

## 為何進行這次重構

頻道堆疊源自多項局部修正，並逐步擴展：依成熟度層級提供各自獨立的傳入輔助函式
（簡易轉接器使用 `runtime.channel.inbound.run`，功能豐富的轉接器則使用
`runtime.channel.inbound.runPreparedReply`）、舊版回覆分派輔助函式
（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、
頻道特有的預覽串流，以及後來附加至既有回覆承載資料路徑的最終傳遞持久性。
這種結構產生了過多公開概念，也造成太多可能讓傳遞語意出現分歧的位置。

迫使系統重新設計的可靠性缺口：

```text
Telegram 輪詢更新已確認
  -> 助理的最終文字已存在
  -> 程序在 sendMessage 成功前重新啟動
  -> 最終回應遺失
```

目標不變條件：核心一旦決定應存在一則使用者可見的傳出訊息，就必須在嘗試呼叫平台前，
先將傳送意圖持久化，並在成功後提交平台回條。如此預設即可提供至少一次的復原能力。
僅當轉接器能證明原生冪等性，或在重播前能根據平台狀態核對傳送後結果不明的嘗試時，
才具備恰好一次的行為。

## 已發布的內容

內部領域實作位於 `src/channels/message/*`：

| 檔案                        | 負責範圍                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 轉接器、傳送內容、回條與持久意圖的型別契約                                                                         |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 持久傳送內容                                         |
| `receive.ts`                | `createMessageReceiveContext` — 傳入確認原則狀態機                                                                 |
| `live.ts`                   | 即時預覽狀態，以及原地完成或後備處理的邏輯                                                                          |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中斷後的復原分類                                                              |
| `receipt.ts`                | 將平台傳送結果正規化為 `MessageReceipt`                                                                             |
| `capabilities.ts`           | 從承載資料推導必要的持久最終傳遞能力                                                                                 |
| `contracts.ts`              | 驗證轉接器所宣告能力的契約證明                                                                                       |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 包裝舊版 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 函式          |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 持久傳入事件佇列                                                                      |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 用於傳入去重的接受／待處理／完成／釋放日誌                                   |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 與使用舊版名稱的包裝函式                                                              |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、回覆前綴與輸入狀態回呼輔助函式                                                        |

公開介面：`openclaw/plugin-sdk/channel-outbound`（傳送／回條／持久傳送／即時預覽／回覆管線
輔助函式）及 `openclaw/plugin-sdk/channel-inbound`（傳入內容、`runChannelInboundEvent`、
`dispatchChannelInboundReply`）。轉接器範例、目前的型別名稱與遷移說明請參閱這些頁面；
API 結構應以這些頁面為準，而非下方草案。

### 傳送內容

`withDurableMessageSendContext` 會針對一則傳出訊息，提供頻道程式碼 `render`、
`previewUpdate`、`send`、`edit`、`delete`、`commit` 與 `fail` 步驟。
`sendDurableMessageBatch` 是常見情況的包裝函式：先算繪、再傳送，之後於
`sent`/`suppressed` 時提交，或在發生錯誤時標記失敗。

`sendDurableMessageBatch` 會傳回以下其中一種可辨識結果：

| 狀態             | 意義                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | 至少已傳遞一則使用者可見的平台訊息                                               |
| `suppressed`     | 不應將任何平台訊息視為遺失（由鉤子取消、試執行等）                               |
| `partial_failed` | 至少已傳遞一則訊息，但後續承載資料或副作用失敗                                   |
| `failed`         | 未產生任何平台回條                                                               |

持久性可為 `required`、`best_effort` 或 `disabled`
（`src/channels/message/types.ts` 中的 `MessageDurabilityPolicy`）。當無法寫入持久意圖時，
`required` 會以拒絕方式安全失敗；持久化無法使用時，`best_effort` 會改為直接傳送；
`disabled` 則保留重構前的直接傳送行為。舊版相容性輔助函式預設為 `disabled`，
且不會僅因頻道具有通用傳出轉接器便推斷應使用 `required`。

仍具風險的邊界：平台呼叫成功後、回條提交前。若程序在此時終止，除非轉接器宣告
`reconcileUnknownSend`，否則核心無法得知平台訊息是否存在。該鉤子會將中斷的傳送分類為
`sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重播。未提供核對機制的頻道
會退回 `unknown_after_send` 狀態（`src/channels/message/state.ts`、
`src/infra/outbound/delivery-queue-recovery.ts`），而且僅當重複顯示訊息是該頻道可接受且
已有文件記載的取捨時，才可選擇至少一次的重播方式。

### 接收內容

`createMessageReceiveContext` 會使用冪等的 `ack()` 與明確的 `nack(error)`，
追蹤每個傳入事件的確認／否定確認狀態。確認原則
（`ChannelMessageReceiveAckPolicy`）為以下其中之一：

| 原則                   | 確認時機                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | 核心已持久化足以對重新傳遞進行去重／路由的傳入中繼資料                                        |
| `after_agent_dispatch` | 代理程式執行已分派                                                                            |
| `after_durable_send`   | 此輪的持久傳出傳送已提交                                                                        |
| `manual`               | 呼叫端明確控制確認時機（未宣告原則之轉接器的預設值）                                           |

Telegram 輪詢使用此機制持久化可安全視為已完成的更新水位標記
（`extensions/telegram/src/bot-update-tracker.ts` 中的 `safeCompletedUpdateId`）：
grammY 仍會在每項更新進入中介軟體鏈時觀察該更新，但 OpenClaw 只會在更新完成分派後，
才將持久化的重新啟動水位標記推進至該更新之後，因此失敗或仍待處理的更新會在重新啟動後重播。
Telegram 上游的 `getUpdates` 位移仍由 grammY 負責；目前尚未建置可在此水位標記之外
控制平台層級重新傳遞的完全持久輪詢來源（請參閱待解問題）。

### 即時預覽

`src/channels/message/live.ts` 將預覽／編輯／完成建模為單一生命週期：
`createLiveMessageState`、`markLiveMessagePreviewUpdated`、
`markLiveMessageFinalized`、`markLiveMessageCancelled`，以及
`deliverFinalizableLivePreviewAdapter`（根據草稿建立最終編輯、套用該編輯，並在無法編輯
或編輯失敗時改用一般傳送）。`LiveMessageState.phase` 為 `idle | previewing |
finalizing | finalized | cancelled`；`canFinalizeInPlace` 用於控制是否可透過編輯讓預覽
成為最終訊息，而無須重新傳送。

### 持久回條

`MessageReceipt`（`src/channels/message/types.ts`）會將單次邏輯傳送產生的一個或多個
平台訊息 ID 正規化為 `platformMessageIds`，以及各部分的 `parts`
（種類、索引、討論串 ID、回覆目標 ID）。系統會保留主要 ID，以供討論串與後續編輯使用。
這使多部分傳遞（文字加媒體、分塊文字、卡片後備內容）可在重新啟動後重播及去重。

### 縮減公開 SDK

這次重構吸收或棄用了作為公開 API 公開的 `reply-runtime`、
`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload`
輔助函式、`inbound-reply-dispatch`、`channel-reply-pipeline`，以及
`outbound-runtime` 的大多數公開用法。`src/plugin-sdk/channel-message.ts`
現在是標記為 `@deprecated` 的重新匯出彙整入口，指向 `channel-outbound` /
`channel-inbound`；`channel.turn` 執行階段別名已移除，舊版
`/plugins/sdk-channel-turn` 文件頁面會重新導向
[頻道傳入 API](/zh-TW/plugins/sdk-channel-inbound)。新的外掛程式碼應直接以
`channel-outbound` 和 `channel-inbound` 為目標。

## 實作與原始設計不同之處

下方設計草案從未完全按照其描述發布。保留此紀錄是為了確保歷史準確性；
請勿將這些型別名稱視為目前的 API。

- **沒有 `MessageOrigin` / `shouldDropOpenClawEcho`。**原始計畫要求在閘道失敗訊息上
  加入 `source: "openclaw"` 來源標籤，並提供共用述詞，在執行 `allowBots` 授權前，
  先於共用聊天室中捨棄已加標籤且由機器人撰寫的回音。程式碼庫中不存在該型別與述詞。
  `allowBots` 本身確實是各頻道的設定鍵（Slack、Discord、Google Chat 等），
  但原本用於保護它的來源標記機制從未建置。在啟用機器人的聊天室中抑制閘道失敗回音，
  仍是尚未解決的缺口，而非已發布的保證。
- **沒有統一的 `core.messages.receive/send/live/state` 命名空間。**已發布的函式直接位於
  `src/channels/message/*`（`withDurableMessageSendContext`、
  `createMessageReceiveContext`、`createLiveMessageState`、
  `classifyDurableSendRecoveryState`），而非置於 `core.messages.*` 門面之後。
- **沒有通用的 `ChannelMessage` / `MessageTarget` / `MessageRelation`
  正規化訊息型別。**核心仍透過傳送轉接器傳遞具體的回覆承載資料
  （`ReplyPayload`）與頻道特有的內容，而非使用單一平台中立的訊息結構，
  並以 `kind: "reply" | "followup" | "broadcast" | "system"` 表示關聯。
- **確認原則名稱與草案不同。**已發布版本為：
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`。
  原始草案使用 `immediate | after-record | after-durable-send |
manual`，並包含網路鉤子逾時原因欄位；該結構並未建置。
- **`DurableFinalDeliveryRequirementMap` 能力鍵取代了草案中的
  `MessageCapabilities` 物件。**能力是扁平的布林旗標（`text`、
  `media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、
  `messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、
  `afterCommit`），並透過 `verifyDurableFinalCapabilityProofs` 驗證，
  而非採用巢狀的 `text.chunking` / `attachments.voice` 類型結構。

## 具體遷移風險（仍然相關）

這些特定頻道的副作用早於此次重構，且必須透過新的傳送路徑繼續
運作。它們並非假設情境：每一項目前都已實作，並承擔關鍵功能。

- **iMessage**（`extensions/imessage/src/monitor/echo-cache.ts`、
  `persisted-echo-cache.ts`）：監控器會在成功傳送後，將已傳送訊息記錄至回音
  快取。持久化的最終傳送仍必須填入該快取，否則 OpenClaw 可能會將自己的
  回覆重新擷取為使用者的傳入訊息。
- **Tlon**（`extensions/tlon/src/monitor/index.ts`）：附加選用的模型
  簽章，並在群組回覆後記錄已參與的討論串。持久化
  傳遞不得略過這些作用。
- **Discord 與其他預備分派器**已負責直接傳遞與
  預覽行為。除非頻道的預備分派器明確透過傳送上下文路由最終訊息，
  否則該頻道尚未達成端對端持久化；請勿假設僅靠通用配接器
  即已涵蓋。
- **Telegram 靜默備援傳遞**在分塊／備援
  投影後，必須傳遞完整的投影酬載陣列，而不只是第一個酬載。
- **LINE、Zalo、Nostr** 及類似的輔助程式路徑可能包含回覆權杖
  處理、媒體代理、已傳送訊息快取，或僅限回呼的目標。
  在傳送配接器能表達這些語意且測試已涵蓋之前，這些路徑仍由頻道
  自行負責傳遞。
- **直接私訊輔助程式**可能具有唯一正確傳輸目標的回覆回呼。
  通用出站機制不得從原始平台欄位猜測目標，
  並略過該回呼。

## 失敗分類

配接器會將傳輸失敗分類為 `DeliveryFailureKind` 形式的封閉
類別（暫時性、速率限制、驗證、權限、找不到、無效
酬載、衝突、已取消、未知）。核心原則：

- 重試暫時性與速率限制失敗。
- 除非存在算繪備援，否則不要重試無效酬載失敗。
- 在設定變更之前，不要重試驗證或權限失敗。
- 發生找不到錯誤時，若頻道宣告這樣做是安全的，則允許即時最終處理從編輯
  退回至重新傳送。
- 發生衝突時，使用收據／冪等性狀態判斷訊息
  是否已存在。
- 若平台呼叫可能已成功，但在提交收據前發生任何錯誤，
  除非配接器能證明平台操作未發生，否則該錯誤會成為 `unknown_after_send`。

## 待決問題

- Telegram 最終是否應以完全持久化的輪詢來源，取代 grammY（`1.43.0`）
  輪詢執行器；此來源可控制平台層級的重新傳遞，而不僅是 OpenClaw
  持久化的重新啟動水位標記（`safeCompletedUpdateId`）。
- 即時預覽狀態應與最終傳送意圖存放於同一筆記錄，
  還是存放於同層的即時狀態儲存區。
- 在共用且已啟用機器人的聊天室中，閘道失敗時的回音抑制
  是否需要原先規劃的來源標記機制、較簡單的各頻道
  合約，或應排除於範圍之外。
- 哪些頻道原生支援來源／中繼資料，可用於跨機器人的回音
  抑制；哪些頻道則需要持久化的出站登錄表。

## 相關內容

- [訊息](/zh-TW/concepts/messages)
- [串流與分塊](/zh-TW/concepts/streaming)
- [進度草稿](/zh-TW/concepts/progress-drafts)
- [重試原則](/zh-TW/concepts/retry)
- [頻道出站 API](/zh-TW/plugins/sdk-channel-outbound)
- [頻道入站 API](/zh-TW/plugins/sdk-channel-inbound)
