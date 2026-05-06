---
read_when:
    - 你想要將 SenseAudio 語音轉文字用於音訊附件
    - 需要 SenseAudio API 金鑰環境變數或音訊設定路徑
summary: SenseAudio 批次語音轉文字，用於傳入的語音訊息
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T02:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 775d27439d8f1598c6639df936f8a80f105ced9b915e98f7ff73d9049ac1b6a2
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 可透過 OpenClaw 共用的 `tools.media.audio` 管線，轉錄傳入的音訊與語音備註附件。OpenClaw 會將 multipart 音訊傳送至 OpenAI 相容的轉錄端點，並將傳回的文字注入為 `{{Transcript}}` 加上一個 `[Audio]` 區塊。

| 屬性          | 值                                               |
| ------------- | ------------------------------------------------ |
| Provider id   | `senseaudio`                                     |
| Plugin        | bundled, `enabledByDefault: true`                |
| Contract      | `mediaUnderstandingProviders`（音訊）            |
| Auth env var  | `SENSEAUDIO_API_KEY`                             |
| 預設模型      | `senseaudio-asr-pro-1.5-260319`                  |
| 預設 URL      | `https://api.senseaudio.cn/v1`                   |
| 網站          | [senseaudio.cn](https://senseaudio.cn)           |
| 文件          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## 開始使用

<Steps>
  <Step title="設定你的 API 金鑰">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="啟用音訊 provider">
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
  <Step title="傳送語音備註">
    透過任何已連接的通道傳送音訊訊息。OpenClaw 會上傳音訊至 SenseAudio，並在回覆管線中使用轉錄稿。
  </Step>
</Steps>

## 選項

| 選項       | 路徑                                  | 說明                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 id              |
| `language` | `tools.media.audio.models[].language` | 選用的語言提示                      |
| `prompt`   | `tools.media.audio.prompt`            | 選用的轉錄提示                      |
| `baseUrl`  | `tools.media.audio.baseUrl` 或模型    | 覆寫 OpenAI 相容的 base             |
| `headers`  | `tools.media.audio.request.headers`   | 額外的請求標頭                      |

<Note>
SenseAudio 在 OpenClaw 中僅支援批次 STT。語音通話即時轉錄會繼續使用支援串流 STT 的 provider。
</Note>
