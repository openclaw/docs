---
read_when:
    - 實作 macOS Canvas 面板
    - 新增視覺工作區的代理程式控制功能
    - 偵錯 WKWebView 畫布載入問題
summary: 透過 WKWebView + 自訂 URL 配置內嵌、由代理程式控制的 Canvas 面板
title: 畫布
x-i18n:
    generated_at: "2026-07-19T13:49:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56532246bc06601aa753a59f85f33bfa8d6599deecade591a03972e8b9b16fc2
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

如果根目錄中不存在 `index.html`，App 會顯示內建的鷹架頁面。

## 面板行為

- 無邊框、可調整大小的面板，固定在選單列（或滑鼠游標）附近。
- 顯示 Canvas 不會切換 App 或搶走鍵盤焦點。
- 記住每個工作階段的大小與位置。
- 本機 Canvas 檔案變更時自動重新載入。
- 一次只會顯示一個 Canvas 面板（視需要切換工作階段）。

你可以從 Settings -> **Allow Canvas** 停用 Canvas。停用後，Canvas 節點命令會傳回 `CANVAS_DISABLED`。

## 代理程式 API 介面

Canvas 透過閘道 WebSocket 公開，因此代理程式可以顯示或隱藏面板、導覽至路徑或 URL、評估 JavaScript，以及擷取快照影像：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`eval` 與 `a2ui.*` 會更新內容，而不開啟或顯示面板。只有 `present`、`navigate` 或使用者動作會顯示面板；隱藏後，內容更新仍會繼續套用至隱藏的面板。`snapshot` 需要面板處於顯示狀態，否則會傳回 `CANVAS_HIDDEN`；請先執行 `present`。

`canvas.navigate` 接受本機 Canvas 路徑、`http(s)` URL 與 `file://` URL。傳入 `"/"` 會顯示本機鷹架或 `index.html`。

`/__openclaw__/canvas/` 與 `/__openclaw__/a2ui/` 下由閘道託管的目標，會透過節點工作階段目前具範圍限制的 Canvas URL 解析。App 會在導覽前重新整理該短期有效的能力；你不需要自行建構或複製能力 URL。

## Canvas 中的 A2UI

A2UI 由閘道 Canvas 主機託管，並在 Canvas 面板中呈現。閘道公告 Canvas 主機時，macOS App 會在首次開啟時自動導覽至 A2UI 主機頁面。

公告的 URL 具有能力範圍限制，例如 `http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`。請將其視為短期有效的認證資訊，而非穩定連結。

### A2UI 命令（v0.8）

Canvas 接受 A2UI v0.8 伺服器對用戶端訊息：`beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface`。目前尚不支援 `createSurface`（v0.9）。

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas（A2UI v0.8）"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"如果你能讀到這段文字，表示 A2UI 推送運作正常。"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速煙霧測試：

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
| `message`                  | 預先填入的代理程式提示詞。                            |
| `sessionKey`               | 穩定的工作階段識別碼。                                |
| `thinking`                 | 選用的思考設定檔。                                    |
| `deliver`, `to`, `channel` | 遞送目標。                                            |
| `timeoutSeconds`           | 選用的執行逾時時間。                                  |
| `key`                      | App 為受信任的本機呼叫端產生的安全權杖。              |

除非提供有效金鑰，否則 App 會提示確認。未提供金鑰的連結會在核准前顯示訊息與 URL，並忽略遞送路由欄位；含金鑰的連結則使用一般的閘道執行路徑。

## 安全性注意事項

- Canvas 配置會封鎖目錄周遊；檔案必須位於工作階段根目錄下。
- 本機 Canvas 內容使用自訂配置（不需要回送伺服器）。
- 只有明確導覽時，才允許外部 `http(s)` URL。
- 一般網頁只能呈現內容。只有來自 App 所擁有的 Canvas 配置，或 App 選定且具有確切能力範圍限制的閘道 A2UI 文件，才會接受代理程式動作；子框架、重新導向、過期的能力及已變更的查詢都無法分派動作。

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [WebChat](/zh-TW/web/webchat)
