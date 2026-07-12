---
read_when:
    - 你希望对出站回复使用 Azure Speech 语音合成
    - 你需要 Azure Speech 原生输出 Ogg Opus 语音留言
summary: 用于 OpenClaw 回复的 Azure AI Speech 文本转语音功能
title: Azure Speech
x-i18n:
    generated_at: "2026-07-11T20:50:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech 是一个内置的 Azure AI Speech 文本转语音提供商。OpenClaw
使用 SSML 直接调用 Azure Speech REST API，为标准回复合成 MP3，为语音消息合成
原生 Ogg/Opus，并为 Voice Call 等电话渠道合成 8 kHz mulaw 音频。请求通过
`X-Microsoft-OutputFormat` 标头发送由提供商定义的输出格式。

| 详细信息               | 值                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| 提供商 ID              | `azure-speech`（别名：`azure`）                                                                                |
| 网站                   | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 文档                   | [Speech REST 文本转语音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)     |
| 身份验证               | `AZURE_SPEECH_KEY` 加 `AZURE_SPEECH_REGION`                                                                    |
| 默认语音               | `en-US-JennyNeural`                                                                                            |
| 默认文件输出           | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| 默认语音消息文件       | `ogg-24khz-16bit-mono-opus`                                                                                    |

## 入门指南

<Steps>
  <Step title="创建 Azure Speech 资源">
    在 Azure 门户中创建 Speech 资源。从
    Resource Management > Keys and Endpoint 复制 **KEY 1**，并复制资源位置，
    例如 `eastus`。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="在 messages.tts 中选择 Azure Speech">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送消息">
    通过任何已连接的渠道发送回复。OpenClaw 使用 Azure Speech 合成音频，
    对标准音频交付 MP3，或在渠道需要语音消息时交付 Ogg/Opus。
  </Step>
</Steps>

## 配置选项

所有选项都位于 `messages.tts.providers["azure-speech"]` 下。

| 选项                    | 说明                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech 资源密钥。回退到 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。                |
| `region`                | Azure Speech 资源区域。回退到 `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。                                 |
| `endpoint`              | 可选的 Azure Speech 端点覆盖值。回退到 `AZURE_SPEECH_ENDPOINT`。                                         |
| `baseUrl`               | 可选的 Azure Speech 基础 URL 覆盖值。                                                                     |
| `voice`                 | Azure 语音 ShortName（默认为 `en-US-JennyNeural`）。旧版别名：`voiceId`。                                |
| `lang`                  | SSML 语言代码（默认为 `en-US`）。                                                                         |
| `outputFormat`          | 音频文件输出格式（默认为 `audio-24khz-48kbitrate-mono-mp3`）。                                           |
| `voiceNoteOutputFormat` | 语音消息输出格式（默认为 `ogg-24khz-16bit-mono-opus`）。                                                  |
| `timeoutMs`             | 以毫秒为单位的请求超时覆盖值。回退到全局 `messages.tts.timeoutMs`。                                      |

设置 `apiKey`，并设置 `region`、`endpoint` 或 `baseUrl` 中的任意一项后，
即视为已配置该提供商。仅当配置键未设置时，才会检查环境变量作为回退。

## 注意事项

<AccordionGroup>
  <Accordion title="身份验证">
    Azure Speech 使用 Speech 资源密钥，而不是 Azure OpenAI 密钥。该密钥通过
    `Ocp-Apim-Subscription-Key` 发送；除非你提供 `endpoint` 或 `baseUrl`，
    否则 OpenClaw 会根据 `region` 派生
    `https://<region>.tts.speech.microsoft.com`。
  </Accordion>
  <Accordion title="语音名称">
    使用 Azure Speech 语音的 `ShortName` 值，例如
    `en-US-JennyNeural`。内置提供商可以通过同一 Speech 资源列出语音，
    并过滤掉标记为已弃用、已停用或已禁用的语音。
  </Accordion>
  <Accordion title="音频输出">
    Azure 接受 `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus` 和 `riff-24khz-16bit-mono-pcm` 等输出格式。
    OpenClaw 会为 `voice-note` 目标请求 Ogg/Opus，使渠道无需额外进行 MP3 转换
    即可发送原生语音气泡；对于电话目标，则会强制使用
    `raw-8khz-8bit-mono-mulaw`。
  </Accordion>
  <Accordion title="别名">
    为兼容现有配置，`azure` 可用作提供商别名，但新配置应使用
    `azure-speech`，以避免与 Azure OpenAI 模型提供商混淆。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="waveform-lines">
    TTS 概览、提供商和 `messages.tts` 配置。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考，包括 `messages.tts` 设置。
  </Card>
  <Card title="提供商" href="/zh-CN/providers" icon="grid">
    所有 OpenClaw 内置提供商。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
