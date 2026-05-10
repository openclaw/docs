---
read_when:
    - 通过智能体生成或编辑图像
    - 配置图像生成提供商和模型
    - 理解 image_generate 工具参数
sidebarTitle: Image generation
summary: 通过 image_generate 在 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 中生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-05-10T19:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10beee0352443ba8813094bdfe748bfa763594b93e7c9f0687be63c4506df717
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具让 agent 可以使用你配置的提供商创建和编辑图像。生成的图像会自动作为媒体附件发送到 agent 的回复中。

<Note>
仅当至少有一个图像生成提供商可用时，该工具才会出现。如果你在 agent 的工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`，设置提供商 API key，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

<Steps>
  <Step title="Configure auth">
    为至少一个提供商设置 API key（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登录。
  </Step>
  <Step title="Pick a default model (optional)">
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

    Codex OAuth 使用同一个 `openai/gpt-image-2` 模型引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是先尝试 `OPENAI_API_KEY`。显式的 `models.providers.openai` 配置（API key、自定义/Azure 基础 URL）会重新选择直接使用 OpenAI Images API 路由。

  </Step>
  <Step title="Ask the agent">
    _“生成一张友好的机器人吉祥物图片。”_

    agent 会自动调用 `image_generate`。无需将工具加入允许列表，只要提供商可用，它默认启用。

  </Step>
</Steps>

<Warning>
对于 LocalAI 等兼容 OpenAI 的局域网端点，请保留自定义 `models.providers.openai.baseUrl`，并通过 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 显式选择启用。私有和内部图像端点默认仍会被阻止。
</Warning>

## 常见路由

| 目标                                                 | 模型引用                                          | 凭证                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 计费的 OpenAI 图像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 订阅凭证的 OpenAI 图像生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 图像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 图像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 图像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 图像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一个 `image_generate` 工具同时处理文本生成图像和参考图像编辑。使用 `image` 传入一张参考图像，或使用 `images` 传入多张参考图像。提供商支持的输出提示（如 `quality`、`outputFormat` 和 `background`）会在可用时转发；如果提供商不支持，则会报告为已忽略。内置透明背景支持仅适用于 OpenAI；如果其他提供商的后端会输出 PNG alpha，它们仍可能保留透明度。

## 支持的提供商

| 提供商   | 默认模型                           | 编辑支持                       | 凭证                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 是（1 张图像，由工作流配置） | 云端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 是（1 张图像）                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 是                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 是（最多 5 张输入图像）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 是（主体参考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| OpenAI     | `gpt-image-2`                           | 是（最多 4 张图像）               | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 是（最多 5 张图像）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在运行时检查可用的提供商和模型：

```text
/tool image_generate action=list
```

## 提供商能力

| 能力            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数量）  | 由工作流定义   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 编辑 / 参考      | 1 张图像（工作流） | 1 张图像   | 1 张图像           | 最多 5 张图像 | 1 张图像（主体参考） | 最多 5 张图像 | -     | 最多 5 张图像 |
| 尺寸控制          | -                  | ✓         | ✓                 | ✓              | -                     | 最高 4K       | -     | -              |
| 宽高比          | -                  | -         | ✓（仅生成） | ✓              | ✓                     | -              | -     | ✓              |
| 分辨率（1K/2K/4K） | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在运行时检查可用的提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `openai/gpt-image-2`）。使用 `openai/gpt-image-1.5` 获取透明 OpenAI 背景。
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
  提供商支持时使用的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供商支持时使用的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供商支持时使用的背景提示。对于支持透明度的提供商，请将 `transparent` 与 `outputFormat: "png"` 或 `"webp"` 一起使用。
</ParamField>
<ParamField path="count" type="number">要生成的图像数量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  可选的提供商请求超时时间，单位为毫秒。当 Codex 通过动态工具调用 `image_generate` 时，此单次调用值仍会覆盖配置的默认值，并且上限为 600000 ms。
</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  仅 OpenAI 支持的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当回退提供商支持相近的几何选项而不是精确请求的选项时，OpenClaw 会在提交前重新映射到最接近的受支持尺寸、宽高比或分辨率。对于未声明支持的提供商，不受支持的输出提示会被丢弃，并在工具结果中报告。工具结果会报告实际应用的设置；`details.normalization` 会捕获任何从请求值到应用值的转换。
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

1. 工具调用中的 **`model` 参数**（如果 agent 指定了一个）。
2. 配置中的 **`imageGenerationModel.primary`**。
3. 按顺序使用 **`imageGenerationModel.fallbacks`**。
4. **自动检测** - 仅使用有凭证支持的提供商默认值：
   - 先使用当前默认提供商；
   - 其余已注册的图像生成提供商按提供商 ID 顺序使用。

如果某个提供商失败（凭证错误、速率限制等），会自动尝试下一个配置的候选项。如果全部失败，错误会包含每次尝试的详细信息。

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    单次调用的 `model` 覆盖只会尝试该提供商/模型，不会继续使用配置的 primary/fallback 或自动检测到的提供商。
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    只有当 OpenClaw 实际上可以认证某个提供商时，该提供商默认值才会进入候选列表。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可仅使用显式的 `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="Timeouts">
    为较慢的图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。单次调用的 `timeoutMs` 工具参数会覆盖配置的默认值。Codex 动态工具调用遵循同一超时预算，并受 OpenClaw 的 600000 ms 动态工具桥接最大值限制。
  </Accordion>
  <Accordion title="Inspect at runtime">
    使用 `action: "list"` 检查当前注册的提供商、它们的默认模型以及凭证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图像路径或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图像。fal、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深入说明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了
    `openai-codex` OAuth 配置档案，OpenClaw 会复用 Codex 订阅聊天模型使用的同一个
    OAuth 配置档案，并通过 Codex Responses 后端发送图像请求。旧版 Codex 基础
    URL（例如 `https://chatgpt.com/backend-api`）会针对图像请求规范化为
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不会**为该请求静默回退到 `OPENAI_API_KEY` - 如需强制直接通过 OpenAI Images API 路由，请显式配置
    `models.providers.openai`，并提供 API key、自定义基础 URL
    或 Azure 端点。

    仍然可以显式选择 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。使用
    `gpt-image-1.5` 生成透明背景 PNG/WebP 输出；当前
    `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 通过同一个 `image_generate` 工具同时支持文生图生成和
    参考图编辑。OpenClaw 会将 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和参考图转发给 OpenAI。OpenAI 不会直接接收
    `aspectRatio` 或 `resolution`；在可能的情况下，OpenClaw 会将它们映射到受支持的
    `size`，否则该工具会将它们报告为被忽略的覆盖项。

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

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；
    透明输出要求 `outputFormat` 为 `png` 或 `webp`，且使用支持透明度的
    OpenAI 图像模型。OpenClaw 会将默认
    `gpt-image-2` 透明背景请求路由到 `gpt-image-1.5`。
    `openai.outputCompression` 适用于 JPEG/WebP 输出。

    顶层 `background` 提示与提供商无关，并且当前在选择 OpenAI provider
    时会映射到同一个 OpenAI `background` 请求字段。不声明背景支持的提供商会在
    `ignoredOverrides` 中返回它，而不是接收不受支持的参数。

    如需通过 Azure OpenAI 部署而不是 `api.openai.com` 路由 OpenAI 图像生成，请参阅
    [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 图像模型">
    OpenRouter 图像生成使用同一个 `OPENROUTER_API_KEY`，并通过
    OpenRouter 的聊天补全图像 API 路由。使用 `openrouter/` 前缀选择
    OpenRouter 图像模型：

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

    OpenClaw 会将 `prompt`、`count`、参考图以及兼容 Gemini 的
    `aspectRatio` / `resolution` 提示转发给 OpenRouter。
    当前内置的 OpenRouter 图像模型快捷项包括
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你配置的插件暴露了哪些内容。

  </Accordion>
  <Accordion title="MiniMax 双重认证">
    MiniMax 图像生成可通过两种内置 MiniMax
    认证路径使用：

    - `minimax/image-01` 用于 API-key 设置
    - `minimax-portal/image-01` 用于 OAuth 设置

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    内置 xAI 提供商对仅含提示词的请求使用 `/v1/images/generations`，
    并在存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 数量：最多 4 个
    - 参考图：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 输出：作为 OpenClaw 管理的图像附件返回

    OpenClaw 有意暂不暴露 xAI 原生的 `quality`、`mask`、`user`
    或额外的仅原生宽高比，直到这些控制项存在于共享的跨提供商
    `image_generate` 合约中。

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
  <Tab title="生成（两个方形）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="编辑（一个参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="编辑（多个参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

同样的 `--output-format` 和 `--background` 标志也可用于
`openclaw infer image edit`；`--openai-background` 仍作为
OpenAI 专属别名保留。除 OpenAI 以外的内置提供商目前不声明显式背景控制，因此
`background: "transparent"` 会被报告为对它们已忽略。

## 相关

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [ComfyUI](/zh-CN/providers/comfy) - 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [fal](/zh-CN/providers/fal) - fal 图像和视频提供商设置
- [Google (Gemini)](/zh-CN/providers/google) - Gemini 图像提供商设置
- [MiniMax](/zh-CN/providers/minimax) - MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) - OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) - Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) - Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) - 模型配置和故障转移
