---
read_when:
    - 你想在 OpenClaw 中使用 Runway 视频生成
    - 你需要 Runway API 密钥/环境设置
    - 你想将 Runway 设为默认视频提供商
summary: OpenClaw 中的 Runway 视频生成设置
title: 跑道
x-i18n:
    generated_at: "2026-05-06T00:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 内置了一个用于托管视频生成的 `runway` 提供商。该插件默认启用，并针对 `videoGenerationProviders` 合约注册 `runway` 提供商。

| 属性            | 值                                                                |
| --------------- | ----------------------------------------------------------------- |
| 提供商 id       | `runway`                                                          |
| 插件            | 内置，`enabledByDefault: true`                                    |
| 认证环境变量    | `RUNWAYML_API_SECRET`（规范）或 `RUNWAY_API_KEY`                  |
| 新手引导标志    | `--auth-choice runway-api-key`                                    |
| 直接 CLI 标志   | `--runway-api-key <key>`                                          |
| API             | Runway 基于任务的视频生成（`GET /v1/tasks/{id}` 轮询）            |
| 默认模型        | `runway/gen4.5`                                                   |

## 入门指南

<Steps>
  <Step title="设置 API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="将 Runway 设置为默认视频提供商">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成视频">
    让智能体生成一个视频。Runway 会被自动使用。
  </Step>
</Steps>

## 支持的模式和模型

该提供商公开七个 Runway 模型，分为三种模式。同一个模型 id 可以服务于多个模式（例如 `gen4.5` 同时适用于文本转视频和图像转视频）。

| 模式       | 模型                                                                   | 参考输入              |
| ---------- | ---------------------------------------------------------------------- | --------------------- |
| 文本转视频 | `gen4.5`（默认）、`veo3.1`、`veo3.1_fast`、`veo3`                    | 无                    |
| 图像转视频 | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 个本地或远程图像    |
| 视频转视频 | `gen4_aleph`                                                           | 1 个本地或远程视频    |

支持通过 data URI 引用本地图像和视频。

| 宽高比           | 允许的值                                    |
| ---------------- | ------------------------------------------- |
| 文本转视频       | `16:9`、`9:16`                              |
| 图像和视频编辑   | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  视频转视频目前需要 `runway/gen4_aleph`。其他 Runway 模型 id 会拒绝视频参考输入。
</Warning>

<Note>
  从错误列中选择 Runway 模型 id，会在 API 请求离开 OpenClaw 之前产生明确错误。该提供商会在 `extensions/runway/video-generation-provider.ts` 中根据模式的允许列表（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）验证 `model`。
</Note>

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
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（规范）和 `RUNWAY_API_KEY`。
    任一变量都可以认证 Runway 提供商。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw
    会轮询 `GET /v1/tasks/{id}`，直到视频准备就绪。该轮询行为不需要额外
    配置。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、提供商选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    智能体默认设置，包括视频生成模型。
  </Card>
</CardGroup>
