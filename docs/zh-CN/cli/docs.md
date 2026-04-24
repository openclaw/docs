---
read_when:
    - 你想从终端搜索实时的 OpenClaw 文档
summary: '`openclaw docs` 的 CLI 参考（搜索实时文档索引）'
title: 文档
x-i18n:
    generated_at: "2026-04-24T04:00:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

搜索实时文档索引。

参数：

- `[query...]`：发送到实时文档索引的搜索词

示例：

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

说明：

- 不带查询词时，`openclaw docs` 会打开实时文档搜索入口。
- 多词查询会作为一次搜索请求一并传递。

## 相关内容

- [CLI 参考](/zh-CN/cli)
