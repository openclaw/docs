---
read_when:
    - 你想要分析來自代理程式的 PDF
    - 你需要精確的 pdf 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取備援之間的差異
summary: 使用原生提供者支援與擷取備援分析一份或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-07-05T11:47:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一或多份 PDF 文件並傳回文字。它會在 Anthropic 和 Google 模型上使用原生文件輸入，並對其他所有供應商回退到文字/影像擷取。

## 可用性

只有在 OpenClaw 能為代理解析支援 PDF 的模型時，工具才會註冊。解析順序：

1. `agents.defaults.pdfModel`（明確的主要/備援）
2. `agents.defaults.imageModel`（明確的主要/備援）
3. 代理解析出的工作階段/預設模型，如果其供應商支援原生 PDF 輸入（Anthropic、Google），或已經有已設定的視覺模型
4. 自動偵測到且可用驗證的支援影像/視覺供應商，優先使用原生 PDF 供應商

每個備援候選項目在使用前都會檢查驗證，因此已設定的 `provider/model` 只有在 OpenClaw 能為該代理驗證該供應商時才算數。如果沒有解析出可用模型，`pdf` 工具不會公開。

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
頁面篩選器，例如 `1-5` 或 `1,3,7-9`。原生供應商模式不支援。
</ParamField>

<ParamField path="password" type="string">
加密 PDF 的密碼。套用於請求中的每個 PDF；只由擷取回退模式使用。
</ParamField>

<ParamField path="model" type="string">
選用的模型覆寫，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每份 PDF 的大小上限，單位為 MB。預設為 `agents.defaults.pdfMaxBytesMb`，若未設定則為 `10`。
</ParamField>

注意事項：

- `pdf` 和 `pdfs` 會在載入前合併並去除重複；至少需要其中一個。
- `pages` 會解析為以 1 為起始的頁碼、去重、排序，並限制在 `agents.defaults.pdfMaxPages`（預設 `20`）內。若範圍沒有符合任何界內頁面，會在模型呼叫前報錯。

## 支援的 PDF 參照

- 本機檔案路徑（包含 `~` 展開）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的傳入參照，例如 `media://inbound/<id>`

其他 URI 配置（例如 `ftp://`）會傳回 `details.error = "unsupported_pdf_reference"`。工具在沙盒中執行時，遠端 `http(s)` URL 會被拒絕。啟用僅限工作區的檔案政策時，允許根目錄外的本機路徑會被拒絕；受管理的傳入參照，以及 OpenClaw 傳入媒體儲存區下重播的路徑仍允許使用。

## 執行模式

### 原生供應商模式

用於供應商 `anthropic` 和 `google`（目前唯一宣告支援原生 PDF 文件的供應商）。原始 PDF 位元組會直接送到供應商 API，作為每個檔案的原生文件/內嵌 PDF 部分。

限制：

- 不支援 `pages`；如果已設定，工具會擲出 `pages is not supported with native PDF providers`。
- 不支援 `password`；如果已設定，工具會擲出 `password is not supported with native PDF providers`。加密 PDF 請使用非原生模型。

### 擷取回退模式

用於其他所有供應商。

1. 透過內建的 `document-extract` 外掛，從所選頁面擷取文字（最多 `agents.defaults.pdfMaxPages`，預設 `20`），該外掛使用 `clawpdf` 套件（PDFium WebAssembly）進行文字和影像擷取。
2. 如果擷取的文字少於 `200` 個字元，將相同頁面渲染為 PNG 影像。渲染預算為總共 `4,000,000` 像素，由所有需要影像的頁面共用（依剩餘頁面比例分配，而不是逐頁分配），因此已經有足夠文字的文字頁面會完全跳過渲染。
3. 將擷取的文字（以及任何已渲染影像）加上提示傳送給所選模型。

詳細資訊：

- 加密 PDF 會使用最上層的 `password` 參數開啟。
- 如果模型沒有影像輸入，且沒有可擷取文字，工具會報錯。
- 如果影像渲染失敗，OpenClaw 會丟棄影像並繼續使用擷取的文字。
- 如果目標模型僅支援文字，而擷取產生了影像，OpenClaw 會丟棄影像並只傳送文字。

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

| 金鑰                            | 預設    | 意義                                                                                      |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | 未設定  | 明確的主要/備援 PDF 模型；回退到 `imageModel`，再回退到工作階段模型。                    |
| `agents.defaults.pdfMaxBytesMb` | `10`    | 每份 PDF 的大小上限，單位為 MB。                                                         |
| `agents.defaults.pdfMaxPages`   | `20`    | 每份 PDF 處理的頁數上限。                                                                |

完整欄位詳細資訊請參閱[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 輸出詳細資訊

工具會在 `content[0].text` 中傳回文字，並在 `details` 中傳回結構化中繼資料。

常見 `details` 欄位：

- `model`：解析出的模型參照（`provider/model`）
- `native`：原生供應商模式為 `true`，回退模式為 `false`
- `attempts`：成功前失敗的備援嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多個 PDF 輸入：`details.pdfs[]`，含 `pdf` 項目
- 沙盒路徑重寫中繼資料（適用時）：`rewrittenFrom`

## 錯誤行為

| 條件                              | 結果                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| 沒有 PDF 輸入                     | 擲出 `pdf required: provide a path or URL to a PDF document`   |
| 超過 10 份 PDF                    | `details.error = "too_many_pdfs"`                              |
| 不支援的參照配置                  | `details.error = "unsupported_pdf_reference"`                  |
| 原生供應商搭配 `pages`            | 擲出 `pages is not supported with native PDF providers`        |
| 原生供應商搭配 `password`         | 擲出 `password is not supported with native PDF providers`     |

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

頁面篩選的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

使用擷取回退的加密 PDF：

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
