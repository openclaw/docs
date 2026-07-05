---
read_when:
    - 你想从终端搜索实时 OpenClaw 文档
    - 你需要知道文档 CLI 调用的是哪个托管搜索 API
summary: CLI 参考：`openclaw docs`（搜索实时文档索引）
title: 文档
x-i18n:
    generated_at: "2026-07-05T11:07:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

从终端搜索实时 OpenClaw 文档索引。

## 用法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| 参数         | 描述                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| `[query...]` | 自由格式搜索查询。多词查询会用空格连接，并作为一个整体发送。 |

没有查询时，`openclaw docs` 会打印文档入口 URL 和示例搜索命令，而不是执行搜索。

## 示例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 工作原理

`openclaw docs` 调用 `https://docs.openclaw.ai/api/search` 并渲染 JSON 结果。搜索请求使用固定的 30 秒超时。

## 输出

在富文本（TTY）终端中，结果会渲染为一个标题，后跟项目符号列表：页面标题、链接的文档 URL，以及下一行的短摘录。空结果会打印“无结果。”。

在非富文本输出中（管道、`--no-color`、脚本），同一数据会渲染为 Markdown：

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 退出代码

| 代码 | 含义                                                               |
| ---- | ------------------------------------------------------------------ |
| `0`  | 搜索成功，包括零结果响应。                                         |
| `1`  | 托管文档搜索 API 调用失败；stderr 会打印错误消息。                 |

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [实时文档](https://docs.openclaw.ai)
