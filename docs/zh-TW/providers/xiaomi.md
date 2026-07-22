---
read_when:
    - 你想在 OpenClaw 中使用小米 MiMo 模型
    - 你需要設定 Xiaomi MiMo 驗證或 Token Plan
summary: 搭配 OpenClaw 使用小米 MiMo 隨用隨付與 Token Plan 模型
title: 小米 MiMo
x-i18n:
    generated_at: "2026-07-22T10:49:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef79dea8332903c726f076c91b3b458e2d98534d402a412e7c156c06b2912a69
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。隨附的 `xiaomi`
外掛（`enabledByDefault: true`，無須安裝）會註冊兩個文字
供應商及一個語音（TTS）供應商：

- `xiaomi` - 按用量付費金鑰（`sk-...`）
- `xiaomi-token-plan` - 具區域端點預設值的 Token Plan 金鑰（`tp-...`）

| 屬性             | 值                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 供應商 ID        | `xiaomi`（按用量付費）、`xiaomi-token-plan`（Token Plan）                                                                                 |
| 驗證環境變數     | `XIAOMI_API_KEY`、`XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                            |
| 初始設定旗標     | `--auth-choice xiaomi-api-key`、`--auth-choice xiaomi-token-plan-cn`、`--auth-choice xiaomi-token-plan-sgp`、`--auth-choice xiaomi-token-plan-ams`                                                                    |
| 直接命令列旗標   | `--xiaomi-api-key <key>`、`--xiaomi-token-plan-api-key <key>`                                                                                                            |
| API              | OpenAI 相容的聊天補全（`openai-completions`）                                                                                                       |
| 語音合約         | `speechProviders: ["xiaomi"]`                                                                                                                                 |
| 基底 URL         | 按用量付費：`https://api.xiaomimimo.com/v1`；Token Plan：`token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                                                                    |
| 預設模型         | `xiaomi/mimo-v2.5`、`xiaomi-token-plan/mimo-v2.5-pro`                                                                                                            |
| TTS 預設值       | `mimo-v2.5-tts`，語音 `mimo_default`；語音設計模型 `mimo-v2.5-tts-voicedesign`                                                                      |

## 開始使用

<Steps>
  <Step title="取得正確的金鑰">
    在 [Xiaomi MiMo 主控台](https://platform.xiaomimimo.com/#/console/api-keys)中建立按用量付費金鑰，或開啟你的 Token Plan 訂閱頁面，複製區域性的 OpenAI 相容基底 URL 及相符的 `tp-...` 金鑰。
  </Step>

  <Step title="執行初始設定">
    按用量付費：

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
  <Step title="確認模型可供使用">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
初始設定會驗證金鑰格式，並在將 `tp-...` 金鑰輸入按用量付費流程，或將 `sk-...` 金鑰輸入 Token Plan 流程時發出警告。
</Tip>

## 按用量付費目錄

| 模型參照               | 輸入         | 上下文    | 最大輸出 | 推理 | 備註     |
| ---------------------- | ------------ | --------- | -------- | ---- | -------- |
| `xiaomi/mimo-v2.5`     | 文字、圖片   | 1,048,576 | 131,072  | 是   | 預設模型 |
| `xiaomi/mimo-v2.5-pro` | 文字         | 1,048,576 | 131,072  | 是   | 旗艦模型 |

## Token Plan 目錄

選擇與 Xiaomi 訂閱 UI 所顯示區域基底 URL 相符的 Token Plan 驗證選項：

| 驗證選項                | 基底 URL                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| 模型參照                          | 輸入         | 上下文    | 最大輸出 | 推理 | 備註       |
| --------------------------------- | ------------ | --------- | -------- | ---- | ---------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | 文字         | 1,048,576 | 131,072  | 是   | 預設模型   |
| `xiaomi-token-plan/mimo-v2.5`     | 文字、圖片   | 1,048,576 | 131,072  | 是   | 多模態     |

`xiaomi-token-plan` 需要區域基底 URL 才能解析。支援的途徑
是使用隨附的 Token Plan 初始設定選項，或使用已設定 `baseUrl`
的明確 `models.providers.xiaomi-token-plan` 設定區塊；若兩者皆無，
則不會提供此供應商。

## 推理模型

`mimo-v2.5` 和 `mimo-v2.5-pro` 支援
OpenClaw 的 [`/think` 指令](/zh-TW/tools/thinking)，層級包括 `off`、
`minimal`、`low`、`medium`、`high`、`xhigh` 和 `max`（預設為 `high`）。

## 文字轉語音

隨附的 `xiaomi` 外掛也會將 Xiaomi MiMo 註冊為
`tts` 的語音供應商。它會呼叫 Xiaomi 的聊天補全 TTS 合約，
以 `assistant` 訊息傳送文字，並以 `user`
訊息傳送選用的風格指引。

| 屬性   | 值                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` 別名） |
| 驗證   | `XIAOMI_API_KEY`                       |
| API    | `POST /v1/chat/completions` 搭配 `audio` |
| 預設值 | `mimo-v2.5-tts`，語音 `mimo_default` |
| 輸出   | 預設為 MP3；設定後可使用 WAV             |

```json5
{
  tts: {
    auto: "always",
    provider: "xiaomi",
    providers: {
      xiaomi: {
        apiKey: "xiaomi_api_key",
        model: "mimo-v2.5-tts",
        speakerVoice: "mimo_default",
        format: "mp3",
        style: "明亮、自然且具對話感的語調。",
      },
    },
  },
}
```

內建語音：`mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、
`Milo`、`Dean`。預設語音模型 `mimo-v2.5-tts` 使用 `audio.voice`，因此
OpenClaw 會為該模型傳送 `speakerVoice`。

語音設計模型 `mimo-v2.5-tts-voicedesign` 會根據
自然語言風格提示產生語音，而非使用預設語音 ID。將 `style` 設為
所需的語音描述；OpenClaw 會將它作為 `user` 訊息傳送，將
朗讀文字作為 `assistant` 訊息傳送，並為此
模型省略 `audio.voice`。

```json5
{
  tts: {
    provider: "xiaomi",
    providers: {
      xiaomi: {
        model: "mimo-v2.5-tts-voicedesign",
        format: "wav",
        style: "溫暖、自然且發音清晰的女性聲音。",
      },
    },
  },
}
```

對於要求語音留言合成目標的頻道（Discord、Feishu、
Matrix、Telegram 和 WhatsApp），OpenClaw 會在傳送前使用 `ffmpeg`
將 Xiaomi 輸出轉碼為 48kHz 單聲道 Opus。

## 設定範例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

定價和相容性旗標來自隨附的外掛資訊清單，因此設定範例省略 `cost` 和 `compat`，以避免與執行階段行為產生差異。

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

定價來自隨附的資訊清單（Token Plan 模型包含分級快取讀取定價），因此設定範例省略 `cost`。

<AccordionGroup>
  <Accordion title="自動注入行為">
    當環境中已設定 `XIAOMI_API_KEY`，或存在驗證設定檔時，系統會自動啟用 `xiaomi` 供應商。`xiaomi-token-plan` 需要區域基底 URL，因此支援的途徑是使用隨附的 Token Plan 初始設定選項，或使用明確的 `models.providers.xiaomi-token-plan` 設定區塊。
  </Accordion>

  <Accordion title="模型詳細資料">
    - **mimo-v2.5** - 按用量付費的預設模型，以及 Token Plan 的多模態 V2.5 路由。
    - **mimo-v2.5-pro** - 旗艦推理模型及 Token Plan 預設模型。

    <Note>
    按用量付費模型使用 `xiaomi/` 前綴。Token Plan 模型使用 `xiaomi-token-plan/` 前綴。
    </Note>

  </Accordion>

  <Accordion title="疑難排解">
    - 若模型未出現，請確認相關的金鑰環境變數或驗證設定檔存在且有效。
    - 若使用 Token Plan，請確認選擇的初始設定區域與訂閱頁面的基底 URL 相符，且金鑰以 `tp-` 開頭。
    - 當閘道以常駐程式執行時，請確保該程序可取得金鑰（例如放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Warning>
    僅在互動式 Shell 中設定的金鑰，對常駐程式管理的閘道程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，使其可持續使用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照及容錯移轉行為。
  </Card>
  <Card title="思考層級" href="/zh-TW/tools/thinking" icon="brain">
    `/think` 指令語法及層級對應。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Xiaomi MiMo 主控台" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 儀表板及 API 金鑰管理。
  </Card>
</CardGroup>
