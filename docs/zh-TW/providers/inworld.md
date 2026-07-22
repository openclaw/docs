---
read_when:
    - 你想要使用 Inworld 語音合成來產生外送回覆
    - 你需要 Inworld 輸出 PCM 電話音訊或 OGG_OPUS 語音備忘錄
summary: 用於 OpenClaw 回覆的 Inworld 串流文字轉語音功能
title: Inworld
x-i18n:
    generated_at: "2026-07-22T10:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09560f5beda3b40d9c67f9408d34446f28ecddb8235fc0725c4265c813302946
    source_path: providers/inworld.md
    workflow: 16
---

Inworld 是串流文字轉語音（TTS）供應商。在 OpenClaw 中，它會合成外送回覆音訊（預設為 MP3，語音訊息則為 OGG_OPUS），以及供 Voice Call 等電話語音通道使用的原始 PCM 音訊。

OpenClaw 會向 Inworld 的串流 TTS 端點發出 POST 請求，將傳回的 Base64 音訊區塊串接成單一緩衝區，並將結果交給標準回覆音訊流水線。

| 屬性          | 值                                                              |
| ------------- | --------------------------------------------------------------- |
| 供應商 ID     | `inworld`                                              |
| 外掛          | 官方外部套件（`@openclaw/inworld-speech`）                              |
| 合約          | `speechProviders`（僅限 TTS）                                  |
| 驗證環境變數  | `INWORLD_API_KEY`（HTTP Basic、Base64 儀表板認證資訊）          |
| 基底 URL      | `https://api.inworld.ai`                                              |
| 預設語音      | `Sarah`                                              |
| 預設模型      | `inworld-tts-1.5-max`                                              |
| 輸出          | MP3（預設）、OGG_OPUS（語音訊息）、PCM 22050 Hz（電話語音）     |
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
    從 Inworld 儀表板（Workspace > API Keys）複製認證資訊，並將其設為環境變數。此值會原封不動地作為 HTTP Basic 認證資訊傳送，因此請勿再次進行 Base64 編碼，也不要將其轉換為 bearer 權杖。

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="在 tts 中選取 Inworld">
    ```json5
    {
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
    }
    ```
  </Step>
  <Step title="傳送訊息">
    透過任何已連線的通道傳送回覆。OpenClaw 會使用 Inworld 合成音訊，並以 MP3 傳送（若通道預期收到語音訊息，則使用 OGG_OPUS）。
  </Step>
</Steps>

## 設定選項

| 選項          | 路徑                                | 說明                                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `tts.providers.inworld.apiKey`      | Base64 儀表板認證資訊。若未設定，則改用 `INWORLD_API_KEY`。       |
| `baseUrl`     | `tts.providers.inworld.baseUrl`     | 覆寫 Inworld API 基底 URL（預設為 `https://api.inworld.ai`）。   |
| `voiceId`     | `tts.providers.inworld.voiceId`     | 語音識別碼（預設為 `Sarah`）。舊版別名：`speakerVoiceId`。 |
| `modelId`     | `tts.providers.inworld.modelId`     | TTS 模型 ID（預設為 `inworld-tts-1.5-max`）。                       |
| `temperature` | `tts.providers.inworld.temperature` | 取樣溫度，範圍從 `0`（不含）至 `2`（選用）。            |

## 注意事項

<AccordionGroup>
  <Accordion title="驗證">
    Inworld 使用 HTTP Basic 驗證搭配單一 Base64 編碼的認證資訊字串。請從 Inworld 儀表板原封不動地複製此字串。供應商會以 `Authorization: Basic <apiKey>` 傳送，不會進一步編碼，因此請勿自行進行 Base64 編碼，也不要傳入 bearer 樣式的權杖。相同提醒請參閱 [TTS 驗證注意事項](/zh-TW/tools/tts#inworld-primary)。
  </Accordion>
  <Accordion title="模型">
    支援的模型 ID：`inworld-tts-1.5-max`（預設）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音訊輸出">
    回覆預設使用 MP3。當通道目標為 `voice-note` 時，OpenClaw 會要求 Inworld 提供 `OGG_OPUS`，讓音訊以原生語音泡泡形式播放。電話語音合成會使用 22050 Hz 的原始 `PCM`，以供電話語音橋接器使用。
  </Accordion>
  <Accordion title="自訂端點">
    使用 `tts.providers.inworld.baseUrl` 覆寫 API 主機。傳送請求前會移除尾端斜線。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概觀、供應商及 `tts` 設定。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考，包括 `tts` 設定。
  </Card>
  <Card title="供應商" href="/zh-TW/providers" icon="grid">
    OpenClaw 支援的所有供應商。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
</CardGroup>
