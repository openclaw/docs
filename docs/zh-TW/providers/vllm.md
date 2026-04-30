---
read_when:
    - 你想要讓 OpenClaw 搭配本機 vLLM 伺服器執行
    - 您想要使用自己的模型提供與 OpenAI 相容的 /v1 端點
summary: 使用 vLLM 執行 OpenClaw（OpenAI 相容的本機伺服器）
title: vLLM
x-i18n:
    generated_at: "2026-04-30T03:35:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM 可以透過 **OpenAI 相容** 的 HTTP API 提供開放原始碼（以及部分自訂）模型服務。OpenClaw 使用 `openai-completions` API 連線至 vLLM。

當你選擇使用 `VLLM_API_KEY`（如果你的伺服器不強制驗證，任何值都可使用）且未定義明確的 `models.providers.vllm` 項目時，OpenClaw 也可以從 vLLM **自動探索**可用模型。

OpenClaw 將 `vllm` 視為支援串流用量計算的本機 OpenAI 相容提供者，因此狀態/內容 token 計數可以從 `stream_options.include_usage` 回應更新。

| 屬性             | 值                                       |
| ---------------- | ---------------------------------------- |
| 提供者 ID        | `vllm`                                   |
| API              | `openai-completions`（OpenAI 相容）      |
| 驗證             | `VLLM_API_KEY` 環境變數                  |
| 預設基底 URL     | `http://127.0.0.1:8000/v1`               |

## 開始使用

<Steps>
  <Step title="使用 OpenAI 相容伺服器啟動 vLLM">
    你的基底 URL 應該公開 `/v1` 端點（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常執行於：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="設定 API 金鑰環境變數">
    如果你的伺服器不強制驗證，任何值都可使用：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="選取模型">
    替換為你的其中一個 vLLM 模型 ID：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 模型探索（隱含提供者）

當已設定 `VLLM_API_KEY`（或存在驗證設定檔）且你**未**定義 `models.providers.vllm` 時，OpenClaw 會查詢：

```
GET http://127.0.0.1:8000/v1/models
```

並將回傳的 ID 轉換為模型項目。

<Note>
如果你明確設定 `models.providers.vllm`，自動探索會被略過，且你必須手動定義模型。
</Note>

## 明確設定（手動模型）

在下列情況使用明確設定：

- vLLM 在不同主機或連接埠上執行
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的伺服器需要真實 API 金鑰（或你想控制標頭）
- 你連線至受信任的 loopback、LAN 或 Tailscale vLLM 端點

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
  <Accordion title="Proxy 樣式行為">
    vLLM 會被視為 proxy 樣式的 OpenAI 相容 `/v1` 後端，而不是原生 OpenAI 端點。這表示：

    | 行為 | 已套用？ |
    |----------|----------|
    | 原生 OpenAI 請求塑形 | 否 |
    | `service_tier` | 不傳送 |
    | Responses `store` | 不傳送 |
    | 提示快取提示 | 不傳送 |
    | OpenAI reasoning 相容承載塑形 | 不套用 |
    | 隱藏的 OpenClaw 歸屬標頭 | 不會注入自訂基底 URL |

  </Accordion>

  <Accordion title="Qwen thinking 控制">
    對於透過 vLLM 提供服務的 Qwen 模型，當伺服器預期 Qwen chat-template kwargs 時，請在模型項目上設定 `params.qwenThinkingFormat: "chat-template"`。OpenClaw 會將 `/think off` 對應為：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的 thinking 等級會傳送 `enable_thinking: true`。如果你的端點改為預期 DashScope 樣式的頂層旗標，請使用 `params.qwenThinkingFormat: "top-level"`，在請求根層級傳送 `enable_thinking`。也接受 snake-case 的 `params.qwen_thinking_format`。

  </Accordion>

  <Accordion title="Nemotron 3 thinking 控制">
    vLLM/Nemotron 3 可以使用 chat-template kwargs 控制 reasoning 是作為隱藏 reasoning 還是可見回答文字回傳。當 OpenClaw 工作階段在關閉 thinking 的情況下使用 `vllm/nemotron-3-*` 時，內建的 vLLM Plugin 會傳送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    若要自訂這些值，請在模型 params 下設定 `chat_template_kwargs`。如果你也設定 `params.extra_body.chat_template_kwargs`，該值具有最終優先權，因為 `extra_body` 是最後的請求主體覆寫。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen 工具呼叫顯示為文字">
    請先確認 vLLM 是使用該模型正確的工具呼叫剖析器與 chat template 啟動。例如，vLLM 文件記載 Qwen2.5 模型使用 `hermes`，Qwen3-Coder 模型使用 `qwen3_xml`。

    症狀：

    - Skills 或工具從未執行
    - assistant 列印原始 JSON/XML，例如 `{"name":"read","arguments":...}`
    - 當 OpenClaw 傳送 `tool_choice: "auto"` 時，vLLM 回傳空的 `tool_calls` 陣列

    某些 Qwen/vLLM 組合只有在請求使用 `tool_choice: "required"` 時才會回傳結構化工具呼叫。對於這些模型項目，請使用 `params.extra_body` 強制 OpenAI 相容請求欄位：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    將 `Qwen-Qwen2.5-Coder-32B-Instruct` 替換為下列命令回傳的確切 id：

    ```bash
    openclaw models list --provider vllm
    ```

    你也可以從 CLI 套用相同覆寫：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    這是一個選擇啟用的相容性因應方式。它會讓每個帶有工具的模型回合都要求工具呼叫，因此只能在專用本機模型項目且可接受該行為時使用。不要將它作為所有 vLLM 模型的全域預設，也不要使用會盲目將任意 assistant 文字轉換為可執行工具呼叫的 proxy。

  </Accordion>

  <Accordion title="自訂基底 URL">
    如果你的 vLLM 伺服器在非預設主機或連接埠上執行，請在明確提供者設定中設定 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="首次回應緩慢或遠端伺服器逾時">
    對於大型本機模型、遠端 LAN 主機或 tailnet 連結，請設定提供者範圍的請求逾時：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` 只套用於 vLLM 模型 HTTP 請求，包括連線建立、回應標頭、主體串流，以及整體 guarded-fetch 中止。請優先使用此設定，再考慮提高 `agents.defaults.timeoutSeconds`，後者控制整個 agent 執行。

  </Accordion>

  <Accordion title="伺服器無法連線">
    檢查 vLLM 伺服器是否正在執行且可存取：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果看到連線錯誤，請確認主機、連接埠，以及 vLLM 是否以 OpenAI 相容伺服器模式啟動。
    對於明確的 loopback、LAN 或 Tailscale 端點，也請設定 `models.providers.vllm.request.allowPrivateNetwork: true`；提供者請求預設會封鎖私人網路 URL，除非該提供者已明確受信任。

  </Accordion>

  <Accordion title="請求發生驗證錯誤">
    如果請求因驗證錯誤而失敗，請設定符合你伺服器設定的真實 `VLLM_API_KEY`，或在 `models.providers.vllm` 下明確設定提供者。

    <Tip>
    如果你的 vLLM 伺服器不強制驗證，任何非空的 `VLLM_API_KEY` 值都可作為 OpenClaw 的選擇啟用訊號。
    </Tip>

  </Accordion>

  <Accordion title="未探索到模型">
    自動探索需要設定 `VLLM_API_KEY`，且沒有明確的 `models.providers.vllm` 設定項目。如果你已手動定義提供者，OpenClaw 會略過探索，只使用你宣告的模型。
  </Accordion>

  <Accordion title="工具呈現為原始文字">
    如果 Qwen 模型列印 JSON/XML 工具語法而不是執行 skill，請查看上方進階設定中的 Qwen 指引。通常的修正方式是：

    - 使用該模型正確的剖析器/template 啟動 vLLM
    - 使用 `openclaw models list --provider vllm` 確認確切模型 id
    - 只有在 `tool_choice: "auto"` 仍回傳空白或僅文字的工具呼叫時，才加入專用的逐模型 `params.extra_body.tool_choice: "required"` 覆寫

  </Accordion>
</AccordionGroup>

<Warning>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照，以及容錯移轉行為。
  </Card>
  <Card title="OpenAI" href="/zh-TW/providers/openai" icon="bolt">
    原生 OpenAI 提供者和 OpenAI 相容路由行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊和憑證重用規則。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題及解決方式。
  </Card>
</CardGroup>
