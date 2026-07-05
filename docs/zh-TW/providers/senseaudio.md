---
read_when:
    - 你想要 SenseAudio 語音轉文字用於音訊附件
    - 您需要 SenseAudio API 金鑰環境變數或音訊設定路徑
summary: SenseAudio 批次語音轉文字，用於傳入語音留言
title: SenseAudio
x-i18n:
    generated_at: "2026-07-05T11:38:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 透過 OpenClaw 共用的 `tools.media.audio` 管線，轉錄傳入的音訊與語音備忘附件。OpenClaw 會將 multipart 音訊傳送到 OpenAI 相容的轉錄端點，並將回傳文字注入為 `{{Transcript}}` 加上一個 `[Audio]` 區塊。

| 屬性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供者 id     | `senseaudio`                                     |
| 外掛          | bundled, `enabledByDefault: true`                |
| 合約          | `mediaUnderstandingProviders` (audio)            |
| 驗證環境變數  | `SENSEAUDIO_API_KEY`                             |
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
  <Step title="傳送語音備忘">
    透過任何已連接的頻道傳送音訊訊息。OpenClaw 會將音訊上傳到 SenseAudio，並在回覆管線中使用轉錄文字。
  </Step>
</Steps>

## 選項

| 選項       | 路徑                                  | 說明                              |
| ---------- | ------------------------------------- | --------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 id            |
| `language` | `tools.media.audio.models[].language` | 選用的語言提示                    |
| `prompt`   | `tools.media.audio.prompt`            | 選用的轉錄提示                    |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | 覆寫 OpenAI 相容的基底            |
| `headers`  | `tools.media.audio.request.headers`   | 額外的請求標頭                    |

<Note>
SenseAudio 在 OpenClaw 中僅支援批次 STT。Voice Call 即時轉錄會繼續使用支援串流 STT 的提供者。
</Note>

## 相關

- [媒體理解（音訊）](/zh-TW/nodes/audio)
- [模型提供者](/zh-TW/concepts/model-providers)
