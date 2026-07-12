---
read_when:
    - 你正在變更外送頻道的 Markdown 格式或分段方式
    - 你正在新增頻道格式化器或樣式對應關係
    - 你正在偵錯跨頻道的格式退化問題
summary: 外送頻道的 Markdown 格式處理管線
title: Markdown 格式設定
x-i18n:
    generated_at: "2026-07-11T21:18:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 會先將傳出的 Markdown 轉換為共用的中介表示法
（IR），再轉譯為各頻道專用的輸出。IR 會保留純文字以及
樣式／連結範圍，因此一次剖析即可供所有頻道使用，且分塊絕不會
在範圍中途切斷格式。

## 處理流程

1. **將 Markdown 剖析為 IR**（`markdownToIR`）— 純文字加上樣式範圍
   （粗體、斜體、刪除線、程式碼、程式碼區塊、劇透、區塊引用、
   1–6 級標題）和連結範圍。偏移量採用 UTF-16 程式碼單位，因此 Signal 樣式
   範圍可直接與其 API 對齊。只有在頻道選用表格模式時，
   才會剖析表格。
2. **將 IR 分塊**（`chunkMarkdownIR`／`renderMarkdownIRChunksWithinLimit`）
   — 分割會在轉譯前針對 IR 文字進行，因此行內樣式和
   連結會依各區塊切分，而不會跨越邊界而中斷。
3. **依頻道轉譯**（`renderMarkdownWithMarkers`）— 樣式標記對照表
   會將範圍轉換為頻道的原生標記。

| 頻道                                                             | 轉譯器                                                                               | 備註                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn 詞元（`*bold*`、`_italic_`、`` `code` ``、程式碼圍欄）                       | 連結會變成 `<url\|label>`；剖析時停用自動連結，以免重複建立連結                         |
| Telegram                                                         | HTML 標籤（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`、`<tg-spoiler>`） | 啟用 `richMessages` 時，也支援豐富訊息表格和標題（`<h1>`–`<h6>`）                       |
| Signal                                                           | 純文字 + `text-style` 範圍                                                           | 當標籤與 URL 不同時，連結會轉譯為 `label (url)`                                          |
| Discord、WhatsApp、iMessage、Microsoft Teams 及其他頻道          | 純文字                                                                               | 不使用基於 IR 的樣式；Markdown 表格轉換仍會透過 `convertMarkdownTables` 執行             |

## IR 範例

輸入的 Markdown：
__OC_I18N_900000__
IR（示意）：
__OC_I18N_900001__
## 表格處理

`markdown.tables` 控制頻道如何轉換 Markdown 表格，可依
頻道設定，也可選擇依帳號設定：

| 模式      | 行為                                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | 在程式碼區塊內轉譯為對齊的 ASCII 表格（預設備援模式）                               |
| `bullets` | 將每一列轉換為 `label: value` 項目符號                                               |
| `block`   | 在傳輸層支援時保留原生表格；否則回退至 `code`                                       |
| `off`     | 停用表格剖析；原始表格文字不經變更直接傳遞                                           |

各頻道的外掛預設值：Signal、WhatsApp 和 Matrix 預設為
`bullets`；Mattermost 預設為 `off`；Telegram 預設為 `block`（除非
帳號已啟用 `richMessages`，否則會解析為 `code`）。任何
沒有明確外掛預設值的頻道都會回退至 `code`。
__OC_I18N_900002__
## 分塊規則

- 分塊限制來自頻道轉接器／設定，並套用至 IR 文字，而非
  轉譯後的輸出。
- 圍欄程式碼區塊會保留為單一區塊，並附帶結尾換行，讓
  頻道能正確轉譯結束圍欄。
- 清單和區塊引用前綴是 IR 文字的一部分，因此分塊絕不會
  在前綴中途切分。
- 行內樣式絕不會跨區塊切分；轉譯器會在下一個區塊開頭
  重新開啟尚未結束的樣式。

如需瞭解各頻道的分塊邊界和
傳遞行為，請參閱[串流與分塊](/concepts/streaming)。

## 連結政策

- **Slack：** `[label](url)` -> `<url|label>`；裸露 URL 會維持原樣。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 剖析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非標籤已經
  與 URL 相符。

## 劇透

Signal（對應至 `SPOILER`
樣式範圍）和 Telegram（對應至 `<tg-spoiler>`）會剖析劇透標記（`||spoiler||`）。其他頻道會將
`||...||` 視為純文字。

## 新增或更新頻道格式化器

1. 使用 `markdownToIR(...)` **剖析一次**，並傳入適合頻道的
   選項（`autolink`、`headingStyle`、`blockquotePrefix`、`tableMode`）。
2. 使用 `renderMarkdownWithMarkers(...)` 和樣式標記對照表進行**轉譯**（或
   為 Signal 等傳輸層使用自訂樣式範圍邏輯）。
3. 在轉譯每個區塊前，使用 `chunkMarkdownIR(...)` 或
   `renderMarkdownIRChunksWithinLimit(...)` 進行**分塊**。
4. **串接轉接器**，使其從
   傳出訊息的傳送路徑呼叫新的分塊器和轉譯器。
5. 使用格式測試進行**測試**；若頻道會分塊，另加傳出訊息的傳遞測試。

## 常見陷阱

- Slack 尖括號詞元（`<@U123>`、`<#C123>`、`<https://...>`）必須
  在跳脫處理後仍能保留；原始 HTML 仍須安全地進行跳脫處理。
- Telegram HTML 必須跳脫標籤外的文字，以免標記損壞。
- Signal 樣式範圍使用 UTF-16 偏移量，而非碼點偏移量。
- 保留圍欄程式碼區塊的結尾換行，讓結束標記
  能獨占一行。

## 相關內容

<CardGroup cols={2}>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    傳出串流行為、分塊邊界，以及各頻道專用的傳遞方式。
  </Card>
  <Card title="系統提示詞" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    對話開始前模型所看到的內容，包括注入的工作區檔案。
  </Card>
</CardGroup>
