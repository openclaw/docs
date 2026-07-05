---
read_when:
    - 透過代理產生影片
    - 設定影片生成提供者與模型
    - 了解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 video_generate，使用文字、圖片或影片參考，在 16 個提供者後端產生影片
title: 影片生成
x-i18n:
    generated_at: "2026-07-05T11:47:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a785955aeb2e9b68c9877ef6f4af59d9fd2d071b37be390dc5051279122decb
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 代理會透過 `video_generate`，從文字提示、參考圖片或既有影片產生影片。支援十六個提供者後端；代理會根據設定與可用的 API 金鑰自動選擇正確的後端。

<Note>
`video_generate` 只會在至少有一個影片生成提供者可用時出現。如果你的代理工具中缺少它，請設定提供者 API 金鑰，或設定 `agents.defaults.videoGenerationModel`。
</Note>

`video_generate` 有三種執行階段模式，會依呼叫中的參考輸入解析：

- `generate` - 沒有參考媒體（文字轉影片）。
- `imageToVideo` - 一張或多張參考圖片。
- `videoToVideo` - 一段或多段參考影片。

提供者可以支援這些模式的任意子集。工具會在提交前驗證作用中的模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="設定驗證">
    為任何支援的提供者設定 API 金鑰：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="選擇預設模型（選用）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="詢問代理">
    > 產生一段 5 秒的電影感影片，內容是一隻友善的龍蝦在夕陽下衝浪。

    代理會自動呼叫 `video_generate`。不需要工具允許清單。

  </Step>
</Steps>

## 非同步生成的運作方式

影片生成是非同步的：

1. OpenClaw 將請求提交給提供者，並立即回傳任務 ID。
2. 提供者會在背景處理工作（通常約 30 秒到數分鐘，取決於提供者與解析度；較慢的佇列後端提供者可能會執行到設定的逾時為止）。
3. 影片準備好後，OpenClaw 會用內部完成事件喚醒同一個工作階段。
4. 代理會透過工作階段一般的可見回覆模式回報：
   自動最終回覆，或在工作階段需要訊息工具時使用 `message(action="send")`。如果請求者工作階段未啟用，或喚醒失敗且完成回覆中仍缺少產生的媒體，OpenClaw 會傳送帶有媒體的冪等直接備援。

工作進行中時，同一個工作階段中的重複 `video_generate` 呼叫會回傳目前任務狀態，而不是啟動另一個生成工作。使用 `action: "status"` 可在不觸發新生成的情況下檢查狀態，或從命令列介面使用 `openclaw tasks list` / `openclaw tasks show <lookup>`（請參閱[背景任務](/zh-TW/automation/tasks)）。

在非工作階段支援的代理執行之外（例如直接工具呼叫），工具會退回到行內生成，並在同一回合回傳最終媒體路徑。

當提供者回傳位元組時，產生的影片檔案會儲存在 OpenClaw 管理的媒體儲存空間下。預設上限為 16MB（共享影片媒體限制）；`agents.defaults.mediaMaxMb` 可提高此限制以支援較大的渲染。當提供者也回傳託管輸出 URL 時，如果本機持久化因檔案過大而拒絕，OpenClaw 會改為傳遞該 URL，而不是讓任務失敗。

### 任務生命週期

| 狀態        | 意義                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待提供者接受。                                                                       |
| `running`   | 提供者正在處理（通常約 30 秒到數分鐘，取決於提供者與解析度）。                                         |
| `succeeded` | 影片已就緒；代理會被喚醒並將它發佈到對話中。                                                           |
| `failed`    | 提供者錯誤或逾時；代理會被喚醒並提供錯誤詳細資料。                                                     |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 支援的提供者

| 提供者                | 預設模型                        | 文字 | 圖片參考                                             | 影片參考                                        | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（僅 I2V 模型；第一幀 + 最後一幀）      | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一幀 + 最後一幀）       | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參考圖片                                    | 最多 3 段影片                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                             | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；使用 Seedance 參考轉影片時最多 9 張         | 使用 Seedance 參考轉影片時最多 3 段影片         | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                             | 1 段影片                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                             | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                             | 1 段影片                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一/最後一幀或參考）                 | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                             | 1 段影片                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 僅 `Wan-AI/Wan2.2-I2V-A14B`                          | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                  | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 張第一幀圖片，或最多 7 張 `reference_image`s       | 1 段影片                                        | `XAI_API_KEY`                            |

有些提供者接受額外或替代的 API 金鑰環境變數。詳情請參閱個別[提供者頁面](#related)。

執行 `video_generate action=list` 可在執行階段檢查可用的提供者、模型與執行階段模式。

### 功能矩陣

`video_generate`、合約測試與共享即時掃描所使用的明確模式合約：

| 提供者     | `generate` | `imageToVideo` | `videoToVideo` | 目前共享即時通道                                                                                                                        |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共享掃描中；工作流程特定涵蓋範圍由 Comfy 測試負責                                                                                  |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；原生 DeepInfra 影片結構描述在外掛合約中是文字轉影片                                                                        |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在使用 Seedance 參考轉影片時才支援 `videoToVideo`                                                       |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共享 `videoToVideo`，因為目前以緩衝區為後端的 Gemini/Veo 掃描不接受該輸入                              |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共享 `videoToVideo`，因為此組織/輸入路徑目前需要提供者端影片編輯存取權                                  |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在選取的模型是 `runway/gen4_aleph` 時才執行 `videoToVideo`                                             |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；略過共享 `imageToVideo`，因為 bundled `veo3` 僅支援文字，且 bundled `kling` 需要遠端圖片 URL                                |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者目前需要遠端 MP4 URL                                                       |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要產生之影片的文字描述。`action: "generate"` 必填。
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
單一參考音訊（路徑或 URL）。當提供者支援音訊輸入時，用於背景音樂或語音
參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
選用的逐位置角色提示，與合併後的音訊清單平行對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給提供者。標準值來自
`VideoGenerationAssetRole` 聯集，但提供者可能接受其他
角色字串。`*Roles` 陣列的項目數不得多於
對應的參考清單；差一個位置的錯誤會以清楚的錯誤失敗。
使用空字串可讓某個位置保持未設定。對於 xAI，將每個圖片角色設為
`reference_image` 以使用其 `reference_images` 生成模式；若是單張圖片的圖片轉影片，
請省略角色或使用 `first_frame`。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  長寬比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或提供者特定的值。OpenClaw 會依提供者正規化或忽略不支援的值。
</ParamField>
<ParamField path="resolution" type="string">解析度提示，例如 `360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`，或提供者特定的值。OpenClaw 會依提供者正規化或忽略不支援的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時長（秒，四捨五入到最接近的提供者支援值）。
</ParamField>
<ParamField path="size" type="string">提供者支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支援時在輸出中啟用生成音訊。這與 `audioRef*`（輸入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">支援時切換提供者浮水印。</ParamField>

`adaptive` 是提供者特定的哨兵值：它會原樣轉送給
在能力中宣告 `adaptive` 的提供者（例如 BytePlus
Seedance 會使用它從輸入圖片
尺寸自動偵測比例）。未宣告它的提供者會透過工具結果中的
`details.ignoredOverrides` 顯示該值，讓捨棄情況可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前的工作階段任務；`"list"` 會檢查提供者。
</ParamField>
<ParamField path="model" type="string">提供者/模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的提供者操作逾時（毫秒）。省略時，OpenClaw 會使用已設定的 `agents.defaults.videoGenerationModel.timeoutMs`，否則在存在時使用外掛作者定義的提供者預設值。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 物件提供的提供者特定選項（例如 `{"seed": 42, "draft": true}`）。
  宣告型別結構描述的提供者會驗證鍵和值型別；未知的
  鍵或不相符的型別會在備援期間略過該候選項。未
  宣告結構描述的提供者會原樣接收選項。執行 `video_generate action=list`
  可查看每個提供者接受的內容。
</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 會將時長正規化為
最接近的提供者支援值，並在備援提供者公開不同
控制介面時，重新對應翻譯後的幾何提示，
例如尺寸轉長寬比。真正不支援的覆寫會以盡力而為
方式忽略，並在工具結果中回報為警告。硬性能力限制
（例如參考輸入過多）會在提交前失敗。工具結果會
回報已套用的設定；`details.normalization` 會擷取任何
從請求到套用的轉換。
</Note>

參考輸入會選擇執行階段模式：

- 無參考媒體 -> `generate`
- 任何圖片參考 -> `imageToVideo`
- 任何影片參考 -> `videoToVideo`
- 參考音訊輸入**不會**變更解析後的模式；它們會套用在
  圖片/影片參考所選模式之上，且只適用於
  宣告 `maxInputAudios` 的提供者。

混合圖片與影片參考不是穩定的共享能力介面。
建議每次請求只使用一種參考類型。

#### 備援與型別化選項

部分能力檢查會套用於備援層，而不是工具
邊界，因此超過主要提供者限制的請求仍可
在具備能力的備援上執行：

- 當請求包含音訊參考時，未宣告 `maxInputAudios`（或為 `0`）的作用中候選項會被略過；
  接著會嘗試下一個候選項。相同的
  防護也會將圖片和影片參考數量與
  `maxInputImages`/`maxInputVideos` 比對。
- 作用中候選項的 `maxDurationSeconds` 低於請求的 `durationSeconds`
  且未宣告 `supportedDurationSeconds` 清單 -> 略過。
- 請求包含 `providerOptions`，且作用中候選項明確
  宣告型別化 `providerOptions` 結構描述 -> 如果提供的鍵不在
  結構描述中，或值型別不相符，則略過。未
  宣告結構描述的提供者會原樣接收選項（向後相容的
  透傳）。提供者可透過宣告空結構描述
  （`capabilities.providerOptions: {}`）選擇停用所有提供者選項，
  這會造成與型別不相符相同的略過結果。

請求中的第一個略過原因會以 `warn` 記錄，讓操作員看見
其主要提供者被略過；後續略過會以 `debug` 記錄，以
避免讓長備援鏈過於吵雜。如果每個候選項都被略過，
彙總錯誤會包含每個候選項的略過原因。

## 動作

| 動作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。從給定提示詞和選用的參考輸入建立影片。                                                           |
| `status`   | 檢查目前工作階段中進行中的影片任務狀態，不會開始另一個生成。                                           |
| `list`     | 顯示可用的提供者、模型及其能力。                                                                       |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** - 如果代理程式在呼叫中指定。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** - 具有效驗證的提供者，從
   目前預設提供者開始，接著是其餘提供者（依字母
   順序）。

如果提供者失敗，會自動嘗試下一個候選項。如果所有
候選項都失敗，錯誤會包含每次嘗試的詳細資料。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用
明確的 `model`、`primary` 和 `fallbacks` 項目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // optional per-tool provider request timeout override
      },
    },
  },
}
```

## 提供者備註

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 非同步端點。參考圖片和
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    提供者 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受圖片輸入；I2V 模型和
    一般 `*-pro-*` 模型支援單一參考圖片（第一
    幀）。以位置方式傳入圖片，或設定 `role: "first_frame"`。
    提供圖片時，T2V 模型 ID 會自動切換為對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林值 -
    強制 480p）、`camera_fixed`（布林值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部，未內建）。提供者 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。請在每張圖片上設定 `role: "first_frame"` / `"last_frame"`，或
    以位置方式傳入圖片。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應到 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部，未內建）。提供者 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。支援最多 9 張參考圖片、
    3 部參考影片和 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。請在每個素材上設定 `role` - 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應到 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    由工作流程驅動的本機或雲端執行。透過已設定的圖形支援文字轉影片和
    圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援的流程。OpenClaw 預設最多等待 20
    分鐘，之後會將進行中的 fal 佇列工作視為逾時。大多數 fal 影片模型
    接受單一圖片參照。Seedance 2.0 參照轉影片
    模型最多接受 9 張圖片、3 段影片和 3 個音訊參照，且
    參照檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個圖片或一個影片參照。在 Gemini API 路徑上，產生音訊的請求會
    被忽略並附帶警告，因為該 API 會拒絕目前 Veo 影片產生的
    `generateAudio` 參數。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一圖片參照。MiniMax 接受 `768P` 和 `1080P`
    解析度；例如 `720P` 這類請求會在提交前正規化為最接近的
    支援值。
  </Accordion>
  <Accordion title="OpenAI">
    只會轉送 `size` 覆寫。其他樣式覆寫
    （`aspectRatio`、`resolution`、`audio`、`watermark`）會被忽略並
    附帶警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    工作、輪詢 `polling_url`，並下載 `unsigned_urls` 或
    文件記載的工作內容端點。內建的 `google/veo-3.1-fast` 預設值
    宣告 4/6/8 秒時長、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    使用與 Alibaba 相同的 DashScope 後端。參照輸入必須是遠端
    `http(s)` URL；本機檔案會預先被拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行會公開 `16:9` 和 `9:16` 長寬
    比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一圖片參照。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重新導向時遺失驗證。
    `veo3` 內建為僅支援文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    支援文字轉影片、單一首影格圖片轉影片、透過 xAI `reference_images`
    提供最多 7 個 `reference_image` 輸入，以及遠端
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

例如 `maxInputImages` 和 `maxInputVideos` 這類扁平彙總欄位
**不足以**宣告轉換模式支援。提供者應
明確宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓即時
測試、合約測試，以及共用的 `video_generate` 工具可以
以確定性方式驗證模式支援。

當某個提供者中的一個模型比其他模型支援更寬的參照輸入時，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整個模式的限制。

## 即時測試

共用內建提供者的選擇加入即時覆蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media video
```

這個即時檔案預設會優先使用已匯出的提供者環境變數，而非儲存的驗證
設定檔，並預設執行發行安全的煙霧測試：

- 對掃描中的每個非 FAL 提供者執行 `generate`。
- 一秒鐘龍蝦提示詞。
- 每個提供者的操作上限來自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（預設為 `180000`）。

FAL 是選擇加入，因為提供者端的佇列延遲可能主導發行
時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，也會執行已宣告的
轉換模式，前提是共用掃描可透過本機媒體安全執行：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled` 且
  提供者/模型在共用掃描中接受以緩衝區支援的本機影片輸入時，
  執行 `videoToVideo`。

目前，共用的 `videoToVideo` 即時管線只會在你
選擇 `runway/gen4_aleph` 時涵蓋 `runway`。

## 設定

在你的 OpenClaw 設定中設定預設的影片產生模型：

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
