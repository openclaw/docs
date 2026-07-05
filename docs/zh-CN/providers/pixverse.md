---
read_when:
    - 你想在 OpenClaw 中使用 PixVerse 视频生成
    - 你需要配置 PixVerse API 密钥/环境变量
    - 你想将 PixVerse 设为默认视频提供商
summary: OpenClaw 中的 PixVerse 视频生成设置
title: PixVerse
x-i18n:
    generated_at: "2026-07-05T11:36:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 将 `pixverse` 作为官方外部插件提供，用于托管式 PixVerse 视频生成。该插件会根据 `videoGenerationProviders` 契约注册 `pixverse` 提供商。

| 属性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供商 ID          | `pixverse`                                                           |
| 插件包             | `@openclaw/pixverse-provider`                                        |
| 认证环境变量       | `PIXVERSE_API_KEY`                                                   |
| 新手引导标志       | `--auth-choice pixverse-api-key`                                     |
| 直接 CLI 标志      | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（提交 `video_id` 并轮询结果）               |
| 默认模型           | `pixverse/v6`                                                        |
| 默认 API 区域      | 国际                                                                 |

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="设置 API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    向导会先提示选择国际或 CN 端点（见下方 API 区域），然后将 `region` 和 `baseUrl` 写入提供商配置。
    非交互式运行（key 来自 `--pixverse-api-key` 或 `PIXVERSE_API_KEY`）默认使用国际区域。

    当尚未配置默认视频模型时，新手引导还会将 `agents.defaults.videoGenerationModel.primary` 设置为
    `pixverse/v6`。

  </Step>
  <Step title="切换现有的默认视频提供商（可选）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成视频">
    让智能体生成视频。PixVerse 会被自动使用。
  </Step>
</Steps>

## 支持的模式和模型

该提供商通过 OpenClaw 的共享视频工具公开 PixVerse 生成模型。

| 模式           | 模型                 | 参考输入                |
| -------------- | -------------------- | ----------------------- |
| 文本转视频     | `v6`（默认），`c1`   | 无                      |
| 图像转视频     | `v6`（默认），`c1`   | 1 张本地或远程图像      |

本地图像引用会在图像转视频请求之前上传到 PixVerse。远程图像 URL 会作为 `image_url` 通过 PixVerse 图像上传端点传递。

| 选项           | 支持的值                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 时长            | 1-15 秒（默认 5）                                                                                                                |
| 分辨率          | `360P`、`540P`、`720P`、`1080P`（默认 `540P`；`480P` 请求会映射到 `540P`）                                                        |
| 宽高比          | `16:9`（默认）、`4:3`、`1:1`、`3:4`、`9:16`、`2:3`、`3:2`、`21:9`；仅文本转视频，图像转视频会跟随源图像                         |
| 生成音频        | `audio: true`                                                                                                                    |

<Note>
PixVerse 图像模板生成尚未通过 `image_generate` 暴露。该 API 由模板 ID 驱动，而 OpenClaw 的共享图像生成契约目前没有 PixVerse 专用的类型化选项包。
</Note>

## 提供商选项

视频提供商接受这些可选的提供商专用键：

| 选项                                 | 类型   | 效果                                          |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                               | number | 确定性种子，0 到 2147483647                  |
| `negativePrompt` / `negative_prompt` | string | 负向提示词                                    |
| `quality`                            | string | PixVerse 质量，例如 `720p`                    |
| `motionMode` / `motion_mode`         | string | 图像转视频运动模式（默认 `normal`）           |
| `cameraMovement` / `camera_movement` | string | PixVerse 相机运动预设                         |
| `templateId` / `template_id`         | number | 已激活的 PixVerse 模板 ID                     |

## 配置

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="API 区域">
    | 区域值          | PixVerse API 基础 URL                        |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    当你的 key 属于特定 PixVerse 平台区域时，请手动设置 `models.providers.pixverse.region`，或运行
    `openclaw onboard --auth-choice pixverse-api-key` 在设置向导中选择区域：

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="自定义基础 URL">
    只有在通过可信的兼容代理路由时，才设置 `models.providers.pixverse.baseUrl`。
    `baseUrl` 优先于 `region`。

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="任务轮询">
    PixVerse 会从生成请求返回一个 `video_id`。OpenClaw 每 5 秒轮询
    `/openapi/v2/video/result/{video_id}`，直到任务成功、失败或达到超时（默认 5 分钟；可用
    `agents.defaults.videoGenerationModel.timeoutMs` 覆盖）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、提供商选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认设置，包括视频生成模型。
  </Card>
</CardGroup>
