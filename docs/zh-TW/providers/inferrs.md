---
read_when:
    - 你想要讓 OpenClaw 連接本機 inferrs 伺服器執行
    - 你正透過 inferrs 提供 Gemma 或其他模型服務
    - 你需要用於 inferrs 的確切 OpenClaw 相容性旗標
summary: 透過 inferrs 執行 OpenClaw（與 OpenAI 相容的本機伺服器）
title: 推斷
x-i18n:
    generated_at: "2026-05-10T19:48:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs) 可以透過與 OpenAI 相容的 `/v1` API 提供本機模型。OpenClaw 可透過通用的 `openai-completions` 路徑與 `inferrs` 搭配使用。

| 屬性               | 值                                                                 |
| ------------------ | ------------------------------------------------------------------ |
| 提供者 ID          | `inferrs`（自訂；在 `models.providers.inferrs` 下設定）            |
| Plugin             | 無 — `inferrs` 不是 OpenClaw 內建的提供者 Plugin                   |
| 驗證環境變數       | 選用。如果你的 inferrs 伺服器沒有驗證，任何值都可以使用            |
| API                | 與 OpenAI 相容（`openai-completions`）                             |
| 建議基礎 URL       | `http://127.0.0.1:8080/v1`（或你的 inferrs 伺服器所在位置）        |

<Note>
  `inferrs` 目前最適合視為自訂的自架 OpenAI 相容後端，而不是專用的 OpenClaw 提供者 Plugin。你應透過 `models.providers.inferrs` 設定它，而不是使用上線導引選項旗標。如果你需要真正內建且具有自動探索功能的 Plugin，請參閱 [SGLang](/zh-TW/providers/sglang) 或 [vLLM](/zh-TW/providers/vllm)。
</Note>

## 開始使用

<Steps>
  <Step title="Start inferrs with a model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verify the server is reachable">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Add an OpenClaw provider entry">
    加入明確的提供者項目，並將你的預設模型指向它。請參閱下方完整設定範例。
  </Step>
</Steps>

## 完整設定範例

此範例在本機 `inferrs` 伺服器上使用 Gemma 4。

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

## 隨需啟動

OpenClaw 也可以只在選取 `inferrs/...` 模型時啟動 Inferrs。將 `localService` 加入同一個提供者項目：

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

`command` 必須是絕對路徑。在 Gateway 主機上使用 `which inferrs`，並將該路徑放入設定。完整欄位參考請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。

## 進階設定

<AccordionGroup>
  <Accordion title="Why requiresStringContent matters">
    有些 `inferrs` Chat Completions 路由只接受字串形式的 `messages[].content`，不接受結構化的內容片段陣列。

    <Warning>
    如果 OpenClaw 執行失敗並出現類似以下錯誤：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    請在你的模型項目中設定 `compat.requiresStringContent: true`。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw 會在傳送請求前，將純文字內容片段攤平成一般字串。

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    某些目前的 `inferrs` + Gemma 組合可接受小型直接 `/v1/chat/completions` 請求，但仍會在完整的 OpenClaw 代理程式執行階段回合中失敗。

    如果發生這種情況，請先嘗試：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    這會停用該模型的 OpenClaw 工具結構描述介面，並可降低較嚴格本機後端的提示壓力。

    如果極小型直接請求仍可運作，但一般 OpenClaw 代理程式回合持續在 `inferrs` 內部當機，剩餘問題通常是上游模型/伺服器行為，而不是 OpenClaw 的傳輸層。

  </Accordion>

  <Accordion title="Manual smoke test">
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

    如果第一個命令可運作但第二個失敗，請檢查下方的疑難排解章節。

  </Accordion>

  <Accordion title="Proxy-style behavior">
    `inferrs` 會被視為代理風格的 OpenAI 相容 `/v1` 後端，而不是原生 OpenAI 端點。

    - 原生 OpenAI 專用的請求塑形不適用於此
    - 沒有 `service_tier`、沒有 Responses `store`、沒有提示快取提示，也沒有 OpenAI reasoning 相容酬載塑形
    - 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）不會注入到自訂 `inferrs` 基礎 URL

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` 未執行、無法連線，或未繫結到預期的主機/連接埠。請確認伺服器已啟動，並正在你設定的位址上監聽。
  </Accordion>

  <Accordion title="messages[].content expected a string">
    在模型項目中設定 `compat.requiresStringContent: true`。詳細資訊請參閱上方的 `requiresStringContent` 章節。
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    嘗試設定 `compat.supportsTools: false` 以停用工具結構描述介面。請參閱上方的 Gemma 工具結構描述注意事項。
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    如果 OpenClaw 不再收到結構描述錯誤，但 `inferrs` 仍在較大的代理程式回合中當機，請將其視為上游 `inferrs` 或模型限制。降低提示壓力，或切換到不同的本機後端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需一般協助，請參閱[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Local models" href="/zh-TW/gateway/local-models" icon="server">
    使用本機模型伺服器執行 OpenClaw。
  </Card>
  <Card title="Local model services" href="/zh-TW/gateway/local-model-services" icon="play">
    依設定提供者的需求啟動本機模型伺服器。
  </Card>
  <Card title="Gateway troubleshooting" href="/zh-TW/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    偵錯通過探測但代理程式執行失敗的本機 OpenAI 相容後端。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照和容錯移轉行為的概觀。
  </Card>
</CardGroup>
