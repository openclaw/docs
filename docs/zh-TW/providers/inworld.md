---
read_when:
    - 你想要使用 Inworld 語音合成功能來產生傳出回覆
    - 你需要 Inworld 輸出 PCM 電話音訊或 OGG_OPUS 語音訊息
summary: Inworld 串流文字轉語音，供 OpenClaw 回覆使用
title: Inworld
x-i18n:
    generated_at: "2026-07-11T21:44:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是串流文字轉語音（TTS）供應商。在 OpenClaw 中，它會合成外送回覆音訊（預設為 MP3，語音訊息則為 OGG_OPUS），並為 Voice Call 等電話通訊頻道合成原始 PCM 音訊。

OpenClaw 會向 Inworld 的串流 TTS 端點發送請求，將回傳的 Base64 音訊區塊串接成單一緩衝區，再將結果交給標準回覆音訊管線。

| 屬性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 供應商 ID     | `inworld`                                                       |
| 外掛          | 官方外部套件（`@openclaw/inworld-speech`）                      |
| 契約          | `speechProviders`（僅限 TTS）                                   |
| 驗證環境變數  | `INWORLD_API_KEY`（HTTP Basic、Base64 儀表板憑證）               |
| 基礎 URL      | `https://api.inworld.ai`                                        |
| 預設語音      | `Sarah`                                                         |
| 預設模型      | `inworld-tts-1.5-max`                                           |
| 輸出          | MP3（預設）、OGG_OPUS（語音訊息）、PCM 22050 Hz（電話通訊）     |
| 網站          | [inworld.ai](https://inworld.ai)                                |
| 文件          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## 安裝外掛

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    從 Inworld 儀表板（Workspace > API Keys）複製憑證，並將其設為環境變數。該值會原封不動地作為 HTTP Basic 憑證傳送，因此請勿再次進行 Base64 編碼，也不要將其轉換為不記名權杖。

    ```bash
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
    透過任何已連線的頻道傳送回覆。OpenClaw 會使用 Inworld 合成音訊，並以 MP3 格式傳送（若頻道需要語音訊息，則使用 OGG_OPUS）。
  </Step>
</Steps>

## 設定選項

| 選項          | 路徑                                         | 說明                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 儀表板憑證。若未設定，則使用 `INWORLD_API_KEY`。            |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆寫 Inworld API 基礎 URL（預設為 `https://api.inworld.ai`）。     |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 語音識別碼（預設為 `Sarah`）。舊版別名：`speakerVoiceId`。        |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 ID（預設為 `inworld-tts-1.5-max`）。                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | 取樣溫度，大於 `0` 且不超過 `2`（選填）。                         |

## 注意事項

<AccordionGroup>
  <Accordion title="驗證">
    Inworld 使用 HTTP Basic 驗證，搭配單一經 Base64 編碼的憑證字串。請從 Inworld 儀表板原封不動地複製該字串。供應商會直接以 `Authorization: Basic <apiKey>` 傳送，不會再進行任何編碼，因此請勿自行進行 Base64 編碼，也不要傳入不記名權杖格式的權杖。相同的注意事項請參閱 [TTS 驗證注意事項](/zh-TW/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支援的模型 ID：`inworld-tts-1.5-max`（預設）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音訊輸出">
    回覆預設使用 MP3。當頻道目標為 `voice-note` 時，OpenClaw 會要求 Inworld 使用 `OGG_OPUS`，讓音訊以原生語音泡泡形式播放。電話通訊合成使用 22050 Hz 的原始 `PCM`，以提供給電話通訊橋接器。
  </Accordion>
  <Accordion title="自訂端點">
    使用 `messages.tts.providers.inworld.baseUrl` 覆寫 API 主機。傳送請求前會移除結尾的斜線。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概覽、供應商，以及 `messages.tts` 設定。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考，包括 `messages.tts` 設定。
  </Card>
  <Card title="供應商" href="/zh-TW/providers" icon="grid">
    OpenClaw 支援的所有供應商。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
</CardGroup>
