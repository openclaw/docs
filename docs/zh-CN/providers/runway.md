---
read_when:
    - 你想在 OpenClaw 中使用 Runway 视频生成功能
    - 你需要设置 Runway API 密钥 / 环境变量
    - 你想将 Runway 设为默认视频提供商
summary: 在 OpenClaw 中设置 Runway 视频生成
title: Runway
x-i18n:
    generated_at: "2026-04-12T10:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw 内置了 `runway` 提供商，用于托管视频生成。

| 属性 | 值 |
| ----------- | ----------------------------------------------------------------- |
| 提供商 id | `runway` |
| 认证 | `RUNWAYML_API_SECRET`（规范名称）或 `RUNWAY_API_KEY` |
| API | Runway 基于任务的视频生成（轮询 `GET /v1/tasks/{id}`） |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="将 Runway 设为默认视频提供商">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成视频">
    让智能体生成一个视频。OpenClaw 会自动使用 Runway。
  </Step>
</Steps>

## 支持的模式

| 模式 | 模型 | 参考输入 |
| -------------- | ------------------ | ----------------------- |
| 文本生成视频 | `gen4.5`（默认） | 无 |
| 图片生成视频 | `gen4.5` | 1 个本地或远程图片 |
| 视频生成视频 | `gen4_aleph` | 1 个本地或远程视频 |

<Note>
支持通过数据 URI 引用本地图片和视频。当前纯文本运行支持 `16:9` 和 `9:16` 宽高比。
</Note>

<Warning>
视频生成视频当前需要显式使用 `runway/gen4_aleph`。
</Warning>

## 配置

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 高级说明

<AccordionGroup>
  <Accordion title="环境变量别名">
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（规范名称）和 `RUNWAY_API_KEY`。
    任一环境变量都可用于验证 Runway 提供商。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw 会轮询
    `GET /v1/tasks/{id}`，直到视频准备就绪。轮询行为不需要额外配置。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、提供商选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    包括视频生成模型在内的智能体默认设置。
  </Card>
</CardGroup>
