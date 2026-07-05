---
read_when:
    - 你想要將 Inworld 語音合成用於外送回覆
    - 你需要 Inworld 輸出的 PCM 電話音訊或 OGG_OPUS 語音備註。
summary: Inworld 串流文字轉語音用於 OpenClaw 回覆
title: Inworld
x-i18n:
    generated_at: "2026-07-05T11:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是串流文字轉語音 (TTS) 提供者。在 OpenClaw 中，它會合成外送回覆音訊（預設為 MP3，語音筆記使用 OGG_OPUS），以及供語音通話等電話通訊通道使用的原始 PCM 音訊。

OpenClaw 會發送請求到 Inworld 的串流 TTS 端點，將回傳的 base64 音訊片段串接成單一緩衝區，並將結果交給標準回覆音訊管線。

| 屬性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 提供者 id     | `inworld`                                                       |
| 外掛          | 官方外部套件 (`@openclaw/inworld-speech`)                       |
| 合約          | `speechProviders`（僅 TTS）                                     |
| 驗證環境變數  | `INWORLD_API_KEY`（HTTP Basic，Base64 控制台憑證）              |
| 基底 URL      | `https://api.inworld.ai`                                        |
| 預設語音      | `Sarah`                                                         |
| 預設模型      | `inworld-tts-1.5-max`                                           |
| 輸出          | MP3（預設）、OGG_OPUS（語音筆記）、PCM 22050 Hz（電話通訊）     |
| 網站          | [inworld.ai](https://inworld.ai)                                |
| 文件          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安裝外掛

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Set your API key">
    從你的 Inworld 控制台（Workspace > API Keys）複製憑證，並將它設定為環境變數。該值會逐字作為 HTTP Basic 憑證傳送，因此不要再次進行 Base64 編碼，也不要將它轉換為 bearer token。

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    透過任何已連接的通道傳送回覆。OpenClaw 會使用 Inworld 合成音訊，並以 MP3 傳送（或在通道預期語音筆記時使用 OGG_OPUS）。
  </Step>
</Steps>

## 設定選項

| 選項          | 路徑                                         | 說明                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 控制台憑證。會退回使用 `INWORLD_API_KEY`。                   |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆寫 Inworld API 基底 URL（預設 `https://api.inworld.ai`）。        |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 語音識別碼（預設 `Sarah`）。舊版別名：`speakerVoiceId`。            |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 id（預設 `inworld-tts-1.5-max`）。                         |
| `temperature` | `messages.tts.providers.inworld.temperature` | 取樣溫度，`0`（不含）到 `2`（選用）。                               |

## 注意事項

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld 使用 HTTP Basic 驗證，搭配單一 Base64 編碼憑證字串。請從 Inworld 控制台逐字複製。提供者會將它作為 `Authorization: Basic <apiKey>` 傳送，不會再進行任何編碼，因此不要自行進行 Base64 編碼，也不要傳入 bearer 風格的 token。相同提醒請參閱 [TTS 驗證注意事項](/zh-TW/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="Models">
    支援的模型 id：`inworld-tts-1.5-max`（預設）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="Audio outputs">
    回覆預設使用 MP3。當通道目標為 `voice-note` 時，OpenClaw 會向 Inworld 要求 `OGG_OPUS`，讓音訊以原生語音泡泡播放。電話通訊合成會使用 22050 Hz 的原始 `PCM`，以供給電話通訊橋接器。
  </Accordion>
  <Accordion title="Custom endpoints">
    使用 `messages.tts.providers.inworld.baseUrl` 覆寫 API 主機。傳送請求前會移除結尾斜線。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概觀、提供者，以及 `messages.tts` 設定。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考，包含 `messages.tts` 設定。
  </Card>
  <Card title="Providers" href="/zh-TW/providers" icon="grid">
    所有支援的 OpenClaw 提供者。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與除錯步驟。
  </Card>
</CardGroup>
