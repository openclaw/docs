---
read_when:
    - 透過代理程式產生影片
    - 設定影片生成提供者與模型
    - 了解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 `video_generate` 從文字、圖片或影片參照在 16 個提供者後端生成影片
title: 影片生成
x-i18n:
    generated_at: "2026-06-27T20:11:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 代理程式可以從文字提示、參照圖片或既有影片生成影片。支援十六個供應商後端，各自有不同的模型選項、輸入模式與功能組合。代理程式會根據你的設定與可用 API 金鑰，自動選擇合適的供應商。

<Note>
只有在至少有一個影片生成供應商可用時，`video_generate` 工具才會出現。如果你在代理程式工具中沒有看到它，請設定供應商 API 金鑰，或設定 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 將影片生成視為三種執行階段模式：

- `generate` - 沒有參照媒體的文字轉影片請求。
- `imageToVideo` - 請求包含一張或多張參照圖片。
- `videoToVideo` - 請求包含一個或多個參照影片。

供應商可以支援這些模式的任意子集。工具會在提交前驗證作用中的模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="Configure auth">
    為任何支援的供應商設定 API 金鑰：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > 生成一段 5 秒、電影感的影片，內容是一隻友善的龍蝦在夕陽下衝浪。

    代理程式會自動呼叫 `video_generate`。不需要將工具加入允許清單。

  </Step>
</Steps>

## 非同步生成如何運作

影片生成是非同步的。當代理程式在工作階段中呼叫 `video_generate` 時：

1. OpenClaw 會將請求提交給供應商，並立即傳回任務 ID。
2. 供應商會在背景處理作業（通常為 30 秒到數分鐘，取決於供應商與解析度；較慢且由佇列支援的供應商可能會執行到設定的逾時時間）。
3. 影片準備好後，OpenClaw 會使用內部完成事件喚醒同一個工作階段。
4. 代理程式會透過工作階段的一般可見回覆模式告知使用者：
   自動模式時使用最終回覆遞送；或當工作階段需要訊息工具時，使用 `message(action="send")`。如果請求者工作階段未啟用，或其作用中喚醒失敗，而且完成回覆中仍缺少某些已生成影片，OpenClaw 會傳送具冪等性的直接後備回覆，只包含缺少的影片。

當作業正在進行時，同一工作階段中的重複 `video_generate` 呼叫會傳回目前任務狀態，而不是開始另一個生成。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可從命令列介面檢查進度。

在非工作階段支援的代理程式執行之外（例如直接工具叫用），工具會退回到行內生成，並在同一輪傳回最終媒體路徑。

當供應商傳回位元組時，生成的影片檔案會儲存在 OpenClaw 管理的媒體儲存空間下。預設的生成影片儲存上限會沿用影片媒體限制，而 `agents.defaults.mediaMaxMb` 會為較大的算繪提高上限。當供應商也傳回代管輸出 URL 時，如果本機持久化因檔案過大而拒絕，OpenClaw 可以改為遞送該 URL，而不是讓任務失敗。

### 任務生命週期

| 狀態        | 意義                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待供應商接受。                                                                       |
| `running`   | 供應商正在處理（通常為 30 秒到數分鐘，取決於供應商與解析度）。                                         |
| `succeeded` | 影片已準備好；代理程式會喚醒並將其張貼到對話中。                                                       |
| `failed`    | 供應商錯誤或逾時；代理程式會帶著錯誤詳細資料喚醒。                                                     |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果目前工作階段已經有影片任務處於 `queued` 或 `running`，`video_generate` 會傳回既有任務狀態，而不是啟動新的任務。使用 `action: "status"` 可明確檢查，而不觸發新的生成。

## 支援的供應商

| 供應商                | 預設模型                        | 文字 | 圖片參照                                             | 影片參照                                      | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（僅限 I2V 模型；第一幀 + 最後一幀）    | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一幀 + 最後一幀）       | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參照圖片                                    | 最多 3 個影片                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                             | -                                             | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                             | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；搭配 Seedance 參照轉影片時最多 9 張        | 搭配 Seedance 參照轉影片時最多 3 個影片      | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                             | 1 個影片                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                             | -                                             | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                             | 1 個影片                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一/最後一幀或參照）                 | -                                             | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                             | 1 個影片                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 僅 `Wan-AI/Wan2.2-I2V-A14B`                          | -                                             | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                  | -                                             | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 張第一幀圖片，或最多 7 張 `reference_image`        | 1 個影片                                      | `XAI_API_KEY`                            |

有些供應商接受額外或替代的 API 金鑰環境變數。詳情請參閱個別[供應商頁面](#related)。

執行 `video_generate action=list` 可在執行階段檢視可用的供應商、模型與執行階段模式。

### 功能矩陣

`video_generate`、合約測試與共用即時掃描使用的明確模式合約：

| 供應商     | `generate` | `imageToVideo` | `videoToVideo` | 目前共用即時通道                                                                                                                        |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已略過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共用掃描中；工作流程專屬涵蓋範圍位於 Comfy 測試                                                                                     |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；原生 DeepInfra 影片結構描述在外掛合約中是文字轉影片                                                                         |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；僅在使用 Seedance 參照轉影片時支援 `videoToVideo`                                                           |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共用 `videoToVideo` 已略過，因為目前由緩衝區支援的 Gemini/Veo 掃描不接受該輸入                             |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共用 `videoToVideo` 已略過，因為此組織/輸入路徑目前需要供應商端影片編輯存取權                               |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已略過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在選取的模型為 `runway/gen4_aleph` 時，`videoToVideo` 才會執行                                         |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；共用 `imageToVideo` 已略過，因為隨附的 `veo3` 僅支援文字，而隨附的 `kling` 需要遠端圖片 URL                                |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已略過 `videoToVideo`，因為此供應商目前需要遠端 MP4 URL                                                     |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要產生之影片的文字描述。`action: "generate"` 必填。
</ParamField>

### 內容輸入

<ParamField path="image" type="string">單一參考圖片（路徑或 URL）。</ParamField>
<ParamField path="images" type="string[]">多個參考圖片（最多 9 個）。</ParamField>
<ParamField path="imageRoles" type="string[]">
可選的逐位置角色提示，與合併後的圖片清單平行對應。
標準值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">單一參考影片（路徑或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多個參考影片（最多 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
可選的逐位置角色提示，與合併後的影片清單平行對應。
標準值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
單一參考音訊（路徑或 URL）。當供應商支援音訊輸入時，用於背景音樂或語音
參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可選的逐位置角色提示，與合併後的音訊清單平行對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給供應商。標準值來自
`VideoGenerationAssetRole` 聯集，但供應商可能接受其他
角色字串。`*Roles` 陣列的項目數不得超過
對應的參考清單；差一錯誤會以明確錯誤失敗。
使用空字串可讓某個槽位保持未設定。對於 xAI，將每個圖片角色設為
`reference_image` 以使用其 `reference_images` 產生模式；省略
角色或針對單張圖片轉影片使用 `first_frame`。
</Note>

### 風格控制

<ParamField path="aspectRatio" type="string">
  長寬比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或供應商特定值。OpenClaw 會依供應商正規化或忽略不支援的值。
</ParamField>
<ParamField path="resolution" type="string">解析度提示，例如 `480P`、`720P`、`768P`、`1080P`、`4K`，或供應商特定值。OpenClaw 會依供應商正規化或忽略不支援的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時長（秒，四捨五入到最接近的供應商支援值）。
</ParamField>
<ParamField path="size" type="string">當供應商支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支援時在輸出中啟用產生的音訊。不同於 `audioRef*`（輸入）。
</ParamField>
<ParamField path="watermark" type="boolean">支援時切換供應商浮水印。</ParamField>

`adaptive` 是供應商特定的哨兵值：它會原樣轉送給
在能力中宣告 `adaptive` 的供應商（例如 BytePlus
Seedance 使用它根據輸入圖片
尺寸自動偵測比例）。未宣告它的供應商會透過工具結果中的
`details.ignoredOverrides` 顯示該值，讓捨棄行為可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前工作階段任務；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">供應商/模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可選的供應商作業逾時，單位為毫秒。省略時，OpenClaw 會使用已設定的 `agents.defaults.videoGenerationModel.timeoutMs`，否則在存在時使用外掛作者定義的供應商預設值。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 物件表示的供應商特定選項（例如 `{"seed": 42, "draft": true}`）。
  宣告型別化結構描述的供應商會驗證鍵與型別；未知
  鍵或不符會在備援期間略過該候選項。未
  宣告結構描述的供應商會原樣接收選項。執行 `video_generate action=list`
  以查看每個供應商接受的內容。
</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 會將時長正規化為
最接近的供應商支援值，並在備援供應商公開不同
控制表面時，重新對應已轉換的幾何提示，
例如尺寸轉長寬比。真正不支援的覆寫會盡力
忽略，並在工具結果中回報為警告。硬性能力限制
（例如參考輸入過多）會在提交前失敗。工具結果會
回報已套用的設定；`details.normalization` 會擷取任何
從請求到套用的轉換。
</Note>

參考輸入會選取執行階段模式：

- 沒有參考媒體 → `generate`
- 任何圖片參考 → `imageToVideo`
- 任何影片參考 → `videoToVideo`
- 參考音訊輸入**不會**變更解析後的模式；它們會套用在
  圖片/影片參考所選模式之上，且只適用於
  宣告 `maxInputAudios` 的供應商。

混用圖片與影片參考不是穩定的共用能力表面。
每個請求建議只使用一種參考類型。

#### 備援與型別化選項

部分能力檢查會套用在備援層，而不是
工具邊界，因此超過主要供應商限制的請求仍可
在有能力的備援上執行：

- 當請求包含音訊參考時，宣告沒有 `maxInputAudios`（或為 `0`）的
  作用中候選項會被略過；接著嘗試下一個候選項。
- 作用中候選項的 `maxDurationSeconds` 低於請求的 `durationSeconds`，
  且沒有宣告 `supportedDurationSeconds` 清單 → 略過。
- 請求包含 `providerOptions`，且作用中候選項明確
  宣告型別化 `providerOptions` 結構描述 → 若提供的鍵
  不在結構描述中或值型別不相符，則略過。未
  宣告結構描述的供應商會原樣接收選項（向後相容的
  直通）。供應商可透過宣告空結構描述
  （`capabilities.providerOptions: {}`）選擇退出所有供應商選項，
  這會導致與型別不符相同的略過行為。

請求中的第一個略過原因會以 `warn` 記錄，讓操作人員知道
其主要供應商被跳過；後續略過會以 `debug` 記錄，
以保持長備援鏈安靜。如果每個候選項都被略過，
彙總錯誤會包含每個項目的略過原因。

## 動作

| 動作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。根據指定提示詞與可選參考輸入建立影片。                                                           |
| `status`   | 檢查目前工作階段中進行中影片任務的狀態，而不啟動另一個產生作業。                                       |
| `list`     | 顯示可用供應商、模型及其能力。                                                                          |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** - 如果代理在呼叫中指定了它。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** - 具有有效驗證的供應商，從
   目前預設供應商開始，然後是其餘供應商按字母
   順序排列。

如果供應商失敗，會自動嘗試下一個候選項。如果所有
候選項都失敗，錯誤會包含每次嘗試的詳細資訊。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 以僅使用
明確的 `model`、`primary` 和 `fallbacks` 項目。

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
    使用 DashScope / Model Studio 非同步端點。參考圖片和
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    供應商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受圖片輸入；I2V 模型和
    一般 `*-pro-*` 模型支援單一參考圖片（第一幀）。
    依位置傳入圖片，或設定 `role: "first_frame"`。
    當提供圖片時，T2V 模型 ID 會自動切換為對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林值 -
    強制 480p）、`camera_fixed`（布林值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛。供應商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。在每張圖片上設定 `role: "first_frame"` / `"last_frame"`，或
    依位置傳入圖片。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛。供應商 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。支援最多 9 張參考圖片、
    3 個參考影片，以及 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。在每個資產上設定 `role` - 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流程驅動的本機或雲端執行。透過設定的圖形支援文字轉影片和
    圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援的流程。OpenClaw 預設最多等待 20
    分鐘，之後會將進行中的 fal 佇列工作視為逾時。大多數 fal 影片模型
    接受單一圖片參照。Seedance 2.0 參照轉影片
    模型最多接受 9 張圖片、3 部影片和 3 個音訊參照，
    且參照檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個圖片或一個影片參照。在 Gemini API 路徑上，產生音訊的請求會
    以警告忽略，因為該 API 會拒絕目前 Veo 影片產生的
    `generateAudio` 參數。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一圖片參照。MiniMax 接受 `768P` 和 `1080P`
    解析度；像 `720P` 這類請求會在提交前正規化為最接近的
    支援值。
  </Accordion>
  <Accordion title="OpenAI">
    只會轉送 `size` 覆寫。其他樣式覆寫
    (`aspectRatio`, `resolution`, `audio`, `watermark`) 會以
    警告忽略。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    工作、輪詢 `polling_url`，並下載 `unsigned_urls` 或
    文件記載的工作內容端點。隨附的 `google/veo-3.1-fast` 預設值
    宣告 4/6/8 秒時長、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    與 Alibaba 相同的 DashScope 後端。參照輸入必須是遠端
    `http(s)` URL；本機檔案會預先遭到拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行會公開 `16:9` 和 `9:16`
    長寬比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一圖片參照。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重新導向時遺失
    驗證資訊。`veo3` 隨附為僅支援文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    支援文字轉影片、單一首幀圖片轉影片、透過 xAI `reference_images`
    傳入最多 7 個 `reference_image` 輸入，以及遠端
    影片編輯/延伸流程。
  </Accordion>
</AccordionGroup>

## 提供者能力模式

共享的影片產生合約支援模式專屬能力，
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

像 `maxInputImages` 和 `maxInputVideos` 這類扁平彙總欄位，
**不足以** 宣告支援轉換模式。提供者應明確
宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓實際連線
測試、合約測試，以及共享的 `video_generate` 工具可以確定性地驗證
模式支援。

當提供者中的某個模型擁有比其他模型更寬鬆的參照輸入支援時，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整個模式的限制。

## 實際連線測試

共享隨附提供者的選擇加入實際連線涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media video
```

這個實際連線檔案預設會優先使用已匯出的提供者環境變數，而非儲存的驗證
設定檔，並預設執行適合發行的冒煙測試：

- 對掃描中的每個非 FAL 提供者執行 `generate`。
- 一秒鐘的龍蝦提示詞。
- 每個提供者的操作上限來自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（預設為 `180000`）。

FAL 採選擇加入，因為提供者端的佇列延遲可能主導發行
時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，即可同時執行已宣告、
且共享掃描可用本機媒體安全演練的轉換模式：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled` 且
  提供者/模型在共享掃描中接受以緩衝區支援的本機影片輸入時，執行
  `videoToVideo`。

目前共享的 `videoToVideo` 實際連線路徑，只會在你
選取 `runway/gen4_aleph` 時涵蓋 `runway`。

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

或透過命令列介面：

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
