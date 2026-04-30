---
read_when:
    - 你想要將 Fireworks 與 OpenClaw 搭配使用
    - 你需要 Fireworks API 金鑰環境變數或預設模型 ID
summary: Fireworks 設定（身分驗證 + 模型選擇）
title: Fireworks
x-i18n:
    generated_at: "2026-04-30T03:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 透過 OpenAI 相容 API 提供開放權重與路由模型。OpenClaw 內含一個隨附的 Fireworks 提供者 Plugin。

| 屬性          | 值                                                     |
| ------------- | ------------------------------------------------------ |
| 提供者        | `fireworks`                                            |
| 驗證          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI 相容的聊天/補全                                |
| 基礎 URL      | `https://api.fireworks.ai/inference/v1`                |
| 預設模型      | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## 開始使用

<Steps>
  <Step title="透過 onboarding 設定 Fireworks 驗證">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    這會將你的 Fireworks 金鑰儲存在 OpenClaw 設定中，並將 Fire Pass 入門模型設為預設值。

  </Step>
  <Step title="驗證模型可用">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非互動式範例

若是腳本化或 CI 設定，請在命令列傳入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 內建目錄

| 模型參照                                               | 名稱                        | 輸入       | 上下文  | 最大輸出   | 備註                                                                                                                                                |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | Fireworks 上最新的 Kimi 模型。Fireworks K2.6 請求會停用思考；如果你需要 Kimi 思考輸出，請直接透過 Moonshot 路由。 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Fireworks 上預設隨附的入門模型                                                                                                                      |

<Tip>
如果 Fireworks 發布較新的模型，例如新的 Qwen 或 Gemma 版本，你可以直接使用其 Fireworks 模型 ID 切換到該模型，不必等待隨附目錄更新。
</Tip>

## 自訂 Fireworks 模型 ID

OpenClaw 也接受動態 Fireworks 模型 ID。請使用 Fireworks 顯示的確切模型或路由器 ID，並加上 `fireworks/` 前綴。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="模型 ID 前綴的運作方式">
    OpenClaw 中的每個 Fireworks 模型參照都以 `fireworks/` 開頭，後面接 Fireworks 平台上的確切 ID 或路由器路徑。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 會在建立 API 請求時移除 `fireworks/` 前綴，並將剩餘路徑傳送至 Fireworks 端點。

  </Accordion>

  <Accordion title="環境注意事項">
    如果 Gateway 在你的互動式 shell 外執行，請確保 `FIREWORKS_API_KEY` 也可供該程序使用。

    <Warning>
    只有放在 `~/.profile` 中的金鑰不會幫助 launchd/systemd daemon，除非該環境也匯入到那裡。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，確保 Gateway 程序可以讀取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
