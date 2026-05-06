---
read_when:
    - 你想針對目前工作階段快速詢問一個附帶問題
    - 你正在跨用戶端實作或偵錯 BTW 行為
summary: 使用 /btw 提出暫時性的附帶問題
title: 順便問幾個附帶問題
x-i18n:
    generated_at: "2026-05-06T02:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 讓你針對**目前工作階段**快速詢問旁支問題，而不會
把該問題變成一般對話歷史。`/side` 是別名。

它仿照 Claude Code 的 `/btw` 行為設計，但已調整以配合 OpenClaw 的
Gateway 與多通道架構。

## 它的作用

當你傳送：

```text
/btw what changed?
```

OpenClaw 會：

1. 快照目前的工作階段情境，
2. 執行一次獨立且**不使用工具**的模型呼叫，
3. 只回答旁支問題，
4. 不影響主要執行流程，
5. **不會**將 BTW 問題或答案寫入工作階段歷史，
6. 將答案作為**即時旁支結果**發出，而不是一般助理訊息。

重要的心智模型是：

- 相同的工作階段情境
- 獨立的一次性旁支查詢
- 不進行工具呼叫
- 不污染未來情境
- 不持久化逐字稿

## 它不會做的事

`/btw` **不會**：

- 建立新的持久工作階段，
- 繼續未完成的主要任務，
- 執行工具或 agent 工具迴圈，
- 將 BTW 問題/答案資料寫入逐字稿歷史，
- 出現在 `chat.history` 中，
- 在重新載入後保留。

它刻意設計為**暫時性**。

## 情境如何運作

BTW 只會將目前工作階段作為**背景情境**使用。

如果主要執行流程目前正在進行中，OpenClaw 會快照目前的訊息狀態，
並將進行中的主要提示詞納入背景情境，同時明確告訴模型：

- 只回答旁支問題，
- 不要恢復或完成未完成的主要任務，
- 不要發出工具呼叫或偽工具呼叫。

這讓 BTW 與主要執行流程隔離，同時仍知道工作階段的主題。

## 傳遞模型

BTW **不會**作為一般助理逐字稿訊息傳遞。

在 Gateway 協定層級：

- 一般助理聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

這種分離是刻意的。如果 BTW 重用一般 `chat` 事件路徑，
用戶端會把它視為一般對話歷史。

因為 BTW 使用獨立的即時事件，且不會從 `chat.history` 重播，
所以重新載入後會消失。

## 介面行為

### TUI

在 TUI 中，BTW 會在目前工作階段檢視中以內嵌方式呈現，但仍然是
暫時性的：

- 視覺上與一般助理回覆不同
- 可用 `Enter` 或 `Esc` 關閉
- 重新載入後不會重播

### 外部通道

在 Telegram、WhatsApp 和 Discord 等通道上，BTW 會作為
清楚標示的一次性回覆傳遞，因為這些介面沒有本機
暫時性覆蓋層概念。

答案仍會被視為旁支結果，而不是一般工作階段歷史。

### Control UI / 網頁

Gateway 會正確地將 BTW 發出為 `chat.side_result`，且 BTW 不會包含在
`chat.history` 中，因此網頁的持久性合約已經正確。

目前的 Control UI 仍需要專用的 `chat.side_result` 消費者，才能在
瀏覽器中即時呈現 BTW。在該用戶端支援落地之前，BTW 是一項
Gateway 層級功能，具備完整的 TUI 與外部通道行為，但尚未具備
完整的瀏覽器使用者體驗。

## 何時使用 BTW

當你想要以下情境時，使用 `/btw`：

- 快速釐清目前工作，
- 在長時間執行仍在進行時取得事實性的旁支答案，
- 取得不應成為未來工作階段情境一部分的暫時答案。

範例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何時不應使用 BTW

如果你希望答案成為工作階段未來工作情境的一部分，
不要使用 `/btw`。

在這種情況下，請在主要工作階段中正常提問，而不是使用 BTW。

## 相關

<CardGroup cols={2}>
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄與聊天指令。
  </Card>
  <Card title="Thinking levels" href="/zh-TW/tools/thinking" icon="brain">
    旁支問題模型呼叫的推理投入程度。
  </Card>
  <Card title="Session" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰、歷史與持久性語意。
  </Card>
  <Card title="Steer command" href="/zh-TW/tools/steer" icon="arrow-right">
    將導向訊息注入作用中的執行流程，而不結束它。
  </Card>
</CardGroup>
