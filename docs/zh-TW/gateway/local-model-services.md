---
read_when:
    - 你希望 OpenClaw 只有在選取其模型時才啟動本機模型伺服器
    - 你執行 ds4、inferrs、vLLM、llama.cpp、MLX，或其他與 OpenAI 相容的本機伺服器
    - 你需要控制本機提供者的冷啟動、就緒狀態與閒置關閉。
summary: 在 OpenClaw 模型請求前按需啟動本機模型伺服器
title: 本機模型服務
x-i18n:
    generated_at: "2026-07-05T11:18:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9098fe9245a98987e7c58edb8395ae67e7d2ee5ec2215cc7d3ae880a62073372
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 會依需求啟動由提供者擁有的本機模型伺服器。當請求選取該提供者的模型時，OpenClaw 會探測健康狀態端點；如果程序已停止，就啟動程序、等待就緒，然後傳送請求。使用它可避免讓昂貴的本機伺服器整天持續執行。

## 運作方式

1. 模型請求解析為已設定的提供者。
2. 如果該提供者有 `localService`，OpenClaw 會探測 `healthUrl`。
3. 探測成功時，OpenClaw 會使用已在執行的伺服器。
4. 探測失敗時，OpenClaw 會以 `args` 產生 `command`。
5. OpenClaw 會輪詢健康狀態端點，直到 `readyTimeoutMs` 到期。
6. 模型請求會透過一般提供者傳輸送出。
7. 如果 OpenClaw 啟動了程序且設定了 `idleStopMs`，它會在最後一個進行中的請求閒置達該時間後停止程序。

OpenClaw 不會為此安裝 launchd、systemd、Docker 或任何常駐程式。伺服器只是第一個需要它的 OpenClaw 程序的普通子程序。

啟動會依每組提供者命令/引數/環境變數序列化，因此同一服務的並行請求不會產生重複伺服器。如果另一個 OpenClaw 程序已在相同 `healthUrl` 有健康的伺服器，此程序會重用它但不接管它（每個程序只管理自己親自啟動的子程序）。作用中的串流回應會持有租約，因此閒置關閉會等到回應處理完成。

## 設定形狀

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

在提供者項目上設定 `timeoutSeconds`（不是 `localService`），讓緩慢的冷啟動與長時間生成不會碰到預設模型請求逾時。每當你的伺服器在基底 URL 的 `/models` 以外位置公開就緒狀態時，請設定明確的 `healthUrl`。

## 欄位

| 欄位 | 必填 | 說明 |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | 是      | 絕對可執行檔路徑。不進行 shell PATH 查找。                                                                                      |
| `args`           | 否       | 程序引數。不進行 shell 展開、管線、glob 比對或引號處理。                                                                  |
| `cwd`            | 否       | 程序的工作目錄。                                                                                                   |
| `env`            | 否       | 合併覆蓋在 OpenClaw 程序環境之上的環境變數。                                                                  |
| `healthUrl`      | 否       | 就緒狀態 URL。預設為在 `baseUrl` 後附加 `/models`（`http://127.0.0.1:8000/v1` 變成 `http://127.0.0.1:8000/v1/models`）。 |
| `readyTimeoutMs` | 否       | 啟動就緒期限。預設值：`120000`。                                                                                       |
| `idleStopMs`     | 否       | OpenClaw 啟動程序的閒置關閉延遲。`0` 或省略會讓它保持執行，直到 OpenClaw 結束。                             |

## Inferrs 範例

Inferrs 是自訂的 OpenAI 相容 `/v1` 後端，因此相同的 `localService` API 可與 `inferrs` 提供者項目搭配使用：

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

將 `command` 替換為在執行 OpenClaw 的機器上 `which inferrs` 的結果。完整 inferrs 設定：[Inferrs](/zh-TW/providers/inferrs)。

## ds4 範例

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

完整設定、脈絡大小調整與驗證命令：[ds4](/zh-TW/providers/ds4)。

## 相關

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    本機模型設定、提供者選擇與安全指引。
  </Card>
  <Card title="Inferrs" href="/zh-TW/providers/inferrs" icon="cpu">
    透過 inferrs OpenAI 相容本機伺服器執行 OpenClaw。
  </Card>
</CardGroup>
