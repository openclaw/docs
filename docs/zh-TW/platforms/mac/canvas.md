---
read_when:
    - 實作 macOS 畫布面板
    - 新增視覺工作區的代理控制項
    - 偵錯 WKWebView 畫布載入
summary: 由代理控制的畫布面板，透過 WKWebView + 自訂 URL 架構嵌入
title: 畫布
x-i18n:
    generated_at: "2026-04-30T03:20:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS app 會使用 `WKWebView` 內嵌由代理控制的**畫布面板**。它是一個輕量的視覺工作區，適用於 HTML/CSS/JS、A2UI，以及小型互動式 UI 介面。

## 畫布存放位置

畫布狀態儲存在 Application Support 底下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

畫布面板會透過**自訂 URL scheme**提供這些檔案：

- `openclaw-canvas://<session>/<path>`

範例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目錄沒有 `index.html`，app 會顯示**內建的腳手架頁面**。

## 面板行為

- 無邊框、可調整大小的面板，錨定在選單列附近（或滑鼠游標附近）。
- 依工作階段記住大小與位置。
- 本機畫布檔案變更時會自動重新載入。
- 同一時間只會顯示一個畫布面板（會視需要切換工作階段）。

可從設定 → **允許畫布**停用畫布。停用後，畫布節點命令會回傳 `CANVAS_DISABLED`。

## 代理 API 介面

畫布透過 **Gateway WebSocket**公開，因此代理可以：

- 顯示/隱藏面板
- 導覽至路徑或 URL
- 評估 JavaScript
- 擷取快照圖片

CLI 範例：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注意事項：

- `canvas.navigate` 接受**本機畫布路徑**、`http(s)` URL，以及 `file://` URL。
- 如果傳入 `"/"`，畫布會顯示本機腳手架或 `index.html`。

## 畫布中的 A2UI

A2UI 由 Gateway 畫布主機託管，並在畫布面板內轉譯。當 Gateway 宣告畫布主機時，macOS app 會在第一次開啟時自動導覽至 A2UI 主機頁面。

預設 A2UI 主機 URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

畫布目前接受 **A2UI v0.8** 伺服器→用戶端訊息：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

不支援 `createSurface`（v0.9）。

CLI 範例：

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速煙霧測試：

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## 從畫布觸發代理執行

畫布可以透過深層連結觸發新的代理執行：

- `openclaw://agent?...`

範例（在 JS 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

除非提供有效金鑰，否則 app 會提示確認。

## 安全性注意事項

- 畫布 scheme 會阻擋目錄遍歷；檔案必須位於工作階段根目錄底下。
- 本機畫布內容使用自訂 scheme（不需要 loopback 伺服器）。
- 外部 `http(s)` URL 只有在明確導覽時才允許。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [WebChat](/zh-TW/web/webchat)
