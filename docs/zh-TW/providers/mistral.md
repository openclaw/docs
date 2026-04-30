---
read_when:
    - 您想在 OpenClaw 中使用 Mistral 模型
    - 您想要為語音通話使用 Voxtral 即時轉錄
    - 你需要 Mistral API 金鑰入門設定與模型參照
summary: 搭配 OpenClaw 使用 Mistral 模型與 Voxtral 轉錄功能
title: Mistral
x-i18n:
    generated_at: "2026-04-30T03:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw 支援 Mistral，用於文字/圖片模型路由（`mistral/...`），也支援在媒體理解中透過 Voxtral 進行音訊轉錄。
Mistral 也可用於記憶嵌入（`memorySearch.provider = "mistral"`）。

- 提供者：`mistral`
- 驗證：`MISTRAL_API_KEY`
- API：Mistral Chat Completions（`https://api.mistral.ai/v1`）

## 開始使用

<Steps>
  <Step title="Get your API key">
    在 [Mistral Console](https://console.mistral.ai/) 中建立 API 金鑰。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或直接傳入金鑰：

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 內建 LLM 目錄

OpenClaw 目前隨附以下 Mistral 目錄：

| 模型參照                         | 輸入        | 上下文  | 最大輸出   | 備註                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 文字、圖片  | 262,144 | 16,384     | 預設模型                                                        |
| `mistral/mistral-medium-2508`    | 文字、圖片  | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | 文字、圖片  | 128,000 | 16,384     | Mistral Small 4；可透過 API `reasoning_effort` 調整推理          |
| `mistral/pixtral-large-latest`   | 文字、圖片  | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 文字        | 256,000 | 4,096      | 程式碼編寫                                                      |
| `mistral/devstral-medium-latest` | 文字        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 文字        | 128,000 | 40,000     | 已啟用推理                                                      |

## 音訊轉錄（Voxtral）

透過媒體理解管線，使用 Voxtral 進行批次音訊轉錄。

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

隨附的 `mistral` Plugin 會將 Voxtral Realtime 註冊為 Voice Call 串流 STT 提供者。

| 設定         | 設定路徑                                                               | 預設值                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 金鑰     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退至 `MISTRAL_API_KEY`                |
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
OpenClaw 預設將 Mistral 即時 STT 設為 8 kHz 的 `pcm_mulaw`，因此 Voice Call
可以直接轉送 Twilio 媒體影格。只有當你的上游串流已經是原始 PCM 時，才使用 `encoding: "pcm_s16le"` 和相符的 `sampleRate`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` 對應至 Mistral Small 4，並在 Chat Completions API 上透過 `reasoning_effort` 支援[可調整推理](https://docs.mistral.ai/capabilities/reasoning/adjustable)（`none` 會將輸出中的額外思考降到最低；`high` 會在最終答案前顯示完整思考軌跡）。

    OpenClaw 會將工作階段的 **thinking** 等級對應到 Mistral 的 API：

    | OpenClaw thinking 等級                           | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    其他隨附的 Mistral 目錄模型不使用此參數。當你想要 Mistral 原生以推理為先的行為時，請繼續使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral 可以透過 `/v1/embeddings` 提供記憶嵌入（預設模型：`mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - Mistral 驗證使用 `MISTRAL_API_KEY`。
    - 提供者基底 URL 預設為 `https://api.mistral.ai/v1`。
    - 上線引導預設模型為 `mistral/mistral-large-latest`。
    - Z.AI 會使用你的 API 金鑰進行 Bearer 驗證。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和故障轉移行為。
  </Card>
  <Card title="Media understanding" href="/zh-TW/nodes/media-understanding" icon="microphone">
    音訊轉錄設定和提供者選擇。
  </Card>
</CardGroup>
