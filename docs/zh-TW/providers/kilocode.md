---
read_when:
    - 你想要一把可用於多個 LLM 的 API 金鑰
    - 您想要透過 Kilo Gateway 在 OpenClaw 中執行模型
summary: 使用 Kilo Gateway 的統一 API 在 OpenClaw 中存取多種模型
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 提供一個**統一 API**，可透過單一端點與 API 金鑰，將請求路由到多個模型。它相容於 OpenAI，因此大多數 OpenAI SDK 只要切換 base URL 即可運作。

| 屬性 | 值                                 |
| -------- | ---------------------------------- |
| 提供者 | `kilocode`                         |
| 驗證     | `KILOCODE_API_KEY`                 |
| API      | 相容於 OpenAI                  |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 開始使用

<Steps>
  <Step title="建立帳戶">
    前往 [app.kilo.ai](https://app.kilo.ai)，登入或建立帳戶，然後導覽至 API Keys 並產生新的金鑰。
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

預設模型是 `kilocode/kilo/auto`，這是由提供者擁有並由 Kilo Gateway 管理的智慧路由模型。

<Note>
OpenClaw 會將 `kilocode/kilo/auto` 視為穩定的預設 ref，但不會為該路由發布有來源依據的任務對上游模型對應。`kilocode/kilo/auto` 背後的確切上游路由由 Kilo Gateway 擁有，而不是硬編碼在 OpenClaw 中。
</Note>

## 內建目錄

OpenClaw 會在啟動時從 Kilo Gateway 動態探索可用模型。使用 `/models kilocode` 查看你的帳戶可用的完整模型清單。

Gateway 上可用的任何模型都可以搭配 `kilocode/` 前綴使用：

| 模型 ref                                | 備註                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | 預設 — 智慧路由            |
| `kilocode/anthropic/claude-sonnet-4`     | 透過 Kilo 使用 Anthropic                 |
| `kilocode/openai/gpt-5.5`                | 透過 Kilo 使用 OpenAI                    |
| `kilocode/google/gemini-3.1-pro-preview` | 透過 Kilo 使用 Google                    |
| ...以及更多                         | 使用 `/models kilocode` 列出全部 |

<Tip>
啟動時，OpenClaw 會查詢 `GET https://api.kilo.ai/api/gateway/models`，並將探索到的模型合併到靜態 fallback 目錄之前。隨附的 fallback 一律包含 `kilocode/kilo/auto` (`Kilo Auto`)，其設定為 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
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
    Kilo Gateway 在原始碼中記錄為相容於 OpenRouter，因此它會維持在 proxy 風格的 OpenAI 相容路徑，而不是使用原生 OpenAI 請求塑形。

    - Gemini 支援的 Kilo refs 會維持在 proxy-Gemini 路徑，因此 OpenClaw 會在該處保留 Gemini thought-signature 清理，而不啟用原生 Gemini replay 驗證或 bootstrap 重寫。
    - Kilo Gateway 會在底層使用帶有你的 API 金鑰的 Bearer token。

  </Accordion>

  <Accordion title="串流包裝器與 reasoning">
    Kilo 的共用串流包裝器會加入提供者應用程式標頭，並為支援的具體模型 refs 正規化 proxy reasoning payloads。

    <Warning>
    `kilocode/kilo/auto` 和其他不支援 proxy-reasoning 的提示會略過 reasoning 注入。如果你需要 reasoning 支援，請使用具體的模型 ref，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果啟動時模型探索失敗，OpenClaw 會 fallback 到包含 `kilocode/kilo/auto` 的隨附靜態目錄。
    - 確認你的 API 金鑰有效，且你的 Kilo 帳戶已啟用所需模型。
    - 當 Gateway 以 daemon 形式執行時，請確保 `KILOCODE_API_KEY` 可供該程序使用（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 refs，以及 failover 行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整 OpenClaw 設定參考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 儀表板、API 金鑰和帳戶管理。
  </Card>
</CardGroup>
