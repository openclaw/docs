---
read_when:
    - 您想搭配 OpenClaw 使用 Cloudflare AI Gateway
    - 你需要帳戶 ID、閘道 ID，或 API 金鑰環境變數
summary: Cloudflare AI Gateway 設定（驗證 + 模型選擇）
title: Cloudflare AI 閘道
x-i18n:
    generated_at: "2026-07-05T11:36:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI 閘道](https://developers.cloudflare.com/ai-gateway/) 位於供應商 API 前方，並新增分析、快取與控制功能。對 Anthropic 而言，OpenClaw 會透過你的閘道端點使用 Anthropic Messages API。

| 屬性      | 值                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| 供應商      | `cloudflare-ai-gateway`                                                                  |
| 外掛        | 官方外部套件 (`@openclaw/cloudflare-ai-gateway-provider`)                   |
| 基礎 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 預設模型 | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 金鑰       | `CLOUDFLARE_AI_GATEWAY_API_KEY`（你用於透過閘道發送請求的供應商 API 金鑰） |

<Note>
對於透過 Cloudflare AI 閘道路由的 Anthropic 模型，請使用你的 **Anthropic API 金鑰** 作為供應商金鑰。
</Note>

當 Anthropic Messages 模型啟用思考時，OpenClaw 會在透過 Cloudflare AI 閘道傳送酬載前，移除結尾的助理預填輪次。
Anthropic 會拒絕搭配延伸思考的回應預填，而一般非思考的預填仍可使用。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Set the provider API key and Gateway details">
    執行導覽設定並選擇 Cloudflare AI 閘道驗證選項：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    這會提示你輸入帳戶 ID、閘道 ID 與 API 金鑰。

  </Step>
  <Step title="Set a default model">
    將模型加入你的 OpenClaw 設定：

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
    如果你在 Cloudflare 啟用了閘道驗證，請加入 `cf-aig-authorization` 標頭。這是你的供應商 API 金鑰**以外**的設定。

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
    `cf-aig-authorization` 標頭會向 Cloudflare 閘道本身驗證，而供應商 API 金鑰（例如你的 Anthropic 金鑰）會向上游供應商驗證。
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    如果閘道以常駐程式執行（launchd/systemd），請確保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 可供該程序使用。

    <Warning>
    只在互動式 shell 中匯出的金鑰無法協助 launchd/systemd 常駐程式，除非該環境也已匯入到那裡。請在 `~/.openclaw/.env` 中或透過 `env.shellEnv` 設定金鑰，以確保閘道程序可以讀取。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
