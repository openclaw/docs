---
read_when:
    - 你想要對 antirez/ds4 執行 OpenClaw
    - 你想要一個具備工具呼叫功能的本機 DeepSeek V4 Flash 後端
    - 你需要 ds4-server 的 OpenClaw 配置
summary: 透過 ds4 執行 OpenClaw，這是一個本機 DeepSeek V4 Flash OpenAI 相容伺服器
title: ds4
x-i18n:
    generated_at: "2026-06-27T19:53:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) 透過本機
Metal 後端提供 DeepSeek V4 Flash，並提供 OpenAI 相容的 `/v1` API。OpenClaw 會透過通用的 `openai-completions` 提供者家族連線到 ds4。

ds4 不是隨 OpenClaw 綁定的提供者外掛。請在
`models.providers.ds4` 下設定它，然後選取 `ds4/deepseek-v4-flash`。

- 提供者 ID：`ds4`
- 外掛：無
- API：OpenAI 相容的 Chat Completions（`openai-completions`）
- 建議的基礎 URL：`http://127.0.0.1:18000/v1`
- 模型 ID：`deepseek-v4-flash`
- 工具呼叫：透過 OpenAI 風格的 `tools` 和 `tool_calls` 支援
- 推理：DeepSeek 風格的 `thinking` 和 `reasoning_effort`

## 需求

- 支援 Metal 的 macOS。
- 可正常運作的 ds4 checkout，包含 `ds4-server` 和 DeepSeek V4 Flash GGUF 檔案。
- 足夠支援你選擇的上下文的記憶體。較大的 `--ctx` 值會在伺服器啟動時配置更多
  KV 記憶體。

<Warning>
OpenClaw 代理程式回合會包含工具結構描述和工作區上下文。像 `--ctx 4096` 這樣很小的上下文
可能通過直接 curl 測試，但完整代理程式執行會因
`500 prompt exceeds context` 而失敗。代理程式與工具
冒煙測試請至少使用 `--ctx 32768`。只有在你有足夠記憶體且想要 ds4
Think Max 行為時，才使用 `--ctx 393216`。
</Warning>

## 快速開始

<Steps>
  <Step title="Start ds4-server">
    將 `<DS4_DIR>` 替換為你的 ds4 checkout 路徑。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    回應應包含 `deepseek-v4-flash`。

  </Step>
  <Step title="Add the OpenClaw provider config">
    加入[完整設定](#full-config)中的設定，然後執行一次性模型檢查：

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

當 ds4 已在 `127.0.0.1:18000` 上執行時，使用此設定。

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

讓 `contextWindow` 與 `ds4-server --ctx` 值保持一致。讓 `maxTokens`
與 `--tokens` 保持一致，除非你刻意想讓 OpenClaw 要求比伺服器預設值更少的
輸出。

## 隨需啟動

OpenClaw 可以只在選取 `ds4/...` 模型時啟動 ds4。將
`localService` 加入同一個提供者項目：

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

`command` 必須是絕對可執行檔路徑。不會使用 shell 查找和 `~` 展開。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)，了解每個
`localService` 欄位。

## Think Max

ds4 只會在兩個條件都成立時套用 Think Max：

- `ds4-server` 以 `--ctx 393216` 或更高值啟動。
- 要求使用 `reasoning_effort: "max"` 或等效的 ds4 effort 欄位。

如果你執行那麼大的上下文，請同時更新伺服器旗標和 OpenClaw 模型
中繼資料：

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

先從直接 HTTP 檢查開始：

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

接著測試 OpenClaw 模型路由：

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

若要進行完整代理程式與工具呼叫冒煙測試，請使用至少 32768 的上下文：

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

- `executionTrace.winnerProvider` 是 `ds4`
- `executionTrace.winnerModel` 是 `deepseek-v4-flash`
- `toolSummary.calls` 至少是 `1`
- `finalAssistantVisibleText` 以 `tool-ok` 開頭

## 疑難排解

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 未執行，或未繫結到 `baseUrl` 中的主機和連接埠。啟動
    `ds4-server`，然後重試：

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    設定的 `--ctx` 對 OpenClaw 回合而言太小。提高
    `ds4-server --ctx`，然後更新 `models.providers.ds4.models[].contextWindow`
    以符合它。包含工具的完整代理程式回合，所需上下文會遠多於
    直接的單一訊息 curl 要求。
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 只有在 `--ctx` 至少為 `393216` 且要求
    請求 `reasoning_effort: "max"` 時，才會使用 Think Max。較小的上下文會退回高
    推理。
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 有冷啟動的 Metal 駐留與模型暖機階段。當 OpenClaw 隨需啟動伺服器時，請使用
    `localService.readyTimeoutMs: 300000`。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Local model services" href="/zh-TW/gateway/local-model-services" icon="play">
    在模型要求之前隨需啟動本機模型伺服器。
  </Card>
  <Card title="Local models" href="/zh-TW/gateway/local-models" icon="server">
    選擇並操作本機模型後端。
  </Card>
  <Card title="Model providers" href="/zh-TW/concepts/model-providers" icon="layers">
    設定提供者參照、驗證和容錯移轉。
  </Card>
  <Card title="DeepSeek" href="/zh-TW/providers/deepseek" icon="brain">
    原生 DeepSeek 提供者行為與 thinking 控制項。
  </Card>
</CardGroup>
