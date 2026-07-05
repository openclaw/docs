---
read_when:
    - 實作 macOS Canvas 面板
    - 新增視覺工作區的代理控制項
    - 偵錯 WKWebView canvas 載入
summary: 由代理控制的 Canvas 面板，透過 WKWebView + 自訂 URL scheme 嵌入
title: 畫布
x-i18n:
    generated_at: "2026-07-05T11:32:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a28ebad43f6135e199f1aa03e45aa92ad309d11348d5a47121b1418442b6fe17
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 應用程式會使用 `WKWebView` 嵌入由代理控制的 **Canvas 面板**，這是一個適用於 HTML/CSS/JS、A2UI 與小型互動式 UI 介面的輕量視覺工作區。

## Canvas 的位置

Canvas 狀態會儲存在 Application Support 底下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板會透過自訂 URL scheme 提供這些檔案：
`openclaw-canvas://<session>/<path>`：

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

如果根目錄沒有 `index.html`，應用程式會顯示內建的鷹架頁面。

## 面板行為

- 無邊框、可調整大小的面板，錨定在選單列附近（或滑鼠游標附近）。
- 依工作階段記住大小與位置。
- 本機 Canvas 檔案變更時自動重新載入。
- 一次只會顯示一個 Canvas 面板（視需要切換工作階段）。

Canvas 可從 Settings -> **Allow Canvas** 停用。停用時，Canvas 節點命令會回傳 `CANVAS_DISABLED`。

## 代理 API 介面

Canvas 透過閘道 WebSocket 暴露，因此代理可以顯示/隱藏面板、導覽至路徑或 URL、評估 JavaScript，並擷取快照影像：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` 接受本機 Canvas 路徑、`http(s)` URL 與 `file://` URL。傳入 `"/"` 會顯示本機鷹架或 `index.html`。

## Canvas 中的 A2UI

A2UI 由閘道 Canvas 主機託管，並在 Canvas 面板內呈現。當閘道公告 Canvas 主機時，macOS 應用程式會在首次開啟時自動導覽至 A2UI 主機頁面。

預設 A2UI 主機 URL：`http://<gateway-host>:18789/__openclaw__/a2ui/`

### A2UI 命令 (v0.8)

Canvas 接受 A2UI v0.8 伺服器到用戶端訊息：`beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface`。尚未支援 `createSurface` (v0.9)。

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

## 從 Canvas 觸發代理執行

Canvas 可以透過 `openclaw://agent?...` 深層連結觸發新的代理執行：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支援的查詢參數：

| 參數                       | 意義                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 預先填入的代理提示。                                  |
| `sessionKey`               | 穩定的工作階段識別碼。                                |
| `thinking`                 | 選用的思考設定檔。                                    |
| `deliver`, `to`, `channel` | 傳送目標。                                            |
| `timeoutSeconds`           | 選用的執行逾時。                                      |
| `key`                      | 應用程式為受信任本機呼叫端產生的安全權杖。            |

除非提供有效的金鑰，否則應用程式會要求確認。沒有金鑰的連結會在核准前顯示訊息與 URL，並忽略傳送路由欄位；有金鑰的連結會使用一般的閘道執行路徑。

## 安全注意事項

- Canvas scheme 會阻擋目錄遍歷；檔案必須位於工作階段根目錄底下。
- 本機 Canvas 內容使用自訂 scheme（不需要 loopback 伺服器）。
- 只有在明確導覽時，才允許外部 `http(s)` URL。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [WebChat](/zh-TW/web/webchat)
