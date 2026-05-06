---
read_when:
    - 你正在變更傳出通道的 Markdown 格式或分塊方式
    - 你正在新增新的頻道格式化器或樣式對應
    - 你正在偵錯跨通道的格式化回歸問題
summary: 傳出通道的 Markdown 格式化管線
title: Markdown 格式設定
x-i18n:
    generated_at: "2026-05-06T02:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 會先將傳出的 Markdown 轉換為共用的中介表示法（IR），再呈現為各通道專用的輸出。IR 會保留來源文字不變，同時帶有樣式/連結 span，讓分段與呈現能在各通道間保持一致。

## 目標

- **一致性：** 一次解析步驟，多個呈現器。
- **安全分段：** 在呈現前先分割文字，讓行內格式絕不會跨分段中斷。
- **符合通道：** 將相同的 IR 對應到 Slack mrkdwn、Telegram HTML 與 Signal 樣式範圍，而不需要重新解析 Markdown。

## 管線

1. **解析 Markdown -> IR**
   - IR 是純文字加上樣式 span（bold/italic/strike/code/spoiler）與連結 span。
   - 偏移量是 UTF-16 code units，讓 Signal 樣式範圍能與其 API 對齊。
   - 表格只會在通道選擇加入表格轉換時解析。
2. **分段 IR（格式優先）**
   - 分段會在呈現前發生於 IR 文字上。
   - 行內格式不會跨分段切開；span 會依每個分段切片。
3. **依通道呈現**
   - **Slack：** mrkdwn token（bold/italic/strike/code），連結為 `<url|label>`。
   - **Telegram：** HTML 標籤（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 純文字 + `text-style` 範圍；當標籤不同時，連結會變成 `label (url)`。

## IR 範例

輸入 Markdown：

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 與 Signal 傳出配接器會從 IR 呈現。
- 其他通道（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用純文字或
  它們自己的格式規則，並在啟用時於分段前套用 Markdown 表格轉換。

## 表格處理

Markdown 表格在各聊天用戶端中的支援並不一致。使用
`markdown.tables` 控制每個通道（以及每個帳號）的轉換。

- `code`：將表格呈現為程式碼區塊（多數通道的預設值）。
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
- 程式碼圍欄會保留為單一區塊，並帶有結尾換行，讓通道能正確呈現。
- 清單前綴與引用區塊前綴是 IR 文字的一部分，因此分段不會在前綴中間切開。
- 行內樣式（bold/italic/strike/inline-code/spoiler）絕不會跨
  分段切開；呈現器會在每個分段內重新開啟樣式。

如果你需要更多關於跨通道分段行為的資訊，請參閱
[串流 + 分段](/zh-TW/concepts/streaming)。

## 連結政策

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 會保持裸露。解析期間會停用 autolink
  以避免重複連結。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非標籤符合 URL。

## 劇透

劇透標記（`||spoiler||`）只會為 Signal 解析，並在那裡對應到
SPOILER 樣式範圍。其他通道會將其視為純文字。

## 如何新增或更新通道格式器

1. **解析一次：** 使用共用的 `markdownToIR(...)` 輔助工具，並搭配通道適用的
   選項（autolink、標題樣式、引用區塊前綴）。
2. **呈現：** 使用 `renderMarkdownWithMarkers(...)` 與
   樣式標記對應（或 Signal 樣式範圍）實作呈現器。
3. **分段：** 在呈現前呼叫 `chunkMarkdownIR(...)`；呈現每個分段。
4. **串接配接器：** 更新通道傳出配接器，讓它使用新的分段器
   與呈現器。
5. **測試：** 新增或更新格式測試；如果通道使用分段，則新增或更新傳出交付測試。

## 常見陷阱

- Slack 角括號 token（`<@U123>`、`<#C123>`、`<https://...>`）必須保留；請安全地逸出原始 HTML。
- Telegram HTML 需要逸出標籤外的文字，以避免標記損壞。
- Signal 樣式範圍取決於 UTF-16 偏移量；不要使用 code point 偏移量。
- 保留 fenced code blocks 的結尾換行，讓結束標記落在
  自己的行上。

## 相關

<CardGroup cols={2}>
  <Card title="串流與分段" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    傳出串流行為、分段邊界，以及通道專用交付。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    模型在對話前會看到的內容，包括注入的工作區檔案。
  </Card>
</CardGroup>
