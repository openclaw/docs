---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道入站處理、回覆分派、出站佇列、預覽串流或外掛 SDK 訊息 API
    - 設計需要持久化傳送、回執、預覽、編輯或重試的新頻道外掛
summary: 持久化訊息接收／傳送生命週期的狀態：已發布的內容、相較原始設計的變更，以及仍待處理的事項
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-07-20T00:49:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d21eda70b8be0de78677f4ff6d7547317112731d9e86a5bef58eac0268899818
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
此頁面最初是一份前瞻性的設計提案。該設計的核心後來已在 `src/channels/message/*` 以及公開的
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 子路徑中推出。關於目前的 API，請使用[頻道傳出 API](/zh-TW/plugins/sdk-channel-outbound)和
[頻道傳入 API](/zh-TW/plugins/sdk-channel-inbound)。此頁面記錄已推出的內容、實作與原始草案的差異，以及仍待處理的事項。
</Note>

## 為何進行這次重構

頻道堆疊由數個局部修正逐漸發展而成：依成熟度層級區分的傳入輔助工具（簡易配接器使用
`runtime.channel.inbound.run`，功能豐富的配接器使用
`runtime.channel.inbound.runPreparedReply`）、舊版回覆分派輔助工具（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、
頻道專用的預覽串流，以及附加在現有回覆承載資料路徑上的最終傳遞持久性。這種架構產生了太多公開概念，也造成太多可能使傳遞語意出現偏差的位置。

迫使重新設計的可靠性缺口：

```text
Telegram 輪詢更新已確認
  -> 助理的最終文字已存在
  -> 程序在 sendMessage 成功前重新啟動
  -> 最終回應遺失
```

目標不變條件：一旦核心決定應存在一則可見的傳出訊息，就必須先持久化傳送意圖，再嘗試呼叫平台；成功後則必須提交平台收據。如此預設可提供至少一次復原。只有當配接器能證明原生冪等性，或在重新執行前，針對傳送後狀態不明的嘗試與平台狀態進行核對時，才具備恰好一次行為。

## 已推出的內容

內部領域位於 `src/channels/message/*`：

| 檔案                        | 負責範圍                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 配接器、傳送情境、收據及持久意圖的型別合約                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 持久傳送情境                             |
| `receive.ts`                | `createMessageReceiveContext` — 傳入確認原則狀態機                                                   |
| `live.ts`                   | 即時預覽狀態，以及原地完成或改用備援方案的邏輯                                                        |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中斷後的復原分類                                    |
| `receipt.ts`                | 將平台傳送結果正規化為 `MessageReceipt`                                                             |
| `capabilities.ts`           | 從承載資料推導持久最終傳遞所需的能力                                                         |
| `contracts.ts`              | 驗證配接器宣告能力的合約證明                                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 包裝舊版 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 函式 |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 持久傳入事件佇列                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 用於傳入事件去重的接受／待處理／完成／釋放日誌                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 及沿用舊名稱的包裝函式                                                            |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、回覆前綴及輸入狀態回呼輔助工具                                             |

公開介面：`openclaw/plugin-sdk/channel-outbound`（傳送／收據／持久／即時／回覆流水線輔助工具）和 `openclaw/plugin-sdk/channel-inbound`（傳入情境、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。配接器範例、目前型別名稱及遷移注意事項請參閱這些頁面；它們才是 API 形式的權威來源，而非下方草案。

### 傳送情境

`withDurableMessageSendContext` 為頻道程式碼提供針對單一傳出訊息的 `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit` 和 `fail` 步驟。`sendDurableMessageBatch` 是常見情況的包裝函式：算繪、傳送，接著在 `sent`/`suppressed` 時提交，或在發生錯誤時標記失敗。

`sendDurableMessageBatch` 會傳回以下其中一種可辨識聯集結果：

| 狀態           | 意義                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | 至少已傳遞一則平台可見訊息                              |
| `suppressed`     | 不應將任何平台訊息視為遺漏（鉤子取消、試執行等） |
| `partial_failed` | 在後續承載資料或副作用失敗前，至少已傳遞一則訊息      |
| `failed`         | 未產生平台收據                                                 |

持久性為 `required`、`best_effort` 或 `disabled` 其中之一（`src/channels/message/types.ts` 中的 `MessageDurabilityPolicy`）。當無法寫入持久意圖時，`required` 會以封閉方式失敗；當持久化無法使用時，`best_effort` 會繼續直接傳送；`disabled` 則保留重構前的直接傳送行為。舊版相容性輔助工具預設為 `disabled`，且不會只因頻道具有通用傳出配接器就推斷 `required`。

仍具風險的邊界：平台呼叫成功之後、收據提交之前。如果程序在此時終止，除非配接器宣告 `reconcileUnknownSend`，否則核心無法得知平台訊息是否存在。該鉤子會將中斷的傳送分類為 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重新執行。沒有核對功能的頻道會回復為 `unknown_after_send` 狀態（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`），而且只有當重複的可見訊息是該頻道可接受且有文件記載的取捨時，才可選擇至少一次重新執行。

### 接收情境

`createMessageReceiveContext` 會追蹤每個傳入事件的確認／否定確認狀態，並提供冪等的 `ack()` 和明確的 `nack(error)`。確認原則（`ChannelMessageReceiveAckPolicy`）為以下其中之一：

| 原則                 | 確認時機                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | 核心已持久化足夠的傳入中繼資料，可對重新傳遞進行去重／路由                           |
| `after_agent_dispatch` | 代理程式執行已分派                                                             |
| `after_durable_send`   | 此輪次的持久傳出傳送已提交                                             |
| `manual`               | 呼叫端明確控制確認時機（未宣告原則的配接器預設使用此項） |

Telegram 輪詢會使用此機制持久化安全完成的更新水位標記（`extensions/telegram/src/bot-update-tracker.ts` 中的 `safeCompletedUpdateId`）：grammY 仍會觀察進入中介軟體鏈的每個更新，但 OpenClaw 只會將持久化的重新啟動水位標記推進到已完成分派的更新，因此失敗或仍待處理的更新會在重新啟動後重新執行。Telegram 上游的 `getUpdates` 位移量仍由 grammY 負責；目前尚未建置能控制超出此水位標記的平台層級重新傳遞之完全持久輪詢來源（請參閱待解問題）。

### 即時預覽

`src/channels/message/live.ts` 將預覽／編輯／完成建模為單一生命週期：`createLiveMessageState`、`markLiveMessagePreviewUpdated`、`markLiveMessageFinalized`、`markLiveMessageCancelled` 和 `deliverFinalizableLivePreviewAdapter`（從草稿建立最終編輯、套用編輯，並在無法編輯或編輯失敗時改用一般傳送）。`LiveMessageState.phase` 為 `idle | previewing | finalizing | finalized |
cancelled`；`canFinalizeInPlace` 控制預覽能否透過編輯成為最終訊息，而非重新傳送一則新訊息。

### 持久收據

`MessageReceipt`（`src/channels/message/types.ts`）會將單次邏輯傳送產生的一或多個平台訊息 ID 正規化為 `platformMessageIds`，以及每個部分的 `parts`（種類、索引、討論串 ID、回覆目標 ID）。系統會保留一個主要 ID，用於討論串及後續編輯。這使多部分傳遞（文字加媒體、分段文字、卡片備援）能在重新啟動後重新執行並去重。

### 精簡公開 SDK

本次重構吸收或棄用了：`reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、作為公開 API 的 `reply-payload` 輔助工具、`inbound-reply-dispatch`、`channel-reply-pipeline`，以及舊傳出門面的多數公開用法。`src/plugin-sdk/channel-message.ts` 現在是指向 `channel-outbound` / `channel-inbound` 的 `@deprecated` 重新匯出集中模組；`channel.turn` 執行階段別名已移除，舊版 `/plugins/sdk-channel-turn` 文件頁面會重新導向至[頻道傳入 API](/zh-TW/plugins/sdk-channel-inbound)。新的外掛程式碼應直接以 `channel-outbound` 和 `channel-inbound` 為目標。

## 實作與原始設計的差異

下方的設計草案從未完全依照文字描述推出。保留此紀錄是為了維持歷史準確性；請勿將這些型別名稱視為目前的 API。

- **沒有 `MessageOrigin` / `shouldDropOpenClawEcho`。** 原始計畫要求在閘道失敗訊息上加入 `source: "openclaw"` 來源標籤，並提供共用述詞，在進行 `allowBots` 授權前，捨棄共用聊天室中帶有標籤且由機器人撰寫的回音。程式碼庫中不存在該型別與述詞。`allowBots` 本身是實際的各頻道設定鍵（Slack、Discord、Google Chat 等），但原本用來保護它的來源標記機制從未建置。在已啟用機器人的聊天室中抑制閘道失敗回音仍是待解缺口，而非已推出的保證。
- **沒有統一的 `core.messages.receive/send/live/state` 命名空間。** 已推出的函式直接位於 `src/channels/message/*`（`withDurableMessageSendContext`、`createMessageReceiveContext`、`createLiveMessageState`、`classifyDurableSendRecoveryState`），而不是置於 `core.messages.*` 門面之後。
- **沒有通用的 `ChannelMessage` / `MessageTarget` / `MessageRelation` 正規化訊息型別。** 核心仍會透過傳送配接器傳遞具體的回覆承載資料（`ReplyPayload`）和頻道專用情境，而不是使用具備 `kind: "reply" |
"followup" | "broadcast" | "system"` 關聯的單一平台中立訊息形式。
- **確認原則名稱與草案不同。** 已推出：
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`。
  原始草案使用具備網路鉤子逾時原因欄位的 `immediate | after-record | after-durable-send |
manual`；該形式並未建置。
- **`DurableFinalDeliveryRequirementMap` 能力鍵取代了草案中的
  `MessageCapabilities` 物件。** 能力是扁平布林旗標（`text`、
  `media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、
  `messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、
  `afterCommit`），並透過 `verifyDurableFinalCapabilityProofs` 驗證，而不是採用巢狀的 `text.chunking` / `attachments.voice` 類型結構。

## 具體遷移風險（仍然相關）

這些頻道專用副作用早於本次重構存在，且必須透過新的傳送路徑繼續運作。它們並非假設情況：每一項目前皆已實作，且對系統運作至關重要。

- **iMessage**（`extensions/imessage/src/monitor/echo-cache.ts`、
  `persisted-echo-cache.ts`）：監控器會在成功傳送後，將已傳送的訊息記錄至回音
  快取。持久化的最終傳送仍必須填入該快取，否則 OpenClaw 可能會將自己的回覆
  重新擷取為傳入的使用者訊息。
- **Tlon**（`extensions/tlon/src/monitor/index.ts`）：附加選用的模型
  簽章，並在群組回覆後記錄參與過的討論串。持久化
  傳遞不得略過這些作用。
- **Discord 和其他已準備的分派器**已自行負責直接傳遞與
  預覽行為。只有當頻道的已準備分派器明確透過傳送情境路由最終內容時，
  該頻道才算具備端對端持久性；不要假設僅靠通用轉接器就已涵蓋。
- **Telegram 靜默備援傳遞**在分塊／備援
  投影後，必須傳遞完整的投影承載內容陣列，而非僅傳遞第一個承載內容。
- **LINE、Zalo、Nostr** 及類似的輔助路徑可能具有回覆權杖
  處理、媒體代理、已傳送訊息快取，或僅限回呼的目標。
  在傳送轉接器能表達這些語意且有測試涵蓋之前，它們仍由頻道自行負責傳遞。
- **直接私訊輔助工具**可能具有唯一正確傳輸目標的回覆回呼。
  通用對外傳送不得根據原始平台欄位猜測目標並略過該回呼。

## 失敗分類

轉接器會將傳輸失敗分類為 `DeliveryFailureKind` 形式的封閉
類別（暫時性、速率限制、驗證、權限、找不到、無效
承載內容、衝突、已取消、未知）。核心原則：

- 重試暫時性與速率限制失敗。
- 除非存在算繪備援，否則不要重試無效承載內容失敗。
- 在設定變更前，不要重試驗證或權限失敗。
- 發生找不到錯誤時，若頻道宣告此操作安全，允許即時定稿從編輯
  改為重新傳送。
- 發生衝突時，使用收據／等冪性狀態判斷訊息是否
  已存在。
- 若平台呼叫可能已成功，但在提交收據前發生任何錯誤，
  該錯誤會成為 `unknown_after_send`，除非轉接器能證明平台
  操作並未發生。

## 待釐清問題

- Telegram 最終是否應以完全持久化的輪詢來源取代 grammY（`1.43.0`）
  輪詢執行器，由該來源控制平台層級的重新傳遞，而不僅是 OpenClaw 的持久化
  重新啟動浮水印（`safeCompletedUpdateId`）。
- 即時預覽狀態應與最終傳送意圖存放在同一筆記錄中，
  還是存放於相鄰的即時狀態儲存區。
- 啟用共用機器人的聊天室中，閘道失敗時的回音抑制是否需要
  原先規劃的來源標記機制、較簡單的個別頻道合約，
  或不在範圍內。
- 哪些頻道原生支援來源／中繼資料，可用於跨機器人回音
  抑制；哪些頻道則需要持久化的對外傳送登錄。

## 相關內容

- [訊息](/zh-TW/concepts/messages)
- [串流與分塊](/zh-TW/concepts/streaming)
- [進度草稿](/zh-TW/concepts/progress-drafts)
- [重試原則](/zh-TW/concepts/retry)
- [頻道對外 API](/zh-TW/plugins/sdk-channel-outbound)
- [頻道傳入 API](/zh-TW/plugins/sdk-channel-inbound)
