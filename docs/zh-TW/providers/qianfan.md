---
read_when:
    - 您想用單一 API 金鑰存取多種大型語言模型
    - 你需要百度千帆設定指南
summary: 使用千帆統一 API 在 OpenClaw 中存取多種模型
title: 千帆
x-i18n:
    generated_at: "2026-07-11T21:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

千帆是百度的 MaaS 平台：提供統一且與 OpenAI 相容的 API，透過單一端點和 API 金鑰將請求路由至多種模型。OpenClaw 以官方外部外掛 `@openclaw/qianfan-provider` 的形式提供此平台。

| 屬性     | 值                                       |
| -------- | ---------------------------------------- |
| 提供者   | `qianfan`                                |
| 驗證     | `QIANFAN_API_KEY`                        |
| API      | 與 OpenAI 相容（`openai-completions`）   |
| 基礎 URL | `https://qianfan.baidubce.com/v2`        |
| 預設模型 | `qianfan/deepseek-v3.2`                  |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="建立百度智慧雲帳戶">
    在[千帆控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)註冊或登入，並確保已啟用千帆 API 存取權限。
  </Step>
  <Step title="產生 API 金鑰">
    建立新應用程式或選取現有應用程式，然後產生 API 金鑰。百度智慧雲金鑰使用 `bce-v3/ALTAK-...` 格式。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    非互動式執行會從 `--qianfan-api-key <key>` 或
    `QIANFAN_API_KEY` 讀取金鑰。初始設定會寫入提供者組態、為預設模型新增
    `QIANFAN` 別名，並在尚未設定預設模型時，將 `qianfan/deepseek-v3.2`
    設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 內建目錄

| 模型參照                             | 輸入         | 上下文  | 最大輸出 | 推理 | 備註     |
| ------------------------------------ | ------------ | ------- | -------- | ---- | -------- |
| `qianfan/deepseek-v3.2`              | 文字         | 98,304  | 32,768   | 是   | 預設模型 |
| `qianfan/ernie-5.0-thinking-preview` | 文字、影像   | 119,000 | 64,000   | 是   | 多模態   |

此目錄為靜態內容，不會即時探索模型。

<Tip>
只有在需要自訂基礎 URL 或模型中繼資料時，才需要覆寫 `models.providers.qianfan`。
</Tip>

## 組態範例

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
    千帆透過與 OpenAI 相容的傳輸路徑執行，而非採用原生 OpenAI 請求格式。標準 OpenAI SDK 功能可以正常運作，但提供者專用參數可能不會被轉送。
  </Accordion>

  <Accordion title="疑難排解">
    - 確保 API 金鑰以 `bce-v3/ALTAK-` 開頭，並已在百度智慧雲控制台中啟用千帆 API 存取權限。
    - 如果未列出模型，請確認帳戶已啟用千帆服務。
    - 只有在使用自訂端點或代理伺服器時，才變更基礎 URL。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="組態參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 組態參考。
  </Card>
  <Card title="代理程式設定" href="/zh-TW/concepts/agent" icon="robot">
    設定代理程式預設值與模型指派。
  </Card>
  <Card title="千帆 API 文件" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    千帆 API 官方文件。
  </Card>
</CardGroup>
