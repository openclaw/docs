---
read_when:
    - 您想在 OpenClaw 中使用 Grok 模型
    - 您正在設定 xAI 身分驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-05-06T09:18:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附一個用於 Grok 模型的 `xai` provider plugin。

## 開始使用

<Steps>
  <Step title="Create an API key">
    在 [xAI 主控台](https://console.x.ai/)中建立 API key。
  </Step>
  <Step title="Set your API key">
    設定 `XAI_API_KEY`，或執行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作為隨附的 xAI 傳輸層。同一個
`XAI_API_KEY` 也可以驅動由 Grok 支援的 `web_search`、一級 `x_search`
以及遠端 `code_execution`。
如果你將 xAI 金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey`，
隨附的 xAI 模型供應器也會重用該金鑰作為 fallback。
設定 `plugins.entries.xai.config.webSearch.baseUrl`，即可透過 operator xAI Responses proxy 路由 Grok `web_search`
以及預設的 `x_search`。
`code_execution` 調校位於 `plugins.entries.xai.config.codeExecution` 底下。
</Note>

## 內建型錄

OpenClaw 內建包含下列 xAI 模型系列：

| 系列           | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

當較新的 `grok-4*` 和 `grok-code-fast*` id 遵循相同 API 形狀時，此 Plugin
也會向前解析它們。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast`，以及 `grok-4.20-beta-*`
變體，是隨附型錄中目前具備影像能力的 Grok refs。
</Tip>

## OpenClaw 功能涵蓋範圍

隨附的 Plugin 會將 xAI 目前的公開 API surface 對應到 OpenClaw 的共用
provider 與工具合約。不符合共用合約的能力
（例如串流 TTS 和即時語音）不會公開 - 請參閱
下表。

| xAI 能力                   | OpenClaw surface                          | 狀態                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` model provider              | 是                                                                  |
| 伺服器端網頁搜尋           | `web_search` provider `grok`              | 是                                                                  |
| 伺服器端 X 搜尋            | `x_search` tool                           | 是                                                                  |
| 伺服器端程式碼執行         | `code_execution` tool                     | 是                                                                  |
| 圖片                       | `image_generate`                          | 是                                                                  |
| 影片                       | `video_generate`                          | 是                                                                  |
| 批次文字轉語音             | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 串流 TTS                   | -                                         | 未公開；OpenClaw 的 TTS 合約會回傳完整音訊緩衝區                   |
| 批次語音轉文字             | `tools.media.audio` / media understanding | 是                                                                  |
| 串流語音轉文字             | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| 即時語音                   | -                                         | 尚未公開；使用不同的 session/WebSocket 合約                         |
| 檔案 / 批次                | 僅一般模型 API 相容性                     | 不是一級 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST image/video/TTS/STT API 進行媒體生成、
語音與批次轉錄，使用 xAI 的 streaming STT WebSocket 進行即時
語音通話轉錄，並使用 Responses API 提供模型、搜尋與
程式碼執行工具。需要不同 OpenClaw 合約的功能，例如
Realtime voice sessions，會在此記錄為上游能力，而不是隱藏的 Plugin 行為。
</Note>

### 快速模式對應

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
會依下列方式重寫原生 xAI 請求：

| 來源模型      | 快速模式目標       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 舊版相容別名

舊版別名仍會正規化為標準隨附 id：

| 舊版別名                  | 標準 id                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web search">
    隨附的 `grok` web-search provider 也會使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    隨附的 `xai` Plugin 會透過共用
    `video_generate` 工具註冊影片生成。

    - 預設影片模型：`xai/grok-imagine-video`
    - 模式：文字轉影片、圖片轉影片、參考圖片生成、遠端
      影片編輯，以及遠端影片延伸
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 解析度：`480P`、`720P`
    - 時長：生成/圖片轉影片為 1-15 秒，
      使用 `reference_image` roles 時為 1-10 秒，延伸為 2-10 秒
    - 參考圖片生成：將每張提供的圖片的 `imageRoles` 設為 `reference_image`；
      xAI 最多接受 7 張此類圖片

    <Warning>
    不接受本機影片緩衝區。請對影片編輯/延伸輸入使用遠端 `http(s)` URL。
    圖片轉影片接受本機圖片緩衝區，因為 OpenClaw 可以將其編碼為 xAI 的 data URL。
    </Warning>

    若要使用 xAI 作為預設影片供應器：

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
    供應器選擇與 failover 行為。
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    隨附的 `xai` Plugin 會透過共用
    `image_generate` 工具註冊圖片生成。

    - 預設圖片模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-pro`
    - 模式：文字轉圖片與參考圖片編輯
    - 參考輸入：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張圖片

    OpenClaw 會向 xAI 要求 `b64_json` 圖片回應，讓生成的媒體可以透過
    一般的頻道附件路徑儲存與傳送。本機
    參考圖片會轉換為 data URL；遠端 `http(s)` 參考會
    直接傳遞。

    若要使用 xAI 作為預設圖片供應器：

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
    共用的跨供應器圖片控制項；不支援的原生專用旋鈕
    會刻意不透過 `image_generate` 公開。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    隨附的 `xai` Plugin 會透過共用 `tts`
    provider surface 註冊文字轉語音。

    - 語音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 預設語音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 code 或 `auto`
    - 速度：供應器原生速度覆寫
    - 不支援原生 Opus 語音備註格式

    若要使用 xAI 作為預設 TTS 供應器：

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
    OpenClaw 使用 xAI 的批次 `/v1/tts` endpoint。xAI 也提供透過 WebSocket
    的串流 TTS，但 OpenClaw 語音供應器合約目前預期在回覆傳送前
    取得完整音訊緩衝區。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    隨附的 `xai` Plugin 會透過 OpenClaw 的
    媒體理解轉錄 surface 註冊批次語音轉文字。

    - 預設模型：`grok-stt`
    - Endpoint：xAI REST `/v1/stt`
    - 輸入路徑：multipart audio file upload
    - 只要 OpenClaw 的傳入音訊轉錄使用
      `tools.media.audio`，即可受到支援，包括 Discord voice-channel segments 和
      channel audio attachments

    若要強制對傳入音訊轉錄使用 xAI：

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
    surface 會接受 prompt hints，但 xAI REST STT 整合只會轉送檔案、模型與
    語言，因為這些能清楚對應到目前公開的 xAI endpoint。

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    隨附的 `xai` Plugin 也會為即時語音通話音訊
    註冊 realtime transcription provider。

    - Endpoint：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設 endpointing：`800ms`
    - 臨時轉錄稿：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 µ-law 音訊影格，因此
    xAI 供應器可以直接轉送這些影格，無需轉碼：

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
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支援的
    鍵為 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此串流 Provider 用於語音通話的即時轉錄路徑。
    Discord 語音目前會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    內建的 xAI Plugin 會將 `x_search` 作為 OpenClaw 工具公開，用於透過 Grok 搜尋
    X（前 Twitter）內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵                 | 類型    | 預設值             | 說明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | 啟用或停用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用於 x_search 請求的模型             |
    | `baseUrl`          | string  | -                  | xAI Responses 基礎 URL 覆寫          |
    | `inlineCitations`  | boolean | -                  | 在結果中包含行內引用                 |
    | `maxTurns`         | number  | -                  | 最大對話輪次                         |
    | `timeoutSeconds`   | number  | -                  | 請求逾時秒數                         |
    | `cacheTtlMinutes`  | number  | -                  | 快取存活時間，以分鐘為單位           |

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
    內建的 xAI Plugin 會將 `code_execution` 作為 OpenClaw 工具公開，用於
    在 xAI 沙箱環境中遠端執行程式碼。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵                | 類型    | 預設值                   | 說明                             |
    | ----------------- | ------- | ------------------------ | -------------------------------- |
    | `enabled`         | boolean | `true`（如果有可用金鑰） | 啟用或停用程式碼執行             |
    | `model`           | string  | `grok-4-1-fast`          | 用於程式碼執行請求的模型         |
    | `maxTurns`        | number  | -                        | 最大對話輪次                     |
    | `timeoutSeconds`  | number  | -                        | 請求逾時秒數                     |

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
    - `grok-4.20-multi-agent-experimental-beta-0304` 不支援一般 xAI Provider 路徑，因為它需要的上游 API 介面不同於標準 OpenClaw xAI 傳輸層。
    - xAI Realtime 語音尚未註冊為 OpenClaw Provider。它需要不同於批次 STT 或串流轉錄的雙向語音工作階段合約。
    - xAI 圖片 `quality`、圖片 `mask`，以及額外僅原生支援的長寬比，在共享 `image_generate` 工具具備對應的跨 Provider 控制之前不會公開。

  </Accordion>

  <Accordion title="進階注意事項">
    - OpenClaw 會在共享執行器路徑上自動套用 xAI 專用的工具結構描述與工具呼叫相容性修正。
    - 原生 xAI 請求預設為 `tool_stream: true`。將
      `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false` 即可停用。
    - 內建的 xAI 包裝器會在傳送原生 xAI 請求前，移除不支援的嚴格工具結構描述旗標與推理承載鍵。
    - `web_search`、`x_search` 和 `code_execution` 會作為 OpenClaw 工具公開。OpenClaw 會在每個工具請求中啟用它需要的特定 xAI 內建功能，而不是將所有原生工具附加到每個聊天輪次。
    - Grok `web_search` 會讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 會讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      回退到 Grok 網頁搜尋基礎 URL。
    - `x_search` 和 `code_execution` 由內建的 xAI Plugin 擁有，而不是硬編碼到核心模型執行階段中。
    - `code_execution` 是遠端 xAI 沙箱執行，不是本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## Live testing

xAI 媒體路徑由單元測試和選用的即時測試套件涵蓋。即時
命令會先從你的登入 shell 載入祕密，包括 `~/.profile`，再
探測 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Provider 專用的即時檔案會合成一般 TTS、適合電話的 PCM
TTS、透過 xAI 批次 STT 轉錄音訊、透過 xAI 即時 STT 串流傳送同一份 PCM、
產生文字轉圖片輸出，並編輯參考圖片。共享圖片即時檔案會透過 OpenClaw 的
執行階段選擇、回退、正規化與媒體附件路徑，驗證同一個 xAI Provider。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 Provider、模型參照與容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共享影片工具參數與 Provider 選擇。
  </Card>
  <Card title="所有 Provider" href="/zh-TW/providers/index" icon="grid-2">
    更完整的 Provider 概覽。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與修正。
  </Card>
</CardGroup>
