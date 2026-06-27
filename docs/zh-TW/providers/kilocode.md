---
read_when:
    - 你想要一把 API 金鑰用於多個 LLMs
    - 你想在 OpenClaw 中透過 Kilo 閘道執行模型
summary: 使用 Kilo 閘道的統一 API 在 OpenClaw 中存取多種模型
title: Kilo 閘道
x-i18n:
    generated_at: "2026-06-27T19:55:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo 閘道提供一個**統一 API**，可將請求路由到單一端點和 API 金鑰後方的多個模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基底 URL 即可運作。

| 屬性 | 值                                 |
| -------- | ---------------------------------- |
| 提供者 | `kilocode`                         |
| 驗證     | `KILOCODE_API_KEY`                 |
| API      | 與 OpenAI 相容                     |
| 基底 URL | `https://api.kilo.ai/api/gateway/` |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="建立帳戶">
    前往 [app.kilo.ai](https://app.kilo.ai)，登入或建立帳戶，然後前往 API Keys 並產生新的金鑰。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或直接設定環境變數：

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 預設模型

預設模型是 `kilocode/kilo/auto`，這是由 Kilo 閘道管理、提供者擁有的智慧路由模型。

<Note>
OpenClaw 將 `kilocode/kilo/auto` 視為穩定的預設參照，但不會為該路由發布具來源依據的任務到上游模型對應。`kilocode/kilo/auto` 後方的確切上游路由由 Kilo 閘道擁有，而不是硬編碼在 OpenClaw 中。
</Note>

## 內建目錄

OpenClaw 會在啟動時從 Kilo 閘道動態探索可用模型。使用 `/models kilocode` 查看你的帳戶可用的完整模型清單。

閘道上可用的任何模型都可以搭配 `kilocode/` 前綴使用：

| 模型參照                                 | 備註                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | 預設 — 智慧路由                    |
| `kilocode/anthropic/claude-sonnet-4`     | 透過 Kilo 使用 Anthropic           |
| `kilocode/openai/gpt-5.5`                | 透過 Kilo 使用 OpenAI              |
| `kilocode/google/gemini-3.1-pro-preview` | 透過 Kilo 使用 Google              |
| ...以及更多                              | 使用 `/models kilocode` 列出全部   |

<Tip>
啟動時，OpenClaw 會查詢 `GET https://api.kilo.ai/api/gateway/models`，並將探索到的模型合併到靜態備援目錄之前。靜態備援一律包含 `kilocode/kilo/auto`（`Kilo Auto`），其設定為 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`，以及 `maxTokens: 128000`。
</Tip>

## 設定範例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Kilo 閘道在原始碼中記錄為與 OpenRouter 相容，因此它會留在代理風格的 OpenAI 相容路徑，而不是使用原生 OpenAI 請求塑形。

    - Gemini 支援的 Kilo 參照會留在 proxy-Gemini 路徑上，因此 OpenClaw 會在該處保留 Gemini 思考簽章清理，而不啟用原生 Gemini 重播驗證或啟動重寫。
    - Kilo 閘道在底層使用包含你 API 金鑰的 Bearer 權杖。

  </Accordion>

  <Accordion title="串流包裝器與推理">
    Kilo 的共用串流包裝器會加入提供者應用程式標頭，並為支援的具體模型參照正規化代理推理酬載。

    <Warning>
    `kilocode/kilo/auto` 和其他不支援代理推理的提示會略過推理注入。如果你需要推理支援，請使用具體模型參照，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果模型探索在啟動時失敗，OpenClaw 會退回包含 `kilocode/kilo/auto` 的靜態目錄。
    - 確認你的 API 金鑰有效，且你的 Kilo 帳戶已啟用所需模型。
    - 當閘道以 daemon 執行時，請確保 `KILOCODE_API_KEY` 可供該處理程序使用（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

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
  <Card title="Kilo 閘道" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo 閘道儀表板、API 金鑰和帳戶管理。
  </Card>
</CardGroup>
