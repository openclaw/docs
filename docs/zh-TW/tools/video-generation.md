---
read_when:
    - 透過代理程式產生影片
    - 設定影片生成提供者與模型
    - 了解 video_generate 工具參數
sidebarTitle: Video generation
summary: 透過 video_generate，從文字、圖片或影片參照跨 16 個供應商後端產生影片
title: 影片生成
x-i18n:
    generated_at: "2026-04-30T03:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents 可以從文字提示、參考圖片或既有影片產生影片。支援十六種供應商後端，每種都有不同的模型選項、輸入模式與功能集。agent 會根據你的設定與可用的 API keys 自動選擇合適的供應商。

<Note>
`video_generate` 工具只會在至少有一個影片產生供應商可用時出現。如果你在 agent 工具中看不到它，請設定供應商 API key 或設定 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 將影片產生視為三種執行階段模式：

- `generate` — 沒有參考媒體的文字轉影片請求。
- `imageToVideo` — 請求包含一張或多張參考圖片。
- `videoToVideo` — 請求包含一個或多個參考影片。

供應商可以支援這些模式的任意子集。工具會在提交前驗證作用中的模式，並在 `action=list` 中回報支援的模式。

## 快速開始

<Steps>
  <Step title="設定驗證">
    為任何支援的供應商設定 API key：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="選擇預設模型（選用）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="詢問 agent">
    > 產生一段 5 秒的電影感影片，內容是一隻友善的龍蝦在日落時衝浪。

    agent 會自動呼叫 `video_generate`。不需要工具允許清單。

  </Step>
</Steps>

## 非同步產生如何運作

影片產生是非同步的。當 agent 在 session 中呼叫 `video_generate` 時：

1. OpenClaw 會將請求提交給供應商，並立即回傳 task id。
2. 供應商會在背景處理工作（通常 30 秒到 5 分鐘，取決於供應商與解析度）。
3. 影片準備好後，OpenClaw 會用內部完成事件喚醒同一個 session。
4. agent 會將完成的影片張貼回原始對話。

當工作正在進行時，同一個 session 中重複的 `video_generate` 呼叫會回傳目前的任務狀態，而不是開始另一個產生工作。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 從 CLI 檢查進度。

在沒有 session 支援的 agent 執行之外（例如直接工具叫用），工具會退回到行內產生，並在同一回合回傳最終媒體路徑。

當供應商回傳位元組時，產生的影片檔案會儲存在 OpenClaw 管理的媒體儲存空間下。預設的產生影片儲存上限會遵循影片媒體限制，而 `agents.defaults.mediaMaxMb` 會提高上限以支援較大的算繪。當供應商也回傳託管輸出 URL 時，如果本機持久化因檔案過大而拒絕，OpenClaw 可以改為傳遞該 URL，而不是讓任務失敗。

### 任務生命週期

| 狀態        | 意義                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待供應商接受。                                                                 |
| `running`   | 供應商正在處理（通常 30 秒到 5 分鐘，取決於供應商與解析度）。                                    |
| `succeeded` | 影片已準備好；agent 會被喚醒並將它張貼到對話。                                                   |
| `failed`    | 供應商錯誤或逾時；agent 會被喚醒並附上錯誤詳細資料。                                             |

從 CLI 檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果目前 session 已經有影片任務處於 `queued` 或 `running`，`video_generate` 會回傳既有任務狀態，而不是開始新的任務。使用 `action: "status"` 可明確檢查，而不會觸發新的產生工作。

## 支援的供應商

| 供應商                | 預設模型                        | 文字 | 圖片參考                                             | 影片參考                                        | 驗證                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 張圖片（僅限 I2V 模型；第一格 + 最後一格）    | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 張圖片（透過角色指定第一格 + 最後一格）       | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 張參考圖片                                    | 最多 3 個影片                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 張圖片                                             | —                                               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 張圖片；Seedance reference-to-video 最多 9 張      | Seedance reference-to-video 最多 3 個影片       | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 張圖片                                             | 1 個影片                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 張圖片                                             | —                                               | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 張圖片                                             | 1 個影片                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最多 4 張圖片（第一/最後一格或參考圖）               | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 是（遠端 URL）                                       | 是（遠端 URL）                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 張圖片                                             | 1 個影片                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 張圖片                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 張圖片（`kling`）                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 張首格圖片或最多 7 張 `reference_image`s           | 1 個影片                                        | `XAI_API_KEY`                            |

有些供應商接受額外或替代的 API key 環境變數。詳情請參閱個別[供應商頁面](#related)。

執行 `video_generate action=list` 可在執行階段檢查可用的供應商、模型與執行階段模式。

### 功能矩陣

`video_generate`、合約測試與共享 live sweep 使用的明確模式合約：

| 供應商     | `generate` | `imageToVideo` | `videoToVideo` | 目前的共享 live lanes                                                                                                                   |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已跳過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | 不在共享 sweep 中；workflow 專屬涵蓋範圍位於 Comfy 測試中                                                                                |
| DeepInfra  |     ✓      |       —        |       —        | `generate`；原生 DeepInfra 影片 schema 在內建合約中是文字轉影片                                                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；僅在使用 Seedance reference-to-video 時支援 `videoToVideo`                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳過，因為目前以 buffer 支援的 Gemini/Veo sweep 不接受該輸入                           |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳過，因為此組織/輸入路徑目前需要供應商端 inpaint/remix 存取權                         |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已跳過 `videoToVideo`，因為此供應商需要遠端 `http(s)` 影片 URL                                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；只有在所選模型為 `runway/gen4_aleph` 時才執行 `videoToVideo`                                                 |
| Together   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`；共享 `imageToVideo` 已跳過，因為內建的 `veo3` 僅支援文字，而內建的 `kling` 需要遠端圖片 URL                                  |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；已跳過 `videoToVideo`，因為此供應商目前需要遠端 MP4 URL                                                      |

## 工具參數

### 必填

<ParamField path="prompt" type="string" required>
  要產生的影片文字描述。`action: "generate"` 必填。
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
單一參考音訊（路徑或 URL）。當提供者支援音訊輸入時，用於背景音樂或語音
參考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多個參考音訊（最多 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
可選的逐位置角色提示，與合併後的音訊清單平行對應。
標準值：`reference_audio`。
</ParamField>

<Note>
角色提示會原樣轉送給提供者。標準值來自
`VideoGenerationAssetRole` 聯集，但提供者可能接受其他
角色字串。`*Roles` 陣列的項目數不得超過
對應的參考清單；差一個項目的錯誤會以明確錯誤失敗。
使用空字串可讓某個位置保持未設定。對於 xAI，請將每個圖片角色設為
`reference_image`，以使用其 `reference_images` 生成模式；省略
角色或使用 `first_frame` 則可進行單圖片的圖片轉影片。
</Note>

### 樣式控制

<ParamField path="aspectRatio" type="string">
  `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`，或 `adaptive`。
</ParamField>
<ParamField path="resolution" type="string">`480P`、`720P`、`768P`，或 `1080P`。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時長（秒），會四捨五入到最接近的提供者支援值。
</ParamField>
<ParamField path="size" type="string">提供者支援時使用的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  在支援時啟用輸出中的生成音訊。不同於 `audioRef*`（輸入）。
</ParamField>
<ParamField path="watermark" type="boolean">在支援時切換提供者浮水印。</ParamField>

`adaptive` 是提供者專屬的哨兵值：它會原樣轉送給
在能力中宣告 `adaptive` 的提供者（例如 BytePlus
Seedance 會用它從輸入圖片尺寸自動偵測比例）。
未宣告它的提供者會在工具結果中透過
`details.ignoredOverrides` 顯示該值，讓捨棄情況可見。

### 進階

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會回傳目前工作階段的任務；`"list"` 會檢查提供者。
</ParamField>
<ParamField path="model" type="string">提供者/模型覆寫（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可選的提供者請求逾時時間，以毫秒為單位。</ParamField>
<ParamField path="providerOptions" type="object">
  以 JSON 物件表示的提供者專屬選項（例如 `{"seed": 42, "draft": true}`）。
  宣告型別化結構描述的提供者會驗證鍵與型別；未知
  鍵或不相符會在後援期間略過該候選項。未
  宣告結構描述的提供者會原樣接收選項。執行 `video_generate action=list`
  可查看每個提供者接受的內容。
</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 會將時長正規化為
最接近的提供者支援值，並在後援提供者暴露不同
控制介面時，重新對應已轉譯的幾何提示，
例如尺寸轉長寬比。真正不支援的覆寫會盡力
忽略，並在工具結果中回報為警告。硬性能力限制
（例如參考輸入過多）會在提交前失敗。工具結果
會回報已套用的設定；`details.normalization` 會擷取任何
請求到套用之間的轉譯。
</Note>

參考輸入會選擇執行階段模式：

- 沒有參考媒體 → `generate`
- 任一圖片參考 → `imageToVideo`
- 任一影片參考 → `videoToVideo`
- 參考音訊輸入**不會**改變解析後的模式；它們會套用在
  圖片/影片參考所選模式之上，且只適用於
  宣告 `maxInputAudios` 的提供者。

混合圖片與影片參考不是穩定的共享能力介面。
建議每次請求只使用一種參考類型。

#### 後援與型別化選項

某些能力檢查會套用在後援層，而不是
工具邊界，因此超過主要提供者限制的請求
仍可在具備能力的後援上執行：

- 當請求包含音訊參考時，會略過未宣告 `maxInputAudios`（或為 `0`）
  的作用中候選項；接著嘗試下一個候選項。
- 作用中候選項的 `maxDurationSeconds` 低於請求的 `durationSeconds`，
  且未宣告 `supportedDurationSeconds` 清單 → 略過。
- 請求包含 `providerOptions`，且作用中候選項明確
  宣告型別化 `providerOptions` 結構描述 → 如果提供的鍵
  不在結構描述中，或值型別不相符，則略過。未
  宣告結構描述的提供者會原樣接收選項（向後相容
  直通）。提供者可透過
  宣告空結構描述（`capabilities.providerOptions: {}`）選擇退出所有提供者選項，
  這會造成與型別不相符相同的略過結果。

請求中的第一個略過原因會以 `warn` 記錄，讓操作人員看到
其主要提供者何時被跳過；後續略過會以 `debug` 記錄，以
讓長後援鏈保持安靜。如果每個候選項都被略過，
彙總錯誤會包含每個候選項的略過原因。

## 動作

| 動作       | 作用                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | 預設。從指定提示和可選參考輸入建立影片。                                                               |
| `status`   | 檢查目前工作階段中進行中的影片任務狀態，而不開始另一個生成。                                           |
| `list`     | 顯示可用的提供者、模型及其能力。                                                                       |

## 模型選擇

OpenClaw 會依此順序解析模型：

1. **`model` 工具參數** — 如果 agent 在呼叫中指定一個。
2. 設定中的 **`videoGenerationModel.primary`**。
3. 依序使用 **`videoGenerationModel.fallbacks`**。
4. **自動偵測** — 具備有效驗證的提供者，從
   目前預設提供者開始，接著是依字母順序排列的剩餘
   提供者。

如果提供者失敗，會自動嘗試下一個候選項。如果所有
候選項都失敗，錯誤會包含每次嘗試的詳細資料。

將 `agents.defaults.mediaGenerationAutoProviderFallback: false` 設定為只使用
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

## 提供者注意事項

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 非同步端點。參考圖片與
    影片必須是遠端 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    提供者 ID：`byteplus`。

    模型：`seedance-1-0-pro-250528`（預設）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受圖片輸入；I2V 模型和
    一般 `*-pro-*` 模型支援單一參考圖片（第一
    幀）。可依位置傳入圖片，或設定 `role: "first_frame"`。
    提供圖片時，T2V 模型 ID 會自動切換為對應的 I2V
    變體。

    支援的 `providerOptions` 鍵：`seed`（數字）、`draft`（布林值 —
    強制 480p）、`camera_fixed`（布林值）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    plugin。提供者 ID：`byteplus-seedance15`。模型：
    `seedance-1-5-pro-251215`。

    使用統一的 `content[]` API。最多支援 2 張輸入圖片
    （`first_frame` + `last_frame`）。所有輸入都必須是遠端 `https://`
    URL。請在每張圖片上設定 `role: "first_frame"` / `"last_frame"`，或
    依位置傳入圖片。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    plugin。提供者 ID：`byteplus-seedance2`。模型：
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    使用統一的 `content[]` API。最多支援 9 張參考圖片、
    3 個參考影片和 3 個參考音訊。所有輸入都必須是遠端
    `https://` URL。請在每個資產上設定 `role` — 支援的值：
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 會從輸入圖片自動偵測比例。
    `audio: true` 會對應至 `generate_audio`。`providerOptions.seed`
    （數字）會被轉送。

  </Accordion>
  <Accordion title="ComfyUI">
    由工作流程驅動的本機或雲端執行。透過設定的圖
    支援文字轉影片與圖片轉影片。
  </Accordion>
  <Accordion title="fal">
    對長時間執行的工作使用佇列支援流程。大多數 fal 影片模型
    接受單一圖片參考。Seedance 2.0 參考轉影片
    模型最多接受 9 張圖片、3 個影片和 3 個音訊參考，且
    參考檔案總數最多 12 個。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支援一張圖片或一個影片參考。
  </Accordion>
  <Accordion title="MiniMax">
    僅支援單一圖片參考。
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
    標示支援 4/6/8 秒時長、`720P`/`1080P` 解析度，以及
    `16:9`/`9:16` 長寬比。
  </Accordion>
  <Accordion title="Qwen">
    與 Alibaba 使用相同的 DashScope 後端。參考輸入必須是遠端
    `http(s)` URL；本機檔案會預先被拒絕。
  </Accordion>
  <Accordion title="Runway">
    透過資料 URI 支援本機檔案。影片轉影片需要
    `runway/gen4_aleph`。純文字執行會暴露 `16:9` 和 `9:16` 長寬
    比。
  </Accordion>
  <Accordion title="Together">
    僅支援單一圖片參考。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1` 以避免驗證遭重新導向
    丟失。`veo3` 內建為僅文字轉影片；`kling` 需要
    遠端圖片 URL。
  </Accordion>
  <Accordion title="xAI">
    支援文字轉影片、單一第一幀圖片轉影片、透過 xAI `reference_images`
    最多 7 個 `reference_image` 輸入，以及遠端
    影片編輯/延伸流程。
  </Accordion>
</AccordionGroup>

## 提供者能力模式

共享影片生成合約支援模式特定功能，
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

扁平彙總欄位（例如 `maxInputImages` 和 `maxInputVideos`）
**不足以** 用來宣告支援轉換模式。提供者應
明確宣告 `generate`、`imageToVideo` 和 `videoToVideo`，讓實際服務
測試、合約測試和共享的 `video_generate` 工具能夠以確定性方式驗證
模式支援。

當提供者中的某個模型比其他模型支援更寬鬆的參考輸入時，
請使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或
`maxInputAudiosByModel`，而不是提高整個模式的限制。

## 實際服務測試

為共享的內建提供者啟用選用的實際服務涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media video
```

這個實際服務檔案會從 `~/.profile` 載入缺少的提供者環境變數，
預設優先使用實際服務/環境 API 金鑰，而不是已儲存的驗證設定檔，
並預設執行適合發行驗證的煙霧測試：

- 掃描中每個非 FAL 提供者的 `generate`。
- 一秒鐘的龍蝦提示詞。
- 依提供者設定的操作上限來自
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（預設為 `180000`）。

FAL 是選用的，因為提供者端佇列延遲可能主導發行時間：

```bash
pnpm test:live:media video --video-providers fal
```

設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，也會執行
共享掃描能以本機媒體安全測試的已宣告轉換模式：

- 當 `capabilities.imageToVideo.enabled` 時執行 `imageToVideo`。
- 當 `capabilities.videoToVideo.enabled` 且提供者/模型在共享
  掃描中接受以緩衝區支援的本機影片輸入時執行 `videoToVideo`。

目前，共享的 `videoToVideo` 實際服務通道只會在你選擇
`runway/gen4_aleph` 時涵蓋 `runway`。

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
- [背景工作](/zh-TW/automation/tasks) — 非同步影片生成的工作追蹤
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
