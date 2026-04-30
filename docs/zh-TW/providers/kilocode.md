---
read_when:
    - 你想要一個可用於多種大型語言模型的單一 API 金鑰
    - 你想在 OpenClaw 中透過 Kilo Gateway 執行模型
summary: 使用 Kilo Gateway 的統一 API 存取 OpenClaw 中的多種模型
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T03:31:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway 提供一個**統一 API**，可透過單一端點與 API 金鑰，將請求路由至多個模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基礎 URL 即可使用。

| 屬性     | 值                                 |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | 與 OpenAI 相容                     |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 開始使用

<Steps>
  <Step title="建立帳戶">
    前往 [app.kilo.ai](https://app.kilo.ai)，登入或建立帳戶，然後前往 API Keys 並產生新的金鑰。
  </Step>
  <Step title="執行 onboarding">
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

預設模型是 `kilocode/kilo/auto`，這是由 Kilo Gateway 管理、Provider 擁有的智慧路由模型。

<Note>
OpenClaw 會將 `kilocode/kilo/auto` 視為穩定的預設參照，但不會為該路由發布以來源支撐的工作到上游模型對應。`kilocode/kilo/auto` 背後的確切上游路由由 Kilo Gateway 擁有，而不是硬編碼在 OpenClaw 中。
</Note>

## 內建目錄

OpenClaw 會在啟動時從 Kilo Gateway 動態探索可用模型。使用 `/models kilocode` 查看你的帳戶可用的完整模型清單。

Gateway 上任何可用模型都可以使用 `kilocode/` 前綴：

| 模型參照                               | 備註                               |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | 預設 — 智慧路由                    |
| `kilocode/anthropic/claude-sonnet-4`   | 透過 Kilo 使用 Anthropic           |
| `kilocode/openai/gpt-5.5`              | 透過 Kilo 使用 OpenAI              |
| `kilocode/google/gemini-3-pro-preview` | 透過 Kilo 使用 Google              |
| ...以及更多                            | 使用 `/models kilocode` 列出全部   |

<Tip>
啟動時，OpenClaw 會查詢 `GET https://api.kilo.ai/api/gateway/models`，並將探索到的模型合併到靜態後備目錄之前。隨附的後備目錄一律包含 `kilocode/kilo/auto`（`Kilo Auto`），其 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`，以及 `maxTokens: 128000`。
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
    Kilo Gateway 在原始碼中被記錄為與 OpenRouter 相容，因此它會維持在代理樣式、與 OpenAI 相容的路徑上，而不是使用原生 OpenAI 請求塑形。

    - Gemini-backed Kilo refs 會維持在 proxy-Gemini 路徑上，因此 OpenClaw 會在該處保留 Gemini 思考簽章清理，而不啟用原生 Gemini 重播驗證或 bootstrap rewrites。
    - Kilo Gateway 會在底層使用帶有你的 API 金鑰的 Bearer token。

  </Accordion>

  <Accordion title="串流包裝器與 reasoning">
    Kilo 的共用串流包裝器會加入 Provider 應用程式標頭，並針對支援的具體模型參照標準化 proxy reasoning payloads。

    <Warning>
    `kilocode/kilo/auto` 和其他不支援 proxy-reasoning 的提示會略過 reasoning 注入。如果你需要 reasoning 支援，請使用具體模型參照，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果模型探索在啟動時失敗，OpenClaw 會退回使用隨附的靜態目錄，其中包含 `kilocode/kilo/auto`。
    - 確認你的 API 金鑰有效，且你的 Kilo 帳戶已啟用所需模型。
    - 當 Gateway 作為 daemon 執行時，請確保 `KILOCODE_API_KEY` 可供該程序使用（例如在 `~/.openclaw/.env` 中或透過 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 Provider、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 儀表板、API 金鑰與帳戶管理。
  </Card>
</CardGroup>
