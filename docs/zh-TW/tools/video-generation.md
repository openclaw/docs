---
read_when:
    - 透過代理程式生成影片
    - 設定影片生成供應商和模型
    - 瞭解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 video_generate，使用文字、圖片或影片參考，在 16 個供應商後端上產生影片
title: 影片生成
x-i18n:
    generated_at: "2026-07-19T14:12:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ec1b1fb7054c1a4ce16b9d1aae910774175381233fa7b9b8fd7df32c22ba3f8
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 代理程式可透過 `video_generate`，從文字提示、參考圖片或
現有影片產生影片。支援 16 個供應商後端；代理程式會根據設定和
可用的 API 金鑰自動選擇適合的後端。

<Note>
只有在至少有一個影片產生供應商可用時，才會顯示 `video_generate`。
如果代理程式工具中沒有此項，請設定供應商 API 金鑰或
設定 `agents.defaults.videoGenerationModel`。
</Note>

`video_generate` 有三種執行階段模式，會依呼叫中的參考輸入
決定：

- `generate` - 無參考媒體（文字轉影片）。
- `imageToVideo` - 一張或多張參考圖片。
- `videoToVideo` - 一部或多部參考影片。

供應商可支援這些模式的任意子集。工具會在提交前驗證
作用中模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="設定驗證">
    為任一支援的供應商設定 API 金鑰：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="選擇預設模型（選用）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="向代理程式提出要求">
    > 產生一段 5 秒的電影感影片，內容是一隻友善的龍蝦在日落時衝浪。

    代理程式會自動呼叫 `video_generate`。不需要設定工具允許清單。

  </Step>
</Steps>

## 非同步產生的運作方式

影片產生採非同步方式：

1. OpenClaw 將要求提交給供應商，並立即傳回工作 ID。
2. 供應商在背景處理工作（通常需 30 秒至數分鐘，視供應商和解析度而定；由慢速佇列支援的供應商最長可執行至設定的逾時時間）。
3. 影片就緒後，OpenClaw 會透過內部完成事件喚醒同一個工作階段。
4. 代理程式會透過工作階段一般的可見回覆模式回報：
   自動最終回覆；若工作階段要求使用訊息工具，則透過 `message(action="send")` 回覆。
   如果要求者的工作階段處於非作用中狀態，或喚醒失敗且完成回覆中仍缺少
   產生的媒體，OpenClaw 會直接傳送具等冪性的備援訊息與媒體。

工作進行期間，同一工作階段中重複的 `video_generate` 呼叫會
傳回目前的工作狀態，而不會開始另一個產生工作。使用
`action: "status"` 可在不觸發新產生工作的情況下檢查，或從
命令列介面使用 `openclaw tasks list` / `openclaw tasks show <lookup>`
（請參閱[背景工作](/zh-TW/automation/tasks)）。

在以工作階段為基礎的代理程式執行以外（例如直接叫用工具），
工具會改用行內產生，並在同一輪中傳回最終媒體路徑。

供應商傳回位元組時，產生的影片檔案會儲存於 OpenClaw 管理的媒體儲存空間。
預設上限為 16MB（共用影片媒體限制）；`agents.defaults.mediaMaxMb`
可提高上限以容納較大的算繪結果。當供應商也傳回託管的輸出 URL 時，
如果本機持久化因檔案過大而拒絕儲存，OpenClaw 會改為傳送該 URL，
而不會讓工作失敗。

### 工作生命週期

| 狀態       | 意義                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 工作已建立，正在等待供應商接受。                                                   |
| `running`   | 供應商正在處理（通常需 30 秒至數分鐘，視供應商和解析度而定）。 |
| `succeeded` | 影片已就緒；代理程式會被喚醒並將影片發佈至對話。                                         |
| `failed`    | 供應商發生錯誤或逾時；代理程式會被喚醒並收到錯誤詳細資料。                                         |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 支援的供應商

| 供應商              | 預設模型                   | 文字 | 圖片參考                                            | 影片參考                                       | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                     | 是（遠端 URL）                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus（內建）    | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（第一幀 + 最後一幀）                  | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus 1.5 外掛   | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一幀 + 最後一幀）         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參考圖片                             | 最多 3 部影片                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                              | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；使用 Seedance 參考轉影片時最多 9 張    | 使用 Seedance 參考轉影片時最多 3 部影片 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                              | 1 部影片                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                              | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                              | 1 部影片                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一幀／最後一幀或參考圖片）      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                     | 是（遠端 URL）                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                              | 1 部影片                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 僅限 `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic：1 個第一幀或 7 張參考圖片；1.5：1 個影格 | Classic：1 部影片                                | `XAI_API_KEY`                            |

部分供應商接受額外或替代的 API 金鑰環境變數。詳細資訊請參閱
各個[供應商頁面](#related)。

執行 `video_generate action=list`，即可在執行階段檢查可用的供應商、模型和
執行階段模式。

### 功能矩陣

`video_generate`、契約測試和共用即時掃描所使用的明確模式契約：

| 供應商   | `generate` | `imageToVideo` | `videoToVideo` | 目前的共用即時測試管道                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共用掃描中；工作流程特定的涵蓋範圍位於 Comfy 測試中                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；外掛契約中的原生 DeepInfra 影片結構描述為文字轉影片                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；僅在使用 Seedance 參考轉影片時執行 `videoToVideo`                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳過共用 `videoToVideo`，因為目前由緩衝區支援的 Gemini/Veo 掃描不接受該輸入 |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳過共用 `videoToVideo`，因為此組織／輸入路徑目前需要供應商端的影片編輯存取權   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；跳過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；僅在所選模型為 `runway/gen4_aleph` 時執行 `videoToVideo`                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；跳過共用 `imageToVideo`，因為內建的 `veo3` 僅支援文字，而內建的 `kling` 需要遠端圖片 URL           |
| xAI        |     ✓      |       ✓        |       ✓        | Classic 支援所有模式；Video 1.5 僅支援圖片轉影片；遠端 MP4 輸入使 `videoToVideo` 未納入共用掃描             |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要生成影片的文字描述。`action: "generate"` 必填。
</ParamField>

### 內容輸入

<ParamField path="image" type="string">單一參考圖片（路徑或 URL）。</ParamField>
<ParamField path="images" type="string[]">多張參考圖片（最多 9 張）。</ParamField>
<ParamField path="imageRoles" type="string[]">
選用的逐位置角色提示，與合併後的圖片清單平行對應。
標準值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">單一參考影片（路徑或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多部參考影片（最多 4 部）。</ParamField>
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
`VideoGenerationAssetRole` 聯集，但供應商可能接受額外的
角色字串。`*Roles` 陣列的項目數不得超過
對應的參考清單；差一錯誤會導致明確的錯誤訊息。
使用空字串可將欄位保留為未設定。若使用 xAI，請將每個圖片角色設為
`reference_image`，以使用其 `reference_images` 生成模式；若要使用單張圖片的圖片轉影片，
請省略角色或使用 `first_frame`。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  長寬比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或供應商特定值。OpenClaw 會依供應商正規化或忽略不支援的值。
</ParamField>
<ParamField path="resolution" type="string">解析度提示，例如 `360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`，或供應商特定值。OpenClaw 會依供應商正規化或忽略不支援的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標持續時間（秒，四捨五入至最接近的供應商支援值）。
</ParamField>
<ParamField path="size" type="string">供應商支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支援時，在輸出中啟用生成的音訊。這與 `audioRef*`（輸入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">支援時，切換供應商浮水印。</ParamField>

`adaptive` 是供應商特定的哨兵值：它會原樣轉送至
在能力中宣告 `adaptive` 的供應商（例如 BytePlus
Seedance 使用它根據輸入圖片
尺寸自動偵測比例）。未宣告該能力的供應商會透過工具結果中的
`details.ignoredOverrides` 顯示此值，讓捨棄動作可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前工作階段的任務；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">覆寫供應商／模型（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的供應商操作逾時時間（毫秒）。若省略，OpenClaw 會使用已設定的 `agents.defaults.videoGenerationModel.timeoutMs`；否則，若存在由外掛作者定義的供應商預設值，則使用該值。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 物件提供的供應商特定選項（例如 `{"seed": 42, "draft": true}`）。
  宣告具型別綱要的供應商會驗證鍵與型別；未知的
  鍵或不相符的型別會在回退期間略過該候選項目。未
  宣告綱要的供應商會原樣接收選項。執行 `video_generate action=list`
  即可查看各供應商接受的內容。
</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 會將持續時間正規化為
最接近的供應商支援值；若回退供應商提供不同的
控制介面，也會重新對應已轉換的幾何提示，
例如將尺寸轉換為長寬比。確實不受支援的覆寫值會盡力
忽略，並在工具結果中回報為警告。硬性能力限制
（例如參考輸入過多）會在提交前失敗。工具結果會
回報套用的設定；`details.normalization` 會擷取任何
從要求值到套用值的轉換。
</Note>

參考輸入會選取執行階段模式：

- 無參考媒體 -> `generate`
- 任何圖片參考 -> `imageToVideo`
- 任何影片參考 -> `videoToVideo`
- 參考音訊輸入**不會**變更解析後的模式；它們會套用在
  圖片／影片參考所選模式之上，且僅適用於
  宣告 `maxInputAudios` 的供應商。

混合使用圖片與影片參考並非穩定的共用能力介面。
每個要求最好只使用一種參考類型。

#### 回退與具型別選項

有些能力檢查會在回退層套用，而不是在工具
邊界套用，因此超出主要供應商限制的要求仍可能
在具備能力的回退供應商上執行：

- 當要求包含音訊參考時，若使用中的候選項目未宣告 `maxInputAudios`（或 `0`），便會略過
  該候選項目，並嘗試下一個候選項目。對照
  `maxInputImages`/`maxInputVideos` 檢查圖片與影片參考數量時，也會套用相同的
  防護機制。
- 使用中候選項目的 `maxDurationSeconds` 低於要求的 `durationSeconds`，
  且未宣告 `supportedDurationSeconds` 清單 -> 略過。
- 要求包含 `providerOptions`，且使用中的候選項目明確
  宣告具型別的 `providerOptions` 綱要 -> 若提供的鍵
  不在綱要中或值的型別不相符，則略過。未
  宣告綱要的供應商會原樣接收選項（向後相容的
  直接傳遞）。供應商可透過宣告空綱要
  （`capabilities.providerOptions: {}`）停用所有供應商選項，這會
  造成與型別不相符時相同的略過結果。

要求中的第一個略過原因會以 `warn` 層級記錄，讓操作人員知道
主要供應商何時遭到跳過；後續略過則以 `debug` 層級記錄，以避免
冗長的回退鏈產生過多訊息。若所有候選項目都遭略過，
彙總錯誤會包含各候選項目的略過原因。

## 動作

| 動作     | 功能                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。根據指定的提示詞和選用的參考輸入建立影片。                             |
| `status`   | 檢查目前工作階段中執行中影片任務的狀態，而不啟動另一個生成作業。 |
| `list`     | 顯示可用的供應商、模型及其能力。                                                |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** — 若代理程式在呼叫中指定。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** — 從目前的
   預設供應商開始，再依字母順序檢查其餘供應商，
   選取具有有效驗證資訊的供應商。

若供應商失敗，系統會自動嘗試下一個候選項目。若所有
候選項目皆失敗，錯誤會包含每次嘗試的詳細資訊。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false`，即可
只使用明確指定的 `model`、`primary` 和 `fallbacks` 項目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // 選用的逐工具供應商要求逾時覆寫值
      },
    },
  },
}
```

## 供應商注意事項

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 非同步端點。參考圖片和
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus（隨附）">
    供應商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。支援最多 2 張輸入圖片
    （`first_frame` + `last_frame`）。依位置傳入圖片，或明確設定每張
    圖片的 `role`。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林值 —
    強制使用 480p）、`camera_fixed`（布林值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5 外掛">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部，未隨附）。供應商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。為每張圖片設定 `role: "first_frame"` / `"last_frame"`，或
    依位置傳入圖片。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會直接轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部，未隨附）。供應商 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。最多支援 9 張參考圖片、
    3 部參考影片和 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。為每個素材設定 `role` — 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會直接轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    以工作流程驅動的本機或雲端執行。透過已設定的圖形支援文字轉影片和
    圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援流程。OpenClaw 預設最多等待 20
    分鐘，之後會將仍在進行中的 fal 佇列工作視為
    逾時。大多數 fal 影片模型
    接受單一圖片參照。Seedance 2.0 參照轉影片
    模型最多接受 9 張圖片、3 段影片和 3 個音訊參照，
    參照檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個圖片或一個影片參照。透過 Gemini API 路徑提出的音訊產生要求
    會被忽略並顯示警告，因為該 API 會拒絕目前 Veo 影片產生所使用的
    `generateAudio` 參數。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一圖片參照。MiniMax 接受 `768P` 和 `1080P`
    解析度；提交前，`720P` 之類的要求會正規化為最接近的
    支援值。
  </Accordion>
  <Accordion title="OpenAI">
    僅轉送 `size` 覆寫。其他樣式覆寫
    （`aspectRatio`、`resolution`、`audio`、`watermark`）會被忽略並
    顯示警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    工作、輪詢 `polling_url`，並下載 `unsigned_urls` 或
    文件所述的工作內容端點。內建的 `google/veo-3.1-fast` 預設值
    宣告支援 4/6/8 秒的持續時間、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    使用與 Alibaba 相同的 DashScope 後端。參照輸入必須是遠端
    `http(s)` URL；本機檔案會預先遭到拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行提供 `16:9` 和 `9:16`
    長寬比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一圖片參照。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重新導向時
    遺失驗證。內建的 `veo3` 僅支援文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    預設的 `grok-imagine-video` 模型支援文字轉影片、單一
    首格圖片轉影片、透過 xAI `reference_images` 提供最多 7 個
    `reference_image` 輸入，以及遠端影片編輯／延長流程。產生作業預設
    使用 `480P`；省略 `aspectRatio` 時，單一圖片轉影片會沿用來源長寬比。
    影片編輯／延長會沿用輸入的幾何尺寸，且不接受
    長寬比或解析度覆寫。延長功能接受 2-10
    秒。

    `grok-imagine-video-1.5` 僅支援圖片轉影片：必須提供恰好一張圖片。
    它支援 1-15 秒，以及 `480P`、`720P` 或 `1080P`，預設為
    `480P`；省略 `aspectRatio` 可沿用來源圖片長寬比。預覽版
    和有日期的 1.5 識別碼會接受相同的驗證，並原封不動地
    轉送。

  </Accordion>
</AccordionGroup>

## 供應商功能模式

共用影片產生合約支援依模式區分的功能，
而不僅是扁平化的彙總限制。新的供應商實作
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

`maxInputImages` 和 `maxInputVideos` 等扁平化彙總欄位
**不足以**宣告轉換模式支援。供應商應
明確宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓即時
測試、合約測試及共用 `video_generate` 工具能以確定方式驗證
模式支援。

若供應商中的某個模型具有比其餘模型更廣泛的參照輸入支援，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整個模式的限制。

## 即時測試

共用內建供應商的選擇性即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media video
```

此即時測試檔案預設會優先使用已匯出的供應商環境變數，而非儲存的驗證
設定檔，並預設執行可安全用於發行的冒煙測試：

- `generate` 適用於掃描中的每個非 FAL 供應商。
- 一秒的龍蝦提示詞。
- 來自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每供應商作業上限（預設為 `180000`）。

FAL 採選擇性啟用，因為供應商端的佇列延遲可能主導發行
時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，即可同時執行共用掃描能使用本機媒體安全測試的
已宣告轉換模式：

- `imageToVideo`，條件為 `capabilities.imageToVideo.enabled`。
- `videoToVideo`，條件為 `capabilities.videoToVideo.enabled`，且
  供應商／模型在共用掃描中接受由緩衝區支援的本機影片輸入。

目前，只有在選取 `runway/gen4_aleph` 時，共用 `videoToVideo` 即時執行管道才會涵蓋 `runway`。

## 設定

在 OpenClaw 設定中指定預設影片產生模型：

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

或透過命令列介面：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相關內容

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [背景工作](/zh-TW/automation/tasks) - 非同步影片產生的工作追蹤
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
