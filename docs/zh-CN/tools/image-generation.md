---
read_when:
    - 通过智能体生成或编辑图像
    - 配置图像生成提供商和模型
    - 理解 `image_generate` 工具参数
sidebarTitle: Image generation
summary: 通过 OpenAI、Google、fal、MiniMax、ComfyUI、OpenRouter、LiteLLM、xAI、Vydra 使用 `image_generate` 生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-04-26T05:36:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 工具让智能体能够使用你已配置的提供商创建和编辑图像。生成的图像会自动作为媒体附件附在智能体的回复中。

<Note>
只有在至少有一个图像生成提供商可用时，此工具才会出现。如果你在智能体的工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

<Steps>
  <Step title="配置认证">
    为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登录。
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

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是优先尝试 `OPENAI_API_KEY`。显式配置 `models.providers.openai`（API 密钥、自定义/Azure base URL）会切换回直接使用 OpenAI Images API 的路由。

  </Step>
  <Step title="向智能体发出请求">
    _“生成一张友好机器人吉祥物的图片。”_

    智能体会自动调用 `image_generate`。无需配置工具允许列表——当提供商可用时，它默认启用。

  </Step>
</Steps>

<Warning>
对于 OpenAI 兼容的局域网端点，例如 LocalAI，请保留自定义 `models.providers.openai.baseUrl`，并显式启用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。默认情况下，私有和内部图像端点仍会被阻止。
</Warning>

## 常见路线

| 目标 | 模型引用 | 认证 |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成 | `openai/gpt-image-2` | `OPENAI_API_KEY` |
| 使用 Codex 订阅认证的 OpenAI 图像生成 | `openai/gpt-image-2` | OpenAI Codex OAuth |
| OpenAI 透明背景 PNG/WebP | `openai/gpt-image-1.5` | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter 图像生成 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY` |
| LiteLLM 图像生成 | `litellm/gpt-image-2` | `LITELLM_API_KEY` |
| Google Gemini 图像生成 | `google/gemini-3.1-flash-image-preview` | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

同一个 `image_generate` 工具同时处理文生图和参考图像编辑。单张参考图像使用 `image`，多张参考图像使用 `images`。当提供商支持时，诸如 `quality`、`outputFormat` 和 `background` 之类的输出提示会被转发；如果提供商不支持，它们会被报告为已忽略。内置透明背景支持仅适用于 OpenAI；其他提供商如果其后端输出支持，也可能保留 PNG alpha 通道。

## 支持的提供商

| 提供商 | 默认模型 | 编辑支持 | 认证 |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI | `workflow` | 是（1 张图像，由工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal | `fal-ai/flux/dev` | 是 | `FAL_KEY` |
| Google | `gemini-3.1-flash-image-preview` | 是 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |
| LiteLLM | `gpt-image-2` | 是（最多 5 张输入图像） | `LITELLM_API_KEY` |
| MiniMax | `image-01` | 是（主体参考） | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| OpenAI | `gpt-image-2` | 是（最多 4 张图像） | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像） | `OPENROUTER_API_KEY` |
| Vydra | `grok-imagine` | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-image` | 是（最多 5 张图像） | `XAI_API_KEY` |

使用 `action: "list"` 可在运行时查看可用的提供商和模型：

```text
/tool image_generate action=list
```

## 提供商能力

| 能力 | ComfyUI | fal | Google | MiniMax | OpenAI | Vydra | xAI |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数量） | 由工作流定义 | 4 | 4 | 9 | 4 | 1 | 4 |
| 编辑 / 参考 | 1 张图像（工作流） | 1 张图像 | 最多 5 张图像 | 1 张图像（主体参考） | 最多 5 张图像 | — | 最多 5 张图像 |
| 尺寸控制 | — | ✓ | ✓ | — | 最高 4K | — | — |
| 宽高比 | — | ✓（仅生成） | ✓ | ✓ | — | — | ✓ |
| 分辨率（1K/2K/4K） | — | ✓ | ✓ | — | — | — | 1K、2K |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 时必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在运行时查看可用的提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `openai/gpt-image-2`）。透明 OpenAI 背景请使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  编辑模式下的单张参考图像路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  编辑模式下的多张参考图像（在支持的提供商上最多 5 张）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>分辨率提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  当提供商支持时的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  当提供商支持时的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  当提供商支持时的背景提示。对于支持透明度的提供商，请将 `transparent` 与 `outputFormat: "png"` 或 `"webp"` 一起使用。
</ParamField>
<ParamField path="count" type="number">要生成的图像数量（1–4）。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时时间（毫秒）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  仅适用于 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当某个回退提供商支持接近的几何选项，但不支持精确请求值时，OpenClaw 会在提交前将其重映射为最接近的受支持尺寸、宽高比或分辨率。不受支持的输出提示会被从未声明支持这些功能的提供商请求中移除，并在工具结果中报告。工具结果会报告实际应用的设置；`details.normalization` 会记录从请求值到应用值的任何转换。
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
3. 按顺序尝试 **`imageGenerationModel.fallbacks`**。
4. **自动检测**——仅限基于认证的提供商默认值：
   - 先尝试当前默认提供商；
   - 再按 provider-id 顺序尝试其余已注册的图像生成提供商。

如果某个提供商失败（认证错误、速率限制等），会自动尝试下一个已配置候选项。如果全部失败，错误信息会包含每次尝试的详情。

<AccordionGroup>
  <Accordion title="每次调用的模型覆盖是精确匹配">
    每次调用的 `model` 覆盖只会尝试该提供商/模型，不会继续尝试已配置的主模型/回退模型或自动检测到的提供商。
  </Accordion>
  <Accordion title="自动检测会感知认证状态">
    只有当 OpenClaw 实际能够为某个提供商完成认证时，该提供商默认值才会进入候选列表。将 `agents.defaults.mediaGenerationAutoProviderFallback: false` 设为禁用，即可只使用显式的 `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="超时">
    为较慢的图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。每次调用的 `timeoutMs` 工具参数会覆盖已配置的默认值。
  </Accordion>
  <Accordion title="在运行时查看">
    使用 `action: "list"` 查看当前已注册的提供商、它们的默认模型以及认证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图像路径或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图像。fal、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深入说明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了 `openai-codex` OAuth 配置文件，OpenClaw 会复用 Codex 订阅聊天模型所使用的同一 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求。对于图像请求，旧版 Codex base URL（例如 `https://chatgpt.com/backend-api`）会被规范化为 `https://chatgpt.com/backend-api/codex`。OpenClaw **不会** 针对此请求静默回退到 `OPENAI_API_KEY`——若要强制直接路由到 OpenAI Images API，请显式配置 `models.providers.openai`，并提供 API 密钥、自定义 base URL 或 Azure 端点。

    显式选择 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和 `openai/gpt-image-1-mini` 模型。透明背景的 PNG/WebP 输出请使用 `gpt-image-1.5`；当前的 `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 同时支持文生图生成和参考图像编辑，且都通过同一个 `image_generate` 工具完成。OpenClaw 会将 `prompt`、`count`、`size`、`quality`、`outputFormat` 和参考图像转发给 OpenAI。OpenAI **不会** 直接接收 `aspectRatio` 或 `resolution`；在可能的情况下，OpenClaw 会将它们映射为受支持的 `size`，否则工具会将它们报告为被忽略的覆盖项。

    OpenAI 专属选项位于 `openai` 对象下：

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

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；透明输出要求 `outputFormat` 为 `png` 或 `webp`，并且使用支持透明度的 OpenAI 图像模型。对于默认的 `gpt-image-2` 透明背景请求，OpenClaw 会将其路由到 `gpt-image-1.5`。`openai.outputCompression` 适用于 JPEG/WebP 输出。

    顶层 `background` 提示是提供商无关的；当前在选择 OpenAI provider 时，它会映射到同一个 OpenAI `background` 请求字段。对于未声明支持背景控制的提供商，它会出现在 `ignoredOverrides` 中，而不是将不受支持的参数发送给该提供商。

    若要通过 Azure OpenAI 部署而不是 `api.openai.com` 路由 OpenAI 图像生成，请参阅 [Azure OpenAI endpoints](/zh-CN/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 图像模型">
    OpenRouter 图像生成使用相同的 `OPENROUTER_API_KEY`，并通过 OpenRouter 的 chat completions 图像 API 路由。使用 `openrouter/` 前缀来选择 OpenRouter 图像模型：

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

    OpenClaw 会将 `prompt`、`count`、参考图像以及兼容 Gemini 的 `aspectRatio` / `resolution` 提示转发给 OpenRouter。当前内置的 OpenRouter 图像模型快捷项包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用 `action: "list"` 可查看你当前配置的插件暴露了哪些内容。

  </Accordion>
  <Accordion title="MiniMax 双重认证">
    MiniMax 图像生成可通过两种内置的 MiniMax 认证路径使用：

    - 用于 API 密钥配置的 `minimax/image-01`
    - 用于 OAuth 配置的 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    内置的 xAI 提供商在仅提示词请求时使用 `/v1/images/generations`，而在存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 数量：最多 4 张
    - 参考图：单个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 输出：以 OpenClaw 管理的图像附件形式返回

    在这些控制项尚未进入共享的跨提供商 `image_generate` 契约之前，OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、`user` 或其他仅原生支持的宽高比选项。

  </Accordion>
</AccordionGroup>

## 示例

<Tabs>
  <Tab title="生成（4K 横向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
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
  <Tab title="生成（两张方图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="编辑（单张参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="编辑（多张参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

在 `openclaw infer image edit` 上也可以使用相同的 `--output-format` 和 `--background` 标志；`--openai-background` 仍然保留为 OpenAI 专属别名。除 OpenAI 之外的内置提供商目前不声明支持显式背景控制，因此对它们而言，`background: "transparent"` 会被报告为已忽略。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [ComfyUI](/zh-CN/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [fal](/zh-CN/providers/fal) — fal 图像和视频提供商设置
- [Google（Gemini）](/zh-CN/providers/google) — Gemini 图像提供商设置
- [MiniMax](/zh-CN/providers/minimax) — MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) — OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) — 模型配置和故障切换
