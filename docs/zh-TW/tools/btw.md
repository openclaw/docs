---
read_when:
    - 您想快速詢問一個關於目前工作階段的附帶問題
    - 你正在跨客戶端實作或偵錯 BTW 行為
summary: 使用 /btw 提出臨時附帶問題
title: 順便問幾個題外問題
x-i18n:
    generated_at: "2026-05-11T20:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 可讓你針對**目前工作階段**快速詢問旁支問題，而不會將該問題轉成一般對話歷史。`/side` 是其別名。

它的設計參考了 Claude Code 的 `/btw` 行為，但已調整以配合 OpenClaw 的 Gateway 與多通道架構。

## 它會做什麼

當你傳送：

```text
/btw what changed?
```

OpenClaw 會：

1. 快照目前的工作階段上下文，
2. 執行一個獨立的暫時性旁支查詢，
3. 只回答該旁支問題，
4. 保持主執行不受影響，
5. **不會**將 BTW 問題或回答寫入工作階段歷史，
6. 將答案作為**即時旁支結果**發出，而不是一般助理訊息。

重要的心智模型是：

- 相同的工作階段上下文
- 獨立的一次性旁支查詢
- 當工作階段使用原生 harness 時，使用相同的原生 harness 傳輸
- 不污染未來上下文
- 不持久保存逐字稿

對於 Codex harness 工作階段，BTW 會留在 Codex 內，透過將作用中的 app-server 執行緒分叉為暫時性旁支執行緒來運作。這會維持 Codex OAuth 與原生執行緒行為完整，同時仍將旁支答案與父逐字稿隔離。和 Codex `/side` 一樣，旁支執行緒會保留目前的 Codex 權限與原生工具表面，並以防護機制告訴模型不要把繼承自父執行緒的工作視為有效指令。非 Codex 執行階段則保留較舊的直接一次性路徑。

## 它不會做什麼

`/btw` **不會**：

- 建立新的持久工作階段，
- 繼續未完成的主工作，
- 將 BTW 問題/答案資料寫入逐字稿歷史，
- 出現在 `chat.history` 中，
- 在重新載入後保留。

它刻意設計為**暫時性**。

## 上下文如何運作

BTW 只會將目前工作階段作為**背景上下文**使用。

如果主執行目前正在作用中，OpenClaw 會快照目前的訊息狀態，並將執行中的主提示納入背景上下文，同時明確告訴模型：

- 只回答旁支問題，
- 不要恢復或完成未完成的主工作，
- 不要引導父對話。

這會讓 BTW 與主執行隔離，同時仍讓它知道該工作階段的主題。

## 傳遞模型

BTW **不會**作為一般助理逐字稿訊息傳遞。

在 Gateway 協定層級：

- 一般助理聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

這種分離是刻意的。如果 BTW 重用一般 `chat` 事件路徑，客戶端會把它視為一般對話歷史。

因為 BTW 使用獨立的即時事件，且不會從 `chat.history` 重播，所以它會在重新載入後消失。

## 表面行為

### TUI

在 TUI 中，BTW 會在目前工作階段檢視中以行內方式呈現，但仍保持暫時性：

- 與一般助理回覆在視覺上明顯不同
- 可用 `Enter` 或 `Esc` 關閉
- 重新載入時不會重播

### 外部通道

在 Telegram、WhatsApp 和 Discord 等通道上，BTW 會作為清楚標示的一次性回覆傳遞，因為這些表面沒有本機暫時性覆蓋層概念。

答案仍會被視為旁支結果，而不是一般工作階段歷史。

### 控制 UI / 網頁

Gateway 會正確地將 BTW 作為 `chat.side_result` 發出，且 BTW 不會包含在 `chat.history` 中，因此網頁的持久化合約已經正確。

目前的控制 UI 仍需要專用的 `chat.side_result` 消費者，才能在瀏覽器中即時呈現 BTW。在該客戶端支援落地之前，BTW 是一項 Gateway 層級功能，具備完整的 TUI 與外部通道行為，但尚未提供完整的瀏覽器使用者體驗。

## 何時使用 BTW

當你想要以下情境時，請使用 `/btw`：

- 快速釐清目前工作，
- 在長時間執行仍在進行時取得事實性的旁支答案，
- 取得不應成為未來工作階段上下文一部分的暫時答案。

範例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何時不要使用 BTW

當你希望答案成為工作階段未來工作上下文的一部分時，請不要使用 `/btw`。

在這種情況下，請在主工作階段中正常提問，而不是使用 BTW。

## 相關

<CardGroup cols={2}>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄與聊天指令。
  </Card>
  <Card title="思考層級" href="/zh-TW/tools/thinking" icon="brain">
    旁支問題模型呼叫的推理努力層級。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰、歷史與持久化語意。
  </Card>
  <Card title="引導命令" href="/zh-TW/tools/steer" icon="arrow-right">
    在不結束作用中執行的情況下，注入一則引導訊息。
  </Card>
</CardGroup>
