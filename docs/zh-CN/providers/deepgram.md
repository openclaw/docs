---
read_when:
    - 你希望为音频附件使用 Deepgram 语音转文本
    - 你希望为 Voice Call 使用 Deepgram 流式转写
    - 你需要一个快速的 Deepgram 配置示例
summary: 使用 Deepgram 转写入站语音消息
title: Deepgram
x-i18n:
    generated_at: "2026-04-24T18:10:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Deepgram 是一个语音转文本 API。在 OpenClaw 中，它用于通过 `tools.media.audio` 对入站音频 / 语音消息进行转写，也用于通过 `plugins.entries.voice-call.config.streaming` 为 Voice Call 提供流式 STT。

对于批量转写，OpenClaw 会将完整音频文件上传到 Deepgram，并将转写结果注入回复流水线（`{{Transcript}}` + `[Audio]` 块）。对于 Voice Call 流式场景，OpenClaw 会通过 Deepgram 的 WebSocket `listen` 端点转发实时 G.711 u-law 帧，并在 Deepgram 返回时发出部分或最终转写结果。

| 详情 | 值 |
| ------------- | ---------------------------------------------------------- |
| 网站 | [deepgram.com](https://deepgram.com) |
| 文档 | [developers.deepgram.com](https://developers.deepgram.com) |
| 认证 | `DEEPGRAM_API_KEY` |
| 默认模型 | `nova-3` |

## 入门指南

<Steps>
  <Step title="设置你的 API 密钥">
    将你的 Deepgram API 密钥添加到环境变量中：

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="启用音频提供商">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送语音消息">
    通过任意已连接渠道发送一条音频消息。OpenClaw 会通过 Deepgram 对其进行转写，并将转写结果注入回复流水线。
  </Step>
</Steps>

## 配置选项

| 选项 | 路径 | 说明 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model` | `tools.media.audio.models[].model` | Deepgram 模型 id（默认：`nova-3`） |
| `language` | `tools.media.audio.models[].language` | 语言提示（可选） |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 启用语言检测（可选） |
| `punctuate` | `tools.media.audio.providerOptions.deepgram.punctuate` | 启用标点（可选） |
| `smart_format` | `tools.media.audio.providerOptions.deepgram.smart_format` | 启用智能格式化（可选） |

<Tabs>
  <Tab title="使用语言提示">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="使用 Deepgram 选项">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call 流式 STT

内置的 `deepgram` 插件也为 Voice Call 插件注册了一个实时转写提供商。

| 设置 | 配置路径 | 默认值 |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API 密钥 | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退到 `DEEPGRAM_API_KEY` |
| 模型 | `...deepgram.model` | `nova-3` |
| 语言 | `...deepgram.language` | （未设置） |
| 编码 | `...deepgram.encoding` | `mulaw` |
| 采样率 | `...deepgram.sampleRate` | `8000` |
| 端点检测 | `...deepgram.endpointingMs` | `800` |
| 中间结果 | `...deepgram.interimResults` | `true` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call 接收的是 8 kHz G.711 u-law 电话音频。Deepgram 流式提供商默认使用 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此可以直接转发 Twilio 媒体帧。
</Note>

## 说明

<AccordionGroup>
  <Accordion title="认证">
    认证遵循标准提供商认证顺序。`DEEPGRAM_API_KEY` 是最简单的方式。
  </Accordion>
  <Accordion title="代理和自定义端点">
    使用代理时，可通过 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆盖端点或请求头。
  </Accordion>
  <Accordion title="输出行为">
    输出遵循与其他提供商相同的音频规则（大小上限、超时、转写注入）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="媒体工具" href="/zh-CN/tools/media-overview" icon="photo-film">
    音频、图像和视频处理流水线概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考，包括媒体工具设置。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="常见问题" href="/zh-CN/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
