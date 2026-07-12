---
read_when:
    - 通过智能体生成或编辑图像
    - 配置图像生成提供商和模型
    - 理解 `image_generate` 工具参数
sidebarTitle: Image generation
summary: 通过 image_generate 在 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 上生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-07-12T14:48:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具通过你配置的提供商创建和编辑图像。在聊天会话中，它会异步运行：OpenClaw 会记录一个后台任务，立即返回任务 ID，并在提供商完成后唤醒智能体。完成任务的智能体遵循会话正常的可见回复模式：配置后自动发送最终回复，或者在会话要求使用消息工具时调用 `message(action="send")`。如果请求方会话处于非活动状态，或者其主动唤醒失败，OpenClaw 会直接发送包含生成图像的幂等回退消息，以免结果丢失。

<Note>
仅当至少有一个图像生成提供商可用时，才会显示此工具。如果你在智能体的工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI ChatGPT/Codex OAuth 登录。
</Note>

## 快速开始

<Steps>
  <Step title="配置身份验证">
    为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、
    `GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登录。
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

    ChatGPT/Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。配置
    `openai` OAuth 配置文件后，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是先尝试 `OPENAI_API_KEY`。
    显式配置 `models.providers.openai`（API 密钥、自定义/Azure 基础 URL）
    会重新启用直接调用 OpenAI Images API 的路由。

  </Step>
  <Step title="向智能体提出请求">
    _“生成一张友好机器人吉祥物的图像。”_

    智能体会自动调用 `image_generate`。无需将工具加入允许列表——只要有提供商可用，它就会默认启用。该工具会返回后台任务 ID，随后完成任务的智能体会在图像准备就绪后，通过 `message` 工具发送生成的附件。

  </Step>
</Steps>

<Warning>
对于 LocalAI 等兼容 OpenAI 的局域网端点，请保留自定义的
`models.providers.openai.baseUrl`，并使用
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 显式启用。默认情况下，私有和内部图像端点仍会被阻止。
</Warning>

## 常用路由

| 目标                                                 | 模型引用                                           | 身份验证                               |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成                      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 订阅身份验证的 OpenAI 图像生成            | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP                             | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 图像生成                                   | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表现力/风格导向生成                       | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 图像生成                                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 图像生成                                     | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 图像生成                       | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 图像生成                               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一个工具可处理文生图和参考图像编辑。使用 `image` 提供一张参考图，或使用 `images` 提供多张参考图。对于 fal 上的 Krea 2 模型，这些参考图会作为风格参考发送，而不是作为编辑输入。
提供商支持的输出提示（例如 `quality`、`outputFormat` 和
`background`）会在可用时转发；如果提供商未声明支持，则会报告为已忽略。内置的透明背景支持仅适用于 OpenAI；如果其他提供商的后端会输出 PNG Alpha 通道，也可能保留透明度。

## 支持的提供商

| 提供商            | 默认模型                                | 编辑支持                           | 身份验证                                              |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 张图像，由工作流配置）       | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`     |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 张图像）                     | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（具体限制取决于模型）           | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 是（最多 5 张图像）                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 张输入图像）            | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（仅限 MAI-Image-2.5 模型）      | `AZURE_OPENAI_API_KEY` 或 Entra ID（`az login`）      |
| MiniMax           | `image-01`                              | 是（主体参考）                     | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`）|
| OpenAI            | `gpt-image-2`                           | 是（最多 5 张图像）                | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像）            | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 3 张图像）                | `XAI_API_KEY`                                         |

使用 `action: "list"` 在运行时检查可用的提供商和模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 检查当前会话中处于活动状态的图像生成任务：

```text
/tool image_generate action=status
```

## 提供商能力

| 能力                  | ComfyUI                | DeepInfra | fal                                                | Google           | Microsoft Foundry | MiniMax                 | OpenAI           | Vydra | xAI              |
| --------------------- | ---------------------- | --------- | -------------------------------------------------- | ---------------- | ----------------- | ----------------------- | ---------------- | ----- | ---------------- |
| 生成（最大数量）      | 1                      | 4         | 4                                                  | 4                | 1                 | 9                       | 4                | 1     | 4                |
| 编辑/参考             | 1 张图像（工作流）     | 1 张图像  | Flux：1；GPT：10；Krea 风格参考：10；NB2：14       | 最多 5 张图像    | 1 张图像          | 1 张图像（主体参考）    | 最多 5 张图像    | -     | 最多 3 张图像    |
| 尺寸控制              | -                      | ✓         | ✓                                                  | ✓                | ✓                 | -                       | 最高 4K          | -     | -                |
| 宽高比                | -                      | -         | ✓                                                  | ✓                | -                 | ✓                       | -                | -     | ✓                |
| 分辨率（1K/2K/4K）    | -                      | -         | ✓                                                  | ✓                | -                 | -                       | -                | -     | 1K、2K           |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 必须提供此参数。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 检查当前会话中处于活动状态的任务，或使用 `"list"` 在运行时检查可用的提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖值（例如 `openai/gpt-image-2`）。如需透明的 OpenAI 背景，请使用
  `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  用于编辑模式的单张参考图像路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  用于编辑模式或风格参考模型的多张参考图像（通过共享工具最多可提供 14 张；
  仍需遵守各提供商的特定限制）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  宽高比：`1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、
  `4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、
  `1:4`、`8:1`、`1:8`。提供商会验证其模型支持的子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>分辨率提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供商支持时使用的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供商支持时使用的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供商支持时使用的背景提示。对于支持透明度的提供商，请将 `transparent` 与
  `outputFormat: "png"` 或 `"webp"` 搭配使用。
</ParamField>
<ParamField path="count" type="number">要生成的图像数量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  可选的提供商请求超时时间，以毫秒为单位。当 Codex 通过动态工具调用
  `image_generate` 时，此单次调用值仍会覆盖配置的默认值，并且上限为 600000 ms。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  仅适用于 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 创意程度控制。默认为 `medium`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当回退提供商支持与请求值相近的几何选项，而不支持完全相同的选项时，OpenClaw 会在提交前映射到最接近的受支持尺寸、宽高比或分辨率。
对于未声明支持相应输出提示的提供商，不受支持的输出提示会被丢弃，并在工具结果中报告。工具结果会报告实际应用的设置；`details.normalization` 会记录从请求值到实际应用值的任何转换。
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

OpenClaw 按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了该参数）。
2. 配置中的 **`imageGenerationModel.primary`**。
3. 按顺序使用 **`imageGenerationModel.fallbacks`**。
4. **自动检测**——仅使用具有身份验证支持的提供商默认值：
   - 首先使用当前默认提供商；
   - 然后按提供商 ID 顺序使用其余已注册的图像生成提供商。

如果某个提供商失败（身份验证错误、速率限制等），系统会自动尝试下一个已配置的候选项。如果全部失败，错误中会包含每次尝试的详细信息。

<AccordionGroup>
  <Accordion title="每次调用的模型覆盖是精确的">
    每次调用的 `model` 覆盖只会尝试该提供商/模型，不会继续尝试已配置的主要模型、回退模型或自动检测到的提供商。
  </Accordion>
  <Accordion title="自动检测会考虑身份验证状态">
    只有当 OpenClaw 确实能够对某个提供商进行身份验证时，该提供商的默认值才会进入候选列表。将
    `agents.defaults.mediaGenerationAutoProviderFallback: false` 设置为仅使用显式的
    `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="超时">
    对于较慢的图像后端，请设置 `agents.defaults.imageGenerationModel.timeoutMs`。
    每次调用的 `timeoutMs` 工具参数会覆盖配置的默认值，而配置的默认值会覆盖插件作者设置的提供商默认值。
    Google 和 OpenRouter 托管的图像提供商默认使用 180 秒；Microsoft Foundry MAI、xAI 和 Azure OpenAI
    图像生成默认使用 600 秒。Codex 动态工具调用的 `image_generate` 桥接默认值为 120 秒，
    配置后会遵循相同的超时预算，但受 OpenClaw 动态工具桥接的 600000 毫秒上限约束。
  </Accordion>
  <Accordion title="在运行时检查">
    使用 `action: "list"` 检查当前已注册的提供商、其默认模型以及身份验证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI 和 xAI 支持编辑参考图像。fal 上的 Krea 2 模型使用相同的 `image` / `images`
字段作为风格参考，而不是编辑输入。传入参考图像路径或 URL：

```text
“生成这张照片的水彩版本” + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter 和 Google 通过 `images` 参数支持最多 5 张参考图像；xAI
支持最多 3 张。fal 对 Flux 图生图支持 1 张参考图像，对 GPT Image 2 编辑支持最多
10 张，对 Krea 2 支持最多 10 张风格参考，对 Nano Banana 2 编辑支持最多 14 张。
Microsoft Foundry、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深入解析

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了
    `openai` OAuth 配置文件，OpenClaw 会复用 Codex 订阅聊天模型所使用的同一
    OAuth 配置文件，并通过 Codex Responses 后端发送图像请求。对于图像请求，
    `https://chatgpt.com/backend-api` 等旧版 Codex 基础 URL 会被规范化为
    `https://chatgpt.com/backend-api/codex`。OpenClaw **不会**为该请求静默回退到
    `OPENAI_API_KEY`——若要强制直接路由到 OpenAI Images API，请使用 API key、
    自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。

    仍然可以显式选择 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。需要输出透明背景 PNG/WebP 时，请使用
    `gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 通过同一个 `image_generate` 工具支持文生图和参考图像编辑。
    OpenClaw 会将 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和参考图像转发给 OpenAI。OpenAI 不会直接接收 `aspectRatio` 或 `resolution`；
    OpenClaw 会尽可能将这些参数映射为受支持的 `size`，否则工具会将其报告为已忽略的覆盖项。

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

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；
    透明输出要求 `outputFormat` 为 `png` 或 `webp`，并使用支持透明度的 OpenAI 图像模型。
    OpenClaw 会将默认 `gpt-image-2` 的透明背景请求路由到 `gpt-image-1.5`。
    `openai.outputCompression` 适用于 JPEG/WebP 输出，对 PNG 输出会被忽略。

    顶层 `background` 提示与提供商无关，并且当选择 OpenAI provider 时，目前会映射到同一个
    OpenAI `background` 请求字段。未声明支持背景的提供商会在 `ignoredOverrides`
    中返回该参数，而不会接收这个不受支持的参数。

    若要通过 Azure OpenAI 部署而非 `api.openai.com` 路由 OpenAI 图像生成，请参阅
    [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 图像模型">
    Microsoft Foundry 图像生成使用 `microsoft-foundry/` 提供商前缀下已部署的 MAI
    图像部署名称。由于 MAI API 要求在 `model` 字段中填写你的部署名称，因此没有提供商级默认模型：

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
    - 身份验证：`AZURE_OPENAI_API_KEY` / 提供商 API key，或通过 `az login` 使用 Entra ID
    - 输出：一张 PNG 图像
    - 尺寸：默认 `1024x1024`；宽度和高度都必须至少为 768 px，
      总像素数不得超过 1,048,576
    - 编辑：一张 PNG 或 JPEG 参考图像，仅
      `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署支持

    仅提示词生成可以只配置 Foundry 端点并使用自定义部署名称。使用自定义部署名称进行编辑时，
    需要新手引导/模型元数据，以便 OpenClaw 验证该部署是否由
    `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 提供支持。

    当前 MAI 图像模型包括 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e` 和 `MAI-Image-2`。有关设置和聊天模型行为，请参阅
    [Microsoft Foundry 插件](/zh-CN/plugins/reference/microsoft-foundry)。

  </Accordion>
  <Accordion title="OpenRouter 图像模型">
    OpenRouter 图像生成使用相同的 `OPENROUTER_API_KEY`，并通过 OpenRouter 的聊天补全图像 API
    进行路由。使用 `openrouter/` 前缀选择 OpenRouter 图像模型：

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

    OpenClaw 会将 `prompt`、`count`、参考图像以及兼容 Gemini 的
    `aspectRatio` / `resolution` 提示转发给 OpenRouter。
    当前内置的 OpenRouter 图像模型快捷方式包括
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。
    使用 `action: "list"` 查看你配置的插件所公开的模型。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型使用 fal 原生 Krea 架构，而不是 Flux 使用的通用
    `image_size` 架构。OpenClaw 会发送：

    - 用于宽高比提示的 `aspect_ratio`
    - `creativity`，默认值为 `medium`
    - 提供 `image` 或 `images` 时发送 `image_style_references`

    选择 Krea 2 Medium 可获得速度更快、表现力更强的插画，选择 Krea 2 Large
    可获得速度较慢但细节更丰富的照片级写实和纹理效果：

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

    Krea 2 当前每次请求返回一张图像。对于 Krea，建议使用 `aspectRatio`；
    OpenClaw 会将 `size` 映射为最接近的 Krea 支持宽高比，并拒绝 Krea 的
    `resolution`，而不是将其丢弃。需要使用 Krea 原生创意级别时，请使用 `fal.creativity`：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "带有孔版印刷纹理的赛博杂志肖像",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax 双重身份验证">
    图像生成可以通过两种内置 MiniMax 身份验证路径使用：

    - 用于 API key 设置的 `minimax/image-01`
    - 用于 OAuth 设置的 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    内置 xAI 提供商对仅提示词请求使用 `/v1/images/generations`，
    当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 数量：最多 4 张
    - 参考图像：一个 `image` 或最多三个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 分辨率：`1K`、`2K`
    - 输出：以 OpenClaw 管理的图像附件形式返回

    在共享的跨提供商 `image_generate` 合约中提供这些控制项之前，OpenClaw
    有意不公开 xAI 原生的 `quality`、`mask`、`user` 或 `auto` 宽高比。

  </Accordion>
</AccordionGroup>

## 示例

<Tabs>
  <Tab title="生成（4K 横向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="一张简洁的 OpenClaw 图像生成编辑风格海报" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="透明背景上的简洁红色圆形贴纸" outputFormat=png background=transparent
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明背景上的简洁红色圆形贴纸" \
  --json
```

  </Tab>
  <Tab title="生成（OpenAI 低质量）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="一款安静高效应用的低成本海报草稿" quality=low openai='{"moderation":"low"}'
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "一款安静高效应用的低成本海报草稿" \
  --json
```

  </Tab>
  <Tab title="生成（两张正方形图像）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="为一款氛围平静的效率应用图标提供两种视觉方向" size=1024x1024 count=2
```
  </Tab>
  <Tab title="编辑（一个参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="保留主体，将背景替换为明亮的影棚布景" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="编辑（多个参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="将第一张图像中的角色特征与第二张图像的配色方案相结合" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea 风格参考图">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="使用此配色方案和印刷纹理创作一幅富有表现力的编辑风格肖像" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

`openclaw infer image edit` 同样支持 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 标志；`--openai-background` 仍作为 OpenAI 专用别名保留。目前，除 OpenAI 之外的内置提供商均未声明明确的背景控制能力，因此对于这些提供商，
`background: "transparent"` 会被报告为已忽略。

## 相关内容

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
