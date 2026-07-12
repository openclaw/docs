---
read_when:
    - 實作 macOS Canvas 面板
    - 新增視覺工作區的代理程式控制項
    - 偵錯 WKWebView 畫布載入問題
summary: 透過 WKWebView + 自訂 URL 配置嵌入的代理程式控制 Canvas 面板
title: 畫布
x-i18n:
    generated_at: "2026-07-12T14:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS App 使用 `WKWebView` 內嵌由代理程式控制的 **Canvas 面板**，這是一個適用於 HTML/CSS/JS、A2UI 與小型互動式 UI 介面的輕量視覺工作區。

## Canvas 的位置

Canvas 狀態儲存在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板透過自訂 URL 配置 `openclaw-canvas://<session>/<path>` 提供這些檔案：

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

如果根目錄中沒有 `index.html`，App 會顯示內建的初始框架頁面。

## 面板行為

- 無邊框、可調整大小的面板，固定在選單列（或滑鼠游標）附近。
- 記住各工作階段的大小與位置。
- 本機 Canvas 檔案變更時自動重新載入。
- 一次只會顯示一個 Canvas 面板（視需要切換工作階段）。

你可以從 Settings -> **Allow Canvas** 停用 Canvas。停用後，Canvas 節點命令會傳回 `CANVAS_DISABLED`。

## 代理程式 API 介面

Canvas 透過閘道 WebSocket 公開，因此代理程式可以顯示或隱藏面板、導覽至路徑或 URL、執行 JavaScript，以及擷取快照影像：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` 接受本機 Canvas 路徑、`http(s)` URL 與 `file://` URL。傳入 `"/"` 會顯示本機初始框架或 `index.html`。

閘道託管且位於 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/` 下的目標，會透過節點工作階段目前具範圍限制的 Canvas URL 解析。App 會在導覽前重新整理這項短效能力；你不需要自行建構或複製能力 URL。

## Canvas 中的 A2UI

A2UI 由閘道 Canvas 主機託管，並在 Canvas 面板中算繪。當閘道公告 Canvas 主機時，macOS App 會在首次開啟時自動導覽至 A2UI 主機頁面。

公告的 URL 具有能力範圍限制，例如 `http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`。請將其視為暫時性認證資訊，而非穩定連結。

### A2UI 命令（v0.8）

Canvas 接受 A2UI v0.8 伺服器對用戶端訊息：`beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface`。目前尚不支援 `createSurface`（v0.9）。

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas（A2UI v0.8）"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"如果你能讀到這段文字，表示 A2UI 推送運作正常。"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速冒煙測試：

```bash
openclaw nodes canvas a2ui push --node <id> --text "來自 A2UI 的問候"
```

## 從 Canvas 觸發代理程式執行

Canvas 可以透過 `openclaw://agent?...` 深層連結觸發新的代理程式執行：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支援的查詢參數：

| 參數                       | 含義                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 預先填入的代理程式提示。                              |
| `sessionKey`               | 穩定的工作階段識別碼。                                |
| `thinking`                 | 選用的思考設定檔。                                    |
| `deliver`, `to`, `channel` | 傳送目標。                                            |
| `timeoutSeconds`           | 選用的執行逾時時間。                                  |
| `key`                      | App 為受信任本機呼叫端產生的安全權杖。                |

除非提供有效的金鑰，否則 App 會提示使用者確認。未含金鑰的連結會在核准前顯示訊息和 URL，並忽略傳送路由欄位；含金鑰的連結則使用正常的閘道執行路徑。

## 安全性注意事項

- Canvas 配置會封鎖目錄遍歷；檔案必須位於工作階段根目錄下。
- 本機 Canvas 內容使用自訂配置（不需要回送伺服器）。
- 只有在明確導覽時才允許外部 `http(s)` URL。
- 一般網頁僅供算繪。只有 App 擁有的 Canvas 配置，或 App 選取且能力範圍完全相符的閘道 A2UI 文件，才能接受代理程式動作；子框架、重新導向、過期能力及變更過的查詢都無法分派動作。

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [WebChat](/zh-TW/web/webchat)
