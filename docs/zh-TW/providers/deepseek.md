---
read_when:
    - 你想要搭配 OpenClaw 使用 DeepSeek
    - 您需要 API 金鑰環境變數或命令列介面驗證選項
summary: DeepSeek 設定（驗證 + 模型選擇）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-05T11:40:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0a66574c1977e835823d3d5f9fea073889267d6336a15533dd25645621e70dc
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供強大的 AI 模型，並具備 OpenAI 相容 API。

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
  <Step title="取得你的 API 金鑰">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 建立 API 金鑰。
  </Step>
  <Step title="執行 onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    會提示輸入你的 API 金鑰，並將 `deepseek/deepseek-v4-flash` 設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    若要在沒有執行中閘道的情況下檢查外掛的靜態目錄：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非互動式設定">
    對於腳本化或無頭安裝，請直接傳入所有旗標：

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
如果閘道以 daemon（launchd/systemd）方式執行，請確保 `DEEPSEEK_API_KEY`
可供該程序使用（例如放在 `~/.openclaw/.env` 中，或透過
`env.shellEnv`）。
</Warning>

## 內建目錄

| 模型參照                    | 名稱              | 輸入 | 上下文   | 最大輸出 | 備註                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 文字  | 1,000,000 | 384,000    | 預設模型；支援 V4 thinking 的介面 |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | 文字  | 1,000,000 | 384,000    | 支援 V4 thinking 的介面                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | 文字  | 131,072   | 8,192      | DeepSeek V3.2 非 thinking 介面         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | 文字  | 131,072   | 65,536     | 啟用推理的 V3.2 介面             |

<Tip>
V4 模型支援 DeepSeek 的 `thinking` 控制。OpenClaw 也會在後續輪次重播
DeepSeek `reasoning_content`，讓包含工具呼叫的 thinking 工作階段可以繼續。
搭配 DeepSeek V4 模型使用 `/think xhigh` 或 `/think max`，即可要求 DeepSeek 的
最大 `reasoning_effort`；兩者都會對應到 `"max"`。
</Tip>

## Thinking 與工具

DeepSeek V4 thinking 工作階段要求從啟用 thinking 的輪次重播的助理訊息，
在後續請求中包含 `reasoning_content`。OpenClaw 的 DeepSeek 外掛會自動回填該欄位，因此一般的
多輪工具使用可在 `deepseek/deepseek-v4-flash` 和
`deepseek/deepseek-v4-pro` 上運作，即使歷史記錄來自另一個
OpenAI 相容提供者（沒有原生 `reasoning_content`），或來自一般的
助理訊息也一樣。切換提供者後在同一工作階段中不需要 `/new`。

停用 thinking 時（包含 UI 的 **無** 選項），OpenClaw
會傳送 `thinking: { type: "disabled" }`，並從傳出歷史記錄中移除重播的 `reasoning_content`，
讓工作階段維持在 DeepSeek 的非 thinking 路徑。

預設快速路徑請使用 `deepseek/deepseek-v4-flash`。當你可以接受較高
成本或延遲時，使用 `deepseek/deepseek-v4-pro` 取得更強的模型。

## 即時測試

若只要從現代模型即時套件執行 DeepSeek V4 直接模型檢查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

會驗證兩個 V4 模型都能完成，並確認 thinking/工具後續輪次
會保留 DeepSeek 要求的重播酬載。

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
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    代理、模型和提供者的完整設定參考。
  </Card>
</CardGroup>
