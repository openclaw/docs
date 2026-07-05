---
read_when:
    - 您想要對本機 SGLang 伺服器執行 OpenClaw
    - 你想要使用自己的模型提供與 OpenAI 相容的 /v1 端點
summary: 使用 SGLang 執行 OpenClaw（與 OpenAI 相容的自架伺服器）
title: SGLang
x-i18n:
    generated_at: "2026-07-05T11:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang 透過 OpenAI 相容的 HTTP API 提供開放權重模型。OpenClaw 使用 `openai-completions` 提供者系列連接到 SGLang，並自動探索可用模型。

| 屬性                      | 值                                                           |
| ------------------------- | ------------------------------------------------------------ |
| 提供者 ID                 | `sglang`                                                     |
| 外掛                      | 內建，`enabledByDefault: true`                               |
| 驗證環境變數              | `SGLANG_API_KEY`（如果伺服器沒有驗證，任何非空值皆可）       |
| 入門設定旗標              | `--auth-choice sglang`                                       |
| API                       | OpenAI 相容（`openai-completions`）                          |
| 預設基底 URL              | `http://127.0.0.1:30000/v1`                                  |
| 預設模型預留位置          | `sglang/Qwen/Qwen3-8B`                                       |
| 串流用量                  | 是（`supportsStreamingUsage: true`）                         |
| 定價                      | 標記為外部免費（`modelPricing.external: false`）             |

當你使用 `SGLANG_API_KEY` 選擇啟用時，OpenClaw 也會從 SGLang **自動探索**可用模型。當你也設定自訂 SGLang 基底 URL 時，請在 `agents.defaults.models` 中使用 `sglang/*`，讓探索保持動態。請參閱下方的[模型探索（隱含提供者）](#model-discovery-implicit-provider)。

## 開始使用

<Steps>
  <Step title="啟動 SGLang">
    使用 OpenAI 相容伺服器啟動 SGLang。你的基底 URL 應公開
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
  <Step title="執行入門設定或直接設定模型">
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

## 模型探索（隱含提供者）

當已設定 `SGLANG_API_KEY`（或存在驗證設定檔），且你**未**
定義 `models.providers.sglang` 時，OpenClaw 會查詢：

- `GET http://127.0.0.1:30000/v1/models`

並將傳回的 ID 轉換成模型項目。

<Note>
如果你明確設定 `models.providers.sglang`，OpenClaw 預設會使用你宣告的
模型。當你想讓 OpenClaw 查詢該已設定提供者的 `/models` 端點，並包含
所有公告的 SGLang 模型時，請將 `"sglang/*": {}` 新增至 `agents.defaults.models`。
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
    SGLang 會被視為代理樣式的 OpenAI 相容 `/v1` 後端，而不是
    原生 OpenAI 端點。

    | 行為 | SGLang |
    |----------|--------|
    | 僅限 OpenAI 的請求塑形 | 未套用 |
    | `service_tier`、Responses `store`、提示快取提示 | 未傳送 |
    | 推理相容酬載塑形 | 未套用 |
    | 隱藏歸因標頭（`originator`、`version`、`User-Agent`） | 不會在自訂 SGLang 基底 URL 上注入 |

  </Accordion>

  <Accordion title="疑難排解">
    **無法連線到伺服器**

    確認伺服器正在執行且有回應：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **驗證錯誤**

    如果請求因驗證錯誤而失敗，請設定符合你的伺服器設定的真正 `SGLANG_API_KEY`，
    或在 `models.providers.sglang` 下明確設定提供者。

    <Tip>
    如果你執行 SGLang 時未啟用驗證，任何非空的
    `SGLANG_API_KEY` 值都足以選擇啟用模型探索。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    包含提供者項目的完整設定結構描述。
  </Card>
</CardGroup>
