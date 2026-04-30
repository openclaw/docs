---
read_when:
    - 您想要針對音訊附件使用 SenseAudio 語音轉文字
    - 你需要 SenseAudio API 金鑰環境變數或音訊設定路徑
summary: 用於傳入語音訊息的 SenseAudio 批次語音轉文字
title: SenseAudio
x-i18n:
    generated_at: "2026-04-30T03:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 16
---

# SenseAudio

SenseAudio 可以透過 OpenClaw 共享的 `tools.media.audio` 管線，轉錄傳入的音訊／語音備註附件。OpenClaw 會將 multipart 音訊發送至 OpenAI 相容的轉錄端點，並將返回的文字注入為 `{{Transcript}}`，外加一個 `[Audio]` 區塊。

| 詳細資訊 | 值                                               |
| -------- | ------------------------------------------------ |
| 網站     | [senseaudio.cn](https://senseaudio.cn)           |
| 文件     | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| 驗證     | `SENSEAUDIO_API_KEY`                             |
| 預設模型 | `senseaudio-asr-pro-1.5-260319`                  |
| 預設 URL | `https://api.senseaudio.cn/v1`                   |

## 開始使用

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
    透過任何已連接的頻道傳送音訊訊息。OpenClaw 會將音訊上傳至 SenseAudio，並在回覆管線中使用轉錄文字。
  </Step>
</Steps>

## 選項

| 選項       | 路徑                                  | 說明                          |
| ---------- | ------------------------------------- | ----------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 ID        |
| `language` | `tools.media.audio.models[].language` | 選用的語言提示                |
| `prompt`   | `tools.media.audio.prompt`            | 選用的轉錄提示                |
| `baseUrl`  | `tools.media.audio.baseUrl` 或模型    | 覆寫 OpenAI 相容的基底 URL    |
| `headers`  | `tools.media.audio.request.headers`   | 額外的請求標頭                |

<Note>
SenseAudio 在 OpenClaw 中僅支援批次 STT。語音通話即時轉錄會繼續使用支援串流 STT 的供應商。
</Note>
