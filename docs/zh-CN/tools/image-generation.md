---
read_when:
    - 通过智能体生成图像
    - 配置图像生成提供商和模型
    - 了解 `image_generate` 工具参数
summary: 使用已配置的提供商（OpenAI、OpenAI Codex OAuth、Google Gemini、OpenRouter、LiteLLM、fal、MiniMax、ComfyUI、Vydra、xAI）生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-04-25T19:10:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: af0afacd9714dbaacfd3b15560ee3badfd6ecea6d2ecf63a12cc9834d916d3e6
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 工具允许智能体使用你已配置的提供商来创建和编辑图像。生成的图像会作为媒体附件自动随智能体的回复一并发送。

<Note>
只有当至少有一个图像生成提供商可用时，该工具才会显示。如果你在智能体的工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

1. 为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY` 或 `OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登录。
2. 可选：设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // image_generate 的可选默认提供商请求超时时间。
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。当配置了
`openai-codex` OAuth 配置文件时，OpenClaw 会通过同一个 OAuth 配置文件来路由图像请求，而不是先尝试 `OPENAI_API_KEY`。
显式的自定义 `models.providers.openai` 图像配置，例如 API 密钥或
自定义 / Azure `baseUrl`，会重新切换为直接使用 OpenAI Images API 路由。
对于像 LocalAI 这样的 OpenAI 兼容局域网端点，请保留自定义的
`models.providers.openai.baseUrl`，并显式启用
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；私有 / 内部图像端点默认仍会被阻止。

3. 向智能体提问：_“生成一张友好的机器人吉祥物图像。”_

智能体会自动调用 `image_generate`。不需要工具允许列表——当提供商可用时，它默认启用。

## 常见路由

| 目标 | 模型引用 | 认证 |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成 | `openai/gpt-image-2` | `OPENAI_API_KEY` |
| 使用 Codex 订阅认证的 OpenAI 图像生成 | `openai/gpt-image-2` | OpenAI Codex OAuth |
| OpenAI 透明背景 PNG/WebP | `openai/gpt-image-1.5` | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter 图像生成 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY` |
| LiteLLM 图像生成 | `litellm/gpt-image-2` | `LITELLM_API_KEY` |
| Google Gemini 图像生成 | `google/gemini-3.1-flash-image-preview` | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

同一个 `image_generate` 工具同时处理文生图和参考图像编辑。
单张参考图像使用 `image`，多张参考图像使用 `images`。
当提供商支持时，会转发诸如 `quality`、`outputFormat` 以及 OpenAI 专用的 `background` 等输出提示；如果提供商不支持，这些参数会被标记为已忽略。

## 支持的提供商

| 提供商 | 默认模型 | 编辑支持 | 认证 |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI | `gpt-image-2` | 是（最多 4 张图像） | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像） | `OPENROUTER_API_KEY` |
| LiteLLM | `gpt-image-2` | 是（最多 5 张输入图像） | `LITELLM_API_KEY` |
| Google | `gemini-3.1-flash-image-preview` | 是 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |
| fal | `fal-ai/flux/dev` | 是 | `FAL_KEY` |
| MiniMax | `image-01` | 是（主体参考） | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| ComfyUI | `workflow` | 是（1 张图像，由工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| Vydra | `grok-imagine` | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-image` | 是（最多 5 张图像） | `XAI_API_KEY` |

使用 `action: "list"` 可在运行时查看可用的提供商和模型：

```
/tool image_generate action=list
```

## 工具参数

<ParamField path="prompt" type="string" required>
图像生成提示词。`action: "generate"` 时必填。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
使用 `"list"` 在运行时查看可用的提供商和模型。
</ParamField>

<ParamField path="model" type="string">
提供商 / 模型覆盖，例如 `openai/gpt-image-2`；透明 OpenAI 背景请使用
`openai/gpt-image-1.5`。
</ParamField>

<ParamField path="image" type="string">
编辑模式下的单张参考图像路径或 URL。
</ParamField>

<ParamField path="images" type="string[]">
编辑模式下的多张参考图像（最多 5 张）。
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
提供商支持时的质量提示。
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
提供商支持时的输出格式提示。
</ParamField>

<ParamField path="count" type="number">
要生成的图像数量（1–4）。
</ParamField>

<ParamField path="timeoutMs" type="number">
可选的提供商请求超时时间，单位为毫秒。
</ParamField>

<ParamField path="filename" type="string">
输出文件名提示。
</ParamField>

<ParamField path="openai" type="object">
仅 OpenAI 提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

并非所有提供商都支持所有参数。当后备提供商支持与请求值接近的几何选项，而不是完全相同的选项时，OpenClaw 会在提交前重映射到最接近的受支持尺寸、宽高比或分辨率。像 `quality` 或 `outputFormat` 这类不受支持的输出提示，会对未声明支持它们的提供商被丢弃，并在工具结果中报告。

工具结果会报告实际应用的设置。当 OpenClaw 在提供商回退期间重映射几何参数时，返回的 `size`、`aspectRatio` 和 `resolution` 值会反映实际发送的内容，而 `details.normalization` 会记录从请求值到应用值的转换。

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

生成图像时，OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了它）
2. 配置中的 **`imageGenerationModel.primary`**
3. 按顺序使用 **`imageGenerationModel.fallbacks`**
4. **自动检测** —— 仅使用有认证支持的提供商默认值：
   - 当前默认提供商优先
   - 其余已注册的图像生成提供商，按提供商 ID 顺序排列

如果某个提供商失败（认证错误、速率限制等），会自动尝试下一个已配置的候选项。如果全部失败，错误信息中会包含每次尝试的详细信息。

注意：

- 每次调用的 `model` 覆盖是精确的：OpenClaw 只会尝试该提供商 / 模型，
  不会继续尝试已配置的 primary / fallback 或自动检测到的
  提供商。
- 自动检测具有认证感知能力。只有当 OpenClaw 实际能够认证该提供商时，
  该提供商默认值才会进入候选列表。
- 自动检测默认启用。如果你希望图像生成
  仅使用显式的 `model`、`primary` 和 `fallbacks`
  条目，请设置
  `agents.defaults.mediaGenerationAutoProviderFallback: false`。
- 为较慢的图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。
  每次调用的 `timeoutMs` 工具参数会覆盖已配置的默认值。
- 使用 `action: "list"` 查看当前已注册的提供商、
  它们的默认模型，以及认证环境变量提示。

### 图像编辑

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图像路径或 URL：

```
"将这张照片生成成水彩风格" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数支持最多 5 张参考图像。fal、MiniMax 和 ComfyUI 支持 1 张。

### OpenRouter 图像模型

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

OpenClaw 会将 `prompt`、`count`、参考图像以及兼容 Gemini 的 `aspectRatio` / `resolution` 提示转发给 OpenRouter。当前内置的 OpenRouter 图像模型快捷项包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`；使用 `action: "list"` 查看你已配置插件所公开的内容。

### OpenAI `gpt-image-2`

OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了
`openai-codex` OAuth 配置文件，OpenClaw 会复用与 Codex 订阅聊天模型相同的 OAuth
配置文件，并通过 Codex Responses 后端发送图像请求。旧版 Codex `baseUrl`，例如
`https://chatgpt.com/backend-api`，会在图像请求中规范化为
`https://chatgpt.com/backend-api/codex`。它不会
静默回退到 `OPENAI_API_KEY` 来处理该请求。若要强制使用直接 OpenAI
Images API 路由，请显式配置 `models.providers.openai`，例如 API
密钥、自定义 `baseUrl` 或 Azure 端点。仍然可以显式选择
`openai/gpt-image-1.5`、
`openai/gpt-image-1` 和 `openai/gpt-image-1-mini`
模型。透明背景 PNG/WebP 输出请使用 `gpt-image-1.5`；
当前的 `gpt-image-2` API 会拒绝 `background: "transparent"`。

`gpt-image-2` 同时支持文生图和参考图像编辑，
都通过同一个 `image_generate` 工具完成。OpenClaw 会将 `prompt`、
`count`、`size`、`quality`、`outputFormat` 和参考图像转发给 OpenAI。
OpenAI 不会直接接收 `aspectRatio` 或 `resolution`；在可能的情况下，
OpenClaw 会将它们映射到受支持的 `size`，否则工具会将它们报告为
被忽略的覆盖项。

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
输出需要将 `outputFormat` 设为 `png` 或 `webp`，并且使用支持透明度的 OpenAI
图像模型。对于默认的 `gpt-image-2` 透明背景请求，OpenClaw 会将其路由到 `gpt-image-1.5`。
`openai.outputCompression` 适用于 JPEG/WebP
输出。

当你要求智能体生成透明背景的 OpenAI 图像时，预期的
工具调用如下：

```json
{
  "model": "openai/gpt-image-1.5",
  "prompt": "一个透明背景上的简单红色圆形贴纸",
  "outputFormat": "png",
  "openai": {
    "background": "transparent"
  }
}
```

显式指定 `openai/gpt-image-1.5` 模型可以让该请求在不同的
工具摘要和 harness 中保持可移植性。如果智能体改为使用默认的
`openai/gpt-image-2`，并在公开
OpenAI 或 OpenAI Codex OAuth 路由上设置 `openai.background: "transparent"`，OpenClaw 会将提供商请求重写为
`gpt-image-1.5`。Azure 和自定义的 OpenAI 兼容端点会保留它们已配置的
部署 / 模型名称。

对于无头 CLI 生成，请使用等效的 `openclaw infer` 标志：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --openai-background transparent \
  --prompt "一个透明背景上的简单红色圆形贴纸" \
  --json
```

同样的 `--output-format` 和 `--openai-background` 标志也可用于
`openclaw infer image edit`。其他内置提供商也可以返回 PNG，
并且如果其后端输出 alpha 通道，可能会保留透明度，但 OpenClaw 目前只为 OpenAI 图像生成公开提供了
显式的透明背景控制。

生成一张 4K 横向图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="为 OpenClaw 图像生成设计一张简洁的编辑风格海报" size=3840x2160 count=1
```

生成一张透明 PNG：

```
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="一个透明背景上的简单红色圆形贴纸" outputFormat=png openai='{"background":"transparent"}'
```

生成两张方形图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="为一款平静风格的效率应用图标提供两个视觉方向" size=1024x1024 count=2
```

编辑一张本地参考图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="保留主体，将背景替换为明亮的摄影棚布景" image=/path/to/reference.png size=1024x1536
```

使用多张参考图像进行编辑：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="结合第一张图像中的角色特征与第二张图像中的配色方案" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

如果要将 OpenAI 图像生成路由到 Azure OpenAI 部署，而不是
`api.openai.com`，请参阅 OpenAI provider 文档中的 [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

MiniMax 图像生成可通过两种内置的 MiniMax 认证路径使用：

- `minimax/image-01`，用于 API 密钥配置
- `minimax-portal/image-01`，用于 OAuth 配置

## 提供商能力

| 能力 | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra | xAI |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成 | 是（最多 4 张） | 是（最多 4 张） | 是（最多 4 张） | 是（最多 9 张） | 是（工作流定义的输出） | 是（1 张） | 是（最多 4 张） |
| 编辑 / 参考图 | 是（最多 5 张图像） | 是（最多 5 张图像） | 是（1 张图像） | 是（1 张图像，主体参考） | 是（1 张图像，由工作流配置） | 否 | 是（最多 5 张图像） |
| 尺寸控制 | 是（最高 4K） | 是 | 是 | 否 | 否 | 否 | 否 |
| 宽高比 | 否 | 是 | 是（仅生成） | 是 | 否 | 否 | 是 |
| 分辨率（1K/2K/4K） | 否 | 是 | 是 | 否 | 否 | 否 | 是（1K/2K） |

### xAI `grok-imagine-image`

内置的 xAI 提供商在仅提示词请求时使用 `/v1/images/generations`，
当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

- 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- 数量：最多 4 张
- 参考图：一个 `image` 或最多五个 `images`
- 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 分辨率：`1K`、`2K`
- 输出：以 OpenClaw 管理的图像附件形式返回

在这些控制项出现在跨提供商共享的
`image_generate` 契约中之前，OpenClaw 有意不公开 xAI 原生的 `quality`、`mask`、`user` 或
额外的仅原生支持宽高比控制。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [fal](/zh-CN/providers/fal) — fal 图像与视频提供商设置
- [ComfyUI](/zh-CN/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [Google（Gemini）](/zh-CN/providers/google) — Gemini 图像提供商设置
- [MiniMax](/zh-CN/providers/minimax) — MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) — OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) — 模型配置与故障切换
