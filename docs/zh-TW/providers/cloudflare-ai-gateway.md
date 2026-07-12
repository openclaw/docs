---
read_when:
    - 你想要搭配 OpenClaw 使用 Cloudflare AI Gateway
    - 你需要帳號 ID、閘道 ID 或 API 金鑰環境變數
summary: Cloudflare AI Gateway 設定（驗證 + 模型選擇）
title: Cloudflare AI 閘道
x-i18n:
    generated_at: "2026-07-11T21:41:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) 位於供應商 API 前方，提供分析、快取與控制功能。針對 Anthropic，OpenClaw 會透過您的閘道端點使用 Anthropic Messages API。

| 屬性       | 值                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------- |
| 供應商     | `cloudflare-ai-gateway`                                                                  |
| 外掛       | 官方外部套件（`@openclaw/cloudflare-ai-gateway-provider`）                               |
| 基底 URL   | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 預設模型   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 金鑰   | `CLOUDFLARE_AI_GATEWAY_API_KEY`（透過閘道發出請求時使用的供應商 API 金鑰）                |

<Note>
對於透過 Cloudflare AI Gateway 路由的 Anthropic 模型，請使用您的 **Anthropic API 金鑰**作為供應商金鑰。
</Note>

為 Anthropic Messages 模型啟用思考功能時，OpenClaw 會先移除尾端的助理預填輪次，再透過 Cloudflare AI Gateway 傳送承載資料。Anthropic 不允許在延伸思考模式下預填回應，但一般非思考模式仍可使用預填功能。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="設定供應商 API 金鑰與閘道詳細資料">
    執行初始設定並選擇 Cloudflare AI Gateway 驗證選項：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    系統會提示您輸入帳戶 ID、閘道 ID 與 API 金鑰。

  </Step>
  <Step title="設定預設模型">
    將模型新增至您的 OpenClaw 設定：

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

若要用於指令碼或 CI 設定，請透過命令列傳入所有值：

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
  <Accordion title="已驗證的閘道">
    若您已在 Cloudflare 中啟用閘道驗證，請新增 `cf-aig-authorization` 標頭。這是對供應商 API 金鑰的**額外要求**。

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
    `cf-aig-authorization` 標頭用於向 Cloudflare Gateway 本身進行驗證，而供應商 API 金鑰（例如您的 Anthropic 金鑰）則用於向上游供應商進行驗證。
    </Tip>

  </Accordion>

  <Accordion title="環境注意事項">
    若閘道以背景服務（launchd/systemd）執行，請確保該程序可存取 `CLOUDFLARE_AI_GATEWAY_API_KEY`。

    <Warning>
    僅在互動式 shell 中匯出的金鑰不會對 launchd/systemd 背景服務生效，除非該環境也匯入至背景服務中。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，以確保閘道程序可以讀取該金鑰。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
