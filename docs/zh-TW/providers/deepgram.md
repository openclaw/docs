---
read_when:
    - 你想要對音訊附件使用 Deepgram 語音轉文字功能
    - 你想要為語音通話使用 Deepgram 串流轉錄
    - 你需要一個快速的 Deepgram 設定範例
summary: Deepgram 對傳入語音備註的轉錄
title: Deepgram
x-i18n:
    generated_at: "2026-07-05T11:36:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram 是一個語音轉文字 API。OpenClaw 透過 `tools.media.audio` 將其用於入站音訊/語音訊息
轉錄，並透過 `plugins.entries.voice-call.config.streaming` 將其用於語音通話串流 STT。

批次轉錄會將完整音訊檔案上傳到 Deepgram，並將
轉錄稿注入回覆管線（`{{Transcript}}` + `[Audio]` 區塊）。
語音通話串流會透過 Deepgram 的 WebSocket `listen` 端點轉送即時 G.711 u-law 畫格，並在 Deepgram
回傳時發出部分/最終轉錄稿。

| 詳細資料      | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 網站          | [deepgram.com](https://deepgram.com)                       |
| 文件          | [developers.deepgram.com](https://developers.deepgram.com) |
| 驗證          | `DEEPGRAM_API_KEY`                                         |
| 預設模型      | `nova-3`                                                   |

## 開始使用

<Steps>
  <Step title="Set your API key">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    透過任何已連線的通道傳送音訊訊息。OpenClaw 會透過 Deepgram 轉錄它，
    並將轉錄稿注入回覆管線。
  </Step>
</Steps>

## 設定選項

| 選項       | 路徑                                  | 說明                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram 模型 ID（預設：`nova-3`）    |
| `language` | `tools.media.audio.models[].language` | 語言提示（選用）                      |

`providerOptions.deepgram` 會將額外查詢參數直接合併到
Deepgram `/listen` 請求，因此任何 Deepgram 支援的參數名稱都可使用
（例如 `detect_language`、`punctuate`、`smart_format`）：

<Tabs>
  <Tab title="With language hint">
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
  <Tab title="With Deepgram options">
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

內建的 `deepgram` 外掛也會為語音通話外掛註冊即時轉錄提供者。

| 設定          | 設定路徑                                                                | 預設值                           |
| ------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API 金鑰      | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退至 `DEEPGRAM_API_KEY`        |
| 模型          | `...deepgram.model`                                                     | `nova-3`                         |
| 語言          | `...deepgram.language`                                                  | （未設定）                       |
| 編碼          | `...deepgram.encoding`                                                  | `mulaw`                          |
| 取樣率        | `...deepgram.sampleRate`                                                | `8000`                           |
| 端點偵測      | `...deepgram.endpointingMs`                                             | `800`                            |
| 暫定結果      | `...deepgram.interimResults`                                            | `true`                           |

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
語音通話會接收 8 kHz G.711 u-law 電話音訊。Deepgram
串流提供者預設為 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此
Twilio 媒體畫格可以直接轉送。
</Note>

## 注意事項

<AccordionGroup>
  <Accordion title="Authentication">
    驗證遵循標準的提供者驗證順序。`DEEPGRAM_API_KEY` 是
    最簡單的路徑。
  </Accordion>
  <Accordion title="Proxy and custom endpoints">
    使用代理時，可透過 `tools.media.audio.baseUrl` 和
    `tools.media.audio.headers` 覆寫端點或標頭。
  </Accordion>
  <Accordion title="Output behavior">
    輸出遵循與其他提供者相同的音訊規則（大小上限、逾時、
    轉錄稿注入）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Media tools" href="/zh-TW/tools/media-overview" icon="photo-film">
    音訊、影像與影片處理管線總覽。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    包含媒體工具設定的完整設定參考。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
  <Card title="FAQ" href="/zh-TW/help/faq" icon="circle-question">
    關於 OpenClaw 設定的常見問題。
  </Card>
</CardGroup>
