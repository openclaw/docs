---
read_when:
    - 你想要讓 OpenClaw 搭配本機 inferrs 伺服器執行
    - 你正在透過 inferrs 提供 Gemma 或其他模型服務
    - 您需要用於 inferrs 的確切 OpenClaw 相容性旗標
summary: 透過 inferrs 執行 OpenClaw（OpenAI 相容的本機伺服器）
title: 推斷
x-i18n:
    generated_at: "2026-05-06T02:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) 可在 OpenAI 相容的 `/v1` API 後方提供本機模型。OpenClaw 透過通用的 `openai-completions` 路徑與 `inferrs` 搭配運作。

| 屬性               | 值                                                                 |
| ------------------ | ------------------------------------------------------------------ |
| Provider id        | `inferrs`（自訂；在 `models.providers.inferrs` 下設定）            |
| Plugin             | 無 — `inferrs` 不是隨 OpenClaw 捆綁的提供者 Plugin                 |
| Auth env var       | 選用。如果你的 inferrs 伺服器沒有驗證，任何值都可以使用            |
| API                | OpenAI 相容（`openai-completions`）                                |
| 建議 base URL      | `http://127.0.0.1:8080/v1`（或你的 inferrs 伺服器所在位置）        |

<Note>
  `inferrs` 目前最適合視為自訂自架的 OpenAI 相容後端，而不是專用的 OpenClaw 提供者 Plugin。你會透過 `models.providers.inferrs` 設定它，而不是使用入門設定選項旗標。如果你需要真正捆綁且具備自動探索能力的 Plugin，請參閱 [SGLang](/zh-TW/providers/sglang) 或 [vLLM](/zh-TW/providers/vllm)。
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
  <Step title="加入 OpenClaw 提供者項目">
    加入明確的提供者項目，並將你的預設模型指向它。請參閱下方完整設定範例。
  </Step>
</Steps>

## 完整設定範例

此範例使用本機 `inferrs` 伺服器上的 Gemma 4。

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

## 進階設定

<AccordionGroup>
  <Accordion title="為什麼 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由只接受字串形式的
    `messages[].content`，不接受結構化的內容片段陣列。

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

    OpenClaw 會先將純文字內容片段展平成一般字串，再送出請求。

  </Accordion>

  <Accordion title="Gemma 與工具結構描述注意事項">
    某些目前的 `inferrs` + Gemma 組合可以接受小型直接
    `/v1/chat/completions` 請求，但在完整的 OpenClaw agent-runtime
    回合中仍會失敗。

    如果發生這種情況，請先嘗試：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    這會停用該模型的 OpenClaw 工具結構描述介面，並可降低較嚴格本機後端的提示壓力。

    如果很小的直接請求仍可運作，但一般 OpenClaw 代理程式回合持續在
    `inferrs` 內部崩潰，剩餘問題通常是上游模型/伺服器行為，而不是 OpenClaw 的傳輸層。

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

    如果第一個命令可以運作但第二個失敗，請查看下方的疑難排解章節。

  </Accordion>

  <Accordion title="代理樣式行為">
    `inferrs` 會被視為代理樣式的 OpenAI 相容 `/v1` 後端，而不是原生 OpenAI 端點。

    - 原生 OpenAI 專用的請求塑形不適用於這裡
    - 沒有 `service_tier`、沒有 Responses `store`、沒有提示快取提示，也沒有
      OpenAI 推理相容酬載塑形
    - 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）
      不會注入自訂的 `inferrs` base URL

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="curl /v1/models 失敗">
    `inferrs` 未執行、無法連線，或未繫結到預期的主機/連接埠。請確認伺服器已啟動，並正在你設定的位址上監聽。
  </Accordion>

  <Accordion title="messages[].content 預期為字串">
    在模型項目中設定 `compat.requiresStringContent: true`。詳情請參閱上方
    `requiresStringContent` 章節。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 呼叫通過，但 openclaw infer model run 失敗">
    嘗試設定 `compat.supportsTools: false` 以停用工具結構描述介面。
    請參閱上方的 Gemma 工具結構描述注意事項。
  </Accordion>

  <Accordion title="inferrs 在較大型代理程式回合中仍然崩潰">
    如果 OpenClaw 已不再收到結構描述錯誤，但 `inferrs` 在較大型代理程式回合中仍然崩潰，請將其視為上游 `inferrs` 或模型限制。降低提示壓力，或改用不同的本機後端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需一般協助，請參閱 [疑難排解](/zh-TW/help/troubleshooting) 和 [FAQ](/zh-TW/help/faq)。
</Tip>

## 相關內容

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    讓 OpenClaw 對本機模型伺服器執行。
  </Card>
  <Card title="Gateway 疑難排解" href="/zh-TW/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    偵錯通過探測但代理程式執行失敗的本機 OpenAI 相容後端。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
</CardGroup>
