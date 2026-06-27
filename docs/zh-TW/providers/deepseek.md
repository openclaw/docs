---
read_when:
    - 你想要搭配 OpenClaw 使用 DeepSeek
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: DeepSeek 設定（驗證 + 模型選擇）
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T19:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供功能強大的 AI 模型，並具備 OpenAI 相容 API。

| 屬性 | 值                         |
| -------- | -------------------------- |
| 提供者 | `deepseek`                 |
| 驗證     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 相容          |
| 基礎 URL | `https://api.deepseek.com` |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Get your API key">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 建立 API 金鑰。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    這會提示你輸入 API 金鑰，並將 `deepseek/deepseek-v4-flash` 設為預設模型。

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    若要在不需要執行中閘道的情況下檢查外掛的靜態目錄，
    請使用：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    對於指令碼化或無頭安裝，請直接傳入所有旗標：

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
如果閘道以常駐程式（launchd/systemd）執行，請確保該程序可使用 `DEEPSEEK_API_KEY`
（例如放在 `~/.openclaw/.env` 中，或透過
`env.shellEnv`）。
</Warning>

## 內建目錄

| 模型參照                    | 名稱              | 輸入 | 上下文   | 最大輸出 | 備註                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 文字  | 1,000,000 | 384,000    | 預設模型；具備 V4 思考能力的介面 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | 文字  | 1,000,000 | 384,000    | 具備 V4 思考能力的介面                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | 文字  | 131,072   | 8,192      | DeepSeek V3.2 非思考介面         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | 文字  | 131,072   | 65,536     | 啟用推理的 V3.2 介面             |

<Tip>
V4 模型支援 DeepSeek 的 `thinking` 控制。OpenClaw 也會在後續輪次重播
DeepSeek `reasoning_content`，讓含工具呼叫的思考工作階段可以繼續。
請搭配 DeepSeek V4 模型使用 `/think xhigh` 或 `/think max`，以要求 DeepSeek 的
最高 `reasoning_effort`。
</Tip>

## 思考與工具

DeepSeek V4 思考工作階段的重播契約比大多數
OpenAI 相容提供者更嚴格：在啟用思考的輪次使用工具之後，DeepSeek
預期該輪次重播的助理訊息會在後續請求中包含
`reasoning_content`。OpenClaw 會在
DeepSeek 外掛內處理這點，因此一般多輪工具使用可搭配
`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 正常運作。

如果你將現有工作階段從另一個 OpenAI 相容提供者切換到
DeepSeek V4 模型，較舊的助理工具呼叫輪次可能沒有原生
DeepSeek `reasoning_content`。OpenClaw 會為 DeepSeek V4 思考請求中重播的
助理訊息填補這個缺少的欄位，讓提供者可接受歷史記錄，而不需要 `/new`。

在 OpenClaw 中停用思考時（包括 UI 的 **None** 選項），
OpenClaw 會傳送 DeepSeek `thinking: { type: "disabled" }`，並從傳出歷史中移除重播的
`reasoning_content`。這會讓停用思考的工作階段維持在 DeepSeek 的非思考路徑。

預設快速路徑請使用 `deepseek/deepseek-v4-flash`。當你想要更強的 V4 模型，且可接受
較高成本或延遲時，請使用
`deepseek/deepseek-v4-pro`。

## 即時測試

直接即時模型套件在現代模型集中包含 DeepSeek V4。若要
只執行 DeepSeek V4 直接模型檢查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

該即時檢查會驗證兩個 V4 模型都能完成，且思考/工具
後續輪次會保留 DeepSeek 所需的重播酬載。

## 設定範例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、models 與 providers 的完整設定參考。
  </Card>
</CardGroup>
