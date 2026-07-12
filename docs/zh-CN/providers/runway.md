---
read_when:
    - 你想在 OpenClaw 中使用 Runway 视频生成功能
    - 你需要设置 Runway API key/环境变量
    - 你想将 Runway 设为默认视频提供商
summary: OpenClaw 中的 Runway 视频生成设置
title: Runway
x-i18n:
    generated_at: "2026-07-11T20:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw 内置了一个用于托管式视频生成的 `runway` 提供商。它默认启用，并按照 `videoGenerationProviders` 契约注册。

| 属性            | 值                                                                  |
| --------------- | ------------------------------------------------------------------- |
| 提供商 ID       | `runway`                                                            |
| 插件            | 内置，`enabledByDefault: true`                                      |
| 身份验证环境变量 | `RUNWAYML_API_SECRET`（规范名称）或 `RUNWAY_API_KEY`                |
| 新手引导标志    | `--auth-choice runway-api-key`                                      |
| 直接 CLI 标志   | `--runway-api-key <key>`                                            |
| API             | Runway 基于任务的视频生成（轮询 `GET /v1/tasks/{id}`）              |
| 默认模型        | `runway/gen4.5`                                                     |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
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
    让智能体生成视频。系统会自动使用 Runway。
  </Step>
</Steps>

## 支持的模式和模型

该提供商提供七种 Runway 模型，分为三种模式。同一模型 ID 可以支持多种模式（例如，`gen4.5` 同时适用于文本生成视频和图像生成视频）。

| 模式           | 模型                                                                   | 参考输入              |
| -------------- | ---------------------------------------------------------------------- | --------------------- |
| 文本生成视频   | `gen4.5`（默认）、`veo3.1`、`veo3.1_fast`、`veo3`                     | 无                    |
| 图像生成视频   | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 个本地或远程图像    |
| 视频生成视频   | `gen4_aleph`                                                           | 1 个本地或远程视频    |

通过数据 URI 支持本地图像和视频引用。

| 宽高比           | 允许的值                                    |
| ---------------- | ------------------------------------------- |
| 文本生成视频     | `16:9`、`9:16`                              |
| 图像和视频编辑   | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  视频生成视频目前要求使用 `runway/gen4_aleph`。其他 Runway 模型 ID 会拒绝视频引用输入。
</Warning>

<Note>
  从错误的列中选择 Runway 模型 ID 会在 API 请求离开 OpenClaw 之前产生明确错误。该提供商在 `extensions/runway/video-generation-provider.ts` 中根据模式的允许列表（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）验证 `model`。
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
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（规范名称）和 `RUNWAY_API_KEY`。
    任一变量均可用于对 Runway 提供商进行身份验证。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw
    会轮询 `GET /v1/tasks/{id}`，直到视频准备就绪。此轮询行为
    无需额外配置。
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
