---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒体生成功能
    - 你需要 Vydra API 密钥设置指南
summary: 在 OpenClaw 中使用 Vydra 图像、视频和语音功能
title: Vydra
x-i18n:
    generated_at: "2026-04-24T03:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

内置的 Vydra 插件新增了：

- 通过 `vydra/grok-imagine` 进行图像生成
- 通过 `vydra/veo3` 和 `vydra/kling` 进行视频生成
- 通过 Vydra 基于 ElevenLabs 的 TTS 路由进行语音合成

OpenClaw 对这三种能力都使用同一个 `VYDRA_API_KEY`。

<Warning>
请使用 `https://www.vydra.ai/api/v1` 作为基础 URL。

Vydra 的顶级主机（`https://vydra.ai/api/v1`）当前会重定向到 `www`。某些 HTTP 客户端会在跨主机重定向时丢弃 `Authorization`，这会让有效的 API 密钥看起来像是误导性的认证失败。内置插件直接使用 `www` 基础 URL 以避免这个问题。
</Warning>

## 设置

<Steps>
  <Step title="运行交互式新手引导">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接设置环境变量：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="选择默认能力">
    从下列能力中选择一个或多个（图像、视频或语音），并应用对应的配置。
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

    当前内置支持仅限文生图。Vydra 托管的编辑路由需要远程图像 URL，而 OpenClaw 目前尚未在内置插件中添加 Vydra 专用上传桥接。

    <Note>
    有关共享工具参数、提供商选择和故障转移行为，请参见 [图像生成](/zh-CN/tools/image-generation)。
    </Note>

  </Accordion>

  <Accordion title="视频生成">
    已注册的视频模型：

    - `vydra/veo3` 用于文生视频
    - `vydra/kling` 用于图生视频

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

    - `vydra/veo3` 在内置插件中仅作为文生视频提供。
    - `vydra/kling` 当前需要远程图像 URL 引用。本地文件上传会被直接拒绝。
    - Vydra 当前的 `kling` HTTP 路由对于究竟需要 `image_url` 还是 `video_url` 一直不太一致；内置提供商会将同一个远程图像 URL 同时映射到这两个字段。
    - 内置插件保持保守策略，不会转发诸如宽高比、分辨率、水印或生成音频等未文档化的样式控制项。

    <Note>
    有关共享工具参数、提供商选择和故障转移行为，请参见 [视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="视频实时测试">
    提供商专属实时覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    内置的 Vydra 实时文件现在覆盖：

    - `vydra/veo3` 文生视频
    - 使用远程图像 URL 的 `vydra/kling` 图生视频

    如有需要，可覆盖远程图像夹具：

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
    - 语音 ID：`21m00Tcm4TlvDq8ikWAM`

    内置插件当前仅暴露一个已知可用的默认语音，并返回 MP3 音频文件。

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
    智能体默认值和模型配置。
  </Card>
</CardGroup>
