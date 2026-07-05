---
read_when:
    - 你想要從終端機搜尋即時 OpenClaw 文件
    - 你需要知道文件命令列介面呼叫哪個託管搜尋 API
summary: '`openclaw docs` 的命令列介面參考（搜尋即時文件索引）'
title: 文件
x-i18n:
    generated_at: "2026-07-05T11:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

從終端搜尋即時 OpenClaw 文件索引。

## 用法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| 引數         | 說明                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 自由格式搜尋查詢。多字詞查詢會以空格串接，並作為單一查詢送出。                   |

沒有查詢時，`openclaw docs` 會列印文件入口點 URL 和範例搜尋命令，而不是執行搜尋。

## 範例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 運作方式

`openclaw docs` 會呼叫 `https://docs.openclaw.ai/api/search` 並呈現 JSON 結果。搜尋請求使用固定的 30 秒逾時。

## 輸出

在豐富（TTY）終端中，結果會呈現為標題後接項目符號清單：頁面標題、連結的文件 URL，以及下一行的簡短摘要。空結果會列印「No results.」。

在非豐富輸出（管線、`--no-color`、指令碼）中，相同資料會呈現為 Markdown：

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 結束代碼

| 代碼 | 含義                                                                   |
| ---- | ---------------------------------------------------------------------- |
| `0`  | 搜尋成功，包括零結果回應。                                             |
| `1`  | 託管文件搜尋 API 呼叫失敗；stderr 會列印錯誤訊息。                    |

## 相關

- [命令列介面參考](/zh-TW/cli)
- [即時文件](https://docs.openclaw.ai)
