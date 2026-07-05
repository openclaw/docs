---
read_when:
    - 你想要一把可用於多種 LLM 的單一 API 金鑰
    - 你想在 OpenClaw 中透過 Kilo Gateway 執行模型
summary: 使用 Kilo 閘道的統一 API，在 OpenClaw 中存取多種模型
title: Kilo 閘道
x-i18n:
    generated_at: "2026-07-05T11:37:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 會將請求路由到單一 OpenAI 相容端點和 API 金鑰後方的多個模型。

| 屬性 | 值                              |
| -------- | ---------------------------------- |
| 供應商 | `kilocode`                         |
| 驗證     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 相容                  |
| 基底 URL | `https://api.kilo.ai/api/gateway/` |

## 安裝外掛

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 設定

<Steps>
  <Step title="建立帳號">
    前往 [app.kilo.ai](https://app.kilo.ai)，登入或建立帳號，然後產生 API 金鑰。
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
  <Step title="驗證模型可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 預設模型與目錄

預設模型是 `kilocode/kilo/auto`，這是由供應商擁有的智慧路由模型。OpenClaw 不會
發布其工作到上游模型的對應；`kilo/auto` 後方的路由由 Kilo Gateway 擁有。

啟動時，OpenClaw 會查詢 `GET https://api.kilo.ai/api/gateway/models`，並在靜態備援目錄前合併探索到的模型。靜態備援僅包含 `kilocode/kilo/auto`（`Kilo Auto`、
`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）。

閘道上的任何模型都可以用 `kilocode/<upstream-id>` 定址（例如
`kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。執行 `/models kilocode` 或
`openclaw models list --provider kilocode` 以查看完整探索清單。

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

## 行為備註

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Kilo Gateway 與 OpenRouter 相容，因此它使用代理樣式的 OpenAI 相容請求
    路徑，而不是原生 OpenAI 請求塑形（沒有 `store`，也沒有 OpenAI reasoning-effort 酬載）。

    - 由 Gemini 支援的 Kilo 參照會留在代理 Gemini 路徑上：OpenClaw 會在該處清理 Gemini 思考
      簽章，但不會啟用原生 Gemini 重播驗證或啟動重寫。
    - 請求會使用由你的 API 金鑰建立的 Bearer 權杖。

  </Accordion>

  <Accordion title="串流包裝器與推理">
    Kilo 串流包裝器會加入 `X-KILOCODE-FEATURE` 請求標頭（預設為 `openclaw`，
    可用 `KILOCODE_FEATURE` 環境變數覆寫），並為支援的模型正規化 reasoning-effort 酬載。

    <Warning>
    `kilocode/kilo/auto` 和 `x-ai/*` 參照會略過 reasoning-effort 注入。如果你需要推理支援，請使用具體模型
    參照，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果啟動時模型探索失敗，OpenClaw 會退回到包含 `kilocode/kilo/auto` 的靜態目錄。
    - 確認你的 API 金鑰有效，且你的 Kilo 帳號已啟用所需模型。
    - 當 Gateway 以守護程式執行時，請確保 `KILOCODE_API_KEY` 可供該程序使用（例如放在 `~/.openclaw/.env` 或透過 `env.shellEnv`）。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 儀表板、API 金鑰和帳號管理。
  </Card>
</CardGroup>
