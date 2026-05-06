---
read_when:
    - 你想为音频附件使用 SenseAudio 语音转文本
    - 你需要 SenseAudio API 密钥环境变量或音频配置路径
summary: 用于入站语音消息的 SenseAudio 批量语音转文本
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T06:39:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 可以通过 OpenClaw 共享的 `tools.media.audio` 管道转录传入音频和语音备注附件。OpenClaw 会将 multipart 音频发布到 OpenAI 兼容的转录端点，并将返回的文本作为 `{{Transcript}}` 以及一个 `[Audio]` 块注入。

| 属性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供商 id     | `senseaudio`                                     |
| 插件          | 内置，`enabledByDefault: true`                   |
| 契约          | `mediaUnderstandingProviders`（音频）            |
| 凭证环境变量  | `SENSEAUDIO_API_KEY`                             |
| 默认模型      | `senseaudio-asr-pro-1.5-260319`                  |
| 默认 URL      | `https://api.senseaudio.cn/v1`                   |
| 网站          | [senseaudio.cn](https://senseaudio.cn)           |
| 文档          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 入门指南

<Steps>
  <Step title="设置你的 API key">
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
  <Step title="发送语音备注">
    通过任何已连接的渠道发送音频消息。OpenClaw 会将音频上传到 SenseAudio，并在回复管道中使用转录文本。
  </Step>
</Steps>

## 选项

| 选项       | 路径                                  | 描述                            |
| ---------- | ------------------------------------- | ------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 id          |
| `language` | `tools.media.audio.models[].language` | 可选语言提示                    |
| `prompt`   | `tools.media.audio.prompt`            | 可选转录提示                    |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | 覆盖 OpenAI 兼容的 base         |
| `headers`  | `tools.media.audio.request.headers`   | 额外请求头                      |

<Note>
在 OpenClaw 中，SenseAudio 仅支持批量 STT。Voice Call 实时转录会继续使用支持流式 STT 的提供商。
</Note>

## 相关内容

- [媒体理解（音频）](/zh-CN/nodes/audio)
- [模型提供商](/zh-CN/concepts/model-providers)
