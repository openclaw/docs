---
read_when:
    - 您想在 OpenClaw 中使用 Mistral 模型
    - 你想要為語音通話使用 Voxtral 即時轉錄
    - 你需要 Mistral API 金鑰入門設定與模型參照
summary: 搭配 OpenClaw 使用 Mistral 模型與 Voxtral 轉錄
title: Mistral
x-i18n:
    generated_at: "2026-05-06T02:56:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw 包含一個內建的 Mistral Plugin，會註冊四個合約：聊天補全、媒體理解（Voxtral 批次轉錄）、Voice Call 的即時 STT（Voxtral Realtime），以及記憶嵌入（`mistral-embed`）。

| 屬性             | 值                                          |
| ---------------- | ------------------------------------------- |
| 供應商 ID        | `mistral`                                   |
| Plugin           | 內建，`enabledByDefault: true`              |
| 驗證環境變數     | `MISTRAL_API_KEY`                           |
| 入門設定旗標     | `--auth-choice mistral-api-key`             |
| 直接 CLI 旗標    | `--mistral-api-key <key>`                   |
| API              | OpenAI 相容（`openai-completions`）         |
| 基底 URL         | `https://api.mistral.ai/v1`                 |
| 預設模型         | `mistral/mistral-large-latest`              |
| 嵌入模型         | `mistral-embed`                             |
| Voxtral 批次     | `voxtral-mini-latest`（音訊轉錄）           |
| Voxtral 即時     | `voxtral-mini-transcribe-realtime-2602`     |

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [Mistral Console](https://console.mistral.ai/) 建立 API 金鑰。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或直接傳入金鑰：

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="設定預設模型">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 內建 LLM 目錄

OpenClaw 目前隨附此內建 Mistral 目錄：

| 模型參照                         | 輸入        | 上下文  | 最大輸出   | 備註                                                             |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 文字、影像  | 262,144 | 16,384     | 預設模型                                                         |
| `mistral/mistral-medium-2508`    | 文字、影像  | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | 文字、影像  | 128,000 | 16,384     | Mistral Small 4；可透過 API `reasoning_effort` 調整理 reasoning |
| `mistral/pixtral-large-latest`   | 文字、影像  | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 文字        | 256,000 | 4,096      | 程式碼                                                           |
| `mistral/devstral-medium-latest` | 文字        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 文字        | 128,000 | 40,000     | 已啟用 reasoning                                                 |

## 音訊轉錄（Voxtral）

透過媒體理解管線使用 Voxtral 進行批次音訊轉錄。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
媒體轉錄路徑使用 `/v1/audio/transcriptions`。Mistral 的預設音訊模型是 `voxtral-mini-latest`。
</Tip>

## Voice Call 串流 STT

內建的 `mistral` Plugin 會將 Voxtral Realtime 註冊為 Voice Call
串流 STT 供應商。

| 設定         | 設定路徑                                                               | 預設值                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 金鑰     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退使用 `MISTRAL_API_KEY`              |
| 模型         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 編碼         | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 取樣率       | `...mistral.sampleRate`                                                | `8000`                                  |
| 目標延遲     | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw 預設將 Mistral 即時 STT 設為 8 kHz 的 `pcm_mulaw`，讓 Voice Call
可以直接轉送 Twilio 媒體影格。只有在你的上游串流已經是原始 PCM 時，才使用 `encoding: "pcm_s16le"` 和相符的
`sampleRate`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="可調整的 reasoning（mistral-small-latest）">
    `mistral/mistral-small-latest` 對應到 Mistral Small 4，並支援在 Chat Completions API 上透過 `reasoning_effort` 使用[可調整的 reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable)（`none` 會將輸出中的額外思考降到最低；`high` 會在最終答案前顯示完整思考軌跡）。

    OpenClaw 會將工作階段的 **thinking** 層級對應到 Mistral 的 API：

    | OpenClaw thinking 層級                       | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    其他內建的 Mistral 目錄模型不會使用此參數。當你需要 Mistral 原生、以 reasoning 優先的行為時，請繼續使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="記憶嵌入">
    Mistral 可以透過 `/v1/embeddings` 提供記憶嵌入（預設模型：`mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="驗證與基底 URL">
    - Mistral 驗證使用 `MISTRAL_API_KEY`（Bearer 標頭）。
    - 供應商基底 URL 預設為 `https://api.mistral.ai/v1`，並接受標準 OpenAI 相容的聊天補全請求形狀。
    - 入門設定的預設模型是 `mistral/mistral-large-latest`。
    - 只有在 Mistral 明確發布你需要的區域端點時，才覆寫 `models.providers.mistral.baseUrl` 底下的基底 URL。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="microphone">
    音訊轉錄設定和供應商選擇。
  </Card>
</CardGroup>
