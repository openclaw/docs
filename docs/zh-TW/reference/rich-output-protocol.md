---
read_when:
    - 變更控制 UI 中的助理輸出呈現方式
    - 偵錯 `[embed ...]`、`MEDIA:`、回覆或音訊呈現指令
summary: 用於嵌入、媒體、音訊提示和回覆的豐富輸出短代碼協定
title: 豐富輸出協定
x-i18n:
    generated_at: "2026-04-30T03:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant 輸出可以帶有一小組傳遞/呈現指令：

- `MEDIA:` 用於附件傳遞
- `[[audio_as_voice]]` 用於音訊呈現提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用於回覆中繼資料
- `[embed ...]` 用於 Control UI 豐富呈現

遠端 `MEDIA:` 附件必須是公開的 `https:` URL。純 `http:`、loopback、link-local、私有和內部主機名稱會被忽略，不作為附件指令；伺服器端媒體擷取器仍會執行自己的網路防護。

純 Markdown 圖片語法預設會保留為文字。刻意將 Markdown 圖片回覆對應為媒體附件的頻道，會在其輸出轉接器中選擇啟用；Telegram 會這麼做，因此 `![alt](url)` 仍可變成媒體回覆。

這些指令是彼此獨立的。`MEDIA:` 和回覆/語音標籤會保留為傳遞中繼資料；`[embed ...]` 則是僅限網頁的豐富呈現路徑。
受信任的工具結果媒體在傳遞前會使用相同的 `MEDIA:` / `[[audio_as_voice]]` 剖析器，因此文字工具輸出仍可將音訊附件標記為語音備忘。

啟用區塊串流時，`MEDIA:` 在一個回合中仍是單次傳遞中繼資料。如果相同媒體 URL 在串流區塊中送出，並在最終 Assistant 酬載中重複，OpenClaw 會傳遞附件一次，並從最終酬載中移除重複項目。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向 agent 的豐富呈現語法。

自我封閉範例：

```text
[embed ref="cv_123" title="Status" /]
```

規則：

- `[view ...]` 不再適用於新的輸出。
- Embed 短代碼只會在 Assistant 訊息介面中呈現。
- 只會呈現以 URL 為後盾的 embed。請使用 `ref="..."` 或 `url="..."`。
- 不會呈現區塊形式的行內 HTML embed 短代碼。
- Web UI 會從可見文字中移除短代碼，並將 embed 以内嵌方式呈現。
- `MEDIA:` 不是 embed 別名，不應用於豐富 embed 呈現。

## 儲存的呈現形狀

正規化/儲存的 Assistant 內容區塊是結構化的 `canvas` 項目：

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

儲存/呈現的豐富區塊會直接使用此 `canvas` 形狀。`present_view` 無法辨識。

## 相關

- [RPC 轉接器](/zh-TW/reference/rpc)
- [Typebox](/zh-TW/concepts/typebox)
