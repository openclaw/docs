---
read_when:
    - 你想让智能体分析 PDF 文档
    - 你需要准确的 PDF 工具参数和限制
    - 你正在调试原生 PDF 模式与提取回退机制
summary: 使用原生提供商支持和提取回退来分析一个或多个 PDF 文档
title: PDF 工具
x-i18n:
    generated_at: "2026-04-25T00:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` 可分析一个或多个 PDF 文档并返回文本。

快速行为说明：

- 对 Anthropic 和 Google 模型提供商使用原生提供商模式。
- 对其他提供商使用提取回退模式（先提取文本，必要时再提取页面图像）。
- 支持单个（`pdf`）或多个（`pdfs`）输入，每次调用最多 10 个 PDF。

## 可用性

仅当 OpenClaw 能为该智能体解析出支持 PDF 的模型配置时，此工具才会注册：

1. `agents.defaults.pdfModel`
2. 回退到 `agents.defaults.imageModel`
3. 回退到该智能体已解析的会话 / 默认模型
4. 如果原生 PDF 提供商依赖认证，则优先选择它们，而不是通用图像回退候选项

如果无法解析出可用模型，则不会暴露 `pdf` 工具。

可用性说明：

- 回退链具备认证感知。已配置的 `provider/model` 只有在
  OpenClaw 实际能够为该智能体认证该提供商时才算有效。
- 当前原生 PDF 提供商仅有 **Anthropic** 和 **Google**。
- 如果已解析的会话 / 默认提供商本身已经配置了可用的 vision / PDF
  模型，则 PDF 工具会优先复用它，再回退到其他基于认证的
  提供商。

## 输入参考

<ParamField path="pdf" type="string">
一个 PDF 路径或 URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
多个 PDF 路径或 URL，总数最多 10 个。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析提示词。
</ParamField>

<ParamField path="pages" type="string">
页面过滤器，例如 `1-5` 或 `1,3,7-9`。
</ParamField>

<ParamField path="model" type="string">
可选模型覆盖，格式为 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每个 PDF 的大小上限，单位 MB。默认值为 `agents.defaults.pdfMaxBytesMb` 或 `10`。
</ParamField>

输入说明：

- `pdf` 和 `pdfs` 会在加载前合并并去重。
- 如果未提供任何 PDF 输入，工具会报错。
- `pages` 会按从 1 开始的页码解析、去重、排序，并限制在配置的最大页数范围内。
- `maxBytesMb` 默认值为 `agents.defaults.pdfMaxBytesMb` 或 `10`。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL
- 由 OpenClaw 管理的入站引用，例如 `media://inbound/<id>`

引用说明：

- 其他 URI scheme（例如 `ftp://`）会被拒绝，并返回 `unsupported_pdf_reference`。
- 在沙箱模式下，远程 `http(s)` URL 会被拒绝。
- 启用仅工作区文件策略时，允许根目录之外的本地文件路径会被拒绝。
- 在仅工作区文件策略下，托管的入站引用以及 OpenClaw 入站媒体存储下的重放路径是允许的。

## 执行模式

### 原生提供商模式

原生模式用于提供商 `anthropic` 和 `google`。
该工具会将原始 PDF 字节直接发送到提供商 API。

原生模式限制：

- 不支持 `pages`。如果设置了该参数，工具会返回错误。
- 支持多 PDF 输入；每个 PDF 都会在提示词之前作为原生文档块 /
  内联 PDF 部分发送。

### 提取回退模式

回退模式用于非原生提供商。

流程：

1. 从选定页面提取文本（最多 `agents.defaults.pdfMaxPages` 页，默认 `20`）。
2. 如果提取出的文本长度少于 `200` 个字符，则将选定页面渲染为 PNG 图像并一并包含。
3. 将提取出的内容和提示词发送给所选模型。

回退细节：

- 页面图像提取使用 `4,000,000` 的像素预算。
- 如果目标模型不支持图像输入且没有可提取文本，工具会报错。
- 如果文本提取成功，但图像提取需要在纯文本模型上启用 vision，
  OpenClaw 会丢弃渲染后的图像，并继续使用
  提取出的文本。
- 提取回退使用内置的 `document-extract` 插件。该插件负责
  `pdfjs-dist`；仅当图像渲染回退可用时才会使用 `@napi-rs/canvas`。

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

- `model`：已解析的模型引用（`provider/model`）
- `native`：原生提供商模式时为 `true`，回退模式时为 `false`
- `attempts`：成功前失败的回退尝试

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：`details.pdfs[]`，其中包含 `pdf` 条目
- 沙箱路径重写元数据（如适用）：`rewrittenFrom`

## 错误行为

- 缺少 PDF 输入：抛出 `pdf required: provide a path or URL to a PDF document`
- PDF 数量过多：在 `details.error = "too_many_pdfs"` 中返回结构化错误
- 不支持的引用 scheme：返回 `details.error = "unsupported_pdf_reference"`
- 原生模式使用 `pages`：抛出清晰错误 `pages is not supported with native PDF providers`

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
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `pdfMaxBytesMb` 和 `pdfMaxPages` 配置
