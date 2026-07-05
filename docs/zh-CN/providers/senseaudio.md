---
read_when:
    - 你想为音频附件使用 SenseAudio 语音转文本
    - 你需要 SenseAudio API key 环境变量或音频配置路径
summary: SenseAudio 入站语音消息批量语音转文本
title: SenseAudio
x-i18n:
    generated_at: "2026-07-05T11:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 通过 OpenClaw 共享的 `tools.media.audio` 管道转录入站音频和语音消息附件。OpenClaw 会将 multipart 音频发布到 OpenAI 兼容的转录端点，并将返回的文本作为 `{{Transcript}}` 和一个 `[Audio]` 块注入。

| 属性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供商 id     | `senseaudio`                                     |
| 插件          | 内置，`enabledByDefault: true`                   |
| 契约          | `mediaUnderstandingProviders`（音频）            |
| 认证环境变量  | `SENSEAUDIO_API_KEY`                             |
| 默认模型      | `senseaudio-asr-pro-1.5-260319`                  |
| 默认 URL      | `https://api.senseaudio.cn/v1`                   |
| 网站          | [senseaudio.cn](https://senseaudio.cn)           |
| 文档          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 入门指南

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    通过任意已连接的渠道发送音频消息。OpenClaw 会将音频上传到 SenseAudio，并在回复管道中使用转录文本。
  </Step>
</Steps>

## 选项

| 选项       | 路径                                  | 描述                              |
| ---------- | ------------------------------------- | --------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 id            |
| `language` | `tools.media.audio.models[].language` | 可选语言提示                      |
| `prompt`   | `tools.media.audio.prompt`            | 可选转录提示词                    |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | 覆盖 OpenAI 兼容的基础地址        |
| `headers`  | `tools.media.audio.request.headers`   | 额外请求标头                      |

<Note>
SenseAudio 在 OpenClaw 中仅支持批处理 STT。语音通话实时转录会继续使用支持流式 STT 的提供商。
</Note>

## 相关

- [媒体理解（音频）](/zh-CN/nodes/audio)
- [模型提供商](/zh-CN/concepts/model-providers)
