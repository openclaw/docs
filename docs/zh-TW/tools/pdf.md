---
read_when:
    - 你想要分析來自代理程式的 PDF
    - 你需要確切的 PDF 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取備援機制的差異
summary: 使用原生提供者支援與擷取備援機制分析一份或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-07-22T10:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e0e5b897e1e122af4b2f6f9a3eaeb73f6e93af1051d306ad82539b258de90c49
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一份或多份 PDF 文件並傳回文字。它會在 Anthropic 和 Google 模型上使用原生文件輸入，並針對其他所有供應商改用文字／影像擷取備援方式。

## 可用性

只有在 OpenClaw 能為代理程式解析出支援 PDF 的模型時，才會註冊此工具。解析順序如下：

1. `agents.defaults.pdfModel`（明確指定的主要模型／備援模型）
2. `agents.defaults.imageModel`（明確指定的主要模型／備援模型）
3. 代理程式已解析的工作階段／預設模型，前提是其供應商支援原生 PDF 輸入（Anthropic、Google），或已設定視覺模型
4. 自動偵測具備可用驗證的影像／視覺功能供應商，並優先選用原生支援 PDF 的供應商

每個備援候選模型都會在使用前檢查驗證狀態，因此已設定的 `provider/model` 只有在 OpenClaw 能為該代理程式向此供應商完成驗證時才算有效。若無法解析出任何可用模型，則不會公開 `pdf` 工具。

## 輸入參考

<ParamField path="pdf" type="string">
一個 PDF 路徑或 URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
多個 PDF 路徑或 URL，合計最多 10 個。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析提示詞。
</ParamField>

<ParamField path="pages" type="string">
頁面篩選條件，例如 `1-5` 或 `1,3,7-9`。原生供應商模式不支援此功能。
</ParamField>

<ParamField path="password" type="string">
加密 PDF 的密碼。套用至請求中的每個 PDF；僅供擷取備援模式使用。
</ParamField>

<ParamField path="model" type="string">
選用的模型覆寫，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每個 PDF 的大小上限，單位為 MB。預設為 `agents.defaults.pdfMaxMb`；若未設定，則為 `10`。
</ParamField>

注意事項：

- `pdf` 和 `pdfs` 會在載入前合併並去除重複項目；至少需要提供其中一項。
- `pages` 會解析為從 1 開始的頁碼，接著去除重複項目、排序，並限制在 `agents.defaults.pdfMaxPages`（預設為 `20`）之內。若範圍未符合任何界限內的頁面，會在呼叫模型前發生錯誤。

## 支援的 PDF 參照

- 本機檔案路徑（包括 `~` 展開）
- `file://` URL
- `http://` 和 `https://` URL
- 由 OpenClaw 管理的傳入參照，例如 `media://inbound/<id>`

其他 URI 配置（例如 `ftp://`）會傳回 `details.error = "unsupported_pdf_reference"`。工具在沙箱中執行時，會拒絕遠端 `http(s)` URL。啟用僅限工作區的檔案政策時，會拒絕允許根目錄以外的本機路徑；仍允許受管理的傳入參照，以及 OpenClaw 傳入媒體儲存區下的重播路徑。

## 執行模式

### 原生供應商模式

用於供應商 `anthropic` 和 `google`（目前僅有這些供應商宣告支援原生 PDF 文件）。每個檔案的原始 PDF 位元組會以原生文件／內嵌 PDF 部分的形式，直接傳送至供應商 API。

限制：

- 不支援 `pages`；若已設定，工具會擲回 `pages is not supported with native PDF providers`。
- 不支援 `password`；若已設定，工具會擲回 `password is not supported with native PDF providers`。加密 PDF 請使用非原生模型。

### 擷取備援模式

用於其他所有供應商。

1. 透過內建的 `document-extract` 外掛，從選取的頁面（最多 `agents.defaults.pdfMaxPages` 頁，預設為 `20`）擷取文字。此插件使用 `clawpdf` 套件（PDFium WebAssembly）擷取文字和影像。
2. 若擷取的文字少於 `200` 個字元，則將相同頁面算繪為 PNG 影像。算繪預算合計為 `4,000,000` 像素，由所有需要影像的頁面共用（依剩餘頁面按比例分配，而非每頁各自計算），因此已具有足夠文字的文字頁面會完全略過算繪。
3. 將擷取的文字（以及任何算繪出的影像）連同提示詞傳送至選取的模型。

詳細資訊：

- 加密 PDF 會使用頂層 `password` 參數開啟。
- 若模型不支援影像輸入，且沒有可擷取的文字，工具會發生錯誤。
- 若影像算繪失敗，OpenClaw 會捨棄影像，並繼續使用擷取的文字。
- 若目標模型僅支援文字，而擷取作業產生了影像，OpenClaw 會捨棄影像並僅傳送文字。

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

| 鍵                            | 預設值 | 含義                                                                                      |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`    | 未設定  | 明確指定主要／備援 PDF 模型；依序回退至 `imageModel`，然後是工作階段模型。 |
| `agents.defaults.pdfMaxMb`    | `10`    | 每個 PDF 的大小上限，單位為 MB。                                                          |
| `agents.defaults.pdfMaxPages` | `20`    | 每個 PDF 最多處理的頁數。                                                                 |

如需完整欄位詳細資訊，請參閱[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 輸出詳細資訊

工具會在 `content[0].text` 中傳回文字，並在 `details` 中傳回結構化中繼資料。

常見的 `details` 欄位：

- `model`：已解析的模型參照（`provider/model`）
- `native`：原生供應商模式為 `true`，備援模式為 `false`
- `attempts`：成功前失敗的備援嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多個 PDF 輸入：`details.pdfs[]`，其中包含 `pdf` 項目
- 沙箱路徑重寫中繼資料（如適用）：`rewrittenFrom`

## 錯誤行為

| 條件                              | 結果                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| 未提供 PDF 輸入                   | 擲回 `pdf required: provide a path or URL to a PDF document` |
| 超過 10 個 PDF                    | `details.error = "too_many_pdfs"`                              |
| 不支援的參照配置                  | `details.error = "unsupported_pdf_reference"`                  |
| 對原生供應商使用 `pages`    | 擲回 `pages is not supported with native PDF providers`      |
| 對原生供應商使用 `password` | 擲回 `password is not supported with native PDF providers`   |

## 範例

單一 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "以 5 個重點摘要這份報告"
}
```

多個 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "比較這兩份文件中的風險與時程變更"
}
```

已篩選頁面的備援模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "僅擷取影響客戶的事件"
}
```

使用擷取備援的加密 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "摘要這份合約"
}
```

## 相關內容

- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 和 pdfMaxPages 設定
