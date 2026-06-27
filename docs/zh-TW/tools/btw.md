---
read_when:
    - 你想詢問一個關於目前工作階段的快速附帶問題
    - 你正在跨用戶端實作或偵錯 BTW 行為
summary: 臨時附帶問題可使用 /btw
title: 順帶一問
x-i18n:
    generated_at: "2026-06-27T20:05:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` 可讓你針對**目前工作階段**快速提出一個附帶問題，而不會把該問題變成一般對話歷史。`/side` 是別名。

它仿照 Claude Code 的 `/btw` 行為設計，但已調整以適配 OpenClaw 的閘道與多通道架構。

## 它的作用

當你傳送：

```text
/btw what changed?
```

OpenClaw 會：

1. 對目前工作階段脈絡建立快照，
2. 執行一個獨立的暫時性附帶查詢，
3. 只回答該附帶問題，
4. 不影響主要執行，
5. **不會**將 BTW 問題或答案寫入工作階段歷史，
6. 將答案作為**即時側邊結果**發出，而不是一般助理訊息。

重要的心智模型是：

- 相同的工作階段脈絡
- 獨立的一次性附帶查詢
- 當工作階段使用原生 harness 時，使用相同的原生 harness 傳輸
- 不污染未來脈絡
- 不持久保存逐字稿

對於 Codex harness 工作階段，BTW 會留在 Codex 內部，透過將作用中的 app-server 執行緒分叉為暫時性側邊執行緒來運作。這會保留 Codex OAuth 與原生執行緒行為，同時仍將側邊答案與父逐字稿隔離。和 Codex `/side` 一樣，側邊執行緒會保留目前的 Codex 權限與原生工具介面，並帶有防護規則，告知模型不要將繼承自父執行緒的工作視為作用中的指令。

對於命令列介面執行階段別名，BTW 會使用所屬命令列介面後端的附帶問題模式，而不是退回到直接提供者呼叫。OpenClaw 會將經過淨化的對話脈絡植入新的單次命令列介面呼叫，為該呼叫停用 OpenClaw MCP 工具打包與可重用的命令列介面工作階段狀態，並讓後端加入其支援的任何命令列介面原生不續接或無工具旗標。直接的非命令列介面執行階段則保留直接的一次性路徑。

## 它不會做什麼

`/btw` **不會**：

- 建立新的持久工作階段，
- 繼續未完成的主要任務，
- 將 BTW 問題/答案資料寫入逐字稿歷史，
- 出現在 `chat.history` 中，
- 在重新載入後保留。

它是刻意設計為**暫時性**的。

## 脈絡如何運作

BTW 僅將目前工作階段用作**背景脈絡**。

如果主要執行目前正在作用中，OpenClaw 會對目前訊息狀態建立快照，並將進行中的主要提示納入背景脈絡，同時明確告知模型：

- 只回答附帶問題，
- 不要恢復或完成未完成的主要任務，
- 不要引導父對話。

這會讓 BTW 與主要執行隔離，同時仍能了解該工作階段的內容。

## 傳遞模型

BTW **不會**作為一般助理逐字稿訊息傳遞。

在閘道協定層級：

- 一般助理聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

這種分離是刻意的。如果 BTW 重用一般 `chat` 事件路徑，用戶端會將它視為一般對話歷史。

因為 BTW 使用獨立的即時事件，且不會從 `chat.history` 重播，所以它會在重新載入後消失。

## 介面行為

### 終端介面

在終端介面中，BTW 會在目前工作階段檢視中行內呈現，但仍保持暫時性：

- 在視覺上與一般助理回覆不同
- 可用 `Enter` 或 `Esc` 關閉
- 重新載入後不會重播

### 外部通道

在 Telegram、WhatsApp 和 Discord 等通道上，BTW 會作為清楚標示的一次性回覆傳遞，因為這些介面沒有本機暫時性覆蓋層概念。

該答案仍會被視為側邊結果，而不是一般工作階段歷史。

### Control UI / 網頁

閘道會正確地將 BTW 作為 `chat.side_result` 發出，且 BTW 不會包含在 `chat.history` 中，因此對網頁而言，持久化合約已經正確。

目前的 Control UI 仍需要專用的 `chat.side_result` 消費者，才能在瀏覽器中即時呈現 BTW。在該用戶端支援完成之前，BTW 是一項具備完整終端介面與外部通道行為的閘道層級功能，但尚未具備完整的瀏覽器使用者體驗。

## 何時使用 BTW

當你想要以下內容時，使用 `/btw`：

- 針對目前工作快速釐清，
- 在長時間執行仍在進行時取得事實性的附帶答案，
- 取得不應成為未來工作階段脈絡一部分的暫時答案。

範例：

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何時不要使用 BTW

當你希望答案成為工作階段未來工作脈絡的一部分時，不要使用 `/btw`。

在這種情況下，請改為在主要工作階段中正常提問。

## 相關內容

<CardGroup cols={2}>
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄與聊天指令。
  </Card>
  <Card title="Thinking levels" href="/zh-TW/tools/thinking" icon="brain">
    附帶問題模型呼叫的推理投入層級。
  </Card>
  <Card title="Session" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰、歷史與持久化語意。
  </Card>
  <Card title="Steer command" href="/zh-TW/tools/steer" icon="arrow-right">
    將引導訊息注入作用中的執行，而不中止該執行。
  </Card>
</CardGroup>
