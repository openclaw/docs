---
read_when:
    - 你想要 Azure Speech 合成用於對外回覆
    - 你需要從 Azure Speech 輸出原生 Ogg Opus 語音備忘錄
summary: Azure AI Speech 文字轉語音用於 OpenClaw 回覆
title: Azure 語音
x-i18n:
    generated_at: "2026-07-05T11:39:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech 是內建的 Azure AI Speech 文字轉語音提供者。OpenClaw
會直接以 SSML 呼叫 Azure Speech REST API，為標準回覆合成 MP3、為語音備註合成原生 Ogg/Opus，並為
Voice Call 等電話通道合成 8 kHz mulaw。請求會透過 `X-Microsoft-OutputFormat` 標頭傳送由提供者擁有的
輸出格式。

| 詳細資料                | 值                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 提供者 ID               | `azure-speech`（別名：`azure`）                                                                                |
| 網站                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 文件                    | [Speech REST 文字轉語音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)     |
| 驗證                    | `AZURE_SPEECH_KEY` 加上 `AZURE_SPEECH_REGION`                                                                  |
| 預設語音                | `en-US-JennyNeural`                                                                                            |
| 預設檔案輸出            | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| 預設語音備註檔案        | `ogg-24khz-16bit-mono-opus`                                                                                    |

## 開始使用

<Steps>
  <Step title="Create an Azure Speech resource">
    在 Azure 入口網站中建立 Speech 資源。從
    Resource Management > Keys and Endpoint 複製 **KEY 1**，並複製資源位置，
    例如 `eastus`。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
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
  <Step title="Send a message">
    透過任何已連線的通道傳送回覆。OpenClaw 會使用 Azure Speech 合成音訊，
    並為標準音訊傳送 MP3，或在通道預期語音備註時傳送 Ogg/Opus。
  </Step>
</Steps>

## 設定選項

所有選項都位於 `messages.tts.providers["azure-speech"]` 之下。

| 選項                    | 說明                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech 資源金鑰。會退回使用 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。        |
| `region`                | Azure Speech 資源區域。會退回使用 `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。                          |
| `endpoint`              | 選用的 Azure Speech 端點覆寫。會退回使用 `AZURE_SPEECH_ENDPOINT`。                                    |
| `baseUrl`               | 選用的 Azure Speech 基底 URL 覆寫。                                                                   |
| `voice`                 | Azure 語音 ShortName（預設 `en-US-JennyNeural`）。舊版別名：`voiceId`。                               |
| `lang`                  | SSML 語言代碼（預設 `en-US`）。                                                                       |
| `outputFormat`          | 音訊檔案輸出格式（預設 `audio-24khz-48kbitrate-mono-mp3`）。                                          |
| `voiceNoteOutputFormat` | 語音備註輸出格式（預設 `ogg-24khz-16bit-mono-opus`）。                                                |
| `timeoutMs`             | 以毫秒為單位的請求逾時覆寫。會退回使用全域 `messages.tts.timeoutMs`。                                 |

只要設定了 `apiKey`，並且設定 `region`、`endpoint` 或 `baseUrl` 其中之一，
就會視為提供者已設定完成。環境變數只會在設定鍵未設定時作為備援檢查。

## 備註

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech 使用 Speech 資源金鑰，而不是 Azure OpenAI 金鑰。金鑰會以
    `Ocp-Apim-Subscription-Key` 傳送；除非你提供 `endpoint` 或 `baseUrl`，
    否則 OpenClaw 會從 `region` 推導出
    `https://<region>.tts.speech.microsoft.com`。
  </Accordion>
  <Accordion title="Voice names">
    使用 Azure Speech 語音的 `ShortName` 值，例如
    `en-US-JennyNeural`。內建提供者可以透過同一個 Speech 資源列出語音，
    並篩除標示為已棄用、已退役或已停用的語音。
  </Accordion>
  <Accordion title="Audio outputs">
    Azure 接受 `audio-24khz-48kbitrate-mono-mp3`、
    `ogg-24khz-16bit-mono-opus` 和 `riff-24khz-16bit-mono-pcm` 等輸出格式。OpenClaw
    會為 `voice-note` 目標請求 Ogg/Opus，讓通道可以傳送原生語音泡泡，
    無需額外轉換 MP3，並會為電話目標強制使用
    `raw-8khz-8bit-mono-mulaw`。
  </Accordion>
  <Accordion title="Alias">
    `azure` 可作為既有設定的提供者別名，但新設定應使用 `azure-speech`，
    以避免與 Azure OpenAI 模型提供者混淆。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/zh-TW/tools/tts" icon="waveform-lines">
    TTS 概覽、提供者與 `messages.tts` 設定。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考，包含 `messages.tts` 設定。
  </Card>
  <Card title="Providers" href="/zh-TW/providers" icon="grid">
    所有內建 OpenClaw 提供者。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與除錯步驟。
  </Card>
</CardGroup>
