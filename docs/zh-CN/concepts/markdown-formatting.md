---
read_when:
    - 你正在更改出站渠道的 Markdown 格式或分块
    - 你正在添加新的渠道格式化器或样式映射
    - 你正在调试跨渠道的格式回归问题
summary: 出站渠道的 Markdown 格式化流水线
title: Markdown 格式
x-i18n:
    generated_at: "2026-05-06T01:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw 会先将出站 Markdown 转换为共享的中间
表示（IR），再渲染特定渠道的输出。IR 会保持
源文本完整，同时携带样式/链接范围，这样分块和渲染就能
在各渠道之间保持一致。

## 目标

- **一致性：** 一次解析步骤，多个渲染器。
- **安全分块：** 在渲染前拆分文本，确保行内格式永远不会
  跨分块断裂。
- **渠道适配：** 将同一个 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal
  样式范围，而无需重新解析 Markdown。

## 流程

1. **解析 Markdown -> IR**
   - IR 是纯文本加样式范围（粗体/斜体/删除线/代码/spoiler）和链接范围。
   - 偏移量使用 UTF-16 代码单元，这样 Signal 样式范围就能与其 API 对齐。
   - 只有当某个渠道选择启用表格转换时，才会解析表格。
2. **分块 IR（格式优先）**
   - 分块发生在渲染前的 IR 文本上。
   - 行内格式不会跨分块拆分；范围会按分块切片。
3. **按渠道渲染**
   - **Slack：** mrkdwn 标记（粗体/斜体/删除线/代码），链接为 `<url|label>`。
   - **Telegram：** HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 纯文本 + `text-style` 范围；当标签与 URL 不同时，链接变为 `label (url)`。

## IR 示例

输入 Markdown：

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 和 Signal 出站适配器会从 IR 渲染。
- 其他渠道（WhatsApp、iMessage、Microsoft Teams、Discord）仍使用纯文本或
  它们自己的格式规则，并在启用时于
  分块前应用 Markdown 表格转换。

## 表格处理

各聊天客户端对 Markdown 表格的支持并不一致。使用
`markdown.tables` 按渠道（以及按账号）控制转换。

- `code`：将表格渲染为代码块（大多数渠道的默认值）。
- `bullets`：将每一行转换为项目符号点（Signal + WhatsApp 的默认值）。
- `off`：禁用表格解析和转换；原始表格文本会直接传递。

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

- 分块限制来自渠道适配器/配置，并应用到 IR 文本。
- 代码围栏会作为单个块保留，并带有尾随换行，这样渠道
  可以正确渲染它们。
- 列表前缀和块引用前缀是 IR 文本的一部分，因此分块
  不会在前缀中间拆分。
- 行内样式（粗体/斜体/删除线/行内代码/spoiler）永远不会跨
  分块拆分；渲染器会在每个分块内重新打开样式。

如果你需要了解更多跨渠道分块行为，请参阅
[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 链接策略

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 保持裸 URL。解析期间会禁用自动链接，
  以避免重复链接。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非标签与 URL 匹配。

## Spoiler

Spoiler 标记（`||spoiler||`）仅为 Signal 解析，在 Signal 中它们会映射为
SPOILER 样式范围。其他渠道会将它们视为纯文本。

## 如何添加或更新渠道格式化器

1. **解析一次：** 使用共享的 `markdownToIR(...)` 辅助函数，并传入适合渠道的
   选项（autolink、heading style、blockquote prefix）。
2. **渲染：** 使用 `renderMarkdownWithMarkers(...)` 和
   样式标记映射（或 Signal 样式范围）实现渲染器。
3. **分块：** 在渲染前调用 `chunkMarkdownIR(...)`；渲染每个分块。
4. **接入适配器：** 更新渠道出站适配器，以使用新的分块器
   和渲染器。
5. **测试：** 如果该渠道使用分块，请添加或更新格式测试和
   出站投递测试。

## 常见注意事项

- 必须保留 Slack 尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）；
  安全转义原始 HTML。
- Telegram HTML 要求转义标签外的文本，以避免标记损坏。
- Signal 样式范围依赖 UTF-16 偏移量；不要使用码点偏移量。
- 保留围栏代码块的尾随换行，这样结束标记会落在
  自己单独的一行。

## 相关内容

<CardGroup cols={2}>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界和特定渠道投递。
  </Card>
  <Card title="系统提示词" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    模型在对话前会看到的内容，包括注入的工作区文件。
  </Card>
</CardGroup>
