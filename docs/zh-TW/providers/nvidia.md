---
read_when:
    - 您想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
    - 你想透過 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T19:56:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 相容 API，可免費使用
開放模型。請使用來自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 金鑰驗證。OpenClaw
將 NVIDIA 提供者預設為 Nemotron 3 Ultra，這是 NVIDIA 的 550B 總參數 / 55B
主動推理模型，適用於長上下文代理式工作。

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
如果你傳入 `--nvidia-api-key` 而不是環境變數，該值會落入 shell
歷史記錄與 `ps` 輸出。可行時，請優先使用 `NVIDIA_API_KEY` 環境變數。
</Warning>

若要進行非互動式設定，你也可以直接傳入金鑰：

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

設定 NVIDIA API 金鑰後，OpenClaw 設定與模型選擇路徑
會嘗試使用 NVIDIA 的公開精選模型目錄：
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`，
並快取排名結果 24 小時。因此，build.nvidia.com 上的新精選模型
會出現在設定與模型選擇介面中，而不需要等待
OpenClaw 發布。即時饋送可用時，第一個傳回的模型
會是 NVIDIA 設定期間顯示的預設選項。

擷取作業會對 `assets.ngc.nvidia.com` 使用固定的 HTTPS 主機政策。如果未
設定 NVIDIA API 金鑰，或該公開目錄無法使用或
格式不正確，OpenClaw 會退回使用下方的內建目錄與內建預設值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的預設 NVIDIA 模型。NVIDIA 針對
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
的建置頁面將它列為可用的免費端點，並具備 1M token 上下文規格。
內建目錄記錄 16,384 token 的最大輸出，以符合 NVIDIA 目前
針對託管端點的 OpenAI 相容範例請求。

若要使用能力最高的 NVIDIA 預設模型，請使用 Ultra。當你
想要較小的 Nemotron 3 選項時，請保留 Super；或者在 NVIDIA 的目錄中
選擇上下文、延遲或行為更符合需求的第三方模型。
內建 Ultra 列預設會傳送 `chat_template_kwargs.enable_thinking: false` 與
`force_nonempty_content: true`，讓一般聊天輸出保留在
可見答案中，而不是暴露推理文字。

## 內建備援目錄

| 模型參照                                   | 名稱                         | 上下文    | 最大輸出 | 備註                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 預設                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | 精選備援                         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 精選備援                         |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 精選備援                         |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 精選備援                         |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 已棄用，升級相容性 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 已棄用，升級相容性 |

## 進階設定

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    設定 `NVIDIA_API_KEY` 環境變數後，提供者會自動啟用。
    除了金鑰之外，不需要明確的提供者設定。
  </Accordion>

  <Accordion title="Catalog and pricing">
    設定 NVIDIA 驗證後，OpenClaw 會優先使用 NVIDIA 的公開精選模型目錄，
    並快取 24 小時。內建備援目錄是靜態的，
    並保留已棄用的已發布參照以支援升級相容性。由於 NVIDIA 目前
    對列出的模型提供免費 API 存取，原始碼中的費用預設為
    `0`。
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA 使用標準 `/v1` completions 端點。任何 OpenAI 相容
    工具都應能搭配 NVIDIA base URL 直接運作。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA 的 Ultra 範例請求使用 `chat_template_kwargs.enable_thinking`
    與 `reasoning_budget` 來產生推理輸出。OpenClaw 的內建 Ultra 列
    預設會停用範本思考，以供一般聊天使用。如果你需要
    選擇啟用 NVIDIA 推理輸出，或強制使用其他 NVIDIA 專用請求
    欄位，請設定個別模型參數，並將提供者專用覆寫限制在
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

    `params.extra_body` 是最終的 OpenAI 相容請求本文覆寫，因此
    只應用於 NVIDIA 針對所選端點記載的欄位。

  </Accordion>

  <Accordion title="Slow custom provider responses">
    某些 NVIDIA 託管的自訂模型，可能會比預設模型閒置
    看門狗等待更久，才送出第一個回應區塊。對於自訂 NVIDIA 提供者
    項目，請提高提供者逾時時間，而不是提高整個代理
    執行階段逾時時間：

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
速率限制詳細資料。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理、模型與提供者的完整設定參考。
  </Card>
</CardGroup>
