---
read_when:
    - 你想在 OpenClaw 中使用 Volcano Engine 或 Doubao 模型
    - 你需要設定 Volcengine API 金鑰
    - 你想使用火山引擎語音的文字轉語音功能
summary: 火山引擎設定（豆包模型、程式設計端點與 Seed Speech TTS）
title: 火山引擎（豆包）
x-i18n:
    generated_at: "2026-07-19T14:01:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ac0e86b5b94b0c0f08e76878d16e9c5562e0d3f9923697713bef20ebba5bab2
    source_path: providers/volcengine.md
    workflow: 16
---

Volcengine 供應商可存取託管於 Volcano Engine 的 Doubao 模型與第三方模型，並針對一般與程式設計工作負載提供不同的端點。同一個內建外掛也會將 Volcengine Speech 註冊為 TTS 供應商。

| 詳細資料   | 值                                                         |
| ---------- | ---------------------------------------------------------- |
| 供應商     | `volcengine`（一般 + TTS）、`volcengine-plan`（程式設計） |
| 模型驗證   | `VOLCANO_ENGINE_API_KEY`                                         |
| TTS 驗證   | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`                   |
| API        | OpenAI 相容模型、BytePlus Seed Speech TTS                  |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    執行互動式初始設定：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    這會使用單一 API 金鑰註冊一般（`volcengine`）與程式設計（`volcengine-plan`）供應商。

  </Step>
  <Step title="設定預設模型">
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
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
若要進行非互動式設定（CI、指令碼），請直接傳入金鑰：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 供應商與端點

| 供應商            | 端點                                      | 使用情境     |
| ----------------- | ----------------------------------------- | ------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 一般模型     |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 程式設計模型 |

<Note>
兩個供應商皆使用單一 API 金鑰設定。設定程序會自動註冊兩者，程式設計供應商的模型選擇器也會重複使用一般供應商的驗證（`volcengine-plan` 是 `volcengine` 的驗證別名）。
</Note>

## 內建目錄

<Tabs>
  <Tab title="一般（volcengine）">
    | 模型參照                                     | 名稱                            | 輸入         | 上下文  |
    | -------------------------------------------- | ------------------------------- | ------------ | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | 文字、圖片   | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | 文字、圖片   | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | 文字、圖片   | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | 文字、圖片   | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | 文字、圖片   | 256,000 |
  </Tab>
  <Tab title="程式設計（volcengine-plan）">
    | 模型參照                                          | 名稱                     | 輸入 | 上下文  |
    | ------------------------------------------------- | ------------------------ | ---- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | 文字 | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | 文字 | 256,000 |
  </Tab>
</Tabs>

兩個目錄都是靜態的（不會進行 `/models` 探索呼叫），並支援與 OpenAI 相容的串流用量統計。兩個供應商的工具結構描述都會自動移除 `minLength`、`maxLength`、`minItems`、`maxItems`、`minContains` 與 `maxContains` 關鍵字，因為 Volcengine 工具呼叫 API 會拒絕這些關鍵字。

## 文字轉語音

Volcengine TTS 使用 BytePlus Seed Speech HTTP API（`voice.ap-southeast-1.bytepluses.com`），其設定與 OpenAI 相容的 Doubao 模型 API 金鑰分開。在 BytePlus 主控台中，開啟 Seed Speech > Settings > API Keys，複製 API 金鑰，然後設定：

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

`messages.tts.providers.volcengine` 下可用的欄位包括：`apiKey`、`voice`、`speedRatio`（0.2-3.0）、`emotion`、`cluster`、`resourceId`、`appKey` 與 `baseUrl`。允許覆寫語音設定時，`!emotion=<value>` 也可作為行內語音指令。

對於語音訊息目標，OpenClaw 會要求供應商原生的 `ogg_opus`。對於一般音訊附件，則會要求 `mp3`。供應商別名 `bytedance` 與 `doubao` 也會解析至此語音供應商。

預設資源 ID 為 `seed-tts-1.0`，這是 BytePlus 預設授予新建立 Seed Speech API 金鑰的權益。若你的專案具有 TTS 2.0 權益，請設定 `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`。

<Warning>
`VOLCANO_ENGINE_API_KEY` 適用於 ModelArk/Doubao 模型端點，並非 Seed Speech API 金鑰。TTS 需要來自 BytePlus Speech Console 的 Seed Speech API 金鑰，或舊版 Speech Console 的 AppID/權杖組合。
</Warning>

舊版 Speech Console 應用程式仍支援 AppID/權杖驗證：

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

其他選用的 TTS 環境變數包括：`VOLCENGINE_TTS_VOICE`、`VOLCENGINE_TTS_APP_KEY` 與 `VOLCENGINE_TTS_BASE_URL`；設定後會覆寫對應的 `messages.tts.providers.volcengine` 設定欄位。

## 進階設定

<AccordionGroup>
  <Accordion title="初始設定後的預設模型">
    `openclaw onboard --auth-choice volcengine-api-key` 會將 `volcengine-plan/ark-code-latest` 設為預設模型，同時註冊一般 `volcengine` 目錄。
  </Accordion>

  <Accordion title="模型選擇器的備援行為">
    在初始設定／設定模型選擇期間，Volcengine 驗證選項會優先顯示 `volcengine/*` 與 `volcengine-plan/*` 兩列。如果這些模型尚未載入，OpenClaw 會改用未篩選的目錄，而不會顯示空白的供應商範圍模型選擇器。
  </Accordion>

  <Accordion title="常駐程序的環境變數">
    如果閘道以常駐程序（launchd/systemd）執行，請確保該程序可使用模型與 TTS 環境變數，例如 `VOLCANO_ENGINE_API_KEY`、`VOLCENGINE_TTS_API_KEY`、`BYTEPLUS_SEED_SPEECH_API_KEY`、`VOLCENGINE_TTS_APPID` 與 `VOLCENGINE_TTS_TOKEN`（例如在 `~/.openclaw/.env` 中設定，或透過 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

<Warning>
以背景服務執行 OpenClaw 時，互動式殼層中設定的環境變數不會自動繼承。請參閱上方的常駐程序說明。
</Warning>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    代理程式、模型與供應商的完整設定參考。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與偵錯步驟。
  </Card>
  <Card title="常見問題" href="/zh-TW/help/faq" icon="circle-question">
    關於 OpenClaw 設定的常見問題。
  </Card>
</CardGroup>
