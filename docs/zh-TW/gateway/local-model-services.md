---
read_when:
    - 您希望 OpenClaw 僅在選用其模型或嵌入提供者時，才啟動本機模型伺服器
    - 你執行 ds4、inferrs、vLLM、llama.cpp、MLX 或其他與 OpenAI 相容的本機伺服器
    - 你需要控制本機供應商的冷啟動、就緒狀態與閒置關閉行為
summary: 在 OpenClaw 發出模型與嵌入請求前，視需要啟動本機模型伺服器
title: 本機模型服務
x-i18n:
    generated_at: "2026-07-11T21:21:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 會依需求啟動由供應商管理的本機模型伺服器。當模型或嵌入請求選取該供應商時，OpenClaw 會探測健康狀態端點；若服務未執行，則啟動程序並等待其就緒，然後傳送請求。使用此功能可避免讓耗用大量資源的本機伺服器全天候執行。

## 運作方式

1. 模型或嵌入請求會解析至已設定的供應商。
2. 如果該供應商具有 `localService`，OpenClaw 會探測 `healthUrl`。
3. 探測成功時，OpenClaw 會使用已在執行的伺服器。
4. 探測失敗時，OpenClaw 會使用 `args` 啟動 `command`。
5. OpenClaw 會輪詢健康狀態端點，直到 `readyTimeoutMs` 到期。
6. 請求會經由一般的模型或嵌入傳輸機制處理。
7. 如果程序由 OpenClaw 啟動且已設定 `idleStopMs`，則在最後一個處理中的請求閒置達到該時長後，OpenClaw 會停止此程序。

OpenClaw 不會為此安裝 launchd、systemd、Docker 或任何常駐程式。此伺服器只是第一個需要它的 OpenClaw 程序所建立的一般子程序。

系統會依每個已設定的供應商及其命令、引數與環境變數組合，將啟動操作依序執行，因此針對同一服務的並行聊天與嵌入請求不會啟動重複的伺服器。每個請求都會持有自己的租約，直到回應處理完成，因此閒置關閉會等待所有處理中的模型與嵌入請求完成。已設定的供應商別名仍各自獨立：兩個別名可以指向不同的 GPU 主機，而不會因使用相同的 Ollama、LM Studio 或 OpenAI 相容配接器識別碼而合併。

如果另一個 OpenClaw 程序已在相同的 `healthUrl` 上執行健康的伺服器，此程序會重複使用該伺服器，但不會接管它（每個程序只管理自己啟動的子程序）。啟動與結束記錄會包含經過長度限制及遮蔽處理的子程序輸出尾端內容，以及時間與結束詳細資料；設定的環境變數值絕不會輸出。

## 設定結構

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

請在供應商項目（而非 `localService`）上設定 `timeoutSeconds`，以避免緩慢的冷啟動和長時間生成觸發預設模型請求逾時。如果伺服器的就緒端點不是基礎 URL 下的 `/models`，請明確設定 `healthUrl`。

## 欄位

| 欄位             | 必要 | 說明                                                                                                                                 |
| ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | 是   | 可執行檔的絕對路徑。不會透過 shell PATH 查找。                                                                                       |
| `args`           | 否   | 程序引數。不支援 shell 展開、管線、萬用字元比對或引號處理。                                                                          |
| `cwd`            | 否   | 程序的工作目錄。                                                                                                                     |
| `env`            | 否   | 合併至 OpenClaw 程序環境之上的環境變數。                                                                                             |
| `healthUrl`      | 否   | 就緒狀態 URL。預設為在 `baseUrl` 後附加 `/models`（`http://127.0.0.1:8000/v1` 會變成 `http://127.0.0.1:8000/v1/models`）。             |
| `readyTimeoutMs` | 否   | 啟動就緒期限。預設值：`120000`。                                                                                                     |
| `idleStopMs`     | 否   | 由 OpenClaw 啟動之程序的閒置關閉延遲。設為 `0` 或省略時，程序會持續執行，直到 OpenClaw 結束。                                         |

## Inferrs 範例

Inferrs 是自訂的 OpenAI 相容 `/v1` 後端，因此相同的 `localService` API 也適用於 `inferrs` 供應商項目：

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

請將 `command` 替換為在執行 OpenClaw 的機器上執行 `which inferrs` 所得到的結果。完整的 inferrs 設定方式：[Inferrs](/zh-TW/providers/inferrs)。

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

完整的設定、上下文大小調整與驗證命令：[ds4](/zh-TW/providers/ds4)。

## 相關內容

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    本機模型設定、供應商選擇與安全指引。
  </Card>
  <Card title="Inferrs" href="/zh-TW/providers/inferrs" icon="cpu">
    透過 inferrs 的 OpenAI 相容本機伺服器執行 OpenClaw。
  </Card>
</CardGroup>
