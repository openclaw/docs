---
read_when:
    - 你想將 DeepSeek 與 OpenClaw 搭配使用
    - 需要 API 金鑰環境變數或 CLI 驗證選項
summary: DeepSeek 設定（身分驗證 + 模型選擇）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T03:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供功能強大的 AI 模型，並具備與 OpenAI 相容的 API。

| 屬性 | 值                         |
| -------- | -------------------------- |
| 提供者 | `deepseek`                 |
| 認證     | `DEEPSEEK_API_KEY`         |
| API      | 與 OpenAI 相容             |
| 基底 URL | `https://api.deepseek.com` |

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 建立 API 金鑰。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    這會提示你輸入 API 金鑰，並將 `deepseek/deepseek-v4-flash` 設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    若要檢查內建的靜態目錄，而不需要執行中的 Gateway，請使用：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非互動式設定">
    若是指令碼化或無頭安裝，請直接傳入所有旗標：

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
如果 Gateway 以 daemon（launchd/systemd）形式執行，請確認 `DEEPSEEK_API_KEY`
可供該處理程序使用（例如放在 `~/.openclaw/.env`，或透過
`env.shellEnv`）。
</Warning>

## 內建目錄

| 模型參照                     | 名稱              | 輸入 | Context   | 最大輸出 | 備註                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | 預設模型；具備 V4 thinking 能力的介面 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | 具備 V4 thinking 能力的介面                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 非 thinking 介面         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 啟用推理的 V3.2 介面             |

<Tip>
V4 模型支援 DeepSeek 的 `thinking` 控制。OpenClaw 也會在後續回合重播
DeepSeek `reasoning_content`，因此包含工具呼叫的 thinking 工作階段可以繼續。
</Tip>

## Thinking 與工具

DeepSeek V4 thinking 工作階段的重播合約比大多數與 OpenAI 相容的提供者更嚴格：在啟用 thinking 的回合使用工具後，DeepSeek
預期該回合被重播的 assistant 訊息在後續請求中包含
`reasoning_content`。OpenClaw 會在
DeepSeek Plugin 內處理這一點，因此一般的多回合工具使用可搭配
`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 運作。

如果你將現有工作階段從另一個與 OpenAI 相容的提供者切換到
DeepSeek V4 模型，較舊的 assistant 工具呼叫回合可能沒有原生
DeepSeek `reasoning_content`。OpenClaw 會在 DeepSeek V4 thinking 請求的重播
assistant 訊息中填補該缺失欄位，讓提供者可接受
歷史記錄，而不需要 `/new`。

當 OpenClaw 停用 thinking（包括 UI 的 **None** 選項）時，
OpenClaw 會傳送 DeepSeek `thinking: { type: "disabled" }`，並從傳出的歷史記錄中移除重播的
`reasoning_content`。這會讓停用 thinking 的
工作階段留在非 thinking 的 DeepSeek 路徑上。

預設快速路徑請使用 `deepseek/deepseek-v4-flash`。當你想要更強的 V4 模型，且可接受
較高成本或延遲時，請使用
`deepseek/deepseek-v4-pro`。

## 即時測試

直接即時模型套件在現代模型集合中包含 DeepSeek V4。若只要
執行 DeepSeek V4 直接模型檢查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

該即時檢查會確認兩個 V4 模型都能完成，並確認 thinking/工具
後續回合會保留 DeepSeek 所需的重播酬載。

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

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    agents、模型與提供者的完整設定參考。
  </Card>
</CardGroup>
