---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒体生成功能
    - 你需要 Vydra API key 设置指南
summary: 在 OpenClaw 中使用 Vydra 图像、视频和语音
title: Vydra
x-i18n:
    generated_at: "2026-06-27T03:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

捆绑的 Vydra 插件新增：

- 通过 `vydra/grok-imagine` 生成图像
- 通过 `vydra/veo3` 和 `vydra/kling` 生成视频
- 通过 Vydra 由 ElevenLabs 支持的 TTS 路由进行语音合成

OpenClaw 对这三项能力使用同一个 `VYDRA_API_KEY`。

| 属性            | 值                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 提供商 id       | `vydra`                                                                   |
| 插件            | 捆绑，`enabledByDefault: true`                                            |
| 认证环境变量    | `VYDRA_API_KEY`                                                           |
| 新手引导标志    | `--auth-choice vydra-api-key`                                             |
| 直接 CLI 标志   | `--vydra-api-key <key>`                                                   |
| 契约            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 基础 URL        | `https://www.vydra.ai/api/v1`（使用 `www` 主机）                          |

<Warning>
  使用 `https://www.vydra.ai/api/v1` 作为基础 URL。Vydra 的根域主机（`https://vydra.ai/api/v1`）目前会重定向到 `www`。一些 HTTP 客户端会在这种跨主机重定向中丢弃 `Authorization`，从而把有效的 API key 变成误导性的认证失败。捆绑插件会直接使用 `www` 基础 URL 来避免这种情况。
</Warning>

## 设置

<Steps>
  <Step title="运行交互式新手引导">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或者直接设置环境变量：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="选择默认能力">
    选择下面的一项或多项能力（图像、视频或语音），并应用对应的配置。
  </Step>
</Steps>

## 能力

<AccordionGroup>
  <Accordion title="图像生成">
    默认图像模型：

    - `vydra/grok-imagine`

    将其设置为默认图像提供商：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    当前捆绑支持仅限文本到图像。Vydra 托管的编辑路由需要远程图像 URL，而 OpenClaw 目前还没有在捆绑插件中添加 Vydra 专用上传桥接。

    <Note>
    请参阅[图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频生成">
    已注册的视频模型：

    - `vydra/veo3` 用于文本到视频
    - `vydra/kling` 用于图像到视频

    将 Vydra 设置为默认视频提供商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    说明：

    - `vydra/veo3` 仅作为文本到视频捆绑。
    - `vydra/kling` 目前需要远程图像 URL 引用。本地文件上传会被提前拒绝。
    - Vydra 当前的 `kling` HTTP 路由在是否需要 `image_url` 或 `video_url` 方面一直不一致；捆绑提供商会将同一个远程图像 URL 映射到这两个字段中。
    - 捆绑插件保持保守，不会转发未文档化的样式旋钮，例如宽高比、分辨率、水印或生成的音频。

    <Note>
    请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频实时测试">
    提供商专用实时覆盖范围：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    捆绑的 Vydra 实时文件现在覆盖：

    - `vydra/veo3` 文本到视频
    - `vydra/kling` 使用远程图像 URL 进行图像到视频

    需要时覆盖远程图像 fixture：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="语音合成">
    将 Vydra 设置为语音提供商：

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    默认值：

    - 模型：`elevenlabs/tts`
    - 语音 id：`21m00Tcm4TlvDq8ikWAM`

    捆绑插件目前公开一个已知可用的默认语音，并返回 MP3 音频文件。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="提供商目录" href="/zh-CN/providers/index" icon="list">
    浏览所有可用提供商。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
</CardGroup>
