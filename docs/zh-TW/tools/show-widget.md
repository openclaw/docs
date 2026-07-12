---
read_when:
    - 你希望代理程式在網頁聊天中呈現互動式結果
    - 你需要 `show_widget` 的輸入、安全性或保留期限合約
sidebarTitle: Show widget
summary: 在網頁聊天中直接顯示獨立運作的 SVG 或 HTML 小工具
title: 顯示小工具
x-i18n:
    generated_at: "2026-07-11T21:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` 會在控制介面的聊天逐字記錄中，以行內方式呈現獨立完整的 SVG 或 HTML 片段。隨附的 Canvas 外掛擁有此工具，並將每個結果託管為同源的 Canvas 文件。

只有當發起要求的閘道用戶端宣告 `inline-widgets` 能力時，此工具才可使用。控制介面會自動宣告這項能力。Telegram 和 WhatsApp 等頻道執行不會取得 `show_widget`。

能力傳輸涵蓋內嵌、Codex 應用程式伺服器及命令列介面支援的模型後端。透過授權驗證的 MCP 呼叫端與直接 HTTP 工具叫用端仍會採取失敗時拒絕的封閉策略，因為它們不會宣告用戶端能力。

## 使用工具

代理程式需提供兩個必要字串：

<ParamField path="title" type="string" required>
  與行內預覽一同顯示，並用於託管文件標題的簡短標題。
</ParamField>

<ParamField path="widget_code" type="string" required>
  獨立完整的 SVG 或 HTML 片段。去除前後空白後以 `<svg` 開頭的輸入會以 SVG 模式呈現；所有其他輸入都視為 HTML 片段。長度上限：262,144 個字元。
</ParamField>

工具結果包含 Canvas 預覽控制代碼，因此網頁聊天會直接從工具呼叫呈現小工具，並在重新載入歷史記錄後將其還原。無法呈現預覽的逐字記錄仍會顯示託管的 Canvas 路徑。

## 安全性與儲存空間

小工具文件採用嚴格的內容安全政策：允許行內樣式與指令碼、圖片可使用 `data:` URL，並封鎖外部擷取與資源載入。請將所有標記、樣式、指令碼與圖片資料都放在 `widget_code` 內。

即使控制介面的全域嵌入模式為 `trusted`，iframe 也一律省略 `allow-same-origin`，因此小工具指令碼無法讀取父應用程式的來源。Canvas 主機也會使用 `Content-Security-Policy: sandbox allow-scripts` 回應標頭提供小工具文件，因此即使直接開啟託管 URL，小工具仍會在不透明來源中執行，而非控制介面的來源。瀏覽器沙箱無法阻止指令碼導覽其自身的 iframe；請只呈現您願意在該隔離框架中執行的小工具程式碼。

iframe 也會遵循 [`gateway.controlUi.embedSandbox`](/zh-TW/web/control-ui#hosted-embeds)。預設的 `scripts` 層級支援互動式小工具，同時維持來源隔離。

Canvas 在每個工作階段中最多保留 32 個小工具（若沒有可用的工作階段，則以每個代理程式為範圍）。建立其他小工具時，會移除該範圍內最舊的文件。

## 相關內容

- [控制介面託管嵌入內容](/zh-TW/web/control-ui#hosted-embeds)
- [Canvas 外掛](/zh-TW/plugins/reference/canvas)
- [閘道通訊協定用戶端能力](/zh-TW/gateway/protocol#client-capabilities)
