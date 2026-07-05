---
read_when:
    - 你想要搭配 OpenClaw 使用 Fireworks
    - 你需要 Fireworks API 金鑰環境變數或預設模型 ID
    - 你正在偵錯 Fireworks 上 Kimi 的關閉思考行為
summary: Fireworks 設定（驗證 + 模型選擇）
title: 煙火
x-i18n:
    generated_at: "2026-07-05T11:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 透過 OpenAI 相容 API 提供開放權重與路由模型。安裝官方 Fireworks 供應商外掛，即可使用兩個預先編入目錄的 Kimi 模型，以及在執行階段使用任何 Fireworks 模型或路由器 id。

| 屬性            | 值                                                     |
| --------------- | ------------------------------------------------------ |
| 供應商 id       | `fireworks`（別名：`fireworks-ai`）                    |
| 套件            | `@openclaw/fireworks-provider`                         |
| 驗證環境變數    | `FIREWORKS_API_KEY`                                    |
| 入門設定旗標    | `--auth-choice fireworks-api-key`                      |
| 直接命令列旗標  | `--fireworks-api-key <key>`                            |
| API             | OpenAI 相容（`openai-completions`）                    |
| Base URL        | `https://api.fireworks.ai/inference/v1`                |
| 預設模型        | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 預設別名        | `Kimi K2.5 Turbo`                                      |

## 開始使用

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash 入門設定
openclaw onboard --auth-choice fireworks-api-key
```

```bash 直接旗標
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash 僅環境變數
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    入門設定會將金鑰存到驗證設定檔中的 `fireworks` 供應商，並將 **Fire Pass** Kimi K2.5 Turbo 路由器設為預設模型。

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    清單應包含 `Kimi K2.6` 和 `Kimi K2.5 Turbo (Fire Pass)`。如果 `FIREWORKS_API_KEY` 無法解析，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的憑證。

  </Step>
</Steps>

## 非互動式設定

對於指令稿或 CI 安裝，請在命令列中傳入所有項目：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 內建目錄

| 模型 ref                                               | 名稱                        | 輸入         | 上下文  | 最大輸出   | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文字 + 圖像  | 262,144 | 262,144    | 強制關閉             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文字 + 圖像  | 256,000 | 256,000    | 強制關閉（預設）     |

<Note>
  OpenClaw 會將所有 Fireworks Kimi 模型固定為 `thinking: off`，因為 Fireworks 上的 Kimi 可能會將思維鏈洩漏到可見回覆中，除非請求明確停用 thinking。透過 [Moonshot](/zh-TW/providers/moonshot) 直接路由相同模型會保留 Kimi 推理輸出。請參閱 [thinking 模式](/zh-TW/tools/thinking) 了解如何在供應商之間切換。
</Note>

## 自訂 Fireworks 模型 id

OpenClaw 在執行階段接受任何 Fireworks 模型或路由器 id。請使用 Fireworks 顯示的確切 id，並加上 `fireworks/` 前綴。動態解析會複製 Fire Pass 範本（文字 + 圖像輸入、OpenAI 相容 API、預設成本為零），並在 id 符合 Kimi 模式時自動停用 thinking。GLM 動態 id 會標記為僅文字，除非你設定了包含圖像輸入的自訂模型項目。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    OpenClaw 中的每個 Fireworks 模型 ref 都以 `fireworks/` 開頭，後面接 Fireworks 平台中的確切 id 或路由器路徑。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在建構 API 請求時會移除 `fireworks/` 前綴，並將剩餘路徑作為 OpenAI 相容的 `model` 欄位傳送到 Fireworks 端點。

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks 提供 Kimi 時沒有獨立的推理通道，因此思維鏈可能會出現在可見的 `content` 串流中。對於每個 Fireworks Kimi 請求，OpenClaw 都會傳送 `thinking: { type: "disabled" }`，並從承載資料中移除 `reasoning`、`reasoning_effort` 和 `reasoningEffort`（`extensions/fireworks/stream.ts`）。供應商政策（`extensions/fireworks/thinking-policy.ts`）只會為 Kimi 模型 id 公告 `off` thinking 等級，因此手動 `/think` 切換和供應商政策介面會與執行階段合約保持一致。

    若要端到端使用 Kimi 推理，請設定 [Moonshot 供應商](/zh-TW/providers/moonshot)，並透過它路由相同模型。

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    如果 Gateway 以受管理服務執行（launchd、systemd、Docker），Fireworks 金鑰必須對該行程可見，而不只是對你的互動式 shell 可見。

    <Warning>
      只在互動式 shell 中匯出的金鑰，除非該環境也匯入到 launchd 或 systemd daemon，否則不會有幫助。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，讓 gateway 行程可以讀取。
    </Warning>

    OpenClaw 載入設定時會載入 `~/.openclaw/.env`，因此儲存在那裡的金鑰會在每個平台上傳遞給受管理的 gateway 服務。輪替金鑰後，請重新啟動 gateway（或重新執行 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型 ref 與容錯移轉行為。
  </Card>
  <Card title="Thinking modes" href="/zh-TW/tools/thinking" icon="brain">
    `/think` 等級、供應商政策，以及路由具備推理能力的模型。
  </Card>
  <Card title="Moonshot" href="/zh-TW/providers/moonshot" icon="moon">
    透過 Moonshot 自有 API 執行 Kimi，並取得原生 thinking 輸出。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
