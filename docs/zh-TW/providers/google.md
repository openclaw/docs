---
read_when:
    - 你想要搭配 OpenClaw 使用 Google Gemini 模型
    - 你需要 API 金鑰或 OAuth 驗證流程
summary: Google Gemini 設定（API 金鑰 + OAuth、圖片生成、媒體理解、TTS、網路搜尋）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-22T10:44:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fdf8db70bcebd425238e5f02ca12bdbcd75fa1c03d285ea127d4e3863892b3aa
    source_path: providers/google.md
    workflow: 16
---

Google 外掛可透過 Google AI Studio 存取 Gemini 模型，並提供圖片生成、媒體理解（圖片／音訊／影片）、文字轉語音，以及透過 Gemini Grounding 進行網頁搜尋。

- 提供者：`google`
- 驗證：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 執行階段選項：`agentRuntime.id: "google-gemini-cli"` 會重複使用 Gemini 命令列介面的 OAuth，同時將模型參照維持為標準的 `google/*`。

## 開始使用

選擇偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**透過 Google AI Studio 使用標準 Gemini API。

    <Steps>
      <Step title="取得 API 金鑰">
        在 [Google AI Studio](https://aistudio.google.com/apikey) 建立免費金鑰。
      </Step>
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
    `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 均可使用。請使用你已設定的項目。
    </Tip>

    設定 API 金鑰後，OpenClaw 會透過 Gemini `models.list` API 更新 Google AI Studio 的文字模型
    目錄。因此，新發布的 Gemini 3 Pro、Flash
    和 Flash-Lite 變體會出現在
    `openclaw models list --provider google` 中，無須等待 OpenClaw
    發布新版本。如果探索功能無法使用，OpenClaw 會保留隨附的備援
    目錄。

  </Tab>

  <Tab title="Gemini 命令列介面 (OAuth)">
    **最適合：**透過 Gemini 命令列介面的 OAuth 登入 Google 帳戶，而不使用個別的 API 金鑰。

    <Warning>
    `google-gemini-cli` 提供者是非官方整合。部分使用者
    回報以此方式使用 OAuth 時帳戶受到限制。請自行承擔風險。
    </Warning>

    <Steps>
      <Step title="安裝 Gemini 命令列介面">
        本機的 `gemini` 命令必須可在 `PATH` 中使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # 或 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同時支援 Homebrew 安裝與全域 npm 安裝，包括
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

    Gemini 3.1 Pro 的 Gemini API 模型 ID 是 `gemini-3.1-pro-preview`。OpenClaw 接受較短的 `google/gemini-3.1-pro` 作為便利別名，並在呼叫提供者前將其正規化。

    **環境變數：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    如果 Gemini 命令列介面的 OAuth 請求在登入後失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然後重試。
    </Note>

    <Note>
    如果在瀏覽器流程開始前登入失敗，請確認本機已安裝 `gemini`
    命令，且該命令位於 `PATH` 中。
    </Note>

    初始設定的自動偵測會列出現有的 Gemini 命令列介面登入，但絕不會
    自動測試，因為 Gemini 命令列介面沒有不使用工具的探測方式。請選擇 Gemini 命令列介面
    OAuth 或 Gemini API 金鑰以繼續。

    `google-gemini-cli/*` 模型參照是舊版相容性別名。新
    設定若要在本機執行 Gemini 命令列介面，應使用 `google/*` 模型參照搭配 `google-gemini-cli`
    執行階段。

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` 已於 2026-03-09 停用；請改用 `google/gemini-3.1-pro-preview`。重新執行 Gemini API 金鑰設定（`openclaw onboard --auth-choice gemini-api-key` 或 `openclaw models auth login --provider google`）會將過時的預設設定重寫為目前的模型。
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
| 網頁搜尋（Grounding）  | 是                            |
| 思考／推理             | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## 網頁搜尋

隨附的 `gemini` 網頁搜尋提供者使用 Gemini Google Search Grounding。
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
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 備援使用 models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

認證資訊的優先順序為專用的 `webSearch.apiKey`，其次是 `GEMINI_API_KEY`，
最後是 `models.providers.google.apiKey`。`webSearch.baseUrl` 為選用，
供營運人員的 Proxy 或相容的 Gemini API 端點使用；若省略，
Gemini 網頁搜尋會重複使用 `models.providers.google.baseUrl`。如需提供者專屬工具行為，請參閱
[Gemini 搜尋](/zh-TW/tools/gemini-search)。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而非 `thinkingBudget`。OpenClaw 會將
Gemini 3、Gemini 3.1 和 `gemini-*-latest` 別名的推理控制項對應至
`thinkingLevel`，讓預設／低延遲執行不會傳送已停用的
`thinkingBudget` 值。

`/think adaptive` 會保留 Google 的動態思考語意，而非選擇
固定的 OpenClaw 等級。Gemini 3 和 Gemini 3.1 會省略固定的 `thinkingLevel`，以便
Google 選擇等級；Gemini 2.5 則會傳送 Google 的動態哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支援思考模式。OpenClaw
會針對 Gemma 4 將 `thinkingBudget` 重寫為受支援的 Google `thinkingLevel`。
將思考設定為 `off` 會維持停用思考，而不會對應至
`MINIMAL`。

Gemini 2.5 Pro 僅能在思考模式下運作，且會拒絕明確的
`thinkingBudget: 0`；OpenClaw 會從 Gemini 2.5 Pro 請求中移除該值，
而不會將其傳送。
</Tip>

## 圖片生成

隨附的 `google` 圖片生成提供者預設使用
`google/gemini-3.1-flash-image`。

- 亦支援 `google/gemini-3-pro-image`
- 生成：每個請求最多 4 張圖片
- 編輯模式：已啟用，最多 5 張輸入圖片
- 幾何控制項：`size`、`aspectRatio` 和 `resolution`

若要將 Google 設為預設圖片提供者：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image",
      },
    },
  },
}
```

<Note>
如需共用工具參數、提供者選擇與容錯移轉行為，請參閱[圖片生成](/zh-TW/tools/image-generation)。
</Note>

## 影片生成

隨附的 `google` 外掛也會透過共用的
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
如需共用工具參數、提供者選擇與容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。
</Note>

## 音樂生成

隨附的 `google` 外掛也會透過共用的
`music_generate` 工具註冊音樂生成功能。

- 預設音樂模型：`google/lyria-3-clip-preview`
- 亦支援 `google/lyria-3-pro-preview`
- 提示詞控制項：`lyrics` 和 `instrumental`
- 輸出格式：預設為 `mp3`，另外在 `google/lyria-3-pro-preview` 上支援 `wav`
- 參照輸入：最多 10 張圖片
- 由工作階段支援的執行會透過共用的工作／狀態流程分離，包括 `action: "status"`

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
如需共用工具參數、提供者選擇與容錯移轉行為，請參閱[音樂生成](/zh-TW/tools/music-generation)。
</Note>

## 文字轉語音

隨附的 `google` 語音提供者會搭配
`gemini-3.1-flash-tts-preview` 使用 Gemini API TTS 路徑。

- 預設語音：`Kore`
- 驗證：`tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 輸出：一般 TTS 附件使用 WAV、語音留言目標使用 Opus、Talk／電話通訊使用 PCM
- 語音留言輸出：Google PCM 會封裝為 WAV，並使用 `ffmpeg` 轉碼為 48 kHz Opus

Google 的批次 Gemini TTS 路徑會在已完成的
`generateContent` 回應中傳回產生的音訊。如需最低延遲的語音對話，請使用
由 Gemini Live API 支援的 Google 即時語音提供者，而非批次
TTS。

若要將 Google 設為預設 TTS 提供者：

```json5
{
  tts: {
    auto: "always",
    provider: "google",
    providers: {
      google: {
        model: "gemini-3.1-flash-tts-preview",
        speakerVoice: "Kore",
        audioProfile: "以平靜的語調專業地說話。",
      },
    },
  },
}
```

Gemini API TTS 使用自然語言提示詞來控制風格。設定
`audioProfile`，可在朗讀文字前加上可重複使用的風格提示詞。當提示文字提及具名說話者時，請設定
`speakerName`。

Gemini API TTS 也接受文字中的表達性方括號音訊標籤，
例如 `[whispers]` 或 `[laughs]`。若要讓標籤不出現在可見的聊天回覆中，
但仍將其傳送至 TTS，請將其放入 `[[tts:text]]...[[/tts:text]]`
區塊中：

```text
這是純文字回覆。

[[tts:text]][whispers] 這是朗讀版本。[[/tts:text]]
```

<Note>
限制為 Gemini API 的 Google Cloud Console API 金鑰可供此
提供者使用。這不是個別的 Cloud Text-to-Speech API 路徑。
</Note>

## 即時語音

隨附的 `google` 外掛會註冊由
Gemini Live API 支援的即時語音提供者，用於 Voice Call 和 Google Meet 等後端音訊橋接。

| 設定                  | 設定路徑                                                            | 預設值                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 語音                  | `...google.voice`                                                   | `Kore`                                                                                |
| 溫度                  | `...google.temperature`                                             | （未設定）                                                                            |
| VAD 開始靈敏度        | `...google.startSensitivity`                                        | （未設定）                                                                            |
| VAD 結束靈敏度        | `...google.endSensitivity`                                          | （未設定）                                                                            |
| 靜音持續時間          | `...google.silenceDurationMs`                                       | （未設定）                                                                            |
| 活動處理              | `...google.activityHandling`                                        | Google 預設值，`start-of-activity-interrupts`                                        |
| 回合涵蓋範圍          | `...google.turnCoverage`                                            | Google 預設值，`audio-activity-and-all-video`                                        |
| 停用自動 VAD          | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 工作階段恢復          | `...google.sessionResumption`                                       | `true`                                                                                |
| 上下文壓縮            | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 金鑰              | `...google.apiKey`                                                  | 依序退回使用 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

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
OpenClaw 會將電話語音／Meet 橋接音訊調整為 Gemini 的 PCM Live API 串流，並
讓工具呼叫沿用共用的即時語音合約。除非需要變更取樣，否則請勿設定 `temperature`；
OpenClaw 會省略非正值，因為 Google Live 使用 `temperature: 0` 時可能只傳回
轉錄文字而沒有音訊。Gemini API 轉錄功能無須 `languageCodes` 即會啟用；目前的 Google
SDK 會拒絕此 API 路徑上的語言代碼提示。
</Note>

<Note>
Gemini 3.1 Live 可透過即時輸入接收對話文字，並採用循序函式呼叫。
OpenClaw 對此模型會省略較舊的 `NON_BLOCKING`、函式
回應排程與情感對話欄位。建議使用 `thinkingLevel`；
設定的正值 `thinkingBudget` 會對應至最接近的支援等級，而 `-1`
則會保留 Google 的預設值。請參閱
[Gemini Live 功能比較](https://ai.google.dev/gemini-api/docs/live-api/capabilities)。
</Note>

<Note>
Control UI Talk 支援使用受限單次權杖的 Google Live 瀏覽器工作階段。
在 Video Talk 中，瀏覽器會以供應商允許的每秒最多一個影格，
將有界限的 JPEG 影格直接傳送至 Google Live。
`describe_view` 函式會回報該攝影機串流是否處於啟用狀態。
攝影機影格不會通過閘道。僅限後端的即時語音
供應商也可透過通用閘道轉送傳輸執行，讓
供應商認證資訊保留在閘道上。
</Note>

若要進行維護者即時驗證，請執行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
此冒煙測試也涵蓋 OpenAI 後端／WebRTC 路徑；Google 部分會鑄造與
Control UI Talk 所用相同格式的受限 Live API 權杖、開啟瀏覽器
WebSocket 端點、傳送初始設定承載內容與一個 JPEG 影格，並
驗證文字回應及 `describe_view` 函式的往返流程。

## 進階設定

<AccordionGroup>
  <Accordion title="直接重複使用 Gemini 快取">
    對於直接執行 Gemini API（`api: "google-generative-ai"`），OpenClaw
    會將已設定的 `cachedContent` 控制代碼傳遞至 Gemini 請求。

    - 使用 `cachedContent` 或舊版 `cached_content`
      設定各模型或全域參數
    - 範圍越具體的參數（模型層級優先於全域）一律優先。
      在相同範圍內，如果同時設定兩個鍵，則以 `cached_content` 為準。
      每個範圍只使用一個鍵，以免產生非預期結果。
    - 範例值：`cachedContents/prebuilt-context`
    - Gemini 快取命中的用量會從上游 `cachedContentTokenCount`
      正規化至 OpenClaw `cacheRead`

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
    命令列介面的 `stream-json` 輸出，並從最終的 `stats`
    承載內容正規化用量。舊版 `--output-format json` 覆寫仍使用
    JSON 剖析器。

    - 串流回覆文字來自助理的 `message` 事件。
    - 對於舊版 JSON 輸出，回覆文字來自命令列介面 JSON 的 `response` 欄位。
    - 當命令列介面將 `usage` 留空時，用量會依序退回使用 `stats`。
    - `stats.cached` 會正規化至 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 會從
      `stats.input_tokens - stats.cached` 推導輸入權杖數。

  </Accordion>

  <Accordion title="環境與常駐程式設定">
    如果閘道以常駐程式（launchd/systemd）執行，請確保該程序可使用 `GEMINI_API_KEY`
    （例如在 `~/.openclaw/.env` 中，或透過
    `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
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
