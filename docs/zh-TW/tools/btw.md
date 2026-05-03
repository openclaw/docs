---
read_when:
    - 你想就目前的工作階段快速問一個附帶問題
    - 你正在實作或偵錯跨用戶端的 BTW 行為
summary: 使用 /btw 提出臨時附帶問題
title: 順便問幾個附帶問題
x-i18n:
    generated_at: "2026-05-03T21:43:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 可讓你針對**目前工作階段**快速提出旁路問題，而不會把該問題變成一般對話歷史。`/side` 是別名。

它仿照 Claude Code 的 `/btw` 行為，但已調整以配合 OpenClaw 的 Gateway 與多通道架構。

## 它會做什麼

當你傳送：

```text
/btw what changed?
```

OpenClaw 會：

1. 擷取目前工作階段內容的快照，
2. 執行一次獨立的**無工具**模型呼叫，
3. 只回答旁路問題，
4. 不影響主要執行，
5. **不會**將 BTW 問題或答案寫入工作階段歷史，
6. 將答案作為**即時旁路結果**發出，而不是一般助理訊息。

重要的心智模型是：

- 相同的工作階段內容
- 獨立的一次性旁路查詢
- 不呼叫工具
- 不污染未來內容
- 不持久保存文字記錄

## 它不會做什麼

`/btw` **不會**：

- 建立新的持久工作階段，
- 繼續未完成的主要任務，
- 執行工具或代理工具迴圈，
- 將 BTW 問題/答案資料寫入文字記錄歷史，
- 出現在 `chat.history` 中，
- 在重新載入後保留。

它刻意設計為**暫時性**。

## 內容如何運作

BTW 只會將目前工作階段作為**背景內容**使用。

如果主要執行目前正在進行，OpenClaw 會擷取目前訊息狀態的快照，並將執行中的主要提示納入背景內容，同時明確告訴模型：

- 只回答旁路問題，
- 不要恢復或完成未完成的主要任務，
- 不要發出工具呼叫或偽工具呼叫。

這會讓 BTW 與主要執行隔離，同時仍能理解工作階段的主題。

## 傳遞模型

BTW **不會**作為一般助理文字記錄訊息傳遞。

在 Gateway 協定層級：

- 一般助理聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

這種分離是刻意的。如果 BTW 重用一般 `chat` 事件路徑，客戶端會把它視為一般對話歷史。

因為 BTW 使用獨立的即時事件，而且不會從 `chat.history` 重播，所以它會在重新載入後消失。

## 介面行為

### TUI

在 TUI 中，BTW 會內嵌呈現在目前工作階段檢視中，但它仍然是暫時性的：

- 與一般助理回覆有明顯區隔
- 可用 `Enter` 或 `Esc` 關閉
- 重新載入時不會重播

### 外部通道

在 Telegram、WhatsApp 和 Discord 等通道上，BTW 會作為清楚標示的一次性回覆傳遞，因為這些介面沒有本機暫時性覆蓋層的概念。

答案仍會被視為旁路結果，而不是一般工作階段歷史。

### 控制 UI / 網頁

Gateway 會正確地將 BTW 發出為 `chat.side_result`，而且 BTW 不會包含在 `chat.history` 中，因此網頁的持久性合約已經是正確的。

目前的控制 UI 仍需要專用的 `chat.side_result` 消費者，才能在瀏覽器中即時呈現 BTW。在該客戶端支援落地之前，BTW 是具備完整 TUI 與外部通道行為的 Gateway 層級功能，但尚未提供完整的瀏覽器使用者體驗。

## 何時使用 BTW

當你想要以下內容時，請使用 `/btw`：

- 針對目前工作快速釐清，
- 在長時間執行仍在進行時取得事實性的旁路答案，
- 不應成為未來工作階段內容一部分的暫時答案。

範例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何時不要使用 BTW

如果你希望答案成為工作階段未來工作內容的一部分，請不要使用 `/btw`。

在這種情況下，請改在主要工作階段中正常提問，而不是使用 BTW。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [思考層級](/zh-TW/tools/thinking)
- [工作階段](/zh-TW/concepts/session)
