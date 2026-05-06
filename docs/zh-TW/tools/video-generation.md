---
read_when:
    - 透過代理生成影片
    - 設定影片生成提供者與模型
    - 了解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 video_generate，使用文字、圖片或影片參考素材，跨 16 個供應商後端產生影片
title: 影片生成
x-i18n:
    generated_at: "2026-05-06T03:00:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 代理可以根據文字提示、參照圖像或既有影片產生影片。支援十六個供應商後端，每個後端都有不同的模型選項、輸入模式與功能集合。代理會根據你的設定與可用的 API 金鑰，自動選擇正確的供應商。

<Note>
`video_generate` 工具只有在至少有一個影片產生供應商可用時才會出現。如果你在代理工具中看不到它，請設定供應商 API 金鑰或設定 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 將影片產生視為三種執行階段模式：

- `generate` - 沒有參照媒體的文字轉影片請求。
- `imageToVideo` - 請求包含一張或多張參照圖像。
- `videoToVideo` - 請求包含一個或多個參照影片。

供應商可以支援這些模式的任意子集。工具會在提交前驗證作用中的模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="設定驗證">
    為任何支援的供應商設定 API 金鑰：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="選擇預設模型（可選）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="詢問代理">
    > 產生一段 5 秒的電影感影片，內容是一隻友善的龍蝦在日落時衝浪。

    代理會自動呼叫 `video_generate`。不需要工具允許清單。

  </Step>
</Steps>

## 非同步產生的運作方式

影片產生是非同步的。當代理在工作階段中呼叫 `video_generate` 時：

1. OpenClaw 會將請求提交給供應商，並立即傳回任務 ID。
2. 供應商會在背景處理工作（通常為 30 秒到數分鐘，取決於供應商與解析度；由慢速佇列支援的供應商可能會執行到設定的逾時時間）。
3. 影片準備好後，OpenClaw 會以內部完成事件喚醒同一個工作階段。
4. 代理會告知使用者並附上完成的影片。在只使用訊息工具進行可見傳遞的群組/頻道聊天中，代理會透過訊息工具轉送結果，而不是由 OpenClaw 直接張貼。

當工作正在進行時，同一個工作階段中的重複 `video_generate` 呼叫會傳回目前的任務狀態，而不是開始另一個產生工作。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 從 CLI 檢查進度。

在沒有工作階段支援的代理執行之外（例如直接工具呼叫），工具會退回到內嵌產生，並在同一回合傳回最終媒體路徑。

當供應商傳回位元組時，產生的影片檔會儲存在 OpenClaw 管理的媒體儲存空間下。預設的產生影片儲存上限會遵循影片媒體限制，而 `agents.defaults.mediaMaxMb` 會提高上限以支援較大的算繪結果。當供應商也傳回託管的輸出 URL 時，如果本機持久化因檔案過大而拒絕，OpenClaw 可以傳遞該 URL，而不是讓任務失敗。

### 任務生命週期

| 狀態        | 含義                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待供應商接受。                                                                       |
| `running`   | 供應商正在處理（通常為 30 秒到數分鐘，取決於供應商與解析度）。                                          |
| `succeeded` | 影片已準備好；代理會醒來並將其張貼到對話中。                                                           |
| `failed`    | 供應商錯誤或逾時；代理會帶著錯誤詳細資料醒來。                                                         |

從 CLI 檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果目前工作階段已有影片任務處於 `queued` 或 `running`，`video_generate` 會傳回既有任務狀態，而不是開始新的任務。使用 `action: "status"` 可明確檢查，而不觸發新的產生工作。

## 支援的供應商

| 供應商                | 預設模型                        | 文字 | 圖像參照                                             | 影片參照                                        | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖像（僅限 I2V 模型；第一格 + 最後一格）     | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖像（透過角色指定第一格 + 最後一格）        | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參照圖像                                    | 最多 3 個影片                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖像                                             | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖像；使用 Seedance 參照轉影片時最多 9 張         | 使用 Seedance 參照轉影片時最多 3 個影片         | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖像                                             | 1 個影片                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖像                                             | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖像                                             | 1 個影片                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖像（第一格/最後一格或參照）                | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖像                                             | 1 個影片                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 張圖像                                             | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖像（`kling`）                                  | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 張第一格圖像或最多 7 個 `reference_image`           | 1 個影片                                        | `XAI_API_KEY`                            |

有些供應商接受額外或替代的 API 金鑰環境變數。詳情請參閱各個[供應商頁面](#related)。

執行 `video_generate action=list`，可在執行階段檢查可用的供應商、模型與執行階段模式。

### 功能矩陣

`video_generate`、合約測試與共用即時掃描所使用的明確模式合約：

| 供應商     | `generate` | `imageToVideo` | `videoToVideo` | 今日共用即時路徑                                                                                                                         |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                                  |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共用掃描中；工作流程特定涵蓋範圍與 Comfy 測試一起維護                                                                                |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；原生 DeepInfra 影片結構描述在隨附合約中是文字轉影片                                                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在使用 Seedance 參照轉影片時才支援 `videoToVideo`                                                        |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共用 `videoToVideo`，因為目前以緩衝區支援的 Gemini/Veo 掃描不接受該輸入                                   |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共用 `videoToVideo`，因為此組織/輸入路徑目前需要供應商端的 inpaint/remix 存取權                           |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                                  |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在選定模型為 `runway/gen4_aleph` 時才執行 `videoToVideo`                                                  |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；略過共用 `imageToVideo`，因為隨附的 `veo3` 僅支援文字，而隨附的 `kling` 需要遠端圖像 URL                                      |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此供應商目前需要遠端 MP4 URL                                                        |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要產生的影片文字描述。`action: "generate"` 必填。
</ParamField>

### 內容輸入

<ParamField path="image" type="string">單一參考圖片（路徑或 URL）。</ParamField>
<ParamField path="images" type="string[]">多個參考圖片（最多 9 個）。</ParamField>
<ParamField path="imageRoles" type="string[]">
選用的逐位置角色提示，與合併後的圖片清單平行對應。
標準值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">單一參考影片（路徑或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多個參考影片（最多 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
選用的逐位置角色提示，與合併後的影片清單平行對應。
標準值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
單一參考音訊（路徑或 URL）。當供應商支援音訊輸入時，用於背景音樂或語音
參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
選用的逐位置角色提示，與合併後的音訊清單平行對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給供應商。標準值來自
`VideoGenerationAssetRole` 聯集，但供應商可能接受其他
角色字串。`*Roles` 陣列的項目數不得超過對應的參考清單；差一位的錯誤會以清楚錯誤失敗。
使用空字串可讓某個位置保持未設定。對於 xAI，將每個圖片角色設為
`reference_image`，以使用其 `reference_images` 生成模式；省略
角色或使用 `first_frame` 則用於單圖片的圖片轉影片。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  長寬比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或供應商特定值。OpenClaw 會依供應商標準化或忽略不支援的值。
</ParamField>
<ParamField path="resolution" type="string">解析度提示，例如 `480P`、`720P`、`768P`、`1080P`、`4K`，或供應商特定值。OpenClaw 會依供應商標準化或忽略不支援的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時長，以秒為單位（四捨五入至最接近的供應商支援值）。
</ParamField>
<ParamField path="size" type="string">供應商支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支援時在輸出中啟用生成音訊。不同於 `audioRef*`（輸入）。
</ParamField>
<ParamField path="watermark" type="boolean">支援時切換供應商浮水印。</ParamField>

`adaptive` 是供應商特定的哨兵值：它會原樣轉送給在功能中宣告
`adaptive` 的供應商（例如 BytePlus
Seedance 會使用它，從輸入圖片
尺寸自動偵測比例）。未宣告它的供應商會在工具結果中透過
`details.ignoredOverrides` 顯示該值，讓捨棄行為可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會回傳目前的工作階段任務；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">供應商/模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的供應商操作逾時時間，以毫秒為單位。</ParamField>
<ParamField path="providerOptions" type="object">
  供應商特定選項，格式為 JSON 物件（例如 `{"seed": 42, "draft": true}`）。
  宣告具型別結構描述的供應商會驗證鍵與型別；未知
  鍵或不符項會在備援期間略過該候選。未
  宣告結構描述的供應商會原樣接收選項。執行 `video_generate action=list`
  可查看每個供應商接受的內容。
</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 會將時長標準化為
最接近的供應商支援值，並在備援供應商公開不同
控制介面時，重新對應已轉譯的幾何提示，例如尺寸轉長寬比。
真正不支援的覆寫會盡力
忽略，並在工具結果中回報為警告。硬性功能限制
（例如參考輸入過多）會在提交前失敗。工具結果
會回報已套用的設定；`details.normalization` 會擷取任何
從請求到套用的轉譯。
</Note>

參考輸入會選擇執行階段模式：

- 沒有參考媒體 → `generate`
- 任何圖片參考 → `imageToVideo`
- 任何影片參考 → `videoToVideo`
- 參考音訊輸入**不會**變更解析後的模式；它們會套用在
  圖片/影片參考所選模式之上，且僅適用於
  宣告 `maxInputAudios` 的供應商。

混合圖片與影片參考不是穩定的共用功能介面。
每個請求建議只使用一種參考類型。

#### 備援與具型別選項

某些功能檢查會套用在備援層，而不是
工具邊界，因此超過主要供應商限制的請求
仍可在具備能力的備援上執行：

- 當請求包含音訊參考時，未宣告 `maxInputAudios`（或為 `0`）的作用中候選會被略過；接著嘗試下一個候選。
- 作用中候選的 `maxDurationSeconds` 低於請求的 `durationSeconds`
  且未宣告 `supportedDurationSeconds` 清單 → 略過。
- 請求包含 `providerOptions`，且作用中候選明確
  宣告具型別的 `providerOptions` 結構描述 → 如果提供的鍵
  不在結構描述中，或值型別不符，則略過。未
  宣告結構描述的供應商會原樣接收選項（向後相容
  傳遞）。供應商可透過宣告空結構描述
  （`capabilities.providerOptions: {}`）選擇退出所有供應商選項，這會
  導致與型別不符相同的略過結果。

請求中的第一個略過原因會以 `warn` 記錄，讓操作人員看到
其主要供應商何時被跳過；後續略過會以 `debug` 記錄，以
讓較長的備援鏈保持安靜。如果每個候選都被略過，
彙總錯誤會包含每個候選的略過原因。

## 動作

| 動作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。從指定提示與選用參考輸入建立影片。                                                                 |
| `status`   | 檢查目前工作階段中進行中影片任務的狀態，而不啟動另一個生成。                                             |
| `list`     | 顯示可用的供應商、模型及其功能。                                                                         |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** - 如果代理程式在呼叫中指定。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** - 從目前預設供應商開始，接著依字母
   順序使用其餘供應商，選取具有有效驗證的供應商。

如果供應商失敗，會自動嘗試下一個候選。如果所有
候選都失敗，錯誤會包含每次嘗試的詳細資料。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可僅使用
明確的 `model`、`primary` 與 `fallbacks` 項目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## 供應商注意事項

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 非同步端點。參考圖片與
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    供應商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受圖片輸入；I2V 模型與
    一般 `*-pro-*` 模型支援單一參考圖片（第一
    幀）。以位置方式傳入圖片，或設定 `role: "first_frame"`。
    提供圖片時，T2V 模型 ID 會自動切換至對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（number）、`draft`（boolean -
    強制 480p）、`camera_fixed`（boolean）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin。供應商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。為每張圖片設定 `role: "first_frame"` / `"last_frame"`，或
    以位置方式傳入圖片。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （number）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin。供應商 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。支援最多 9 張參考圖片、
    3 個參考影片與 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。為每個資產設定 `role` - 支援值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （number）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流程驅動的本機或雲端執行。透過設定的圖形支援文字轉影片和
    圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    針對長時間執行的作業使用以佇列為基礎的流程。OpenClaw 預設最多等待 20
    分鐘，之後會將進行中的 fal 佇列作業視為逾時。大多數 fal 影片模型
    接受單一圖片參照。Seedance 2.0 參照轉影片
    模型最多接受 9 張圖片、3 部影片和 3 個音訊參照，且
    參照檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個圖片或一個影片參照。在 Gemini API 路徑上，產生音訊的請求會
    帶著警告被忽略，因為該 API 會拒絕目前 Veo 影片產生所用的
    `generateAudio` 參數。
  </Accordion>
  <Accordion title="MiniMax">
    僅限單一圖片參照。MiniMax 接受 `768P` 和 `1080P`
    解析度；像 `720P` 這類請求會在提交前正規化為最接近的
    支援值。
  </Accordion>
  <Accordion title="OpenAI">
    只會轉送 `size` 覆寫。其他樣式覆寫
    (`aspectRatio`, `resolution`, `audio`, `watermark`) 會帶著
    警告被忽略。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    作業、輪詢 `polling_url`，並下載 `unsigned_urls` 或
    文件記載的作業內容端點。內建的 `google/veo-3.1-fast` 預設值
    宣告 4/6/8 秒長度、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    與 Alibaba 使用相同的 DashScope 後端。參照輸入必須是遠端
    `http(s)` URL；本機檔案會預先被拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過 data URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行會公開 `16:9` 和 `9:16`
    長寬比。
  </Accordion>
  <Accordion title="Together">
    僅限單一圖片參照。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重新導向時遺失
    驗證資訊。`veo3` 內建為僅文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    支援文字轉影片、單一首幀圖片轉影片、最多 7 個透過 xAI
    `reference_images` 傳入的 `reference_image` 輸入，以及遠端
    影片編輯/延伸流程。
  </Accordion>
</AccordionGroup>

## 提供者能力模式

共用的影片產生合約支援模式特定能力，
而不只是扁平的彙總限制。新的提供者實作
應優先使用明確的模式區塊：

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

像 `maxInputImages` 和 `maxInputVideos` 這類扁平彙總欄位
**不足以** 宣告轉換模式支援。提供者應該
明確宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓即時
測試、合約測試和共用的 `video_generate` 工具能夠
以確定方式驗證模式支援。

當提供者中的某個模型具備比其他模型更寬鬆的參照輸入支援時，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整個模式的限制。

## 即時測試

針對共用內建提供者選擇性啟用即時涵蓋率：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media video
```

此即時檔案會從 `~/.profile` 載入缺少的提供者環境變數，預設優先使用
即時/環境 API 金鑰，而不是已儲存的驗證設定檔，並且預設執行
適合發布的煙霧測試：

- 掃描中的每個非 FAL 提供者都會執行 `generate`。
- 一秒鐘龍蝦提示。
- 每個提供者的操作上限來自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（預設為 `180000`）。

FAL 需要選擇性啟用，因為提供者端佇列延遲可能主導發布
時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，也會執行已宣告且
共用掃描能以本機媒體安全測試的轉換模式：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled` 且
  提供者/模型在共用掃描中接受由緩衝區支援的本機影片輸入時，執行
  `videoToVideo`。

目前共用的 `videoToVideo` 即時通道只在你選取
`runway/gen4_aleph` 時涵蓋 `runway`。

## 設定

在你的 OpenClaw 設定中設定預設影片產生模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

或透過 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相關

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [背景任務](/zh-TW/automation/tasks) - 非同步影片產生的任務追蹤
- [BytePlus](/zh-TW/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults)
- [fal](/zh-TW/providers/fal)
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models)
- [OpenAI](/zh-TW/providers/openai)
- [Qwen](/zh-TW/providers/qwen)
- [Runway](/zh-TW/providers/runway)
- [Together AI](/zh-TW/providers/together)
- [工具概覽](/zh-TW/tools)
- [Vydra](/zh-TW/providers/vydra)
- [xAI](/zh-TW/providers/xai)
