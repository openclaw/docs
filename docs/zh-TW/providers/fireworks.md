---
read_when:
    - 你想要搭配 OpenClaw 使用 Fireworks
    - 你需要 Fireworks API 金鑰環境變數或預設模型 ID
    - 你正在偵錯 Fireworks 上 Kimi 關閉思考的行為
summary: Fireworks 設定（驗證 + 模型選擇）
title: 煙火
x-i18n:
    generated_at: "2026-06-27T19:54:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 透過 OpenAI 相容 API 提供開放權重與路由模型。安裝官方 Fireworks 提供者外掛，即可在執行階段使用兩個預先編入目錄的 Kimi 模型，以及任何 Fireworks 模型或路由器 ID。

| 屬性            | 值                                                     |
| --------------- | ------------------------------------------------------ |
| 提供者 ID       | `fireworks`（別名：`fireworks-ai`）                    |
| 套件            | `@openclaw/fireworks-provider`                         |
| 驗證環境變數    | `FIREWORKS_API_KEY`                                    |
| 初始設定旗標    | `--auth-choice fireworks-api-key`                      |
| 直接命令列旗標  | `--fireworks-api-key <key>`                            |
| API             | OpenAI 相容（`openai-completions`）                    |
| 基礎 URL        | `https://api.fireworks.ai/inference/v1`                |
| 預設模型        | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 預設別名        | `Kimi K2.5 Turbo`                                      |

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="設定 Fireworks API 金鑰">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    初始設定會將金鑰儲存在驗證設定檔中的 `fireworks` 提供者下，並將 **Fire Pass** Kimi K2.5 Turbo 路由器設為預設模型。

  </Step>
  <Step title="驗證模型可用">
    ```bash
    openclaw models list --provider fireworks
    ```

    清單應包含 `Kimi K2.6` 和 `Kimi K2.5 Turbo (Fire Pass)`。如果 `FIREWORKS_API_KEY` 無法解析，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的憑證。

  </Step>
</Steps>

## 非互動式設定

若是指令碼或 CI 安裝，請在命令列傳入所有內容：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 內建目錄

| 模型參照                                               | 名稱                        | 輸入        | 上下文  | 最大輸出 | 思考               |
| ------------------------------------------------------ | --------------------------- | ----------- | ------- | -------- | ------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文字 + 圖片 | 262,144 | 262,144  | 強制關閉           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文字 + 圖片 | 256,000 | 256,000  | 強制關閉（預設）   |

<Note>
  OpenClaw 會將所有 Fireworks Kimi 模型固定為 `thinking: off`，因為 Fireworks 在正式環境中會拒絕 Kimi 思考參數。直接透過 [Moonshot](/zh-TW/providers/moonshot) 路由同一模型，則會保留 Kimi 推理輸出。請參閱[思考模式](/zh-TW/tools/thinking)，了解如何在提供者之間切換。
</Note>

## 自訂 Fireworks 模型 ID

OpenClaw 可在執行階段接受任何 Fireworks 模型或路由器 ID。請使用 Fireworks 顯示的確切 ID，並在前面加上 `fireworks/`。動態解析會複製 Fire Pass 範本（文字 + 圖片輸入、OpenAI 相容 API、預設成本為零），並在 ID 符合 Kimi 模式時自動停用思考。GLM 動態 ID 會標記為僅文字，除非你設定一個含圖片輸入的自訂模型項目。

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
  <Accordion title="模型 ID 前綴的運作方式">
    OpenClaw 中的每個 Fireworks 模型參照都以 `fireworks/` 開頭，後接 Fireworks 平台中的確切 ID 或路由器路徑。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在建構 API 要求時會移除 `fireworks/` 前綴，並將剩餘路徑作為 OpenAI 相容的 `model` 欄位傳送到 Fireworks 端點。

  </Accordion>

  <Accordion title="為什麼 Kimi 會被強制關閉思考">
    Fireworks K2.6 在要求帶有 `reasoning_*` 參數時會傳回 400，儘管 Kimi 透過 Moonshot 自有 API 支援思考。提供者政策（`extensions/fireworks/thinking-policy.ts`）只會為 Kimi 模型 ID 宣告 `off` 思考層級，因此手動 `/think` 切換和提供者政策介面會與執行階段合約保持一致。

    若要端到端使用 Kimi 推理，請設定 [Moonshot 提供者](/zh-TW/providers/moonshot)，並透過它路由同一模型。

  </Accordion>

  <Accordion title="守護行程的環境可用性">
    如果閘道以受管理服務（launchd、systemd、Docker）執行，Fireworks 金鑰必須對該程序可見，而不只是對你的互動式 shell 可見。

    <Warning>
      只在互動式 shell 中匯出的金鑰，對 launchd 或 systemd 守護行程沒有幫助，除非該環境也匯入到那裡。請在 `~/.openclaw/.env` 或透過 `env.shellEnv` 設定金鑰，使其可從閘道程序讀取。
    </Warning>

    在 macOS 上，`openclaw gateway install` 已經會將 `~/.openclaw/.env` 接入 LaunchAgent 環境檔案。輪替金鑰後，請重新執行安裝（或 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    `/think` 層級、提供者政策，以及路由具備推理能力的模型。
  </Card>
  <Card title="Moonshot" href="/zh-TW/providers/moonshot" icon="moon">
    透過 Moonshot 自有 API 執行 Kimi，取得原生思考輸出。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
