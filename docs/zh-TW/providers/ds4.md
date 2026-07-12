---
read_when:
    - 你想要使用 OpenClaw 執行 antirez/ds4
    - 你想要一個支援工具呼叫的本機 DeepSeek V4 Flash 後端
    - 你需要 ds4-server 的 OpenClaw 設定檔
summary: 透過 ds4 執行 OpenClaw；ds4 是本機的 DeepSeek V4 Flash OpenAI 相容伺服器
title: ds4
x-i18n:
    generated_at: "2026-07-11T21:41:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) 透過本機 Metal 後端提供 DeepSeek V4 Flash，並具備與 OpenAI 相容的 `/v1` API。OpenClaw 透過通用的 `openai-completions` 提供者系列連線至 ds4。

ds4 並非 OpenClaw 內建的提供者外掛。請在 `models.providers.ds4` 下進行設定，然後選擇 `ds4/deepseek-v4-flash`。

| 屬性        | 值                                                        |
| ----------- | --------------------------------------------------------- |
| 提供者 ID   | `ds4`                                                     |
| 外掛        | 無（僅透過設定）                                          |
| API         | 與 OpenAI 相容的 Chat Completions（`openai-completions`） |
| 基礎 URL    | `http://127.0.0.1:18000/v1`（建議）                       |
| 模型 ID     | `deepseek-v4-flash`                                       |
| 工具呼叫    | OpenAI 風格的 `tools` / `tool_calls`                      |
| 推理        | DeepSeek 風格的 `thinking` 與 `reasoning_effort`          |

## 需求

- 支援 Metal 的 macOS。
- 可正常運作的 ds4 原始碼簽出，其中包含 `ds4-server` 與 DeepSeek V4 Flash GGUF 檔案。
- 足以容納所選上下文的記憶體；較大的 `--ctx` 值會在伺服器啟動時配置更多 KV 記憶體。

<Warning>
OpenClaw 代理程式回合包含工具結構描述與工作區上下文。像 `--ctx 4096` 這樣的小型上下文可能通過直接的 curl 測試，卻會使完整代理程式執行因 `500 prompt exceeds context` 而失敗。代理程式與工具的冒煙測試應至少使用 `--ctx 32768`。只有在記憶體足夠且需要啟用 ds4 Think Max 時，才使用 `--ctx 393216`。
</Warning>

## 快速開始

<Steps>
  <Step title="啟動 ds4-server">
    將 `<DS4_DIR>` 替換為 ds4 原始碼簽出路徑。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="驗證與 OpenAI 相容的端點">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    回應應包含 `deepseek-v4-flash`。

  </Step>
  <Step title="新增 OpenClaw 提供者設定">
    新增[完整設定](#full-config)中的設定，然後執行一次性模型檢查：

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## 完整設定

當 ds4 已在 `127.0.0.1:18000` 上執行時，請使用此設定。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

請使 `contextWindow` 與 `ds4-server --ctx` 保持一致。除非刻意要讓 OpenClaw 請求的輸出少於伺服器預設值，否則請使 `maxTokens` 與 `--tokens` 保持一致。

## 隨選啟動

OpenClaw 可設定為僅在選取 `ds4/...` 模型時啟動 ds4。請將 `localService` 新增至相同的提供者項目：

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
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` 必須是可執行檔的絕對路徑。不會使用 Shell 路徑查找或 `~` 展開。如需瞭解所有 `localService` 欄位，請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。

## Think Max

僅當以下兩項條件同時成立時，ds4 才會套用 Think Max：

- `ds4-server` 以 `--ctx 393216` 或更高的值啟動。
- 請求使用 `reasoning_effort: "max"`（或等效的 ds4 推理強度欄位）。

若使用如此大的上下文，請同時更新伺服器旗標與 OpenClaw 模型中繼資料：

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## 測試

略過 OpenClaw 的直接 HTTP 檢查：

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw 模型路由（與快速開始中的檢查相同）：

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

完整代理程式與工具呼叫冒煙測試，上下文至少為 32768：

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

預期結果：

- `executionTrace.winnerProvider` 為 `ds4`
- `executionTrace.winnerModel` 為 `deepseek-v4-flash`
- `toolSummary.calls` 至少為 `1`
- `finalAssistantVisibleText` 以 `tool-ok` 開頭

## 疑難排解

<AccordionGroup>
  <Accordion title="curl /v1/models 無法連線">
    ds4 尚未執行，或未繫結至 `baseUrl` 中的主機／連接埠。請啟動 `ds4-server`，然後重試：

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    設定的 `--ctx` 對 OpenClaw 回合而言太小。請提高 `ds4-server --ctx`，然後更新 `models.providers.ds4.models[].contextWindow` 以與其相符。包含工具的完整代理程式回合所需的上下文遠多於直接傳送單一訊息的 curl 請求。
  </Accordion>

  <Accordion title="Think Max 未啟用">
    只有當 `--ctx` 至少為 `393216`，且請求指定 `reasoning_effort: "max"` 時，ds4 才會使用 Think Max。較小的上下文會回退至高強度推理。
  </Accordion>

  <Accordion title="第一次請求速度緩慢">
    ds4 需要經歷 Metal 冷啟駐留與模型暖機階段。當 OpenClaw 隨選啟動伺服器時，請設定 `localService.readyTimeoutMs: 300000`。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="本機模型服務" href="/zh-TW/gateway/local-model-services" icon="play">
    在模型請求之前隨選啟動本機模型伺服器。
  </Card>
  <Card title="本機模型" href="/zh-TW/gateway/local-models" icon="server">
    選擇並操作本機模型後端。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    設定提供者參照、驗證與容錯移轉。
  </Card>
  <Card title="DeepSeek" href="/zh-TW/providers/deepseek" icon="brain">
    DeepSeek 原生提供者行為與思考控制。
  </Card>
</CardGroup>
