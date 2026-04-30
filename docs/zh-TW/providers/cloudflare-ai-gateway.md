---
read_when:
    - 您想將 Cloudflare AI Gateway 與 OpenClaw 搭配使用
    - 你需要帳戶 ID、Gateway ID 或 API 金鑰環境變數
summary: Cloudflare AI Gateway 設定（身份驗證 + 模型選擇）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T03:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway 位於 Provider API 前方，讓你新增分析、快取與控制。對於 Anthropic，OpenClaw 會透過你的 Gateway 端點使用 Anthropic Messages API。

| 屬性          | 值                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| 基礎 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 預設模型      | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 金鑰      | `CLOUDFLARE_AI_GATEWAY_API_KEY`（你用於透過 Gateway 發出請求的 Provider API 金鑰）       |

<Note>
對於透過 Cloudflare AI Gateway 路由的 Anthropic 模型，請使用你的 **Anthropic API 金鑰** 作為 Provider 金鑰。
</Note>

為 Anthropic Messages 模型啟用思考時，OpenClaw 會在透過 Cloudflare AI Gateway
傳送承載資料前，移除尾端的 assistant 預填回合。
Anthropic 會拒絕搭配延伸思考的回應預填，而一般
非思考預填仍可使用。

## 開始使用

<Steps>
  <Step title="設定 Provider API 金鑰與 Gateway 詳細資料">
    執行 onboarding 並選擇 Cloudflare AI Gateway 驗證選項：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    這會提示你輸入帳戶 ID、Gateway ID 與 API 金鑰。

  </Step>
  <Step title="設定預設模型">
    將模型新增至你的 OpenClaw 設定：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非互動式範例

對於指令碼或 CI 設定，請在命令列傳入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 進階設定

<AccordionGroup>
  <Accordion title="已驗證的 Gateway">
    如果你已在 Cloudflare 啟用 Gateway 驗證，請新增 `cf-aig-authorization` 標頭。這是 **除了** 你的 Provider API 金鑰以外的設定。

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` 標頭會向 Cloudflare Gateway 本身進行驗證，而 Provider API 金鑰（例如你的 Anthropic 金鑰）會向上游 Provider 進行驗證。
    </Tip>

  </Accordion>

  <Accordion title="環境注意事項">
    如果 Gateway 以 daemon（launchd/systemd）執行，請確認 `CLOUDFLARE_AI_GATEWAY_API_KEY` 可供該程序使用。

    <Warning>
    只放在 `~/.profile` 中的金鑰不會對 launchd/systemd daemon 有幫助，除非該環境也已匯入至該處。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，以確保 Gateway 程序能讀取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 Provider、模型 refs 與容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
