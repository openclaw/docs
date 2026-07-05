---
read_when:
    - 你想分析来自智能体的 PDF
    - 你需要精确的 pdf 工具参数和限制
    - 你正在调试原生 PDF 模式与提取回退方案
summary: 使用原生提供商支持和提取回退分析一个或多个 PDF 文档
title: PDF 工具
x-i18n:
    generated_at: "2026-07-05T11:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` 会分析一个或多个 PDF 文档并返回文本。它在 Anthropic 和 Google 模型上使用原生文档输入，并对其他所有提供商回退到文本/图像提取。

## 可用性

只有当 OpenClaw 能为智能体解析到支持 PDF 的模型时，该工具才会注册。解析顺序：

1. `agents.defaults.pdfModel`（显式主模型/回退模型）
2. `agents.defaults.imageModel`（显式主模型/回退模型）
3. 智能体已解析的会话/默认模型，前提是其提供商支持原生 PDF 输入（Anthropic、Google），或已经配置了视觉模型
4. 自动检测到的、支持图像/视觉且有可用凭证的提供商，优先选择原生 PDF 提供商

每个回退候选在使用前都会经过凭证检查，因此配置的 `provider/model` 只有在 OpenClaw 能为该智能体认证该提供商时才会生效。如果没有可用模型可解析，`pdf` 工具不会暴露。

## 输入参考

<ParamField path="pdf" type="string">
一个 PDF 路径或 URL。
</ParamField>

<ParamField path="pdfs" type="string[]">
多个 PDF 路径或 URL，总数最多 10 个。
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
分析提示。
</ParamField>

<ParamField path="pages" type="string">
类似 `1-5` 或 `1,3,7-9` 的页面过滤器。原生提供商模式不支持。
</ParamField>

<ParamField path="password" type="string">
加密 PDF 的密码。适用于请求中的每个 PDF；仅由提取回退模式使用。
</ParamField>

<ParamField path="model" type="string">
可选模型覆盖，格式为 `provider/model`。
</ParamField>

<ParamField path="maxBytesMb" type="number">
每个 PDF 的大小上限，单位为 MB。默认值为 `agents.defaults.pdfMaxBytesMb`；如果未设置，则为 `10`。
</ParamField>

说明：

- `pdf` 和 `pdfs` 会在加载前合并并去重；至少需要提供一个。
- `pages` 会解析为从 1 开始的页码，去重、排序，并限制到 `agents.defaults.pdfMaxPages`（默认 `20`）。如果某个范围没有匹配任何边界内页面，会在模型调用前报错。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL
- OpenClaw 管理的入站引用，例如 `media://inbound/<id>`

其他 URI 方案（例如 `ftp://`）会返回 `details.error = "unsupported_pdf_reference"`。工具在沙箱隔离中运行时，会拒绝远程 `http(s)` URL。启用仅工作区文件策略后，允许根目录之外的本地路径会被拒绝；OpenClaw 入站媒体存储下的托管入站引用和重放路径仍然允许。

## 执行模式

### 原生提供商模式

用于提供商 `anthropic` 和 `google`（目前唯一声明原生 PDF 文档支持的提供商）。原始 PDF 字节会按文件直接作为原生文档/内联 PDF 部分发送到提供商 API。

限制：

- 不支持 `pages`；如果设置，该工具会抛出 `pages is not supported with native PDF providers`。
- 不支持 `password`；如果设置，该工具会抛出 `password is not supported with native PDF providers`。加密 PDF 请使用非原生模型。

### 提取回退模式

用于其他所有提供商。

1. 通过内置的 `document-extract` 插件从所选页面（最多 `agents.defaults.pdfMaxPages`，默认 `20`）提取文本，该插件使用 `clawpdf` 包（PDFium WebAssembly）进行文本和图像提取。
2. 如果提取的文本少于 `200` 个字符，则将相同页面渲染为 PNG 图像。渲染预算总计为 `4,000,000` 像素，在所有需要图像的页面之间共享（按剩余页面比例分配，而不是按单页分配），因此已经有足够文本的文本页会完全跳过渲染。
3. 将提取的文本（以及任何已渲染的图像）加上提示发送给所选模型。

详情：

- 加密 PDF 使用顶层 `password` 参数打开。
- 如果模型没有图像输入且没有可提取文本，该工具会报错。
- 如果图像渲染失败，OpenClaw 会丢弃图像，并继续使用提取的文本。
- 如果目标模型仅支持文本且提取过程生成了图像，OpenClaw 会丢弃图像，仅发送文本。

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

| 键                              | 默认值 | 含义                                                                                   |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | 未设置 | 显式主 PDF 模型/回退 PDF 模型；回退到 `imageModel`，然后回退到会话模型。              |
| `agents.defaults.pdfMaxBytesMb` | `10`   | 每个 PDF 的大小上限，单位为 MB。                                                       |
| `agents.defaults.pdfMaxPages`   | `20`   | 每个 PDF 处理的最大页数。                                                              |

完整字段详情见[配置参考](/zh-CN/gateway/config-agents#agent-defaults)。

## 输出详情

该工具在 `content[0].text` 中返回文本，并在 `details` 中返回结构化元数据。

常见 `details` 字段：

- `model`：已解析模型引用（`provider/model`）
- `native`：原生提供商模式为 `true`，回退模式为 `false`
- `attempts`：成功前失败的回退尝试

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：`details.pdfs[]`，其中包含 `pdf` 条目
- 沙箱路径重写元数据（适用时）：`rewrittenFrom`

## 错误行为

| 条件                            | 结果                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| 没有 PDF 输入                   | 抛出 `pdf required: provide a path or URL to a PDF document`   |
| 超过 10 个 PDF                  | `details.error = "too_many_pdfs"`                              |
| 不支持的引用方案                | `details.error = "unsupported_pdf_reference"`                  |
| 原生提供商使用 `pages`          | 抛出 `pages is not supported with native PDF providers`        |
| 原生提供商使用 `password`       | 抛出 `password is not supported with native PDF providers`     |

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

带页面过滤的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

使用提取回退的加密 PDF：

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 相关

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - `pdfMaxBytesMb` 和 `pdfMaxPages` 配置
