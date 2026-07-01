---
read_when:
    - 你想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
    - 你想要透過 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:12:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供與 OpenAI 相容的 API，可免費使用
開放模型。請使用來自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 金鑰進行驗證。OpenClaw
預設將 NVIDIA provider 設為 Nemotron 3 Ultra，這是 NVIDIA 的 550B 總參數 / 55B
主動推理模型，適用於長上下文的代理式工作。

## 開始使用

<Steps>
  <Step title="Get your API key">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 建立 API 金鑰。
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
如果你傳入 `--nvidia-api-key` 而不是 env var，該值會落入 shell
history 和 `ps` 輸出。可行時，請優先使用 `NVIDIA_API_KEY` 環境變數。
</Warning>

若要進行非互動式設定，也可以直接傳入金鑰：

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## 設定範例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 精選目錄

設定 NVIDIA API 金鑰後，OpenClaw 設定與模型選擇路徑會嘗試使用來自
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` 的 NVIDIA
公開精選模型目錄，並將排序結果快取 24 小時。因此，build.nvidia.com
的新精選模型會出現在設定與模型選擇介面中，而無需等待
OpenClaw 發行。當即時 feed 可用時，第一個傳回的模型會是在 NVIDIA 設定期間顯示的預設選項。

擷取會對 `assets.ngc.nvidia.com` 使用固定的 HTTPS 主機政策。如果未設定
NVIDIA API 金鑰，或該公開目錄無法使用或格式不正確，OpenClaw 會退回使用下方的內建目錄與內建預設值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的預設 NVIDIA 模型。NVIDIA 的 build 頁面針對
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
將其列為可用的免費端點，並具備 1M-token 上下文規格。
內建目錄記錄 16,384-token 最大輸出，以符合 NVIDIA 目前針對託管端點的
OpenAI 相容範例請求。

若需要最高能力的 NVIDIA 預設值，請使用 Ultra。若你想要較小的 Nemotron 3 選項，請維持選取 Super；或者在 NVIDIA 目錄中選擇其中一個第三方模型，前提是其上下文、延遲或行為更符合需求。
內建 Ultra 列預設會傳送 `chat_template_kwargs.enable_thinking: false` 和
`force_nonempty_content: true`，讓一般聊天輸出保留在可見答案中，而不是暴露推理文字。

## 內建備援目錄

| 模型 ref                                  | 名稱                         | 上下文    | 最大輸出 | 備註                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 預設                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      | 精選備援                         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 精選備援                         |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 精選備援                         |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 精選備援                         |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 已棄用，升級相容性 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 已棄用，升級相容性 |

## 進階設定

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    當設定 `NVIDIA_API_KEY` 環境變數時，provider 會自動啟用。
    除了金鑰之外，不需要明確的 provider 設定。
  </Accordion>

  <Accordion title="Catalog and pricing">
    設定 NVIDIA auth 後，OpenClaw 會優先使用 NVIDIA 的公開精選模型目錄，
    並快取 24 小時。內建備援目錄是靜態的，並保留已棄用的已發行 refs
    以供升級相容性使用。成本在來源中預設為 `0`，因為 NVIDIA 目前為列出的模型提供免費 API 存取。
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA 使用標準 `/v1` completions 端點。任何與 OpenAI 相容的工具都應可搭配 NVIDIA base URL 直接使用。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA 的 Ultra 範例請求使用 `chat_template_kwargs.enable_thinking`
    和 `reasoning_budget` 來產生推理輸出。OpenClaw 的內建 Ultra 列
    針對一般聊天使用預設停用 template thinking。若你需要選擇啟用 NVIDIA 推理輸出，或強制使用其他 NVIDIA 專屬請求欄位，請設定個別模型參數，並將 provider 專屬覆寫限定在
    NVIDIA 模型範圍內：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` 是最終的 OpenAI 相容請求主體覆寫，因此
    只應用於 NVIDIA 針對所選端點所記錄的欄位。

  </Accordion>

  <Accordion title="Slow custom provider responses">
    某些 NVIDIA 託管的自訂模型可能會比預設模型 idle
    watchdog 更久才發出第一個回應 chunk。對於自訂 NVIDIA provider
    項目，請提高 provider timeout，而不是提高整個代理
    runtime timeout：

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前可免費使用。請查看
[build.nvidia.com](https://build.nvidia.com/) 以取得最新可用性與
rate-limit 詳細資訊。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、模型 refs 和 failover 行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理、模型與 providers 的完整設定參考。
  </Card>
</CardGroup>
