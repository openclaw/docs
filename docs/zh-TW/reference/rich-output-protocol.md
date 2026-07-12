---
read_when:
    - 變更控制介面中的助理輸出呈現方式
    - 偵錯 `[embed ...]`、結構化媒體、回覆或音訊呈現指令
summary: 用於結構化媒體、嵌入內容、音訊提示與回覆的豐富輸出協定
title: 豐富輸出協定
x-i18n:
    generated_at: "2026-07-11T21:46:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

助理輸出會透過幾個專用管道攜帶傳送／呈現指令：

- 用於傳送附件的結構化 `mediaUrl`／`mediaUrls` 欄位。
- 用於音訊呈現提示的 `[[audio_as_voice]]`。
- 用於回覆中繼資料的 `[[reply_to_current]]`／`[[reply_to:<id>]]`。
- 用於控制介面豐富呈現的 `[embed ...]`。

結構化媒體欄位與 `[[...]]` 標籤屬於傳送中繼資料。`[embed ...]` 則是獨立且僅限網頁使用的豐富呈現路徑；它不是媒體別名。

## 媒體附件

遠端附件必須使用公開的 `https:` URL。`http:`、迴路、鏈路本地、私有及內部主機名稱都會被拒絕作為附件指令；伺服器端媒體擷取器還會套用自身的網路防護措施。

本機附件可接受絕對路徑、工作區相對路徑或相對於家目錄的 `~/` 路徑。傳送前仍須通過代理程式的檔案讀取政策與媒體類型檢查。

<Warning>
請勿從工具、外掛、串流區塊、瀏覽器輸出或訊息動作發出附件文字命令。請改用結構化媒體欄位：

```json
{ "message": "這是您的圖片。", "mediaUrl": "/workspace/image.png" }
```

為了相容性，舊版最終回覆文字仍可能會經過正規化，但這並不是通用的外掛／工具協定。
</Warning>

純 Markdown 圖片語法（`![alt](url)`）預設會保留為文字。若頻道希望將 Markdown 圖片視為媒體回覆，可在其輸出配接器中選擇啟用；Telegram 已啟用此功能，因此 `![alt](url)` 會成為媒體附件。

啟用區塊串流時，媒體必須透過結構化承載資料欄位傳送。如果同一個媒體 URL 同時出現在串流區塊及最終助理承載資料中，OpenClaw 只會傳送一次，並從最終承載資料中移除重複項目。

## `[embed ...]`

`[embed ...]` 是控制介面唯一面向代理程式的豐富呈現語法。自閉合範例：

```text
[embed ref="cv_123" title="Status" /]
```

規則：

- `[view ...]` 不再適用於新的輸出。
- 嵌入短代碼僅會在助理訊息介面中呈現。
- 僅會呈現以 URL 為基礎的嵌入；請使用 `ref="..."` 或 `url="..."`。
- 區塊形式的行內 HTML 嵌入短代碼不會呈現。
- 網頁介面會從可見文字中移除短代碼，並在行內呈現嵌入內容。

## 儲存的呈現結構

經正規化／儲存的助理內容區塊是一個結構化的 `canvas` 項目：

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

系統無法辨識 `present_view`；儲存／呈現的豐富內容區塊一律使用此 `canvas` 結構。

## 相關內容

- [RPC 配接器](/zh-TW/reference/rpc)
- [Typebox](/zh-TW/concepts/typebox)
