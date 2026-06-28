---
read_when:
    - 你正在變更傳出通道的 Markdown 格式設定或分塊方式
    - 你正在新增頻道格式化器或樣式對應
    - 你正在偵錯跨通道的格式化回歸問題
summary: 適用於傳出通道的 Markdown 格式化管線
title: Markdown 格式設定
x-i18n:
    generated_at: "2026-05-12T12:50:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 會先將輸出 Markdown 轉換為共享的中介表示法
（IR），再渲染成各頻道專用的輸出。IR 會保持
來源文字完整，同時攜帶樣式/連結範圍，讓分塊與渲染能在
各頻道之間保持一致。

## 目標

- **一致性：** 一次解析，多個渲染器。
- **安全分塊：** 在渲染前先分割文字，讓行內格式永遠不會
  跨分塊斷裂。
- **符合頻道：** 將相同 IR 對應到 Slack mrkdwn、Telegram HTML，以及 Signal
  樣式範圍，不需要重新解析 Markdown。

## 管線

1. **解析 Markdown -> IR**
   - IR 是純文字加上樣式範圍（粗體/斜體/刪除線/程式碼/spoiler）與連結範圍。
   - 偏移量使用 UTF-16 code units，讓 Signal 樣式範圍能與其 API 對齊。
   - 表格只會在頻道選擇加入表格轉換時解析。
2. **分塊 IR（格式優先）**
   - 分塊會在渲染前於 IR 文字上進行。
   - 行內格式不會跨分塊切分；範圍會依每個分塊切片。
3. **依頻道渲染**
   - **Slack：** mrkdwn token（粗體/斜體/刪除線/程式碼），連結為 `<url|label>`。
   - **Telegram：** HTML 標籤（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 純文字 + `text-style` 範圍；標籤不同時，連結會變成 `label (url)`。

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

- Slack、Telegram 與 Signal 輸出轉接器會從 IR 渲染。
- 其他頻道（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用純文字或
  自身的格式規則，並在啟用時於
  分塊前套用 Markdown 表格轉換。

## 表格處理

各聊天用戶端對 Markdown 表格的支援並不一致。使用
`markdown.tables` 控制各頻道（以及各帳號）的轉換。

- `code`：將表格渲染為程式碼區塊（多數頻道的預設值）。
- `bullets`：將每一列轉換為項目符號（Matrix、Signal 與 WhatsApp 的預設值）。
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

## 分塊規則

- 分塊限制來自頻道轉接器/設定，並套用至 IR 文字。
- 程式碼圍欄會保留為單一區塊，並帶有尾端換行，讓頻道
  能正確渲染。
- 清單前綴與引用區塊前綴是 IR 文字的一部分，因此分塊
  不會在前綴中途切開。
- 行內樣式（粗體/斜體/刪除線/行內程式碼/spoiler）永遠不會跨
  分塊切分；渲染器會在每個分塊內重新開啟樣式。

若需要更多跨頻道分塊行為資訊，請參閱
[串流 + 分塊](/zh-TW/concepts/streaming)。

## 連結政策

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 會保持裸 URL。解析期間
  會停用自動連結，以避免重複連結。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非標籤符合 URL。

## Spoilers

Spoiler 標記（`||spoiler||`）只會為 Signal 解析，在該頻道會對應到
SPOILER 樣式範圍。其他頻道會將它們視為純文字。

## 如何新增或更新頻道格式化器

1. **解析一次：** 使用共享的 `markdownToIR(...)` 輔助函式，並搭配適合頻道的
   選項（自動連結、標題樣式、引用區塊前綴）。
2. **渲染：** 使用 `renderMarkdownWithMarkers(...)` 與
   樣式標記對應表（或 Signal 樣式範圍）實作渲染器。
3. **分塊：** 在渲染前呼叫 `chunkMarkdownIR(...)`；渲染每個分塊。
4. **接線轉接器：** 更新頻道輸出轉接器，以使用新的分塊器
   與渲染器。
5. **測試：** 如果該頻道使用分塊，新增或更新格式測試與
   輸出傳遞測試。

## 常見陷阱

- Slack 角括號 token（`<@U123>`、`<#C123>`、`<https://...>`）必須
  保留；請安全地逸出原始 HTML。
- Telegram HTML 需要逸出標籤外的文字，以避免標記破損。
- Signal 樣式範圍取決於 UTF-16 偏移量；不要使用 code point 偏移量。
- 為圍欄式程式碼區塊保留尾端換行，讓結尾標記位於
  自己的行上。

## 相關

<CardGroup cols={2}>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、分塊邊界，以及頻道專用傳遞。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    模型在對話前看到的內容，包括注入的工作區檔案。
  </Card>
</CardGroup>
