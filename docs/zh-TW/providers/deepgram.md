---
read_when:
    - 你想要使用 Deepgram 將音訊附件轉為文字
    - 您想為語音通話使用 Deepgram 串流轉錄功能
    - 你需要一個簡短的 Deepgram 設定範例
summary: 使用 Deepgram 轉錄傳入的語音訊息
title: Deepgram
x-i18n:
    generated_at: "2026-07-11T21:41:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram 是一項語音轉文字 API。OpenClaw 透過 `tools.media.audio` 使用它轉錄傳入的音訊／語音訊息，並透過 `plugins.entries.voice-call.config.streaming` 將它用於語音通話的串流 STT。

批次轉錄會將完整音訊檔案上傳至 Deepgram，並將逐字稿注入回覆管線（`{{Transcript}}` + `[Audio]` 區塊）。語音通話串流會透過 Deepgram 的 WebSocket `listen` 端點轉送即時 G.711 u-law 音訊框架，並在 Deepgram 傳回部分／最終逐字稿時將其發出。

| 詳細資料      | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 網站          | [deepgram.com](https://deepgram.com)                       |
| 文件          | [developers.deepgram.com](https://developers.deepgram.com) |
| 驗證          | `DEEPGRAM_API_KEY`                                         |
| 預設模型      | `nova-3`                                                   |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="啟用音訊提供者">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="傳送語音訊息">
    透過任何已連線的頻道傳送音訊訊息。OpenClaw 會透過 Deepgram 進行轉錄，並將逐字稿注入回覆管線。
  </Step>
</Steps>

## 設定選項

| 選項       | 路徑                                  | 說明                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram 模型 ID（預設：`nova-3`）    |
| `language` | `tools.media.audio.models[].language` | 語言提示（選用）                      |

`providerOptions.deepgram` 會將額外的查詢參數直接合併至 Deepgram `/listen` 要求，因此可使用 Deepgram 支援的任何參數名稱（例如 `detect_language`、`punctuate`、`smart_format`）：

<Tabs>
  <Tab title="包含語言提示">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="包含 Deepgram 選項">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 語音通話串流 STT

隨附的 `deepgram` 外掛也會為語音通話外掛註冊即時轉錄提供者。

| 設定            | 設定路徑                                                                | 預設值                              |
| --------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退至 `DEEPGRAM_API_KEY`           |
| 模型            | `...deepgram.model`                                                     | `nova-3`                            |
| 語言            | `...deepgram.language`                                                  | （未設定）                          |
| 編碼            | `...deepgram.encoding`                                                  | `mulaw`                             |
| 取樣率          | `...deepgram.sampleRate`                                                | `8000`                              |
| 端點偵測        | `...deepgram.endpointingMs`                                             | `800`                               |
| 暫時結果        | `...deepgram.interimResults`                                            | `true`                              |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
語音通話接收的電話音訊格式為 8 kHz G.711 u-law。Deepgram 串流提供者的預設值為 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此可直接轉送 Twilio 媒體框架。
</Note>

## 注意事項

<AccordionGroup>
  <Accordion title="驗證">
    驗證遵循標準的提供者驗證順序。`DEEPGRAM_API_KEY` 是最簡單的方式。
  </Accordion>
  <Accordion title="Proxy 與自訂端點">
    使用 Proxy 時，可透過 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆寫端點或標頭。
  </Accordion>
  <Accordion title="輸出行為">
    輸出遵循與其他提供者相同的音訊規則（大小上限、逾時、逐字稿注入）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="媒體工具" href="/zh-TW/tools/media-overview" icon="photo-film">
    音訊、影像及視訊處理管線概覽。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考資料，包括媒體工具設定。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
  <Card title="常見問答" href="/zh-TW/help/faq" icon="circle-question">
    有關 OpenClaw 設定的常見問題。
  </Card>
</CardGroup>
