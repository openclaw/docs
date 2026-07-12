---
read_when:
    - 透過代理程式產生影片
    - 設定影片生成供應商與模型
    - 瞭解 video_generate 工具的參數
sidebarTitle: Video generation
summary: 透過 `video_generate`，使用文字、圖片或影片參考，在 16 個供應商後端上產生影片
title: 影片生成
x-i18n:
    generated_at: "2026-07-11T21:53:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw 代理程式可透過 `video_generate`，根據文字提示、參考圖片或
現有影片生成影片。支援十六種提供者後端；代理程式會依據設定與
可用的 API 金鑰，自動選擇合適的後端。

<Note>
只有在至少有一個影片生成提供者可用時，`video_generate` 才會顯示。
如果代理程式工具中沒有此工具，請設定提供者 API 金鑰，或
設定 `agents.defaults.videoGenerationModel`。
</Note>

`video_generate` 有三種執行階段模式，會依據呼叫中的參考輸入決定：

- `generate` - 無參考媒體（文字轉影片）。
- `imageToVideo` - 一張或多張參考圖片。
- `videoToVideo` - 一部或多部參考影片。

提供者可支援這些模式的任意子集。工具會在提交前驗證
目前模式，並在 `action=list` 中回報支援的模式。

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
  <Step title="要求代理程式">
    > 生成一段 5 秒的電影風格影片，內容是一隻友善的龍蝦在夕陽下衝浪。

    代理程式會自動呼叫 `video_generate`。不需要將工具加入允許清單。

  </Step>
</Steps>

## 非同步生成的運作方式

影片生成採用非同步方式：

1. OpenClaw 將請求提交給提供者，並立即傳回任務 ID。
2. 提供者在背景處理工作（通常需要 30 秒到數分鐘，視提供者與解析度而定；由緩慢佇列支援的提供者最長可執行至設定的逾時時間）。
3. 影片準備完成後，OpenClaw 會透過內部完成事件喚醒同一個工作階段。
4. 代理程式會透過工作階段的一般可見回覆模式回報：
   自動最終回覆，或當工作階段要求使用訊息工具時呼叫 `message(action="send")`。
   如果請求者工作階段不活躍，或喚醒失敗，且完成回覆中仍缺少生成的媒體，
   OpenClaw 會以具冪等性的直接備援方式傳送媒體。

工作進行期間，同一工作階段中重複呼叫 `video_generate` 會傳回
目前的任務狀態，而不會開始另一次生成。使用 `action: "status"`
可在不觸發新生成的情況下檢查狀態，或從命令列介面使用
`openclaw tasks list` / `openclaw tasks show <lookup>`
（請參閱[背景任務](/zh-TW/automation/tasks)）。

在不具工作階段支援的代理程式執行環境之外（例如直接叫用工具），
工具會退回內嵌生成方式，並在同一輪中傳回最終媒體路徑。

當提供者傳回位元組資料時，生成的影片檔案會儲存於 OpenClaw 管理的媒體儲存空間。
預設上限為 16MB（共用影片媒體上限）；`agents.defaults.mediaMaxMb`
可提高此上限，以容納較大的渲染結果。當提供者也傳回託管的輸出 URL 時，
若本機持久化因檔案過大而拒絕儲存，OpenClaw 會改為傳送該 URL，
而不會讓任務失敗。

### 任務生命週期

| 狀態        | 含義                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待提供者接受。                                                                 |
| `running`   | 提供者正在處理（通常需要 30 秒到數分鐘，視提供者與解析度而定）。                                  |
| `succeeded` | 影片已準備完成；代理程式會被喚醒，並將影片發佈至對話中。                                           |
| `failed`    | 提供者發生錯誤或逾時；代理程式會被喚醒並收到錯誤詳細資料。                                         |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## 支援的提供者

| 提供者                | 預設模型                        | 文字 | 圖片參考                                              | 影片參考                                        | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                        | 是（遠端 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（僅限 I2V 模型；第一幀與最後一幀）       | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一幀與最後一幀）           | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參考圖片                                     | 最多 3 部影片                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                              | -                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                     | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；使用 Seedance 參考轉影片時最多 9 張          | 使用 Seedance 參考轉影片時最多 3 部影片          | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                              | 1 部影片                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                              | -                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                              | 1 部影片                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一幀／最後一幀或參考圖片）             | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                        | 是（遠端 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                              | 1 部影片                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 僅限 `Wan-AI/Wan2.2-I2V-A14B`                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                   | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 經典版：1 個首幀或 7 個參考；1.5：1 幀                 | 經典版：1 部影片                                | `XAI_API_KEY`                            |

部分提供者接受額外或替代的 API 金鑰環境變數。詳情請參閱
各個[提供者頁面](#related)。

執行 `video_generate action=list`，即可在執行階段檢視可用的提供者、
模型與執行階段模式。

### 功能矩陣

以下是 `video_generate`、契約測試與共用即時全面測試使用的明確模式契約：

| 提供者     | `generate` | `imageToVideo` | `videoToVideo` | 目前的共用即時測試管道                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                 |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共用全面測試中；工作流程特定的涵蓋範圍由 Comfy 測試負責                                                                             |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；原生 DeepInfra 影片結構描述在外掛契約中屬於文字轉影片                                                                       |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有使用 Seedance 參考轉影片時才支援 `videoToVideo`                                                         |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共用 `videoToVideo`，因為目前以緩衝區為基礎的 Gemini/Veo 全面測試不接受該輸入                            |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共用 `videoToVideo`，因為此組織／輸入路徑目前需要提供者端的影片編輯存取權限                              |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                 |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在所選模型為 `runway/gen4_aleph` 時才執行 `videoToVideo`                                                 |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；略過共用 `imageToVideo`，因為內建的 `veo3` 僅支援文字，而內建的 `kling` 需要遠端圖片 URL                                     |
| xAI        |     ✓      |       ✓        |       ✓        | 經典版支援所有模式；Video 1.5 僅支援圖片轉影片；遠端 MP4 輸入使 `videoToVideo` 不納入共用全面測試                                        |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要生成之影片的文字描述。`action: "generate"` 必須提供此參數。
</ParamField>

### 內容輸入

<ParamField path="image" type="string">單一參考圖片（路徑或 URL）。</ParamField>
<ParamField path="images" type="string[]">多張參考圖片（最多 9 張）。</ParamField>
<ParamField path="imageRoles" type="string[]">
選用的逐位置角色提示，與合併後的圖片清單一一對應。
標準值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">單一參考影片（路徑或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多個參考影片（最多 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
選用的逐位置角色提示，與合併後的影片清單一一對應。
標準值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
單一參考音訊（路徑或 URL）。當提供者支援音訊輸入時，用於背景音樂或語音
參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
選用的逐位置角色提示，與合併後的音訊清單一一對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給提供者。標準值來自
`VideoGenerationAssetRole` 聯集，但提供者可能接受其他
角色字串。`*Roles` 陣列的項目數不得多於
對應的參考清單；差一錯誤會產生明確的錯誤訊息。
使用空字串可讓某個位置維持未設定。針對 xAI，將每個圖片角色設為
`reference_image`，以使用其 `reference_images` 生成模式；若要進行單一圖片的圖片轉影片，
請省略角色或使用 `first_frame`。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  長寬比提示，例如 `1:1`、`16:9`、`9:16`、`adaptive`，或提供者特定的值。OpenClaw 會依提供者正規化或忽略不支援的值。
</ParamField>
<ParamField path="resolution" type="string">解析度提示，例如 `360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`，或提供者特定的值。OpenClaw 會依提供者正規化或忽略不支援的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時長（秒，四捨五入至最接近的提供者支援值）。
</ParamField>
<ParamField path="size" type="string">提供者支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  在支援時啟用輸出中的生成音訊。與 `audioRef*`（輸入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">在支援時切換提供者浮水印。</ParamField>

`adaptive` 是提供者特定的哨兵值：對於在功能中宣告 `adaptive` 的
提供者，會將其原樣轉送（例如 BytePlus
Seedance 使用它根據輸入圖片
尺寸自動偵測比例）。未宣告此值的提供者會透過工具結果中的
`details.ignoredOverrides` 顯示該值，讓遭捨棄的設定清楚可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前工作階段的任務；`"list"` 會檢視提供者。
</ParamField>
<ParamField path="model" type="string">提供者／模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的提供者操作逾時（毫秒）。若省略，OpenClaw 會使用已設定的 `agents.defaults.videoGenerationModel.timeoutMs`，否則在外掛定義的提供者預設值存在時使用該值。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 物件表示的提供者特定選項（例如 `{"seed": 42, "draft": true}`）。
  宣告型別結構描述的提供者會驗證鍵和值型別；未知
  鍵或不相符的型別會在備援期間略過該候選項。未
  宣告結構描述的提供者會原樣接收選項。執行 `video_generate action=list`
  可查看每個提供者接受的選項。
</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 會將時長正規化為
最接近的提供者支援值；當備援提供者公開不同的
控制介面時，也會重新對應經轉換的幾何提示，
例如將尺寸轉為長寬比。真正不支援的覆寫會以盡力而為的
方式忽略，並在工具結果中回報為警告。硬性功能限制
（例如參考輸入過多）會在提交前失敗。工具結果會
回報已套用的設定；`details.normalization` 會記錄任何
從要求值到套用值的轉換。
</Note>

參考輸入會選取執行階段模式：

- 無參考媒體 -> `generate`
- 任何圖片參考 -> `imageToVideo`
- 任何影片參考 -> `videoToVideo`
- 參考音訊輸入**不會**變更解析後的模式；它們會套用在
  圖片／影片參考所選模式之上，且僅適用於
  宣告 `maxInputAudios` 的提供者。

混合圖片與影片參考並非穩定的共用功能介面。
每個請求建議只使用一種參考類型。

#### 備援與型別化選項

某些功能檢查會在備援層而非工具
邊界套用，因此超出主要提供者限制的請求，仍可在具備相應功能的備援提供者上
執行：

- 當請求包含音訊參考時，若目前候選項未宣告 `maxInputAudios`（或宣告為 `0`），
  便會略過該候選項並嘗試下一個候選項。相同的
  防護也適用於圖片和影片參考數量與
  `maxInputImages`／`maxInputVideos` 的比較。
- 目前候選項的 `maxDurationSeconds` 低於要求的 `durationSeconds`，
  且未宣告 `supportedDurationSeconds` 清單 -> 略過。
- 請求包含 `providerOptions`，且目前候選項明確
  宣告型別化的 `providerOptions` 結構描述 -> 若提供的鍵
  不在結構描述中或值型別不相符，則略過。未
  宣告結構描述的提供者會原樣接收選項（向後相容的
  直接傳遞）。提供者可透過宣告空結構描述
  （`capabilities.providerOptions: {}`）選擇不接受任何提供者選項，這會
  產生與型別不相符相同的略過結果。

請求中的第一個略過原因會以 `warn` 層級記錄，讓操作人員得知
其主要提供者已被跳過；後續略過會以 `debug` 層級記錄，
以免冗長的備援鏈產生過多訊息。若所有候選項皆被略過，
彙總錯誤會包含每個候選項的略過原因。

## 動作

| 動作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設值。依據指定的提示詞與選用的參考輸入建立影片。                                                       |
| `status`   | 在不啟動另一次生成的情況下，檢查目前工作階段中進行中影片任務的狀態。                                     |
| `list`     | 顯示可用的提供者、模型及其功能。                                                                         |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** - 若代理程式在呼叫中指定此參數。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** - 從目前的預設提供者開始，接著依字母
   順序檢查其餘具備有效驗證資訊的提供者。

若某個提供者失敗，會自動嘗試下一個候選項。若所有
候選項皆失敗，錯誤會包含每次嘗試的詳細資訊。

將 `agents.defaults.mediaGenerationAutoProviderFallback: false` 設定為僅使用
明確指定的 `model`、`primary` 與 `fallbacks` 項目。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // 選用的每工具提供者請求逾時覆寫
      },
    },
  },
}
```

## 提供者注意事項

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope／Model Studio 非同步端點。參考圖片和
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    提供者 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受圖片輸入；I2V 模型和
    一般 `*-pro-*` 模型支援單一參考圖片（第一個
    畫面）。依位置傳入圖片，或設定 `role: "first_frame"`。
    提供圖片時，T2V 模型 ID 會自動切換至對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林值 -
    強制使用 480p）、`camera_fixed`（布林值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部提供，未內建）。提供者 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。對每張圖片設定 `role: "first_frame"`／`"last_frame"`，或
    依位置傳入圖片。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    外掛（外部提供，未內建）。提供者 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。最多支援 9 張參考圖片、
    3 個參考影片和 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。為每個資產設定 `role` - 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會根據輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    以工作流程驅動的本機或雲端執行。透過已設定的圖形支援文字轉影片與
    圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援流程。OpenClaw 預設會等待最多 20
    分鐘，之後便將仍在進行中的 fal 佇列工作視為逾時。大多數 fal 影片模型
    接受單一圖片參照。Seedance 2.0 參照轉影片模型最多接受 9 張圖片、
    3 部影片及 3 個音訊參照，參照檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個圖片或一個影片參照。透過 Gemini API 路徑提出的音訊生成要求
    會被忽略並顯示警告，因為該 API 會拒絕目前 Veo 影片生成所使用的
    `generateAudio` 參數。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一圖片參照。MiniMax 接受 `768P` 與 `1080P`
    解析度；提交前，會將 `720P` 等要求正規化為最接近的
    支援值。
  </Accordion>
  <Accordion title="OpenAI">
    僅轉送 `size` 覆寫。其他樣式覆寫
    （`aspectRatio`、`resolution`、`audio`、`watermark`）會被忽略並
    顯示警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    工作、輪詢 `polling_url`，並從 `unsigned_urls` 或
    文件記載的工作內容端點下載結果。內建的預設 `google/veo-3.1-fast`
    宣告支援 4/6/8 秒時長、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    使用與 Alibaba 相同的 DashScope 後端。參照輸入必須是遠端
    `http(s)` URL；本機檔案會預先遭到拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行提供 `16:9` 與 `9:16`
    長寬比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一圖片參照。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免重新導向時遺失
    驗證資訊。內建的 `veo3` 僅支援文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    預設的 `grok-imagine-video` 模型支援文字轉影片、以單一首幀
    圖片轉影片、透過 xAI `reference_images` 傳入最多 7 個
    `reference_image` 輸入，以及遠端影片編輯／延伸流程。生成預設
    為 `480P`；單一圖片轉影片在省略 `aspectRatio` 時會沿用來源長寬比。
    影片編輯／延伸會沿用輸入的幾何尺寸，且不接受長寬比或解析度覆寫。
    延伸接受 2 至 10 秒。

    `grok-imagine-video-1.5` 僅支援圖片轉影片：請提供恰好一張圖片。
    它支援 1 至 15 秒，以及 `480P`、`720P` 或 `1080P`，預設為
    `480P`；省略 `aspectRatio` 即可沿用來源圖片的長寬比。預覽版
    與帶日期的 1.5 識別碼會接受相同驗證，並保持不變地轉送。

  </Accordion>
</AccordionGroup>

## 提供者能力模式

共用影片生成合約支援依模式區分的能力，
而不僅是扁平的彙總限制。新的提供者實作
應優先採用明確的模式區塊：

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

`maxInputImages` 與 `maxInputVideos` 等扁平彙總欄位
**不足以**宣告轉換模式支援。提供者應明確宣告
`generate`、`imageToVideo` 與 `videoToVideo`，讓即時
測試、合約測試及共用 `video_generate` 工具能以
確定性的方式驗證模式支援。

當提供者中的某個模型比其他模型支援更多參照輸入時，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不要提高整個模式的限制。

## 即時測試

共用內建提供者的選擇性啟用即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media video
```

此即時測試檔預設會優先使用已匯出的提供者環境變數，而非已儲存的驗證
設定檔，並預設執行適合發布流程的煙霧測試：

- 對測試範圍內每個非 FAL 提供者執行 `generate`。
- 一秒鐘的龍蝦提示詞。
- 每個提供者的操作時間上限由
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 設定（預設為 `180000`）。

FAL 採選擇性啟用，因為提供者端的佇列延遲可能主導發布
所需時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，亦可執行共用測試範圍
能以本機媒體安全測試的已宣告轉換模式：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled`，且提供者／模型在共用
  測試範圍內接受由緩衝區支援的本機影片輸入時，執行 `videoToVideo`。

目前，共用 `videoToVideo` 即時測試通道僅在選取
`runway/gen4_aleph` 時涵蓋 `runway`。

## 設定

在 OpenClaw 設定中設定預設影片生成模型：

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
- [背景工作](/zh-TW/automation/tasks) - 非同步影片生成的工作追蹤
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
