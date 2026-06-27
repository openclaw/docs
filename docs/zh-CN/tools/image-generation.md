---
read_when:
    - 通过智能体生成或编辑图像
    - 配置图像生成提供商和模型
    - 理解 image_generate 工具参数
sidebarTitle: Image generation
summary: 通过 `image_generate` 在 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 中生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-06-27T03:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具让智能体使用你配置的提供商创建和编辑图像。在聊天会话中，图像生成会异步运行：OpenClaw 会记录一个后台任务，立即返回任务 ID，并在提供商完成后唤醒智能体。完成智能体会遵循会话的正常可见回复模式：配置后自动投递最终回复，或在会话要求使用消息工具时使用 `message(action="send")`。如果请求方会话处于非活动状态，或其主动唤醒失败，并且完成回复中仍缺少某些生成图像，OpenClaw 会发送一个幂等的直接兜底回复，其中只包含缺失的图像。

<Note>
该工具仅在至少有一个图像生成提供商可用时才会出现。如果你在智能体的工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`，设置提供商 API key，或使用 OpenAI ChatGPT/Codex OAuth 登录。
</Note>

## 快速开始

<Steps>
  <Step title="配置认证">
    为至少一个提供商设置 API key（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登录。
  </Step>
  <Step title="选择默认模型（可选）">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。配置 `openai` OAuth 配置文件后，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是先尝试 `OPENAI_API_KEY`。显式的 `models.providers.openai` 配置（API key、自定义/Azure base URL）会重新选择直接 OpenAI Images API 路由。

  </Step>
  <Step title="询问智能体">
    _“生成一张友好机器人吉祥物的图片。”_

    智能体会自动调用 `image_generate`。无需工具 allow-listing；只要提供商可用，它就会默认启用。该工具会返回后台任务 ID，然后完成智能体会在生成的附件准备好后，通过 `message` 工具发送它。

  </Step>
</Steps>

<Warning>
对于 LocalAI 等 OpenAI 兼容的 LAN 端点，请保留自定义 `models.providers.openai.baseUrl`，并通过 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 显式选择启用。私有和内部图像端点默认仍会被阻止。
</Warning>

## 常见路由

| 目标                                                 | 模型引用                                           | 认证                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 订阅认证的 OpenAI 图像生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 图像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表现力/风格定向生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 图像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 图像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 图像生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 图像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一个 `image_generate` 工具会处理文生图和参考图像编辑。使用 `image` 传入一张参考图，或使用 `images` 传入多张参考图。对于 fal 上的 Krea 2 模型，这些参考图会作为风格参考发送，而不是作为编辑输入。
提供商支持的输出提示（如 `quality`、`outputFormat` 和 `background`）会在可用时转发；如果提供商不支持，则会报告为已忽略。内置透明背景支持仅限 OpenAI；如果其他提供商的后端会输出 PNG alpha，它们仍可能保留透明度。

## 支持的提供商

| 提供商          | 默认模型                           | 编辑支持                       | 认证                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 张图像，按工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 张图像）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（模型特定限制）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 张输入图像）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（仅 MAI-Image-2.5 模型）    | `AZURE_OPENAI_API_KEY` 或 Entra ID（`az login`）       |
| MiniMax           | `image-01`                              | 是（主体参考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| OpenAI            | `gpt-image-2`                           | 是（最多 4 张图像）               | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 5 张图像）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在运行时检查可用的提供商和模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 检查当前会话的活动图像生成任务：

```text
/tool image_generate action=status
```

## 提供商能力

| 能力            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数量）  | 工作流定义   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 编辑 / 参考      | 1 张图像（工作流） | 1 张图像   | Flux：1；GPT：10；Krea 风格参考：10；NB2：14 | 最多 5 张图像 | 1 张图像           | 1 张图像（主体参考） | 最多 5 张图像 | -     | 最多 5 张图像 |
| 尺寸控制          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最高 4K       | -     | -              |
| 宽高比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 分辨率（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K、2K         |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 检查活动会话任务，或使用 `"list"` 在运行时检查可用的提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `openai/gpt-image-2`）。使用 `openai/gpt-image-1.5` 生成透明 OpenAI 背景。
</ParamField>
<ParamField path="image" type="string">
  编辑模式的一张参考图像路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  编辑模式或风格参考模型的多张参考图像（通过共享工具最多 10 张；仍适用提供商特定限制）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  宽高比：`1:1`、`2:3`、`3:2`、`2.35:1`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、`4:1`、`1:4`、`8:1`、`1:8`。提供商会验证其模型特定子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>分辨率提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供商支持时使用的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供商支持时使用的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供商支持时使用的背景提示。对于具备透明度能力的提供商，请将 `transparent` 与 `outputFormat: "png"` 或 `"webp"` 搭配使用。
</ParamField>
<ParamField path="count" type="number">要生成的图像数量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  可选的提供商请求超时时间，单位为毫秒。当 Codex 通过动态工具调用 `image_generate` 时，此单次调用值仍会覆盖配置的默认值，并上限为 600000 ms。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  仅 OpenAI 使用的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 创意控制。默认为 `medium`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当兜底提供商支持相近的几何选项而不是请求的精确选项时，OpenClaw 会在提交前重新映射到最接近的受支持尺寸、宽高比或分辨率。不支持的输出提示会针对未声明支持的提供商丢弃，并在工具结果中报告。工具结果会报告已应用的设置；`details.normalization` 会捕获任何从请求值到应用值的转换。
</Note>

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### 提供商选择顺序

OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了该参数）。
2. 配置中的 **`imageGenerationModel.primary`**。
3. 按顺序使用 **`imageGenerationModel.fallbacks`**。
4. **自动检测** - 仅使用有凭证支持的提供商默认值：
   - 先使用当前默认提供商；
   - 再按 provider-id 顺序使用其余已注册的图像生成提供商。

如果某个提供商失败（凭证错误、速率限制等），会自动尝试下一个已配置的候选项。如果全部失败，错误会包含每次尝试的详细信息。

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    每次调用的 `model` 覆盖项只会尝试该提供商/模型，不会继续使用已配置的 primary/fallback 或自动检测到的提供商。
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    只有当 OpenClaw 能够实际认证某个提供商时，该提供商默认值才会进入候选列表。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="Timeouts">
    为较慢的图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。每次调用的 `timeoutMs` 工具参数会覆盖已配置的默认值，而已配置的默认值会覆盖插件提供的提供商默认值。Google 和 OpenRouter 托管的图像提供商默认使用 180 秒；Microsoft Foundry MAI、xAI 和 Azure OpenAI 图像生成使用 600 秒。Codex dynamic-tool 调用使用 120 秒的 `image_generate` 桥接默认值，并在配置后遵循相同的超时预算，且受 OpenClaw 600000 ms dynamic-tool 桥接最大值限制。
  </Accordion>
  <Accordion title="Inspect at runtime">
    使用 `action: "list"` 检查当前已注册的提供商、它们的默认模型以及凭证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。fal 上的 Krea 2 模型使用相同的 `image` / `images` 字段作为风格参考，而不是编辑输入。传入参考图像路径或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图像。fal 对 Flux 图生图支持 1 张参考图像，对 GPT Image 2 编辑最多支持 10 张，对 Krea 2 最多支持 10 张风格参考，对 Nano Banana 2 编辑最多支持 14 张。Microsoft Foundry、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深度说明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了 `openai` OAuth 配置文件，OpenClaw 会复用 Codex 订阅聊天模型使用的同一个 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求。旧版 Codex 基础 URL，例如 `https://chatgpt.com/backend-api`，会为图像请求规范化为 `https://chatgpt.com/backend-api/codex`。OpenClaw **不会** 对该请求静默回退到 `OPENAI_API_KEY` - 若要强制使用直接 OpenAI Images API 路由，请使用 API key、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。

    仍然可以显式选择 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和 `openai/gpt-image-1-mini` 模型。使用 `gpt-image-1.5` 生成透明背景 PNG/WebP 输出；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 通过同一个 `image_generate` 工具同时支持文生图生成和参考图像编辑。OpenClaw 会将 `prompt`、`count`、`size`、`quality`、`outputFormat` 和参考图像转发给 OpenAI。OpenAI **不会** 直接接收 `aspectRatio` 或 `resolution`；在可能时，OpenClaw 会将它们映射到受支持的 `size`，否则工具会将它们报告为已忽略的覆盖项。

    OpenAI 专用选项位于 `openai` 对象下：

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；透明输出需要 `outputFormat` 为 `png` 或 `webp`，并且需要支持透明度的 OpenAI 图像模型。OpenClaw 会将默认 `gpt-image-2` 透明背景请求路由到 `gpt-image-1.5`。`openai.outputCompression` 适用于 JPEG/WebP 输出，并会在 PNG 输出中被忽略。

    顶层 `background` 提示是提供商中立的；当前在选择 OpenAI provider 时，它会映射到相同的 OpenAI `background` 请求字段。未声明支持背景的提供商会在 `ignoredOverrides` 中返回它，而不是接收不受支持的参数。

    若要通过 Azure OpenAI 部署而不是 `api.openai.com` 路由 OpenAI 图像生成，请参阅 [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Microsoft Foundry 图像生成使用 `microsoft-foundry/` 提供商前缀下已部署的 MAI 图像部署名称。没有提供商级默认模型，因为 MAI API 期望你在 `model` 字段中提供部署名称：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    该提供商使用 Microsoft Foundry 的 MAI API，而不是 OpenAI Images API：

    - 生成端点：`/mai/v1/images/generations`
    - 编辑端点：`/mai/v1/images/edits`
    - 凭证：`AZURE_OPENAI_API_KEY` / 提供商 API key，或通过 `az login` 使用 Entra ID
    - 输出：一张 PNG 图像
    - 尺寸：默认 `1024x1024`；宽度和高度都必须至少为 768 px，总像素数最多为 1,048,576
    - 编辑：一张 PNG 或 JPEG 参考图像，仅 `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署支持

    仅提示词生成可以使用自定义部署名称，只需配置 Foundry 端点。使用自定义部署名称进行编辑需要新手引导/模型元数据，以便 OpenClaw 验证该部署由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 支持。

    当前 MAI 图像模型为 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、`MAI-Image-2e` 和 `MAI-Image-2`。有关设置和聊天模型行为，请参阅 [Microsoft Foundry 插件](/zh-CN/plugins/reference/microsoft-foundry)。

  </Accordion>
  <Accordion title="OpenRouter image models">
    OpenRouter 图像生成使用相同的 `OPENROUTER_API_KEY`，并通过 OpenRouter 的聊天补全图像 API 路由。使用 `openrouter/` 前缀选择 OpenRouter 图像模型：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw 会将 `prompt`、`count`、参考图像以及 Gemini 兼容的 `aspectRatio` / `resolution` 提示转发给 OpenRouter。当前内置的 OpenRouter 图像模型快捷方式包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用 `action: "list"` 查看你配置的插件暴露了哪些内容。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型使用 fal 原生 Krea schema，而不是 Flux 使用的通用 `image_size` schema。OpenClaw 会发送：

    - `aspect_ratio` 用于宽高比提示
    - `creativity`，默认值为 `medium`
    - 提供 `image` 或 `images` 时发送 `image_style_references`

    选择 Krea 2 Medium 可获得更快且富有表现力的插画效果，选择 Krea 2 Large 可获得更慢但更细致的照片级真实感和纹理效果：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 当前每个请求返回一张图像。对 Krea 优先使用 `aspectRatio`；OpenClaw 会将 `size` 映射到最接近的受支持 Krea 宽高比，并会拒绝 Krea 的 `resolution`，而不是丢弃它。当你需要原生 Krea 创意级别时，请使用 `fal.creativity`：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax 图像生成可通过两个内置 MiniMax 凭证路径使用：

    - API-key 设置使用 `minimax/image-01`
    - OAuth 设置使用 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    内置 xAI 提供商对仅提示词请求使用 `/v1/images/generations`，当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 数量：最多 4 张
    - 参考：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 输出：作为 OpenClaw 管理的图像附件返回

    OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、`user` 或额外的仅原生宽高比，直到这些控制项存在于共享的跨提供商 `image_generate` 契约中。

  </Accordion>
</AccordionGroup>

## 示例

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

同样的 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 标志也可用于 `openclaw infer image edit`；
`--openai-background` 仍作为 OpenAI 专用别名保留。除 OpenAI 之外的内置提供商
目前不声明显式背景控制，因此
`background: "transparent"` 会被报告为对它们已忽略。

## 相关

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [ComfyUI](/zh-CN/providers/comfy) - 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [fal](/zh-CN/providers/fal) - fal 图像和视频提供商设置
- [Google (Gemini)](/zh-CN/providers/google) - Gemini 图像提供商设置
- [Microsoft Foundry 插件](/zh-CN/plugins/reference/microsoft-foundry) - Microsoft Foundry 聊天和 MAI 图像设置
- [MiniMax](/zh-CN/providers/minimax) - MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) - OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) - Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) - Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) - 模型配置和故障转移
