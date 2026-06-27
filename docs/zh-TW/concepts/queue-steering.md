---
read_when:
    - 說明代理在使用工具時 steer 的行為
    - 變更 active-run 佇列行為或 runtime steering 整合
    - 比較導向與後續追問、收集和中斷佇列模式
summary: 主動執行導向如何在執行階段邊界佇列訊息
title: 引導佇列
x-i18n:
    generated_at: "2026-06-27T19:14:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

當一般提示在工作階段執行已經串流輸出時抵達，若佇列模式為
`steer`，OpenClaw 預設會嘗試將該提示送入作用中的執行階段。
此預設行為不需要任何設定項目，也不需要佇列指令。OpenClaw 與原生
Codex app-server 測試框架會以不同方式實作傳遞細節。

## 執行階段邊界

導向不會中斷已經在執行的工具呼叫。OpenClaw 會在模型邊界檢查
已排入佇列的導向訊息：

1. 助理要求工具呼叫。
2. OpenClaw 執行目前助理訊息的工具呼叫批次。
3. OpenClaw 發出回合結束事件。
4. OpenClaw 清空已排入佇列的導向訊息。
5. OpenClaw 在下一次 LLM 呼叫之前，將這些訊息附加為使用者訊息。

這會讓工具結果與要求它們的助理訊息保持配對，
然後讓下一次模型呼叫看到最新的使用者輸入。

原生 Codex app-server 測試框架公開的是 `turn/steer`，而不是 OpenClaw 執行階段的
內部導向佇列。OpenClaw 會在已設定的靜默時間窗內批次收集已排入佇列的提示，
然後以抵達順序將所有收集到的使用者輸入，透過單一 `turn/steer` 要求送出。

Codex review 與手動壓縮回合會拒絕同一回合導向。當執行階段在
`steer` 模式下無法接受導向時，OpenClaw 會等待作用中的執行
完成後，才開始處理該提示。

本頁說明在模式為 `steer` 時，一般傳入訊息的佇列模式導向。
如果模式為 `followup` 或 `collect`，一般訊息不會進入此導向路徑；
它們會等到作用中的執行完成。若要了解明確的
`/steer <message>` 命令，請參閱[導向](/zh-TW/tools/steer)。

## 模式

| 模式        | 作用中執行的行為                                    | 後續行為                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 可行時，將提示導向至作用中的執行階段。 | 如果無法導向，會等待作用中的執行完成。                      |
| `followup`  | 不導向。                                        | 在作用中的執行結束後，稍後執行已排入佇列的訊息。                               |
| `collect`   | 不導向。                                        | 在防抖時間窗之後，將相容的已排入佇列訊息合併為稍後的一個回合。 |
| `interrupt` | 中止作用中的執行，而不是導向它。          | 中止後開始處理最新訊息。                                           |

## 爆量範例

如果四位使用者在代理正在執行工具呼叫時傳送訊息：

- 使用預設行為時，作用中的執行階段會在下一次模型決策之前，
  依抵達順序收到全部四則訊息。OpenClaw 會在下一個模型
  邊界清空它們；Codex 會以單一批次的 `turn/steer` 收到它們。
- 使用 `/queue collect` 時，OpenClaw 不會導向。它會等到作用中的執行
  結束，然後在防抖時間窗之後，以相容的已排入佇列訊息建立一個後續回合。
- 使用 `/queue interrupt` 時，OpenClaw 會中止作用中的執行，並開始處理最新
  訊息，而不是導向。

## 範圍

導向一律以目前作用中的工作階段執行為目標。它不會建立新的
工作階段、變更作用中執行的工具政策，或依傳送者拆分訊息。在
多使用者頻道中，傳入提示已經包含傳送者與路由情境，因此
下一次模型呼叫可以看到每則訊息是誰傳送的。

當你希望訊息預設排入佇列，而不是導向至作用中的執行時，請使用
`followup` 或 `collect`。當最新提示應取代作用中的執行時，請使用
`interrupt`。

## 防抖

`messages.queue.debounceMs` 適用於已排入佇列的 `followup` 與 `collect` 傳遞。
在使用原生 Codex 測試框架的 `steer` 模式中，它也會設定送出批次
`turn/steer` 之前的靜默時間窗。對 OpenClaw 而言，作用中導向本身不使用
防抖計時器，因為 OpenClaw 會自然地將訊息批次累積到下一個模型
邊界。

## 相關

- [命令佇列](/zh-TW/concepts/queue)
- [導向](/zh-TW/tools/steer)
- [訊息](/zh-TW/concepts/messages)
- [代理迴圈](/zh-TW/concepts/agent-loop)
