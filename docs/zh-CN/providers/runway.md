---
read_when:
    - 你想在 OpenClaw 中使用 Runway 视频生成】【。
    - You need the Runway API key/env setup
    - 你想将 Runway 设为默认视频提供商
summary: 在 OpenClaw 中设置 Runway 视频生成
title: Runway
x-i18n:
    generated_at: "2026-04-24T03:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw 附带一个内置 `runway` 提供商，用于托管视频生成。

| 属性 | 值 |
| ----------- | ----------------------------------------------------------------- |
| 提供商 id | `runway` |
| 认证 | `RUNWAYML_API_SECRET`（标准写法）或 `RUNWAY_API_KEY` |
| API | 基于任务的 Runway 视频生成（`GET /v1/tasks/{id}` 轮询） |

## 入门指南

<Steps>
  <Step title="设置 API key">
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
    让智能体生成一个视频。系统会自动使用 Runway。
  </Step>
</Steps>

## 支持的模式

| 模式 | 模型 | 参考输入 |
| -------------- | ------------------ | ----------------------- |
| 文本转视频 | `gen4.5`（默认） | 无 |
| 图像转视频 | `gen4.5` | 1 个本地或远程图像 |
| 视频转视频 | `gen4_aleph` | 1 个本地或远程视频 |

<Note>
通过数据 URI 支持本地图像和视频参考。当前纯文本运行
支持 `16:9` 和 `9:16` 宽高比。
</Note>

<Warning>
视频转视频当前必须明确使用 `runway/gen4_aleph`。
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

## 高级配置

<AccordionGroup>
  <Accordion title="环境变量别名">
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（标准写法）和 `RUNWAY_API_KEY`。
    任意一个变量都可以用于认证 Runway 提供商。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw
    会轮询 `GET /v1/tasks/{id}`，直到视频准备完成。该轮询行为
    无需额外配置。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、提供商选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    包括视频生成模型在内的智能体默认设置。
  </Card>
</CardGroup>
