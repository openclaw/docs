---
read_when:
    - 透過代理程式產生影片
    - 設定影片生成提供者與模型
    - 了解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 video_generate，跨 16 個提供者後端從文字、圖片或影片參考生成影片
title: 影片生成
x-i18n:
    generated_at: "2026-05-05T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents 可以從文字提示、參照圖片或現有影片生成影片。支援十六個提供者後端，每個後端都有不同的模型選項、輸入模式和功能集。agent 會根據你的設定和可用的 API 金鑰，自動選擇合適的提供者。

<Note>
`video_generate` 工具只有在至少有一個影片生成提供者可用時才會出現。如果你在 agent 工具中看不到它，請設定提供者 API 金鑰，或設定 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 將影片生成視為三種執行階段模式：

- `generate` — 沒有參照媒體的文字轉影片請求。
- `imageToVideo` — 請求包含一張或多張參照圖片。
- `videoToVideo` — 請求包含一段或多段參照影片。

提供者可以支援這些模式的任意子集。工具會在送出前驗證作用中的模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="Configure auth">
    為任何支援的提供者設定 API 金鑰：

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
    > 生成一段 5 秒鐘的電影感影片，內容是一隻友善的龍蝦在夕陽下衝浪。

    agent 會自動呼叫 `video_generate`。不需要工具允許清單。

  </Step>
</Steps>

## 非同步生成的運作方式

影片生成是非同步的。當 agent 在工作階段中呼叫 `video_generate` 時：

1. OpenClaw 會將請求送交提供者，並立即傳回任務 ID。
2. 提供者會在背景處理工作（通常依提供者和解析度而定，需要 30 秒到 5 分鐘）。
3. 影片準備好後，OpenClaw 會使用內部完成事件喚醒同一個工作階段。
4. agent 會告知使用者並附上完成的影片。在使用僅訊息工具可見傳遞的群組/頻道聊天中，agent 會透過訊息工具轉送結果，而不是由 OpenClaw 直接發布。

當工作進行中時，同一工作階段中重複的 `video_generate` 呼叫會傳回目前任務狀態，而不是啟動另一個生成工作。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可從 CLI 檢查進度。

在沒有工作階段支援的 agent 執行之外（例如直接工具呼叫），工具會退回為行內生成，並在同一回合中傳回最終媒體路徑。

當提供者傳回位元組時，生成的影片檔案會儲存在 OpenClaw 管理的媒體儲存空間下。預設的生成影片儲存上限會遵循影片媒體限制，而 `agents.defaults.mediaMaxMb` 會提高此限制以支援較大的算繪結果。當提供者也傳回託管輸出 URL 時，如果本機持久化因檔案過大而拒絕儲存，OpenClaw 可以傳遞該 URL，而不是讓任務失敗。

### 任務生命週期

| 狀態        | 意義                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待提供者接受。                                                                 |
| `running`   | 提供者正在處理（通常依提供者和解析度而定，需要 30 秒到 5 分鐘）。                                |
| `succeeded` | 影片已準備好；agent 會被喚醒並將影片發布到對話中。                                               |
| `failed`    | 提供者錯誤或逾時；agent 會被喚醒並收到錯誤詳細資料。                                             |

從 CLI 檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果目前工作階段已有影片任務處於 `queued` 或 `running`，`video_generate` 會傳回現有任務狀態，而不是啟動新的任務。使用 `action: "status"` 可明確檢查狀態，而不觸發新的生成工作。

## 支援的提供者

| 提供者                | 預設模型                        | 文字 | 圖片參照                                             | 影片參照                                        | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（僅限 I2V 模型；第一幀 + 最後一幀）    | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一幀 + 最後一幀）       | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參照圖片                                    | 最多 3 段影片                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                             | —                                               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；使用 Seedance 參照轉影片時最多 9 張        | 使用 Seedance 參照轉影片時最多 3 段影片         | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                             | 1 段影片                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                             | —                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                             | 1 段影片                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一/最後一幀或參照）                 | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                             | 1 段影片                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 張圖片                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 張第一幀圖片，或最多 7 張 `reference_image`        | 1 段影片                                        | `XAI_API_KEY`                            |

部分提供者接受額外或替代的 API 金鑰環境變數。詳情請參閱個別[提供者頁面](#related)。

執行 `video_generate action=list` 可在執行階段檢視可用的提供者、模型和執行階段模式。

### 功能矩陣

`video_generate`、契約測試和共享即時掃描所使用的明確模式契約：

| 提供者     | `generate` | `imageToVideo` | `videoToVideo` | 今日共享即時 lanes                                                                                                                       |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                   |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | 不在共享掃描中；工作流程專屬覆蓋範圍位於 Comfy 測試中                                                                                   |
| DeepInfra  |     ✓      |       —        |       —        | `generate`；原生 DeepInfra 影片 schema 在隨附契約中是文字轉影片                                                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；僅在使用 Seedance 參照轉影片時支援 `videoToVideo`                                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共享 `videoToVideo`，因為目前以緩衝區支援的 Gemini/Veo 掃描不接受該輸入                                  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過共享 `videoToVideo`，因為此組織/輸入路徑目前需要提供者端的 inpaint/remix 存取權限                         |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者需要遠端 `http(s)` 影片 URL                                                   |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有當選取的模型是 `runway/gen4_aleph` 時才執行 `videoToVideo`                                                |
| Together   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`；略過共享 `imageToVideo`，因為隨附的 `veo3` 僅支援文字，且隨附的 `kling` 需要遠端圖片 URL                                      |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；略過 `videoToVideo`，因為此提供者目前需要遠端 MP4 URL                                                         |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要生成的影片文字描述。`action: "generate"` 必填。
</ParamField>

### 內容輸入

<ParamField path="image" type="string">單一參考影像（路徑或 URL）。</ParamField>
<ParamField path="images" type="string[]">多個參考影像（最多 9 個）。</ParamField>
<ParamField path="imageRoles" type="string[]">
可選的逐位置角色提示，與合併後的影像清單平行對應。
標準值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">單一參考影片（路徑或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多個參考影片（最多 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
可選的逐位置角色提示，與合併後的影片清單平行對應。
標準值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
單一參考音訊（路徑或 URL）。當供應商支援音訊輸入時，
用於背景音樂或語音參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可選的逐位置角色提示，與合併後的音訊清單平行對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給供應商。標準值來自
`VideoGenerationAssetRole` 聯集，但供應商可能接受其他
角色字串。`*Roles` 陣列的項目數不得超過對應的
參考清單；差一項的錯誤會以明確錯誤失敗。
使用空字串可讓某個位置保持未設定。對於 xAI，將每個影像角色都設為
`reference_image` 以使用其 `reference_images` 生成模式；若要使用單影像的影像轉影片，
請省略角色或使用 `first_frame`。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` 或 `adaptive`。
</ParamField>
<ParamField path="resolution" type="string">`480P`、`720P`、`768P` 或 `1080P`。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標秒數長度（四捨五入到最接近的供應商支援值）。
</ParamField>
<ParamField path="size" type="string">供應商支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支援時在輸出中啟用生成音訊。與 `audioRef*`（輸入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">支援時切換供應商浮水印。</ParamField>

`adaptive` 是供應商特定的哨兵值：它會原樣轉送給
在能力中宣告 `adaptive` 的供應商（例如 BytePlus
Seedance 會用它從輸入影像尺寸自動偵測比例）。
未宣告它的供應商會在工具結果中透過
`details.ignoredOverrides` 顯示該值，讓忽略情況可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前工作階段的任務；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">供應商／模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可選的供應商請求逾時時間，以毫秒為單位。</ParamField>
<ParamField path="providerOptions" type="object">
  供應商特定選項，以 JSON 物件表示（例如 `{"seed": 42, "draft": true}`）。
  宣告型別化結構描述的供應商會驗證鍵與型別；未知
  鍵或不相符會在後援期間略過該候選項。沒有
  宣告結構描述的供應商會原樣接收選項。執行 `video_generate action=list`
  可查看每個供應商接受的內容。
</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 會將時長標準化為
最接近的供應商支援值，並在後援供應商提供不同
控制介面時，重新對應翻譯後的幾何提示，例如尺寸轉長寬比。
真正不支援的覆寫會盡力忽略，並在工具結果中以警告回報。
硬性能力限制（例如參考輸入過多）會在提交前失敗。工具結果
會回報已套用的設定；`details.normalization` 會捕捉任何
從請求到套用的轉換。
</Note>

參考輸入會選擇執行階段模式：

- 沒有參考媒體 → `generate`
- 任何影像參考 → `imageToVideo`
- 任何影片參考 → `videoToVideo`
- 參考音訊輸入**不會**改變已解析的模式；它們會套用在
  影像／影片參考所選模式之上，且只會搭配
  宣告 `maxInputAudios` 的供應商運作。

混合影像與影片參考不是穩定的共享能力介面。
建議每次請求只使用一種參考類型。

#### 後援與型別化選項

部分能力檢查會套用在後援層，而不是
工具邊界，因此超過主要供應商限制的請求仍可
在有能力的後援上執行：

- 當請求包含音訊參考時，未宣告 `maxInputAudios`（或為 `0`）的
  作用中候選項會被略過；接著嘗試下一個候選項。
- 作用中候選項的 `maxDurationSeconds` 低於請求的 `durationSeconds`，
  且未宣告 `supportedDurationSeconds` 清單 → 略過。
- 請求包含 `providerOptions`，且作用中候選項明確
  宣告型別化 `providerOptions` 結構描述 → 若提供的鍵
  不在結構描述中，或值型別不相符，則略過。沒有
  宣告結構描述的供應商會原樣接收選項（向後相容
  直通）。供應商可透過宣告空結構描述
  （`capabilities.providerOptions: {}`）選擇退出所有供應商選項，
  這會造成與型別不相符相同的略過結果。

請求中的第一個略過原因會以 `warn` 記錄，讓操作人員看見
其主要供應商何時被跳過；後續略過會以 `debug` 記錄，以
讓較長的後援鏈保持安靜。如果每個候選項都被略過，
彙總錯誤會包含每個候選項的略過原因。

## 動作

| 動作       | 功能                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。從給定提示和可選參考輸入建立影片。                                                               |
| `status`   | 檢查目前工作階段中進行中影片任務的狀態，不會開始另一個生成。                                           |
| `list`     | 顯示可用供應商、模型及其能力。                                                                          |

## 模型選擇

OpenClaw 會依下列順序解析模型：

1. **`model` 工具參數** — 如果代理在呼叫中指定。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** — 具有有效驗證的供應商，從
   目前預設供應商開始，接著是剩餘供應商的字母
   順序。

如果供應商失敗，會自動嘗試下一個候選項。如果所有
候選項都失敗，錯誤會包含每次嘗試的詳細資訊。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用
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
    使用 DashScope / Model Studio 非同步端點。參考影像和
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    供應商 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受影像輸入；I2V 模型和
    一般 `*-pro-*` 模型支援單一參考影像（第一幀）。
    以位置方式傳入影像，或設定 `role: "first_frame"`。
    提供影像時，T2V 模型 ID 會自動切換到對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林 —
    強制 480p）、`camera_fixed`（布林）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin。供應商 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 個輸入影像
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。在每個影像上設定 `role: "first_frame"` / `"last_frame"`，或
    以位置方式傳入影像。

    `aspectRatio: "adaptive"` 會從輸入影像自動偵測比例。
    `audio: true` 會對應到 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin。供應商 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。最多支援 9 個參考影像、
    3 個參考影片和 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。在每個資產上設定 `role` — 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會從輸入影像自動偵測比例。
    `audio: true` 會對應到 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流程驅動的本機或雲端執行。透過已設定的圖支援文字轉影片和
    影像轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援流程。多數 fal 影片模型
    接受單一影像參考。Seedance 2.0 參考轉影片
    模型最多接受 9 個影像、3 個影片和 3 個音訊參考，
    且參考檔案總數最多為 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一個影像或一個影片參考。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一影像參考。
  </Accordion>
  <Accordion title="OpenAI">
    只會轉送 `size` 覆寫。其他樣式覆寫
    （`aspectRatio`、`resolution`、`audio`、`watermark`）會被忽略並
    顯示警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的非同步 `/videos` API。OpenClaw 會提交
    工作、輪詢 `polling_url`，並下載 `unsigned_urls` 或
    文件化的工作內容端點。內建的 `google/veo-3.1-fast` 預設值
    宣告 4/6/8 秒時長、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    與 Alibaba 相同的 DashScope 後端。參考輸入必須是遠端
    `http(s)` URL；本機檔案會預先被拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行會公開 `16:9` 和 `9:16` 長寬比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一影像參考。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1`，以避免會丟失驗證的
    重新導向。`veo3` 內建為僅文字轉影片；`kling` 需要
    遠端影像 URL。
  </Accordion>
  <Accordion title="xAI">
    支援文字轉影片、單一第一幀影像轉影片、透過 xAI
    `reference_images` 最多 7 個 `reference_image` 輸入，以及遠端
    影片編輯／延伸流程。
  </Accordion>
</AccordionGroup>

## 供應商能力模式

共享的影片生成合約支援特定模式能力，而不只是扁平的彙總限制。新的提供者實作應優先使用明確的模式區塊：

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

像 `maxInputImages` 和 `maxInputVideos` 這類扁平彙總欄位，**不足以**宣告支援轉換模式。提供者應明確宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓即時測試、合約測試和共享的 `video_generate` 工具能夠以決定性的方式驗證模式支援。

當提供者中的某個模型比其他模型支援更寬的參照輸入時，請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或 `maxInputAudiosByModel`，而不是提高整個模式的限制。

## 即時測試

為共享的內建提供者選擇加入即時覆蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media video
```

這個即時檔案會從 `~/.profile` 載入缺少的提供者環境變數，預設優先使用即時/環境 API 金鑰，而不是已儲存的驗證設定檔，並且預設執行適合發布流程的煙霧測試：

- 針對掃描範圍中每個非 FAL 提供者執行 `generate`。
- 一秒鐘的龍蝦提示詞。
- 依提供者設定的操作上限來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（預設為 `180000`）。

FAL 是選擇加入，因為提供者端佇列延遲可能主導發布時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，也會執行共享掃描可透過本機媒體安全測試的已宣告轉換模式：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled` 且提供者/模型在共享掃描中接受以緩衝區支援的本機影片輸入時，執行 `videoToVideo`。

目前，只有在你選取 `runway/gen4_aleph` 時，共享的 `videoToVideo` 即時通道才會涵蓋 `runway`。

## 設定

在你的 OpenClaw 設定中設定預設影片生成模型：

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
- [背景工作](/zh-TW/automation/tasks) — 用於非同步影片生成的工作追蹤
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
