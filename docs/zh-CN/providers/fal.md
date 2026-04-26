---
read_when:
    - 你想在 OpenClaw 中使用 fal 图像生成
    - 你需要 `FAL_KEY` 认证流程
    - 你想为 `image_generate` 或 `video_generate` 配置 fal 默认值
summary: OpenClaw 中的 fal 图像与视频生成设置
title: Fal
x-i18n:
    generated_at: "2026-04-26T01:46:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw 内置了一个打包提供的 `fal` 提供商，用于托管图像和视频生成。

| 属性 | 值 |
| -------- | ------------------------------------------------------------- |
| 提供商 | `fal` |
| 认证 | `FAL_KEY`（规范方式；`FAL_API_KEY` 也可作为回退方式使用） |
| API | fal 模型端点 |

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

| 能力 | 值 |
| -------------- | -------------------------- |
| 最大图像数 | 每次请求 4 张 |
| 编辑模式 | 已启用，支持 1 张参考图像 |
| 尺寸覆盖 | 支持 |
| 宽高比 | 支持 |
| 分辨率 | 支持 |
| 输出格式 | `png` 或 `jpeg` |

<Warning>
fal 图像编辑端点**不**支持 `aspectRatio` 覆盖。
</Warning>

当你需要 PNG 输出时，请使用 `outputFormat: "png"`。fal 在 OpenClaw 中没有声明显式的透明背景控制，因此 `background:
"transparent"` 会被报告为 fal 模型的已忽略覆盖项。

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

| 能力 | 值 |
| ---------- | ------------------------------------------------------------------ |
| 模式 | 文本生成视频、单图参考、Seedance 参考图生成视频 |
| 运行时 | 基于队列的 submit/status/result 流程，用于长时间运行的任务 |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen 视频智能体：**

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

  <Accordion title="Seedance 2.0 reference-to-video 配置示例">
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

    reference-to-video 通过共享的 `video_generate` `images`、`videos` 和 `audioRefs`
    参数，最多可接受 9 张图像、3 个视频和 3 个音频参考，总参考文件数最多为 12 个。

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
使用 `openclaw models list --provider fal` 查看完整的可用 fal
模型列表，包括最近新增的条目。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享的图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    智能体默认值，包括图像和视频模型选择。
  </Card>
</CardGroup>
