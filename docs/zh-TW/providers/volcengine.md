---
read_when:
    - 你想在 OpenClaw 中使用 Volcano Engine 或 Doubao 模型
    - 你需要設定 Volcengine API 金鑰
    - 你想使用 Volcengine Speech 文字轉語音
summary: 火山引擎設定（豆包模型、程式碼端點與 Seed Speech TTS）
title: Volcengine（豆包）
x-i18n:
    generated_at: "2026-07-05T11:38:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine 提供者可存取託管在 Volcano Engine 上的 Doubao 模型與第三方模型，並為一般與程式碼工作負載提供不同端點。同一個內建外掛也會將 Volcengine Speech 註冊為 TTS 提供者。

| 詳細資料 | 值 |
| ---------- | ---------------------------------------------------------- |
| 提供者 | `volcengine`（一般 + TTS）、`volcengine-plan`（程式碼） |
| 模型驗證 | `VOLCANO_ENGINE_API_KEY` |
| TTS 驗證 | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API | OpenAI 相容模型、BytePlus Seed Speech TTS |

## 開始使用

<Steps>
  <Step title="Set the API key">
    執行互動式 onboarding：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    這會使用單一 API 金鑰註冊一般（`volcengine`）與程式碼（`volcengine-plan`）提供者。

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
若要進行非互動式設定（CI、腳本），請直接傳入金鑰：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 提供者與端點

| 提供者 | 端點 | 使用案例 |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine` | `ark.cn-beijing.volces.com/api/v3` | 一般模型 |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 程式碼模型 |

<Note>
兩個提供者都使用單一 API 金鑰設定。設定會自動註冊兩者，而且程式碼提供者的模型選擇器也會重用一般提供者的驗證（`volcengine-plan` 是 `volcengine` 的驗證別名）。
</Note>

## 內建型錄

<Tabs>
  <Tab title="General (volcengine)">
    | 模型參照 | 名稱 | 輸入 | 情境 |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201` | DeepSeek V3.2 | 文字、圖片 | 128,000 |
    | `volcengine/doubao-seed-1-8-251228` | Doubao Seed 1.8 | 文字、圖片 | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | 文字、圖片 | 256,000 |
    | `volcengine/glm-4-7-251222` | GLM 4.7 | 文字、圖片 | 200,000 |
    | `volcengine/kimi-k2-5-260127` | Kimi K2.5 | 文字、圖片 | 256,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | 模型參照 | 名稱 | 輸入 | 情境 |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest` | Ark Coding Plan | 文字 | 256,000 |
    | `volcengine-plan/doubao-seed-code` | Doubao Seed Code | 文字 | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | 文字 | 256,000 |
    | `volcengine-plan/glm-4.7` | GLM 4.7 Coding | 文字 | 200,000 |
    | `volcengine-plan/kimi-k2-thinking` | Kimi K2 Thinking | 文字 | 256,000 |
    | `volcengine-plan/kimi-k2.5` | Kimi K2.5 Coding | 文字 | 256,000 |
  </Tab>
</Tabs>

兩個型錄都是靜態的（沒有 `/models` 探索呼叫），並支援 OpenAI 相容的串流用量計算。兩個提供者的工具 schema 都會自動移除 `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains` 與 `maxContains` 關鍵字，因為 Volcengine 工具呼叫 API 會拒絕它們。

## 文字轉語音

Volcengine TTS 使用 BytePlus Seed Speech HTTP API（`voice.ap-southeast-1.bytepluses.com`），且其設定與 OpenAI 相容的 Doubao 模型 API 金鑰分開。在 BytePlus 主控台中，開啟 Seed Speech > Settings > API Keys，複製 API 金鑰，然後設定：

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

接著在 `openclaw.json` 中啟用：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

`messages.tts.providers.volcengine` 下可用欄位：`apiKey`、`voice`、`speedRatio`（0.2-3.0）、`emotion`、`cluster`、`resourceId`、`appKey` 與 `baseUrl`。當允許語音設定覆寫時，`!emotion=<value>` 也可作為行內語音指令使用。

對於語音訊息目標，OpenClaw 會請求提供者原生的 `ogg_opus`。對於一般音訊附件，則請求 `mp3`。提供者別名 `bytedance` 與 `doubao` 也會解析到此語音提供者。

預設資源 ID 是 `seed-tts-1.0`，這是 BytePlus 預設授予新建立 Seed Speech API 金鑰的權限。如果你的專案具有 TTS 2.0 權限，請設定 `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`。

<Warning>
`VOLCANO_ENGINE_API_KEY` 用於 ModelArk/Doubao 模型端點，並不是 Seed Speech API 金鑰。TTS 需要來自 BytePlus Speech Console 的 Seed Speech API 金鑰，或舊版 Speech Console AppID/token 配對。
</Warning>

舊版 AppID/token 驗證仍支援較舊的 Speech Console 應用程式：

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

其他選用 TTS 環境變數：設定時，`VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY` 與 `VOLCENGINE_TTS_BASE_URL` 會覆寫對應的 `messages.tts.providers.volcengine` 設定欄位。

## 進階設定

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` 會將 `volcengine-plan/ark-code-latest` 設為預設模型，同時也註冊一般 `volcengine` 型錄。
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    在 onboarding/configure 模型選擇期間，Volcengine 驗證選項會偏好 `volcengine/*` 與 `volcengine-plan/*` 兩種列。如果這些模型尚未載入，OpenClaw 會改為回退到未篩選的型錄，而不是顯示空白的提供者範圍選擇器。
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    如果閘道以 daemon（launchd/systemd）執行，請確保模型與 TTS 環境變數（例如 `VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID` 與 `VOLCENGINE_TTS_TOKEN`）可供該程序使用（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

<Warning>
將 OpenClaw 作為背景服務執行時，在互動式 shell 中設定的環境變數不會自動繼承。請參閱上方的 daemon 說明。
</Warning>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    agents、models 與 providers 的完整設定參考。
  </Card>
  <Card title="Troubleshooting" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與除錯步驟。
  </Card>
  <Card title="FAQ" href="/zh-TW/help/faq" icon="circle-question">
    關於 OpenClaw 設定的常見問答。
  </Card>
</CardGroup>
