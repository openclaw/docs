---
read_when:
    - 通过智能体生成或编辑图像
    - 配置图像生成 provider 和模型
    - 了解 `image_generate` 工具参数
sidebarTitle: Image generation
summary: 通过 `image_generate` 在 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 之间生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-04-28T00:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 工具让智能体可以使用你配置好的提供商来生成和编辑图像。生成的图像会作为媒体附件自动随智能体的回复一起发送。

<Note>
只有在至少有一个图像生成提供商可用时，这个工具才会出现。如果你在智能体工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

<Steps>
  <Step title="配置身份验证">
    为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或者使用 OpenAI Codex OAuth 登录。
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

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是优先尝试 `OPENAI_API_KEY`。显式的 `models.providers.openai` 配置（API 密钥、自定义/Azure base URL）会切换回直接使用 OpenAI Images API 路径。

  </Step>
  <Step title="向智能体发出请求">
    _“生成一张友好机器人吉祥物的图像。”_

    智能体会自动调用 `image_generate`。无需配置工具 allow-listing——当提供商可用时，它默认启用。

  </Step>
</Steps>

<Warning>
对于 LocalAI 这类兼容 OpenAI 的局域网端点，请保留自定义 `models.providers.openai.baseUrl`，并显式启用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。私有和内部图像端点默认仍会被阻止。
</Warning>

## 常见路径

| 目标 | 模型引用 | 身份验证 |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成 | `openai/gpt-image-2` | `OPENAI_API_KEY` |
| 使用 Codex 订阅身份验证的 OpenAI 图像生成 | `openai/gpt-image-2` | OpenAI Codex OAuth |
| OpenAI 透明背景 PNG/WebP | `openai/gpt-image-1.5` | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 图像生成 | `deepinfra/black-forest-labs/FLUX-1-schnell` | `DEEPINFRA_API_KEY` |
| OpenRouter 图像生成 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY` |
| LiteLLM 图像生成 | `litellm/gpt-image-2` | `LITELLM_API_KEY` |
| Google Gemini 图像生成 | `google/gemini-3.1-flash-image-preview` | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

同一个 `image_generate` 工具同时处理文生图和参考图编辑。使用 `image` 传入一张参考图，或使用 `images` 传入多张参考图。像 `quality`、`outputFormat` 和 `background` 这类提供商支持的输出提示会在可用时透传；当提供商不支持时，会报告为已忽略。内置的透明背景支持是 OpenAI 专属；其他提供商如果其后端输出支持，也可能保留 PNG alpha 通道。

## 支持的提供商

| Provider | 默认模型 | 编辑支持 | 身份验证 |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI | `workflow` | 是（1 张图像，由工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra | `black-forest-labs/FLUX-1-schnell` | 是（1 张图像） | `DEEPINFRA_API_KEY` |
| fal | `fal-ai/flux/dev` | 是 | `FAL_KEY` |
| Google | `gemini-3.1-flash-image-preview` | 是 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |
| LiteLLM | `gpt-image-2` | 是（最多 5 张输入图像） | `LITELLM_API_KEY` |
| MiniMax | `image-01` | 是（主体参考） | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI | `gpt-image-2` | 是（最多 4 张图像） | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像） | `OPENROUTER_API_KEY` |
| Vydra | `grok-imagine` | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-image` | 是（最多 5 张图像） | `XAI_API_KEY` |

使用 `action: "list"` 在运行时检查可用提供商和模型：

```text
/tool image_generate action=list
```

## 提供商能力

| 能力 | ComfyUI | DeepInfra | fal | Google | MiniMax | OpenAI | Vydra | xAI |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数量） | 由工作流定义 | 4 | 4 | 4 | 9 | 4 | 1 | 4 |
| 编辑 / 参考 | 1 张图像（工作流） | 1 张图像 | 1 张图像 | 最多 5 张图像 | 1 张图像（主体参考） | 最多 5 张图像 | — | 最多 5 张图像 |
| 尺寸控制 | — | ✓ | ✓ | ✓ | — | 最高 4K | — | — |
| 宽高比 | — | — | ✓（仅生成） | ✓ | ✓ | — | — | ✓ |
| 分辨率（1K/2K/4K） | — | — | ✓ | ✓ | — | — | — | 1K、2K |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 时必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在运行时检查可用提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  Provider/model 覆盖（例如 `openai/gpt-image-2`）。如需 OpenAI 透明背景，请使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  编辑模式下的单张参考图路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  编辑模式下的多张参考图（支持的提供商最多 5 张）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>分辨率提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  当提供商支持时使用的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  当提供商支持时使用的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  当提供商支持时使用的背景提示。对于支持透明背景的提供商，请将 `transparent` 与 `outputFormat: "png"` 或 `"webp"` 一起使用。
</ParamField>
<ParamField path="count" type="number">要生成的图像数量（1–4）。</ParamField>
<ParamField path="timeoutMs" type="number">可选的 provider 请求超时时间，单位为毫秒。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  仅适用于 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当某个回退提供商支持与请求值接近的几何选项，而不是完全相同的请求值时，OpenClaw 会在提交前重映射到最接近的受支持尺寸、宽高比或分辨率。不支持的输出提示会被不声明支持它们的提供商丢弃，并在工具结果中报告。工具结果会报告实际应用的设置；`details.normalization` 会记录从请求值到实际应用值的任何转换。
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

1. 工具调用中的 **`model` 参数**（如果智能体指定了）。
2. 配置中的 **`imageGenerationModel.primary`**。
3. 按顺序使用 **`imageGenerationModel.fallbacks`**。
4. **自动检测**——仅限具备身份验证支持的提供商默认值：
   - 先尝试当前默认提供商；
   - 然后按 provider-id 顺序尝试其余已注册的图像生成提供商。

如果某个提供商失败（身份验证错误、速率限制等），会自动尝试下一个已配置候选项。如果全部失败，错误中会包含每次尝试的详细信息。

<AccordionGroup>
  <Accordion title="每次调用的模型覆盖是精确的">
    每次调用的 `model` 覆盖只会尝试该 provider/model，不会继续尝试已配置的 primary/fallback，也不会尝试自动检测到的提供商。
  </Accordion>
  <Accordion title="自动检测具备身份验证感知能力">
    只有当 OpenClaw 实际能够为某个提供商完成身份验证时，该提供商默认值才会进入候选列表。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="超时">
    为较慢的图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。每次调用的 `timeoutMs` 工具参数会覆盖配置中的默认值。
  </Accordion>
  <Accordion title="在运行时检查">
    使用 `action: "list"` 检查当前已注册的提供商、它们的默认模型以及身份验证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图路径或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图。fal、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深度解析

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果已配置 `openai-codex` OAuth 配置文件，OpenClaw 会复用与 Codex 订阅聊天模型相同的 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求。旧版 Codex base URL（例如 `https://chatgpt.com/backend-api`）会在图像请求中规范化为 `https://chatgpt.com/backend-api/codex`。OpenClaw **不会**为该请求静默回退到 `OPENAI_API_KEY`——如果你想强制直接通过 OpenAI Images API 路由，请显式配置 `models.providers.openai`，并提供 API 密钥、自定义 base URL 或 Azure 端点。

    `openai/gpt-image-1.5`、`openai/gpt-image-1` 和 `openai/gpt-image-1-mini` 模型仍然可以显式选择。对于透明背景 PNG/WebP 输出，请使用 `gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 通过同一个 `image_generate` 工具同时支持文生图和参考图编辑。OpenClaw 会将 `prompt`、`count`、`size`、`quality`、`outputFormat` 和参考图传递给 OpenAI。OpenAI **不会**直接接收 `aspectRatio` 或 `resolution`；如果可能，OpenClaw 会将它们映射为受支持的 `size`，否则工具会将它们报告为被忽略的覆盖项。

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

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；透明输出要求 `outputFormat` 为 `png` 或 `webp`，并且使用支持透明度的 OpenAI 图像模型。对于默认的 `gpt-image-2` 透明背景请求，OpenClaw 会路由到 `gpt-image-1.5`。`openai.outputCompression` 适用于 JPEG/WebP 输出。

    顶层 `background` 提示是 provider 无关的；当前当选择 OpenAI provider 时，它会映射到相同的 OpenAI `background` 请求字段。对于未声明支持背景控制的 provider，系统会在 `ignoredOverrides` 中返回该项，而不会向其发送不受支持的参数。

    如果你想通过 Azure OpenAI deployment，而不是 `api.openai.com`，来路由 OpenAI 图像生成，请参阅 [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 图像模型">
    OpenRouter 图像生成使用相同的 `OPENROUTER_API_KEY`，并通过 OpenRouter 的聊天补全图像 API 进行路由。请使用 `openrouter/` 前缀来选择 OpenRouter 图像模型：

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

    OpenClaw 会将 `prompt`、`count`、参考图以及兼容 Gemini 的 `aspectRatio` / `resolution` 提示传递给 OpenRouter。当前内置的 OpenRouter 图像模型快捷项包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用 `action: "list"` 可查看你当前配置的插件所暴露的内容。

  </Accordion>
  <Accordion title="MiniMax 双重身份验证">
    MiniMax 图像生成可通过两个内置的 MiniMax 身份验证路径使用：

    - `minimax/image-01`：用于 API 密钥配置
    - `minimax-portal/image-01`：用于 OAuth 配置

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    内置的 xAI provider 会在仅提示词请求时使用 `/v1/images/generations`，而当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 数量：最多 4 张
    - 参考图：一张 `image` 或最多五张 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 输出：以由 OpenClaw 管理的图像附件形式返回

    在这些控制项出现在共享的跨 provider `image_generate` 契约中之前，OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、`user` 或其他仅原生支持的宽高比。

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
  <Tab title="编辑（一张参考图）">
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

相同的 `--output-format` 和 `--background` 标志也可用于 `openclaw infer image edit`；`--openai-background` 仍保留为 OpenAI 专属别名。除 OpenAI 之外的内置 provider 当前都未声明显式背景控制，因此对于它们，`background: "transparent"` 会被报告为已忽略。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [ComfyUI](/zh-CN/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [fal](/zh-CN/providers/fal) — fal 图像和视频 provider 设置
- [Google（Gemini）](/zh-CN/providers/google) — Gemini 图像 provider 设置
- [MiniMax](/zh-CN/providers/minimax) — MiniMax 图像 provider 设置
- [OpenAI](/zh-CN/providers/openai) — OpenAI Images provider 设置
- [Vydra](/zh-CN/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) — 模型配置和故障转移
