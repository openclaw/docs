---
read_when:
    - 您想要為對外回覆使用 Inworld 語音合成
    - 您需要 Inworld 輸出的 PCM 電話語音或 OGG_OPUS 語音訊息
summary: 用於 OpenClaw 回覆的 Inworld 串流文字轉語音
title: Inworld
x-i18n:
    generated_at: "2026-04-30T03:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是串流文字轉語音 (TTS) 提供者。在 OpenClaw 中，它會合成外寄回覆音訊（預設為 MP3，語音訊息則為 OGG_OPUS），以及語音通話等電話語音頻道使用的 PCM 音訊。

OpenClaw 會送出請求至 Inworld 的串流 TTS 端點，將傳回的 base64 音訊區塊串接成單一緩衝區，並把結果交給標準回覆音訊管線。

| 詳細資料        | 值                                                       |
| ------------- | ----------------------------------------------------------- |
| 網站       | [inworld.ai](https://inworld.ai)                            |
| 文件          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| 驗證          | `INWORLD_API_KEY`（HTTP Basic，Base64 儀表板憑證） |
| 預設語音 | `Sarah`                                                     |
| 預設模型 | `inworld-tts-1.5-max`                                       |

## 開始使用

<Steps>
  <Step title="設定你的 API 金鑰">
    從 Inworld 儀表板（Workspace > API Keys）複製憑證，並將其設定為環境變數。此值會原樣作為 HTTP Basic 憑證送出，因此不要再次進行 Base64 編碼，也不要轉換為 bearer token。

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="在 messages.tts 中選取 Inworld">
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
  <Step title="傳送訊息">
    透過任何已連線的頻道傳送回覆。OpenClaw 會使用 Inworld 合成音訊，並以 MP3 傳送（或在頻道預期語音訊息時使用 OGG_OPUS）。
  </Step>
</Steps>

## 設定選項

| 選項        | 路徑                                         | 說明                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 儀表板憑證。會退回使用 `INWORLD_API_KEY`。     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆寫 Inworld API 基底 URL（預設 `https://api.inworld.ai`）。 |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 語音識別碼（預設 `Sarah`）。                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 ID（預設 `inworld-tts-1.5-max`）。                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | 取樣溫度 `0..2`（選用）。                           |

## 備註

<AccordionGroup>
  <Accordion title="驗證">
    Inworld 使用 HTTP Basic 驗證，並搭配單一 Base64 編碼憑證字串。請從 Inworld 儀表板原樣複製。提供者會以 `Authorization: Basic <apiKey>` 形式送出，不會進一步編碼，因此不要自行進行 Base64 編碼，也不要傳入 bearer 樣式的 token。相同提示請參閱 [TTS 驗證備註](/zh-TW/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支援的模型 ID：`inworld-tts-1.5-max`（預設）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音訊輸出">
    回覆預設使用 MP3。當頻道目標是 `voice-note` 時，OpenClaw 會向 Inworld 要求 `OGG_OPUS`，讓音訊以原生語音泡泡播放。電話語音合成會使用 22050 Hz 的原始 `PCM` 來供給電話語音橋接器。
  </Accordion>
  <Accordion title="自訂端點">
    使用 `messages.tts.providers.inworld.baseUrl` 覆寫 API 主機。送出請求前會移除結尾斜線。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概覽、提供者，以及 `messages.tts` 設定。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    包含 `messages.tts` 設定的完整設定參考。
  </Card>
  <Card title="提供者" href="/zh-TW/providers" icon="grid">
    所有隨附的 OpenClaw 提供者。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
</CardGroup>
