---
read_when:
    - 你正在安装、配置或审计 microsoft-foundry 插件
summary: 为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。
title: Microsoft Foundry 插件
x-i18n:
    generated_at: "2026-06-27T02:49:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry 插件

为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。

## 分发

- 包：`@openclaw/microsoft-foundry`
- 安装路径：包含在 OpenClaw 中

## 表面

提供商：microsoft-foundry；契约：imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 图像生成提供商：`microsoft-foundry`

## 要求

- 一个带有部署的 Microsoft Foundry 或 Azure AI Foundry 资源。
- 通过 `AZURE_OPENAI_API_KEY` 或已配置的提供商 API key 进行 API key 认证。
- 对于 Entra ID 认证，请安装 Azure CLI，并在新手引导前运行 `az login`。OpenClaw 会通过 `az account get-access-token` 刷新 Microsoft Foundry 运行时令牌。

## 聊天模型

Microsoft Foundry 聊天部署使用提供商模型引用 `microsoft-foundry/<deployment-name>`。新手引导会使用 Azure CLI 发现 Foundry 资源和部署，然后将选定的部署名称写入模型配置。

OpenClaw 对受支持的 OpenAI 兼容聊天 API 使用 Foundry `/openai/v1` 端点：

- GPT、`o*`、`computer-use-preview` 和 DeepSeek-V4 模型系列默认使用 `openai-responses`。
- MAI-DS-R1 和其他聊天补全部署使用 `openai-completions`，除非配置了明确受支持的 API。
- MAI-DS-R1 通过推理内容记录为具备推理能力，而不是通过 `reasoning_effort`。它的上下文和输出令牌元数据为 163,840 个令牌。

Microsoft Foundry 中的 Anthropic Claude 部署使用 Anthropic Messages API 形态，而不是 OpenAI 兼容的 `/openai/v1` 形态。在 Microsoft Foundry 插件增加原生 Anthropic 运行时之前，请将这些部署配置为自定义 `anthropic-messages` 提供商。当 Foundry 部署名称不同于 Claude 模型 ID 时，在模型条目上设置 `params.canonicalModelId`，这样 OpenClaw 就能应用模型专属的线路契约、正确映射 `/think off`，并安全保留签名思考。

## MAI 图像生成

该插件为 `image_generate` 注册 `microsoft-foundry`，并支持当前的 Microsoft AI 图像模型：

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

使用已部署的 MAI 图像部署名称作为模型引用。该提供商不会声明默认图像模型，因为 MAI API 要求在请求的 `model` 字段中提供你的部署名称：

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

仅提示词生成会调用 Microsoft Foundry 的 MAI 生成端点：`/mai/v1/images/generations`。参考图像编辑会调用 `/mai/v1/images/edits`，并且仅限于 `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署。

仅提示词生成可以只配置 Foundry 端点并使用自定义部署名称。对于使用自定义部署名称的图像编辑，请通过新手引导选择部署，或包含模型元数据，以便 OpenClaw 可以验证该部署由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 提供支持。

MAI 图像约束：

- 输出：每个请求一张 PNG 图像。
- 尺寸：默认 `1024x1024`；宽度和高度都必须至少为 768 px。
- 总像素：宽度 × 高度最多为 1,048,576。
- 编辑：一张 PNG 或 JPEG 输入图像。
- 不支持的共享提示（例如 `aspectRatio`、`resolution`、`quality`、`background` 和非 PNG 的 `outputFormat`）不会发送到 Microsoft Foundry。

## 故障排除

- `az: command not found`：安装 Azure CLI 或使用 API key 认证。
- `Microsoft Foundry endpoint missing for MAI image generation`：通过新手引导选择 Foundry 部署，或添加 `models.providers.microsoft-foundry.baseUrl`。
- `supports MAI image deployments only`：选定的图像模型指向非 MAI 部署。请为 `image_generate` 使用已部署的 MAI 图像模型。

<!-- openclaw-plugin-reference:manual-end -->
