---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在設定 xAI 身分驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-05-02T21:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附一個用於 Grok 模型的 `xai` 提供者 Plugin。

## 開始使用

<Steps>
  <Step title="建立 API 金鑰">
    在 [xAI 主控台](https://console.x.ai/)建立 API 金鑰。
  </Step>
  <Step title="設定你的 API 金鑰">
    設定 `XAI_API_KEY`，或執行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw 使用 xAI Responses API 作為隨附的 xAI 傳輸。同一個
`XAI_API_KEY` 也可以驅動 Grok 後端的 `web_search`、一級 `x_search`
以及遠端 `code_execution`。
如果你將 xAI 金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，
隨附的 xAI 模型提供者也會重用該金鑰作為後備。
設定 `plugins.entries.xai.config.webSearch.baseUrl`，可透過操作者的 xAI Responses 代理路由 Grok `web_search`
以及預設情況下的 `x_search`。
`code_execution` 調校位於 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 內建目錄

OpenClaw 預設包含下列 xAI 模型系列：

| 系列           | 模型 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

當較新的 `grok-4*` 和 `grok-code-fast*` ID 遵循相同 API 形狀時，
Plugin 也會向前解析這些 ID。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast` 以及 `grok-4.20-beta-*`
變體，是隨附目錄中目前支援影像的 Grok 參照。
</Tip>

## OpenClaw 功能涵蓋範圍

隨附的 Plugin 會將 xAI 目前的公開 API 表面對應到 OpenClaw 的共用
提供者與工具合約。不符合共用合約的功能
（例如串流 TTS 和即時語音）不會公開，請參閱
下表。

| xAI 功能                   | OpenClaw 表面                              | 狀態                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供者                  | 是                                                                  |
| 伺服器端網頁搜尋           | `web_search` 提供者 `grok`                | 是                                                                  |
| 伺服器端 X 搜尋            | `x_search` 工具                           | 是                                                                  |
| 伺服器端程式碼執行         | `code_execution` 工具                     | 是                                                                  |
| 影像                       | `image_generate`                          | 是                                                                  |
| 影片                       | `video_generate`                          | 是                                                                  |
| 批次文字轉語音             | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 串流 TTS                   | —                                         | 未公開；OpenClaw 的 TTS 合約會回傳完整音訊緩衝區                  |
| 批次語音轉文字             | `tools.media.audio` / 媒體理解            | 是                                                                  |
| 串流語音轉文字             | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| 即時語音                   | —                                         | 尚未公開；使用不同的工作階段/WebSocket 合約                        |
| 檔案 / 批次                | 僅限通用模型 API 相容性                   | 不是一級 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 影像/影片/TTS/STT API 進行媒體生成、
語音與批次轉錄，使用 xAI 的串流 STT WebSocket 進行即時
語音通話轉錄，並使用 Responses API 提供模型、搜尋和
程式碼執行工具。需要不同 OpenClaw 合約的功能，例如
即時語音工作階段，會在這裡作為上游能力記錄，
而不是隱藏的 Plugin 行為。
</Note>

### 快速模式對應

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
會將原生 xAI 請求重寫如下：

| 來源模型      | 快速模式目標       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 舊版相容別名

舊版別名仍會正規化為標準隨附 ID：

| 舊版別名                  | 標準 ID                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="網頁搜尋">
    隨附的 `grok` 網頁搜尋提供者也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="影片生成">
    隨附的 `xai` Plugin 會透過共用的
    `video_generate` 工具註冊影片生成。

    - 預設影片模型：`xai/grok-imagine-video`
    - 模式：文字轉影片、影像轉影片、參照影像生成、遠端
      影片編輯，以及遠端影片延長
    - 外觀比例：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 解析度：`480P`、`720P`
    - 時長：生成/影像轉影片為 1-15 秒；使用
      `reference_image` 角色時為 1-10 秒；延長為 2-10 秒
    - 參照影像生成：為每張提供的影像將 `imageRoles` 設為 `reference_image`；
      xAI 最多接受 7 張這類影像

    <Warning>
    不接受本機影片緩衝區。影片編輯/延長輸入請使用遠端 `http(s)` URL。
    影像轉影片接受本機影像緩衝區，因為
    OpenClaw 可以將其編碼為給 xAI 使用的資料 URL。
    </Warning>

    若要使用 xAI 作為預設影片提供者：

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
    請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、
    提供者選擇與容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="影像生成">
    隨附的 `xai` Plugin 會透過共用的
    `image_generate` 工具註冊影像生成。

    - 預設影像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-pro`
    - 模式：文字轉影像與參照影像編輯
    - 參照輸入：一個 `image` 或最多五個 `images`
    - 外觀比例：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張影像

    OpenClaw 會向 xAI 要求 `b64_json` 影像回應，以便生成的媒體能夠
    透過一般頻道附件路徑儲存與傳遞。本機
    參照影像會轉換為資料 URL；遠端 `http(s)` 參照會
    原樣傳遞。

    若要使用 xAI 作為預設影像提供者：

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
    xAI 也記錄了 `quality`、`mask`、`user`，以及其他原生比例，
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前只轉送
    共用的跨提供者影像控制；不支援的僅原生旋鈕
    會刻意不透過 `image_generate` 公開。
    </Note>

  </Accordion>

  <Accordion title="文字轉語音">
    隨附的 `xai` Plugin 會透過共用的 `tts`
    提供者表面註冊文字轉語音。

    - 聲音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 預設聲音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 代碼或 `auto`
    - 速度：提供者原生速度覆寫
    - 不支援原生 Opus 語音訊息格式

    若要使用 xAI 作為預設 TTS 提供者：

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
    OpenClaw 使用 xAI 的批次 `/v1/tts` 端點。xAI 也提供透過 WebSocket
    的串流 TTS，但 OpenClaw 語音提供者合約目前預期在傳遞回覆前
    先取得完整音訊緩衝區。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    隨附的 `xai` Plugin 會透過 OpenClaw 的
    媒體理解轉錄表面註冊批次語音轉文字。

    - 預設模型：`grok-stt`
    - 端點：xAI REST `/v1/stt`
    - 輸入路徑：multipart 音訊檔案上傳
    - OpenClaw 中任何使用 `tools.media.audio` 的入站音訊轉錄位置皆支援，
      包括 Discord 語音頻道片段和
      頻道音訊附件

    若要強制 xAI 用於入站音訊轉錄：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    語言可以透過共用音訊媒體設定或每次呼叫的
    轉錄請求提供。共用 OpenClaw
    表面接受提示線索，但 xAI REST STT 整合只會轉送檔案、模型與
    語言，因為這些能清楚對應到目前公開的 xAI 端點。

  </Accordion>

  <Accordion title="串流語音轉文字">
    隨附的 `xai` Plugin 也會為即時語音通話音訊
    註冊即時轉錄提供者。

    - 端點：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設端點偵測：`800ms`
    - 中繼轉錄稿：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 µ-law 音訊影格，因此
    xAI 提供者可以直接轉送這些影格，無需轉碼：

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

    Provider 擁有的設定位於
    `plugins.entries.voice-call.config.streaming.providers.xai` 底下。支援的
    鍵為 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此串流供應器用於 Voice Call 的即時轉錄路徑。
    Discord 語音目前會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    內建的 xAI Plugin 會將 `x_search` 公開為 OpenClaw 工具，用於透過 Grok 搜尋
    X（前 Twitter）內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵                 | 類型    | 預設值             | 說明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | 啟用或停用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用於 x_search 請求的模型             |
    | `baseUrl`          | string  | —                  | xAI Responses base URL 覆寫          |
    | `inlineCitations`  | boolean | —                  | 在結果中包含行內引用                 |
    | `maxTurns`         | number  | —                  | 最大對話輪次                         |
    | `timeoutSeconds`   | number  | —                  | 請求逾時秒數                         |
    | `cacheTtlMinutes`  | number  | —                  | 快取存活時間，以分鐘為單位           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    內建的 xAI Plugin 會將 `code_execution` 公開為 OpenClaw 工具，用於在 xAI
    沙箱環境中遠端執行程式碼。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵                | 類型    | 預設值             | 說明                                   |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true`（若有可用金鑰） | 啟用或停用程式碼執行              |
    | `model`           | string  | `grok-4-1-fast`    | 用於程式碼執行請求的模型               |
    | `maxTurns`        | number  | —                  | 最大對話輪次                           |
    | `timeoutSeconds`  | number  | —                  | 請求逾時秒數                           |

    <Note>
    這是遠端 xAI 沙箱執行，不是本機 [`exec`](/zh-TW/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - 目前驗證僅支援 API 金鑰。OpenClaw 尚未提供 xAI OAuth 或裝置碼流程。
    - 一般 xAI 供應器路徑不支援 `grok-4.20-multi-agent-experimental-beta-0304`，因為它需要與標準 OpenClaw xAI 傳輸不同的上游 API 介面。
    - xAI Realtime 語音尚未註冊為 OpenClaw 供應器。它需要與批次 STT 或串流轉錄不同的雙向語音工作階段合約。
    - xAI 圖片 `quality`、圖片 `mask`，以及額外僅限原生的長寬比，在共用 `image_generate` 工具具備對應的跨供應器控制之前，不會公開。
  </Accordion>

  <Accordion title="進階備註">
    - OpenClaw 會在共用執行器路徑上自動套用 xAI 專屬的工具結構描述和工具呼叫相容性修正。
    - 原生 xAI 請求預設為 `tool_stream: true`。將 `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false` 可停用它。
    - 內建的 xAI 包裝器會在傳送原生 xAI 請求前，移除不支援的嚴格工具結構描述旗標和推理酬載鍵。
    - `web_search`、`x_search` 和 `code_execution` 會公開為 OpenClaw 工具。OpenClaw 會在每個工具請求中啟用它所需的特定 xAI 內建功能，而不是將所有原生工具附加到每個聊天輪次。
    - Grok `web_search` 讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      回退到 Grok 網頁搜尋 base URL。
    - `x_search` 和 `code_execution` 由內建的 xAI Plugin 擁有，而不是硬編碼到核心模型執行階段。
    - `code_execution` 是遠端 xAI 沙箱執行，不是本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## 即時測試

xAI 媒體路徑由單元測試和可選擇啟用的即時套件涵蓋。即時
命令會先從你的登入 shell 載入秘密，包括 `~/.profile`，再
探測 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

供應器專屬的即時檔案會合成一般 TTS、適合電話語音的 PCM
TTS，透過 xAI 批次 STT 轉錄音訊，將相同 PCM 串流送入 xAI
即時 STT，產生文字轉圖片輸出，並編輯參考圖片。
共用圖片即時檔案會透過 OpenClaw 的
執行階段選取、回退、正規化和媒體附件路徑，驗證相同的 xAI 供應器。

## 相關

<CardGroup cols={2}>
  <Card title="模型選取" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應器、模型參照和容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和供應器選取。
  </Card>
  <Card title="所有供應器" href="/zh-TW/providers/index" icon="grid-2">
    更廣泛的供應器概觀。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與修正。
  </Card>
</CardGroup>
