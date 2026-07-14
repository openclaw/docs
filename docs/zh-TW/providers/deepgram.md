---
read_when:
    - 你想要使用 Deepgram 為音訊附件進行語音轉文字處理
    - 你想要為 Voice Call 使用 Deepgram 串流轉錄功能
    - 你需要一個快速的 Deepgram 設定範例
summary: 用於傳入語音記事的 Deepgram 轉錄
title: Deepgram
x-i18n:
    generated_at: "2026-07-14T13:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram 是語音轉文字 API。OpenClaw 透過 `tools.media.audio` 使用它進行傳入音訊／語音訊息的轉錄，並透過 `plugins.entries.voice-call.config.streaming` 進行語音通話串流 STT。

批次轉錄會將完整音訊檔案上傳至 Deepgram，並將轉錄文字注入回覆管線（`{{Transcript}}` + `[Audio]` 區塊）。
語音通話串流會透過 Deepgram 的 WebSocket `listen` 端點轉送即時 G.711 u-law 音訊框架，並在 Deepgram 傳回部分／最終轉錄文字時將其發出。

| 詳細資訊      | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 網站          | [deepgram.com](https://deepgram.com)                       |
| 文件          | [developers.deepgram.com](https://developers.deepgram.com) |
| 驗證          | `DEEPGRAM_API_KEY`                                         |
| 預設模型      | `nova-3`                                         |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
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
    透過任何已連線的頻道傳送音訊訊息。OpenClaw 會透過 Deepgram 將其轉錄，並將轉錄文字注入回覆管線。
  </Step>
</Steps>

## 設定選項

| 選項       | 路徑                                  | 說明                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram 模型 ID（預設：`nova-3`） |
| `language` | `tools.media.audio.models[].language` | 語言提示（選用）                      |

`providerOptions.deepgram` 會將額外的查詢參數直接合併至 Deepgram `/listen` 要求，因此可使用 Deepgram 支援的任何參數名稱（例如 `detect_language`、`punctuate`、`smart_format`）：

<Tabs>
  <Tab title="使用語言提示">
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
  <Tab title="使用 Deepgram 選項">
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

內建的 `deepgram` 外掛也會為語音通話外掛註冊即時轉錄供應商。

| 設定            | 設定路徑                                                                | 預設值                                       |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| API 金鑰        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退至 `DEEPGRAM_API_KEY`                    |
| 基底 URL        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` 或 Deepgram 的公開 API |
| 模型            | `...deepgram.model`                                                     | `nova-3`                            |
| 語言            | `...deepgram.language`                                                  | （未設定）                                   |
| 編碼            | `...deepgram.encoding`                                                  | `mulaw`                            |
| 取樣率          | `...deepgram.sampleRate`                                                | `8000`                            |
| 端點判定        | `...deepgram.endpointingMs`                                             | `800`                            |
| 暫時結果        | `...deepgram.interimResults`                                            | `true`                            |

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

若要使用 [Deepgram 自訂端點](https://developers.deepgram.com/reference/custom-endpoints)，請將 `baseUrl` 設為端點根路徑，包含任何基底路徑，但不包含 `/listen`。
即時端點接受 `http://`、`https://`、`ws://` 和 `wss://`。HTTP 會對應至 WS，HTTPS 會對應至 WSS，而明確指定的 WebSocket 配置則保持不變。
格式錯誤的 URL 和其他配置會在工作階段設定期間失敗。

<Note>
語音通話接收的電話音訊格式為 8 kHz G.711 u-law。Deepgram 串流供應商預設使用 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此可直接轉送 Twilio 媒體框架。
</Note>

## 注意事項

<AccordionGroup>
  <Accordion title="驗證">
    驗證遵循標準供應商驗證順序。`DEEPGRAM_API_KEY` 是最簡單的方式。
  </Accordion>
  <Accordion title="Proxy 和自訂端點">
    使用 Proxy 時，可透過 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆寫端點或標頭。
  </Accordion>
  <Accordion title="輸出行為">
    輸出遵循與其他供應商相同的音訊規則（大小上限、逾時、轉錄文字注入）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="媒體工具" href="/zh-TW/tools/media-overview" icon="photo-film">
    音訊、圖片和影片處理管線概覽。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考，包括媒體工具設定。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題和偵錯步驟。
  </Card>
  <Card title="常見問答" href="/zh-TW/help/faq" icon="circle-question">
    關於 OpenClaw 設定的常見問題。
  </Card>
</CardGroup>
