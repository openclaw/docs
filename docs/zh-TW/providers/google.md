---
read_when:
    - 您想要搭配 OpenClaw 使用 Google Gemini 模型
    - 你需要 API 金鑰或 OAuth 驗證流程
summary: Google Gemini 設定（API 金鑰 + OAuth、圖片生成、媒體理解、TTS、網頁搜尋）
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

Google Plugin 透過 Google AI Studio 提供 Gemini 模型存取，並支援
影像生成、媒體理解（影像/音訊/影片）、文字轉語音，以及透過
Gemini Grounding 進行網頁搜尋。

- 提供者：`google`
- 驗證：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 執行階段選項：`agents.defaults.agentRuntime.id: "google-gemini-cli"`
  會重用 Gemini CLI OAuth，同時將模型參照維持為標準的 `google/*`。

## 開始使用

選擇你偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**透過 Google AI Studio 進行標準 Gemini API 存取。

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
    環境變數 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 都可使用。使用你已經設定好的那一個即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **最適合：**透過 PKCE OAuth 重用現有 Gemini CLI 登入，而不是使用另一組 API 金鑰。

    <Warning>
    `google-gemini-cli` 提供者是非官方整合。有些使用者回報，以這種方式使用 OAuth 時會遇到帳戶限制。請自行承擔風險。
    </Warning>

    <Steps>
      <Step title="安裝 Gemini CLI">
        本機的 `gemini` 指令必須可在 `PATH` 上使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 支援 Homebrew 安裝與全域 npm 安裝，包括
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

    Gemini 3.1 Pro 的 Gemini API 模型 ID 是 `gemini-3.1-pro-preview`。OpenClaw 接受較短的 `google/gemini-3.1-pro` 作為便利別名，並會在呼叫提供者前將其正規化。

    **環境變數：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （或 `GEMINI_CLI_*` 變體。）

    <Note>
    如果 Gemini CLI OAuth 請求在登入後失敗，請在 gateway 主機上設定 `GOOGLE_CLOUD_PROJECT` 或
    `GOOGLE_CLOUD_PROJECT_ID`，然後重試。
    </Note>

    <Note>
    如果登入在瀏覽器流程啟動前失敗，請確認本機 `gemini`
    指令已安裝並位於 `PATH` 上。
    </Note>

    `google-gemini-cli/*` 模型參照是舊版相容別名。新的
    設定應使用 `google/*` 模型參照，並在需要本機 Gemini CLI 執行時搭配 `google-gemini-cli`
    執行階段。

  </Tab>
</Tabs>

## 功能

| 功能                   | 支援                          |
| ---------------------- | ----------------------------- |
| 聊天補全               | 是                            |
| 影像生成               | 是                            |
| 音樂生成               | 是                            |
| 文字轉語音             | 是                            |
| 即時語音               | 是（Google Live API）         |
| 影像理解               | 是                            |
| 音訊轉錄               | 是                            |
| 影片理解               | 是                            |
| 網頁搜尋（Grounding）  | 是                            |
| 思考/推理              | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## 網頁搜尋

內建的 `gemini` 網頁搜尋提供者使用 Gemini Google Search grounding。
在 `plugins.entries.google.config.webSearch` 下設定專用搜尋金鑰，
或讓它在 `GEMINI_API_KEY` 之後重用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

憑證優先順序是專用的 `webSearch.apiKey`，接著是 `GEMINI_API_KEY`，
再來是 `models.providers.google.apiKey`。`webSearch.baseUrl` 是選用項，
用於操作員代理或相容的 Gemini API 端點；省略時，
Gemini 網頁搜尋會重用 `models.providers.google.baseUrl`。請參閱
[Gemini 搜尋](/zh-TW/tools/gemini-search)了解提供者專屬工具行為。

<Tip>
Gemini 3 模型使用 `thinkingLevel`，而不是 `thinkingBudget`。OpenClaw 會將
Gemini 3、Gemini 3.1，以及 `gemini-*-latest` 別名的推理控制項對應到
`thinkingLevel`，讓預設/低延遲執行不會傳送已停用的
`thinkingBudget` 值。

`/think adaptive` 會保留 Google 的動態思考語意，而不是選擇固定的
OpenClaw 層級。Gemini 3 和 Gemini 3.1 會省略固定的 `thinkingLevel`，
讓 Google 可以選擇層級；Gemini 2.5 會傳送 Google 的動態哨兵值
`thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支援思考模式。OpenClaw
會將 `thinkingBudget` 重寫為 Gemma 4 支援的 Google `thinkingLevel`。
將思考設定為 `off` 會保留停用思考，而不是對應到
`MINIMAL`。
</Tip>

## 影像生成

內建的 `google` 影像生成提供者預設使用
`google/gemini-3.1-flash-image-preview`。

- 也支援 `google/gemini-3-pro-image-preview`
- 生成：每個請求最多 4 張影像
- 編輯模式：已啟用，最多 5 張輸入影像
- 幾何控制項：`size`、`aspectRatio` 和 `resolution`

若要將 Google 作為預設影像提供者：

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
請參閱[影像生成](/zh-TW/tools/image-generation)了解共用工具參數、提供者選擇和容錯移轉行為。
</Note>

## 影片生成

內建的 `google` Plugin 也會透過共用的
`video_generate` 工具註冊影片生成。

- 預設影片模型：`google/veo-3.1-fast-generate-preview`
- 模式：文字轉影片、影像轉影片，以及單一影片參照流程
- 支援 `aspectRatio`、`resolution` 和 `audio`
- 目前時長限制：**4 到 8 秒**

若要將 Google 作為預設影片提供者：

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
請參閱[影片生成](/zh-TW/tools/video-generation)了解共用工具參數、提供者選擇和容錯移轉行為。
</Note>

## 音樂生成

內建的 `google` Plugin 也會透過共用的
`music_generate` 工具註冊音樂生成。

- 預設音樂模型：`google/lyria-3-clip-preview`
- 也支援 `google/lyria-3-pro-preview`
- 提示控制項：`lyrics` 和 `instrumental`
- 輸出格式：預設為 `mp3`，並在 `google/lyria-3-pro-preview` 上支援 `wav`
- 參照輸入：最多 10 張影像
- 工作階段支援的執行會透過共用的任務/狀態流程分離，包括 `action: "status"`

若要將 Google 作為預設音樂提供者：

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
請參閱[音樂生成](/zh-TW/tools/music-generation)了解共用工具參數、提供者選擇和容錯移轉行為。
</Note>

## 文字轉語音

內建的 `google` 語音提供者使用 Gemini API TTS 路徑，並搭配
`gemini-3.1-flash-tts-preview`。

- 預設語音：`Kore`
- 驗證：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 輸出：一般 TTS 附件使用 WAV，語音備註目標使用 Opus，Talk/電話語音使用 PCM
- 語音備註輸出：Google PCM 會封裝為 WAV，並透過 `ffmpeg` 轉碼為 48 kHz Opus

若要將 Google 作為預設 TTS 提供者：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然語言提示進行風格控制。設定
`audioProfile` 可在朗讀文字前加入可重用的風格提示。當你的提示文字提到具名說話者時，請設定
`speakerName`。

Gemini API TTS 也接受文字中的表現性方括號音訊標籤，
例如 `[whispers]` 或 `[laughs]`。若要在將標籤送到 TTS 的同時，不讓標籤出現在可見的聊天回覆中，
請將它們放入 `[[tts:text]]...[[/tts:text]]`
區塊內：

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
限制為 Gemini API 的 Google Cloud Console API 金鑰可用於此
提供者。這不是另一條 Cloud Text-to-Speech API 路徑。
</Note>

## 即時語音

內建的 `google` Plugin 會註冊由
Gemini Live API 支援的即時語音提供者，用於 Voice Call 和 Google Meet 等後端音訊橋接。

| 設定                  | 設定路徑                                                            | 預設值                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 語音                  | `...google.voice`                                                   | `Kore`                                                                                |
| 溫度                  | `...google.temperature`                                             |（未設定）                                                                            |
| VAD 開始敏感度        | `...google.startSensitivity`                                        |（未設定）                                                                            |
| VAD 結束敏感度        | `...google.endSensitivity`                                          |（未設定）                                                                            |
| 靜音持續時間          | `...google.silenceDurationMs`                                       |（未設定）                                                                            |
| 活動處理              | `...google.activityHandling`                                        | Google 預設值，`start-of-activity-interrupts`                                        |
| Turn 覆蓋範圍         | `...google.turnCoverage`                                            | Google 預設值，`only-activity`                                                       |
| 停用自動 VAD          | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 工作階段續接          | `...google.sessionResumption`                                       | `true`                                                                                |
| Context 壓縮          | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 金鑰              | `...google.apiKey`                                                  | 後援使用 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

Voice Call 即時設定範例：

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
OpenClaw 會將電話/Meet 橋接音訊轉接到 Gemini 的 PCM Live API 串流，並
讓工具呼叫維持在共用的即時語音合約上。除非你需要變更取樣，否則請讓 `temperature`
保持未設定；OpenClaw 會省略非正值，因為 Google Live 可能在 `temperature: 0` 時
傳回沒有音訊的轉錄文字。
Gemini API 轉錄會在沒有 `languageCodes` 的情況下啟用；目前的 Google
SDK 會拒絕這個 API 路徑上的語言代碼提示。
</Note>

<Note>
Control UI Talk 支援使用受限一次性 token 的 Google Live 瀏覽器工作階段。
僅後端的即時語音 provider 也可以透過通用
Gateway relay transport 執行，這會將 provider 認證保留在 Gateway 上。
</Note>

若要進行維護者即時驗證，請執行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
Google 路徑會簽發與 Control
UI Talk 使用的相同受限 Live API token 形狀、開啟瀏覽器 WebSocket 端點、傳送初始設定 payload，
並等待 `setupComplete`。

## 進階設定

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    針對直接 Gemini API 執行（`api: "google-generative-ai"`），OpenClaw
    會將已設定的 `cachedContent` handle 傳遞到 Gemini 請求。

    - 使用 `cachedContent` 或舊版 `cached_content` 設定每個模型或全域參數
    - 如果兩者都存在，`cachedContent` 優先
    - 範例值：`cachedContents/prebuilt-context`
    - Gemini cache-hit 使用量會從上游 `cachedContentTokenCount` 正規化為 OpenClaw `cacheRead`

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

  <Accordion title="Gemini CLI JSON usage notes">
    使用 `google-gemini-cli` OAuth provider 時，OpenClaw 會依下列方式正規化
    CLI JSON 輸出：

    - 回覆文字來自 CLI JSON `response` 欄位。
    - 當 CLI 讓 `usage` 保持空白時，使用量會後援使用 `stats`。
    - `stats.cached` 會正規化為 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 會從
      `stats.input_tokens - stats.cached` 推導輸入 token。

  </Accordion>

  <Accordion title="Environment and daemon setup">
    如果 Gateway 以 daemon（launchd/systemd）執行，請確認 `GEMINI_API_KEY`
    可供該程序使用（例如放在 `~/.openclaw/.env` 中，或透過
    `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 provider、模型參照與容錯移轉行為。
  </Card>
  <Card title="Image generation" href="/zh-TW/tools/image-generation" icon="image">
    共用的圖片工具參數與 provider 選擇。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    共用的影片工具參數與 provider 選擇。
  </Card>
  <Card title="Music generation" href="/zh-TW/tools/music-generation" icon="music">
    共用的音樂工具參數與 provider 選擇。
  </Card>
</CardGroup>
