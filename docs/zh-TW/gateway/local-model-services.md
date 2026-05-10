---
read_when:
    - 你希望 OpenClaw 只有在選取其模型時才啟動本機模型伺服器
    - 你執行 ds4、inferrs、vLLM、llama.cpp、MLX，或其他與 OpenAI 相容的本機伺服器
    - 你需要控制本機提供者的冷啟動、就緒狀態與閒置關閉
summary: 在 OpenClaw 模型請求之前視需要啟動本機模型伺服器
title: 本機模型服務
x-i18n:
    generated_at: "2026-05-10T19:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 讓 OpenClaw 可依需求啟動由 provider 擁有的本機
模型伺服器。這是 provider 層級的設定：當選定的模型
屬於該 provider 時，OpenClaw 會探測服務，如果端點已停機就啟動程序，
等待就緒，然後送出模型請求。

可將它用於整天保持執行成本很高的本機伺服器，或用於
只要選擇模型就應足以啟動後端的手動設定。

## 運作方式

1. 模型請求會解析到已設定的 provider。
2. 如果該 provider 有 `localService`，OpenClaw 會探測 `healthUrl`。
3. 如果探測成功，OpenClaw 會使用現有伺服器。
4. 如果探測失敗，OpenClaw 會以 `args` 啟動 `command`。
5. OpenClaw 會輪詢就緒狀態，直到 `readyTimeoutMs` 到期。
6. 模型請求會透過一般的 provider 傳輸送出。
7. 如果 OpenClaw 啟動了該程序，且 `idleStopMs` 為正數，程序會在最後一個
   進行中的請求閒置達該時間後停止。

OpenClaw 不會為此安裝 launchd、systemd、Docker 或 daemon。
伺服器是第一個需要它的 OpenClaw 程序的子程序。

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

- `command`：絕對可執行檔路徑。不使用 shell 查找。
- `args`：程序引數。不會套用 shell 展開、管線、glob 或引號
  規則。
- `cwd`：程序的選用工作目錄。
- `env`：選用環境變數，會覆蓋合併到 OpenClaw 程序
  環境之上。
- `healthUrl`：就緒 URL。如果省略，OpenClaw 會將 `/models` 附加到
  `baseUrl`，因此 `http://127.0.0.1:8000/v1` 會變成
  `http://127.0.0.1:8000/v1/models`。
- `readyTimeoutMs`：啟動就緒期限。預設值：`120000`。
- `idleStopMs`：OpenClaw 啟動程序的閒置關閉延遲。`0` 或
  省略會讓程序保持存活，直到 OpenClaw 結束。

## Inferrs 範例

Inferrs 是自訂的 OpenAI 相容 `/v1` 後端，因此相同的本機服務
API 可搭配 `inferrs` provider 項目使用。

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

- 一個 OpenClaw 程序會管理它啟動的子程序。另一個看到相同 health URL
  已經在線的 OpenClaw 程序，會重用它而不接管它。
- 啟動會依 provider 命令與引數集序列化，因此並行
  請求不會為相同設定產生重複伺服器。
- 作用中的串流回應會持有租約；閒置關閉會等到回應
  body 處理完成。
- 在較慢的本機 provider 上使用 `timeoutSeconds`，讓冷啟動和長時間生成
  不會觸發預設模型請求逾時。
- 如果你的伺服器在 `/v1/models` 以外的位置公開就緒狀態，請使用明確的 `healthUrl`。

## 相關

<CardGroup cols={2}>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    本機模型設定、provider 選擇與安全指引。
  </Card>
  <Card title="Inferrs" href="/zh-TW/providers/inferrs" icon="cpu">
    透過 inferrs OpenAI 相容本機伺服器執行 OpenClaw。
  </Card>
</CardGroup>
