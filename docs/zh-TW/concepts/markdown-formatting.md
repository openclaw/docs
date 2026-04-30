---
read_when:
    - 你正在變更對外傳送通道的 Markdown 格式或分塊
    - 你正在新增新的通道格式化器或樣式對應
    - 你正在偵錯各通道的格式設定回歸問題
summary: 傳出頻道的 Markdown 格式化管線
title: Markdown 格式設定
x-i18n:
    generated_at: "2026-04-30T02:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 會將輸出 Markdown 先轉換為共用的中介表示法 (IR)，再算繪成各通道專屬的輸出格式。IR 會保留來源文字原樣，同時攜帶樣式/連結範圍，讓分段與算繪在各通道之間保持一致。

## 目標

- **一致性：** 一次解析，多個算繪器。
- **安全分段：** 在算繪前分割文字，讓行內格式絕不會跨分段中斷。
- **符合通道：** 將同一份 IR 對應到 Slack mrkdwn、Telegram HTML，以及 Signal 樣式範圍，不需要重新解析 Markdown。

## 管線

1. **解析 Markdown -> IR**
   - IR 是純文字加上樣式範圍（粗體/斜體/刪除線/程式碼/劇透）與連結範圍。
   - 偏移量使用 UTF-16 code units，讓 Signal 樣式範圍與其 API 對齊。
   - 只有在通道選擇啟用表格轉換時，才會解析表格。
2. **分段 IR（格式優先）**
   - 分段會在算繪前針對 IR 文字進行。
   - 行內格式不會跨分段切開；範圍會依每個分段切片。
3. **依通道算繪**
   - **Slack：** mrkdwn token（粗體/斜體/刪除線/程式碼），連結為 `<url|label>`。
   - **Telegram：** HTML 標籤（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 純文字 + `text-style` 範圍；標籤不同時，連結會變成 `label (url)`。

## IR 範例

輸入 Markdown：

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 和 Signal 輸出配接器會從 IR 算繪。
- 其他通道（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用純文字或
  各自的格式規則；啟用時，會在分段前套用 Markdown 表格轉換。

## 表格處理

Markdown 表格在各聊天用戶端之間並未受到一致支援。使用
`markdown.tables` 來控制每個通道（以及每個帳號）的轉換。

- `code`：將表格算繪為程式碼區塊（大多數通道的預設值）。
- `bullets`：將每一列轉換為項目符號（Signal + WhatsApp 的預設值）。
- `off`：停用表格解析與轉換；原始表格文字會直接傳遞。

設定鍵：

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 分段規則

- 分段限制來自通道配接器/設定，並套用到 IR 文字。
- 程式碼圍欄會以單一區塊保留，並帶有結尾換行，讓通道能正確算繪。
- 清單前綴與引用區塊前綴是 IR 文字的一部分，因此分段不會在前綴中途切開。
- 行內樣式（粗體/斜體/刪除線/行內程式碼/劇透）絕不會跨分段切開；
  算繪器會在每個分段內重新開啟樣式。

如果你需要更多關於跨通道分段行為的資訊，請參閱
[串流 + 分段](/zh-TW/concepts/streaming)。

## 連結政策

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 會保持裸露。解析期間會停用 Autolink，以避免重複連結。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非標籤與 URL 相符。

## 劇透

劇透標記（`||spoiler||`）只會為 Signal 解析，並對應到
SPOILER 樣式範圍。其他通道會將它們視為純文字。

## 如何新增或更新通道格式化器

1. **解析一次：** 使用共用的 `markdownToIR(...)` 輔助函式，搭配適合通道的選項（autolink、標題樣式、引用區塊前綴）。
2. **算繪：** 使用 `renderMarkdownWithMarkers(...)` 和樣式標記對應（或 Signal 樣式範圍）實作算繪器。
3. **分段：** 在算繪前呼叫 `chunkMarkdownIR(...)`；算繪每個分段。
4. **接上配接器：** 更新通道輸出配接器，使用新的分段器與算繪器。
5. **測試：** 新增或更新格式測試；如果通道使用分段，也新增或更新輸出遞送測試。

## 常見陷阱

- Slack 角括號 token（`<@U123>`、`<#C123>`、`<https://...>`）必須保留；安全地逸出原始 HTML。
- Telegram HTML 需要逸出標籤外的文字，以避免標記損壞。
- Signal 樣式範圍取決於 UTF-16 偏移量；不要使用 code point 偏移量。
- 保留圍欄程式碼區塊的結尾換行，讓結束標記落在自己的行上。

## 相關

- [串流與分段](/zh-TW/concepts/streaming)
- [系統提示](/zh-TW/concepts/system-prompt)
