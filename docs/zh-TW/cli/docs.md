---
read_when:
    - 你想要從終端機搜尋即時的 OpenClaw 文件
    - 你需要知道文件命令列介面會呼叫哪一個託管搜尋 API
summary: '`openclaw docs` 的命令列介面參考（搜尋即時文件索引）'
title: 文件
x-i18n:
    generated_at: "2026-07-11T21:11:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

從終端機搜尋即時 OpenClaw 文件索引。

## 使用方式

```bash
openclaw docs                       # 顯示文件入口點與搜尋範例
openclaw docs <query...>            # 搜尋即時文件索引
```

| 引數         | 說明                                                   |
| ------------ | ------------------------------------------------------ |
| `[query...]` | 自由格式的搜尋查詢。多字詞查詢會以空格連接後一併傳送。 |

未提供查詢時，`openclaw docs` 會顯示文件入口點 URL 與搜尋指令範例，而不會執行搜尋。

## 範例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 運作方式

`openclaw docs` 會呼叫 `https://docs.openclaw.ai/api/search` 並呈現 JSON 結果。搜尋請求使用固定的 30 秒逾時時間。

## 輸出

在支援豐富顯示的終端機（TTY）中，結果會呈現為標題及其後的項目符號清單：頁面標題、附有連結的文件 URL，以及下一行的簡短摘要。結果為空時會顯示「沒有結果。」。

在非豐富顯示輸出中（透過管線傳送、使用 `--no-color` 或指令碼），相同資料會呈現為 Markdown：

```markdown
# 文件搜尋：<query>

- [標題](https://docs.openclaw.ai/...) - 摘要
- [標題](https://docs.openclaw.ai/...) - 摘要
```

## 結束代碼

| 代碼 | 含義                                                               |
| ---- | ------------------------------------------------------------------ |
| `0`  | 搜尋成功，包括結果數為零的回應。                                   |
| `1`  | 託管的文件搜尋 API 呼叫失敗；標準錯誤輸出會顯示錯誤訊息。          |

## 相關資源

- [命令列介面參考](/zh-TW/cli)
- [即時文件](https://docs.openclaw.ai)
