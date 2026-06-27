---
read_when:
    - 在 Control UI 中變更助理輸出呈現方式
    - 偵錯 `[embed ...]`、結構化媒體、回覆或音訊呈現指令
summary: 用於結構化媒體、嵌入內容、音訊提示與回覆的豐富輸出協定
title: 豐富輸出協定
x-i18n:
    generated_at: "2026-06-27T20:00:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助理輸出可以帶有一小組傳遞/轉譯指示：

- 用於附件傳遞的結構化 `mediaUrl` / `mediaUrls` 欄位
- 用於音訊呈現提示的 `[[audio_as_voice]]`
- 用於回覆中繼資料的 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- 用於 Control UI 豐富轉譯的 `[embed ...]`

遠端媒體附件必須是公開的 `https:` URL。純 `http:`、
迴路、鏈路本機、私有與內部主機名稱都會被忽略，不作為附件
指示；伺服器端媒體擷取器仍會執行自己的網路防護。

本機媒體附件可以使用絕對路徑、相對工作區路徑，或
相對家目錄的 `~/` 路徑。它們在傳遞前仍會經過代理檔案讀取政策與
媒體類型檢查。

<Warning>
不要從工具、外掛、串流區塊、瀏覽器輸出或訊息動作發出附件的文字命令。
請改用結構化媒體欄位。

有效的訊息工具負載：

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

舊版最終助理回覆文字仍可能為了相容性而正規化，但
它不是通用的外掛/工具協定。
</Warning>

純 Markdown 圖片語法預設會保留為文字。有意將 Markdown 圖片回覆
對應為媒體附件的通道，會在其輸出配接器中選擇啟用；
Telegram 會這樣做，因此 `![alt](url)` 仍可成為媒體回覆。

這些指示彼此分離。結構化媒體欄位與回覆/語音標籤是
傳遞中繼資料；`[embed ...]` 則是僅限網頁的豐富轉譯路徑。

啟用區塊串流時，媒體必須承載於結構化負載
欄位。如果同一個媒體 URL 在串流區塊中送出，並在
最終助理負載中重複，OpenClaw 會傳遞該附件一次，並從
最終負載移除重複項目。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向代理的豐富轉譯語法。

自閉合範例：

```text
[embed ref="cv_123" title="Status" /]
```

規則：

- `[view ...]` 不再適用於新輸出。
- 嵌入短代碼只會在助理訊息介面中轉譯。
- 只會轉譯由 URL 支援的嵌入。請使用 `ref="..."` 或 `url="..."`。
- 區塊形式的行內 HTML 嵌入短代碼不會轉譯。
- Web UI 會從可見文字中移除短代碼，並在行內轉譯嵌入。
- 結構化媒體不是嵌入別名，不應用於豐富嵌入轉譯。

## 已儲存的轉譯形狀

正規化/已儲存的助理內容區塊是結構化 `canvas` 項目：

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

已儲存/已轉譯的豐富區塊會直接使用這個 `canvas` 形狀。不會識別 `present_view`。

## 相關

- [RPC 配接器](/zh-TW/reference/rpc)
- [Typebox](/zh-TW/concepts/typebox)
