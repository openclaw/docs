---
read_when:
    - 你想要讓代理程式分析 PDF
    - 你需要確切的 PDF 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取後備機制
summary: 透過原生提供者支援與擷取備援來分析一或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-05-06T02:59:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一個或多個 PDF 文件並傳回文字。

快速行為：

- Anthropic 和 Google 模型供應商使用原生供應商模式。
- 其他供應商使用擷取後備模式（先擷取文字，必要時再擷取頁面影像）。
- 支援單一（`pdf`）或多個（`pdfs`）輸入，每次呼叫最多 10 個 PDF。

## 可用性

只有當 OpenClaw 可以為代理解析支援 PDF 的模型設定時，才會註冊此工具：

1. `agents.defaults.pdfModel`
2. 後備至 `agents.defaults.imageModel`
3. 後備至代理已解析的工作階段/預設模型
4. 如果原生 PDF 供應商由驗證支援，會優先於通用影像後備候選項目

如果無法解析可用模型，則不會公開 `pdf` 工具。

可用性注意事項：

- 後備鏈會感知驗證狀態。設定的 `provider/model` 只有在
  OpenClaw 確實能為代理驗證該供應商時才會計入。
- 原生 PDF 供應商目前是 **Anthropic** 和 **Google**。
- 如果已解析的工作階段/預設供應商已有設定好的視覺/PDF
  模型，PDF 工具會先重用該模型，再後備至其他由驗證支援的
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

<ParamField path="model" type="string">
選用的模型覆寫，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每個 PDF 的大小上限，以 MB 為單位。預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。
</ParamField>

輸入注意事項：

- `pdf` 和 `pdfs` 會在載入前合併並去重。
- 如果未提供 PDF 輸入，工具會報錯。
- `pages` 會解析為以 1 為起始的頁碼、去重、排序，並限制在設定的最大頁數內。
- `maxBytesMb` 預設為 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支援的 PDF 參照

- 本機檔案路徑（包含 `~` 展開）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的傳入參照，例如 `media://inbound/<id>`

參照注意事項：

- 其他 URI 配置（例如 `ftp://`）會被拒絕，並傳回 `unsupported_pdf_reference`。
- 在沙箱模式中，遠端 `http(s)` URL 會被拒絕。
- 啟用僅限工作區的檔案政策時，允許根目錄之外的本機檔案路徑會被拒絕。
- OpenClaw 傳入媒體儲存區底下的受管理傳入參照和重放路徑，會在僅限工作區的檔案政策下被允許。

## 執行模式

### 原生供應商模式

供應商 `anthropic` 和 `google` 會使用原生模式。
工具會將原始 PDF 位元組直接傳送到供應商 API。

原生模式限制：

- 不支援 `pages`。如果設定，工具會傳回錯誤。
- 支援多 PDF 輸入；每個 PDF 會在提示前作為原生文件區塊 /
  行內 PDF 部分送出。

### 擷取後備模式

非原生供應商會使用後備模式。

流程：

1. 從所選頁面擷取文字（最多 `agents.defaults.pdfMaxPages`，預設 `20`）。
2. 如果擷取的文字長度少於 `200` 個字元，將所選頁面轉譯為 PNG 影像並包含它們。
3. 將擷取的內容加上提示傳送到所選模型。

後備詳細資訊：

- 頁面影像擷取使用 `4,000,000` 的像素預算。
- 如果目標模型不支援影像輸入，且沒有可擷取的文字，工具會報錯。
- 如果文字擷取成功，但影像擷取會要求純文字模型具備視覺能力，
  OpenClaw 會捨棄已轉譯的影像，並繼續使用擷取出的
  文字。
- 擷取後備會使用內建的 `document-extract` Plugin。該 Plugin 擁有
  `pdfjs-dist`；只有在可用影像轉譯後備時，才會使用
  `@napi-rs/canvas`。

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

工具會在 `content[0].text` 傳回文字，並在 `details` 傳回結構化中繼資料。

常見的 `details` 欄位：

- `model`：已解析的模型參照（`provider/model`）
- `native`：原生供應商模式為 `true`，後備模式為 `false`
- `attempts`：成功前失敗的後備嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多個 PDF 輸入：`details.pdfs[]`，其中包含 `pdf` 項目
- 沙箱路徑重寫中繼資料（適用時）：`rewrittenFrom`

## 錯誤行為

- 缺少 PDF 輸入：擲出 `pdf required: provide a path or URL to a PDF document`
- PDF 數量過多：在 `details.error = "too_many_pdfs"` 中傳回結構化錯誤
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

頁面篩選的後備模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 相關

- [工具概覽](/zh-TW/tools) - 所有可用的代理工具
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 和 pdfMaxPages 設定
