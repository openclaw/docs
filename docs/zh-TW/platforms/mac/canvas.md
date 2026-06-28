---
read_when:
    - 實作 macOS Canvas 面板
    - 新增視覺工作區的代理控制項
    - 偵錯 WKWebView 畫布載入
summary: 透過 WKWebView + 自訂 URL scheme 嵌入的代理程式控制畫布面板
title: 畫布
x-i18n:
    generated_at: "2026-06-28T00:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 應用程式使用 `WKWebView` 內嵌由代理控制的 **Canvas 面板**。它是用於 HTML/CSS/JS、A2UI，以及小型互動式 UI 介面的輕量視覺工作區。

## Canvas 所在位置

Canvas 狀態儲存在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板透過 **自訂 URL scheme** 提供這些檔案：

- `openclaw-canvas://<session>/<path>`

範例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目錄沒有 `index.html`，應用程式會顯示 **內建 scaffold 頁面**。

## 面板行為

- 無邊框、可調整大小的面板，錨定在選單列附近（或滑鼠游標附近）。
- 依工作階段記住大小/位置。
- 本機 canvas 檔案變更時會自動重新載入。
- 同一時間只會顯示一個 Canvas 面板（會視需要切換工作階段）。

可從 Settings → **Allow Canvas** 停用 Canvas。停用時，canvas 節點命令會回傳 `CANVAS_DISABLED`。

## 代理 API 介面

Canvas 透過 **閘道 WebSocket** 暴露，因此代理可以：

- 顯示/隱藏面板
- 導覽至路徑或 URL
- 評估 JavaScript
- 擷取快照影像

命令列介面範例：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注意事項：

- `canvas.navigate` 接受 **本機 canvas 路徑**、`http(s)` URL，以及 `file://` URL。
- 如果傳入 `"/"`，Canvas 會顯示本機 scaffold 或 `index.html`。

## Canvas 中的 A2UI

A2UI 由閘道 canvas host 託管，並在 Canvas 面板內轉譯。
當閘道公告 Canvas host 時，macOS 應用程式會在第一次開啟時自動導覽至
A2UI host 頁面。

預設 A2UI host URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令 (v0.8)

Canvas 目前接受 **A2UI v0.8** 伺服器→用戶端訊息：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

不支援 `createSurface` (v0.9)。

命令列介面範例：

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速冒煙測試：

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## 從 Canvas 觸發代理執行

Canvas 可以透過深層連結觸發新的代理執行：

- `openclaw://agent?...`

範例（於 JS 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支援的查詢參數：

- `message`：預先填入的代理提示。
- `sessionKey`：穩定的工作階段識別碼。
- `thinking`：選用的思考設定檔。
- `deliver`、`to` 或 `channel`：傳遞目標。
- `timeoutSeconds`：選用的執行逾時。
- `key`：應用程式為受信任本機呼叫端產生的安全權杖。

除非提供有效的 key，否則應用程式會提示確認。未帶 key 的連結
會在核准前顯示訊息與 URL，並忽略傳遞路由欄位；
帶 key 的連結會使用一般閘道執行路徑。

## 安全性注意事項

- Canvas scheme 會封鎖目錄穿越；檔案必須位於工作階段根目錄下。
- 本機 Canvas 內容使用自訂 scheme（不需要迴路伺服器）。
- 外部 `http(s)` URL 只有在明確導覽時才允許。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [WebChat](/zh-TW/web/webchat)
