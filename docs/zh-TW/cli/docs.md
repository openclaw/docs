---
read_when:
    - 你想從終端機搜尋即時 OpenClaw 文件
    - 你需要知道文件命令列介面呼叫的是哪個託管搜尋 API
summary: '`openclaw docs` 的命令列介面參考（搜尋即時文件索引）'
title: 文件
x-i18n:
    generated_at: "2026-06-27T19:05:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

從終端機搜尋即時 OpenClaw 文件索引。此命令會呼叫 OpenClaw 由 Cloudflare 託管的文件搜尋 API，並在你的終端機中呈現結果。

## 用法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

引數：

| 引數         | 說明                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 自由格式搜尋查詢。多字詞查詢會以空格合併，並作為一筆查詢送出。 |

## 範例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

沒有查詢時，`openclaw docs` 會列印文件入口 URL 加上一個範例搜尋命令，而不是執行搜尋。

## 運作方式

`openclaw docs` 會呼叫 `https://docs.openclaw.ai/api/search` 並呈現 JSON 結果。搜尋呼叫使用固定 30 秒逾時。

## 輸出

在功能豐富的 (TTY) 終端機中，結果會呈現為標題，後接項目符號清單。每個項目符號會顯示頁面標題、連結的文件 URL，以及下一行的簡短片段。空結果會列印「No results.」。

在非豐富輸出（管線傳遞、`--no-color`、腳本）中，相同資料會呈現為 Markdown：

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 結束代碼

| 代碼 | 含義                                                               |
| ---- | ------------------------------------------------------------------ |
| `0`  | 搜尋成功（包含零結果回應）。                                       |
| `1`  | 託管的文件搜尋 API 呼叫失敗；stderr 會內嵌列印。                   |

## 相關

- [命令列介面參考](/zh-TW/cli)
- [即時文件](https://docs.openclaw.ai)
