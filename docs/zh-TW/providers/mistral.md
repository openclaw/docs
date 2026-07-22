---
read_when:
    - 你想在 OpenClaw 中使用 Mistral 模型
    - 你想要為語音通話使用 Voxtral 即時轉錄功能
    - 你需要 Mistral API 金鑰的新手設定流程與模型參照名稱
summary: 搭配 OpenClaw 使用 Mistral 模型與 Voxtral 轉錄功能
title: Mistral
x-i18n:
    generated_at: "2026-07-22T10:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 23f0ebb664a37cadefb65b7f531cecd3bdfaa4ff5426cb665e305f8f03f0b0ab
    source_path: providers/mistral.md
    workflow: 16
---

隨附的 `mistral` 外掛註冊了四項合約：聊天補全、媒體理解（Voxtral 批次轉錄）、Voice Call 的即時 STT（Voxtral Realtime），以及記憶嵌入（`mistral-embed`）。

| 屬性             | 值                                          |
| ---------------- | ------------------------------------------- |
| 提供者 ID        | `mistral`                          |
| 外掛             | 隨附，預設啟用                              |
| 驗證環境變數     | `MISTRAL_API_KEY`                          |
| 引導設定旗標     | `--auth-choice mistral-api-key`                          |
| 直接命令列介面旗標 | `--mistral-api-key <key>`                        |
| API              | OpenAI 相容（`openai-completions`）           |
| 基礎 URL         | `https://api.mistral.ai/v1`                          |
| 預設模型         | `mistral/mistral-large-latest`                          |
| 嵌入模型         | `mistral-embed`                          |
| Voxtral 批次     | `voxtral-mini-latest`（音訊轉錄）              |
| Voxtral 即時     | `voxtral-mini-transcribe-realtime-2602`                          |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [Mistral Console](https://console.mistral.ai/) 中建立 API 金鑰。
  </Step>
  <Step title="執行引導設定">
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

| 模型參照                         | 輸入         | 上下文  | 最大輸出   | 備註                                                    |
| -------------------------------- | ------------ | ------- | ---------- | ------------------------------------------------------- |
| `mistral/mistral-large-latest`               | 文字、圖片   | 262,144 | 16,384     | 預設模型                                                |
| `mistral/mistral-medium-2508`               | 文字、圖片   | 262,144 | 8,192      | Mistral Medium 3.1                                      |
| `mistral/mistral-medium-3-5`               | 文字、圖片   | 262,144 | 8,192      | Mistral Medium 3.5；可調整推理                          |
| `mistral/mistral-small-latest`               | 文字、圖片   | 262,144 | 16,384     | 最新 Mistral Small 4；可調整 `reasoning_effort`         |
| `mistral/mistral-small-2603`               | 文字、圖片   | 262,144 | 16,384     | 固定版 Mistral Small 4；可調整 `reasoning_effort`       |
| `mistral/pixtral-large-latest`               | 文字、圖片   | 128,000 | 32,768     | Pixtral                                                 |
| `mistral/codestral-latest`               | 文字         | 256,000 | 4,096      | 程式設計                                                |
| `mistral/devstral-medium-latest`               | 文字         | 262,144 | 32,768     | Devstral 2                                              |
| `mistral/magistral-small`               | 文字         | 128,000 | 40,000     | 已啟用推理                                              |

變更設定前，先瀏覽隨附的目錄資料列：

```bash
openclaw models list --all --provider mistral --plain
```

在不啟動閘道的情況下對模型進行冒煙測試：

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## 音訊轉錄（Voxtral）

透過媒體理解流水線，使用 Voxtral 進行批次音訊轉錄：

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

隨附的 `mistral` 外掛會將 Voxtral Realtime 註冊為 Voice Call 串流 STT 提供者。

| 設定         | 設定路徑                                                               | 預設值                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 金鑰     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`                                                     | 後援使用 `MISTRAL_API_KEY`             |
| 模型         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602`                      |
| 編碼         | `...mistral.encoding`                                                     | `pcm_mulaw`                      |
| 取樣率       | `...mistral.sampleRate`                                                     | `8000`                      |
| 目標延遲     | `...mistral.targetStreamingDelayMs`                                                     | `800`                      |

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
OpenClaw 預設將 Mistral 即時 STT 設為 `pcm_mulaw`、8 kHz，讓 Voice Call 能直接轉送 Twilio 媒體影格。只有在上游串流已經是原始 PCM 時，才使用 `encoding: "pcm_s16le"` 及相符的 `sampleRate`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="可調整推理">
    `mistral/mistral-small-latest`、`mistral/mistral-small-2603` 和 `mistral/mistral-medium-3-5` 可透過 `reasoning_effort`，在 Chat Completions API 上支援[可調整推理](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)（`none` 會盡量減少輸出中的額外思考；`high` 則會在最終答案前顯示完整的思考軌跡）。

    OpenClaw 會將工作階段的**思考**層級對應至 Mistral 的 API：

    | OpenClaw 思考層級                                                     | Mistral `reasoning_effort` |
    | --------------------------------------------------------------------- | --------------------------- |
    | **關閉** / **最少**                                                   | `none`          |
    | **低** / **中** / **高** / **極高** / **自適應** / **最大**           | `high`          |

    <Warning>
    避免將 Medium 3.5 推理模式與 `temperature: 0` 搭配使用；據回報，Mistral HTTP API 會以 400 回應拒絕 `reasoning_effort="high"` 加上 `temperature: 0`。請不要設定溫度；或將思考設為關閉／最少，讓 OpenClaw 在你設定低溫度前先傳送 `reasoning_effort: "none"`。
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
    其他隨附的 Mistral 目錄模型不使用此參數。需要 Mistral 原生的推理優先行為時，請繼續使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="記憶嵌入">
    Mistral 可透過 `/v1/embeddings` 提供記憶嵌入（預設模型：`mistral-embed`）：

    ```json5
    {
      memory: {
        search: { provider: "mistral" },
      },
    }
    ```

  </Accordion>

  <Accordion title="驗證與基礎 URL">
    - Mistral 驗證使用 `MISTRAL_API_KEY`（Bearer 標頭）。
    - 提供者基礎 URL 預設為 `https://api.mistral.ai/v1`，並接受標準的 OpenAI 相容聊天補全要求格式。
    - 引導設定的預設模型是 `mistral/mistral-large-latest`。
    - 只有在 Mistral 明確發布你所需的區域端點時，才在 `models.providers.mistral.baseUrl` 下覆寫基礎 URL。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="microphone">
    音訊轉錄設定與提供者選擇。
  </Card>
</CardGroup>
