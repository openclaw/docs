---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成供應商與模型
    - 瞭解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate，在 ComfyUI、fal、Google Lyria、MiniMax 與 OpenRouter 工作流程中生成音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-07-11T21:52:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具透過共用的音樂生成功能建立音樂或音訊，後端由 ComfyUI、fal、Google、MiniMax 與 OpenRouter 提供支援。

<Note>
只有在至少有一個音樂生成提供者可用時，才會顯示 `music_generate`：亦即明確設定了 `agents.defaults.musicGenerationModel`，或存在已設定驗證資訊的提供者（例如已設定 API 金鑰）。
</Note>

對於由工作階段支援的代理程式執行，`music_generate` 會以背景任務啟動、在任務帳本中追蹤進度，並在曲目準備完成後喚醒代理程式，使其能通知使用者並附上完成的音訊。完成處理代理程式會遵循工作階段的可見回覆合約：設定後自動傳送最終回覆，或在工作階段要求使用訊息工具時呼叫 `message(action="send")`。如果請求者的工作階段處於非作用中狀態或喚醒失敗，且產生的音訊仍未包含在回覆中，OpenClaw 會以冪等方式直接傳送備援訊息，其中僅包含缺少的音訊。

## 快速開始

<Tabs>
  <Tab title="共用提供者後端">
    <Steps>
      <Step title="設定驗證資訊">
        為至少一個提供者設定 API 金鑰，例如
        `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
      </Step>
      <Step title="選擇預設模型（選用）">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="向代理程式提出要求">
        _「生成一首關於夜間駕車穿梭霓虹城市、節奏明快的合成器流行樂曲。」_

        代理程式會自動呼叫 `music_generate`，不需要將工具加入允許清單。
      </Step>
    </Steps>

    若沒有由工作階段支援的代理程式執行（直接／本機情境），工具會行內執行，並在同一個工具結果中傳回最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI 工作流程">
    <Steps>
      <Step title="設定工作流程">
        使用工作流程 JSON 以及提示詞／輸出節點設定 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="雲端驗證（選用）">
        若使用 Comfy Cloud，請設定 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
      </Step>
      <Step title="呼叫工具">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

提示詞範例：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

使用 `action: "list"` 檢視可用的提供者／模型，並使用 `action: "status"` 檢視作用中的工作階段音樂任務：

```text
/tool music_generate action=list
/tool music_generate action=status
```

直接生成範例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 支援的提供者

| 提供者     | 預設模型                     | 參考輸入       | 支援的控制項                                          | 驗證                                   |
| ---------- | ---------------------------- | -------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最多 1 張圖片  | 由工作流程定義的音樂或音訊                            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 無             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 或 `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 最多 10 張圖片 | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 無             | `lyrics`, `instrumental`, `format`（僅 mp3）          | `MINIMAX_API_KEY` 或 MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 最多 1 張圖片  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax 會註冊兩個共用相同模型的提供者識別碼：使用 API 金鑰驗證的 `minimax`，以及使用 OAuth 的 `minimax-portal`。模型參照會依循驗證路徑（`minimax/music-2.6` 與 `minimax-portal/music-2.6`）；請參閱 [MiniMax](/zh-TW/providers/minimax#music-generation)。

除了預設的 MiniMax 後端模型之外，fal 也提供 `fal-ai/ace-step/prompt-to-audio`（wav、不支援歌詞、不支援純器樂切換）與 `fal-ai/stable-audio-25/text-to-audio`（wav、僅支援提示詞）。Google 的預設 `lyria-3-clip-preview` 僅輸出 mp3；`lyria-3-pro-preview` 也支援 wav。MiniMax 也提供 `music-2.6-free`、`music-cover` 與 `music-cover-free`。OpenRouter 也提供 `google/lyria-3-clip-preview`。

### 功能矩陣

`music_generate`、合約測試與共用即時掃描所使用的明確模式合約：

| 提供者     | `generate` | `edit` | 編輯限制    | 共用即時執行通道                                                          |
| ---------- | :--------: | :----: | ----------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 張圖片    | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋             |
| fal        |     ✓      |   —    | 無          | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 張圖片   | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | 無          | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 張圖片    | `generate`, `edit`                                                        |

## 工具參數

<ParamField path="prompt" type="string" required>
  音樂生成提示詞。使用 `action: "generate"` 時為必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前的工作階段任務；`"list"` 會檢視提供者。
</ParamField>
<ParamField path="model" type="string">
  覆寫提供者／模型（例如 `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當提供者支援明確的歌詞輸入時，可選填歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，要求僅輸出純器樂。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（支援的提供者最多可使用 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援時，以秒為單位指定目標時長。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時，指定輸出格式。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>

<Note>
並非所有提供者都支援全部參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當提供者支援時長，但其上限短於要求的值時，OpenClaw 會將其限制為最接近的支援時長。若所選提供者或模型無法接受確實不支援的選用提示，則會忽略這些提示並發出警告。工具結果會回報實際套用的設定；`details.normalization` 會記錄從要求值到套用值的任何對應。
</Note>

提供者請求逾時僅由操作人員設定。若已設定 `agents.defaults.musicGenerationModel.timeoutMs`，OpenClaw 會使用該值，並將低於 120000ms 的值提高至 120000ms；否則，提供者請求的預設逾時為 300000ms。

## 非同步行為

由工作階段支援的音樂生成會以背景任務執行：

- **背景任務：** `music_generate` 會建立背景任務、立即傳回已啟動／任務回應，並稍後在後續代理程式訊息中傳送完成的曲目。
- **防止重複：** 當任務處於 `queued` 或 `running` 狀態時，同一工作階段中後續的 `music_generate` 呼叫會傳回任務狀態，而不會開始另一個生成作業。使用 `action: "status"` 可明確檢查。最近 2 分鐘內完成的相符請求也會進行去重。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可檢視已排入佇列、執行中及終止狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型自行撰寫面向使用者的後續回覆。
- **提示詞提醒：** 若音樂任務已在處理中，同一工作階段中的後續使用者／手動回合會收到簡短的執行階段提示，避免模型盲目再次呼叫 `music_generate`。
- **無工作階段備援：** 沒有實際代理程式工作階段的直接／本機情境會行內執行，並在同一回合傳回最終音訊結果。

### 任務生命週期

音樂任務會呈現與一般任務登錄表相同的狀態（完整狀態機請參閱[背景任務](/zh-TW/automation/tasks#task-lifecycle)，其中包括 `timed_out`、`cancelled` 與 `lost`）。大多數音樂生成執行會經過：

| 狀態        | 意義                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| `queued`    | 任務已建立，正在等待提供者接受。                                                         |
| `running`   | 提供者正在處理（通常需 30 秒至 3 分鐘，視提供者與時長而定）。                            |
| `succeeded` | 曲目已準備完成；代理程式會被喚醒，並將曲目傳送至對話。                                   |
| `failed`    | 提供者發生錯誤或逾時；代理程式會收到錯誤詳細資訊並被喚醒。                               |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 設定

### 模型選擇

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### 提供者選擇順序

OpenClaw 會依照以下順序嘗試提供者：

1. 工具呼叫中的 `model` 參數（如果代理程式有指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用具有驗證資訊的提供者預設值進行自動偵測：
   - 如果目前的預設文字模型提供者也提供音樂生成功能，則優先使用；
   - 其餘已註冊的音樂生成提供者，依提供者識別碼的字母順序排列。

若提供者失敗，系統會自動嘗試下一個候選項目。若全部失敗，錯誤訊息會包含每次嘗試的詳細資訊。

將 `agents.defaults.mediaGenerationAutoProviderFallback: false` 設定為僅使用明確指定的 `model`、`primary` 與 `fallbacks` 項目。

## 提供者注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，並取決於已設定的圖表，以及提示詞／輸出欄位的節點對應。
    隨附的 `comfy` 外掛會透過音樂生成供應商登錄機制，
    接入共用的 `music_generate` 工具。
  </Accordion>
  <Accordion title="fal">
    透過共用的供應商驗證路徑使用 fal 模型端點。
    隨附的供應商預設使用 `fal-ai/minimax-music/v2.6`，並且也提供
    `fal-ai/ace-step/prompt-to-audio` 和
    `fal-ai/stable-audio-25/text-to-audio`，用於提示詞轉音訊請求。
    歌詞與純樂器模式僅適用於 MiniMax 模型；另外兩個
    模型僅支援提示詞。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前隨附的流程支援
    提示詞、選用的歌詞文字，以及選用的參考圖片。
    預設的 `lyria-3-clip-preview` 模型僅輸出 mp3；
    `lyria-3-pro-preview` 模型也支援 wav。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示詞、選用的
    歌詞、純樂器模式，以及透過 `minimax`
    API 金鑰驗證或 `minimax-portal` OAuth 產生 mp3 輸出。另提供 `music-2.6-free`、
    `music-cover` 和 `music-cover-free` 模型。
  </Accordion>
  <Accordion title="OpenRouter">
    使用已啟用串流的 OpenRouter 聊天補全音訊輸出。
    隨附的供應商預設使用 `google/lyria-3-pro-preview`，並且也提供
    `openrouter/google/lyria-3-clip-preview`。
  </Accordion>
</AccordionGroup>

## 選擇正確的路徑

- 當你需要模型選擇、供應商容錯移轉，以及內建的非同步任務／狀態流程時，使用**共用供應商支援路徑**。
- 當你需要自訂工作流程圖表，或需要不屬於共用隨附音樂功能的供應商時，使用**外掛路徑（ComfyUI）**。

如果你正在偵錯 ComfyUI 特有的行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用供應商的
行為，請從 [fal](/zh-TW/providers/fal)、[Google (Gemini)](/zh-TW/providers/google)、
[MiniMax](/zh-TW/providers/minimax) 或 [OpenRouter](/zh-TW/providers/openrouter) 開始。

## 供應商功能模式

共用音樂生成合約支援明確的模式宣告：

- `generate` 用於僅依提示詞生成。
- 當請求包含一張或多張參考圖片時，使用 `edit`。

新的供應商實作應優先採用明確的模式區塊：

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`、`supportsLyrics` 和
`supportsFormat` 等舊式扁平欄位，**不足以**表明支援編輯。供應商
應明確宣告 `generate` 和 `edit`，讓即時測試、合約
測試和共用的 `music_generate` 工具能以確定性方式驗證模式支援。

## 即時測試

共用隨附供應商（fal、Google、MiniMax、
OpenRouter）的選用即時測試涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

等效的儲存庫包裝指令，會執行相同的測試檔案：

```bash
pnpm test:live:media:music
```

此即時測試檔案預設會優先使用已匯出的供應商環境變數，而非儲存的驗證
設定檔；當供應商啟用編輯模式時，會同時執行 `generate` 和已宣告的 `edit`
涵蓋測試。目前的涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `fal`：僅 `generate`
- `minimax`：僅 `generate`
- `openrouter`：`generate` 加上 `edit`
- `comfy`：獨立的 Comfy 即時測試涵蓋範圍，不屬於共用供應商全面測試

隨附 ComfyUI 音樂路徑的選用即時測試涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

設定相關區段後，Comfy 即時測試檔案也會涵蓋 comfy 圖片與影片工作流程。

## 相關內容

- [背景任務](/zh-TW/automation/tasks) — 追蹤已分離執行的 `music_generate` 任務
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概觀](/zh-TW/tools)
