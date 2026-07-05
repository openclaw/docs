---
read_when:
    - 你正在變更外送通道的 Markdown 格式或分塊處理
    - 你正在新增通道格式化器或樣式對應
    - 你正在偵錯各通道的格式化回歸
summary: 對外傳送頻道的 Markdown 格式化管線
title: Markdown 格式
x-i18n:
    generated_at: "2026-07-05T11:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 會先將輸出 Markdown 轉換成共用的中介表示
(IR)，再轉譯為各頻道專用輸出。IR 會保留純文字以及
樣式/連結 span，因此一次解析步驟即可供所有頻道使用，且分段永遠不會
在 span 中途拆開格式。

## 管線

1. **將 Markdown 解析為 IR** (`markdownToIR`) - 純文字加上樣式 span
   （粗體、斜體、刪除線、程式碼、程式碼區塊、劇透、引用區塊、
   標題 1-6）與連結 span。偏移量使用 UTF-16 code units，因此 Signal 樣式
   範圍可直接與其 API 對齊。只有在頻道選擇表格模式時，才會解析表格。
2. **分段 IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - 拆分會在轉譯前對 IR 文字進行，因此行內樣式與
     連結會依每個分段切片，而不是跨越邊界而斷裂。
3. **依頻道轉譯** (`renderMarkdownWithMarkers`) - 樣式標記對應表
   會將 span 轉成該頻道的原生標記。

| 頻道                                                          | 轉譯器                                                                             | 備註                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn 權杖 (`*bold*`, `_italic_`, `` `code` ``, code fences)                      | 連結會變成 `<url\|label>`；解析期間停用自動連結以避免重複連結      |
| Telegram                                                         | HTML 標籤 (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | `richMessages` 開啟時，也支援富訊息表格與標題 (`<h1>`-`<h6>`) |
| Signal                                                           | 純文字 + `text-style` 範圍                                                     | 當標籤與 URL 不同時，連結會轉譯為 `label (url)`                        |
| Discord、WhatsApp、iMessage、Microsoft Teams 與其他頻道 | 純文字                                                                           | 無 IR 型樣式；Markdown 表格轉換仍會透過 `convertMarkdownTables` 執行    |

## IR 範例

輸入 Markdown：
__OC_I18N_900000__
IR（示意）：
__OC_I18N_900001__
## 表格處理

`markdown.tables` 控制頻道如何轉換 Markdown 表格，可依
頻道設定，也可選擇性地依帳號設定：

| 模式      | 行為                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | 在程式碼區塊內轉譯為對齊的 ASCII 表格（備援預設值）              |
| `bullets` | 將每一列轉換成 `label: value` 項目符號                                   |
| `block`   | 在傳輸支援時保留原生表格；否則退回 `code` |
| `off`     | 停用表格解析；原始表格文字會原樣傳遞                       |

各頻道外掛預設值：Signal、WhatsApp 與 Matrix 預設為
`bullets`；Mattermost 預設為 `off`；Telegram 預設為 `block`（除非
帳號已啟用 `richMessages`，否則會解析為 `code`）。任何沒有明確
外掛預設值的頻道都會退回 `code`。
__OC_I18N_900002__
## 分段規則

- 分段限制來自頻道配接器/設定，並套用於 IR 文字，而不是
  轉譯後的輸出。
- 圍欄程式碼區塊會保留為單一區塊並帶有結尾換行，讓
  頻道能正確轉譯結束圍欄。
- 清單與引用區塊前綴是 IR 文字的一部分，因此分段永遠不會
  在前綴中途拆開。
- 行內樣式永遠不會跨分段拆開；轉譯器會在下一個分段開頭
  重新開啟已開啟的樣式。

請參閱[串流與分段](/concepts/streaming)，了解跨頻道的分段邊界與
傳遞行為。

## 連結政策

- **Slack:** `[label](url)` -> `<url|label>`；裸 URL 會保持裸 URL。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal:** `[label](url)` -> `label (url)`，除非標籤已經
  符合 URL。

## 劇透

劇透標記 (`||spoiler||`) 會為 Signal（對應到 `SPOILER`
樣式範圍）與 Telegram（對應到 `<tg-spoiler>`）解析。其他頻道會將
`||...||` 視為純文字。

## 新增或更新頻道格式化器

1. **解析一次**，使用 `markdownToIR(...)`，並傳入適合頻道的
   選項 (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`)。
2. **轉譯**，使用 `renderMarkdownWithMarkers(...)` 與樣式標記對應表（或
   針對 Signal 這類傳輸使用自訂樣式範圍邏輯）。
3. **分段**，在轉譯每個分段前使用 `chunkMarkdownIR(...)` 或
   `renderMarkdownIRChunksWithinLimit(...)`。
4. **接線配接器**，從輸出傳送路徑呼叫新的分段器與轉譯器。
5. **測試**，使用格式測試；若頻道會分段，則另加輸出傳遞測試。

## 常見陷阱

- Slack 角括號權杖 (`<@U123>`, `<#C123>`, `<https://...>`) 必須
  在跳脫後保留下來；原始 HTML 仍需安全地跳脫。
- Telegram HTML 需要跳脫標籤外的文字，以避免標記損壞。
- Signal 樣式範圍使用 UTF-16 偏移量，而不是 code point 偏移量。
- 保留圍欄程式碼區塊的結尾換行，讓結束標記
  落在自己的行上。

## 相關內容

<CardGroup cols={2}>
  <Card title="Streaming and chunking" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、分段邊界，以及頻道專用傳遞。
  </Card>
  <Card title="System prompt" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    模型在對話前會看到的內容，包括注入的工作區檔案。
  </Card>
</CardGroup>
