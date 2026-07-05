---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在設定 xAI 身分驗證或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-05T11:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9dedad8793a7c54a4f46371e72095ff70e74886fc05d7321035bd09cadbf0efd
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 隨附一個用於 Grok 模型的 `xai` 提供者外掛。建議路徑是使用符合資格的 SuperGrok 或 X Premium 訂閱搭配 Grok OAuth。閘道、設定、路由和工具都保留在本機；只有 Grok 請求會送往 xAI 的 API。

OAuth 不需要 xAI API 金鑰或 Grok Build 應用程式。xAI 仍可能在同意畫面顯示 Grok Build，因為 OpenClaw 使用 xAI 的共用 OAuth 用戶端。

## 設定

<Steps>
  <Step title="New install">
    使用 daemon 安裝執行上線流程，然後在模型/驗證步驟選擇 xAI/Grok OAuth：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或透過 SSH 時，請直接選取 xAI OAuth；它使用裝置碼驗證，不需要 localhost 回呼：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Existing install">
    只登入 xAI；不要只是為了連接 Grok 而重新執行完整上線流程：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    另外將 Grok 套用為預設模型：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有在你有意變更閘道、daemon、頻道、工作區或其他設定選項時，才重新執行完整上線流程。

  </Step>
  <Step title="API-key path">
    API 金鑰設定仍適用於 xAI Console 金鑰，以及需要金鑰支援提供者設定的媒體介面：

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw 使用 xAI Responses API 作為隨附的 xAI 傳輸。來自 `openclaw models auth login --provider xai --method oauth` 或 `--method api-key` 的相同憑證，也會驅動 `web_search`（提供者 ID `grok`）、`x_search`、`code_execution`、語音/轉錄，以及 xAI 圖像/影片生成。如果你將 xAI 金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，隨附的 xAI 模型提供者也會將它作為備援重複使用。
</Note>

## OAuth 疑難排解

- 對於 SSH、Docker、VPS 或其他遠端設定，請使用
  `openclaw models auth login --provider xai --method oauth`；它使用
  裝置碼驗證，而不是 localhost 回呼。
- 如果登入成功但 Grok 不是預設模型，請執行
  `openclaw models set xai/grok-4.3`。
- 檢查已儲存的 xAI 驗證設定檔：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 會決定哪些帳戶可以接收 OAuth API 權杖。如果帳戶不符合資格，請使用 API 金鑰路徑，或在 xAI 端檢查訂閱。

<Tip>
從 SSH、Docker 或 VPS 登入時，請使用 `xai-oauth`。OpenClaw 會列印 URL 和短代碼；在遠端程序輪詢 xAI 以完成權杖交換時，於任何本機瀏覽器完成登入。
</Tip>

## 內建目錄

模型選擇器中的可選 ID。外掛仍會解析較舊的 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code ID，以支援現有設定；請參閱[舊版相容性別名](#legacy-compatibility-aliases)。

| 系列           | 模型 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

<Tip>
除非你需要 Grok 4.20 beta 別名，否則一般聊天請使用 `grok-4.3`，建置/程式碼導向工作負載請使用 `grok-build-0.1`。
</Tip>

## 功能涵蓋範圍

隨附外掛會將 xAI 目前的公開 API 介面對應到 OpenClaw 的共用提供者與工具合約。不符合共用合約的功能，例如串流 TTS 和即時語音，不會公開。

| xAI 功能                    | OpenClaw 介面                           | 狀態                                                            |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供者                | 是                                                                 |
| 伺服器端網頁搜尋           | `web_search` 提供者 `grok`              | 是                                                                 |
| 伺服器端 X 搜尋            | `x_search` 工具                         | 是                                                                 |
| 伺服器端程式碼執行         | `code_execution` 工具                   | 是                                                                 |
| 圖像                       | `image_generate`                        | 是                                                                 |
| 影片                       | `video_generate`                        | 是                                                                 |
| 批次文字轉語音             | `messages.tts.provider: "xai"` / `tts`  | 是                                                                 |
| 串流 TTS                   | -                                       | 未公開；OpenClaw 的 TTS 合約會回傳完整音訊緩衝區 |
| 批次語音轉文字             | `tools.media.audio` 媒體理解            | 是                                                                 |
| 串流語音轉文字             | Voice Call `streaming.provider: "xai"`  | 是                                                                 |
| 即時語音                   | -                                       | 尚未公開；需要不同的工作階段/WebSocket 合約       |
| 檔案 / 批次                | 僅限通用模型 API 相容性                 | 不是第一級 OpenClaw 工具                                     |

<Note>
OpenClaw 會將 xAI 的 REST 圖像/影片/TTS/STT API 用於媒體生成和批次轉錄，將 xAI 的串流 STT WebSocket 用於即時語音通話轉錄，並將 Responses API 用於聊天、搜尋和程式碼執行工具。
</Note>

### 快速模式對應

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
會如下改寫原生 xAI 請求：

| 來源模型      | 快速模式目標     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 舊版相容性別名

舊版別名會正規化為標準的隨附 ID：

| 舊版別名                                                                    | 標準 ID                              |
| --------------------------------------------------------------------------- | ------------------------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`               | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`                                                     | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`                                                   | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`, `grok-4.20-experimental-beta-0304-reasoning`         | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`, `grok-4.20-experimental-beta-0304-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web search">
    隨附的 `grok` 網頁搜尋提供者會優先使用 xAI OAuth，然後備援到
    `XAI_API_KEY` 或外掛網頁搜尋金鑰：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    隨附的 `xai` 外掛會透過共用的 `video_generate` 工具註冊影片生成。

    - 預設影片模型：`xai/grok-imagine-video`
    - 模式：文字轉影片、圖像轉影片、參考圖像生成、遠端影片編輯，以及遠端影片延伸
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 解析度：`480P`、`720P`
    - 時長：生成/圖像轉影片為 1-15 秒，使用 `reference_image` 角色時為 1-10 秒，延伸為 2-10 秒
    - 參考圖像生成：為每張提供的圖像將 `imageRoles` 設為 `reference_image`；xAI 最多接受 7 張這類圖像
    - 預設操作逾時：除非設定 `video_generate.timeoutMs`
      或 `agents.defaults.videoGenerationModel.timeoutMs`，否則為 600 秒

    <Warning>
    不接受本機影片緩衝區。影片編輯/延伸輸入請使用遠端 `http(s)` URL。圖像轉影片接受本機圖像緩衝區，因為 OpenClaw 會將這些緩衝區編碼為 xAI 的資料 URL。
    </Warning>

    若要將 xAI 作為預設影片提供者：

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
    請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    隨附的 `xai` 外掛會透過共用的 `image_generate` 工具註冊圖像生成。

    - 預設圖像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文字轉圖像和參考圖像編輯
    - 參考輸入：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 數量：最多 4 張圖像
    - 預設操作逾時：除非設定 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`，否則為 600 秒

    OpenClaw 會向 xAI 要求 `b64_json` 圖像回應，以便生成的媒體能透過一般頻道附件路徑儲存和傳送。本機參考圖像會轉換為資料 URL；遠端 `http(s)` 參考會原樣傳遞。

    若要將 xAI 作為預設圖像提供者：

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
    xAI 也記錄了 `quality`、`mask`、`user`，以及其他原生比例，例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前只轉送共用的跨提供者圖像控制；這些僅限原生的旋鈕不會透過 `image_generate` 公開。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    隨附的 `xai` 外掛會透過共用的 `tts` 提供者介面註冊文字轉語音。

    - 聲音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 預設聲音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 語言：BCP-47 代碼或 `auto`
    - 速度：提供者原生速度覆寫
    - 不支援原生 Opus 語音訊息格式

    若要將 xAI 作為預設 TTS 提供者：

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
    OpenClaw 使用 xAI 的批次 `/v1/tts` 端點。xAI 也透過 WebSocket 提供串流 TTS，但 OpenClaw 語音提供者合約目前預期在回覆傳送前取得完整音訊緩衝區。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    隨附的 `xai` 外掛會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`grok-stt`
    - 端點：xAI REST `/v1/stt`
    - 輸入路徑：multipart 音訊檔案上傳
    - 用於所有傳入音訊轉錄讀取 `tools.media.audio` 的地方，
      包括 Discord 語音頻道片段和頻道音訊附件

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

    語言可以透過共用音訊媒體設定或逐次呼叫的轉錄請求提供。
    提示提示詞可由共用 OpenClaw 介面接受，但 xAI REST STT 整合
    只會轉送檔案、模型和語言，因為這些項目能清楚對應到目前公開的
    xAI 端點。

  </Accordion>

  <Accordion title="串流語音轉文字">
    內建的 `xai` 外掛也會為即時語音通話音訊註冊即時轉錄提供者。

    - 端點：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 預設編碼：`mulaw`
    - 預設取樣率：`8000`
    - 預設端點偵測：`800ms`
    - 中繼轉錄稿：預設啟用

    Voice Call 的 Twilio 媒體串流會傳送 G.711 mu-law 音訊影格，因此
    xAI 提供者會直接轉送這些影格，不進行轉碼：

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

    提供者所擁有的設定位於
    `plugins.entries.voice-call.config.streaming.providers.xai`。支援的
    鍵包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    這個串流提供者適用於 Voice Call 的即時轉錄路徑。
    Discord 語音會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    內建 xAI 外掛會將 `x_search` 作為 OpenClaw 工具公開，
    用於透過 Grok 搜尋 X（前 Twitter）內容。

    設定路徑：`plugins.entries.xai.config.xSearch`

    | 鍵               | 類型    | 預設值                       | 說明                          |
    | ----------------- | ------- | ------------------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true`（若可用鍵存在）     | 啟用或停用 x_search           |
    | `model`           | string  | `grok-4-1-fast-non-reasoning` | 用於 x_search 請求的模型     |
    | `baseUrl`         | string  | -                              | xAI Responses 基底 URL 覆寫      |
    | `inlineCitations` | boolean | -                              | 在結果中包含行內引用  |
    | `maxTurns`        | number  | -                              | 最大對話輪次            |
    | `timeoutSeconds`  | number  | `30`                           | 請求逾時秒數            |
    | `cacheTtlMinutes` | number  | `15`                           | 快取存留時間，以分鐘為單位         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast-non-reasoning",
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
    內建 xAI 外掛會將 `code_execution` 作為 OpenClaw 工具公開，
    用於在 xAI 的沙盒環境中遠端執行程式碼。

    設定路徑：`plugins.entries.xai.config.codeExecution`

    | 鍵              | 類型    | 預設值                  | 說明                            |
    | ---------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`        | boolean | `true`（若可用鍵存在） | 啟用或停用程式碼執行        |
    | `model`          | string  | `grok-4-1-fast`           | 用於程式碼執行請求的模型  |
    | `maxTurns`       | number  | -                           | 最大對話輪次              |
    | `timeoutSeconds` | number  | `30`                        | 請求逾時秒數              |

    <Note>
    這是遠端 xAI 沙盒執行，不是本機 [`exec`](/zh-TW/tools/exec)。
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
    - xAI 驗證可以使用 API 金鑰、環境變數、外掛設定後援，或使用符合資格的
      xAI 帳戶進行 OAuth。OAuth 使用裝置碼驗證，不需要 localhost 回呼。
      xAI 會決定哪些帳戶可以接收 OAuth API 權杖，而且同意頁面可能會顯示
      Grok Build，即使 OpenClaw 不需要 Grok Build 應用程式。
    - OpenClaw 目前不公開 xAI 多代理模型系列。xAI 透過 Responses API
      提供這些模型，但它們不接受 OpenClaw 共用代理迴圈所使用的用戶端工具或
      自訂工具。請參閱
      [xAI 多代理限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 語音尚未註冊為 OpenClaw 提供者。它需要不同於批次 STT
      或串流轉錄的雙向語音工作階段合約。
    - xAI 圖像 `quality`、圖像 `mask` 和額外的僅原生支援長寬比，
      在共用 `image_generate` 工具具有對應的跨提供者控制項之前不會公開。
  </Accordion>

  <Accordion title="進階說明">
    - OpenClaw 會在共用 runner 路徑上自動套用 xAI 專用的工具結構描述和工具呼叫
      相容性修正。
    - 原生 xAI 請求預設為 `tool_stream: true`。將
      `agents.defaults.models["xai/<model>"].params.tool_stream` 設為 `false`
      可停用它。
    - 內建 xAI 包裝器會先移除不支援的嚴格工具結構描述旗標和推理 *effort*
      承載鍵，才傳送原生 xAI 請求。只有 `grok-4.3` / `grok-4.3-*`
      會宣告可設定的推理 effort；所有其他具備推理能力的 xAI 模型仍會請求
      `include: ["reasoning.encrypted_content"]`，以便在後續輪次重播先前的
      加密推理。
    - `web_search`、`x_search` 和 `code_execution` 會作為 OpenClaw
      工具公開。OpenClaw 只會將每個工具所需的特定 xAI 內建功能附加到該工具的
      請求，而不是將每個原生工具附加到每個聊天輪次。
    - Grok `web_search` 會讀取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 會讀取 `plugins.entries.xai.config.xSearch.baseUrl`，然後
      後援到 Grok 網頁搜尋基底 URL。
    - `x_search` 和 `code_execution` 由內建 xAI 外掛擁有，
      而不是硬編碼在核心模型執行階段中。
    - `code_execution` 是遠端 xAI 沙盒執行，不是本機
      [`exec`](/zh-TW/tools/exec)。
  </Accordion>
</AccordionGroup>

## 即時測試

xAI 媒體路徑由單元測試和選擇啟用的即時套件涵蓋。在執行即時探測之前，
請在程序環境中匯出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供者專用的即時檔案會合成一般 TTS、適合電話的 PCM TTS、透過 xAI 批次
STT 轉錄音訊、透過 xAI 即時 STT 串流相同的 PCM、產生文字轉圖像輸出，
並編輯參考圖像。共用圖像即時檔案會透過 OpenClaw 的執行階段選擇、後援、
正規化和媒體附件路徑，驗證相同的 xAI 提供者。

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="所有提供者" href="/zh-TW/providers/index" icon="grid-2">
    更廣泛的提供者概觀。
  </Card>
  <Card title="疑難排解" href="/zh-TW/help/troubleshooting" icon="wrench">
    常見問題與修正。
  </Card>
</CardGroup>
