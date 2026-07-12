---
read_when:
    - 你想在 OpenClaw 中使用 Fireworks
    - 你需要 Fireworks API 金鑰環境變數或預設模型 ID
    - 你正在偵錯 Fireworks 上 Kimi 關閉思考模式的行為
summary: Fireworks 設定（驗證 + 模型選擇）
title: Fireworks
x-i18n:
    generated_at: "2026-07-11T21:44:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) 透過與 OpenAI 相容的 API 提供開放權重模型與路由模型。安裝官方 Fireworks 供應商外掛，即可使用兩個預先收錄的 Kimi 模型，並能在執行階段使用任何 Fireworks 模型或路由器 ID。

| 屬性            | 值                                                     |
| --------------- | ------------------------------------------------------ |
| 供應商 ID       | `fireworks`（別名：`fireworks-ai`）                    |
| 套件            | `@openclaw/fireworks-provider`                         |
| 驗證環境變數    | `FIREWORKS_API_KEY`                                    |
| 初始設定旗標    | `--auth-choice fireworks-api-key`                      |
| 直接命令列旗標  | `--fireworks-api-key <key>`                            |
| API             | 與 OpenAI 相容（`openai-completions`）                 |
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

    初始設定會將金鑰儲存至驗證設定檔中的 `fireworks` 供應商，並將 **Fire Pass** Kimi K2.5 Turbo 路由器設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider fireworks
    ```

    清單應包含 `Kimi K2.6` 與 `Kimi K2.5 Turbo (Fire Pass)`。如果無法解析 `FIREWORKS_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的憑證。

  </Step>
</Steps>

## 非互動式設定

若要用於指令碼或 CI 安裝，請透過命令列傳入所有參數：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 內建目錄

| 模型參照                                               | 名稱                        | 輸入         | 上下文  | 最大輸出   | 思考                 |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文字 + 圖片  | 262,144 | 262,144    | 強制關閉             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文字 + 圖片  | 256,000 | 256,000    | 強制關閉（預設）     |

<Note>
  OpenClaw 會將所有 Fireworks Kimi 模型固定為 `thinking: off`，因為除非請求明確停用思考，Fireworks 上的 Kimi 可能會將思維鏈洩漏到可見回覆中。直接透過 [Moonshot](/zh-TW/providers/moonshot) 路由相同模型，則會保留 Kimi 的推理輸出。如需在供應商之間切換，請參閱[思考模式](/zh-TW/tools/thinking)。
</Note>

## 自訂 Fireworks 模型 ID

OpenClaw 在執行階段接受任何 Fireworks 模型或路由器 ID。請使用 Fireworks 顯示的確切 ID，並在前面加上 `fireworks/`。動態解析會複製 Fire Pass 範本（文字 + 圖片輸入、與 OpenAI 相容的 API、預設成本為零），並在 ID 符合 Kimi 模式時自動停用思考。除非您設定具有圖片輸入的自訂模型項目，否則 GLM 動態 ID 會標示為僅支援文字。

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
    OpenClaw 中的每個 Fireworks 模型參照都以 `fireworks/` 開頭，後面接著 Fireworks 平台提供的確切 ID 或路由器路徑。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在建構 API 請求時會移除 `fireworks/` 前綴，並將剩餘路徑作為與 OpenAI 相容的 `model` 欄位傳送至 Fireworks 端點。

  </Accordion>

  <Accordion title="為何強制關閉 Kimi 的思考">
    Fireworks 提供的 Kimi 沒有獨立的推理通道，因此思維鏈可能會出現在可見的 `content` 串流中。對於每個 Fireworks Kimi 請求，OpenClaw 都會傳送 `thinking: { type: "disabled" }`，並從承載資料中移除 `reasoning`、`reasoning_effort` 與 `reasoningEffort`（`extensions/fireworks/stream.ts`）。供應商政策（`extensions/fireworks/thinking-policy.ts`）只會為 Kimi 模型 ID 宣告 `off` 思考層級，使手動 `/think` 切換與供應商政策介面維持符合執行階段合約。

    若要端對端使用 Kimi 推理，請設定 [Moonshot 供應商](/zh-TW/providers/moonshot)，並透過該供應商路由相同模型。

  </Accordion>

  <Accordion title="背景服務的環境可用性">
    如果閘道以受管理服務的形式執行（launchd、systemd、Docker），Fireworks 金鑰必須對該處理程序可見，而不能只存在於互動式 shell 中。

    <Warning>
      僅在互動式 shell 中匯出的金鑰無法供 launchd 或 systemd 背景服務使用，除非也將該環境匯入其中。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，使閘道處理程序能夠讀取。
    </Warning>

    OpenClaw 載入設定時會載入 `~/.openclaw/.env`，因此儲存在其中的金鑰可供每個平台上的受管理閘道服務使用。輪替金鑰後，請重新啟動閘道（或重新執行 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    `/think` 層級、供應商政策，以及具備推理能力模型的路由方式。
  </Card>
  <Card title="Moonshot" href="/zh-TW/providers/moonshot" icon="moon">
    透過 Moonshot 自有的 API 執行 Kimi，並取得原生思考輸出。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    一般疑難排解與常見問題。
  </Card>
</CardGroup>
