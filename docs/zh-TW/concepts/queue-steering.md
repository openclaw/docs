---
read_when:
    - 說明在代理程式使用工具時，引導的行為方式
    - 變更作用中執行佇列行為或執行階段導向整合
    - 比較使用 followup、collect 與 interrupt 佇列模式進行導向
summary: active-run 導向如何在執行階段邊界將訊息排入佇列
title: 導引佇列
x-i18n:
    generated_at: "2026-07-05T11:15:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

當一般提示在工作階段執行已經串流時抵達，且佇列模式是 `steer`（預設值，不需要設定）時，OpenClaw 會嘗試將該提示送入作用中的執行階段。OpenClaw 和原生 Codex app-server harness 會以不同方式實作傳遞細節。

本頁說明 `steer` 模式中一般傳入訊息的佇列模式導向。在 `followup` 或 `collect` 模式中，一般訊息會略過此路徑，並等到作用中執行完成。若要了解明確的 `/steer <message>` 命令，請參閱 [導向](/zh-TW/tools/steer)。

## 執行階段邊界

導向不會中斷已經在執行的工具呼叫。OpenClaw 會在模型邊界檢查佇列中的導向訊息：

1. 助理要求工具呼叫。
2. OpenClaw 執行目前助理訊息的工具呼叫批次。
3. OpenClaw 發出回合結束事件。
4. OpenClaw 清空佇列中的導向訊息。
5. OpenClaw 在下一次 LLM 呼叫前，將這些訊息附加為使用者訊息。

這會讓工具結果與要求它們的助理訊息配對，然後讓下一次模型呼叫看到最新的使用者輸入。

原生 Codex app-server harness 會公開 `turn/steer`，而不是 OpenClaw 執行階段的內部導向佇列。OpenClaw 會依設定的靜默視窗批次處理佇列中的提示，然後以抵達順序將所有收集到的使用者輸入，作為單一 `turn/steer` 要求送出。

Codex 審查和手動壓縮回合會拒絕同回合導向。當執行階段無法在 `steer` 模式中接受導向時，OpenClaw 會等待作用中執行完成後再啟動提示。

## 模式

| 模式        | 作用中執行行為                                    | 後續行為                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 可行時將提示導向作用中的執行階段。 | 如果無法導向，則等待作用中執行完成。                      |
| `followup`  | 不導向。                                        | 在作用中執行結束後，稍後執行佇列中的訊息。                               |
| `collect`   | 不導向。                                        | 在防抖視窗後，將相容的佇列訊息合併成一個後續回合。 |
| `interrupt` | 中止作用中執行，而不是導向它。          | 中止後啟動最新的訊息。                                           |

## 突發範例

如果四位使用者在代理程式執行工具呼叫時傳送訊息：

- 使用預設行為時，作用中執行階段會在下一次模型決策前，依抵達順序接收全部四則訊息。OpenClaw 會在下一個模型邊界清空它們；Codex 會以一個批次 `turn/steer` 接收它們。
- 使用 `/queue collect` 時，OpenClaw 不會導向。它會等到作用中執行結束，然後在防抖視窗後，以相容的佇列訊息建立後續回合。
- 使用 `/queue interrupt` 時，OpenClaw 會中止作用中執行，並啟動最新的訊息，而不是導向。

## 範圍

導向一律以目前作用中的工作階段執行為目標。它不會建立新工作階段、變更作用中執行的工具政策，或依傳送者分割訊息。在多使用者頻道中，傳入提示已經包含傳送者和路由情境，因此下一次模型呼叫可以看到每則訊息是誰傳送的。

當你希望訊息預設排入佇列，而不是導向作用中執行時，請使用 `followup` 或 `collect`。當最新提示應取代作用中執行時，請使用 `interrupt`。

## 防抖

`messages.queue.debounceMs` 會套用於佇列中的 `followup` 和 `collect` 傳遞。在搭配原生 Codex harness 的 `steer` 模式中，它也會設定傳送批次 `turn/steer` 前的靜默視窗。對 OpenClaw 而言，作用中導向本身不使用防抖計時器，因為 OpenClaw 會自然地將訊息批次到下一個模型邊界。

## 相關

- [命令佇列](/zh-TW/concepts/queue)
- [導向](/zh-TW/tools/steer)
- [訊息](/zh-TW/concepts/messages)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
