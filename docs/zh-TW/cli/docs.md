---
read_when:
    - 你想要從終端機搜尋即時 OpenClaw 文件
summary: '`openclaw docs` 的 CLI 參考（搜尋即時文件索引）'
title: 文件
x-i18n:
    generated_at: "2026-04-30T02:53:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

搜尋即時文件索引。

引數：

- `[query...]`：要傳送至即時文件索引的搜尋詞彙

範例：

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

備註：

- 未提供查詢時，`openclaw docs` 會開啟即時文件搜尋入口。
- 多字詞查詢會作為單一搜尋要求傳遞。

## 相關內容

- [CLI 參考](/zh-TW/cli)
