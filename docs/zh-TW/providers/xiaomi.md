---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要設定 Xiaomi MiMo 驗證或 Token Plan
summary: 使用小米 MiMo 隨用隨付與 Token Plan 模型搭配 OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-05T11:39:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。內建的 `xiaomi`
外掛（`enabledByDefault: true`，無需安裝步驟）會註冊兩個文字
提供者以及一個語音（TTS）提供者：

- `xiaomi` - 即用即付金鑰（`sk-...`）
- `xiaomi-token-plan` - Token Plan 金鑰（`tp-...`），含區域端點預設值

| 屬性             | 值                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 提供者 ID        | `xiaomi`（即用即付）、`xiaomi-token-plan`（Token Plan）                                                                                             |
| 驗證環境變數     | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| 初始設定旗標     | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| 直接命令列介面旗標 | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | OpenAI 相容的聊天補全（`openai-completions`）                                                                                                      |
| 語音合約         | `speechProviders: ["xiaomi"]`                                                                                                                      |
| 基礎 URL         | 即用即付：`https://api.xiaomimimo.com/v1`；Token Plan：`token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                                  |
| 預設模型         | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS 預設值       | `mimo-v2.5-tts`，語音 `mimo_default`；voicedesign 模型 `mimo-v2.5-tts-voicedesign`                                                                  |

## 開始使用

<Steps>
  <Step title="Get the right key">
    在 [Xiaomi MiMo 主控台](https://platform.xiaomimimo.com/#/console/api-keys)建立即用即付金鑰，或開啟你的 Token Plan 訂閱頁面，複製區域 OpenAI 相容基礎 URL 以及對應的 `tp-...` 金鑰。
  </Step>

  <Step title="Run onboarding">
    即用即付：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan：

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    或直接傳入金鑰：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
初始設定會驗證金鑰格式，並在 `tp-...` 金鑰被輸入到即用即付路徑，或 `sk-...` 金鑰被輸入到 Token Plan 路徑時發出警告。
</Tip>

## 即用即付目錄

| 模型參照               | 輸入        | 脈絡      | 最大輸出   | 推理      | 備註       |
| ---------------------- | ----------- | --------- | ---------- | --------- | ---------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | 否        | 預設模型   |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | 是        | 大型脈絡   |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | 是        | 多模態     |

## Token Plan 目錄

選擇與 Xiaomi 訂閱 UI 中顯示的區域基礎 URL 相符的 Token Plan 驗證選項：

| 驗證選項                | 基礎 URL                                  |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| 模型參照                          | 輸入        | 脈絡      | 最大輸出   | 推理      | 備註       |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ---------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072    | 是        | 預設模型   |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072    | 是        | 多模態     |

`xiaomi-token-plan` 需要區域基礎 URL 才能解析。支援的路徑是
內建 Token Plan 初始設定選項，或明確設定了 `baseUrl` 的
`models.providers.xiaomi-token-plan` 設定區塊；若沒有其中一項，
就不會提供該提供者。

## 推理模型

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5`, 和 `mimo-v2.5-pro` 支援
OpenClaw 的 [`/think` 指令](/zh-TW/tools/thinking)，層級包含 `off`,
`minimal`, `low`, `medium`, `high`, `xhigh`, 和 `max`（預設為 `high`）。
`mimo-v2-flash` 不支援推理。

## 文字轉語音

內建的 `xiaomi` 外掛也會將 Xiaomi MiMo 註冊為 `messages.tts`
的語音提供者。它會呼叫 Xiaomi 的聊天補全 TTS 合約，將文字作為
`assistant` 訊息，並將選用的風格指引作為 `user` 訊息。

| 屬性   | 值                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` 別名）                  |
| 驗證   | `XIAOMI_API_KEY`                         |
| API    | `POST /v1/chat/completions` 搭配 `audio` |
| 預設值 | `mimo-v2.5-tts`，語音 `mimo_default`     |
| 輸出   | 預設為 MP3；設定後可使用 WAV             |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

內建語音：`mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`。預設語音模型（`mimo-v2.5-tts`, `mimo-v2-tts`）使用
`audio.voice`，因此 OpenClaw 會為這些模型傳送 `speakerVoice`。

voicedesign 模型 `mimo-v2.5-tts-voicedesign` 會從自然語言風格提示產生語音，
而不是使用預設語音 ID。將 `style` 設為想要的語音描述；OpenClaw 會將它作為
`user` 訊息傳送，將要朗讀的文字作為 `assistant` 訊息傳送，並對此模型省略
`audio.voice`。

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

對於要求語音訊息合成目標的頻道（Discord, Feishu,
Matrix, Telegram, 和 WhatsApp），OpenClaw 會先使用 `ffmpeg`
將 Xiaomi 輸出轉碼為 48kHz 單聲道 Opus，再進行傳遞。

## 設定範例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

定價和相容性旗標來自內建外掛資訊清單，因此設定範例省略 `cost` 和 `compat`，以避免與執行階段行為產生差異。

Token Plan：

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

定價來自內建資訊清單（Token Plan 模型包含階梯式快取讀取定價），因此設定範例省略 `cost`。

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    當你的環境中設定了 `XIAOMI_API_KEY` 或存在驗證設定檔時，`xiaomi` 提供者會自動啟用。`xiaomi-token-plan` 需要區域基礎 URL，因此支援的路徑是內建 Token Plan 初始設定選項，或明確的 `models.providers.xiaomi-token-plan` 設定區塊。
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** - 輕量且快速，適合一般用途文字任務。不支援推理。
    - **mimo-v2-pro** - 支援推理，並提供 1M token 脈絡視窗，適合長文件工作負載。
    - **mimo-v2-omni** - 啟用推理的多模態模型，可接受文字和影像輸入。
    - **mimo-v2.5-pro** - Token Plan 預設模型，使用 Xiaomi 目前的 V2.5 推理堆疊。
    - **mimo-v2.5** - Token Plan 多模態 V2.5 路由。

    <Note>
    即用即付模型使用 `xiaomi/` 前綴。Token Plan 模型使用 `xiaomi-token-plan/` 前綴。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 如果模型沒有出現，請確認相關金鑰環境變數或驗證設定檔存在且有效。
    - 對於 Token Plan，請確認選擇的初始設定區域符合訂閱頁面的基礎 URL，且金鑰以 `tp-` 開頭。
    - 當閘道以守護程序執行時，請確保該程序可存取金鑰（例如位於 `~/.openclaw/.env`，或透過 `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，對守護程序管理的閘道程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，確保可持續存取。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="Thinking levels" href="/zh-TW/tools/thinking" icon="brain">
    `/think` 指令語法與層級對應。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 儀表板與 API 金鑰管理。
  </Card>
</CardGroup>
