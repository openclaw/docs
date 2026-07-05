---
read_when:
    - 你想要針對本機 inferrs 伺服器執行 OpenClaw
    - 你正在透過 inferrs 提供 Gemma 或其他模型服務
    - 你需要 inferrs 的確切 OpenClaw 相容性旗標
summary: 透過 inferrs（OpenAI 相容的本機伺服器）執行 OpenClaw
title: 推斷
x-i18n:
    generated_at: "2026-07-05T11:41:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) 透過 OpenAI 相容的 `/v1` API 提供本機模型。OpenClaw 會透過通用的 `openai-completions` 配接器與它通訊。

| 屬性               | 值                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 提供者 ID          | `inferrs`（自訂；在 `models.providers.inferrs` 下設定）              |
| 外掛               | 無 — 不是隨附的 OpenClaw 提供者外掛                                  |
| 驗證環境變數       | 不需要；如果你的 inferrs 伺服器沒有驗證，任何值都可使用              |
| API                | OpenAI 相容（`openai-completions`）                                  |
| 建議基底 URL       | `http://127.0.0.1:8080/v1`（或你的 inferrs 伺服器監聽的位置）        |

<Note>
  `inferrs` 是自訂的自架 OpenAI 相容後端，不是專用的 OpenClaw 提供者外掛：你要在 `models.providers.inferrs` 下設定它，而不是選擇入門設定的驗證選項。若要使用具備自動探索功能的隨附外掛，請參閱 [SGLang](/zh-TW/providers/sglang) 或 [vLLM](/zh-TW/providers/vllm)。
</Note>

## 開始使用

<Steps>
  <Step title="使用模型啟動 inferrs">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="確認伺服器可連線">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="新增 OpenClaw 提供者項目">
    新增明確的提供者項目，並將你的預設模型指向它。請參閱下方的設定範例。
  </Step>
</Steps>

## 完整設定範例

本機 `inferrs` 伺服器上的 Gemma 4：

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 隨選啟動

只有在選取 `inferrs/...` 模型時，OpenClaw 才能自行啟動 `inferrs`。請將 `localService` 加入同一個提供者項目：

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` 必須是絕對路徑。在 Gateway 主機上執行 `which inferrs`，並使用該路徑。完整欄位參考：[本機模型服務](/zh-TW/gateway/local-model-services)。

## 進階設定

<AccordionGroup>
  <Accordion title="為什麼 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由只接受字串形式的 `messages[].content`，不接受結構化的內容部件陣列。

    <Warning>
    如果 OpenClaw 執行失敗並顯示：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    請在模型項目中設定 `compat.requiresStringContent: true`。OpenClaw 接著會在送出請求前，將純文字內容部件攤平成一般字串。
    </Warning>

  </Accordion>

  <Accordion title="Gemma 與工具結構描述注意事項">
    某些 `inferrs` + Gemma 組合可以接受小型直接 `/v1/chat/completions` 請求，但在完整的 OpenClaw 代理程式執行階段回合中會失敗。請先嘗試停用工具結構描述介面：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    這會降低較嚴格本機後端的提示壓力。如果微型直接請求仍可運作，但一般 OpenClaw 代理程式回合持續在 `inferrs` 內部當機，請將其視為上游模型/伺服器限制，而不是 OpenClaw 傳輸問題。

  </Accordion>

  <Accordion title="手動煙霧測試">
    設定完成後，測試兩個層級：

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    如果第一個命令可運作但第二個失敗，請參閱下方的疑難排解。

  </Accordion>

  <Accordion title="代理式行為">
    因為 `inferrs` 使用通用的 `openai-completions` 配接器（不是 `openai-responses`），所以只適用於原生 OpenAI 的請求塑形永遠不會套用：不會送出 `service_tier`、Responses `store`、提示快取提示，也不會送出 OpenAI 推理相容酬載塑形。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="curl /v1/models 失敗">
    `inferrs` 未執行、無法連線，或未繫結到你設定的主機/連接埠。確認伺服器已啟動並正在該位址上監聽。
  </Accordion>

  <Accordion title="messages[].content 預期為字串">
    在模型項目中設定 `compat.requiresStringContent: true`（見上方）。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 呼叫通過，但 openclaw infer model run 失敗">
    設定 `compat.supportsTools: false` 以停用工具結構描述介面（請參閱上方的 Gemma 注意事項）。
  </Accordion>

  <Accordion title="inferrs 在較大的代理程式回合中仍然當機">
    如果結構描述錯誤已消失，但 `inferrs` 在較大的代理程式回合中仍然當機，請將其視為上游 `inferrs` 或模型限制。降低提示壓力，或切換後端/模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需一般說明，請參閱[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Tip>

## 相關內容

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    使用 OpenClaw 連接本機模型伺服器。
  </Card>
  <Card title="本機模型服務" href="/zh-TW/gateway/local-model-services" icon="play">
    依需求為已設定的提供者啟動本機模型伺服器。
  </Card>
  <Card title="Gateway 疑難排解" href="/zh-TW/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    偵錯通過探測但代理程式執行失敗的本機 OpenAI 相容後端。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概觀。
  </Card>
</CardGroup>
