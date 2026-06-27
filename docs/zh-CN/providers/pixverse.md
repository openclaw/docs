---
read_when:
    - 你想在 OpenClaw 中使用 PixVerse 视频生成
    - 你需要完成 PixVerse API 密钥/环境设置
    - 你想将 PixVerse 设为默认视频提供商
summary: OpenClaw 中的 PixVerse 视频生成设置
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T03:09:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw 提供 `pixverse` 作为用于托管 PixVerse 视频生成的官方外部插件。该插件会根据 `videoGenerationProviders` 合约注册 `pixverse` 提供商。

| 属性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供商 ID          | `pixverse`                                                           |
| 插件包             | `@openclaw/pixverse-provider`                                        |
| 凭证环境变量       | `PIXVERSE_API_KEY`                                                   |
| 新手引导标志       | `--auth-choice pixverse-api-key`                                     |
| 直接 CLI 标志      | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2（`video_id` 提交加结果轮询）                |
| 默认模型           | `pixverse/v6`                                                        |
| 默认 API 区域      | 国际版                                                               |

## 入门指南

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="设置 API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    向导会先询问是否使用国际版端点
    (`https://app-api.pixverse.ai/openapi/v2`) 或 CN 端点
    (`https://app-api.pixverseai.cn/openapi/v2`)，然后将 `region` 和
    `baseUrl` 写入提供商配置。

  </Step>
  <Step title="将 PixVerse 设为默认视频提供商">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="生成视频">
    要求智能体生成视频。PixVerse 会被自动使用。
  </Step>
</Steps>

## 支持的模式和模型

该提供商通过 OpenClaw 的共享视频工具公开 PixVerse 生成模型。

| 模式           | 模型                 | 参考输入                |
| -------------- | -------------------- | ----------------------- |
| 文本到视频     | `v6`（默认），`c1`   | 无                      |
| 图像到视频     | `v6`（默认），`c1`   | 1 张本地或远程图像      |

本地图像引用会先上传到 PixVerse，再发起图像到视频请求。远程图像 URL 会作为 `image_url` 通过 PixVerse 图像上传端点传递。

| 选项           | 支持的值                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| 时长            | 1-15 秒                                                                     |
| 分辨率          | `360P`, `540P`, `720P`, `1080P`                                             |
| 宽高比          | 文本到视频支持 `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` |
| 生成音频        | `audio: true`                                                               |

<Note>
PixVerse 图像模板生成尚未通过 `image_generate` 暴露。该 API 由模板 ID 驱动，而 OpenClaw 的共享图像生成合约目前没有 PixVerse 专用的类型化选项包。
</Note>

## 提供商选项

视频提供商接受以下可选的提供商专用键：

| 选项                                 | 类型   | 效果                              |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | 支持时使用的确定性种子            |
| `negativePrompt` / `negative_prompt` | string | 负向提示词                        |
| `quality`                            | string | PixVerse 质量，例如 `720p`        |
| `motionMode` / `motion_mode`         | string | 图像到视频运动模式                |
| `cameraMovement` / `camera_movement` | string | PixVerse 相机运动预设             |
| `templateId` / `template_id`         | number | 已激活的 PixVerse 模板 ID         |

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
    OpenClaw 默认使用国际版 PixVerse API。当你的 key 属于特定 PixVerse 平台区域时，可以手动设置 `models.providers.pixverse.region`，或使用
    `openclaw onboard --auth-choice pixverse-api-key` 在设置向导中选择：

    | 区域值          | PixVerse API 基础 URL                       |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

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
    仅当通过受信任的兼容代理路由时，才设置 `models.providers.pixverse.baseUrl`。
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
    PixVerse 会从生成请求返回 `video_id`。OpenClaw 会轮询
    `/openapi/v2/video/result/{video_id}`，直到任务成功、失败或超时。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、提供商选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    智能体默认设置，包括视频生成模型。
  </Card>
</CardGroup>
