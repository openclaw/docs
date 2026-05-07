---
read_when:
    - 你想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 相容 API，可免費使用
開放模型。請使用來自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 金鑰進行驗證。

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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
如果你傳入 `--nvidia-api-key` 而不是環境變數，該值會落入 Shell
歷史記錄和 `ps` 輸出。可行時，請優先使用 `NVIDIA_API_KEY` 環境變數。
</Warning>

對於非互動式設定，你也可以直接傳入金鑰：

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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 內建型錄

| 模型參照                                   | 名稱                         | Context | 最大輸出   |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## 進階設定

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    當設定 `NVIDIA_API_KEY` 環境變數時，提供者會自動啟用。
    除了金鑰之外，不需要明確的提供者設定。
  </Accordion>

  <Accordion title="Catalog and pricing">
    隨附的型錄是靜態的。由於 NVIDIA 目前為列出的模型提供免費 API
    存取，原始碼中的費用預設為 `0`。
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA 使用標準的 `/v1` completions 端點。任何 OpenAI 相容工具
    都應該可以搭配 NVIDIA 基底 URL 直接運作。
  </Accordion>

  <Accordion title="Slow custom provider responses">
    有些由 NVIDIA 託管的自訂模型，可能會比預設模型閒置監看器更久才發出第一個回應區塊。
    對於自訂 NVIDIA 提供者項目，請提高提供者逾時時間，而不是提高整個 agent
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
速率限制詳細資訊。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、模型和提供者的完整設定參考。
  </Card>
</CardGroup>
