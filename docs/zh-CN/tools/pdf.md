---
read_when:
    - 你想分析来自智能体的 PDF 文件
    - 你需要准确的 PDF 工具参数和限制
    - 你正在调试原生 PDF 模式与提取回退机制之间的差异
summary: 使用原生提供商支持和提取回退机制分析一个或多个 PDF 文档
title: PDF 工具
x-i18n:
    generated_at: "2026-07-11T21:00:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 可分析一个或多个 PDF 文档并返回文本。对于 Anthropic 和 Google 模型，它使用原生文档输入；对于其他所有提供商，则回退到文本/图像提取。

## 可用性

仅当 OpenClaw 能够为智能体解析出支持 PDF 的模型时，才会注册此工具。解析顺序如下：

1. `agents.defaults.pdfModel`（显式指定的主模型/回退模型）
2. `agents.defaults.imageModel`（显式指定的主模型/回退模型）
3. 智能体解析后的会话模型/默认模型，前提是其提供商支持原生 PDF 输入（Anthropic、Google），或已配置视觉模型
4. 自动检测具有可用身份验证的图像/视觉提供商，并优先选择原生支持 PDF 的提供商

使用前会检查每个回退候选项的身份验证，因此只有当 OpenClaw 能够为该智能体向相应提供商完成身份验证时，已配置的 `provider/model` 才算有效。如果无法解析出可用模型，则不会公开 `pdf` 工具。

## 输入参考

<ParamField path="pdf" type="string">
一个 PDF 路径或 URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
多个 PDF 路径或 URL，总数最多为 10 个。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析提示词。
</ParamField>

<ParamField path="pages" type="string">
页面筛选器，例如 `1-5` 或 `1,3,7-9`。原生提供商模式不支持此参数。
</ParamField>

<ParamField path="password" type="string">
加密 PDF 的密码。应用于请求中的每个 PDF；仅由提取回退模式使用。
</ParamField>

<ParamField path="model" type="string">
可选的模型覆盖项，格式为 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每个 PDF 的大小上限，单位为 MB。默认为 `agents.defaults.pdfMaxBytesMb`；如果未设置，则为 `10`。
</ParamField>

注意：

- 加载前会合并 `pdf` 和 `pdfs` 并去重；至少需要提供其中一个。
- `pages` 会解析为从 1 开始的页码，并进行去重、排序，再限制到 `agents.defaults.pdfMaxPages`（默认为 `20`）。如果范围内没有任何有效页码，则会在调用模型前报错。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的入站引用，例如 `media://inbound/<id>`

其他 URI 方案（例如 `ftp://`）会返回 `details.error = "unsupported_pdf_reference"`。当工具在沙箱隔离环境中运行时，会拒绝远程 `http(s)` URL。启用仅限工作区的文件策略后，会拒绝允许根目录之外的本地路径；但仍允许 OpenClaw 入站媒体存储中的托管入站引用和重放路径。

## 执行模式

### 原生提供商模式

用于提供商 `anthropic` 和 `google`（目前仅这两个提供商声明支持原生 PDF 文档）。每个文件的原始 PDF 字节会作为原生文档/内联 PDF 部分，直接发送到提供商 API。

限制：

- 不支持 `pages`；如果设置，工具会抛出 `pages is not supported with native PDF providers`。
- 不支持 `password`；如果设置，工具会抛出 `password is not supported with native PDF providers`。对于加密 PDF，请使用非原生模型。

### 提取回退模式

用于其他所有提供商。

1. 通过内置的 `document-extract` 插件从所选页面中提取文本（最多处理 `agents.defaults.pdfMaxPages` 页，默认为 `20`）。该插件使用 `clawpdf` 软件包（PDFium WebAssembly）提取文本和图像。
2. 如果提取的文本少于 `200` 个字符，则将相同页面渲染为 PNG 图像。总渲染预算为 `4,000,000` 像素，由所有需要图像的页面共享（按剩余页面数成比例分配，而不是为每页单独分配）；因此，已有足够文本的页面会完全跳过渲染。
3. 将提取的文本（以及所有已渲染图像）与提示词一起发送到所选模型。

详细信息：

- 加密 PDF 使用顶层 `password` 参数打开。
- 如果模型不支持图像输入，且没有可提取的文本，工具会报错。
- 如果图像渲染失败，OpenClaw 会丢弃图像，并继续使用提取的文本。
- 如果目标模型仅支持文本，而提取过程生成了图像，OpenClaw 会丢弃图像，仅发送文本。

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

| 键                              | 默认值 | 含义                                                                                         |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | 未设置 | 显式指定 PDF 主模型/回退模型；依次回退到 `imageModel` 和会话模型。                            |
| `agents.defaults.pdfMaxBytesMb` | `10`   | 每个 PDF 的大小上限，单位为 MB。                                                              |
| `agents.defaults.pdfMaxPages`   | `20`   | 每个 PDF 最多处理的页数。                                                                     |

有关字段的完整详情，请参阅[配置参考](/zh-CN/gateway/config-agents#agent-defaults)。

## 输出详情

工具在 `content[0].text` 中返回文本，并在 `details` 中返回结构化元数据。

常见的 `details` 字段：

- `model`：解析后的模型引用（`provider/model`）
- `native`：原生提供商模式为 `true`，回退模式为 `false`
- `attempts`：成功前失败的回退尝试

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：`details.pdfs[]`，其中包含 `pdf` 条目
- 沙箱路径重写元数据（如适用）：`rewrittenFrom`

## 错误行为

| 条件                              | 结果                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| 未提供 PDF 输入                   | 抛出 `pdf required: provide a path or URL to a PDF document`   |
| 超过 10 个 PDF                    | `details.error = "too_many_pdfs"`                              |
| 不支持的引用方案                  | `details.error = "unsupported_pdf_reference"`                  |
| 对原生提供商使用 `pages`          | 抛出 `pages is not supported with native PDF providers`        |
| 对原生提供商使用 `password`       | 抛出 `password is not supported with native PDF providers`     |

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

使用页面筛选的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

通过提取回退处理加密 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 相关内容

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - `pdfMaxBytesMb` 和 `pdfMaxPages` 配置
