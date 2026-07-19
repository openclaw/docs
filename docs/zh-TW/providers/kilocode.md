---
read_when:
    - 你想使用單一 API 金鑰存取多個 LLM
    - 你想在 OpenClaw 中透過 Kilo 閘道執行模型
summary: 使用 Kilo Gateway 的統一 API，在 OpenClaw 中存取多種模型
title: Kilo 閘道
x-i18n:
    generated_at: "2026-07-19T14:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway 透過單一 OpenAI 相容端點與 API 金鑰，將請求路由至多個模型。

| 屬性     | 值                                 |
| -------- | ---------------------------------- |
| 提供者   | `kilocode`                 |
| 驗證     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 相容                        |
| 基底 URL | `https://api.kilo.ai/api/gateway/`                 |

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

預設模型為 `kilocode/kilo-auto/balanced`，即 Kilo Gateway 的平衡智慧路由層級。
OpenClaw 不會公布其任務至上游模型的對應關係；`kilo-auto/balanced`
背後的路由由 Kilo Gateway 負責。

OpenClaw 啟動時會查詢 `GET https://api.kilo.ai/api/gateway/models`，並將探索到的模型
合併至靜態備援目錄之前。靜態備援僅包含
`kilocode/kilo-auto/balanced`（`Auto Balanced`、`input: ["text", "image"]`、`reasoning: true`、
`contextWindow: 1000000`、`maxTokens: 65536`）。

閘道上的任何模型都能以 `kilocode/<upstream-id>` 定址（例如
`kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。執行 `/models kilocode` 或
`openclaw models list --provider kilocode`，即可查看探索到的完整清單。

## 設定範例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## 行為說明

<AccordionGroup>
  <Accordion title="傳輸與相容性">
    Kilo Gateway 與 OpenRouter 相容，因此會使用代理式 OpenAI 相容請求
    路徑，而非原生 OpenAI 請求格式（無 `store`，也無 OpenAI 推理強度承載資料）。

    - 由 Gemini 支援的 Kilo 參照會繼續使用代理 Gemini 路徑：OpenClaw 會在該處清理 Gemini 思考
      簽章，但不會啟用原生 Gemini 重播驗證或啟動重寫。
    - 請求會使用以你的 API 金鑰建立的 Bearer 權杖。

  </Accordion>

  <Accordion title="串流包裝器與推理">
    Kilo 串流包裝器會新增 `X-KILOCODE-FEATURE` 請求標頭（預設為 `openclaw`，
    可使用 `KILOCODE_FEATURE` 環境變數覆寫），並為支援的模型
    正規化推理強度承載資料。

    <Warning>
    `kilocode/kilo-auto/balanced` 與 `x-ai/*` 參照會略過推理強度注入。如需推理支援，
    請使用具體的模型參照，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 若啟動時模型探索失敗，OpenClaw 會改用包含 `kilocode/kilo-auto/balanced` 的靜態目錄。
    - 確認你的 API 金鑰有效，且 Kilo 帳戶已啟用所需模型。
    - 當閘道以常駐程式執行時，請確保該程序可取得 `KILOCODE_API_KEY`（例如設於 `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供）。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 儀表板、API 金鑰與帳戶管理。
  </Card>
</CardGroup>
