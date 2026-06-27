---
read_when:
    - 你想從代理分析 PDF
    - 你需要精確的 PDF 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取備援機制之間的差異
summary: 使用原生供應商支援與擷取備援分析一或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-06-27T20:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一個或多個 PDF 文件並傳回文字。

快速行為：

- Anthropic 和 Google 模型供應商使用原生供應商模式。
- 其他供應商使用擷取備援模式（先擷取文字，必要時再擷取頁面影像）。
- 支援單一（`pdf`）或多個（`pdfs`）輸入，每次呼叫最多 10 個 PDF。

## 可用性

只有在 OpenClaw 能為代理解析出支援 PDF 的模型設定時，才會註冊此工具：

1. `agents.defaults.pdfModel`
2. 備援至 `agents.defaults.imageModel`
3. 備援至代理解析出的工作階段／預設模型
4. 如果原生 PDF 供應商有驗證支援，會優先於一般影像備援候選項

如果無法解析出可用模型，則不會公開 `pdf` 工具。

可用性注意事項：

- 備援鏈會感知驗證狀態。已設定的 `provider/model` 只有在
  OpenClaw 實際上能為代理驗證該供應商時才算數。
- 目前的原生 PDF 供應商是 **Anthropic** 和 **Google**。
- 如果解析出的工作階段／預設供應商已設定視覺／PDF
  模型，PDF 工具會先重用該模型，再備援至其他有驗證支援的
  供應商。

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
頁面篩選器，例如 `1-5` 或 `1,3,7-9`。
</ParamField>

<ParamField path="password" type="string">
擷取備援模式中加密 PDF 的密碼。
</ParamField>

<ParamField path="model" type="string">
選用的模型覆寫，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每個 PDF 的大小上限，單位為 MB。預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。
</ParamField>

輸入注意事項：

- `pdf` 和 `pdfs` 會在載入前合併並去重。
- 如果未提供 PDF 輸入，工具會報錯。
- `pages` 會解析為從 1 開始的頁碼，並去重、排序，且限制在設定的最大頁數內。
- `password` 會套用到請求中的每個 PDF，且僅供擷取備援模式使用。
- `maxBytesMb` 預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支援的 PDF 參照

- 本機檔案路徑（包含 `~` 展開）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的傳入參照，例如 `media://inbound/<id>`

參照注意事項：

- 其他 URI 配置（例如 `ftp://`）會以 `unsupported_pdf_reference` 拒絕。
- 在沙盒模式中，遠端 `http(s)` URL 會被拒絕。
- 啟用僅限工作區的檔案政策時，允許根目錄外的本機檔案路徑會被拒絕。
- 在僅限工作區的檔案政策下，OpenClaw 傳入媒體儲存中的受管理傳入參照與重播路徑會被允許。

## 執行模式

### 原生供應商模式

供應商為 `anthropic` 和 `google` 時會使用原生模式。
此工具會將原始 PDF 位元組直接傳送給供應商 API。

原生模式限制：

- 不支援 `pages`。若設定此參數，工具會傳回錯誤。
- 不支援 `password`。請使用非原生模型分析加密 PDF。
- 支援多 PDF 輸入；每個 PDF 都會在提示前作為原生文件區塊／
  行內 PDF 部分傳送。

### 擷取備援模式

非原生供應商會使用備援模式。

流程：

1. 從選取頁面擷取文字（最多 `agents.defaults.pdfMaxPages`，預設 `20`）。
2. 如果擷取出的文字長度低於 `200` 個字元，則將選取頁面轉譯為 PNG 影像並包含它們。
3. 將擷取出的內容加上提示傳送給選取的模型。

備援詳細資訊：

- 頁面影像擷取使用 `4,000,000` 的像素預算。
- 加密 PDF 可使用頂層 `password` 參數開啟。
- 如果目標模型不支援影像輸入，且沒有可擷取文字，工具會報錯。
- 如果文字擷取成功，但影像擷取需要在
  純文字模型上使用視覺能力，OpenClaw 會捨棄轉譯影像，並繼續使用
  擷取出的文字。
- 擷取備援使用內建的 `document-extract` 外掛。該外掛擁有
  `clawpdf`，透過 PDFium
  WebAssembly 提供文字擷取與影像轉譯。

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

常見 `details` 欄位：

- `model`：解析出的模型參照（`provider/model`）
- `native`：原生供應商模式為 `true`，備援為 `false`
- `attempts`：成功前失敗的備援嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多個 PDF 輸入：`details.pdfs[]`，含 `pdf` 項目
- 沙盒路徑重寫中繼資料（適用時）：`rewrittenFrom`

## 錯誤行為

- 缺少 PDF 輸入：擲出 `pdf required: provide a path or URL to a PDF document`
- PDF 過多：在 `details.error = "too_many_pdfs"` 中傳回結構化錯誤
- 不支援的參照配置：傳回 `details.error = "unsupported_pdf_reference"`
- 原生模式搭配 `pages`：擲出明確的 `pages is not supported with native PDF providers` 錯誤

## 範例

單一 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

多個 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

頁面篩選的備援模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

使用擷取備援的加密 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 相關

- [工具概覽](/zh-TW/tools) - 所有可用的代理工具
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 和 pdfMaxPages 設定
