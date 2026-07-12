---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API 金鑰或 OAuth 驗證流程
summary: Google Gemini 設定（API 金鑰 + OAuth、圖片生成、媒體理解、TTS、網頁搜尋）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T14:45:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Google 外掛可透過 Google AI Studio 存取 Gemini 模型，並提供圖片生成、媒體理解（圖片／音訊／影片）、文字轉語音，以及透過 Gemini Grounding 進行網路搜尋。

- 提供者：`google`
- 驗證：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 執行階段選項：`agentRuntime.id: "google-gemini-cli"` 會重複使用 Gemini CLI OAuth，同時將模型參照維持為標準的 `google/*`。

## 開始使用

選擇偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**透過 Google AI Studio 使用標準 Gemini API。

    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="設定預設模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 皆可使用。請使用你已設定的其中一個。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適合：**透過 PKCE OAuth 重複使用現有的 Gemini CLI 登入，而不使用獨立的 API 金鑰。

    <Warning>
    `google-gemini-cli` 提供者是非官方整合。部分使用者回報
    以此方式使用 OAuth 時會遇到帳戶限制。請自行承擔風險。
    </Warning>

    <Steps>
      <Step title="安裝 Gemini CLI">
        本機的 `gemini` 命令必須可從 `PATH` 使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # 或 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同時支援 Homebrew 安裝和全域 npm 安裝，包括
        常見的 Windows/npm 配置。
      </Step>
      <Step title="透過 OAuth 登入">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 預設模型：`google/gemini-3.1-pro-preview`
    - 執行階段：`google-gemini-cli`
    - 別名：`gemini-cli`

    Gemini 3.1 Pro 的 Gemini API 模型 ID 是 `gemini-3.1-pro-preview`。為了方便使用，OpenClaw 接受較短的 `google/gemini-3.1-pro` 作為別名，並會在呼叫提供者之前將其標準化。

    **環境變數：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    如果登入後 Gemini CLI OAuth 要求失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然後重試。
    </Note>

    <Note>
    如果在瀏覽器流程開始前登入失敗，請確認本機已安裝 `gemini`
    命令，且該命令位於 `PATH` 中。
    </Note>

    `google-gemini-cli/*` 模型參照是舊版相容性別名。新的
    設定若要在本機執行 Gemini CLI，應使用 `google/*` 模型參照搭配
    `google-gemini-cli` 執行階段。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` 已於 2026-03-09 停用；請改用 `google/gemini-3.1-pro-preview`。重新執行 Gemini API 金鑰設定（`openclaw onboard --auth-choice gemini-api-key` 或 `openclaw models auth login --provider google`）會將過時的預設模型設定改寫為目前的模型。
</Note>

## 功能

| 功能                   | 支援                          |
| ---------------------- | ----------------------------- |
| 聊天補全               | 是                            |
| 圖片生成               | 是                            |
| 音樂生成               | 是                            |
| 文字轉語音             | 是                            |
| 即時語音               | 是（Google Live API）         |
| 圖片理解               | 是                            |
| 音訊轉錄               | 是                            |
| 影片理解               | 是                            |
| 網路搜尋（Grounding）  | 是                            |
| 思考／推理             | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## 網路搜尋

內建的 `gemini` 網路搜尋提供者使用 Gemini Google Search grounding。
請在 `plugins.entries.google.config.webSearch` 下設定專用搜尋金鑰，
或讓它在 `GEMINI_API_KEY` 之後重複使用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 若已設定 GEMINI_API_KEY 或 models.providers.google.apiKey，則為選用
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 後援至 models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

認證資訊的優先順序依序為專用的 `webSearch.apiKey`、`GEMINI_API_KEY`，
接著是 `models.providers.google.apiKey`。`webSearch.baseUrl` 為選用，
供營運者的 Proxy 或相容的 Gemini API 端點使用；省略時，
Gemini 網路搜尋會重複使用 `models.providers.google.baseUrl`。如需提供者專用工具行為的詳細資訊，請參閱
[Gemini 搜尋](/zh-TW/tools/gemini-search)。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而非 `thinkingBudget`。OpenClaw 會將
Gemini 3、Gemini 3.1 和 `gemini-*-latest` 別名的推理控制項對應至
`thinkingLevel`，使預設／低延遲執行不會傳送已停用的
`thinkingBudget` 值。

`/think adaptive` 會保留 Google 的動態思考語意，而非選擇
固定的 OpenClaw 等級。Gemini 3 和 Gemini 3.1 會省略固定的 `thinkingLevel`，以便
Google 選擇等級；Gemini 2.5 則會傳送 Google 的動態哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支援思考模式。OpenClaw
會將 `thinkingBudget` 改寫為 Gemma 4 支援的 Google `thinkingLevel`。
將思考設定為 `off` 會維持停用思考，而不會對應至
`MINIMAL`。

Gemini 2.5 Pro 僅能在思考模式下運作，且會拒絕明確設定的
`thinkingBudget: 0`；OpenClaw 會從 Gemini 2.5 Pro 要求中移除該值，
而不會將它傳送出去。
</Tip>

## 圖片生成

內建的 `google` 圖片生成提供者預設使用
`google/gemini-3.1-flash-image-preview`。

- 也支援 `google/gemini-3-pro-image-preview`
- 生成：每個要求最多 4 張圖片
- 編輯模式：已啟用，最多 5 張輸入圖片
- 幾何控制項：`size`、`aspectRatio` 和 `resolution`

若要將 Google 設為預設圖片提供者：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
如需共用工具參數、提供者選擇和容錯移轉行為的詳細資訊，請參閱[圖片生成](/zh-TW/tools/image-generation)。
</Note>

## 影片生成

內建的 `google` 外掛也會透過共用的
`video_generate` 工具註冊影片生成功能。

- 預設影片模型：`google/veo-3.1-fast-generate-preview`
- 模式：文字轉影片、圖片轉影片，以及單一影片參照流程
- 支援 `aspectRatio`（`16:9`、`9:16`）和 `resolution`（`720P`、`1080P`）；Veo 目前不支援音訊輸出
- 支援的持續時間：**4、6 或 8 秒**（其他值會調整為最接近的允許值）

若要將 Google 設為預設影片提供者：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
如需共用工具參數、提供者選擇和容錯移轉行為的詳細資訊，請參閱[影片生成](/zh-TW/tools/video-generation)。
</Note>

## 音樂生成

內建的 `google` 外掛也會透過共用的
`music_generate` 工具註冊音樂生成功能。

- 預設音樂模型：`google/lyria-3-clip-preview`
- 也支援 `google/lyria-3-pro-preview`
- 提示詞控制項：`lyrics` 和 `instrumental`
- 輸出格式：預設為 `mp3`，`google/lyria-3-pro-preview` 也支援 `wav`
- 參照輸入：最多 10 張圖片
- 由工作階段支援的執行會透過共用的任務／狀態流程卸離，包括 `action: "status"`

若要將 Google 設為預設音樂提供者：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
如需共用工具參數、提供者選擇和容錯移轉行為的詳細資訊，請參閱[音樂生成](/zh-TW/tools/music-generation)。
</Note>

## 文字轉語音

內建的 `google` 語音提供者使用 Gemini API TTS 路徑，模型為
`gemini-3.1-flash-tts-preview`。

- 預設語音：`Kore`
- 驗證：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 輸出：一般 TTS 附件使用 WAV、語音訊息目標使用 Opus、Talk／電話語音使用 PCM
- 語音訊息輸出：Google PCM 會封裝為 WAV，並使用 `ffmpeg` 轉碼為 48 kHz Opus

Google 的批次 Gemini TTS 路徑會在完成的
`generateContent` 回應中傳回產生的音訊。如需最低延遲的語音對話，請使用
由 Gemini Live API 支援的 Google 即時語音提供者，而非批次
TTS。

若要將 Google 設為預設 TTS 提供者：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "以沉穩的語氣專業地說話。",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然語言提示詞控制風格。設定
`audioProfile`，即可在語音文字之前加上可重複使用的風格提示詞。如果提示詞文字提及具名講者，請設定
`speakerName`。

Gemini API TTS 也接受文字中的表達性方括號音訊標籤，
例如 `[whispers]` 或 `[laughs]`。若要避免標籤出現在可見的聊天回覆中，
同時將其傳送至 TTS，請將它們放在 `[[tts:text]]...[[/tts:text]]`
區塊內：

```text
這是乾淨的回覆文字。

[[tts:text]][whispers] 這是語音版本。[[/tts:text]]
```

<Note>
限制為 Gemini API 的 Google Cloud Console API 金鑰可用於此
提供者。這不是獨立的 Cloud Text-to-Speech API 路徑。
</Note>

## 即時語音

內建的 `google` 外掛會註冊由
Gemini Live API 支援的即時語音提供者，供 Voice Call 和 Google Meet 等後端音訊橋接使用。

| 設定                  | 設定路徑                                                            | 預設值                                                                                                      |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 模型                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                                             |
| 語音                  | `...google.voice`                                                   | `Kore`                                                                                                      |
| 溫度                  | `...google.temperature`                                             | （未設定）                                                                                                  |
| VAD 開始靈敏度        | `...google.startSensitivity`                                        | （未設定）                                                                                                  |
| VAD 結束靈敏度        | `...google.endSensitivity`                                          | （未設定）                                                                                                  |
| 靜音持續時間          | `...google.silenceDurationMs`                                       | （未設定）                                                                                                  |
| 活動處理              | `...google.activityHandling`                                        | Google 預設值，`start-of-activity-interrupts`                                                               |
| 輪次涵蓋範圍          | `...google.turnCoverage`                                            | Google 預設值，`audio-activity-and-all-video`                                                               |
| 停用自動 VAD          | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                                                     |
| 工作階段續接          | `...google.sessionResumption`                                       | `true`                                                                                                      |
| 內容脈絡壓縮          | `...google.contextWindowCompression`                                | `true`                                                                                                      |
| API 金鑰              | `...google.apiKey`                                                  | 若未設定，則依序使用 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |

語音通話即時設定範例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API 透過 WebSocket 使用雙向音訊與函式呼叫。
OpenClaw 會將電話／Meet 橋接音訊調整為 Gemini 的 PCM Live API 串流，
並讓工具呼叫沿用共用的即時語音合約。除非需要變更取樣方式，否則請將 `temperature`
保持未設定；OpenClaw 會省略非正值，因為使用 `temperature: 0` 時，
Google Live 可能只傳回逐字稿而沒有音訊。Gemini API 逐字稿功能啟用時不使用
`languageCodes`；目前的 Google SDK 會拒絕此 API 路徑上的語言代碼提示。
</Note>

<Note>
Gemini 3.1 Live 可透過即時輸入接收對話文字，並使用循序函式呼叫。
OpenClaw 會針對此模型省略舊版的 `NON_BLOCKING`、函式回應排程及情感對話欄位。
請優先使用 `thinkingLevel`；設定的正值 `thinkingBudget` 會對應至最接近的支援層級，
而 `-1` 則會保留 Google 的預設值。請參閱
[Gemini Live 功能比較](https://ai.google.dev/gemini-api/docs/live-api/capabilities)。
</Note>

<Note>
Control UI Talk 支援使用受限一次性權杖的 Google Live 瀏覽器工作階段。
僅限後端的即時語音供應商也可透過通用閘道轉送傳輸執行，
讓供應商認證資訊保留在閘道上。
</Note>

若要進行維護者即時驗證，請執行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
此冒煙測試也涵蓋 OpenAI 後端／WebRTC 路徑；Google 部分會鑄造與 Control UI Talk
所使用者相同格式的受限 Live API 權杖、開啟瀏覽器 WebSocket 端點、
傳送初始設定承載資料，並等待 `setupComplete`。

## 進階設定

<AccordionGroup>
  <Accordion title="直接重用 Gemini 快取">
    對於直接執行的 Gemini API（`api: "google-generative-ai"`），OpenClaw
    會將已設定的 `cachedContent` 控制代碼傳遞至 Gemini 請求。

    - 使用 `cachedContent` 或舊版 `cached_content`
      設定各模型或全域參數
    - 更特定範圍的參數（模型層級優先於全域）一律優先。
      在相同範圍內，若兩個鍵皆有設定，則以 `cached_content` 為準。
      每個範圍僅使用一個鍵，以避免非預期結果。
    - 值範例：`cachedContents/prebuilt-context`
    - Gemini 快取命中的用量會從上游的 `cachedContentTokenCount`
      正規化為 OpenClaw 的 `cacheRead`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini 命令列介面使用注意事項">
    使用 `google-gemini-cli` OAuth 供應商時，OpenClaw 預設使用 Gemini
    命令列介面的 `stream-json` 輸出，並從最終的 `stats` 承載資料正規化用量。
    舊版 `--output-format json` 覆寫仍會使用 JSON 剖析器。

    - 串流回覆文字來自助理的 `message` 事件。
    - 對於舊版 JSON 輸出，回覆文字來自命令列介面 JSON 的 `response` 欄位。
    - 當命令列介面將 `usage` 留空時，用量會改用 `stats`。
    - `stats.cached` 會正規化為 OpenClaw 的 `cacheRead`。
    - 若缺少 `stats.input`，OpenClaw 會透過
      `stats.input_tokens - stats.cached` 推導輸入權杖數。

  </Accordion>

  <Accordion title="環境與常駐程式設定">
    若閘道以常駐程式（launchd/systemd）執行，請確認該程序可存取 `GEMINI_API_KEY`
    （例如放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照及容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與供應商選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    共用音樂工具參數與供應商選擇。
  </Card>
</CardGroup>
