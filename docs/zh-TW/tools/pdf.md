---
read_when:
    - 您想分析來自代理程式的 PDF
    - 你需要確切的 PDF 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取備援機制
summary: 使用原生提供者支援與擷取備援來分析一份或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-04-30T03:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一份或多份 PDF 文件並傳回文字。

快速行為：

- Anthropic 和 Google 模型提供者使用原生提供者模式。
- 其他提供者使用擷取後備模式（先擷取文字，必要時再擷取頁面影像）。
- 支援單一（`pdf`）或多份（`pdfs`）輸入，每次呼叫最多 10 份 PDF。

## 可用性

此工具只會在 OpenClaw 能為代理程式解析支援 PDF 的模型設定時註冊：

1. `agents.defaults.pdfModel`
2. 後備至 `agents.defaults.imageModel`
3. 後備至代理程式解析後的工作階段／預設模型
4. 如果原生 PDF 提供者具備驗證支援，會優先使用它們，再使用一般影像後備候選項

如果無法解析可用模型，`pdf` 工具就不會公開。

可用性注意事項：

- 後備鏈會感知驗證狀態。設定的 `provider/model` 只有在
  OpenClaw 確實能為代理程式驗證該提供者時才會計入。
- 原生 PDF 提供者目前是 **Anthropic** 和 **Google**。
- 如果解析後的工作階段／預設提供者已經設定視覺／PDF
  模型，PDF 工具會先重用該模型，再後備至其他具備驗證支援的
  提供者。

## 輸入參考

<ParamField path="pdf" type="string">
一個 PDF 路徑或 URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
多個 PDF 路徑或 URL，總數最多 10 個。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析提示。
</ParamField>

<ParamField path="pages" type="string">
像 `1-5` 或 `1,3,7-9` 這樣的頁面篩選器。
</ParamField>

<ParamField path="model" type="string">
選用的模型覆寫，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每份 PDF 的大小上限，單位為 MB。預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。
</ParamField>

輸入注意事項：

- `pdf` 和 `pdfs` 會在載入前合併並去除重複。
- 如果未提供 PDF 輸入，工具會報錯。
- `pages` 會解析為從 1 開始的頁碼、去重、排序，並限制在設定的最大頁數內。
- `maxBytesMb` 預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支援的 PDF 參照

- 本機檔案路徑（包含 `~` 展開）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的傳入參照，例如 `media://inbound/<id>`

參照注意事項：

- 其他 URI scheme（例如 `ftp://`）會以 `unsupported_pdf_reference` 拒絕。
- 在沙箱模式中，遠端 `http(s)` URL 會被拒絕。
- 啟用僅限工作區的檔案政策時，允許根目錄之外的本機檔案路徑會被拒絕。
- 受管理的傳入參照，以及 OpenClaw 傳入媒體儲存區下的重播路徑，在僅限工作區的檔案政策下允許使用。

## 執行模式

### 原生提供者模式

提供者為 `anthropic` 和 `google` 時會使用原生模式。
工具會將原始 PDF 位元組直接傳送到提供者 API。

原生模式限制：

- 不支援 `pages`。如果設定此欄位，工具會傳回錯誤。
- 支援多份 PDF 輸入；每份 PDF 都會在提示之前以原生文件區塊／
  inline PDF 部分傳送。

### 擷取後備模式

非原生提供者會使用後備模式。

流程：

1. 從選取的頁面擷取文字（最多 `agents.defaults.pdfMaxPages`，預設為 `20`）。
2. 如果擷取文字長度少於 `200` 個字元，將選取頁面轉譯為 PNG 影像並納入。
3. 將擷取內容加上提示傳送到選取的模型。

後備詳細資訊：

- 頁面影像擷取使用 `4,000,000` 的像素預算。
- 如果目標模型不支援影像輸入，且沒有可擷取文字，工具會報錯。
- 如果文字擷取成功，但影像擷取會要求純文字模型具備視覺能力，
  OpenClaw 會捨棄轉譯影像，並繼續使用
  擷取的文字。
- 擷取後備使用內建的 `document-extract` Plugin。此 Plugin 擁有
  `pdfjs-dist`；`@napi-rs/canvas` 只會在影像轉譯後備
  可用時使用。

## 設定

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

完整欄位詳細資訊請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 輸出詳細資訊

工具會在 `content[0].text` 中傳回文字，並在 `details` 中傳回結構化中繼資料。

常見的 `details` 欄位：

- `model`：解析後的模型參照（`provider/model`）
- `native`：原生提供者模式為 `true`，後備模式為 `false`
- `attempts`：成功前失敗的後備嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多份 PDF 輸入：`details.pdfs[]`，包含 `pdf` 項目
- 沙箱路徑重寫中繼資料（適用時）：`rewrittenFrom`

## 錯誤行為

- 缺少 PDF 輸入：擲出 `pdf required: provide a path or URL to a PDF document`
- PDF 數量過多：在 `details.error = "too_many_pdfs"` 中傳回結構化錯誤
- 不支援的參照 scheme：傳回 `details.error = "unsupported_pdf_reference"`
- 原生模式搭配 `pages`：擲出明確的 `pages is not supported with native PDF providers` 錯誤

## 範例

單一 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

多份 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

使用頁面篩選的後備模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 相關

- [工具概覽](/zh-TW/tools) — 所有可用的代理程式工具
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — pdfMaxBytesMb 和 pdfMaxPages 設定
