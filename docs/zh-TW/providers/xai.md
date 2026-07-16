---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在設定 xAI 驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-16T11:59:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附適用於 Grok 模型的內建 `xai` 提供者外掛。建議的方式是搭配符合資格的 SuperGrok 或 X Premium 訂閱使用 Grok OAuth。閘道、設定、路由與工具都保留在本機；只有 Grok 請求會傳送至 xAI 的 API。

OAuth 不需要 xAI API 金鑰或 Grok Build 應用程式。由於 OpenClaw 使用 xAI 的共用 OAuth 用戶端，xAI 仍可能在同意畫面上顯示 Grok Build。

## 設定

<Steps>
  <Step title="全新安裝">
    執行新手引導並安裝常駐程式，然後在模型／驗證步驟選擇 xAI/Grok OAuth：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或透過 SSH 時，直接選擇 xAI OAuth；它使用裝置代碼驗證，不需要 localhost 回呼：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="現有安裝">
    僅登入 xAI；不要只是為了連接 Grok 而重新執行完整的新手引導：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    另外將 Grok 設為預設模型：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有在你確實想變更閘道、常駐程式、頻道、工作區或其他設定選項時，才重新執行完整的新手引導。

  </Step>
  <Step title="API 金鑰方式">
    API 金鑰設定仍適用於 xAI Console 金鑰，以及需要金鑰型提供者設定的媒體介面：

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
OpenClaw 使用 xAI Responses API 作為內建的 xAI 傳輸層。來自 `openclaw models auth login --provider xai --method oauth` 或
`--method api-key` 的相同認證資訊，也會供 `web_search`（提供者 ID `grok`）、`x_search`、
`code_execution`、語音／轉錄及 xAI 圖片／影片生成使用。如果你將 xAI 金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，
內建的 xAI 模型提供者也會將其作為備援使用。
</Note>

## OAuth 疑難排解

- 對於 SSH、Docker、VPS 或其他遠端設定，請使用
  `openclaw models auth login --provider xai --method oauth`；它使用裝置代碼驗證，而非 localhost 回呼。
- 如果登入成功但 Grok 並非預設模型，請執行
  `openclaw models set xai/grok-4.3`。
- 檢查已儲存的 xAI 驗證設定檔：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 決定哪些帳號可取得 OAuth API 權杖。如果帳號不符合資格，請使用 API 金鑰方式，或在 xAI 端檢查訂閱。

<Tip>
從 SSH、Docker 或 VPS 登入時，請使用 `xai-oauth`。OpenClaw 會顯示 URL 和短代碼；遠端程序輪詢 xAI 以確認權杖交換完成時，請在任何本機瀏覽器中完成登入。
</Tip>

## 內建目錄

模型選擇器中可選取的 ID。外掛仍會解析現有設定中的舊版 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code ID；請參閱[舊版相容性與移動別名](#legacy-compatibility-and-moving-aliases)。

| 系列           | 模型 ID                                                      |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（別名：`grok-4.5-latest`、`grok-build-latest`） |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（別名：`grok-4.3-latest`、`grok-latest`）       |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
在可用的情況下，請使用 `grok-4.5` 進行一般聊天、程式設計和代理式工作。Grok 4.3 仍是區域安全的設定預設值；`grok-build-0.1` 和兩種有日期的 Grok 4.20 變體仍可選取。
</Tip>

## 功能涵蓋範圍

內建外掛會將支援的 xAI API 對應至 OpenClaw 的共用提供者與工具合約。不符合共用合約的功能列於下方或已知限制中。

| xAI 功能                   | OpenClaw 介面                            | 狀態                                                 |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| 聊天／Responses            | `xai/<model>` 模型提供者            | 是                                                   |
| 伺服器端網頁搜尋           | `web_search` 提供者 `grok`            | 是                                                   |
| 伺服器端 X 搜尋            | `x_search` 工具                         | 是                                                   |
| 伺服器端程式碼執行         | `code_execution` 工具                   | 是                                                   |
| 圖片                       | `image_generate`                        | 是                                                   |
| 影片                       | `video_generate`                        | 是                                                   |
| 批次文字轉語音             | `messages.tts.provider: "xai"` / `tts`  | 是                                                   |
| 串流 TTS                   | `textToSpeechStream`                    | 是，透過 `wss://api.x.ai/v1/tts`（非即時語音） |
| 批次語音轉文字             | `tools.media.audio` 媒體理解 | 是                                                   |
| 串流語音轉文字             | 語音通話 `streaming.provider: "xai"`  | 是                                                   |
| 即時語音                   | Talk `talk.realtime.provider: "xai"`    | 是；原生 Talk 節點使用閘道轉送             |
| 檔案／批次                 | 僅限一般模型 API 相容性                 | 並非第一級 OpenClaw 工具                            |

<Note>
OpenClaw 使用 xAI 的 REST 圖片／影片／TTS／STT API 進行媒體生成和批次轉錄，使用 xAI 的串流 STT WebSocket 進行即時語音通話轉錄，使用 xAI 的 Grok Voice Agent WebSocket 進行 Talk 即時工作階段，並使用 Responses API 進行聊天、搜尋和程式碼執行工具。
</Note>

### 舊版快速模式相容性

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
仍會依下列方式重寫較舊的 xAI 設定。這些目標 ID 僅為相容性而保留；新設定請使用目前可選取的模型。

| 來源模型      | 快速模式目標       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 舊版相容性與移動別名

舊版別名會正規化如下：

| 舊版別名                                                      | 正規化 ID       |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`、`grok-code-fast`、`grok-code-fast-1-0825` | `grok-build-0.1` |

帶日期的 0309 ID 是可選取的目錄項目。OpenClaw 會逐字傳送其他所有目前的 Grok 4.20 別名，讓 xAI 保有對穩定版、最新版、Beta 版、實驗版和帶日期別名語意的控制權。全域 `grok-latest` 別名也會逐字保留。

xAI 已停用下列確切 ID。OpenClaw 會將其保留為已發布設定的隱藏相容性資料列，並沿用目前重新導向目標的限制與定價：

| 已停用的 ID                                                         | 目前行為                         |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`、`grok-4-fast-reasoning`、`grok-4-0709`    | 使用 `low` 推理的 Grok 4.3    |
| `grok-4-1-fast-non-reasoning`、`grok-4-fast-non-reasoning`、`grok-3` | 停用推理的 Grok 4.3 |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine 圖片品質       |

`openclaw doctor --fix` 會更新已持久化的 xAI 伺服器工具預設值和已停用的品質圖片 slug、移除過時的已生成目錄資料列，並修復作用中 4.20 資料列上的過時上下文中繼資料。它不會將作用中的 4.20 `beta-latest` 別名固定至帶日期的快照。

## 功能

<Warning>
  `x_search` 和 `code_execution` 在 xAI 的伺服器上執行。xAI 對每 1,000 次工具呼叫收取 $5，另加模型的輸入與輸出權杖費用。省略各工具的 `enabled` 設定時，OpenClaw 僅會為作用中的 xAI 模型公開該工具。已知的非 xAI 模型提供者需要明確的個別工具 `enabled: true`；提供者缺失或無法解析時，會以關閉狀態安全失敗。一律需要 xAI 驗證，而 `enabled: false` 會為所有提供者停用該工具。
</Warning>

<AccordionGroup>
  <Accordion title="網頁搜尋">
    內建的 `grok` 網頁搜尋提供者會優先使用 xAI OAuth，然後再退回使用 `XAI_API_KEY` 或外掛網頁搜尋金鑰：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="影片生成">
    內建的 `xai` 外掛會透過共用的 `video_generate` 工具註冊影片生成。

    - 預設模型：`xai/grok-imagine-video`
    - 其他模型：`xai/grok-imagine-video-1.5`
    - 經典模式：文字轉影片、圖片轉影片、參考圖片生成、遠端影片編輯及遠端影片延伸
    - Video 1.5 模式：僅限圖片轉影片，且必須恰好有一張首格圖片
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`；
      省略時，經典模式和 Video 1.5 的圖片轉影片會沿用來源圖片的比例
    - 解析度：經典模式為 `480P`/`720P`；Video 1.5 也支援 `1080P`；所有生成模式預設為 `480P`
    - 持續時間：生成／圖片轉影片為 1-15 秒；使用經典 `reference_image` 角色時為 1-10 秒；經典延伸為 2-10 秒
    - 參考圖片生成：將每張提供的圖片之 `imageRoles` 設為 `reference_image`；xAI 最多接受 7 張此類圖片
    - 影片編輯／延伸會沿用輸入影片的長寬比與解析度；這些操作不接受幾何覆寫
    - 預設操作逾時：600 秒，除非已設定 `video_generate.timeoutMs` 或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本機影片緩衝區。影片編輯／延伸輸入請使用遠端 `http(s)` URL。圖片轉影片接受本機圖片緩衝區，因為 OpenClaw 會將其編碼為供 xAI 使用的資料 URL。
    </Warning>

    Video 1.5 也能辨識 xAI 的 `grok-imagine-video-1.5-preview` 和
    `grok-imagine-video-1.5-2026-05-30` 識別碼。OpenClaw 會原樣轉送所選識別碼，但套用相同的僅限圖片驗證。

    若要將 xAI 設為預設影片提供者：

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
    如需共用工具參數、提供者選擇和容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="圖片生成">
    內建的 `xai` 外掛會透過共用的 `image_generate` 工具註冊圖片生成。

    - 預設圖片模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文字轉圖片及參考圖片編輯
    - 參考輸入：一個 `image` 或最多三個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張圖片
    - 預設操作逾時：600 秒，除非已設定 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 會要求 xAI 傳回 `b64_json` 圖片回應，以便透過一般頻道附件路徑
    儲存及傳送產生的媒體。本機參考圖片會轉換為資料 URL；遠端 `http(s)` 參考
    則會原樣傳遞。

    若要將 xAI 設為預設圖片供應商：

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
    OpenClaw 目前只會轉送各供應商共用的圖片控制項；
    這些僅限原生功能的調整項目不會透過 `image_generate` 公開。
    </Note>

  </Accordion>

  <Accordion title="文字轉語音">
    隨附的 `xai` 外掛會透過共用的 `tts`
    供應商介面註冊文字轉語音功能。

    - 語音：來自 xAI 的已驗證即時目錄；可使用
      `openclaw infer tts voices --provider xai` 列出
    - 離線備援語音：`ara`、`eve`、`leo`、`rex`、`sal`
    - 預設語音：`eve`
    - 即使帳戶的自訂語音 ID 不在內建目錄回應中，也會予以轉送
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 代碼或 `auto`
    - 速度：供應商原生速度覆寫
    - 不支援原生 Opus 語音訊息格式

    若要將 xAI 設為預設 TTS 供應商：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批次 `/v1/tts` 端點進行緩衝合成，
    使用已驗證的 `/v1/tts/voices` 目錄探索，並使用原生
    `wss://api.x.ai/v1/tts` 進行串流合成。串流僅限使用
    原生 `api.x.ai` 主機，因此此路徑會拒絕自訂 `baseUrl` 值。
    它使用現有的語言、語音、編解碼器及速度控制項；取樣率與位元率則採用 xAI
    的預設值。音訊檔案合成會遵循所有已設定的編解碼器。
    語音訊息目標在串流和緩衝備援時使用 MP3，因為 xAI 的原始編解碼器
    不含編解碼器／取樣率中繼資料。串流會先傳送 `text.delta`，接著傳送
    `text.done`，接收 `audio.delta`、`audio.done` 或 `error`，並套用
    `timeoutMs` 閒置逾時；每收到一個音訊區塊都會重新計時。此功能與
    即時語音工作階段分開。請參閱 xAI 的 [串流 TTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice) 合約。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    隨附的 `xai` 外掛會透過 OpenClaw 的
    媒體理解轉錄介面註冊批次語音轉文字功能。

    - 端點：xAI REST `/v1/stt`
    - 輸入路徑：多部分音訊檔案上傳
    - 模型選擇：xAI 會在內部選擇轉錄模型；
      此端點沒有模型選擇器
    - 用於所有讀取 `tools.media.audio` 的傳入音訊轉錄位置，
      包括 Discord 語音頻道片段及頻道音訊附件

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

    語言可透過共用音訊媒體設定或每次呼叫的
    轉錄要求提供。共用 OpenClaw 介面接受提示內容，但 xAI REST STT
    整合只會轉送檔案及語言，因為只有這兩者對應目前公開的 xAI 端點。

  </Accordion>

  <Accordion title="串流語音轉文字">
    隨附的 `xai` 外掛也會註冊即時轉錄供應商，
    用於即時語音通話音訊。

    - 端點：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設端點偵測：`800ms`
    - 暫時轉錄：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 mu-law 音訊影格，因此
    xAI 供應商會直接轉送這些影格而不進行轉碼：

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

    供應商擁有的設定位於
    `plugins.entries.voice-call.config.streaming.providers.xai`。支援的
    鍵包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 及 `language`。

    <Note>
    此串流供應商用於 Voice Call 的即時轉錄路徑。
    Discord 語音會錄製短片段，改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音（Talk）">
    隨附的 `xai` 外掛會透過共用的 `registerRealtimeVoiceProvider` 合約，
    為 Talk 模式註冊 Grok Voice Agent 即時工作階段。

    - 端點：`wss://api.x.ai/v1/realtime?model=<voice-model>`
    - 預設模型：`grok-voice-latest`
    - 預設語音：`eve`
    - 傳輸方式：`gateway-relay`（iOS、Android 及 Control UI 中繼路徑）
    - 音訊：PCM16 24 kHz 或 G.711 µ-law 8 kHz
    - 插話：xAI 伺服器 VAD 會中斷回應；OpenClaw 會清除佇列中的播放內容，
      並截斷尚未播放的供應商歷程記錄

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
              // 只有在可接受供應商端工作階段重播時才選擇啟用。
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    當 Voice Call 或共用即時選擇器重複使用相同的供應商對應表時，
    供應商擁有的設定也會從
    `plugins.entries.voice-call.config.realtime.providers.xai` 解析。支援的鍵包括
    `apiKey`、`baseUrl`、`model`、`voice`、`vadThreshold`、`silenceDurationMs`、
    `prefixPaddingMs`、`reasoningEffort` 及 `sessionResumption`。
    `reasoningEffort` 僅接受 `high` 或 `none`，與 xAI Voice Agent API 相符。

    xAI 的伺服器 VAD 一律會建立回應並處理音訊中斷。
    請使用 `consultRouting: "provider-direct"`；xAI Voice Agent 通訊協定不支援
    強制轉錄路由或停用輸入音訊中斷。

    <Note>
    xAI OAuth 或 `XAI_API_KEY` 可驗證即時語音。目前此供應商介面尚不包含
    瀏覽器擁有的 WebRTC；請在原生節點上使用閘道中繼 Talk，或使用
    Control UI 中繼路徑。
    </Note>

    <Note>
    `sessionResumption` 預設為 `false`。設為 `true` 時，OpenClaw 會要求
    xAI 保留足以在重新連線後繼續同一段對話的工作階段狀態，接著使用傳回的
    對話 ID 重新連線。如果無法接受供應商端重播／保留，請維持停用；
    中斷的通訊端之後將採取封閉式失敗，而不會在未告知的情況下開始新的對話。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    隨附的 xAI 外掛會將 `x_search` 公開為 OpenClaw 工具，
    以便透過 Grok 搜尋 X（前身為 Twitter）的內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵               | 類型    | 預設值                   | 說明                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | 布林值 | xAI 模型會自動啟用  | 停用，或為已知的非 xAI 供應商選擇啟用 |
    | `model`           | 字串  | `grok-4.3`                | 用於 x_search 要求的模型                 |
    | `baseUrl`         | 字串  | -                         | 覆寫 xAI Responses 基底 URL                  |
    | `inlineCitations` | 布林值 | -                         | 在結果中包含行內引用              |
    | `maxTurns`        | 數字  | -                         | 最大對話輪數                       |
    | `timeoutSeconds`  | 數字  | `30`                      | 要求逾時秒數                       |
    | `cacheTtlMinutes` | 數字  | `15`                      | 快取存留時間（分鐘）                    |

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
    隨附的 xAI 外掛會將 `code_execution` 公開為 OpenClaw 工具，
    用於在 xAI 的沙箱環境中遠端執行程式碼。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵              | 類型    | 預設值                  | 說明                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | 布林值 | xAI 模型會自動啟用 | 停用，或為已知的非 xAI 供應商選擇啟用 |
    | `model`          | 字串  | `grok-4.3`               | 用於程式碼執行要求的模型           |
    | `maxTurns`       | 數字  | -                        | 最大對話輪數                       |
    | `timeoutSeconds` | 數字  | `30`                     | 要求逾時秒數                       |

    <Note>
    這是在遠端 xAI 沙箱中執行，而不是本機 [`exec`](/zh-TW/tools/exec)。
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
    - xAI 驗證可使用 API 金鑰、環境變數、外掛設定備援，或透過符合資格的 xAI 帳戶使用 OAuth。OAuth 使用裝置代碼驗證，不需要 localhost 回呼。xAI 會決定哪些帳戶可取得 OAuth API 權杖；即使 OpenClaw 不需要 Grok Build 應用程式，同意頁面仍可能顯示 Grok Build。
    - OpenClaw 目前未公開 xAI 多代理模型系列。xAI 透過 Responses API 提供這些模型，但它們不接受 OpenClaw 共用代理迴圈所使用的用戶端工具或自訂工具。請參閱
      [xAI 多代理限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 語音目前僅公開閘道中繼的 Talk 傳輸。Control UI 尚未串接由瀏覽器管理的供應商 WebSocket 工作階段。
    - 在共用 `image_generate` 工具具備相應的跨供應商控制項之前，不會公開 xAI 圖片 `quality`、圖片 `mask`，以及其他僅限原生使用的長寬比。
  </Accordion>

  <Accordion title="進階說明">
    - OpenClaw 會在共用執行器路徑上，自動套用 xAI 專用的工具結構描述與工具呼叫相容性修正。
    - 原生 xAI 請求預設為 `tool_stream: true`。將
      `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false`
      即可停用。
    - 隨附的 xAI 包裝器會在傳送原生 xAI 請求前，移除不支援的 contains-count 結構描述界限，以及不支援的推理 *effort* 承載資料鍵。Grok 4.5 支援低、中、高 effort（預設為高）。Grok 4.3 支援無、低、中、高 effort（預設為低）。其他具推理能力的 xAI 模型不提供可設定的 effort 控制項，但仍會要求
      `include: ["reasoning.encrypted_content"]`，以便在後續輪次重播先前加密的推理內容。
    - `web_search`、`x_search` 和 `code_execution` 會以 OpenClaw 工具的形式公開。OpenClaw 只會將各工具所需的特定 xAI 內建工具附加至該工具的請求，而不會在每個聊天輪次附加所有原生工具。
    - Grok `web_search` 會讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 會讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      備援至 Grok 網頁搜尋的基礎 URL。
    - `x_search` 和 `code_execution` 由隨附的 xAI 外掛管理，而非硬編碼於核心模型執行階段。
    - `code_execution` 是遠端 xAI 沙箱執行，而非本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## 即時測試

xAI 媒體路徑由單元測試和選擇性啟用的即時測試套件涵蓋。執行即時探測前，請在處理程序環境中匯出
`XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

供應商專用的即時測試檔案會合成一般 TTS 與適合電話使用的 PCM TTS、透過 xAI 批次 STT 轉錄音訊、透過 xAI 即時 STT 串流相同的 PCM、產生文字轉圖片輸出，並編輯參考圖片。共用圖片即時測試檔案會透過 OpenClaw 的執行階段選擇、備援、正規化及媒體附件路徑，驗證相同的 xAI 供應商。選擇性啟用的 Video 1.5 案例會提交一張以 1080P 產生的首格圖片，並驗證已完成影片的下載。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="所有供應商" href="/zh-TW/providers/index" icon="grid-2">
    更廣泛的供應商概覽。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與修正方式。
  </Card>
</CardGroup>
