---
read_when:
    - 你想要将 Deepgram 语音转文本用于音频附件
    - 你需要一个快速的 Deepgram 配置示例
summary: 用于入站语音便笺的 Deepgram 转录
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T10:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram（音频转录）

Deepgram 是一个语音转文本 API。在 OpenClaw 中，它用于通过 `tools.media.audio` 进行**入站音频/语音便笺转录**。

启用后，OpenClaw 会将音频文件上传到 Deepgram，并将转录文本注入回复流水线中（`{{Transcript}}` + `[Audio]` 区块）。这**不是流式传输**；它使用预录音转录端点。

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
  <Step title="发送语音便笺">
    通过任意已连接的渠道发送一条音频消息。OpenClaw 会通过 Deepgram 对其进行转录，并将转录文本注入回复流水线中。
  </Step>
</Steps>

## 配置选项

| 选项 | 路径 | 说明 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model` | `tools.media.audio.models[].model` | Deepgram 模型 ID（默认：`nova-3`） |
| `language` | `tools.media.audio.models[].language` | 语言提示（可选） |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 启用语言检测（可选） |
| `punctuate` | `tools.media.audio.providerOptions.deepgram.punctuate` | 启用标点（可选） |
| `smart_format` | `tools.media.audio.providerOptions.deepgram.smart_format` | 启用智能格式化（可选） |

<Tabs>
  <Tab title="带语言提示">
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
  <Tab title="带 Deepgram 选项">
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

## 说明

<AccordionGroup>
  <Accordion title="身份验证">
    身份验证遵循标准的提供商认证顺序。`DEEPGRAM_API_KEY` 是最简单的方式。
  </Accordion>
  <Accordion title="代理和自定义端点">
    使用代理时，可通过 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆盖端点或请求头。
  </Accordion>
  <Accordion title="输出行为">
    输出遵循与其他提供商相同的音频规则（大小上限、超时、转录文本注入）。
  </Accordion>
</AccordionGroup>

<Note>
Deepgram 转录**仅支持预录音**（不是实时分块流式传输）。OpenClaw 会上传完整的音频文件，并在将其注入对话之前等待完整的转录结果。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="媒体工具" href="/tools/media" icon="photo-film">
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
