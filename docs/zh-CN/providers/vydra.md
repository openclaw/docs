---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒体生成
    - 你需要 Vydra API 密钥设置指南
summary: 在 OpenClaw 中使用 Vydra 图像、视频和语音
title: Vydra
x-i18n:
    generated_at: "2026-07-05T11:38:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

内置的 Vydra 插件添加：

- 通过 `vydra/grok-imagine` 生成图像
- 通过 `vydra/veo3`（文本转视频）和 `vydra/kling`（图像转视频）生成视频
- 通过 Vydra 基于 ElevenLabs 的 TTS 路由进行语音合成

OpenClaw 对这三项能力都使用同一个 `VYDRA_API_KEY`。

| 属性            | 值                                                                        |
| --------------- | ------------------------------------------------------------------------- |
| 提供商 ID       | `vydra`                                                                   |
| 插件            | 内置，`enabledByDefault: true`                                            |
| 凭证环境变量    | `VYDRA_API_KEY`                                                           |
| 新手引导标志    | `--auth-choice vydra-api-key`                                             |
| 直接 CLI 标志   | `--vydra-api-key <key>`                                                   |
| 契约            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| 基础 URL        | `https://www.vydra.ai/api/v1`（使用 `www` 主机）                          |

<Warning>
使用 `https://www.vydra.ai/api/v1` 作为基础 URL。Vydra 的根域主机（`https://vydra.ai/api/v1`）目前会重定向到 `www`。一些 HTTP 客户端会在跨主机重定向时丢弃 `Authorization`，这会把有效的 API key 变成误导性的认证失败。内置插件会将任何配置的 `vydra.ai` 基础 URL 规范化为 `www.vydra.ai`，以避免这个问题。
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
    选择下面的一项或多项能力（图像、视频或语音），并应用对应配置。
  </Step>
</Steps>

## 能力

<AccordionGroup>
  <Accordion title="图像生成">
    默认且唯一内置的图像模型：

    - `vydra/grok-imagine`

    将它设置为默认图像提供商：

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

    内置支持仅限文本转图像，每个请求最多生成一张图像。Vydra 的托管编辑路由需要远程图像 URL，内置插件不会添加 Vydra 专用的上传桥接。

    <Note>
    请参阅[图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频生成">
    已注册的视频模型：

    - `vydra/veo3` 用于文本转视频（拒绝图像引用输入）
    - `vydra/kling` 用于图像转视频（需要且仅需要一个远程图像 URL）

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

    - `vydra/kling` 会预先拒绝本地文件上传；只有远程图像 URL 引用可用。
    - Vydra 的 `kling` HTTP 路由对于它需要 `image_url` 还是 `video_url` 一直不一致；内置提供商会在两个字段中发送同一个远程图像 URL。
    - 内置插件保持保守，不会转发未文档化的样式旋钮，例如宽高比、分辨率、水印或生成的音频。

    <Note>
    请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频实时测试">
    提供商专用实时覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    内置的 Vydra 实时文件覆盖：

    - `vydra/veo3` 文本转视频
    - 使用远程图像 URL 的 `vydra/kling` 图像转视频

    需要时覆盖远程图像夹具：

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
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    默认值：

    - 模型：`elevenlabs/tts`
    - 语音 ID：`21m00Tcm4TlvDq8ikWAM`（“Rachel”）

    内置插件公开这一项已知可用的默认语音，并返回 MP3 音频文件。

  </Accordion>
</AccordionGroup>

## 相关

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
