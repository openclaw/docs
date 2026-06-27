---
read_when:
    - 你想搭配 OpenClaw 使用 Vercel AI Gateway
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Vercel AI Gateway 設定（驗證 + 模型選擇）
title: Vercel AI 閘道
x-i18n:
    generated_at: "2026-06-27T19:57:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供統一的 API，可透過單一端點存取數百個模型。

| 屬性          | 值                                     |
| ------------- | -------------------------------------- |
| 提供者        | `vercel-ai-gateway`                    |
| 套件          | `@openclaw/vercel-ai-gateway-provider` |
| 驗證          | `AI_GATEWAY_API_KEY`                   |
| API           | 相容 Anthropic Messages                |
| 模型目錄      | 透過 `/v1/models` 自動探索             |

<Tip>
OpenClaw 會自動探索 Gateway `/v1/models` 目錄，因此
`/models vercel-ai-gateway` 會包含目前的模型參照，例如
`vercel-ai-gateway/openai/gpt-5.5` 和
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
    執行新手導引並選擇 AI Gateway 驗證選項：

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="設定預設模型">
    將模型加入你的 OpenClaw 設定：

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
  <Step title="驗證模型可用">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非互動範例

若用於指令碼或 CI 設定，請在命令列傳入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 簡寫

OpenClaw 接受 Vercel Claude 簡寫模型參照，並在執行階段將其正規化：

| 簡寫輸入                            | 正規化模型參照                                |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
你可以在設定中使用簡寫或完整限定的模型參照。OpenClaw 會自動解析為標準形式。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="守護行程的環境變數">
    如果 OpenClaw Gateway 以守護行程（launchd/systemd）執行，請確保
    `AI_GATEWAY_API_KEY` 可供該行程使用。

    <Warning>
    只在互動式 shell 中匯出的金鑰，不會對 launchd/systemd 守護行程可見，除非明確匯入該環境。請在
    `~/.openclaw/.env` 或透過 `env.shellEnv` 設定金鑰，以確保閘道
    行程可以讀取它。
    </Warning>

  </Accordion>

  <Accordion title="提供者路由">
    Vercel AI Gateway 會根據模型參照前綴，將請求路由至上游提供者。例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 會透過 Anthropic 路由，而 `vercel-ai-gateway/openai/gpt-5.5` 會透過 OpenAI 路由，`vercel-ai-gateway/moonshotai/kimi-k2.6` 則會透過
    MoonshotAI 路由。你的單一 `AI_GATEWAY_API_KEY` 會處理所有
    上游提供者的驗證。
  </Accordion>
  <Accordion title="思考層級">
    當 OpenClaw 知道上游提供者合約時，`/think` 選項會遵循受信任的上游模型前綴。`vercel-ai-gateway/anthropic/...` 使用
    Claude 思考設定檔，包括 Claude 4.6 模型的自適應預設值。
    `vercel-ai-gateway/openai/gpt-5.4`、`gpt-5.5` 和 Codex 風格參照會像直接的 OpenAI/OpenAI Codex 提供者一樣公開
    `/think xhigh`。其他命名空間參照會保留一般推理層級，除非其目錄
    中繼資料宣告更多。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
