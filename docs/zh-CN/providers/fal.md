---
read_when:
    - 你想在 OpenClaw 中使用 fal 图像生成】【。assistant to=functions.read-commentary  彩神争霸官方下载 there's no need.
    - 你需要 `FAL_KEY` 认证流程
    - 你想为 `image_generate` 或 `video_generate` 使用 fal 默认值
summary: 在 OpenClaw 中设置 fal 图像与视频生成
title: Fal
x-i18n:
    generated_at: "2026-04-24T03:43:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw 附带一个内置 `fal` 提供商，用于托管图像和视频生成。

| 属性 | 值 |
| -------- | ------------------------------------------------------------- |
| 提供商 | `fal` |
| 认证 | `FAL_KEY`（标准写法；`FAL_API_KEY` 也可作为回退） |
| API | fal 模型端点 |

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

内置 `fal` 图像生成提供商默认使用
`fal/fal-ai/flux/dev`。

| 能力 | 值 |
| -------------- | -------------------------- |
| 最大图像数 | 每次请求 4 张 |
| 编辑模式 | 已启用，支持 1 张参考图像 |
| 尺寸覆盖 | 支持 |
| 宽高比 | 支持 |
| 分辨率 | 支持 |

<Warning>
fal 图像编辑端点**不**支持 `aspectRatio` 覆盖。
</Warning>

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

内置 `fal` 视频生成提供商默认使用
`fal/fal-ai/minimax/video-01-live`。

| 能力 | 值 |
| ---------- | ------------------------------------------------------------ |
| 模式 | 文本转视频、单图参考 |
| 运行时 | 基于队列的提交/状态/结果流程，适用于长时间运行的任务 |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

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
    共享的图像工具参数与提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数与提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    包括图像和视频模型选择在内的智能体默认值。
  </Card>
</CardGroup>
