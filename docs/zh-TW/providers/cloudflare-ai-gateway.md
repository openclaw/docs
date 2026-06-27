---
read_when:
    - 您想搭配 OpenClaw 使用 Cloudflare AI Gateway
    - 你需要帳戶 ID、閘道 ID，或 API 金鑰環境變數
summary: Cloudflare AI 閘道設定（驗證 + 模型選擇）
title: Cloudflare AI 閘道
x-i18n:
    generated_at: "2026-06-27T19:53:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI 閘道位於提供者 API 前方，讓你加入分析、快取和控制功能。對 Anthropic 而言，OpenClaw 會透過你的閘道端點使用 Anthropic Messages API。

| 屬性          | 值                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 提供者        | `cloudflare-ai-gateway`                                                                  |
| 基底 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 預設模型      | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 金鑰      | `CLOUDFLARE_AI_GATEWAY_API_KEY`（你透過閘道發出請求時使用的提供者 API 金鑰） |

<Note>
對於透過 Cloudflare AI 閘道路由的 Anthropic 模型，請使用你的 **Anthropic API 金鑰** 作為提供者金鑰。
</Note>

當 Anthropic Messages 模型啟用思考時，OpenClaw 會先移除結尾的
assistant 預填回合，再透過 Cloudflare AI 閘道傳送 payload。
Anthropic 會拒絕搭配延伸思考的回應預填，而一般的
非思考預填仍可使用。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Set the provider API key and Gateway details">
    執行 onboarding，並選擇 Cloudflare AI 閘道驗證選項：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    這會提示你輸入帳戶 ID、閘道 ID 和 API 金鑰。

  </Step>
  <Step title="Set a default model">
    將模型新增到你的 OpenClaw 設定：

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
  <Step title="Verify the model is available">
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
  <Accordion title="Authenticated gateways">
    如果你在 Cloudflare 啟用了閘道驗證，請新增 `cf-aig-authorization` 標頭。這是你的提供者 API 金鑰**以外**的額外設定。

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
    `cf-aig-authorization` 標頭會向 Cloudflare 閘道本身驗證，而提供者 API 金鑰（例如你的 Anthropic 金鑰）則會向上游提供者驗證。
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    如果閘道以 daemon（launchd/systemd）執行，請確保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 可供該程序使用。

    <Warning>
    只在互動式 shell 中匯出的金鑰，除非該環境也匯入到 launchd/systemd daemon，否則不會對其生效。請在 `~/.openclaw/.env` 或透過 `env.shellEnv` 設定金鑰，以確保閘道程序可以讀取。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 refs 和容錯移轉行為。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解和常見問題。
  </Card>
</CardGroup>
