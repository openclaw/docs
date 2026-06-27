---
read_when:
    - 你想在 OpenClaw 中使用 fal 图像生成
    - 你需要 FAL_KEY 凭证流程
    - 你想为 image_generate、video_generate 或 music_generate 使用 fal 默认值
summary: OpenClaw 中 fal 图像、视频和音乐生成设置
title: Fal
x-i18n:
    generated_at: "2026-06-27T03:03:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 内置一个 `fal` 提供商，用于托管式图像、视频和音乐生成。

| 属性 | 值                                                            |
| -------- | ------------------------------------------------------------- |
| 提供商 | `fal`                                                         |
| 身份验证     | `FAL_KEY`（规范值；`FAL_API_KEY` 也可作为后备使用） |
| API      | fal 模型端点                                           |

## 入门指南

<Steps>
  <Step title="设置 API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="设置默认图像模型">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 图像生成

内置的 `fal` 图像生成提供商默认使用
`fal/fal-ai/flux/dev`。

| 能力     | 值                                                              |
| -------------- | ------------------------------------------------------------------ |
| 最大图像数     | 每次请求 4 张；Krea 2：每次请求 1 张                               |
| 编辑模式      | Flux：1 张参考图像；GPT Image 2：10；Nano Banana 2：14        |
| 样式引用     | Krea 2：通过 `image` / `images` 最多支持 10 个样式引用           |
| 尺寸覆盖 | 支持                                                          |
| 宽高比   | 支持生成、Krea 2，以及 GPT Image 2/Nano Banana 2 编辑 |
| 分辨率     | 支持                                                          |
| 输出格式  | `png` 或 `jpeg`                                                    |

<Warning>
Flux 图生图请求**不**支持 `aspectRatio` 覆盖。GPT Image 2 和 Nano Banana 2 编辑请求使用 fal 的 `/edit` 端点，并接受宽高比提示。Nano Banana 2 还接受额外的原生宽屏/竖屏比例，例如 `4:1`、`1:4`、`8:1` 和 `1:8`；Krea 2 会校验自己较小的宽高比子集。
</Warning>

Krea 2 模型使用 fal 的原生 Krea 负载 schema。OpenClaw 会发送
`aspect_ratio`、`creativity` 和 `image_style_references`，而不是 Flux 使用的通用 `image_size` / 编辑端点负载。模型引用为：

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

使用 Medium 可获得更快的表现性插画、动漫、绘画和艺术风格。使用 Large 可获得较慢但更偏照片写实、原始纹理、胶片颗粒和细节丰富的效果。Krea 默认使用 `fal.creativity: "medium"`；支持的值为
`raw`、`low`、`medium` 和 `high`。

Krea 2 在 fal 的请求 schema 中暴露的是宽高比，而不是 `image_size`。优先使用
`aspectRatio`；OpenClaw 会将 `size` 映射到最接近的受支持 Krea 宽高比，并会拒绝 Krea 的 `resolution`，而不是直接丢弃它。

当你想从暴露 `output_format` 的 fal 模型获得 PNG 输出时，使用 `outputFormat: "png"`。fal 未在 OpenClaw 中声明显式的透明背景控制，因此对于 fal 模型，`background: "transparent"` 会被报告为被忽略的覆盖项。
Krea 2 端点未通过 fal 暴露 `output_format` 请求字段，因此 OpenClaw 会拒绝 Krea 请求的 `outputFormat` 覆盖。

要将 fal 用作默认图像提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

要使用 Krea 2 Medium：

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

## 视频生成

内置的 `fal` 视频生成提供商默认使用
`fal/fal-ai/minimax/video-01-live`。

| 能力 | 值                                                              |
| ---------- | ------------------------------------------------------------------ |
| 模式      | 文本转视频、单图像参考、Seedance 参考转视频 |
| 运行时    | 针对长时间运行任务的队列支持提交/状态/结果流程       |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 参考转视频配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    参考转视频通过共享的 `video_generate` `images`、`videos` 和 `audioRefs` 参数接受最多 9 张图像、3 个视频和 3 个音频引用，总参考文件数最多为 12 个。

  </Accordion>

  <Accordion title="HeyGen video-agent 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 音乐生成

内置的 `fal` 插件还为共享的 `music_generate` 工具注册了音乐生成提供商。

| 能力    | 值                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| 默认模型 | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| 模型        | `fal-ai/minimax-music/v2.6`、`fal-ai/ace-step/prompt-to-audio`、`fal-ai/stable-audio-25/text-to-audio` |
| 运行时       | 同步请求加生成音频下载                                                      |

将 fal 用作默认音乐提供商：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` 支持显式歌词和纯音乐模式。
ACE-Step 和 Stable Audio 是提示词转音频端点；当你想使用这些模型系列时，通过
`model` 覆盖来选择它们。

<Tip>
使用 `openclaw models list --provider fal` 查看完整的可用 fal 模型列表，包括任何最近新增的条目。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值，包括图像、视频和音乐模型选择。
  </Card>
</CardGroup>
