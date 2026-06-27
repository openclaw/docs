---
read_when:
    - 你想要為外送回覆使用 Inworld 語音合成
    - 你需要從 Inworld 輸出 PCM 電話音訊或 OGG_OPUS 語音備註。
summary: OpenClaw 回覆的 Inworld 串流文字轉語音
title: Inworld
x-i18n:
    generated_at: "2026-06-27T19:54:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是串流文字轉語音（TTS）供應商。在 OpenClaw 中，它會合成外送回覆音訊（預設為 MP3，語音訊息為 OGG_OPUS），以及供語音通話等電話通道使用的 PCM 音訊。

OpenClaw 會發佈到 Inworld 的串流 TTS 端點，將傳回的 base64 音訊區塊串接成單一緩衝區，並將結果交給標準回覆音訊管線。 

| 屬性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 供應商 ID     | `inworld`                                                       |
| 外掛          | 官方外部套件                                                    |
| 合約          | `speechProviders`（僅限 TTS）                                   |
| 驗證環境變數  | `INWORLD_API_KEY`（HTTP Basic，Base64 儀表板憑證）              |
| 基底 URL      | `https://api.inworld.ai`                                        |
| 預設語音      | `Sarah`                                                         |
| 預設模型      | `inworld-tts-1.5-max`                                           |
| 輸出          | MP3（預設）、OGG_OPUS（語音訊息）、PCM 22050 Hz（電話）         |
| 網站          | [inworld.ai](https://inworld.ai)                                |
| 文件          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Set your API key">
    從你的 Inworld 儀表板（Workspace > API Keys）複製憑證，並將其設定為環境變數。該值會原樣作為 HTTP Basic 憑證送出，因此不要再次進行 Base64 編碼，也不要將其轉換為 bearer token。

    ```
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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    透過任何已連線的通道傳送回覆。OpenClaw 會使用 Inworld 合成音訊，並以 MP3 傳遞（或在通道預期語音訊息時使用 OGG_OPUS）。
  </Step>
</Steps>

## 設定選項

| 選項             | 路徑                                            | 說明                                                            |
| ---------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64 儀表板憑證。會退回使用 `INWORLD_API_KEY`。              |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | 覆寫 Inworld API 基底 URL（預設 `https://api.inworld.ai`）。   |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | 語音識別碼（預設 `Sarah`）。                                   |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS 模型 ID（預設 `inworld-tts-1.5-max`）。                    |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | 取樣溫度 `0..2`（選用）。                                      |

## 備註

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld 使用 HTTP Basic 驗證，搭配單一 Base64 編碼憑證字串。請從 Inworld 儀表板原樣複製。供應商會以 `Authorization: Basic <apiKey>` 送出，不進行任何進一步編碼，因此不要自行進行 Base64 編碼，也不要傳入 bearer 形式的 token。相同提醒請參閱 [TTS 驗證備註](/zh-TW/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="Models">
    支援的模型 ID：`inworld-tts-1.5-max`（預設）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="Audio outputs">
    回覆預設使用 MP3。當通道目標為 `voice-note` 時，OpenClaw 會要求 Inworld 使用 `OGG_OPUS`，讓音訊以原生語音泡泡播放。電話語音合成會使用 22050 Hz 的原始 `PCM`，以供給電話橋接器。
  </Accordion>
  <Accordion title="Custom endpoints">
    使用 `messages.tts.providers.inworld.baseUrl` 覆寫 API 主機。送出請求前會移除尾端斜線。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概觀、供應商，以及 `messages.tts` 設定。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    包含 `messages.tts` 設定的完整設定參考。
  </Card>
  <Card title="Providers" href="/zh-TW/providers" icon="grid">
    所有支援的 OpenClaw 供應商。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
</CardGroup>
