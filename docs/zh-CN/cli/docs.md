---
read_when:
    - 你想从终端搜索实时 OpenClaw 文档
    - 你需要知道文档 CLI 调用的是哪个托管搜索 API
summary: '`openclaw docs` 的 CLI 参考（搜索实时文档索引）'
title: 文档
x-i18n:
    generated_at: "2026-06-27T01:37:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

从终端搜索实时 OpenClaw 文档索引。该命令会调用 OpenClaw 托管在 Cloudflare 上的文档搜索 API，并在你的终端中呈现结果。

## 用法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

参数：

| 参数         | 描述                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 自由格式搜索查询。多词查询会用空格拼接，并作为一个查询发送。 |

## 示例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

如果没有查询，`openclaw docs` 会打印文档入口 URL 和示例搜索命令，而不是运行搜索。

## 工作原理

`openclaw docs` 会调用 `https://docs.openclaw.ai/api/search` 并呈现 JSON 结果。搜索调用使用固定的 30 秒超时。

## 输出

在富格式（TTY）终端中，结果会呈现为一个标题，后面跟一个项目符号列表。每个项目符号会显示页面标题、链接的文档 URL，以及下一行的简短片段。空结果会打印 “无结果。”。

在非富格式输出中（管道、`--no-color`、脚本），相同数据会呈现为 Markdown：

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 退出码

| 代码 | 含义                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | 搜索成功（包括零结果响应）。               |
| `1`  | 托管的文档搜索 API 调用失败；stderr 会以内联方式打印。 |

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [实时文档](https://docs.openclaw.ai)
