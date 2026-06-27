---
read_when:
    - 你希望 OpenClaw 只有在其模型被選取時才啟動本機模型伺服器
    - 你執行 ds4、inferrs、vLLM、llama.cpp、MLX，或其他與 OpenAI 相容的本機伺服器
    - 你需要控制本機提供者的冷啟動、就緒狀態和閒置關閉
summary: 在 OpenClaw 模型請求前按需啟動本機模型伺服器
title: 本機模型服務
x-i18n:
    generated_at: "2026-06-27T19:19:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 可讓 OpenClaw 依需求啟動由提供者擁有的本機
模型伺服器。這是提供者層級的設定：當選取的模型屬於該提供者時，
OpenClaw 會探測服務，若端點未啟動則啟動程序，等待就緒，然後送出模型請求。

適用於整天常駐成本很高的本機伺服器，或是只要選取模型就應足以啟動後端的
手動設定。

## 運作方式

1. 模型請求解析到已設定的提供者。
2. 如果該提供者有 `localService`，OpenClaw 會探測 `healthUrl`。
3. 如果探測成功，OpenClaw 會使用現有伺服器。
4. 如果探測失敗，OpenClaw 會以 `args` 啟動 `command`。
5. OpenClaw 會輪詢就緒狀態，直到 `readyTimeoutMs` 到期。
6. 模型請求會透過一般提供者傳輸送出。
7. 如果程序是由 OpenClaw 啟動，且 `idleStopMs` 為正數，最後一個進行中的請求
   閒置達到該時間後，程序就會停止。

OpenClaw 不會為此安裝 launchd、systemd、Docker 或 daemon。該伺服器是第一個需要它的
OpenClaw 程序的子程序。

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

## 欄位

- `command`：絕對可執行檔路徑。不會使用 shell 查找。
- `args`：程序引數。不會套用 shell 展開、pipe、glob 或引號規則。
- `cwd`：程序的選用工作目錄。
- `env`：選用環境變數，會覆蓋合併到 OpenClaw 程序環境。
- `healthUrl`：就緒 URL。如果省略，OpenClaw 會在 `baseUrl` 後附加 `/models`，
  因此 `http://127.0.0.1:8000/v1` 會變成
  `http://127.0.0.1:8000/v1/models`。
- `readyTimeoutMs`：啟動就緒期限。預設值：`120000`。
- `idleStopMs`：OpenClaw 啟動程序的閒置關閉延遲。`0` 或省略會讓程序保持執行，直到 OpenClaw 結束。

## Inferrs 範例

Inferrs 是自訂的與 OpenAI 相容 `/v1` 後端，因此相同的本機服務
API 可搭配 `inferrs` 提供者項目使用。

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

將 `command` 替換為執行 OpenClaw 的機器上 `which inferrs` 的結果。

## ds4 範例

如需完整設定、context 大小調整指引與驗證命令，請參閱
[ds4](/zh-TW/providers/ds4)。

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

## 操作注意事項

- 一個 OpenClaw 程序會管理它啟動的子程序。另一個 OpenClaw 程序
  如果看到相同的健康檢查 URL 已經在線上，會重用它，但不會接管它。
- 啟動會依每組提供者命令與引數序列化，因此並行請求不會針對相同設定產生重複伺服器。
- 作用中的串流回應會持有 lease；閒置關閉會等到回應主體處理完成。
- 對緩慢的本機提供者使用 `timeoutSeconds`，避免冷啟動和長時間生成
  觸發預設模型請求逾時。
- 如果你的伺服器在 `/v1/models` 以外的位置公開就緒狀態，請使用明確的 `healthUrl`。

## 相關

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    本機模型設定、提供者選擇與安全指引。
  </Card>
  <Card title="Inferrs" href="/zh-TW/providers/inferrs" icon="cpu">
    透過 inferrs 與 OpenAI 相容的本機伺服器執行 OpenClaw。
  </Card>
</CardGroup>
