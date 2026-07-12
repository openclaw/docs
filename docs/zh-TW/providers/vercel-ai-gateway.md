---
read_when:
    - 你想要搭配 OpenClaw 使用 Vercel AI Gateway
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Vercel AI 閘道設定（驗證 + 模型選擇）
title: Vercel AI 閘道
x-i18n:
    generated_at: "2026-07-11T21:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供統一的 API，可透過單一端點存取數百種模型。

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
`/models vercel-ai-gateway` 聊天指令和
`openclaw models list --provider vercel-ai-gateway` 都會包含目前的模型
參照，例如 `vercel-ai-gateway/openai/gpt-5.5` 和
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

OpenClaw 會在執行階段將 Claude 的簡寫模型參照正規化：

| 簡寫輸入                            | 正規化後的模型參照                            |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在設定中使用任一形式；OpenClaw 會自動解析為標準的
`anthropic/...` 參照。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="常駐程序的環境變數">
    如果 OpenClaw 閘道以常駐程序（launchd/systemd）執行，請確保該程序
    可以存取 `AI_GATEWAY_API_KEY`。

    <Warning>
    僅在互動式 shell 中匯出的金鑰，除非明確匯入該環境，否則
    launchd/systemd 常駐程序無法取得。請在 `~/.openclaw/.env` 中設定
    金鑰，或透過 `env.shellEnv` 設定，以確保閘道程序能夠讀取。
    </Warning>

  </Accordion>

  <Accordion title="提供者路由">
    Vercel AI Gateway 會依照模型參照前綴中指定的上游提供者路由每個請求。
    例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 會透過 Anthropic
    路由，`vercel-ai-gateway/openai/gpt-5.5` 會透過 OpenAI 路由，而
    `vercel-ai-gateway/moonshotai/kimi-k2.6` 則會透過 MoonshotAI 路由。
    一組 `AI_GATEWAY_API_KEY` 即可驗證所有上游提供者。
  </Accordion>
  <Accordion title="思考層級">
    當 OpenClaw 能辨識上游模型前綴時，`/think` 選項會依循該前綴。
    `vercel-ai-gateway/anthropic/...` 使用 Claude 思考設定檔，
    包括 Claude 4.6 模型的自適應預設值。受信任的
    `vercel-ai-gateway/openai/...` 參照（`gpt-5.2` 及更新版本，以及最低至
    `gpt-5.1-codex` 的 Codex 變體）會提供 `/think xhigh`。其他具命名空間的
    參照會維持標準推理層級，除非其目錄中繼資料宣告更多層級。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
