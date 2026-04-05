---
read_when:
    - 你想在终端中搜索在线 OpenClaw 文档
summary: '`openclaw docs` 的 CLI 参考（搜索在线文档索引）'
title: docs
x-i18n:
    generated_at: "2026-04-05T08:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

搜索在线文档索引。

参数：

- `[query...]`：发送到在线文档索引的搜索词

示例：

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

说明：

- 不带查询词时，`openclaw docs` 会打开在线文档搜索入口。
- 多个单词的查询会作为一次搜索请求整体传递。
