---
read_when:
    - 你想要將 OpenClaw 搭配本機 vLLM 伺服器執行
    - 你想要使用自己的模型提供 OpenAI 相容的 /v1 端點
summary: 使用 vLLM 執行 OpenClaw（OpenAI 相容的本機伺服器）
title: vLLM
x-i18n:
    generated_at: "2026-06-27T19:58:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM 可透過 **OpenAI 相容** 的 HTTP API 提供開放原始碼（以及一些自訂）模型。OpenClaw 使用 `openai-completions` API 連接到 vLLM。

當你選擇使用 `VLLM_API_KEY` 時，OpenClaw 也可以從 vLLM **自動探索** 可用模型（如果你的伺服器未強制驗證，任何值都可使用）。當你也設定自訂 vLLM 基礎 URL 時，請在 `agents.defaults.models` 中使用 `vllm/*`，以保持探索為動態。

OpenClaw 將 `vllm` 視為支援串流使用量計算的本機 OpenAI 相容提供者，因此狀態/上下文 token 計數可以從 `stream_options.include_usage` 回應更新。

| 屬性             | 值                                       |
| ---------------- | ---------------------------------------- |
| 提供者 ID        | `vllm`                                   |
| API              | `openai-completions`（OpenAI 相容）      |
| 驗證             | `VLLM_API_KEY` 環境變數                  |
| 預設基礎 URL     | `http://127.0.0.1:8000/v1`               |

## 開始使用

<Steps>
  <Step title="使用 OpenAI 相容伺服器啟動 vLLM">
    你的基礎 URL 應公開 `/v1` 端點（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常執行於：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="設定 API 金鑰環境變數">
    如果你的伺服器未強制驗證，任何值都可使用：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="選擇模型">
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

## 模型探索（隱式提供者）

當已設定 `VLLM_API_KEY`（或存在驗證設定檔），且你**未**定義 `models.providers.vllm` 時，OpenClaw 會查詢：

```
GET http://127.0.0.1:8000/v1/models
```

並將回傳的 ID 轉換為模型項目。

<Note>
如果你明確設定 `models.providers.vllm`，OpenClaw 預設會使用你宣告的模型。當你希望 OpenClaw 查詢該已設定提供者的 `/models` 端點，並包含所有已公告的 vLLM 模型時，請將 `"vllm/*": {}` 新增到 `agents.defaults.models`。
</Note>

## 明確設定（手動模型）

在以下情況使用明確設定：

- vLLM 執行於不同的主機或連接埠
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的伺服器需要真正的 API 金鑰（或你想控制標頭）
- 你連接到受信任的 loopback、LAN 或 Tailscale vLLM 端點

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

若要讓此提供者保持動態，而不手動列出每個模型，請將提供者萬用字元新增到可見模型目錄：

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="代理風格行為">
    vLLM 會被視為代理風格的 OpenAI 相容 `/v1` 後端，而不是原生 OpenAI 端點。這表示：

    | 行為 | 是否套用？ |
    |----------|----------|
    | 原生 OpenAI 請求塑形 | 否 |
    | `service_tier` | 不傳送 |
    | Responses `store` | 不傳送 |
    | 提示快取提示 | 不傳送 |
    | OpenAI reasoning 相容 payload 塑形 | 不套用 |
    | 隱藏的 OpenClaw 歸因標頭 | 不注入到自訂基礎 URL |

  </Accordion>

  <Accordion title="Qwen thinking 控制">
    對於透過 vLLM 提供的 Qwen 模型，當伺服器預期 Qwen chat-template kwargs 時，請在已設定的提供者模型列上設定 `compat.thinkingFormat: "qwen-chat-template"`。以這種方式設定的模型會公開二元 `/think` 設定檔（`off`、`on`），因為 Qwen 範本 thinking 是開/關請求旗標，而不是 OpenAI 風格的 effort 階梯。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw 將 `/think off` 對應為：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的 thinking 等級會傳送 `enable_thinking: true`。如果你的端點改為預期 DashScope 風格的頂層旗標，請使用 `compat.thinkingFormat: "qwen"` 在請求根層傳送 `enable_thinking`。

  </Accordion>

  <Accordion title="Nemotron 3 thinking 控制">
    vLLM/Nemotron 3 可以使用 chat-template kwargs 來控制 reasoning 是作為隱藏 reasoning 回傳，還是作為可見答案文字回傳。當 OpenClaw 工作階段使用 `vllm/nemotron-3-*` 且 thinking 關閉時，隨附的 vLLM 外掛會傳送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    若要自訂這些值，請在模型 params 下設定 `chat_template_kwargs`。如果你也設定 `params.extra_body.chat_template_kwargs`，該值具有最終優先權，因為 `extra_body` 是最後的請求本文覆寫。

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
    首先確認 vLLM 是以適合該模型的正確工具呼叫解析器與聊天範本啟動。例如，vLLM 文件記載 Qwen2.5 模型使用 `hermes`，Qwen3-Coder 模型使用 `qwen3_xml`。

    症狀：

    - skills 或工具從未執行
    - 助理列印原始 JSON/XML，例如 `{"name":"read","arguments":...}`
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

    將 `Qwen-Qwen2.5-Coder-32B-Instruct` 替換為以下命令回傳的確切 id：

    ```bash
    openclaw models list --provider vllm
    ```

    你可以從命令列介面套用相同覆寫：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    這是一個選擇性啟用的相容性因應措施。它會讓每次帶有工具的模型回合都要求工具呼叫，因此只應用於可接受該行為的專用本機模型項目。不要將它作為所有 vLLM 模型的全域預設，也不要使用會盲目將任意助理文字轉換為可執行工具呼叫的代理。

  </Accordion>

  <Accordion title="自訂基礎 URL">
    如果你的 vLLM 伺服器在非預設主機或連接埠上執行，請在明確提供者設定中設定 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` 只套用於 vLLM 模型 HTTP 請求，包括連線建立、回應標頭、本文串流，以及總體受保護 fetch 中止。請優先使用此方式，再考慮提高 `agents.defaults.timeoutSeconds`，後者控制整個 agent 執行。

  </Accordion>

  <Accordion title="無法連線到伺服器">
    檢查 vLLM 伺服器是否正在執行且可存取：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果看到連線錯誤，請確認主機、連接埠，以及 vLLM 是否以 OpenAI 相容伺服器模式啟動。
    對於明確的 loopback、LAN 或 Tailscale 端點，OpenClaw 會信任已設定的確切 `models.providers.vllm.baseUrl` origin，用於受保護的模型請求。metadata/link-local origin 在沒有明確選擇啟用時仍會被封鎖。只有當 vLLM 請求必須到達另一個私人 origin 時，才設定 `models.providers.vllm.request.allowPrivateNetwork: true`；若要退出精確 origin 信任，請將它設定為 `false`。

  </Accordion>

  <Accordion title="請求發生驗證錯誤">
    如果請求因驗證錯誤而失敗，請設定符合你伺服器設定的真正 `VLLM_API_KEY`，或在 `models.providers.vllm` 下明確設定提供者。

    <Tip>
    如果你的 vLLM 伺服器未強制驗證，任何非空的 `VLLM_API_KEY` 值都可作為 OpenClaw 的選擇啟用訊號。
    </Tip>

  </Accordion>

  <Accordion title="未探索到模型">
    自動探索需要設定 `VLLM_API_KEY`。如果你已定義 `models.providers.vllm`，OpenClaw 只會使用你宣告的模型，除非 `agents.defaults.models` 包含 `"vllm/*": {}`。
  </Accordion>

  <Accordion title="工具轉譯為原始文字">
    如果 Qwen 模型列印 JSON/XML 工具語法，而不是執行 skill，請查看上方進階設定中的 Qwen 指引。通常修正方式是：

    - 以該模型適用的正確解析器/範本啟動 vLLM
    - 使用 `openclaw models list --provider vllm` 確認確切模型 id
    - 只有在 `tool_choice: "auto"` 仍回傳空的或僅文字的工具呼叫時，才新增專用的逐模型 `params.extra_body.tool_choice: "required"` 覆寫

  </Accordion>
</AccordionGroup>

<Warning>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 與 [FAQ](/zh-TW/help/faq)。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="OpenAI" href="/zh-TW/providers/openai" icon="bolt">
    原生 OpenAI 提供者與 OpenAI 相容路由行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料與認證重用規則。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與解決方式。
  </Card>
</CardGroup>
