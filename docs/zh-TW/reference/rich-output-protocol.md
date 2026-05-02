---
read_when:
    - 在控制 UI 中變更助理輸出呈現方式
    - 偵錯 `[embed ...]`、`MEDIA:`、回覆或音訊呈現指令
summary: 用於嵌入、媒體、音訊提示與回覆的豐富輸出短代碼協定
title: 豐富輸出協定
x-i18n:
    generated_at: "2026-05-02T22:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant 輸出可攜帶一小組傳遞／渲染指示：

- `MEDIA:` 用於附件傳遞
- `[[audio_as_voice]]` 用於音訊呈現提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用於回覆中繼資料
- `[embed ...]` 用於 Control UI 豐富渲染

遠端 `MEDIA:` 附件必須是公開的 `https:` URL。純 `http:`、
loopback、link-local、私有和內部主機名稱都會作為附件
指示被忽略；伺服器端媒體擷取器仍會執行自己的網路防護。

本機 `MEDIA:` 附件可以使用絕對路徑、相對於工作區的路徑，或
相對於家目錄的 `~/` 路徑。在傳遞前，它們仍會通過代理程式的檔案讀取政策和
媒體類型檢查。

純 Markdown 圖片語法預設會保留為文字。刻意將 Markdown 圖片回覆
對應到媒體附件的 Channel，會在其輸出
配接器選擇加入；Telegram 會這麼做，因此 `![alt](url)` 仍可變成媒體回覆。

這些指示彼此獨立。`MEDIA:` 和回覆／語音標籤仍是傳遞中繼資料；`[embed ...]` 是僅限網頁的豐富渲染路徑。
受信任工具結果媒體會在傳遞前使用相同的 `MEDIA:` / `[[audio_as_voice]]` 剖析器，因此文字工具輸出仍可將音訊附件標記為語音備註。

啟用區塊串流時，`MEDIA:` 仍是一個回合的單次傳遞中繼資料。
如果相同媒體 URL 在串流區塊中傳送，並在最終
assistant payload 中重複，OpenClaw 會傳遞附件一次，並從最終 payload 中移除重複項。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向代理程式的豐富渲染語法。

自閉合範例：

```text
[embed ref="cv_123" title="Status" /]
```

規則：

- `[view ...]` 不再適用於新的輸出。
- Embed 短碼只會在 assistant 訊息介面中渲染。
- 只會渲染由 URL 支援的 embed。使用 `ref="..."` 或 `url="..."`。
- 區塊形式的行內 HTML embed 短碼不會被渲染。
- 網頁 UI 會從可見文字中移除短碼，並行內渲染 embed。
- `MEDIA:` 不是 embed 別名，不應用於豐富 embed 渲染。

## 已儲存的渲染形狀

正規化／已儲存的 assistant 內容區塊是結構化的 `canvas` 項目：

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

已儲存／已渲染的豐富區塊會直接使用這個 `canvas` 形狀。`present_view` 不會被識別。

## 相關

- [RPC 配接器](/zh-TW/reference/rpc)
- [Typebox](/zh-TW/concepts/typebox)
