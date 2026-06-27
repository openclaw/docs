---
read_when:
    - 您想在 OpenClaw 中使用 Grok 模型
    - 你正在設定 xAI 驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-06-27T19:58:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附一個用於 Grok 模型的 `xai` 供應商外掛。對大多數
使用者而言，建議路徑是使用符合資格的 SuperGrok 或 X Premium
訂閱進行 Grok OAuth。OpenClaw 維持本機優先：閘道、設定、路由與
工具在你的機器上執行，而 Grok 模型請求會透過 xAI 驗證並傳送到 xAI 的 API。

OAuth 不需要 xAI API 金鑰，也不需要 Grok Build
應用程式。xAI 仍可能在同意畫面顯示 Grok Build，因為 OpenClaw 使用
xAI 的共用 OAuth 用戶端。

## 選擇你的設定路徑

使用符合你 OpenClaw 安裝狀態的路徑：

<Steps>
  <Step title="新的 OpenClaw 安裝">
    當你在設定新的本機閘道時，執行含 daemon 安裝的 onboarding，
    然後在模型/驗證步驟中選擇 xAI/Grok OAuth 選項：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或透過 SSH 時，直接選擇 xAI OAuth；OpenClaw 使用裝置代碼
    驗證，不需要 localhost callback：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth 不需要 xAI API 金鑰。OpenClaw 不需要 Grok
    Build 應用程式。xAI 仍可能將同意應用程式標示為 Grok Build，因為
    OpenClaw 使用 xAI 的共用 OAuth 用戶端。

  </Step>
  <Step title="現有 OpenClaw 安裝">
    如果 OpenClaw 已經設定好，只要登入 xAI。不要只是為了連接 Grok
    而重新執行完整 onboarding 或重新安裝 daemon：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    若要在登入後將 Grok 設為預設模型，請另外套用：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有在你刻意想變更閘道、daemon、頻道、工作區或其他設定選項時，
    才重新執行完整 onboarding。

  </Step>
  <Step title="API 金鑰路徑">
    API 金鑰設定仍適用於 xAI Console 金鑰，以及需要金鑰支援供應商設定的
    媒體介面：

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
OpenClaw 使用 xAI Responses API 作為隨附的 xAI 傳輸層。來自
`openclaw models auth login --provider xai --method oauth` 或
`openclaw models auth login --provider xai --method api-key` 的相同
憑證，也可以驅動一級的
`web_search`、`x_search`、遠端 `code_execution`，以及 xAI 圖片/影片生成。
語音與轉錄目前需要 `XAI_API_KEY` 或供應商設定。
Grok 支援的 `web_search` 會優先使用 xAI OAuth，並回退到 `XAI_API_KEY` 或
外掛網頁搜尋設定。
如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下儲存 xAI 金鑰，
隨附的 xAI 模型供應商也會重用該金鑰作為回退。
將 `plugins.entries.xai.config.webSearch.baseUrl` 設定為透過操作者 xAI Responses proxy
路由 Grok `web_search`，並預設也路由 `x_search`。
`code_execution` 調校位於 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## OAuth 疑難排解

- 對於 SSH、Docker、VPS 或其他遠端設定，請使用
  `openclaw models auth login --provider xai --method oauth`；xAI OAuth 使用
  裝置代碼驗證，而不是 localhost callback。
- 如果登入成功但 Grok 不是預設模型，請執行
  `openclaw models set xai/grok-4.3`。
- 若要檢查已儲存的 xAI 驗證設定檔，請執行：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 決定哪些帳戶可接收 OAuth API token。如果帳戶不符合資格，
  請嘗試 API 金鑰路徑，或在 xAI 端檢查訂閱。

<Tip>
從 SSH、Docker 或 VPS 登入時，請使用 `xai-oauth`。OpenClaw 會印出
xAI URL 和短代碼；當遠端程序輪詢 xAI 以完成 token 交換時，
請在任一本機瀏覽器完成登入。
</Tip>

## 內建目錄

OpenClaw 內建目前的 xAI 聊天模型，在模型選擇器中依最新到最舊排序：

| 系列           | 模型 id                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

外掛仍會為現有設定向前解析較舊的 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1
Fast 與 Grok Code slug。官方 Grok Code Fast 別名會正規化為 `grok-build-0.1`；OpenClaw 不再於可選目錄中顯示其他已停用的
上游 slug。

<Tip>
一般聊天請使用 `grok-4.3`，建置/程式碼聚焦工作負載請使用 `grok-build-0.1`，
除非你明確需要 Grok 4.20 beta 別名。
</Tip>

## OpenClaw 功能涵蓋範圍

隨附外掛會將 xAI 目前的公開 API 介面映射到 OpenClaw 的共用
供應商與工具合約。不符合共用合約的能力
（例如串流 TTS 與即時語音）不會公開；請參見下表。

| xAI 能力                   | OpenClaw 介面                            | 狀態                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型供應商                  | 是                                                                  |
| 伺服器端網頁搜尋           | `web_search` 供應商 `grok`                | 是                                                                  |
| 伺服器端 X 搜尋            | `x_search` 工具                           | 是                                                                  |
| 伺服器端程式碼執行         | `code_execution` 工具                     | 是                                                                  |
| 圖片                       | `image_generate`                          | 是                                                                  |
| 影片                       | `video_generate`                          | 是                                                                  |
| 批次文字轉語音             | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 串流 TTS                   | -                                         | 未公開；OpenClaw 的 TTS 合約會回傳完整音訊緩衝區                    |
| 批次語音轉文字             | `tools.media.audio` / 媒體理解            | 是                                                                  |
| 串流語音轉文字             | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| 即時語音                   | -                                         | 尚未公開；不同的工作階段/WebSocket 合約                             |
| 檔案 / 批次                | 僅一般模型 API 相容性                     | 不是一級 OpenClaw 工具                                              |

<Note>
OpenClaw 針對媒體生成、語音與批次轉錄使用 xAI 的 REST 圖片/影片/TTS/STT API，
針對即時語音通話轉錄使用 xAI 的串流 STT WebSocket，
並針對模型、搜尋與程式碼執行工具使用 Responses API。需要不同 OpenClaw 合約的功能，
例如即時語音工作階段，在此會記錄為上游能力，而不是隱藏外掛行為。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
會依下列方式改寫原生 xAI 請求：

| 來源模型      | 快速模式目標     |
| ------------- | ---------------- |
| `grok-3`      | `grok-3-fast`    |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`    |
| `grok-4-0709` | `grok-4-fast`    |

### 舊版相容別名

舊版別名仍會正規化為標準隨附 id：

| 舊版別名                  | 標準 id                               |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="網頁搜尋">
    隨附的 `grok` 網頁搜尋供應商會優先使用 xAI OAuth，然後回退到
    `XAI_API_KEY` 或外掛網頁搜尋金鑰：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="影片生成">
    隨附的 `xai` 外掛會透過共用
    `video_generate` 工具註冊影片生成。

    - 預設影片模型：`xai/grok-imagine-video`
    - 模式：文字轉影片、圖片轉影片、參考圖片生成、遠端
      影片編輯，以及遠端影片延伸
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 解析度：`480P`、`720P`
    - 時長：生成/圖片轉影片為 1-15 秒，使用
      `reference_image` 角色時為 1-10 秒，延伸為 2-10 秒
    - 參考圖片生成：將每張提供的圖片的 `imageRoles` 設為 `reference_image`；
      xAI 最多接受 7 張這類圖片
    - 預設操作逾時：600 秒，除非已設定 `video_generate.timeoutMs`
      或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本機影片緩衝區。影片編輯/延伸輸入請使用遠端 `http(s)` URL。
    圖片轉影片接受本機圖片緩衝區，因為 OpenClaw 可以將其編碼為 xAI 的 data URL。
    </Warning>

    若要將 xAI 用作預設影片供應商：

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
    請參閱 [影片生成](/zh-TW/tools/video-generation) 以了解共用工具參數、
    供應商選擇與容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="圖片生成">
    隨附的 `xai` 外掛會透過共用
    `image_generate` 工具註冊圖片生成。

    - 預設圖片模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文字轉圖片與參考圖片編輯
    - 參考輸入：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張圖片
    - 預設操作逾時：600 秒，除非已設定 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 會向 xAI 請求 `b64_json` 圖片回應，因此生成的媒體可透過
    一般頻道附件路徑儲存與傳送。本機參考圖片會轉換為 data URL；遠端
    `http(s)` 參考會直接傳遞。

    若要將 xAI 用作預設圖片供應商：

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
    跨供應商共用的影像控制項；不支援的原生專用旋鈕
    會刻意不透過 `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文字轉語音">
    內建的 `xai` 外掛會透過共用的 `tts`
    供應商介面註冊文字轉語音。

    - 語音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 預設語音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 代碼或 `auto`
    - 速度：供應商原生速度覆寫
    - 不支援原生 Opus 語音備忘格式

    若要將 xAI 作為預設 TTS 供應商：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批次 `/v1/tts` 端點。xAI 也提供透過 WebSocket
    的串流 TTS，但 OpenClaw 語音供應商合約目前預期在傳送回覆前
    先取得完整音訊緩衝區。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `xai` 外掛會透過 OpenClaw 的
    媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`grok-stt`
    - 端點：xAI REST `/v1/stt`
    - 輸入路徑：multipart 音訊檔案上傳
    - 在 OpenClaw 中凡是輸入音訊轉錄使用
      `tools.media.audio` 的地方都支援，包括 Discord 語音頻道片段和
      頻道音訊附件

    若要強制使用 xAI 進行輸入音訊轉錄：

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
    轉錄請求提供。共用 OpenClaw 介面會接受提示提示詞，
    但 xAI REST STT 整合只會轉送檔案、模型和
    語言，因為這些能清楚對應到目前公開的 xAI 端點。

  </Accordion>

  <Accordion title="串流語音轉文字">
    內建的 `xai` 外掛也會為即時語音通話音訊註冊
    即時轉錄供應商。

    - 端點：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設端點偵測：`800ms`
    - 暫時轉錄稿：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 µ-law 音訊影格，因此
    xAI 供應商可以直接轉送這些影格，不需要轉碼：

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
    `plugins.entries.voice-call.config.streaming.providers.xai` 之下。支援的
    鍵為 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此串流供應商用於 Voice Call 的即時轉錄路徑。
    Discord 語音目前會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    內建 xAI 外掛會將 `x_search` 作為 OpenClaw 工具公開，用於透過 Grok
    搜尋 X（前身為 Twitter）內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵                 | 類型    | 預設值             | 說明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | 啟用或停用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用於 x_search 請求的模型             |
    | `baseUrl`          | string  | -                  | xAI Responses 基底 URL 覆寫          |
    | `inlineCitations`  | boolean | -                  | 在結果中包含行內引用                 |
    | `maxTurns`         | number  | -                  | 最大對話回合數                       |
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
    內建 xAI 外掛會將 `code_execution` 作為 OpenClaw 工具公開，用於
    在 xAI 沙箱環境中進行遠端程式碼執行。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵                | 類型    | 預設值                   | 說明                                 |
    | ----------------- | ------- | ------------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true`（如果可用金鑰存在） | 啟用或停用程式碼執行               |
    | `model`           | string  | `grok-4-1-fast`          | 用於程式碼執行請求的模型            |
    | `maxTurns`        | number  | -                        | 最大對話回合數                       |
    | `timeoutSeconds`  | number  | -                        | 請求逾時秒數                         |

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
    - xAI 驗證可以使用 API 金鑰、環境變數、外掛設定備援，
      或使用符合資格 xAI 帳號的 OAuth。OAuth 使用裝置碼驗證，
      不需要 localhost 回呼。xAI 決定哪些帳號可以取得 OAuth
      API 權杖，而且同意頁面可能會顯示 Grok Build，即使 OpenClaw
      不需要 Grok Build 應用程式。
    - OpenClaw 目前未公開 xAI 多代理模型系列。xAI
      透過 Responses API 提供這些模型，但它們不接受
      OpenClaw 共用代理迴圈所使用的用戶端工具或自訂工具。請參閱
      [xAI 多代理限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 語音尚未註冊為 OpenClaw 供應商。它
      需要與批次 STT 或串流轉錄不同的雙向語音工作階段合約。
    - xAI 影像 `quality`、影像 `mask`，以及額外的原生專用長寬比，
      在共用 `image_generate` 工具具備對應的
      跨供應商控制項之前，不會被公開。
  </Accordion>

  <Accordion title="進階注意事項">
    - OpenClaw 會在共用執行器路徑上，自動套用 xAI 專用的工具結構描述和工具呼叫相容性修正。
    - 原生 xAI 請求預設為 `tool_stream: true`。將
      `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false`
      即可停用。
    - 內建 xAI 包裝器會在傳送原生 xAI 請求前，移除不支援的 strict 工具結構描述旗標和
      reasoning *effort* 承載鍵。只有
      `grok-4.3` / `grok-4.3-*` 宣告可設定 reasoning effort；所有
      其他具備 reasoning 能力的 xAI 模型仍會請求
      `include: ["reasoning.encrypted_content"]`，讓先前加密的 reasoning
      可在後續回合中重播。
    - `web_search`、`x_search` 和 `code_execution` 會作為 OpenClaw
      工具公開。OpenClaw 會在每個工具請求內啟用所需的特定 xAI 內建功能，
      而不是將所有原生工具附加到每個聊天回合。
    - Grok `web_search` 會讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 會讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      備援到 Grok web-search 基底 URL。
    - `x_search` 和 `code_execution` 由內建 xAI 外掛擁有，
      而不是硬編碼到核心模型執行階段中。
    - `code_execution` 是遠端 xAI 沙箱執行，不是本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## 即時測試

xAI 媒體路徑由單元測試和可選啟用的即時套件涵蓋。執行即時探測前，
請在程序環境中匯出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

供應商專用的即時檔案會合成一般 TTS、適合電話的 PCM
TTS、透過 xAI 批次 STT 轉錄音訊、將相同 PCM 透過 xAI
即時 STT 串流、產生文字轉影像輸出，並編輯參考影像。共用影像即時檔案
會透過 OpenClaw 的執行階段選取、備援、正規化和媒體附件路徑，
驗證相同的 xAI 供應商。

## 相關

<CardGroup cols={2}>
  <Card title="模型選取" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和供應商選取。
  </Card>
  <Card title="所有供應商" href="/zh-TW/providers/index" icon="grid-2">
    更廣泛的供應商概觀。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題和修正。
  </Card>
</CardGroup>
