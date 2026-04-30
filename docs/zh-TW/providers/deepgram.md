---
read_when:
    - 你想要使用 Deepgram 為音訊附件進行語音轉文字
    - 您想為語音通話使用 Deepgram 串流轉錄
    - 你需要一個快速的 Deepgram 設定範例
summary: Deepgram 對傳入語音訊息的轉錄
title: Deepgram
x-i18n:
    generated_at: "2026-04-30T03:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram 是語音轉文字 API。在 OpenClaw 中，它透過 `tools.media.audio` 用於傳入音訊/語音訊息轉錄，並透過 `plugins.entries.voice-call.config.streaming` 用於 Voice Call 串流 STT。

對於批次轉錄，OpenClaw 會將完整音訊檔案上傳到 Deepgram，並將轉錄稿注入回覆管線（`{{Transcript}}` + `[Audio]` 區塊）。對於 Voice Call 串流，OpenClaw 會透過 Deepgram 的 WebSocket `listen` 端點轉送即時 G.711 u-law 影格，並在 Deepgram 傳回時發出部分或最終轉錄稿。

| 詳細資訊      | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 網站          | [deepgram.com](https://deepgram.com)                       |
| 文件          | [developers.deepgram.com](https://developers.deepgram.com) |
| 驗證          | `DEEPGRAM_API_KEY`                                         |
| 預設模型      | `nova-3`                                                   |

## 開始使用

<Steps>
  <Step title="設定你的 API 金鑰">
    將你的 Deepgram API 金鑰加入環境：

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="啟用音訊供應商">
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
    透過任何已連線的通道傳送音訊訊息。OpenClaw 會透過 Deepgram 轉錄它，並將轉錄稿注入回覆管線。
  </Step>
</Steps>

## 設定選項

| 選項              | 路徑                                                         | 說明                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram 模型 ID（預設：`nova-3`）    |
| `language`        | `tools.media.audio.models[].language`                        | 語言提示（選用）                      |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 啟用語言偵測（選用）                  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 啟用標點符號（選用）                  |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | 啟用智慧格式化（選用）                |

<Tabs>
  <Tab title="含語言提示">
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
  <Tab title="含 Deepgram 選項">
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

## Voice Call 串流 STT

隨附的 `deepgram` Plugin 也會為 Voice Call Plugin 註冊即時轉錄供應商。

| 設定            | 設定路徑                                                              | 預設值                           |
| --------------- | --------------------------------------------------------------------- | -------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退至 `DEEPGRAM_API_KEY`        |
| 模型            | `...deepgram.model`                                                   | `nova-3`                         |
| 語言            | `...deepgram.language`                                                | （未設定）                       |
| 編碼            | `...deepgram.encoding`                                                | `mulaw`                          |
| 取樣率          | `...deepgram.sampleRate`                                              | `8000`                           |
| 端點偵測        | `...deepgram.endpointingMs`                                           | `800`                            |
| 暫時結果        | `...deepgram.interimResults`                                          | `true`                           |

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
Voice Call 會以 8 kHz G.711 u-law 接收電話音訊。Deepgram 串流供應商預設為 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此可以直接轉送 Twilio 媒體影格。
</Note>

## 備註

<AccordionGroup>
  <Accordion title="驗證">
    驗證會遵循標準供應商驗證順序。`DEEPGRAM_API_KEY` 是最簡單的路徑。
  </Accordion>
  <Accordion title="Proxy 和自訂端點">
    使用 Proxy 時，可透過 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆寫端點或標頭。
  </Accordion>
  <Accordion title="輸出行為">
    輸出會遵循與其他供應商相同的音訊規則（大小上限、逾時、轉錄稿注入）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="媒體工具" href="/zh-TW/tools/media-overview" icon="photo-film">
    音訊、影像和影片處理管線概觀。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    包含媒體工具設定的完整設定參考。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題和偵錯步驟。
  </Card>
  <Card title="FAQ" href="/zh-TW/help/faq" icon="circle-question">
    關於 OpenClaw 設定的常見問題。
  </Card>
</CardGroup>
