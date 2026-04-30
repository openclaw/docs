---
read_when:
    - 你想要一組可用於多個大型語言模型的 API 金鑰
    - 你需要 Baidu Qianfan 設定指南
summary: 使用千帆的統一 API 在 OpenClaw 中存取多種模型
title: 千帆
x-i18n:
    generated_at: "2026-04-30T03:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan 是 Baidu 的 MaaS 平台，提供**統一 API**，可透過單一端點和 API 金鑰將請求路由至許多模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基礎 URL 即可使用。

| 屬性 | 值                                |
| -------- | --------------------------------- |
| 提供者 | `qianfan`                         |
| 驗證     | `QIANFAN_API_KEY`                 |
| API      | 與 OpenAI 相容                 |
| 基礎 URL | `https://qianfan.baidubce.com/v2` |

## 開始使用

<Steps>
  <Step title="建立 Baidu Cloud 帳戶">
    在 [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) 註冊或登入，並確認你已啟用 Qianfan API 存取權限。
  </Step>
  <Step title="產生 API 金鑰">
    建立新的應用程式或選取現有應用程式，然後產生 API 金鑰。金鑰格式為 `bce-v3/ALTAK-...`。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 內建型錄

| 模型參照                            | 輸入       | 上下文 | 最大輸出 | 推理 | 備註         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | 文字        | 98,304  | 32,768     | 是       | 預設模型 |
| `qianfan/ernie-5.0-thinking-preview` | 文字、圖片 | 119,000 | 64,000     | 是       | 多模態    |

<Tip>
預設的隨附模型參照為 `qianfan/deepseek-v3.2`。只有在需要自訂基礎 URL 或模型中繼資料時，才需要覆寫 `models.providers.qianfan`。
</Tip>

## 設定範例

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Qianfan 會透過與 OpenAI 相容的傳輸路徑執行，而不是使用原生 OpenAI 請求塑形。這表示標準 OpenAI SDK 功能可以使用，但提供者特定參數可能不會被轉送。
  </Accordion>

  <Accordion title="型錄與覆寫">
    隨附型錄目前包含 `deepseek-v3.2` 和 `ernie-5.0-thinking-preview`。只有在需要自訂基礎 URL 或模型中繼資料時，才新增或覆寫 `models.providers.qianfan`。

    <Note>
    模型參照使用 `qianfan/` 前綴（例如 `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="疑難排解">
    - 確認你的 API 金鑰以 `bce-v3/ALTAK-` 開頭，且已在 Baidu Cloud 主控台啟用 Qianfan API 存取權限。
    - 如果沒有列出模型，請確認你的帳戶已啟用 Qianfan 服務。
    - 預設基礎 URL 是 `https://qianfan.baidubce.com/v2`。只有在使用自訂端點或 Proxy 時才變更它。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Agent 設定" href="/zh-TW/concepts/agent" icon="robot">
    設定 Agent 預設值和模型指派。
  </Card>
  <Card title="Qianfan API 文件" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    官方 Qianfan API 文件。
  </Card>
</CardGroup>
