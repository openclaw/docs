---
read_when:
    - 你想要为音频附件使用 SenseAudio 语音转文本功能
    - 你需要 SenseAudio API 密钥环境变量或音频配置路径
summary: 用于入站语音便笺的 SenseAudio 批量语音转文本
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T11:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio 可以通过 OpenClaw 共享的 `tools.media.audio` 流水线转录入站音频/语音便笺附件。OpenClaw 会将多部分音频上传到与 OpenAI 兼容的转录端点，并将返回的文本注入为 `{{Transcript}}` 以及一个 `[Audio]` 区块。

| 详情 | 值 |
| ------------- | ------------------------------------------------ |
| 网站 | [senseaudio.cn](https://senseaudio.cn) |
| 文档 | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| 认证 | `SENSEAUDIO_API_KEY` |
| 默认模型 | `senseaudio-asr-pro-1.5-260319` |
| 默认 URL | `https://api.senseaudio.cn/v1` |

## 入门指南

<Steps>
  <Step title="设置你的 API 密钥">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="启用音频提供商">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送语音便笺">
    通过任意已连接渠道发送一条音频消息。OpenClaw 会将音频上传到 SenseAudio，并在回复流水线中使用转录文本。
  </Step>
</Steps>

## 选项

| 选项 | 路径 | 说明 |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model` | `tools.media.audio.models[].model` | SenseAudio ASR 模型 ID |
| `language` | `tools.media.audio.models[].language` | 可选的语言提示 |
| `prompt` | `tools.media.audio.prompt` | 可选的转录提示词 |
| `baseUrl` | `tools.media.audio.baseUrl` or model | 覆盖与 OpenAI 兼容的基础 URL |
| `headers` | `tools.media.audio.request.headers` | 额外的请求头 |

<Note>
在 OpenClaw 中，SenseAudio 仅支持批量 STT。Voice Call 实时转录仍继续使用支持流式 STT 的提供商。
</Note>
