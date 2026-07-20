---
read_when:
    - 說明 steer 在代理程式使用工具時的行為方式
    - 變更執行中作業的佇列行為或執行階段導引整合
    - 比較 steering 與 followup、collect 及 interrupt 佇列模式
summary: 主動執行導引如何在執行階段邊界將訊息排入佇列
title: 引導佇列
x-i18n:
    generated_at: "2026-07-20T00:50:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 131f04f19934b9b1f6dd8ffb2cf2428950c319483abdc2ccdecec741809cda2a
    source_path: concepts/queue-steering.md
    workflow: 16
---

當工作階段執行已在串流時收到一般提示，且佇列模式為 `steer`（預設值，無須設定）時，OpenClaw 會嘗試將該提示傳送至作用中的執行階段。OpenClaw 與原生 Codex app-server 控制框架採用不同方式實作傳遞細節。

本頁說明 `steer` 模式下一般傳入訊息的佇列模式引導行為。在 `followup` 或 `collect` 模式下，一般訊息會略過此路徑，並等候作用中的執行結束。如需明確的 `/steer <message>` 命令，請參閱[引導](/zh-TW/tools/steer)。

## 執行階段邊界

引導不會中斷已在執行的工具呼叫。OpenClaw 會在模型邊界檢查佇列中的引導訊息：

1. 助理要求工具呼叫。
2. OpenClaw 執行目前助理訊息的工具呼叫批次。
3. OpenClaw 發出回合結束事件。
4. OpenClaw 取出佇列中的引導訊息。
5. OpenClaw 在下一次 LLM 呼叫前，將這些訊息附加為使用者訊息。

這可讓工具結果與要求它們的助理訊息保持配對，接著讓下一次模型呼叫看到最新的使用者輸入。

原生 Codex app-server 控制框架公開 `turn/steer`，而不是 OpenClaw 執行階段的內部引導佇列。OpenClaw 會在設定的靜默時間範圍內批次收集佇列提示，然後依抵達順序將所有收集到的使用者輸入以單一 `turn/steer` 請求傳送。

Codex 審查與手動壓縮回合會拒絕同回合引導。當執行階段無法在 `steer` 模式下接受引導時，OpenClaw 會等候作用中的執行結束，再開始處理提示。

## 模式

| 模式        | 作用中執行的行為                                    | 後續行為                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 可行時，將提示引導至作用中的執行階段。 | 若無法引導，則等候作用中的執行結束。                      |
| `followup`  | 不進行引導。                                        | 在作用中的執行結束後，稍後執行佇列中的訊息。                               |
| `collect`   | 不進行引導。                                        | 在防彈跳時間範圍後，將相容的佇列訊息合併為稍後的一個回合。 |
| `interrupt` | 中止作用中的執行，而非進行引導。          | 中止後開始處理最新的訊息。                                           |

## 突發訊息範例

如果代理程式正在執行工具呼叫時，有四位使用者傳送訊息：

- 採用預設行為時，作用中的執行階段會在下一次模型決策前，依抵達順序收到全部四則訊息。OpenClaw 會在下一個模型邊界取出它們；Codex 則會以一個批次 `turn/steer` 收到它們。
- 採用 `/queue collect` 時，OpenClaw 不會進行引導。它會等候作用中的執行結束，然後在防彈跳時間範圍後，以相容的佇列訊息建立後續回合。
- 採用 `/queue interrupt` 時，OpenClaw 會中止作用中的執行，並開始處理最新的訊息，而非進行引導。

## 範圍

引導一律以目前作用中的工作階段執行為目標。它不會建立新的工作階段、變更作用中執行的工具政策，也不會依傳送者拆分訊息。在多使用者頻道中，傳入提示已包含傳送者與路由內容，因此下一次模型呼叫可以得知每則訊息的傳送者。

若要讓訊息預設進入佇列，而非引導作用中的執行，請使用 `followup` 或 `collect`。若最新提示應取代作用中的執行，請使用 `interrupt`。

## 防彈跳

內建的佇列防彈跳適用於佇列中的 `followup` 與 `collect` 傳遞。在搭配原生 Codex 控制框架的 `steer` 模式下，它也會設定傳送批次 `turn/steer` 前的靜默時間範圍。對 OpenClaw 而言，作用中引導本身不使用防彈跳計時器，因為 OpenClaw 會自然地將訊息批次收集至下一個模型邊界。

## 相關內容

- [命令佇列](/zh-TW/concepts/queue)
- [引導](/zh-TW/tools/steer)
- [訊息](/zh-TW/concepts/messages)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
