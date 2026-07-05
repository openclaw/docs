---
read_when:
    - 變更 Control UI 中的助理輸出呈現方式
    - 偵錯 `[embed ...]`、結構化媒體、回覆或音訊呈現指令
summary: 結構化媒體、嵌入內容、音訊提示與回覆的豐富輸出協定
title: 豐富輸出協定
x-i18n:
    generated_at: "2026-07-05T11:41:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助理輸出會透過幾個專用通道攜帶傳遞/呈現指示：

- 用於附件傳遞的結構化 `mediaUrl` / `mediaUrls` 欄位。
- 用於音訊呈現提示的 `[[audio_as_voice]]`。
- 用於回覆中繼資料的 `[[reply_to_current]]` / `[[reply_to:<id>]]`。
- 用於 Control UI 豐富呈現的 `[embed ...]`。

結構化媒體欄位和 `[[...]]` 標籤是傳遞中繼資料。`[embed ...]` 是獨立的僅限網頁豐富呈現路徑；它不是媒體別名。

## 媒體附件

遠端附件必須是公開的 `https:` URL。`http:`、loopback、連結本機、私有和內部主機名稱會被拒絕作為附件指示；伺服器端媒體擷取器會在此之上套用自己的網路防護。

本機附件接受絕對路徑、工作區相對路徑或家目錄相對 `~/` 路徑。它們在傳遞前仍會通過代理程式檔案讀取政策和媒體類型檢查。

<Warning>
不要從工具、外掛、串流區塊、瀏覽器輸出或訊息動作發出附件文字命令。請改用結構化媒體欄位：

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

舊版最終回覆文字仍可能為了相容性而正規化，但這不是一般的外掛/工具協定。
</Warning>

純 Markdown 圖片語法（`![alt](url)`）預設會保留為文字。想把 Markdown 圖片視為媒體回覆的通道，需在其輸出轉接器中選擇加入；Telegram 會這樣做，因此 `![alt](url)` 會變成媒體附件。

啟用區塊串流時，媒體必須附帶在結構化承載欄位上。如果同一個媒體 URL 同時出現在串流區塊中，並再次出現在最終助理承載中，OpenClaw 只會傳遞一次，並從最終承載中移除重複項目。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向代理程式的豐富呈現語法。自閉合範例：

```text
[embed ref="cv_123" title="Status" /]
```

規則：

- `[view ...]` 對新輸出已不再有效。
- Embed 短代碼只會在助理訊息介面中呈現。
- 只有以 URL 為後端的 embed 會呈現；使用 `ref="..."` 或 `url="..."`。
- 區塊形式的行內 HTML embed 短代碼不會呈現。
- 網頁 UI 會從可見文字中移除短代碼，並行內呈現 embed。

## 已儲存的呈現形狀

正規化/已儲存的助理內容區塊是一個結構化 `canvas` 項目：

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

`present_view` 不會被識別；已儲存/已呈現的豐富區塊一律使用這個 `canvas` 形狀。

## 相關

- [RPC 轉接器](/zh-TW/reference/rpc)
- [Typebox](/zh-TW/concepts/typebox)
