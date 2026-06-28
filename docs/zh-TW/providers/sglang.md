---
read_when:
    - 你想要針對本機 SGLang 伺服器執行 OpenClaw
    - 你想要使用自己的模型提供 OpenAI 相容的 /v1 端點
summary: 使用 SGLang 執行 OpenClaw（相容於 OpenAI 的自託管伺服器）
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SGLang 透過相容 OpenAI 的 HTTP API 提供開放權重模型服務。OpenClaw 使用 `openai-completions` 提供者系列連線至 SGLang，並自動探索可用模型。

| 屬性                      | 值                                                           |
| ------------------------- | ------------------------------------------------------------ |
| 提供者 ID                 | `sglang`                                                     |
| Plugin                    | 隨附，`enabledByDefault: true`                               |
| 驗證環境變數              | `SGLANG_API_KEY`（如果伺服器沒有驗證，可使用任何非空值）     |
| Onboarding 旗標           | `--auth-choice sglang`                                       |
| API                       | 相容 OpenAI（`openai-completions`）                          |
| 預設基礎 URL              | `http://127.0.0.1:30000/v1`                                  |
| 預設模型預留位置          | `sglang/Qwen/Qwen3-8B`                                       |
| 串流用量                  | 是（`supportsStreamingUsage: true`）                         |
| 定價                      | 標記為外部免費（`modelPricing.external: false`）             |

當你使用 `SGLANG_API_KEY` 選擇啟用時，OpenClaw 也會從 SGLang **自動探索**可用模型。當你同時設定自訂 SGLang 基礎 URL 時，請在 `agents.defaults.models` 中使用 `sglang/*`，以保持動態探索。請參閱下方的[模型探索（隱式提供者）](#model-discovery-implicit-provider)。

## 開始使用

<Steps>
  <Step title="啟動 SGLang">
    使用相容 OpenAI 的伺服器啟動 SGLang。你的基礎 URL 應公開
    `/v1` 端點（例如 `/v1/models`、`/v1/chat/completions`）。SGLang
    通常執行於：

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="設定 API 金鑰">
    如果你的伺服器未設定驗證，任何值都可使用：

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="執行 onboarding 或直接設定模型">
    ```bash
    openclaw onboard
    ```

    或手動設定模型：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 模型探索（隱式提供者）

當設定了 `SGLANG_API_KEY`（或存在驗證設定檔），且你**沒有**
定義 `models.providers.sglang` 時，OpenClaw 會查詢：

- `GET http://127.0.0.1:30000/v1/models`

並將傳回的 ID 轉換為模型項目。

<Note>
如果你明確設定 `models.providers.sglang`，OpenClaw 預設會使用你宣告的
模型。當你想讓 OpenClaw 查詢該已設定提供者的 `/models` 端點，並納入
所有公告的 SGLang 模型時，請將 `"sglang/*": {}` 加到 `agents.defaults.models`。
</Note>

## 明確設定（手動模型）

在下列情況使用明確設定：

- SGLang 在不同的主機/連接埠上執行。
- 你想固定 `contextWindow`/`maxTokens` 值。
- 你的伺服器需要真正的 API 金鑰（或你想控制標頭）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="代理樣式行為">
    SGLang 會被視為代理樣式、相容 OpenAI 的 `/v1` 後端，而不是
    原生 OpenAI 端點。

    | 行為 | SGLang |
    |----------|--------|
    | 僅限 OpenAI 的請求塑形 | 未套用 |
    | `service_tier`、Responses `store`、提示快取提示 | 未傳送 |
    | 推理相容酬載塑形 | 未套用 |
    | 隱藏歸因標頭（`originator`、`version`、`User-Agent`） | 在自訂 SGLang 基礎 URL 上不會注入 |

  </Accordion>

  <Accordion title="疑難排解">
    **無法連線至伺服器**

    確認伺服器正在執行且有回應：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **驗證錯誤**

    如果請求因驗證錯誤而失敗，請設定符合伺服器設定的真正 `SGLANG_API_KEY`，
    或在 `models.providers.sglang` 下明確設定提供者。

    <Tip>
    如果你在沒有驗證的情況下執行 SGLang，任何非空的
    `SGLANG_API_KEY` 值都足以選擇啟用模型探索。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者項目。
  </Card>
</CardGroup>
