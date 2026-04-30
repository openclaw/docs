---
read_when:
    - 您想要針對本機 SGLang 伺服器執行 OpenClaw
    - 您想要搭配自己的模型使用 OpenAI 相容的 /v1 端點
summary: 使用 SGLang 執行 OpenClaw（與 OpenAI 相容的自託管伺服器）
title: SGLang
x-i18n:
    generated_at: "2026-04-30T03:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 16
---

SGLang 可以透過 **OpenAI 相容** HTTP API 提供開源模型服務。
OpenClaw 可以使用 `openai-completions` API 連線至 SGLang。

當你使用 `SGLANG_API_KEY` 選擇啟用時（如果你的伺服器未強制驗證，任何值都可使用），且未定義明確的 `models.providers.sglang` 項目，OpenClaw 也可以從 SGLang **自動探索**可用模型。

OpenClaw 會將 `sglang` 視為支援串流使用量計算的本機 OpenAI 相容提供者，因此狀態/內容 token 計數可以從 `stream_options.include_usage` 回應更新。

## 開始使用

<Steps>
  <Step title="啟動 SGLang">
    以 OpenAI 相容伺服器啟動 SGLang。你的基底 URL 應公開
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
  <Step title="執行導覽設定或直接設定模型">
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
如果你明確設定 `models.providers.sglang`，將會略過自動探索，且
你必須手動定義模型。
</Note>

## 明確設定（手動模型）

在下列情況使用明確設定：

- SGLang 在不同主機/連接埠上執行。
- 你想要固定 `contextWindow`/`maxTokens` 值。
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
  <Accordion title="Proxy 風格行為">
    SGLang 會被視為 Proxy 風格的 OpenAI 相容 `/v1` 後端，而不是
    原生 OpenAI 端點。

    | 行為 | SGLang |
    |----------|--------|
    | 僅限 OpenAI 的請求塑形 | 不套用 |
    | `service_tier`、Responses `store`、提示快取提示 | 不傳送 |
    | 推理相容負載塑形 | 不套用 |
    | 隱藏歸因標頭（`originator`、`version`、`User-Agent`） | 不會注入到自訂 SGLang 基底 URL |

  </Accordion>

  <Accordion title="疑難排解">
    **無法連線至伺服器**

    確認伺服器正在執行並會回應：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **驗證錯誤**

    如果請求因驗證錯誤而失敗，請設定與伺服器設定相符的真正 `SGLANG_API_KEY`，或在
    `models.providers.sglang` 下明確設定提供者。

    <Tip>
    如果你在未啟用驗證的情況下執行 SGLang，`SGLANG_API_KEY` 的任何非空值
    都足以選擇啟用模型探索。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    包含提供者項目的完整設定結構描述。
  </Card>
</CardGroup>
