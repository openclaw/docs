---
read_when:
    - 你正在安装、配置或审核 microsoft-foundry 插件
summary: 为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。
title: Microsoft Foundry 插件
x-i18n:
    generated_at: "2026-07-11T20:47:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry 插件

为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。

## 分发

- 软件包：`@openclaw/microsoft-foundry`
- 安装途径：内置于 OpenClaw

## 接口

提供商：microsoft-foundry；契约：imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 图像生成提供商：`microsoft-foundry`

## 要求

- 具有部署的 Microsoft Foundry 或 Azure AI Foundry 资源。
- 通过 `AZURE_OPENAI_API_KEY` 或已配置的提供商 API key 进行 API key 身份验证。
- 对于 Entra ID 身份验证，请安装 Azure CLI，并在新手引导前运行 `az login`。OpenClaw 通过 `az account get-access-token` 刷新 Microsoft Foundry 运行时令牌。

## 聊天模型

Microsoft Foundry 聊天部署使用提供商模型引用 `microsoft-foundry/<deployment-name>`。新手引导使用 Azure CLI 发现 Foundry 资源和部署，然后将所选部署名称写入模型配置。

对于受支持的 OpenAI 兼容聊天 API，OpenClaw 使用 Foundry `/openai/v1` 端点：

- GPT、`o*`、`computer-use-preview` 和 DeepSeek-V4 模型系列默认使用 `openai-responses`。
- 除非明确配置了受支持的 API，否则 MAI-DS-R1 和其他聊天补全部署使用 `openai-completions`。
- MAI-DS-R1 通过推理内容而非 `reasoning_effort` 记录为支持推理。其上下文和输出令牌元数据均为 163,840 个令牌。

Microsoft Foundry 中的 Anthropic Claude 部署使用 Anthropic Messages API 格式，而非 OpenAI 兼容的 `/openai/v1` 格式。在 Microsoft Foundry 插件提供原生 Anthropic 运行时之前，请将这些部署配置为自定义 `anthropic-messages` 提供商。当 Foundry 部署名称与 Claude 模型 ID 不同时，请在模型条目中设置 `params.canonicalModelId`，以便 OpenClaw 应用特定于模型的线缆协议契约、正确映射 `/think off`，并安全保留已签名的思考内容。

## MAI 图像生成

该插件使用当前 Microsoft AI 图像模型，为 `image_generate` 注册 `microsoft-foundry`：

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

使用已部署的 MAI 图像部署名称作为模型引用。该提供商不声明默认图像模型，因为 MAI API 要求在请求的 `model` 字段中提供你的部署名称：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

仅提示词生成调用 Microsoft Foundry 的 MAI 生成端点：`/mai/v1/images/generations`。参考图像编辑调用 `/mai/v1/images/edits`，且仅限 `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署。

仅提示词生成只需配置 Foundry 端点，即可使用自定义部署名称。使用自定义部署名称进行图像编辑时，请通过新手引导选择部署，或包含模型元数据，以便 OpenClaw 验证该部署由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 提供支持。

MAI 图像限制：

- 输出：每个请求生成一张 PNG 图像。
- 尺寸：默认为 `1024x1024`；宽度和高度都必须至少为 768 像素。
- 总像素数：宽度 × 高度不得超过 1,048,576。
- 编辑：一张 PNG 或 JPEG 输入图像。
- 不受支持的共享提示（例如 `aspectRatio`、`resolution`、`quality`、`background` 和非 PNG 的 `outputFormat`）不会发送到 Microsoft Foundry。

## 故障排查

- `az: command not found`：安装 Azure CLI 或使用 API key 身份验证。
- `Microsoft Foundry endpoint missing for MAI image generation`：通过新手引导选择 Foundry 部署，或添加 `models.providers.microsoft-foundry.baseUrl`。
- `supports MAI image deployments only`：所选图像模型指向非 MAI 部署。请为 `image_generate` 使用已部署的 MAI 图像模型。

<!-- openclaw-plugin-reference:manual-end -->
