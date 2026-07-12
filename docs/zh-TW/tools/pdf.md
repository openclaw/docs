---
read_when:
    - 您想要分析來自代理程式的 PDF 檔案
    - 你需要確切的 PDF 工具參數與限制
    - 你正在偵錯原生 PDF 模式與擷取備援機制的差異
summary: 使用原生供應商支援與擷取備援機制分析一份或多份 PDF 文件
title: PDF 工具
x-i18n:
    generated_at: "2026-07-11T21:52:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 會分析一或多份 PDF 文件並傳回文字。它在 Anthropic 與 Google 模型上使用原生文件輸入，對其他所有提供者則改用文字／影像擷取。

## 可用性

只有當 OpenClaw 能為代理解析出支援 PDF 的模型時，才會註冊此工具。解析順序如下：

1. `agents.defaults.pdfModel`（明確指定的主要模型／備援模型）
2. `agents.defaults.imageModel`（明確指定的主要模型／備援模型）
3. 代理解析出的工作階段／預設模型，前提是其提供者支援原生 PDF 輸入（Anthropic、Google），或已設定視覺模型
4. 自動偵測具有可用驗證資訊且支援影像／視覺的提供者，並優先選用原生支援 PDF 的提供者

每個備援候選模型在使用前都會檢查驗證資訊，因此只有當 OpenClaw 能針對該代理向提供者完成驗證時，已設定的 `provider/model` 才算有效。若無法解析出可用模型，就不會公開 `pdf` 工具。

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
頁面篩選條件，例如 `1-5` 或 `1,3,7-9`。原生提供者模式不支援此參數。
</ParamField>

<ParamField path="password" type="string">
加密 PDF 的密碼。套用至請求中的每份 PDF；僅供擷取備援模式使用。
</ParamField>

<ParamField path="model" type="string">
選用的模型覆寫值，格式為 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每份 PDF 的大小上限，單位為 MB。預設為 `agents.defaults.pdfMaxBytesMb`；若未設定則為 `10`。
</ParamField>

注意事項：

- 載入前會合併 `pdf` 與 `pdfs` 並移除重複項目；至少必須提供其中一項。
- `pages` 會解析為從 1 開始的頁碼，移除重複項目、排序，並限制在 `agents.defaults.pdfMaxPages`（預設為 `20`）以內。若範圍未匹配任何有效頁面，會在呼叫模型前發生錯誤。

## 支援的 PDF 參照

- 本機檔案路徑（包括 `~` 展開）
- `file://` URL
- `http://` 與 `https://` URL
- OpenClaw 管理的輸入參照，例如 `media://inbound/<id>`

其他 URI 配置（例如 `ftp://`）會傳回 `details.error = "unsupported_pdf_reference"`。當工具在沙箱中執行時，遠端 `http(s)` URL 會遭到拒絕。啟用僅限工作區的檔案政策後，不在允許根目錄內的本機路徑會遭到拒絕；OpenClaw 輸入媒體儲存區中的受管理輸入參照與重播路徑仍可使用。

## 執行模式

### 原生提供者模式

用於提供者 `anthropic` 與 `google`（目前只有這兩個提供者宣告支援原生 PDF 文件）。每份檔案的原始 PDF 位元組會以原生文件／內嵌 PDF 部分直接傳送至提供者 API。

限制：

- 不支援 `pages`；若設定此參數，工具會擲出 `pages is not supported with native PDF providers`。
- 不支援 `password`；若設定此參數，工具會擲出 `password is not supported with native PDF providers`。加密 PDF 請使用非原生模型。

### 擷取備援模式

用於其他所有提供者。

1. 透過內建的 `document-extract` 外掛，從選取的頁面（上限為 `agents.defaults.pdfMaxPages`，預設為 `20`）擷取文字。此插件使用 `clawpdf` 套件（PDFium WebAssembly）擷取文字與影像。
2. 若擷取出的文字少於 `200` 個字元，則將相同頁面轉譯為 PNG 影像。轉譯預算合計為 `4,000,000` 像素，由所有需要影像的頁面共用（依剩餘頁面比例分配，而非每頁各自計算）；因此，已有足夠文字的頁面會完全略過轉譯。
3. 將擷取出的文字（以及任何轉譯影像）連同提示詞傳送至選取的模型。

詳細資訊：

- 加密 PDF 使用頂層 `password` 參數開啟。
- 若模型不支援影像輸入，且沒有可擷取的文字，工具會發生錯誤。
- 若影像轉譯失敗，OpenClaw 會捨棄影像，並使用擷取出的文字繼續執行。
- 若目標模型僅支援文字，而擷取程序產生了影像，OpenClaw 會捨棄影像，只傳送文字。

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

| 鍵                              | 預設值   | 意義                                                                                     |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | 未設定   | 明確指定的主要／備援 PDF 模型；依序改用 `imageModel`，再改用工作階段模型。               |
| `agents.defaults.pdfMaxBytesMb` | `10`     | 每份 PDF 的大小上限，單位為 MB。                                                         |
| `agents.defaults.pdfMaxPages`   | `20`     | 每份 PDF 可處理的最大頁數。                                                              |

如需完整欄位詳細資訊，請參閱[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 輸出詳細資訊

工具會在 `content[0].text` 中傳回文字，並在 `details` 中傳回結構化中繼資料。

常見的 `details` 欄位：

- `model`：解析出的模型參照（`provider/model`）
- `native`：原生提供者模式為 `true`，備援模式為 `false`
- `attempts`：成功前失敗的備援嘗試

路徑欄位：

- 單一 PDF 輸入：`details.pdf`
- 多個 PDF 輸入：`details.pdfs[]`，其中包含 `pdf` 項目
- 沙箱路徑改寫中繼資料（若適用）：`rewrittenFrom`

## 錯誤行為

| 條件                              | 結果                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| 未提供 PDF 輸入                   | 擲出 `pdf required: provide a path or URL to a PDF document`   |
| 超過 10 份 PDF                    | `details.error = "too_many_pdfs"`                              |
| 不支援的參照配置                  | `details.error = "unsupported_pdf_reference"`                  |
| 對原生提供者使用 `pages`          | 擲出 `pages is not supported with native PDF providers`        |
| 對原生提供者使用 `password`       | 擲出 `password is not supported with native PDF providers`     |

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

依頁面篩選的備援模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

使用擷取備援模式處理加密 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 相關內容

- [工具概覽](/zh-TW/tools) - 所有可用的代理工具
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `pdfMaxBytesMb` 與 `pdfMaxPages` 設定
