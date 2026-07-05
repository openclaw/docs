---
read_when:
    - 你想將 Vercel AI 閘道與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Vercel AI 閘道設定（驗證 + 模型選擇）
title: Vercel AI 閘道
x-i18n:
    generated_at: "2026-07-05T11:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI 閘道](https://vercel.com/ai-gateway) 提供統一 API，可透過單一端點存取數百個模型。

| 屬性          | 值                                     |
| ------------- | -------------------------------------- |
| 提供者        | `vercel-ai-gateway`                    |
| 套件          | `@openclaw/vercel-ai-gateway-provider` |
| 驗證          | `AI_GATEWAY_API_KEY`                   |
| API           | 相容於 Anthropic Messages              |
| 基礎 URL      | `https://ai-gateway.vercel.sh`         |
| 模型目錄      | 透過 `/v1/models` 自動探索             |

<Tip>
OpenClaw 會自動探索閘道的 `/v1/models` 目錄，因此
`/models vercel-ai-gateway` 聊天命令和
`openclaw models list --provider vercel-ai-gateway` 都會包含目前的模型
refs，例如 `vercel-ai-gateway/openai/gpt-5.5` 和
`vercel-ai-gateway/moonshotai/kimi-k2.6`。
</Tip>

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="設定預設模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非互動式範例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 簡寫

OpenClaw 會在執行階段正規化 Claude 簡寫模型 refs：

| 簡寫輸入                            | 正規化模型 ref                              |
| ----------------------------------- | ------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在設定中使用任一形式；OpenClaw 會自動解析標準
`anthropic/...` ref。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="常駐程式的環境變數">
    如果 OpenClaw 閘道以常駐程式執行（launchd/systemd），請確認
    `AI_GATEWAY_API_KEY` 可供該程序使用。

    <Warning>
    只在互動式 shell 中匯出的金鑰不會對 launchd/systemd 常駐程式可見，
    除非明確匯入該環境。請在 `~/.openclaw/.env` 中設定金鑰，或透過
    `env.shellEnv` 設定，以確保閘道程序可以讀取它。
    </Warning>

  </Accordion>

  <Accordion title="提供者路由">
    Vercel AI 閘道會根據模型 ref 前綴中命名的上游提供者路由每個請求。
    例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 會透過 Anthropic 路由，
    `vercel-ai-gateway/openai/gpt-5.5` 會透過 OpenAI 路由，而
    `vercel-ai-gateway/moonshotai/kimi-k2.6` 會透過 MoonshotAI 路由。
    一個 `AI_GATEWAY_API_KEY` 可驗證所有上游提供者。
  </Accordion>
  <Accordion title="思考層級">
    當 OpenClaw 可辨識上游模型前綴時，`/think` 選項會依循該前綴。
    `vercel-ai-gateway/anthropic/...` 會使用 Claude 思考設定檔，
    包含 Claude 4.6 模型的自適應預設值。受信任的
    `vercel-ai-gateway/openai/...` refs（`gpt-5.2` 及更新版本，加上低至
    `gpt-5.1-codex` 的 Codex 變體）會公開 `/think xhigh`。其他具命名空間的
    refs 會保留標準推理層級，除非其目錄中繼資料宣告更多層級。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 refs，以及容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
