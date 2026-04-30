---
read_when:
    - 你想在 OpenClaw 中免費使用開放模型
    - 你需要設定 NVIDIA_API_KEY
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 相容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T03:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 相容 API，可免費使用
開放模型。請使用來自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 金鑰進行驗證。

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
如果你傳入 `--nvidia-api-key` 而不是使用環境變數，該值會落入 shell
歷程記錄和 `ps` 輸出中。可行時請優先使用 `NVIDIA_API_KEY` 環境變數。
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 內建目錄

| 模型參照                                   | 名稱                         | 上下文  | 最大輸出   |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## 進階設定

<AccordionGroup>
  <Accordion title="自動啟用行為">
    設定 `NVIDIA_API_KEY` 環境變數時，供應商會自動啟用。
    除了金鑰之外，不需要明確的供應商設定。
  </Accordion>

  <Accordion title="目錄與定價">
    隨附目錄是靜態的。由於 NVIDIA 目前為列出的模型提供免費 API
    存取，原始碼中的費用預設為 `0`。
  </Accordion>

  <Accordion title="OpenAI 相容端點">
    NVIDIA 使用標準的 `/v1` completions 端點。任何 OpenAI 相容
    工具都應該能透過 NVIDIA 基礎 URL 開箱即用。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前可免費使用。請查看
[build.nvidia.com](https://build.nvidia.com/) 了解最新可用性與
速率限制詳細資訊。
</Tip>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照，以及容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 與 providers 的完整設定參考。
  </Card>
</CardGroup>
