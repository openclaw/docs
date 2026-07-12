---
read_when:
    - 你希望使用 SenseAudio 对音频附件进行语音转文字
    - 你需要 SenseAudio API key 环境变量或音频配置路径
summary: 用于入站语音留言的 SenseAudio 批量语音转文本
title: SenseAudio
x-i18n:
    generated_at: "2026-07-11T20:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 通过 OpenClaw 的共享 `tools.media.audio` 管道转录入站音频和语音留言附件。OpenClaw 将音频以 multipart 格式发送到兼容 OpenAI 的转录端点，并将返回的文本作为 `{{Transcript}}` 以及一个 `[Audio]` 块注入。

| 属性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供商 ID     | `senseaudio`                                     |
| 插件          | 内置，`enabledByDefault: true`                   |
| 契约          | `mediaUnderstandingProviders`（音频）            |
| 身份验证环境变量 | `SENSEAUDIO_API_KEY`                          |
| 默认模型      | `senseaudio-asr-pro-1.5-260319`                  |
| 默认 URL      | `https://api.senseaudio.cn/v1`                   |
| 网站          | [senseaudio.cn](https://senseaudio.cn)           |
| 文档          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 入门指南

<Steps>
  <Step title="设置 API key">
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
  <Step title="发送语音留言">
    通过任意已连接的渠道发送音频消息。OpenClaw 会将音频上传到
    SenseAudio，并在回复管道中使用转录文本。
  </Step>
</Steps>

## 选项

| 选项       | 路径                                  | 说明                              |
| ---------- | ------------------------------------- | --------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 ID            |
| `language` | `tools.media.audio.models[].language` | 可选的语言提示                    |
| `prompt`   | `tools.media.audio.prompt`            | 可选的转录提示词                  |
| `baseUrl`  | `tools.media.audio.baseUrl` 或模型    | 覆盖兼容 OpenAI 的基础 URL        |
| `headers`  | `tools.media.audio.request.headers`   | 额外的请求标头                    |

<Note>
在 OpenClaw 中，SenseAudio 仅支持批量 STT。Voice Call 实时转录仍使用
支持流式 STT 的提供商。
</Note>

## 相关内容

- [媒体理解（音频）](/zh-CN/nodes/audio)
- [模型提供商](/zh-CN/concepts/model-providers)
