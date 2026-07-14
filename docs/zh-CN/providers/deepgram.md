---
read_when:
    - 你想使用 Deepgram 将音频附件转换为文本
    - 你想为语音通话使用 Deepgram 流式转录
    - 你需要一个简明的 Deepgram 配置示例
summary: 使用 Deepgram 转写传入的语音留言
title: Deepgram
x-i18n:
    generated_at: "2026-07-14T13:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram 是一个语音转文本 API。OpenClaw 通过 `tools.media.audio` 使用它转录传入的音频/语音留言，并通过 `plugins.entries.voice-call.config.streaming` 将其用于 Voice Call 流式 STT。

批量转录会将完整的音频文件上传到 Deepgram，并将转录文本注入回复管线（`{{Transcript}}` + `[Audio]` 块）。Voice Call 流式传输通过 Deepgram 的 WebSocket `listen` 端点转发实时 G.711 u-law 帧，并在 Deepgram 返回部分/最终转录文本时将其发出。

| 详情          | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 网站          | [deepgram.com](https://deepgram.com)                       |
| 文档          | [developers.deepgram.com](https://developers.deepgram.com) |
| 身份验证      | `DEEPGRAM_API_KEY`                                         |
| 默认模型      | `nova-3`                                         |

## 入门指南

<Steps>
  <Step title="设置 API key">
    ```bash
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
  <Step title="发送语音留言">
    通过任意已连接的渠道发送音频消息。OpenClaw 会通过 Deepgram 对其进行转录，并将转录文本注入回复管线。
  </Step>
</Steps>

## 配置选项

| 选项       | 路径                                  | 说明                                      |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram 模型 ID（默认值：`nova-3`） |
| `language` | `tools.media.audio.models[].language` | 语言提示（可选）                          |

`providerOptions.deepgram` 会将额外的查询参数直接合并到 Deepgram `/listen` 请求中，因此可以使用 Deepgram 支持的任意参数名称（例如 `detect_language`、`punctuate`、`smart_format`）：

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

内置的 `deepgram` 插件还为 Voice Call 插件注册了实时转录提供商。

| 设置            | 配置路径                                                                | 默认值                                         |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退到 `DEEPGRAM_API_KEY`                      |
| 基础 URL        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` 或 Deepgram 的公共 API      |
| 模型            | `...deepgram.model`                                                     | `nova-3`                             |
| 语言            | `...deepgram.language`                                                  | （未设置）                                     |
| 编码            | `...deepgram.encoding`                                                  | `mulaw`                             |
| 采样率          | `...deepgram.sampleRate`                                                | `8000`                             |
| 端点检测        | `...deepgram.endpointingMs`                                             | `800`                             |
| 中间结果        | `...deepgram.interimResults`                                            | `true`                             |

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

对于 [Deepgram 自定义端点](https://developers.deepgram.com/reference/custom-endpoints)，请将 `baseUrl` 设置为端点根地址，包括任何基础路径，但不要包括 `/listen`。实时端点接受 `http://`、`https://`、`ws://` 和 `wss://`。HTTP 映射到 WS，HTTPS 映射到 WSS，显式 WebSocket 方案保持不变。格式错误的 URL 和其他方案会在会话设置期间失败。

<Note>
Voice Call 接收的电话音频为 8 kHz G.711 u-law。Deepgram 流式传输提供商默认使用 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此可以直接转发 Twilio 媒体帧。
</Note>

## 说明

<AccordionGroup>
  <Accordion title="身份验证">
    身份验证遵循标准的提供商身份验证顺序。`DEEPGRAM_API_KEY` 是最简单的方式。
  </Accordion>
  <Accordion title="代理和自定义端点">
    使用代理时，可通过 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆盖端点或标头。
  </Accordion>
  <Accordion title="输出行为">
    输出遵循与其他提供商相同的音频规则（大小上限、超时、转录文本注入）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="媒体工具" href="/zh-CN/tools/media-overview" icon="photo-film">
    音频、图像和视频处理管线概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考，包括媒体工具设置。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="常见问题" href="/zh-CN/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
