---
read_when:
    - 你正在修改面向外发渠道的 Markdown 格式化或分块逻辑
    - 你正在添加新的渠道格式化器或样式映射
    - 你正在调试跨渠道的格式化回归问题
summary: 面向外发渠道的 Markdown 格式化管线
title: Markdown 格式化
x-i18n:
    generated_at: "2026-04-05T08:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Markdown 格式化

OpenClaw 会先将外发 Markdown 转换为共享的中间表示
（IR），再渲染为特定渠道的输出格式。IR 会在保留源文本不变的同时携带样式/链接区间，因此分块和渲染可以在各渠道之间保持一致。

## 目标

- **一致性：**一次解析，多个渲染器。
- **安全分块：**先拆分文本再渲染，这样内联格式永远不会
  在分块之间断裂。
- **适配渠道：**将同一个 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal
  样式区间，而无需重新解析 Markdown。

## 管线

1. **解析 Markdown -> IR**
   - IR 是纯文本，加上样式区间（bold/italic/strike/code/spoiler）和链接区间。
   - 偏移量使用 UTF-16 代码单元，以便 Signal 的样式区间与其 API 对齐。
   - 只有当某个渠道选择启用表格转换时，才会解析表格。
2. **对 IR 分块（格式优先）**
   - 分块发生在渲染之前，直接基于 IR 文本进行。
   - 内联格式不会跨分块拆开；区间会按每个分块进行切分。
3. **按渠道渲染**
   - **Slack：**mrkdwn 标记（bold/italic/strike/code），链接为 `<url|label>`。
   - **Telegram：**HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：**纯文本 + `text-style` 区间；当标签与链接不同时时，链接会变成 `label (url)`。

## IR 示例

输入 Markdown：

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 和 Signal 的外发适配器都基于 IR 进行渲染。
- 其他渠道（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用纯文本或
  各自的格式化规则；当启用 Markdown 表格转换时，会先在
  分块之前应用该转换。

## 表格处理

Markdown 表格在不同聊天客户端中的支持并不一致。使用
`markdown.tables` 可按渠道（以及按账号）控制转换行为。

- `code`：将表格渲染为代码块（大多数渠道的默认值）。
- `bullets`：将每一行转换为项目符号列表（Signal + WhatsApp 的默认值）。
- `off`：禁用表格解析和转换；原始表格文本会直接透传。

配置键：

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 分块规则

- 分块限制来自渠道适配器/配置，并应用于 IR 文本。
- 代码围栏会作为单个整体保留，并带有一个尾随换行，以便各渠道
  正确渲染它们。
- 列表前缀和块引用前缀都是 IR 文本的一部分，因此分块时
  不会在前缀中间拆开。
- 内联样式（bold/italic/strike/inline-code/spoiler）永远不会跨
  分块拆开；渲染器会在每个分块内重新打开样式。

如果你想进一步了解跨渠道的分块行为，请参阅
[Streaming + chunking](/concepts/streaming)。

## 链接策略

- **Slack：**`[label](url)` -> `<url|label>`；裸 URL 保持不变。解析时会禁用 Autolink，
  以避免重复加链接。
- **Telegram：**`[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：**`[label](url)` -> `label (url)`，除非标签与 URL 相同。

## 剧透

剧透标记（`||spoiler||`）仅为 Signal 解析，在那里会映射到
SPOILER 样式区间。其他渠道会将其视为纯文本。

## 如何添加或更新渠道格式化器

1. **解析一次：**使用共享的 `markdownToIR(...)` 辅助函数，并传入适合渠道的
   选项（autolink、heading style、blockquote prefix）。
2. **渲染：**使用 `renderMarkdownWithMarkers(...)` 和
   样式标记映射（或 Signal 样式区间）实现渲染器。
3. **分块：**在渲染前调用 `chunkMarkdownIR(...)`；然后渲染每个分块。
4. **接入适配器：**更新渠道外发适配器以使用新的分块器
   和渲染器。
5. **测试：**如果该渠道使用分块，添加或更新格式测试以及外发投递测试。

## 常见陷阱

- 必须保留 Slack 的尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）；
  同时要安全地转义原始 HTML。
- Telegram HTML 要求对标签外的文本进行转义，以避免标记损坏。
- Signal 的样式区间依赖 UTF-16 偏移量；不要使用码点偏移量。
- 对于围栏代码块，要保留尾随换行，这样闭合标记才能落在
  单独一行上。
