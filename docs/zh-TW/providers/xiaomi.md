---
read_when:
    - 你想要在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要設定 Xiaomi MiMo 驗證或權杖方案
summary: 搭配 OpenClaw 使用 Xiaomi MiMo 隨用隨付與 Token Plan 模型
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T19:58:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 包含一個內建 Xiaomi 外掛，提供兩個文字供應商預設：

- `xiaomi` 用於按量付費金鑰（`sk-...`）
- `xiaomi-token-plan` 用於 Token Plan 金鑰（`tp-...`），並提供區域端點預設

同一個外掛也會註冊 `xiaomi` 語音（TTS）供應商。

| 屬性             | 值                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 供應商 ID        | `xiaomi`（按量付費）、`xiaomi-token-plan`（Token Plan）                                                                                            |
| 外掛             | 內建，`enabledByDefault: true`                                                                                                                     |
| 驗證環境變數     | `XIAOMI_API_KEY`、`XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| 初始設定旗標     | `--auth-choice xiaomi-api-key`、`--auth-choice xiaomi-token-plan-cn`、`--auth-choice xiaomi-token-plan-sgp`、`--auth-choice xiaomi-token-plan-ams` |
| 直接命令列旗標   | `--xiaomi-api-key <key>`、`--xiaomi-token-plan-api-key <key>`                                                                                      |
| 合約             | chat completions + `speechProviders`                                                                                                               |
| API              | OpenAI 相容（`openai-completions`）                                                                                                                |
| 基礎 URL         | 按量付費：`https://api.xiaomimimo.com/v1`；Token Plan 預設：`token-plan-{cn,sgp,ams}...`                                                           |
| 預設模型         | `xiaomi/mimo-v2-flash`、`xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS 預設         | `mimo-v2.5-tts`，語音 `mimo_default`；voicedesign 模型 `mimo-v2.5-tts-voicedesign`                                                                 |

## 開始使用

<Steps>
  <Step title="Get the right key">
    在 [Xiaomi MiMo 主控台](https://platform.xiaomimimo.com/#/console/api-keys)建立按量付費金鑰，或開啟你的 Token Plan 訂閱頁面，複製區域 OpenAI 相容基礎 URL，以及對應的 `tp-...` 金鑰。
  </Step>

  <Step title="Run onboarding">
    按量付費：

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

## 按量付費型錄

| 模型參照               | 輸入        | 上下文    | 最大輸出 | 推理 | 備註     |
| ---------------------- | ----------- | --------- | -------- | ---- | -------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192    | 否   | 預設模型 |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000   | 是   | 大型上下文 |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000   | 是   | 多模態   |

<Tip>
預設模型參照是 `xiaomi/mimo-v2-flash`。設定 `XIAOMI_API_KEY` 或存在驗證設定檔時，供應商會自動注入。
</Tip>

## Token Plan 型錄

選擇與 Xiaomi 訂閱 UI 中顯示的區域基礎 URL 相符的 Token Plan 驗證選項：

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| 模型參照                          | 輸入        | 上下文    | 最大輸出 | 推理 | 備註     |
| --------------------------------- | ----------- | --------- | -------- | ---- | -------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072  | 是   | 預設模型 |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072  | 是   | 多模態   |

<Tip>
Token Plan 初始設定會驗證金鑰格式，並在 `tp-...` 金鑰輸入按量付費路徑，或 `sk-...` 金鑰輸入 Token Plan 路徑時發出警告。
</Tip>

## 文字轉語音

內建的 `xiaomi` 外掛也會將 Xiaomi MiMo 註冊為 `messages.tts` 的語音供應商。它會呼叫 Xiaomi 的 chat-completions TTS 合約，將文字作為 `assistant` 訊息，並將選用的風格指引作為 `user` 訊息。

| 屬性   | 值                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` 別名）                  |
| 驗證   | `XIAOMI_API_KEY`                         |
| API    | 帶有 `audio` 的 `POST /v1/chat/completions` |
| 預設   | `mimo-v2.5-tts`，語音 `mimo_default`     |
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

支援的內建語音包含 `mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo` 和 `Dean`。預設語音模型使用 `audio.voice`，因此 OpenClaw 會為 `mimo-v2.5-tts` 和 `mimo-v2-tts` 傳送 `speakerVoice`。

Xiaomi 的 voicedesign 模型 `mimo-v2.5-tts-voicedesign` 會從自然語言風格提示產生語音，而不是使用預設語音 ID。請用所需的語音描述設定 `style`；OpenClaw 會將它作為 `user` 訊息傳送，將朗讀文字作為 `assistant` 訊息傳送，並針對此模型省略 `audio.voice`。

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

對於 Feishu 和 Telegram 等語音訊息目標，OpenClaw 會在傳送前使用 `ffmpeg` 將 Xiaomi 輸出轉碼為 48kHz Opus。

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

定價與相容性旗標來自內建外掛資訊清單，因此設定範例會省略 `cost` 和 `compat`，以避免與執行階段行為分歧。

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

定價來自內建資訊清單（Token Plan 模型包含分級快取讀取定價），因此設定範例會省略 `cost`。

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    當你的環境中設定了 `XIAOMI_API_KEY` 或存在驗證設定檔時，`xiaomi` 供應商會自動注入。`xiaomi-token-plan` 需要區域基礎 URL，因此支援的路徑是內建 Token Plan 初始設定選項，或明確的 `models.providers.xiaomi-token-plan` 設定區塊。
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — 輕量且快速，適合一般用途文字任務。不支援推理。
    - **mimo-v2-pro** — 支援推理，並提供 1M token 上下文視窗，適用於長文件工作負載。
    - **mimo-v2-omni** — 啟用推理的多模態模型，可接受文字與影像輸入。
    - **mimo-v2.5-pro** — Token Plan 預設模型，使用 Xiaomi 目前的 V2.5 推理堆疊。
    - **mimo-v2.5** — Token Plan 多模態 V2.5 路徑。

    <Note>
    按量付費模型使用 `xiaomi/` 前綴。Token Plan 模型使用 `xiaomi-token-plan/` 前綴。
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 如果模型未出現，請確認相關金鑰環境變數或驗證設定檔存在且有效。
    - 對於 Token Plan，請確認選擇的初始設定區域符合訂閱頁面的基礎 URL，且金鑰以 `tp-` 開頭。
    - 當閘道以 daemon 執行時，請確保該行程可以取得金鑰（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，daemon 管理的閘道行程無法看見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定來確保持續可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整 OpenClaw 設定參考。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 儀表板與 API 金鑰管理。
  </Card>
</CardGroup>
