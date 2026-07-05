---
read_when:
    - 你想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
    - 你想透過 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-05T11:38:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3300395fdaf9baf22476f9b4d5a5b217ddab1aa10042c5959ffa059c3a258de4
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 透過 OpenAI 相容 API 在
`https://integrate.api.nvidia.com/v1` 免費提供開放模型，並使用來自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 金鑰進行驗證。OpenClaw
預設將 NVIDIA provider 設為 Nemotron 3 Ultra，這是 NVIDIA 的 550B 總參數 / 55B
主動推理模型，適合長上下文的代理式工作。

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 建立 API 金鑰。
  </Step>
  <Step title="匯出金鑰並執行入門設定">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="設定 NVIDIA 模型">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

若要進行非互動式設定，請直接傳入金鑰：

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` 會讓金鑰出現在 shell 歷史記錄和 `ps` 輸出中。可行時，請優先使用
`NVIDIA_API_KEY` 環境變數。
</Warning>

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

設定 NVIDIA API 金鑰後，設定流程與模型選擇路徑會從
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` 擷取
NVIDIA 的公開精選模型目錄，並將結果快取 24 小時（前 32 筆項目，匯入為免費文字輸入
列）。因此 build.nvidia.com 的新精選模型會出現在設定與模型選擇介面中，不必等待 OpenClaw 發行。當即時摘要可用時，第一個回傳的模型會成為 NVIDIA 設定期間的預選選項。

擷取使用針對 `assets.ngc.nvidia.com` 的固定 HTTPS 主機政策。如果尚未設定
NVIDIA API 金鑰，或摘要不可用或格式錯誤，OpenClaw 會退回使用下方的內建目錄與內建預設值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的預設 NVIDIA 模型。NVIDIA 的
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
build 頁面將其列為可用的免費端點，並標示 1M-token 上下文規格。
內建目錄記錄 16,384-token 最大輸出，以符合 NVIDIA 目前針對託管端點的 OpenAI 相容範例請求。

內建 Ultra 列預設傳送
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`，
讓一般聊天輸出保留在可見回答中，而不是暴露推理文字。

若要使用最高能力的 NVIDIA 預設值，請使用 Ultra。當你想使用較小的 Nemotron 3 選項時，請保留選取 Super；或者在 NVIDIA 目錄中託管的第三方模型裡，選擇其上下文、延遲或行為更適合的模型。

## 內建備援目錄

| 模型參照                                   | 名稱                         | 上下文    | 最大輸出 | 備註                                      |
| ------------------------------------------ | ---------------------------- | --------- | -------- | ----------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384   | 預設                                      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192    |                                           |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192    |                                           |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192    |                                           |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192    |                                           |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192    | 已棄用；請使用 `minimaxai/minimax-m2.7`   |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192    | 已棄用；請使用 `z-ai/glm-5.1`             |

## 進階設定

<AccordionGroup>
  <Accordion title="自動啟用行為">
    當設定了 `NVIDIA_API_KEY` 環境變數，或入門設定期間已儲存金鑰時，provider 會自動啟用。除了金鑰以外，不需要明確的 provider 設定。
  </Accordion>

  <Accordion title="目錄與定價">
    設定 NVIDIA 驗證後，OpenClaw 會優先使用 NVIDIA 的公開精選模型目錄，並快取 24 小時。內建備援目錄是靜態的，並保留已棄用的已發行參照以維持升級相容性。成本在原始碼中預設為 `0`，因為 NVIDIA 目前對所列模型提供免費 API 存取。
  </Accordion>

  <Accordion title="OpenAI 相容端點">
    OpenClaw 透過 `openai-completions` adapter 與 NVIDIA 溝通，對應標準的 `/v1` chat completions 路由。任何 OpenAI 相容工具都應該可直接搭配 NVIDIA base URL 使用。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 推理參數">
    NVIDIA 的 Ultra 範例請求使用 `chat_template_kwargs.enable_thinking`
    和 `reasoning_budget` 來產生推理輸出。OpenClaw 的內建 Ultra 列預設會停用範本思考，以便一般聊天使用。如果你需要選擇加入 NVIDIA 推理輸出，或強制使用其他 NVIDIA 特定請求欄位，請設定每模型參數，並將 provider 特定覆寫範圍限定於 NVIDIA 模型：

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

    `params.chat_template_kwargs` 會合併到請求上既有的任何 `chat_template_kwargs`，
    而不是取代整個物件。
    `params.extra_body` 是最終的 OpenAI 相容 request-body 覆寫，
    並會覆寫衝突的 payload keys，因此只應用於 NVIDIA 針對所選端點文件化的欄位。

  </Accordion>

  <Accordion title="緩慢的自訂 provider 回應">
    部分 NVIDIA 託管的自訂模型，在送出第一個回應區塊前，可能會超過預設約 120 秒的模型閒置 watchdog。對於自訂 NVIDIA provider 項目，請提高 provider timeout，而不是整個 agent runtime timeout；`timeoutSeconds` 涵蓋 provider HTTP 請求，並提高該 provider 的 idle/stream watchdog 上限：

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
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、模型參照與 failover 行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、模型與 providers 的完整設定參考。
  </Card>
</CardGroup>
