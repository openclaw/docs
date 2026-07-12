---
read_when:
    - 你想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
    - 您想透過 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-11T21:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 透過相容 OpenAI 的 API，在
`https://integrate.api.nvidia.com/v1` 免費提供開放模型服務；驗證時使用從
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 取得的 API 金鑰。OpenClaw
預設將 NVIDIA 提供者設為 Nemotron 3 Ultra，這是 NVIDIA 的總參數量 550B／啟用參數量 55B
推理模型，適合長上下文代理式工作。

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 建立 API 金鑰。
  </Step>
  <Step title="匯出金鑰並執行初始設定">
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
`--nvidia-api-key` 會讓金鑰出現在 shell 歷史記錄與 `ps` 輸出中。可以的話，請優先使用
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

設定 NVIDIA API 金鑰後，設定與模型選擇流程會從
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`
擷取 NVIDIA 的公開精選模型目錄，並快取結果 24 小時（取前 32 筆，以免費文字輸入項目匯入）。
因此，build.nvidia.com 新增的精選模型無須等待 OpenClaw 發布新版本，即會出現在設定與模型選擇介面中。
即時動態來源可用時，NVIDIA 設定期間會預先選取傳回的第一個模型。

擷取作業對 `assets.ngc.nvidia.com` 採用固定的 HTTPS 主機原則。如果未設定
NVIDIA API 金鑰，或動態來源無法使用或格式錯誤，OpenClaw 會改用下方的內建目錄與內建預設值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的預設 NVIDIA 模型。NVIDIA 的
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
建置頁面將其列為可免費使用的端點，並標示 100 萬權杖的上下文規格。

內建的 Ultra 項目預設傳送
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`，
讓一般聊天輸出保留在可見答案中，而不會顯示推理文字。

若要使用能力最強的 NVIDIA 預設模型，請選用 Ultra。若需要較小型的 Nemotron 3 選項，請繼續選用
Super；若 NVIDIA 目錄中託管的第三方模型在上下文、延遲或行為方面更合適，也可以選擇這些模型。

## 內建備援目錄

可選擇的內建項目是 NVIDIA 精選模型目錄的快照。已棄用的相容性項目仍可透過精確參照解析，但不會顯示在模型選擇器中。

| 模型參照                                   | 名稱                  | 上下文    | 最大輸出 |
| ------------------------------------------ | --------------------- | --------- | -------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192    |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192    |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192    |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192    |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192    |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384   |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384   |

完整的相容性目錄也會為現有設定保留這些已發布的參照：
`nvidia/moonshotai/kimi-k2.5`、`nvidia/z-ai/glm-5.1`、
`nvidia/minimaxai/minimax-m2.5`、`nvidia/z-ai/glm5`，以及
`nvidia/minimaxai/minimax-m2.7`。它們仍可透過精確參照使用，但絕不會出現在初始設定流程或模型選擇器中。

## 進階設定

<AccordionGroup>
  <Accordion title="自動啟用行為">
    設定 `NVIDIA_API_KEY` 環境變數，或在初始設定期間儲存金鑰後，提供者便會自動啟用。
    除了金鑰之外，不需要明確設定提供者。
  </Accordion>

  <Accordion title="目錄與定價">
    設定 NVIDIA 驗證後，OpenClaw 會優先使用 NVIDIA 的公開精選模型目錄，並快取 24 小時。
    可選擇的內建備援目錄是 NVIDIA 精選模型目錄的靜態快照；已棄用且僅供精確參照使用的相容性項目會從模型選擇器中隱藏。
    由於 NVIDIA 目前為所列模型提供免費 API 存取，原始碼中的費用預設為 `0`。
  </Accordion>

  <Accordion title="相容 OpenAI 的端點">
    OpenClaw 使用 `openai-completions` 轉接器，透過標準的 `/v1` 聊天完成路由與 NVIDIA 通訊。
    任何相容 OpenAI 的工具搭配 NVIDIA 基底 URL 都應可直接使用。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 推理參數">
    NVIDIA 的 Ultra 範例要求使用 `chat_template_kwargs.enable_thinking`
    和 `reasoning_budget` 產生推理輸出。OpenClaw 的內建 Ultra 項目預設會停用範本推理，以供一般聊天使用。
    若需要啟用 NVIDIA 推理輸出，或強制傳送其他 NVIDIA 專用要求欄位，請設定各模型的參數，
    並將提供者專用的覆寫限制在 NVIDIA 模型範圍內：

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

    `params.chat_template_kwargs` 會合併至要求中既有的任何 `chat_template_kwargs`，
    而不是取代整個物件。
    `params.extra_body` 是最終相容 OpenAI 的要求本文覆寫，會覆寫發生衝突的承載內容鍵，
    因此請僅將其用於 NVIDIA 為所選端點記載的欄位。

  </Accordion>

  <Accordion title="回應緩慢的自訂提供者">
    部分由 NVIDIA 託管的自訂模型可能需要比預設約 120 秒的模型閒置監控期限更久，
    才會送出第一個回應區塊。對於自訂 NVIDIA 提供者項目，請提高提供者逾時，而不是整體代理程式執行階段逾時；
    `timeoutSeconds` 涵蓋提供者的 HTTP 要求，並提高該提供者的閒置／串流監控上限：

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
[build.nvidia.com](https://build.nvidia.com/) 以取得最新的可用性與速率限制詳細資訊。
</Tip>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理程式、模型與提供者的完整設定參考。
  </Card>
</CardGroup>
