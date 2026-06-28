---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你想要為語音通話使用 Voxtral 即時轉錄
    - 你需要 Mistral API 金鑰入門設定與模型參照
summary: 搭配 OpenClaw 使用 Mistral 模型與 Voxtral 轉錄
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:49:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 包含一個內建的 Mistral Plugin，會註冊四種合約：聊天補全、媒體理解（Voxtral 批次轉錄）、Voice Call 即時 STT（Voxtral Realtime），以及記憶嵌入（`mistral-embed`）。

| 屬性             | 值                                          |
| ---------------- | ------------------------------------------- |
| Provider id      | `mistral`                                   |
| Plugin           | 內建，`enabledByDefault: true`              |
| 驗證環境變數     | `MISTRAL_API_KEY`                           |
| Onboarding 旗標  | `--auth-choice mistral-api-key`             |
| 直接 CLI 旗標    | `--mistral-api-key <key>`                   |
| API              | OpenAI 相容（`openai-completions`）         |
| 基礎 URL         | `https://api.mistral.ai/v1`                 |
| 預設模型         | `mistral/mistral-large-latest`              |
| 嵌入模型         | `mistral-embed`                             |
| Voxtral 批次     | `voxtral-mini-latest`（音訊轉錄）           |
| Voxtral 即時     | `voxtral-mini-transcribe-realtime-2602`     |

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [Mistral Console](https://console.mistral.ai/) 建立 API 金鑰。
  </Step>
  <Step title="執行 onboarding">
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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
是內建目錄中目前的混合 Medium 模型：128B 密集權重、
文字與影像輸入、256K 上下文、函式呼叫、結構化輸出、程式編寫，
並可透過 Chat Completions API 調整推理。當你想使用 Mistral 較新的統一
代理式/程式編寫模型，而不是預設的 `mistral/mistral-large-latest` 時，請使用
`mistral/mistral-medium-3-5`。

OpenClaw 目前隨附這個內建 Mistral 目錄：

| 模型參照                         | 輸入        | 上下文  | 最大輸出   | 備註                                                             |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 文字、影像  | 262,144 | 16,384     | 預設模型                                                         |
| `mistral/mistral-medium-2508`    | 文字、影像  | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | 文字、影像  | 262,144 | 8,192      | Mistral Medium 3.5；可調整推理                                   |
| `mistral/mistral-small-latest`   | 文字、影像  | 128,000 | 16,384     | Mistral Small 4；透過 API `reasoning_effort` 可調整推理          |
| `mistral/pixtral-large-latest`   | 文字、影像  | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 文字        | 256,000 | 4,096      | 程式編寫                                                         |
| `mistral/devstral-medium-latest` | 文字        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 文字        | 128,000 | 40,000     | 已啟用推理                                                       |

Onboarding 後，在不啟動 Gateway 的情況下對 Medium 3.5 執行煙霧測試：

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

在變更設定前瀏覽內建目錄列：

```bash
openclaw models list --all --provider mistral --plain
```

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
串流 STT 提供者。

| 設定       | 設定路徑                                                               | 預設                                    |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API 金鑰   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 退回使用 `MISTRAL_API_KEY`              |
| 模型       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 編碼       | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 取樣率     | `...mistral.sampleRate`                                                | `8000`                                  |
| 目標延遲   | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw 將 Mistral 即時 STT 預設為 8 kHz 的 `pcm_mulaw`，讓 Voice Call
可以直接轉送 Twilio 媒體影格。只有在你的上游串流已經是原始 PCM 時，才使用
`encoding: "pcm_s16le"` 和相符的 `sampleRate`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="可調整推理">
    `mistral/mistral-small-latest`（Mistral Small 4）和 `mistral/mistral-medium-3-5` 支援在 Chat Completions API 上透過 `reasoning_effort` 使用[可調整推理](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)（`none` 會盡量減少輸出中的額外思考；`high` 會在最終答案前顯示完整思考軌跡）。Mistral 建議在 Medium 3.5 代理式和程式碼使用案例中使用 `reasoning_effort="high"`。

    OpenClaw 會將工作階段的 **thinking** 等級對應到 Mistral 的 API：

    | OpenClaw thinking 等級                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    不要將 Medium 3.5 推理模式與 `temperature: 0` 結合使用。Mistral
    HTTP API 會以 400 回應拒絕 `reasoning_effort="high"` 加上 `temperature: 0`。
    請不要設定 temperature，讓 Mistral 使用其預設值，或依照
    [Medium 3.5 建議設定](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    使用 `temperature: 0.7` 進行高推理。若要取得確定性的直接答案，
    請將 thinking 關閉/設為 minimal，讓 OpenClaw 在你降低 temperature 前傳送
    `reasoning_effort: "none"`。
    </Warning>

    Medium 3.5 推理的模型範圍設定範例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    其他內建 Mistral 目錄模型不使用此參數。當你想要 Mistral 原生的推理優先行為時，請繼續使用 `magistral-*` 模型。
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

  <Accordion title="驗證與基礎 URL">
    - Mistral 驗證使用 `MISTRAL_API_KEY`（Bearer 標頭）。
    - 提供者基礎 URL 預設為 `https://api.mistral.ai/v1`，並接受標準 OpenAI 相容的 chat-completions 請求形狀。
    - Onboarding 預設模型是 `mistral/mistral-large-latest`。
    - 只有在 Mistral 明確發布你需要的區域端點時，才覆寫 `models.providers.mistral.baseUrl` 底下的基礎 URL。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="microphone">
    音訊轉錄設定與提供者選擇。
  </Card>
</CardGroup>
