---
read_when:
    - 你想要使用 Azure Speech 為外送回覆合成語音
    - 你需要 Azure Speech 原生輸出的 Ogg Opus 語音訊息格式
summary: 用於 OpenClaw 回覆的 Azure AI Speech 文字轉語音功能
title: Azure 語音服務
x-i18n:
    generated_at: "2026-07-11T21:41:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech 是內建的 Azure AI Speech 文字轉語音提供者。OpenClaw
會使用 SSML 直接呼叫 Azure Speech REST API，為標準回覆合成 MP3、
為語音訊息合成原生 Ogg/Opus，並為 Voice Call 等電話語音通道合成
8 kHz mulaw。請求會透過 `X-Microsoft-OutputFormat` 標頭傳送由提供者管理的
輸出格式。

| 詳細資訊                | 值                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 提供者 ID               | `azure-speech`（別名：`azure`）                                                                                |
| 網站                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 文件                    | [Speech REST 文字轉語音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)     |
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
    透過任何已連線的通道傳送回覆。OpenClaw 會使用 Azure Speech 合成音訊，
    並為標準音訊提供 MP3；當通道需要語音訊息時，則提供 Ogg/Opus。
  </Step>
</Steps>

## 設定選項

所有選項都位於 `messages.tts.providers["azure-speech"]` 之下。

| 選項                    | 說明                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech 資源金鑰。若未設定，則依序使用 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。 |
| `region`                | Azure Speech 資源區域。若未設定，則使用 `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。                     |
| `endpoint`              | 選用的 Azure Speech 端點覆寫值。若未設定，則使用 `AZURE_SPEECH_ENDPOINT`。                             |
| `baseUrl`               | 選用的 Azure Speech 基底 URL 覆寫值。                                                                 |
| `voice`                 | Azure 語音的 ShortName（預設為 `en-US-JennyNeural`）。舊版別名：`voiceId`。                           |
| `lang`                  | SSML 語言代碼（預設為 `en-US`）。                                                                     |
| `outputFormat`          | 音訊檔案輸出格式（預設為 `audio-24khz-48kbitrate-mono-mp3`）。                                        |
| `voiceNoteOutputFormat` | 語音訊息輸出格式（預設為 `ogg-24khz-16bit-mono-opus`）。                                              |
| `timeoutMs`             | 請求逾時覆寫值，單位為毫秒。若未設定，則使用全域 `messages.tts.timeoutMs`。                            |

設定 `apiKey`，並同時設定 `region`、`endpoint` 或 `baseUrl` 其中之一後，
即視為此提供者已完成設定。只有在設定鍵未設定時，才會將環境變數作為備用值檢查。

## 注意事項

<AccordionGroup>
  <Accordion title="驗證">
    Azure Speech 使用 Speech 資源金鑰，而不是 Azure OpenAI 金鑰。此金鑰會以
    `Ocp-Apim-Subscription-Key` 傳送；除非您提供 `endpoint` 或 `baseUrl`，
    否則 OpenClaw 會根據 `region` 產生
    `https://<region>.tts.speech.microsoft.com`。
  </Accordion>
  <Accordion title="語音名稱">
    請使用 Azure Speech 語音的 `ShortName` 值，例如
    `en-US-JennyNeural`。內建提供者可以透過相同的 Speech 資源列出語音，
    並篩除標示為已棄用、已停用或已停供的語音。
  </Accordion>
  <Accordion title="音訊輸出">
    Azure 接受 `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus` 和 `riff-24khz-16bit-mono-pcm` 等輸出格式。
    OpenClaw 會針對 `voice-note` 目標請求 Ogg/Opus，讓通道無須額外轉換 MP3
    即可傳送原生語音訊息泡泡，並針對電話語音目標強制使用
    `raw-8khz-8bit-mono-mulaw`。
  </Accordion>
  <Accordion title="別名">
    為支援現有設定，`azure` 可作為提供者別名，但新設定應使用
    `azure-speech`，以免與 Azure OpenAI 模型提供者混淆。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概覽、提供者及 `messages.tts` 設定。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整的設定參考，包括 `messages.tts` 設定。
  </Card>
  <Card title="提供者" href="/zh-TW/providers" icon="grid">
    所有內建的 OpenClaw 提供者。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
</CardGroup>
