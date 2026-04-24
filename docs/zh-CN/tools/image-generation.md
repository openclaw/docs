---
read_when:
    - 通过智能体生成图像
    - 配置图像生成提供商和模型
    - 了解 `image_generate` 工具参数
summary: 使用已配置的提供商（OpenAI、OpenAI Codex OAuth、Google Gemini、OpenRouter、fal、MiniMax、ComfyUI、Vydra、xAI）生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-04-24T23:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8cfa462ba943e816d26215898bcf201fe118c96a618f2d340b0db22cc1409f56
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 工具可让智能体使用你已配置的提供商创建和编辑图像。生成的图像会作为媒体附件自动随智能体的回复一并发送。

<Note>
只有在至少有一个图像生成提供商可用时，此工具才会出现。如果你在智能体工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

1. 为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY` 或 `OPENROUTER_API_KEY`），或者使用 OpenAI Codex OAuth 登录。
2. 可选：设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth 使用同一个 `openai/gpt-image-2` 模型引用。当配置了
`openai-codex` OAuth 配置文件时，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是先尝试 `OPENAI_API_KEY`。
显式自定义 `models.providers.openai` 图像配置（例如 API 密钥或
自定义 / Azure base URL）会切回直接使用 OpenAI Images API 路由。
对于 LocalAI 这类兼容 OpenAI 的局域网端点，请保留自定义
`models.providers.openai.baseUrl`，并显式启用
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；默认情况下，私有 / 内部图像端点仍会被阻止。

3. 向智能体提问：_“生成一张友好机器人吉祥物的图片。”_

智能体会自动调用 `image_generate`。无需配置工具允许列表——只要有可用提供商，它默认就会启用。

## 常见路由

| 目标 | 模型引用 | 认证 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| 使用 API 计费的 OpenAI 图像生成 | `openai/gpt-image-2` | `OPENAI_API_KEY` |
| 使用 Codex 订阅认证的 OpenAI 图像生成 | `openai/gpt-image-2` | OpenAI Codex OAuth |
| OpenRouter 图像生成 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY` |
| Google Gemini 图像生成 | `google/gemini-3.1-flash-image-preview` | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

同一个 `image_generate` 工具同时处理文生图和参考图编辑。
单个参考图使用 `image`，多个参考图使用 `images`。
当提供商支持时，诸如 `quality`、`outputFormat` 以及 OpenAI 专用的 `background` 等输出提示参数会被转发；当提供商不支持时，工具结果中会报告这些参数已被忽略。

## 支持的提供商

| 提供商 | 默认模型 | 编辑支持 | 认证 |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI | `gpt-image-2` | 是（最多 4 张图片） | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图片） | `OPENROUTER_API_KEY` |
| Google | `gemini-3.1-flash-image-preview` | 是 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |
| fal | `fal-ai/flux/dev` | 是 | `FAL_KEY` |
| MiniMax | `image-01` | 是（主体参考） | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| ComfyUI | `workflow` | 是（1 张图片，由工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| Vydra | `grok-imagine` | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-image` | 是（最多 5 张图片） | `XAI_API_KEY` |

使用 `action: "list"` 可在运行时查看可用的提供商和模型：

```
/tool image_generate action=list
```

## 工具参数

<ParamField path="prompt" type="string" required>
图像生成提示词。`action: "generate"` 时必填。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
使用 `"list"` 可在运行时查看可用的提供商和模型。
</ParamField>

<ParamField path="model" type="string">
提供商 / 模型覆盖，例如 `openai/gpt-image-2`。
</ParamField>

<ParamField path="image" type="string">
用于编辑模式的单个参考图路径或 URL。
</ParamField>

<ParamField path="images" type="string[]">
用于编辑模式的多个参考图（最多 5 张）。
</ParamField>

<ParamField path="size" type="string">
尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>

<ParamField path="aspectRatio" type="string">
宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
分辨率提示。
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
当提供商支持时使用的质量提示。
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
当提供商支持时使用的输出格式提示。
</ParamField>

<ParamField path="count" type="number">
要生成的图像数量（1–4）。
</ParamField>

<ParamField path="timeoutMs" type="number">
可选的提供商请求超时时间（毫秒）。
</ParamField>

<ParamField path="filename" type="string">
输出文件名提示。
</ParamField>

<ParamField path="openai" type="object">
仅 OpenAI 的提示参数：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

并非所有提供商都支持所有参数。当某个后备提供商支持接近的几何选项而不是精确请求值时，OpenClaw 会在提交前重映射到最接近的受支持尺寸、宽高比或分辨率。像 `quality` 或 `outputFormat` 这类不受支持的输出提示，会对未声明支持的提供商直接丢弃，并在工具结果中报告。

工具结果会报告实际应用的设置。当 OpenClaw 在提供商后备切换期间重映射几何参数时，返回的 `size`、`aspectRatio` 和 `resolution` 值反映的是实际发送的内容，而 `details.normalization` 会记录从请求值到实际应用值的转换。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

生成图像时，OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了）
2. 配置中的 **`imageGenerationModel.primary`**
3. 按顺序使用 **`imageGenerationModel.fallbacks`**
4. **自动检测** —— 仅使用具备认证支持的提供商默认值：
   - 先使用当前默认提供商
   - 再按 provider-id 顺序使用其余已注册的图像生成提供商

如果某个提供商失败（认证错误、速率限制等），系统会自动尝试下一个已配置候选项。如果全部失败，错误信息会包含每次尝试的详细信息。

注意：

- 每次调用的 `model` 覆盖是精确的：OpenClaw 只会尝试该提供商 / 模型，
  不会继续尝试配置的主模型 / 后备模型或自动检测到的
  提供商。
- 自动检测具备认证感知能力。只有当 OpenClaw 实际能够认证某个提供商时，
  该提供商默认值才会进入候选列表。
- 自动检测默认启用。若你希望图像
  生成只使用显式的 `model`、`primary` 和 `fallbacks`
  条目，请设置
  `agents.defaults.mediaGenerationAutoProviderFallback: false`。
- 使用 `action: "list"` 可查看当前已注册的提供商、它们的
  默认模型，以及认证环境变量提示。

### 图像编辑

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图路径或 URL：

```
"将这张照片生成水彩风格版本" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图。fal、MiniMax 和 ComfyUI 支持 1 张。

### OpenRouter 图像模型

OpenRouter 图像生成使用同一个 `OPENROUTER_API_KEY`，并通过 OpenRouter 的 chat completions 图像 API 路由。请使用 `openrouter/` 前缀选择 OpenRouter 图像模型：

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

OpenClaw 会将 `prompt`、`count`、参考图像以及兼容 Gemini 的 `aspectRatio` / `resolution` 提示转发给 OpenRouter。当前内置的 OpenRouter 图像模型快捷方式包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`；请使用 `action: "list"` 查看你所配置插件公开的内容。

### OpenAI `gpt-image-2`

OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了
`openai-codex` OAuth 配置文件，OpenClaw 会复用同一个用于 Codex
订阅聊天模型的 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求；
它不会在该请求中静默回退到
`OPENAI_API_KEY`。若要强制直接路由到 OpenAI Images API，
请显式配置 `models.providers.openai`，提供 API 密钥、自定义 base URL
或 Azure 端点。较旧的
`openai/gpt-image-1` 模型仍可显式选择，但新的 OpenAI
图像生成和图像编辑请求应使用 `gpt-image-2`。

`gpt-image-2` 同时支持文生图和参考图
编辑，均通过同一个 `image_generate` 工具完成。OpenClaw 会向 OpenAI 转发 `prompt`、
`count`、`size`、`quality`、`outputFormat` 和参考图像。
OpenAI 不会直接接收 `aspectRatio` 或 `resolution`；在可能的情况下，
OpenClaw 会将它们映射为受支持的 `size`，否则工具会报告它们
作为被忽略的覆盖参数。

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

`openai.background` 接受 `transparent`、`opaque` 或 `auto`；透明
输出要求 `outputFormat` 为 `png` 或 `webp`。`openai.outputCompression`
适用于 JPEG/WebP 输出。

生成一张 4K 横版图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

生成两张方形图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

编辑一张本地参考图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

使用多张参考图进行编辑：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

若要将 OpenAI 图像生成通过 Azure OpenAI 部署路由，而不是
`api.openai.com`，请参阅 OpenAI 提供商文档中的 [Azure OpenAI endpoints](/zh-CN/providers/openai#azure-openai-endpoints)。

MiniMax 图像生成可通过两种内置的 MiniMax 认证路径使用：

- API 密钥配置使用 `minimax/image-01`
- OAuth 配置使用 `minimax-portal/image-01`

## 提供商能力

| 能力 | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra | xAI |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成 | 是（最多 4 张） | 是（最多 4 张） | 是（最多 4 张） | 是（最多 9 张） | 是（输出由工作流定义） | 是（1 张） | 是（最多 4 张） |
| 编辑 / 参考图 | 是（最多 5 张图片） | 是（最多 5 张图片） | 是（1 张图片） | 是（1 张图片，主体参考） | 是（1 张图片，由工作流配置） | 否 | 是（最多 5 张图片） |
| 尺寸控制 | 是（最高 4K） | 是 | 是 | 否 | 否 | 否 | 否 |
| 宽高比 | 否 | 是 | 是（仅生成） | 是 | 否 | 否 | 是 |
| 分辨率（1K/2K/4K） | 否 | 是 | 是 | 否 | 否 | 否 | 是（1K/2K） |

### xAI `grok-imagine-image`

内置 xAI 提供商在仅提示词请求时使用 `/v1/images/generations`，
当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

- 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- 数量：最多 4 张
- 参考图：一个 `image` 或最多五个 `images`
- 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 分辨率：`1K`、`2K`
- 输出：作为由 OpenClaw 管理的图像附件返回

在这些控制项被纳入共享的跨提供商 `image_generate` 合同之前，
OpenClaw 有意不公开 xAI 原生的 `quality`、`mask`、`user` 或
其他仅原生支持的额外宽高比。

## 相关内容

- [Tools Overview](/zh-CN/tools) — 所有可用的智能体工具
- [fal](/zh-CN/providers/fal) — fal 图像和视频提供商设置
- [ComfyUI](/zh-CN/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [Google (Gemini)](/zh-CN/providers/google) — Gemini 图像提供商设置
- [MiniMax](/zh-CN/providers/minimax) — MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) — OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [Configuration Reference](/zh-CN/gateway/config-agents#agent-defaults) — `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) — 模型配置和故障切换
