---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道入站、回覆派送、出站佇列、預覽串流，或外掛 SDK 訊息 API
    - 設計需要持久化傳送、回條、預覽、編輯或重試的新通道外掛
summary: 持久訊息接收/傳送生命週期的狀態：已推出的內容、與原始設計相比的變更，以及仍待處理的事項
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-07-05T11:15:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
此頁源自一份前瞻性的設計提案。該設計的核心後來已在 `src/channels/message/*` 以及公開的
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 子路徑中出貨。若要查看目前的 API，請使用 [Channel outbound API](/zh-TW/plugins/sdk-channel-outbound) 與
[Channel inbound API](/zh-TW/plugins/sdk-channel-inbound)。此頁追蹤已出貨的內容、實作與原始草圖分歧之處，以及仍待處理的事項。
</Note>

## 為什麼會進行這次重構

通道堆疊是從多個局部修正逐步成長而來：依成熟度等級分開的入站輔助工具（簡易配接器使用 `runtime.channel.inbound.run`，功能較完整者使用
`runtime.channel.inbound.runPreparedReply`）、舊版回覆分派輔助工具（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、通道專屬的預覽串流，以及附加到既有回覆承載路徑上的最終傳遞耐久性。這種形狀產生了太多公開概念，也讓傳遞語意有太多可能漂移的位置。

迫使重新設計的可靠性缺口：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標不變條件：一旦核心決定應該存在一則可見的出站訊息，在嘗試平台呼叫之前，傳送意圖就必須先具備耐久性；成功之後，平台收據必須提交。這讓系統預設具備至少一次復原能力。只有在配接器證明原生冪等性，或能在重播前將「傳送後狀態未知」的嘗試與平台狀態對帳時，才存在恰好一次行為。

## 已出貨內容

內部領域位於 `src/channels/message/*`：

| 檔案                        | 負責項目                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 配接器、傳送情境、收據與耐久意圖型別合約                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 耐久傳送情境                             |
| `receive.ts`                | `createMessageReceiveContext` — 入站 ack-policy 狀態機                                                   |
| `live.ts`                   | 即時預覽狀態與原地最終化或退回邏輯                                                        |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中斷後的復原分類                                    |
| `receipt.ts`                | 將平台傳送結果正規化為 `MessageReceipt`                                                             |
| `capabilities.ts`           | 從承載推導必要的耐久最終能力                                                         |
| `contracts.ts`              | 已宣告配接器能力的合約證明驗證                                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 包裝舊版 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 函式 |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 耐久入站事件佇列                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 用於入站去重的 accept/pending/complete/release 日誌                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 與舊版命名包裝器                                                            |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、回覆前綴與 typing-callback 輔助工具                                             |

公開介面：`openclaw/plugin-sdk/channel-outbound`（傳送/收據/耐久/即時/回覆管線輔助工具）與 `openclaw/plugin-sdk/channel-inbound`（入站情境、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。請參閱那些頁面以取得配接器範例、目前的型別名稱與遷移說明 — 它們才是 API 形狀的事實來源，而不是下方草圖。

### 傳送情境

`withDurableMessageSendContext` 讓通道程式碼能圍繞單一出站訊息執行 `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit` 與 `fail` 步驟。`sendDurableMessageBatch` 是常見情境的包裝器：render、send，然後在 `sent`/`suppressed` 時 commit，或在錯誤時 fail。

`sendDurableMessageBatch` 會回傳一個可辨識聯集結果：

| 狀態           | 意義                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | 至少一則可見的平台訊息已傳遞                              |
| `suppressed`     | 不應將任何平台訊息視為遺失（hook 取消、dry-run 等） |
| `partial_failed` | 至少一則訊息已傳遞，但後續承載或副作用失敗      |
| `failed`         | 沒有產生平台收據                                                 |

耐久性為 `required`、`best_effort` 或 `disabled` 之一（`src/channels/message/types.ts` 中的 `MessageDurabilityPolicy`）。當耐久意圖無法寫入時，`required` 會封閉式失敗；當持久化不可用時，`best_effort` 會退回直接傳送；`disabled` 則保留重構前的直接傳送行為。舊版相容性輔助工具預設為
`disabled`，且不會只因通道有通用出站配接器就推斷為 `required`。

仍然危險的邊界：平台呼叫成功之後、收據提交之前。如果程序在此時死亡，除非配接器宣告 `reconcileUnknownSend`，否則核心無法知道平台訊息是否存在。該 hook 會將中斷的傳送分類為 `sent`、`not_sent` 或
`unresolved`；只有 `not_sent` 允許重播。沒有對帳的通道會退回到 `unknown_after_send` 狀態（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`），且只有在重複可見訊息是該通道可接受且已記錄的取捨時，才可選擇至少一次重播。

### 接收情境

`createMessageReceiveContext` 會以冪等的 `ack()` 與明確的 `nack(error)`，追蹤每個入站事件的 ack/nack 狀態。ack policy（`ChannelMessageReceiveAckPolicy`）為下列之一：

| 政策                 | ack 時機                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | 核心已持久化足夠的入站中繼資料，可對重新傳遞進行去重/路由                           |
| `after_agent_dispatch` | agent run 已分派                                                             |
| `after_durable_send`   | 此回合的耐久出站傳送已提交                                             |
| `manual`               | 呼叫端明確控制 ack 時機（未宣告政策的配接器預設值） |

Telegram polling 使用此機制來持久化安全完成的更新浮水印（`extensions/telegram/src/bot-update-tracker.ts` 中的 `safeCompletedUpdateId`）：grammY 仍會在每個更新進入 middleware chain 時觀察它，但 OpenClaw 只會將持久化的重啟浮水印推進到已完成分派的更新之後，因此失敗或仍在處理中的更新會在重啟後重播。Telegram 上游的 `getUpdates` offset 仍由 grammY 擁有；尚未建置能在此浮水印之外控制平台層級重新傳遞的完全耐久 polling 來源（請參閱待解問題）。

### 即時預覽

`src/channels/message/live.ts` 將預覽/編輯/最終化建模為一個生命週期：
`createLiveMessageState`、`markLiveMessagePreviewUpdated`、
`markLiveMessageFinalized`、`markLiveMessageCancelled` 與
`deliverFinalizableLivePreviewAdapter`（從草稿建立最終編輯、套用它，並在無法編輯或編輯失敗時退回一般傳送）。
`LiveMessageState.phase` 為 `idle | previewing | finalizing | finalized |
cancelled`；`canFinalizeInPlace` 控制預覽是否能透過編輯成為最終訊息，而不是重新傳送。

### 耐久收據

`MessageReceipt`（`src/channels/message/types.ts`）會將單一邏輯傳送中的一個或多個平台訊息 ID 正規化為 `platformMessageIds`，並包含每個部分的 `parts`（kind、index、thread id、reply-to id）。主要 ID 會保留下來供串接討論與後續編輯使用。這讓多部分傳遞（文字加媒體、分段文字、卡片退回）能在重啟後重播並去重。

### 公開 SDK 精簡

此次重構吸收或棄用：以公開 API 形式暴露的 `reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload` 輔助工具、`inbound-reply-dispatch`、`channel-reply-pipeline`，以及大多數 `outbound-runtime` 的公開用法。`src/plugin-sdk/channel-message.ts` 現在是指向 `channel-outbound` /
`channel-inbound` 的 `@deprecated` 重新匯出 barrel；`channel.turn` runtime aliases 已移除，舊的
`/plugins/sdk-channel-turn` 文件頁面會重新導向至
[Channel inbound API](/zh-TW/plugins/sdk-channel-inbound)。新的外掛程式碼應直接以 `channel-outbound` 與 `channel-inbound` 為目標。

## 實作與原始設計分歧之處

下方設計草圖從未依字面描述出貨。保留紀錄是為了歷史準確性；請勿將這些型別名稱視為目前 API。

- **沒有 `MessageOrigin` / `shouldDropOpenClawEcho`。** 原始計畫要求在閘道失敗訊息上加入 `source: "openclaw"` 來源標籤，並加入共用述詞，在 `allowBots` 授權之前，於共用聊天室中丟棄帶標籤且由 bot 撰寫的回聲。該型別與述詞在程式碼庫中不存在。`allowBots` 本身是真實的每通道設定鍵（Slack、Discord、Google Chat 等），但原本用來保護它的來源標籤機制從未建置。啟用 bot 的聊天室中的閘道失敗回聲抑制仍是待解缺口，而非已出貨保證。
- **沒有統一的 `core.messages.receive/send/live/state` 命名空間。** 已出貨函式直接位於 `src/channels/message/*`
  （`withDurableMessageSendContext`、`createMessageReceiveContext`、
  `createLiveMessageState`、`classifyDurableSendRecoveryState`），而不是放在 `core.messages.*` facade 後面。
- **沒有通用的 `ChannelMessage` / `MessageTarget` / `MessageRelation`
  正規化訊息型別。** 核心仍會透過傳送配接器傳遞具體回覆承載（`ReplyPayload`）與通道專屬情境，而不是使用一個具備 `kind: "reply" |
"followup" | "broadcast" | "system"` 關係的平台中立訊息形狀。
- **Ack policy 名稱與草圖不同。** 已出貨：
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`。
  原始草圖使用 `immediate | after-record | after-durable-send |
manual`，並帶有 webhook-timeout 原因欄位；該形狀未被建置。
- **`DurableFinalDeliveryRequirementMap` 能力鍵取代了草圖中的
  `MessageCapabilities` 物件。** 能力是扁平布林旗標（`text`、
  `media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、
  `messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、
  `afterCommit`），並透過 `verifyDurableFinalCapabilityProofs` 驗證，而不是巢狀的 `text.chunking` / `attachments.voice` 風格結構。

## 具體遷移風險（仍然相關）

這些通道特定的副作用早於此次重構存在，且必須透過新的傳送路徑持續
運作。它們並非假設情境：每一項目前都已實作且承擔關鍵負載。

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`)：監視器會在成功傳送後，將已傳送訊息記錄到回聲
  快取中。持久的最終傳送仍必須填入該快取，否則 OpenClaw 可能會將自己的回覆
  重新擷取為傳入的使用者訊息。
- **Tlon** (`extensions/tlon/src/monitor/index.ts`)：在群組回覆後附加可選的模型
  簽名並記錄已參與的討論串。持久遞送不得繞過這些效果。
- **Discord 與其他已準備的派發器** 已經擁有直接遞送與預覽行為。除非通道的已準備
  派發器明確透過傳送情境路由最終訊息，否則該通道尚未達成端到端持久；不要只因為
  通用配接器就假設已涵蓋。
- **Telegram 靜默後援遞送** 必須在分段/後援投影後遞送整個已投影的
  酬載陣列，而不是只遞送第一個酬載。
- **LINE、Zalo、Nostr** 與類似的輔助路徑可能具有回覆權杖處理、媒體代理、
  已傳送訊息快取，或僅限回呼的目標。在這些語意由傳送配接器表示並由測試涵蓋之前，
  它們會繼續由通道自有的遞送負責。
- **直接私訊輔助工具** 可能有一個回覆回呼，而且它是唯一正確的傳輸目標。通用對外
  傳送不得從原始平台欄位猜測目標並略過該回呼。

## 失敗分類

配接器會將傳輸失敗分類為 `DeliveryFailureKind` 風格的封閉
類別（暫時性、速率限制、驗證、權限、找不到、無效
酬載、衝突、已取消、未知）。核心政策：

- 重試暫時性與速率限制失敗。
- 除非存在轉譯後援，否則不要重試無效酬載失敗。
- 在設定變更之前，不要重試驗證或權限失敗。
- 找不到時，若通道宣告這樣做安全，讓即時最終化從編輯後援為全新傳送。
- 發生衝突時，使用收據/冪等性狀態判斷訊息是否已經存在。
- 平台呼叫之後發生的任何錯誤，都可能已成功但尚未提交收據，因此會成為
  `unknown_after_send`，除非配接器能證明平台操作未發生。

## 未決問題

- Telegram 是否最終應該以完全持久的輪詢來源取代 grammY (`1.43.0`) 輪詢
  執行器，控制平台層級的重新遞送，而不只是 OpenClaw 的已持久化重啟水位線
  (`safeCompletedUpdateId`)。
- 即時預覽狀態應該與最終傳送意圖存在同一筆記錄中，還是存在相鄰的即時狀態儲存中。
- 在啟用共用機器人的房間中，閘道失敗的回聲抑制是否需要原先規劃的來源標記機制、
  更簡單的每通道合約，或是不在範圍內。
- 哪些通道具備原生來源/中繼資料支援，可用於跨機器人的回聲抑制；哪些則需要持久化的
  對外登錄表。

## 相關

- [訊息](/zh-TW/concepts/messages)
- [串流與分段](/zh-TW/concepts/streaming)
- [進度草稿](/zh-TW/concepts/progress-drafts)
- [重試政策](/zh-TW/concepts/retry)
- [通道對外 API](/zh-TW/plugins/sdk-channel-outbound)
- [通道傳入 API](/zh-TW/plugins/sdk-channel-inbound)
