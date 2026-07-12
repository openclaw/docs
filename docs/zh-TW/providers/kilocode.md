---
read_when:
    - 您想使用單一 API 金鑰存取多個大型語言模型
    - 你想要在 OpenClaw 中透過 Kilo Gateway 執行模型
summary: 使用 Kilo Gateway 的統一 API，在 OpenClaw 中存取多種模型
title: Kilo 閘道
x-i18n:
    generated_at: "2026-07-11T21:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 透過單一 OpenAI 相容端點與 API 金鑰，將請求路由至多個模型。

| 屬性     | 值                                 |
| -------- | ---------------------------------- |
| 提供者   | `kilocode`                         |
| 驗證     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 相容                        |
| 基礎 URL | `https://api.kilo.ai/api/gateway/` |

## 安裝外掛

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 設定

<Steps>
  <Step title="建立帳戶">
    前往 [app.kilo.ai](https://app.kilo.ai)，登入或建立帳戶，然後產生 API 金鑰。
  </Step>
  <Step title="執行初始設定">
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

## 預設模型與目錄

預設模型為 `kilocode/kilo/auto`，這是由提供者管理的智慧路由模型。OpenClaw 不會
發布其任務至上游模型的對應關係；`kilo/auto` 背後的路由由 Kilo Gateway 管理。

OpenClaw 啟動時會查詢 `GET https://api.kilo.ai/api/gateway/models`，並將探索到的模型
合併至靜態備援目錄之前。靜態備援僅包含 `kilocode/kilo/auto`（`Kilo Auto`、
`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）。

閘道上的任何模型均可透過 `kilocode/<upstream-id>` 定址（例如
`kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。執行 `/models kilocode` 或
`openclaw models list --provider kilocode` 即可查看完整的探索清單。

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

## 行為說明

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Kilo Gateway 與 OpenRouter 相容，因此會使用代理式的 OpenAI 相容請求
    路徑，而非原生 OpenAI 請求格式（不含 `store`，也不含 OpenAI 推理強度承載資料）。

    - 以 Gemini 為後端的 Kilo 參照會繼續使用代理 Gemini 路徑：OpenClaw 會在該路徑清理 Gemini 思考
      簽章，但不會啟用原生 Gemini 重播驗證或啟動重寫。
    - 請求使用由 API 金鑰建立的 Bearer 權杖。

  </Accordion>

  <Accordion title="串流包裝器與推理">
    Kilo 串流包裝器會加入 `X-KILOCODE-FEATURE` 請求標頭（預設為 `openclaw`，
    可透過 `KILOCODE_FEATURE` 環境變數覆寫），並為支援的模型標準化推理強度承載資料。

    <Warning>
    `kilocode/kilo/auto` 與 `x-ai/*` 參照會略過推理強度注入。如需推理支援，
    請使用具體的模型參照，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果啟動時模型探索失敗，OpenClaw 會改用包含 `kilocode/kilo/auto` 的靜態備援目錄。
    - 請確認 API 金鑰有效，且 Kilo 帳戶已啟用所需模型。
    - 當閘道以常駐程式執行時，請確保該程序可存取 `KILOCODE_API_KEY`（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 儀表板、API 金鑰與帳戶管理。
  </Card>
</CardGroup>
