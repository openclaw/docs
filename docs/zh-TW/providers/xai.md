---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在設定 xAI 驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-22T10:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ae7b049649b08b6508b8331714fec3464628814629256ad23b584f0f8ca8b7
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附內建的 `xai` Grok 模型供應商外掛。建議的方式是使用符合資格的 SuperGrok 或 X Premium 訂閱進行 Grok OAuth。閘道、設定、路由及工具均保留在本機；只有 Grok 請求會傳送至 xAI 的 API。

OAuth 不需要 xAI API 金鑰或 Grok Build 應用程式。由於 OpenClaw 使用 xAI 的共用 OAuth 用戶端，xAI 仍可能在同意畫面顯示 Grok Build。

## 設定

<Steps>
  <Step title="全新安裝">
    執行包含常駐程式安裝的初始設定，然後在模型／驗證步驟選擇 xAI/Grok OAuth：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或透過 SSH 操作時，請直接選擇 xAI OAuth；它使用裝置代碼驗證，不需要 localhost 回呼：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="既有安裝">
    僅登入 xAI；不要只為了連接 Grok 而重新執行完整初始設定：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    另行將 Grok 設為預設模型：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有在你確實想變更閘道、常駐程式、頻道、工作區或其他設定選項時，才重新執行完整初始設定。

  </Step>
  <Step title="API 金鑰方式">
    API 金鑰設定仍適用於 xAI Console 金鑰，以及需要金鑰型供應商設定的媒體介面：

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="選擇模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作為內建的 xAI 傳輸方式。來自 `openclaw models auth login --provider xai --method oauth` 或 `--method api-key` 的相同認證資訊，也可供 `web_search`（供應商 ID `grok`）、`x_search`、`code_execution`、語音／轉錄，以及 xAI 圖片／影片生成功能使用。如果你將 xAI 金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，內建的 xAI 模型供應商也會將其作為備援使用。
</Note>

## OAuth 疑難排解

- 對於 SSH、Docker、VPS 或其他遠端設定，請使用 `openclaw models auth login --provider xai --method oauth`；它使用裝置代碼驗證，而非 localhost 回呼。
- 如果登入成功，但 Grok 並非預設模型，請執行 `openclaw models set xai/grok-4.3`。
- 檢查已儲存的 xAI 驗證設定檔：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 決定哪些帳戶可以取得 OAuth API 權杖。如果帳戶不符合資格，請使用 API 金鑰方式，或在 xAI 端檢查訂閱狀態。

<Tip>
從 SSH、Docker 或 VPS 登入時，請使用 `xai-oauth`。OpenClaw 會顯示 URL 和短代碼；遠端程序輪詢 xAI 以等待權杖交換完成時，請在任一本機瀏覽器中完成登入。
</Tip>

## 內建目錄

以下 ID 可在模型選擇器中選取。外掛仍會解析既有設定中的舊版 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 及 Grok Code ID；請參閱[舊版相容性與移動別名](#legacy-compatibility-and-moving-aliases)。

| 系列           | 模型 ID                                                      |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（別名：`grok-4.5-latest`、`grok-build-latest`） |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（別名：`grok-4.3-latest`、`grok-latest`）       |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
在可用地區，建議將 `grok-4.5` 用於一般聊天、程式設計及代理式工作。Grok 4.3 仍是適用於各地區的安全設定預設值；`grok-build-0.1` 及兩個帶日期的 Grok 4.20 變體仍可選取。
</Tip>

目錄中的上下文及權杖成本中繼資料依循 xAI 即時的[模型頁面](https://docs.x.ai/developers/models)和[定價頁面](https://docs.x.ai/developers/pricing)。當請求超過其文件所載的長上下文門檻時，xAI 會套用較高費率；OpenClaw 的固定目錄成本欄位記錄短上下文費率。Grok Build 是 xAI 獨立的程式設計代理程式命令列介面，可從 [x.ai/cli](https://x.ai/cli) 取得，目前使用 Grok 4.5。

## 功能涵蓋範圍

內建外掛會將支援的 xAI API 對應至 OpenClaw 的共用供應商與工具合約。不符合共用合約的功能列於下方或已知限制之下。

| xAI 功能                   | OpenClaw 介面                            | 狀態                                                 |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| 聊天／Responses            | `xai/<model>` 模型供應商            | 是                                                   |
| 伺服器端網頁搜尋           | `web_search` 供應商 `grok`            | 是                                                   |
| 伺服器端 X 搜尋            | `x_search` 工具                         | 是                                                   |
| 伺服器端程式碼執行         | `code_execution` 工具                   | 是                                                   |
| 圖片                       | `image_generate`                        | 是                                                   |
| 影片                       | `video_generate`                        | 是                                                   |
| 批次文字轉語音             | `tts.provider: "xai"`／`tts`           | 是                                                   |
| 串流 TTS                   | `textToSpeechStream`                    | 是，透過 `wss://api.x.ai/v1/tts`（非即時語音） |
| 批次語音轉文字             | `tools.media.audio` 媒體理解 | 是                                                   |
| 串流語音轉文字             | Voice Call `streaming.provider: "xai"`  | 是                                                   |
| 即時語音                   | Talk `talk.realtime.provider: "xai"`    | 是；原生 Talk 節點使用閘道轉送                       |
| 檔案／批次                 | 僅相容於通用模型 API                     | 不是 OpenClaw 的第一級工具                           |

<Note>
OpenClaw 使用 xAI 的 REST 圖片／影片／TTS／STT API 進行媒體生成及批次轉錄，使用 xAI 的串流 STT WebSocket 進行即時語音通話轉錄，使用 xAI 的 Grok Voice Agent WebSocket 進行 Talk 即時工作階段，並使用 Responses API 進行聊天、搜尋及程式碼執行工具操作。
</Note>

### 舊版快速模式相容性

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true` 仍會依下列方式改寫舊版 xAI 設定。這些目標 ID 僅為相容性保留；新設定請使用目前可選取的模型。

| 來源模型      | 快速模式目標       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 舊版相容性與移動別名

舊版別名會依下列方式正規化：

| 舊版別名                                                      | 正規化後的 ID   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`、`grok-code-fast`、`grok-code-fast-1-0825` | `grok-build-0.1` |

帶日期的 0309 ID 是可選取的目錄項目。OpenClaw 會原封不動傳送所有其他目前的 Grok 4.20 別名，讓 xAI 保有對穩定版、最新版本、Beta 版、實驗版及帶日期別名語意的控制權。全域 `grok-latest` 別名也會原封不動保留。

xAI 已停用下列確切 ID。OpenClaw 將其保留為已發布設定的隱藏相容性資料列，並套用目前重新導向目標的限制及定價：

| 已停用的 ID                                                         | 目前行為                         |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`、`grok-4-fast-reasoning`、`grok-4-0709`    | 啟用 `low` 推理的 Grok 4.3    |
| `grok-4-1-fast-non-reasoning`、`grok-4-fast-non-reasoning`、`grok-3` | 停用推理的 Grok 4.3             |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` 會更新持續儲存的 xAI 伺服器工具預設值及已停用的品質圖片 slug、移除過時的已產生目錄資料列，並修復使用中 4.20 資料列上過時的上下文中繼資料。它不會將使用中的 4.20 `beta-latest` 別名固定至帶日期的快照。

## 功能

<Warning>
  `x_search` 和 `code_execution` 會在 xAI 的伺服器上執行。xAI 對每 1,000 次工具呼叫收取 $5，另加模型的輸入與輸出權杖費用。省略各工具的 `enabled` 設定時，OpenClaw 只會為使用中的 xAI 模型公開該工具。已知的非 xAI 模型供應商需要明確設定每項工具的 `enabled: true`；供應商缺漏或無法解析時，會採取失敗關閉。始終需要 xAI 驗證，而 `enabled: false` 會對所有供應商停用該工具。
</Warning>

<AccordionGroup>
  <Accordion title="網頁搜尋">
    內建的 `grok` 網頁搜尋供應商會優先使用 xAI OAuth，然後才改用 `XAI_API_KEY` 或外掛的網頁搜尋金鑰：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="影片生成">
    內建的 `xai` 外掛會透過共用的 `video_generate` 工具註冊影片生成功能。

    - 預設模型：`xai/grok-imagine-video`
    - 其他模型：`xai/grok-imagine-video-1.5`
    - 傳統模式：文字轉影片、圖片轉影片、參考圖片生成、遠端影片編輯及遠端影片延伸
    - Video 1.5 模式：僅限圖片轉影片，且必須恰好提供一張首幀圖片
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`；省略時，傳統模式和 Video 1.5 圖片轉影片會沿用來源圖片的比例
    - 解析度：傳統模式為 `480P`/`720P`；Video 1.5 另支援 `1080P`；所有生成模式預設為 `480P`
    - 時間長度：生成／圖片轉影片為 1-15 秒，使用傳統 `reference_image` 角色時為 1-10 秒，傳統延伸為 2-10 秒
    - 參考圖片生成：將每張提供的圖片之 `imageRoles` 設為 `reference_image`；xAI 最多接受 7 張此類圖片
    - 影片編輯／延伸會沿用輸入影片的長寬比及解析度；這些操作不接受幾何覆寫
    - 預設操作逾時：600 秒，除非已設定 `video_generate.timeoutMs` 或 `agents.defaults.mediaModels.video.timeoutMs`

    <Warning>
    不接受本機影片緩衝區。影片編輯／延伸輸入請使用遠端 `http(s)` URL。圖片轉影片接受本機圖片緩衝區，因為 OpenClaw 會將其編碼為供 xAI 使用的資料 URL。
    </Warning>

    Video 1.5 也能辨識 xAI 的 `grok-imagine-video-1.5-preview` 和 `grok-imagine-video-1.5-2026-05-30` 識別碼。OpenClaw 會原封不動轉送所選的識別碼，但套用相同的僅限圖片驗證。

    若要將 xAI 設為預設影片供應商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    如需共用工具參數、提供者選擇與容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="圖片生成">
    內建的 `xai` 外掛會透過共用的
    `image_generate` 工具註冊圖片生成功能。

    - 預設圖片模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文字轉圖片與參考圖片編輯
    - 參考輸入：一個 `image` 或最多三個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張圖片
    - 預設操作逾時：600 秒，除非已設定 `image_generate.timeoutMs`
      或 `agents.defaults.mediaModels.image.timeoutMs`

    OpenClaw 會要求 xAI 提供 `b64_json` 圖片回應，以便透過一般頻道附件路徑
    儲存及傳送生成的媒體。本機參考圖片會轉換成資料 URL；遠端 `http(s)` 參考
    則會原樣傳遞。

    若要使用 xAI 作為預設圖片提供者：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI 也記載了 `quality`、`mask`、`user`，以及 `auto` 長寬比。
    OpenClaw 目前只會轉送跨提供者共用的圖片控制項；
    這些僅限原生功能的選項不會透過 `image_generate` 公開。
    </Note>

  </Accordion>

  <Accordion title="文字轉語音">
    內建的 `xai` 外掛會透過共用的 `tts`
    提供者介面註冊文字轉語音功能。

    - 語音：來自 xAI、經過驗證的即時目錄；可使用
      `openclaw infer tts voices --provider xai` 列出
    - 離線備援語音：`ara`、`eve`、`leo`、`rex`、`sal`
    - 預設語音：`eve`
    - 即使帳戶自訂語音 ID 不在
      內建目錄回應中，也會予以轉送
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 代碼或 `auto`
    - 速度：提供者原生的速度覆寫
    - 不支援原生 Opus 語音留言格式

    若要使用 xAI 作為預設 TTS 提供者：

    ```json5
    {
      tts: {
        provider: "xai",
        providers: {
          xai: {
            voiceId: "eve",
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批次 `/v1/tts` 端點進行緩衝合成，
    使用經過驗證的 `/v1/tts/voices` 目錄探索，並使用原生
    `wss://api.x.ai/v1/tts` 進行串流合成。串流僅限原生 `api.x.ai` 主機，因此此路徑會拒絕自訂
    `baseUrl` 值。它使用現有的語言、語音、編解碼器和速度控制項；取樣率與位元率
    則套用 xAI 預設值。音訊檔案合成會遵循所有已設定的編解碼器。
    語音留言目標在串流與緩衝備援時使用 MP3，因為 xAI 的原始編解碼器
    不包含編解碼器／取樣率中繼資料。串流會傳送 `text.delta`，接著傳送
    `text.done`，接收 `audio.delta`、`audio.done` 或 `error`，並套用
    會在每個音訊區塊到達時重新計時的閒置 `timeoutMs`。此功能與
    即時語音工作階段彼此獨立。請參閱 xAI 的[串流 TTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice) 合約。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `xai` 外掛會透過 OpenClaw 的
    媒體理解轉錄介面註冊批次語音轉文字功能。

    - 端點：xAI REST `/v1/stt`
    - 輸入路徑：多部分音訊檔案上傳
    - 模型選擇：xAI 在內部選擇轉錄模型；
      此端點沒有模型選擇器
    - 用於所有讀取 `tools.media.audio` 的傳入音訊轉錄位置，
      包括 Discord 語音頻道片段與頻道音訊附件

    若要強制使用 xAI 轉錄傳入音訊：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    可透過共用音訊媒體設定或每次呼叫的轉錄請求提供語言。
    共用 OpenClaw 介面接受提示內容，但 xAI REST STT 整合只會轉送檔案與語言，
    因為只有這些項目能對應至目前公開的 xAI 端點。

  </Accordion>

  <Accordion title="串流語音轉文字">
    內建的 `xai` 外掛也會為即時語音通話音訊
    註冊即時轉錄提供者。

    - 端點：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設端點偵測：`800ms`
    - 暫時轉錄文字：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 mu-law 音訊影格，因此
    xAI 提供者會直接轉送這些影格，而不進行轉碼：

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    由提供者擁有的設定位於
    `plugins.entries.voice-call.config.streaming.providers.xai`。支援的
    鍵包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此串流提供者用於 Voice Call 的即時轉錄路徑。
    Discord 語音會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音（Talk）">
    內建的 `xai` 外掛會透過共用的 `registerRealtimeVoiceProvider` 合約，
    為 Talk 模式註冊 Grok Voice Agent 即時工作階段。

    - 端點：`wss://api.x.ai/v1/realtime?model=<voice-model>`
    - 預設模型：`grok-voice-latest`
    - 預設語音：`eve`
    - 傳輸：`gateway-relay`（iOS、Android 與 Control UI 中繼路徑）
    - 音訊：PCM16 24 kHz 或 G.711 µ-law 8 kHz
    - 插話：xAI 伺服器 VAD 會中斷回應；OpenClaw 會清除佇列中的播放內容，
      並截斷尚未播放的提供者歷程

    在閘道上設定 Talk：

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // 僅在可接受提供者端工作階段重播時啟用。
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    當 Voice Call 或共用即時選擇器重複使用相同的提供者對應表時，
    由提供者擁有的設定也會從 `plugins.entries.voice-call.config.realtime.providers.xai`
    解析。支援的鍵包括
    `apiKey`、`baseUrl`、`model`、`voice`、`vadThreshold`、`silenceDurationMs`、
    `prefixPaddingMs`、`reasoningEffort` 和 `sessionResumption`。
    `reasoningEffort` 僅接受 `high` 或 `none`，與 xAI Voice Agent API 相符。

    xAI 的伺服器 VAD 一律會建立回應並處理音訊中斷。
    請使用 `consultRouting: "provider-direct"`；xAI Voice Agent 通訊協定不支援強制轉錄路由，
    也不支援停用輸入音訊中斷。

    <Note>
    xAI OAuth 或 `XAI_API_KEY` 可驗證即時語音。此提供者介面目前尚不包含
    由瀏覽器擁有的 WebRTC；請在原生節點上使用 gateway-relay Talk，
    或使用 Control UI 中繼路徑。
    </Note>

    <Note>
    `sessionResumption` 預設為 `false`。設為 `true` 時，OpenClaw 會要求
    xAI 保留足以在重新連線後繼續同一對話的工作階段狀態，接著使用傳回的
    對話 ID 重新連線。若無法接受提供者端重播／保留，請維持停用；
    此時中斷的通訊端會採取封閉式失敗，而不是在未通知的情況下開始新對話。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    內建的 xAI 外掛會將 `x_search` 公開為 OpenClaw 工具，
    以便透過 Grok 搜尋 X（前稱 Twitter）內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵                | 類型    | 預設值                    | 說明                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | 布林值  | 對 xAI 模型自動啟用        | 停用，或為已知的非 xAI 提供者選擇啟用           |
    | `model`           | 字串    | `grok-4.3`                | 用於 x_search 請求的模型                         |
    | `baseUrl`         | 字串    | -                         | 覆寫 xAI Responses 基底 URL                      |
    | `inlineCitations` | 布林值  | -                         | 在結果中包含行內引用                             |
    | `maxTurns`        | 數值    | -                         | 對話輪次上限                                     |
    | `timeoutSeconds`  | 數值    | `30`                      | 請求逾時秒數                                     |
    | `cacheTtlMinutes` | 數值    | `15`                      | 快取存活時間（分鐘）                             |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="程式碼執行設定">
    內建的 xAI 外掛會將 `code_execution` 公開為 OpenClaw 工具，
    用於在 xAI 的沙箱環境中遠端執行程式碼。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵               | 類型    | 預設值                   | 說明                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | xAI 模型自動啟用 | 停用，或為已知的非 xAI 提供者選擇啟用 |
    | `model`          | string  | `grok-4.3`               | 用於程式碼執行請求的模型           |
    | `maxTurns`       | number  | -                        | 對話輪次上限                       |
    | `timeoutSeconds` | number  | `30`                     | 請求逾時秒數                       |

    <Note>
    這是遠端 xAI 沙箱執行，而非本機 [`exec`](/zh-TW/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - xAI 驗證可以使用 API 金鑰、環境變數、外掛設定
      備援，或透過符合資格的 xAI 帳戶使用 OAuth。OAuth 使用裝置代碼
      驗證，不需要 localhost 回呼。xAI 會決定哪些帳戶
      可以取得 OAuth API 權杖，而同意頁面可能會顯示 Grok Build，
      即使 OpenClaw 不需要 Grok Build 應用程式。
    - OpenClaw 目前不提供 xAI 多代理模型系列。xAI
      透過 Responses API 提供這些模型，但它們不接受
      OpenClaw 共用代理迴圈所使用的用戶端或自訂工具。
      請參閱
      [xAI 多代理限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 語音目前僅提供閘道中繼的 Talk 傳輸。
      瀏覽器所管理的提供者 WebSocket 工作階段尚未
      接入 Control UI。
    - 在共用 `image_generate` 工具具備對應的
      跨提供者控制項之前，不會提供 xAI 圖片 `quality`、圖片 `mask` 及其他僅原生支援的長寬比。
  </Accordion>

  <Accordion title="進階說明">
    - OpenClaw 會在共用執行器路徑上自動套用 xAI 專用的工具結構描述與工具呼叫相容性
      修正。
    - 原生 xAI 請求預設使用 `tool_stream: true`。將
      `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false`
      即可停用。
    - 隨附的 xAI 包裝器會先移除不支援的 contains-count 結構描述界限
      及不支援的推理 *effort* 承載資料鍵，再傳送原生
      xAI 請求。Grok 4.5 支援低、中、高 effort（預設為高）。
      Grok 4.3 支援無、低、中、高
      effort（預設為低）。其他具備推理能力的 xAI 模型不提供
      可設定的 effort 控制項，但仍會要求
      `include: ["reasoning.encrypted_content"]`，以便在後續輪次中重播先前加密的推理。
    - `web_search`、`x_search` 和 `code_execution` 會以 OpenClaw
      工具的形式提供。OpenClaw 只會將每個工具所需的特定 xAI 內建工具
      附加至該工具的請求，而不會將所有原生工具附加至每一輪
      聊天。
    - Grok `web_search` 會讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 會讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      備援至 Grok 網頁搜尋基底 URL。
    - `x_search` 和 `code_execution` 由隨附的 xAI 外掛擁有，
      而非硬編碼於核心模型執行階段中。
    - `code_execution` 是遠端 xAI 沙箱執行，而非本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## 即時測試

xAI 媒體路徑由單元測試及選擇性啟用的即時測試套件涵蓋。執行即時探查之前，
請在程序環境中匯出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供者專屬的即時測試檔案會合成一般 TTS、適合電話通訊的 PCM
TTS、透過 xAI 批次 STT 轉錄音訊、將相同的 PCM 串流至 xAI
即時 STT、產生文字轉圖片輸出，並編輯參考圖片。
共用圖片即時測試檔案會透過 OpenClaw 的
執行階段選擇、備援、正規化及媒體附件路徑，驗證相同的 xAI 提供者。
選擇性啟用的 Video 1.5 案例會以 1080P 提交一張產生的首幀圖片，
並驗證已完成影片的下載。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數及提供者選擇。
  </Card>
  <Card title="所有提供者" href="/zh-TW/providers/index" icon="grid-2">
    更廣泛的提供者概覽。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題及修正方式。
  </Card>
</CardGroup>
