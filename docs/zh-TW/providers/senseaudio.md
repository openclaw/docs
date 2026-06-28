---
read_when:
    - 你想要針對音訊附件使用 SenseAudio 語音轉文字
    - 需要 SenseAudio API 金鑰環境變數或音訊設定路徑
summary: 針對傳入語音訊息的 SenseAudio 批次語音轉文字
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio 可透過 OpenClaw 共享的 `tools.media.audio` 管線，轉錄傳入的音訊與語音留言附件。OpenClaw 會將 multipart 音訊傳送到相容於 OpenAI 的轉錄端點，並將傳回的文字注入為 `{{Transcript}}` 加上一個 `[Audio]` 區塊。

| 屬性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供者 ID     | `senseaudio`                                     |
| Plugin        | 內建，`enabledByDefault: true`                   |
| 合約          | `mediaUnderstandingProviders`（音訊）            |
| 驗證環境變數  | `SENSEAUDIO_API_KEY`                             |
| 預設模型      | `senseaudio-asr-pro-1.5-260319`                  |
| 預設 URL      | `https://api.senseaudio.cn/v1`                   |
| 網站          | [senseaudio.cn](https://senseaudio.cn)           |
| 文件          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 開始使用

<Steps>
  <Step title="設定您的 API 金鑰">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="啟用音訊提供者">
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
  <Step title="傳送語音留言">
    透過任何已連接的頻道傳送音訊訊息。OpenClaw 會將音訊上傳至
    SenseAudio，並在回覆管線中使用該轉錄稿。
  </Step>
</Steps>

## 選項

| 選項       | 路徑                                  | 說明                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 ID              |
| `language` | `tools.media.audio.models[].language` | 選用的語言提示                      |
| `prompt`   | `tools.media.audio.prompt`            | 選用的轉錄提示                      |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | 覆寫相容於 OpenAI 的基底            |
| `headers`  | `tools.media.audio.request.headers`   | 額外的要求標頭                      |

<Note>
SenseAudio 在 OpenClaw 中僅支援批次 STT。語音通話即時轉錄
會繼續使用支援串流 STT 的提供者。
</Note>

## 相關

- [媒體理解（音訊）](/zh-TW/nodes/audio)
- [模型提供者](/zh-TW/concepts/model-providers)
