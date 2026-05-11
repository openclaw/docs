---
read_when:
    - 你想在 OpenClaw 中使用 fal 图像生成
    - 你需要 FAL_KEY 认证流程
    - 你想要用于 image_generate 或 video_generate 的 fal 默认值
summary: OpenClaw 中的 fal 图像和视频生成设置
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw 内置了一个 `fal` 提供商，用于托管式图像和视频生成。

| 属性 | 值                                                         |
| -------- | ------------------------------------------------------------- |
| 提供商 | `fal`                                                         |
| 凭证     | `FAL_KEY`（规范；`FAL_API_KEY` 也可作为备用） |
| API      | fal 模型端点                                           |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
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

| 能力     | 值                                                       |
| -------------- | ----------------------------------------------------------- |
| 最大图像数     | 每次请求 4 张                                               |
| 编辑模式      | Flux：1 张参考图像；GPT Image 2：10；Nano Banana 2：14 |
| 尺寸覆盖 | 支持                                                   |
| 宽高比   | 支持生成以及 GPT Image 2/Nano Banana 2 编辑   |
| 分辨率     | 支持                                                   |
| 输出格式  | `png` 或 `jpeg`                                             |

<Warning>
Flux 图生图请求**不**支持 `aspectRatio` 覆盖。GPT
Image 2 和 Nano Banana 2 编辑请求使用 fal 的 `/edit` 端点，并接受
宽高比提示。
</Warning>

当你需要 PNG 输出时，请使用 `outputFormat: "png"`。fal 在 OpenClaw 中没有声明显式的透明背景控制，因此 `background:
"transparent"` 会被报告为 fal 模型中被忽略的覆盖项。

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

## 视频生成

内置的 `fal` 视频生成提供商默认使用
`fal/fal-ai/minimax/video-01-live`。

| 能力 | 值                                                              |
| ---------- | ------------------------------------------------------------------ |
| 模式      | 文本转视频、单图参考、Seedance 参考转视频 |
| 运行时    | 用于长时间运行任务的队列支持提交/状态/结果流程       |

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

    参考转视频最多接受 9 张图像、3 个视频和 3 个音频参考，
    通过共享的 `video_generate` `images`、`videos` 和 `audioRefs`
    参数传入，总参考文件数最多为 12 个。

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

<Tip>
使用 `openclaw models list --provider fal` 查看可用 fal
模型的完整列表，包括最近新增的条目。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值，包括图像和视频模型选择。
  </Card>
</CardGroup>
