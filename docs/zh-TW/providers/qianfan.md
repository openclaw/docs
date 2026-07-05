---
read_when:
    - 你想要一組 API 金鑰用於多個 LLMs
    - 您需要百度千帆設定指南
summary: 使用千帆的統一 API 在 OpenClaw 中存取多種模型
title: 千帆
x-i18n:
    generated_at: "2026-07-05T11:38:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan 是百度的 MaaS 平台：一個統一、與 OpenAI 相容的 API，可透過單一端點和 API 金鑰將請求路由到多個模型。OpenClaw 以官方外部外掛 `@openclaw/qianfan-provider` 提供它。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `qianfan`                                |
| 驗證          | `QIANFAN_API_KEY`                        |
| API           | 與 OpenAI 相容 (`openai-completions`)    |
| 基礎 URL      | `https://qianfan.baidubce.com/v2`        |
| 預設模型      | `qianfan/deepseek-v3.2`                  |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="建立百度智慧雲帳號">
    在 [Qianfan 主控台](https://console.bce.baidu.com/qianfan/ais/console/apiKey) 註冊或登入，並確保你已啟用 Qianfan API 存取權。
  </Step>
  <Step title="產生 API 金鑰">
    建立新應用程式或選取現有應用程式，然後產生 API 金鑰。百度智慧雲金鑰使用 `bce-v3/ALTAK-...` 格式。
  </Step>
  <Step title="執行上線設定">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    非互動式執行會從 `--qianfan-api-key <key>` 或
    `QIANFAN_API_KEY` 讀取金鑰。上線設定會寫入供應商設定、新增預設模型的
    `QIANFAN` 別名，並在未設定任何模型時將 `qianfan/deepseek-v3.2`
    設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 內建型錄

| 模型參照                             | 輸入        | 上下文  | 最大輸出   | 推理      | 備註       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ----------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | 是        | 預設模型   |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | 是        | 多模態     |

型錄是靜態的；沒有即時模型探索。

<Tip>
只有在需要自訂基礎 URL 或模型中繼資料時，才需要覆寫 `models.providers.qianfan`。
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

<Note>
模型參照使用 `qianfan/` 前綴（例如 `qianfan/deepseek-v3.2`）。
</Note>

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Qianfan 透過與 OpenAI 相容的傳輸路徑執行，而不是原生 OpenAI 請求塑形。標準 OpenAI SDK 功能可正常運作，但供應商特定參數可能不會被轉發。
  </Accordion>

  <Accordion title="疑難排解">
    - 確保你的 API 金鑰以 `bce-v3/ALTAK-` 開頭，且已在百度智慧雲主控台中啟用 Qianfan API 存取權。
    - 如果未列出模型，請確認你的帳號已啟用 Qianfan 服務。
    - 只有在使用自訂端點或代理時，才變更基礎 URL。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="代理設定" href="/zh-TW/concepts/agent" icon="robot">
    設定代理預設值與模型指派。
  </Card>
  <Card title="Qianfan API 文件" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    官方 Qianfan API 文件。
  </Card>
</CardGroup>
