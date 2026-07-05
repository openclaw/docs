---
read_when:
    - 你正在更改出站渠道的 Markdown 格式或分块
    - 你正在添加新的渠道格式化器或样式映射
    - 你正在调试跨渠道的格式回归
summary: 出站渠道的 Markdown 格式化流水线
title: Markdown 格式
x-i18n:
    generated_at: "2026-07-05T11:13:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 会先将出站 Markdown 转换为共享的中间表示
（IR），再渲染特定渠道的输出。IR 会保留纯文本以及
样式/链接范围，因此一次解析步骤即可供所有渠道使用，分块也永远不会
在格式范围中间拆分。

## 流程

1. **将 Markdown 解析为 IR**（`markdownToIR`）- 纯文本加样式范围
   （粗体、斜体、删除线、代码、代码块、剧透、块引用、
   1-6 级标题）和链接范围。偏移量使用 UTF-16 代码单元，因此 Signal 样式
   范围可以直接与它的 API 对齐。只有当渠道
   选择表格模式时，才会解析表格。
2. **分块 IR**（`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`）
   - 拆分发生在渲染前的 IR 文本上，因此内联样式和
     链接会按块切片，而不会跨边界断开。
3. **按渠道渲染**（`renderMarkdownWithMarkers`）- 样式标记映射
   会将范围转换为渠道的原生标记。

| 渠道                                                          | 渲染器                                                                             | 说明                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn 标记（`*bold*`、`_italic_`、`` `code` ``、代码围栏）                      | 链接会变成 `<url\|label>`；解析时禁用自动链接，以避免重复链接      |
| Telegram                                                         | HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`、`<tg-spoiler>`） | 当 `richMessages` 开启时，也支持富消息表格和标题（`<h1>`-`<h6>`） |
| Signal                                                           | 纯文本 + `text-style` 范围                                                     | 当标签不同于 URL 时，链接会渲染为 `label (url)`                        |
| Discord、WhatsApp、iMessage、Microsoft Teams 和其他渠道 | 纯文本                                                                           | 不使用基于 IR 的样式；Markdown 表格转换仍会通过 `convertMarkdownTables` 运行    |

## IR 示例

输入 Markdown：
__OC_I18N_900000__
IR（示意）：
__OC_I18N_900001__
## 表格处理

`markdown.tables` 控制渠道如何转换 Markdown 表格，可按
渠道设置，也可选地按账号设置：

| 模式      | 行为                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | 在代码块内渲染为对齐的 ASCII 表格（回退默认值）              |
| `bullets` | 将每一行转换为 `label: value` 项目符号                                   |
| `block`   | 在传输协议支持时保留原生表格；否则回退到 `code` |
| `off`     | 禁用表格解析；原始表格文本会原样传递                       |

按渠道的插件默认值：Signal、WhatsApp 和 Matrix 默认使用
`bullets`；Mattermost 默认使用 `off`；Telegram 默认使用 `block`（除非账号启用了 `richMessages`，否则会
解析为 `code`）。任何没有显式插件默认值的
渠道都会回退到 `code`。
__OC_I18N_900002__
## 分块规则

- 分块限制来自渠道适配器/配置，并应用于 IR 文本，而不是
  渲染后的输出。
- 围栏代码块会作为一个块保留，并带有尾随换行符，以便
  渠道正确渲染闭合围栏。
- 列表和块引用前缀是 IR 文本的一部分，因此分块永远不会
  在前缀中间拆分。
- 内联样式永远不会跨块拆分；渲染器会在下一个块的开头
  重新打开未闭合的样式。

参见[流式传输和分块](/concepts/streaming)，了解跨渠道的分块边界和
投递行为。

## 链接策略

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 保持裸 URL。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非标签已经
  与 URL 匹配。

## 剧透

会为 Signal（映射到 `SPOILER`
样式范围）和 Telegram（映射到 `<tg-spoiler>`）解析剧透标记（`||spoiler||`）。其他渠道会将
`||...||` 视为纯文本。

## 添加或更新渠道格式化器

1. 使用 `markdownToIR(...)` **解析一次**，并传入适合渠道的
   选项（`autolink`、`headingStyle`、`blockquotePrefix`、`tableMode`）。
2. 使用 `renderMarkdownWithMarkers(...)` 和样式标记映射**渲染**（或
   为 Signal 这类传输协议使用自定义样式范围逻辑）。
3. 在渲染每个块之前，使用 `chunkMarkdownIR(...)` 或
   `renderMarkdownIRChunksWithinLimit(...)` **分块**。
4. **接入适配器**，从出站发送路径调用新的分块器和渲染器。
5. 使用格式测试进行**测试**；如果渠道会分块，再加上出站投递测试。

## 常见问题

- Slack 尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）必须
  在转义后保留；原始 HTML 仍需要安全转义。
- Telegram HTML 要求转义标签外的文本，以避免标记损坏。
- Signal 样式范围使用 UTF-16 偏移量，而不是码点偏移量。
- 保留围栏代码块的尾随换行符，让闭合标记
  落在单独一行。

## 相关

<CardGroup cols={2}>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界和渠道特定投递。
  </Card>
  <Card title="系统提示词" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    模型在对话前看到的内容，包括注入的工作区文件。
  </Card>
</CardGroup>
