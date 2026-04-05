---
read_when:
    - 通过智能体生成图像
    - 配置图像生成提供商和模型
    - 了解 `image_generate` 工具参数
summary: 使用已配置的提供商（OpenAI、Google Gemini、fal、MiniMax）生成和编辑图像
title: 图像生成
x-i18n:
    generated_at: "2026-04-05T10:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# 图像生成

`image_generate` 工具可让智能体使用你已配置的提供商来创建和编辑图像。生成的图像会作为媒体附件自动包含在智能体的回复中。

<Note>
仅当至少有一个图像生成提供商可用时，该工具才会出现。如果你在智能体工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel` 或设置提供商 API 密钥。
</Note>

## 快速开始

1. 为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`）。
2. 可选：设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. 向智能体提问：_“生成一张友好的龙虾吉祥物图像。”_

智能体会自动调用 `image_generate`。无需工具 allow-listing——当提供商可用时，它默认启用。

## 支持的提供商

| 提供商 | 默认模型                         | 编辑支持                | API 密钥                                               |
| ------ | -------------------------------- | ----------------------- | ------------------------------------------------------ |
| OpenAI | `gpt-image-1`                    | 是（最多 5 张图像）     | `OPENAI_API_KEY`                                       |
| Google | `gemini-3.1-flash-image-preview` | 是                      | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                   |
| fal    | `fal-ai/flux/dev`                | 是                      | `FAL_KEY`                                              |
| MiniMax | `image-01`                      | 是（主体参考）          | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |

使用 `action: "list"` 可在运行时查看可用的提供商和模型：

```
/tool image_generate action=list
```

## 工具参数

| 参数          | 类型      | 说明                                                                                 |
| ------------- | --------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string    | 图像生成提示词（`action: "generate"` 时必需）                                        |
| `action`      | string    | `"generate"`（默认）或 `"list"`，用于查看提供商                                     |
| `model`       | string    | 提供商/模型覆盖，例如 `openai/gpt-image-1`                                           |
| `image`       | string    | 编辑模式下的单个参考图像路径或 URL                                                   |
| `images`      | string[]  | 编辑模式下的多个参考图像（最多 5 张）                                                |
| `size`        | string    | 尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`1024x1792`、`1792x1024`            |
| `aspectRatio` | string    | 宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`     |
| `resolution`  | string    | 分辨率提示：`1K`、`2K` 或 `4K`                                                       |
| `count`       | number    | 要生成的图像数量（1–4）                                                              |
| `filename`    | string    | 输出文件名提示                                                                       |

并非所有提供商都支持所有参数。该工具会传递各提供商所支持的参数，并忽略其余参数。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      // String form: primary model only
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Object form: primary + ordered fallbacks
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### 提供商选择顺序

生成图像时，OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了）
2. 配置中的 **`imageGenerationModel.primary`**
3. 按顺序尝试 **`imageGenerationModel.fallbacks`**
4. **自动检测**——仅使用有认证支持的提供商默认值：
   - 先当前默认提供商
   - 再按提供商 id 顺序尝试其余已注册的图像生成提供商

如果某个提供商失败（认证错误、速率限制等），会自动尝试下一个候选项。如果全部失败，错误信息中会包含每次尝试的详细信息。

说明：

- 自动检测会感知认证状态。只有当 OpenClaw 实际可以对某个提供商进行认证时，该提供商默认值才会进入候选列表。
- 使用 `action: "list"` 可查看当前已注册的提供商、它们的默认模型以及认证环境变量提示。

### 图像编辑

OpenAI、Google、fal 和 MiniMax 支持编辑参考图像。传入参考图像路径或 URL：

```
"把这张照片生成成水彩画版本" + image: "/path/to/photo.jpg"
```

OpenAI 和 Google 通过 `images` 参数最多支持 5 张参考图像。fal 和 MiniMax 支持 1 张。

MiniMax 图像生成可通过两种内置 MiniMax 认证路径使用：

- `minimax/image-01` 用于 API 密钥设置
- `minimax-portal/image-01` 用于 OAuth 设置

## 提供商能力

| 能力                  | OpenAI               | Google               | fal                 | MiniMax                     |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- |
| 生成                  | 是（最多 4 张）      | 是（最多 4 张）      | 是（最多 4 张）     | 是（最多 9 张）             |
| 编辑/参考             | 是（最多 5 张图像）  | 是（最多 5 张图像）  | 是（1 张图像）      | 是（1 张图像，主体参考）    |
| 尺寸控制              | 是                   | 是                   | 是                  | 否                          |
| 宽高比                | 否                   | 是                   | 是（仅生成）        | 是                          |
| 分辨率（1K/2K/4K）    | 否                   | 是                   | 是                  | 否                          |

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 配置
- [Models](/zh-CN/concepts/models) — 模型配置和故障转移
