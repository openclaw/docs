---
read_when:
    - 你想要使用 Azure Speech 語音合成來產生傳出回覆
    - 您需要 Azure Speech 的原生 Ogg Opus 語音訊息輸出
summary: 用於 OpenClaw 回覆的 Azure AI Speech 文字轉語音
title: Azure Speech
x-i18n:
    generated_at: "2026-04-30T03:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech 是 Azure AI Speech 文字轉語音提供者。在 OpenClaw 中，它預設會將傳出回覆音訊合成為 MP3，為語音訊息合成原生 Ogg/Opus，並為 Voice Call 等電話語音頻道合成 8 kHz mulaw 音訊。

OpenClaw 會直接搭配 SSML 使用 Azure Speech REST API，並透過 `X-Microsoft-OutputFormat` 傳送由提供者擁有的輸出格式。

| 詳細資料                | 值                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 網站                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 文件                    | [Speech REST 文字轉語音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 驗證                    | `AZURE_SPEECH_KEY` 加上 `AZURE_SPEECH_REGION`                                                                  |
| 預設語音                | `en-US-JennyNeural`                                                                                            |
| 預設檔案輸出            | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| 預設語音訊息檔案        | `ogg-24khz-16bit-mono-opus`                                                                                    |

## 開始使用

<Steps>
  <Step title="建立 Azure Speech 資源">
    在 Azure 入口網站中建立 Speech 資源。從
    Resource Management > Keys and Endpoint 複製 **KEY 1**，並複製資源位置，
    例如 `eastus`。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="在 messages.tts 中選取 Azure Speech">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="傳送訊息">
    透過任何已連線的頻道傳送回覆。OpenClaw 會使用 Azure Speech 合成音訊，
    並為標準音訊傳送 MP3，或在頻道預期語音訊息時傳送 Ogg/Opus。
  </Step>
</Steps>

## 設定選項

| 選項                    | 路徑                                                        | 說明                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech 資源金鑰。會退回使用 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。 |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech 資源區域。會退回使用 `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | 可選的 Azure Speech 端點/基底 URL 覆寫。                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | 可選的 Azure Speech 基底 URL 覆寫。                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure 語音 ShortName（預設 `en-US-JennyNeural`）。                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML 語言代碼（預設 `en-US`）。                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | 音訊檔案輸出格式（預設 `audio-24khz-48kbitrate-mono-mp3`）。                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | 語音訊息輸出格式（預設 `ogg-24khz-16bit-mono-opus`）。                                       |

## 備註

<AccordionGroup>
  <Accordion title="驗證">
    Azure Speech 使用 Speech 資源金鑰，而不是 Azure OpenAI 金鑰。此金鑰會以
    `Ocp-Apim-Subscription-Key` 傳送；除非你提供 `endpoint` 或 `baseUrl`，
    否則 OpenClaw 會從 `region` 衍生
    `https://<region>.tts.speech.microsoft.com`。
  </Accordion>
  <Accordion title="語音名稱">
    使用 Azure Speech 語音的 `ShortName` 值，例如
    `en-US-JennyNeural`。內建提供者可以透過相同的 Speech 資源列出語音，
    並篩除標示為已淘汰或已停用的語音。
  </Accordion>
  <Accordion title="音訊輸出">
    Azure 接受 `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus` 和 `riff-24khz-16bit-mono-pcm` 等輸出格式。
    OpenClaw 會為 `voice-note` 目標要求 Ogg/Opus，讓頻道能傳送原生語音泡泡，
    而不需要額外的 MP3 轉換。
  </Accordion>
  <Accordion title="別名">
    `azure` 會被接受為現有 PR 和使用者設定的提供者別名，
    但新設定應使用 `azure-speech`，以避免與 Azure OpenAI 模型提供者混淆。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概覽、提供者，以及 `messages.tts` 設定。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    包含 `messages.tts` 設定的完整設定參考。
  </Card>
  <Card title="提供者" href="/zh-TW/providers" icon="grid">
    所有內建的 OpenClaw 提供者。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與除錯步驟。
  </Card>
</CardGroup>
