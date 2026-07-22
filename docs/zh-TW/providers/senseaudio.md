---
read_when:
    - 你想要使用 SenseAudio 將音訊附件轉為文字
    - 你需要 SenseAudio API 金鑰環境變數或音訊設定路徑
summary: SenseAudio 批次語音轉文字，用於傳入的語音留言
title: SenseAudio
x-i18n:
    generated_at: "2026-07-22T10:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c0ca4a31a32eed85c1d9dcd13ebc2eaea94be370d2b1013ae8b4677949bea91d
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio 透過 OpenClaw 的共用 `tools.media.audio` 流水線，轉錄傳入的音訊與語音記事附件。OpenClaw 將多部分音訊傳送至 OpenAI 相容的轉錄端點，並將傳回的文字以 `{{Transcript}}` 加上 `[Audio]` 區塊的形式注入。

| 屬性          | 值                                               |
| ------------- | ------------------------------------------------ |
| 提供者 ID     | `senseaudio`                               |
| 外掛          | 內建，`enabledByDefault: true`                        |
| 合約          | `mediaUnderstandingProviders`（音訊）                       |
| 驗證環境變數  | `SENSEAUDIO_API_KEY`                               |
| 預設模型      | `senseaudio-asr-pro-1.5-260319`                               |
| 預設 URL      | `https://api.senseaudio.cn/v1`                               |
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
  <Step title="傳送語音記事">
    透過任何已連線的頻道傳送音訊訊息。OpenClaw 會將音訊上傳至
    SenseAudio，並在回覆流水線中使用轉錄文字。
  </Step>
</Steps>

## 選項

| 選項                 | 路徑                 | 說明                         |
| -------------------- | -------------------- | ---------------------------- |
| `model`   | `tools.media.models[].model`   | SenseAudio ASR 模型 ID        |
| `language`   | `tools.media.models[].language`   | 選用的語言提示               |
| `prompt`   | `tools.media.models[].prompt`   | 選用的轉錄提示               |
| `baseUrl`   | `tools.media.models[].baseUrl`   | 覆寫 OpenAI 相容的基底       |
| `headers`   | `tools.media.models[].headers`   | 額外的請求標頭               |

<Note>
SenseAudio 在 OpenClaw 中僅支援批次 STT。語音通話的即時轉錄
仍會使用支援串流 STT 的提供者。
</Note>

## 相關內容

- [媒體理解（音訊）](/zh-TW/nodes/audio)
- [模型提供者](/zh-TW/concepts/model-providers)
