---
read_when:
    - 你想从智能体分析 PDF
    - 你需要精确的 pdf 工具参数和限制
    - 你正在调试原生 PDF 模式与提取回退之间的差异
summary: 使用原生提供商支持和提取回退分析一个或多个 PDF 文档
title: PDF 工具
x-i18n:
    generated_at: "2026-04-05T10:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# PDF 工具

`pdf` 可分析一个或多个 PDF 文档并返回文本。

快速行为说明：

- 对 Anthropic 和 Google 模型提供商使用原生提供商模式。
- 对其他提供商使用提取回退模式（先提取文本，需要时再提取页面图像）。
- 支持单个（`pdf`）或多个（`pdfs`）输入，每次调用最多 10 个 PDF。

## 可用性

仅当 OpenClaw 能为该智能体解析出支持 PDF 的模型配置时，才会注册该工具：

1. `agents.defaults.pdfModel`
2. 回退到 `agents.defaults.imageModel`
3. 回退到该智能体已解析的会话/默认模型
4. 如果原生 PDF 提供商有认证支持，则优先于通用图像回退候选项

如果无法解析出可用模型，则不会公开 `pdf` 工具。

可用性说明：

- 回退链会感知认证状态。已配置的 `provider/model` 只有在
  OpenClaw 实际可以为该智能体认证该提供商时才算有效。
- 当前原生 PDF 提供商是 **Anthropic** 和 **Google**。
- 如果已解析的会话/默认提供商已经配置了视觉/PDF
  模型，PDF 工具会优先复用它，再回退到其他有认证支持的
  提供商。

## 输入参考

- `pdf`（`string`）：一个 PDF 路径或 URL
- `pdfs`（`string[]`）：多个 PDF 路径或 URL，总数最多 10 个
- `prompt`（`string`）：分析提示词，默认为 `Analyze this PDF document.`
- `pages`（`string`）：页面过滤器，例如 `1-5` 或 `1,3,7-9`
- `model`（`string`）：可选模型覆盖（`provider/model`）
- `maxBytesMb`（`number`）：每个 PDF 的大小上限（MB）

输入说明：

- `pdf` 和 `pdfs` 会在加载前合并并去重。
- 如果未提供任何 PDF 输入，工具会报错。
- `pages` 会按从 1 开始的页码进行解析、去重、排序，并限制在已配置的最大页数以内。
- `maxBytesMb` 默认为 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL

引用说明：

- 其他 URI 方案（例如 `ftp://`）会被拒绝，并返回 `unsupported_pdf_reference`。
- 在沙箱模式下，远程 `http(s)` URL 会被拒绝。
- 启用仅工作区文件策略时，位于允许根目录之外的本地文件路径会被拒绝。

## 执行模式

### 原生提供商模式

提供商为 `anthropic` 和 `google` 时使用原生模式。
该工具会将原始 PDF 字节直接发送到提供商 API。

原生模式限制：

- 不支持 `pages`。如果设置了它，工具会返回错误。
- 支持多 PDF 输入；每个 PDF 都会作为原生文档块 /
  内联 PDF 部分在提示词之前发送。

### 提取回退模式

对非原生提供商使用回退模式。

流程：

1. 从选定页面提取文本（最多 `agents.defaults.pdfMaxPages` 页，默认 `20`）。
2. 如果提取的文本长度少于 `200` 个字符，则将选定页面渲染为 PNG 图像并一并包含。
3. 将提取内容和提示词发送到所选模型。

回退细节：

- 页面图像提取使用 `4,000,000` 的像素预算。
- 如果目标模型不支持图像输入，且没有可提取文本，工具会报错。
- 如果文本提取成功，但图像提取会要求一个纯文本模型支持视觉能力，
  OpenClaw 会丢弃渲染出的图像，并继续使用提取出的文本。
- 提取回退依赖 `pdfjs-dist`（图像渲染还需要 `@napi-rs/canvas`）。

## 配置

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

完整字段详情请参见[配置参考](/zh-CN/gateway/configuration-reference)。

## 输出详情

该工具会在 `content[0].text` 中返回文本，并在 `details` 中返回结构化元数据。

常见的 `details` 字段：

- `model`：已解析模型引用（`provider/model`）
- `native`：原生提供商模式为 `true`，回退模式为 `false`
- `attempts`：成功前失败的回退尝试

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：`details.pdfs[]`，其中包含 `pdf` 条目
- 沙箱路径重写元数据（如适用）：`rewrittenFrom`

## 错误行为

- 缺少 PDF 输入：抛出 `pdf required: provide a path or URL to a PDF document`
- PDF 过多：在 `details.error = "too_many_pdfs"` 中返回结构化错误
- 不支持的引用方案：返回 `details.error = "unsupported_pdf_reference"`
- 原生模式中使用 `pages`：抛出明确错误 `pages is not supported with native PDF providers`

## 示例

单个 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

多个 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

使用页面过滤的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults) — pdfMaxBytesMb 和 pdfMaxPages 配置
