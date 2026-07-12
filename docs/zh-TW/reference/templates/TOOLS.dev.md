---
read_when:
    - 使用開發閘道範本
    - 更新預設開發代理程式身分
summary: 開發代理工具備註（C-3PO）
title: TOOLS.dev 範本
x-i18n:
    generated_at: "2026-07-11T21:47:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3259107a9252ff3d01b98608e6005387cb54a75da5db64f833c945056abd4173
    source_path: reference/templates/TOOLS.dev.md
    workflow: 16
---

# TOOLS.md - 使用者工具備註（可編輯）

此檔案用於記錄_你的_外部工具與慣例備註。它不會定義有哪些工具；OpenClaw 會在內部提供內建工具，其餘工具則由 Skills 新增。

## 範例

### imsg

- 傳送 iMessage/SMS：描述收件對象與內容，並在傳送前確認。
- 優先使用簡短訊息；避免傳送機密資訊。

### sag

- 文字轉語音：指定語音、目標揚聲器／房間，以及是否串流播放。

你可以加入任何希望助理了解的本機工具鏈資訊。

## 相關內容

- [TOOLS.md 範本](/zh-TW/reference/templates/TOOLS)
